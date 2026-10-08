import { Globe } from "lucide-react";
import Link from "next/link";

const SECTIONS = [
  { title: "Support", links: ["Help Center", "AirCover", "Anti-discrimination", "Disability support", "Cancellation options", "Report neighborhood concern"] },
  { title: "Hosting", links: ["Airbnb your home", "AirCover for Hosts", "Hosting resources", "Community forum", "Hosting responsibly"] },
  { title: "Airbnb", links: ["Newsroom", "New features", "Careers", "Investors", "Gift cards"] },
];

export default function Footer() {
  return (
    <footer className="border-t border-divider bg-soft pb-16 md:pb-0">
      <div className="page-container py-12">
        <div className="grid gap-8 text-sm md:grid-cols-3">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 font-semibold">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <Link href={link === "Airbnb your home" ? "/host/listings/new" : "/help"} className="hover:underline">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col-reverse gap-4 border-t border-divider pt-6 text-sm md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Airbnb Clone (demo project) · <Link href="/help" className="hover:underline">Privacy</Link> ·{" "}
            <Link href="/help" className="hover:underline">Terms</Link> · <Link href="/help" className="hover:underline">Sitemap</Link>
          </p>
          <p className="flex items-center gap-6 font-semibold">
            <span className="flex items-center gap-2"><Globe className="h-4 w-4" /> English (US)</span>
            <span>$ USD</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
