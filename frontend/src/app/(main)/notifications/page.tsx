import { Bell } from "lucide-react";
import ComingSoon from "@/components/ui/ComingSoon";

export const metadata = { title: "Notifications · Airbnb Clone" };

export default function NotificationsPage() {
  return (
    <ComingSoon
      icon={<Bell className="h-8 w-8" />}
      title="Notifications"
      text="Your notification inbox is coming soon. Booking updates already show up as pop-up notifications while you use the app."
    />
  );
}
