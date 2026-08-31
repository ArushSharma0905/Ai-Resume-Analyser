"use client";

import React from "react";
import {
  MapPin,
  Building2,
  DollarSign,
  ExternalLink,
  Clock,
  Laptop,
  Loader2,
  Target,
} from "lucide-react";
import { Job } from "@/lib/types/job";
import type { ParsedResume } from "@/lib/types/resume";

interface JobCardProps {
  job: Job;
  parsedResume?: ParsedResume | null;
  onAnalyzeMatch?: (job: Job) => void;
  isMatching?: boolean;
  matchingJobId?: string | null;
}


function formatSalary(job: Job): string | null {
  if (!job.salaryMin && !job.salaryMax) return null;
  const currency = job.salaryCurrency === "USD" ? "$" : job.salaryCurrency || "$";
  const period = job.salaryPeriod ? `/${job.salaryPeriod}` : "";

  const formatNum = (n: number) => {
    if (n >= 1000) {
      return `${Math.round(n / 1000)}k`;
    }
    return n.toLocaleString();
  };

  if (job.salaryMin && job.salaryMax) {
    return `${currency}${formatNum(job.salaryMin)} - ${currency}${formatNum(job.salaryMax)}${period}`;
  }
  if (job.salaryMin) {
    return `From ${currency}${formatNum(job.salaryMin)}${period}`;
  }
  if (job.salaryMax) {
    return `Up to ${currency}${formatNum(job.salaryMax)}${period}`;
  }
  return null;
}

function formatPostedDate(dateStr?: string | null): string {
  if (!dateStr) return "Recently posted";
  try {
    const posted = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return posted.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recently posted";
  }
}

export default function JobCard({ job, parsedResume, onAnalyzeMatch, isMatching, matchingJobId }: JobCardProps) {
  const salaryString = formatSalary(job);
  const isMock = job.provider === "mock";
  const isThisJobMatching = isMatching && matchingJobId === job.id;
  const canAnalyzeMatch = !!parsedResume && !!onAnalyzeMatch;


  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-800/80 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Header Badges & Provider Info */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {job.isRemote ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50">
                <Laptop className="w-3 h-3" />
                Remote
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <MapPin className="w-3 h-3" />
                On-site
              </span>
            )}

            {job.employmentType && (
              <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50">
                {job.employmentType}
              </span>
            )}

            {job.experienceLevel && job.experienceLevel !== "all" && (
              <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/50 dark:border-purple-900/50">
                {job.experienceLevel}
              </span>
            )}
          </div>

          {isMock && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
              Demo
            </span>
          )}
        </div>

        {/* Job Title & Company */}
        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {job.title}
        </h3>

        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
          <div className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>{job.company}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>{job.location}</span>
          </div>
        </div>

        {/* Salary when available */}
        {salaryString && (
          <div className="flex items-center gap-1 mt-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-3.5 h-3.5 shrink-0" />
            <span>{salaryString}</span>
          </div>
        )}

        {/* Short Description */}
        <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
          {job.description}
        </p>

        {/* Tags */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3.5">
            {job.tags.slice(0, 5).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[11px] font-medium"
              >
                {tag}
              </span>
            ))}
            {job.tags.length > 5 && (
              <span className="px-1.5 py-0.5 text-zinc-400 text-[11px]">
                +{job.tags.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer / Application Link */}
      <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 text-zinc-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatPostedDate(job.postedDate)}</span>
        </div>

        <div className="flex items-center gap-2.5">
          {canAnalyzeMatch && (
            <button
              type="button"
              onClick={() => onAnalyzeMatch?.(job)}
              disabled={isThisJobMatching}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Analyze match with your resume"
            >
              {isThisJobMatching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Target className="w-3.5 h-3.5" />
              )}
              <span className="text-xs">
                {isThisJobMatching ? "Analyzing..." : "Analyze Match"}
              </span>
            </button>
          )}

          <a
            href={job.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <span>Apply</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

