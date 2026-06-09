# xivmitplan — FFXIV Raid Mitigation Planner

## Overview

A web application for FFXIV raid parties to plan mitigation and healing cooldown usage across an encounter timeline. Supports up to 8 characters, loading fight timelines from a catalogue, assigning job-appropriate abilities to mechanic timestamps, and validating that cooldowns are respected (no double-tap within cooldown window, no shared-slot collisions). Auth0 authentication (login required only for saving/sharing). Admin panel for usage stats, user moderation, and fight catalogue management.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router, TypeScript) | SSR, colocated API routes, Vercel-ready |
| Auth | Auth0 (`@auth0/nextjs-auth0` v4) | BFF proxy pattern, auto-mounts auth routes |
| Database | Prisma ORM + SQLite (dev) / PostgreSQL (prod) | relational data model, type-safe queries |
| UI | Tailwind CSS v4 + shadcn/ui | utility-first, accessible components |
| Icons | lucide-react | shadcn default, lightweight |
| Charts | recharts | for admin stats |
| State | React hooks + URL params | plan state lives in URL; no heavy state lib needed |
| Hosting | Vercel | zero-config Next.js deployment |

---

## Data Model (Prisma)

User
  id          String   @id @default(cuid())
  auth0Id     String?  @unique
  email       String?
  displayName String?
  role        Role     @default(USER)     // USER | ADMIN
  bannedAt    DateTime?
  createdAt   DateTime
  plans       Plan[]
Fight
  id          String   @id @default(cuid())
  slug        String   @unique            // "m4s"
  name        String                      // "M4S - Wicked Thunder"
  patch       String                      // "7.05"
  bossName    String                      // "Wicked Thunder"
  expansion   String                      // "Dawntrail"
  tier        String                      // "AAC Light-heavyweight"
  timestamps  Json                        // {time: 30, label: "Raidwide", type: "raidwide"}, ...
  icon        String?
  createdAt   DateTime
  plans       Plan[]
Job
  id       String     @id                 // "PLD", "WHM", etc.
  name     String                         // "Paladin", "White Mage"
  role     RoleName                       // TANK | HEALER | MELEE | RANGED | CASTER
  iconUrl  String?
Ability
  id          String      @id @default(cuid())
  name        String                      // "Reprisal"
  cooldown    Int                         // seconds
  duration    Int?                        // seconds (effect window)
  description String?
  jobId       String?                     // null = role-wide
  role        RoleName?                   // null = job-specific
  category    Category                    // MITIGATION | HEALING | SHIELD | INVULN | PERSONAL
  sharedSlot  SharedSlot?                 // REPRISAL | FEINT | ADDLE | RANGED | null (unique)
  createdAt   DateTime
  jobs        Job[]
Plan
  id            String   @id @default(cuid())
  title         String?
  shareId       String?  @unique
  fightId       String
  userId        String?
  createdAt     DateTime
  updatedAt     DateTime
  characters    PlanCharacter[]
  events        PlanEvent[]               // orphan events (no character slot)
  fight         Fight     @relation(fields: fightId, refs: id)
  user          User?     @relation(fields: userId, refs: id)
PlanCharacter
  id          String       @id @default(cuid())
  planId      String
  jobId       String
  label       String?
  slotIndex   Int                        // 0-7
  plan        Plan         @relation(fields: planId, refs: id)
  job         Job          @relation(fields: jobId, refs: id)
  events      PlanEvent[]
PlanEvent
  id                String        @id @default(cuid())
  planCharacterId   String?       // null if it's an orphan/role-mit event
  planId            String?       // for orphan events
  timestampIndex    Int           // index into fight.timestamps[]
  abilityId         String
  note              String?
  planCharacter     PlanCharacter? @relation(fields: planCharacterId, refs: id)
  plan              Plan?          @relation(fields: planId, refs: id)
  ability           Ability        @relation(fields: abilityId, refs: id)
Enums:
  RoleName    = TANK | HEALER | MELEE | RANGED | CASTER
  Role        = USER | ADMIN
  Category    = MITIGATION | HEALING | SHIELD | INVULN | PERSONAL
  SharedSlot  = REPRISAL | FEINT | ADDLE | RANGED
  EventType   = RAIDWIDE | TANKBUSTER | STACK | SPREAD | KNOCKBACK | ADD_PHASE | ENRAGE | OTHER

---

## Routes

### Pages (App Router)

| Route | Auth | Purpose |
|---|---|---|
| `/` | None | Landing page + create plan CTA |
| `/plan/new` | None | Create new plan (fight select, party, timeline) |
| `/plan/[id]` | None | Edit existing plan |
| `/s/[shareId]` | None | View shared plan (read-only) |
| `/admin` | Admin | Stats dashboard |
| `/admin/users` | Admin | User list + moderation |
| `/admin/fights/new` | Admin | Add new fight to catalogue |
| `/admin/fights/[id]` | Admin | Edit fight timestamps |
| Auth routes | Auto | `/auth/*` mounted by Auth0 SDK |

### API Routes

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/api/fights` | None | List all fights |
| GET | `/api/fights/[id]` | None | Fight with timestamps |
| GET | `/api/jobs` | None | All jobs with their abilities |
| POST | `/api/plans` | Optional | Create plan (attach user if logged in) |
| GET | `/api/plans/[id]` | None | Get plan with relations |
| PUT | `/api/plans/[id]` | None | Update plan (ownership check optional) |
| PUT | `/api/plans/[id]/share` | Required | Generate shareId |
| POST | `/api/plans/[id]/fork` | None | Fork a shared plan as new anonymous plan |
| GET | `/api/admin/stats` | Admin | Usage statistics |
| GET | `/api/admin/users` | Admin | List users |
| PATCH | `/api/admin/users/[id]` | Admin | Update role/ban status |
| POST | `/api/admin/fights` | Admin | Create fight |
| PUT | `/api/admin/fights/[id]` | Admin | Update fight |
| DELETE | `/api/admin/fights/[id]` | Admin | Delete fight |

---

## Auth Flow

### First-user admin provisioning
- Auth callback handler: `GET /api/auth/callback` (intercepted via middleware)
- On first successful login: query `User` count; if 0, create user with `role: ADMIN`
- Subsequent logins: create user if `auth0Id` not found, default `role: USER`

### Middleware shield
`src/middleware.ts`:
1. Run Auth0 proxy for all routes
2. Public whitelist: `/`, `/plan/*`, `/s/*`, `/api/fights`, `/api/jobs`, `/api/plans` (GET only), `/auth/*`
3. Protected: all other `/api/*` routes → require session
4. Admin: all `/admin/*` pages → require session + user.role === "ADMIN"
5. Ban check: on any authenticated request, check `user.bannedAt` → 403

### Save & Share flow
Anonymous creates plan → plan saved with no userId
Clicks "Save & Share" → redirected to Auth0 /auth/login
After login → redirected back to /plan/id
Backend: if session exists, attaches userId to plan
Can now call PUT /api/plans/id/share → generates shareId
Copies /s/shareId URL to clipboard

### Viewing shared plans
Viewer opens /s/shareId
GET /api/plans/shareId by shareId (not plan id)
Returns plan data with characters + events
Renders read-only timeline grid
"Fork this plan" button → POST /api/plans/id/fork → creates new anonymous copy

---

## Cooldown Validation Engine

`src/lib/cooldown-validator.ts`

### Logic
For each character in plan (sorted by slotIndex):
  For each event assigned to character (sorted by timestampIndex):
    ability = event.ability
    currentTime = fight.timestampsevent.timestampIndex.time
    lastUsed = lastUsedMapcharacter.id || -Infinity
    if currentTime - lastUsed < ability.cooldown:
      violation = { type: "COOLDOWN", message: "...", time, character, ability }
    lastUsedMapcharacter.id = currentTime
Check sharedSlot collisions:
  For each shared slot group (REPRISAL, FEINT, ADDLE, RANGED):
    Collect all abilities with this sharedSlot activated at current time
    If count > 1:
      violation = { type: "SHARED_SLOT", message: "...", time, conflicting: [...] }

### Return type
```ts
type ValidationIssue = {
  type: "COOLDOWN" | "SHARED_SLOT" | "MISSING"
  severity: "ERROR" | "WARNING"
  message: string
  timestampIndex: number
  timestampLabel: string
  time: number
  character?: { id: string, label: string, job: string }
  ability?: { id: string, name: string }
  conflicting?: { character: string, ability: string }[]
}
UI integration
- Real-time validation on every timeline change (debounced 300ms)
- Timeline grid cells color-coded:
- Green = valid assignment
- Red = violation (with tooltip explaining why)
- Gray = unassigned
- Validation panel (sidebar or bottom drawer) lists all issues grouped by timestamp
- Cooldown Gantt chart: horizontal bars showing each ability's active window, overlapping per character row
Seed Data
Fights (12 total — all Dawntrail savage)
AAC Light-heavyweight (7.05):
- M1S — Black Cat (9 mechanics, ~450s)
- M2S — Honey B. Lovely (7 mechanics, ~480s)
- M3S — Brute Bomber (7 mechanics, ~480s)
- M4S — Wicked Thunder (8 mechanics, ~600s)
AAC Cruiserweight (7.2):
- M5S — Dancing Green (7 mechanics)
- M6S — Sugar Riot (7 mechanics)
- M7S — Brute Abombinator (8 mechanics)
- M8S — Howling Blade (8 mechanics)
AAC Heavyweight (7.4):
- M9S — Vamp Fatale (7 mechanics)
- M10S — Red Hot and Deep Blue (7 mechanics)
- M11S — The Tyrant (8 mechanics)
- M12S — Lindwurm (8 mechanics, multi-phase)
Each fight has 7-12 timestamp entries like:
{ time: 0,   label: "Pull",               type: "OTHER" }
{ time: 15,  label: "Quadruple Crossing",  type: "RAIDWIDE" }
{ time: 40,  label: "Biscuit Maker",       type: "TANKBUSTER" }
{ time: 75,  label: "Nine Lives",          type: "RAIDWIDE" }
...
Jobs (21 total — all level 100 jobs)
TANKS: PLD, WAR, DRK, GNB
HEALERS: WHM, SCH, AST, SGE
MELEE: MNK, DRG, NIN, SAM, RPR, VPR
RANGED: BRD, MCH, DNC
CASTER: BLM, SMN, RDM, PCT
Each job seeded with 4-8 abilities including cooldowns, durations, categories, shared slots.
Shared slot rules (do not stack)
- REPRISAL: PLD, WAR, DRK, GNB
- FEINT: MNK, DRG, NIN, SAM, RPR, VPR
- ADDLE: BLM, SMN, RDM, PCT
- RANGED: BRD (Troubadour), MCH (Tactician), DNC (Shield Samba)
Admin Panel
Stats page (/admin)
┌──────────────────────────────────────┐
│  Total Plans: 1,247                  │
│  Total Users: 384                    │
│  Anonymous Plans: 863                │
│  Plans Today: 12                     │
├──────────────────────────────────────┤
│  Plans per Fight (bar chart)         │
│  ┌────────────────────────────────┐  │
│  │ M4S ████████████████  312     │  │
│  │ M2S ████████████     248     │  │
│  │ M1S ███████████      220     │  │
│  │ ...                           │  │
│  └────────────────────────────────┘  │
│                                      │
│  Plans per Day (line chart, 30d)    │
│  ┌────────────────────────────────┐  │
│  │ ╱╲    ╱╲    ╱╲               │  │
│  │╱  ╲  ╱  ╲  ╱  ╲              │  │
│  └────────────────────────────────┘  │
│                                      │
│  Active Users (7d): 47              │
└──────────────────────────────────────┘
Users page (/admin/users)
Table columns: Avatar, Name, Email, Role, Plans, Created, Actions
Actions: Promote to Admin / Demote to User, Ban / Unban
Fights editor (/admin/fights/new, /admin/fights/[id])
Form fields: Name, Slug, Patch, Boss Name, Expansion, Tier (select/dropdown)
Timestamp builder:
- Dynamic list of timestamp rows: Time (seconds) + Label + Type (dropdown: RAIDWIDE/TANKBUSTER/STACK/SPREAD/KNOCKBACK/ADD_PHASE/ENRAGE/OTHER)
- Add row / Remove row buttons
- Bulk import: paste JSON array
- Total fight duration auto-calculated from last timestamp
Project File Tree
xivmitplan/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── plan/
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── s/
│   │   │   └── [shareId]/
│   │   │       └── page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   └── fights/
│   │   │       ├── new/
│   │   │       │   └── page.tsx
│   │   │       └── [id]/
│   │   │           └── page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── callback/
│   │       │   │   └── route.ts     (handles first-user admin)
│   │       │   ├── login/
│   │       │   │   └── route.ts
│   │       │   ├── logout/
│   │       │   │   └── route.ts
│   │       │   └── [...auth]/
│   │       │       └── route.ts
│   │       ├── plans/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── share/
│   │       │       │   └── route.ts
│   │       │       └── fork/
│   │       │           └── route.ts
│   │       ├── fights/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       ├── jobs/
│   │       │   └── route.ts
│   │       └── admin/
│   │           ├── stats/
│   │           │   └── route.ts
│   │           ├── users/
│   │           │   ├── route.ts
│   │           │   └── [id]/
│   │           │       └── route.ts
│   │           └── fights/
│   │               ├── route.ts
│   │               └── [id]/
│   │                   └── route.ts
│   ├── components/
│   │   ├── ui/               (shadcn components)
│   │   ├── navbar.tsx
│   │   ├── plan/
│   │   │   ├── fight-selector.tsx
│   │   │   ├── party-roster.tsx
│   │   │   ├── character-card.tsx
│   │   │   ├── timeline-grid.tsx
│   │   │   ├── ability-selector.tsx
│   │   │   ├── cooldown-gantt.tsx
│   │   │   └── validation-panel.tsx
│   │   └── admin/
│   │       ├── stats-panel.tsx
│   │       ├── user-table.tsx
│   │       └── fight-editor.tsx
│   ├── lib/
│   │   ├── auth0.ts
│   │   ├── prisma.ts
│   │   ├── cooldown-validator.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   └── middleware.ts
├── public/
├── .env.example
├── .gitignore
├── components.json          (shadcn config)
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
Implementation Order (13 Steps)
#	Step	Files
1	Scaffold	—
2	Prisma schema + seed	prisma/schema.prisma, prisma/seed.ts
3	Auth0 setup	src/lib/auth0.ts, src/middleware.ts, .env.example
4	Libs	src/lib/prisma.ts, src/lib/utils.ts, src/types/index.ts
5	Fight & job APIs	src/app/api/fights/route.ts, src/app/api/jobs/route.ts
6	Plan APIs	src/app/api/plans/route.ts, src/app/api/plans/[id]/route.ts, etc
7	Validator	src/lib/cooldown-validator.ts
8	Landing page	src/app/page.tsx
9	Plan editor	src/app/plan/new/page.tsx, src/app/plan/[id]/page.tsx + all plan components
10	Share flow	Updates to plan APIs + /s/[shareId]/page.tsx
11	Shared view	src/app/s/[shareId]/page.tsx
12	Auth gates + admin provisioning	Auth callback handler, admin guards
13	Admin panel	All /admin/* pages + components
Key UX Decisions
 1. Party roster: max 8 slots, drag-to-reorder (optional), job selection populates available abilities
 2. Timeline grid: horizontal scrolling if many timestamps; sticky first column (character names)
 3. Ability selector: filtered by job first, then category tabs (Mitigation / Healing / Shield / Personal / Invuln)
 4. Validation: real-time, debounced; red cells with tooltip; panel shows all issues
 5. Cooldown Gantt: optional toggle; horizontal bars length = ability duration; overlapping bars indicate stacking
 6. Mobile: timeline grid collapses to character-by-character vertical view
 7. Loading states: skeleton screens for fight selector and timeline grid
 8. Error states: "Plan not found", "Share link expired", network error banners
 9. Empty states: "No characters yet — add up to 8", "No abilities assigned — click a cell to pick one"
10. Edge cases: fight with 0 timestamps (prevent selection), plan with 0 characters (show roster prompt), ability with 0s cooldown (always available), sharedSlot collision detected mid-fight (red cells at conflicting timestamps)
