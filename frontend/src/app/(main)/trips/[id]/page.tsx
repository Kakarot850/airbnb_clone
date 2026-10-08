import { Suspense } from "react";
import TripDetailView from "@/components/trips/TripDetailView";
import { PageLoader } from "@/components/ui/Loading";

export default async function TripPage({ params }: PageProps<"/trips/[id]">) {
  const { id } = await params;
  return (
    <Suspense fallback={<PageLoader />}>
      <TripDetailView id={Number(id)} />
    </Suspense>
  );
}
