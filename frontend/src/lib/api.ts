// Every call to the FastAPI backend goes through this file.
import type {
  Amenity, AuthResponse, Availability, Booking, BookingInput, Category, HostListing, ListingCard, ListingDetail,
  ListingInput, ListingReviews, LocationSuggestion, Page, PriceHistogram, Quote, Review, ReviewInput, User,
} from "./types";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const TOKEN_KEY = "airbnb_token";

/** Error thrown for any non-2xx response; `message` is the backend's `detail` text. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export type Query = Record<string, string | number | boolean | null | undefined | (string | number)[]>;

function toQueryString(query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) value.forEach((item) => params.append(key, String(item)));
    else params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

function errorMessage(data: unknown): string {
  const detail = (data as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  // FastAPI validation errors: [{ loc: [...], msg: "..." }]
  if (Array.isArray(detail) && detail[0]?.msg) {
    const field = detail[0].loc?.[detail[0].loc.length - 1];
    return field ? `${String(field).replace(/_/g, " ")}: ${detail[0].msg}` : detail[0].msg;
  }
  return "Something went wrong. Please try again.";
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
  form?: FormData;
}

async function request<T>(path: string, { method = "GET", body, query, form }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api${path}${toQueryString(query)}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Please check that the backend is running.");
  }

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, errorMessage(data));
  return data as T;
}

export const api = {
  // Auth (mocked: passwordless email login)
  login: (email: string) => request<AuthResponse>("/auth/login", { method: "POST", body: { email } }),
  signup: (email: string, name: string) => request<AuthResponse>("/auth/signup", { method: "POST", body: { email, name } }),
  me: () => request<User>("/auth/me"),

  // Lookup data
  categories: () => request<Category[]>("/categories"),
  amenities: () => request<Amenity[]>("/amenities"),
  locations: (q?: string) => request<LocationSuggestion[]>("/locations", { query: { q } }),
  priceHistogram: () => request<PriceHistogram>("/price-histogram"),

  // Listings
  searchListings: (query: Query) => request<Page<ListingCard>>("/listings", { query }),
  getListing: (id: number) => request<ListingDetail>(`/listings/${id}`),
  createListing: (input: ListingInput) => request<ListingDetail>("/listings", { method: "POST", body: input }),
  updateListing: (id: number, input: ListingInput) => request<ListingDetail>(`/listings/${id}`, { method: "PUT", body: input }),
  deleteListing: (id: number) => request<void>(`/listings/${id}`, { method: "DELETE" }),
  availability: (id: number) => request<Availability>(`/listings/${id}/availability`),
  quote: (id: number, checkIn: string, checkOut: string, guests: number) =>
    request<Quote>(`/listings/${id}/quote`, { query: { check_in: checkIn, check_out: checkOut, guests } }),

  // Reviews
  listingReviews: (id: number) => request<ListingReviews>(`/listings/${id}/reviews`),
  createReview: (input: ReviewInput) => request<Review>("/reviews", { method: "POST", body: input }),

  // Bookings (guest side)
  createBooking: (input: BookingInput) => request<Booking>("/bookings", { method: "POST", body: input }),
  myTrips: () => request<Booking[]>("/bookings"),
  getBooking: (id: number) => request<Booking>(`/bookings/${id}`),
  cancelBooking: (id: number) => request<Booking>(`/bookings/${id}/cancel`, { method: "POST" }),

  // Wishlist
  wishlist: () => request<ListingCard[]>("/wishlist"),
  saveToWishlist: (id: number) => request<unknown>(`/wishlist/${id}`, { method: "POST" }),
  removeFromWishlist: (id: number) => request<void>(`/wishlist/${id}`, { method: "DELETE" }),

  // Host dashboard
  hostListings: () => request<HostListing[]>("/host/listings"),
  hostBookings: () => request<Booking[]>("/host/bookings"),

  // Photo upload (multipart form)
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ url: string }>("/uploads", { method: "POST", form });
  },
};
