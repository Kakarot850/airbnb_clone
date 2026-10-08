import { LocationMap } from "@/components/map";
import { formatLocation } from "@/lib/format";
import type { ListingDetail } from "@/lib/types";

/** "Where you'll be": map with the listing's approximate location. */
export default function LocationSection({ listing }: { listing: ListingDetail }) {
  return (
    <section id="location" className="border-t border-divider py-12">
      <h2 className="mb-6 text-[22px] font-semibold">Where you&apos;ll be</h2>
      <div className="h-[360px] overflow-hidden rounded-xl md:h-[480px]">
        <LocationMap latitude={listing.latitude} longitude={listing.longitude} />
      </div>
      <p className="mt-6 text-base font-semibold">{formatLocation(listing)}</p>
      <p className="mt-1 text-base text-muted">Exact location is provided after booking.</p>
    </section>
  );
}
