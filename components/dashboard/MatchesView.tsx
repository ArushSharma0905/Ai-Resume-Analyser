"use client";

import React from "react";
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Briefcase,
  Building2,
  MapPin,
  Laptop,
  ExternalLink,
  Wand2,
} from "lucide-react";
import type { Job } from "@/lib/types/job";
import type { MatchResult } from "@/lib/types/match";
import type { SessionMatchItem } from "./DashboardHome";
import type { NavTab } from "@/components/layout/Navbar";

interface MatchesViewProps {
  sessionMatches: SessionMatchItem[];
  onViewMatch: (job: Job, matchResult: MatchResult) => void;
  onOptimizeJob: (job: Job, matchResult?: MatchResult) => void;
  onSelectTab: (tab: NavTab) => void;
}

function getScoreBadge(score: number) {
  if (score >= 80) {
    return {
      text: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
      border: "border-emerald-200 dark:border-emerald-800/60",
      label: "Strong Match",
    };
  }
  if (score >= 65) {
    return {
      text: "text-blue-700 dark:text-blue-300",
      bg: "bg-blue-50 dark:bg-blue-950/50",
      border: "border-blue-200 dark:border-blue-800/60",
      label: "Good Match",
    };
  }
  if (score >= 45) {
    return {
      text: "text-amber-700 dark:text-amber-300",
      bg: "bg-amber-50 dark:bg-amber-950/50",
      border: "border-amber-200 dark:border-amber-800/60",
      label: "Moderate Fit",
    };
  }
  return {
    text: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    border: "border-rose-200 dark:border-rose-800/60",
    label: "Low Fit",
  };
}

export default function MatchesView({
  sessionMatches,
  onViewMatch,
  onOptimizeJob,
  onSelectTab,
}: MatchesViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Analyzed Job Compatibility Reports
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Review detailed compatibility scores, matched skills, and skill gaps for jobs analyzed during this session.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectTab("jobs")}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Discover More Jobs</span>
        </button>
      </div>

      {/* Matches Grid */}
      {sessionMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {sessionMatches.map((item, idx) => {
            const badge = getScoreBadge(item.matchResult.overallScore);
            return (
              <div
                key={idx}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-800/80 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Score & Recommendation */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>{item.matchResult.overallScore}% — {badge.label}</span>
                    </span>

                    {item.job.isRemote && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50">
                        <Laptop className="w-3 h-3" />
                        Remote
                      </span>
                    )}
                  </div>

                  {/* Title & Company */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                        {item.job.company}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        {item.job.location}
                      </span>
                    </div>
                  </div>

                  {/* Recommendation Summary */}
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                    {item.matchResult.summary}
                  </p>

                  {/* Skills Snapshot */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      {item.matchResult.matchedSkills?.length || 0} matched
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      {item.matchResult.missingSkills?.length || 0} gaps
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                      <Sparkles className="w-3 h-3" />
                      {item.matchResult.transferableSkills?.length || 0} transferable
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onViewMatch(item.job, item.matchResult)}
                    className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    View Report
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOptimizeJob(item.job, item.matchResult)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Optimize Resume</span>
                    </button>

                    <a
                      href={item.job.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                      title="Open Job Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              No Matches Analyzed Yet
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Explore available job listings in the Job Search tab and click &ldquo;Analyze Match&rdquo; on any position to compare it against your resume.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab("jobs")}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Briefcase className="w-4 h-4" />
            <span>Search Live Positions</span>
          </button>
        </div>
      )}
    </div>
  );
}
