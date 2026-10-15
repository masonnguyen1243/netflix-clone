import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Genre, Movie } from "@/types";

export async function POST(request: Request) {
  // Auth check
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, description, poster_url, year, rating, director, genre_ids } = body as {
    title?: string;
    description?: string;
    poster_url?: string;
    year?: number;
    rating?: number;
    director?: string;
    genre_ids?: string[];
    backdrop_url?: string;
    trailer_url?: string;
    video_url?: string;
    cast?: string;
  };

  if (!title || !description || !poster_url || !year || !rating || !director) {
    return NextResponse.json(
      { error: "Missing required fields: title, description, poster_url, year, rating, director" },
      { status: 400 }
    );
  }

  const backdrop_url = (body.backdrop_url as string | undefined) ?? "";
  const trailer_url = (body.trailer_url as string | undefined) ?? "";
  const video_url = (body.video_url as string | undefined) ?? "";
  const cast = (body.cast as string | undefined) ?? "";

  const supabase = createAdminClient();

  // Insert movie
  const { data: movieData, error: movieError } = await supabase
    .from("movies")
    .insert({
      title,
      description,
      poster_url,
      backdrop_url,
      trailer_url,
      video_url,
      year,
      rating,
      cast,
      director,
    })
    .select()
    .single();

  if (movieError || !movieData) {
    const message = movieError?.message ?? "Failed to insert movie";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const movieId: string = movieData.id;

  // Insert movie_genres if provided
  const genreIdList: string[] = Array.isArray(genre_ids) ? genre_ids : [];
  if (genreIdList.length > 0) {
    const rows = genreIdList.map((gid) => ({ movie_id: movieId, genre_id: gid }));
    const { error: mgError } = await supabase.from("movie_genres").insert(rows);
    if (mgError) {
      // Roll back orphaned movie
      const { error: delErr } = await supabase.from("movies").delete().eq("id", movieId);
      if (delErr) {
        console.error("Rollback failed:", delErr);
      }
      return NextResponse.json({ error: mgError.message }, { status: 500 });
    }
  }

  // Fetch genres for the movie
  let genres: Genre[] = [];
  if (genreIdList.length > 0) {
    const { data: genreData, error: genreErr } = await supabase
      .from("genres")
      .select("id, name")
      .in("id", genreIdList);
    if (genreErr) {
      genres = [];
    }
    genres = (genreData ?? []) as Genre[];
  }

  revalidateTag("movies", { expire: 0 });

  const movie: Movie = {
    id: movieId,
    title: movieData.title,
    description: movieData.description,
    poster_url: movieData.poster_url,
    backdrop_url: movieData.backdrop_url,
    trailer_url: movieData.trailer_url,
    video_url: movieData.video_url,
    year: movieData.year,
    rating: movieData.rating,
    cast: movieData.cast,
    director: movieData.director,
    genres,
  };

  return NextResponse.json({ data: movie }, { status: 201 });
}
