"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import GuestPicker from "@/components/ui/GuestPicker";
import { useSearchDraft } from "@/hooks/useSearchDraft";
import { cn } from "@/lib/cn";
import { formatDateRange, guestsSummary } from "@/lib/format";
import LocationSuggestions from "./LocationSuggestions";

type Step = "where" | "when" | "who";

/** Full-screen search for phones: stacked "Where / When / Who" cards, like the Airbnb mobile web app. */
export default function MobileSearch({ onClose }: { onClose: () => void }) {
  const draft = useSearchDraft();
  const [step, setStep] = useState<Step>("where");
  const guestCount = draft.guests.adults + draft.guests.children;

  const collapsed = (title: string, value: string, target: Step) => (
    <button type="button" onClick={() => setStep(target)} className="flex w-full items-center justify-between rounded-2xl bg-canvas px-5 py-4 text-sm shadow-card">
      <span className="text-muted">{title}</span>
      <span className="font-semibold">{value}</span>
    </button>
  );
  const card = (content: React.ReactNode) => <div className="rounded-3xl bg-canvas p-5 shadow-card">{content}</div>;

  return (
    <div className="fixed inset-0 z-[100] flex animate-fade-in flex-col bg-soft md:hidden">
      <div className="flex items-center px-5 pb-2 pt-4">
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-canvas" aria-label="Close search">
          <X className="h-4 w-4" />
        </button>
        <p className="flex-1 pr-8 text-center text-base font-semibold">Stays</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-6 pt-2">
        {step === "where"
          ? card(
              <>
                <h2 className="mb-4 text-[22px] font-semibold">Where to?</h2>
                <label className="mb-4 flex items-center gap-3 rounded-xl border border-faint px-4 py-3">
                  <Search className="h-4 w-4" strokeWidth={2.5} />
                  <input
                    autoFocus
                    value={draft.location}
                    onChange={(event) => draft.setLocation(event.target.value)}
                    placeholder="Search destinations"
                    className="w-full bg-transparent text-sm font-semibold outline-none placeholder:font-normal"
                  />
                </label>
                <LocationSuggestions
                  query={draft.location}
                  onSelect={(place) => {
                    draft.setLocation(place);
                    setStep("when");
                  }}
                />
              </>,
            )
          : collapsed("Where", draft.location || "I'm flexible", "where")}

        {step === "when"
          ? card(
              <>
                <h2 className="mb-6 text-[22px] font-semibold">When&apos;s your trip?</h2>
                <DateRangePicker checkIn={draft.checkIn} checkOut={draft.checkOut} onChange={draft.setDates} months={1} />
                <div className="mt-4 flex justify-between border-t border-divider pt-4">
                  <button type="button" className="text-sm font-semibold underline" onClick={() => draft.setDates(null, null)}>
                    Skip
                  </button>
                  <button type="button" className="rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-canvas" onClick={() => setStep("who")}>
                    Next
                  </button>
                </div>
              </>,
            )
          : collapsed("When", draft.checkIn && draft.checkOut ? formatDateRange(draft.checkIn, draft.checkOut) : "Add dates", "when")}

        {step === "who"
          ? card(
              <>
                <h2 className="mb-2 text-[22px] font-semibold">Who&apos;s coming?</h2>
                <GuestPicker value={draft.guests} onChange={draft.setGuests} />
              </>,
            )
          : collapsed("Who", guestCount ? guestsSummary(draft.guests) : "Add guests", "who")}
      </div>

      <div className="flex items-center justify-between border-t border-divider bg-canvas px-6 py-4">
        <button type="button" className="text-base font-semibold underline" onClick={draft.clearAll}>
          Clear all
        </button>
        <button
          type="button"
          onClick={() => {
            draft.submit();
            onClose();
          }}
          className={cn("flex items-center gap-2 rounded-lg bg-brand-gradient px-6 py-3.5 text-base font-semibold text-white")}
        >
          <Search className="h-4 w-4" strokeWidth={3} /> Search
        </button>
      </div>
    </div>
  );
}
