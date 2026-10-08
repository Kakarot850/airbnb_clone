"use client";

import { format, parseISO } from "date-fns";
import { Check } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import LoginPrompt from "@/components/auth/LoginPrompt";
import EmptyState from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Loading";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { formatDateRange, placeKind } from "@/lib/format";
import type { Booking } from "@/lib/types";
import ReviewModal from "./ReviewModal";

function UpcomingTripCard({ trip }: { trip: Booking }) {
  const start = parseISO(trip.check_in);
  const end = parseISO(trip.check_out);
  const sameMonth = start.getMonth() === end.getMonth();
  return (
    <Link href={`/trips/${trip.id}`} className="flex overflow-hidden rounded-xl border border-line shadow-pill transition hover:shadow-card">
      <div className="flex min-w-0 flex-1 flex-col p-6">
        {trip.trip_status === "current" && (
          <span className="mb-3 w-fit rounded-full bg-success px-3 py-1 text-xs font-semibold text-white">Happening now</span>
        )}
        <h3 className="truncate text-[22px] font-semibold">{trip.listing.city}</h3>
        <p className="truncate text-sm text-muted">
          {placeKind(trip.listing.room_type, trip.listing.property_type)} hosted by {trip.listing.host.name.split(" ")[0]}
        </p>
        <div className="mt-6 flex gap-6 border-t border-divider pt-6">
          <div className="shrink-0 text-center">
            <p className="text-sm font-semibold">{sameMonth ? format(start, "MMM") : `${format(start, "MMM")} – ${format(end, "MMM")}`}</p>
            <p className="text-[22px] font-semibold leading-7">
              {format(start, "d")} – {format(end, "d")}
            </p>
            <p className="text-sm text-muted">{format(end, "yyyy")}</p>
          </div>
          <div className="min-w-0 border-l border-divider pl-6 text-sm">
            <p className="truncate font-semibold">{trip.listing.address}</p>
            <p className="truncate text-muted">{trip.listing.city}</p>
            <p className="truncate text-muted">{trip.listing.country}</p>
          </div>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {trip.listing.cover_image_url && <img src={trip.listing.cover_image_url} alt="" className="hidden w-2/5 object-cover sm:block" />}
    </Link>
  );
}

function SmallTripCard({ trip, action }: { trip: Booking; action?: React.ReactNode }) {
  return (
    <div>
      <Link href={`/trips/${trip.id}`} className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {trip.listing.cover_image_url && <img src={trip.listing.cover_image_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />}
        <div className="min-w-0">
          <p className="truncate font-semibold">{trip.listing.city}</p>
          <p className="truncate text-sm text-muted">Hosted by {trip.listing.host.name.split(" ")[0]}</p>
          <p className="text-sm text-muted">{formatDateRange(trip.check_in, trip.check_out)}</p>
        </div>
      </Link>
      {action}
    </div>
  );
}

/** "Trips": upcoming reservations, past stays (with "Write a review") and cancelled ones. */
export default function TripsView() {
  const { user, loading } = useAuth();
  const [trips, setTrips] = useState<Booking[] | null>(null);
  const [reviewing, setReviewing] = useState<Booking | null>(null);

  const load = useCallback(() => {
    api.myTrips().then(setTrips).catch(() => setTrips([]));
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading) return <PageLoader />;
  if (!user) return <LoginPrompt title="Trips" text="Log in to see your upcoming trips and the places you've stayed." />;
  if (!trips) return <PageLoader />;

  const upcoming = trips.filter((t) => t.trip_status === "upcoming" || t.trip_status === "current").sort((a, b) => a.check_in.localeCompare(b.check_in));
  const past = trips.filter((t) => t.trip_status === "completed");
  const cancelled = trips.filter((t) => t.trip_status === "cancelled");

  return (
    <div className="page-container py-8 md:py-12">
      <h1 className="text-[32px] font-semibold">Trips</h1>

      {upcoming.length === 0 && (
        <div className="mt-8 border-b border-divider pb-10">
          <EmptyState
            title="No trips booked...yet!"
            text="Time to dust off your bags and start planning your next adventure."
            actionLabel="Start searching"
            actionHref="/"
          />
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-6 text-[22px] font-semibold">Upcoming reservations</h2>
          <div className="grid gap-6 xl:grid-cols-2">
            {upcoming.map((trip) => (
              <UpcomingTripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-[22px] font-semibold">Where you&apos;ve been</h2>
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {past.map((trip) => (
              <SmallTripCard
                key={trip.id}
                trip={trip}
                action={
                  trip.has_review ? (
                    <p className="mt-3 flex items-center gap-1 text-sm text-muted">
                      <Check className="h-4 w-4" /> Review submitted
                    </p>
                  ) : (
                    <button onClick={() => setReviewing(trip)} className="mt-3 rounded-lg border border-ink px-4 py-2 text-sm font-semibold hover:bg-soft">
                      Write a review
                    </button>
                  )
                }
              />
            ))}
          </div>
        </section>
      )}

      {cancelled.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-[22px] font-semibold">Cancelled reservations</h2>
          <div className="grid gap-x-6 gap-y-8 opacity-80 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cancelled.map((trip) => (
              <SmallTripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 border-t border-divider pt-6 text-base">
        Can&apos;t find your reservation here?{" "}
        <Link href="/help" className="font-semibold underline">
          Visit the Help Center
        </Link>
      </p>

      {reviewing && <ReviewModal booking={reviewing} onClose={() => setReviewing(null)} onSaved={load} />}
    </div>
  );
}
