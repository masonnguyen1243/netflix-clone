import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { SearchBar } from "@/components/layout/SearchBar";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border h-16 flex items-center px-[clamp(1rem,4vw,4rem)]">
      {/* Logo */}
      <div className="flex-shrink-0">
        <Link
          href="/home"
          className="text-primary font-bold text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          FilmVN
        </Link>
      </div>

      {/* Search — desktop only */}
      <SearchBar />

      {/* Nav links (desktop only) + UserButton */}
      <nav aria-label="Điều hướng chính" className="flex items-center gap-6">
        <Link
          href="/home"
          className="hidden md:block text-sm text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          Trang chủ
        </Link>
        <Link
          href="/my-list"
          className="hidden md:block text-sm text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          Danh sách của tôi
        </Link>
        <Link
          href="/history"
          className="hidden md:block text-sm text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          Lịch sử
        </Link>
        <UserButton />
      </nav>
    </header>
  );
}
