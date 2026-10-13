export interface Genre {
  id: string;
  name: string;
}

export interface MovieSummary {
  id: string;
  title: string;
  poster_url: string;
  year: number;
  rating: number;
  genres: string[];
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  poster_url: string;
  backdrop_url: string;
  trailer_url: string;
  video_url: string;
  year: number;
  rating: number;
  cast: string;
  director: string;
  genres: Genre[];
}
