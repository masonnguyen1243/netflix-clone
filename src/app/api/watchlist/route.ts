import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";
import type { MovieSummary } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Chưa đăng nhập", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const supabase = createServerClient(() =>
      getToken({ template: "supabase" })
    );

    const { data, error } = await supabase
      .from("watchlist")
      .select(
        `
        created_at,
        movies (
          id,
          title,
          poster_url,
          year,
          rating,
          movie_genres (
            genres ( id, name )
          )
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const movies: MovieSummary[] = (data ?? [])
      .map((row: any) => {
        const m = row.movies;
        if (!m) return null;
        return {
          id: m.id,
          title: m.title,
          poster_url: m.poster_url,
          year: m.year,
          rating: m.rating,
          genres: (m.movie_genres ?? []).map((mg: any) => mg.genres?.name).filter(Boolean),
        };
      })
      .filter((m): m is MovieSummary => m !== null);

    return Response.json({ data: movies });
  } catch {
    return Response.json(
      { error: "Lỗi máy chủ", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
