import { Suspense } from "react";
import ListingDetailView from "@/components/listing/ListingDetailView";
import { PageLoader } from "@/components/ui/Loading";

// Listing detail page: /rooms/12?checkin=2026-11-01&checkout=2026-11-05&adults=2
export default async function ListingPage({ params }: PageProps<"/rooms/[id]">) {
  const { id } = await params;
  return (
    <Suspense fallback={<PageLoader />}>
      <ListingDetailView id={Number(id)} />
    </Suspense>
  );
}
