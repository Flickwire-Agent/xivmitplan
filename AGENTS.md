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

Always run from the project root (`/home/skye/xivmitplan`).
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
npm run test:run

# Run tests in watch mode
npm run test

# Run with coverage
npm run test:coverage
```

Tests are co-located with source files as `*.test.ts` or `*.test.tsx`:
- `src/lib/__tests__/` — pure logic tests (utils, cooldown-validator)
- `src/components/*/__tests__/` — component tests (FightSelector, ValidationPanel)

Run tests before committing to catch regressions.
<!-- END:test-suite -->
