import Link from "next/link";
import HeartButton from "@/components/ui/HeartButton";
import ImageCarousel from "@/components/ui/ImageCarousel";
import { StarIcon } from "@/components/ui/Stars";
import { formatDateRange, formatLocation, formatPrice, formatRating, plural } from "@/lib/format";
import type { ListingCard as Listing } from "@/lib/types";

interface ListingCardProps {
  listing: Listing;
  checkIn?: string | null;
  checkOut?: string | null;
  query?: string; // search params to carry over to the listing page (dates, guests)
}

/** One card in the explore grid: photo carousel, heart, location, rating and price. */
export default function ListingCard({ listing, checkIn, checkOut, query }: ListingCardProps) {
  return (
    <Link href={`/rooms/${listing.id}${query ? `?${query}` : ""}`} className="group block">
      <div className="relative aspect-[20/19] overflow-hidden rounded-xl">
        <ImageCarousel images={listing.image_urls} alt={listing.title} className="h-full w-full" />
        {listing.is_guest_favorite && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-[#222] shadow-[0_2px_6px_rgba(0,0,0,0.18)]">
            Guest favorite
          </span>
        )}
        <HeartButton listing={listing} className="absolute right-3 top-3" />
      </div>

      <div className="mt-3 text-[15px] leading-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold">{formatLocation(listing)}</h3>
          <span className="flex shrink-0 items-center gap-1">
            <StarIcon />
            {listing.review_count > 0 ? formatRating(listing.rating_avg) : "New"}
          </span>
        </div>
        <p className="truncate text-muted">{listing.title}</p>
        <p className="truncate text-muted">
          {checkIn && checkOut ? formatDateRange(checkIn, checkOut) : `${plural(listing.bedrooms, "bedroom")} · ${plural(listing.beds, "bed")}`}
        </p>
        <p className="mt-1.5">
          <span className="font-semibold">{formatPrice(listing.price_per_night)}</span> night
          {listing.total_price !== null && (
            <>
              <span className="text-muted"> · </span>
              <span className="text-muted underline">{formatPrice(listing.total_price)} total</span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
