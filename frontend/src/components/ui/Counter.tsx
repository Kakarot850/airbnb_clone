"use client";

import { Minus, Plus } from "lucide-react";

interface CounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string; // for screen readers, e.g. "adults"
  format?: (value: number) => string; // e.g. show "Any" for 0
}

/** The round "−  2  +" control used for guests, bedrooms, beds and bathrooms. */
export function Counter({ value, onChange, min = 0, max = 99, label, format }: CounterProps) {
  const button =
    "flex h-8 w-8 items-center justify-center rounded-full border border-faint text-muted transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:border-faint disabled:hover:text-muted";
  return (
    <div className="flex items-center gap-4">
      <button type="button" className={button} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Decrease ${label}`}>
        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
      <span className="min-w-6 text-center text-base" aria-live="polite">
        {format ? format(value) : value}
      </span>
      <button type="button" className={button} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase ${label}`}>
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

/** A labeled counter row: title + subtitle on the left, counter on the right. */
export function CounterRow({ title, subtitle, ...counter }: CounterProps & { title: string; subtitle?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-divider py-4 last:border-b-0">
      <div>
        <p className="text-base font-semibold">{title}</p>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      <Counter {...counter} />
    </div>
  );
}
