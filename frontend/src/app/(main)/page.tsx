import { Suspense } from "react";
import ExploreView from "@/components/explore/ExploreView";
import { ListingGridSkeleton } from "@/components/explore/ListingGrid";

// Home / explore page. The search lives in the URL (?location=...&checkin=...), read by ExploreView.
export default function HomePage() {
  return (
    <Suspense fallback={<div className="page-container pt-6"><ListingGridSkeleton /></div>}>
      <ExploreView />
    </Suspense>
  );
}
