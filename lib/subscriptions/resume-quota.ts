/**
 * Rolling 7-day resume-analysis quota — shared constants and pure window math.
 *
 * IMPORTANT ARCHITECTURE NOTE:
 * The authoritative ENFORCEMENT for this quota lives in the PostgreSQL RPC
 * `reserve_resume_analysis` (see supabase/migrations/05_rolling_resume_analysis_quota.sql),
 * which is atomic and concurrency-safe via a per-user transaction-level advisory lock.
 * This module is a pure decision mirror used for:
 *   - the shared constants referenced by the API layer and UI copy,
 *   - read-only usage display (fallback when the RPC is unavailable),
 *   - unit tests (tests/resume-quota.test.ts) that pin the window semantics.
 * It is NEVER used as an enforcement path and never issues writes.
 *
 * Semantics: a free user may have at most RESUME_ANALYSIS_LIMIT successful
 * resume analyses inside ANY rolling RESUME_ANALYSIS_WINDOW_DAYS-day window.
 * This is NOT a calendar-week/monthly quota: a slot frees up exactly when the
 * oldest successful analysis becomes older than the window (strictly more than
 * `windowDays` days ago).
 */

export const RESUME_ANALYSIS_LIMIT = 5;
export const RESUME_ANALYSIS_WINDOW_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The instant a usage record leaves the rolling window. */
export function getWindowCutoff(
  now: Date,
  windowDays: number = RESUME_ANALYSIS_WINDOW_DAYS
): Date {
  return new Date(now.getTime() - windowDays * DAY_MS);
}

/** Usages still inside the rolling window, oldest first. */
export function getActiveUsages(
  usageCreatedAts: readonly Date[],
  now: Date,
  windowDays: number = RESUME_ANALYSIS_WINDOW_DAYS
): Date[] {
  const cutoff = getWindowCutoff(now, windowDays).getTime();
  return usageCreatedAts
    .filter((d) => d.getTime() > cutoff)
    .sort((a, b) => a.getTime() - b.getTime());
}

/**
 * When the next slot frees up for a user at the limit: the moment the oldest
 * active usage leaves the window. Returns null when under the limit (a slot is
 * already available) or when it cannot be determined reliably.
 */
export function computeNextAvailableAt(
  usageCreatedAts: readonly Date[],
  now: Date,
  limit: number = RESUME_ANALYSIS_LIMIT,
  windowDays: number = RESUME_ANALYSIS_WINDOW_DAYS
): Date | null {
  const active = getActiveUsages(usageCreatedAts, now, windowDays);
  if (active.length < limit || active.length === 0) return null;
  return new Date(active[0].getTime() + windowDays * DAY_MS);
}

export interface ResumeQuotaDecision {
  granted: boolean;
  currentUsage: number;
  limit: number;
  windowDays: number;
  nextAvailableAt: Date | null;
}

/**
 * Pure mirror of the `reserve_resume_analysis` RPC decision, WITHOUT the insert.
 * Used only for read-only display and tests — never for enforcement.
 */
export function evaluateResumeQuota(
  usageCreatedAts: readonly Date[],
  now: Date = new Date(),
  limit: number = RESUME_ANALYSIS_LIMIT,
  windowDays: number = RESUME_ANALYSIS_WINDOW_DAYS
): ResumeQuotaDecision {
  const active = getActiveUsages(usageCreatedAts, now, windowDays);
  const currentUsage = active.length;

  if (currentUsage >= limit) {
    return {
      granted: false,
      currentUsage,
      limit,
      windowDays,
      nextAvailableAt: computeNextAvailableAt(usageCreatedAts, now, limit, windowDays),
    };
  }

  return { granted: true, currentUsage, limit, windowDays, nextAvailableAt: null };
}
