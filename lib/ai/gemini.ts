import { GoogleGenAI } from "@google/genai";
import {
  RESUME_ANALYSIS_SYSTEM_PROMPT,
  buildResumeAnalysisUserPrompt,
  JOB_MATCH_SYSTEM_PROMPT,
  buildJobMatchUserPrompt,
  RESUME_OPTIMIZATION_SYSTEM_PROMPT,
  buildResumeOptimizationUserPrompt,
} from "./prompts";
import {
  ResumeAnalysisOutputSchema,
  RESUME_ANALYSIS_JSON_SCHEMA,
  type ResumeAnalysisOutput,
  MatchResultSchema,
  JOB_MATCH_JSON_SCHEMA,
  ResumeOptimizationResultSchema,
  RESUME_OPTIMIZATION_JSON_SCHEMA,
  type ResumeOptimizationResult,
} from "./schemas";
import type { MatchResult } from "@/lib/types/match";
import type { ParsedResume } from "@/lib/types/resume";
import type { Job } from "@/lib/types/job";


export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in server environment variables. Please add GEMINI_API_KEY to your .env.local file."
    );
  }
  return new GoogleGenAI({ apiKey });
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function analyzeResumeWithGemini(resumeText: string): Promise<ResumeAnalysisOutput> {
  if (!resumeText || resumeText.trim().length < 50) {
    throw new Error(
      "The extracted resume text is too short or empty. Please ensure your document contains readable text."
    );
  }

  const ai = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const userPrompt = buildResumeAnalysisUserPrompt(resumeText);

  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: RESUME_ANALYSIS_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: RESUME_ANALYSIS_JSON_SCHEMA,
          temperature: 0.1,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response received from Gemini model.");
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(responseText);
      } catch {
        const cleaned = responseText
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        parsedJson = JSON.parse(cleaned);
      }

      // Strict schema validation using Zod
      const validated = ResumeAnalysisOutputSchema.safeParse(parsedJson);

      if (!validated.success) {
        console.error("Zod validation failed on Gemini output:", validated.error.format());
        const issues = validated.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        throw new Error(`AI response structure validation error: ${issues}`);
      }

      return validated.data;
    } catch (error: unknown) {
      lastError = error;
      const isTransient =
        error instanceof Error &&
        (error.message.includes("503") ||
          error.message.includes("high demand") ||
          error.message.includes("429") ||
          error.message.includes("RESOURCE_EXHAUSTED") ||
          error.message.includes("UNAVAILABLE"));

      if (isTransient && attempt < maxRetries) {
        console.warn(`Gemini API busy (attempt ${attempt}/${maxRetries}), retrying in ${attempt * 1500}ms...`);
        await wait(attempt * 1500);
        continue;
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred during Gemini resume analysis.");
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("An unexpected error occurred during Gemini resume analysis.");
}

// ---------------------------------------------------------------------------
// Phase 3: AI Job Matching
// ---------------------------------------------------------------------------

/**
 * Compares a parsed resume against a single job description using Gemini.
 *
 * The AI is instructed to:
 * - Never invent skills, experience, or education.
 * - Distinguish confirmed skills from transferable skills.
 * - Identify genuine skill gaps.
 * - Score based on evidence in the resume and requirements in the job.
 *
 * Returns a strictly Zod-validated MatchResult.
 */
export async function matchResumeWithJob(resume: ParsedResume, job: Job): Promise<MatchResult> {
  const ai = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const userPrompt = buildJobMatchUserPrompt(resume, job);

  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: JOB_MATCH_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: JOB_MATCH_JSON_SCHEMA,
          temperature: 0.1,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response received from Gemini model.");
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(responseText);
      } catch {
        const cleaned = responseText
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        parsedJson = JSON.parse(cleaned);
      }

      // Strict schema validation using Zod
      const validated = MatchResultSchema.safeParse(parsedJson);

      if (!validated.success) {
        console.error("Zod validation failed on Gemini match output:", validated.error.format());
        const issues = validated.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        throw new Error(`AI response structure validation error: ${issues}`);
      }

      return validated.data;
    } catch (error: unknown) {
      lastError = error;
      const isTransient =
        error instanceof Error &&
        (error.message.includes("503") ||
          error.message.includes("high demand") ||
          error.message.includes("429") ||
          error.message.includes("RESOURCE_EXHAUSTED") ||
          error.message.includes("UNAVAILABLE"));

      if (isTransient && attempt < maxRetries) {
        console.warn(`Gemini API busy (attempt ${attempt}/${maxRetries}), retrying in ${attempt * 1500}ms...`);
        await wait(attempt * 1500);
        continue;
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred during Gemini job matching.");
    }
  }

    if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("An unexpected error occurred during Gemini job matching.");
}

// ---------------------------------------------------------------------------
// Phase 4: AI Resume Optimization
// ---------------------------------------------------------------------------

/**
 * Optimizes a candidate's parsed resume for a specific target job using Gemini.
 *
 * The AI is instructed (via RESUME_OPTIMIZATION_SYSTEM_PROMPT) to be STRICTLY
 * NON-HALLUCINATING: it may only reword, re-emphasise, or reorganise content
 * that already exists in the resume.  Anything missing from the resume is
 * reported as a gap, never invented.
 *
 * Returns a strictly Zod-validated ResumeOptimizationResult.
 */
export async function optimizeResumeWithGemini(
  resume: ParsedResume,
  job: Job,
  matchResult?: MatchResult | null
): Promise<ResumeOptimizationResult> {
  const ai = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  const userPrompt = buildResumeOptimizationUserPrompt(resume, job, matchResult);

  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: RESUME_OPTIMIZATION_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: RESUME_OPTIMIZATION_JSON_SCHEMA,
          temperature: 0.1,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response received from Gemini model.");
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(responseText);
      } catch {
        const cleaned = responseText
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        parsedJson = JSON.parse(cleaned);
      }

      // Strict schema validation using Zod
      const validated = ResumeOptimizationResultSchema.safeParse(parsedJson);

      if (!validated.success) {
        console.error("Zod validation failed on Gemini optimization output:", validated.error.format());
        const issues = validated.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        throw new Error(`AI response structure validation error: ${issues}`);
      }

      return validated.data;
    } catch (error: unknown) {
      lastError = error;
      const isTransient =
        error instanceof Error &&
        (error.message.includes("503") ||
          error.message.includes("high demand") ||
          error.message.includes("429") ||
          error.message.includes("RESOURCE_EXHAUSTED") ||
          error.message.includes("UNAVAILABLE"));

      if (isTransient && attempt < maxRetries) {
        console.warn(`Gemini API busy (attempt ${attempt}/${maxRetries}), retrying in ${attempt * 1500}ms...`);
        await wait(attempt * 1500);
        continue;
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred during Gemini resume optimization.");
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("An unexpected error occurred during Gemini resume optimization.");
}

