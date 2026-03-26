# UX Design — Hero Academy MVP

**Author:** Baldr  
**Date:** 2026-03-26  
**Status:** Draft  
**Scope:** MVP — three portals, single subject (Mathropolis), mobile-first

---

## UX Constraints

---

## Primary Actors

### 1. Hero Recruit (Child, 8–10 years old)
- Primary user of the Child Portal
- Plays on a shared family device (phone or tablet), unsupervised during sessions
- Low reading stamina; responds strongly to visual reward, animation, and progress feedback
- Motivated by badges, ranks, and visible progress
- Cannot be expected to remember a username or email — PIN + avatar selection is the authentication model
- **Design imperative:** Every interaction must feel like a game, not a test

### 2. Parent / Guardian
- Creates the account and manages child profiles
- Monitors progress via the Parent Portal dashboard
- Motivated by insight into strengths, weaknesses, and streak consistency
- Visits infrequently (1–3×/week) — needs a scannable, data-forward layout
- Manages billing (deferred), PIN resets, and child names
- **Design imperative:** Trust and clarity — no surprises, clear data, easy child management

### 3. Admin
- Internal staff managing content and accounts
- Uses the Admin Portal to create/edit questions, assessments, and manage users
- Desktop-primary workflow; data-dense tables are acceptable
- Low volume of users; no self-serve onboarding
- **Design imperative:** Efficiency over delight — clear CRUD flows, no dead ends

---

## Key Journeys

### J1 — Parent Onboarding + Child Setup

```
Landing page
  → [Sign Up] CTA
    → Email + password registration form
      → Email verification prompt (non-blocking for MVP — assumption: child can be added before verification)
        → Parent Dashboard (empty state)
          → [Add Child] flow:
              Enter child's real name
              → Enter hero name
              → Choose avatar style (6 presets: 3 costumes × 2 masks)
              → Set 4-digit PIN
              → Confirm PIN
            → Child card appears on dashboard
          → Child card → [Play] opens Child PIN login
```

**Key UX decisions:**
- Avatar selection must be visual, not text-based — show the hero graphic at selection size
- PIN confirmation is mandatory to prevent mis-set PINs
- Empty-state dashboard should prompt the parent to add a child immediately
- Assumption: email verification is non-blocking (parent can use the app immediately)

---

### J2 — Child Login + City Entry

```
Child Portal entry (from parent device hand-off)
  → Avatar selection carousel (shows all children on this account)
    → Selected avatar highlighted; hero name displayed
      → 4-digit PIN pad (large digit buttons, no keyboard)
        → Correct PIN → animated transition into City Map
        → Incorrect PIN → shake animation + "Try again" (max 5 attempts before 10-min lockout)
```

**Key UX decisions:**
- PIN pad must use large, touch-friendly buttons (≥ 56px tap target)
- No "show/hide PIN" toggle — each digit shows briefly then masks as ●
- Avatar carousel must distinguish children clearly at a glance (hero name + avatar colour)
- City Map entry should use a satisfying fly-in animation to reinforce the world feel

---

### J3 — City Map Navigation → District Selection

```
City Map (home screen for child)
  → Mathropolis zone visible and active (glowing, inviting)
  → Other zones greyed out with lock icon + "Coming Soon" label
    → Tap Mathropolis
      → Zone zooms in to reveal 5 district buildings
        → Each district shows: district name, completion bar (x/3 missions), star count
        → Locked districts show padlock (unlock by completing prior district — assumption)
          → Tap unlocked district
            → District view: list of 3 missions with star ratings and lock state
              → Tap available mission → Mission Runner
```

**Key UX decisions:**
- City map is the emotional heart of the product — it must feel alive (subtle idle animations, glowing windows)
- Progress visualised on the map itself (colour fill or glow intensity based on completion %)
- First district (Number Tower) is always unlocked; subsequent districts unlock after 2★+ on any prior district mission (assumption — must be confirmed with product)
- "Coming Soon" zones must not be tappable; reduce tap-target confusion with a clear visual treatment
- Back navigation from district view → city map should animate "zoom out"

---

### J4 — Mission Flow (Assessment)

```
Mission selected
  → Mission intro card: title, district, difficulty stars, "Start Mission" button
    → Question 1 of 10:
        Question text (large, legible)
        Power Meter (filling over ~60s — not a countdown pressure mechanic)
        4 answer options (large tap targets, A/B/C/D)
          → Tap answer:
              Correct: green flash on chosen option, power-up animation, brief explanation shown, [Next] button
              Incorrect: red flash on chosen option, correct answer highlighted green, explanation shown, [Next] button
            → Repeat for questions 2–10
    → Mission Complete screen:
        Animated score reveal (x/10)
        Star award animation (1★/2★/3★)
        XP gained + rank progress bar
        New achievements unlocked (if any)
        [Train Again] | [Next Mission] buttons
```

**Key UX decisions:**
- Power meter fills up (not counts down) — reduces anxiety; still creates gentle urgency
- Answer options must be readable at 375px: max 2 lines of text per option, 44px+ tap target
- Feedback must always show the explanation — learning, not just scoring
- "Next" button must not appear before the explanation is visible (≥ 1s delay or explicit dismiss)
- Mission complete screen is the peak reward moment — animate stars one-by-one, show XP ticker
- [Train Again] is always available — retrying to improve stars is a core mechanic
- Assumption: power meter does not auto-advance — child can take as long as needed (timer is cosmetic for MVP)

---

### J5 — Hero Profile

```
Bottom navigation → Hero icon
  → Hero Profile screen:
      Avatar display (full costume)
      Hero name + current rank badge
      XP progress bar (current XP / XP to next rank)
      Stats row: missions completed | avg score | current streak | days played
      Strongest/Weakest district cards
      Achievement badge grid (earned = colour, locked = greyscale + lock)
```

**Key UX decisions:**
- Profile must feel like a trophy room — achievements should be prominent
- Locked achievements should show the achievement name to motivate ("Perfect Power — get 10/10")
- Rank badge should animate subtly (glow/pulse) to reinforce status
- Weakest district card should include a direct [Train Here] CTA — not just data

---

### J6 — Parent Dashboard

```
Parent login
  → Dashboard: children cards (hero name, avatar, rank, streak, last active)
    → Tap child card → Child Detail view:
        Bar chart: topic breakdown (avg score per district)
        Recent activity list (last 5 missions: name, score, stars, date)
        Weak areas flagged with recommendation text
        [Edit Child] (name, hero name, avatar, reset PIN)
    → [Add Child] button (max 4 children — free plan limit shown)
    → [Settings]: account email, password change, logout
```

**Key UX decisions:**
- Parent dashboard is data-first — use a clean card layout, no game chrome
- Progress charts must be readable without interaction (bar chart, not radar)
- "Weak areas" surfacing must use encouraging language: "Fraction Falls needs some hero training!" not "Failed"
- Parent and child portals should have a visual split — same app, distinct aesthetic (game vs. dashboard)
- [Switch to Child View] button on parent dashboard for quick hand-off to child

---

### J7 — Admin Content Management

```
Admin login
  → Admin Console (questions tab default):
      Question list: filterable by topic, difficulty, active/inactive
      [+ New Question]: text, 4 options, correct index, explanation, topic, difficulty
      Edit / soft-delete per row
  → Assessments tab:
      Assessment list: title, topic, difficulty, question count, active
      [+ New Assessment]: title, topic, difficulty, select 10 questions from bank, set order
      Preview assessment (read-only)
  → Users tab:
      Parents list: email, name, plan, status, created date
      Expand row → children list with last active, total XP
      [Suspend] / [Unsuspend] action per parent
```

**Key UX decisions:**
- Admin portal is utility-first — use standard table/form patterns, high information density
- Bulk question view (all questions for a topic on one page) aids content review
- Soft-delete must be clearly labelled; deleted questions should be filterable out by default
- Question preview must render exactly as the child sees it (including option labels A/B/C/D)

---

## Interaction Constraints

### Mobile-First
- All child and parent screens must be fully functional at 375px minimum viewport width
- Admin portal minimum: 768px (desktop-oriented workflow)
- No horizontal scrolling on child or parent portals
- Touch targets: minimum 44×44px; prefer 56×56px for child-facing interactive elements (PIN pad, answer options)
- Bottom navigation bar for child portal (thumb-reachable); top navigation acceptable for parent portal

### Animation Guidelines
- City map fly-in and district zoom use Framer Motion `layoutId` transitions
- Answer feedback (correct/incorrect flash) must complete within 400ms before explanation appears
- Mission complete star animations: stagger reveal, each star 200ms apart
- All animations must respect `prefers-reduced-motion` — provide static fallback
- Power meter fill animation: linear, ~60 seconds full fill (purely cosmetic for MVP)
- Avatar selection: smooth carousel swipe (touch drag + snap)

### Navigation Model (Child Portal)
- Bottom navigation: City Map | Hero Profile | (no more tabs for MVP)
- Back navigation: always a chevron/back button in top-left, never browser back
- No external links from child portal
- Deep-link: parent can hand child directly to a specific mission (future feature — not MVP)

### Forms (Parent + Admin)
- Real-time inline validation (not on submit only)
- Password: show/hide toggle, minimum 8 characters
- PIN: 4 digits, no letters, visual feedback per digit entered
- Error messages: below the relevant field, red, descriptive (not "invalid input")
- Submit buttons: disabled until form is valid

### Loading States
- Skeleton screens for content that takes >300ms to load (city map, district list)
- Spinner on buttons during API calls to prevent double-submit
- Offline state banner if network is unavailable (graceful degradation — show cached state where possible)

---

## Accessibility Expectations

| Expectation | Detail |
|---|---|
| **Colour contrast** | WCAG AA minimum for all text on background. Hero theme colours must be verified against dark backgrounds. Yellow (#fbbf24) on dark requires care. |
| **Font size (child portal)** | Body text ≥ 16px; question text ≥ 18px; answer option text ≥ 16px. No text below 14px in any child-facing UI. |
| **Font size (parent/admin)** | Body text ≥ 14px; form labels ≥ 14px. |
| **Touch targets** | Child portal: 56px minimum. Parent/Admin: 44px minimum. |
| **Focus management** | Keyboard focus must be visible and logical. PIN pad must be keyboard-navigable (admin/parent review paths). |
| **Screen reader support** | All interactive elements must have accessible labels. Avatar images need alt text (hero name + costume description). Achievement badges need descriptive aria-labels. |
| **Reduced motion** | All Framer Motion animations must check `prefers-reduced-motion`. City map transitions and mission complete animations must have static fallbacks. |
| **Colour-only information** | Correct/incorrect feedback must not rely on colour alone — use icons (✓ / ✗) alongside green/red states. |
| **Time pressure** | Power meter is cosmetic, not a hard timeout. Children with processing differences must not be penalised. Assumption: no auto-advance on timer expiry. |
| **Reading level** | Question text must be at 11+ standard but explanation text should be pitched at a slightly lower reading level (Year 5/6) for clarity. |

---

## Non-Goals (MVP)

The following are explicitly out of scope for MVP UX and must not influence design decisions or implementation scope:

- **Stripe billing UI** — No subscription upgrade flow, no payment screens, no billing history for MVP. Parent dashboard may show plan label (Free) but with no upgrade CTA yet.
- **Sound effects** — Audio toggle and SFX implementation deferred. No audio design decisions needed.
- **Adaptive difficulty** — Questions are not dynamically adjusted per child performance. Fixed difficulty per assessment.
- **Extended avatar customisation** — Only 6 preset hero styles (3 costumes × 2 masks). No colour picker, accessory selection, or custom emblem for MVP.
- **Offline / PWA mode** — No service worker, no offline caching, no install-to-homescreen prompt.
- **Multiple subjects** — Only Mathropolis. Other zones (Wordsworth Tower, Logic Labs, Pattern HQ, Story Forge) are visible on the city map but locked and non-interactive.
- **Drag-and-drop question builder** — Admin question management is form-based only.
- **Notifications / push** — No email notifications, no push, no streak reminder emails.
- **Leaderboards** — No social comparison features.
- **Parent approval workflow** — Parent portal is read-only for child progress (no approval required).

---

## Open Questions

| # | Question | Impact | Assumption Made |
|---|---|---|---|
| UX-OQ-1 | Does incorrect PIN result in a lockout, or is it unlimited retries? | PIN pad feedback states | Assumed: 5 attempts → 10-min lockout. Needs product confirmation. |
| UX-OQ-2 | Does district unlocking require completing prior districts, or is it XP-gated? | City map and district lock visuals | Assumed: prior district must have ≥1 mission completed to unlock next. Needs product rule. |
| UX-OQ-3 | Does the power meter auto-advance to next question on expiry, or is it purely cosmetic? | Mission runner interaction model | Assumed: cosmetic only (no auto-advance) to avoid anxiety for SEN learners. High impact if changed. |
| UX-OQ-4 | Can a child replay a mission immediately, or is there a cooldown? | Mission complete screen CTA design | Assumed: no cooldown — retry is always available. |
| UX-OQ-5 | Is the parent portal accessible to children (no forced hand-off flow)? | Navigation architecture | Assumed: separate URL paths (`/parent`, `/child`) with no shared navigation. |
| UX-OQ-6 | What happens when a parent has 0 children on their account? | Empty state design | Assumed: empty state with prominent [Add Child] CTA and brief onboarding copy. |
| UX-OQ-7 | Should the city map display all zones (with lock state), or only reveal zones as new ones become available? | Map visual design | Assumed: all 5 zones always visible, greyed/locked. Creates aspiration and anticipation. |
| UX-OQ-8 | Is there a "log out" action available to the child, or does the session just expire? | Child portal navigation | Assumed: child has a [Home] button that returns to PIN screen (does not invalidate token). Token expires after 2h inactivity. |
| UX-OQ-9 | Avatar config JSON schema — what fields are needed? | Avatar selection UI + Hero Profile | Assumed: `{ costume: 1-3, mask: 1-2 }`. Must be confirmed before avatar components are built. |
| UX-OQ-10 | Should the parent portal show a "switch to child view" button to hand off to a specific child? | Parent dashboard UX | Assumed: yes — a [Play as Hero] button on each child card that routes to child PIN screen pre-selecting that child's avatar. |

---

## UI Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| City map animation causes jank on low-end Android | Medium | High (core engagement screen) | Use Framer Motion `layoutId` carefully; test on Chrome DevTools mobile throttle; provide `prefers-reduced-motion` fallback |
| Answer option text overflow at 375px | Medium | Medium (broken layout) | Cap option text at 2 lines; use CSS `line-clamp`; admin question form should warn if option text exceeds ~60 chars |
| PIN pad usability for 8-year-olds | Low | High (login blocker) | Large digits (≥ 56px), clear visual feedback per digit, "delete last digit" button prominent |
| Colour-only feedback misread (colour blindness) | Low | High (accessibility) | Add ✓/✗ icons alongside green/red; test with colour-blindness simulation |
| Parent portal information overload | Low | Medium | Prioritise score + streak on summary cards; detail behind a tap; avoid chart-on-chart layouts |
| Admin form field count per question (text + 4 options + explanation) | Low | Low | Use a vertical stacked form with clear labels; add character count hints |
