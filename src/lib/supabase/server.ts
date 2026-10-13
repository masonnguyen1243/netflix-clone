import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client authenticated with a Clerk JWT.
 * @param getToken - Async function that returns the Clerk JWT for the 'supabase' template
 */
export function createServerClient(getToken: () => Promise<string | null>) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const token = await getToken();
          const headers = new Headers(options?.headers as HeadersInit);
          if (token) {
            headers.set("Authorization", `Bearer ${token}`);
          }
          return fetch(url, { ...options, headers });
        },
      },
    }
  );
}
