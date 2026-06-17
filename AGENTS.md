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

<!-- BEGIN:git-discipline -->

# Git Discipline

Commit early and often. Don't batch all changes into one commit. Stage
related changes together, split hunks with `git add -p` when a file contains
multiple unrelated changes.

<!-- END:git-discipline -->

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
