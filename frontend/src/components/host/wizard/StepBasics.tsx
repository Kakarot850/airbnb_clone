import { CounterRow } from "@/components/ui/Counter";
import type { StepProps } from "./form";

export default function StepBasics({ form, update }: StepProps) {
  return (
    <div>
      <CounterRow title="Guests" label="guests" value={form.max_guests} min={1} max={16} onChange={(max_guests) => update({ max_guests })} />
      <CounterRow title="Bedrooms" label="bedrooms" value={form.bedrooms} min={0} max={50} onChange={(bedrooms) => update({ bedrooms })} />
      <CounterRow title="Beds" label="beds" value={form.beds} min={1} max={50} onChange={(beds) => update({ beds })} />
      {/* Bathrooms move in half steps (1.5 baths = a full bathroom + a half bathroom). */}
      <CounterRow
        title="Bathrooms"
        label="bathrooms"
        value={form.bathrooms * 2}
        min={1}
        max={100}
        format={(halves) => String(halves / 2)}
        onChange={(halves) => update({ bathrooms: halves / 2 })}
      />
    </div>
  );
}
