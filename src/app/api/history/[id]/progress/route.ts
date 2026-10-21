import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return Response.json(
        { error: "Chưa đăng nhập", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { progress_seconds } = await req.json();
    const ps = Number(progress_seconds);
    if (!Number.isFinite(ps) || ps < 0) {
      return Response.json(
        { error: "Dữ liệu không hợp lệ", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const supabase = createServerClient(() =>
      getToken({ template: "supabase" })
    );

    const { error } = await supabase.from("watch_history").upsert(
      {
        user_id: userId,
        movie_id: params.id,
        progress_seconds: ps,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,movie_id" }
    );

    if (error) throw error;

    return Response.json({ data: { progress_seconds: ps } });
  } catch {
    return Response.json(
      { error: "Lỗi máy chủ", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
