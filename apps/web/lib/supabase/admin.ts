import { createClient } from "@supabase/supabase-js";

/**
 * Creates an elevated administrative Supabase client using the Service Role Key.
 * NEVER expose this to the client browser or bundle into client components.
 * Used exclusively for server-side administrative jobs, system migrations, and RLS bypasses.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for admin client."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
