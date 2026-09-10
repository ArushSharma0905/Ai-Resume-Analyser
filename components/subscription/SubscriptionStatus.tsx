"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Calendar,
  Shield,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import UsageIndicator from "./UsageIndicator";
import {
  useSubscriptionStore,
  getRemaining,
} from "@/lib/subscriptions/subscription-store";
import { getPlanPricing } from "@/lib/subscriptions/config";
import { RESUME_ANALYSIS_LIMIT } from "@/lib/subscriptions/resume-quota";
import type { NavTab } from "@/components/layout/Navbar";

interface SubscriptionStatusProps {
  onSelectTab: (tab: NavTab) => void;
}

export default function SubscriptionStatus({
  onSelectTab,
}: SubscriptionStatusProps) {
  const { subscription, loading, error, refresh } = useSubscriptionStore();
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCancel = async () => {
    setCancelLoading(true);
    setCancelError(null);
    setCancelSuccess(false);

    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
      });

      if (res.ok) {
        setCancelSuccess(true);
        await refresh();
      } else {
        const json = await res.json();
        setCancelError(json.error || "Failed to cancel subscription.");
      }
    } catch {
      setCancelError("Network error while cancelling subscription.");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm text-zinc-500">
          Loading subscription details...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">
          Unable to load subscription status. Please try again.
        </p>
      </div>
    );
  }

  const sub = subscription;
  if (!sub) return null;

  const isPaidPlan = sub.planTier !== "free";
  const planName = sub.plan?.name || "Free Starter";
  const planBadge = sub.plan?.badge || "Free";

  // Billing interval comes from the authoritative server state (subscription record)
  const billingInterval = sub.billingInterval === "annual" ? "annual" : "monthly";
  const intervalLabel = billingInterval === "annual" ? "Annual" : "Monthly";
  const planLabel = isPaidPlan ? `${planName} — ${intervalLabel}` : planName;
  const priceLabel = isPaidPlan
    ? `₹${getPlanPricing(sub.planTier, billingInterval).priceInRupees.toLocaleString("en-IN")}/${billingInterval === "annual" ? "year" : "month"}`
    : "₹0/month";

  const limit = sub.limits || {
    resume_analyses: RESUME_ANALYSIS_LIMIT,
    job_matches: 5,
    resume_optimizations: 2,
  };

  // Resume analyses use the ROLLING 7-DAY quota (5 successful analyses in any
  // rolling 7-day window for FREE, unlimited for PRO/PREMIUM). Job matches and
  // resume optimizations keep the existing monthly usage system.
  const rolling = sub.resumeAnalysis;
  const analysesUsed = rolling ? rolling.currentUsage : sub.usage.resume_analyses_count;
  const analysesLimit = rolling
    ? rolling.isUnlimited
      ? -1 // existing "Unlimited" sentinel understood by UsageIndicator
      : rolling.limit
    : limit.resume_analyses;
  const analysesPeriodLabel = rolling ? "7-day rolling" : "Monthly";

  const analyses = getRemaining(analysesUsed, analysesLimit);
  const matches = getRemaining(
    sub.usage.job_matches_count,
    limit.job_matches
  );
  const optimizations = getRemaining(
    sub.usage.resume_optimizations_count,
    limit.resume_optimizations
  );

  return (
    <div className="space-y-6 py-4 max-w-4xl mx-auto">
      {/* Plan Overview Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              {isPaidPlan ? (
                <Sparkles className="w-5 h-5 text-white" />
              ) : (
                <Shield className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Current Plan: {planLabel}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isPaidPlan
                    ? "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {planBadge} · {priceLabel}
              </span>
            </div>
          </div>

          {!isPaidPlan && (
            <button
              onClick={() => onSelectTab("pricing")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Upgrade Now
            </button>
          )}
        </div>

        {/* Subscription Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="space-y-1">
            <span className="text-xs text-zinc-500 dark:text-zinc-500">
              Status
            </span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                {sub.status}
              </span>
            </div>
          </div>

          {sub.currentPeriodEnd && (
            <div className="space-y-1">
              <span className="text-xs text-zinc-500 dark:text-zinc-500">
                {sub.cancelAtPeriodEnd ? "Access ends" : "Renews on"}
              </span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Cancellation State */}
        {sub.cancelAtPeriodEnd && (
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Cancellation scheduled
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                You will continue to have full access until{" "}
                {sub.currentPeriodEnd
                  ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                  : "your billing period ends"}.
              </p>
            </div>
          </div>
        )}

        {/* Cancellation Button */}
        {isPaidPlan && !sub.cancelAtPeriodEnd && (
          <button
            onClick={handleCancel}
            disabled={cancelLoading}
            className="flex items-center gap-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors disabled:opacity-50"
          >
            <span>
              {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
            </span>
          </button>
        )}

        {cancelError && (
          <p className="text-xs text-rose-600 dark:text-rose-400">
            {cancelError}
          </p>
        )}

        {cancelSuccess && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              Subscription cancellation scheduled successfully.
            </span>
          </div>
        )}
      </div>

      {/* Usage Overview */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Usage
        </h3>

        <div className="space-y-5">
          <UsageIndicator
            label="Resume Analyses"
            used={analysesUsed}
            limit={analysesLimit}
            onUpgradeClick={() => onSelectTab("pricing")}
            showWarning={analyses.percentage >= 80}
            periodLabel={analysesPeriodLabel}
          />
          <UsageIndicator
            label="Job Matches"
            used={sub.usage.job_matches_count}
            limit={limit.job_matches}
            onUpgradeClick={() => onSelectTab("pricing")}
            showWarning={matches.percentage >= 80}
          />
          <UsageIndicator
            label="Resume Optimizations"
            used={sub.usage.resume_optimizations_count}
            limit={limit.resume_optimizations}
            onUpgradeClick={() => onSelectTab("pricing")}
            showWarning={optimizations.percentage >= 80}
          />
        </div>
      </div>

      {/* Plan Comparison Link for free users */}
      {!isPaidPlan && (
        <div className="text-center pt-4">
          <button
            onClick={() => onSelectTab("pricing")}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1.3 mx-auto"
          >
            View all plan options
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
