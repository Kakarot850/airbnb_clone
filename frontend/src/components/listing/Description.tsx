"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import Modal from "@/components/ui/Modal";

const HEADINGS = new Set(["The space", "Guest access", "Other things to note"]);

/** Renders the description; known section titles ("The space"...) become bold headings. */
function DescriptionText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").map((paragraph, i) => {
        const [first, ...rest] = paragraph.split("\n");
        const hasHeading = HEADINGS.has(first);
        return (
          <div key={i} className="mb-4 last:mb-0">
            {hasHeading && <h3 className="mb-1 font-semibold">{first}</h3>}
            <p className="whitespace-pre-line">{hasHeading ? rest.join("\n") : paragraph}</p>
          </div>
        );
      })}
    </>
  );
}

export default function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const intro = text.split("\n\n")[0];
  return (
    <section className="border-t border-divider py-8 text-base leading-6">
      <p className="line-clamp-6">{intro}</p>
      <button onClick={() => setOpen(true)} className="mt-4 flex items-center gap-1 font-semibold underline">
        Show more <ChevronRight className="h-4 w-4" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} size="lg">
        <h2 className="mb-6 text-[26px] font-semibold">About this space</h2>
        <div className="text-base leading-6">
          <DescriptionText text={text} />
        </div>
      </Modal>
    </section>
  );
}
