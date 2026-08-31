"use client";

import React, { useState } from "react";
import {
  Search,
  MapPin,
  Laptop,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { JobSearchFilters as FilterType, EmploymentType, ExperienceLevel } from "@/lib/types/job";
import type { ParsedResume } from "@/lib/types/resume";

interface JobSearchFiltersProps {
  initialFilters: FilterType;
  onFilterChange: (filters: FilterType) => void;
  parsedResume?: ParsedResume | null;
  isLoading?: boolean;
}

export default function JobSearchFilters({
  initialFilters,
  onFilterChange,
  parsedResume,
  isLoading,
}: JobSearchFiltersProps) {
  const [query, setQuery] = useState(initialFilters.query || "");
  const [location, setLocation] = useState(initialFilters.location || "");
  const [isRemote, setIsRemote] = useState<boolean>(initialFilters.isRemote || false);
  const [employmentType, setEmploymentType] = useState<EmploymentType | "all">(
    initialFilters.employmentType || "all"
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "all">(
    initialFilters.experienceLevel || "all"
  );

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onFilterChange({
      query: query.trim() || undefined,
      location: location.trim() || undefined,
      isRemote: isRemote ? true : undefined,
      employmentType,
      experienceLevel,
      page: 1, // Reset to page 1 on new filter search
    });
  };

  const handleReset = () => {
    setQuery("");
    setLocation("");
    setIsRemote(false);
    setEmploymentType("all");
    setExperienceLevel("all");
    onFilterChange({
      query: undefined,
      location: undefined,
      isRemote: undefined,
      employmentType: "all",
      experienceLevel: "all",
      page: 1,
    });
  };

  const handleApplyResumeSuggestion = () => {
    if (!parsedResume) return;
    const targetTitle = parsedResume.targetRoleOrTitle || "";
    const topSkills = (parsedResume.skills.technicalSkills || []).slice(0, 3).join(" ");
    const suggested = `${targetTitle} ${topSkills}`.trim();

    setQuery(suggested);
    onFilterChange({
      query: suggested,
      location: location.trim() || undefined,
      isRemote: isRemote ? true : undefined,
      employmentType,
      experienceLevel,
      page: 1,
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Resume Quick Fill Suggestion if available */}
      {parsedResume && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              <strong>Resume Match:</strong> {parsedResume.targetRoleOrTitle}
              {parsedResume.skills.technicalSkills?.length > 0 && (
                <span className="text-blue-700 dark:text-blue-300 ml-1">
                  ({parsedResume.skills.technicalSkills.slice(0, 3).join(", ")})
                </span>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={handleApplyResumeSuggestion}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer shrink-0 text-center"
          >
            Search Based on Resume
          </button>
        </div>
      )}

      {/* Main Search Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Query Input */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Job title, keywords, or skills (e.g. Next.js, Full-Stack)..."
              className="w-full pl-10 pr-9 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Location Input */}
          <div className="md:col-span-4 relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, state, or country..."
              className="w-full pl-10 pr-9 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {location && (
              <button
                type="button"
                onClick={() => setLocation("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Remote Only Toggle */}
            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <input
                type="checkbox"
                checked={isRemote}
                onChange={(e) => {
                  setIsRemote(e.target.checked);
                }}
                className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                <Laptop className="w-3.5 h-3.5 text-zinc-500" />
                Remote Only
              </span>
            </label>

            {/* Employment Type */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 font-medium">Type:</span>
              <select
                value={employmentType}
                onChange={(e) => {
                  setEmploymentType(e.target.value as EmploymentType | "all");
                }}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            {/* Experience Level */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 font-medium">Level:</span>
              <select
                value={experienceLevel}
                onChange={(e) => {
                  setExperienceLevel(e.target.value as ExperienceLevel | "all");
                }}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead / Staff</option>
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </form>
    </div>
  );
}
