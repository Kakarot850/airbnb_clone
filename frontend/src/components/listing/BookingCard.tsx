"use client";

import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronUp, Flag } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import PriceBreakdown from "@/components/booking/PriceBreakdown";
import DateRangePicker from "@/components/ui/DateRangePicker";
import GuestPicker from "@/components/ui/GuestPicker";
import { LoadingDots } from "@/components/ui/Loading";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/lib/cn";
import { nightsBetween } from "@/lib/dates";
import { formatPrice, guestsSummary, plural } from "@/lib/format";
import type { DateRange, GuestCounts, ListingDetail, Quote } from "@/lib/types";

interface BookingCardProps {
  listing: ListingDetail;
  booked: DateRange[];
  checkIn: string | null;
  checkOut: string | null;
  guests: GuestCounts;
  onDatesChange: (checkIn: string | null, checkOut: string | null) => void;
  onGuestsChange: (guests: GuestCounts) => void;
  quote: Quote | null;
  quoteLoading: boolean;
  onReserve: () => void;
  isOwnListing: boolean;
}

const shortDate = (date: string | null) => (date ? format(parseISO(date), "M/d/yyyy") : "Add date");

/** Sticky reservation card on the right of the listing page. */
export default function BookingCard(props: BookingCardProps) {
  const { listing, booked, checkIn, checkOut, guests, quote, quoteLoading } = props;
  const [datesOpen, setDatesOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const datesRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);
  useClickOutside(datesRef, () => setDatesOpen(false), datesOpen);
  useClickOutside(guestsRef, () => setGuestsOpen(false), guestsOpen);

  const hasDates = Boolean(checkIn && checkOut);
  const label = "text-[10px] font-extrabold uppercase tracking-wide";

  function reserve() {
    if (!hasDates) setDatesOpen(true); // "Check availability" opens the calendar
    else props.onReserve();
  }

  const dateFields = (
    <div className="grid grid-cols-2">
      <button type="button" onClick={() => setDatesOpen(true)} className={cn("rounded-tl-lg p-3 text-left", datesOpen && !checkIn && "rounded-lg ring-2 ring-ink")}>
        <p className={label}>Check-in</p>
        <p className={cn("text-sm", !checkIn && "text-muted")}>{shortDate(checkIn)}</p>
      </button>
      <button type="button" onClick={() => setDatesOpen(true)} className={cn("rounded-tr-lg border-l border-faint p-3 text-left", datesOpen && checkIn && !checkOut && "rounded-lg ring-2 ring-ink")}>
        <p className={label}>Checkout</p>
        <p className={cn("text-sm", !checkOut && "text-muted")}>{shortDate(checkOut)}</p>
      </button>
    </div>
  );

  return (
    <div>
      <div className="relative rounded-xl border border-line p-6 shadow-card">
        {hasDates ? (
          <p className="text-base">
            <span className="text-[22px] font-semibold">{formatPrice(listing.price_per_night)}</span> night
          </p>
        ) : (
          <p className="text-[22px] font-semibold">Add dates for prices</p>
        )}

        <div className="relative mt-6 rounded-lg border border-faint">
          <div className="border-b border-faint">{dateFields}</div>
          <div ref={guestsRef}>
            <button type="button" onClick={() => setGuestsOpen((open) => !open)} className="flex w-full items-center justify-between p-3 text-left">
              <span>
                <span className={`block ${label}`}>Guests</span>
                <span className="block text-sm">{guestsSummary(guests)}</span>
              </span>
              {guestsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            {guestsOpen && (
              <div className="absolute inset-x-0 top-full z-30 mt-1 rounded-lg bg-canvas px-4 py-2 shadow-float">
                <GuestPicker value={guests} onChange={props.onGuestsChange} maxGuests={listing.max_guests} minAdults={1} />
                <p className="pb-2 text-sm text-muted">
                  This place has a maximum of {plural(listing.max_guests, "guest")}, not including infants.
                </p>
                <div className="flex justify-end pb-2">
                  <button type="button" onClick={() => setGuestsOpen(false)} className="rounded-lg px-3 py-2 text-base font-semibold underline hover:bg-soft">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {datesOpen && (
            <div ref={datesRef} className="absolute -right-6 -top-6 z-40 w-[680px] rounded-2xl bg-canvas px-8 pb-5 pt-6 shadow-float">
              <div className="mb-6 flex items-start justify-between gap-6">
                <div>
                  <h3 className="text-[22px] font-semibold">
                    {hasDates ? plural(nightsBetween(checkIn!, checkOut!), "night") : checkIn ? "Select checkout date" : "Select dates"}
                  </h3>
                  <p className="text-sm text-muted">
                    {hasDates
                      ? `${format(parseISO(checkIn!), "MMM d, yyyy")} - ${format(parseISO(checkOut!), "MMM d, yyyy")}`
                      : "Add your travel dates for exact pricing"}
                  </p>
                </div>
                <div className="w-72 shrink-0 rounded-lg border border-faint">{dateFields}</div>
              </div>
              <DateRangePicker checkIn={checkIn} checkOut={checkOut} onChange={props.onDatesChange} booked={booked} />
              <div className="mt-4 flex items-center justify-end gap-4">
                <button type="button" onClick={() => props.onDatesChange(null, null)} className="rounded-lg px-3 py-2 text-sm font-semibold underline hover:bg-soft">
                  Clear dates
                </button>
                <button type="button" onClick={() => setDatesOpen(false)} className="rounded-lg bg-ink px-6 py-2.5 text-sm font-semibold text-canvas">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {props.isOwnListing ? (
          <div className="mt-4 rounded-lg bg-soft p-4 text-center text-sm">
            <p className="font-semibold">You&apos;re the host of this place.</p>
            <Link href={`/host/listings/${listing.id}/edit`} className="mt-1 inline-block font-semibold underline">
              Edit listing
            </Link>
          </div>
        ) : (
          <button type="button" onClick={reserve} className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-brand-gradient text-base font-semibold text-white">
            {hasDates ? "Reserve" : "Check availability"}
          </button>
        )}

        {hasDates && (
          <div className="mt-4">
            {quoteLoading && (
              <div className="flex justify-center py-6">
                <LoadingDots />
              </div>
            )}
            {quote && (
              <>
                {quote.available ? (
                  <p className="mb-6 text-center text-sm">You won&apos;t be charged yet</p>
                ) : (
                  <p className="mb-6 rounded-lg bg-[#fff8f6] p-3 text-center text-sm font-semibold text-error dark:bg-soft">{quote.message}</p>
                )}
                <PriceBreakdown price={quote} />
              </>
            )}
          </div>
        )}
      </div>
      <p className="mt-6 flex items-center justify-center gap-3 text-sm text-muted">
        <Flag className="h-4 w-4" /> <span className="underline">Report this listing</span>
      </p>
    </div>
  );
}
