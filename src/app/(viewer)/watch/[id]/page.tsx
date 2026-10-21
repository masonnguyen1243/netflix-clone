import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getMovieById } from "@/lib/movieData";
import { createServerClient } from "@/lib/supabase/server";
import WatchPageClient from "./WatchPageClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function WatchPage({ params }: Props) {
  const { userId, getToken } = await auth();
  const movie = await getMovieById(params.id);

  if (!movie) {
    notFound();
  }

  let progress_seconds = 0;
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

  return (
    <main className="fixed inset-0">
      <WatchPageClient movie={{ ...movie, progress_seconds }} />
    </main>
  );
}
