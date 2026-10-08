"use client";

import { List, Map as MapIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ListingsMap } from "@/components/map";
import { useInfiniteListings } from "@/hooks/useInfiniteListings";
import { countActiveFilters, EMPTY_SEARCH, parseSearch, searchUrl, toApiQuery } from "@/lib/search";
import ListingGrid, { ListingGridSkeleton } from "./ListingGrid";

/** The home / search results page: listing grid with infinite scroll, or a map with price pins. */
export default function ExploreView() {
  const router = useRouter();
  const params = useSearchParams();
  const search = parseSearch(new URLSearchParams(params.toString()));
  const { listings, total, loading, loadingMore, hasMore, loadMore, error } = useInfiniteListings(toApiQuery(search));
  const [showMap, setShowMap] = useState(false);

  // Dates and guests are passed on to the listing page so its booking card is pre-filled.
  const carry = new URLSearchParams();
  if (search.checkIn && search.checkOut) {
    carry.set("checkin", search.checkIn);
    carry.set("checkout", search.checkOut);
  }
  if (search.adults) carry.set("adults", String(search.adults));
  if (search.children) carry.set("children", String(search.children));
  const carryQuery = carry.toString();

  const isFiltered = Boolean(search.location || search.checkIn || search.adults || search.category || countActiveFilters(search));

  return (
    <div className="page-container pb-16 pt-6">
      {isFiltered && !loading && total > 0 && (
        <p className="mb-6 text-sm font-semibold">
          {total > 1000 ? "Over 1,000" : total} {total === 1 ? "home" : "homes"}
          {search.location && ` in ${search.location}`}
        </p>
      )}

      {error ? (
        <div className="py-16 text-center">
          <h2 className="text-[22px] font-semibold">Something went wrong</h2>
          <p className="mt-2 text-muted">{error}</p>
        </div>
      ) : loading ? (
        <ListingGridSkeleton />
      ) : listings.length === 0 ? (
        <div className="py-16">
          <h2 className="text-[22px] font-semibold">No exact matches</h2>
          <p className="mt-2 text-base text-muted">Try changing or removing some of your filters or adjusting your search area.</p>
          <button
            onClick={() => router.push(searchUrl(EMPTY_SEARCH))}
            className="mt-6 rounded-lg border border-ink px-6 py-3 text-base font-semibold hover:bg-soft"
          >
            Remove all filters
          </button>
        </div>
      ) : showMap ? (
        <div className="-mx-6 h-[calc(100dvh-230px)] overflow-hidden md:mx-0 md:rounded-xl">
          <ListingsMap listings={listings} query={carryQuery} />
        </div>
      ) : (
        <ListingGrid
          listings={listings}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          checkIn={search.checkIn}
          checkOut={search.checkOut}
          query={carryQuery}
        />
      )}

      {listings.length > 0 && (
        <button
          onClick={() => {
            setShowMap((value) => !value);
            window.scrollTo({ top: 0 });
          }}
          className="fixed bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3.5 text-sm font-semibold text-canvas shadow-card transition hover:scale-105 md:bottom-12"
        >
          {showMap ? "Show list" : "Show map"}
          {showMap ? <List className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
