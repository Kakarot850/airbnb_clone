"use client";

import { format, parseISO } from "date-fns";
import { CircleCheck, Key, Map as MapIcon, MessageSquare, Search, SprayCan, Tag } from "lucide-react";
import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import Stars, { StarIcon } from "@/components/ui/Stars";
import { formatRating, memberFor, plural } from "@/lib/format";
import type { ListingDetail, ListingReviews, Review } from "@/lib/types";
import { Laurel } from "./Laurels";

const CATEGORIES = [
  { key: "cleanliness", label: "Cleanliness", icon: SprayCan },
  { key: "accuracy", label: "Accuracy", icon: CircleCheck },
  { key: "checkin", label: "Check-in", icon: Key },
  { key: "communication", label: "Communication", icon: MessageSquare },
  { key: "location", label: "Location", icon: MapIcon },
  { key: "value", label: "Value", icon: Tag },
] as const;

function ReviewCard({ review, clamp = true }: { review: Review; clamp?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article>
      <div className="flex items-center gap-3">
        <Avatar src={review.author.avatar_url} name={review.author.name} className="h-12 w-12 text-lg" />
        <div>
          <p className="text-base font-semibold">{review.author.name.split(" ")[0]}</p>
          <p className="text-sm text-muted">{memberFor(review.author.created_at)}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <Stars rating={review.rating} />
        <span>·</span>
        <span className="font-semibold">{format(parseISO(review.created_at), "MMMM yyyy")}</span>
      </div>
      <p className={`mt-1 text-base leading-6 ${clamp && !expanded ? "line-clamp-3" : ""}`}>{review.comment}</p>
      {clamp && review.comment.length > 160 && !expanded && (
        <button onClick={() => setExpanded(true)} className="mt-1 text-base font-semibold underline">
          Show more
        </button>
      )}
    </article>
  );
}

/** Rating summary (overall histogram + category scores) and review cards, with "Show all reviews". */
export default function ReviewsSection({ listing, reviews }: { listing: ListingDetail; reviews: ListingReviews | null }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  if (!reviews) return null;
  const { summary, items } = reviews;

  if (summary.count === 0) {
    return (
      <section id="reviews" className="border-t border-divider py-12">
        <h2 className="flex items-center gap-2 text-[22px] font-semibold">
          <StarIcon className="h-4 w-4" /> No reviews (yet)
        </h2>
        <p className="mt-2 text-base text-muted">This place is new. Be one of the first guests to leave a review!</p>
      </section>
    );
  }

  const heading = (
    <h2 className="flex items-center gap-2 text-[22px] font-semibold">
      <StarIcon className="h-4 w-4" /> {formatRating(summary.average)} · {plural(summary.count, "review")}
    </h2>
  );

  const ratingBreakdown = (
    <div className="no-scrollbar flex overflow-x-auto md:grid md:grid-cols-7">
      <div className="min-w-44 pr-6">
        <p className="mb-2 text-sm font-semibold">Overall rating</p>
        {["5", "4", "3", "2", "1"].map((stars) => (
          <div key={stars} className="flex items-center gap-2 text-xs">
            <span className="w-2">{stars}</span>
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-divider">
              <span className="block h-full rounded-full bg-ink" style={{ width: `${((summary.distribution[stars] ?? 0) / summary.count) * 100}%` }} />
            </span>
          </div>
        ))}
      </div>
      {CATEGORIES.map(({ key, label, icon: Icon }) => (
        <div key={key} className="flex min-w-32 flex-col justify-between border-l border-divider px-6">
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-lg font-semibold">{summary[key].toFixed(1)}</p>
          </div>
          <Icon className="mt-6 h-8 w-8" strokeWidth={1.3} />
        </div>
      ))}
    </div>
  );

  const filtered = items.filter((review) => review.comment.toLowerCase().includes(filter.toLowerCase()));

  return (
    <section id="reviews" className="border-t border-divider py-12">
      {listing.is_guest_favorite ? (
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <Laurel className="h-24 w-auto" />
            <span className="text-[72px] font-semibold leading-none tracking-tight">{formatRating(summary.average)}</span>
            <Laurel flip className="h-24 w-auto" />
          </div>
          <p className="mt-2 text-[22px] font-semibold">Guest favorite</p>
          <p className="mt-2 max-w-xs text-base text-muted">One of the most loved homes on Airbnb based on ratings, reviews, and reliability</p>
        </div>
      ) : (
        <div className="mb-8">{heading}</div>
      )}

      {ratingBreakdown}

      <div className="mt-12 grid gap-x-24 gap-y-10 md:grid-cols-2">
        {items.slice(0, 6).map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {items.length > 6 && (
        <button onClick={() => setOpen(true)} className="mt-10 rounded-lg bg-soft px-6 py-3 text-base font-semibold hover:bg-divider">
          Show all {summary.count} reviews
        </button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} size="xl">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="flex items-center gap-2 text-[26px] font-semibold">
              <StarIcon className="h-5 w-5" /> {formatRating(summary.average)}
            </h2>
            <div className="mt-6 space-y-3">
              {CATEGORIES.map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between border-b border-divider pb-3 text-sm">
                  <span className="flex items-center gap-3">
                    <Icon className="h-5 w-5" strokeWidth={1.5} /> {label}
                  </span>
                  <span className="font-semibold">{summary[key].toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-[22px] font-semibold">{plural(summary.count, "review")}</h3>
            </div>
            <label className="mt-4 flex items-center gap-3 rounded-full border border-faint px-4 py-3 focus-within:ring-2 focus-within:ring-ink">
              <Search className="h-4 w-4" />
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search reviews" className="w-full bg-transparent text-sm outline-none" />
            </label>
            <div className="mt-8 space-y-10">
              {filtered.map((review) => (
                <ReviewCard key={review.id} review={review} clamp={false} />
              ))}
              {filtered.length === 0 && <p className="text-muted">No reviews mention &ldquo;{filter}&rdquo;.</p>}
            </div>
          </div>
        </div>
      </Modal>
    </section>
  );
}
