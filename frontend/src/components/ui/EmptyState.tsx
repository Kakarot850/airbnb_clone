import Link from "next/link";

/** Simple "nothing here yet" block with an optional call to action. */
export default function EmptyState({ title, text, actionLabel, actionHref, icon }: {
  title: string;
  text: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="max-w-xl py-6">
      {icon && <div className="mb-4 text-ink">{icon}</div>}
      <h2 className="text-[22px] font-semibold">{title}</h2>
      <p className="mt-2 text-base text-muted">{text}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-6 inline-block rounded-lg border border-ink px-6 py-3 text-base font-semibold hover:bg-soft">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
