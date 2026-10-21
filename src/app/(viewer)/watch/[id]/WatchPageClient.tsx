"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Movie } from "@/types";
import YouTubePlayer from "@/components/player/YouTubePlayer";

interface Props {
  movie: Movie & { progress_seconds: number };
}

export default function WatchPageClient({ movie }: Props) {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const currentTimeRef = useRef(0);

  function handleTimeUpdate(s: number) {
    currentTimeRef.current = s;
  }

  function handleActivity() {
    setVisible(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 3000);
  }

  useEffect(() => {
    handleActivity();
    return () => {
      clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (currentTimeRef.current === 0) return;
      fetch(`/api/history/${movie.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress_seconds: Math.floor(currentTimeRef.current) }),
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [movie.id]);

  return (
    <div
      className="fixed inset-0 bg-background overflow-hidden"
      onMouseMove={handleActivity}
      onTouchStart={handleActivity}
    >
      <div className="w-full h-full">
        <YouTubePlayer
          videoId={movie.video_url}
          initialSeconds={movie.progress_seconds}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>

      <div
        className={`absolute inset-x-0 top-0 p-4 flex items-center gap-4 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-300 motion-reduce:transition-none ${
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <Link
          href={`/movie/${movie.id}`}
          className="text-white text-2xl focus:ring-2 focus:ring-primary rounded"
          aria-label="Quay lại"
        >
          ←
        </Link>
        <span className="text-white font-medium">{movie.title ?? ""}</span>
      </div>
    </div>
  );
}
