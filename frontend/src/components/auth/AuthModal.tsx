"use client";

import { ChevronLeft, House, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { LoadingDots } from "@/components/ui/Loading";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/lib/api";
import { DEMO_GUEST_EMAIL, DEMO_HOST_EMAIL } from "@/lib/constants";

const inputClass =
  "w-full rounded-lg border border-faint bg-canvas px-3 pb-2 pt-6 text-base outline-none transition focus:border-ink focus:ring-1 focus:ring-ink";

/** Airbnb's "Log in or sign up" dialog. Auth is mocked: an email is enough (no password). */
export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, signup } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState<"email" | "signup">("email");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function close() {
    closeAuthModal();
    setStep("email");
    setError(null);
  }

  async function continueWithEmail(address: string) {
    setBusy(true);
    setError(null);
    try {
      const user = await login(address);
      showToast(`Welcome back, ${user.name.split(" ")[0]}!`, { type: "success" });
      close();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setStep("signup"); // new email -> finish signing up
      else setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function finishSignup(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await signup(email, `${firstName.trim()} ${lastName.trim()}`.trim());
      showToast(`Welcome to Airbnb, ${user.name.split(" ")[0]}!`, { type: "success" });
      close();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const socialButton =
    "relative flex h-12 w-full items-center justify-center rounded-lg border border-ink text-sm font-semibold transition hover:bg-soft disabled:opacity-50";

  return (
    <Modal
      open={isAuthModalOpen}
      onClose={close}
      size="md"
      title={step === "email" ? "Log in or sign up" : "Finish signing up"}
      headerAction={
        step === "signup" ? (
          <button onClick={() => setStep("email")} className="rounded-full p-2 hover:bg-soft" aria-label="Back">
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
        ) : null
      }
    >
      {step === "email" ? (
        <div>
          <h3 className="mb-6 text-[22px] font-semibold">Welcome to Airbnb</h3>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (email.trim()) continueWithEmail(email.trim());
            }}
          >
            <label className="relative block">
              <span className="absolute left-3 top-2 text-xs text-muted">Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guest@demo.com" className={`${inputClass} placeholder:text-faint`} autoComplete="email" autoFocus />
            </label>
            <p className="mt-2 text-xs text-muted">Passwordless demo login: we&apos;ll log you in, or help you create an account.</p>
            {error && <p className="mt-3 text-sm text-error">{error}</p>}
            <button type="submit" disabled={busy} className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-brand-gradient text-base font-semibold text-white">
              {busy ? <LoadingDots /> : "Continue"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>

          <div className="space-y-4">
            <button className={socialButton} disabled={busy} onClick={() => continueWithEmail(DEMO_GUEST_EMAIL)}>
              <UserRound className="absolute left-6 h-5 w-5" /> Continue as demo guest
            </button>
            <button className={socialButton} disabled={busy} onClick={() => continueWithEmail(DEMO_HOST_EMAIL)}>
              <House className="absolute left-6 h-5 w-5" /> Continue as demo host
            </button>
            <button className={socialButton} onClick={() => showToast("Social login is coming soon.")}>
              <Mail className="absolute left-6 h-5 w-5" /> Continue with Google
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={finishSignup}>
          <p className="mb-2 text-base font-semibold">Legal name</p>
          <div className="overflow-hidden rounded-lg border border-faint">
            <label className="relative block border-b border-faint">
              <span className="absolute left-3 top-2 text-xs text-muted">First name</span>
              <input required minLength={1} value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-canvas px-3 pb-2 pt-6 outline-none" autoFocus />
            </label>
            <label className="relative block">
              <span className="absolute left-3 top-2 text-xs text-muted">Last name</span>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-canvas px-3 pb-2 pt-6 outline-none" />
            </label>
          </div>
          <p className="mt-2 text-xs text-muted">Make sure this matches the name on your government ID.</p>

          <p className="mb-2 mt-6 text-base font-semibold">Email</p>
          <input value={email} readOnly className="w-full rounded-lg border border-faint bg-soft px-3 py-3 text-base text-muted" />

          <p className="mt-6 text-xs text-muted">
            By selecting <strong>Agree and continue</strong>, I agree to the Terms of Service and acknowledge the Privacy Policy.
          </p>
          {error && <p className="mt-3 text-sm text-error">{error}</p>}
          <button type="submit" disabled={busy || (firstName + lastName).trim().length < 2} className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-brand-gradient text-base font-semibold text-white disabled:opacity-50">
            {busy ? <LoadingDots /> : "Agree and continue"}
          </button>
        </form>
      )}
    </Modal>
  );
}
