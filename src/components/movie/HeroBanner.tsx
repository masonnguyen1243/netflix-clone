import Image from "next/image";
import type { MovieSummary } from "@/types";

interface HeroBannerProps {
  movie: MovieSummary;
}

export function HeroBanner({ movie }: HeroBannerProps) {
  const { title, poster_url } = movie;

  return (
    <section className="relative min-h-[50vh] md:min-h-[65vh] overflow-hidden">
      {/* Backdrop image */}
      <Image
        src={poster_url}
        fill
        alt=""
        style={{ objectFit: "cover" }}
        className="opacity-60"
        sizes="100vw"
        priority
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-end pb-12 md:pb-16 px-[clamp(1rem,4vw,4rem)]">
        <div className="max-w-[600px] flex flex-col gap-4">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground line-clamp-2">
            {title}
          </h1>
          <div className="flex gap-3 flex-wrap">
            {/* Xem ngay */}
            <button
              className="px-4 py-2 rounded font-semibold flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-safe:transition-colors"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <polygon points="5,3 19,12 5,21" />
              </svg>
              Xem ngay
            </button>

            {/* Thêm vào danh sách (static) */}
            <button
              className="px-4 py-2 rounded font-semibold flex items-center gap-2 border border-foreground/60 text-foreground bg-transparent hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-safe:transition-colors"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
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
          </div>
        </div>
      </div>
    </section>
  );
}
