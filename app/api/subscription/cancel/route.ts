import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayClient } from "@/lib/razorpay/client";
import { cancelSubscriptionAtPeriodEnd, getUserSubscription } from "@/lib/subscriptions/service";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { subscription } = await getUserSubscription(user.id);

    if (!subscription || subscription.plan_tier === "free") {
      return NextResponse.json(
        { success: false, error: "No active paid subscription found to cancel." },
        { status: 400 }
      );
    }

    // If subscription is linked to a Razorpay subscription ID (sub_...), attempt provider cancellation
    const razorpay = getRazorpayClient();
    if (razorpay && subscription.provider_subscription_id?.startsWith("sub_")) {
      try {
        await razorpay.subscriptions.cancel(
          subscription.provider_subscription_id,
          true // cancel_at_cycle_end
        );
      } catch (providerErr) {
        console.warn("Could not cancel on Razorpay provider API:", providerErr);
      }
    }

    // Set cancel_at_period_end = true in database, preserving access until current_period_end
    const success = await cancelSubscriptionAtPeriodEnd(user.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to update cancellation in database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: subscription.current_period_end,
        message: `Your subscription has been scheduled for cancellation. You will retain access to your plan until ${
          subscription.current_period_end
            ? new Date(subscription.current_period_end).toLocaleDateString()
            : "the end of your billing period"
        }.`,
      },
    });
  } catch (err: unknown) {
    console.error("Error cancelling subscription:", err);
    return NextResponse.json(
      { success: false, error: "Failed to cancel subscription." },
      { status: 500 }
    );
  }
}
