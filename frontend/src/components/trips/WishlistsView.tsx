"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import LoginPrompt from "@/components/auth/LoginPrompt";
import ListingGrid, { ListingGridSkeleton } from "@/components/explore/ListingGrid";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Loading";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { api } from "@/lib/api";
import type { ListingCard } from "@/lib/types";

/** Saved listings. Un-hearting a card removes it from the list right away. */
export default function WishlistsView() {
  const { user, loading } = useAuth();
  const { isSaved } = useWishlist();
  const [listings, setListings] = useState<ListingCard[] | null>(null);

  useEffect(() => {
    if (user) api.wishlist().then(setListings).catch(() => setListings([]));
  }, [user]);

  if (loading) return <PageLoader />;
  if (!user) return <LoginPrompt title="Wishlists" text="Log in to view and save your favorite places to stay." />;

  const saved = listings?.filter((listing) => isSaved(listing.id)) ?? null;
  return (
    <div className="page-container py-8 md:py-12">
      <h1 className="mb-8 text-[32px] font-semibold">Wishlists</h1>
      {saved === null ? (
        <ListingGridSkeleton count={4} />
      ) : saved.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-8 w-8" />}
          title="Create your first wishlist"
          text="As you search, tap the heart icon to save your favorite places to stay to a wishlist."
          actionLabel="Start exploring"
          actionHref="/"
        />
      ) : (
        <>
          <p className="mb-6 text-base text-muted">{saved.length} saved {saved.length === 1 ? "place" : "places"}</p>
          <ListingGrid listings={saved} />
        </>
      )}
    </div>
  );
}
