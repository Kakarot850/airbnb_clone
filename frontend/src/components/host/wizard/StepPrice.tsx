import type { StepProps } from "./form";

const toNumber = (value: string) => Math.max(0, Math.min(Number(value.replace(/\D/g, "")) || 0, 50_000));

export default function StepPrice({ form, update }: StepProps) {
  return (
    <div>
      <div className="flex flex-col items-center py-6">
        <label className="flex items-center text-[64px] font-bold leading-none md:text-[80px]">
          $
          <input
            inputMode="numeric"
            value={form.price_per_night || ""}
            onChange={(event) => update({ price_per_night: toNumber(event.target.value) })}
            aria-label="Price per night"
            className="bg-transparent text-center outline-none"
            style={{ width: `${Math.max(String(form.price_per_night).length, 2)}ch` }}
          />
        </label>
        <p className="mt-2 text-base text-muted">per night</p>
      </div>

      <label className="mt-6 flex items-center justify-between rounded-xl border border-faint p-5 focus-within:border-ink focus-within:ring-1 focus-within:ring-ink">
        <span>
          <span className="block text-base font-semibold">Cleaning fee</span>
          <span className="block text-sm text-muted">Charged once per stay</span>
        </span>
        <span className="flex items-center text-lg font-semibold">
          $
          <input
            inputMode="numeric"
            value={form.cleaning_fee}
            onChange={(event) => update({ cleaning_fee: toNumber(event.target.value) })}
            className="w-20 bg-transparent text-right outline-none"
          />
        </span>
      </label>
      <p className="mt-4 text-sm text-muted">Guests also pay Airbnb&apos;s service fee, which is shown in the price breakdown before they book.</p>
    </div>
  );
}
