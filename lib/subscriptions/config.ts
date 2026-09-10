export type PlanTier = "free" | "pro" | "premium";

/**
 * Explicit billing interval type. "monthly" = billed every 30 days,
 * "annual" = billed once per 365-day period (~2 months free).
 */
import {
  RESUME_ANALYSIS_LIMIT,
  RESUME_ANALYSIS_WINDOW_DAYS,
} from "./resume-quota";

export type BillingInterval = "monthly" | "annual";

export const BILLING_INTERVALS: BillingInterval[] = ["monthly", "annual"];

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "monthly" || value === "annual";
}

export type FeatureType =
  | "resume_analyses"
  | "job_matches"
  | "resume_optimizations";

export interface PlanLimits {
  resume_analyses: number;
  job_matches: number;
  resume_optimizations: number;
}

export interface PlanPricing {
  priceInRupees: number;
  priceInPaise: number;
}

export interface PlanConfig {
  id: PlanTier;
  name: string;
  badge: string;
  /** Monthly price (kept for backward compatibility). */
  priceInRupees: number;
  /** Monthly price in paise (kept for backward compatibility). */
  priceInPaise: number;
  /** Per-interval pricing. The server-side single source of truth for checkout amounts. */
  pricing: Record<BillingInterval, PlanPricing>;
  currency: string;
  description: string;
  limits: PlanLimits;
  features: string[];
  popular?: boolean;
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    id: "free",
    name: "Free Starter",
    badge: "Free",
    priceInRupees: 0,
    priceInPaise: 0,
    pricing: {
      monthly: { priceInRupees: 0, priceInPaise: 0 },
      annual: { priceInRupees: 0, priceInPaise: 0 },
    },
    currency: "INR",
    description: "Essential resume evaluation & AI job discovery.",
    limits: {
      resume_analyses: RESUME_ANALYSIS_LIMIT,
      job_matches: 5,
      resume_optimizations: 2,
    },
    features: [
      `${RESUME_ANALYSIS_LIMIT} Resume Analyses / rolling ${RESUME_ANALYSIS_WINDOW_DAYS} days`,
      "5 AI Job Matches / month",
      "2 Resume Optimizations / month",
      "0–100 ATS Scorecard & Diagnostics",
      "Live Job Search with Filters",
      "Standard Gemini Processing",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro Career",
    badge: "Most Popular",
    priceInRupees: 199,
    priceInPaise: 19900,
    pricing: {
      monthly: { priceInRupees: 199, priceInPaise: 19900 },
      annual: { priceInRupees: 1990, priceInPaise: 199000 },
    },
    currency: "INR",
    description: "Advanced ATS diagnostics & full resume optimization.",
    popular: true,
    limits: {
      // Unlimited for paid plans: the rolling free quota does not apply and the
      // API layer never reserves a free slot for PRO/PREMIUM users. -1 is the
      // existing "Unlimited" sentinel understood by UsageIndicator/getRemaining.
      resume_analyses: -1,
      job_matches: 100,
      resume_optimizations: 20,
    },
    features: [
      "Everything in Free, plus:",
      "Unlimited Resume Analyses",
      "100 AI Job Matches / month",
      "20 Grounded Resume Optimizations / month",
      "Original vs Suggested Bullet Rewrites",
      "Grounded Keyword Alignment",
      "Priority Gemini Processing",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium Executive",
    badge: "Best Value",
    priceInRupees: 399,
    priceInPaise: 39900,
    pricing: {
      monthly: { priceInRupees: 399, priceInPaise: 39900 },
      annual: { priceInRupees: 3990, priceInPaise: 399000 },
    },
    currency: "INR",
    description: "Maximum bandwidth for active job searchers.",
    limits: {
      // Unlimited — see the comment on the Pro plan limits.
      resume_analyses: -1,
      job_matches: 300,
      resume_optimizations: 50,
    },
    features: [
      "Everything in Pro, plus:",
      "Unlimited Resume Analyses",
      "300 AI Job Matches / month",
      "50 Grounded Resume Optimizations / month",
      "Multi-Resume Version Management",
      "Saved Jobs Management Pipeline",
      "VIP Support Priority",
    ],
  },
};

/**
 * Guest trial limit (for unauthenticated visitors to test the product on landing page)
 */
export const GUEST_LIMITS: PlanLimits = {
  resume_analyses: 1,
  job_matches: 2,
  resume_optimizations: 1,
};

/**
 * Single source of truth for a plan's price given a billing interval.
 * Used by server-side checkout endpoints — NEVER trust a price from the browser.
 */
export function getPlanPricing(
  planTier: PlanTier,
  interval: BillingInterval
): PlanPricing {
  const plan = PLANS[planTier];
  return plan.pricing[interval];
}

/** Annual savings vs paying monthly for 12 months, in percent (rounded). */
export function getAnnualSavingsPercent(planTier: PlanTier): number {
  const plan = PLANS[planTier];
  const monthlyTotal = plan.pricing.monthly.priceInPaise * 12;
  const annual = plan.pricing.annual.priceInPaise;
  if (monthlyTotal <= 0) return 0;
  return Math.round(((monthlyTotal - annual) / monthlyTotal) * 100);
}

/** Safe server-side billing period duration for a given interval. */
export function getBillingPeriodDays(interval: BillingInterval): number {
  return interval === "annual" ? 365 : 30;
}
