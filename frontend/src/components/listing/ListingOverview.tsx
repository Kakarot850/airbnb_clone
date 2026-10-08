import { Award, CalendarCheck, DoorOpen, KeyRound, MapPin, Medal, Waves } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { StarIcon } from "@/components/ui/Stars";
import { formatBathrooms, formatLocation, formatRating, placeKind, plural, yearsSince } from "@/lib/format";
import type { ListingDetail } from "@/lib/types";
import { Laurel } from "./Laurels";

/** Up to three highlights derived from the listing's data (Airbnb shows similar ones). */
function highlights(listing: ListingDetail) {
  const names = new Set(listing.amenities.map((a) => a.name));
  const items: { icon: React.ReactNode; title: string; text: string }[] = [];
  if (listing.host.is_superhost)
    items.push({ icon: <Medal className="h-6 w-6" />, title: `${listing.host.name.split(" ")[0]} is a Superhost`, text: "Superhosts are experienced, highly rated hosts." });
  if (names.has("Pool")) items.push({ icon: <Waves className="h-6 w-6" />, title: "Dive right in", text: "This is one of the few places in the area with a pool." });
  if (names.has("Self check-in")) items.push({ icon: <KeyRound className="h-6 w-6" />, title: "Self check-in", text: "Check yourself in with the keypad." });
  if (listing.rating_avg >= 4.8 && listing.review_count >= 3)
    items.push({ icon: <MapPin className="h-6 w-6" />, title: "Great location", text: "Recent guests loved the location." });
  items.push({ icon: <CalendarCheck className="h-6 w-6" />, title: "Free cancellation before check-in", text: "Get a full refund if you change your mind." });
  items.push({ icon: <DoorOpen className="h-6 w-6" />, title: "Peace and quiet", text: "Guests say it's a peaceful place to unwind." });
  return items.slice(0, 3);
}

/** Left column header: type & location, capacity, rating / Guest favorite badge, host and highlights. */
export default function ListingOverview({ listing }: { listing: ListingDetail }) {
  const years = yearsSince(listing.host.created_at);
  return (
    <>
      <section className="pb-8">
        <h2 className="text-[22px] font-semibold">
          {placeKind(listing.room_type, listing.property_type)} in {formatLocation(listing)}
        </h2>
        <p className="mt-1 text-base">
          {plural(listing.max_guests, "guest")} · {plural(listing.bedrooms, "bedroom")} · {plural(listing.beds, "bed")} ·{" "}
          {formatBathrooms(listing.bathrooms)}
        </p>

        {listing.is_guest_favorite ? (
          <div className="mt-8 flex items-center gap-4 rounded-xl border border-line px-6 py-5">
            <div className="flex items-center gap-1 text-center">
              <Laurel className="h-9 w-auto" />
              <p className="text-base font-semibold leading-5">
                Guest
                <br />
                favorite
              </p>
              <Laurel flip className="h-9 w-auto" />
            </div>
            <p className="hidden flex-1 text-base font-semibold lg:block">One of the most loved homes on Airbnb, according to guests</p>
            <div className="ml-auto flex items-center divide-x divide-line text-center">
              <div className="px-4">
                <p className="text-lg font-semibold leading-6">{formatRating(listing.rating_avg)}</p>
                <p className="flex justify-center"><StarIcon className="h-2.5 w-2.5" /><StarIcon className="h-2.5 w-2.5" /><StarIcon className="h-2.5 w-2.5" /><StarIcon className="h-2.5 w-2.5" /><StarIcon className="h-2.5 w-2.5" /></p>
              </div>
              <a href="#reviews" className="px-4">
                <p className="text-lg font-semibold leading-6">{listing.review_count}</p>
                <p className="text-xs font-semibold underline">Reviews</p>
              </a>
            </div>
          </div>
        ) : (
          <p className="mt-2 flex items-center gap-1 text-base font-semibold">
            <StarIcon className="h-3.5 w-3.5" />
            {listing.review_count > 0 ? (
              <>
                {formatRating(listing.rating_avg)} ·{" "}
                <a href="#reviews" className="underline">{plural(listing.review_count, "review")}</a>
              </>
            ) : (
              "New"
            )}
          </p>
        )}
      </section>

      <section className="flex items-center gap-5 border-t border-divider py-6">
        <div className="relative">
          <Avatar src={listing.host.avatar_url} name={listing.host.name} className="h-10 w-10" />
          {listing.host.is_superhost && (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white ring-2 ring-canvas">
              <Award className="h-3 w-3" />
            </span>
          )}
        </div>
        <div>
          <p className="text-base font-semibold">Hosted by {listing.host.name.split(" ")[0]}</p>
          <p className="text-sm text-muted">
            {listing.host.is_superhost ? "Superhost · " : ""}
            {years < 1 ? "New host" : `${plural(years, "year")} hosting`}
          </p>
        </div>
      </section>

      <section className="space-y-6 border-t border-divider py-8">
        {highlights(listing).map((item) => (
          <div key={item.title} className="flex gap-6">
            <span className="mt-0.5 shrink-0">{item.icon}</span>
            <div>
              <p className="text-base font-semibold">{item.title}</p>
              <p className="text-sm text-muted">{item.text}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
