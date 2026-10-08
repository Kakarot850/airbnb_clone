"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

/** Clickable 1-5 star rating with hover preview. */
export default function StarInput({ value, onChange, size = "h-8 w-8", label }: { value: number; onChange: (value: number) => void; size?: string; label: string }) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;
  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(0)} role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((stars) => (
        <button
          key={stars}
          type="button"
          role="radio"
          aria-checked={value === stars}
          aria-label={`${stars} star${stars > 1 ? "s" : ""}`}
          onMouseEnter={() => setHovered(stars)}
          onClick={() => onChange(stars)}
          className="transition-transform hover:scale-110"
        >
          <Star className={cn(size, stars <= shown ? "text-ink" : "text-line")} fill="currentColor" strokeWidth={0} />
        </button>
      ))}
    </div>
  );
}
