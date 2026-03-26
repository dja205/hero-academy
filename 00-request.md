# MVP: Build Hero Academy — 11+ Learning Platform

> **Invoke Baldr** — This project requires UX design review before proceeding to specification.

# Hero Academy 🦸 — 11+ Learning Platform MVP

## Vision

A superhero-themed 11+ learning platform where 8–10 year olds train as young heroes, travelling across a city of districts to complete interactive assessments and build their powers. Each subject is a **Hero Zone**, and each topic within it is a **District**. Children play as a customisable **Hero Recruit**, earning XP, ranks, and achievements as they progress.

Three portals: **Child** (learning + gameplay), **Parent** (progress tracking + billing), **Admin** (content + payment management).

## Theme & Aesthetic

- **Superhero city** motif — skyline, skyscrapers, rooftops, neon accents
- Vibrant colours on a dark city backdrop (think animated comic book style)
- Each Hero Zone has its own colour palette and visual identity
- Hero Recruit avatar is customisable (costume, mask, cape, emblem)
- Encouraging, empowering tone — "Power Up!", "Mission Accomplished!", "Hero Rank Achieved!"
- Animated transitions between districts (flying/jumping across city)
- Sound effects for interactions (optional, toggleable)
- Mobile-first responsive design

## Core Features

### 1. City Map (Home)
- Interactive city skyline with Hero Zone buildings
- Zones unlock progressively as the child completes assessments
- Each zone = one 11+ subject area:
  - 🔴 **Mathropolis** — Maths (arithmetic, algebra, number sequences)
  - 🔵 **Wordsworth Tower** — English (comprehension, vocabulary, grammar)
  - 🟢 **Logic Labs** — Verbal Reasoning
  - 🟡 **Pattern HQ** — Non-Verbal Reasoning
  - 🟣 **Story Forge** — Creative Writing
- Tapping a zone zooms into its districts (topics)
- Visual progress bar on each zone showing completion %

### 2. Districts & Missions (Assessments)
- Each zone has districts (topics), each district has missions (assessment sets)
- For MVP: Mathropolis only, with 5 districts:
  - 🏢 **Number Tower** — Arithmetic (add, subtract, multiply, divide)
  - 🏗️ **Fraction Falls** — Fractions, decimals, percentages
  - 🏛️ **Shape City** — Geometry (shapes, area, perimeter, angles)
  - 🌉 **Sequence Bridge** — Number sequences and patterns
  - 🏰 **Problem Palace** — Word problems and reasoning
- 3 missions per district for MVP
- **Multiple choice only** for MVP (4 options per question)
- 10 questions per mission
- Instant feedback after each answer:
  - Correct: green flash + power-up animation + brief explanation
  - Incorrect: red flash + correct answer shown + explanation
- Timer as a power meter (fills up, not counts down)
- Mission complete screen:
  - Score out of 10
  - Stars awarded (1★ = 4-6, 2★ = 7-8, 3★ = 9-10)
  - XP gained + rank progress
  - "Train Again" or "Next Mission" buttons
- Can retry missions to improve stars

### 3. Hero Profile
- Customisable hero avatar: choose from 6 preset hero styles (3 costumes × 2 masks)
- Hero name (set by parent at signup)
- Hero rank based on total XP:
  - 0-99 XP: Recruit
  - 100-499 XP: Sidekick
  - 500-1499 XP: Hero
  - 1500+: Superhero
- XP progress bar to next rank
- Stats dashboard:
  - Total missions completed
  - Average score %
  - Current streak (consecutive days)
  - Strongest district (highest avg)
  - Weakest district (lowest avg) with "Train here!" prompt
- Achievement badges (MVP set):
  - 🦸 First Mission — Complete first mission
  - ⭐ Perfect Power — Get 10/10 on any mission
  - 🔥 Hot Streak — 3-day streak
  - 🏙️ District Champion — Complete all missions in one district
  - 🏆 Zone Master — Complete all missions in Mathropolis

### 4. Parent Portal
- Email + password signup/login
- Email verification + password reset
- Dashboard: list of all children with summary cards
- Per-child detail: topic breakdown (bar chart), recent activity, weak areas flagged with recommendations
- Child management: add (name, hero name, avatar, PIN), edit, reset PIN, remove
- Subscription: Free (Mathropolis only, 3 missions/district) vs Hero (£9.99/mo, all content, unlimited, up to 4 children)
- Stripe Checkout + manage/cancel + billing history

### 5. Admin Portal
- Email + password login (admin accounts)
- Question management: list, create, edit, delete (soft), bulk view per topic
- Assessment management: list, create (title, topic, difficulty, select 10 questions), edit, preview
- User management: list parents, view children + progress, suspend/unsuspend
- Payment overview: subscriptions list, revenue summary, payment history, refund links

### 6. Authentication
- Parent: email + password, JWT tokens
- Child: 4-digit PIN + avatar select (no email needed)
- Session: auto-logout after 2 hours inactivity

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion (hero animations, city transitions)
- **State**: Zustand
- **Backend**: Node.js + Express (REST API)
- **Database**: SQLite (via better-sqlite3)
- **Auth**: JWT (access + refresh tokens), bcrypt for passwords
- **Payments**: Stripe Checkout + webhooks
- **Deployment**: Single server (static frontend + Express API)

## Data Model

### parents
| Field | Type |
|-------|------|
| id | TEXT (UUID) |
| email | TEXT (unique) |
| password_hash | TEXT |
| name | TEXT |
| email_verified | BOOLEAN |
| created_at | DATETIME |

### children
| Field | Type |
|-------|------|
| id | TEXT (UUID) |
| parent_id | TEXT (FK) |
| name | TEXT |
| hero_name | TEXT |
| pin_hash | TEXT |
| avatar_config | TEXT (JSON) |
| xp | INTEGER |
| rank | TEXT |
| created_at | DATETIME |

### subjects
| Field | Type |
|-------|------|
| id | TEXT |
| name | TEXT |
| zone_name | TEXT |
| colour | TEXT |
| order | INTEGER |

### topics
| Field | Type |
|-------|------|
| id | TEXT |
| subject_id | TEXT (FK) |
| name | TEXT |
| district_name | TEXT |
| colour | TEXT |
| order | INTEGER |

### questions
| Field | Type |
|-------|------|
| id | TEXT (UUID) |
| topic_id | TEXT (FK) |
| text | TEXT |
| options | TEXT (JSON array of 4 strings) |
| correct_index | INTEGER (0-3) |
| explanation | TEXT |
| difficulty | TEXT (easy/medium/hard) |
| active | BOOLEAN |
| created_at | DATETIME |

### assessments
| Field | Type |
|-------|------|
| id | TEXT (UUID) |
| topic_id | TEXT (FK) |
| title | TEXT |
| difficulty | TEXT |
| question_ids | TEXT (JSON array) |
| order | INTEGER |
| active | BOOLEAN |
| created_at | DATETIME |

### attempts
| Field | Type |
|-------|------|
| id | TEXT (UUID) |
| child_id | TEXT (FK) |
| assessment_id | TEXT (FK) |
| answers | TEXT (JSON) |
| score | INTEGER |
| max_score | INTEGER |
| stars | INTEGER (1-3) |
| xp_earned | INTEGER |
| duration_seconds | INTEGER |
| completed_at | DATETIME |

### subscriptions
| Field | Type |
|-------|------|
| id | TEXT (UUID) |
| parent_id | TEXT (FK) |
| stripe_customer_id | TEXT |
| stripe_subscription_id | TEXT |
| plan | TEXT (free/hero) |
| status | TEXT (active/cancelled/past_due) |
| current_period_end | DATETIME |
| created_at | DATETIME |

### achievements
| Field | Type |
|-------|------|
| id | TEXT |
| child_id | TEXT (FK) |
| achievement_type | TEXT |
| unlocked_at | DATETIME |

## Seed Data (MVP)
- 1 subject (Maths/Mathropolis) with 5 topics/districts
- 3 assessments per district (15 total)
- 10 questions per assessment (150 total) — realistic 11+ standard
- Mix of easy/medium/hard

## MVP Scope
Focus on working end-to-end with one subject:
- Landing page with superhero theme
- Parent auth (signup/login)
- Parent dashboard (basic child management, no billing yet)
- Child PIN login
- City map with Mathropolis zone
- 5 districts with 3 missions each
- Multiple choice assessments with instant feedback
- Basic scoring and star rating
- Hero profile with stats
- Mobile-responsive throughout

Defer: Stripe billing, adaptive difficulty, drag-and-drop questions, sound effects, extended avatar customisation

---
_Source: GitHub Issue #1_
