"use client";

import { ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { LoadingDots } from "@/components/ui/Loading";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { StepProps } from "./form";

// Handy for demos: a few ready-made photos (Unsplash).
const SAMPLE_PHOTOS = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600488999585-e4364713b90a?auto=format&fit=crop&w=1200&q=80",
];

/** Upload photos from the device (stored by the backend) or add them by URL. The first photo is the cover. */
export default function StepPhotos({ form, update }: StepProps) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(0);
  const [url, setUrl] = useState("");
  const [dragging, setDragging] = useState(false);

  async function uploadFiles(files: FileList | null) {
    for (const file of Array.from(files ?? [])) {
      if (!file.type.startsWith("image/")) {
        showToast(`${file.name} is not an image.`, { type: "error" });
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const { url: uploaded } = await api.uploadImage(file);
        update((current) => ({ image_urls: [...current.image_urls, uploaded] }));
      } catch (error) {
        showToast((error as Error).message, { type: "error" });
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function addUrl() {
    const value = url.trim();
    if (!/^https?:\/\/\S+$/.test(value)) {
      showToast("Enter a full image URL starting with http(s)://", { type: "error" });
      return;
    }
    update((current) => ({ image_urls: [...current.image_urls, value] }));
    setUrl("");
  }

  const remove = (index: number) => update((current) => ({ image_urls: current.image_urls.filter((_, i) => i !== index) }));
  const makeCover = (index: number) =>
    update((current) => {
      const images = [...current.image_urls];
      const [chosen] = images.splice(index, 1);
      return { image_urls: [chosen, ...images] };
    });

  return (
    <div>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          uploadFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center transition",
          dragging ? "border-ink bg-soft" : "border-faint hover:border-ink",
        )}
      >
        <ImagePlus className="h-12 w-12" strokeWidth={1.2} />
        <span className="mt-4 text-[22px] font-semibold">Drag your photos here</span>
        <span className="mt-1 text-base text-muted">JPG, PNG or WEBP, up to 5 MB each</span>
        <span className="mt-6 text-base font-semibold underline">Upload from your device</span>
        <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => uploadFiles(event.target.files)} />
      </label>
      {uploading > 0 && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted">
          <LoadingDots /> Uploading {uploading} photo{uploading > 1 ? "s" : ""}...
        </p>
      )}

      <div className="mt-6 flex gap-2">
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addUrl())}
          placeholder="...or paste an image URL"
          className="flex-1 rounded-lg border border-faint bg-canvas px-4 py-3 text-base outline-none focus:border-ink focus:ring-1 focus:ring-ink"
        />
        <button type="button" onClick={addUrl} className="rounded-lg border border-ink px-5 font-semibold hover:bg-soft">
          Add
        </button>
      </div>
      {form.image_urls.length === 0 && (
        <button
          type="button"
          onClick={() => update({ image_urls: SAMPLE_PHOTOS })}
          className="mt-3 text-sm font-semibold underline"
        >
          No photos handy? Use sample photos
        </button>
      )}

      {form.image_urls.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4">
          {form.image_urls.map((src, index) => (
            <div key={src + index} className={cn("group relative overflow-hidden rounded-xl bg-soft", index === 0 ? "col-span-2 aspect-[3/2]" : "aspect-square")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
              {index === 0 && <span className="absolute left-3 top-3 rounded-md bg-white px-3 py-1 text-sm font-semibold text-[#222] shadow">Cover photo</span>}
              <div className="absolute right-3 top-3 flex gap-2">
                {index > 0 && (
                  <button type="button" onClick={() => makeCover(index)} className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#222] shadow hover:bg-white">
                    Make cover
                  </button>
                )}
                <button type="button" onClick={() => remove(index)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#222] shadow hover:bg-white" aria-label={`Remove photo ${index + 1}`}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
