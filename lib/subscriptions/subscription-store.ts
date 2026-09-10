"use client";

import { useSyncExternalStore } from "react";
import { PLANS, type PlanTier } from "./config";

export interface UsageData {
  resume_analyses_count: number;
  job_matches_count: number;
  resume_optimizations_count: number;
  period_start: string;
  period_end: string;
}

export interface ResumeAnalysisRollingUsage {
  currentUsage: number;
  limit: number;
  windowDays: number;
  nextAvailableAt: string | null;
  isUnlimited: boolean;
}

export interface SubscriptionData {
  isAuthenticated: boolean;
  planTier: PlanTier;
  status: string;
  billingInterval: "monthly" | "annual";
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  plan: (typeof PLANS)[keyof typeof PLANS];
  usage: UsageData;
  limits: {
    resume_analyses: number;
    job_matches: number;
    resume_optimizations: number;
  };
  /**
   * Rolling 7-day resume-analysis usage. Present for authenticated users
   * (optional for backward compatibility with cached payloads).
   */
  resumeAnalysis?: ResumeAnalysisRollingUsage | null;
}

// ---------------------------------------------------------------------------
// Minimal external store using React's useSyncExternalStore (no new deps)
// ---------------------------------------------------------------------------

let subscription: SubscriptionData | null = null;
let loading = false;
let error: string | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSubscriptionSnapshot(): SubscriptionData | null {
  return subscription;
}

function getSubscriptionServerSnapshot(): SubscriptionData | null {
  return null;
}

function getLoadingSnapshot(): boolean {
  return loading;
}

function getLoadingServerSnapshot(): boolean {
  return false;
}

function getErrorSnapshot(): string | null {
  return error;
}

function getErrorServerSnapshot(): string | null {
  return null;
}

/**
 * Fetch subscription status from the server and publish to subscribers.
 */
async function refreshSubscription(): Promise<void> {
  loading = true;
  error = null;
  emit();

  try {
    const res = await fetch("/api/subscription/status", {
      method: "GET",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch subscription status");
    }
    const json = await res.json();
    subscription = json.data;
    loading = false;
    error = null;
    emit();
  } catch (err) {
    loading = false;
    error = err instanceof Error ? err.message : "Unknown error";
    emit();
  }
}

export function useSubscriptionStore(): {
  subscription: SubscriptionData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setSubscription: (data: SubscriptionData | null) => void;
} {
  const current = useSyncExternalStore(
    subscribe,
    getSubscriptionSnapshot,
    getSubscriptionServerSnapshot
  );
  const currentLoading = useSyncExternalStore(
    subscribe,
    getLoadingSnapshot,
    getLoadingServerSnapshot
  );
  const currentError = useSyncExternalStore(
    subscribe,
    getErrorSnapshot,
    getErrorServerSnapshot
  );

  return {
    subscription: current,
    loading: currentLoading,
    error: currentError,
    refresh: refreshSubscription,
    setSubscription: (data: SubscriptionData | null) => {
      subscription = data;
      emit();
    },
  };
}

// Helper function to calculate remaining usage
export function getRemaining(
  used: number,
  limit: number
): { remaining: number; percentage: number } {
  const remaining = Math.max(0, limit - used);
  const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;
  return { remaining, percentage };
}

// Helper to format usage label
export function getUsageLabel(
  feature: "resume_analyses" | "job_matches" | "resume_optimizations"
): string {
  const labels: Record<typeof feature, string> = {
    resume_analyses: "Resume Analyses",
    job_matches: "Job Matches",
    resume_optimizations: "Resume Optimizations",
  };
  return labels[feature];
}