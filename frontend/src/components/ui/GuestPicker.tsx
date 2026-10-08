"use client";

import { MAX_GUESTS, MAX_INFANTS, MAX_PETS } from "@/lib/constants";
import type { GuestCounts } from "@/lib/types";
import { CounterRow } from "./Counter";

interface GuestPickerProps {
  value: GuestCounts;
  onChange: (value: GuestCounts) => void;
  maxGuests?: number; // adults + children limit (infants and pets don't count)
  minAdults?: number;
}

/** Adults / Children / Infants / Pets counters, with Airbnb's rules. */
export default function GuestPicker({ value, onChange, maxGuests = MAX_GUESTS, minAdults = 0 }: GuestPickerProps) {
  const guests = value.adults + value.children;

  function update(field: keyof GuestCounts, amount: number) {
    const next = { ...value, [field]: amount };
    // Children, infants and pets need at least one adult.
    if (field !== "adults" && amount > 0 && next.adults === 0) next.adults = 1;
    onChange(next);
  }

  const someoneElseComing = value.children + value.infants + value.pets > 0;
  return (
    <div>
      <CounterRow
        title="Adults"
        subtitle="Ages 13 or above"
        label="adults"
        value={value.adults}
        min={Math.max(minAdults, someoneElseComing ? 1 : 0)}
        max={maxGuests - value.children}
        onChange={(n) => update("adults", n)}
      />
      <CounterRow
        title="Children"
        subtitle="Ages 2 – 12"
        label="children"
        value={value.children}
        max={maxGuests - value.adults}
        onChange={(n) => update("children", n)}
      />
      <CounterRow title="Infants" subtitle="Under 2" label="infants" value={value.infants} max={MAX_INFANTS} onChange={(n) => update("infants", n)} />
      <CounterRow
        title="Pets"
        subtitle={<span className="font-semibold underline">Bringing a service animal?</span>}
        label="pets"
        value={value.pets}
        max={MAX_PETS}
        onChange={(n) => update("pets", n)}
      />
      {guests >= maxGuests && maxGuests < MAX_GUESTS && (
        <p className="pt-3 text-sm text-muted">
          This place has a maximum of {maxGuests} guests, not including infants.
        </p>
      )}
    </div>
  );
}
