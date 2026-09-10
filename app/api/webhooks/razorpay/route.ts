import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/razorpay/client";
import { recordSubscriptionPayment } from "@/lib/subscriptions/service";
import {
  getPlanPricing,
  isBillingInterval,
  type BillingInterval,
  type PlanTier,
} from "@/lib/subscriptions/config";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header." },
        { status: 400 }
      );
    }

    const rawBody = await request.text();

    // 1. Mandatory cryptographic signature validation
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("Razorpay webhook signature verification failed.");
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event.event;
    const eventId: string = event.id || `${eventType}_${Date.now()}`;

    const supabase = await createClient();

    // 2. Idempotency Check: Prevent duplicate webhook handling
    try {
      const { data: existingEvent } = await supabase
        .from("webhook_events")
        .select("id")
        .eq("event_id", eventId)
        .maybeSingle();

      if (existingEvent) {
        return NextResponse.json({ received: true, alreadyProcessed: true });
      }
    } catch (checkErr) {
      console.warn("Could not check webhook_events table for duplicates:", checkErr);
    }

    // 3. Process relevant lifecycle events
    const payload = event.payload;

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = payload.payment?.entity;
      const orderEntity = payload.order?.entity;

      const userId =
        paymentEntity?.notes?.userId ||
        orderEntity?.notes?.userId;

      const planTier = (paymentEntity?.notes?.planTier ||
        orderEntity?.notes?.planTier ||
        "pro") as PlanTier;

      // Billing interval comes from the server-set order notes (never from the client)
      const rawInterval =
        paymentEntity?.notes?.billingInterval ||
        orderEntity?.notes?.billingInterval;
      const billingInterval: BillingInterval = isBillingInterval(rawInterval)
        ? rawInterval
        : "monthly";

      const fallbackAmount = getPlanPricing(
        planTier === "premium" ? "premium" : "pro",
        billingInterval
      ).priceInPaise;
      const amount =
        paymentEntity?.amount || orderEntity?.amount || fallbackAmount;
      const paymentId = paymentEntity?.id || "webhook_payment";
      const orderId = paymentEntity?.order_id || orderEntity?.id || "webhook_order";

      if (userId) {
        await recordSubscriptionPayment(
          userId,
          planTier === "premium" ? "premium" : "pro",
          paymentId,
          orderId,
          amount,
          "INR",
          billingInterval
        );
      }
    } else if (
      eventType === "subscription.activated" ||
      eventType === "subscription.authenticated" ||
      eventType === "subscription.charged"
    ) {
      const subEntity = payload.subscription?.entity;
      const userId = subEntity?.notes?.userId;
      const planTier = (subEntity?.notes?.planTier || "pro") as PlanTier;
      const subId = subEntity?.id || "sub_unknown";

      if (userId) {
        const currentEnd = subEntity?.current_end
          ? new Date(subEntity.current_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            plan_tier: planTier === "premium" ? "premium" : "pro",
            status: "active",
            provider: "razorpay",
            provider_subscription_id: subId,
            current_period_end: currentEnd,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      }
    } else if (eventType === "payment.failed") {
      const paymentEntity = payload.payment?.entity;
      const userId = paymentEntity?.notes?.userId;

      if (userId) {
        await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    } else if (
      eventType === "subscription.cancelled" ||
      eventType === "subscription.completed" ||
      eventType === "subscription.expired"
    ) {
      const subEntity = payload.subscription?.entity;
      const userId = subEntity?.notes?.userId;

      if (userId) {
        await supabase
          .from("subscriptions")
          .update({
            status: eventType === "subscription.cancelled" ? "canceled" : "inactive",
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    } else if (eventType === "subscription.paused") {
      const subEntity = payload.subscription?.entity;
      const userId = subEntity?.notes?.userId;

      if (userId) {
        await supabase
          .from("subscriptions")
          .update({
            status: "inactive",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    }

    // 4. Save processed event to webhook_events table for idempotency
    try {
      await supabase.from("webhook_events").insert({
        event_id: eventId,
        event_type: eventType,
        payload: event,
        processed: true,
      });
    } catch (saveErr) {
      console.warn("Could not save to webhook_events table:", saveErr);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Razorpay webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook processing error." },
      { status: 500 }
    );
  }
}
