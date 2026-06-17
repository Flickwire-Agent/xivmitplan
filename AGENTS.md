<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:git-attribution -->

# Git Commit Attribution

When creating or modifying code in this project, you MUST create git commits with proper attribution:

- Set yourself as the author using `git commit --author="Agent <agent@opencode.ai>"`
- Add the current user (Skye Brady <skye@blueskye.co.uk>) as a co-author by including `Co-authored-by: Skye Brady <skye@blueskye.co.uk>` in the commit message body
- Follow the repo's existing commit style for the message subject line
- Never amend or force-push
<!-- END:git-attribution -->

<!-- BEGIN:vercel-cli -->

# Vercel CLI

Installed globally. Available as `vercel` or `vc`.

```bash
# Login (interactive)
vercel login

# Link project to Vercel
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Pull environment variables from Vercel
vercel env pull .env.local

# List deployments
vercel list

# View logs for a deployment
vercel logs <deployment-url>
```

Always run from the project root (`/home/skye/dev/projects/xivmitplan.projects.blueskye.co.uk`).

<!-- END:vercel-cli -->

<!-- BEGIN:auth0-cli -->

# Auth0 CLI

Installed at `/home/skye/.local/bin/auth0` (add to `$PATH` if needed).

```bash
# Login (opens browser for device authorization)
auth0 login

# Create a Regular Web Application
auth0 apps create \
  --name "xivmitplan" \
  --type regular \
  --callbacks "http://localhost:3000/auth/callback,https://<production-url>/auth/callback" \
  --logout-urls "http://localhost:3000,https://<production-url>" \
  --reveal-secrets

# List applications
auth0 apps list

# Show application details
auth0 apps show <app-id>

# Update application
auth0 apps update <app-id> --callbacks "..."

# Tail tenant logs
auth0 logs tail

# Get help
auth0 help
```

After creating an app, use `auth0 apps show <app-id> --json` to get the `client_id` and `client_secret`.

<!-- END:auth0-cli -->

<!-- BEGIN:test-suite -->

# Test Suite

Uses **Vitest** with **@testing-library/react** and **jsdom**.

```bash
# Run all tests once
pnpm run test:run

# Run tests in watch mode
pnpm run test

# Run with coverage
pnpm run test:coverage
```

Tests are co-located with source files as `*.test.ts` or `*.test.tsx`:

- `src/lib/__tests__/` — pure logic tests (utils, cooldown-validator)
- `src/components/*/__tests__/` — component tests (FightSelector, ValidationPanel)

Run tests before committing to catch regressions.

<!-- END:test-suite -->

<!-- BEGIN:deployment -->

# Deployment

Managed by **pm2** — runs locally on this machine.

```bash
# Build the Next.js app
pnpm build

# Start/Restart via pm2
pm2 start npm --name xivmitplan -- start
pm2 restart xivmitplan

# View logs
pm2 logs xivmitplan

# Monitor
pm2 monit
```

**Environment variables** are injected by pm2 (stored in `~/.pm2/dump.pm2`):

- `DATABASE_URL` — PostgreSQL connection string (`postgresql://xivmitplan:mitplan_local_dev@localhost:5432/xivmitplan`)
- `APP_BASE_URL` — `http://localhost:3000`
- `AUTH0_SECRET`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` — Auth0 credentials

After deploying code changes:

1. `pnpm build`
2. `pm2 restart xivmitplan`

Two other pm2-managed apps run on this machine: `xivarbitrage` and `opencode-web`.

<!-- END:deployment -->

<!-- BEGIN:progress-tracker -->

# Progress Tracker

## Goal

Fetch real job/ability icons from XIVApi and display them in the UI.

## Key Constraints

- XIVApi REST API (`https://xivapi.com`) for FFXIV game data lookups
- Tech stack: Next.js 16 (App Router, TS), Auth0 v4, Prisma v7, Tailwind v4, shadcn/ui v4 (Base UI)
- Database: SQLite (`@prisma/adapter-libsql`) local dev, PostgreSQL (`@prisma/adapter-pg`) on Vercel (Neon)
- Auth: Auth0 v4 SDK, tenant `xivarbitrage.eu.auth0.com`
- Git: `--author="Agent <agent@opencode.ai>"` + `Co-authored-by: Skye Brady <skye@blueskye.co.uk>`

## Done

- App scaffolded, built, tested (39 pass), deployed to Vercel (`https://xivmitplan.vercel.app`)
- Seed with 22 fights (M1S–M12S), 21 jobs, 51 abilities; EX/Ult fights retained
- Role-based abilities filtered via `jobId` scalar + `role` field
- Auth-aware navbar, Share button, loading skeletons, ability search/filter, party roster
- 3 commits pushed: `c26afc8` (seed), `a1580f2` (UI+tests), `7067089` (role-based fix)
- **All 51 ability IDs verified with real icons from XIVApi**

## Inferred Ability ID Ranges

- 1–200: ARR base (Hallowed Ground=30, Rampart=10, Sentinel=17, Provoke=18, etc.)
- 3538–3639: HW (Sheltron=3542, Divine Veil=3540, Living Dead=3638, Shadow Wall=3636)
- 7385–7432: SB (Passage=7385, Shake It Off=7388, Troubadour=7405, Divine Benison=7432)
- 7535–7560: ShB role (Reprisal=7535, Feint=7549, Addle=7560)
- 16001–16559: ShB (Shield Samba=16012, Heart of Corundum=25758, Temperance=16536)
- 16889–25875: ShB/EW (Tactician=16889, Magick Barrier=25857, Expedient=25868)
- **34650–34691**: Dawntrail PCT (PvE with real icons in `/i/003000/0038xx.png`)
- 36920: Dawntrail PLD (Guardian)
- 37180–38994: Placeholder/dummy entries (no class links, placeholder icons)
- 39100–39199: Viper actions
- 39200–39216: PCT PvP entries (icons in `/i/009000/0097xx.png`)

## Verified PCT Action Map (346xx — Real PvE IDs)

| ID          | Name                                         | Icon                        | Recast   |
| ----------- | -------------------------------------------- | --------------------------- | -------- |
| 34650       | Fire in Red                                  | /i/003000/003801.png        | 2.5s     |
| 34651       | Aero in Green                                | /i/003000/003802.png        | 2.5s     |
| 34652       | Water in Blue                                | /i/003000/003803.png        | 2.5s     |
| 34653       | Blizzard in Cyan                             | /i/003000/003804.png        | 3.3s     |
| 34654       | Stone in Yellow                              | /i/003000/003805.png        | 3.3s     |
| 34655       | Thunder in Magenta                           | /i/003000/003806.png        | 3.3s     |
| 34656–34661 | AOE II variants                              | /i/003000/003807–003812.png | —        |
| 34662       | Holy in White                                | /i/003000/003813.png        | 2.5s     |
| 34663       | Comet in Black                               | /i/003000/003814.png        | 3.3s     |
| 34664–34669 | Motifs (Pom/Wing/Claw/Maw/Hammer/Starry Sky) | 003815–003820               | 4s       |
| 34670–34673 | Muses (Pom/Winged/Clawed/Fanged)             | 003821–003824               | 40s      |
| 34674       | Striking Muse                                | /i/003000/003825.png        | 60s      |
| 34675       | Starry Muse                                  | /i/003000/003826.png        | 120s     |
| 34676       | Mog of the Ages                              | /i/003000/003827.png        | 30s      |
| 34677       | Retribution of the Madeen                    | /i/003000/003828.png        | 30s      |
| 34678–34680 | Hammer Stamp/Brush/Polishing                 | 003829–003831               | 2.5s     |
| 34681       | Star Prism                                   | /i/003000/003832.png        | 2.5s     |
| 34683       | Subtractive Palette                          | /i/003000/003833.png        | 1s       |
| 34684       | Smudge                                       | /i/003000/003834.png        | 20s      |
| **34685**   | **Tempera Coat**                             | **/i/003000/003835.png**    | **120s** |
| **34686**   | **Tempera Grassa**                           | **/i/003000/003836.png**    | **1s**   |
| 34688       | Rainbow Drip                                 | /i/003000/003838.png        | 6s       |
| 34689–34691 | Creature/Weapon/Landscape Motif              | 003839–003841               | 4s       |

## Next Steps

1. Run `prisma migrate dev` for added `iconUrl` on Ability
2. Update `prisma/seed.ts`:
   - Replace PCT IDs from 389xx → 346xx
   - Add `iconUrl` for all 51 abilities
3. Display icons in `PartyRoster`, `TimelineGrid`, `AbilitySelectorDialog`
4. Verify build, run tests, commit & push

## Relevant Files

- `prisma/schema.prisma` — `Ability.iconUrl` added
- `prisma/seed.ts` — needs ID/icon updates
- `scripts/lookup-abilities.mjs` — batch lookup script
- `src/components/plan/party-roster.tsx` — add icons
- `src/components/plan/timeline-grid.tsx` — add icons
<!-- END:progress-tracker -->
