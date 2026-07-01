<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:git-attribution -->

# Git Commit Attribution

When creating commits in this project:

- Use the repository/global git configuration for commit author identity; do not override it with `git commit --author`.
- Do not add co-author trailers unless explicitly requested for a specific commit.
- Follow the repo's existing commit style for the message subject line.
- Never amend or force-push.

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

Managed by a **systemd user service** — runs locally on this machine.

```bash
# Build the Next.js app
pnpm build

# Start/Restart via systemd
systemctl --user restart xivmitplan

# View logs
journalctl --user -u xivmitplan -f

# Monitor
systemctl --user status xivmitplan
```

**Environment variables** are defined in the systemd unit file (`~/.config/systemd/user/xivmitplan.service`):

- `DATABASE_URL` — PostgreSQL connection string (`postgresql://xivmitplan:mitplan_local_dev@localhost:5432/xivmitplan`)
- `APP_BASE_URL` — `http://localhost:3000`
- `AUTH0_SECRET`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` — Auth0 credentials

After deploying code changes:

1. `pnpm build`
2. `systemctl --user restart xivmitplan`

Two other systemd user services run on this machine: `xivarbitrage` and `opencode-web`.

<!-- END:deployment -->
