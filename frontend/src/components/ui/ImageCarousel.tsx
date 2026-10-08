"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Photo slider used by listing cards: arrows on hover, dots, and swipe on touch screens. */
export default function ImageCarousel({ images, alt, className }: { images: string[]; alt: string; className?: string }) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const last = images.length - 1;

  const go = (event: React.MouseEvent, step: number) => {
    event.preventDefault(); // don't follow the card link
    event.stopPropagation();
    setIndex((current) => Math.min(Math.max(current + step, 0), last));
  };

  // Show at most 5 dots, sliding along with the current photo (like Airbnb).
  const firstDot = Math.min(Math.max(index - 2, 0), Math.max(images.length - 5, 0));
  const dots = images.slice(firstDot, firstDot + 5).map((_, i) => firstDot + i);

  return (
    <div
      className={cn("group/carousel relative overflow-hidden bg-soft", className)}
      onTouchStart={(event) => (touchStart.current = event.touches[0].clientX)}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta = event.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(delta) > 40) setIndex((current) => Math.min(Math.max(current + (delta < 0 ? 1 : -1), 0), last));
        touchStart.current = null;
      }}
    >
      <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
        {images.map((src, i) => (
          <div key={src + i} className="h-full w-full shrink-0">
            {/* Only load the photos around the visible one. */}
            {Math.abs(i - index) <= 1 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={`${alt} - photo ${i + 1}`} loading="lazy" className="h-full w-full object-cover" draggable={false} />
            )}
          </div>
        ))}
      </div>

      {index > 0 && (
        <button
          onClick={(event) => go(event, -1)}
          className="absolute left-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#222] opacity-0 shadow transition hover:scale-105 hover:bg-white group-hover/carousel:opacity-100 md:flex"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        </button>
      )}
      {index < last && (
        <button
          onClick={(event) => go(event, 1)}
          className="absolute right-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#222] opacity-0 shadow transition hover:scale-105 hover:bg-white group-hover/carousel:opacity-100 md:flex"
          aria-label="Next photo"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      )}

      {images.length > 1 && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          {dots.map((i) => (
            <span
              key={i}
              className={cn(
                "rounded-full bg-white transition-all",
                i === index ? "h-1.5 w-1.5 opacity-100" : "h-1.5 w-1.5 opacity-60",
                (i === dots[0] && firstDot > 0) || (i === dots[dots.length - 1] && firstDot + 5 < images.length) ? "scale-75" : "",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
