import { createClient } from "@/lib/supabase/client";
import type { Job } from "@/lib/types/job";
import type { MatchResult } from "@/lib/types/match";
import type { ResumeOptimizationResult } from "@/lib/types/optimization";
import type { ResumeOptimizationRow } from "./types";

/**
 * Saves a tailored resume optimization result to Supabase.
 */
export async function saveUserResumeOptimization(
  userId: string,
  job: Job,
  optimizationResult: ResumeOptimizationResult,
  matchResult?: MatchResult | null,
  resumeId?: string | null
): Promise<string | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("resume_optimizations")
      .insert({
        user_id: userId,
        resume_id: resumeId || null,
        job_id: job.id,
        target_role: job.title,
        target_company: job.company,
        job_data: job,
        match_result: matchResult || null,
        optimization_result: optimizationResult,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Error saving resume optimization to Supabase:", error);
      return null;
    }

    return data.id;
  } catch (err) {
    console.error("Unexpected error in saveUserResumeOptimization:", err);
    return null;
  }
}

/**
 * Fetches the user's most recent resume optimization.
 */
export async function getLatestUserResumeOptimization(
  userId: string
): Promise<ResumeOptimizationRow | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("resume_optimizations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as ResumeOptimizationRow;
  } catch (err) {
    console.error("Error fetching latest resume optimization:", err);
    return null;
  }
}

/**
 * Fetches all resume optimizations for the user.
 */
export async function getUserResumeOptimizations(
  userId: string
): Promise<ResumeOptimizationRow[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("resume_optimizations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Error fetching user optimizations:", error);
      return [];
    }

    return data as ResumeOptimizationRow[];
  } catch (err) {
    console.error("Error fetching optimizations:", err);
    return [];
  }
}

/**
 * Deletes an optimization record.
 */
export async function deleteUserResumeOptimization(
  userId: string,
  optimizationId: string
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("resume_optimizations")
      .delete()
      .eq("id", optimizationId)
      .eq("user_id", userId);

    return !error;
  } catch (err) {
    console.error("Error deleting optimization:", err);
    return false;
  }
}
