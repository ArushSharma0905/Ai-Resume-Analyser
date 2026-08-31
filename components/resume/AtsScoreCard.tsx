"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Award,
  Zap,
  Tag,
} from "lucide-react";
import type { AtsScoreReport, AtsCategoryStatus } from "@/lib/types/resume";

interface AtsScoreCardProps {
  report: AtsScoreReport;
}

function getStatusBadge(status: AtsCategoryStatus) {
  switch (status) {
    case "excellent":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          Excellent
        </span>
      );
    case "good":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
          Good
        </span>
      );
    case "needs_improvement":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          Needs Work
        </span>
      );
    case "critical":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          Critical
        </span>
      );
  }
}

function getScoreColor(score: number): {
  text: string;
  bg: string;
  border: string;
  ring: string;
} {
  if (score >= 85) {
    return {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800",
      ring: "stroke-emerald-500",
    };
  }
  if (score >= 70) {
    return {
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      ring: "stroke-blue-500",
    };
  }
  if (score >= 50) {
    return {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
      ring: "stroke-amber-500",
    };
  }
  return {
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
    ring: "stroke-rose-500",
  };
}

export default function AtsScoreCard({ report }: AtsScoreCardProps) {
  const overallColors = getScoreColor(report.overallScore);

  const categories = [
    {
      key: "impactAndQuantification",
      title: "Impact & Quantifiable Metrics",
      icon: TrendingUp,
      data: report.breakdown.impactAndQuantification,
    },
    {
      key: "actionVerbsAndLanguage",
      title: "Action Verbs & Phrasing",
      icon: Zap,
      data: report.breakdown.actionVerbsAndLanguage,
    },
    {
      key: "structureAndCompleteness",
      title: "Structure & Completeness",
      icon: Award,
      data: report.breakdown.structureAndCompleteness,
    },
    {
      key: "skillsAndKeywords",
      title: "Skills & Keywords Match",
      icon: Tag,
      data: report.breakdown.skillsAndKeywords,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Score & Summary */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          {/* Circular Score Display */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${overallColors.bg} border-2 ${overallColors.border}`}>
              <div className="text-center">
                <span className={`text-4xl font-extrabold tracking-tight ${overallColors.text}`}>
                  {report.overallScore}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-medium">
                  / 100
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold tracking-wider uppercase mt-2 text-zinc-500 dark:text-zinc-400">
              ATS Match Score
            </span>
          </div>

          {/* Overall Narrative Summary */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Resume ATS & Recruiter Quality Report
              </h2>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {report.summary}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Category Detailed Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {categories.map((cat) => {
          const colors = getScoreColor(cat.data.score);
          const Icon = cat.icon;
          return (
            <div
              key={cat.key}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {cat.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(cat.data.status)}
                    <span className={`text-base font-bold ${colors.text}`}>
                      {cat.data.score}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all ${
                      cat.data.score >= 85
                        ? "bg-emerald-500"
                        : cat.data.score >= 70
                        ? "bg-blue-500"
                        : cat.data.score >= 50
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${cat.data.score}%` }}
                  />
                </div>

                {/* Feedback Bullets */}
                <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  {cat.data.feedback.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-zinc-400 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Strengths and Critical Fixes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Strengths */}
        <div className="bg-white dark:bg-zinc-900 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Key Strengths
            </h3>
          </div>
          {report.keyStrengths && report.keyStrengths.length > 0 ? (
            <ul className="space-y-2.5">
              {report.keyStrengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500">No specific strengths highlighted.</p>
          )}
        </div>

        {/* Critical Improvements */}
        <div className="bg-white dark:bg-zinc-900 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Priority Improvements
            </h3>
          </div>
          {report.criticalImprovements && report.criticalImprovements.length > 0 ? (
            <ul className="space-y-2.5">
              {report.criticalImprovements.map((fix, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{fix}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500">No critical issues detected.</p>
          )}
        </div>
      </div>

      {/* Missing Elements & Recommended Keywords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Missing Elements */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 text-zinc-800 dark:text-zinc-200">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Missing or Underrepresented Elements
            </h3>
          </div>
          {report.missingElements && report.missingElements.length > 0 ? (
            <ul className="space-y-2">
              {report.missingElements.map((elem, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{elem}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-zinc-500">All standard resume sections are present.</p>
          )}
        </div>

        {/* Recommended Industry Keywords */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4 text-zinc-800 dark:text-zinc-200">
            <Tag className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Recommended Industry Keywords
            </h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
            Adding relevant keywords aligned with your experience can improve ATS visibility:
          </p>
          {report.recommendedKeywords && report.recommendedKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {report.recommendedKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 rounded-lg text-xs font-medium"
                >
                  +{kw}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Keyword coverage is optimal.</p>
          )}
        </div>
      </div>
    </div>
  );
}
