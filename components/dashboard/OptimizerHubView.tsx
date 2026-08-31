"use client";

import React from "react";
import {
  Wand2,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Layers,
  Target,
  Briefcase,
} from "lucide-react";
import type { Job } from "@/lib/types/job";
import type { MatchResult } from "@/lib/types/match";
import type { ResumeOptimizationResult } from "@/lib/types/optimization";
import type { SessionMatchItem } from "./DashboardHome";
import type { NavTab } from "@/components/layout/Navbar";

interface OptimizerHubViewProps {
  optimizationResult: ResumeOptimizationResult | null;
  optimizingJob: Job | null;
  sessionMatches: SessionMatchItem[];
  onOpenOptimizerModal: () => void;
  onOptimizeJob: (job: Job, matchResult?: MatchResult) => void;
  onSelectTab: (tab: NavTab) => void;
}

export default function OptimizerHubView({
  optimizationResult,
  optimizingJob,
  sessionMatches,
  onOpenOptimizerModal,
  onOptimizeJob,
  onSelectTab,
}: OptimizerHubViewProps) {
  return (
    <div className="space-y-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-1.5 border border-emerald-200/60 dark:border-emerald-900/40">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Zero-Hallucination Safe</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            AI Resume Optimization Hub
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Tailor your resume for specific positions with action verbs and ATS keywords grounded purely in your authentic experience.
          </p>
        </div>

        {optimizationResult && optimizingJob && (
          <button
            type="button"
            onClick={onOpenOptimizerModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Open Optimizer View</span>
          </button>
        )}
      </div>

      {/* Active Optimization State */}
      {optimizationResult && optimizingJob ? (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-blue-200/70 dark:border-blue-900/50 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Active Tailored Version
                </span>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {optimizingJob.title}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Target Company: <strong>{optimizingJob.company}</strong> • Location: {optimizingJob.location}
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenOptimizerModal}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>Review All 7 Optimized Sections</span>
              </button>
            </div>

            {/* Quick Metrics of the Optimization */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-center">
                <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 block">
                  {optimizationResult.optimizedExperience?.length || 0}
                </span>
                <span className="text-[11px] text-zinc-500 font-medium">Roles Refined</span>
              </div>

              <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-center">
                <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 block">
                  {optimizationResult.keywordSuggestions?.length || 0}
                </span>
                <span className="text-[11px] text-zinc-500 font-medium">Keywords Mapped</span>
              </div>

              <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-center">
                <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 block">
                  {optimizationResult.identifiedGaps?.length || 0}
                </span>
                <span className="text-[11px] text-zinc-500 font-medium">Gaps Identified</span>
              </div>

              <div className="p-3 bg-white/80 dark:bg-zinc-900/80 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-center">
                <span className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 block">
                  {optimizationResult.changes?.length || 0}
                </span>
                <span className="text-[11px] text-zinc-500 font-medium">Audited Changes</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Grounding Principles Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            100% Evidence-Grounded
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            The AI is strictly prohibited from inventing skills, employers, job titles, or metrics. Rewrites use only facts present on your resume.
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Action Verbs & ATS Alignment
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Converts passive descriptions into active recruiter-preferred phrases while categorizing technologies for maximum ATS parse rate.
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Honest Gap Identification
          </h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            If a job requires skills you do not have, they are highlighted as actionable gaps with advice rather than falsely added to your resume.
          </p>
        </div>
      </div>

      {/* Select a job from session matches to optimize */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Tailor for Analyzed Positions
          </h3>
          <p className="text-xs text-zinc-500">
            Pick any job you have matched with to generate a targeted resume optimization.
          </p>
        </div>

        {sessionMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {sessionMatches.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {item.job.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {item.matchResult.overallScore}% Match
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.job.company} • {item.job.location}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onOptimizeJob(item.job, item.matchResult)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Optimize for this Position</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
            <Target className="w-8 h-8 text-zinc-400 mx-auto" />
            <div className="max-w-sm mx-auto">
              <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                No jobs matched yet
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Find positions in Job Search and run a match to generate tailored resume optimizations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab("jobs")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Browse Jobs</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
