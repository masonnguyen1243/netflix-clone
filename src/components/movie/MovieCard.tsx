"use client";

import { useState } from "react";
import Image from "next/image";
import type { MovieSummary } from "@/types";
import { MovieCardSkeleton } from "./MovieCardSkeleton";

interface MovieCardProps {
  movie: MovieSummary;
}

export function MovieCard({ movie }: MovieCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { id, title, poster_url, rating, genres } = movie;

  return (
    <a
      href={`/movie/${id}`}
      className="relative aspect-[2/3] rounded-lg overflow-hidden block group motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:hover:scale-[1.04] hover:ring-2 hover:ring-primary/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      {/* Image */}
      <Image
        src={poster_url}
        alt={`${title} poster`}
        fill
        style={{ objectFit: "cover" }}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageLoaded(true)}
        sizes="(max-width: 640px) 45vw, (max-width: 768px) 22vw, 180px"
      />

      {/* Skeleton overlay while image loads */}
      {!imageLoaded && (
        <div className="absolute inset-0">
          <MovieCardSkeleton />
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-150" />

      {/* Overlay content */}
      <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-150 flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{rating.toFixed(1)}</p>
        {genres.length > 0 && (
          <span className="text-xs bg-primary/20 text-primary rounded px-1 self-start">
            {genres[0]}
          </span>
        )}
      </div>

      {/* Bookmark icon (static, no onClick) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-150 text-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </div>
    </a>
  );
}
