"use client";

import React from "react";
import Link from "next/link";
import {
  FileCheck2,
  Sparkles,
  BarChart3,
  Briefcase,
  Target,
  Wand2,
  UploadCloud,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Bookmark,
  LogIn,
  UserPlus,
  ExternalLink,
} from "lucide-react";
import type { ResumeAnalysisResult } from "@/lib/types/resume";
import type { Job } from "@/lib/types/job";
import type { MatchResult } from "@/lib/types/match";
import type { ResumeOptimizationResult } from "@/lib/types/optimization";
import type { SavedJobRow } from "@/lib/db/types";
import type { NavTab } from "@/components/layout/Navbar";
import { useAuth } from "@/lib/context/AuthContext";

export interface SessionMatchItem {
  job: Job;
  matchResult: MatchResult;
  analyzedAt: string;
}

interface DashboardHomeProps {
  analysisResult: ResumeAnalysisResult | null;
  sessionMatches: SessionMatchItem[];
  optimizationResult: ResumeOptimizationResult | null;
  optimizingJob: Job | null;
  savedJobs?: SavedJobRow[];
  onSelectTab: (tab: NavTab) => void;
  onViewMatch: (job: Job, matchResult: MatchResult) => void;
  onOptimizeJob: (job: Job, matchResult?: MatchResult) => void;
  onRemoveSavedJob?: (jobId: string) => void;
}

function getScoreBadge(score: number) {
  if (score >= 80) {
    return {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200 dark:border-emerald-800/50",
      label: "Strong Match",
    };
  }
  if (score >= 65) {
    return {
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200 dark:border-blue-800/50",
      label: "Good Match",
    };
  }
  if (score >= 45) {
    return {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200 dark:border-amber-800/50",
      label: "Moderate Fit",
    };
  }
  return {
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800/50",
    label: "Low Fit",
  };
}

export default function DashboardHome({
  analysisResult,
  sessionMatches,
  optimizationResult,
  optimizingJob,
  savedJobs = [],
  onSelectTab,
  onViewMatch,
  onOptimizeJob,
  onRemoveSavedJob,
}: DashboardHomeProps) {
  const { user, profile } = useAuth();

  const hasResume = !!analysisResult?.parsedResume;
  const atsReport = analysisResult?.atsScoreReport;
  const parsed = analysisResult?.parsedResume;

  // Personalized user greeting
  const greetingName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    parsed?.contact?.name ||
    user?.email?.split("@")[0] ||
    "Candidate";

  // Calculate highest match score from session/saved
  const bestMatch =
    sessionMatches.length > 0
      ? [...sessionMatches].sort(
          (a, b) => b.matchResult.overallScore - a.matchResult.overallScore
        )[0]
      : null;

  return (
    <div className="space-y-8 py-4 sm:py-6">
      {/* ================================================================ */}
      {/* 1. WELCOME BANNER (Personalized & Authenticated Aware)            */}
      {/* ================================================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-bold tracking-wide backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {user ? "Cloud Synced Profile" : "Guest Mode Overview"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {user
                ? `Welcome back, ${greetingName}!`
                : hasResume
                ? `Welcome, ${parsed?.contact?.name || "Candidate"}!`
                : "Welcome to ResumeAI Career Suite"}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              {hasResume
                ? `Your profile is active for ${
                    parsed?.targetRoleOrTitle || "your target role"
                  } with ${
                    parsed?.totalYearsExperience || 0
                  } years estimated experience.`
                : user
                ? "Upload your resume below to store your ATS diagnostics, tailored rewrites, and job compatibility in your personal account."
                : "Upload your resume to unlock real-time ATS scoring, live job matching compatibility, and tailored resume optimization."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {hasResume ? (
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab("analyzer")}
                  className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  View ATS Scorecard
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab("jobs")}
                  className="px-4 py-2.5 bg-blue-700/60 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all cursor-pointer"
                >
                  Find Matching Jobs
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onSelectTab("analyzer")}
                className="px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload & Analyze Resume</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Guest Invitation Banner if unauthenticated */}
      {!user && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Want to save your resume and job matches permanently?
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Create a free account to securely store your ATS scorecards, saved jobs, and tailored optimizations across devices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </Link>
            <Link
              href="/signup"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up Free</span>
            </Link>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 2. CORE STATUS METRICS GRID (Real Statistics, Zero Hallucinations)*/}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Resume Profile */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Resume Profile
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>

          {hasResume ? (
            <div>
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-50 truncate">
                {parsed?.contact?.name || "Active Resume"}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">
                {parsed?.targetRoleOrTitle || "General Role"}
              </p>
              <div className="flex items-center gap-2 mt-3 text-[11px] text-zinc-600 dark:text-zinc-400">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {parsed?.totalYearsExperience} yrs exp
                </span>
                <span>•</span>
                <span>
                  {(parsed?.skills?.technicalSkills?.length || 0) +
                    (parsed?.skills?.frameworksAndLibraries?.length || 0)}{" "}
                  skills
                </span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                No Resume Uploaded
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Upload in PDF, DOCX, or TXT to extract profile.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => onSelectTab("analyzer")}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer pt-2 border-t border-zinc-100 dark:border-zinc-800"
          >
            <span>{hasResume ? "View Parsed Profile" : "Upload Resume"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Metric 2: ATS Scorecard */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              ATS Quality Score
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>

          {atsReport ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                  {atsReport.overallScore}
                </span>
                <span className="text-xs text-zinc-400 font-semibold">
                  / 100
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                {atsReport.summary || "ATS evaluation complete."}
              </p>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" />
                  {atsReport.keyStrengths?.length || 0} strengths
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  {atsReport.criticalImprovements?.length || 0} fixes
                </span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                Score Pending
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Scorecard unlocks once resume is analyzed.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => onSelectTab("analyzer")}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer pt-2 border-t border-zinc-100 dark:border-zinc-800"
          >
            <span>
              {atsReport ? "Review Score Breakdown" : "Run ATS Diagnostic"}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Metric 3: Best Job Match */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Top Compatibility
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>

          {bestMatch ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
                  {bestMatch.matchResult.overallScore}%
                </span>
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  {bestMatch.matchResult.recommendation}
                </span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold mt-1 truncate">
                {bestMatch.job.title}
              </p>
              <p className="text-[11px] text-zinc-500 truncate">
                {bestMatch.job.company}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                No Job Matches Run
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Analyze a job from Job Search to calculate compatibility.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              onSelectTab(sessionMatches.length > 0 ? "matches" : "jobs")
            }
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 inline-flex items-center gap-1 cursor-pointer pt-2 border-t border-zinc-100 dark:border-zinc-800"
          >
            <span>
              {sessionMatches.length > 0
                ? `View ${sessionMatches.length} Matches`
                : "Search Jobs to Match"}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Metric 4: Optimization Hub & Saved Jobs */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Optimizer & Saved
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
          </div>

          {optimizationResult && optimizingJob ? (
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                Optimization Ready
              </span>
              <p className="text-xs text-zinc-800 dark:text-zinc-200 font-semibold mt-1 truncate">
                Tailored for {optimizingJob.title}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                {optimizationResult.changes?.length || 0} suggested changes
                {savedJobs.length > 0 && ` • ${savedJobs.length} saved jobs`}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                {savedJobs.length > 0
                  ? `${savedJobs.length} Bookmarked Jobs`
                  : "Ready to Tailor"}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {savedJobs.length > 0
                  ? "Saved in your personal database."
                  : "Select a matched job to generate non-hallucinatory rewrites."}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => onSelectTab("optimizer")}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 inline-flex items-center gap-1 cursor-pointer pt-2 border-t border-zinc-100 dark:border-zinc-800"
          >
            <span>
              {optimizationResult ? "Open Optimizer" : "Explore Optimizer"}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. QUICK ACTIONS BAR                                             */}
      {/* ================================================================ */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Quick Career Actions
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Direct shortcuts to the core features of the ResumeAI platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <button
            type="button"
            onClick={() => onSelectTab("analyzer")}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {hasResume ? "Re-Analyze Resume" : "Upload New Resume"}
            </h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Extract facts, technical skills, and 0-100 ATS scorecard.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("jobs")}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              Discover Live Jobs
            </h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Search by title, location, remote status, and experience level.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              onSelectTab(sessionMatches.length > 0 ? "matches" : "jobs")
            }
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Target className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400">
              Calculate Job Match
            </h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Analyze matched vs missing skills and fit assessment.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("optimizer")}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Wand2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              Optimize Resume
            </h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Generate non-hallucinating ATS rewrites and bullet points.
            </p>
          </button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 4. SAVED JOBS SECTION (If any saved in Supabase)                 */}
      {/* ================================================================ */}
      {savedJobs.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Bookmarked Jobs ({savedJobs.length})
                </h3>
                <p className="text-xs text-zinc-500">
                  Positions saved in your account for quick access.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {savedJobs.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-800 flex flex-col justify-between space-y-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                    {item.job_data.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                    {item.job_data.company} • {item.job_data.location}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50">
                  <a
                    href={item.job_data.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Apply</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {onRemoveSavedJob && (
                    <button
                      type="button"
                      onClick={() => onRemoveSavedJob(item.job_id)}
                      className="text-[11px] text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 5. RECENT ANALYZED MATCHES SECTION                               */}
      {/* ================================================================ */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Analyzed Job Matches
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Jobs evaluated for resume compatibility.
            </p>
          </div>

          {sessionMatches.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectTab("matches")}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer"
            >
              View all ({sessionMatches.length})
            </button>
          )}
        </div>

        {sessionMatches.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {sessionMatches.slice(0, 5).map((item, idx) => {
              const badge = getScoreBadge(item.matchResult.overallScore);
              return (
                <div
                  key={idx}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.job.title}
                      </h4>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {item.matchResult.overallScore}% Match
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {item.job.company} • {item.job.location} •{" "}
                      {item.matchResult.recommendation}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => onViewMatch(item.job, item.matchResult)}
                      className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      View Report
                    </button>
                    <button
                      type="button"
                      onClick={() => onOptimizeJob(item.job, item.matchResult)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Optimize</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
            <Target className="w-8 h-8 text-zinc-400 mx-auto" />
            <div className="max-w-sm mx-auto">
              <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                No job matches analyzed yet
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Explore available listings in Job Search and click &ldquo;Analyze Match&rdquo; to evaluate your fit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab("jobs")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Browse Job Listings</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
