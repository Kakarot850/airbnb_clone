import { CalendarX, Clock, ShieldCheck } from "lucide-react";
import { plural } from "@/lib/format";
import type { ListingDetail } from "@/lib/types";

/** House rules, safety and cancellation policy. */
export default function ThingsToKnow({ listing }: { listing: ListingDetail }) {
  const has = (name: string) => listing.amenities.some((amenity) => amenity.name === name);
  return (
    <section className="border-t border-divider py-12">
      <h2 className="mb-6 text-[22px] font-semibold">Things to know</h2>
      <div className="grid gap-8 text-base md:grid-cols-3">
        <div>
          <Clock className="mb-4 h-6 w-6" />
          <h3 className="font-semibold">House rules</h3>
          <ul className="mt-2 space-y-2">
            <li>Check-in after 3:00 PM</li>
            <li>Checkout before 11:00 AM</li>
            <li>{plural(listing.max_guests, "guest")} maximum</li>
            <li>{has("Pets allowed") ? "Pets allowed" : "No pets"}</li>
          </ul>
        </div>
        <div>
          <ShieldCheck className="mb-4 h-6 w-6" />
          <h3 className="font-semibold">Safety &amp; property</h3>
          <ul className="mt-2 space-y-2">
            <li>{has("Smoke alarm") ? "Smoke alarm" : "Smoke alarm not reported"}</li>
            <li>{has("Carbon monoxide alarm") ? "Carbon monoxide alarm" : "Carbon monoxide alarm not reported"}</li>
            <li>{has("First aid kit") ? "First aid kit" : "First aid kit not reported"}</li>
          </ul>
        </div>
        <div>
          <CalendarX className="mb-4 h-6 w-6" />
          <h3 className="font-semibold">Cancellation policy</h3>
          <p className="mt-2">Free cancellation before check-in. After that, the reservation is non-refundable.</p>
        </div>
      </div>
    </section>
  );
}
