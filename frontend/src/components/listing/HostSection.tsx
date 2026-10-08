import { Award, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { StarIcon } from "@/components/ui/Stars";
import { formatRating, yearsSince } from "@/lib/format";
import type { HostProfile } from "@/lib/types";

/** "Meet your host" card with review stats, Superhost badge and bio. */
export default function HostSection({ host }: { host: HostProfile }) {
  const firstName = host.name.split(" ")[0];
  const years = yearsSince(host.created_at);
  const stat = "border-b border-divider py-3 first:pt-0 last:border-b-0 last:pb-0";
  return (
    <section className="border-t border-divider py-12">
      <h2 className="mb-6 text-[22px] font-semibold">Meet your host</h2>
      <div className="grid items-start gap-12 md:grid-cols-[minmax(0,380px)_1fr]">
        <div className="flex items-center gap-6 rounded-3xl bg-canvas px-6 py-8 shadow-[0_6px_20px_rgba(0,0,0,0.2)]">
          <div className="flex flex-1 flex-col items-center text-center">
            <div className="relative">
              <Avatar src={host.avatar_url} name={host.name} className="h-24 w-24 text-4xl" />
              {host.is_superhost && (
                <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
                  <Award className="h-4 w-4" />
                </span>
              )}
            </div>
            <p className="mt-3 text-[28px] font-bold leading-8">{firstName}</p>
            <p className="flex items-center gap-1 text-sm font-semibold">{host.is_superhost ? <><Award className="h-3.5 w-3.5" /> Superhost</> : "Host"}</p>
          </div>
          <div className="w-28 shrink-0">
            <div className={stat}>
              <p className="text-[22px] font-bold leading-6">{host.review_count}</p>
              <p className="text-[10px] font-semibold">Reviews</p>
            </div>
            <div className={stat}>
              <p className="flex items-center gap-1 text-[22px] font-bold leading-6">
                {host.review_count ? formatRating(host.rating_avg) : "–"} <StarIcon className="h-3.5 w-3.5" />
              </p>
              <p className="text-[10px] font-semibold">Rating</p>
            </div>
            <div className={stat}>
              <p className="text-[22px] font-bold leading-6">{Math.max(years, 1)}</p>
              <p className="text-[10px] font-semibold">{years <= 1 ? "Year" : "Years"} hosting</p>
            </div>
          </div>
        </div>

        <div className="text-base">
          {host.is_superhost && (
            <div className="mb-6">
              <p className="text-lg font-semibold">{firstName} is a Superhost</p>
              <p className="mt-1 text-muted">Superhosts are experienced, highly rated hosts who are committed to providing great stays for guests.</p>
            </div>
          )}
          {host.bio && <p className="mb-6">{host.bio}</p>}
          <p className="text-lg font-semibold">Host details</p>
          <p className="mt-2">Response rate: 100%</p>
          <p>Responds within an hour</p>
          <Link href="/messages" className="mt-6 inline-block rounded-lg bg-ink px-6 py-3.5 font-semibold text-canvas hover:opacity-90">
            Message host
          </Link>
          <p className="mt-8 flex items-start gap-3 border-t border-divider pt-6 text-xs text-muted">
            <ShieldCheck className="h-6 w-6 shrink-0 text-brand" />
            To help protect your payment, always use Airbnb to send money and communicate with hosts.
          </p>
        </div>
      </div>
    </section>
  );
}
