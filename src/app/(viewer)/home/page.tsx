import { getMovieList, getGenreList } from "@/lib/movieData";
import { HeroBanner } from "@/components/movie/HeroBanner";
import { MovieRow } from "@/components/movie/MovieRow";

export const revalidate = 60;

export default async function HomePage() {
  const [movies, genres] = await Promise.all([getMovieList(), getGenreList()]);

  if (movies.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-16">
        Chưa có phim nào. Hãy khám phá thêm →
      </p>
    );
  }

  const grouped = genres.map((g) => ({
    genre: g,
    movies: movies.filter((m) => m.genres.includes(g.name)),
  }));

  const ungrouped = movies.filter((m) => m.genres.length === 0);

  return (
    <>
      <HeroBanner movie={movies[0]} />
      <div className="flex flex-col gap-8 py-8">
        {grouped
          .filter((g) => g.movies.length > 0)
          .map((g) => (
            <MovieRow key={g.genre.id} title={g.genre.name} movies={g.movies} />
          ))}
        {ungrouped.length > 0 && (
          <MovieRow title="Tất cả phim" movies={ungrouped} />
        )}
      </div>
    </>
  );
}
