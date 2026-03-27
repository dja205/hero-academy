# 🔨 Hero Academy — Build Plan
**Orchestrator:** Thor  
**Run:** `2026-03-26-gh1-mvp-build-hero-academy-11-learning-platform`  
**Date:** 2026-03-27  
**Status:** In Progress — Run 1 executing

---

## Request Summary

Build the Hero Academy MVP — a superhero-themed 11+ learning platform for 8–10 year olds. Three portals: Child (learning/gameplay), Parent (progress tracking), Admin (content management). Single server, React + TypeScript + Vite frontend, Node.js + Express + SQLite backend.

---

## Approved Scope

Per Heimdall gate (`approved_with_conditions`, 80% confidence):
- 68 issues across 10 batches, ~146 hours estimated
- All 5 conditions resolved (ISS-056 dep fix, batch ordering, ISS-030/053 dep, test deps, GDPR/deployment issues added)
- MVP scope: Mathropolis only, multiple choice assessments, PIN login, no Stripe billing
- Deferred: Stripe billing, sound effects, adaptive difficulty, extended avatars, PWA

---

## Sequence

### Run 1 — Scaffold & Foundation (Batches 1–2)
**Specialist:** Ymir  
**Artifact:** `21-foundation.md`  
**Issues:** ISS-001 through ISS-008, ISS-060, ISS-061  
**Deliverables:**
- Monorepo structure (packages/frontend + packages/backend + packages/shared)
- TypeScript, ESLint, Prettier configured across all packages
- Express server with static asset serving + SPA fallback
- SQLite database schema with all tables + migration runner
- Seed data script (subjects, topics, assessments, 150 questions)
- Environment configuration (.env, validation)
- Vite dev server with API proxy
- Root package.json with dev/build/start scripts
- Open questions resolved: deployment target (Railway/Render), avatar config schema `{ costume: 1-3, mask: 1-2 }`, XP replay cap (first completion only), GDPR tracking
**Estimate:** ~22 hours

---

### Run 2 — Authentication Layer (Batch 3)
**Specialist:** Ymir (for DB/middleware) + Modi (for implementation)  
**Artifact:** `22-implementation.md` (first pass)  
**Issues:** ISS-009–018, ISS-056, ISS-058, ISS-059  
**Deliverables:**
- Parent email/password registration + login
- Child PIN + avatar login
- Admin email/password login
- JWT access tokens (15min) + refresh token rotation (HttpOnly cookie, 7 days)
- bcrypt password/PIN hashing
- Role middleware: `parent`, `child`, `admin` guards
- Email verification (non-blocking) + password reset
- Rate limiting on PIN login (5 attempts / 10min)
- Refresh token revocation list in DB
**Estimate:** ~27 hours

---

### Run 3 — Assessment Engine + Gamification (Batches 4–5)
**Specialist:** Modi  
**Artifact:** `22-implementation.md` (continued)  
**Issues:** ISS-019–028  
**Deliverables:**
- Question bank CRUD API
- Assessment definitions + question set serving
- Attempt submission, scoring, star calculation
- Client-generated attempt UUID (deduplication)
- Subscription gating (free/hero plan stubs)
- XP accumulation + rank tier transitions
- Streak tracking (daily activity)
- Achievement badge evaluation + award
- Child stats aggregation (avg score, strongest/weakest district)
**Estimate:** ~17 hours

---

### Run 4 — Backend APIs & Security (Batch 6)
**Specialist:** Modi  
**Artifact:** `22-implementation.md` (continued)  
**Issues:** ISS-048–055, ISS-057  
**Deliverables:**
- HTTP client with JWT interceptor + 401 retry
- API service layers (child, parent, admin)
- Child management endpoints (CRUD + PIN verify)
- Topics/zones API with unlock state per child
- Attempt history endpoint
- HTTPS/secure cookie configuration
- Data privacy enforcement (no parent PII in child responses)
**Estimate:** ~15 hours

---

### Run 5 — Child Portal UI (Batch 7)
**Specialist:** Magni  
**Artifact:** `23-heavy-implementation.md`  
**Issues:** ISS-029–036  
**Deliverables:**
- Child PIN login screen + avatar carousel
- Interactive city map with Framer Motion animations
- District navigation + lock state
- Mission runner (questions, power meter, feedback)
- Mission complete screen (star reveal, XP ticker)
- Hero profile (avatar, rank, stats, achievements)
- Bottom navigation bar
- Mobile-first responsive (375px+), reduced-motion support
**Estimate:** ~18 hours

---

### Run 6 — Parent & Admin Portal UI (Batches 8–9)
**Specialist:** Magni  
**Artifact:** `23-heavy-implementation.md` (continued)  
**Issues:** ISS-037–047  
**Deliverables:**
- Parent registration/login UI
- Parent dashboard with child cards
- Per-child progress detail (bar chart, recent activity, weak areas)
- Child management forms (add/edit/PIN reset)
- Admin login + console layout
- Question management (list, create, edit, soft-delete)
- Assessment management (create from question bank, preview)
- User management (parent list, suspend/unsuspend)
**Estimate:** ~21 hours

---

### Run 7 — Code Review (Tyr)
**Specialist:** Tyr  
**Artifact:** `24-code-review.md`  
**Scope:** Full codebase review — architecture compliance, security, TypeScript quality, API contract, mobile accessibility  
**Estimate:** ~4 hours

---

### Run 8 — Content & Testing (Batch 10)
**Specialist:** Ratatoskr (QA) + seed content via Modi  
**Artifacts:** `24b-qa-review.md`  
**Issues:** ISS-062-A/B/C, ISS-063–066  
**Deliverables:**
- 150 seed questions (11+ standard, 3 difficulty levels)
- Unit tests: auth layer, gamification engine
- Integration tests: attempt submission flow
- Manual mobile QA checklist (375px, touch targets, animations)
**Estimate:** ~26 hours

---

### Run 9 — Release & Recovery
**Specialists:** Surtr (release) + Hel (recovery)  
**Artifacts:** `28-release.md`, `29-recovery.md`  
**Deliverables:**
- Production build verification
- SQLite backup strategy
- PM2/systemd startup config
- Rollback procedure
- Known issues log
**Estimate:** ~4 hours

---

## Specialist Routing

| Specialist | Role | Runs |
|---|---|---|
| Ymir | Scaffold: monorepo, DB schema, migrations, seed, config | 1–2 |
| Modi | Implementation: auth, assessment engine, APIs | 2–4 |
| Magni | Heavy UI: child portal, parent portal, admin portal | 5–6 |
| Tyr | Code review across all output | 7 |
| Ratatoskr | QA review: findings, P1/P2 classification | 8 |
| Surtr | Release build + deployment docs | 9 |
| Hel | Recovery + rollback procedures | 9 |

---

## Risks

| Risk | Mitigation |
|---|---|
| R1: SQLite in production | WAL mode, nightly backup, document Postgres migration path |
| R2: Framer Motion performance on mobile | Test on DevTools throttle, prefers-reduced-motion fallback |
| R3: Attempt deduplication | Client-generated UUID, server unique constraint |
| R4: Seed question quality | 150 questions at 11+ standard — reviewed in Batch 10 |
| R5: GDPR compliance | Tracked as issue — privacy policy required before public launch |

---

## Release Strategy

1. Run `npm run build` → verify frontend dist
2. Express serves `/client/dist` at root
3. SQLite DB on persistent volume, WAL mode enabled
4. PM2 or systemd process supervision
5. Health check endpoint `/api/v1/health`
6. Nightly SQLite backup to S3/R2

---

## Recovery Strategy

- PM2/systemd auto-restart on crash
- SQLite backup restoration procedure documented
- Feature flags for deferred features (Stripe, sound effects)
- Rollback = redeploy previous git tag

---

## QA Fix Cycle (if needed)

After Ratatoskr review:
- P1/P2 findings → route back to Modi/Magni with specific context
- Re-run Ratatoskr after fixes
- Repeat until PASS (0 P1, 0 P2)
- Only then proceed to Surtr/Hel

---

*Build orchestrated by Thor. Next: Run 1 — Ymir scaffold.*
