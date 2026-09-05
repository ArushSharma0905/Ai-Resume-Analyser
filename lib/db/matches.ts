import { createClient } from "@/lib/supabase/client";
import type { Job } from "@/lib/types/job";
import type { MatchResult } from "@/lib/types/match";
import type { JobMatchRow } from "./types";

/**
 * Saves an AI job match assessment to Supabase for the authenticated user.
 */
export async function saveUserJobMatch(
  userId: string,
  job: Job,
  matchResult: MatchResult,
  resumeId?: string | null
): Promise<string | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("job_matches")
      .insert({
        user_id: userId,
        resume_id: resumeId || null,
        job_id: job.id,
        job_title: job.title,
        company_name: job.company,
        job_data: job,
        overall_score: matchResult.overallScore,
        recommendation: matchResult.recommendation,
        match_result: matchResult,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Error saving job match to Supabase:", error);
      return null;
    }

    return data.id;
  } catch (err) {
    console.error("Unexpected error in saveUserJobMatch:", err);
    return null;
  }
}

/**
 * Fetches all saved job matches for the authenticated user, ordered newest first.
 */
export async function getUserJobMatches(userId: string): Promise<JobMatchRow[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("job_matches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Error fetching user job matches:", error);
      return [];
    }

    return data as JobMatchRow[];
  } catch (err) {
    console.error("Error fetching job matches:", err);
    return [];
  }
}

/**
 * Deletes a job match record.
 */
export async function deleteUserJobMatch(userId: string, matchId: string): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("job_matches")
      .delete()
      .eq("id", matchId)
      .eq("user_id", userId);

    return !error;
  } catch (err) {
    console.error("Error deleting job match:", err);
    return false;
  }
}
