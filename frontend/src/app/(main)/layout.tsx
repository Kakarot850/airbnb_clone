import { Suspense } from "react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";

/** Layout for every guest-facing page: header, footer and the phone tab bar. */
export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<div className="h-20 border-b border-divider" />}>
        <Header />
      </Suspense>
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <MobileNav />
    </>
  );
}
