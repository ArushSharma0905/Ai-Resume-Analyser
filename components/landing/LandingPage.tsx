"use client";

import React from "react";
import {
  Sparkles,
  Zap,
  Target,
  Wand2,
  BarChart3,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  FileText,
  Lock,
  Cpu,
} from "lucide-react";
import type { NavTab } from "@/components/layout/Navbar";

interface LandingPageProps {
  onSelectTab: (tab: NavTab) => void;
  hasResume: boolean;
}

export default function LandingPage({ onSelectTab, hasResume }: LandingPageProps) {
  return (
    <div className="space-y-20 sm:space-y-28 py-8 sm:py-16">
      {/* ================================================================ */}
      {/* 1. HERO SECTION                                                  */}
      {/* ================================================================ */}
      <section className="relative text-center max-w-4xl mx-auto px-4 space-y-6 sm:space-y-8">
        {/* Glow effect backdrop */}
        <div className="absolute inset-0 -top-20 -z-10 flex items-center justify-center opacity-40 dark:opacity-20 pointer-events-none">
          <div className="w-[600px] h-[350px] bg-gradient-to-tr from-blue-500 to-indigo-400 rounded-full blur-3xl" />
        </div>

        {/* Top Product Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Full-Cycle AI Career Suite • Powered by Gemini</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
          Analyze, Match & Optimize Your Resume with{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Real AI Precision
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="text-base sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Get objective 0–100 ATS scorecards, discover live job openings, calculate candidate-to-job compatibility, and generate tailored, non-hallucinatory resume improvements.
        </p>

        {/* Primary & Secondary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
          <button
            type="button"
            onClick={() => onSelectTab(hasResume ? "dashboard" : "analyzer")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{hasResume ? "Go to Dashboard" : "Analyze My Resume"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("jobs")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-sm rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Briefcase className="w-4 h-4" />
            <span>Explore Jobs</span>
          </button>
        </div>

        {/* Supporting Highlights below CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 pt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>PDF, DOCX & TXT Parsing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Objective 4-Pillar ATS Diagnostic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Strict Anti-Hallucination Engine</span>
          </div>
        </div>

        {/* Product Preview Visual Showcase */}
        <div className="pt-8 sm:pt-12">
          <div className="p-3 sm:p-4 rounded-3xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="bg-white dark:bg-zinc-950 rounded-2xl p-5 sm:p-8 border border-zinc-200/80 dark:border-zinc-800/80 text-left space-y-6">
              {/* Fake UI Header Preview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                    AI
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Live Candidate Intelligence Suite
                    </h3>
                    <p className="text-xs text-zinc-500">Structured ATS Scoring, Real-time Job Matching & Grounded Rewriting</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 rounded-lg text-xs font-bold">
                    ATS Score: 88/100
                  </span>
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 rounded-lg text-xs font-bold">
                    Job Match: 92%
                  </span>
                </div>
              </div>

              {/* 3 Columns Preview Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 space-y-2">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                    1. ATS Scorecard
                  </span>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Impact & Quantification
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Evaluates metrics, action verbs, section completeness, and industry keyword frequency.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 space-y-2">
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                    2. AI Job Fit
                  </span>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Direct & Transferable Skills
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Distinguishes confirmed skills from transferable knowledge and pinpoints exact requirement gaps.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    3. Resume Optimizer
                  </span>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Grounded Bullet Rewrites
                  </p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Shows Original vs Suggested wording with reasoning. Never invents unsupported experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 2. HOW IT WORKS SECTION                                          */}
      {/* ================================================================ */}
      <section className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
            <span>Simple 4-Step Process</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            How ResumeAI Powers Your Career
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            From raw resume document to tailored job application in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-3 relative shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Upload Resume
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Drag and drop your resume in PDF, DOCX, or TXT format. Text extraction runs securely in your browser session.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-3 relative shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              ATS Diagnostics
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Gemini extracts full structured skills, experiences, and calculates objective 0-100 ATS scores with category feedback.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-3 relative shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Match Live Jobs
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Search live listings and run deep compatibility analysis with skill breakdown, fit assessment, and interview prep.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-3 relative shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              04
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Tailor & Optimize
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Receive non-hallucinatory rewrites, action verbs, and ATS alignments ready to copy directly into your application.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 3. CORE PRODUCT CAPABILITIES                                     */}
      {/* ================================================================ */}
      <section className="max-w-6xl mx-auto px-4 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Key Platform Features</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Engineered for High ATS Readability & Job Matching
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Comprehensive tools built specifically to optimize each stage of candidate preparation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1: ATS Engine */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                0–100 ATS Scorecard & Analysis
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Evaluates resumes across four core recruiter criteria: impact quantification, action verbs, section completeness, and industry keywords.
              </p>
              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Impact quantification grading</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Detected vs Recommended keywords</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Actionable section-by-section fixes</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab("analyzer")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer pt-4 border-t border-zinc-100 dark:border-zinc-800"
            >
              <span>Test Resume Scorecard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feature 2: Job Match Engine */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                AI Job Match & Gap Diagnostic
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Compares candidate profile against specific job listings to identify matched skills, transferable skills, seniority fit, and missing requirements.
              </p>
              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Matched vs Missing skill matrix</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Experience, Education & Seniority fit</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Targeted interview prep guidance</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab("jobs")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 cursor-pointer pt-4 border-t border-zinc-100 dark:border-zinc-800"
            >
              <span>Explore Matching Jobs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feature 3: Non-hallucinating Optimizer */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Wand2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Grounded Resume Optimizer
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Refines bullet points and highlights genuine candidate achievements without fabricating experience, metrics, or technologies.
              </p>
              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Original vs Suggested side-by-side</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Grounding validation for all keywords</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>One-click section clipboard copy</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab("optimizer")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer pt-4 border-t border-zinc-100 dark:border-zinc-800"
            >
              <span>Learn About Optimizer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 4. TRUST & VALUE SECTION                                         */}
      {/* ================================================================ */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-8">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs uppercase tracking-wider font-bold text-blue-300">
              Built on Trust & Integrity
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Strict Non-Hallucination & Authentic Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Unlike generic AI tools that invent fake jobs, metrics, or skills to boost match numbers, ResumeAI operates under strict grounding rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
              <h4 className="text-sm font-bold">100% Fact-Grounded</h4>
              <p className="text-xs text-blue-100/90 leading-relaxed">
                The optimizer only rephrases verifiable candidate accomplishments and highlights genuine gaps as advice instead of fabricating them.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-2">
              <Lock className="w-6 h-6 text-blue-300 mb-2" />
              <h4 className="text-sm font-bold">Session Privacy</h4>
              <p className="text-xs text-blue-100/90 leading-relaxed">
                Your resume text is extracted in your local browser session and processed securely without permanent database tracking or selling of data.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-2">
              <Cpu className="w-6 h-6 text-purple-300 mb-2" />
              <h4 className="text-sm font-bold">Structured Schema</h4>
              <p className="text-xs text-blue-100/90 leading-relaxed">
                Leverages Google Gemini with strict JSON Schemas to deliver consistent, parseable ATS feedback and match scores every time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 5. PRICING TEASER SECTION                                        */}
      {/* ================================================================ */}
      <section className="max-w-5xl mx-auto px-4 space-y-8 text-center">
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Transparent Subscription Options
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            Simple Plans for Every Stage of Your Career
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
            Get started for free today with comprehensive resume analysis, ATS scoring, and live job matching.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left pt-4">
          {/* Free Tier */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Free Starter</h4>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">$0</span>
                <span className="text-xs text-zinc-500">/ forever</span>
              </div>
              <p className="text-xs text-zinc-500">Essential resume evaluation & job discovery.</p>
              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Resume upload (PDF, DOCX, TXT)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>0-100 ATS Scorecard & Summary</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Live Job Search & Filters</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Standard AI Job Matching</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab("analyzer")}
              className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro Tier (Popular) */}
          <div className="bg-white dark:bg-zinc-900 border-2 border-blue-600 dark:border-blue-500 rounded-2xl p-6 space-y-4 shadow-md relative flex flex-col justify-between">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white uppercase tracking-wider">
              Most Popular
            </span>
            <div className="space-y-3">
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Pro Career</h4>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">$19</span>
                <span className="text-xs text-zinc-500">/ month</span>
              </div>
              <p className="text-xs text-zinc-500">Advanced ATS diagnostics & resume optimizer.</p>
              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Zero-Hallucination Resume Optimizer</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Original vs Suggested Bullet Rewrites</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Priority Gemini Processing</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab("pricing")}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              View Plan Details
            </button>
          </div>

          {/* Premium Tier */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Premium Executive</h4>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">$39</span>
                <span className="text-xs text-zinc-500">/ month</span>
              </div>
              <p className="text-xs text-zinc-500">For active multi-role job searchers.</p>
              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Multi-Version Resume Management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Application Tracking Pipeline</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Dedicated Roadmap Access</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab("pricing")}
              className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 6. FINAL CALL TO ACTION BANNER                                   */}
      {/* ================================================================ */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <div className="max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Upgrade Your Job Search?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Upload your resume now to instantly unlock your ATS scorecard, find matched positions, and generate tailored optimizations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onSelectTab("analyzer")}
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              Analyze Resume Now
            </button>
            <button
              type="button"
              onClick={() => onSelectTab("jobs")}
              className="w-full sm:w-auto px-6 py-3.5 bg-blue-700/60 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl border border-white/20 transition-all cursor-pointer"
            >
              Browse Open Jobs
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
