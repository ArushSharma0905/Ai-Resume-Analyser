/**
 * Pure unit tests for the rolling 7-day resume-analysis quota window semantics.
 *
 * These pin the SAME decision the `reserve_resume_analysis` RPC enforces in
 * PostgreSQL (supabase/migrations/05_rolling_resume_analysis_quota.sql):
 *   - max 5 successful analyses in ANY rolling 7-day window
 *   - NOT calendar-week, NOT monthly
 *   - a slot frees up exactly when the oldest successful analysis becomes
 *     older than 7 days
 *
 * Run: npm test  (node --test)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  RESUME_ANALYSIS_LIMIT,
  RESUME_ANALYSIS_WINDOW_DAYS,
  evaluateResumeQuota,
  computeNextAvailableAt,
  getWindowCutoff,
} from "../lib/subscriptions/resume-quota.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
// Fixed "now" so the tests are deterministic.
const NOW = new Date("2026-01-15T12:00:00.000Z");
const daysAgo = (n) => new Date(NOW.getTime() - n * DAY_MS);
const daysFromNow = (n) => new Date(NOW.getTime() + n * DAY_MS);

test("constants: free quota is 5 analyses per rolling 7-day window", () => {
  assert.equal(RESUME_ANALYSIS_LIMIT, 5);
  assert.equal(RESUME_ANALYSIS_WINDOW_DAYS, 7);
});

// TEST 1: fresh FREE user (0/5) -> allowed
test("T1: fresh user with no usage is granted (0/5)", () => {
  const decision = evaluateResumeQuota([], NOW);
  assert.equal(decision.granted, true);
  assert.equal(decision.currentUsage, 0);
  assert.equal(decision.limit, 5);
  assert.equal(decision.windowDays, 7);
  assert.equal(decision.nextAvailableAt, null);
});

// TEST 2: 4 successful analyses within 7 days (4/5) -> allowed
test("T2: user with 4 usages inside the window is granted (4/5)", () => {
  const usage = [daysAgo(1), daysAgo(2), daysAgo(3), daysAgo(4)];
  const decision = evaluateResumeQuota(usage, NOW);
  assert.equal(decision.granted, true);
  assert.equal(decision.currentUsage, 4);
  assert.equal(decision.nextAvailableAt, null);
});

// TEST 3: 5 successful analyses within 7 days (5/5) -> denied + next_available_at
test("T3: user with 5 usages inside the window is denied (5/5)", () => {
  const usage = [daysAgo(1), daysAgo(2), daysAgo(3), daysAgo(4), daysAgo(5)];
  const decision = evaluateResumeQuota(usage, NOW);
  assert.equal(decision.granted, false);
  assert.equal(decision.currentUsage, 5);
  assert.equal(decision.limit, 5);
  // Next slot = the moment the OLDEST usage leaves the window.
  assert.ok(decision.nextAvailableAt instanceof Date);
  assert.equal(decision.nextAvailableAt.getTime(), daysAgo(5).getTime() + 7 * DAY_MS);
});

// TEST 4: 5 analyses, oldest older than 7 days -> a slot is available again
test("T4: oldest usage older than 7 days frees a slot", () => {
  const usage = [daysAgo(8), daysAgo(1), daysAgo(2), daysAgo(3), daysAgo(4)];
  const decision = evaluateResumeQuota(usage, NOW);
  assert.equal(decision.granted, true);
  assert.equal(decision.currentUsage, 4);
  assert.equal(decision.nextAvailableAt, null);
});

// TEST 5: 5 analyses, ALL still inside the window -> still denied
test("T5: all 5 usages still inside the window stay denied", () => {
  const usage = [
    daysAgo(0.1),
    daysAgo(0.2),
    daysAgo(0.3),
    daysAgo(0.4),
    daysAgo(0.5),
  ];
  const decision = evaluateResumeQuota(usage, NOW);
  assert.equal(decision.granted, false);
  assert.equal(decision.currentUsage, 5);
});

test("boundary: a usage exactly 7 days old has left the window (strict >)", () => {
  const usage = [daysAgo(7), daysAgo(1), daysAgo(2), daysAgo(3), daysAgo(4)];
  const decision = evaluateResumeQuota(usage, NOW);
  assert.equal(decision.currentUsage, 4);
  assert.equal(decision.granted, true);
});

test("boundary: a usage slightly younger than 7 days is still counted", () => {
  const usage = [
    daysAgo(6.999),
    daysAgo(1),
    daysAgo(2),
    daysAgo(3),
    daysAgo(4),
  ];
  const decision = evaluateResumeQuota(usage, NOW);
  assert.equal(decision.currentUsage, 5);
  assert.equal(decision.granted, false);
});

test("next slot time is computed from the oldest active usage", () => {
  const usage = [
    daysAgo(6.5),
    daysAgo(1),
    daysAgo(2),
    daysAgo(3),
    daysAgo(4),
  ];
  const next = computeNextAvailableAt(usage, NOW);
  // oldest is 6.5 days old -> frees up in 0.5 days
  assert.equal(next.getTime(), daysFromNow(0.5).getTime());
});

test("next slot is null when under the limit", () => {
  const next = computeNextAvailableAt([daysAgo(1), daysAgo(2)], NOW);
  assert.equal(next, null);
});

test("decision is independent of the order of usage timestamps", () => {
  const a = evaluateResumeQuota([daysAgo(1), daysAgo(2), daysAgo(3), daysAgo(4), daysAgo(5)], NOW);
  const b = evaluateResumeQuota([daysAgo(5), daysAgo(1), daysAgo(3), daysAgo(2), daysAgo(4)], NOW);
  assert.deepEqual(a, b);
});

test("window cutoff is exactly now minus 7 days", () => {
  assert.equal(getWindowCutoff(NOW).getTime(), daysAgo(7).getTime());
});
