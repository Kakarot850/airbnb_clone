"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { StarIcon } from "@/components/ui/Stars";
import { formatLocation, formatPrice, formatRating } from "@/lib/format";
import type { ListingCard } from "@/lib/types";
import { TILE_ATTRIBUTION, TILE_URL } from "./config";

function priceIcon(price: number, active: boolean) {
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<span class="price-pin${active ? " is-active" : ""}">${formatPrice(price)}</span>`,
  });
}

/** Zooms the map so every listing is visible. */
function FitToListings({ listings }: { listings: ListingCard[] }) {
  const map = useMap();
  useEffect(() => {
    if (listings.length === 0) return;
    const bounds = L.latLngBounds(listings.map((listing) => [listing.latitude, listing.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
  }, [listings, map]);
  return null;
}

/** Interactive map with a price pin per listing; clicking a pin opens a mini card. */
export default function ListingsMapInner({ listings, query }: { listings: ListingCard[]; query?: string }) {
  const [activeId, setActiveId] = useState<number | null>(null);
  return (
    <MapContainer center={[20, 0]} zoom={2} minZoom={2} className="h-full w-full" worldCopyJump>
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <FitToListings listings={listings} />
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.latitude, listing.longitude]}
          icon={priceIcon(listing.price_per_night, activeId === listing.id)}
          eventHandlers={{ popupopen: () => setActiveId(listing.id), popupclose: () => setActiveId(null) }}
        >
          <Popup closeButton={false} offset={[0, -12]}>
            <Link href={`/rooms/${listing.id}${query ? `?${query}` : ""}`} className="block text-[#222]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={listing.image_urls[0]} alt={listing.title} className="aspect-[3/2] w-full object-cover" />
              <div className="space-y-0.5 p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="truncate font-semibold">{formatLocation(listing)}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    <StarIcon /> {listing.review_count ? formatRating(listing.rating_avg) : "New"}
                  </span>
                </div>
                <p className="truncate text-[#6a6a6a]">{listing.title}</p>
                <p>
                  <span className="font-semibold">{formatPrice(listing.price_per_night)}</span> night
                </p>
              </div>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
