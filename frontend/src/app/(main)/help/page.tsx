import { LifeBuoy } from "lucide-react";
import ComingSoon from "@/components/ui/ComingSoon";

export const metadata = { title: "Help Center · Airbnb Clone" };

export default function HelpPage() {
  return (
    <ComingSoon
      icon={<LifeBuoy className="h-8 w-8" />}
      title="Help Center"
      text="Guides, support articles and our policies will live here."
    />
  );
}
