"use client";

import { useEffect, useRef } from "react";
import { LoadingDots, Skeleton } from "@/components/ui/Loading";
import type { ListingCard as Listing } from "@/lib/types";
import ListingCard from "./ListingCard";

export const GRID_CLASSES =
  "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6";

export function ListingGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className={GRID_CLASSES}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[20/19] rounded-xl" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

interface ListingGridProps {
  listings: Listing[];
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  checkIn?: string | null;
  checkOut?: string | null;
  query?: string;
}

/** Grid of listing cards. When `onLoadMore` is given, more results load as the user nears the bottom. */
export default function ListingGrid({ listings, hasMore, loadingMore, onLoadMore, checkIn, checkOut, query }: ListingGridProps) {
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore || !sentinel.current) return;
    const observer = new IntersectionObserver((entries) => entries[0].isIntersecting && onLoadMore(), { rootMargin: "600px" });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

  return (
    <>
      <div className={GRID_CLASSES}>
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} checkIn={checkIn} checkOut={checkOut} query={query} />
        ))}
      </div>
      <div ref={sentinel} className="flex h-24 items-center justify-center">
        {loadingMore && <LoadingDots className="scale-125" />}
      </div>
    </>
  );
}
