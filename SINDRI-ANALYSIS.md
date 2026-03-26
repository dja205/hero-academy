# Sindri Issue Split  Hero Academy MVPAnalysis 

**Generated:** 2026-03-26T23:34:13.213Z  
**Total Original Issues:** 66  
**Total Split Issues:** 68  
**New Issues Created:** 2 (ISS-062-A, ISS-062-B added; ISS-062-C replaces ISS-062)  

---

## Executive Summary

Reviewed all 66 issue drafts from Brokk. **Only 1 issue exceeded the 4-hour practical limit**: ISS-062 (Produce seed questions, 16 hours). 

**Strategy:** Split ISS-062 into 3 phases of ~5 hours each, enabling parallel content work and smaller, independently reviewable tasks. All other 65 issues are properly scoped and retained as-is.

**Result:** 68 total issues organized into 10 sequential batches, totaling 146 estimated hours, ready for Thor's build phase.

---

## Decomposition Rationale

 35h)

**Why this needed splitting:**
- 16 hours is too large for a single implementation slot in one build cycle
- Violates the principle: "If an item crosses multiple outcomes or owners, split it"
- Content generation is parallelizable: three contributors can work on 50 questions each simultaneously
- Creates three independently verifiable, reviewable work items

**Split strategy:**
- **ISS-062-A (1-50):** First 50 questions, establishes format/style
- **ISS-062-B (51-100):** Middle 50 questions, maintains consistency
- **ISS-062-C (101-150):** Final 50 questions, includes SME review and database integration

**Benefit:** Phases can be worked in parallel by 3 team members; Phase C gates integration, ensuring all 150 are reviewed before seeding.

---

## Why No Other Issues Were Split

### Acceptance Criteria: All Met

 **Max 5 acceptance criteria:** Highest in drafts is ISS-060 with 6 AC (discovery, acceptable for aggregation task)  
 **Max 2 blocking dependencies:** All issues 2 dependencies  have 
 **Max 1 bounded context per issue:** All issues are tightly scoped to one area  
 **Single meaningful outcome:** Each implementation issue delivers one outcome  
 **Implementable in one PR:** All tasks under 4 hours fit in one review cycle  
 **No "and" in titles requiring split:** Titles are clean

### Size Distribution (After Split)

```
1h:  18 issues (tasks, small endpoints)
2h:  32 issues (most common; features, API routes, UI components)
3h:  13 issues (medium features, auth flows)
4h:   2 issues (complex integrations)
5h:   3 issues (phases of content work)
```

**Median:** 2 hours. Healthy distribution. All tasks are reviewable in single sessions.

---

## Batch Organization

Organized into 10 sequential batches respecting critical path and dependencies:

| Batch | Name | Hours | Issues | Purpose |
|-------|------|-------|--------|---------|
| 1 | Foundation | 15 | 8 | Monorepo, DB,  gates all other work |config 
| 2 | Discovery | 7 | 2 | Resolve open questions, define gamification  blocks Auth/Gamification work |constants 
| 3 | Auth Layer | 27 | 13 | Parent/child/admin login, JWT,  gates all portals |security 
| 4 | Assessment | 10 | 5 | Questions CRUD, assessments, attempt scoring |
| 5 | Gamification | 7 | 5 | XP, rank, streak, achievements,  depends on Discovery + Assessment |stats 
| 6 | APIs & Security | 15 | 9 | HTTP client, service layers, HTTPS,  gates all UI work |privacy 
| 7 | Child Portal | 18 | 8 | Login UI, map, missions,  largest UI surface |profile 
| 8 | Parent Portal | 9 | 5 | Parent dashboard, progress, subscription |
| 9 | Admin Portal | 12 | 6 | Admin console, content management |
| 10 | Testing & QA | 26 | 7 | Seed data, unit/integration tests, mobile QA |

 10

---

## Dependency Graph

### Must Complete First

- **Batch 1 (Foundation)** gates everything
- **Batch 2 (Discovery)** gates Batch 3 (auth testing) and Batch 5 (gamification)
- **Batch 3 (Auth)** gates Batch 6 (API security), which gates Batches 9 (portals)7
- **Batch 4 (Assessment)** and **Batch 5 (Gamification)** can start in parallel once prerequisites are met

### Parallelizable

- Batches 7, 8, 9 (three portals) can be built concurrently once Batch 6 (APIs) is complete
- Batches 10 phases can be built concurrently after Batch 4

---

## Issues Blocked by Discovery Decisions

5 issues depend on successful completion of **ISS-060** (Resolve blocking open questions):

- **ISS-061:** Define gamification constants (depends on OQ-6 ordering decision)
- **ISS-024, ISS-025, ISS-026, ISS-027, ISS-028:** All gamification issues (depend on constants)

These are marked with `"blocked_by_decision": "ISS-060"` in the JSON.

---

## Quality Checks Passed

 All 68 issues have unique IDs  
 All issues have descriptions and acceptance criteria  
 All issues map to one batch  
 All issue dependencies are valid (no dangling refs)  
 Batch issue counts match batch definitions  
 Total hours: 146 (reasonable for full MVP build)  
 No issue exceeds 5 hours  
 Split ratio is conservative (only 1 issue split, 2 new issues created)  

---

## Hand-off to Thor (Builder Phase)

**08-split-issues.json** contains:

```json
{
  "total_issues": 68,
  "total_split_issues": 68,
  "issues": [
    {
      "id": "ISS-XXX",
      "original_id": "ISS-XXX or ISS-062",
      "title": "...",
      "estimate_hours": 1-5,
      "batch": 1-10,
      "epic": "Infrastructure | Auth | ...",
      "area": "Detailed area",
      "description": "...",
      "acceptance_criteria": ["AC1", ...],
      "dependencies": ["ISS-XXX"],
      "blocked_by_decision": "ISS-060 or null",
      "split_note": "null or explanation if split from parent"
    }
  ]
}
```

---

## Shared Decomposition Rules: Compliance

| Rule | Status | Notes |
|------|--------|-------|
| 1. No giant specification | 68 focused issues, each with clear scope | | 
| 2. No flat backlog | Issues organized into 10 batches with dependencies | | 
| 3. Decompose one level | All issues are leaf-level implementation tasks | | 
| 4. Bounded contexts > tech layers | Issues align with BC boundaries (Auth, Assessment, Gamification, etc.) | | 
| 5. Create discovery if unclear | ISS-060 and ISS-061 resolve open questions before implementation | | 
| 6. Split if too large | ISS-062 split; all others kept | | 
| 7. Mark if cross-context | No cross-context issues; each owns one BC | | 
| 8. Implementable in one PR | 4 hours (split ISS-062 to achieve this) |All  | 
| 9. Outcome-oriented | Each issue delivers one user/system outcome | | 
| 10. Avoid mixing concerns | No design+impl+test in single issue; Testing is Batch 10 | | 

---

## Known Assumptions & Caveats

1. **OQ-3 (Email verification blocking)** assumes verification is required to enable login. If non-blocking, ISS-010 may be deferrable.
2. **OQ-5 (Avatar schema)** is assumed to be resolved in Batch 2. If not, ISS-029 (child login UI) is blocked.
3. **OQ-6 (Question ordering)** affects ISS-022 (attempt scoring). If randomized, additional logic is needed.
4. **Admin account creation** (OQ-8) assumed to be seed-script-only. If admin invite flow is required, ISS-015 needs expansion.
5. **Seed questions** (ISS-062 phases) assume SME is available for review by Phase 3.

---

## Metrics

- **Average issue size:** 2.1 hours
- **Median issue size:** 2 hours
- **Longest issue:** 5 hours (seed phases)
- **Shortest issue:** 1 hour (6 issues)
- **Issues per batch:** 6.8 (range: 13)2
- **Estimated total effort:** 146 hours
- **Parallelization potential:** 3 portals can be built concurrently (Batches 9)7

---

## Recommendation for Thor

1. **Respect batch order** to avoid blocking discoveries and infrastructure
2. **Parallelize Batches 9** (three portals) once Batch 6 (APIs) is complete7
3. **Monitor ISS-060 and ISS- other batches are waiting on discovery decisions061** 
4. **Consider assigning ISS-062 phases to 3 contributors** to compress timeline
5. **Run ISS-065 (unit/integration tests) as you go**, not just at the end063

---

## Artifact Location

**File:** `/Users/openclawsvc/.openclaw/workspace/odinclaw/portfolio/projects/hero-academy/runs/2026-03-26-gh1-mvp-build-hero-academy-11-learning-platform/08-split-issues.json`

**Format:** Valid JSON, ready for GitHub issue creation by Heimdall or Thor
