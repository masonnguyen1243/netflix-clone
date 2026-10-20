import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getMovieById, getSimilarMovies } from "@/lib/movieData";
import { MovieCard } from "@/components/movie/MovieCard";
import { WatchlistButton } from "@/components/movie/WatchlistButton";

export const revalidate = 60;

interface Props {
  params: { id: string };
}

export default async function MovieDetailPage({ params }: Props) {
  const movie = await getMovieById(params.id);

  if (!movie) {
    notFound();
  }

  const genreIds = movie.genres.map((g) => g.id);
  const similarMovies = await getSimilarMovies(genreIds, movie.id);

  return (
    <main className="relative min-h-screen">
      {/* Backdrop */}
      {movie.backdrop_url && (
        <div className="absolute inset-0 h-[400px] overflow-hidden -mx-[clamp(1rem,4vw,4rem)]">
          <Image
            src={movie.backdrop_url}
            alt=""
            fill
            style={{ objectFit: "cover" }}
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 pt-8">
        <div className="max-w-[600px] flex flex-col gap-4">
          {/* Poster + metadata row */}
          <div className="flex gap-6 items-start">
            {/* Poster */}
            <div className="relative shrink-0 w-[160px] h-[240px] rounded-lg overflow-hidden shadow-lg">
              <Image
                src={movie.poster_url}
                alt={`${movie.title} poster`}
                fill
                style={{ objectFit: "cover" }}
                sizes="160px"
              />
            </div>

            {/* Text metadata */}
            <div className="flex flex-col gap-3 pt-2">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {movie.title}
              </h1>

              <p className="text-muted-foreground text-sm">
                {movie.year}
                {movie.director ? ` · ${movie.director}` : ""}
                {movie.rating != null ? ` · ⭐ ${movie.rating.toFixed(1)}` : ""}
              </p>

              <p className="text-foreground text-sm leading-relaxed line-clamp-4">
                {movie.description}
              </p>

              {/* Genre badges */}
              {movie.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="bg-surface-elevated rounded-full px-3 py-1 text-sm text-secondary"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA row */}
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href={`/watch/${movie.id}`}
                  className="bg-amber-600 text-black rounded-md px-6 py-2 inline-flex items-center gap-2 font-semibold hover:bg-amber-500 transition-colors"
                >
                  {/* Play icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Xem ngay
                </Link>
                <WatchlistButton />
              </div>
            </div>
          </div>
        </div>

        {/* Cast */}
        {movie.cast && (
          <div className="mt-6 max-w-[600px]">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Diễn viên: </span>
              {movie.cast}
            </p>
          </div>
        )}

        {/* Trailer */}
        {movie.trailer_url && (
          <div className="mt-8 max-w-[800px]">
            <h2 className="text-lg font-semibold text-foreground mb-3">Trailer</h2>
            <div className="aspect-video w-full rounded-lg overflow-hidden">
              <iframe
                src={movie.trailer_url}
                title={`${movie.title} trailer`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Phim tương tự */}
        {similarMovies.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Phim tương tự
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {similarMovies.map((m) => (
                <MovieCard key={m.id} movie={m} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
