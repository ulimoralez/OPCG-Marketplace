# OPCG Marketplace — Design Spec

**Date:** 2026-05-08
**Scope:** Full-stack marketplace for One Piece TCG card trading (user-to-user, no payment gateway)

---

## 1. Overview

A production-ready web marketplace where users publish One Piece TCG cards for sale and coordinate purchases via direct messaging. No integrated payment processing — transactions are negotiated between users.

**Chosen stack:**
- Frontend: Next.js 14 (App Router, Server Components first)
- Backend: Supabase (PostgreSQL + Auth + Storage + Realtime)
- UI: shadcn/ui + Tailwind CSS
- Deployment: Vercel (frontend) + Supabase Cloud (backend)

---

## 2. Architecture

### Frontend — Next.js App Router

- **Server Components** handle data fetching for public pages (homepage, search, listing detail, user profile). These pages are SSR by default, giving good SEO for card names and listings.
- **Client Components** are used only where interactivity is required: search bar, chat, publish form, filter controls.
- **Server Actions** handle all mutations: create listing, send message, post review, update profile.
- **Middleware** (`middleware.ts`) intercepts requests to `(protected)` routes, verifies the Supabase session cookie, and redirects to `/login` if unauthenticated.

### Backend — Supabase

- **PostgreSQL** stores all relational data with Row Level Security (RLS) enforced on every table.
- **Auth** (email + password) manages user identity. A PostgreSQL trigger on `auth.users` auto-creates the corresponding `profiles` row on signup.
- **Storage** hosts user avatar images (bucket: `avatars`). Card images are served directly from the OPTCG API URL — not stored locally.
- **Realtime** (PostgreSQL LISTEN/NOTIFY) powers live messaging and the unread-message counter in the header.

### External API — OPTCG API

Used only during the **publish flow** to auto-fill card metadata from a card ID (e.g. `OP09-086`). Called server-side through a Next.js route handler (`/api/cards/[cardId]`) that caches responses for 24 hours. Card data is **denormalized into `listings`** at publish time — search and browse never depend on the external API.

The base URL must be confirmed at project setup. The primary candidate is `https://optcg-api.dev/` (public, no auth required). Verify the endpoint format for card lookup (expected: `GET /cards/{id}`) before implementation begins.

---

## 3. Data Model

### `profiles` (extends `auth.users`)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | FK → auth.users, PK |
| `username` | text | unique |
| `avatar_url` | text | Supabase Storage URL |
| `city` | text | |
| `country` | text | |
| `ships` | boolean | whether seller ships cards |
| `shipping_notes` | text | optional shipping details |
| `payment_methods` | text[] | e.g. ["Efectivo", "Transferencia", "MercadoPago"] |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `listings`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `seller_id` | UUID | FK → profiles |
| `card_id` | text | e.g. "OP09-086" |
| `card_name` | text | denormalized from OPTCG API |
| `card_image_url` | text | denormalized from OPTCG API |
| `expansion` | text | e.g. "OP09" |
| `color` | text[] | e.g. ["Rojo", "Verde"] |
| `card_type` | text | Leader / Character / Event / Stage |
| `rarity` | text | C / UC / R / SR / SEC / L |
| `price` | numeric(10,2) | seller-defined |
| `condition` | text | near_mint / lightly_played / moderately_played / heavily_played / damaged |
| `notes` | text | optional seller notes |
| `is_active` | boolean | default true; set false when sold or removed |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Full-text search index on `card_name` using `tsvector` + GIN index.

### `conversations`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `listing_id` | UUID | FK → listings |
| `buyer_id` | UUID | FK → profiles |
| `seller_id` | UUID | FK → profiles |
| `last_message_at` | timestamptz | updated on each new message |
| `created_at` | timestamptz | |

Unique constraint on `(listing_id, buyer_id)` — one conversation per buyer per listing.

### `messages`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `conversation_id` | UUID | FK → conversations |
| `sender_id` | UUID | FK → profiles |
| `content` | text | |
| `is_read` | boolean | default false |
| `created_at` | timestamptz | |

### `reviews`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `reviewer_id` | UUID | FK → profiles |
| `reviewed_id` | UUID | FK → profiles |
| `rating` | smallint | 1–5 |
| `content` | text | |
| `created_at` | timestamptz | |

Unique constraint on `(reviewer_id, reviewed_id)` — one review per pair.

---

## 4. Route Structure

```
app/
├── layout.tsx                              ← Global layout: fixed header
├── page.tsx                                ← Homepage (SSR)
├── search/page.tsx                         ← Search results (?q=&expansion=&color=&price_min=&price_max=)
├── listings/[id]/page.tsx                  ← Individual listing (SSR)
├── profile/[username]/page.tsx             ← Public user profile (SSR)
│
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
│
├── (protected)/                            ← Middleware-protected
│   ├── publish/page.tsx                    ← Publish card form
│   ├── messages/page.tsx                   ← Conversation list
│   ├── messages/[conversationId]/page.tsx  ← Chat view
│   └── settings/page.tsx                  ← Edit profile
│
└── api/
    └── cards/[cardId]/route.ts             ← OPTCG API proxy (cached 24h)
```

---

## 5. Visual Design

- **Color palette:** Primary `#1A2744` (navy), accent `#E8B400` (gold), background `#F8F9FC` (off-white)
- **Typography:** Inter (sans-serif), loaded via `next/font`
- **Card listing component:** Vertical — card image on top (~180px tall), name, expansion+color tag, price, seller and condition below. 4 columns desktop, 2 tablet, 1 mobile.
- **Hover state:** `box-shadow` elevation + 2px `translateY` on listing cards
- **Skeleton loader:** Shown while card image and API data load (using shadcn/ui Skeleton)
- **Header (fixed):** Logo left, search bar center, icons right (messages with unread badge, user avatar dropdown, "Publicar" CTA button in gold)

---

## 6. Feature Implementation Details

### Auth Flow

1. User registers with email + password via Supabase Auth.
2. PostgreSQL trigger fires on `auth.users` insert → creates `profiles` row with the same UUID.
3. Session JWT stored in httpOnly cookies via `@supabase/ssr`.
4. Middleware reads the cookie, refreshes the session if needed, attaches user to Server Component context.
5. Profile completion (avatar, city, payment methods) done via `/settings`, optional after registration.

### Publish Flow

1. User enters card ID (e.g. `OP09-086`) in the publish form.
2. Client calls `/api/cards/OP09-086` (debounced 400ms after typing stops).
3. Route handler fetches from OPTCG API, returns `{ name, imageUrl, expansion, color, type, rarity }` or 404.
4. Form shows preview card with fetched data + skeleton while loading.
5. User fills price, condition, optional notes. Validation: price > 0, condition required.
6. Server Action inserts to `listings` with all denormalized card data + seller_id from session.

### Search & Filters

- URL search params are the single source of truth: `?q=luffy&expansion=OP01&color=Rojo&price_min=500&price_max=3000`
- Server Component reads params, builds a single parameterized Supabase query.
- Full-text search on `card_name` via `textSearch()`. Filters are additive (AND logic).
- Filter UI is a collapsible sidebar on desktop, a bottom sheet on mobile.

### Messaging & Realtime

1. "Contactar vendedor" creates a `conversation` row (or fetches existing one for that listing+buyer pair) via Server Action, then redirects to `/messages/[id]`.
2. Chat page is a Client Component. On mount, it subscribes to `supabase.channel(\`conversation:${conversationId}\`)` listening for `INSERT` on `messages` filtered by `conversation_id=eq.${conversationId}`.
3. New messages appear instantly for both participants without reload.
4. On mount and on new message, marks received messages as `is_read = true`.
5. Header unread count: Client Component that subscribes to a user-level channel counting unread messages across all conversations.

### Reviews

- A user can review any other user they have had at least one conversation with.
- One review per pair (enforced by unique constraint).
- Rating (1–5 stars) + text. Displayed on the reviewed user's public profile, sorted by recency.
- Aggregate rating (average) shown as a star display on the profile header.

### Image Handling

- **Avatar upload:** Client Component in `/settings`. Uses Supabase Storage JS client directly. File size limit 2MB, accepted types: image/jpeg, image/png, image/webp. RLS policy: users can only write to `avatars/{their_user_id}/*`.
- **Card images:** Rendered via `next/image` with the OPTCG API URL as `src`. Domain added to `next.config.ts` `remotePatterns`.

---

## 7. RLS Policies (key rules)

- `profiles`: anyone can read; only owner can update.
- `listings`: anyone can read active listings; only seller can insert/update/delete their own.
- `conversations`: only buyer or seller of that conversation can read/insert.
- `messages`: only participants of the conversation can read; only sender can insert.
- `reviews`: anyone can read; authenticated users can insert one review per reviewed_id; only author can update/delete.

---

## 8. Non-Goals (explicitly out of scope)

- Payment processing or escrow
- Admin panel / moderation tools
- OAuth social login (can be added later via Supabase)
- Push notifications (browser or mobile)
- Saved searches / price alerts
- Card price history or market analytics
