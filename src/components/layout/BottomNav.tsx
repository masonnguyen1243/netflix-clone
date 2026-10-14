"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Trang chủ", href: "/home" },
  { label: "Tìm kiếm", href: "/search" },
  { label: "Danh sách", href: "/my-list" },
  { label: "Tài khoản", href: "/profile" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Điều hướng dưới" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border h-16 flex">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex-1 flex flex-col items-center justify-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
