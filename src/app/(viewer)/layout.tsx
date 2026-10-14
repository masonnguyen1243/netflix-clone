import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-[clamp(1rem,4vw,4rem)] max-w-[1400px] mx-auto w-full py-6 pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
