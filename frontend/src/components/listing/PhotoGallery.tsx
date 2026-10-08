"use client";

import { ChevronLeft, Grid3x3 } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import ImageCarousel from "@/components/ui/ImageCarousel";

/** Airbnb's 1 big + 4 small photo grid, and the full-screen "Show all photos" view. */
export default function PhotoGallery({ images, title }: { images: string[]; title: string }) {
  const [tourOpen, setTourOpen] = useState(false);
  const grid = images.slice(0, 5);

  return (
    <>
      {/* Phones: swipeable carousel */}
      <div className="-mx-6 md:hidden">
        <ImageCarousel images={images} alt={title} className="aspect-[4/3] w-full" />
      </div>

      {/* Desktop: photo grid */}
      <div className="relative hidden h-[min(56vh,520px)] gap-2 overflow-hidden rounded-xl md:grid md:grid-cols-4 md:grid-rows-2">
        {grid.map((src, i) => (
          <button
            key={src + i}
            onClick={() => setTourOpen(true)}
            className={`relative overflow-hidden bg-soft ${i === 0 ? "col-span-2 row-span-2" : ""} ${grid.length < 5 && i === 0 ? "col-span-4" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${title} - photo ${i + 1}`} className="h-full w-full object-cover transition hover:brightness-90" />
          </button>
        ))}
        <button
          onClick={() => setTourOpen(true)}
          className="absolute bottom-6 right-6 flex items-center gap-2 rounded-lg border border-[#222] bg-white px-4 py-1.5 text-sm font-semibold text-[#222] hover:bg-[#f7f7f7]"
        >
          <Grid3x3 className="h-4 w-4" /> Show all photos
        </button>
      </div>

      {tourOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] animate-slide-up overflow-y-auto bg-canvas">
            <div className="sticky top-0 z-10 flex h-16 items-center bg-canvas px-6">
              <button onClick={() => setTourOpen(false)} className="rounded-full p-2 hover:bg-soft" aria-label="Close photo tour">
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
            <div className="mx-auto max-w-3xl px-6 pb-16">
              <h2 className="mb-8 text-[26px] font-semibold">Photo tour</h2>
              <div className="grid grid-cols-2 gap-2">
                {images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src + i}
                    src={src}
                    alt={`${title} - photo ${i + 1}`}
                    loading="lazy"
                    className={`w-full rounded-sm object-cover ${i % 3 === 0 ? "col-span-2 aspect-[3/2]" : "aspect-square"}`}
                  />
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
