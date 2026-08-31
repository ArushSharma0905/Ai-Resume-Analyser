import type { SkillGroup } from "./resume";

/**
 * PHASE 4: AI Resume Optimizer Types
 * ----------------------------------
 * These types describe the structured output of the resume-optimizer AI.
 * Every suggestion must be grounded in content that already exists on the
 * candidate's resume — no hallucinations.
 */

/** Which part of the resume a change targets. */
export type OptimizedSection =
  | "professionalSummary"
  | "workExperience"
  | "projects"
  | "skills"
  | "ats";

/** Confidence level for an individual suggested change. */
export type ChangeConfidence = "high" | "medium" | "low";

/** How severe a missing requirement is for the target job. */
export type GapSeverity = "critical" | "major" | "minor";

/**
 * A single, verifiable suggested change to resume content.
 * The AI must always provide the original text, the suggested text, and
 * a human-readable reason.  Nothing may be invented.
 */
export interface SuggestedChange {
  /** Logical section the change belongs to. */
  section: OptimizedSection;
  /** Short human-readable label, e.g. "Strengthen action verb for lead migration". */
  title: string;
  /** Verbatim text from the candidate's existing resume. */
  originalText: string;
  /** The improved wording (no new facts invented). */
  suggestedText: string;
  /** Explanation of why this change helps ATS or readability. */
  reason: string;
  /** AI's confidence that this change is sound. */
  confidence: ChangeConfidence;
}

/**
 * A keyword or skill term that could improve ATS matching.
 * `supportedByResume` is `true` only when the resume already contains
 * evidence that genuinely relates to the keyword.
 */
export interface KeywordSuggestion {
  /** The keyword / phrase to consider adding. */
  keyword: string;
  /** Where in the resume the keyword could be naturally incorporated. */
  context: string;
  /** Whether the resume already contains evidence supporting this keyword. */
  supportedByResume: boolean;
}

/**
 * A requirement from the job description that is NOT supported by the
 * candidate's resume.  Presented as a gap, not as something to fabricate.
 */
export interface IdentifiedGap {
  /** What the job asks for. */
  requirement: string;
  /** What the resume currently shows for this requirement. */
  resumeEvidence: string;
  /** How important the gap is. */
  severity: GapSeverity;
  /** Actionable advice for the candidate. */
  recommendation: string;
}

/** Optimized version of a single work-experience entry. */
export interface OptimizedExperienceItem {
  company: string;
  role: string;
  location?: string | null;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  /** Improved, clearer versions of the achievement highlights. */
  optimizedHighlights: string[];
  technologies: string[];
}

/** Optimized version of a single project entry. */
export interface OptimizedProjectItem {
  name: string;
  /** Improved project description (clarity, action verbs, ATS-friendly). */
  optimizedDescription: string;
  role?: string | null;
  /** Technologies re-emphasised or better categorised. */
  optimizedTechnologies: string[];
  /** Improved bullet points for the project. */
  optimizedHighlights: string[];
  link?: string | null;
}

/**
 * Strongly-typed result returned by the resume optimizer.
 * Every field is designed to be consumed directly by the UI — the values
 * represent *suggestions* only.  The original resume is never overwritten.
 */
export interface ResumeOptimizationResult {
  /** Rewritten professional summary (clarity & keyword emphasis only). */
  optimizedSummary: string;
  /** Optimized work-experience entries (same data, improved wording). */
  optimizedExperience: OptimizedExperienceItem[];
  /** Optimized project entries. */
  optimizedProjects: OptimizedProjectItem[];
  /** Re-organised / better-labelled skill groups. */
  optimizedSkills: SkillGroup;
  /** Keywords that could improve ATS match (only if supported by resume). */
  keywordSuggestions: KeywordSuggestion[];
  /** General ATS-compatibility improvements. */
  atsImprovements: string[];
  /** Job requirements absent from the resume — presented as gaps. */
  identifiedGaps: IdentifiedGap[];
  /** Detailed audit of every individual change (original → suggested → reason). */
  changes: SuggestedChange[];
  /** Things the candidate should verify before applying the suggestions. */
  warnings: string[];
}
