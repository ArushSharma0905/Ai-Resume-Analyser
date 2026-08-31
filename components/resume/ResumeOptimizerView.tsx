"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Copy,
  Check,
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Briefcase,
  FolderGit2,
  Tags,
  Lightbulb,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  FileText,
  Layers,
  ShieldAlert,
} from "lucide-react";
import type {
  ResumeOptimizationResult,
  SuggestedChange,
  KeywordSuggestion,
  IdentifiedGap,
  OptimizedExperienceItem,
  OptimizedProjectItem,
} from "@/lib/types/optimization";
import type { Job } from "@/lib/types/job";
import type { MatchResult } from "@/lib/types/match";
import type { ParsedResume, SkillGroup } from "@/lib/types/resume";

interface ResumeOptimizerViewProps {
  result: ResumeOptimizationResult | null;
  job: Job;
  matchResult?: MatchResult | null;
  resume?: ParsedResume | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry?: () => void;
}

type TabKey =
  | "summary"
  | "experience"
  | "projects"
  | "skills"
  | "ats"
  | "gaps"
  | "changes";

/* ---- Confidence & Severity Color Helpers ---- */
function getConfidenceBadge(confidence: string) {
  switch (confidence) {
    case "high":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
          High Confidence
        </span>
      );
    case "medium":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
          Medium Confidence
        </span>
      );
    case "low":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
          Low Confidence
        </span>
      );
    default:
      return null;
  }
}

function getGapSeverityBadge(severity: string) {
  switch (severity) {
    case "critical":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
          Critical Gap
        </span>
      );
    case "major":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
          Major Gap
        </span>
      );
    case "minor":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
          Minor Gap
        </span>
      );
    default:
      return null;
  }
}

/* ---- Copy-to-Clipboard Button ---- */
function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

/* ---- Section Header ---- */
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  rightElement,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
          {subtitle && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {rightElement && <div className="flex items-center gap-2">{rightElement}</div>}
    </div>
  );
}

/* ---- Comparison Component: Original vs Suggested with Reason ---- */
function ComparisonCard({
  title,
  originalText,
  suggestedText,
  reason,
  confidence,
  badgeLabel,
}: {
  title?: string;
  originalText?: string | null;
  suggestedText: string;
  reason?: string;
  confidence?: string;
  badgeLabel?: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        {title ? (
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h4>
        ) : (
          badgeLabel && (
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {badgeLabel}
            </span>
          )
        )}
        <div className="flex items-center gap-2">
          {confidence && getConfidenceBadge(confidence)}
          <CopyButton text={suggestedText} label="Copy Suggested" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Original */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
            <span>Original Content</span>
          </div>
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed break-words min-h-[70px]">
            {originalText && originalText.trim() ? (
              originalText
            ) : (
              <span className="text-zinc-400 italic">No original text found for this section.</span>
            )}
          </div>
        </div>

        {/* Suggested */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Suggested Optimization</span>
          </div>
          <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed break-words min-h-[70px]">
            {suggestedText}
          </div>
        </div>
      </div>

      {/* Reason */}
      {reason && (
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-start gap-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            <strong className="text-zinc-800 dark:text-zinc-200">Why this helps: </strong>
            {reason}
          </span>
        </div>
      )}
    </div>
  );
}

/* ---- Skill Matrix Helper ---- */
function formatSkillGroups(skills: SkillGroup | null | undefined): string {
  if (!skills) return "";
  const parts: string[] = [];
  if (skills.technicalSkills?.length)
    parts.push(`Technical Skills: ${skills.technicalSkills.join(", ")}`);
  if (skills.frameworksAndLibraries?.length)
    parts.push(`Frameworks & Libraries: ${skills.frameworksAndLibraries.join(", ")}`);
  if (skills.toolsAndCloud?.length)
    parts.push(`Tools & Cloud: ${skills.toolsAndCloud.join(", ")}`);
  if (skills.softSkills?.length)
    parts.push(`Soft Skills: ${skills.softSkills.join(", ")}`);
  if (skills.languages?.length)
    parts.push(`Languages: ${skills.languages.join(", ")}`);
  return parts.join("\n");
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

export default function ResumeOptimizerView({
  result,
  job,
  matchResult,
  resume,
  isLoading,
  error,
  onClose,
  onRetry,
}: ResumeOptimizerViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("summary");

  const isQuotaError =
    !!error &&
    (error.toLowerCase().includes("429") ||
      error.toLowerCase().includes("quota") ||
      error.toLowerCase().includes("resource_exhausted"));

  // Helper to compile full text for quick copy
  const getFullOptimizedText = () => {
    if (!result) return "";
    const sections: string[] = [];

    if (result.optimizedSummary) {
      sections.push(`=== PROFESSIONAL SUMMARY ===\n${result.optimizedSummary}`);
    }

    if (result.optimizedExperience?.length) {
      sections.push(
        `=== WORK EXPERIENCE ===\n` +
          result.optimizedExperience
            .map(
              (exp) =>
                `${exp.role} | ${exp.company} (${exp.startDate} - ${
                  exp.isCurrent ? "Present" : exp.endDate
                })\n` +
                (exp.technologies?.length
                  ? `Technologies: ${exp.technologies.join(", ")}\n`
                  : "") +
                exp.optimizedHighlights.map((h) => `• ${h}`).join("\n")
            )
            .join("\n\n")
      );
    }

    if (result.optimizedProjects?.length) {
      sections.push(
        `=== PROJECTS ===\n` +
          result.optimizedProjects
            .map(
              (p) =>
                `${p.name}${p.role ? ` (${p.role})` : ""}\n${p.optimizedDescription}\n` +
                (p.optimizedTechnologies?.length
                  ? `Technologies: ${p.optimizedTechnologies.join(", ")}\n`
                  : "") +
                p.optimizedHighlights.map((h) => `• ${h}`).join("\n")
            )
            .join("\n\n")
      );
    }

    const skillsText = formatSkillGroups(result.optimizedSkills);
    if (skillsText) {
      sections.push(`=== SKILLS ===\n${skillsText}`);
    }

    return sections.join("\n\n");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-5xl max-h-[92vh] bg-zinc-50 dark:bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* ===== Modal Header ===== */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-t-2xl shrink-0">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    AI Resume Optimizer
                  </h2>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                    Phase 4
                  </span>
                  {matchResult && (
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                      Match: {matchResult.overallScore}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-md">
                  Target: <strong className="text-zinc-700 dark:text-zinc-300">{job.title}</strong> at {job.company}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {result && (
                <CopyButton text={getFullOptimizedText()} label="Copy All Sections" />
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Close optimizer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Anti-hallucination Notice Banner */}
          <div className="mt-4 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              <strong>Grounded Optimization:</strong> AI enhances wording and aligns ATS keywords using only your genuine resume facts. The original resume is never overwritten.
            </span>
          </div>

          {/* Navigation Tabs (visible when result is present) */}
          {result && !isLoading && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-4 mt-1 border-t border-zinc-100 dark:border-zinc-800/80 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab("summary")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer ${
                  activeTab === "summary"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Summary
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("experience")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer ${
                  activeTab === "experience"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Experience ({result.optimizedExperience?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("projects")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer ${
                  activeTab === "projects"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                Projects ({result.optimizedProjects?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("skills")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer ${
                  activeTab === "skills"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <Tags className="w-3.5 h-3.5" />
                Skills & Keywords ({result.keywordSuggestions?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("ats")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer ${
                  activeTab === "ats"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                ATS & Warnings ({result.atsImprovements?.length + (result.warnings?.length || 0)})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("gaps")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer ${
                  activeTab === "gaps"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Gaps ({result.identifiedGaps?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("changes")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer ${
                  activeTab === "changes"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Audit Log ({result.changes?.length || 0})
              </button>
            </div>
          )}
        </div>

        {/* ===== Modal Body (Scrollable) ===== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* 1. Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 animate-pulse">
                  <Sparkles className="w-7 h-7" />
                </div>
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400 absolute -top-1 -right-1" />
              </div>
              <div className="max-w-md">
                <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Optimizing Your Resume with Gemini...
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Analyzing job requirements, refining bullet points with active verbs, mapping supported keywords, and identifying genuine gaps.
                </p>
              </div>
            </div>
          )}

          {/* 2. Error State */}
          {!isLoading && error && (
            <div className="space-y-4 max-w-lg mx-auto py-8">
              <div
                className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                  isQuotaError
                    ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300"
                    : "bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300"
                }`}
              >
                <AlertCircle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    isQuotaError
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                />
                <div className="flex-1">
                  <p className="font-bold">
                    {isQuotaError ? "Gemini Rate Limit / Quota Reached" : "Optimization Request Failed"}
                  </p>
                  <p className="mt-1 text-xs opacity-90 leading-relaxed">{error}</p>
                  {isQuotaError && (
                    <p className="mt-2 text-xs opacity-80">
                      Please wait a moment before trying again or check your Gemini API quota in Google AI Studio.
                    </p>
                  )}
                </div>
              </div>
              {onRetry && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors text-sm shadow-xs cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Optimization
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. Success Content State */}
          {!isLoading && result && (
            <div>
              {/* TAB 1: SUMMARY */}
              {activeTab === "summary" && (
                <div className="space-y-6">
                  <SectionHeader
                    icon={FileText}
                    title="Professional Summary Optimization"
                    subtitle="Reframed to emphasize target role keywords and core strengths without adding unverified claims."
                    rightElement={
                      <CopyButton text={result.optimizedSummary} label="Copy Summary" />
                    }
                  />

                  <ComparisonCard
                    originalText={resume?.professionalSummary}
                    suggestedText={result.optimizedSummary}
                    reason="Tailors your existing background toward the target position's domain while preserving original achievements."
                    badgeLabel="Professional Summary"
                  />

                  {/* Summary-related suggested changes from audit */}
                  {result.changes
                    ?.filter((c) => c.section === "professionalSummary")
                    .map((change, idx) => (
                      <ComparisonCard
                        key={idx}
                        title={change.title}
                        originalText={change.originalText}
                        suggestedText={change.suggestedText}
                        reason={change.reason}
                        confidence={change.confidence}
                      />
                    ))}
                </div>
              )}

              {/* TAB 2: EXPERIENCE */}
              {activeTab === "experience" && (
                <div className="space-y-6">
                  <SectionHeader
                    icon={Briefcase}
                    title="Work Experience Improvements"
                    subtitle="Action verbs and quantifiable impact improvements structured for high ATS readability."
                  />

                  {result.optimizedExperience?.length > 0 ? (
                    result.optimizedExperience.map((exp: OptimizedExperienceItem, idx: number) => {
                      const originalExp = resume?.workExperience?.find(
                        (e) =>
                          e.company.toLowerCase() === exp.company.toLowerCase() ||
                          e.role.toLowerCase() === exp.role.toLowerCase()
                      );

                      const formattedSuggestedHighlights = exp.optimizedHighlights
                        .map((h) => `• ${h}`)
                        .join("\n");

                      return (
                        <div
                          key={idx}
                          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                            <div>
                              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                {exp.role}
                              </h4>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {exp.company} • {exp.startDate} - {exp.isCurrent ? "Present" : exp.endDate}
                                {exp.location ? ` • ${exp.location}` : ""}
                              </p>
                            </div>
                            <CopyButton
                              text={`${exp.role} at ${exp.company}\n${formattedSuggestedHighlights}`}
                              label="Copy Role Section"
                            />
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Original highlights */}
                            <div className="space-y-1.5">
                              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                                Original Highlights
                              </span>
                              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 min-h-[100px]">
                                {originalExp?.highlights?.length ? (
                                  <ul className="space-y-1.5 list-disc list-inside">
                                    {originalExp.highlights.map((h, hIdx) => (
                                      <li key={hIdx} className="leading-relaxed">
                                        {h}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-zinc-400 italic">No original bullet points provided.</p>
                                )}
                              </div>
                            </div>

                            {/* Optimized highlights */}
                            <div className="space-y-1.5">
                              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Optimized Bullet Points (ATS-Tuned)
                              </span>
                              <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 min-h-[100px]">
                                <ul className="space-y-2">
                                  {exp.optimizedHighlights.map((h, hIdx) => (
                                    <li key={hIdx} className="flex items-start gap-2 leading-relaxed">
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                                        •
                                      </span>
                                      <span>{h}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>

                          {/* Technologies */}
                          {exp.technologies?.length > 0 && (
                            <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="font-semibold text-zinc-500">Technologies:</span>
                              {exp.technologies.map((tech, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-zinc-500">No work experience items to optimize.</p>
                  )}
                </div>
              )}

              {/* TAB 3: PROJECTS */}
              {activeTab === "projects" && (
                <div className="space-y-6">
                  <SectionHeader
                    icon={FolderGit2}
                    title="Project Improvements"
                    subtitle="Enhanced descriptions and tech-stack visibility matching target requirements."
                  />

                  {result.optimizedProjects?.length > 0 ? (
                    result.optimizedProjects.map((proj: OptimizedProjectItem, idx: number) => {
                      const originalProj = resume?.projects?.find(
                        (p) => p.name.toLowerCase() === proj.name.toLowerCase()
                      );

                      const formattedSuggestedProject = `${proj.name}${proj.role ? ` (${proj.role})` : ""}\n${
                        proj.optimizedDescription
                      }\n` + proj.optimizedHighlights.map((h) => `• ${h}`).join("\n");

                      return (
                        <div
                          key={idx}
                          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                            <div>
                              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                {proj.name}
                              </h4>
                              {proj.role && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                  Role: {proj.role}
                                </p>
                              )}
                            </div>
                            <CopyButton text={formattedSuggestedProject} label="Copy Project Section" />
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Original */}
                            <div className="space-y-1.5">
                              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                                Original Project Description
                              </span>
                              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 min-h-[90px] space-y-2">
                                <p className="leading-relaxed">
                                  {originalProj?.description || <span className="text-zinc-400 italic">No description</span>}
                                </p>
                                {originalProj?.highlights && originalProj.highlights.length > 0 && (
                                  <ul className="space-y-1 list-disc list-inside text-xs">
                                    {originalProj.highlights.map((h, hIdx) => (
                                      <li key={hIdx}>{h}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>

                            {/* Optimized */}
                            <div className="space-y-1.5">
                              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Suggested Project Rewrite
                              </span>
                              <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 min-h-[90px] space-y-2">
                                <p className="leading-relaxed font-medium">
                                  {proj.optimizedDescription}
                                </p>
                                {proj.optimizedHighlights && proj.optimizedHighlights.length > 0 && (
                                  <ul className="space-y-1.5 pt-1">
                                    {proj.optimizedHighlights.map((h, hIdx) => (
                                      <li key={hIdx} className="flex items-start gap-1.5 text-xs leading-relaxed">
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                                        <span>{h}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Technologies */}
                          {proj.optimizedTechnologies?.length > 0 && (
                            <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="font-semibold text-zinc-500">Technologies:</span>
                              {proj.optimizedTechnologies.map((tech, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-zinc-500">No project items to optimize.</p>
                  )}
                </div>
              )}

              {/* TAB 4: SKILLS & KEYWORDS */}
              {activeTab === "skills" && (
                <div className="space-y-6">
                  <SectionHeader
                    icon={Tags}
                    title="Skills & Keyword Suggestions"
                    subtitle="Targeted keywords based on job description. Only keywords supported by your resume are recommended for addition."
                    rightElement={
                      <CopyButton
                        text={formatSkillGroups(result.optimizedSkills)}
                        label="Copy Skill Matrix"
                      />
                    }
                  />

                  {/* Keyword Suggestions with Grounding Indicator */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Job Keyword Suggestions & Placement
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {result.keywordSuggestions?.length > 0 ? (
                        result.keywordSuggestions.map((kw: KeywordSuggestion, idx: number) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-xl border flex flex-col justify-between gap-2 shadow-xs ${
                              kw.supportedByResume
                                ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/40"
                                : "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/40"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                {kw.keyword}
                              </span>
                              {kw.supportedByResume ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Supported by Resume
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                                  <AlertTriangle className="w-3 h-3" />
                                  Not in Resume (Gap)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                              <strong className="text-zinc-700 dark:text-zinc-300">Context: </strong>
                              {kw.context}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-500">No keyword suggestions available.</p>
                      )}
                    </div>
                  </div>

                  {/* Re-organized Skill Matrix */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Optimized Skill Categorization
                    </h4>
                    
                    <div className="space-y-4">
                      {result.optimizedSkills?.technicalSkills?.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                            Technical Skills
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {result.optimizedSkills.technicalSkills.map((s, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.optimizedSkills?.frameworksAndLibraries?.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                            Frameworks & Libraries
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {result.optimizedSkills.frameworksAndLibraries.map((s, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border border-blue-200/60 dark:border-blue-900/40"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.optimizedSkills?.toolsAndCloud?.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                            Tools & Cloud
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {result.optimizedSkills.toolsAndCloud.map((s, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 border border-purple-200/60 dark:border-purple-900/40"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.optimizedSkills?.softSkills?.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                            Soft Skills
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {result.optimizedSkills.softSkills.map((s, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-900/40"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.optimizedSkills?.languages?.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                            Languages
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {result.optimizedSkills.languages.map((s, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-amber-900/40"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ATS IMPROVEMENTS & WARNINGS */}
              {activeTab === "ats" && (
                <div className="space-y-6">
                  <SectionHeader
                    icon={Target}
                    title="ATS Format Improvements & Warnings"
                    subtitle="Ensure high parser readability, clean section labeling, and metric verification."
                  />

                  {/* ATS Improvements Card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xs">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ATS Compatibility Upgrades
                    </h4>
                    <ul className="space-y-2.5 pt-1">
                      {result.atsImprovements?.length > 0 ? (
                        result.atsImprovements.map((imp, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                            <span className="leading-relaxed">{imp}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-zinc-500">No specific ATS improvements identified.</li>
                      )}
                    </ul>
                  </div>

                  {/* Verification Warnings Card */}
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 rounded-2xl p-5 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                      <ShieldAlert className="w-5 h-5 shrink-0" />
                      <h4 className="text-sm font-bold">Candidate Verification Warnings</h4>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Review these notes before using the suggested rewrites to ensure 100% factual accuracy:
                    </p>
                    <ul className="space-y-2 pt-1">
                      {result.warnings?.length > 0 ? (
                        result.warnings.map((warn, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-xs sm:text-sm text-amber-900 dark:text-amber-200"
                          >
                            <span className="font-bold text-amber-600 mt-0.5">•</span>
                            <span className="leading-relaxed">{warn}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-zinc-500">
                          Verify all metrics match your actual career milestones.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 6: IDENTIFIED GAPS */}
              {activeTab === "gaps" && (
                <div className="space-y-6">
                  <SectionHeader
                    icon={AlertTriangle}
                    title="Identified Job Requirement Gaps"
                    subtitle="Requirements from the job description not evidenced in your resume. These are highlighted as gaps rather than fabricated."
                  />

                  {result.identifiedGaps?.length > 0 ? (
                    <div className="space-y-4">
                      {result.identifiedGaps.map((gap: IdentifiedGap, idx: number) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                              {gap.requirement}
                            </h4>
                            {getGapSeverityBadge(gap.severity)}
                          </div>

                          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl text-xs text-zinc-600 dark:text-zinc-400">
                            <strong className="text-zinc-700 dark:text-zinc-300">Resume Evidence: </strong>
                            {gap.resumeEvidence || "None detected on resume."}
                          </div>

                          <div className="flex items-start gap-2 text-xs sm:text-sm text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                            <div className="leading-relaxed">
                              <strong className="font-semibold">Actionable Recommendation: </strong>
                              {gap.recommendation}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        No critical gaps found!
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Your resume contains direct or transferable coverage for all major job requirements.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: AUDIT LOG (ALL CHANGES) */}
              {activeTab === "changes" && (
                <div className="space-y-6">
                  <SectionHeader
                    icon={Layers}
                    title="Complete Change Audit Log"
                    subtitle="Detailed record of every rephrase, verb enhancement, and ATS optimization."
                  />

                  {result.changes?.length > 0 ? (
                    <div className="space-y-4">
                      {result.changes.map((change: SuggestedChange, idx: number) => (
                        <ComparisonCard
                          key={idx}
                          title={change.title}
                          originalText={change.originalText}
                          suggestedText={change.suggestedText}
                          reason={change.reason}
                          confidence={change.confidence}
                          badgeLabel={change.section}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">No individual change records available.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
