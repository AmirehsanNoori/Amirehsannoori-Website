import { createClient } from "@supabase/supabase-js";

/**
 * Privileged server-only Supabase client using the service-role key.
 * Bypasses Row Level Security — use ONLY in trusted server code
 * (route handlers, server actions), NEVER in the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
