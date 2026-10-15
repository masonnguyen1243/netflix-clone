import { createAdminClient } from "@/lib/supabase/admin";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
  );
  process.exit(1);
}

const supabase = createAdminClient();

const genres = [
  { id: crypto.randomUUID(), name: "Action" },
  { id: crypto.randomUUID(), name: "Drama" },
  { id: crypto.randomUUID(), name: "Sci-Fi" },
  { id: crypto.randomUUID(), name: "Thriller" },
  { id: crypto.randomUUID(), name: "Comedy" },
  { id: crypto.randomUUID(), name: "Crime" },
  { id: crypto.randomUUID(), name: "Adventure" },
  { id: crypto.randomUUID(), name: "Horror" },
  { id: crypto.randomUUID(), name: "Romance" },
  { id: crypto.randomUUID(), name: "Animation" },
];

const movieData = [
  {
    id: crypto.randomUUID(),
    title: "Inception",
    description:
      "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    poster_url: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
    video_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
    year: 2010,
    rating: 8.8,
    cast: "Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page, Tom Hardy",
    director: "Christopher Nolan",
    genreNames: ["Action", "Sci-Fi", "Thriller"],
  },
  {
    id: crypto.randomUUID(),
    title: "The Dark Knight",
    description:
      "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    poster_url: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg",
    trailer_url: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
    video_url: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
    year: 2008,
    rating: 9.0,
    cast: "Christian Bale, Heath Ledger, Aaron Eckhart, Michael Caine",
    director: "Christopher Nolan",
    genreNames: ["Action", "Crime", "Drama"],
  },
  {
    id: crypto.randomUUID(),
    title: "Interstellar",
    description:
      "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
    poster_url: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/xu9zaAevzQ5nnrsXN6JcahLnG4i.jpg",
    trailer_url: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
    video_url: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
    year: 2014,
    rating: 8.6,
    cast: "Matthew McConaughey, Anne Hathaway, Jessica Chastain, Michael Caine",
    director: "Christopher Nolan",
    genreNames: ["Sci-Fi", "Drama", "Adventure"],
  },
  {
    id: crypto.randomUUID(),
    title: "Parasite",
    description:
      "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    poster_url: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg",
    trailer_url: "https://www.youtube.com/watch?v=5xH0HfJHsaY",
    video_url: "https://www.youtube.com/watch?v=5xH0HfJHsaY",
    year: 2019,
    rating: 8.5,
    cast: "Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong, Choi Woo-shik",
    director: "Bong Joon-ho",
    genreNames: ["Drama", "Thriller", "Crime"],
  },
  {
    id: crypto.randomUUID(),
    title: "The Shawshank Redemption",
    description:
      "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    poster_url: "https://image.tmdb.org/t/p/w500/lyQBXzOQSuE59IsHyhrp0qIiPAz.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
    trailer_url: "https://www.youtube.com/watch?v=6hB3S9bIaco",
    video_url: "https://www.youtube.com/watch?v=6hB3S9bIaco",
    year: 1994,
    rating: 9.3,
    cast: "Tim Robbins, Morgan Freeman, Bob Gunton, William Sadler",
    director: "Frank Darabont",
    genreNames: ["Drama"],
  },
  {
    id: crypto.randomUUID(),
    title: "Avengers: Endgame",
    description:
      "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe.",
    poster_url: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
    trailer_url: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
    video_url: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
    year: 2019,
    rating: 8.4,
    cast: "Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth",
    director: "Anthony Russo, Joe Russo",
    genreNames: ["Action", "Adventure", "Sci-Fi"],
  },
  {
    id: crypto.randomUUID(),
    title: "The Godfather",
    description:
      "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    poster_url: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsLlLiclPDnb6.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/tmU7GeKVybMWFbGGR1khLAJNzF5.jpg",
    trailer_url: "https://www.youtube.com/watch?v=sY1S34973zA",
    video_url: "https://www.youtube.com/watch?v=sY1S34973zA",
    year: 1972,
    rating: 9.2,
    cast: "Marlon Brando, Al Pacino, James Caan, Richard Castellano",
    director: "Francis Ford Coppola",
    genreNames: ["Crime", "Drama"],
  },
  {
    id: crypto.randomUUID(),
    title: "Pulp Fiction",
    description:
      "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    poster_url: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/4cDFJr4HnXN5AdPw4AKrmLlMWdO.jpg",
    trailer_url: "https://www.youtube.com/watch?v=s7EdQ4FqbhY",
    video_url: "https://www.youtube.com/watch?v=s7EdQ4FqbhY",
    year: 1994,
    rating: 8.9,
    cast: "John Travolta, Uma Thurman, Samuel L. Jackson, Bruce Willis",
    director: "Quentin Tarantino",
    genreNames: ["Crime", "Drama", "Thriller"],
  },
  {
    id: crypto.randomUUID(),
    title: "The Matrix",
    description:
      "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth–the life he knows is the elaborate deception of an evil cyber-intelligence.",
    poster_url: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/icmmSD4vTTDKOq2vvdulafOGw93.jpg",
    trailer_url: "https://www.youtube.com/watch?v=vKQi3bBA1y8",
    video_url: "https://www.youtube.com/watch?v=vKQi3bBA1y8",
    year: 1999,
    rating: 8.7,
    cast: "Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss, Hugo Weaving",
    director: "Lana Wachowski, Lilly Wachowski",
    genreNames: ["Action", "Sci-Fi"],
  },
  {
    id: crypto.randomUUID(),
    title: "Forrest Gump",
    description:
      "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75.",
    poster_url: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg",
    trailer_url: "https://www.youtube.com/watch?v=bLvqoHBptjg",
    video_url: "https://www.youtube.com/watch?v=bLvqoHBptjg",
    year: 1994,
    rating: 8.8,
    cast: "Tom Hanks, Robin Wright, Gary Sinise, Sally Field",
    director: "Robert Zemeckis",
    genreNames: ["Drama", "Romance", "Comedy"],
  },
  {
    id: crypto.randomUUID(),
    title: "Spirited Away",
    description:
      "During her family's move to the suburbs, a sulky 10-year-old girl wanders into a world ruled by gods, witches, and spirits, where humans are changed into beasts.",
    poster_url: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/Ab8mkyvkiq3zT3AxoJyHSbJGiK5.jpg",
    trailer_url: "https://www.youtube.com/watch?v=ByXuk9QqQkk",
    video_url: "https://www.youtube.com/watch?v=ByXuk9QqQkk",
    year: 2001,
    rating: 8.6,
    cast: "Daveigh Chase, Suzanne Pleshette, Miyu Irino, Rumi Hiiragi",
    director: "Hayao Miyazaki",
    genreNames: ["Animation", "Adventure"],
  },
  {
    id: crypto.randomUUID(),
    title: "Get Out",
    description:
      "A young African-American visits his white girlfriend's parents for the weekend, where his simmering uneasiness about their reception of him eventually reaches a boiling point.",
    poster_url: "https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/bOGkgRGdhrBYJSLpXaxhXVstddV.jpg",
    trailer_url: "https://www.youtube.com/watch?v=DzfpyUB60YY",
    video_url: "https://www.youtube.com/watch?v=DzfpyUB60YY",
    year: 2017,
    rating: 7.7,
    cast: "Daniel Kaluuya, Allison Williams, Bradley Whitford, Catherine Keener",
    director: "Jordan Peele",
    genreNames: ["Horror", "Thriller"],
  },
];

async function seed() {
  console.log("Seeding database...");

  // Truncate in dependency order
  console.log("Truncating movie_genres...");
  const { error: truncateMgError } = await supabase
    .from("movie_genres")
    .delete()
    .neq("movie_id", "00000000-0000-0000-0000-000000000000");
  if (truncateMgError) {
    console.error("Error truncating movie_genres:", truncateMgError);
    process.exit(1);
  }

  console.log("Truncating movies...");
  const { error: truncateMoviesError } = await supabase
    .from("movies")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (truncateMoviesError) {
    console.error("Error truncating movies:", truncateMoviesError);
    process.exit(1);
  }

  console.log("Truncating genres...");
  const { error: truncateGenresError } = await supabase
    .from("genres")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (truncateGenresError) {
    console.error("Error truncating genres:", truncateGenresError);
    process.exit(1);
  }

  // Insert genres
  console.log("Inserting genres...");
  const { error: genresError } = await supabase
    .from("genres")
    .insert(genres.map(({ id, name }) => ({ id, name })));
  if (genresError) {
    console.error("Error inserting genres:", genresError);
    process.exit(1);
  }

  // Build genre name -> id map
  const genreMap = new Map(genres.map((g) => [g.name, g.id]));

  // Insert movies
  console.log("Inserting movies...");
  const moviesToInsert = movieData.map(({ genreNames: _, ...movie }) => movie);
  const { error: moviesError } = await supabase.from("movies").insert(moviesToInsert);
  if (moviesError) {
    console.error("Error inserting movies:", moviesError);
    process.exit(1);
  }

  // Build movie_genres join rows
  const movieGenresRows: { movie_id: string; genre_id: string }[] = [];
  for (const movie of movieData) {
    for (const genreName of movie.genreNames) {
      const genreId = genreMap.get(genreName);
      if (!genreId) {
        console.error(`Unknown genre: "${genreName}" — add it to the genres array`);
        process.exit(1);
      }
      movieGenresRows.push({ movie_id: movie.id, genre_id: genreId });
    }
  }

  console.log("Inserting movie_genres...");
  const { error: mgError } = await supabase.from("movie_genres").insert(movieGenresRows);
  if (mgError) {
    console.error("Error inserting movie_genres:", mgError);
    process.exit(1);
  }

  console.log(`Seed complete: ${movieData.length} movies, ${genres.length} genres inserted.`);
}

seed().catch((e) => { console.error(e); process.exit(1); });
