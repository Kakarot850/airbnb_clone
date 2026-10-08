// TypeScript mirrors of the backend's API schemas (backend/app/schemas).

export type RoomType = "entire_home" | "private_room" | "shared_room";
export type TripStatus = "upcoming" | "current" | "completed" | "cancelled";

export interface UserPublic {
  id: number;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface User extends UserPublic {
  email: string;
  bio: string | null;
  is_host: boolean;
}

export interface HostProfile extends UserPublic {
  bio: string | null;
  is_superhost: boolean;
  listing_count: number;
  review_count: number;
  rating_avg: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  icon: string;
}

export interface Amenity {
  id: number;
  name: string;
  icon: string;
  group_name: string;
}

export interface LocationSuggestion {
  city: string;
  state: string | null;
  country: string;
  listing_count: number;
}

export interface PriceHistogram {
  min_price: number;
  max_price: number;
  buckets: number[];
}

export interface ListingCard {
  id: number;
  host_id: number;
  title: string;
  property_type: string;
  room_type: RoomType;
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  rating_avg: number;
  review_count: number;
  is_guest_favorite: boolean;
  image_urls: string[];
  category: Category | null;
  total_price: number | null;
}

export interface ListingDetail extends ListingCard {
  description: string;
  address: string;
  cleaning_fee: number;
  amenities: Amenity[];
  host: HostProfile;
  created_at: string;
  updated_at: string;
}

export interface HostListing extends ListingCard {
  cleaning_fee: number;
  created_at: string;
  updated_at: string;
  upcoming_bookings: number;
  total_bookings: number;
  total_earnings: number;
}

export interface ListingInput {
  title: string;
  description: string;
  property_type: string;
  room_type: RoomType;
  category_id: number | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  price_per_night: number;
  cleaning_fee: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenity_ids: number[];
  image_urls: string[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DateRange {
  check_in: string; // "YYYY-MM-DD"
  check_out: string;
}

export interface Availability {
  listing_id: number;
  booked: DateRange[];
}

export interface Quote {
  check_in: string;
  check_out: string;
  nights: number;
  nightly_price: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
  available: boolean;
  message: string | null;
}

export interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

export interface BookingInput extends GuestCounts {
  listing_id: number;
  check_in: string;
  check_out: string;
}

export interface BookingListing {
  id: number;
  title: string;
  property_type: string;
  room_type: RoomType;
  address: string;
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  cover_image_url: string | null;
  host: UserPublic;
}

export interface Booking extends GuestCounts {
  id: number;
  listing: BookingListing;
  guest: UserPublic;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  nightly_price: number;
  cleaning_fee: number;
  service_fee: number;
  total_price: number;
  status: "confirmed" | "cancelled";
  trip_status: TripStatus;
  has_review: boolean;
  created_at: string;
  cancelled_at: string | null;
}

export interface Review {
  id: number;
  listing_id: number;
  author: UserPublic;
  rating: number;
  cleanliness: number;
  accuracy: number;
  checkin: number;
  communication: number;
  location: number;
  value: number;
  comment: string;
  created_at: string;
}

export interface RatingSummary {
  average: number;
  count: number;
  cleanliness: number;
  accuracy: number;
  checkin: number;
  communication: number;
  location: number;
  value: number;
  distribution: Record<string, number>;
}

export interface ListingReviews {
  summary: RatingSummary;
  items: Review[];
}

export interface ReviewInput {
  booking_id: number;
  rating: number;
  cleanliness?: number;
  accuracy?: number;
  checkin?: number;
  communication?: number;
  location?: number;
  value?: number;
  comment: string;
}
