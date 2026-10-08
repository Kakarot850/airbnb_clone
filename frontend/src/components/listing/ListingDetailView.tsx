"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { Skeleton } from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useQuote } from "@/hooks/useQuote";
import { api } from "@/lib/api";
import { formatDateRange, formatPrice } from "@/lib/format";
import type { DateRange, GuestCounts, ListingDetail, ListingReviews } from "@/lib/types";
import AmenitiesSection from "./AmenitiesSection";
import BookingCard from "./BookingCard";
import CalendarSection from "./CalendarSection";
import Description from "./Description";
import HostSection from "./HostSection";
import ListingOverview from "./ListingOverview";
import ListingTitleBar from "./ListingTitleBar";
import LocationSection from "./LocationSection";
import PhotoGallery from "./PhotoGallery";
import ReviewsSection from "./ReviewsSection";
import ThingsToKnow from "./ThingsToKnow";

function readGuests(params: URLSearchParams): GuestCounts {
  const n = (key: string) => Math.max(Number(params.get(key)) || 0, 0);
  return { adults: Math.max(n("adults"), 1), children: n("children"), infants: n("infants"), pets: n("pets") };
}

function DetailSkeleton() {
  return (
    <div className="detail-container pt-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="mt-6 h-[min(56vh,520px)] w-full rounded-xl" />
      <div className="mt-10 grid gap-16 md:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="hidden h-80 md:block" />
      </div>
    </div>
  );
}

/** The listing page (/rooms/[id]). Holds the selected dates/guests shared by the calendar and booking card. */
export default function ListingDetailView({ id }: { id: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const { user, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [booked, setBooked] = useState<DateRange[]>([]);
  const [reviews, setReviews] = useState<ListingReviews | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<string | null>(params.get("checkin"));
  const [checkOut, setCheckOut] = useState<string | null>(params.get("checkout"));
  const [guests, setGuests] = useState<GuestCounts>(() => readGuests(new URLSearchParams(params.toString())));
  const [mobileDatesOpen, setMobileDatesOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getListing(id), api.availability(id), api.listingReviews(id)])
      .then(([detail, availability, listingReviews]) => {
        if (cancelled) return;
        setListing(detail);
        setBooked(availability.booked);
        setReviews(listingReviews);
      })
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const { quote, loading: quoteLoading } = useQuote(id, checkIn, checkOut, guests.adults + guests.children);

  // Keep dates and guests in the URL so the page can be shared or refreshed.
  function syncUrl(nextCheckIn: string | null, nextCheckOut: string | null, nextGuests: GuestCounts) {
    const query = new URLSearchParams();
    if (nextCheckIn) query.set("checkin", nextCheckIn);
    if (nextCheckOut) query.set("checkout", nextCheckOut);
    Object.entries(nextGuests).forEach(([key, value]) => value && query.set(key, String(value)));
    window.history.replaceState(null, "", `/rooms/${id}${query.size ? `?${query}` : ""}`);
  }

  function changeDates(nextCheckIn: string | null, nextCheckOut: string | null) {
    setCheckIn(nextCheckIn);
    setCheckOut(nextCheckOut);
    syncUrl(nextCheckIn, nextCheckOut, guests);
  }

  function changeGuests(next: GuestCounts) {
    setGuests(next);
    syncUrl(checkIn, checkOut, next);
  }

  function reserve() {
    if (!checkIn || !checkOut) {
      setMobileDatesOpen(true);
      return;
    }
    if (quote && !quote.available) {
      showToast(quote.message ?? "Those dates are not available.", { type: "error" });
      return;
    }
    if (!user) {
      openAuthModal();
      return;
    }
    const query = new URLSearchParams({ checkin: checkIn, checkout: checkOut });
    Object.entries(guests).forEach(([key, value]) => query.set(key, String(value)));
    router.push(`/book/${id}?${query}`);
  }

  if (error) {
    return (
      <div className="detail-container py-24 text-center">
        <h1 className="text-[32px] font-semibold">This place isn&apos;t available</h1>
        <p className="mt-2 text-muted">{error}</p>
        <Link href="/" className="mt-8 inline-block rounded-lg bg-ink px-6 py-3 font-semibold text-canvas">
          Explore other stays
        </Link>
      </div>
    );
  }
  if (!listing) return <DetailSkeleton />;

  const isOwnListing = user?.id === listing.host_id;

  return (
    <div className="detail-container pb-28 md:pb-16">
      <Link href="/" className="mt-4 inline-flex items-center gap-1 rounded-full p-1 text-sm font-semibold md:hidden">
        <ChevronLeft className="h-5 w-5" /> Homes
      </Link>
      <ListingTitleBar listing={listing} />
      <PhotoGallery images={listing.image_urls} title={listing.title} />

      <div className="mt-8 flex gap-[8%] md:mt-12">
        <div className="min-w-0 flex-1 md:w-[58%] md:flex-none">
          <ListingOverview listing={listing} />
          <Description text={listing.description} />
          <AmenitiesSection amenities={listing.amenities} />
          <CalendarSection city={listing.city} booked={booked} checkIn={checkIn} checkOut={checkOut} onChange={changeDates} />
        </div>
        <aside className="hidden w-[34%] md:block">
          <div className="sticky top-28">
            <BookingCard
              listing={listing}
              booked={booked}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              onDatesChange={changeDates}
              onGuestsChange={changeGuests}
              quote={quote}
              quoteLoading={quoteLoading}
              onReserve={reserve}
              isOwnListing={isOwnListing}
            />
          </div>
        </aside>
      </div>

      <ReviewsSection listing={listing} reviews={reviews} />
      <LocationSection listing={listing} />
      <HostSection host={listing.host} />
      <ThingsToKnow listing={listing} />

      {/* Phones: price + Reserve bar fixed at the bottom */}
      {!isOwnListing && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-divider bg-canvas px-6 py-4 md:hidden">
          <div>
            {quote ? (
              <p className="text-base">
                <span className="font-semibold underline">{formatPrice(quote.total)}</span> total
              </p>
            ) : (
              <p className="text-base">
                <span className="font-semibold">{formatPrice(listing.price_per_night)}</span> night
              </p>
            )}
            <button onClick={() => setMobileDatesOpen(true)} className="text-sm font-semibold underline">
              {checkIn && checkOut ? formatDateRange(checkIn, checkOut) : "Add dates"}
            </button>
          </div>
          <button onClick={reserve} className="rounded-lg bg-brand-gradient px-7 py-3.5 text-base font-semibold text-white">
            {checkIn && checkOut ? "Reserve" : "Check availability"}
          </button>
        </div>
      )}

      <Modal
        open={mobileDatesOpen}
        onClose={() => setMobileDatesOpen(false)}
        title="Select dates"
        footer={
          <div className="flex items-center justify-between">
            <button className="text-base font-semibold underline" onClick={() => changeDates(null, null)}>
              Clear dates
            </button>
            <button className="rounded-lg bg-ink px-6 py-3 font-semibold text-canvas" onClick={() => setMobileDatesOpen(false)}>
              Save
            </button>
          </div>
        }
      >
        <DateRangePicker checkIn={checkIn} checkOut={checkOut} onChange={changeDates} booked={booked} months={1} />
      </Modal>
    </div>
  );
}
