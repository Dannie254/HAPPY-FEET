# Happy Feet - Premium Kenyan Fashion E-commerce Platform

A production-grade, modular monolith fashion e-commerce platform built specifically for the Kenyan market. Happy Feet enables local fashion retailers to sell footwear, apparel, and accessories online with seamless M-Pesa integration, modern security practices, and a delightful shopping experience.

---

## The Problem

Kenyan fashion retailers face significant challenges selling online:

- **No local payment integration** — Most platforms only support international cards, excluding the 30M+ Kenyans who use M-Pesa daily
- **Inventory chaos** — Manual stock tracking leads to overselling, stockouts, and lost revenue
- **Trust deficit** — Customers hesitate to buy fashion online without trying items; returns are difficult
- **Technical barriers** — Existing solutions (Shopify, WooCommerce) are expensive, complex, or lack M-Pesa support
- **Security gaps** — Many local sites lack basic protections, exposing customer data and payment info

## The Solution

Happy Feet is a **fully-featured, Kenyan-first e-commerce platform** that solves these problems:

| Problem | Happy Feet Solution |
|---------|---------------------|
| M-Pesa payments | Native Daraja STK Push integration with idempotent callbacks |
| Inventory accuracy | Atomic reservations with TTL, real-time stock validation at checkout |
| Customer trust | Verified reviews, detailed product media, easy returns flow |
| Affordable tech | Self-hosted, open architecture, no monthly platform fees |
| Security | Enterprise-grade hardening (see Security section below) |

---

## How It Works — Core Workflow

```
Customer Journey                          Admin Journey
────────────────                          ──────────────
1. Browse/Search products                 1. Login to admin dashboard
   ├─ Full-text + autocomplete search        ├─ Role-based access (Staff/Admin)
   ├─ Filter by category, brand, price       └─ MFA required for sensitive actions
   └─ Real-time stock indicators
2. Add to cart (guest or logged in)         2. Manage catalog
   └─ Persistent cart via cookies
3. Checkout                                 3. Process orders
   ├─ Shipping details                        ├─ View/fulfill/cancel orders
   ├─ M-Pesa STK Push                         ├─ Automatic stock reservation
   └─ Payment confirmation                    └─ Print packing slips
4. Order confirmation                       4. Analytics & insights
   ├─ Email + SMS receipt                    ├─ Sales reports by period/category
   ├─ Order tracking                          └─ Low-stock alerts
   └─ Post-purchase review prompt
```

### Key Technical Flows

**Payment Flow (M-Pesa STK Push)**
```
Customer → Initiate Checkout → Backend creates order (PENDING)
    → M-Pesa STK Push sent to phone → Customer enters PIN
    → M-Pesa Callback (idempotent) → Order marked PAID
    → Stock reservation confirmed → Confirmation email sent
```

**Inventory Flow (Concurrency-Safe)**
```
Add to Cart → Reserve stock (atomic decrement + TTL)
    → Checkout → Re-validate stock & price
    → Payment success → Convert reservation to sale
    → Payment fail/timeout → Auto-release reservation
```

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18 + TypeScript** | Type-safe component architecture |
| **Vite** | Lightning-fast dev server & optimized builds |
| **Tailwind CSS** | Utility-first styling, dark mode ready |
| **React Router v6** | Client-side routing with protected routes |
| **TanStack Query** | Server state caching, background refetching |
| **Axios** | HTTP client with interceptors for auth |
| **Zod** | Runtime schema validation (shared with backend) |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js + Express + TypeScript** | Performant, typed API layer |
| **MongoDB + Mongoose** | Flexible document model for products/orders |
| **Redis (ioredis)** | Caching, rate limiting, session store |
| **MongoDB Atlas Search** | Full-text + autocomplete search |
| **Cloudflare R2** | S3-compatible image storage (global CDN) |
| **M-Pesa Daraja API** | STK Push, B2C, transaction status |
| **JWT (HTTP-only cookies)** | Stateless auth with refresh rotation |
| **Argon2id** | Memory-hard password hashing |
| **Google/Apple OAuth** | Social login with PKCE |
| **Pino** | Structured JSON logging |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Docker + Docker Compose** | Local dev parity with production |
| **Helmet + CSP** | Security headers, nonce-based CSP |
| **Express Rate Limit** | Multi-layer rate limiting |

---

## Security Hardening Features

Following a comprehensive security assessment, Happy Feet implements **defense-in-depth** across all layers:

### Authentication & Session Security
- **JWT Algorithm Enforcement** — Explicit HS256 verification; unsafe decode removed
- **Refresh Token Rotation** with **Proof-of-Possession** — Device fingerprint (UA + IP + secret) bound to session; validated on every rotation
- **MFA (TOTP)** — Full implementation with QR codes, 10 backup codes, enforced for admin actions
- **HttpOnly + Secure + SameSite=Strict Cookies** — No JS access, CSRF protection
- **Cache-Control: no-store** on all auth endpoints — Prevents credential caching

### Input Validation & Injection Prevention
- **Zod schemas on every endpoint** — Type-safe runtime validation
- **Search API sanitization** — 100-char limit, special char stripping, min 3-char autocomplete
- **Per-endpoint body limits** — Auth endpoints capped at 100KB

### Rate Limiting & Abuse Prevention
- **Multi-key rate limiting** — IP + User-Agent fingerprint (not IP alone)
- **Dedicated limiters** — Auth (5/15min), Search (30/min), General (100/15min)
- **Password reset attempt tracking** — Lockout after failed attempts

### Transport & Browser Security
- **Nonce-based CSP** — Per-request `script-src`, `style-src` nonces; no `unsafe-inline`
- **Subresource Integrity (SRI)** — SHA-384 hashes on all external assets via `vite-plugin-sri`
- **HSTS + Secure Headers** — Preload, frame-ancestors: none, X-Content-Type-Options
- **OAuth PKCE + State** — CSRF-protected Google/Apple flows

### Data Protection
- **Argon2id (64MB / 3 iterations / 1 parallelism)** — Future-proof password hashing
- **Password history** — Last 5 hashes stored; reuse prevented
- **Session max age: 24 hours** — Automatic refresh, reduced exposure window
- **Audit logging** — All auth events, admin actions, payment callbacks logged

---

## Admin Control & Management

### Role-Based Access Control (RBAC)
| Role | Permissions |
|------|-------------|
| **Super Admin** | Full system access, user management, security settings |
| **Admin** | Catalog, orders, analytics, staff management |
| **Staff** | Order fulfillment, inventory updates, customer support |

### Admin Dashboard Capabilities

**Catalog Management**
- Create/edit/archive products with variants (size, color, SKU)
- Bulk import via CSV
- Image management with Cloudflare R2 (auto-optimization)
- Category hierarchy (unlimited depth, drag-and-drop)

**Order Management**
- Real-time order queue with status filters
- One-click fulfillment (prints packing slip, updates stock)
- Partial fulfillment & backorder handling
- Refund initiation (M-Pesa B2C integration)

**Inventory Control**
- Live stock levels with low-stock thresholds
- Reservation monitoring (active/expired)
- Stock adjustment audit trail

**Analytics & Reporting**
- Sales by period, category, brand, payment method
- Conversion funnel (view → cart → checkout → paid)
- Customer lifetime value, repeat purchase rate
- Export to CSV/PDF

**Security Administration**
- View/manage active user sessions (revoke per-device)
- MFA enrollment status per user
- Failed login monitoring with geo-IP
- API key management for integrations

---

## Getting Started

### Prerequisites
- Node.js ≥ 20
- Docker & Docker Compose
- pnpm (recommended) or npm

### Quick Start

```bash
# Install all workspace dependencies
npm install --workspaces

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Start databases (MongoDB + Redis)
npm run db:up

# Run development servers
npm run dev
```

Visit:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000/api/v1/health`

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_ACCESS_SECRET` | ≥32 chars, access token signing |
| `JWT_REFRESH_SECRET` | ≥32 chars, refresh token signing |
| `MPESA_CONSUMER_KEY/SECRET` | Daraja API credentials |
| `MPESA_SHORTCODE/PASSKEY` | Paybill/Till number + passkey |
| `R2_ACCOUNT_ID/ACCESS_KEY/SECRET` | Cloudflare R2 credentials |
| `GOOGLE_CLIENT_ID/SECRET` | OAuth credentials |
| `SMTP_*` | Email delivery settings |

---

## Project Structure

```
happy-feet/
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/         # Environment, DB, Redis, validation
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/       # Auth, MFA, OAuth, sessions, tokens
│   │   │   ├── products/   # Products, variants, inventory
│   │   │   ├── categories/ # Category hierarchy
│   │   │   ├── search/     # Atlas Search + autocomplete
│   │   │   ├── orders/     # Orders, cart, checkout
│   │   │   ├── payments/   # M-Pesa STK Push, callbacks
│   │   │   └── users/      # Profiles, addresses, RBAC
│   │   ├── shared/         # Types, middleware, utilities
│   │   ├── utils/          # Logger, errors, async handlers
│   │   ├── app.ts          # Express setup, CSP, rate limiting
│   │   └── index.ts        # Entry point, graceful shutdown
│   └── tests/              # Integration & unit tests
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # Reusable UI (Header, ProductCard, etc.)
│   │   ├── pages/          # Route pages (Home, Shop, Cart, Checkout)
│   │   ├── hooks/          # TanStack Query hooks, auth, cart
│   │   ├── utils/          # API client, formatters, validators
│   │   ├── styles/         # Tailwind + global styles
│   │   └── types/          # Shared TypeScript interfaces
│   └── public/             # Static assets
├── docker/
│   └── mongo-init/         # Indexes, collections, test data
├── docker-compose.yml      # Local stack: MongoDB, Redis, backend, frontend
└── package.json            # Root workspace scripts
```

---

## Available Scripts

```bash
# Development
npm run dev              # Frontend + Backend (concurrent)
npm run dev:backend      # Backend only (tsx watch)
npm run dev:frontend     # Frontend only (Vite)

# Building
npm run build            # Production builds for all workspaces
npm run build:backend    # TypeScript compile
npm run build:frontend   # Vite production build + SRI

# Code Quality
npm run lint             # ESLint (all workspaces)
npm run typecheck        # tsc --noEmit (all workspaces)

# Testing
npm run test             # Vitest (unit + integration)
npm run test:watch       # Watch mode

# Database
npm run db:up            # Start MongoDB + Redis containers
npm run db:down          # Stop containers
npm run db:logs          # Follow container logs
npm run db:seed          # Seed test data (dev only)
```

---

## Architecture Principles

1. **Database as Source of Truth** — Frontend/cache never trusted for price, stock, or payment status
2. **Concurrency-Safe Inventory** — Atomic reservations with TTL expiry prevent overselling
3. **Idempotent Payments** — Duplicate M-Pesa callbacks handled safely via idempotency keys
4. **Security by Default** — Helmet, CSP, rate limiting, validation on every layer
5. **Category-Agnostic Design** — Products support any hierarchy without code changes
6. **Complete Audit Trail** — All admin actions, auth events, payment callbacks logged with context
7. **Graceful Degradation** — Search/cache failures fall back to database; payment retries with exponential backoff

---

## License

Proprietary — Happy Feet Kenya. All rights reserved.

---

## Contributing

Internal project — not accepting external contributions at this time.

For security issues, please email security@happyfeet.ke