# Architecture Constraints — Hero Academy MVP

**Author:** Mimir  
**Date:** 2026-03-26  
**Status:** Draft  
**Scope:** MVP — single subject (Mathropolis), three portals, single-server deployment

---

## Summary

Hero Academy is a single-server, monolithic web application composed of a React SPA frontend and a Node.js/Express REST API backend, sharing a single SQLite database. The MVP targets three distinct user personas — children (8–10), parents, and admins — each with a dedicated portal and authentication model.

The architectural shape is deliberately simple: one codebase, one process, one database, one deployment unit. This prioritises speed-to-ship for the MVP and accepts known production limitations (documented under Risks). The system is horizontally split into frontend bounded contexts (three portals) and backend domain layers, communicating exclusively over a versioned REST API.

Stripe is the only external integration in-scope for MVP (though billing is deferred to post-MVP). JWT-based auth is the session mechanism across all portals, with child sessions using PIN-based login rather than email credentials.

---

## Boundaries and Bounded Contexts

### 1. Child Portal (Learning & Gameplay)
- **Owns:** City Map, District navigation, Mission/Assessment flow, Hero Profile, XP/rank state
- **Consumer of:** Assessment Engine, Auth (child PIN), Gamification
- **UI pattern:** Immersive, mobile-first, animated — React SPA routed sub-tree
- **Auth boundary:** PIN + avatar selection → short-lived JWT (`child` role claim)

### 2. Parent Portal
- **Owns:** Account management, child management, progress dashboards, billing (deferred)
- **Consumer of:** Auth (parent email/password), child progress data, Stripe (deferred)
- **UI pattern:** Functional dashboard — readable on mobile, not game-like
- **Auth boundary:** Email/password → JWT (`parent` role claim)

### 3. Admin Portal
- **Owns:** Content management (questions, assessments), user management, payment overview (deferred)
- **Consumer of:** Auth (admin email/password), all domain read/write APIs
- **UI pattern:** Data-dense table/form UI — desktop-oriented
- **Auth boundary:** Email/password → JWT (`admin` role claim)

### 4. Assessment Engine
- **Owns:** Question bank, assessment definitions, attempt recording, scoring, XP award
- **Responsibilities:**
  - Serve ordered question sets for a given assessment
  - Accept and persist attempt submissions
  - Compute score, stars, XP earned
  - Enforce subscription gating (free vs hero plan)
- **Does not own:** gamification display, avatar state, streak tracking (belongs to child profile)

### 5. Auth & Identity
- **Owns:** Parent registration/login, child PIN login, admin login, JWT issuance/validation, email verification, password reset
- **Responsibilities:**
  - Issue access tokens (short-lived, ~15 min) and refresh tokens (longer-lived, ~7 days)
  - Role-based claims: `parent`, `child`, `admin`
  - Middleware layer enforcing role guards on all API routes
  - bcrypt hashing for parent/admin passwords; bcrypt hashing for child PINs
- **Does not own:** session storage, child progress, subscription state

### 6. Gamification
- **Owns:** XP accumulation, rank calculation, streak tracking, achievement unlocks
- **Responsibilities:**
  - Compute and persist XP delta after each attempt
  - Evaluate rank tier transitions
  - Evaluate and award achievement badges
  - Expose child stats (total missions, avg score, streak, strongest/weakest district)
- **Note:** This is a backend service layer, not a separate process. Triggered as a post-attempt side-effect within the assessment submission handler.

### 7. Payments (Deferred — architecture seam only)
- **Owns:** Stripe customer/subscription lifecycle, plan state, webhook ingestion
- **Responsibilities (post-MVP):**
  - Stripe Checkout session creation
  - Webhook handler: `customer.subscription.updated`, `invoice.payment_failed`, etc.
  - Subscription status sync to local `subscriptions` table
  - Subscription gating enforcement (passed to Assessment Engine)
- **MVP boundary:** Subscription table exists and is seeded with `free` plan for all parents. No Stripe calls made. Gating logic reads `plan` field — stubbed to `free`.

---

## Key Components and Responsibilities

### Frontend (`/client`)

| Component | Responsibility |
|---|---|
| `App` / Router | Top-level routing; splits into `/child`, `/parent`, `/admin` sub-trees |
| `AuthStore` (Zustand) | Holds JWT, role, decoded claims; drives route guards |
| `CityMap` | Interactive zone map; reads zone/district unlock state from API |
| `MissionRunner` | Renders question, captures answer, posts to attempt API, drives feedback animation |
| `HeroProfile` | Displays avatar, XP bar, rank, stats, achievements |
| `ParentDashboard` | Child summary cards, progress charts, child management forms |
| `AdminConsole` | Question/assessment CRUD tables, user list, soft-delete controls |
| `AnimationLayer` | Framer Motion transitions — city fly-in, district zoom, power-up flash |

### Backend (`/server`)

| Module | Responsibility |
|---|---|
| `auth` routes + middleware | Login, register, refresh, verify email, reset password; JWT sign/verify |
| `children` routes | CRUD for child profiles; PIN verification endpoint |
| `subjects` / `topics` routes | Read-only catalogue; unlock state computed per child |
| `questions` routes | Admin CRUD; read endpoint for assessment question sets |
| `assessments` routes | Admin CRUD; child-facing: fetch by topic, submit attempt |
| `attempts` routes | POST attempt → score → XP → gamification side-effects |
| `gamification` service | XP delta, rank check, streak update, achievement evaluation |
| `subscriptions` routes | Read plan status; Stripe webhook handler (stubbed for MVP) |
| `admin` middleware | `admin` role guard applied to all admin routes |
| `db` module | better-sqlite3 singleton; schema migration runner on startup |

### Database (SQLite via better-sqlite3)

Single file database. Schema is defined in versioned migration files applied at startup. Tables: `parents`, `children`, `subjects`, `topics`, `questions`, `assessments`, `attempts`, `subscriptions`, `achievements`. See data model in request spec for full field definitions.

---

## Integration Seams

### 1. Frontend ↔ Backend (REST API)

- **Protocol:** HTTP/HTTPS REST, JSON payloads
- **Base path:** `/api/v1/`
- **Auth:** `Authorization: Bearer <access_token>` header on all protected routes
- **Token refresh:** Frontend intercepts 401s, calls `/api/v1/auth/refresh` with HttpOnly refresh token cookie, retries original request
- **Role enforcement:** Middleware reads `role` claim; returns 403 for mismatched portal access
- **Assumption:** API and frontend are served from the same origin in production (Express serves built static assets). No CORS complexity.

### 2. Child PIN Authentication Flow

```
Child selects avatar → enters 4-digit PIN
→ POST /api/v1/auth/child-login { child_id, pin }
→ Server: bcrypt.compare(pin, pin_hash)
→ Issues JWT with role=child, sub=child_id, parent_id claim
→ Frontend stores token in memory (NOT localStorage — child sessions are ephemeral)
→ Auto-logout after 2h inactivity (frontend idle timer)
```

**Constraint:** Child JWT must carry `parent_id` claim so backend can validate subscription gating without an extra DB lookup.

### 3. Assessment Attempt Submission

```
MissionRunner completes → collects answers array
→ POST /api/v1/attempts { assessment_id, answers[], duration_seconds }
→ Backend: score answers against correct_index
→ Compute stars (1/2/3), xp_earned
→ Persist attempt record
→ Trigger gamification service (XP += xp_earned, rank check, streak, achievements)
→ Return { score, max_score, stars, xp_earned, new_rank?, new_achievements[] }
→ Frontend plays completion animation with returned data
```

**Constraint:** Attempt submission must be idempotent-safe — client should not be able to submit the same attempt twice. Consider attempt deduplication key (child_id + assessment_id + completed_at within a time window), or a client-generated attempt UUID.

### 4. Stripe Webhook (Deferred — seam defined)

- **Endpoint:** `POST /api/v1/webhooks/stripe`
- **Security:** Stripe-Signature header verification (stripe SDK `constructEvent`)
- **Events handled (post-MVP):** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- **MVP stub:** Endpoint exists, returns 200, logs event. No processing.

### 5. Static Asset Serving

- Express serves `/client/dist` at root in production
- All non-`/api/*` routes return `index.html` (SPA fallback)
- In development: Vite dev server proxies `/api/*` to Express

---

## Non-Functional Requirements

| Requirement | Constraint |
|---|---|
| **Mobile-first** | All child and parent UI must be fully functional at 375px viewport. Admin portal may target 768px minimum. Tailwind responsive utilities; touch targets ≥ 44px. |
| **Performance** | City map and mission runner must feel snappy on mid-range mobile. Framer Motion animations must not block interaction. Lazy-load district assets. |
| **SQLite** | Single-file DB; no connection pooling needed; better-sqlite3 is synchronous (acceptable for single-server low-concurrency MVP). DB file must be on a persistent volume in deployment. |
| **Single server** | One Node.js process serves API + static assets. No separate web server, no CDN, no load balancer. Acceptable for MVP traffic. |
| **Auth token security** | Access tokens: short-lived (15 min), in-memory on client. Refresh tokens: HttpOnly cookie, 7-day expiry, rotated on use. Child tokens: in-memory only, no refresh. |
| **Data privacy** | Children are minors. No PII beyond hero name + PIN hash stored for child records. Parent email is PII — must not appear in child API responses. GDPR note: if deployed in UK/EU, a privacy policy and data retention policy are required (out of scope for MVP build, but must not be forgotten). |
| **Session timeout** | 2-hour inactivity auto-logout, client-side idle timer. |
| **Seed data** | DB seed script must be idempotent (safe to re-run). Must produce: 1 subject, 5 topics, 15 assessments, 150 questions at 11+ standard. |
| **Availability** | MVP: no HA requirement. Single server restart acceptable. SQLite WAL mode recommended for read/write concurrency during normal use. |

---

## Risks and Trade-offs

### R1 — SQLite in production (Medium risk)
- **Risk:** SQLite is not suited for multi-process or high-concurrency writes. Single-server constraint mitigates this for MVP, but any future horizontal scaling is blocked.
- **Mitigation for MVP:** Acceptable. Use WAL mode. Document the migration path to PostgreSQL as a post-MVP track.
- **Trade-off accepted:** Simplicity and zero-ops setup over future scalability.

### R2 — Single server, no redundancy (Medium risk)
- **Risk:** Server restart = downtime. Disk failure = data loss.
- **Mitigation for MVP:** Nightly SQLite backup to object storage (e.g. S3/R2). PM2 or systemd process supervision for restart resilience.
- **Trade-off accepted:** Operational simplicity over availability SLA.

### R3 — JWT without server-side session store (Low-Medium risk)
- **Risk:** No ability to immediately invalidate tokens (e.g. on parent account suspension). Refresh token rotation is the primary defence.
- **Mitigation:** Short access token TTL (15 min) limits exposure window. Refresh token revocation list in DB for logout/suspend flows.
- **Open question:** Should admin suspension of a parent trigger active session invalidation? If yes, a token denylist (DB table, checked on each request) is required.

### R4 — Child PIN security (Low risk for MVP)
- **Risk:** 4-digit PIN is low-entropy. Brute-forceable if no rate limiting.
- **Mitigation:** Rate-limit PIN login endpoint (e.g. 5 attempts per child per 10 min, implemented via in-memory rate limiter or express-rate-limit).
- **Trade-off accepted:** PIN UX is appropriate for 8–10 year olds; rate limiting is sufficient defence in a supervised home context.

### R5 — Attempt submission integrity (Low risk)
- **Risk:** Network retry or double-tap could submit an attempt twice, awarding XP twice.
- **Mitigation:** Client-generated attempt UUID submitted with POST; server enforces unique constraint on attempt UUID.

### R6 — Framer Motion + mobile performance (Low-Medium risk)
- **Risk:** Complex animations (city fly-in, district zoom) may cause jank on low-end Android devices.
- **Mitigation:** Limit simultaneous animations; use `will-change` sparingly; provide a `prefers-reduced-motion` fallback; test on low-end device profiles in Chrome DevTools.

### R7 — Stripe webhook replay / ordering (Low risk, deferred)
- **Risk:** Webhooks may arrive out of order or be retried by Stripe.
- **Mitigation (post-MVP):** Idempotency check on `stripe_event_id` before processing; process subscription status as state machine (never downgrade from `active` on a stale event).

---

## Open Questions

| # | Question | Owner | Blocker? |
|---|---|---|---|
| OQ-1 | Is the frontend a single Vite app with sub-routes for each portal, or three separate builds? Single app is simpler but bundles admin code into the child experience. Recommend: single app with code-split portal sub-trees. | Thor / Freya | Yes — affects project structure |
| OQ-2 | What is the deployment target? (VPS, Railway, Render, Fly.io?) Affects how SQLite persistence and process supervision are handled. | Loki / Product | Yes — affects infra setup |
| OQ-3 | Is email verification blocking (child cannot be added until parent verifies) or non-blocking for MVP? | Product | Yes — affects auth flow |
| OQ-4 | Should the child portal be accessible offline / PWA? Not in the spec, but the mobile-first target raises the question. | Product | No — recommend defer |
| OQ-5 | Avatar config is stored as JSON blob in `children.avatar_config`. What is the schema of this JSON? Must be defined before frontend avatar components and the DB layer are built. | Freya / Thor | Yes — shared contract |
| OQ-6 | `question_ids` in `assessments` is a JSON array. Should question ordering be randomised per attempt or fixed? Affects attempt scoring logic. | Product | Yes — affects assessment engine |
| OQ-7 | Subscription gating: for MVP, all content is free (Mathropolis only). Should gating logic still be enforced against the `plan` field, or bypassed entirely? Enforcing it now reduces post-MVP migration cost. | Thor | No — but recommend enforce stub now |
| OQ-8 | Admin accounts: how are they created? Seed script only? Or is there a super-admin invite flow? | Product | Yes — affects admin auth |
| OQ-9 | Is there a requirement for the parent to approve child progress/activity, or is the parent portal purely read-only for progress? | Product | No |
| OQ-10 | GDPR / UK data protection: is there a nominated data controller? A privacy policy page is a legal requirement before public launch. | Product / Legal | No (not MVP launch blocker, but must be tracked) |

---

## Decision Log

| ID | Decision | Rationale |
|---|---|---|
| AD-1 | Single Express process serves API + static assets | Minimises ops complexity for MVP; no Nginx/CDN required |
| AD-2 | SQLite with better-sqlite3 | Zero-ops, file-based, synchronous API fits single-server model; migration path to Postgres documented |
| AD-3 | JWT with HttpOnly refresh token cookie | Balance of statelessness and security; avoids localStorage token exposure for parent/admin |
| AD-4 | Child tokens in-memory only, no refresh | Children do not have email; session is supervised; 2h TTL is appropriate |
| AD-5 | Gamification as in-process service, not separate module | Complexity does not warrant a separate service at MVP scale; post-attempt trigger is sufficient |
| AD-6 | Stripe webhook endpoint stubbed for MVP | Billing deferred; seam defined now to avoid retrofit cost later |
| AD-7 | Single Vite SPA, code-split by portal | Avoids three separate builds/deployments; portals share auth and API client code |
| AD-8 | Attempt deduplication via client-generated UUID | Prevents XP double-award from network retries without requiring server-side session state |
