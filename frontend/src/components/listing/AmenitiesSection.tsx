"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Icon } from "@/lib/icons";
import type { Amenity } from "@/lib/types";

const PREVIEW_COUNT = 10;

/** "What this place offers": first 10 amenities, the rest in a modal grouped by category. */
export default function AmenitiesSection({ amenities }: { amenities: Amenity[] }) {
  const [open, setOpen] = useState(false);
  const groups = [...new Set(amenities.map((amenity) => amenity.group_name))];
  return (
    <section className="border-t border-divider py-12">
      <h2 className="mb-6 text-[22px] font-semibold">What this place offers</h2>
      <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {amenities.slice(0, PREVIEW_COUNT).map((amenity) => (
          <li key={amenity.id} className="flex items-center gap-4 text-base">
            <Icon name={amenity.icon} className="h-6 w-6" />
            {amenity.name}
          </li>
        ))}
      </ul>
      {amenities.length > PREVIEW_COUNT && (
        <button onClick={() => setOpen(true)} className="mt-8 rounded-lg border border-ink px-6 py-3 text-base font-semibold hover:bg-soft">
          Show all {amenities.length} amenities
        </button>
      )}
      <Modal open={open} onClose={() => setOpen(false)} size="lg">
        <h2 className="mb-4 text-[26px] font-semibold">What this place offers</h2>
        {groups.map((group) => (
          <div key={group} className="pt-6">
            <h3 className="mb-2 text-lg font-semibold">{group}</h3>
            <ul>
              {amenities
                .filter((amenity) => amenity.group_name === group)
                .map((amenity) => (
                  <li key={amenity.id} className="flex items-center gap-4 border-b border-divider py-5 text-base last:border-b-0">
                    <Icon name={amenity.icon} className="h-7 w-7" />
                    {amenity.name}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </Modal>
    </section>
  );
}
