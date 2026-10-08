import { PinPicker } from "@/components/map";
import type { ListingForm, StepProps } from "./form";

const FIELDS: { key: keyof ListingForm; label: string; autoComplete: string }[] = [
  { key: "address", label: "Street address", autoComplete: "street-address" },
  { key: "city", label: "City", autoComplete: "address-level2" },
  { key: "state", label: "State / province (optional)", autoComplete: "address-level1" },
  { key: "country", label: "Country", autoComplete: "country-name" },
];

export default function StepLocation({ form, update }: StepProps) {
  const position: [number, number] | null = form.latitude !== null && form.longitude !== null ? [form.latitude, form.longitude] : null;
  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-faint">
        {FIELDS.map((field) => (
          <label key={field.key} className="relative block border-b border-faint last:border-b-0 focus-within:ring-2 focus-within:ring-inset focus-within:ring-ink">
            <span className="absolute left-4 top-2 text-xs text-muted">{field.label}</span>
            <input
              value={form[field.key] as string}
              onChange={(event) => update({ [field.key]: event.target.value })}
              autoComplete={field.autoComplete}
              maxLength={field.key === "address" ? 255 : 100}
              className="w-full bg-canvas px-4 pb-2.5 pt-7 text-base outline-none"
            />
          </label>
        ))}
      </div>

      <p className="mt-8 text-lg font-semibold">Pin your place on the map</p>
      <p className="text-sm text-muted">Click the map to drop the pin, then drag it to fine-tune. Zoom with the + / − buttons.</p>
      <div className="mt-4 h-[360px] overflow-hidden rounded-xl border border-line">
        <PinPicker position={position} onChange={([latitude, longitude]) => update({ latitude, longitude })} />
      </div>
      {position && (
        <p className="mt-2 text-xs text-muted">
          Pinned at {position[0]}, {position[1]}
        </p>
      )}
    </div>
  );
}
