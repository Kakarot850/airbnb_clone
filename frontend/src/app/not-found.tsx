import Link from "next/link";
import Logo from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <header className="page-container flex h-20 items-center border-b border-divider">
        <Logo alwaysShowText />
      </header>
      <div className="page-container grid items-center gap-12 py-20 md:grid-cols-2">
        <div>
          <h1 className="text-[120px] font-bold leading-none text-ink">Oops!</h1>
          <p className="mt-6 text-[28px] font-semibold">We can&apos;t seem to find the page you&apos;re looking for.</p>
          <p className="mt-4 text-sm font-semibold text-muted">Error code: 404</p>
          <p className="mt-6 text-base">Here are some helpful links instead:</p>
          <ul className="mt-2 space-y-1 text-base underline">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/trips">Trips</Link></li>
            <li><Link href="/host">Hosting</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
