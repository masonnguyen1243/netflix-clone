"use client";

import { useState } from "react";
import { toast } from "sonner";

interface WatchlistButtonProps {
  movieId: string;
  initialInWatchlist?: boolean;
}

export function WatchlistButton({
  movieId,
  initialInWatchlist = false,
}: WatchlistButtonProps) {
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (isLoading) return;

    // Optimistic update
    const prevState = inWatchlist;
    setInWatchlist(!prevState);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/watchlist/${movieId}`, { method: "POST" });

      if (!res.ok) {
        // Rollback
        setInWatchlist(prevState);
        toast("Không tải được. Thử lại.", { duration: 2000 });
        return;
      }

      const json = await res.json();
      const confirmed = json?.data?.inWatchlist ?? !prevState;
      setInWatchlist(confirmed);

      if (confirmed) {
        toast("Đã thêm vào danh sách", { duration: 2000 });
      } else {
        toast("Đã xóa", { duration: 2000 });
      }
    } catch {
      // Rollback
      setInWatchlist(prevState);
      toast("Không tải được. Thử lại.", { duration: 2000 });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={inWatchlist ? "Đã lưu" : "Thêm vào danh sách"}
      disabled={isLoading}
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-safe:transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {/* Bookmark icon — filled amber when inWatchlist, outline when not */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={inWatchlist ? "#f59e0b" : "none"}
        stroke={inWatchlist ? "#f59e0b" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {inWatchlist ? "Đã lưu" : "Thêm vào danh sách"}
    </button>
  );
}
