import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getResumeAnalysisUsage,
  getUserSubscription,
  getUserUsage,
} from "@/lib/subscriptions/service";
import { PLANS } from "@/lib/subscriptions/config";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          isAuthenticated: false,
          planTier: "free",
          status: "active",
          billingInterval: "monthly",
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          plan: PLANS.free,
          usage: {
            resume_analyses_count: 0,
            job_matches_count: 0,
            resume_optimizations_count: 0,
          },
          limits: PLANS.free.limits,
        },
      });
    }

    const { planTier, subscription } = await getUserSubscription(user.id);
    const usage = await getUserUsage(user.id);
    const plan = PLANS[planTier] || PLANS.free;
    const billingInterval =
      subscription?.billing_interval === "annual" ? "annual" : "monthly";

    // Rolling 7-day resume-analysis usage (display only). PRO/PREMIUM are
    // unlimited and never consume the free rolling quota.
    const rollingUsage = await getResumeAnalysisUsage(user.id);

    return NextResponse.json({
      success: true,
      data: {
        isAuthenticated: true,
        planTier,
        status: subscription?.status || "active",
        billingInterval,
        currentPeriodEnd: subscription?.current_period_end || null,
        cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
        plan,
        usage,
        limits: plan.limits,
        resumeAnalysis: {
          currentUsage: rollingUsage.currentUsage,
          limit: rollingUsage.limit,
          windowDays: rollingUsage.windowDays,
          nextAvailableAt: rollingUsage.nextAvailableAt,
          isUnlimited: planTier !== "free",
        },
      },
    });
  } catch (err: unknown) {
    console.error("Error fetching subscription status:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch subscription status." },
      { status: 500 }
    );
  }
}
