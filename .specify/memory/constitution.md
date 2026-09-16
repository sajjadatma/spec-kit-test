<!--
Sync Impact Report — temporary review material; remove before committing.
Version change: unratified scaffold → 1.0.0 (initial adoption).
Modified principles: five unnamed template slots replaced with principles I–XVIII below.
Added principles: Architecture; Type Safety; Authentication and Authorization; Database;
API Design; Security; File Storage; AI Integration; Frontend; UI/UX; Error Handling;
Testing; Code Quality; Configuration; Observability; Performance; Definition of Done;
Engineering Decision Hierarchy.
Added sections: Technology and Implementation Constraints; Development and Review Workflow.
Governance populated. Removed sections: none; instructional placeholder comments removed.
Deferred placeholders / follow-up TODOs: none.
Dependent templates and commands unchanged; they read this constitution at runtime.
-->

# Ceramic and Tile Industrial Dashboard Constitution

## Core Principles

### I. Architecture and Separation of Concerns

The Next.js frontend and NestJS backend MUST remain separate application boundaries.
Frontend code, including Server Components and server actions, MUST access application data
through the backend REST API and MUST NOT access PostgreSQL or Prisma directly. Business
logic MUST live in backend application services; controllers MUST handle transport concerns.
Each module MUST own a defined responsibility and expose explicit interfaces. Cross-module
operations MUST use those interfaces rather than another module's internal persistence.

### II. Type Safety

Application code MUST use TypeScript with strict checking. Requests and responses MUST have
explicit contracts and runtime validation at trust boundaries. Untrusted values MUST start
as `unknown` and be narrowed. `any` MUST NOT be used except for a documented, isolated external
integration limitation. Contracts SHOULD be shared or generated to prevent drift; exceptions
MUST explain how consistency is verified. Shared contracts MUST NOT expose persistence models,
secrets, or backend implementation details.

### III. Authentication and Authorization

Registration and login MUST be implemented by backend services. Passwords MUST use a maintained
adaptive password-hashing implementation with unique salts and a documented work factor.
Authentication MUST use short-lived JWT access tokens and expiring refresh tokens with rotation,
revocation, and replay detection. JWT verification MUST enforce allowed algorithms, signature,
expiry, issuer, and audience. Stored refresh-token verifiers MUST be hashed. Browser refresh
tokens MUST use HttpOnly cookies, Secure in production; cookie-authenticated operations MUST
have appropriate CSRF protection. Registration MUST NOT permit self-assigned privileged roles.
Every protected backend operation MUST enforce RBAC and applicable resource permissions,
denying access by default. Frontend guards MUST NOT be treated as security enforcement.

### IV. Database Integrity

PostgreSQL MUST be the primary source of truth for application records. Prisma MUST be the
only database access layer; necessary raw SQL MUST run through Prisma, be parameterized, and
have a documented justification. Schema changes MUST use versioned Prisma migrations.
Relations MUST use appropriate foreign keys, unique constraints, and indexes. Writes requiring
atomicity MUST use transactions. Denormalization MUST have a demonstrated need and a defined
consistency strategy. Migrations MUST account for existing data and document recovery for
potentially destructive changes.

### V. API Design

REST endpoints MUST use resource-oriented names, appropriate HTTP methods and status codes,
and a documented versioning convention permitting future incompatible versions. NestJS DTOs
and a global validation pipe MUST validate requests and reject unexpected fields. Success,
pagination, and error responses MUST follow consistent documented contracts. Errors MUST expose
stable public codes and safe messages, never stack traces or internal database/provider details.
Contract changes MUST be reviewed for client compatibility.

### VI. Security

All external input, including uploads and provider callbacks, MUST be validated. Sensitive
endpoints MUST have rate limits. Production credentials and private data MUST travel over TLS.
Service accounts and users MUST receive only necessary permissions. User-controlled values
MUST be encoded or sanitized for their output context. Queries MUST be parameterized.
Secrets MUST NOT be committed or exposed in logs, browser bundles, or API responses. Responses
MUST explicitly select permitted fields. Private files and generated results MUST receive
backend authorization protection consistent with their owning records.

### VII. File and Image Architecture

The storage model MUST permit multiple images per product without fixed numbered image columns.
Binary files MUST be stored separately from relational metadata behind a storage abstraction.
PostgreSQL MUST retain ownership, storage keys, media type, size, and lifecycle metadata.
The abstraction MUST permit local development storage and future S3-compatible object storage
without changing domain services. Upload handling MUST remain isolated from domain logic.
Uploads MUST enforce size and type allowlists using content inspection, not only client MIME
claims or filenames. Keys MUST be server-generated. Partial upload/deletion failures MUST have
a cleanup or reconciliation path for orphaned files and dangling references.

### VIII. AI Integration

AI generation MUST use a provider-independent interface such as `ImageGenerationService`.
Provider SDKs and formats MUST remain inside adapters. Each generation MUST retain authorized
references to its original image and selected products, effective parameters, provider/model,
status, result, and diagnostic metadata. Input context MUST remain traceable after products or
configuration change. Long-running generation MUST support durable asynchronous processing
with persisted status, timeouts, bounded retries, and idempotent state transitions. Provider
failures and duplicate callbacks MUST NOT corrupt state. Switching equivalent providers MUST
require only adapter/configuration changes. Data transfer and retention rules MUST be documented
before user images are sent to a provider.

### IX. Frontend Architecture

Frontend modules MUST separate UI, API access, state, and validation. Pages MUST compose focused
components rather than accumulate unrelated responsibilities. API calls MUST pass through a
typed data-access layer. Repeated UI patterns MUST use reusable components. Server Components
MUST be used where browser interaction is unnecessary; Client Component boundaries MUST be
justified by interaction or browser-dependent behavior. Frontend validation MAY mirror rules
for feedback but MUST NOT become the authoritative business or security implementation.

### X. UI/UX Standards

UI work MUST follow Google Material Design principles through consistent typography, spacing,
hierarchy, interaction feedback, and design tokens. Layouts MUST be responsive, verified on
desktop and tablet, and usable on narrow screens. Controls MUST support keyboard access,
visible focus, accessible labels, and readable contrast. Validation errors MUST be associated
with their fields. Forms and data views MUST implement applicable validation, loading, success,
empty, and error states. Destructive actions MUST require confirmation that describes their
consequence. Equivalent interactions MUST use consistent patterns across the application.

### XI. Error Handling

Backend exceptions MUST be handled centrally and mapped to the public error contract.
Frontend messages MUST explain the failed action and available recovery without exposing raw
exceptions. Recoverable errors MUST offer retry when safe; mutation retries MUST prevent
duplicate effects. Failures MUST preserve consistent state. Unexpected errors MUST provide a
correlation identifier for diagnosis without revealing internal details.

### XII. Testing

Every implemented critical path MUST have automated tests before completion. Priority paths
are authentication, authorization, product CRUD, image uploads, and AI generation. Business
rules MUST have focused unit tests; important API, persistence, and user flows MUST have
integration or end-to-end tests. Relevant denial and failure scenarios MUST be covered,
including unauthorized access, invalid uploads, and provider failures. External adapters MUST
support controlled test doubles. Coverage percentages MUST NOT replace behavioral assertions.

### XIII. Code Quality

Code MUST use clear names, explicit dependencies, and focused services and components.
Business rules MUST have one authoritative implementation. Changes MUST remove dead code and
MUST NOT retain commented-out implementations. Abstractions MUST address a current boundary,
duplication, or testability need. New dependencies and substantial complexity MUST have a
recorded purpose and consideration of simpler alternatives. Speculative frameworks MUST NOT
be introduced.

### XIV. Configuration

Environment-specific configuration MUST be externalized through environment variables or
runtime secret injection. Credentials, deployment URLs, tokens, and secrets MUST NOT be
hardcoded. `.env.example` MUST document required variables using safe placeholders. Required
configuration MUST be validated at startup, with clear failure on invalid values. Only
explicitly public configuration MAY enter the frontend bundle.

### XV. Observability

Backend logs MUST be structured and include operation, outcome, timestamp, and request/job
correlation identifiers. Authentication failures, authorization denials, and AI errors MUST be
traceable using safe identifiers and error categories. Logs MUST NOT contain passwords, tokens,
image payloads, signed private URLs, or sensitive user information. Important state-changing
operations MUST record sufficient safe context to reconstruct their outcome. Log access and
retention MUST follow least privilege and documented retention rules.

### XVI. Performance and Scalability

Potentially large lists MUST use bounded pagination. Queries MUST avoid N+1 access and
unnecessary reads; frequently queried fields MUST have indexes where query plans justify them.
Large image processing and generation MUST run outside normal API request handling.
Production session and job state MUST NOT depend on one process's memory. Storage and worker
boundaries MUST permit horizontal scaling. Additional caches, queues, or distributed services
MUST be justified by correctness requirements or measured workload needs.

### XVII. Definition of Done

A feature MUST NOT be complete until its intended behavior works and strict type checks,
linting, production builds, and critical tests pass. Input validation, backend authorization,
safe error handling, and applicable frontend states MUST be verified. Changes MUST contain no
hardcoded secrets. Relevant contracts, configuration examples, migrations, operational
instructions, and user/developer documentation MUST be updated. Any non-applicable completion
gate MUST have a recorded reason in review evidence.

### XVIII. Engineering Decision Hierarchy

Trade-offs MUST prioritize security, correctness, maintainability, simplicity, performance,
then developer convenience, in that order. A decision sacrificing a higher priority for a
lower one MUST be revised or addressed through a constitutional amendment. Performance work
MUST preserve security and correctness and be supported by evidence of a workload need.

## Technology and Implementation Constraints

- Backend MUST use NestJS, TypeScript, PostgreSQL, Prisma, JWT authentication, and REST.
- Frontend MUST use Next.js, TypeScript, and Tailwind CSS with Material Design principles.
- A modular backend and separate frontend MUST be the starting architecture. Microservices,
  generic plugin frameworks, or extra infrastructure MUST have a concrete justification
  appropriate to a small-to-medium application.
- Future modules MUST follow these boundaries. Named product, upload, and AI domains establish
  implementation constraints when built; this constitution does not define feature scope.
- MUST and MUST NOT are mandatory. SHOULD is a default whose exception MUST document its
  rationale and trade-off. MAY indicates an optional choice within mandatory constraints.

## Development and Review Workflow

Specifications MUST define behavior separately from this constitution. Plans MUST include a
constitution check covering affected boundaries, contracts, data, permissions, failure handling,
and verification. Tasks MUST include applicable Definition of Done work. Reviews MUST record
relevant check results and resolve violations before merge. Work without pull requests MUST
retain equivalent review evidence. Decisions affecting module boundaries, storage, identity,
providers, or added infrastructure MUST record context, alternatives, consequences, and
constitutional compliance in a short decision record. Documentation MUST be proportional to
the change.

## Governance

This constitution governs specifications, plans, tasks, implementation, and reviews. Conflicting
project guidance MUST be corrected; implementation preferences MUST NOT silently override
mandatory rules. The project maintainer MUST review and approve amendments before adoption.
Proposals MUST state rationale, affected principles, compatibility impact, and required migration
or remediation. Approved amendments MUST update this file and its amendment date.
Versioning MUST use MAJOR for incompatible removals or redefinitions, MINOR for new principles
or materially expanded guidance, and PATCH for non-semantic clarifications. The original
ratification date MUST remain unchanged. Compliance MUST be checked during planning and before
completion. Existing violations MUST be recorded with an owner and remediation plan and MUST
NOT justify new violations.

**Version**: 1.0.0 | **Ratified**: 2026-09-15 | **Last Amended**: 2026-09-15
