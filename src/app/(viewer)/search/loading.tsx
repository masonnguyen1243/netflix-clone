import { MovieCardSkeleton } from "@/components/movie/MovieCardSkeleton";

export default function SearchLoading() {
  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Skeleton search input */}
      <div className="w-full h-9 bg-surface rounded-full animate-pulse motion-reduce:animate-none" />

      {/* Skeleton grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
