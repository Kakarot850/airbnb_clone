"use client";

import { BadgeCheck, CreditCard, House, ShieldCheck } from "lucide-react";
import Link from "next/link";
import LoginPrompt from "@/components/auth/LoginPrompt";
import Avatar from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/Loading";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { memberFor } from "@/lib/format";

/** Profile summary + placeholders for features that are mocked (identity verification, payments). */
export default function AccountView() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  if (loading) return <PageLoader />;
  if (!user) return <LoginPrompt title="Account" text="Log in to manage your profile and settings." />;

  const cards = [
    { icon: ShieldCheck, title: "Identity verification", text: "Verify your ID to build trust with hosts and guests." },
    { icon: CreditCard, title: "Payments & payouts", text: "Review payments, payouts, coupons and gift cards." },
    { icon: BadgeCheck, title: "Login & security", text: "Update your password and secure your account." },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 md:py-12">
      <h1 className="text-[32px] font-semibold">Account</h1>
      <div className="mt-8 flex items-center gap-6 rounded-3xl p-6 shadow-[0_6px_20px_rgba(0,0,0,0.2)] md:w-[420px]">
        <Avatar src={user.avatar_url} name={user.name} className="h-24 w-24 text-4xl" />
        <div>
          <p className="text-[26px] font-bold">{user.name}</p>
          <p className="text-sm text-muted">{user.email}</p>
          <p className="mt-1 text-sm font-semibold">{user.is_host ? "Host" : "Guest"} · {memberFor(user.created_at)}</p>
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {cards.map(({ icon: Icon, title, text }) => (
          <button key={title} onClick={() => showToast(`${title} is coming soon.`)} className="rounded-xl p-5 text-left shadow-card transition hover:shadow-float">
            <Icon className="h-8 w-8" strokeWidth={1.5} />
            <p className="mt-6 font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted">{text}</p>
            <span className="mt-3 inline-block rounded-full bg-soft px-2.5 py-1 text-[11px] font-semibold uppercase text-muted">Coming soon</span>
          </button>
        ))}
        <Link href={user.is_host ? "/host" : "/host/listings/new"} className="rounded-xl p-5 shadow-card transition hover:shadow-float">
          <House className="h-8 w-8" strokeWidth={1.5} />
          <p className="mt-6 font-semibold">{user.is_host ? "Hosting dashboard" : "Become a host"}</p>
          <p className="mt-1 text-sm text-muted">{user.is_host ? "Manage your listings and reservations." : "List your place and start earning."}</p>
        </Link>
      </div>
    </div>
  );
}
