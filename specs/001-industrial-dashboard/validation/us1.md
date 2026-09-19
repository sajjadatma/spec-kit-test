# US1 validation evidence

Date: 2026-09-19

## Environment

- PostgreSQL 17 ran in the development container on `127.0.0.1:5433`, because a separate
  local PostgreSQL already used port 5432.
- Mailpit ran locally on SMTP port 1025 and its inbox on port 8025.
- Browser checks used the installed Google Chrome executable because the Playwright browser
  CDN was unavailable in this environment.

## Passed checks

- Applied Prisma migrations `001_identity_base`, `002_auth_sessions`, and
  `003_request_controls` to the disposable PostgreSQL database.
- Verified the live API: CSRF acquisition; pending registration (`202`); valid pending-login
  denial (`403 PENDING`); approved login (`200`); and authenticated `/auth/me` (`200`).
- Verified a live reset request returned its generic `202` response, stored only encrypted
  outbox content, and was delivered by the worker to Mailpit. The reset link is not retained
  after successful delivery.
- Verified access checks read the active session, account approval/disabled state, and
  authentication version from PostgreSQL on each protected request.
- `vitest run packages/backend/src/identity packages/backend/src/infrastructure/mail
  tests/contracts/auth.spec.ts tests/integration/auth.spec.ts tests/concurrency/auth.spec.ts`
  passed: 10 files, 16 tests.
- `eslint apps packages scripts tests --max-warnings=0` passed.
- Strict TypeScript checks passed for backend, API, web, and worker.
- `pnpm build` passed for all workspace packages and the optimized Next.js application.
- Playwright passed 5 Chromium browser scenarios: pending registration without credential
  leakage, generic English/Persian recovery acknowledgement, Persian layout, and expired
  reset remaining on the recovery page without automatic sign-in.

## US1 result

All Phase 3 / US1 tasks (T019–T033) are complete.
