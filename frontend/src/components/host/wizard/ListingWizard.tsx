"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import LoginPrompt from "@/components/auth/LoginPrompt";
import { BeloIcon } from "@/components/layout/Logo";
import { LoadingDots, PageLoader } from "@/components/ui/Loading";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { EMPTY_FORM, formFromListing, STEPS, toListingInput, type ListingForm, type StepProps, type UpdateForm } from "./form";
import StepAmenities from "./StepAmenities";
import StepBasics from "./StepBasics";
import StepCategory from "./StepCategory";
import StepDescription from "./StepDescription";
import StepLocation from "./StepLocation";
import StepPhotos from "./StepPhotos";
import StepPlaceType from "./StepPlaceType";
import StepPrice from "./StepPrice";
import StepPropertyType from "./StepPropertyType";
import StepReview from "./StepReview";
import StepTitle from "./StepTitle";

const STEP_COMPONENTS: Record<string, (props: StepProps) => React.ReactNode> = {
  property: StepPropertyType,
  place: StepPlaceType,
  location: StepLocation,
  basics: StepBasics,
  amenities: StepAmenities,
  category: StepCategory,
  photos: StepPhotos,
  title: StepTitle,
  description: StepDescription,
  price: StepPrice,
  review: StepReview,
};

/** Step-by-step "Airbnb your home" flow, used both to create (/host/listings/new) and edit a listing. */
export default function ListingWizard({ listingId }: { listingId?: number }) {
  const router = useRouter();
  const { user, loading, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState<ListingForm | null>(listingId ? null : EMPTY_FORM);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!listingId || !user) return;
    api
      .getListing(listingId)
      .then((listing) => {
        if (listing.host_id !== user.id) setLoadError("You can only edit your own listings.");
        else setForm(formFromListing(listing));
      })
      .catch((error: Error) => setLoadError(error.message));
  }, [listingId, user]);

  const update: UpdateForm = useCallback(
    (patch) => setForm((current) => current && { ...current, ...(typeof patch === "function" ? patch(current) : patch) }),
    [],
  );

  async function save() {
    if (!form) return;
    const invalidStep = STEPS.findIndex((s) => s.validate(form) !== null);
    if (invalidStep >= 0) {
      setStep(invalidStep);
      showToast(STEPS[invalidStep].validate(form)!, { type: "error" });
      return;
    }
    setSaving(true);
    try {
      const input = toListingInput(form);
      const saved = listingId ? await api.updateListing(listingId, input) : await api.createListing(input);
      await refreshUser(); // creating a first listing turns the user into a host
      showToast(listingId ? "Changes saved" : "Your listing is live!", {
        type: "success",
        image: saved.image_urls[0],
        action: { label: "View", href: `/rooms/${saved.id}` },
      });
      router.push("/host/listings");
    } catch (error) {
      showToast((error as Error).message, { type: "error" });
      setSaving(false);
    }
  }

  if (loading) return <PageLoader />;
  if (!user) return <LoginPrompt title="Airbnb your home" text="Log in or sign up to list your place." />;
  if (loadError) {
    return (
      <div className="page-container py-24 text-center">
        <h1 className="text-[28px] font-semibold">{loadError}</h1>
        <Link href="/host/listings" className="mt-6 inline-block font-semibold underline">Back to your listings</Link>
      </div>
    );
  }
  if (!form) return <PageLoader />;

  const current = STEPS[step];
  const error = current.validate(form);
  const isLast = step === STEPS.length - 1;
  const StepComponent = STEP_COMPONENTS[current.key];
  const headerButton = "rounded-full border border-line px-4 py-2 text-sm font-semibold hover:border-ink";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-20 items-center justify-between px-6 md:px-12">
        <Link href="/host" className="text-ink" aria-label="Hosting home">
          <BeloIcon className="h-8 w-8" />
        </Link>
        <div className="flex gap-3">
          <button type="button" onClick={() => showToast("Host support is coming soon.")} className={headerButton}>
            Questions?
          </button>
          {listingId ? (
            <button type="button" onClick={save} disabled={saving} className={headerButton}>
              Save &amp; exit
            </button>
          ) : (
            <Link href="/host/listings" className={headerButton}>
              Exit
            </Link>
          )}
        </div>
      </header>

      <main className="flex flex-1 justify-center px-6 pb-40 pt-4 md:pt-10">
        <div className={cn("w-full", current.wide ? "max-w-3xl" : "max-w-[640px]")}>
          <p className="text-sm font-semibold text-muted">
            {listingId ? "Editing" : "Step"} {step + 1} of {STEPS.length}
          </p>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight md:text-[32px]">{current.title}</h1>
          {current.subtitle && <p className="mt-2 text-base text-muted md:text-lg">{current.subtitle}</p>}
          <div className="mt-8">
            <StepComponent form={form} update={update} />
          </div>
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-40 bg-canvas">
        <div className="h-1.5 bg-divider">
          <div className="h-full bg-ink transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="flex items-center justify-between px-6 py-4 md:px-12">
          <button type="button" onClick={() => setStep((s) => s - 1)} className={cn("text-base font-semibold underline", step === 0 && "invisible")}>
            Back
          </button>
          <div className="flex items-center gap-4">
            {error && <p className="hidden text-sm text-muted md:block">{error}</p>}
            {isLast ? (
              <button type="button" onClick={save} disabled={saving} className="flex h-12 min-w-40 items-center justify-center rounded-lg bg-brand-gradient px-6 text-base font-semibold text-white">
                {saving ? <LoadingDots /> : listingId ? "Save changes" : "Publish listing"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setStep((s) => s + 1);
                  window.scrollTo({ top: 0 });
                }}
                disabled={error !== null}
                className="h-12 rounded-lg bg-ink px-8 text-base font-semibold text-canvas transition disabled:cursor-not-allowed disabled:opacity-25"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
