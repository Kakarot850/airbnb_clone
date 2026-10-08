"use client";

import { useAuth } from "@/context/AuthContext";

/** Shown on pages that need an account (Trips, Wishlists, ...) when nobody is logged in. */
export default function LoginPrompt({ title, text }: { title: string; text: string }) {
  const { openAuthModal } = useAuth();
  return (
    <div className="page-container py-12">
      <h1 className="text-[32px] font-semibold">{title}</h1>
      <div className="mt-8 max-w-lg border-t border-divider pt-8">
        <h2 className="text-[22px] font-semibold">Log in to continue</h2>
        <p className="mt-2 text-base text-muted">{text}</p>
        <button onClick={openAuthModal} className="mt-6 rounded-lg bg-brand-gradient px-6 py-3 text-base font-semibold text-white">
          Log in
        </button>
      </div>
    </div>
  );
}
