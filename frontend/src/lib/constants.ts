// Fixed UI options. Keep in sync with backend/app/schemas/listing.py (PropertyType, RoomType).
import type { RoomType } from "./types";

export const DEMO_GUEST_EMAIL = "guest@demo.com";
export const DEMO_HOST_EMAIL = "host@demo.com";

// First-time visitors are logged in as this demo account automatically.
// Set to null to start logged out. Logging out turns auto-login off for that browser.
export const AUTO_LOGIN_EMAIL: string | null = DEMO_GUEST_EMAIL;

export const MAX_GUESTS = 16;
export const MAX_INFANTS = 5;
export const MAX_PETS = 5;

export const PROPERTY_TYPES: { value: string; icon: string }[] = [
  { value: "House", icon: "house" },
  { value: "Apartment", icon: "building" },
  { value: "Villa", icon: "palmtree-house" },
  { value: "Cabin", icon: "tree-pine" },
  { value: "Cottage", icon: "home-garden" },
  { value: "Chalet", icon: "mountain-snow" },
  { value: "Guesthouse", icon: "door-open" },
  { value: "Hotel", icon: "hotel" },
  { value: "Castle", icon: "castle" },
  { value: "Treehouse", icon: "tree-deciduous" },
  { value: "Tiny home", icon: "warehouse" },
  { value: "Farm stay", icon: "tractor" },
  { value: "Boat", icon: "ship" },
  { value: "Camper", icon: "caravan" },
  { value: "Tent", icon: "tent" },
];

export const ROOM_TYPES: { value: RoomType; title: string; description: string; icon: string }[] = [
  { value: "entire_home", title: "An entire place", description: "Guests have the whole place to themselves.", icon: "house" },
  { value: "private_room", title: "A room", description: "Guests have their own room in a home, plus access to shared spaces.", icon: "door-open" },
  { value: "shared_room", title: "A shared room", description: "Guests sleep in a room or common area that may be shared with you or others.", icon: "users" },
];
