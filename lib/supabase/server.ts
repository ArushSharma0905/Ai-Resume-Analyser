import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

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
 * Creates a server Supabase client using @supabase/ssr and Next.js async cookies().
 * Must be called per-request in Server Components, Server Actions, or Route Handlers.
 */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be safely ignored when proxy/middleware refreshes sessions.
        }
      },
    },
  });
}
