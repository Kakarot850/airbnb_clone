import { Sparkles } from "lucide-react";
import Link from "next/link";

/** Placeholder page for features that are intentionally mocked (messages, payments, verification...). */
export default function ComingSoon({ title, text, icon }: { title: string; text: string; icon?: React.ReactNode }) {
  return (
    <div className="detail-container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-soft text-brand">{icon ?? <Sparkles className="h-8 w-8" />}</div>
      <span className="mb-3 rounded-full bg-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">Coming soon</span>
      <h1 className="text-[32px] font-semibold">{title}</h1>
      <p className="mt-3 max-w-md text-base text-muted">{text}</p>
      <Link href="/" className="mt-8 rounded-lg bg-ink px-6 py-3 text-base font-semibold text-canvas hover:opacity-90">
        Back to exploring
      </Link>
    </div>
  );
}
