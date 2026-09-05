import { createClient } from "@/lib/supabase/client";
import type { Job } from "@/lib/types/job";
import type { SavedJobRow } from "./types";

/**
 * Saves or bookmarks a job listing for the authenticated user.
 */
export async function saveUserJob(
  userId: string,
  job: Job,
  notes?: string
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase.from("saved_jobs").upsert(
      {
        user_id: userId,
        job_id: job.id,
        job_data: job,
        notes: notes || null,
        status: "saved",
      },
      { onConflict: "user_id, job_id" }
    );

    if (error) {
      console.error("Error saving job to Supabase:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Unexpected error in saveUserJob:", err);
    return false;
  }
}

/**
 * Removes a bookmarked job for the authenticated user.
 */
export async function removeUserSavedJob(
  userId: string,
  jobId: string
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("user_id", userId)
      .eq("job_id", jobId);

    if (error) {
      console.error("Error removing saved job:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Unexpected error in removeUserSavedJob:", err);
    return false;
  }
}

/**
 * Fetches all jobs saved by the user.
 */
export async function getUserSavedJobs(userId: string): Promise<SavedJobRow[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("saved_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.error("Error fetching user saved jobs:", error);
      return [];
    }

    return data as SavedJobRow[];
  } catch (err) {
    console.error("Error fetching saved jobs:", err);
    return [];
  }
}

/**
 * Checks if a specific job is already saved by the user.
 */
export async function isJobSavedByUser(
  userId: string,
  jobId: string
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("saved_jobs")
      .select("id")
      .eq("user_id", userId)
      .eq("job_id", jobId)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
