"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import type { MovieSummary } from "@/types";

export function SearchBar() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/movies?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((json: { data?: MovieSummary[] }) => {
        if (cancelled) return;
        const items = (json.data ?? []).slice(0, 6);
        setResults(items);
        setIsOpen(items.length > 0);
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
          setIsOpen(false);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // Click-outside handler
  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  }

  const searchUrl = `/search?q=${encodeURIComponent(query.trim())}`;

  return (
    <div
      ref={containerRef}
      className="relative hidden md:flex flex-1 justify-center px-4"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tìm kiếm phim..."
        role="combobox"
        aria-label="Tìm kiếm phim"
        aria-expanded={isOpen}
        aria-controls="search-dropdown"
        aria-busy={isLoading}
        className="w-[200px] motion-safe:focus:w-[400px] motion-safe:transition-[width] motion-safe:duration-200 ease-out bg-surface border border-border rounded-full px-4 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />

      {isOpen && (
        <div
          role="listbox"
          id="search-dropdown"
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-[400px] bg-surface-elevated border border-border rounded-lg shadow-lg z-50 overflow-hidden"
        >
          {results.map((movie) => (
            <a
              key={movie.id}
              href={`/movie/${movie.id}`}
              role="option"
              aria-selected={false}
              className="flex items-center gap-3 px-3 py-2 hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex-shrink-0 w-8 h-12 relative overflow-hidden rounded">
                <Image
                  src={movie.poster_url}
                  alt={movie.title}
                  width={32}
                  height={48}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm text-foreground truncate">
                  {movie.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {movie.year}
                </span>
              </div>
            </a>
          ))}
          <button
            role="option"
            aria-selected={false}
            onClick={() => {
              router.push(searchUrl);
              setIsOpen(false);
            }}
            className="block w-full text-center text-sm text-primary py-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Xem tất cả
          </button>
        </div>
      )}
    </div>
  );
}
