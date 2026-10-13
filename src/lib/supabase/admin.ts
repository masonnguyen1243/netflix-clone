import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase admin client using the service role key.
 * This client bypasses Row Level Security (RLS).
 * @warn Chỉ import trong app/api/admin/**
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
