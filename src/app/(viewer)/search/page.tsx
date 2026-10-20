"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MovieCard } from "@/components/movie/MovieCard";
import { MovieCardSkeleton } from "@/components/movie/MovieCardSkeleton";
import { useDebounce } from "@/hooks/useDebounce";
import type { MovieSummary } from "@/types";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean((searchParams.get("q") ?? "").trim()));
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const debouncedQuery = useDebounce(query, 300);

  const doFetch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/movies?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error("fetch failed");
      const json: { data?: MovieSummary[] } = await res.json();
      setResults(json.data ?? []);
    } catch {
      setError("Không tải được. Thử lại.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync URL when debouncedQuery changes
  useEffect(() => {
    const url = debouncedQuery.trim()
      ? `/search?q=${encodeURIComponent(debouncedQuery.trim())}`
      : "/search";
    router.replace(url, { scroll: false });
  }, [debouncedQuery, router]);

  // Fetch results when debouncedQuery or retry changes
  useEffect(() => {
    doFetch(debouncedQuery);
  }, [debouncedQuery, retry, doFetch]);

  const trimmedQuery = query.trim();
  const trimmedDebounced = debouncedQuery.trim();

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Search input */}
      <div className="w-full">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm phim..."
          aria-label="Tìm kiếm phim trên trang kết quả"
          className="w-full bg-surface border border-border rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {/* Results area */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => setRetry((r) => r + 1)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Thử lại
          </button>
        </div>
      ) : !trimmedQuery ? (
        <p className="text-muted-foreground text-center py-16">
          Nhập tên phim để tìm kiếm
        </p>
      ) : results.length === 0 && trimmedDebounced ? (
        <p className="text-muted-foreground text-center py-16">
          Chưa có phim nào. Hãy khám phá thêm →
        </p>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
