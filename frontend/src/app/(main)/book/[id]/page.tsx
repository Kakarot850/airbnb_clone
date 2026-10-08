import { Suspense } from "react";
import CheckoutView from "@/components/booking/CheckoutView";
import { PageLoader } from "@/components/ui/Loading";

// Checkout: /book/12?checkin=2026-11-01&checkout=2026-11-05&adults=2
export default async function BookPage({ params }: PageProps<"/book/[id]">) {
  const { id } = await params;
  return (
    <Suspense fallback={<PageLoader />}>
      <CheckoutView id={Number(id)} />
    </Suspense>
  );
}
