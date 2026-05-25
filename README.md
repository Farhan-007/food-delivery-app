# 🍕 FoodHub — Open-Source Multi-Vendor Food Delivery Platform

> A fully open-source, zero-paywall, self-hostable food delivery platform. Modern alternative to Enatega. MIT licensed — clone, use commercially, modify freely.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange.svg)](https://pnpm.io/)
[![Bun](https://img.shields.io/badge/Bun-1.x-pink.svg)](https://bun.sh/)

---

## 🏗️ Architecture

```
food-delivery/
├── apps/
│   ├── api/              # Bun + Hono + tRPC v11 backend
│   ├── web/              # Next.js 15 — Customer storefront
│   ├── admin/            # Next.js 15 — Admin dashboard
│   ├── mobile-customer/  # Expo SDK 53 — Customer app
│   ├── mobile-rider/     # Expo SDK 53 — Rider/driver app
│   └── mobile-store/     # Expo SDK 53 — Restaurant app
│
├── packages/
│   ├── db/               # Drizzle ORM schema + migrations
│   ├── trpc/             # tRPC router definitions (shared)
│   ├── auth/             # Better-Auth config (shared)
│   ├── validators/       # Zod schemas (shared)
│   ├── types/            # TypeScript interfaces (shared)
│   └── config/           # Env config + constants (shared)
│
├── docker-compose.yml    # PostgreSQL + Valkey + MinIO
└── turbo.json            # Turborepo task pipeline
```

## 🚀 Quick Start

### Prerequisites
- [pnpm](https://pnpm.io/) >= 9
- [Bun](https://bun.sh/) >= 1.0
- [Docker](https://docker.com/) + Docker Compose

### 1. Clone & Install
```bash
git clone https://github.com/your-org/foodhub.git
cd foodhub
pnpm install
```

### 2. Start Infrastructure
```bash
# Start PostgreSQL, Valkey (Redis), MinIO
docker compose up -d

# Verify all services are healthy
docker compose ps
```

### 3. Configure Environment
```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your values
```

### 4. Run Migrations & Seed
```bash
# Generate and apply migrations
pnpm db:generate
pnpm db:migrate

# Seed demo data (restaurants, menus, users)
pnpm db:seed
```

### 5. Start Development
```bash
pnpm dev
# API: http://localhost:3001
# Web: http://localhost:3000
# Admin: http://localhost:3002
```

---

## 🐳 Docker Services

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL 16 + PostGIS | 5432 | Primary database |
| Valkey (Redis fork) | 6379 | Cache, sessions, pub/sub |
| MinIO | 9000 | S3-compatible image storage |
| MinIO Console | 9001 | Storage UI |

**Optional tools** (run with `docker compose --profile tools up`):
- pgAdmin → http://localhost:5050
- Redis Insight → http://localhost:5540

---

## 🔑 Demo Credentials

After seeding:

| Role | Email | Notes |
|------|-------|-------|
| Super Admin | admin@foodhub.dev | Full platform access |
| Vendor 1 | mario@pizzapalace.dev | Owns Pizza Palace |
| Vendor 2 | chen@dragonwok.dev | Owns Dragon Wok |
| Customer | customer@example.dev | Has wallet balance |
| Rider | rider1@foodhub.dev | Location tracking |

> Passwords: set via Better-Auth sign-up after first login. In dev, emails log to console.

---

## 🗺️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Monorepo** | pnpm workspaces + Turborepo |
| **Language** | TypeScript 5.x (strict) |
| **API Runtime** | Bun |
| **HTTP Framework** | Hono |
| **API Layer** | tRPC v11 |
| **ORM** | Drizzle ORM |
| **Database** | PostgreSQL 16 + PostGIS |
| **Cache/Queue** | Valkey (Redis fork) + BullMQ |
| **Auth** | Better-Auth |
| **Real-time** | Socket.io |
| **Web Apps** | Next.js 15 App Router |
| **Styling** | TailwindCSS v4 + Shadcn/ui |
| **Mobile** | Expo SDK 53 + Expo Router v4 |
| **State** | Zustand v5 + TanStack Query v5 |
| **Maps** | Leaflet + OSM (zero API cost) |
| **Storage** | MinIO (self-hosted S3) |
| **Email** | Resend / SMTP |

---

## 📋 Feature Matrix

### ✅ Phase 1 Complete (Foundation)
- [x] Monorepo with Turborepo + pnpm workspaces
- [x] Complete Drizzle ORM schema (all tables)
- [x] Shared TypeScript types (`@repo/types`)
- [x] Shared Zod validators (`@repo/validators`)
- [x] Better-Auth (email, OTP, Google OAuth)
- [x] Bun + Hono API server
- [x] tRPC v11 with role-based auth middleware
- [x] All tRPC routers (restaurant, menu, order, user, rider, admin, coupon, upload)
- [x] Socket.io real-time namespaces
- [x] Docker Compose (Postgres, Valkey, MinIO)
- [x] Comprehensive seed script

### 🚧 Phase 2 (Core API — In Progress)
- [ ] BullMQ notification job queue
- [ ] PostGIS geospatial queries (nearby restaurants)
- [ ] Stripe payment integration
- [ ] Email notification templates

### 📅 Phase 3 — Customer Web (Next.js 15)
### 📅 Phase 4 — Admin Dashboard
### 📅 Phase 5 — Mobile Apps (Expo)
### 📅 Phase 6 — DevOps + CI/CD

---

## 🔌 API Reference

### tRPC Endpoints

```
api.restaurant.search        - Search restaurants (public)
api.restaurant.bySlug        - Get restaurant + full menu
api.restaurant.create        - Create restaurant (vendor)
api.restaurant.update        - Update restaurant (vendor)
api.restaurant.toggleOpen    - Open/close restaurant (vendor)
api.restaurant.approve       - Approve restaurant (admin)

api.menu.getMenu             - Full menu for restaurant (public)
api.menu.createCategory      - Create category (vendor)
api.menu.createItem          - Create food item (vendor)
api.menu.createVariation     - Create item variation (vendor)
api.menu.toggleAvailability  - Toggle item availability (vendor)

api.order.place              - Place order (customer)
api.order.myOrders           - Customer order history
api.order.cancel             - Cancel order (customer)
api.order.updateStatus       - Update order status (vendor)
api.order.riderAccept        - Rider accepts order
api.order.submitReview       - Submit review after delivery

api.user.me                  - Current user profile
api.user.addAddress          - Add delivery address
api.user.getWallet           - Wallet balance + transactions
api.user.listNotifications   - User notifications

api.rider.updateLocation     - GPS location broadcast
api.rider.availableOrders    - Available orders for rider
api.rider.earnings           - Rider earnings summary

api.admin.overview           - Platform analytics
api.admin.revenueChart       - Revenue chart data
api.admin.listUsers          - User management
api.admin.createCoupon       - Create promo code
api.admin.createZone         - Create delivery zone

api.coupon.validate          - Validate coupon at checkout
api.upload.getPresignedUrl   - MinIO presigned upload URL
```

### Real-time Socket.io Namespaces

```
/orders      - Customer tracks live order status + rider location
/rider       - Rider receives assignments, broadcasts GPS
/restaurant  - Restaurant receives new order alerts
/admin       - Admin live feed (new orders, status changes)
```

---

## 📦 Environment Variables

See `apps/api/.env.example` for full reference.

**Required:**
```bash
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<32+ char random string>
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
```

---

## 📄 License

**MIT License** — Free to use, modify, and distribute commercially. No CLA required.

Copyright (c) 2026 FoodHub Contributors
