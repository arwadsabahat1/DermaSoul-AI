type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded-xl bg-forest-900/10 ${className}`.trim()} aria-hidden />;
}

export function SkeletonLines({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, idx) => (
        <Skeleton key={idx} className={`h-3 ${idx === rows - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}
