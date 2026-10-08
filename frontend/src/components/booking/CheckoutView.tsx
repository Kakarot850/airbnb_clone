"use client";

import { format, parseISO } from "date-fns";
import { ChevronLeft, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import LoginPrompt from "@/components/auth/LoginPrompt";
import DateRangePicker from "@/components/ui/DateRangePicker";
import GuestPicker from "@/components/ui/GuestPicker";
import { LoadingDots, PageLoader } from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import { StarIcon } from "@/components/ui/Stars";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useQuote } from "@/hooks/useQuote";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDateRange, formatRating, guestsSummary, placeKind, plural } from "@/lib/format";
import { formatCardNumber, formatExpiry, validateCard, type CardForm } from "@/lib/payment";
import type { DateRange, GuestCounts, ListingDetail } from "@/lib/types";
import PriceBreakdown from "./PriceBreakdown";

function readGuests(params: URLSearchParams): GuestCounts {
  const n = (key: string) => Math.max(Number(params.get(key)) || 0, 0);
  return { adults: Math.max(n("adults"), 1), children: n("children"), infants: n("infants"), pets: n("pets") };
}

// Payments are mocked, so the form starts filled with a test card (any valid-looking card works).
const DEMO_CARD: CardForm = { number: "4242 4242 4242 4242", expiry: "12/30", cvv: "123", zip: "94103", country: "United States" };

/** "Confirm and pay" page. Payment is mocked: the card is only validated in the browser. */
export default function CheckoutView({ id }: { id: number }) {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [booked, setBooked] = useState<DateRange[]>([]);
  const [checkIn, setCheckIn] = useState<string | null>(params.get("checkin"));
  const [checkOut, setCheckOut] = useState<string | null>(params.get("checkout"));
  const [guests, setGuests] = useState<GuestCounts>(() => readGuests(new URLSearchParams(params.toString())));
  const [editing, setEditing] = useState<"dates" | "guests" | null>(null);
  const [card, setCard] = useState<CardForm>(DEMO_CARD);
  const [errors, setErrors] = useState<Partial<Record<keyof CardForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.getListing(id), api.availability(id)])
      .then(([detail, availability]) => {
        setListing(detail);
        setBooked(availability.booked);
      })
      .catch(() => router.replace(`/rooms/${id}`));
  }, [id, router]);

  const { quote } = useQuote(id, checkIn, checkOut, guests.adults + guests.children);

  async function confirmAndPay() {
    if (!checkIn || !checkOut) return setEditing("dates");
    const cardErrors = validateCard(card);
    setErrors(cardErrors);
    if (Object.keys(cardErrors).length > 0) return;

    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900)); // pretend to talk to a payment provider
      const booking = await api.createBooking({ listing_id: id, check_in: checkIn, check_out: checkOut, ...guests });
      showToast("Your reservation is confirmed!", { type: "success" });
      router.push(`/trips/${booking.id}?confirmed=1`);
    } catch (error) {
      showToast((error as Error).message, { type: "error" });
      setSubmitting(false);
    }
  }

  if (authLoading || !listing) return <PageLoader />;
  if (!user) return <LoginPrompt title="Confirm and pay" text="Log in or sign up to book this place." />;

  const field = (name: keyof CardForm) =>
    cn("w-full bg-canvas px-3 py-4 text-base outline-none placeholder:text-muted", errors[name] && "bg-[#fff8f6] dark:bg-soft");
  const firstError = Object.values(errors)[0];
  const unavailable = quote !== null && !quote.available;

  return (
    <div className="mx-auto max-w-[1120px] px-6 pb-24 pt-8 md:px-10 md:pt-16">
      <div className="flex items-center gap-2 md:-ml-14">
        <button onClick={() => router.back()} className="rounded-full p-3 hover:bg-soft" aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[26px] font-semibold md:text-[32px]">Confirm and pay</h1>
      </div>

      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-24">
        <div className="order-2 lg:order-1">
          <section className="border-b border-divider pb-8">
            <h2 className="text-[22px] font-semibold">Your trip</h2>
            <div className="mt-6 flex items-start justify-between">
              <div>
                <p className="font-semibold">Dates</p>
                <p>{checkIn && checkOut ? formatDateRange(checkIn, checkOut) : "Add dates"}</p>
              </div>
              <button onClick={() => setEditing("dates")} className="font-semibold underline">Edit</button>
            </div>
            <div className="mt-6 flex items-start justify-between">
              <div>
                <p className="font-semibold">Guests</p>
                <p>{guestsSummary(guests)}</p>
              </div>
              <button onClick={() => setEditing("guests")} className="font-semibold underline">Edit</button>
            </div>
          </section>

          <section className="border-b border-divider py-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[22px] font-semibold">Pay with</h2>
              <div className="flex gap-1.5 text-[10px] font-bold">
                {["VISA", "MC", "AMEX", "DISC"].map((brand) => (
                  <span key={brand} className="rounded border border-line px-1.5 py-1">{brand}</span>
                ))}
              </div>
            </div>
            <div className="mt-6 overflow-hidden rounded-lg border border-faint">
              <input
                className={cn(field("number"), "border-b border-faint")}
                placeholder="Card number"
                inputMode="numeric"
                autoComplete="cc-number"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
              />
              <div className="grid grid-cols-2">
                <input
                  className={cn(field("expiry"), "border-r border-faint")}
                  placeholder="Expiration (MM/YY)"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={card.expiry}
                  onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                />
                <input
                  className={field("cvv")}
                  placeholder="CVV"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={card.cvv}
                  onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                />
              </div>
            </div>
            <input
              className={cn(field("zip"), "mt-4 rounded-lg border border-faint")}
              placeholder="ZIP code"
              autoComplete="postal-code"
              value={card.zip}
              onChange={(e) => setCard({ ...card, zip: e.target.value.slice(0, 10) })}
            />
            <select
              className="mt-4 w-full rounded-lg border border-faint bg-canvas px-3 py-4 text-base"
              value={card.country}
              onChange={(e) => setCard({ ...card, country: e.target.value })}
            >
              {["United States", "India", "United Kingdom", "Canada", "Germany", "France", "Australia", "Japan"].map((country) => (
                <option key={country}>{country}</option>
              ))}
            </select>
            {firstError && <p className="mt-3 text-sm font-semibold text-error">{firstError}</p>}
            <p className="mt-4 flex items-start gap-2 text-xs text-muted">
              <Lock className="h-4 w-4 shrink-0" />
              Payments are simulated: a test card is filled in for you. Nothing is charged and card details never leave your browser.
            </p>
          </section>

          <section className="border-b border-divider py-8">
            <h2 className="text-[22px] font-semibold">Required for your trip</h2>
            {[
              { title: "Message the host", text: "Share why you're traveling, who's coming with you, and what you love about the space." },
              { title: "Phone number", text: "Add and confirm your phone number to get trip updates." },
            ].map((item) => (
              <div key={item.title} className="mt-6 flex items-start justify-between gap-6">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted">{item.text}</p>
                </div>
                <button onClick={() => showToast(`${item.title} is coming soon.`)} className="shrink-0 rounded-lg border border-ink px-4 py-1.5 text-sm font-semibold hover:bg-soft">
                  Add
                </button>
              </div>
            ))}
          </section>

          <section className="border-b border-divider py-8">
            <h2 className="text-[22px] font-semibold">Cancellation policy</h2>
            <p className="mt-4">
              <span className="font-semibold">Free cancellation before {checkIn ? format(parseISO(checkIn), "MMM d") : "check-in"}.</span> Cancel
              before check-in from your Trips page for a full refund.
            </p>
          </section>

          <section className="border-b border-divider py-8">
            <h2 className="text-[22px] font-semibold">Ground rules</h2>
            <p className="mt-4">We ask every guest to remember a few simple things about what makes a great guest.</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Follow the house rules</li>
              <li>Treat your Host&apos;s home like your own</li>
            </ul>
          </section>

          <p className="py-8 text-xs text-muted">
            By selecting the button below, I agree to the Host&apos;s House Rules, Ground rules for guests, Airbnb&apos;s Rebooking and Refund
            Policy, and that Airbnb can charge my payment method if I&apos;m responsible for damage.
          </p>
          {unavailable && <p className="mb-4 font-semibold text-error">{quote.message}</p>}
          <button
            onClick={confirmAndPay}
            disabled={submitting || unavailable || !quote}
            className="flex h-14 w-full items-center justify-center rounded-lg bg-brand-gradient px-8 text-base font-semibold text-white disabled:opacity-50 md:w-auto md:min-w-52"
          >
            {submitting ? <LoadingDots /> : "Confirm and pay"}
          </button>
        </div>

        <aside className="order-1 lg:order-2">
          <div className="sticky top-28 rounded-xl border border-line p-6">
            <Link href={`/rooms/${listing.id}`} className="flex gap-4 border-b border-divider pb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={listing.image_urls[0]} alt={listing.title} className="h-[106px] w-[124px] shrink-0 rounded-lg object-cover" />
              <div className="flex min-w-0 flex-col">
                <p className="text-xs text-muted">{placeKind(listing.room_type, listing.property_type)}</p>
                <p className="text-sm">{listing.title}</p>
                <p className="mt-auto flex items-center gap-1 text-xs">
                  <StarIcon className="h-3 w-3" />
                  <span className="font-semibold">{listing.review_count ? formatRating(listing.rating_avg) : "New"}</span>
                  {listing.review_count > 0 && <span className="text-muted">({plural(listing.review_count, "review")})</span>}
                  {listing.host.is_superhost && <span className="text-muted">· Superhost</span>}
                </p>
              </div>
            </Link>
            <div className="pt-6">
              <h2 className="mb-6 text-[22px] font-semibold">Price details</h2>
              {quote ? (
                <PriceBreakdown price={quote} totalLabel="Total (USD)" />
              ) : (
                <div className="flex justify-center py-6">
                  <LoadingDots />
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <Modal
        open={editing === "dates"}
        onClose={() => setEditing(null)}
        title="Edit dates"
        size="lg"
        footer={
          <div className="flex justify-end">
            <button disabled={!checkIn || !checkOut} onClick={() => setEditing(null)} className="rounded-lg bg-ink px-6 py-3 font-semibold text-canvas disabled:opacity-40">
              Save
            </button>
          </div>
        }
      >
        <DateRangePicker
          checkIn={checkIn}
          checkOut={checkOut}
          booked={booked}
          onChange={(start, end) => {
            setCheckIn(start);
            setCheckOut(end);
          }}
        />
      </Modal>
      <Modal open={editing === "guests"} onClose={() => setEditing(null)} title="Edit guests">
        <GuestPicker value={guests} onChange={setGuests} maxGuests={listing.max_guests} minAdults={1} />
      </Modal>
    </div>
  );
}
