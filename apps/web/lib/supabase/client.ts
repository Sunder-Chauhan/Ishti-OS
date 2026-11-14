import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a browser-side Supabase client for Client Components.
 * Uses public publishable anon key.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
