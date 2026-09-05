import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function getSupabaseConfig() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (url.includes("http")) {
    const idx = url.indexOf("http");
    url = url.slice(idx).trim();
  }

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return {
    url: url || "https://placeholder.supabase.co",
    key: key || "placeholder-anon-key",
  };
}

/**
 * Returns a singleton browser Supabase client for client-side components.
 * Utilizes @supabase/ssr to automatically handle cookie-based session persistence.
 */
export function createClient(): SupabaseClient {
  const { url, key } = getSupabaseConfig();

  if (typeof window === "undefined") {
    return createBrowserClient(url, key);
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, key);
  }

  return browserClient;
}
