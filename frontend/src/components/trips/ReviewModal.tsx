"use client";

import { useState } from "react";
import { LoadingDots } from "@/components/ui/Loading";
import Modal from "@/components/ui/Modal";
import StarInput from "@/components/ui/StarInput";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import type { Booking } from "@/lib/types";

const CATEGORIES = [
  ["cleanliness", "Cleanliness"],
  ["accuracy", "Accuracy"],
  ["checkin", "Check-in"],
  ["communication", "Communication"],
  ["location", "Location"],
  ["value", "Value"],
] as const;
type Category = (typeof CATEGORIES)[number][0];

/** "How was your stay?" form shown for completed trips. */
export default function ReviewModal({ booking, onClose, onSaved }: { booking: Booking; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [scores, setScores] = useState<Partial<Record<Category, number>>>({});
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const canSubmit = rating > 0 && comment.trim().length >= 10;

  async function submit() {
    setSaving(true);
    try {
      await api.createReview({ booking_id: booking.id, rating, comment: comment.trim(), ...scores });
      showToast("Thanks for your review!", { type: "success" });
      onSaved();
      onClose();
    } catch (error) {
      showToast((error as Error).message, { type: "error" });
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Write a review"
      size="md"
      footer={
        <div className="flex justify-end">
          <button onClick={submit} disabled={!canSubmit || saving} className="flex h-12 min-w-32 items-center justify-center rounded-lg bg-ink px-6 font-semibold text-canvas disabled:opacity-40">
            {saving ? <LoadingDots /> : "Submit review"}
          </button>
        </div>
      }
    >
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {booking.listing.cover_image_url && <img src={booking.listing.cover_image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />}
        <div>
          <p className="font-semibold">{booking.listing.title}</p>
          <p className="text-sm text-muted">Hosted by {booking.listing.host.name.split(" ")[0]}</p>
        </div>
      </div>

      <h2 className="mt-8 text-[22px] font-semibold">How was your stay?</h2>
      <div className="mt-3">
        <StarInput value={rating} onChange={setRating} label="Overall rating" size="h-10 w-10" />
      </div>

      <h3 className="mt-8 font-semibold">Rate the details <span className="font-normal text-muted">(optional)</span></h3>
      <div className="mt-2 divide-y divide-divider">
        {CATEGORIES.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between py-3">
            <span>{label}</span>
            <StarInput value={scores[key] ?? 0} onChange={(value) => setScores({ ...scores, [key]: value })} label={label} size="h-5 w-5" />
          </div>
        ))}
      </div>

      <label className="mt-8 block font-semibold" htmlFor="review-comment">Tell future guests about your stay</label>
      <textarea
        id="review-comment"
        value={comment}
        onChange={(event) => setComment(event.target.value.slice(0, 2000))}
        rows={5}
        placeholder="What did you love? What could be better?"
        className="mt-3 w-full rounded-lg border border-faint bg-canvas p-3 text-base outline-none focus:border-ink focus:ring-1 focus:ring-ink"
      />
      <p className="mt-1 text-xs text-muted">{comment.trim().length < 10 ? "At least 10 characters" : `${comment.length}/2000`}</p>
    </Modal>
  );
}
