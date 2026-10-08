"use client";

import { format, parseISO } from "date-fns";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import LoginPrompt from "@/components/auth/LoginPrompt";
import { LoadingDots, PageLoader } from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import { StarIcon } from "@/components/ui/Stars";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { formatLocation, formatPrice, formatRating, plural } from "@/lib/format";
import type { HostListing } from "@/lib/types";
import HostHeader from "./HostHeader";

/** "Your listings": table of the host's listings with view / edit / delete actions. */
export default function HostListingsView() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const [listings, setListings] = useState<HostListing[] | null>(null);
  const [deleting, setDeleting] = useState<HostListing | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.hostListings().then(setListings).catch(() => setListings([]));
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteListing(deleting.id);
      showToast(`"${deleting.title}" was deleted.`, { type: "success" });
      setDeleting(null);
      load();
    } catch (error) {
      showToast((error as Error).message, { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!user) return <LoginPrompt title="Listings" text="Log in to manage your listings." />;

  const actions = (listing: HostListing) => (
    <div className="flex items-center gap-1">
      <Link href={`/rooms/${listing.id}`} className="rounded-full p-2 hover:bg-soft" aria-label="View listing" title="View">
        <Eye className="h-4 w-4" />
      </Link>
      <Link href={`/host/listings/${listing.id}/edit`} className="rounded-full p-2 hover:bg-soft" aria-label="Edit listing" title="Edit">
        <Pencil className="h-4 w-4" />
      </Link>
      <button onClick={() => setDeleting(listing)} className="rounded-full p-2 text-error hover:bg-soft" aria-label="Delete listing" title="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <>
      <HostHeader />
      <div className="page-container pb-24 pt-8 md:pt-12">
        <div className="flex items-center justify-between">
          <h1 className="text-[32px] font-semibold">Your listings</h1>
          <Link href="/host/listings/new" className="flex h-12 w-12 items-center justify-center rounded-full bg-soft hover:bg-divider" aria-label="Create listing" title="Create listing">
            <Plus className="h-5 w-5" />
          </Link>
        </div>

        {listings === null ? (
          <PageLoader />
        ) : listings.length === 0 ? (
          <div className="mt-10 max-w-xl rounded-xl border border-line p-8">
            <h2 className="text-[22px] font-semibold">No listings yet</h2>
            <p className="mt-2 text-muted">Create your first listing. It takes just a few steps.</p>
            <Link href="/host/listings/new" className="mt-6 inline-block rounded-lg bg-brand-gradient px-6 py-3 font-semibold text-white">
              Create listing
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="mt-8 hidden w-full text-left text-sm md:table">
              <thead className="border-b border-divider text-xs text-muted">
                <tr>
                  <th className="py-3 font-semibold">Listing</th>
                  <th className="py-3 font-semibold">Status</th>
                  <th className="py-3 font-semibold">Location</th>
                  <th className="py-3 font-semibold">Price</th>
                  <th className="py-3 font-semibold">Rating</th>
                  <th className="py-3 font-semibold">Bookings</th>
                  <th className="py-3 font-semibold">Earnings</th>
                  <th className="py-3 font-semibold">Last updated</th>
                  <th className="py-3" />
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id} className="border-b border-divider hover:bg-soft">
                    <td className="py-3 pr-4">
                      <Link href={`/host/listings/${listing.id}/edit`} className="flex items-center gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={listing.image_urls[0]} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                        <span className="max-w-64 truncate font-semibold">{listing.title}</span>
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <span className="h-2 w-2 rounded-full bg-success" /> Listed
                      </span>
                    </td>
                    <td className="max-w-48 truncate py-3 pr-4">{formatLocation(listing)}</td>
                    <td className="whitespace-nowrap py-3 pr-4">{formatPrice(listing.price_per_night)} / night</td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-1">
                        <StarIcon /> {listing.review_count ? `${formatRating(listing.rating_avg)} (${listing.review_count})` : "New"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4">
                      {listing.upcoming_bookings} upcoming
                      <span className="block text-xs text-muted">{listing.total_bookings} total</span>
                    </td>
                    <td className="py-3 pr-4 font-semibold">{formatPrice(listing.total_earnings)}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-muted">{format(parseISO(listing.updated_at), "MMM d, yyyy")}</td>
                    <td className="py-3">{actions(listing)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Phone cards */}
            <div className="mt-6 space-y-4 md:hidden">
              {listings.map((listing) => (
                <div key={listing.id} className="flex items-center gap-4 rounded-xl border border-line p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={listing.image_urls[0]} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{listing.title}</p>
                    <p className="truncate text-sm text-muted">{formatLocation(listing)}</p>
                    <p className="text-sm">
                      {formatPrice(listing.price_per_night)} night · {plural(listing.upcoming_bookings, "upcoming stay")}
                    </p>
                  </div>
                  {actions(listing)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete listing"
        size="sm"
        footer={
          <div className="flex justify-between">
            <button onClick={() => setDeleting(null)} className="rounded-lg px-4 py-3 font-semibold underline hover:bg-soft">Cancel</button>
            <button onClick={confirmDelete} disabled={busy} className="flex min-w-32 items-center justify-center rounded-lg bg-error px-6 py-3 font-semibold text-white">
              {busy ? <LoadingDots /> : "Delete"}
            </button>
          </div>
        }
      >
        {deleting && (
          <div className="space-y-3">
            <p className="font-semibold">Delete &ldquo;{deleting.title}&rdquo;?</p>
            <p className="text-muted">It will be removed from search right away. Past reservations and reviews are kept for your records.</p>
            {deleting.upcoming_bookings > 0 && (
              <p className="rounded-lg bg-soft p-3 text-sm">
                {plural(deleting.upcoming_bookings, "upcoming reservation")} will be cancelled and the guests fully refunded.
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
