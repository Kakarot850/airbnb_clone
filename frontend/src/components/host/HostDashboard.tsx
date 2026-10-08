"use client";

import { differenceInCalendarDays, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import LoginPrompt from "@/components/auth/LoginPrompt";
import Avatar from "@/components/ui/Avatar";
import { LoadingDots, PageLoader } from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import { StarIcon } from "@/components/ui/Stars";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatDate, formatDateRange, formatPrice, formatRating, plural } from "@/lib/format";
import type { Booking, HostListing, TripStatus } from "@/lib/types";
import HostHeader from "./HostHeader";

const TABS: { status: TripStatus; label: string }[] = [
  { status: "current", label: "Currently hosting" },
  { status: "upcoming", label: "Upcoming" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
];

function statusText(booking: Booking): string {
  const daysUntil = differenceInCalendarDays(parseISO(booking.check_in), new Date());
  switch (booking.trip_status) {
    case "current":
      return differenceInCalendarDays(parseISO(booking.check_out), new Date()) === 0 ? "Checking out today" : "Currently hosting";
    case "upcoming":
      return daysUntil === 1 ? "Arriving tomorrow" : `Arriving in ${daysUntil} days`;
    case "completed":
      return `Checked out ${formatDate(booking.check_out, "MMM d")}`;
    default:
      return "Cancelled";
  }
}

/** Hosting "Today" page: earnings + rating stats and the host's reservations. */
export default function HostDashboard() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const [listings, setListings] = useState<HostListing[] | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [tab, setTab] = useState<TripStatus>("upcoming");
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.hostListings().then(setListings).catch(() => setListings([]));
    api.hostBookings().then(setBookings).catch(() => setBookings([]));
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function cancelReservation() {
    if (!cancelling) return;
    setBusy(true);
    try {
      await api.cancelBooking(cancelling.id);
      showToast(`Reservation for ${cancelling.guest.name} cancelled.`, { type: "success" });
      setCancelling(null);
      load();
    } catch (error) {
      showToast((error as Error).message, { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!user) return <LoginPrompt title="Hosting" text="Log in to manage your listings and reservations." />;

  const ready = listings !== null && bookings !== null;
  const count = (status: TripStatus) => bookings?.filter((b) => b.trip_status === status).length ?? 0;
  const visible = (bookings ?? [])
    .filter((b) => b.trip_status === tab)
    .sort((a, b) => (tab === "completed" || tab === "cancelled" ? b.check_in.localeCompare(a.check_in) : a.check_in.localeCompare(b.check_in)));
  const earnings = (listings ?? []).reduce((sum, l) => sum + l.total_earnings, 0);
  const reviews = (listings ?? []).reduce((sum, l) => sum + l.review_count, 0);
  const rating = reviews ? (listings ?? []).reduce((sum, l) => sum + l.rating_avg * l.review_count, 0) / reviews : 0;

  const stats = [
    { label: "Currently hosting", value: String(count("current")) },
    { label: "Upcoming reservations", value: String(count("upcoming")) },
    { label: "Total earnings", value: formatPrice(earnings) },
    { label: "Overall rating", value: reviews ? formatRating(rating) : "–", star: reviews > 0 },
  ];

  return (
    <>
      <HostHeader />
      <div className="page-container pb-24 pt-8 md:pt-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[32px] font-semibold">Welcome back, {user.name.split(" ")[0]}</h1>
          <Link href="/host/listings/new" className="flex items-center gap-2 rounded-lg border border-ink px-4 py-2.5 text-sm font-semibold hover:bg-soft">
            <Plus className="h-4 w-4" /> Create a new listing
          </Link>
        </div>

        {!ready ? (
          <PageLoader />
        ) : listings.length === 0 && bookings.length === 0 ? (
          <div className="mt-10 max-w-xl rounded-xl border border-line p-8">
            <h2 className="text-[22px] font-semibold">You don&apos;t have any listings yet</h2>
            <p className="mt-2 text-muted">Share your space, earn extra income and welcome guests from around the world.</p>
            <Link href="/host/listings/new" className="mt-6 inline-block rounded-lg bg-brand-gradient px-6 py-3 font-semibold text-white">
              Airbnb your home
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-line p-5">
                  <p className="text-sm text-muted">{stat.label}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[28px] font-semibold">
                    {stat.value} {stat.star && <StarIcon className="h-5 w-5" />}
                  </p>
                </div>
              ))}
            </div>

            <h2 className="mt-12 text-[26px] font-semibold">Your reservations</h2>
            <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
              {TABS.map(({ status, label }) => (
                <button
                  key={status}
                  onClick={() => setTab(status)}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition",
                    tab === status ? "border-ink bg-soft ring-1 ring-ink" : "border-line hover:border-ink",
                  )}
                >
                  {label} ({count(status)})
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className="mt-6 flex h-48 items-center justify-center rounded-xl bg-soft text-center text-base text-muted">
                You don&apos;t have any {TABS.find((t) => t.status === tab)?.label.toLowerCase()} reservations.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visible.map((booking) => (
                  <div key={booking.id} className="flex flex-col rounded-xl border border-line p-5">
                    <p className={cn("text-sm font-semibold", booking.trip_status === "current" ? "text-brand" : booking.trip_status === "cancelled" ? "text-error" : "text-ink")}>
                      {statusText(booking)}
                    </p>
                    <div className="mt-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold">{booking.guest.name}</p>
                        <p className="text-sm text-muted">
                          {formatDateRange(booking.check_in, booking.check_out)} · {plural(booking.guests, "guest")}
                        </p>
                        <p className="truncate text-sm text-muted">{booking.listing.title}</p>
                      </div>
                      <Avatar src={booking.guest.avatar_url} name={booking.guest.name} className="h-12 w-12 text-lg" />
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-divider pt-4 text-sm">
                      <span>
                        Payout <span className="font-semibold">{formatPrice(booking.total_price - booking.service_fee)}</span>
                      </span>
                      <span className="flex gap-2">
                        <Link href={`/trips/${booking.id}`} className="rounded-lg px-3 py-1.5 font-semibold underline hover:bg-soft">
                          Details
                        </Link>
                        {booking.trip_status === "upcoming" && (
                          <button onClick={() => setCancelling(booking)} className="rounded-lg px-3 py-1.5 font-semibold text-error underline hover:bg-soft">
                            Cancel
                          </button>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={cancelling !== null}
        onClose={() => setCancelling(null)}
        title="Cancel reservation"
        size="sm"
        footer={
          <div className="flex justify-between">
            <button onClick={() => setCancelling(null)} className="rounded-lg px-4 py-3 font-semibold underline hover:bg-soft">Keep it</button>
            <button onClick={cancelReservation} disabled={busy} className="flex min-w-36 items-center justify-center rounded-lg bg-ink px-6 py-3 font-semibold text-canvas">
              {busy ? <LoadingDots /> : "Yes, cancel"}
            </button>
          </div>
        }
      >
        {cancelling && (
          <p>
            Cancel {cancelling.guest.name}&apos;s stay ({formatDateRange(cancelling.check_in, cancelling.check_out)})? The guest gets a full refund and the
            dates open up again.
          </p>
        )}
      </Modal>
    </>
  );
}
