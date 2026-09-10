"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileCheck2,
  Sparkles,
  BarChart3,
  UserCheck,
  Briefcase,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Zap,
  Target,
  ShieldCheck,
} from "lucide-react";
import Navbar, { type NavTab } from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LandingPage from "@/components/landing/LandingPage";
import DashboardHome, { type SessionMatchItem } from "@/components/dashboard/DashboardHome";
import MatchesView from "@/components/dashboard/MatchesView";
import OptimizerHubView from "@/components/dashboard/OptimizerHubView";
import PricingView from "@/components/dashboard/PricingView";
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
import type { SavedJobRow } from "@/lib/db/types";
import { useAuth } from "@/lib/context/AuthContext";
import { useSubscriptionStore } from "@/lib/subscriptions/subscription-store";
import {
  saveUserResumeAndAnalysis,
  getLatestUserResume,
} from "@/lib/db/resumes";
import {
  saveUserJobMatch,
  getUserJobMatches,
} from "@/lib/db/matches";
import {
  saveUserResumeOptimization,
  getLatestUserResumeOptimization,
} from "@/lib/db/optimizations";
import {
  saveUserJob,
  removeUserSavedJob,
  getUserSavedJobs,
} from "@/lib/db/saved-jobs";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { refresh: refreshSubscription } = useSubscriptionStore();

  // Refresh subscription status whenever the auth state changes
  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user, refreshSubscription]);

  const [currentTab, setCurrentTab] = useState<NavTab>("landing");
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [analyzerSubTab, setAnalyzerSubTab] = useState<"ats" | "profile">("ats");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [activeResumeDbId, setActiveResumeDbId] = useState<string | null>(null);

  // Saved Jobs State
  const [savedJobs, setSavedJobs] = useState<SavedJobRow[]>([]);

  // Job Search States
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

  // Phase 3: AI Job Matching States & Session History
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchedJob, setMatchedJob] = useState<Job | null>(null);
  const [matchingJobId, setMatchingJobId] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [sessionMatches, setSessionMatches] = useState<SessionMatchItem[]>([]);

  // Phase 4: AI Resume Optimizer States
  const [optimizationResult, setOptimizationResult] = useState<ResumeOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState<boolean>(false);
  const [optimizingJob, setOptimizingJob] = useState<Job | null>(null);

  // Load user data from Supabase when authenticated
  useEffect(() => {
    let isCancelled = false;

    if (!user) {
      return;
    }

    const loadUserData = async () => {
      try {
        // 1. Fetch latest saved resume and analysis
        const resumeData = await getLatestUserResume(user.id);
        if (!isCancelled && resumeData) {
          setActiveResumeDbId(resumeData.resume.id);
          setAnalysisResult({
            parsedResume: resumeData.resume.parsed_data,
            atsScoreReport: resumeData.analysis
              ? {
                  overallScore: resumeData.analysis.overall_score,
                  summary: resumeData.analysis.summary || "",
                  breakdown: resumeData.analysis.breakdown,
                  keyStrengths: resumeData.analysis.key_strengths || [],
                  criticalImprovements: resumeData.analysis.critical_improvements || [],
                  missingElements: resumeData.analysis.missing_elements || [],
                  detectedKeywords: resumeData.analysis.detected_keywords || [],
                  recommendedKeywords: resumeData.analysis.recommended_keywords || [],
                }
              : {
                  overallScore: 75,
                  summary: "Profile loaded from Supabase storage.",
                  breakdown: {
                    impactAndQuantification: { score: 75, title: "Impact", status: "good", feedback: [] },
                    actionVerbsAndLanguage: { score: 75, title: "Language", status: "good", feedback: [] },
                    structureAndCompleteness: { score: 75, title: "Structure", status: "good", feedback: [] },
                    skillsAndKeywords: { score: 75, title: "Keywords", status: "good", feedback: [] },
                  },
                  keyStrengths: [],
                  criticalImprovements: [],
                  missingElements: [],
                  detectedKeywords: [],
                  recommendedKeywords: [],
                },
            rawTextLength: resumeData.resume.raw_text_length || 0,
          });
        }

        // 2. Fetch saved job matches
        const matchesData = await getUserJobMatches(user.id);
        if (!isCancelled && matchesData && matchesData.length > 0) {
          setSessionMatches(
            matchesData.map((m) => ({
              job: m.job_data,
              matchResult: m.match_result,
              analyzedAt: m.created_at,
            }))
          );
        }

        // 3. Fetch saved bookmarked jobs
        const savedData = await getUserSavedJobs(user.id);
        if (!isCancelled && savedData) {
          setSavedJobs(savedData);
        }

        // 4. Fetch latest optimization
        const optData = await getLatestUserResumeOptimization(user.id);
        if (!isCancelled && optData) {
          setOptimizationResult(optData.optimization_result);
          if (optData.job_data) {
            setOptimizingJob(optData.job_data);
          }
        }
      } catch (err) {
        console.error("Error loading user data from Supabase:", err);
      }
    };

    loadUserData();

    return () => {
      isCancelled = true;
    };
  }, [user]);

  const handleReset = () => {
    setAnalysisResult(null);
    setActiveResumeDbId(null);
    setAnalyzerSubTab("ats");
    setMatchResult(null);
    setMatchedJob(null);
    setOptimizationResult(null);
    setIsOptimizerOpen(false);
    setOptimizingJob(null);
    setOptimizationError(null);
    setCurrentTab("analyzer");
  };

  // Called when ResumeUploader finishes analysis successfully
  const handleAnalysisSuccess = (data: ResumeAnalysisResult & { fileName?: string }) => {
    setAnalysisResult(data);
    setAnalyzerSubTab("ats");

    // Persist to Supabase if authenticated
    if (user) {
      saveUserResumeAndAnalysis(
        user.id,
        data,
        data.fileName || "Uploaded Resume"
      )
        .then((res) => {
          if (res?.resumeId) {
            setActiveResumeDbId(res.resumeId);
          }
        })
        .catch((err) => {
          console.error("Failed to persist resume to Supabase:", err);
        });
    }
  };

  // Phase 3: Analyze match between resume and a specific job
  const handleAnalyzeMatch = async (job: Job) => {
    if (!analysisResult?.parsedResume) {
      setCurrentTab("analyzer");
      return;
    }

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
        if (response.status === 429) {
          // Usage limit exceeded - set specific error and navigate to pricing
          setMatchError(result.error || "Monthly usage limit reached.");
          setCurrentTab("dashboard");
          return;
        }
        throw new Error(result.error || "Failed to analyze job match.");
      }

      const matchData: MatchResult = result.data;
      setMatchResult(matchData);

      // Record in session matches history
      setSessionMatches((prev) => {
        const filtered = prev.filter((m) => m.job.id !== job.id);
        return [
          {
            job,
            matchResult: matchData,
            analyzedAt: new Date().toISOString(),
          },
          ...filtered,
        ];
      });

      // Persist match to Supabase if authenticated
      if (user) {
        saveUserJobMatch(user.id, job, matchData, activeResumeDbId).catch(
          (err) => console.error("Failed to persist match to Supabase:", err)
        );
      }
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
    if (!analysisResult?.parsedResume) {
      setCurrentTab("analyzer");
      return;
    }

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
        if (response.status === 429) {
          // Usage limit exceeded - set specific error and navigate to dashboard
          setOptimizationError(
            data.error || "Monthly usage limit reached. Please upgrade your plan."
          );
          setIsOptimizerOpen(false);
          setCurrentTab("dashboard");
          return;
        }
        throw new Error(data.error || "Failed to generate resume optimization.");
      }

      const optData: ResumeOptimizationResult = data.data;
      setOptimizationResult(optData);

      // Persist optimization to Supabase if authenticated
      if (user) {
        saveUserResumeOptimization(
          user.id,
          job,
          optData,
          currentMatch || matchResult || null,
          activeResumeDbId
        ).catch((err) =>
          console.error("Failed to persist optimization to Supabase:", err)
        );
      }
    } catch (err: unknown) {
      console.error("Error optimizing resume:", err);
      setOptimizationError(
        err instanceof Error ? err.message : "An unexpected error occurred during resume optimization."
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  // Toggle saving a bookmarked job
  const handleToggleSaveJob = useCallback(
    async (job: Job) => {
      if (!user) {
        // Prompt guest user to sign in
        router.push(`/login?next=${encodeURIComponent("/?tab=jobs")}`);
        return;
      }

      const isAlreadySaved = savedJobs.some((s) => s.job_id === job.id);

      if (isAlreadySaved) {
        setSavedJobs((prev) => prev.filter((s) => s.job_id !== job.id));
        await removeUserSavedJob(user.id, job.id);
      } else {
        const optimisticRow: SavedJobRow = {
          id: `temp-${Date.now()}`,
          user_id: user.id,
          job_id: job.id,
          job_data: job,
          notes: null,
          status: "saved",
          created_at: new Date().toISOString(),
        };
        setSavedJobs((prev) => [optimisticRow, ...prev]);
        await saveUserJob(user.id, job);
      }
    },
    [user, savedJobs, router]
  );

  // Fetch jobs effect when Job Search tab is active or filters change
  useEffect(() => {
    let ignore = false;
    if (currentTab === "jobs") {
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
  }, [filters, currentTab]);

  const handleFilterChange = (newFilters: FilterType) => {
    setFilters(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Render Job Search View
  const renderJobSearch = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Live Job Discovery
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Explore positions across tech, engineering, design, and product with live AI match evaluation.
            </p>
          </div>

          {!analysisResult && (
            <button
              type="button"
              onClick={() => setCurrentTab("analyzer")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 rounded-xl text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Resume for Match Scores</span>
            </button>
          )}
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
                  isSaved={savedJobs.some((s) => s.job_id === job.id)}
                  onToggleSave={handleToggleSaveJob}
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

  // Render Resume Analyzer View
  const renderResumeAnalyzer = () => {
    if (!analysisResult) {
      return (
        <div className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-200/50 dark:border-blue-800/50">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time Resume Diagnostics & ATS Scorecard</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Upload Your Resume for AI Analysis
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Upload your document in PDF, DOCX, or TXT format. Receive an objective ATS score, quantifiable impact evaluation, and structured skill breakdown powered by Gemini.
            </p>
          </div>

                    <ResumeUploader
            onAnalysisSuccess={handleAnalysisSuccess}
            isLoading={isUploading}
            setIsLoading={setIsUploading}
            // Quota messages stay on the analyzer screen. Navigation to pricing
            // happens ONLY when the user explicitly clicks "View Plans".
            onViewPlans={() => {
              setCurrentTab("pricing");
            }}
          />

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-4">
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                0–100 ATS Scorecard
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Objective grading across impact quantification, action verbs, and structure.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Skill Group Matrix
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Extracts languages, frameworks, cloud tools, and soft skills into structured groups.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Actionable Fixes
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Highlights critical fixes, missing sections, and recommended industry keywords.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Zero Hallucination
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Strict schema validation ensures only facts present on your resume are extracted.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Candidate Profile Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                {analysisResult.parsedResume.contact.name || "Candidate Profile"}
              </h2>
              <p className="text-xs text-zinc-500">
                {analysisResult.parsedResume.targetRoleOrTitle} • Analyzed via Gemini Intelligence
                {activeResumeDbId && " • Synced"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sub-tab switcher */}
            <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => setAnalyzerSubTab("ats")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  analyzerSubTab === "ats"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>ATS Scorecard</span>
              </button>
              <button
                type="button"
                onClick={() => setAnalyzerSubTab("profile")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  analyzerSubTab === "profile"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Parsed Profile</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab("jobs")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Match Against Jobs</span>
            </button>
          </div>
        </div>

        {/* Sub-tab view */}
        {analyzerSubTab === "ats" ? (
          <AtsScoreCard report={analysisResult.atsScoreReport} />
        ) : (
          <ParsedResumeView resume={analysisResult.parsedResume} />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors">
      {/* Global SaaS Navigation Bar */}
      <Navbar
        activeTab={currentTab}
        onSelectTab={setCurrentTab}
        parsedResume={analysisResult?.parsedResume || null}
        onUploadNew={handleReset}
        matchesCount={sessionMatches.length}
      />

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentTab === "landing" && (
          <LandingPage
            onSelectTab={setCurrentTab}
            hasResume={!!analysisResult?.parsedResume}
          />
        )}

        {currentTab === "dashboard" && (
          <DashboardHome
            analysisResult={analysisResult}
            sessionMatches={sessionMatches}
            optimizationResult={optimizationResult}
            optimizingJob={optimizingJob}
            savedJobs={savedJobs}
            onSelectTab={setCurrentTab}
            onViewMatch={(job, res) => {
              setMatchedJob(job);
              setMatchResult(res);
            }}
            onOptimizeJob={(job, res) => handleOptimizeResume(job, res)}
            onRemoveSavedJob={(jobId) => handleToggleSaveJob({ id: jobId } as Job)}
          />
        )}

        {currentTab === "analyzer" && renderResumeAnalyzer()}

        {currentTab === "jobs" && renderJobSearch()}

        {currentTab === "matches" && (
          <MatchesView
            sessionMatches={sessionMatches}
            onViewMatch={(job, res) => {
              setMatchedJob(job);
              setMatchResult(res);
            }}
            onOptimizeJob={(job, res) => handleOptimizeResume(job, res)}
            onSelectTab={setCurrentTab}
          />
        )}

        {currentTab === "optimizer" && (
          <OptimizerHubView
            optimizationResult={optimizationResult}
            optimizingJob={optimizingJob}
            sessionMatches={sessionMatches}
            onOpenOptimizerModal={() => setIsOptimizerOpen(true)}
            onOptimizeJob={(job, res) => handleOptimizeResume(job, res)}
            onSelectTab={setCurrentTab}
          />
        )}

        {currentTab === "pricing" && <PricingView onSelectTab={setCurrentTab} />}
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

      {/* SaaS Global Footer */}
      <Footer onSelectTab={setCurrentTab} />
    </div>
  );
}
