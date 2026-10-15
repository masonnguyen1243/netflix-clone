import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold text-primary">403</h1>
      <p className="mt-4 text-xl text-muted-foreground">
        Bạn không có quyền truy cập
      </p>
      <Link
        href="/home"
        className="mt-8 inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary-hover transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        Về trang chủ
      </Link>
    </main>
  );
}
