// State, steps and validation of the "Airbnb your home" listing wizard (create + edit).
import type { ListingDetail, ListingInput, RoomType } from "@/lib/types";

export const TITLE_MAX = 50;
export const DESCRIPTION_MAX = 2000;

export interface ListingForm {
  property_type: string;
  room_type: RoomType | "";
  category_id: number | null;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenity_ids: number[];
  image_urls: string[];
  title: string;
  description: string;
  price_per_night: number;
  cleaning_fee: number;
}

/** Steps receive the form and an `update` function (accepts a patch or a function returning one). */
export type UpdateForm = (patch: Partial<ListingForm> | ((form: ListingForm) => Partial<ListingForm>)) => void;
export interface StepProps {
  form: ListingForm;
  update: UpdateForm;
}

export const EMPTY_FORM: ListingForm = {
  property_type: "",
  room_type: "",
  category_id: null,
  address: "",
  city: "",
  state: "",
  country: "",
  latitude: null,
  longitude: null,
  max_guests: 4,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  amenity_ids: [],
  image_urls: [],
  title: "",
  description: "",
  price_per_night: 100,
  cleaning_fee: 25,
};

export function formFromListing(listing: ListingDetail): ListingForm {
  return {
    property_type: listing.property_type,
    room_type: listing.room_type,
    category_id: listing.category?.id ?? null,
    address: listing.address,
    city: listing.city,
    state: listing.state ?? "",
    country: listing.country,
    latitude: listing.latitude,
    longitude: listing.longitude,
    max_guests: listing.max_guests,
    bedrooms: listing.bedrooms,
    beds: listing.beds,
    bathrooms: listing.bathrooms,
    amenity_ids: listing.amenities.map((amenity) => amenity.id),
    image_urls: listing.image_urls,
    title: listing.title,
    description: listing.description,
    price_per_night: listing.price_per_night,
    cleaning_fee: listing.cleaning_fee,
  };
}

/** Converts the form into the body expected by POST/PUT /api/listings (call after validation). */
export function toListingInput(form: ListingForm): ListingInput {
  return {
    ...form,
    room_type: form.room_type as RoomType,
    title: form.title.trim(),
    description: form.description.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim() || null,
    country: form.country.trim(),
    latitude: form.latitude ?? 0,
    longitude: form.longitude ?? 0,
  };
}

export interface WizardStep {
  key: string;
  title: string;
  subtitle?: string;
  wide?: boolean; // steps with tile grids get a wider layout
  validate: (form: ListingForm) => string | null; // error message, or null when the step is complete
}

export const STEPS: WizardStep[] = [
  {
    key: "property",
    title: "Which of these best describes your place?",
    wide: true,
    validate: (f) => (f.property_type ? null : "Pick a property type."),
  },
  {
    key: "place",
    title: "What type of place will guests have?",
    validate: (f) => (f.room_type ? null : "Pick a type of place."),
  },
  {
    key: "location",
    title: "Where's your place located?",
    subtitle: "Your address is only shared with guests after they've made a reservation.",
    validate: (f) =>
      f.address.trim().length < 3 || f.city.trim().length < 2 || f.country.trim().length < 2
        ? "Fill in the street address, city and country."
        : f.latitude === null
          ? "Click the map to drop a pin on your place."
          : null,
  },
  {
    key: "basics",
    title: "Share some basics about your place",
    subtitle: "You'll add more details later, like bed types.",
    validate: () => null,
  },
  {
    key: "amenities",
    title: "Tell guests what your place has to offer",
    subtitle: "You can add more amenities after you publish your listing.",
    wide: true,
    validate: () => null,
  },
  {
    key: "category",
    title: "Which category fits your place best?",
    subtitle: "Guests browse these categories on the home page. This step is optional.",
    wide: true,
    validate: () => null,
  },
  {
    key: "photos",
    title: "Add some photos of your place",
    subtitle: "You'll need at least 1 photo to get started. You can add more or make changes later.",
    validate: (f) => (f.image_urls.length > 0 ? null : "Add at least one photo."),
  },
  {
    key: "title",
    title: "Now, let's give your place a title",
    subtitle: "Short titles work best. Have fun with it, you can always change it later.",
    validate: (f) => (f.title.trim().length >= 5 ? null : "Titles need at least 5 characters."),
  },
  {
    key: "description",
    title: "Create your description",
    subtitle: "Share what makes your place special.",
    validate: (f) => (f.description.trim().length >= 20 ? null : "Descriptions need at least 20 characters."),
  },
  {
    key: "price",
    title: "Now, set your price",
    subtitle: "You can change it anytime.",
    validate: (f) =>
      f.price_per_night < 10 ? "The nightly price must be at least $10." : f.cleaning_fee < 0 ? "The cleaning fee can't be negative." : null,
  },
  {
    key: "review",
    title: "Review your listing",
    subtitle: "Here's what guests will see. Make sure everything looks good.",
    wide: true,
    validate: () => null,
  },
];
