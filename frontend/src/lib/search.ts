// The explore page keeps all search state in the URL, so results are shareable and survive refresh.
// This file converts between the URL, a typed object, and the backend's query parameters.
import type { Query } from "./api";

export type PlaceType = "any" | "room" | "entire_home";

export interface SearchState {
  location: string;
  checkIn: string | null;
  checkOut: string | null;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  category: string | null;
  placeType: PlaceType;
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: number[];
  propertyTypes: string[];
}

export const EMPTY_SEARCH: SearchState = {
  location: "",
  checkIn: null,
  checkOut: null,
  adults: 0,
  children: 0,
  infants: 0,
  pets: 0,
  category: null,
  placeType: "any",
  minPrice: null,
  maxPrice: null,
  bedrooms: 0,
  beds: 0,
  bathrooms: 0,
  amenities: [],
  propertyTypes: [],
};

const toInt = (value: string | null) => (value && !Number.isNaN(Number(value)) ? Number(value) : 0);

export function parseSearch(params: URLSearchParams): SearchState {
  const placeType = params.get("place_type");
  return {
    location: params.get("location") ?? "",
    checkIn: params.get("checkin"),
    checkOut: params.get("checkout"),
    adults: toInt(params.get("adults")),
    children: toInt(params.get("children")),
    infants: toInt(params.get("infants")),
    pets: toInt(params.get("pets")),
    category: params.get("category"),
    placeType: placeType === "room" || placeType === "entire_home" ? placeType : "any",
    minPrice: params.get("min_price") ? toInt(params.get("min_price")) : null,
    maxPrice: params.get("max_price") ? toInt(params.get("max_price")) : null,
    bedrooms: toInt(params.get("bedrooms")),
    beds: toInt(params.get("beds")),
    bathrooms: toInt(params.get("bathrooms")),
    amenities: params.getAll("amenity").map(Number).filter(Boolean),
    propertyTypes: params.getAll("property_type"),
  };
}

/** The URL for a search, e.g. "/?location=Goa&checkin=2026-11-01&adults=2". Empty values are left out. */
export function searchUrl(state: SearchState): string {
  const params = new URLSearchParams();
  const set = (key: string, value: string | number | null) => {
    if (value !== null && value !== "" && value !== 0) params.set(key, String(value));
  };
  set("location", state.location.trim());
  set("checkin", state.checkIn);
  set("checkout", state.checkOut);
  set("adults", state.adults);
  set("children", state.children);
  set("infants", state.infants);
  set("pets", state.pets);
  set("category", state.category);
  if (state.placeType !== "any") params.set("place_type", state.placeType);
  set("min_price", state.minPrice);
  set("max_price", state.maxPrice);
  set("bedrooms", state.bedrooms);
  set("beds", state.beds);
  set("bathrooms", state.bathrooms);
  state.amenities.forEach((id) => params.append("amenity", String(id)));
  state.propertyTypes.forEach((type) => params.append("property_type", type));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

/** Backend query parameters for GET /api/listings. */
export function toApiQuery(state: SearchState): Query {
  const guests = state.adults + state.children;
  return {
    location: state.location.trim() || undefined,
    check_in: state.checkIn && state.checkOut ? state.checkIn : undefined,
    check_out: state.checkIn && state.checkOut ? state.checkOut : undefined,
    guests: guests > 0 ? guests : undefined,
    category: state.category ?? undefined,
    room_type:
      state.placeType === "entire_home" ? ["entire_home"] : state.placeType === "room" ? ["private_room", "shared_room"] : [],
    min_price: state.minPrice ?? undefined,
    max_price: state.maxPrice ?? undefined,
    bedrooms: state.bedrooms || undefined,
    beds: state.beds || undefined,
    bathrooms: state.bathrooms || undefined,
    amenity: state.amenities,
    property_type: state.propertyTypes,
  };
}

/** Number shown on the Filters button badge. */
export function countActiveFilters(state: SearchState): number {
  return (
    (state.placeType !== "any" ? 1 : 0) +
    (state.minPrice !== null || state.maxPrice !== null ? 1 : 0) +
    (state.bedrooms ? 1 : 0) +
    (state.beds ? 1 : 0) +
    (state.bathrooms ? 1 : 0) +
    state.amenities.length +
    state.propertyTypes.length
  );
}

export function clearFilters(state: SearchState): SearchState {
  return {
    ...state,
    placeType: "any",
    minPrice: null,
    maxPrice: null,
    bedrooms: 0,
    beds: 0,
    bathrooms: 0,
    amenities: [],
    propertyTypes: [],
  };
}
