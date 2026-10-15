"use client";

import { useEffect, useRef } from "react";
import type { MovieSummary } from "@/types";
import { MovieCard } from "./MovieCard";
import { MovieCardSkeleton } from "./MovieCardSkeleton";

interface MovieRowProps {
  title: string;
  movies: MovieSummary[];
  isLoading?: boolean;
  onLoadMore?: () => void;
}

const cardClass =
  "flex-shrink-0 w-[45vw] sm:w-[22vw] md:w-[160px] min-w-[120px] max-w-[180px]";

export function MovieRow({ title, movies, isLoading = false, onLoadMore }: MovieRowProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "0px 200px 0px 0px" }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore]);

  if (!isLoading && movies.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      {/* Row header */}
      <div className="flex items-center gap-2 px-4">
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
        <span className="text-primary text-xl" aria-hidden="true">
          ›
        </span>
      </div>

      {/* Scroll container */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x pb-2 px-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cardClass}>
                <MovieCardSkeleton />
              </div>
            ))
          : movies.map((movie) => (
              <div key={movie.id} className={`${cardClass} snap-start`}>
                <MovieCard movie={movie} />
              </div>
            ))}

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="flex-shrink-0 w-px" aria-hidden="true" />
      </div>
    </section>
  );
}
