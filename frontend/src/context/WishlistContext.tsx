"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

interface SavableListing {
  id: number;
  image_urls: string[];
}

interface WishlistContextValue {
  isSaved: (listingId: number) => boolean;
  toggleSaved: (listing: SavableListing) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const NO_IDS = new Set<number>();

/** Remembers which listings the user saved (the heart icon), so every card can show the right state. */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();
  // Saved ids are remembered per user, so logging out (or switching accounts) never shows stale hearts.
  const [saved, setSaved] = useState<{ userId: number; ids: Set<number> } | null>(null);
  const savedIds = user && saved?.userId === user.id ? saved.ids : NO_IDS;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .wishlist()
      .then((listings) => !cancelled && setSaved({ userId: user.id, ids: new Set(listings.map((listing) => listing.id)) }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const isSaved = useCallback((listingId: number) => savedIds.has(listingId), [savedIds]);

  const toggleSaved = useCallback(
    async (listing: SavableListing) => {
      if (!user) {
        openAuthModal();
        return;
      }
      const wasSaved = savedIds.has(listing.id);
      const update = (save: boolean) =>
        setSaved((current) => {
          const next = new Set(current?.userId === user.id ? current.ids : []);
          if (save) next.add(listing.id);
          else next.delete(listing.id);
          return { userId: user.id, ids: next };
        });

      update(!wasSaved); // optimistic: flip the heart immediately
      try {
        if (wasSaved) {
          await api.removeFromWishlist(listing.id);
          showToast("Removed from Wishlist", { image: listing.image_urls[0] });
        } else {
          await api.saveToWishlist(listing.id);
          showToast("Saved to Wishlist", { image: listing.image_urls[0], action: { label: "View", href: "/wishlists" } });
        }
      } catch (error) {
        update(wasSaved); // roll back
        showToast((error as Error).message, { type: "error" });
      }
    },
    [user, savedIds, openAuthModal, showToast],
  );

  return <WishlistContext.Provider value={{ isSaved, toggleSaved }}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return context;
}
