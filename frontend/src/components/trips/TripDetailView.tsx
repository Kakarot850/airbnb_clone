"use client";

import { format, parseISO } from "date-fns";
import { CalendarX, CircleCheck, Home, MessageSquare, Receipt, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import LoginPrompt from "@/components/auth/LoginPrompt";
import PriceBreakdown from "@/components/booking/PriceBreakdown";
import { LocationMap } from "@/components/map";
import Avatar from "@/components/ui/Avatar";
import { LoadingDots, PageLoader } from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { confirmationCode, formatPrice, guestsSummary } from "@/lib/format";
import type { Booking } from "@/lib/types";
import ReviewModal from "./ReviewModal";

const STATUS_LABEL: Record<Booking["trip_status"], string> = {
  upcoming: "Upcoming",
  current: "Happening now",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** One reservation: confirmation banner, check-in/out, details, payment, map, cancel / review actions. */
export default function TripDetailView({ id }: { id: number }) {
  const params = useSearchParams();
  const justBooked = params.get("confirmed") === "1";
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(() => {
    api.getBooking(id).then(setBooking).catch((err: Error) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function cancel() {
    setCancelling(true);
    try {
      setBooking(await api.cancelBooking(id));
      showToast("Reservation cancelled. Those dates are available again.", { type: "success" });
      setConfirmCancel(false);
    } catch (err) {
      showToast((err as Error).message, { type: "error" });
    } finally {
      setCancelling(false);
    }
  }

  if (authLoading) return <PageLoader />;
  if (!user) return <LoginPrompt title="Your trip" text="Log in to see this reservation." />;
  if (error) {
    return (
      <div className="detail-container py-24 text-center">
        <h1 className="text-[32px] font-semibold">Reservation not found</h1>
        <Link href="/trips" className="mt-6 inline-block font-semibold underline">Back to trips</Link>
      </div>
    );
  }
  if (!booking) return <PageLoader />;

  const isHostView = booking.listing.host.id === user.id;
  const hostFirstName = booking.listing.host.name.split(" ")[0];
  const row = "flex gap-4 border-b border-divider py-6 last:border-b-0";

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-8 md:pt-12">
      <Link href={isHostView ? "/host" : "/trips"} className="text-sm font-semibold underline">
        {isHostView ? "← Back to reservations" : "← All trips"}
      </Link>

      {justBooked && booking.status === "confirmed" && (
        <div className="mt-6 flex items-start gap-4 rounded-xl border border-success/30 bg-success/10 p-6">
          <CircleCheck className="h-7 w-7 shrink-0 text-success" />
          <div>
            <h2 className="text-lg font-semibold">Your reservation is confirmed</h2>
            <p className="text-base">You&apos;re going to {booking.listing.city}! Your confirmation code is {confirmationCode(booking.id)}.</p>
          </div>
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      {booking.listing.cover_image_url && <img src={booking.listing.cover_image_url} alt="" className="mt-6 aspect-[2/1] w-full rounded-xl object-cover" />}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h1 className="text-[28px] font-semibold md:text-[32px]">
          {isHostView ? `Reservation for ${booking.guest.name}` : `Your stay at ${hostFirstName}'s place`}
        </h1>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${booking.status === "cancelled" ? "bg-error/10 text-error" : "bg-soft"}`}>
          {STATUS_LABEL[booking.trip_status]}
        </span>
      </div>
      <Link href={`/rooms/${booking.listing.id}`} className="mt-1 block text-base text-muted underline">
        {booking.listing.title}
      </Link>

      <div className="mt-6 grid grid-cols-2 rounded-xl border border-line">
        <div className="border-r border-line p-5">
          <p className="text-sm font-semibold">Check-in</p>
          <p className="text-base">{format(parseISO(booking.check_in), "EEE, MMM d, yyyy")}</p>
          <p className="text-sm text-muted">3:00 PM</p>
        </div>
        <div className="p-5">
          <p className="text-sm font-semibold">Checkout</p>
          <p className="text-base">{format(parseISO(booking.check_out), "EEE, MMM d, yyyy")}</p>
          <p className="text-sm text-muted">11:00 AM</p>
        </div>
      </div>

      <section className="mt-6">
        <div className={row}>
          <Users className="h-6 w-6 shrink-0" />
          <div>
            <p className="font-semibold">Who&apos;s coming</p>
            <p className="text-muted">{guestsSummary(booking)}</p>
          </div>
        </div>
        <div className={row}>
          <Receipt className="h-6 w-6 shrink-0" />
          <div>
            <p className="font-semibold">Confirmation code</p>
            <p className="text-muted">{confirmationCode(booking.id)}</p>
          </div>
        </div>
        <div className={row}>
          <Avatar src={isHostView ? booking.guest.avatar_url : booking.listing.host.avatar_url} name={isHostView ? booking.guest.name : booking.listing.host.name} className="h-6 w-6 text-xs" />
          <div className="flex-1">
            <p className="font-semibold">{isHostView ? `Guest: ${booking.guest.name}` : `Hosted by ${hostFirstName}`}</p>
            <Link href="/messages" className="mt-1 inline-flex items-center gap-2 text-sm font-semibold underline">
              <MessageSquare className="h-4 w-4" /> {isHostView ? "Message guest" : "Message host"}
            </Link>
          </div>
        </div>
        <div className={row}>
          <Home className="h-6 w-6 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Getting there</p>
            <p className="text-muted">
              {booking.listing.address}, {booking.listing.city}, {booking.listing.country}
            </p>
            <div className="mt-4 h-60 overflow-hidden rounded-xl">
              <LocationMap latitude={booking.listing.latitude} longitude={booking.listing.longitude} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-line p-6">
        <h2 className="mb-6 text-[22px] font-semibold">Payment info</h2>
        <PriceBreakdown price={{ ...booking, total: booking.total_price }} totalLabel="Total cost (USD)" />
        {booking.status === "cancelled" && (
          <p className="mt-4 text-sm font-semibold text-success">Refunded {formatPrice(booking.total_price)} after cancellation.</p>
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-4">
        {booking.trip_status === "upcoming" && (
          <button onClick={() => setConfirmCancel(true)} className="flex items-center gap-2 rounded-lg border border-ink px-6 py-3 font-semibold hover:bg-soft">
            <CalendarX className="h-4 w-4" /> Cancel reservation
          </button>
        )}
        {!isHostView && booking.trip_status === "completed" && !booking.has_review && (
          <button onClick={() => setReviewing(true)} className="rounded-lg bg-ink px-6 py-3 font-semibold text-canvas">
            Write a review
          </button>
        )}
      </div>

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="Cancel reservation"
        size="sm"
        footer={
          <div className="flex justify-between">
            <button onClick={() => setConfirmCancel(false)} className="rounded-lg px-4 py-3 font-semibold underline hover:bg-soft">
              Keep it
            </button>
            <button onClick={cancel} disabled={cancelling} className="flex min-w-36 items-center justify-center rounded-lg bg-ink px-6 py-3 font-semibold text-canvas">
              {cancelling ? <LoadingDots /> : "Yes, cancel"}
            </button>
          </div>
        }
      >
        <p className="text-base">
          {isHostView
            ? `${booking.guest.name.split(" ")[0]} will be notified and fully refunded.`
            : `You'll get a full refund of ${formatPrice(booking.total_price)} and the dates will open up for other guests.`}
        </p>
      </Modal>
      {reviewing && <ReviewModal booking={booking} onClose={() => setReviewing(false)} onSaved={load} />}
    </div>
  );
}
