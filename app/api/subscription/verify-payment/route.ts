import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getRazorpayClient,
  verifyPaymentSignature,
} from "@/lib/razorpay/client";
import { recordSubscriptionPayment } from "@/lib/subscriptions/service";
import {
  getPlanPricing,
  isBillingInterval,
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
        { success: false, error: "Authentication required.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // 2. Parse payment callback details
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required payment verification parameters.",
        },
        { status: 400 }
      );
    }

    // 3. Mandatory server-side cryptographic signature check
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      console.error(
        `Signature mismatch for user ${user.id}, order ${razorpay_order_id}`
      );
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed: Invalid cryptographic signature.",
          code: "INVALID_SIGNATURE",
        },
        { status: 400 }
      );
    }

    // 4. Retrieve true order details from server-side database
    // (NEVER trust client-supplied plan tier, interval, or amount)
    let verifiedPlanTier: "pro" | "premium" = "pro";
    let verifiedAmount = getPlanPricing("pro", "monthly").priceInPaise;
    let verifiedBillingInterval: BillingInterval = "monthly";

    const { data: orderData } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("order_id", razorpay_order_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderData) {
      verifiedPlanTier = orderData.plan_tier === "premium" ? "premium" : "pro";
      verifiedAmount = orderData.amount;
      verifiedBillingInterval = isBillingInterval(orderData.billing_interval)
        ? orderData.billing_interval
        : "monthly";
    } else {
      // If payment_orders row was not found (e.g. migration pending), check Razorpay API notes
      const razorpay = getRazorpayClient();
      if (razorpay) {
        try {
          const order = await razorpay.orders.fetch(razorpay_order_id);
          verifiedPlanTier =
            order.notes?.planTier === "premium" ? "premium" : "pro";
          verifiedBillingInterval = isBillingInterval(order.notes?.billingInterval)
            ? order.notes.billingInterval
            : "monthly";
          verifiedAmount = getPlanPricing(
            verifiedPlanTier,
            verifiedBillingInterval
          ).priceInPaise;
        } catch (fetchErr) {
          console.warn("Could not fetch order from Razorpay API:", fetchErr);
        }
      }
    }

        // 5. Verify payment status with Razorpay API
    //    CRITICAL: If we cannot independently confirm the payment was
    //    captured/authorized by Razorpay, we MUST fail closed and NOT
    //    activate the subscription. Network failures, API timeouts, or
    //    any other error here means we cannot trust that payment succeeded,
    //    so we refuse to grant access rather than risk granting it without
    //    verified payment. The webhook handler serves as the authoritative
    //    backup path for payment confirmation.
    const razorpay = getRazorpayClient();
    if (razorpay) {
      let payment;
      try {
        payment = await razorpay.payments.fetch(razorpay_payment_id);
      } catch (paymentErr) {
        console.error(
          `Could not verify payment status from Razorpay API for payment ${razorpay_payment_id}:`,
          paymentErr
        );
        return NextResponse.json(
          {
            success: false,
            error:
              "Payment status could not be verified at this time. If your payment was successful, your subscription will be activated automatically via webhook. Please try again in a few minutes or contact support.",
            code: "PAYMENT_VERIFICATION_INCOMPLETE",
          },
          { status: 503 }
        );
      }

      if (payment.status !== "captured" && payment.status !== "authorized") {
        console.error(
          `Payment ${razorpay_payment_id} for user ${user.id} is not in a valid state (status: ${payment.status}).`
        );
        return NextResponse.json(
          {
            success: false,
            error: `Payment is not in a valid state (status: ${payment.status}). Please check your payment status and try again.`,
            code: "PAYMENT_INVALID_STATUS",
          },
          { status: 400 }
        );
      }
    } else {
      // No Razorpay client configured — cannot independently verify payment.
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment verification is currently unavailable. Please try again later or contact support.",
          code: "RAZORPAY_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    // 6. Update payment order status to 'paid'
    try {
      await supabase
        .from("payment_orders")
        .update({
          status: "paid",
          payment_id: razorpay_payment_id,
          signature: razorpay_signature,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", razorpay_order_id)
        .eq("user_id", user.id);
    } catch (orderUpdateErr) {
      console.warn("Failed to update payment_orders status:", orderUpdateErr);
    }

    // 7. Activate subscription in database (period length depends on billing interval)
    const activated = await recordSubscriptionPayment(
      user.id,
      verifiedPlanTier,
      razorpay_payment_id,
      razorpay_order_id,
      verifiedAmount,
      "INR",
      verifiedBillingInterval
    );

    if (!activated) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update subscription in database. Please contact support.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        planTier: verifiedPlanTier,
        billingInterval: verifiedBillingInterval,
        status: "active",
        message: `Successfully upgraded to ${verifiedPlanTier.toUpperCase()}${
          verifiedBillingInterval === "annual" ? " (Annual)" : ""
        }! Your monthly allowance is now active.`,
      },
    });
  } catch (err: unknown) {
    console.error("Error in verify-payment route:", err);
    const message =
      err instanceof Error ? err.message : "Payment verification failed.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
