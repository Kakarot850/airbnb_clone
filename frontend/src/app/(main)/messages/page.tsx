import { MessageSquare } from "lucide-react";
import ComingSoon from "@/components/ui/ComingSoon";

export const metadata = { title: "Messages · Airbnb Clone" };

export default function MessagesPage() {
  return (
    <ComingSoon
      icon={<MessageSquare className="h-8 w-8" />}
      title="Messages"
      text="Chatting with hosts and guests is on its way. For now, booking details are on your Trips page."
    />
  );
}
