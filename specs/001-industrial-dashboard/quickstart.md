# Quickstart and Validation Guide

This repository currently contains specifications/design only. The commands below are the
**required script contract for implementation**, not commands that already work today. The
implementation phase must create them; this planning phase installs nothing and runs no app.
See [REST](contracts/rest-api.md), [integrations](contracts/integrations.md),
[UI](contracts/ui.md), and [data model](data-model.md) rather than duplicating their rules.

## Prerequisites

- Node24 LTS and pinned pnpm; Docker Compose for local PostgreSQL17 and Mailpit.
- Implemented workspace and lockfile matching [plan.md](plan.md), including Prisma7.
- `.env.example` implemented from the integration configuration contract; local secrets generated
  per installation. Fake image provider and local private storage are default in validation.
- Isolated test database/object directory; never run destructive fixtures against production.
- Seed fixtures: four enabled roles, pending/rejected/disabled USER, second enabled SUPER_ADMIN,
  floor-only/wall-only/both-compatible products, inactive/archived/no-image products, valid and
  invalid image fixtures, and two owners' attempts with shared and exclusive references.

## Planned local setup

Run from repository root after implementation:

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
```

Fill local configuration before continuing. Use IMAGE_PROVIDER=fake, local private storage and
Mailpit SMTP. The example must contain placeholders, not working production credentials.

```bash
pnpm infra:up
pnpm db:migrate
pnpm db:seed:dev
pnpm admin:bootstrap
```

`infra:up` runs `docker compose -f infra/compose.dev.yml up -d` for Postgres/Mailpit.
`db:migrate` applies committed Prisma migrations; `db:seed:dev` creates synthetic data only after
confirming a development database. `admin:bootstrap` prompts securely for the first administrator
identity/password, creates it only if no enabled SUPER_ADMIN exists, and does not log secrets.
A separate explicit fixture command provides additional test roles in isolated test environments.

```bash
pnpm dev
```

`dev` starts Next web, Nest API, and worker together. Local web origin is configured (example
http://localhost:3000); same-origin `/api/v1` forwards to the Nest port. Mailpit web UI is normally
http://localhost:8025 in local compose. These are local guide examples, not hardcoded application URLs.
Readiness must succeed for DB/worker; stopping the fake image provider must not block catalog reads.

## Required automated commands

```bash
pnpm typecheck
pnpm lint
pnpm contracts:check
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm build
```

- `typecheck`: strict checks for every package and generated public types.
- `lint`: explicit lint independent of Next build, including forbidden frontend backend/Prisma imports.
- `contracts:check`: generate OpenAPI/types into temporary output and compare expected route/DTO
  inventory with [rest-api.md](contracts/rest-api.md); fail on unreviewed contract drift.
- `test:unit`: currency rounding, eligibility, role policies, translated controls and dictionary parity.
- `test:integration`: real disposable PostgreSQL migrations, API, private-file adapter and jobs;
  deterministic provider/mail; no real paid generation. Includes multi-connection race cases.
- `test:e2e`: Playwright Chromium/Firefox/WebKit, fa/en, desktop/tablet and narrow smoke, axe.
- `build`: production web/API/worker build. No implied lint or test execution.

All commands must return nonzero on failure. The following targeted commands are also required:

```bash
pnpm test:concurrency
pnpm test:load
pnpm test:recovery
```

`test:concurrency` covers race scenarios below. `test:load` seeds10,000 products and simulates50
active users against a production build, recording p95 user-visible delays. `test:recovery` uses
an isolated database/file fixture, never real production data; restarts worker and tests cleanup.

## End-to-end scenarios and expected outcomes

| Scenario | Procedure | Expected evidence |
| --- | --- | --- |
| Registration/approval | Register new email; attempt login; ADMIN approves USER; sign in | Pending cannot access; approval enables USER only; duplicate register acknowledgement safe |
| Role boundaries | Exercise every matrix operation as each role, including direct requests | ADMIN cannot inspect/manage higher roles or others' images; SA can assign roles; no role-definition mutation |
| Revocation | Logout, disable, demote, reset, then use an old session | Next protected action denied or uses new authority; no stale JWT privilege |
| Refresh/reset | Rotate token, replay old; request two reset links in Mailpit; consume new twice | Replay family revoked; older/used links fail; new password works; all old sessions fail; approval unchanged |
| Catalog CRUD | Create invalid then valid; duplicate SKU different case; edit/archive/restore/delete | Field feedback retains data; unique SKU; revision conflicts; restore inactive; used product never hard-deleted |
| Gallery | Upload valid/invalid/duplicate batch; set primary; keyboard reorder; remove primary | Individual results; max10; exactly one primary if nonempty; history references preserved |
| Search | Name/SKU case variants, combined filters, dimensions, picker, back navigation | Matching semantics and fixed eligibility; query state retained; counts scoped |
| FX | Set600000 IRR/USD as SA; enter USD2 product; then change700000 | IRR1200000/TOMAN120000 then1400000/140000; baseUSD2 unchanged; ADMIN rate update denied |
| Missing FX/rounding | Remove rate in test fixture; test IRR↔TOMAN; halfway derived values | USD conversion unavailable, base preserved; final half-up rounding; no binary-float drift |
| Floor/wall generation | Run floor-only, wall-only and both with fake provider | Required eligible selections; one reference/surface; 202 then statuses, result comparison/history |
| Failure/navigation | Fake unavailable/timeout/unknown outcome; leave/refresh; retry | Deadline10min; no indefinite status; preserved draft; new linked attempt only for deliberate retry |
| Duplicate submission | Submit same key twice and changed payload once | Same attempt for same payload, conflict for altered payload; at most one active per user |
| Session deletion | SA deletes terminal session with exclusive and shared assets | Access/counts disappear immediately, shared references work, exclusive files cleaned; active session blocked |
| Bilingual interaction | Switch locale during dirty form/upload/generation; revisit | No lost values/state; lang/dir correct; messages fully translated; currency unchanged |

For each scenario record test name, expected assertion, actual result and artifact (trace/report).
Do not claim completion solely because pages render. Include source references for all36 FRs in
the implemented test inventory; critical tests are required by the constitution.

## Concurrency and failure injection

Use two independent connections/processes, not sequential mocks:

1. Competing last-SUPER_ADMIN demotions/disables: at least one enabled SA remains.
2. Concurrent normalized SKU/email creates: one identity wins without duplicates.
3. Simultaneous 10th/11th image, reorder/primary deletion, and archive/upload attachment:
   gallery invariants remain valid and denied upload does not attach.
4. Concurrent FX edits using same revision: only one succeeds, old base prices unchanged.
5. Concurrent refresh/reset consumption: no two successful consumptions; no privilege bypass.
6. Accept attempt versus session deletion: either accepted active work blocks deletion, or
   tombstone blocks acceptance; never attach to deleted history.
7. Worker crash before dispatch: safe lease reclaim. Crash after uncertain dispatch: FAILED
   OUTCOME_UNKNOWN without automatic duplicate provider call. Late result cannot overwrite timeout.
8. Object deletion failure/restart: access remains denied; cleanup retries; shared assets survive.
9. SMTP failure/retry/superseded token: generic response, current link only, encrypted payload removed.
10. Full DB/worker outage: restore, reconcile elapsed deadlines before exposing active statuses;
    exercise tombstone replay so restored deleted images are not served.

## Performance and real-provider release checks

`test:load` validates SC-004 under the agreed business connection and production build, measuring
usable results rather than only server request duration. Include history/dashboard authorization
and counts. No external provider required to test API concurrency and deadline behavior.

Real image evaluation is a separate explicit operation:

```bash
pnpm validate:images -- --provider openai --cases tests/fixtures/visual-quality/cases.json
```

Implementation must make this command opt-in, show expected case count/provider before submission,
and require configured real-provider credentials. Run only when external generation is authorized;
planning does not execute it. Use30 business-approved cases (10 per mode), first attempt only;
failures count as failures. Three business reviewers independently score the four SC-006 criteria;
at least24 cases require agreement by two reviewers on all criteria. Keep results private and
follow documented retention/deletion. Deterministic tests cannot replace this evidence.

Before release also verify real reset-mail delivery, current provider capability/privacy notice,
TLS/cookie/CSRF behavior, operational alert paths, environment validation, and an isolated restore
drill demonstrating the planned ≤24h recovery point / ≤4h restore targets. Record gaps as release
blockers; no claim of production readiness is made in this plan.

## Stop local environment

```bash
pnpm infra:stop
```

`infra:stop` stops compose services without deleting volumes. Data destruction requires a separate
explicit command and environment check. Do not hide `down -v` inside normal stop/test scripts.
