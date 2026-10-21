import { auth } from "@clerk/nextjs/server";
import { getMovieById } from "@/lib/movieData";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const movie = await getMovieById(params.id);

    if (!movie) {
      return Response.json(
        { error: "Không tìm thấy phim", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    let progress_seconds = 0;
    try {
      const { userId, getToken } = await auth();
      if (userId) {
        const supabase = createServerClient(() =>
          getToken({ template: "supabase" })
        );
        const { data } = await supabase
          .from("watch_history")
          .select("progress_seconds")
          .eq("user_id", userId)
          .eq("movie_id", params.id)
          .maybeSingle();
        progress_seconds = data?.progress_seconds ?? 0;
      }
    } catch {
      // auth() failure or Supabase failure — fall back to 0, don't break the response
    }

    return Response.json({ data: { ...movie, progress_seconds } });
  } catch {
    return Response.json(
      { error: "Lỗi máy chủ", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
