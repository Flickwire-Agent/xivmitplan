# FFXIV Mitigation Planner

A web application for **Final Fantasy XIV** raid parties to plan mitigation and healing cooldown usage across an encounter timeline. Supports up to 8 characters, loading fight timelines from a catalogue, assigning job-appropriate abilities to mechanic timestamps, and validating that cooldowns are respected (no double-tap, no shared-slot collisions). Auth0 authentication (login required only for saving/sharing). Admin panel for usage stats, user moderation, and fight catalogue management.

## Tech Stack

| Layer     | Choice                                           |
| --------- | ------------------------------------------------ |
| Framework | Next.js 16 (App Router, TypeScript)              |
| Auth      | Auth0 (`@auth0/nextjs-auth0` v4)                 |
| Database  | Prisma ORM v7 + SQLite (dev) / PostgreSQL (prod) |
| UI        | Tailwind CSS v4 + shadcn/ui                      |
| Icons     | lucide-react                                     |
| Charts    | recharts                                         |
| State     | React hooks + URL params                         |
| Hosting   | pm2 (local)                                      |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env
```

Then edit `.env` with your Auth0 credentials (see [Auth0 Configuration](#auth0-configuration) below).

```bash
# 3. Generate Prisma client, run migrations, and seed the database
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed

# 4. Start the development server
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

### Available Scripts

| Script               | Description                                |
| -------------------- | ------------------------------------------ |
| `pnpm run dev`       | Start development server (Turbopack)       |
| `pnpm run build`     | Production build                           |
| `pnpm run start`     | Start production server                    |
| `pnpm run lint`      | Run oxlint                                 |
| `pnpm run format`    | Run oxfmt                                  |
| `pnpm prisma studio` | Open Prisma Studio (GUI for your database) |
| `pnpm prisma:seed`   | Re-seed the database                       |

## Auth0 Configuration

1. Create an Auth0 tenant at [auth0.com](https://auth0.com)
2. Create a **Regular Web Application** and note the Domain, Client ID, and Client Secret
3. Add **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
4. Add **Allowed Logout URLs**: `http://localhost:3000`
5. Generate a **AUTH0_SECRET** (recommended: `openssl rand -hex 32`)
6. Set `APP_BASE_URL=http://localhost:3000`

> **Note**: Auth0 is only required for saving/sharing plans and admin access. The plan editor works fully without authentication.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout (navbar, fonts)
│   ├── plan/
│   │   ├── page.tsx          # Browse plans
│   │   ├── new/page.tsx      # Create new plan
│   │   └── [id]/page.tsx     # Edit existing plan
│   ├── s/[shareId]/page.tsx  # View shared plan (read-only)
│   ├── admin/
│   │   ├── page.tsx          # Stats dashboard
│   │   ├── users/page.tsx    # User moderation
│   │   └── fights/           # Fight catalogue editor
│   └── api/                  # 16 API route handlers
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── plan/                 # Plan editor components
│   └── navbar.tsx
├── lib/
│   ├── auth0.ts              # Auth0 client
│   ├── prisma.ts             # Prisma singleton
│   ├── cooldown-validator.ts # Validation engine
│   └── utils.ts              # Helpers (cn, formatTime, etc.)
└── types/index.ts            # Shared TypeScript types
```

## Features

- **Fight Catalogue** — Timestamped mechanics for 12 Dawntrail savage fights (M1S–M12S)
- **Party Roster** — Build an 8-character party with job selection per slot
- **Timeline Grid** — Assign job-appropriate abilities to mechanic timestamps
- **Cooldown Validation** — Real-time detection of double-tap violations, shared-slot collisions, and missing assignments
- **Share & Fork** — Generate a share link; viewers can fork plans into their own copy
- **Admin Panel** — Usage statistics (recharts), user moderation, fight catalogue management

## Deployment

Managed by **pm2** — runs locally on this machine.

```bash
# Build the Next.js app
pnpm build

# Start/Restart via pm2
pm2 start npm --name xivmitplan -- start
pm2 restart xivmitplan

# View logs
pm2 logs xivmitplan
```

**Environment variables** are injected by pm2 (stored in `~/.pm2/dump.pm2`):

- `DATABASE_URL` — PostgreSQL connection string
- `APP_BASE_URL` — `http://localhost:3000`
- `AUTH0_SECRET`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` — Auth0 credentials

After deploying code changes:

1. `pnpm build`
2. `pm2 restart xivmitplan`

## Database

- **Dev**: SQLite (`./dev.db`) via libSQL driver adapter (zero config)
- **Prod**: PostgreSQL (update `prisma/schema.prisma` datasource)

After schema changes:

```bash
npx prisma migrate dev --name describe_your_change
npx prisma generate
npx prisma migrate deploy   # in production
```

## License

MIT
