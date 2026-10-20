import { MovieCardSkeleton } from "@/components/movie/MovieCardSkeleton";

export default function MovieDetailLoading() {
  return (
    <div className="relative min-h-screen">
      {/* Backdrop skeleton */}
      <div className="absolute inset-0 h-[400px] -mx-[clamp(1rem,4vw,4rem)] bg-surface animate-pulse motion-reduce:animate-none" />

      {/* Main content skeleton */}
      <div className="relative z-10 pt-8">
        <div className="max-w-[600px] flex flex-col gap-4">
          <div className="flex gap-6 items-start">
            {/* Poster skeleton */}
            <div className="shrink-0 w-[160px] h-[240px] rounded-lg bg-surface animate-pulse motion-reduce:animate-none" />

            {/* Metadata skeleton */}
            <div className="flex flex-col gap-3 pt-2 flex-1">
              {/* Title */}
              <div className="h-8 w-3/4 rounded bg-surface animate-pulse motion-reduce:animate-none" />
              {/* Meta line */}
              <div className="h-4 w-1/2 rounded bg-surface animate-pulse motion-reduce:animate-none" />
              {/* Description lines */}
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-surface animate-pulse motion-reduce:animate-none" />
                <div className="h-3 w-full rounded bg-surface animate-pulse motion-reduce:animate-none" />
                <div className="h-3 w-4/5 rounded bg-surface animate-pulse motion-reduce:animate-none" />
              </div>
              {/* Genre pills */}
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded-full bg-surface animate-pulse motion-reduce:animate-none" />
                <div className="h-6 w-20 rounded-full bg-surface animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Trailer skeleton */}
        <div className="mt-8 max-w-[800px]">
          <div className="h-5 w-24 rounded bg-surface animate-pulse motion-reduce:animate-none mb-3" />
          <div className="aspect-video w-full rounded-lg bg-surface animate-pulse motion-reduce:animate-none" />
        </div>

        {/* Similar movies skeleton */}
        <div className="mt-10">
          <div className="h-5 w-32 rounded bg-surface animate-pulse motion-reduce:animate-none mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
