# 🦸 Hero Academy — Design Phase Delivery Pack
**Run:** `2026-03-26-gh1-mvp-build-hero-academy-11-learning-platform`  
**Prepared by:** Loki (Design Orchestrator)  
**Date:** 2026-03-26  
**Status:** ✅ Design phase complete — approved with conditions

---

## Executive Summary

The Hero Academy MVP design phase is complete. A superhero-themed 11+ learning platform for 8–10 year olds has been fully architected, UX-designed, capability-sliced, and broken into a sequenced backlog of **68 GitHub-ready issues** across **10 delivery batches**.

Heimdall's readiness gate returned **`approved_with_conditions`** at 80% confidence. There are **no hard blockers**. Build can begin on Batch 2 immediately. Five conditions must be resolved before Batch 3 launches.

**Total estimated build effort:** ~146 hours across the full MVP.

---

## Design Artifacts

| # | File | Agent | Size | Status |
|---|------|-------|------|--------|
| 00 | `00-request.md` | — | 8 KB | ✅ Source |
| 02 | `02-system-map.json` | Frigg | 19 KB | ✅ Complete |
| 03 | `03-architecture.md` | Mimir | 16 KB | ✅ Complete |
| 04 | `04-ux-design.md` | Baldr | 17 KB | ✅ Complete |
| 04 | `04-ux-wireframe.html` | Baldr | 54 KB | ✅ Complete |
| 05 | `05-capability-slices.json` | Sleipnir | 109 KB | ✅ Complete |
| 06 | `06-discovery.json` | Freya | 48 KB | ✅ Complete |
| 07 | `07-issue-drafts.json` | Brokk | 39 KB | ✅ Complete |
| 08 | `08-split-issues.json` | Sindri | 54 KB | ✅ Complete |
| 11 | `11-planning-qa.json` | Heimdall | 11 KB | ✅ Complete |
| 12 | `12-delivery-pack.md` | Loki | — | ✅ This document |

---

## Architecture Summary

**Stack:** React 18 + TypeScript + Vite (frontend) · Node.js + Express REST API (backend) · SQLite via better-sqlite3 · Tailwind CSS + Framer Motion · Zustand state · JWT auth · Stripe Checkout

**Three portals:**
- **Child Portal** — PIN login, superhero city map, district navigation, mission runner, hero profile
- **Parent Portal** — Email auth, child management, progress tracking, subscription management
- **Admin Portal** — Content CRUD (questions/assessments), user management, payment overview

**Key architectural decisions:**
- Monorepo structure (packages/frontend + packages/backend + packages/shared)
- SQLite with better-sqlite3 for MVP (single-server deployment)
- JWT access + refresh token rotation
- REST API — no GraphQL overhead for MVP scope
- Framer Motion for city map animations and mission transitions
- Mobile-first responsive throughout

---

## UX Design Summary

**Theme:** Animated comic book superhero city — dark backdrop, neon accents, vibrant zone colours  
**Child-facing:** Engaging, encouraging tone ("Power Up!", "Mission Accomplished!")  
**Navigation:** City map → Zone (Mathropolis) → District → Mission → Completion screen

**MVP UX flows:**
1. Landing page → Parent signup → Email verification → Add child → Child PIN login
2. City map → Select zone → Select district → Start mission → Answer questions → Mission complete
3. Hero profile: stats, XP bar, rank, achievement badges
4. Parent dashboard: child cards, per-child progress, subscription status

**Wireframe:** Interactive HTML prototype at `04-ux-wireframe.html` — covers all key screens

---

## Capability Slices Summary (Sleipnir)

47 capability slices across 8 bounded contexts:
- **Infrastructure** — Monorepo, Express, SQLite migrations, seed data, env config
- **Auth & Identity** — Parent/child/admin registration, login, JWT, middleware, rate limiting
- **Assessment Engine** — Question bank, assessments, attempt submission, scoring, gating
- **Gamification** — XP accumulation, rank transitions, streaks, achievements, stats
- **Child Portal** — City map, district nav, mission runner, hero profile
- **Parent Portal** — Dashboard, child management, progress tracking
- **Admin Portal** — Content CRUD, user management, subscription overview
- **Security & Compliance** — GDPR, PIN brute-force, input validation, HTTPS

---

## Discovery Highlights (Freya)

**Critical risks:**
- 🔴 **RISK-04** — GDPR child data compliance: must identify data controller and produce privacy policy before launch. No backlog owner yet (see conditions).
- 🔴 **RISK-02** — Deployment target undefined: SQLite path, server hosting, backup strategy all TBD.
- 🟠 **RISK-03** — Attempt submission race condition: concurrent submissions could corrupt scoring. Needs explicit transaction locking in the assessment engine.
- 🟠 **RISK-07** — City map animation performance on low-end Android: Framer Motion + complex SVG may lag on entry-level devices.
- 🟠 **RISK-09** — District unlock model ambiguous: request doesn't define whether districts unlock after any mission pass or after all missions complete.
- 🟠 **RISK-12** — Seed question quality: 150 authentic 11+ questions at correct standard is a significant content production effort.

**Critical open questions resolved in Batch 2:**
- OQ-02: Deployment target + SQLite persistence strategy
- OQ-05: Avatar config schema (must be agreed before seed data)
- OQ-08: XP replay cap rule (earn on first completion only, or every attempt?)
- OQ-10: GDPR data controller identification

---

## Issue Backlog Summary (Sindri)

**68 issues** · **146 hours estimated** · **10 sequential batches**

| Batch | Name | Hours | Key Deliverables |
|-------|------|-------|-----------------|
| 1 | Foundation | ~15h | Monorepo, DB schema, migrations, env config |
| 2 | Discovery & Decisions | ~7h | Resolve blocking open questions, define gamification constants |
| 3 | Authentication Layer | ~27h | Parent/child/admin auth, JWT, rate limiting, bcrypt |
| 4 | Assessment Engine | ~10h | Question CRUD, assessments, attempt submission, scoring |
| 5 | Gamification Core | ~7h | XP, rank, streaks, achievements, stats |
| 6 | Backend APIs & Security | ~15h | All service layers, child mgmt API, topics/zones, HTTPS, privacy |
| 7 | Child Portal UI | ~18h | City map, mission runner, hero profile, responsive |
| 8 | Parent Portal UI | ~9h | Registration, dashboard, child management, progress |
| 9 | Admin Portal UI | ~12h | Login, question/assessment/user management |
| 10 | Content, Testing & QA | ~26h | 150 seed questions, unit tests, integration tests, mobile QA |

**Priority distribution:** 40% Critical · 52% High · 8% Medium  
**Issue types:** 45 features · 8 chores · 6 security · 5 tasks · 2 discovery

---

## Heimdall Planning QA Gate

**Verdict:** `approved_with_conditions` (confidence: 80%)

| Gate | Status | Finding |
|------|--------|---------|
| Completeness | ✅ Pass | All MVP features covered in backlog |
| Consistency | ⚠️ Warn | Minor UX/arch alignment gaps (avatar schema, district unlock) |
| Risk Coverage | ⚠️ Warn | GDPR and deployment risk have no backlog owners |
| Dependency Ordering | ❌ Fail | Batch depends_on arrays empty; ISS-056 dep inverted; test issues have no deps |
| Scope Alignment | ✅ Pass | Backlog matches MVP scope; deferred items properly excluded |
| Definition of Done | ⚠️ Warn | Some issues need stronger observability/error handling criteria |
| Blockers | ✅ Pass | No hard blockers preventing build start |
| Operational Readiness | ⚠️ Warn | No deployment, CI, or email provider issues in backlog |

---

## Conditions Before Batch 3 (Thor Must Act)

| ID | Condition | Resolution |
|----|-----------|------------|
| COND-001 | ISS-056 (bcrypt) dependency inverted — bcrypt must be a prerequisite of ISS-009, not depend on it | Fix: ISS-009 depends_on → ISS-056 |
| COND-002 | All batch-level `depends_on` arrays are empty — Thor has no declared execution sequence | Add explicit batch ordering in 08-split-issues.json |
| COND-003 | ISS-030 (city map UI) has no dep on ISS-053 (topics/zones endpoint) | Add ISS-053 to ISS-030 depends_on |
| COND-004 | Test issues ISS-063/064/065 have no dependencies — could be scheduled before code exists | Add deps: ISS-063 → auth batch, ISS-064 → gamification batch, ISS-065 → full API |
| COND-005 | GDPR (RISK-04 critical) and deployment target (RISK-02 high) have no backlog issues | Create: deployment infrastructure issue + GDPR compliance tracking issue |

---

## Recommended First Actions for Thor

1. **Start Batch 2 immediately** — resolve open questions (ISS-060 + ISS-061). Unlocks everything downstream.
2. **Fix ISS-056 dependency inversion** — bcrypt must precede registration. Required before Batch 3.
3. **Declare batch-level `depends_on`** — Thor needs a deterministic execution queue.
4. **Add deployment infrastructure issue** — host selection, SQLite persistence, production env docs.
5. **Add email provider setup issue** — required before parent registration is end-to-end testable.
6. **Create GDPR compliance tracking issue** — critical risk, no current backlog owner.
7. **Verify avatar config schema in Batch 2** — seed data (Batch 10) depends on it.
8. **After Batch 2 complete:** Run Batches 1 and 3 in parallel (they're independent).

---

## Design Phase Health

**Completed specialists:** Mimir ✅ · Baldr ✅ (×2) · Frigg ✅ · Sleipnir ✅ · Freya ✅ · Brokk ✅ · Sindri ✅ · Heimdall ✅  
**Total artifacts:** 10 files, ~365 KB of design output  
**Total premium requests used:** ~3.33 (Copilot)  
**Design phase duration:** ~1 hour (parallelised where possible)

---

*Design phase complete. Delivery pack ready for Heimdall → Thor handoff.*  
*Next phase: Build (Thor). Trigger when conditions are acknowledged.*
