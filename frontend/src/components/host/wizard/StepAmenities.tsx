"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Loading";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { Icon } from "@/lib/icons";
import type { Amenity } from "@/lib/types";
import type { StepProps } from "./form";

const GROUP_TITLES: Record<string, string> = {
  Essentials: "What about these guest favorites?",
  Features: "Do you have any standout amenities?",
  Location: "Anything special about the location?",
  Safety: "Do you have any of these safety items?",
};

export default function StepAmenities({ form, update }: StepProps) {
  const [amenities, setAmenities] = useState<Amenity[] | null>(null);
  useEffect(() => {
    api.amenities().then(setAmenities).catch(() => setAmenities([]));
  }, []);

  if (!amenities) return <Skeleton className="h-96" />;

  const toggle = (id: number) =>
    update((current) => ({
      amenity_ids: current.amenity_ids.includes(id) ? current.amenity_ids.filter((x) => x !== id) : [...current.amenity_ids, id],
    }));

  return (
    <div className="space-y-10">
      {[...new Set(amenities.map((a) => a.group_name))].map((group) => (
        <div key={group}>
          <h2 className="mb-4 text-lg font-semibold">{GROUP_TITLES[group] ?? group}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {amenities
              .filter((amenity) => amenity.group_name === group)
              .map((amenity) => {
                const selected = form.amenity_ids.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggle(amenity.id)}
                    aria-pressed={selected}
                    className={cn(
                      "flex flex-col gap-3 rounded-xl border p-4 text-left transition",
                      selected ? "border-ink bg-soft ring-1 ring-ink" : "border-line hover:border-ink",
                    )}
                  >
                    <Icon name={amenity.icon} className="h-8 w-8" />
                    <span className="text-base font-semibold">{amenity.name}</span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
