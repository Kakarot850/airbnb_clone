import { CalendarCheck, Pencil } from "lucide-react";
import { StarIcon } from "@/components/ui/Stars";
import { ROOM_TYPE_LABELS, formatPrice, plural } from "@/lib/format";
import type { RoomType } from "@/lib/types";
import type { StepProps } from "./form";

export default function StepReview({ form }: StepProps) {
  const location = [form.city, form.state, form.country].filter(Boolean).join(", ");
  return (
    <div className="grid items-start gap-12 md:grid-cols-2">
      <div className="rounded-2xl p-4 shadow-[0_6px_20px_rgba(0,0,0,0.2)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {form.image_urls[0] && <img src={form.image_urls[0]} alt="" className="aspect-square w-full rounded-xl object-cover" />}
        <div className="mt-4 flex justify-between gap-2">
          <p className="truncate text-base font-semibold">{form.title}</p>
          <span className="flex shrink-0 items-center gap-1">
            New <StarIcon />
          </span>
        </div>
        <p className="text-base">
          <span className="font-semibold">{formatPrice(form.price_per_night)}</span> night
        </p>
      </div>

      <div>
        <h2 className="text-[22px] font-semibold">What&apos;s next?</h2>
        <div className="mt-6 space-y-6">
          <div className="flex gap-4">
            <CalendarCheck className="h-7 w-7 shrink-0" strokeWidth={1.5} />
            <div>
              <p className="font-semibold">Guests can book right away</p>
              <p className="text-sm text-muted">Your calendar opens as soon as you publish. Bookings block those dates automatically.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Pencil className="h-7 w-7 shrink-0" strokeWidth={1.5} />
            <div>
              <p className="font-semibold">Adjust your settings</p>
              <p className="text-sm text-muted">Edit photos, price or details any time from Your listings.</p>
            </div>
          </div>
        </div>

        <dl className="mt-8 space-y-2 border-t border-divider pt-6 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-muted">Type</dt><dd className="font-semibold">{form.property_type} · {ROOM_TYPE_LABELS[form.room_type as RoomType]}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Location</dt><dd className="text-right font-semibold">{location}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Basics</dt><dd className="font-semibold">{plural(form.max_guests, "guest")} · {plural(form.bedrooms, "bedroom")} · {plural(form.beds, "bed")} · {plural(form.bathrooms, "bath")}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Amenities</dt><dd className="font-semibold">{form.amenity_ids.length} selected</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Photos</dt><dd className="font-semibold">{form.image_urls.length}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-muted">Cleaning fee</dt><dd className="font-semibold">{formatPrice(form.cleaning_fee)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
