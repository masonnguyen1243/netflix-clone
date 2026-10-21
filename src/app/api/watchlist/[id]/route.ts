import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Check if movie is already in watchlist
    const { data: existing, error: selectError } = await supabase
      .from("watchlist")
      .select("id")
      .eq("user_id", userId)
      .eq("movie_id", id)
      .maybeSingle();

    if (selectError) throw selectError;

    let inWatchlist: boolean;

    if (existing) {
      // Movie exists → DELETE
      const { error: deleteError } = await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", userId)
        .eq("movie_id", id);

      if (deleteError) throw deleteError;
      inWatchlist = false;
    } else {
      // Movie not exists → INSERT
      const { error: insertError } = await supabase
        .from("watchlist")
        .insert({ user_id: userId, movie_id: id });

      if (insertError) throw insertError;
      inWatchlist = true;
    }

    return Response.json({ data: { movieId: id, inWatchlist } });
  } catch {
    return Response.json(
      { error: "Lỗi máy chủ", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
