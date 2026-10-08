"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/** Round profile photo. Falls back to the first letter of the name (Airbnb does the same). */
export default function Avatar({ src, name, className = "h-10 w-10 text-base" }: { src?: string | null; name?: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? ""} className={cn("shrink-0 rounded-full bg-soft object-cover", className)} onError={() => setBroken(true)} />;
  }
  if (name) {
    return (
      <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-ink font-semibold text-canvas", className)}>
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-canvas", className)}>
      <svg viewBox="0 0 32 32" className="mt-[30%] h-full w-full fill-current" aria-hidden="true">
        <path d="M16 .7C7.56.7.7 7.56.7 16S7.56 31.3 16 31.3 31.3 24.44 31.3 16 24.44.7 16 .7zm0 28c-4.02 0-7.6-1.88-9.93-4.81a12.43 12.43 0 0 1 6.45-4.4A6.5 6.5 0 0 1 9.5 14a6.5 6.5 0 0 1 13 0 6.51 6.51 0 0 1-3.02 5.5 12.42 12.42 0 0 1 6.45 4.4A12.67 12.67 0 0 1 16 28.7z" />
      </svg>
    </span>
  );
}
