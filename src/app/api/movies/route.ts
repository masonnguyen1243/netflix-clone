import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/anon";
import type { MovieSummary } from "@/types";

async function fetchAllMovies(): Promise<MovieSummary[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("movies")
    .select(
      `id, title, poster_url, year, rating,
       movie_genres(genres(id, name))`
    );

  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    poster_url: movie.poster_url,
    year: movie.year,
    rating: movie.rating,
    genres: (movie.movie_genres ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((mg: any) => mg.genres?.name)
      .filter(Boolean) as string[],
  }));
}

const getCachedMovies = unstable_cache(fetchAllMovies, ["movies-list"], {
  revalidate: 60,
  tags: ["movies"],
});

async function fetchMoviesByQuery(q: string): Promise<MovieSummary[]> {
  const supabase = createAnonClient();
  // Escape wildcard characters before passing to ilike
  const escaped = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
  const { data, error } = await supabase
    .from("movies")
    .select(
      `id, title, poster_url, year, rating,
       movie_genres(genres(id, name))`
    )
    .ilike("title", `%${escaped}%`);

  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((movie: any) => ({
    id: movie.id,
    title: movie.title,
    poster_url: movie.poster_url,
    year: movie.year,
    rating: movie.rating,
    genres: (movie.movie_genres ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((mg: any) => mg.genres?.name)
      .filter(Boolean) as string[],
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  try {
    if (q !== null && q !== "") {
      const movies = await fetchMoviesByQuery(q);
      return NextResponse.json(
        { data: movies },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const movies = await getCachedMovies();
    return NextResponse.json({ data: movies });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
