import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

/** A row of filled stars (used on review cards). */
export default function Stars({ rating, className = "h-2.5 w-2.5" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-px" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn(className, n <= rating ? "text-ink" : "text-line")} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
}

/** The single small star used next to ratings: "★ 4.92" */
export function StarIcon({ className = "h-3 w-3" }: { className?: string }) {
  return <Star className={className} fill="currentColor" strokeWidth={0} aria-hidden="true" />;
}
