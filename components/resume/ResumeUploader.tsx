"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  AlertCircle,
  Loader2,
  X,
  FileCode2,
  Sparkles,
  ClipboardPaste,
} from "lucide-react";
import type { ResumeAnalysisResult } from "@/lib/types/resume";

interface ResumeUploaderProps {
  onAnalysisSuccess: (result: ResumeAnalysisResult) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const SAMPLE_RESUME = `Alex Rivera
San Francisco, CA • alex.rivera@example.com • (555) 234-5678
LinkedIn: linkedin.com/in/alex-rivera-demo • GitHub: github.com/alexrivera-demo • Portfolio: alexrivera.dev

PROFESSIONAL SUMMARY
Senior Full-Stack Engineer with 6+ years of experience architecting high-scale web platforms and cloud infrastructure. Specialized in TypeScript, React, Next.js, Node.js, and PostgreSQL. Proven track record of improving application performance by 45% and leading cross-functional teams to deliver enterprise SaaS applications serving 500k+ monthly active users.

TECHNICAL SKILLS
• Languages: TypeScript, JavaScript, Python, SQL, HTML5, CSS3
• Frameworks & Libraries: React, Next.js, Node.js, Express, Tailwind CSS, Redux Toolkit, Prisma, GraphQL
• Cloud & Tools: AWS (S3, Lambda, CloudFront), Docker, Kubernetes, PostgreSQL, Redis, Git, CI/CD (GitHub Actions), Jest, Vitest
• Core Competencies: System Architecture, RESTful API Design, Microservices, Performance Optimization, Agile/Scrum

WORK EXPERIENCE
Senior Software Engineer | CloudScale Tech | San Francisco, CA
June 2022 - Present
• Architected and migrated a monolithic Rails application to a microservices architecture using Next.js, Node.js, and PostgreSQL, reducing latency by 42% for 500k+ active users.
• Spearheaded frontend performance optimization across 12 core product pages, reducing Largest Contentful Paint (LCP) by 1.4s and improving SEO scores from 68 to 98.
• Implemented automated CI/CD deployment pipelines using GitHub Actions and Docker, cutting deployment cycle times from 45 minutes to under 8 minutes.
• Mentored 5 junior and mid-level engineers through code reviews, 1-on-1s, and technical onboarding sessions.

Software Engineer | Apex Digital Solutions | San Jose, CA
August 2019 - May 2022
• Developed real-time collaborative workspace features using React, WebSockets, and Redis, driving a 30% increase in daily active user engagement.
• Designed and maintained 25+ RESTful and GraphQL endpoints consumed by web and mobile client applications.
• Optimized complex SQL queries and database indexes in PostgreSQL, cutting average query execution time from 420ms to 65ms.
• Collaborated with product managers and UX designers in bi-weekly sprints to ship 14 major feature releases on schedule.

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | 2015 - 2019
• GPA: 3.8 / 4.0 (Dean's Honors List)
• Coursework: Data Structures, Algorithms, Distributed Systems, Database Systems, Computer Networks

PROJECTS
• AI Task Automation Platform (github.com/alexrivera-demo/ai-taskflow)
  - Built full-stack Next.js 15 application integrating LLM workflow automation with vector search in Pinecone.
  - Implemented secure JWT authentication and Stripe subscription billing; gained 1,200+ registered users in 3 months.
• Open Source State Management Utility (github.com/alexrivera-demo/tiny-state)
  - Authored a lightweight 1.2kB reactive state manager with 100% test coverage and 450+ GitHub stars.

CERTIFICATIONS
• AWS Certified Solutions Architect – Associate (Amazon Web Services, 2023)`;

export default function ResumeUploader({
  onAnalysisSuccess,
  isLoading,
  setIsLoading,
}: ResumeUploaderProps) {
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    const validExtensions = ["pdf", "docx", "txt", "md"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    if (!validExtensions.includes(ext)) {
      setError("Please select a valid PDF, DOCX, or TXT file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size cannot exceed 10MB.");
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleLoadSample = () => {
    setActiveTab("paste");
    setPastedText(SAMPLE_RESUME);
    setError(null);
  };

  const handleAnalyze = async () => {
    setError(null);
    setIsLoading(true);
    setLoadingStep("Reading document...");

    try {
      const formData = new FormData();

      if (activeTab === "file") {
        if (!selectedFile) {
          setError("Please select a file to upload.");
          setIsLoading(false);
          return;
        }
        formData.append("file", selectedFile);
      } else {
        if (!pastedText.trim() || pastedText.trim().length < 50) {
          setError("Please enter at least 50 characters of resume text.");
          setIsLoading(false);
          return;
        }
        formData.append("text", pastedText.trim());
      }

      setLoadingStep("Extracting text and consulting Gemini AI...");

      const response = await fetch("/api/resume/analyze", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to analyze resume.");
      }

      setLoadingStep("Validating ATS analysis...");
      onAnalysisSuccess(result.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between mb-6">
        <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab("file");
              setError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "file"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("paste");
              setError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === "paste"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            Paste Text
          </button>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Load Sample Resume
        </button>
      </div>

      {/* Tab 1: Upload File */}
      {activeTab === "file" && (
        <div>
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                  : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-800/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                PDF, DOCX, or TXT (Max file size: 10MB)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-3 truncate">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                disabled={isLoading}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition-colors"
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Paste Text */}
      {activeTab === "paste" && (
        <div>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            disabled={isLoading}
            placeholder="Paste your full resume text here (including contact info, experience, skills, and education)..."
            rows={10}
            className="w-full p-4 text-sm font-mono bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-zinc-800 dark:text-zinc-200 resize-y"
          />
          <div className="flex justify-between items-center mt-2 text-xs text-zinc-500">
            <span>Minimum 50 characters required</span>
            <span>{pastedText.length} characters</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Analysis Failed</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-6 flex flex-col items-center">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isLoading || (activeTab === "file" && !selectedFile) || (activeTab === "paste" && pastedText.trim().length < 50)}
          className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{loadingStep || "Analyzing..."}</span>
            </>
          ) : (
            <>
              <FileCode2 className="w-4 h-4" />
              <span>Analyze Resume & Generate ATS Score</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
