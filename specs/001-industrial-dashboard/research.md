# Research: Industrial Dashboard V1

Date: 2026-09-15. Scope: implementation decisions for [spec.md](spec.md), governed by
[constitution.md](../../.specify/memory/constitution.md). Research is design evidence, not a
claim that the application or third-party services have been tested.

## 1. Runtime and application boundaries

**Decision:** Node.js 24 LTS, strict TypeScript, Next.js 16 App Router with React 19 and
Tailwind CSS 4; NestJS 11 backend; PostgreSQL 17 and Prisma ORM 7. Pin compatible patch
versions and the package manager in the implementation lockfile. Use a pnpm workspace with
web, API, and worker applications. The worker uses backend application services; it is not a
separate business service. Browser and server-rendered frontend data access both use REST.

**Rationale:** Meets the mandated stack with three runtime roles and one domain implementation.
Prisma 7 is an explicit compatibility baseline: current unversioned documentation also covers
ORM 8, whose APIs must not be mixed into this implementation. PostgreSQL 17 is a deliberate
supported baseline rather than a claim to be the newest release.

**Alternatives considered:** Microservices and additional databases increase operational cost;
frontend Prisma access violates the constitution; adopting a new ORM API during bootstrap adds
avoidable integration uncertainty.

**Sources:** [Node releases](https://nodejs.org/en/about/previous-releases),
[Next installation](https://nextjs.org/docs/app/getting-started/installation),
[Prisma 7 transactions](https://docs.prisma.io/docs/orm/v7/prisma-client/queries/transactions).

## 2. Authentication, revocation, and fixed-role policies

**Decision:** JWT access cookie (15-minute lifetime) and opaque rotating refresh cookie
(7-day absolute session lifetime), both HttpOnly and Secure in production. Same-origin routing
sends `/api/v1` to NestJS and other paths to Next.js. Apply SameSite=Lax, strict Origin checks,
and a session-bound CSRF token on all browser mutations, including auth mutations with a
pre-auth CSRF context. Access JWTs include session identity, not authoritative permissions.
Every protected operation reads current account status, fixed role, and session revocation.
An explicit public-route annotation is required; everything else is denied without authentication.

Hash refresh verifiers and record consumption/replacement within a session family. Atomic
rotation rejects replay and revokes the family. Serialize refresh across browser tabs; an
unrecoverable ambiguous refresh response requires sign-in, not a replay exception. Server
Components forward cookies only to the configured backend and never rotate refresh tokens.
Browser refresh is single-flight and retries the original safe request once; mutation retries
require their original idempotency key. Do not store authentication tokens in localStorage.

**Rationale:** Cookies allow protected server rendering and media requests, while database
checks satisfy next-action demotion/logout. CSRF controls are necessary for cookie authentication.
ADMIN management is limited to USER accounts; only SUPER_ADMIN assigns fixed roles or views
others' history. Services enforce ownership in addition to guards.

**Alternatives considered:** In-memory access tokens simplify CSRF for bearer requests but
complicate server rendering/private images. JWT roles alone leave stale privileges. Mutable
permission editing contradicts the confirmed scope.

**Sources:** [Nest authorization](https://docs.nestjs.com/security/authorization),
[RFC 9700 refresh protection](https://www.rfc-editor.org/rfc/rfc9700.html#name-refresh-token-protection),
[OWASP CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

## 3. Password reset and email

**Decision:** Argon2id, at least 19 MiB memory, two iterations, parallelism one; calibrate on
production hardware. Accept 12–128 characters without truncation. Reset tokens are random,
hashed, single-use, and expire 30 minutes from issuance. Replace password, consume links,
and revoke sessions in one transaction; approval/status is unaffected. A new request supersedes
older links. Generic acknowledgements do not disclose account existence.

Use a provider-independent MailService with SMTP adapter and local Mailpit during development.
Enqueue email work transactionally. Only the verifier hash belongs in the reset table; the
outbox's delivery payload is encrypted using a separately configured key, deleted after sending
or expiry, and never logged. Delivery retries must check that the reset is still current and
unexpired. Use a configured trusted frontend URL, not the incoming Host header. Rate limiting
covers request IP and normalized-email hash; recoverable mail failure stays non-disclosing.

**Rationale:** Self-service reset needs reliable delivery but must not leak reusable credentials.
SMTP is sufficient without binding business code to a vendor.

**Alternatives considered:** Admin-set passwords contradict the selected self-service flow;
synchronous-only delivery loses accepted requests on process failure; plaintext durable tokens
unnecessarily expand the secret-storage surface.

**Sources:** [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html),
[OWASP forgot password](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

## 4. Integrity, concurrency, and prices

**Decision:** Prisma is the sole query gateway, including reviewed parameterized raw SQL for
row locking and partial indexes introduced through Prisma migrations. Use normalized unique
email/SKU fields, foreign keys, exact decimal columns, and integer revision fields. Serialize
last-SUPER_ADMIN changes, gallery changes, request acceptance, and deletion/attachment races.
Use bounded transaction retries for serialization errors; never silently retry a stale user
revision. Provider, mail, and object operations never run inside a database transaction.

Represent decimal values as strings at REST boundaries. Compute using decimal arithmetic.
Price numeric(24,2), rate numeric(24,6), dimensions numeric(12,2), stock numeric(24,3).
Reject overflow and excess scale before persistence. IRR and TOMAN base amounts are integral;
USD permits two fractional digits. One TOMAN = 10 IRR; TOMAN is an application code, not ISO.
An immutable rate revision and locked current-rate pointer prevent concurrent overwrite.
Convert directly from base via exact rial value; round half-up only at final presentation.

**Rationale:** Database invariants close race conditions that DTO validation cannot cover.
One current manually managed rate meets the confirmed business rule without market-data services.

**Alternatives considered:** Floating-point money produces rounding drift; mutable rates lose
traceability; ORM-external queue libraries violate the single data-access-layer requirement.

**Sources:** [Nest validation](https://docs.nestjs.com/techniques/validation),
[Prisma transactions](https://docs.prisma.io/docs/orm/v7/prisma-client/queries/transactions),
[PostgreSQL numeric](https://www.postgresql.org/docs/current/datatype-numeric.html).

## 5. Durable asynchronous processing

**Decision:** Use PostgreSQL-backed work rows accessed through Prisma. A Nest standalone
worker claims ready jobs with short transactions and leased rows; heartbeat every 15 seconds,
lease 60 seconds, generation deadline fixed at acceptance + ten minutes. Two provider requests
per worker initially; configurable capacity and pending-work metrics. One active attempt per
owner is enforced by a partial unique index. Acceptance writes snapshots, attempt, and job in
one transaction. HTTP returns 202; clients poll every two seconds while visible.

Use at-least-once job processing with idempotent application transitions, never claim exactly-once
external effects. A persisted dispatch state distinguishes not-sent from possibly-sent work.
Retry only failures known to precede provider acceptance or using provider-supported idempotency.
If a worker loses an uncertain external request and cannot retrieve it, mark failed with an
uncertain-outcome reason; do not automatically bill a second generation. Completion checks the
attempt's state and deadline before attaching its result. A watchdog marks expired attempts
failed; API reads also reconcile elapsed deadlines. Late output is discarded and cleaned up.

**Rationale:** Persistent jobs satisfy navigation/process survival and horizontal worker scaling
without introducing Redis or a second persistence library. The ten-minute deadline includes
queue time. During total infrastructure outage no software can update a screen; reconcile
elapsed deadlines immediately when service returns.

**Alternatives considered:** In-process promises lose work on restart; holding a normal HTTP
request for generation blocks resources; a generic distributed workflow platform is excessive.

**Sources:** [PostgreSQL row locks and SKIP LOCKED](https://www.postgresql.org/docs/current/sql-select.html),
[Prisma transactions](https://docs.prisma.io/docs/orm/v7/prisma-client/queries/transactions).

## 6. File ownership and deletion

**Decision:** Store immutable binaries outside PostgreSQL through StorageService (local private
directory in development, private S3-compatible object bucket in production). Database rows
track validated metadata and explicit relational references. All browser image delivery passes
through an authorized Nest route with private/no-store caching; never expose permanent object
URLs or use a public image optimizer. Read authorization checks the requested owning context,
not merely possession of an asset ID.

Uploads enter quarantine; validate actual content, decode dimensions/animation, enforce limits,
strip metadata from display/provider copies, and promote only valid images. Original validated
bytes may remain privately retained for provenance; EXIF is not sent to the provider. Hash the
original bytes for product-local duplicate checks. Full-size resizing/derivatives run in the
worker; bounded validation decoding is isolated from the request event loop.

Deletion first tombstones the session in a transaction, blocking all future access and removing
counts; worker cleanup releases references and removes only unreferenced assets. Lock asset
rows when attaching or deleting to prevent concurrent reuse races. Retain a minimal audit
identifier, not removed image content. Expired drafts and abandoned uploads have separate
cleanup; submitted sessions never expire automatically. Backups must respect deletion tombstones
on restore before traffic resumes.

**Rationale:** Historical references survive catalog changes and shared assets survive deletion
of one session. API-mediated access supports immediate revocation instead of waiting for a
presigned link to expire.

**Alternatives considered:** Database blobs couple storage unnecessarily; public buckets violate
privacy; deleting by file path without reference checks corrupts unrelated history.

**Sources:** [OWASP file upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

## 7. Frontend, localization, and verification

**Decision:** Server Components for initial read-only views; focused Client Components for
forms, uploads, status polling, and comparison. One typed fetch layer handles CSRF, errors,
refresh, and idempotency. Locale provider lives above page/form boundaries; switching `fa`/`en`
updates dictionaries and `lang`/`dir` in place, not by remounting a locale route. Cookie persists
anonymous preference and user profile persists authenticated preference. Browser preference
selects Persian when `fa`, otherwise English on first visit. Use CSS logical properties,
bidirectional isolation for SKU/email, and ASCII normalization for Persian/Arabic digits in
numeric input. Calendar defaults to Gregorian with localized labels; currency never follows locale.

Tailwind implements Material-inspired tokens and reusable controls; no second styling framework.
Use a Persian-capable self-hosted font, 48px interaction targets, 4.5:1 body-text contrast,
visible focus, and keyboard alternatives to image drag-reordering. Focusable form-error summaries
complement associated inline errors. No API messages are inserted verbatim into translated UI.

Use Vitest/Testing Library for frontend units, Jest/Supertest for Nest integration, Playwright
for bilingual journeys, axe checks for accessibility, and seeded performance scenarios. API
integration uses real disposable PostgreSQL; deterministic image/mail adapters cover failure
paths. Real provider output is evaluated separately by the spec's 30-case business rubric.

**Rationale:** In-place localization prevents lost form state; a small shared component set
serves both directions. Deterministic integration tests cannot prove visual fidelity.

**Alternatives considered:** Locale route remounting risks draft loss; copying business rules
into pages creates drift; live provider requests in every test are slow and nondeterministic.

**Sources:** [Next server/client components](https://nextjs.org/docs/app/getting-started/server-and-client-components),
[Tailwind compatibility](https://tailwindcss.com/docs/compatibility),
[Playwright testing](https://playwright.dev/docs/intro).
Local UI/UX skill search: “error summary validation”, matching focusable summaries and linked
inline errors; applied only to the interface contract, no generated application UI.

## 8. Initial generation adapter and policy boundaries

**Decision:** Implement an OpenAI Images edit adapter, configurable model default
`gpt-image-2.5-sunburst`, one output, direct multipart image bytes, room first and one reference
per chosen surface. Keep provider types inside the adapter. The prompt is server-owned and
versioned; snapshot model, prompt version, size, quality, input hashes, and effective options.
No persistent provider Files upload or conversation state is needed. Disable implicit SDK retries
for uncertain image calls. Use a deterministic fake adapter until real credentials are configured.

**Rationale:** Current official guidance supports multiple-reference image editing. This is an
initial adapter choice, not an assertion of exact product placement or account availability.
Run SC-006 on actual outputs before release; an equivalent provider can replace this adapter.

**Alternatives considered:** A conversational image API introduces unnecessary conversation
state. Older model examples must not override current capability checks. Automatic provider
failover after an uncertain dispatch could create duplicate paid work and is excluded.

**Sources:** [OpenAI image generation](https://developers.openai.com/api/docs/guides/image-generation),
[OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data),
[Nodemailer SMTP](https://nodemailer.com/smtp),
[Next protected image constraints](https://nextjs.org/docs/app/api-reference/components/image),
[W3C directionality](https://www.w3.org/International/questions/qa-html-dir),
[Material design tokens](https://m3.material.io/foundations/design-tokens/overview).

## Resolution and release dependencies

All technical design questions are resolved above. No user clarification is required to produce
Phase 1 artifacts. Exact dependency patches are locked during bootstrap; no package was installed
as part of planning. Runtime secrets and business provider accounts are deployment inputs.
Before production: verify model access, provider terms/retention applicable to the business,
SMTP delivery, backup recovery, and the 30-case image-quality acceptance benchmark. Show a
versioned provider/privacy notice; do not promise provider deletion based on application deletion.
Planning does not claim those external checks have passed.
