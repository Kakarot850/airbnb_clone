# Interview Prep: Airbnb Clone

Questions an interviewer is likely to ask about this project, with answers based on the actual code. File paths are relative to the repository root.

**How to use this:** read the "Tell me about the project" answer until you can say it in your own words. Then go section by section. For each question, open the file it points to and find the lines yourself.

---

## 1. The project in 2 minutes

### Q: Walk me through the project.
**A:** It's a clone of Airbnb's core flows. Guests can browse and search stays, filter them, open a listing, pick dates on a calendar that blocks booked nights, see a price breakdown, and book through a mocked checkout. They can also manage trips, cancel, write reviews after a stay, and save listings to a wishlist. Hosts can create, edit and delete listings through a step-by-step wizard and see a dashboard of reservations and earnings.

- The **frontend** is Next.js 16 with TypeScript and Tailwind CSS.
- The **backend** is FastAPI with SQLAlchemy 2 on SQLite.
- The frontend talks to the backend over a JSON REST API. All business rules (pricing, availability, permissions) live on the backend, so the UI can never be the source of truth for money or availability.

### Q: What was the hardest part?
**A:** Making bookings correct. Several pieces have to agree:
1. The calendar must disable nights that are taken.
2. Checkout must not jump over a booked night.
3. The price must come from the server.
4. Two people booking the same dates at the same moment must not both succeed.

I solved the last one with a database trigger, so the database itself refuses overlapping confirmed bookings (see section 5).

### Q: Why this tech stack?
**A:** The brief required Next.js + TypeScript and Python with SQLite. I picked FastAPI over Django because it is lightweight and gives typed request validation through Pydantic. It also generates interactive API docs at `/docs`, and its dependency injection (`Depends`) makes auth and DB sessions clean. SQLAlchemy 2 gives typed models (`Mapped[...]`) and works with any SQL database, so moving to Postgres later is mostly a connection-string change.

### Q: How is the code organized?
**A:**
- **Backend** (`backend/app`): `models/` (tables), `schemas/` (request/response shapes), `routers/` (HTTP endpoints), `services/` (business rules), `seed/` (demo data).
- **Frontend** (`frontend/src`): `app/` (pages), `components/` grouped by feature (explore, listing, booking, trips, host, ui), `context/` (global state), `hooks/` (data fetching), `lib/` (API client, types, helpers).

Each file has one job. For example, "change the service fee" means `backend/app/services/pricing.py` and nothing else.

---

## 2. Database design

### Q: Explain your schema.
**A:** There are nine tables:

| Table | Holds |
| --- | --- |
| `users` | Everyone. `is_host` turns on when a user creates a first listing |
| `listings` | The places. Belongs to a host (`host_id`) and optionally a category |
| `listing_images` | One row per photo with a `position`. Position 0 is the cover |
| `amenities` + `listing_amenities` | Many-to-many: a listing has many amenities, an amenity belongs to many listings |
| `categories` | The icon row on the home page (Beachfront, Cabins, ...) |
| `bookings` | A guest's stay: dates, guest counts, a **price snapshot** and a status |
| `reviews` | One per booking (`booking_id` is unique): overall rating, six category ratings, comment |
| `favorites` | The wishlist. Primary key `(user_id, listing_id)` |

### Q: What are the relationships?
**A:**
- users 1–N listings (as host).
- users 1–N bookings (as guest).
- listings 1–N images, bookings and reviews.
- listings N–M amenities, through `listing_amenities`.
- bookings 1–0..1 reviews.
- users N–M listings through `favorites`.

These are declared as foreign keys in `backend/app/models/*.py`, with `relationship()` for navigation in Python.

### Q: Why is `favorites` keyed by `(user_id, listing_id)` instead of an `id` column?
**A:** The pair is the natural identity of a saved listing. A composite primary key makes saving the same listing twice impossible at the database level. The API (`POST /wishlist/{id}`) is also idempotent: it checks first and returns success if the listing is already saved.

### Q: Why do bookings copy the price instead of joining to the listing?
**A:** Hosts can change their price at any time. A booking is a financial record: the guest agreed to a specific total, so `nightly_price`, `cleaning_fee`, `service_fee` and `total_price` are snapshotted when booking (`backend/app/services/booking_service.py`). Without the snapshot, editing a listing would rewrite the price of past trips. This is the classic "order line item" pattern.

### Q: Why store money as integers?
**A:** Floating point can't represent many decimals exactly (0.1 + 0.2 != 0.3), so totals can drift. Integers are exact. Prices here are whole US dollars and fees are rounded to the dollar. A real system would store cents (`int`) or use `DECIMAL`, plus a currency column.

### Q: You store `rating_avg` and `review_count` on listings. Isn't that duplicated data?
**A:** Yes, it's deliberate denormalization. Search cards need the rating for every listing on every page. Computing `AVG(rating)` with a `GROUP BY` over the reviews table each time costs more and complicates the search query. The stats are recomputed in one place, `refresh_listing_rating()` in `services/review_service.py`, inside the same transaction that saves the review, so they stay consistent. The trade-off is that any new way of writing reviews must call that function. A database trigger or a periodic job could also maintain it.

### Q: How does delete work? Why not a real `DELETE`?
**A:** It's a soft delete. `deleted_at` is set (`services/listing_service.py: delete_listing`). Bookings and reviews reference the listing, and those are history a guest still needs: past trips, receipts, reviews. A hard delete would either break foreign keys or cascade-delete that history. Search, detail and host lists filter on `deleted_at IS NULL`. Deleting also cancels future reservations and refuses (409) while a guest is staying.

### Q: What constraints does the database enforce itself?
**A:**
- Foreign keys. SQLite needs `PRAGMA foreign_keys = ON` on every connection, which happens in `backend/app/database.py`.
- `CHECK (check_out > check_in)` and `CHECK (adults >= 1)` on bookings.
- `CHECK (status IN ('confirmed','cancelled'))`.
- Ratings between 1 and 5.
- Positive prices and `max_guests >= 1`.
- Unique email, unique `reviews.booking_id`, unique category slug.
- Triggers that block overlapping confirmed bookings.

Validation in Pydantic gives friendly errors. Constraints in the database are the last line of defense if a bug or a script bypasses the API.

### Q: Which indexes did you add and why?
**A:**
- `bookings(listing_id, check_in, check_out)`: a composite index for "bookings of listing X overlapping these dates", used by availability, quotes, booking and the date filter in search.
- Foreign-key columns (`host_id`, `listing_id`, `guest_id`, `author_id`): for joins.
- `listings.city`, `country`, `price_per_night`, `deleted_at`: for search filters.
- `users.email` (unique): for login.

### Q: Is the schema normalized?
**A:** Mostly third normal form. Amenities and categories are lookup tables, and images are their own table instead of a comma-separated column. There are two intentional exceptions: the rating aggregates (read performance) and the booking price snapshot (historical accuracy).

### Q: How would you model hosts blocking dates or setting a minimum stay?
**A:**
- **Blocked dates:** add a `blocked_dates (listing_id, start_date, end_date, reason)` table. The availability check would then union bookings and blocks.
- **Minimum stay:** add `min_nights` to listings and check `nights >= min_nights` in `validate_stay()`. The calendar would also need it.
- **Seasonal prices:** add `listing_prices (listing_id, date, price)` and price each night separately, summing nightly prices instead of `price × nights`.

---

## 3. Bookings, availability and pricing

### Q: How do you check whether two stays overlap?
**A:** Stays are half-open ranges `[check_in, check_out)`. The guest sleeps the nights from check-in up to the day before checkout. Two ranges overlap when **each starts before the other ends**:

```
existing.check_in < new.check_out  AND  existing.check_out > new.check_in
```

This lives in `backend/app/services/availability.py` (`ranges_overlap`, `overlap_clause`). Back-to-back stays don't overlap, because a check-out on the 15th and a check-in on the 15th fail `existing.check_out > new.check_in`. There's a test for that: `test_back_to_back_stays_are_allowed`.

### Q: Why a half-open range?
**A:** It matches reality (you check out the morning the next guest checks in). The number of nights is just `check_out - check_in`. And adjacent ranges never "touch", so there are no off-by-one bugs.

### Q: What stops two users from booking the same dates at the same time?
**A:** There are two layers:
1. **Application check:** `create_booking()` runs `is_available()` and returns a friendly 409.
2. **Database trigger** (`backend/app/models/booking.py`): `BEFORE INSERT` and `BEFORE UPDATE` triggers run `SELECT RAISE(ABORT, ...) WHERE EXISTS (an overlapping confirmed booking)`.

SQLite allows only one writer at a time, and the trigger runs inside the insert while holding the write lock. If two requests both pass step 1, the second insert still fails. The service catches the `IntegrityError` and returns 409. The test `test_database_trigger_blocks_overlaps` inserts directly through the ORM, bypassing the API, and checks that the database refuses.

### Q: How would you do that in PostgreSQL?
**A:** With an exclusion constraint:

```sql
ALTER TABLE bookings ADD CONSTRAINT no_overlap
EXCLUDE USING gist (listing_id WITH =, daterange(check_in, check_out) WITH &&)
WHERE (status = 'confirmed');
```

This needs the `btree_gist` extension. Alternatives are `SELECT ... FOR UPDATE` on the listing row inside a transaction, or `SERIALIZABLE` isolation with a retry.

### Q: Why not just use a lock in Python?
**A:** A `threading.Lock` only works inside one process. With several uvicorn workers or several servers it does nothing. The guarantee must live where all writers meet: the database.

### Q: Which validations happen on a booking?
**A:** These are in `validate_stay()` and `create_booking()` in `booking_service.py`:
- Check-in isn't in the past.
- Checkout is after check-in.
- The stay is at most 90 nights.
- Adults + children ≤ `max_guests`. Infants and pets don't count, as on Airbnb.
- At least 1 adult, enforced by Pydantic and a CHECK constraint.
- The listing exists and isn't deleted.
- The guest is not the host.
- The dates are free.

### Q: Where is the price calculated? Why not in the frontend?
**A:** Only on the backend, in `backend/app/services/pricing.py`: `subtotal = nightly × nights`, `service_fee = round(14% × subtotal)`, `total = subtotal + cleaning + service`. The frontend asks `GET /listings/{id}/quote` and displays the result. If the frontend calculated prices, the logic would exist twice and could disagree, and a user could tamper with it. The booking endpoint recalculates from the database anyway.

### Q: How does the calendar know which days to disable?
**A:** `GET /listings/{id}/availability` returns booked ranges. `frontend/src/components/ui/DateRangePicker.tsx` uses `isSelectable(day)`:
- **Past days:** disabled.
- **Choosing check-in:** a day is selectable when its night is free (`isNightBooked` is false).
- **Choosing checkout** (after a check-in): a later day is selectable only when every night between check-in and that day is free (`isRangeFree`). The first booked night after check-in can still be a checkout day, because you leave that morning.

Clicking a day before the current check-in starts a new selection. The helpers are in `frontend/src/lib/dates.ts` and compare `YYYY-MM-DD` strings, which sort correctly as text.

### Q: What happens on cancellation?
**A:** `POST /bookings/{id}/cancel` is allowed for the guest or the listing's host, and only before check-in. It sets `status = 'cancelled'` and `cancelled_at`. Every availability query only looks at `status = 'confirmed'`, so the dates immediately become free again (`test_cancelling_frees_the_dates`).

### Q: How is "trip status" (upcoming / current / completed) stored?
**A:** It isn't stored. It's derived in `Booking.trip_status` from `status` and today's date. Storing it would need a job to flip "upcoming" to "completed" every day, and it could go stale.

### Q: Time zones?
**A:** Dates are plain calendar dates (no time), and "today" is the server's date. That is a simplification. Airbnb uses the listing's local time zone. A production version would store a time zone per listing and compute "today" there.

---

## 4. Backend (FastAPI)

### Q: How does a request flow through the backend?
**A:** Take `POST /api/bookings`:
1. The router in `routers/bookings.py` receives the request.
2. FastAPI validates the JSON body against `BookingCreate`, a Pydantic model, and returns 422 automatically if it's invalid.
3. Dependencies inject a DB session (`DbSession`) and the logged-in user (`CurrentUser`).
4. The router calls `booking_service.create_booking()`, which applies the rules and saves.
5. The result is serialized through `response_model=BookingOut`.

### Q: What are FastAPI dependencies and how do you use them?
**A:** They are functions FastAPI calls before your endpoint, and the results are injected as parameters. In `backend/app/deps.py`:
- `get_db` opens a session per request and always closes it (a generator with `finally`).
- `get_optional_user` reads `Authorization: Bearer` and decodes the JWT.
- `get_current_user` builds on it and raises 401 when nobody is logged in.

The `Annotated` aliases `DbSession`, `CurrentUser` and `OptionalUser` keep endpoint signatures short. Tests swap the database with `app.dependency_overrides[get_db]`.

### Q: Why separate routers and services?
**A:** Routers deal with HTTP: paths, query params, status codes. Services hold the rules and can be reused. For example, `quote_stay()` and `create_booking()` share `validate_stay()`. Routers stay a few lines long and the rules are easy to find and test.

### Q: How do you return errors?
**A:** `backend/app/errors.py` defines `BadRequest` (400), `Unauthorized` (401), `Forbidden` (403), `NotFound` (404) and `Conflict` (409), all subclasses of FastAPI's `HTTPException`. Code reads naturally, e.g. `raise Conflict("Those dates are not available...")`. FastAPI turns them into `{"detail": "..."}`, and the frontend shows `detail` in a toast (`frontend/src/lib/api.ts`). One trade-off: the services know about HTTP. In a bigger system I'd raise domain exceptions and map them to HTTP in one exception handler.

### Q: Explain the status codes you chose.
**A:**

| Code | When |
| --- | --- |
| 201 | Something was created (booking, listing, review) |
| 204 | Delete, no body |
| 400 | Valid shape, but breaks a business rule (past date, too many guests) |
| 401 | Not logged in |
| 403 | Logged in but not allowed (editing someone else's listing) |
| 404 | Not found. I also use 404 when someone asks for a booking that isn't theirs, so the API doesn't reveal that it exists |
| 409 | Conflicts with current state (dates taken, review already written, email already registered) |
| 422 | The request body or params don't match the schema (Pydantic) |

### Q: How does search work?
**A:** `GET /api/listings` builds one SQLAlchemy query in `services/listing_search.py`. Each filter adds a `WHERE`:
- **location:** split on commas, and every part must match city, state or country (case-insensitive `icontains` with `autoescape` so `%` and `_` are treated literally).
- **dates:** `NOT EXISTS` an overlapping confirmed booking, a correlated subquery on `Listing.id`.
- **guests:** `max_guests >= guests`.
- **amenities:** one `EXISTS` per selected amenity (`Listing.amenities.any(...)`), so a listing must have **all** of them.
- **price, rooms, type:** simple comparisons and `IN`.

The endpoint then counts the total with `SELECT COUNT(*) FROM (query)` and fetches one page with `OFFSET/LIMIT`.

### Q: What's the N+1 problem and how did you avoid it?
**A:** It means loading a list, then running one extra query per item (for example, each listing's images). I use `selectinload(Listing.images)`, which loads all images for the page in a single second query. Host dashboard stats come from one `GROUP BY` query for all listings (`services/host_service.py`) instead of one query per listing.

### Q: Offset pagination vs cursor pagination?
**A:** I used offset pagination (`page`, `page_size`) because it's simple, supports "page N" and works well at this size. With large tables, offsets get slower (the database still walks the skipped rows), and results can shift if rows are added between pages. Cursor (keyset) pagination, `WHERE id > :last_id ORDER BY id LIMIT 20`, fixes both and suits infinite scroll at scale.

### Q: How does file upload work? Is it safe?
**A:** `POST /api/uploads` (`routers/uploads.py`) accepts multipart data and allows only image content types. It reads at most 5 MB + 1 byte to enforce the size limit, saves the file under a random UUID name (so there's no path traversal or overwriting), and returns a URL served by FastAPI's `StaticFiles` at `/uploads`. Limitations: the content type comes from the client. In production I'd check the file's magic bytes, re-encode it with an image library, and store it in S3 or Cloudinary behind a CDN. Local disk on free hosts is wiped on every deploy.

### Q: How is the database seeded?
**A:** `backend/app/seed/data.py` holds the raw data: 67 listings, 14 hosts, 24 guests, categories, amenities and photo IDs. `seed.py` builds it:
- Bookings and reviews get dates relative to **today**, so the demo always has upcoming trips and past stays.
- It uses a fixed random seed, so every run is identical.
- It skips any generated booking that would overlap.
- It creates fixed "demo scenarios" for the two demo accounts.

`python -m app.seed` resets everything. On startup, `seed_if_empty()` seeds only an empty database, which helps on hosts whose disk is wiped on deploy.

### Q: What is the `lifespan` function in `main.py`?
**A:** FastAPI runs it once at startup (code before `yield`) and once at shutdown (code after). I use it to create tables and seed demo data when the database is empty. It replaces the older `@app.on_event("startup")`.

### Q: Why are endpoints `def` and not `async def`?
**A:** SQLAlchemy is used synchronously here. FastAPI runs plain `def` endpoints in a thread pool, so a blocking database call doesn't block the event loop. Writing `async def` with a blocking driver would block every request. The upload endpoint is `async` because it awaits `file.read()`. For an async stack I'd use SQLAlchemy's async engine with an async driver.

---

## 5. Authentication and security

### Q: How does login work?
**A:** It's mocked, as the brief allows. You log in with just an email:
- `POST /auth/login` returns 404 for unknown emails, and the UI then shows "Finish signing up".
- `POST /auth/signup` creates the user.
- Both return a JWT signed with HS256 (`backend/app/security.py`), holding the user id (`sub`) and an expiry (`exp`).

The frontend stores it in `localStorage` and sends `Authorization: Bearer <token>`. `get_current_user` decodes it on each request.

### Q: Why are users logged in automatically?
**A:** It's a demo convenience: evaluators land directly in a logged-in state as the demo guest. `AuthContext` checks for a saved token on page load. If there's none, it calls `POST /auth/login` with `AUTO_LOGIN_EMAIL` (`frontend/src/lib/constants.ts`). Logging out stores a flag in `localStorage`, so the app doesn't log you straight back in, and logging in again clears the flag. Setting `AUTO_LOGIN_EMAIL` to `null` turns it off. In a real product this wouldn't exist.

### Q: Why did the welcome toast show twice in development?
**A:** In development, React Strict Mode mounts components, unmounts them and mounts them again, so effects run twice. That surfaces effects that aren't cleaned up properly. The auto-login effect has a `cancelled` flag, and the toast is only shown by the run that wasn't cancelled. The API may still be called twice in development, which is harmless here: both calls return a valid token.

### Q: What would you change for real authentication?
**A:**
- Passwords hashed with bcrypt or argon2, or OAuth (Google, Apple) through a provider.
- Email verification.
- Short-lived access tokens plus refresh tokens.
- Rate limiting on login.
- Storing the token in an **httpOnly, Secure, SameSite cookie** instead of `localStorage`, so JavaScript (and any XSS) can't read it. Cookies then need CSRF protection; SameSite helps, and a CSRF token makes it complete.

### Q: How do you do authorization (not just authentication)?
**A:** Every write checks ownership on the server:
- `get_owned_listing()` raises 403 unless `listing.host_id == user.id`.
- Bookings are visible only to the guest or the listing's host.
- Reviews require that you were the guest of that booking.
- Hosts can't book their own listing.

The frontend hides buttons too, but that's only UX. The server is the authority.

### Q: Are you safe from SQL injection?
**A:** Yes, because all queries go through SQLAlchemy, which uses bound parameters. User input is never concatenated into SQL. The trigger DDL is a constant string. LIKE wildcards in the search text are escaped with `autoescape=True`.

### Q: What does CORS do here?
**A:** The browser blocks a page on `localhost:3000` from reading responses from `localhost:8000` unless the API allows that origin. `CORSMiddleware` in `main.py` allows the origins in `CORS_ORIGINS` (default `*`). Because auth uses a header, not cookies, `*` works. With cookies you must list exact origins and enable credentials.

### Q: Where's the JWT secret?
**A:** In the `SECRET_KEY` environment variable (`backend/app/config.py`), with a development default. The Render blueprint generates a random value. Never commit real secrets.

### Q: What about XSS?
**A:** React escapes text by default. The only `dangerouslySetInnerHTML` is the constant theme script in `layout.tsx`. Leaflet's popup HTML for price pins is built from numbers. User-entered text (titles, reviews) is rendered as text.

---

## 6. Frontend (Next.js, React)

### Q: App Router: what are `page.tsx`, `layout.tsx` and route groups?
**A:**
- Each folder under `src/app` is a URL segment, and `page.tsx` is the page for it.
- `layout.tsx` wraps all pages below it and stays mounted while you navigate.
- `(main)` is a **route group**: the parentheses keep it out of the URL. I use it to give all guest pages the header, footer and phone tab bar (`app/(main)/layout.tsx`), while `/host/...` pages get the hosting header instead.
- `[id]` folders are dynamic segments: `/rooms/[id]`, `/trips/[id]`.

### Q: Server components vs client components? Which did you use?
**A:** Server components render on the server and send no JavaScript. Client components (`"use client"`) can use state, effects and browser APIs. Most pages here are thin server components that render a client "view" (for example `ListingDetailView`). The data depends on the logged-in user, the token lives in `localStorage`, and the UI is very interactive (calendars, modals). Public pages such as the listing page could be rendered on the server for SEO and speed. I'd do that next, fetching public data on the server and hydrating the interactive parts.

### Q: In Next.js 16, `params` is a Promise. Why `await params`?
**A:** Since Next 15, request-specific APIs (`params`, `searchParams`, `cookies()`) are asynchronous, so Next can prerender everything that doesn't depend on them. Pages like `app/(main)/rooms/[id]/page.tsx` do `const { id } = await params`. `PageProps<"/rooms/[id]">` is a type Next generates from the routes.

### Q: Why wrap components in `<Suspense>`?
**A:** `useSearchParams()` makes a component depend on the URL, which isn't known at build time for statically prerendered pages. Next requires a Suspense boundary so it can prerender the rest of the page and render that part in the browser. Without it, `next build` fails. That's why the Header and explore page sit inside `<Suspense>`.

### Q: Next 16 enables Cache Components by default in new projects. Why did you turn it off?
**A:** Cache Components keeps recently visited routes mounted but hidden (React `<Activity>`) and changes how dynamic data must be handled. The app is client-rendered against an external API, so it gains little, and keeping pages mounted changes behavior (open dropdowns persisting, effects re-running). Turning it off gives the simpler model: pages mount when you arrive and unmount when you leave. I'd revisit it if the public pages moved to server rendering.

### Q: Where does the search state live?
**A:** In the URL, for example `/?location=Goa&checkin=2026-11-01&checkout=2026-11-05&adults=2&category=beachfront&amenity=1`. `frontend/src/lib/search.ts` converts between the URL, a typed `SearchState`, and the backend's query parameters (`toApiQuery`). Benefits: results are shareable and bookmarkable, back and forward work, a refresh keeps the search, and there's one source of truth for the header, category bar, filters and grid.

### Q: How does infinite scroll work?
**A:**
- `hooks/useInfiniteListings.ts` loads page 1 whenever the query changes, and `loadMore()` appends the next page.
- `components/explore/ListingGrid.tsx` puts an empty "sentinel" div after the grid and watches it with an `IntersectionObserver` (with a 600px `rootMargin` so loading starts early). When it becomes visible, the next page loads.
- To avoid race conditions, results are tagged with the query `key` they belong to, and a ref (`latestKey`) makes late responses from an old search get ignored.

### Q: Why tag results with a key instead of `setLoading(true)` in the effect?
**A:** Calling `setState` synchronously inside an effect causes an extra render, and React's lint rules (`react-hooks/set-state-in-effect`) flag it. Instead, "loading" is derived: if the stored results' key doesn't match the current query, we're loading. `useQuote` uses the same pattern for price quotes.

### Q: How do you avoid calling the API on every keystroke?
**A:** `hooks/useDebounce.ts`. The value only updates after the user stops typing for about 250–300 ms. It's used for destination suggestions and for the live "Show N places" count in the Filters modal.

### Q: What is an optimistic update and where do you use one?
**A:** You update the UI before the server confirms, and roll back if it fails. The wishlist heart (`context/WishlistContext.tsx`) flips immediately, calls the API, shows a toast, and on error flips back with an error toast. It makes the app feel instant.

### Q: How do you manage global state? Why no Redux?
**A:** Three small React contexts: `AuthContext` (user, login, logout, the login modal), `WishlistContext` (saved ids) and `ToastContext` (notifications). Everything else is local state or the URL. Redux would be overkill for this amount of shared state.

### Q: How are dates and guests shared between the calendar and the booking card on the listing page?
**A:** The state is lifted up into `ListingDetailView`. Both `CalendarSection` and `BookingCard` receive `checkIn`, `checkOut` and `onChange`, so picking dates in either updates both. The values are also mirrored into the URL with `window.history.replaceState`, which doesn't trigger a navigation, so a refresh keeps them.

### Q: How does the header collapse on scroll like Airbnb's?
**A:** On the home page the header is `position: fixed`, with a spacer of the same height below it. At the top it shows the big search bar. A scroll listener (`components/layout/Header.tsx`) switches it to the compact "Anywhere | Any week | Add guests" pill once you scroll. Because the header is fixed and the spacer keeps its height, the page content doesn't jump. Clicking the pill re-opens the big bar over the page with a dim backdrop.

### Q: How did you implement dark mode without a flash of white?
**A:** Colors are CSS variables (Tailwind v4 `@theme` in `globals.css`: `--color-ink`, `--color-canvas`, and so on), and components use classes like `text-ink` and `bg-canvas`. Dark mode just redefines the variables under `[data-theme="dark"]`. A tiny inline script in `<head>` (`app/layout.tsx`) reads `localStorage` and sets `data-theme` **before the first paint**. `suppressHydrationWarning` on `<html>` tells React the attribute was changed on purpose.

### Q: Why use `<img>` instead of Next's `<Image>`?
**A:** Listing photos can come from any URL a host pastes, and `next/image` only optimizes domains listed in `next.config` (`remotePatterns`). Plain `<img loading="lazy">` works for any URL. The card carousel also only renders the photos next to the visible one. In production I'd upload every photo to our own storage or CDN and use `next/image` for resizing and modern formats.

### Q: Why is Leaflet loaded with `dynamic(..., { ssr: false })`?
**A:** Leaflet touches `window` and `document` when imported, which crashes on the server. `components/map/index.tsx` wraps each map in `next/dynamic` with `ssr: false`, so it only loads in the browser. That also keeps map code out of pages that don't show a map.

### Q: How is the UI responsive?
**A:**
- Tailwind breakpoints are set to Airbnb's (550, 744, 950, 1128, 1640, 1880 px) in `globals.css`.
- The grid goes from 1 to 6 columns.
- On phones the header becomes a single "Where to?" pill that opens a full-screen search (`MobileSearch.tsx`), a bottom tab bar appears (`MobileNav.tsx`), modals slide up from the bottom, and the listing page has a sticky "Reserve" bar.

### Q: What accessibility work did you do?
**A:**
- Real `<button>` and `<a>` elements.
- `aria-label` on icon-only buttons (heart, arrows, menu).
- `aria-pressed` on toggles.
- `role="dialog"` with `aria-modal` on modals, which also close with Escape.
- Labeled calendar days ("Thursday, October 15, 2026").
- `role="status"` on toasts.
- Visible focus rings on inputs.

---

## 7. Testing

### Q: How did you test the backend?
**A:** With pytest (`backend/tests`, 39 tests), covering:
- Pricing math.
- Overlap edge cases, parameterized.
- Every booking rule, including back-to-back stays, infants not counting, and the database trigger.
- Search filters, pagination, listing CRUD and permissions.
- Soft delete cancelling future bookings.
- Wishlist idempotency, host stats, reviews, and the auth flow.

### Q: How do the tests get a clean database?
**A:** `tests/conftest.py` creates a new in-memory SQLite database per test. `StaticPool` keeps one connection, because each new connection to `sqlite://` would be a different empty database. The tests run the same `init_db()`, so triggers exist, and override FastAPI's `get_db` dependency to use it. Factory fixtures (`make_user`, `make_listing`, `make_booking`) build the data each test needs.

### Q: How did you test the frontend?
**A:** TypeScript type checking and ESLint run as part of `npm run build`. I also ran an end-to-end script in a real browser (Chrome driven by Puppeteer) through the main flows: search, filters, infinite scroll, login, wishlist, booking with the mock card, review, cancellation, and the host create, edit and delete flow. All checks passed with no console errors. For the repo I'd add Playwright tests in CI, plus component tests (Vitest + Testing Library) for `DateRangePicker` and `lib/search.ts`.

---

## 8. Performance and scaling

### Q: What happens with 10 million listings and real traffic?
**A:**
1. **Database:** move to PostgreSQL with connection pooling. Use the `EXCLUDE` constraint for overlaps, and PostGIS or a geohash for location search.
2. **Search:** move full-text, geo and filter search to Elasticsearch or OpenSearch. Precompute availability, for example a calendar table per listing per day.
3. **Pagination:** cursor-based.
4. **Caching:** cache public listing data and lookup tables (categories, amenities, histogram) in Redis or a CDN. Invalidate on edits.
5. **Images:** object storage + CDN + resizing (several widths, WebP or AVIF).
6. **Stateless API servers** behind a load balancer. JWT auth has no server sessions, so this scales horizontally.
7. **Async work:** emails and notifications go to a queue (Celery, RQ, SQS).

### Q: SQLite in production?
**A:** It's great for single-server apps and demos: zero setup, fast reads, real transactions. Its limits are one writer at a time, a database tied to one machine's disk, and no horizontal scaling. For a multi-server deployment I'd switch to Postgres. With SQLAlchemy that is mostly the `DATABASE_URL` plus replacing the SQLite trigger with an exclusion constraint.

### Q: Any frontend performance work?
**A:**
- Lazy loading for images, and the carousel only renders nearby photos.
- Debounced API calls.
- The map is loaded on demand.
- Infinite scroll loads 20 listings at a time.
- Skeleton placeholders keep the layout stable while loading.
- The production build prerenders static routes.

---

## 9. "How would you add ...?"

### Q: Real payments?
**A:** Use Stripe:
1. The backend creates a **PaymentIntent** for the server-calculated total and returns its `client_secret`.
2. The frontend collects the card with **Stripe Elements**, so card data never touches our server and PCI scope stays small, then confirms the payment.
3. A **webhook** (`payment_intent.succeeded`) marks the booking paid.

The booking is created as `pending` first, so the dates are held for a few minutes, and an idempotency key prevents double charges. Refunds on cancellation call Stripe's refund API.

### Q: Messaging between guest and host?
**A:** Add `conversations (id, listing_id, guest_id, host_id)` and `messages (id, conversation_id, sender_id, body, created_at, read_at)` tables. For real time, use WebSockets (FastAPI supports them) or Server-Sent Events, with Redis pub/sub when there are several servers. Polling every few seconds is the simplest first version.

### Q: Notifications?
**A:** Add a `notifications (user_id, type, payload, read_at)` table, written by the services when something happens (booking created, cancelled, review received). Show a bell with an unread count, plus email through a queue.

### Q: Search by map area?
**A:** When the map moves, send its bounding box (`ne_lat, ne_lng, sw_lat, sw_lng`) and filter `latitude BETWEEN ...`. Index lat/lng, or use PostGIS `ST_Within` with a GiST index.

### Q: Host-side reviews of guests, or replies to reviews?
**A:** Add an `author_role` column (or a separate `guest_reviews` table) and a nullable `host_reply` on reviews. Airbnb's "double-blind" reviews would need both reviews hidden until both are written or 14 days pass.

### Q: Multi-currency?
**A:** Store prices in the listing's currency, in minor units (cents). Convert to the viewer's currency with a cached exchange-rate table. The booking snapshot stores both currencies and the rate used.

---

## 10. Code questions they might point at

### Q: What does this do? `Listing.amenities.any(Amenity.id == amenity_id)`
**A:** It produces `EXISTS (SELECT 1 FROM listing_amenities JOIN amenities ... WHERE listing_amenities.listing_id = listings.id AND amenities.id = :id)`. Adding one per selected amenity means the listing must have **all** of them.

### Q: Why `expire_on_commit=False` on the session?
**A:** By default SQLAlchemy expires objects after commit, and touching an attribute later reloads it from the database. Endpoints return the object right after committing, so keeping the loaded values avoids extra queries.

### Q: Why `check_same_thread=False` for SQLite?
**A:** Python's sqlite3 refuses to use a connection from a thread other than the one that created it. FastAPI runs sync endpoints in a thread pool, so the session may be used on a different thread. Each request still gets its own session, so this is safe.

### Q: What does `@property def guests` on the Booking model do?
**A:** It's a computed attribute (adults + children). Pydantic's `from_attributes=True` reads properties like columns, so `BookingOut` can include `guests`, `trip_status` and `has_review` without storing them.

### Q: Why do the wizard steps get an `update` function that accepts a function?
**A:** Uploads finish asynchronously. If two photos finish one after the other, `update({ image_urls: [...form.image_urls, url] })` would use a stale `form` and lose a photo. `update((current) => ({ image_urls: [...current.image_urls, url] }))` always builds on the latest state, the same idea as `setState(prev => ...)`.

### Q: How does `useClickOutside` work?
**A:** It adds a `mousedown` listener on `document`. If the click target isn't inside the referenced element, it calls the handler (to close a dropdown). The effect removes the listener on cleanup or when it's disabled, so there are no leaks.

### Q: What does the Modal do besides showing content?
**A:** It renders into `document.body` with a portal, so parents with `overflow: hidden` can't clip it. It locks page scrolling while open, closes on Escape and backdrop click, and restores the previous `overflow` on close.

### Q: How do you prevent showing another user's wishlist after logout?
**A:** Saved ids are stored together with the `userId` they belong to. If the current user is different (or nobody), the context returns an empty set. Stale data can't leak between accounts, even before the new request finishes.

---

## 11. Trade-offs and what I'd improve

| Decision | Why | Next step |
| --- | --- | --- |
| Client-side data fetching | Simple mental model, user-specific data | Server-render public pages for SEO and speed |
| JWT in localStorage | Simplest mock auth | httpOnly cookies + refresh tokens |
| SQLite + trigger | Required by the brief, zero setup, correct under concurrency | Postgres + `EXCLUDE` constraint |
| Offset pagination | Simple, supports page numbers | Cursor pagination at scale |
| Denormalized rating | Fast search and sorting | Keep it, plus a periodic consistency check |
| Local disk uploads | No cloud account needed | S3 or Cloudinary + CDN |
| HTTP errors raised in services | Less code | Domain exceptions + one handler |
| One global service fee | Brief scope | Fees per market, taxes, discounts |

### Q: If you had one more week?
**A:**
1. Server rendering for the home and listing pages.
2. Playwright end-to-end tests in CI (GitHub Actions running pytest, lint and build).
3. Real authentication.
4. A host calendar with blocked dates and minimum nights.
5. Messaging.
6. Cloud image storage.
7. Map-bounds search on the split list and map view.
