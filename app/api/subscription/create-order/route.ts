import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRazorpayClient, getRazorpayKeyId } from "@/lib/razorpay/client";
import {
  PLANS,
  getPlanPricing,
  isBillingInterval,
  type PlanTier,
  type BillingInterval,
} from "@/lib/subscriptions/config";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to subscribe.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 2. Parse and validate plan tier + billing interval (server-side only)
    const body = await request.json();
    const planTier = body.planTier as PlanTier;
    const billingInterval: BillingInterval = isBillingInterval(body.billingInterval)
      ? body.billingInterval
      : "monthly";

    if (planTier !== "pro" && planTier !== "premium") {
      return NextResponse.json(
        { success: false, error: "Invalid plan selected. Must be 'pro' or 'premium'." },
        { status: 400 }
      );
    }

    const plan = PLANS[planTier];
    // Amount is ALWAYS derived from the server-side plan configuration.
    // The browser can only choose between validated intervals; it can never set a price.
    const pricing = getPlanPricing(planTier, billingInterval);
    const amountInPaise = pricing.priceInPaise;
    const keyId = getRazorpayKeyId();
    const razorpay = getRazorpayClient();

    if (!razorpay || !keyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment provider is not yet configured. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local.",
          code: "RAZORPAY_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    // 3. Create order via Razorpay API (amount from server-side config only)
    const receipt = `rcpt_${user.id.slice(0, 8)}_${Date.now().toString().slice(-6)}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        userId: user.id,
        userEmail: user.email || "",
        planTier: planTier,
        billingInterval: billingInterval,
      },
    });

    // 4. Save order intent in public.payment_orders for tamper-proof verification
    try {
      await supabase.from("payment_orders").insert({
        user_id: user.id,
        order_id: order.id,
        plan_tier: planTier,
        billing_interval: billingInterval,
        amount: amountInPaise,
        currency: "INR",
        status: "created",
      });
    } catch (dbErr) {
      console.warn("Could not record payment_orders row (migration may be pending):", dbErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: amountInPaise,
        currency: "INR",
        keyId,
        planTier,
        planName: plan.name,
        billingInterval,
        userEmail: user.email || "",
        userName: user.user_metadata?.full_name || "",
      },
    });
  } catch (err: unknown) {
    console.error("Error creating Razorpay order:", err);
    const message =
      err instanceof Error ? err.message : "Failed to initiate checkout order.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
