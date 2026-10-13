import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Trang Web Xem Phim",
  description: "Xem phim trực tuyến",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="vi">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
