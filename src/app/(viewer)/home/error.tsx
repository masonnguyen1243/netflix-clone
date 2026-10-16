"use client";

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function HomeError({ reset }: ErrorProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-error text-lg">Không tải được. Thử lại.</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded font-semibold hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-safe:transition-colors"
        type="button"
      >
        Thử lại
      </button>
    </div>
  );
}
