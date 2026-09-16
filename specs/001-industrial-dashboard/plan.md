# Implementation Plan: Ceramic and Tile Industrial Dashboard V1

**Branch**: `001-industrial-dashboard` (feature identifier reported by setup; no Git branch created)
| **Date**: 2026-09-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-industrial-dashboard/spec.md`

## Summary

Deliver an internal bilingual catalog and room-visualization application with approved user
registration, fixed role boundaries, email recovery, product/image management, three-currency
price display, and durable generation history. SUPER_ADMIN alone changes exchange rates,
assigns roles, views all history, and deletes visualization sessions.

Use a Next.js frontend, modular NestJS API, and a separate Nest worker sharing backend services.
PostgreSQL via Prisma owns application state; private file adapters own binaries. Image generation
and SMTP sit behind domain interfaces. Accept requests transactionally, perform external work
outside requests, and preserve immutable input references until authorized session deletion.

Phase 0 decisions: [research.md](research.md). Phase 1 design: [data-model.md](data-model.md),
[REST contracts](contracts/rest-api.md), [integration contracts](contracts/integrations.md),
[UI contract](contracts/ui.md), and [quickstart.md](quickstart.md).

## Technical Context

**Language/Version**: TypeScript strict, Node.js 22 LTS. Lock compatible patches at bootstrap.

**Primary Dependencies**: NestJS 11, Next.js 16 App Router, React 19, Tailwind CSS 4,
Prisma ORM 7 with its PostgreSQL driver adapter, class-validator/class-transformer, Argon2,
decimal arithmetic, Sharp, Nodemailer; provider SDK restricted to the image adapter.
pnpm workspace. Backend owns generated OpenAPI definitions and shared transport types.

**Storage**: PostgreSQL 17 through Prisma only; private local files in development,
S3-compatible private object storage in production. Persistent jobs, mail outbox, and rate-limit
buckets also use PostgreSQL. No Redis or second ORM.

**Testing**: Jest/Supertest API tests with real disposable PostgreSQL, Vitest/Testing Library
client tests, Playwright/axe end-to-end checks, deterministic provider and SMTP capture, and
separate real-provider business review. ESLint and strict type checks are separate build gates.

**Target Platform**: Linux containers for web/API/worker; desktop/tablet browsers. Chromium,
Firefox, WebKit CI projects; browser floor Chrome/Edge 111, Firefox 128, Safari 16.4.
Persian RTL and English LTR, 1440×900 and 1024×768 primary, 390×844 narrow-screen smoke check.

**Project Type**: Full-stack internal web application; modular monolith with a worker entrypoint.

**Performance Goals**: At 10,000 products / 50 active users, p95 search/filter ≤2s and
dashboard/history ≤3s; accepted generation status visible ≤2s; terminal attempt by ten minutes
including queue time. SC-006: 24/30 first-attempt cases meet all visual criteria with reviewer
agreement. These are targets to verify, not completed measurements.

**Constraints**: Separate frontend/backend; server-side permissions on every protected request;
only four fixed roles; private no-store media; one active generation per user; 10 product images,
10 MiB and 25MP per image, minimum 256px each dimension. One room image and one product per
selected floor/wall surface. No automatic history expiry. All configuration externalized.

**Scale/Scope**: Single business, eight journeys, 36 functional requirements and nine success
criteria including five clarified decisions. No ecommerce, ERP, warehouse automation, native
apps, AR/3D, automatic FX feed, or editable role definitions.

## Constitution Check

Gate evaluated before research and re-evaluated after Phase 1: **PASS at design level**.
This is not implementation/test approval. No constitutional exception is required.

| Principles | Pre-research gate | Post-design evidence |
| --- | --- | --- |
| I Architecture | PASS: web cannot query persistence | REST-only frontend; module-owned services and worker |
| II Type safety | PASS: strict TypeScript and contracts | DTO validation, decimal strings, generated client types |
| III Authentication | PASS: backend fixed-role/ownership checks | Current account/session checks; rotation, CSRF, reset consumption |
| IV Database | PASS: Prisma only and migrations | FKs, unique keys, partial indexes, transactions and revision checks |
| V API | PASS: versioned REST | `/api/v1`, envelopes, error codes and endpoint policy table |
| VI Security | PASS: least privilege and private files | Boundary validation, no token logs, rate limits, context-scoped media |
| VII Images | PASS: storage isolated from domain | Asset/reference model; private adapters; cleanup reconciliation |
| VIII AI | PASS: provider interface and durable attempts | Atomic accept, leased worker, immutable inputs, fenced terminal updates |
| IX Frontend | PASS: focused components and typed data access | Server/client responsibilities and one fetch layer |
| X UX | PASS: Material principles, responsive/accessibility | In-place locale switch, logical CSS, keyboard reordering, state matrix |
| XI Errors | PASS: safe central mapping | Localized error codes, retry/idempotency and preserved drafts |
| XII Testing | PASS: critical-flow strategy | Quickstart maps auth/catalog/images/generation to executable test scripts |
| XIII Quality | PASS: no speculative services | Explicit module boundaries; no generic repositories or workflow platform |
| XIV Configuration | PASS: external configuration | Planned `.env.example`, validated secrets, no public provider keys |
| XV Observability | PASS: structured safe context | Correlation IDs, audit changes, job/mail/cleanup metrics and redaction |
| XVI Performance | PASS: bounded reads and background work | Pagination/indexes, leases, stateless app replicas, object storage |
| XVII Done | PASS: required gates identified | Typecheck/lint/build/tests/docs plus real-provider release evidence |
| XVIII Tradeoffs | PASS: security/correctness first | Fail uncertain provider calls instead of duplicate generation; exact money |

## Project Structure

### Documentation (this feature)

```text
specs/001-industrial-dashboard/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── rest-api.md
│   ├── integrations.md
│   └── ui.md
└── checklists/requirements.md
```

`tasks.md` is produced by the next `$speckit-tasks` command, not by this planning phase.

### Source Code (repository root)

Proposed implementation layout; these directories are not created by planning:

```text
apps/
├── web/src/
│   ├── app/                   # Fixed route identities, layouts, server read views
│   ├── features/              # auth, users, products, visualization, pricing
│   ├── components/            # Material-inspired accessible primitives
│   ├── i18n/                  # en/fa dictionaries and persistent locale provider
│   └── lib/api/               # Typed REST transport, errors, CSRF, refresh
├── api/src/
│   ├── modules/               # identity, catalog, pricing, media, visualization, audit
│   ├── infrastructure/        # Transport bindings for backend adapters
│   └── common/                # Guards, validation, exception filter, logging
└── worker/src/                # Job runner using backend services; no duplicate domain logic
packages/
├── backend/                   # Domain modules + Prisma/jobs/storage/provider/mail adapters
└── contracts/                 # Generated REST types and public enums; no Prisma exports
prisma/                       # Schema, migrations, fixture/bootstrap entrypoints
infra/                        # Local compose: Postgres, Mailpit, optional object-store emulator
scripts/                      # Contract verification and safe administrator bootstrap
tests/                        # Cross-application validation
```

**Structure Decision**: pnpm workspace; modules in `packages/backend` own domain/application
services and Prisma access, API modules bind transport to those services, worker invokes the
same service interfaces. Infrastructure adapters are backend-only and dependency-injected.
The root `tests/` directory contains cross-application e2e, concurrency, and load scenarios.
No web import of backend implementation packages is permitted; enforce this in lint rules.

## Complexity Tracking

No constitution violations. The dedicated worker and persistent job/outbox tables are required
by the ten-minute asynchronous workflow, email delivery, and safe cleanup. Parameterized queue
locking SQL through Prisma is a narrow documented use, not a second database access layer.
