import { createClient } from "@/lib/supabase/server";
import {
  PLANS,
  GUEST_LIMITS,
  getBillingPeriodDays,
  type PlanTier,
  type FeatureType,
  type BillingInterval,
} from "./config";
import {
  RESUME_ANALYSIS_LIMIT,
  RESUME_ANALYSIS_WINDOW_DAYS,
} from "./resume-quota";
import type { SubscriptionRow } from "@/lib/db/types";

export interface UserUsageData {
  period_start: string;
  period_end: string;
  resume_analyses_count: number;
  job_matches_count: number;
  resume_optimizations_count: number;
}

export interface UsageCheckResult {
  allowed: boolean;
  reason?: "LIMIT_EXCEEDED" | "GUEST_LIMIT_REACHED";
  error?: string;
  planTier: PlanTier;
  limit: number;
  currentUsage: number;
  isGuest: boolean;
}

const FEATURE_NAMES: Record<FeatureType, string> = {
  resume_analyses: "Resume Analyses",
  job_matches: "AI Job Matches",
  resume_optimizations: "Resume Optimizations",
};

/**
 * Retrieves the current subscription for a user.
 * Automatically checks expiration if current_period_end has elapsed.
 */
export async function getUserSubscription(
  userId: string
): Promise<{ planTier: PlanTier; subscription: SubscriptionRow | null }> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return { planTier: "free", subscription: null };
    }

    const sub = data as SubscriptionRow;

    // Check if subscription has expired past current_period_end
    if (sub.current_period_end) {
      const expiry = new Date(sub.current_period_end);
      if (expiry < new Date() && sub.plan_tier !== "free") {
        return { planTier: "free", subscription: sub };
      }
    }

    const validTier =
      sub.plan_tier === "pro" || sub.plan_tier === "premium"
        ? sub.plan_tier
        : "free";

    return { planTier: validTier, subscription: sub };
  } catch (err) {
    console.error("Error retrieving user subscription:", err);
    return { planTier: "free", subscription: null };
  }
}

/**
 * Retrieves or initializes the current monthly usage record for a user.
 */
export async function getUserUsage(userId: string): Promise<UserUsageData> {
  const supabase = await createClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const periodStart = `${year}-${month}-01`;

  try {
    // Try to select existing month row
    const { data } = await supabase
      .from("user_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("period_start", periodStart)
      .maybeSingle();

    if (data) {
      return data as UserUsageData;
    }

    // Attempt RPC or fallback to insert
    const { data: rpcData } = await supabase.rpc("get_or_create_user_usage", {
      p_user_id: userId,
    });

    if (rpcData) {
      return rpcData as UserUsageData;
    }

    // Default fallback if table hasn't been migrated yet
    return {
      period_start: periodStart,
      period_end: `${year}-${month}-28`,
      resume_analyses_count: 0,
      job_matches_count: 0,
      resume_optimizations_count: 0,
    };
  } catch (err) {
    console.error("Error getting user usage:", err);
    return {
      period_start: periodStart,
      period_end: `${year}-${month}-28`,
      resume_analyses_count: 0,
      job_matches_count: 0,
      resume_optimizations_count: 0,
    };
  }
}

/**
 * Server-side check before executing any AI-powered action.
 */
export async function checkFeatureUsageLimit(
  userId: string | null,
  feature: FeatureType,
  guestUsageValue: number = 0
): Promise<UsageCheckResult> {
  const featureLabel = FEATURE_NAMES[feature];

  // 1. Guest Users Check
  if (!userId) {
    const guestLimit = GUEST_LIMITS[feature];
    if (guestUsageValue >= guestLimit) {
      return {
        allowed: false,
        reason: "GUEST_LIMIT_REACHED",
        error: `You've used your guest preview for ${featureLabel}. Sign up for a free account to unlock your full monthly allowance (2 analyses, 5 matches, 2 optimizations).`,
        planTier: "free",
        limit: guestLimit,
        currentUsage: guestUsageValue,
        isGuest: true,
      };
    }
    return {
      allowed: true,
      planTier: "free",
      limit: guestLimit,
      currentUsage: guestUsageValue,
      isGuest: true,
    };
  }

  // 2. Authenticated Users Check
  const { planTier } = await getUserSubscription(userId);
  const plan = PLANS[planTier] || PLANS.free;
  const limit = plan.limits[feature];

  const usage = await getUserUsage(userId);
  let currentUsage = 0;

  if (feature === "resume_analyses") {
    currentUsage = usage.resume_analyses_count;
  } else if (feature === "job_matches") {
    currentUsage = usage.job_matches_count;
  } else if (feature === "resume_optimizations") {
    currentUsage = usage.resume_optimizations_count;
  }

  if (currentUsage >= limit) {
    return {
      allowed: false,
      reason: "LIMIT_EXCEEDED",
      error: `You have reached your monthly limit of ${limit} ${featureLabel} on the ${plan.name} plan. Upgrade to Pro or Premium to unlock higher limits.`,
      planTier,
      limit,
      currentUsage,
      isGuest: false,
    };
  }

  return {
    allowed: true,
    planTier,
    limit,
    currentUsage,
    isGuest: false,
  };
}

/**
 * Atomically checks AND reserves a usage credit for the given feature.
 *
 * This replaces the previous two-step approach (checkFeatureUsageLimit read,
 * then incrementFeatureUsage write) which had a TOCTOU race: concurrent
 * requests could all pass the check and collectively exceed the plan limit.
 *
 * This function performs both the check and the increment in a single atomic
 * SQL statement via the `reserve_feature_usage` RPC: a guarded
 * UPDATE ... WHERE count < limit RETURNING, which PostgreSQL serializes with
 * row-level locking (concurrent updates re-evaluate the guard against the
 * committed row), so limits can never be exceeded.
 *
 * IMPORTANT: This must be called BEFORE the AI operation. If the AI operation
 * subsequently FAILS, the caller MUST call releaseFeatureUsage() to refund the
 * credit, so failed operations do not consume quota. The caller MUST NOT also
 * call incrementFeatureUsage separately.
 *
 * @param userId     The authenticated user's ID.
 * @param feature    Which AI feature to reserve credit for.
 * @param limit      The server-side authoritative limit (from the plan config).
  * @returns          UsageReservationResult with `granted` flag and current usage.
 */
export interface UsageReservationResult {
  granted: boolean;
  currentUsage: number;
  limit: number;
  reason?: "LIMIT_EXCEEDED" | "RESERVATION_FAILED";
  error?: string;
}

export async function reserveFeatureUsage(
  userId: string,
  feature: FeatureType,
  limit: number
): Promise<UsageReservationResult> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("reserve_feature_usage", {
      p_user_id: userId,
      p_feature: feature,
      p_limit: limit,
    });

    if (error) {
      console.error("reserve_feature_usage RPC failed:", error.message);
      return {
        granted: false,
        currentUsage: 0,
        limit,
        reason: "RESERVATION_FAILED",
        error: "Unable to verify usage quota. Please try again.",
      };
    }

    if (data && typeof data === "object" && "granted" in data) {
      const parsed = data as { granted?: boolean; current_usage?: number; error?: string };
      if (parsed.granted === false) {
        return {
          granted: false,
          currentUsage: parsed.current_usage ?? 0,
          limit,
          reason: "LIMIT_EXCEEDED",
          error: `You have reached your monthly limit of ${limit} ${FEATURE_NAMES[feature]} on this plan.`,
        };
      }
      return {
        granted: true,
        currentUsage: parsed.current_usage ?? 0,
        limit,
      };
    }

    // Unexpected response shape — fail closed.
    return {
      granted: false,
      currentUsage: 0,
      limit,
      reason: "RESERVATION_FAILED",
      error: "Unable to verify usage quota. Please try again.",
    };
  } catch (err) {
    console.error("Error reserving feature usage:", err);
    return {
      granted: false,
      currentUsage: 0,
      limit,
      reason: "RESERVATION_FAILED",
      error: "Unable to verify usage quota. Please try again.",
    };
  }
}

/**
 * Releases (refunds) a previously reserved usage credit.
 *
 * Called when the AI operation fails AFTER a successful reservation, so that
 * failed operations do not consume quota. The decrement is guarded with
 * GREATEST(count - 1, 0) so it can never push a counter negative.
 *
 * Failures to release are logged but never thrown: worst case the user keeps
 * a consumed credit (conservative — never grants extra usage).
 *
 * @returns true when the credit was successfully released.
 */
export async function releaseFeatureUsage(
  userId: string,
  feature: FeatureType
): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("release_feature_usage", {
      p_user_id: userId,
      p_feature: feature,
    });

    if (error) {
      console.error(
        `release_feature_usage failed for ${feature} (user ${userId}):`,
        error.message
      );
      return false;
    }

    if (data && typeof data === "object" && "released" in data) {
      const parsed = data as { released?: boolean };
      if (!parsed.released) {
        console.error(
          `release_feature_usage did not release a credit for ${feature} (user ${userId}).`
        );
        return false;
      }
      return true;
    }

    // Unexpected response shape — treat as not released.
    console.error(
      `release_feature_usage returned an unexpected shape for ${feature} (user ${userId}).`
    );
    return false;
  } catch (err) {
    console.error(`Error releasing feature usage for ${feature}:`, err);
    return false;
  }
}

// ===================================================================================
// ROLLING 7-DAY RESUME-ANALYSIS QUOTA (Phase 8)
//
// Dedicated functions for the resume-analysis quota. These do NOT use (and must not
// be confused with) the monthly feature quota system above, which remains intact for
// job matching and resume optimization.
//
//   FREE:        max 5 SUCCESSFUL analyses in ANY rolling 7-day window
//                (NOT calendar-week, NOT monthly — enforced by the atomic
//                `reserve_resume_analysis` PostgreSQL RPC with a per-user
//                transaction-level advisory lock, so concurrent requests can
//                never exceed the limit).
//   PRO/PREMIUM: unlimited — callers skip reservation entirely, so no free-quota
//                rows are ever created for paid plans.
//   GUESTS:      unchanged existing behavior (no server-side resume-analysis quota).
//
// Success/failure semantics: reserve BEFORE the AI call; on failure the caller MUST
// call releaseResumeAnalysis() so the slot is not consumed. A successful analysis
// simply keeps the row, which then ages out of the window after 7 days.
// ===================================================================================

export interface ResumeAnalysisReservation {
  granted: boolean;
  /** Present only when granted — pass back to releaseResumeAnalysis() on failure. */
  reservationId: string | null;
  currentUsage: number;
  limit: number;
  windowDays: number;
  /** ISO timestamp of when the next slot frees up; null when granted or unknown. */
  nextAvailableAt: string | null;
}

export interface ResumeAnalysisUsageInfo {
  currentUsage: number;
  limit: number;
  windowDays: number;
  nextAvailableAt: string | null;
}

interface ReserveResumeAnalysisRpcResult {
  granted?: boolean;
  reservation_id?: string | null;
  current_usage?: number;
  limit?: number;
  window_days?: number;
  next_available_at?: string | null;
  error?: string;
}

/**
 * Atomically reserves one rolling-7-day resume-analysis slot for a FREE user.
 * Must be called BEFORE the expensive AI operation. If the operation subsequently
 * FAILS, the caller MUST call releaseResumeAnalysis() so failed analyses never
 * consume quota. Never call this for PRO/PREMIUM users (they are unlimited and
 * must not occupy free-quota rows).
 *
 * Throws on unexpected RPC/database errors so the API layer can respond with a
 * server error instead of wrongly reporting "limit reached". Quota denials are
 * returned as `{ granted: false, ... }` without throwing.
 */
export async function reserveResumeAnalysis(
  userId: string
): Promise<ResumeAnalysisReservation> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("reserve_resume_analysis", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to reserve resume analysis quota: ${error.message}`);
  }

  const result = (
    Array.isArray(data) ? data[0] : data
  ) as ReserveResumeAnalysisRpcResult | null;

  // Invalid input from the RPC is a denial (fail closed), surfaced as an error so
  // it is never mistaken for a legitimate "limit reached" response.
  if (!result || result.error) {
    throw new Error(
      `Failed to reserve resume analysis quota: ${result?.error || "empty RPC response"}`
    );
  }

  return {
    granted: Boolean(result.granted),
    reservationId: result.reservation_id ?? null,
    currentUsage: Number(result.current_usage ?? 0),
    limit: Number(result.limit ?? RESUME_ANALYSIS_LIMIT),
    windowDays: Number(result.window_days ?? RESUME_ANALYSIS_WINDOW_DAYS),
    nextAvailableAt: result.next_available_at ?? null,
  };
}

/**
 * Releases (deletes) a resume-analysis reservation after a failed parse/AI
 * operation. Idempotent and side-effect free when the reservation no longer
 * exists. Failures are logged but never thrown — releasing must not mask the
 * original analysis error.
 */
export async function releaseResumeAnalysis(
  userId: string,
  reservationId: string
): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("release_resume_analysis", {
      p_user_id: userId,
      p_reservation_id: reservationId,
    });

    if (error) {
      console.warn("RPC release_resume_analysis failed:", error.message);
      return false;
    }

    const result = (
      Array.isArray(data) ? data[0] : data
    ) as { released?: boolean } | null;

    return Boolean(result?.released);
  } catch (err) {
    console.warn("Failed to release resume analysis reservation:", err);
    return false;
  }
}

interface GetResumeAnalysisUsageRpcResult {
  current_usage?: number;
  limit?: number;
  window_days?: number;
  next_available_at?: string | null;
  error?: string;
}

/**
 * Read-only rolling-window usage info for display (subscription status page).
 * Degrades gracefully to zeros when the RPC is not available yet (e.g. migration
 * pending). NEVER used for enforcement — enforcement is the reservation RPC.
 */
export async function getResumeAnalysisUsage(
  userId: string
): Promise<ResumeAnalysisUsageInfo> {
  const fallback: ResumeAnalysisUsageInfo = {
    currentUsage: 0,
    limit: RESUME_ANALYSIS_LIMIT,
    windowDays: RESUME_ANALYSIS_WINDOW_DAYS,
    nextAvailableAt: null,
  };

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.rpc("get_resume_analysis_usage", {
      p_user_id: userId,
    });

    if (error) {
      console.warn(
        "RPC get_resume_analysis_usage failed, using default usage info:",
        error.message
      );
      return fallback;
    }

    const result = (
      Array.isArray(data) ? data[0] : data
    ) as GetResumeAnalysisUsageRpcResult | null;

    if (!result || result.error) return fallback;

    return {
      currentUsage: Number(result.current_usage ?? 0),
      limit: Number(result.limit ?? RESUME_ANALYSIS_LIMIT),
      windowDays: Number(result.window_days ?? RESUME_ANALYSIS_WINDOW_DAYS),
      nextAvailableAt: result.next_available_at ?? null,
    };
  } catch (err) {
    console.warn("Error getting resume analysis usage:", err);
    return fallback;
  }
}

/**
 * @deprecated Use reserveFeatureUsage() instead. This function is kept for
 * backward compatibility but is no longer used on the critical path.
 * Increments usage on successful AI completion.
 */
export async function incrementFeatureUsage(
  userId: string | null,
  feature: FeatureType
): Promise<void> {
  if (!userId) return;

  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc("increment_user_usage", {
      p_user_id: userId,
      p_feature: feature,
    });

    if (error) {
      console.warn("RPC increment_user_usage failed, trying direct update:", error.message);
      // Fallback direct update
      const now = new Date();
      const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      
      const column =
        feature === "resume_analyses"
          ? "resume_analyses_count"
          : feature === "job_matches"
          ? "job_matches_count"
          : "resume_optimizations_count";

      await supabase
        .from("user_usage")
        .update({ [column]: (await getUserUsage(userId))[column as keyof UserUsageData] as number + 1 })
        .eq("user_id", userId)
        .eq("period_start", periodStart);
    }
  } catch (err) {
    console.error("Failed to increment feature usage:", err);
  }
}

/**
 * Activates or updates a user's subscription after verified payment.
 * The billing interval decides the granted access period (30 vs 365 days).
 * NOTE: usage limits remain MONTHLY regardless of the billing interval.
 */
export async function recordSubscriptionPayment(
  userId: string,
  planTier: "pro" | "premium",
  paymentId: string,
  orderId: string,
  amount: number,
  currency: string = "INR",
  billingInterval: BillingInterval = "monthly"
): Promise<boolean> {
  const supabase = await createClient();

  // Defensive: never trust an unvalidated interval
  const interval: BillingInterval = billingInterval === "annual" ? "annual" : "monthly";

  try {
    const { error: rpcError } = await supabase.rpc("apply_subscription_payment", {
      p_user_id: userId,
      p_plan_tier: planTier,
      p_provider_payment_id: paymentId,
      p_provider_subscription_id: orderId,
      p_amount: amount,
      p_currency: currency,
      p_billing_interval: interval,
    });

    if (!rpcError) {
      return true;
    }

    console.warn("RPC apply_subscription_payment failed, executing fallback upsert:", rpcError.message);

    const now = new Date();
    const periodEnd = new Date(
      now.getTime() + getBillingPeriodDays(interval) * 24 * 60 * 60 * 1000
    );

    const { error } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan_tier: planTier,
        status: "active",
        provider: "razorpay",
        provider_payment_id: paymentId,
        provider_subscription_id: orderId,
        amount,
        currency,
        billing_interval: interval,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    );

    return !error;
  } catch (err) {
    console.error("Error recording subscription payment:", err);
    return false;
  }
}

/**
 * Cancels a subscription at period end.
 */
export async function cancelSubscriptionAtPeriodEnd(
  userId: string
): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { error: rpcError } = await supabase.rpc("cancel_user_subscription", {
      p_user_id: userId,
    });

    if (!rpcError) {
      return true;
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return !error;
  } catch (err) {
    console.error("Error cancelling subscription:", err);
    return false;
  }
}
