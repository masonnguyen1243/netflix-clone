import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Genre, Movie, MovieSummary } from "@/types";

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

async function fetchMovieById(id: string): Promise<Movie | null> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("movies")
    .select(
      `id, title, description, poster_url, backdrop_url, trailer_url, video_url, year, rating, cast, director,
       movie_genres(genres(id, name))`
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    poster_url: row.poster_url,
    backdrop_url: row.backdrop_url,
    trailer_url: row.trailer_url,
    video_url: row.video_url,
    year: row.year,
    rating: row.rating,
    cast: row.cast,
    director: row.director,
    genres: (row.movie_genres ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((mg: any) => mg.genres)
      .filter(Boolean) as Genre[],
  };
}

export function getMovieById(id: string): Promise<Movie | null> {
  return unstable_cache(fetchMovieById, ["movie", id], { revalidate: 60 })(id);
}

export async function getSimilarMovies(
  genreIds: string[],
  excludeId: string,
  limit = 6
): Promise<MovieSummary[]> {
  if (genreIds.length === 0) return [];

  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("movie_genres")
    .select(
      `movies!inner(id, title, poster_url, year, rating,
        movie_genres(genres(id, name)))`
    )
    .in("genre_id", genreIds)
    .neq("movie_id", excludeId)
    // Fetch extra rows to ensure enough unique movies after dedup (a movie can match multiple genres)
    .limit(limit * Math.max(genreIds.length, 1));

  if (error || !data) return [];

  // Deduplicate movies (same movie may appear multiple times via different genres)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seen = new Set<string>();
  const results: MovieSummary[] = [];
  for (const row of data as any[]) {
    const movie = row.movies;
    if (!movie || seen.has(movie.id)) continue;
    seen.add(movie.id);
    results.push({
      id: movie.id,
      title: movie.title,
      poster_url: movie.poster_url,
      year: movie.year,
      rating: movie.rating,
      genres: (movie.movie_genres ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((mg: any) => mg.genres?.name)
        .filter(Boolean) as string[],
    });
    if (results.length >= limit) break;
  }
  return results;
}

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
