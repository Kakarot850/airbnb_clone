import Link from "next/link";

/** The Airbnb-style "Bélo" mark, drawn as two strokes. */
export function BeloIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round">
        <path d="M16 3.5c-1 0-1.8.6-2.4 1.7L5.4 21.6c-1.2 2.4-.1 6 3.2 6.6 2.2.4 4-.9 7.4-4.6 3.4 3.7 5.2 5 7.4 4.6 3.3-.6 4.4-4.2 3.2-6.6L18.4 5.2C17.8 4.1 17 3.5 16 3.5z" />
        <path d="M16 23.6c-2.5-2.8-3.8-5-3.8-6.7 0-2.1 1.7-3.5 3.8-3.5s3.8 1.4 3.8 3.5c0 1.7-1.3 3.9-3.8 6.7z" />
      </g>
    </svg>
  );
}

/** Logo linking home. The wordmark is hidden on small screens, like on Airbnb. */
export default function Logo({ href = "/", alwaysShowText = false }: { href?: string; alwaysShowText?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-brand" aria-label="Airbnb home">
      <BeloIcon className="h-8 w-8" />
      <span className={`${alwaysShowText ? "block" : "hidden xl:block"} text-[22px] font-bold tracking-tight`}>airbnb</span>
    </Link>
  );
}
