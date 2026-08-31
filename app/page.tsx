"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  Sparkles,
  RotateCcw,
  BarChart3,
  UserCheck,
  ShieldCheck,
  Zap,
  Target,
  Briefcase,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ResumeUploader from "@/components/resume/ResumeUploader";
import AtsScoreCard from "@/components/resume/AtsScoreCard";
import ParsedResumeView from "@/components/resume/ParsedResumeView";
import JobSearchFiltersComponent from "@/components/jobs/JobSearchFilters";
import JobCard from "@/components/jobs/JobCard";
import MatchResultView from "@/components/jobs/MatchResultView";
import ResumeOptimizerView from "@/components/resume/ResumeOptimizerView";
import type { ResumeAnalysisResult } from "@/lib/types/resume";
import type { Job, JobSearchFilters as FilterType, JobSearchResult } from "@/lib/types/job";
import type { MatchResult } from "@/lib/types/match";
import type { ResumeOptimizationResult } from "@/lib/types/optimization";

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"ats" | "profile" | "jobs">("ats");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Job Search States
  const [viewMode, setViewMode] = useState<"analyzer" | "jobs">("analyzer");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState<boolean>(false);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterType>({
    query: "",
    location: "",
    isRemote: undefined,
    employmentType: "all",
    experienceLevel: "all",
    page: 1,
    pageSize: 6,
  });
  const [searchResult, setSearchResult] = useState<JobSearchResult | null>(null);

  // Phase 3: AI Job Matching States
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchedJob, setMatchedJob] = useState<Job | null>(null);
  const [matchingJobId, setMatchingJobId] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  // Phase 4: AI Resume Optimizer States
  const [optimizationResult, setOptimizationResult] = useState<ResumeOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState<boolean>(false);
  const [optimizingJob, setOptimizingJob] = useState<Job | null>(null);

  const handleReset = () => {
    setAnalysisResult(null);
    setActiveTab("ats");
    setMatchResult(null);
    setMatchedJob(null);
    setOptimizationResult(null);
    setIsOptimizerOpen(false);
    setOptimizingJob(null);
    setOptimizationError(null);
  };

  // Phase 3: Analyze match between resume and a specific job
  const handleAnalyzeMatch = async (job: Job) => {
    if (!analysisResult?.parsedResume) return;

    setMatchingJobId(job.id);
    setMatchError(null);
    setMatchResult(null);
    setMatchedJob(job);

    try {
      const response = await fetch("/api/jobs/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: analysisResult.parsedResume,
          job: job,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to analyze job match.");
      }

      setMatchResult(result.data);
    } catch (err: unknown) {
      console.error("Error analyzing match:", err);
      setMatchError(
        err instanceof Error ? err.message : "An unexpected error occurred during match analysis."
      );
    } finally {
      setMatchingJobId(null);
    }
  };

  // Phase 4: Optimize Resume for a specific target job
  const handleOptimizeResume = async (job: Job, currentMatch?: MatchResult | null) => {
    if (!analysisResult?.parsedResume) return;

    setIsOptimizing(true);
    setOptimizationError(null);
    setOptimizationResult(null);
    setOptimizingJob(job);
    setIsOptimizerOpen(true);

    try {
      const response = await fetch("/api/resume/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: analysisResult.parsedResume,
          job: job,
          matchResult: currentMatch || matchResult || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate resume optimization.");
      }

      setOptimizationResult(data.data);
    } catch (err: unknown) {
      console.error("Error optimizing resume:", err);
      setOptimizationError(
        err instanceof Error ? err.message : "An unexpected error occurred during resume optimization."
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  // Fetch jobs effect
  useEffect(() => {
    let ignore = false;
    if (viewMode === "jobs" || activeTab === "jobs") {
      const loadJobs = async () => {
        setJobsLoading(true);
        setJobsError(null);
        try {
          const params = new URLSearchParams();
          if (filters.query) params.append("query", filters.query);
          if (filters.location) params.append("location", filters.location);
          if (filters.isRemote !== undefined) params.append("remote", filters.isRemote ? "true" : "false");
          if (filters.employmentType && filters.employmentType !== "all") {
            params.append("employmentType", filters.employmentType);
          }
          if (filters.experienceLevel && filters.experienceLevel !== "all") {
            params.append("experienceLevel", filters.experienceLevel);
          }
          params.append("page", (filters.page || 1).toString());
          params.append("pageSize", (filters.pageSize || 6).toString());

          const response = await fetch(`/api/jobs/search?${params.toString()}`);
          if (!response.ok) {
            throw new Error("Failed to fetch jobs");
          }
          const data = await response.json();
          if (!ignore) {
            if (data.success && data.data) {
              setJobs(data.data.jobs || []);
              setSearchResult(data.data);
            } else {
              throw new Error(data.error || "Failed to parse job results");
            }
          }
        } catch (err: unknown) {
          if (!ignore) {
            console.error("Error fetching jobs:", err);
            setJobsError(err instanceof Error ? err.message : "An unexpected error occurred while searching for jobs.");
          }
        } finally {
          if (!ignore) {
            setJobsLoading(false);
          }
        }
      };
      loadJobs();
    }
    return () => {
      ignore = true;
    };
  }, [filters, viewMode, activeTab]);

  const handleFilterChange = (newFilters: FilterType) => {
    setFilters(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const renderJobSearch = () => {
    return (
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto mb-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Search Available Positions
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Explore and filter career opportunities using our provider-independent search engine.
          </p>
        </div>

        <JobSearchFiltersComponent
          initialFilters={filters}
          onFilterChange={handleFilterChange}
          parsedResume={analysisResult?.parsedResume}
          isLoading={jobsLoading}
        />

        {jobsError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded-2xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{jobsError}</p>
          </div>
        )}

        {matchError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 rounded-2xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{matchError}</p>
          </div>
        )}

        {jobsLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Searching for matched jobs...
            </p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
            <Briefcase className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">No jobs found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
              We couldn&apos;t find any job listings matching your search filters. Try resetting the filters or modifying your query.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  parsedResume={analysisResult?.parsedResume}
                  onAnalyzeMatch={handleAnalyzeMatch}
                  isMatching={matchingJobId !== null}
                  matchingJobId={matchingJobId}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {searchResult && searchResult.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-6">
                <p className="text-xs text-zinc-500 font-medium">
                  Showing {(searchResult.currentPage - 1) * searchResult.pageSize + 1} to{" "}
                  {Math.min(
                    searchResult.currentPage * searchResult.pageSize,
                    searchResult.totalJobs
                  )}{" "}
                  of {searchResult.totalJobs} jobs
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={searchResult.currentPage <= 1 || jobsLoading}
                    onClick={() => handlePageChange(searchResult.currentPage - 1)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-transparent text-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 px-2">
                    {searchResult.currentPage} / {searchResult.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={searchResult.currentPage >= searchResult.totalPages || jobsLoading}
                    onClick={() => handlePageChange(searchResult.currentPage + 1)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:hover:bg-transparent text-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base text-zinc-900 dark:text-zinc-50 tracking-tight">
                  ResumeAI
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-medium text-zinc-500">
                  AI Resume Analyzer & ATS Scorecard
                </span>
              </div>
            </div>

            {/* View Mode Tabs in Header */}
            <nav className="hidden md:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode("analyzer")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  viewMode === "analyzer"
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Resume Analyzer
              </button>
              <button
                type="button"
                onClick={() => setViewMode("jobs")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  viewMode === "jobs"
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Job Search
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile View Switcher */}
            <div className="flex md:hidden bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode("analyzer")}
                className={`p-1.5 rounded-md ${
                  viewMode === "analyzer"
                    ? "bg-white dark:bg-zinc-900 text-blue-600"
                    : "text-zinc-500"
                }`}
                title="Analyzer"
              >
                <FileCheck2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("jobs")}
                className={`p-1.5 rounded-md ${
                  viewMode === "jobs"
                    ? "bg-white dark:bg-zinc-900 text-blue-600"
                    : "text-zinc-500"
                }`}
                title="Jobs"
              >
                <Briefcase className="w-4 h-4" />
              </button>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by Gemini
            </span>

            {analysisResult && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Upload New
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {viewMode === "jobs" ? (
          /* View 3: Independent Job Search */
          renderJobSearch()
        ) : !analysisResult ? (
          /* View 1: Upload & Intro */
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-4 border border-blue-200/50 dark:border-blue-800/50">
                <span>AI Career Suite</span>
                <span>•</span>
                <span>Resume Extraction, ATS Scoring, Job Match & Optimizer</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Unlock Real-Time ATS Insights for Your Resume
              </h1>
              <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
                Upload your resume in PDF or DOCX format to receive an objective ATS quality evaluation, quantifiable impact score, and structured skill breakdown powered by Gemini.
              </p>
            </div>

            {/* Resume Uploader Component */}
            <ResumeUploader
              onAnalysisSuccess={(data) => {
                setAnalysisResult(data);
                setActiveTab("ats");
              }}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
              <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  ATS Scorecard (0–100)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Objective grading across impact quantification, action verbs, structure, and keyword density.
                </p>
              </div>

              <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Skills & Tech Matrix
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Extracts and categorizes technical skills, libraries, tools, cloud infrastructure, and soft skills.
                </p>
              </div>

              <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  AI Job Match & Optimization
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Calculates compatibility against live job listings and delivers grounded resume optimizations.
                </p>
              </div>

              <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Zero Hallucination
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Strict schema-driven optimization guarantees no skills, employers, or metrics are fabricated.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* View 2: Analysis Results */
          <div className="space-y-8">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    {analysisResult.parsedResume.contact.name || "Candidate Profile"}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {analysisResult.parsedResume.targetRoleOrTitle} • Analyzed via Gemini
                  </p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("ats")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    activeTab === "ats"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  ATS Scorecard
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Parsed Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("jobs")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                    activeTab === "jobs"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Job Search
                </button>
              </div>
            </div>

            {/* Active Tab View */}
            {activeTab === "ats" ? (
              <AtsScoreCard report={analysisResult.atsScoreReport} />
            ) : activeTab === "profile" ? (
              <ParsedResumeView resume={analysisResult.parsedResume} />
            ) : (
              renderJobSearch()
            )}
          </div>
        )}
      </main>

      {/* Phase 3: AI Match Result Modal */}
      {matchResult && matchedJob && (
        <MatchResultView
          result={matchResult}
          job={matchedJob}
          onClose={() => {
            setMatchResult(null);
            setMatchedJob(null);
          }}
          onOptimize={() => handleOptimizeResume(matchedJob, matchResult)}
          isOptimizing={isOptimizing && optimizingJob?.id === matchedJob.id}
        />
      )}

      {/* Phase 4: AI Resume Optimizer Modal */}
      {isOptimizerOpen && optimizingJob && (
        <ResumeOptimizerView
          result={optimizationResult}
          job={optimizingJob}
          matchResult={matchResult}
          resume={analysisResult?.parsedResume}
          isLoading={isOptimizing}
          error={optimizationError}
          onClose={() => {
            setIsOptimizerOpen(false);
            setOptimizingJob(null);
            setOptimizationError(null);
          }}
          onRetry={() => handleOptimizeResume(optimizingJob, matchResult)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500">
        <p>AI Resume Analyzer & Optimizer • Powered by Gemini</p>
      </footer>
    </div>
  );
}
