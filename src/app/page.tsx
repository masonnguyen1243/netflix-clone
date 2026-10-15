import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-[clamp(1rem,4vw,4rem)] text-center">
      <h1 className="text-5xl font-bold text-primary">FilmVN</h1>
      <p className="mt-4 text-xl text-muted-foreground">
        Xem phim trực tuyến miễn phí
      </p>
      <Link
        href="/sign-in"
        className="mt-8 inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary-hover transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        Đăng nhập
      </Link>
    </main>
  );
}
