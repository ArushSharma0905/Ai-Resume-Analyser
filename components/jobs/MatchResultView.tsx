"use client";

import React from "react";
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  GraduationCap,
  Briefcase,
  Shield,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";
import type { MatchResult } from "@/lib/types/match";
import type { Job } from "@/lib/types/job";

interface MatchResultViewProps {
  result: MatchResult;
  job: Job;
  onClose?: () => void;
  onOptimize?: () => void;
  isOptimizing?: boolean;
}

function getScoreColor(score: number): {
  text: string;
  bg: string;
  border: string;
} {
  if (score >= 80) {
    return {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800",
    };
  }
  if (score >= 65) {
    return {
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
    };
  }
  if (score >= 45) {
    return {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
    };
  }
  return {
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
  };
}

function getConfidenceBadge(confidence: string) {
  switch (confidence) {
    case "high":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50">
          <Shield className="w-3 h-3" />
          High Confidence
        </span>
      );
    case "medium":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50">
          <Shield className="w-3 h-3" />
          Medium Confidence
        </span>
      );
    case "low":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50">
          <Shield className="w-3 h-3" />
          Low Confidence
        </span>
      );
    default:
      return null;
  }
}

function SkillList({ label, skills, icon: Icon, color }: {
  label: string;
  skills: string[];
  icon: React.ElementType;
  color: "emerald" | "rose" | "blue" | "amber";
}) {
  const colorClasses = {
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-900/50",
    rose: "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-900/50",
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-900/50",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-900/50",
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
        <h4 className={`text-sm font-semibold text-${color}-700 dark:text-${color}-300`}>
          {label}
        </h4>
      </div>
      {skills && skills.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill, idx) => (
            <span
              key={idx}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${colorClasses[color]}`}
            >
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">None identified.</p>
      )}
    </div>
  );
}

function FitCard({ label, icon: Icon, content }: {
  label: string;
  icon: React.ElementType;
  content: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</h4>
      </div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{content}</p>
    </div>
  );
}

function BulletList({ items, icon: Icon, color }: {
  items: string[];
  icon: React.ElementType;
  color: "emerald" | "rose";
}) {
  const iconColor = color === "emerald" ? "text-emerald-500" : "text-rose-500";
  const bgColor = color === "emerald" ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-rose-50 dark:bg-rose-950/30";
  const borderColor = color === "emerald" ? "border-emerald-200/60 dark:border-emerald-900/40" : "border-rose-200/60 dark:border-rose-900/40";
  const textColor = color === "emerald" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300";

  return (
    <div className={`border ${borderColor} rounded-xl p-4 ${bgColor}`}>
      <ul className="space-y-2">
        {items && items.length > 0 ? (
          items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm">
              <Icon className={`w-4 h-4 ${iconColor} shrink-0 mt-0.5`} />
              <span className={`text-zinc-700 dark:text-zinc-300 ${textColor}`}>{item}</span>
            </li>
          ))
        ) : (
          <li className="text-xs text-zinc-500">None identified.</li>
        )}
      </ul>
    </div>
  );
}

export default function MatchResultView({
  result,
  job,
  onClose,
  onOptimize,
  isOptimizing,
}: MatchResultViewProps) {
  const scoreColors = getScoreColor(result.overallScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 flex items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                AI Match Analysis
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xs sm:max-w-md">
                {job.title} • {job.company}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOptimize && (
              <button
                type="button"
                onClick={onOptimize}
                disabled={isOptimizing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
                title="Optimize Resume with AI"
              >
                {isOptimizing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isOptimizing ? "Optimizing..." : "Optimize Resume"}</span>
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Score & Recommendation */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Circular Score Display */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className={`relative w-28 h-28 rounded-full flex items-center justify-center ${scoreColors.bg} border-2 ${scoreColors.border}`}>
                <div className="text-center">
                  <span className={`text-3xl font-extrabold tracking-tight ${scoreColors.text}`}>
                    {result.overallScore}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block font-medium">
                    / 100
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold tracking-wider uppercase mt-2 text-zinc-500 dark:text-zinc-400">
                Match Score
              </span>
            </div>

            {/* Recommendation & Confidence */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                <span className="inline-block px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-full text-sm font-semibold">
                  {result.recommendation}
                </span>
                {getConfidenceBadge(result.confidence)}
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {result.summary}
              </p>
            </div>
          </div>

          {/* Call to Action: Optimize Resume Banner */}
          {onOptimize && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-blue-200/70 dark:border-blue-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    Tailor Your Resume for This Specific Job
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Generate grounded rewrites, action-verb highlights, and ATS keyword alignments without hallucinating new facts.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOptimize}
                disabled={isOptimizing}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Optimizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Optimize Resume</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Skills Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkillList
              label="Matched Skills"
              skills={result.matchedSkills}
              icon={CheckCircle2}
              color="emerald"
            />
            <SkillList
              label="Missing Skills"
              skills={result.missingSkills}
              icon={AlertTriangle}
              color="rose"
            />
            <SkillList
              label="Transferable Skills"
              skills={result.transferableSkills}
              icon={Sparkles}
              color="blue"
            />
          </div>

          {/* Fit Assessments */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FitCard label="Experience Fit" icon={Briefcase} content={result.experienceFit} />
            <FitCard label="Education Fit" icon={GraduationCap} content={result.educationFit} />
            <FitCard label="Seniority Fit" icon={TrendingUp} content={result.seniorityFit} />
          </div>

          {/* Strengths & Concerns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Strengths</h3>
              </div>
              <BulletList items={result.strengths} icon={CheckCircle2} color="emerald" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Concerns</h3>
              </div>
              <BulletList items={result.concerns} icon={AlertTriangle} color="rose" />
            </div>
          </div>

          {/* Interview Preparation */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Interview Preparation</h3>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
              <ul className="space-y-2.5">
                {result.interviewPreparation && result.interviewPreparation.length > 0 ? (
                  result.interviewPreparation.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="text-blue-500 font-bold mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-zinc-500">No specific preparation tips available.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
