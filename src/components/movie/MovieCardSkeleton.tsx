export function MovieCardSkeleton() {
  return (
    <div
      className="aspect-[2/3] rounded-lg bg-surface animate-pulse motion-reduce:animate-none motion-reduce:opacity-50"
      aria-hidden="true"
    />
  );
}
