import { createClient } from "@/lib/supabase/client";
import type { ResumeAnalysisResult } from "@/lib/types/resume";
import type { ResumeRow, ResumeAnalysisRow } from "./types";

export interface FullUserResume {
  resume: ResumeRow;
  analysis: ResumeAnalysisRow | null;
}

/**
 * Saves a parsed resume and its ATS analysis to Supabase.
 * Automatically marks previous resumes as non-primary.
 */
export async function saveUserResumeAndAnalysis(
  userId: string,
  result: ResumeAnalysisResult,
  fileName: string = "Uploaded Resume",
  rawText?: string
): Promise<{ resumeId: string; analysisId: string } | null> {
  const supabase = createClient();

  try {
    // 1. Mark previous resumes as is_primary = false
    await supabase
      .from("resumes")
      .update({ is_primary: false })
      .eq("user_id", userId);

    // 2. Insert new resume record
    const { data: resumeData, error: resumeError } = await supabase
      .from("resumes")
      .insert({
        user_id: userId,
        file_name: fileName,
        raw_text: rawText || null,
        raw_text_length: result.rawTextLength || rawText?.length || 0,
        parsed_data: result.parsedResume,
        is_primary: true,
      })
      .select("id")
      .single();

    if (resumeError || !resumeData) {
      console.error("Error saving resume record:", resumeError);
      return null;
    }

    const resumeId = resumeData.id;

    // 3. Insert ATS analysis record
    const { data: analysisData, error: analysisError } = await supabase
      .from("resume_analyses")
      .insert({
        user_id: userId,
        resume_id: resumeId,
        overall_score: result.atsScoreReport.overallScore,
        summary: result.atsScoreReport.summary,
        breakdown: result.atsScoreReport.breakdown,
        key_strengths: result.atsScoreReport.keyStrengths,
        critical_improvements: result.atsScoreReport.criticalImprovements,
        missing_elements: result.atsScoreReport.missingElements,
        detected_keywords: result.atsScoreReport.detectedKeywords,
        recommended_keywords: result.atsScoreReport.recommendedKeywords,
      })
      .select("id")
      .single();

    if (analysisError || !analysisData) {
      console.error("Error saving analysis record:", analysisError);
      return { resumeId, analysisId: "" };
    }

    return { resumeId, analysisId: analysisData.id };
  } catch (err) {
    console.error("Unexpected error in saveUserResumeAndAnalysis:", err);
    return null;
  }
}

/**
 * Fetches the user's primary/latest resume and ATS analysis from Supabase.
 */
export async function getLatestUserResume(userId: string): Promise<FullUserResume | null> {
  const supabase = createClient();

  try {
    const { data: resumeData, error: resumeError } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resumeError || !resumeData) {
      return null;
    }

    const { data: analysisData } = await supabase
      .from("resume_analyses")
      .select("*")
      .eq("resume_id", resumeData.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      resume: resumeData as ResumeRow,
      analysis: (analysisData as ResumeAnalysisRow) || null,
    };
  } catch (err) {
    console.error("Error fetching latest user resume:", err);
    return null;
  }
}

/**
 * Fetches all resumes owned by the authenticated user.
 */
export async function getUserResumes(userId: string): Promise<ResumeRow[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Error fetching user resumes:", error);
      return [];
    }

    return data as ResumeRow[];
  } catch (err) {
    console.error("Error fetching resumes:", err);
    return [];
  }
}

/**
 * Deletes a resume and cascades to associated analyses.
 */
export async function deleteUserResume(userId: string, resumeId: string): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("resumes")
      .delete()
      .eq("id", resumeId)
      .eq("user_id", userId);

    return !error;
  } catch (err) {
    console.error("Error deleting resume:", err);
    return false;
  }
}
