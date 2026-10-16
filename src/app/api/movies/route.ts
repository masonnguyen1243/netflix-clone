import { NextResponse } from "next/server";
import { getMovieList, getMoviesByQuery } from "@/lib/movieData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  try {
    if (q !== null && q !== "") {
      const movies = await getMoviesByQuery(q);
      return NextResponse.json(
        { data: movies },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const movies = await getMovieList();
    return NextResponse.json({ data: movies });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
