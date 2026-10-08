"use client";

import { cn } from "@/lib/cn";
import type { PriceHistogram } from "@/lib/types";

interface PriceRangeProps {
  histogram: PriceHistogram;
  min: number | null; // null = no lower limit
  max: number | null; // null = no upper limit
  onChange: (min: number | null, max: number | null) => void;
}

const digits = (text: string) => Number(text.replace(/\D/g, ""));

/** Price histogram + two-thumb slider + min/max inputs (Filters modal). */
export default function PriceRange({ histogram, min, max, onChange }: PriceRangeProps) {
  const low = histogram.min_price;
  const high = histogram.max_price;
  const from = min ?? low;
  const to = max ?? high;
  const span = Math.max(high - low, 1);
  const percent = (value: number) => ((value - low) / span) * 100;
  const tallest = Math.max(...histogram.buckets, 1);
  const bucketWidth = span / histogram.buckets.length;

  // Values at the ends of the range mean "no limit".
  const commit = (nextFrom: number, nextTo: number) =>
    onChange(nextFrom <= low ? null : nextFrom, nextTo >= high ? null : nextTo);

  const box = "flex-1 rounded-full border border-faint px-5 py-2 focus-within:border-ink focus-within:ring-1 focus-within:ring-ink";
  return (
    <div>
      <div className="flex h-20 items-end gap-[2px] px-4">
        {histogram.buckets.map((count, i) => {
          const bucketPrice = low + i * bucketWidth;
          const inRange = bucketPrice + bucketWidth >= from && bucketPrice <= to;
          return (
            <span
              key={i}
              className={cn("flex-1 rounded-t-sm", inRange ? "bg-brand" : "bg-line")}
              style={{ height: `${count ? Math.max((count / tallest) * 100, 6) : 0}%` }}
            />
          );
        })}
      </div>

      <div className="relative mx-4 h-8">
        <div className="absolute top-1/2 h-0.5 w-full -translate-y-1/2 bg-line" />
        <div className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-ink" style={{ left: `${percent(from)}%`, right: `${100 - percent(to)}%` }} />
        <input
          type="range"
          aria-label="Minimum price"
          className="dual-range top-0 h-8"
          min={low}
          max={high}
          step={5}
          value={from}
          onChange={(event) => commit(Math.min(Number(event.target.value), to - 10), to)}
        />
        <input
          type="range"
          aria-label="Maximum price"
          className="dual-range top-0 h-8"
          min={low}
          max={high}
          step={5}
          value={to}
          onChange={(event) => commit(from, Math.max(Number(event.target.value), from + 10))}
        />
      </div>

      <div className="mt-6 flex items-center gap-4">
        <label className={box}>
          <span className="block text-xs text-muted">Minimum</span>
          <span className="flex text-base">
            $
            <input
              inputMode="numeric"
              value={from}
              onChange={(event) => commit(digits(event.target.value) || low, to)}
              className="w-full bg-transparent pl-0.5 outline-none"
            />
          </span>
        </label>
        <span className="h-px w-4 bg-faint" />
        <label className={box}>
          <span className="block text-xs text-muted">Maximum</span>
          <span className="flex text-base">
            $
            <input
              inputMode="numeric"
              value={to}
              onChange={(event) => commit(from, digits(event.target.value) || high)}
              className="bg-transparent pl-0.5 outline-none"
              style={{ width: `${String(to).length + 1}ch` }}
            />
            {max === null && "+"}
          </span>
        </label>
      </div>
    </div>
  );
}
