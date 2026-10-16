import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Genre, MovieSummary } from "@/types";

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

async function fetchAllGenres(): Promise<Genre[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.from("genres").select("id, name");
  if (error) throw error;
  return (data ?? []) as Genre[];
}

export const getMovieList = unstable_cache(
  fetchAllMovies,
  ["movies-list"],
  { revalidate: 60, tags: ["movies"] }
);

export const getGenreList = unstable_cache(
  fetchAllGenres,
  ["genres-list"],
  { revalidate: 3600 }
);

export async function getMoviesByQuery(q: string): Promise<MovieSummary[]> {
  const supabase = createAnonClient();
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
