"use client";

import { Share } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";
import type { ListingDetail } from "@/lib/types";

/** Listing title with the "Share" and "Save" buttons on the right. */
export default function ListingTitleBar({ listing }: { listing: ListingDetail }) {
  const { isSaved, toggleSaved } = useWishlist();
  const { showToast } = useToast();
  const saved = isSaved(listing.id);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href.split("?")[0]);
      showToast("Link copied", { type: "success" });
    } catch {
      showToast("Couldn't copy the link", { type: "error" });
    }
  }

  const button = "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold underline hover:bg-soft";
  return (
    <div className="flex items-start justify-between gap-6 pb-6 pt-6">
      <h1 className="text-[22px] font-semibold leading-tight md:text-[26px]">{listing.title}</h1>
      <div className="hidden shrink-0 items-center gap-1 md:flex">
        <button onClick={share} className={button}>
          <Share className="h-4 w-4" /> Share
        </button>
        <button onClick={() => toggleSaved(listing)} className={button}>
          <svg viewBox="0 0 32 32" className="h-4 w-4" aria-hidden="true">
            <path
              d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z"
              fill={saved ? "#ff385c" : "none"}
              stroke={saved ? "#ff385c" : "currentColor"}
              strokeWidth={2.5}
            />
          </svg>
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
