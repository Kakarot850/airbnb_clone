import { Compass } from "lucide-react";
import ComingSoon from "@/components/ui/ComingSoon";

export const metadata = { title: "Experiences · Airbnb Clone" };

export default function ExperiencesPage() {
  return (
    <ComingSoon
      icon={<Compass className="h-8 w-8" />}
      title="Experiences"
      text="Unique activities hosted by locals are coming soon. In the meantime, explore our stays."
    />
  );
}
