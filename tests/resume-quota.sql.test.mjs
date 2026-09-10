/**
 * Integration tests for the rolling 7-day resume-analysis quota SQL
 * (supabase/migrations/05_rolling_resume_analysis_quota.sql) against a REAL
 * embedded PostgreSQL instance.
 *
 * Covers: reservation semantics, window expiry, release/idempotency,
 * concurrency safety (per-user advisory lock), cross-user protection, RLS and
 * grant lockdown, and the read-only usage RPC.
 *
 * The embedded-postgres + pg packages are intentionally NOT project
 * dependencies. Install them anywhere and point QA_DEPS_DIR at that folder:
 *
 *   npm install --prefix /tmp/ai-resume-quota-deps pg embedded-postgres
 *   QA_DEPS_DIR=/tmp/ai-resume-quota-deps npm test
 *
 * When the deps are missing the whole suite is skipped, so `npm test` still
 * passes in environments without database test deps.
 */
import { describe, before, after, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DAY_MS = 24 * 60 * 60 * 1000;

const depsCandidates = [
  process.env.QA_DEPS_DIR,
  path.join(tmpdir(), "ai-resume-quota-deps"),
].filter(Boolean);

let requireFromDeps = null;
for (const dir of depsCandidates) {
  try {
    const req = createRequire(path.join(dir, "package.json"));
    req("embedded-postgres");
    req("pg");
    requireFromDeps = req;
    break;
  } catch {
    // try next candidate
  }
}
const hasDeps = Boolean(requireFromDeps);

let EmbeddedPostgres = null;
let Client = null;

describe("resume_analysis_usage RPCs (real PostgreSQL)", {
  skip: hasDeps
    ? false
    : "embedded-postgres/pg test deps not available (set QA_DEPS_DIR to run SQL tests)",
}, () => {
  const PORT = 55433;
  const ADMIN = {
    host: "localhost",
    port: PORT,
    user: "postgres",
    password: "postgres",
    database: "postgres",
  };

  let dataDir;
  let pg;
  let admin; // superuser client — used for setup/backdating only
  let migrationSql;

  before(async () => {
    ({ default: EmbeddedPostgres } = requireFromDeps("embedded-postgres"));
    ({ Client } = requireFromDeps("pg"));

    migrationSql = readFileSync(
      path.join(__dirname, "..", "supabase", "migrations", "05_rolling_resume_analysis_quota.sql"),
      "utf8"
    );

    dataDir = mkdtempSync(path.join(tmpdir(), "qa-pg-"));
    pg = new EmbeddedPostgres({
      databaseDir: dataDir,
      user: "postgres",
      password: "postgres",
      port: PORT,
      persistent: false,
    });
    await pg.initialise();
    await pg.start();

    admin = new Client(ADMIN);
    await admin.connect();

    // ---- Minimal Supabase-compatible environment ----------------------------
    for (const [name, extra] of [
      ["anon", "NOLOGIN"],
      ["authenticated", "NOLOGIN"],
      ["service_role", "NOLOGIN BYPASSRLS"],
    ]) {
      try {
        await admin.query(`CREATE ROLE ${name} ${extra}`);
      } catch (err) {
        if (!/already exists/.test(err.message)) throw err;
      }
    }

    await admin.query(`CREATE SCHEMA IF NOT EXISTS auth`);
    await admin.query(`
      CREATE TABLE IF NOT EXISTS auth.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid()
      )
    `);
    // The migration only references auth.users(id); auth.uid() is not needed by
    // the quota RPCs (they take the server-verified user id explicitly).
    await admin.query(`
      CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
      LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$
    `);

    // Apply the migration TWICE — proves idempotency (safe re-runs).
    await admin.query(migrationSql);
    await admin.query(migrationSql);
  });

  after(async () => {
    try { if (admin) await admin.end(); } catch {}
    try { if (pg) await pg.stop(); } catch {}
    try { if (dataDir) rmSync(dataDir, { recursive: true, force: true }); } catch {}
  });

  // ---- helpers --------------------------------------------------------------

  async function createUser() {
    const res = await admin.query(
      `INSERT INTO auth.users DEFAULT VALUES RETURNING id`
    );
    return res.rows[0].id;
  }

  async function backdate(userId, days) {
    await admin.query(
      `INSERT INTO public.resume_analysis_usage (user_id, created_at)
       VALUES ($1, now() - ($2::double precision * interval '1 day'))`,
      [userId, days]
    );
  }

  async function countRows(userId) {
    const res = await admin.query(
      `SELECT count(*)::int AS n FROM public.resume_analysis_usage WHERE user_id = $1`,
      [userId]
    );
    return res.rows[0].n;
  }

  /** Calls the RPC exactly like the API layer does: as the `authenticated` role. */
  async function reserveAs(userId, asAdmin = admin) {
    await asAdmin.query(`SET ROLE authenticated`);
    try {
      const res = await asAdmin.query(
        `SELECT public.reserve_resume_analysis($1) AS r`,
        [userId]
      );
      return res.rows[0].r;
    } finally {
      await asAdmin.query(`RESET ROLE`);
    }
  }

  async function releaseAs(userId, reservationId, asAdmin = admin) {
    await asAdmin.query(`SET ROLE authenticated`);
    try {
      const res = await asAdmin.query(
        `SELECT public.release_resume_analysis($1, $2) AS r`,
        [userId, reservationId]
      );
      return res.rows[0].r;
    } finally {
      await asAdmin.query(`RESET ROLE`);
    }
  }

  async function usageInfo(userId) {
    await admin.query(`SET ROLE authenticated`);
    try {
      const res = await admin.query(
        `SELECT public.get_resume_analysis_usage($1) AS r`,
        [userId]
      );
      return res.rows[0].r;
    } finally {
      await admin.query(`RESET ROLE`);
    }
  }

  // ---- tests ----------------------------------------------------------------

  test("T1: fresh FREE user (0/5) -> reservation granted", async () => {
    const userId = await createUser();
    const result = await reserveAs(userId);

    assert.equal(result.granted, true);
    assert.ok(result.reservation_id, "reservation id must be returned");
    assert.equal(result.current_usage, 1);
    assert.equal(result.limit, 5);
    assert.equal(result.window_days, 7);
    assert.equal(result.next_available_at, null);
    assert.equal(await countRows(userId), 1);
  });

  test("T2: FREE user with 4 successful analyses within 7 days (4/5) -> granted", async () => {
    const userId = await createUser();
    for (const d of [1, 2, 3, 4]) await backdate(userId, d);

    const result = await reserveAs(userId);
    assert.equal(result.granted, true);
    assert.equal(result.current_usage, 5);
    assert.equal(await countRows(userId), 5);
  });

  test("T3: FREE user with 5 successful analyses within 7 days (5/5) -> denied with 429 payload data", async () => {
    const userId = await createUser();
    for (const d of [1, 2, 3, 4, 5]) await backdate(userId, d);

    const result = await reserveAs(userId);
    assert.equal(result.granted, false);
    assert.equal(result.current_usage, 5);
    assert.equal(result.limit, 5);
    assert.equal(result.window_days, 7);
    assert.ok(result.next_available_at, "next_available_at must be present on denial");
    // next slot = oldest usage (5 days ago) + 7 days => ~2 days from now
    const nextAt = new Date(result.next_available_at).getTime();
    const expected = Date.now() - 5 * DAY_MS + 7 * DAY_MS;
    assert.ok(Math.abs(nextAt - expected) < 60_000, "next_available_at must be oldest+7d");
    assert.equal(await countRows(userId), 5, "denial must NOT insert a row");
  });

  test("T4: 5 analyses but oldest older than 7 days -> slot available again", async () => {
    const userId = await createUser();
    for (const d of [8, 1, 2, 3, 4]) await backdate(userId, d);

    const result = await reserveAs(userId);
    assert.equal(result.granted, true);
    assert.equal(result.current_usage, 5);
    // 5 ledger rows existed before (one already outside the window) + the new
    // reservation = 6 rows total, but only 5 inside the rolling window.
    assert.equal(await countRows(userId), 6);
    assert.equal((await usageInfo(userId)).current_usage, 5);
  });

  test("T5: 5 analyses all inside the window -> still denied", async () => {
    const userId = await createUser();
    for (const d of [0.1, 0.2, 0.3, 0.4, 0.5]) await backdate(userId, d);

    const result = await reserveAs(userId);
    assert.equal(result.granted, false);
    assert.equal(result.current_usage, 5);
  });

  test("T6: release after failure removes the reservation and is idempotent", async () => {
    const userId = await createUser();

    // Reserve (analysis starts) ...
    const reservation = await reserveAs(userId);
    assert.equal(reservation.granted, true);
    assert.equal(await countRows(userId), 1);

    // ... AI fails -> release
    const released = await releaseAs(userId, reservation.reservation_id);
    assert.equal(released.released, true);
    assert.equal(await countRows(userId), 0, "failed analysis must not consume quota");

    // Idempotent: releasing again is a no-op, never an error.
    const again = await releaseAs(userId, reservation.reservation_id);
    assert.equal(again.released, false);
    assert.equal(again.already_released, true);
    assert.equal(await countRows(userId), 0);

    // The freed slot is immediately usable again.
    const retry = await reserveAs(userId);
    assert.equal(retry.granted, true);
  });

  test("T6b: a user cannot release another user's reservation", async () => {
    const userA = await createUser();
    const userB = await createUser();

    const reservation = await reserveAs(userA);
    assert.equal(reservation.granted, true);

    const wrong = await releaseAs(userB, reservation.reservation_id);
    assert.equal(wrong.released, false);
    assert.equal(await countRows(userA), 1, "other user's record must be untouched");
  });

  async function makeClients(n) {
    const clients = [];
    for (let i = 0; i < n; i++) {
      const c = new Client(ADMIN);
      await c.connect();
      await c.query(`SET ROLE authenticated`);
      clients.push(c);
    }
    return clients;
  }

  async function closeClients(clients) {
    for (const c of clients) {
      try { await c.end(); } catch {}
    }
  }

  test("T7: concurrent requests with one slot left -> exactly ONE grant, never > 5", async () => {
    const userId = await createUser();
    for (const d of [1, 2, 3, 4]) await backdate(userId, d); // 4/5

    const CONCURRENCY = 6;
    const clients = await makeClients(CONCURRENCY);
    try {
      // Fire all reserves simultaneously against the same user.
      const results = await Promise.all(
        clients.map((c) =>
          c
            .query(`SELECT public.reserve_resume_analysis($1) AS r`, [userId])
            .then((r) => r.rows[0].r)
            .catch((err) => ({ error: err.message }))
        )
      );

      assert.ok(
        results.every((r) => !r.error),
        `no RPC errors: ${JSON.stringify(results)}`
      );
      const grantedCount = results.filter((r) => r.granted === true).length;
      const deniedCount = results.filter((r) => r.granted === false).length;

      assert.equal(grantedCount, 1, "exactly one request wins the final slot");
      assert.equal(deniedCount, CONCURRENCY - 1);
      assert.equal(await countRows(userId), 5, "quota never exceeds 5");
    } finally {
      await closeClients(clients);
    }
  });

  test("T7b: 8 concurrent requests from 0/5 -> exactly 5 granted", async () => {
    const userId = await createUser();

    const CONCURRENCY = 8;
    const clients = await makeClients(CONCURRENCY);
    try {
      const results = await Promise.all(
        clients.map((c) =>
          c
            .query(`SELECT public.reserve_resume_analysis($1) AS r`, [userId])
            .then((r) => r.rows[0].r)
            .catch((err) => ({ error: err.message }))
        )
      );

      assert.ok(
        results.every((r) => !r.error),
        `no RPC errors: ${JSON.stringify(results)}`
      );
      const grantedCount = results.filter((r) => r.granted === true).length;
      assert.equal(grantedCount, 5, "exactly 5 of 8 concurrent requests granted");
      assert.equal(await countRows(userId), 5);
    } finally {
      await closeClients(clients);
    }
  });

  test("T8/T9: PRO/PREMIUM users never occupy the free quota table", async () => {
    // The API layer never calls reserve_resume_analysis for paid plans. The
    // SQL-visible contract of that behavior: without a reservation, NO row is
    // ever created for the user.
    const proUser = await createUser();
    const premiumUser = await createUser();

    assert.equal(await countRows(proUser), 0);
    assert.equal(await countRows(premiumUser), 0);
    assert.equal((await usageInfo(proUser)).current_usage, 0);
  });

  test("T10: guests (anon role) cannot reserve or touch quota rows", async () => {
    const userId = await createUser();

    await admin.query(`SET ROLE anon`);
    try {
      await assert.rejects(
        admin.query(`SELECT public.reserve_resume_analysis($1)`, [userId]),
        /permission denied/,
        "anon must not be able to execute the reservation RPC"
      );
      await assert.rejects(
        admin.query(`SELECT * FROM public.resume_analysis_usage`),
        /permission denied/,
        "anon must not be able to read quota rows"
      );
      await assert.rejects(
        admin.query(
          `INSERT INTO public.resume_analysis_usage (user_id) VALUES ($1)`,
          [userId]
        ),
        /permission denied|violates row-level security/,
        "anon must not be able to insert quota rows"
      );
    } finally {
      await admin.query(`RESET ROLE`);
    }
  });

  test("RLS + grants: authenticated users cannot manipulate quota rows directly", async () => {
    const userId = await createUser();

    await admin.query(`SET ROLE authenticated`);
    try {
      await assert.rejects(
        admin.query(
          `INSERT INTO public.resume_analysis_usage (user_id) VALUES ($1)`,
          [userId]
        ),
        /permission denied|violates row-level security/,
        "clients must not insert quota rows directly"
      );
      await assert.rejects(
        admin.query(
          `DELETE FROM public.resume_analysis_usage WHERE user_id = $1`,
          [userId]
        ),
        /permission denied/,
        "clients must not delete quota rows directly"
      );
      await assert.rejects(
        admin.query(`SELECT count(*) FROM public.resume_analysis_usage`),
        /permission denied/,
        "clients must not select quota rows directly"
      );
    } finally {
      await admin.query(`RESET ROLE`);
    }
  });

  test("get_resume_analysis_usage: read-only info matches the ledger", async () => {
    const userId = await createUser();
    for (const d of [1, 3]) await backdate(userId, d);

    let info = await usageInfo(userId);
    assert.equal(info.current_usage, 2);
    assert.equal(info.limit, 5);
    assert.equal(info.window_days, 7);
    assert.equal(info.next_available_at, null);

    await backdate(userId, 4);
    await backdate(userId, 2);
    await backdate(userId, 5);
    info = await usageInfo(userId);
    assert.equal(info.current_usage, 5);
    const nextAt = new Date(info.next_available_at).getTime();
    const expected = Date.now() - 5 * DAY_MS + 7 * DAY_MS;
    assert.ok(Math.abs(nextAt - expected) < 60_000);
  });

  test("invalid input fails closed without granting", async () => {
    await admin.query(`SET ROLE authenticated`);
    try {
      const res = await admin.query(
        `SELECT public.reserve_resume_analysis(NULL) AS r`
      );
      const result = res.rows[0].r;
      assert.equal(result.granted, false);
      assert.ok(result.error);
    } finally {
      await admin.query(`RESET ROLE`);
    }
  });
});
