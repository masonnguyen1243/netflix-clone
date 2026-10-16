import { MovieCardSkeleton } from "@/components/movie/MovieCardSkeleton";

export default function HomeLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="min-h-[65vh] bg-surface animate-pulse motion-reduce:animate-none rounded" />

      {/* Row skeletons */}
      <div className="flex flex-col gap-8 py-8">
        {[0, 1].map((i) => (
          <section key={i} className="flex flex-col gap-2">
            <div className="h-6 w-32 bg-surface animate-pulse motion-reduce:animate-none rounded" />
            <div className="flex gap-3 overflow-x-hidden px-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="flex-shrink-0 w-[160px]">
                  <MovieCardSkeleton />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
