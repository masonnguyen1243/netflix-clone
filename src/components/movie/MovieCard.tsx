"use client";

import { useState } from "react";
import Image from "next/image";
import type { MovieSummary } from "@/types";
import { MovieCardSkeleton } from "./MovieCardSkeleton";
import { WatchlistButton } from "./WatchlistButton";

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

      {/* Watchlist button at top-right of card */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity motion-safe:duration-150"
        onClick={(e) => e.preventDefault()}
      >
        <WatchlistButton movieId={id} />
      </div>
    </a>
  );
}
