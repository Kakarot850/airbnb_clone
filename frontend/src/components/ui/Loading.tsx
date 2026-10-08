import { cn } from "@/lib/cn";

/** Airbnb's three pulsing dots loader. */
export function LoadingDots({ className, dotClassName = "bg-current" }: { className?: string; dotClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} role="status" aria-label="Loading">
      {[0, 150, 300].map((delay) => (
        <span key={delay} className={cn("h-1.5 w-1.5 animate-pulse rounded-full", dotClassName)} style={{ animationDelay: `${delay}ms` }} />
      ))}
    </span>
  );
}

/** Grey placeholder block shown while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-soft", className)} />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-ink">
      <LoadingDots className="scale-150" />
    </div>
  );
}
