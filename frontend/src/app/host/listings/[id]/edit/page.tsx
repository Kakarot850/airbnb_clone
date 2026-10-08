import ListingWizard from "@/components/host/wizard/ListingWizard";

export const metadata = { title: "Edit listing · Airbnb Clone" };

export default async function EditListingPage({ params }: PageProps<"/host/listings/[id]/edit">) {
  const { id } = await params;
  return <ListingWizard listingId={Number(id)} />;
}
