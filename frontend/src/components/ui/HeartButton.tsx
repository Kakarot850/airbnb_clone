"use client";

import { useWishlist } from "@/context/WishlistContext";
import { cn } from "@/lib/cn";

/** The wishlist heart drawn on listing photos. Filled pink when saved. */
export default function HeartButton({ listing, className }: { listing: { id: number; image_urls: string[] }; className?: string }) {
  const { isSaved, toggleSaved } = useWishlist();
  const saved = isSaved(listing.id);
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={saved}
      className={cn("transition-transform hover:scale-110 active:scale-95", className)}
      onClick={(event) => {
        event.preventDefault(); // the heart sits inside the card's link
        event.stopPropagation();
        toggleSaved(listing);
      }}
    >
      <svg viewBox="0 0 32 32" className="h-6 w-6 overflow-visible" aria-hidden="true">
        <path
          d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z"
          fill={saved ? "#ff385c" : "rgba(0, 0, 0, 0.5)"}
          stroke="white"
          strokeWidth={2}
        />
      </svg>
    </button>
  );
}
