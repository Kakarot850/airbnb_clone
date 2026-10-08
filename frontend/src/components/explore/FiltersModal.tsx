"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CounterRow } from "@/components/ui/Counter";
import { LoadingDots, Skeleton } from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import { useDebounce } from "@/hooks/useDebounce";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { PROPERTY_TYPES } from "@/lib/constants";
import { Icon } from "@/lib/icons";
import { clearFilters, countActiveFilters, parseSearch, searchUrl, toApiQuery, type PlaceType, type SearchState } from "@/lib/search";
import type { Amenity, PriceHistogram } from "@/lib/types";
import PriceRange from "./PriceRange";

const PLACE_TYPES: { value: PlaceType; label: string }[] = [
  { value: "any", label: "Any type" },
  { value: "room", label: "Room" },
  { value: "entire_home", label: "Entire home" },
];
const POPULAR_AMENITIES = 6;

/** Airbnb's Filters dialog. Changes stay local until "Show N places" applies them to the URL. */
export default function FiltersModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const [draft, setDraft] = useState<SearchState>(() => parseSearch(new URLSearchParams(params.toString())));
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [histogram, setHistogram] = useState<PriceHistogram | null>(null);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [resultCount, setResultCount] = useState<{ key: string; total: number } | null>(null);

  const debouncedDraft = useDebounce(draft, 300);
  const countKey = JSON.stringify(debouncedDraft);

  useEffect(() => {
    api.amenities().then(setAmenities).catch(() => {});
    api.priceHistogram().then(setHistogram).catch(() => {});
  }, []);

  // Live count for the "Show N places" button.
  useEffect(() => {
    let cancelled = false;
    api
      .searchListings({ ...toApiQuery(debouncedDraft), page: 1, page_size: 1 })
      .then((page) => !cancelled && setResultCount({ key: countKey, total: page.total }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [debouncedDraft, countKey]);

  const update = (patch: Partial<SearchState>) => setDraft((current) => ({ ...current, ...patch }));
  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

  function apply() {
    router.push(searchUrl(draft));
    window.scrollTo({ top: 0 });
    onClose();
  }

  const countReady = resultCount && resultCount.key === JSON.stringify(draft);
  const visibleAmenities = showAllAmenities ? amenities : amenities.slice(0, POPULAR_AMENITIES);
  const amenityGroups = [...new Set(visibleAmenities.map((amenity) => amenity.group_name))];
  const visibleTypes = showAllTypes ? PROPERTY_TYPES : PROPERTY_TYPES.slice(0, 8);
  const section = "border-b border-divider py-8 first:pt-2 last:border-b-0";
  const heading = "text-[22px] font-semibold";

  return (
    <Modal
      open
      onClose={onClose}
      title="Filters"
      size="lg"
      bodyClassName="px-6 py-0"
      footer={
        <div className="flex items-center justify-between">
          <button
            onClick={() => setDraft(clearFilters(draft))}
            disabled={countActiveFilters(draft) === 0}
            className="rounded-lg px-2 py-2 text-base font-semibold underline hover:bg-soft disabled:cursor-not-allowed disabled:text-faint disabled:no-underline disabled:hover:bg-transparent"
          >
            Clear all
          </button>
          <button onClick={apply} className="flex h-12 min-w-40 items-center justify-center rounded-lg bg-ink px-6 text-base font-semibold text-canvas hover:opacity-90">
            {countReady ? (resultCount.total === 0 ? "No exact matches" : `Show ${resultCount.total} place${resultCount.total === 1 ? "" : "s"}`) : <LoadingDots />}
          </button>
        </div>
      }
    >
      <section className={section}>
        <h3 className={heading}>Type of place</h3>
        <div className="mt-6 grid grid-cols-3 rounded-xl border border-line p-1">
          {PLACE_TYPES.map((option) => (
            <button
              key={option.value}
              onClick={() => update({ placeType: option.value })}
              className={cn(
                "rounded-[10px] py-4 text-sm font-semibold transition",
                draft.placeType === option.value ? "bg-ink text-canvas" : "hover:bg-soft",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className={section}>
        <h3 className={heading}>Price range</h3>
        <p className="mb-6 mt-1 text-sm text-muted">Nightly prices before fees and taxes</p>
        {histogram ? (
          <PriceRange
            histogram={histogram}
            min={draft.minPrice}
            max={draft.maxPrice}
            onChange={(minPrice, maxPrice) => update({ minPrice, maxPrice })}
          />
        ) : (
          <Skeleton className="h-36" />
        )}
      </section>

      <section className={section}>
        <h3 className={heading}>Rooms and beds</h3>
        <div className="mt-4">
          {(["bedrooms", "beds", "bathrooms"] as const).map((field) => (
            <CounterRow
              key={field}
              title={field.charAt(0).toUpperCase() + field.slice(1)}
              label={field}
              value={draft[field]}
              max={8}
              format={(value) => (value === 0 ? "Any" : `${value}+`)}
              onChange={(value) => update({ [field]: value })}
            />
          ))}
        </div>
      </section>

      <section className={section}>
        <h3 className={heading}>Amenities</h3>
        {amenityGroups.map((group) => (
          <div key={group} className="mt-6">
            {showAllAmenities && <p className="mb-3 text-base font-semibold">{group}</p>}
            <div className="flex flex-wrap gap-3">
              {visibleAmenities
                .filter((amenity) => amenity.group_name === group)
                .map((amenity) => {
                  const selected = draft.amenities.includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      onClick={() => update({ amenities: toggle(draft.amenities, amenity.id) })}
                      aria-pressed={selected}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition",
                        selected ? "border-ink bg-soft font-semibold ring-1 ring-ink" : "border-line hover:border-ink",
                      )}
                    >
                      <Icon name={amenity.icon} className="h-5 w-5" />
                      {amenity.name}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
        <button onClick={() => setShowAllAmenities((value) => !value)} className="mt-6 text-base font-semibold underline">
          {showAllAmenities ? "Show less" : "Show more"}
        </button>
      </section>

      <section className={section}>
        <h3 className={heading}>Property type</h3>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {visibleTypes.map((type) => {
            const selected = draft.propertyTypes.includes(type.value);
            return (
              <button
                key={type.value}
                onClick={() => update({ propertyTypes: toggle(draft.propertyTypes, type.value) })}
                aria-pressed={selected}
                className={cn(
                  "flex h-[110px] flex-col justify-between rounded-xl border p-4 text-left transition",
                  selected ? "border-ink bg-soft ring-1 ring-ink" : "border-line hover:border-ink",
                )}
              >
                <Icon name={type.icon} className="h-8 w-8" />
                <span className="text-base font-semibold">{type.value}</span>
              </button>
            );
          })}
        </div>
        <button onClick={() => setShowAllTypes((value) => !value)} className="mt-6 text-base font-semibold underline">
          {showAllTypes ? "Show less" : "Show more"}
        </button>
      </section>
    </Modal>
  );
}
