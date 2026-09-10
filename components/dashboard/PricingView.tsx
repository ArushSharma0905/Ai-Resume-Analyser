"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  Shield,
  Target,
} from "lucide-react";
import type { NavTab } from "@/components/layout/Navbar";
import { useAuth } from "@/lib/context/AuthContext";
import { useSubscriptionStore } from "@/lib/subscriptions/subscription-store";
import { PLANS, getAnnualSavingsPercent, type PlanTier } from "@/lib/subscriptions/config";
import { useRazorpay } from "react-razorpay";
import type { RazorpayOrderOptions } from "react-razorpay";

interface PricingViewProps {
  onSelectTab: (tab: NavTab) => void;
}

export default function PricingView({ onSelectTab }: PricingViewProps) {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<PlanTier | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const { subscription, refresh } = useSubscriptionStore();
  const {
    error: razorpayLoadError,
    isLoading: razorpayLoading,
    Razorpay,
  } = useRazorpay();

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ~17% saved by paying annually (derived from the server pricing config)
  const discountPercent = getAnnualSavingsPercent("pro");

  const faqs = [
    {
      q: "How does the ATS Scorecard grade my resume?",
      a: "Our ATS Diagnostic assesses resumes against four key recruiter benchmarks: impact & metric quantification, active action verbs, structure & section completeness, and industry standard keyword alignment.",
    },
    {
      q: "What makes ResumeAI's optimizer non-hallucinating?",
      a: "We enforce strict AI system instructions and JSON Schemas that prevent Gemini from inventing unverified skills, employers, achievements, or metrics. Any requirements missing from your resume are flagged as actionable gaps instead of being fabricated.",
    },
    {
      q: "What resume document formats are supported?",
      a: "ResumeAI supports PDF, DOCX, and plain TXT files. Extraction is executed securely in your session.",
    },
    {
      q: "How do I upgrade to a paid plan?",
      a: "Select your desired plan (Pro or Premium), complete the secure Razorpay checkout, and your subscription will be activated immediately. Use the provided test card details in sandbox mode.",
    },
    {
      q: "Can I cancel my subscription?",
      a: "Yes. You can cancel at any time from your subscription settings. You will retain access until the end of your current billing period.",
    },
  ];

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleCheckout = async (planTier: PlanTier) => {
    if (planTier === "free") return;

    if (!user) {
      setCheckoutError("Please sign in to subscribe to a plan.");
      return;
    }

    if (!Razorpay) {
      setCheckoutError(
        razorpayLoadError ||
          "Razorpay checkout script could not be loaded. Check your connection and try again."
      );
      return;
    }

    setLoadingPlan(planTier);
    setCheckoutError(null);

    try {
      // 1. Create order on the server (server determines plan and price)
      const createRes = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier }),
      });

      const createJson = await createRes.json();

      if (!createRes.ok) {
        throw new Error(
          createJson.error || "Failed to create checkout order."
        );
      }

      if (!createJson.success || !createJson.data) {
        throw new Error("Invalid response from create-order endpoint.");
      }

      const orderData = createJson.data;

      // 2. Configure Razorpay Checkout (client-side only, using public key ID)
      const options: RazorpayOrderOptions = {
        key: orderData.keyId,
        order_id: orderData.orderId,
        name: "ResumeAI",
        description: `${orderData.planName} Plan`,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        prefill: {
          name: orderData.userName || "",
          email: orderData.userEmail || "",
        },
        theme: {
          color: "#2563eb",
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // 3. Verify payment on the server
          const verifyRes = await fetch("/api/subscription/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyJson = await verifyRes.json();

          if (verifyJson.success) {
            // 4. Refresh subscription status (authoritative server state)
            await refresh();
            setCheckoutError(null);
            onSelectTab("dashboard");
          } else {
            console.error("Payment verification failed:", verifyJson);
            setCheckoutError(
              verifyJson.error ||
                "Payment verification failed. Please try again."
            );
          }
        },
        modal: {
          ondismiss: () => {
            // Checkout closed without completing (cancelled / dismissed)
            setLoadingPlan(null);
          },
        },
      };

      const razorpayInstance = new Razorpay(options);

      // Handle explicit payment failure event from Razorpay
      razorpayInstance.on("payment.failed", (failureResponse) => {
        const description =
          failureResponse?.error?.description ||
          "Your payment was not completed.";
        setCheckoutError(description);
        setLoadingPlan(null);
      });

      razorpayInstance.open();
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "An error occurred while initiating checkout.";
      setCheckoutError(message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-12 py-4 sm:py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Transparent Pricing Architecture</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Flexible Plans for Every Career Step
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          Choose the plan that best fits your job search frequency and optimization needs.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 mt-4">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              billingCycle === "monthly"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              billingCycle === "annual"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Annual Billing
            <span className="inline-flex items-center px-1.5 py-0.25 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
              Save {discountPercent}%
            </span>
          </button>
        </div>
      </div>

      {/* Checkout Error Message */}
      {checkoutError && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-800 dark:text-rose-300">{checkoutError}</p>
        </div>
      )}

      {/* Current Plan Indicator */}
      {subscription && subscription.planTier !== "free" && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Your current plan: {subscription.plan?.name || subscription.planTier}</span>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {/* Free Tier */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs relative">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{PLANS.free.name}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{PLANS.free.description}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">₹0</span>
              <span className="text-xs text-zinc-500">/ month</span>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab("dashboard")}
              className={`w-full py-3 rounded-xl text-xs font-bold transition-colors ${
                subscription?.planTier === "free"
                  ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 cursor-default"
                  : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer"
              }`}
            >
              {subscription?.planTier === "free" ? "Current Plan" : "Start with Free"}
            </button>
            <p className="text-[10px] text-center text-zinc-400">
              No credit card required
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-400 uppercase">Features</span>
            <div className="space-y-2">
              {PLANS.free.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pro Tier */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
            {PLANS.pro.badge}
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/40 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{PLANS.pro.name}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{PLANS.pro.description}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                ₹{PLANS.pro.pricing[billingCycle].priceInRupees}
              </span>
              <span className="text-xs text-zinc-500">
                {billingCycle === "annual" ? "/ year" : "/ month"}
              </span>
            </div>
            {billingCycle === "annual" && (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                ≈ ₹{Math.round(PLANS.pro.pricing.annual.priceInRupees / 12)}/month equivalent
              </p>
            )}

            {subscription?.planTier === "pro" ? (
              <button
                type="button"
                className="w-full py-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold cursor-default"
              >
                Current Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleCheckout("pro")}
                disabled={loadingPlan === "pro" || !user || razorpayLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loadingPlan === "pro" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Get Pro"
                )}
              </button>
            )}

            {!user && (
              <p className="text-[10px] text-center text-zinc-400">
                Sign in to subscribe
              </p>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-400 uppercase">What&apos;s included</span>
            <div className="space-y-2">
              {PLANS.pro.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Premium Tier */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs relative">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/40 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{PLANS.premium.name}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{PLANS.premium.description}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                ₹{PLANS.premium.pricing[billingCycle].priceInRupees}
              </span>
              <span className="text-xs text-zinc-500">
                {billingCycle === "annual" ? "/ year" : "/ month"}
              </span>
            </div>
            {billingCycle === "annual" && (
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                ≈ ₹{Math.round(PLANS.premium.pricing.annual.priceInRupees / 12)}/month equivalent
              </p>
            )}

            {subscription?.planTier === "premium" ? (
              <button
                type="button"
                className="w-full py-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold cursor-default"
              >
                Current Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleCheckout("premium")}
                disabled={loadingPlan === "premium" || !user || razorpayLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loadingPlan === "premium" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Get Premium"
                )}
              </button>
            )}

            {!user && (
              <p className="text-[10px] text-center text-zinc-400">
                Sign in to subscribe
              </p>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-400 uppercase">Everything in Pro, plus</span>
            <div className="space-y-2">
              {PLANS.premium.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Test Mode Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Test Mode Active
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Payments are processed through Razorpay&apos;s test environment. Use test card: 4111 1111 1111 1111 with any future date and any CVV. No real charges will be made.
          </p>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Frequently Asked Questions
          </h3>
          <p className="text-xs text-zinc-500">
            Everything you need to know about ResumeAI&apos;s analysis and subscription architecture.
          </p>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between text-left gap-4 font-bold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2.5 leading-relaxed animate-in fade-in duration-150">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

