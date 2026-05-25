# 🍕 Open-Source Multi-Vendor Food Delivery Platform — Master Build Prompt

## Context & Goal

Build a **fully open-source, zero-paywall, self-hostable** multi-vendor food delivery platform — a modern, production-ready alternative to Enatega. Anyone can clone, run, and modify it freely under MIT license. There is **no proprietary backend** — the entire stack ships with the repo.

---

## Design Philosophy

- **Monorepo first** — single repo, shared types, one `pnpm install`
- **Self-hostable** — Docker Compose for one-command local + production deployment
- **Type-safe end-to-end** — TypeScript everywhere, from DB schema to mobile
- **Lightweight & fast** — choose boring/proven tech, avoid bloat
- **Free maps & geocoding** — zero third-party API costs by default
- **Open auth** — no Firebase lock-in

---

## Tech Stack (with rationale)

### Monorepo Tooling
| Tool | Why |
|---|---|
| **pnpm workspaces** | Fast installs, efficient disk usage |
| **Turborepo** | Cached parallel task runner, ideal for monorepos |
| **TypeScript 5.x** | Strict mode across all packages |

### Backend / API
| Tool | Why |
|---|---|
| **Bun** (runtime) | ~3x faster than Node for I/O; drop-in Node replacement |
| **Hono** (HTTP framework) | Ultra-lightweight (~14KB), edge-compatible, Bun-native |
| **tRPC v11** | End-to-end type safety without GraphQL ceremony; perfect with Next.js + Expo |
| **Drizzle ORM** | Lightweight, fully typed, SQL-first — no magic, no bloat |
| **PostgreSQL 16** | Battle-tested relational DB; excellent for geospatial (PostGIS) |
| **Supabase Realtime** (self-hosted) | Real-time order tracking via Postgres logical replication |
| **Redis (Valkey)** | Session caching, rate limiting, pub/sub for order events |
| **BullMQ** | Job queues for notifications, emails, order assignment |

### Auth
| Tool | Why |
|---|---|
| **Better-Auth** | Fully open source, framework-agnostic, supports social OAuth, OTP, sessions — no vendor lock-in |

### Web Apps (Admin Dashboard + Customer Web)
| Tool | Why |
|---|---|
| **Next.js 15** (App Router) | RSC + streaming, ISR, best-in-class DX |
| **TailwindCSS v4** | New Rust-based engine — zero config, 10x faster builds |
| **Shadcn/ui** | Accessible, unstyled components you own — not a dependency |
| **TanStack Query v5** | Best-in-class async state, works with tRPC |
| **Zustand v5** | Minimal global state for cart, auth, UI |
| **Leaflet + React-Leaflet** | OSM maps, zero API cost |
| **Recharts** | Lightweight chart library for admin analytics |

### Mobile Apps (Customer + Rider + Store)
| Tool | Why |
|---|---|
| **Expo SDK 53** | Latest stable, managed workflow |
| **Expo Router v4** | File-based routing, web + native, type-safe links |
| **NativeWind v4** | TailwindCSS for React Native, CSS Variables support |
| **TanStack Query v5** | Same query library as web — consistent mental model |
| **Zustand v5** | Shared state logic with web via `packages/store` |
| **Expo Maps (new)** | New Apple Maps/Google Maps module — or `react-native-maps` for OSM |
| **Socket.io client** | Real-time order updates on mobile |

### Infrastructure
| Tool | Why |
|---|---|
| **Docker + Docker Compose** | One-command self-hosting |
| **MinIO** | S3-compatible object storage (self-hosted) for food images |
| **Resend** (or SMTP) | Email notifications — Resend has a free tier; fallback to any SMTP |
| **Expo Notifications** | Push via Expo's free push service |

---

## Monorepo Structure

```
food-delivery/
├── apps/
│   ├── api/                    # Bun + Hono + tRPC backend
│   ├── web/                    # Next.js 15 — Customer web storefront
│   ├── admin/                  # Next.js 15 — Admin dashboard
│   ├── mobile-customer/        # Expo — Customer mobile app
│   ├── mobile-rider/           # Expo — Rider/driver app
│   └── mobile-store/           # Expo — Restaurant/store app
│
├── packages/
│   ├── db/                     # Drizzle schema + migrations (shared)
│   ├── trpc/                   # tRPC router definitions (shared)
│   ├── auth/                   # Better-Auth config (shared)
│   ├── store/                  # Zustand stores (shared between web + mobile)
│   ├── ui/                     # Shared React component library (web)
│   ├── ui-native/              # Shared React Native component library
│   ├── validators/             # Zod schemas shared across all apps
│   ├── config/                 # Shared env config / constants
│   └── types/                  # Shared TypeScript types
│
├── docker-compose.yml          # PostgreSQL + Redis + MinIO + API
├── docker-compose.prod.yml
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

---

## Database Schema (Drizzle ORM / PostgreSQL)

### Core Tables

```typescript
// packages/db/src/schema/

// Users (customers, riders, restaurant owners, admins)
users: {
  id, email, phone, name, avatar_url,
  role: enum('customer','rider','vendor','admin','super_admin'),
  is_active, email_verified, phone_verified,
  created_at, updated_at
}

// Auth (Better-Auth managed)
sessions, accounts, verifications

// Restaurants / Vendors
restaurants: {
  id, owner_id (→ users), name, slug,
  description, logo_url, cover_url,
  cuisine_type, address, city,
  lat, lng,                         // PostGIS POINT
  is_open, is_active, is_approved,
  min_order_amount, avg_delivery_time,
  delivery_radius_km,
  rating_avg, rating_count,
  opening_hours: JSONB,             // { mon: { open: '09:00', close: '22:00' }, ... }
  created_at, updated_at
}

// Categories (per restaurant)
categories: {
  id, restaurant_id, name, description,
  image_url, sort_order, is_active
}

// Food Items / Menu
food_items: {
  id, restaurant_id, category_id, name,
  description, image_url, price,
  is_available, is_featured,
  nutrition_info: JSONB,
  created_at, updated_at
}

// Item Variations / Add-ons
item_variations: {
  id, food_item_id, title,
  type: enum('radio','checkbox'),   // single or multi-select
  is_required, min_select, max_select
}

item_variation_options: {
  id, variation_id, label, price_modifier, is_default
}

// Customer Addresses
addresses: {
  id, user_id, label, address_line,
  city, lat, lng,
  is_default, delivery_instructions
}

// Orders
orders: {
  id, order_number (unique, human-readable),
  customer_id (→ users),
  restaurant_id (→ restaurants),
  rider_id (→ users, nullable),
  delivery_address_id (→ addresses),
  status: enum(
    'pending','accepted','preparing',
    'ready_for_pickup','rider_assigned',
    'picked_up','delivered','cancelled','refunded'
  ),
  type: enum('delivery','pickup'),
  items: JSONB,                     // snapshot at order time
  subtotal, delivery_fee, platform_fee, tax, discount, total,
  payment_method: enum('cod','stripe','paypal','wallet'),
  payment_status: enum('pending','paid','refunded'),
  stripe_payment_intent_id,
  special_instructions,
  estimated_delivery_at,
  delivered_at, cancelled_at,
  cancellation_reason,
  created_at, updated_at
}

// Order Items (for analytics — orders.items is the snapshot)
order_items: {
  id, order_id, food_item_id, food_item_name,
  quantity, unit_price, total_price,
  selected_variations: JSONB
}

// Rider Locations (updated every ~5s while active)
rider_locations: {
  rider_id, lat, lng, heading, updated_at
}

// Reviews
reviews: {
  id, order_id, customer_id, restaurant_id,
  rating (1–5), comment,
  restaurant_reply, created_at
}

// Delivery Zones
zones: {
  id, name, polygon: JSONB (GeoJSON),
  base_delivery_fee, per_km_fee, is_active
}

// Wallet / Payouts
wallets: { id, user_id, balance, currency }
wallet_transactions: {
  id, wallet_id, type: enum('credit','debit'),
  amount, description, reference_id, created_at
}

// Notifications
notifications: {
  id, user_id, title, body, type,
  data: JSONB, is_read, created_at
}

// Coupons / Promo Codes
coupons: {
  id, code (unique), type: enum('flat','percent'),
  value, min_order_amount, max_discount,
  restaurant_id (nullable — platform-wide if null),
  usage_limit, used_count,
  valid_from, valid_until, is_active
}
```

---

## API Surface (tRPC Routers)

```
apps/api/src/routers/
├── auth.ts           # login, register, OTP, OAuth callbacks
├── user.ts           # profile, addresses, wallet
├── restaurant.ts     # listing, search, detail, nearby (PostGIS)
├── menu.ts           # categories, items, variations
├── cart.ts           # validate cart items + pricing
├── order.ts          # place, track, cancel, history
├── rider.ts          # accept order, update status, location ping
├── store.ts          # restaurant owner: orders, menu CRUD, stats
├── admin.ts          # platform management, approvals, analytics
├── review.ts         # submit, reply, listing
├── coupon.ts         # validate, apply
├── notification.ts   # list, mark read
└── upload.ts         # presigned MinIO URLs for image uploads
```

**Real-time (Socket.io namespaces):**
```
/orders          # customer tracks their live order
/rider           # rider receives new order assignments + customer location
/restaurant      # restaurant hears new incoming orders
/admin           # admin dashboard live stats feed
```

---

## Feature Matrix

### Customer App + Web
- [ ] Browse restaurants by location (map + list view)
- [ ] Filter by cuisine, rating, delivery time, price
- [ ] Restaurant menu with variations/add-ons
- [ ] Cart with persistent storage (AsyncStorage / localStorage)
- [ ] Address management (OSM geocoding via Nominatim)
- [ ] Order placement: delivery + pickup modes
- [ ] Live order tracking on map (rider real-time location)
- [ ] In-app chat with rider
- [ ] Order history + reorder
- [ ] Favourites
- [ ] Reviews & ratings
- [ ] Push notifications (order status updates)
- [ ] Coupon / promo code
- [ ] Wallet balance
- [ ] Multi-language (i18next)
- [ ] Dark mode
- [ ] Social login (Google, Apple) + OTP

### Rider App
- [ ] Authentication + profile
- [ ] Go online / offline toggle
- [ ] Receive order assignment notifications
- [ ] Accept / reject orders
- [ ] Map navigation to restaurant + customer
- [ ] Update order status (picked up, delivered)
- [ ] Real-time location broadcasting
- [ ] Earnings dashboard
- [ ] Wallet / payout management
- [ ] In-app chat with customer
- [ ] Order history

### Restaurant / Store App
- [ ] Authentication + restaurant profile
- [ ] Incoming order alerts (sound + push)
- [ ] Accept / reject + estimated prep time
- [ ] Update order status (preparing → ready)
- [ ] Menu management (items, categories, variations)
- [ ] Toggle item availability
- [ ] Opening hours management
- [ ] Order history & basic analytics
- [ ] In-app chat for specific orders

### Admin Dashboard (Web)
- [ ] Platform overview (revenue, orders, users — Recharts)
- [ ] Restaurant management (approve, suspend, feature)
- [ ] User management
- [ ] Rider management
- [ ] Order management + manual intervention
- [ ] Delivery zone management (draw polygon on map)
- [ ] Coupon / promo management
- [ ] Zone & fee configuration
- [ ] Push notification broadcast
- [ ] Audit log viewer
- [ ] Settings (platform fee %, tax rate, etc.)

---

## Implementation Phases

### Phase 1 — Foundation (Week 1–2)
1. Monorepo scaffold with Turborepo + pnpm
2. `packages/db` — Drizzle schema + all migrations
3. `packages/validators` — Zod schemas for all entities
4. `packages/types` — Shared TypeScript interfaces
5. `apps/api` — Bun + Hono server setup, tRPC integration
6. `packages/auth` — Better-Auth: email/OTP + Google OAuth
7. Docker Compose: Postgres, Redis, MinIO, API

### Phase 2 — Core API (Week 3–4)
1. Auth router (register, login, OTP, social)
2. Restaurant router (CRUD, nearby search with PostGIS)
3. Menu router (categories, items, variations)
4. Order router (place, status transitions, history)
5. Rider location router (upsert, query nearby riders)
6. Socket.io real-time events for order status
7. BullMQ: push notification job queue

### Phase 3 — Customer Web (Week 5–6)
1. Next.js 15 setup with TailwindCSS v4 + Shadcn/ui
2. tRPC client + TanStack Query integration
3. Home page: location picker, restaurant feed
4. Restaurant detail + menu page
5. Cart drawer + checkout flow
6. Order tracking page with Leaflet map
7. User profile + addresses
8. Auth pages

### Phase 4 — Admin Dashboard (Week 7–8)
1. Next.js 15 admin app setup
2. Dashboard home with Recharts analytics
3. Restaurant management (list, detail, approve)
4. Order management table with filters
5. User & rider management
6. Zone editor (draw on Leaflet map → save GeoJSON)
7. Coupon management
8. Settings panel

### Phase 5 — Mobile Apps (Week 9–12)
**Customer App:**
1. Expo SDK 53 + Expo Router v4 setup
2. Auth screens (OTP + social)
3. Home tab (restaurant discovery)
4. Restaurant + menu screens
5. Cart + checkout
6. Order tracking with react-native-maps (OSM tiles)
7. Profile + addresses

**Rider App:**
1. Auth + profile setup
2. Home (available orders map)
3. Active delivery screen with navigation
4. Earnings + wallet
5. Real-time location broadcasting

**Store App:**
1. Auth + restaurant profile
2. Live orders screen (incoming + active)
3. Menu management screens
4. Order detail management

### Phase 6 — Polish & DevOps (Week 13–14)
1. E2E tests (Playwright for web, Detox/Maestro for mobile)
2. Production Docker Compose with Nginx reverse proxy
3. GitHub Actions CI/CD pipeline
4. Comprehensive README + self-hosting docs
5. One-click deploy buttons (Railway, Fly.io, Render)
6. Seed script with realistic demo data

---

## Environment Variables

```bash
# apps/api/.env
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET=food-delivery
BETTER_AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
STRIPE_SECRET_KEY=...          # optional
RESEND_API_KEY=...             # optional, fallback to SMTP
SMTP_HOST=...
EXPO_ACCESS_TOKEN=...          # for push notifications

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_MINIO_URL=http://localhost:9000/food-delivery

# apps/mobile-customer/.env
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## Key Design Decisions & Rationale

| Decision | Reasoning |
|---|---|
| **tRPC instead of GraphQL** | End-to-end type safety with zero schema duplication. Simpler for teams without GraphQL expertise. Works natively with Next.js server components. |
| **Bun instead of Node** | ~3x faster HTTP throughput; native TypeScript without transpile step; all Node APIs supported. |
| **Hono instead of Express/Fastify** | 14KB, edge-compatible, fastest Node/Bun HTTP framework in benchmarks. |
| **Drizzle instead of Prisma** | Lighter, faster, SQL-first, no Prisma Client bloat. Generates raw SQL — easy to reason about. |
| **Better-Auth instead of NextAuth/Clerk** | Fully open source, self-hostable, supports all OAuth providers + OTP, no vendor lock-in. |
| **OSM + Nominatim instead of Google Maps** | Zero API cost. Self-hostable if needed. Sufficient for most food delivery use cases. |
| **MinIO instead of S3** | Self-hostable S3-compatible storage. Zero cost on own infra; swap to actual S3 with one env var change. |
| **Valkey/Redis instead of managed** | Valkey is the open-source Redis fork; self-hostable, no licensing concerns. |
| **TailwindCSS v4** | New Rust-based engine — no `tailwind.config.js` needed, CSS Variables native, 10x faster build. |
| **NativeWind v4** | CSS Variables support, much closer to web TailwindCSS behavior than v2/v3. |
| **Shared `packages/validators`** | Single Zod schema used for: DB constraints, tRPC input validation, form validation (React Hook Form + Zod), and mobile form validation. No duplication. |

---

## Self-Hosting (Docker Compose)

```yaml
# docker-compose.yml (overview)
services:
  postgres:
    image: postgis/postgis:16-3.4   # PostGIS for geospatial queries
  redis:
    image: valkey/valkey:7.2
  minio:
    image: minio/minio:latest
  api:
    build: ./apps/api
    depends_on: [postgres, redis, minio]
  web:
    build: ./apps/web
  admin:
    build: ./apps/admin
  nginx:
    image: nginx:alpine             # Reverse proxy for all services
```

---

## License

**MIT License** — anyone can clone, use commercially, modify, and distribute freely. No CLA required for contributions.

---

## Prompt for AI Coding Agent

> **Task:** Build a fully open-source, zero-paywall, self-hostable multi-vendor food delivery platform called **[YOUR APP NAME]** using the exact tech stack and structure described in this document. The platform must be a complete monorepo with 6 apps (api, web, admin, mobile-customer, mobile-rider, mobile-store) and 8 shared packages.
>
> Follow these rules:
> 1. Use **pnpm workspaces + Turborepo** for the monorepo
> 2. Use **Bun + Hono + tRPC v11** for the API — no Express, no GraphQL
> 3. Use **Drizzle ORM + PostgreSQL 16 + PostGIS** — no Prisma
> 4. Use **Better-Auth** for authentication — no Firebase, no Clerk, no NextAuth
> 5. Use **Next.js 15 App Router + TailwindCSS v4 + Shadcn/ui** for web and admin
> 6. Use **Expo SDK 53 + Expo Router v4 + NativeWind v4** for all mobile apps
> 7. Use **Leaflet / react-native-maps with OSM tiles** — no Google Maps API
> 8. Use **MinIO** for image storage (S3-compatible)
> 9. Every package must be in **strict TypeScript** — no `any`, no implicit types
> 10. Share types, validators (Zod), and Zustand stores across web and mobile via packages
> 11. Include a **Docker Compose** file for one-command local setup
> 12. Include a comprehensive **seed script** with demo restaurants, menus, and users
> 13. All code must be MIT licensed with no proprietary dependencies
>
> Start with Phase 1 (Foundation): scaffold the monorepo, create the database schema with Drizzle, set up the tRPC API server with Bun+Hono, and configure Better-Auth. Then proceed phase by phase.
