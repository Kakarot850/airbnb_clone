"use client";

import { MapPin, Navigation } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { api } from "@/lib/api";
import { formatLocation, plural } from "@/lib/format";
import type { LocationSuggestion } from "@/lib/types";

/** "Where" dropdown: popular destinations, filtered as the user types. */
export default function LocationSuggestions({ query, onSelect }: { query: string; onSelect: (location: string) => void }) {
  const search = useDebounce(query.trim(), 250);
  const [results, setResults] = useState<{ search: string; items: LocationSuggestion[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .locations(search || undefined)
      .then((items) => !cancelled && setResults({ search, items }))
      .catch(() => !cancelled && setResults({ search, items: [] }));
    return () => {
      cancelled = true;
    };
  }, [search]);

  const row = "flex w-full items-center gap-4 rounded-xl p-3 text-left transition hover:bg-soft";
  const tile = "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-soft text-ink";

  return (
    <div>
      {!search && <p className="px-3 pb-2 text-xs font-semibold">Suggested destinations</p>}
      {!search && (
        <button type="button" className={row} onClick={() => onSelect("")}>
          <span className={tile}>
            <Navigation className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold">I&apos;m flexible</span>
            <span className="block text-sm text-muted">Discover stays all around the world</span>
          </span>
        </button>
      )}
      {results?.items.map((place) => (
        <button key={`${place.city}-${place.country}`} type="button" className={row} onClick={() => onSelect(formatLocation(place))}>
          <span className={tile}>
            <MapPin className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{formatLocation(place)}</span>
            <span className="block truncate text-sm text-muted">
              {place.state ? `${place.state}, ${place.country}` : place.country} · {plural(place.listing_count, "stay")}
            </span>
          </span>
        </button>
      ))}
      {results && results.search && results.items.length === 0 && (
        <p className="px-3 py-4 text-sm text-muted">No destinations match &ldquo;{results.search}&rdquo;. Try a city or country.</p>
      )}
    </div>
  );
}
