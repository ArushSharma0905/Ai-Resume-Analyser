"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { NavTab } from "@/components/layout/Navbar";

interface PricingViewProps {
  onSelectTab: (tab: NavTab) => void;
}

export default function PricingView({ onSelectTab }: PricingViewProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const discountPercent = 20;

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
      q: "Is payment processing active currently?",
      a: "No. The subscription plans shown here reflect upcoming tiers. All core features (Upload, ATS Scorecard, Job Search, Job Match, and Optimizer) are accessible for free during this phase.",
    },
  ];

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
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
            <span>Annual Billing</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Save {discountPercent}%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {/* Plan 1: Free Starter */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Free Starter</h3>
              <p className="text-xs text-zinc-500 mt-1">Core resume parsing & ATS evaluation.</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">$0</span>
              <span className="text-xs text-zinc-500 font-semibold">/ month</span>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Included Features
              </span>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>PDF, DOCX & TXT Extraction</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>0-100 ATS Scorecard & Pillars</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Live Job Search & Filters</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Standard AI Job Matching</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 line-through">
                <span>Resume Tailoring Optimizer</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab("analyzer")}
            className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Current Active Plan
          </button>
        </div>

        {/* Plan 2: Pro Career (Popular) */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-blue-600 dark:border-blue-500 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative flex flex-col justify-between">
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white uppercase tracking-wider shadow-xs">
            Most Popular
          </span>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Pro Career</h3>
              <p className="text-xs text-zinc-500 mt-1">Full ATS optimization & AI tailoring.</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {billingCycle === "annual" ? "$15" : "$19"}
              </span>
              <span className="text-xs text-zinc-500 font-semibold">/ month</span>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                Everything in Free, plus:
              </span>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Zero-Hallucination Resume Optimizer</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Original vs Suggested Bullet Rewrites</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Grounded Keyword Suggestions</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Detailed Skill Gap Diagnosis</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Priority Gemini Flash Speed</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Coming Soon in Phase 6
            </button>
            <p className="text-[10px] text-center text-zinc-400">
              Currently free during developer testing
            </p>
          </div>
        </div>

        {/* Plan 3: Premium Executive */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Premium Executive</h3>
              <p className="text-xs text-zinc-500 mt-1">For active multi-industry applicants.</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {billingCycle === "annual" ? "$31" : "$39"}
              </span>
              <span className="text-xs text-zinc-500 font-semibold">/ month</span>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                Everything in Pro, plus:
              </span>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Multi-Resume Version Management</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Job Application Pipeline Tracker</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Export to Formatted DOCX / PDF</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>VIP Support Channel</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Coming Soon in Phase 6
            </button>
            <p className="text-[10px] text-center text-zinc-400">
              No credit card or payments required now
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* FAQ ACCORDION SECTION                                            */}
      {/* ================================================================ */}
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
