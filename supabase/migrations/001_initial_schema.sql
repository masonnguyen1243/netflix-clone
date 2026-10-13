-- Note: movies and genres do NOT have RLS enabled — public read access is intentional.
-- Only user-facing tables (watch_history, watchlist) require RLS to scope data per user.

-- Create movies table
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  backdrop_url TEXT NOT NULL,
  trailer_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  year INT NOT NULL,
  rating NUMERIC(3, 1) NOT NULL,
  cast TEXT NOT NULL,
  director TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create genres table
CREATE TABLE IF NOT EXISTS genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

-- Create movie_genres junction table
CREATE TABLE IF NOT EXISTS movie_genres (
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (movie_id, genre_id)
);

-- Create watch_history table
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  progress_seconds INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);

-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, movie_id)
);

-- Enable Row Level Security
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- RLS policies for watch_history
CREATE POLICY "Users can view their own watch history"
  ON watch_history FOR SELECT
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert their own watch history"
  ON watch_history FOR INSERT
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update their own watch history"
  ON watch_history FOR UPDATE
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete their own watch history"
  ON watch_history FOR DELETE
  USING (user_id = (auth.jwt() ->> 'sub'));

-- RLS policies for watchlist
CREATE POLICY "Users can view their own watchlist"
  ON watchlist FOR SELECT
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert into their own watchlist"
  ON watchlist FOR INSERT
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete from their own watchlist"
  ON watchlist FOR DELETE
  USING (user_id = (auth.jwt() ->> 'sub'));
