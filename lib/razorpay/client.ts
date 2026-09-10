import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Returns a server-side instance of the Razorpay SDK if configured.
 * Never expose key_secret to the browser.
 */
export function getRazorpayClient(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    return null;
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

/**
 * Returns the public Razorpay Key ID for client-side checkout.
 */
export function getRazorpayKeyId(): string | null {
  return (
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID ||
    null
  );
}

/**
 * Validates Razorpay payment signature after client checkout callback.
 * Expected HMAC format: HMAC_SHA256(order_id + "|" + payment_id, secret)
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    console.error("RAZORPAY_KEY_SECRET is missing. Cannot verify signature.");
    return false;
  }

  try {
    const generated = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(generated, "utf-8"),
      Buffer.from(signature, "utf-8")
    );
  } catch (err) {
    console.error("Error validating payment signature:", err);
    return false;
  }
}

/**
 * Validates Razorpay webhook signature.
 * Header: x-razorpay-signature
 * Algorithm: HMAC_SHA256(raw_request_body, webhook_secret)
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is missing. Cannot verify webhook signature.");
    return false;
  }

  try {
    const generated = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(generated, "utf-8"),
      Buffer.from(signature, "utf-8")
    );
  } catch (err) {
    console.error("Error validating webhook signature:", err);
    return false;
  }
}
