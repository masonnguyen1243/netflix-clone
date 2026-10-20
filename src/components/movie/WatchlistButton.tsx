"use client";

// Epic 4 Story 4.1 wires the watchlist API

export function WatchlistButton() {
  return (
    <button
      aria-label="Thêm vào danh sách"
      className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-foreground opacity-60 cursor-not-allowed"
      disabled
    >
      {/* Bookmark icon — inline SVG 20×20 */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      Thêm vào danh sách
    </button>
  );
}
