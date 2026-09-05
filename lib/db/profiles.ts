import { createClient } from "@/lib/supabase/client";
import type { ProfileRow, SubscriptionRow } from "./types";

/**
 * Fetches the user's public profile.
 */
export async function getUserProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as ProfileRow;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return null;
  }
}

/**
 * Updates the user's profile information.
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<ProfileRow, "full_name" | "avatar_url">>
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    return !error;
  } catch (err) {
    console.error("Error updating user profile:", err);
    return false;
  }
}

/**
 * Fetches the user's subscription record (for Phase 7 preparation).
 */
export async function getUserSubscription(
  userId: string
): Promise<SubscriptionRow | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as SubscriptionRow;
  } catch (err) {
    console.error("Error fetching subscription:", err);
    return null;
  }
}
