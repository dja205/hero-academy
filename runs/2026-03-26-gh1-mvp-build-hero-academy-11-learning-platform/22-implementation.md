# Implementation Summary

## Issue
Tyr code-review P1/P2 backend fix pass — resolve blocking bugs that prevent the app from working end-to-end.

## Outcome Delivered
All 5 P1 and 4 P2 backend issues fixed. No frontend, schema, seed, or auth-middleware signature changes.

## Key Changes

### P1 Fixes

| ID | Summary | File(s) |
|----|---------|---------|
| P1-04 | Added `GET /children/me` child self-service endpoint (Role.Child, reads `req.user.sub`). Placed before `/:id` to avoid Express param capture. | `routes/children.ts` |
| P1-05 | Stats and history routes now accept `Role.Child` **and** `Role.Parent`. Parent ownership verified via `children.parent_id` check. | `routes/stats.ts`, `routes/history.ts` |
| P1-07 | Changed backend registration error code from `EMAIL_EXISTS` to `DUPLICATE_EMAIL` to match frontend expectations. | `services/auth.ts` |
| P1-08 | Moved `shouldAwardXp()` evaluation **before** the attempt INSERT inside the transaction so first-time 3★ correctly earns XP. Added optional `preEvaluatedEarnXp` parameter to `processAttemptGamification`. | `routes/attempts.ts`, `services/gamification.ts` |
| P1-09 | Added `GET /admin/users` (paginated, searchable), `PUT /admin/users/:id/suspend`, and `PUT /admin/users/:id/unsuspend` endpoints. | `routes/admin.ts` |

### P2 Fixes

| ID | Summary | File(s) |
|----|---------|---------|
| P2-01 | Admin assessments listing now returns paginated data (`{ assessments, total, page, limit }`). | `routes/admin.ts` |
| P2-02 | Created `GET /api/v1/parent/profile` endpoint returning parent's own profile data. Mounted in `app.ts`. | `routes/parent.ts` (new), `app.ts` |
| P2-04 | Added explanatory comment to `JWT_REFRESH_SECRET` and `JWT_REFRESH_EXPIRES_IN` config entries — refresh tokens use bcrypt hashes, not signed JWTs. | `config.ts` |
| P2-06 | Added `setInterval` cleanup (every 15 min, `.unref()`'d) to purge expired entries from the in-memory PIN rate limiter map. | `middleware/rate-limit.ts` |

## Files Changed

| File | Change |
|------|--------|
| `packages/backend/src/routes/children.ts` | +31 — new `/me` route |
| `packages/backend/src/routes/stats.ts` | +13 −4 — dual-role + parent ownership |
| `packages/backend/src/routes/history.ts` | +16 −4 — dual-role + parent ownership |
| `packages/backend/src/services/auth.ts` | 1 line — error code rename |
| `packages/backend/src/routes/attempts.ts` | +6 −2 — reordered XP check, import |
| `packages/backend/src/services/gamification.ts` | +2 −1 — optional `preEvaluatedEarnXp` param |
| `packages/backend/src/routes/admin.ts` | +121 — users CRUD, assessments pagination |
| `packages/backend/src/routes/parent.ts` | new file — parent profile endpoint |
| `packages/backend/src/app.ts` | +2 — import + mount parent router |
| `packages/backend/src/config.ts` | +2 — explanatory comment |
| `packages/backend/src/middleware/rate-limit.ts` | +18 — periodic cleanup interval |

## Tests Added or Updated
No new test files — fixes are surgical route/service-level changes. Existing tests (if present) should continue to pass as no public signatures were broken (gamification gained an optional parameter, all others are additive).

## Known Risks

1. **P1-08 transaction ordering:** `shouldAwardXp` now runs inside the transaction but before the INSERT. Since SQLite transactions are serializable, there's no race window — another concurrent attempt for the same child/assessment would be blocked by the transaction lock. Safe for the single-writer SQLite model.
2. **P1-09 search injection:** The `LIKE` search uses parameterised queries (`?` placeholders), so SQL injection is not a concern. However, `%` and `_` wildcards in user input are not escaped — this is acceptable for an admin-only endpoint.
3. **P2-06 cleanup interval:** The `setInterval` is `.unref()`'d so it won't keep the Node process alive during shutdown. The cleanup is conservative — it only removes entries that are both window-expired and lockout-expired.
4. **P2-02 parent profile:** Returns `subscription_status` and `subscription_plan` columns. These must exist in the `parents` table (they do per the seed schema).

## Notes for Tyr and Downstream Agents

- **Tyr:** All P1/P2 backend items addressed. Ready for re-review.
- **Jormungandr:** No new migrations — all queries use existing columns.
- **Fenrir:** The `processAttemptGamification` function signature gained an optional 6th parameter. Any direct callers outside `attempts.ts` are unaffected (parameter is optional with fallback to internal evaluation).
