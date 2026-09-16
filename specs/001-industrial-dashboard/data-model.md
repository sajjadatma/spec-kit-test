# Data Model: Industrial Dashboard V1

Design only; no schema or migration is implemented here. Field validation in [spec.md](spec.md)
is authoritative. Transport shapes are in [contracts/rest-api.md](contracts/rest-api.md).

## Common conventions

UUID identifiers; UTC timestamps; integer revisions for optimistic concurrency; normalized
email/SKU keys; exact decimals serialized as strings. Product price numeric(24,2), FX rate
numeric(24,6), dimensions numeric(12,2), stock numeric(24,3). Reject excess scale and values
outside column bounds, not silently round stored inputs. Currency enum `IRR | TOMAN | USD`;
TOMAN is an application label. All related domain rows have real foreign keys; avoid generic
polymorphic owner IDs for file references. Raw locking/partial-index SQL runs through Prisma
or Prisma migrations only. Never publish credential, storage-key, or provider-secret columns.

## Identity and authorization

### User

Fields: id, displayName (1–100), email, emailNormalized (unique), passwordHash, role
(SUPER_ADMIN/ADMIN/PRODUCT_MANAGER/USER), approval (PENDING/APPROVED/REJECTED), disabledAt nullable,
locale (fa/en), authVersion, revision, createdAt, updatedAt. New registrations are PENDING USER.

Transitions: PENDING → APPROVED or REJECTED by ADMIN for USER only or SUPER_ADMIN. Rejected
USER may be approved later by the same authority, with audit. Disabling/re-enabling preserves
approval and role; only APPROVED with disabledAt null can access protected business routes.
Pending/rejected login reveals only access status after password verification, without creating
a business session. Only SUPER_ADMIN changes roles. No user deletion in V1.

Relationships: many authentication sessions, reset requests, visualization sessions, attempts,
audit actions; at most one saved room draft. Index role/approval/disabledAt for admin filtering.
Normalize email by trim + lowercase; never normalize passwords. No self-assigned role/status.
Lock a singleton governance row plus affected user when changing enabled SUPER_ADMIN membership;
prevent last-enabled-SUPER_ADMIN demotion/disable, including concurrent changes.

### AuthenticationSession and RefreshToken

Session: id, userId FK, familyExpiresAt, revokedAt/reason, createdAt, authVersionAtIssue.
RefreshToken: id, sessionId FK, tokenHash unique, issuedAt, expiresAt, consumedAt, replacementId
nullable FK. Rotation locks current verifier and session; marks consumed and inserts replacement
atomically. Family expiry never extends beyond seven days. Consumed-token replay revokes family.
JWT includes sessionId/userId/version, but current role/status/session remain authoritative.
Every protected action checks these rows; logout revokes that session. Password reset revokes all.
Index sessions by user/revokedAt and token hash; delete expired token records after family expiry
plus a bounded security audit window, retaining only minimal audit events.

### PasswordReset and EmailOutbox

Reset: id, userId FK, tokenHash unique, issuedAt, expiresAt (30 minutes), consumedAt,
supersededAt. Issuance locks user and supersedes prior unused requests. Consumption atomically
updates password, increments authVersion, revokes sessions, and consumes/supersedes links.

EmailOutbox: id, resetId FK unique, encryptedPayload, encryptionKeyVersion, status
(QUEUED/SENDING/SENT/FAILED/EXPIRED), attemptCount, nextAttemptAt, leaseUntil, leaseToken,
lastSafeErrorCode, createdAt. Link ciphertext is deleted after send/expiry, not kept as history.
Queued mail verifies current reset validity before dispatch. Duplicate SMTP delivery may occur
following uncertain acknowledgement, but delivered links remain single-use. No email/token bodies
in logs. Generic recovery acknowledgement is independent of whether a row was created.

### AuditEvent and GovernanceLock

Audit: id, actorId nullable FK (system events), action enum, targetType, targetIdentifier,
safe before/after fields, correlationId, createdAt. Targets are descriptive audit identifiers,
not asset access grants. Include account access changes, FX updates, session deletion and
safe security events; omit credential/image payloads. Retain account records referenced by audit.
GovernanceLock: singleton id/revision used to serialize last-admin invariants.

## Catalog and pricing

### Product

Fields: id, name, sku, skuNormalized unique, category, brand?, collection?, color, material,
widthMm, heightMm, thicknessMm?, finish, texture?, floorCompatible, wallCompatible,
suitability, slipResistance?, rectified, countryOfOrigin?, basePrice?, baseCurrency?, stockQuantity?,
unitOfSale, description?, active (default false), archivedAt?, primaryImageId?, revision,
createdBy FK, updatedBy FK, createdAt, updatedAt, everVisualized (default false).

Use the exact controlled values and maximum text lengths in the spec's product table. Country
uses a canonical country code with translated display names. Product name and SKU retain entered
script; color/material etc. use language-neutral enum identifiers. Dimensions and usage label are
derived, not independently editable. At least one compatibility flag is true; required dimensions
are positive; ceramic/porcelain category requires matching material. Price/currency must both be
null or both populated. IRR/TOMAN price is integral, USD scale ≤2; stock nonnegative, whole for
piece/box. Blank optional fields persist as null rather than zero or false.

Archive → archivedAt set, active false. Restore → archivedAt null, active false. Archived entries
are read-only. Hard delete only if everVisualized is false; the historical-use flag is monotonic
so deleting visualization history never makes a previously used product deletable. This is a
small deliberate denormalization supporting “used by previous visualizations” semantics.
Draft selections referencing a deletable product become unset through the catalog service.

Indexes: unique skuNormalized; name/SKU trigram search indexes where query plans warrant,
name+sku stable ordering, active/archive/category, and measured compatibility/filter indexes.
Use `pg_trgm` only via migration; do not index every optional field speculatively.
Revisions gate edits, archive, restore, delete, and gallery mutations.

### ProductImage

Fields: id, productId FK, assetId FK, contentHash, position, createdAt. Unique(productId,
contentHash), unique(productId,position). Product.primaryImageId references an image belonging
to that product (composite FK or equivalent enforced migration constraint). Zero images means
null primary; nonempty means exactly one selected primary. No image can belong to two products.

Lock product before attach/remove/reorder/primary selection; enforce max 10, full permutation
on reorder, gap-free committed order, and primary replacement. First successful attachment
becomes primary. Reordering preserves primary. Gallery removal releases that reference only;
attempt snapshots remain. Parallel reorder uses temporary positions in the same transaction or
a deferrable constraint to prevent transient uniqueness violations.

### ExchangeRate and PricingSettings

Rate: id, rialsPerUsd numeric(24,6) >0, previousRateId? FK, actorId FK, effectiveAt.
Rows immutable. PricingSettings: singleton id, currentRateId? FK, revision. SUPER_ADMIN-only
transaction compares revision, inserts rate, advances pointer, and audits before/after.
No editable rial/toman factor or automatic feed. Prices are not materialized in Product.

Let R be rials/USD. Exact rial value is base for IRR, base×10 for TOMAN, base×R for USD.
Target IRR = rial value, TOMAN = rial value/10, USD = rial value/R. Return base unchanged;
round derived values HALF_UP at final display (0 decimals IRR/TOMAN, 2 USD). Missing R blocks
only cross-USD conversions; base USD still displays and IRR↔TOMAN still works. Return rate
revision/date on derived USD-related values, and FIXED_RATIO metadata for rial/toman-only values.
One response uses one rate snapshot, even if a concurrent update occurs.

## Media and visualization

### FileAsset and explicit references

Asset: id, storageBackend, storageKey unique, contentHash, mediaType, byteSize, width, height,
status (STAGED/VALIDATING/READY/REJECTED/DELETING/DELETED), creatorId FK, createdAt,
validatedAt?, rejectedCode?, deleteRequestedAt?. No global user-visible hash deduplication.
Display/provider derivatives: id, parentAssetId FK, purpose (PREVIEW/PROVIDER), storageKey,
mediaType, size/dimensions, status. Strip EXIF metadata; provider never receives original EXIF.
Only READY assets may be attached or read; browser responses contain contextual routes, not keys.

Explicit live references: ProductImage.assetId; RoomDraft.originalAssetId;
VisualizationSession.originalAssetId; AttemptSurface.referenceAssetId;
GenerationAttempt.resultAssetId. Derived assets follow their parent lifetime. ProductImages
and AttemptSurfaces can refer to the same immutable validated image without sharing permissions.

Validate still JPEG/PNG/WebP content, ≤10 MiB, ≤25MP, each dimension ≥256, one frame. File
validation state does not imply the room actually contains every requested surface. The adapter
may classify an unsuitable scene as a safe input failure; V1 does not require a separate ML
room classifier. Provider results undergo decode/size validation under a bounded result policy
before becoming READY; never stream unvalidated provider bytes to browsers.

Cleanup: unreferenced staging expires after 24 hours. Lock assets during reference attachment
and transition to DELETING; DELETING prohibits new references. Only remove physical bytes after
all live references are absent; missing object is an idempotent success. Failed cleanup retries
with bounded backoff and remains observable; never restores deleted-domain access.

### UploadReceipt

Fields: id, uploaderId FK, stagedAssetId FK, productId? FK, draftOwnerId? FK,
expectedDraftRevision?, state (VALIDATING/READY/FAILED), attachedProductImageId? FK,
safeErrorCode?, createdAt, finishedAt?. Exactly one upload target is set. Validation job
references this receipt; READY means validated and successfully attached, not merely decoded.
Product attachment increments product revision; draft attachment checks its expected revision.
Receipts are scoped to uploader/SA and expire after 24 hours when terminal; retained idempotency
receipts prevent duplicate retry within the authenticated session. A deleted product while upload
is pending yields failed receipt and asset cleanup, not a dangling attachment.

### RoomDraft

Fields: id, ownerId unique FK, originalAssetId? FK, sourceSessionId? FK, predecessorAttemptId?
FK, selectedFloorProductId? FK, selectedWallProductId? FK, floorSelected, wallSelected,
revision, updatedAt, expiresAt. Persist selected values after successful upload/change, retained
for 24 hours after last edit; explicit discard removes draft references. Incomplete drafts are
valid; submission validates completeness/current catalog eligibility. Replacing original image
clears session linkage and requires the UI's discard confirmation. No transfer between accounts.

For SUPER_ADMIN variation from another owner: create a new actor-owned session on acceptance,
retaining the authorized original image through its own reference. Do not add the actor's attempt
to the original owner's session. Subsequent deletion of either session respects shared assets.

### VisualizationSession

Fields: id, ownerId FK, originalAssetId FK, createdAt, deletedAt?, deletedBy? FK. One original
per session. Many attempts, each owned by session owner. Original replacement creates a new
session; same-original variations stay in the same owner's session. No automatic expiry.
Deleted session becomes an inaccessible minimal tombstone used for cleanup/restore safety;
full snapshots and image references are removed during cleanup. No public listing of tombstones.

### GenerationAttempt and AttemptSurface

Attempt: id, ownerId FK, sessionId FK, predecessorId? FK, status
(PREPARING/GENERATING/COMPLETED/FAILED), acceptedAt, deadlineAt, startedAt?, finishedAt?,
resultAssetId? FK, safeErrorCode?, providerName, model, promptVersion, effectiveParameters,
providerRequestId?, inputDigest, idempotencyKey, payloadHash, revision.

Surface: id, attemptId FK, surface (FLOOR/WALL), productId FK, referenceAssetId FK,
productSnapshot (name, SKU, dimensions, material, finish, color, texture, compatibility),
referenceHash. Unique(attemptId,surface); require one or two according to requested choices.
No mutable product field substitutes for captured appearance context. This snapshot is justified
historical data, not an alternative catalog source of truth.

Unique(ownerId,idempotencyKey) plus partial unique(ownerId) where status PREPARING/GENERATING.
Acceptance locks owner and selected product/image rows, verifies account and draft revision,
sets product.everVisualized, creates session if needed, copies references, creates attempt/job,
and commits atomically. Same key+payload replays the original acknowledgement; differing payload
conflicts. Keep a separate minimal idempotency receipt after session deletion so an old retried
submission cannot recreate deleted work; delete receipts when their auth session is expired.

Transitions: PREPARING → GENERATING → COMPLETED or FAILED; PREPARING may fail. No terminal →
active transition. Retry is a new attempt linked to predecessor. Deadline is acceptance+10min,
including queued time. COMPLETED requires a READY result reference. Dispatch uncertainty becomes
FAILED/PROVIDER_OUTCOME_UNKNOWN; no automatic paid duplicate. Late output cannot change terminal
status. Product edits/removal after acceptance do not change captured inputs.

Session deletion locks session and owner active slot, checks no active attempt, sets tombstone,
audits, and enqueues cleanup. New attempts cannot attach to tombstoned sessions. Deletion/acceptance
must use the same lock ordering. Foreign-key cleanup removes attempt references before removing
files; no cascade may bypass live asset checks. Catalog everVisualized remains true.

## Work records and operations

### BackgroundJob

Fields: id, kind (GENERATION/ASSET_VALIDATE/ASSET_CLEANUP/SESSION_CLEANUP), typed domain target
FK where applicable, state (READY/RUNNING/SUCCEEDED/FAILED), availableAt, attemptCount,
leaseUntil?, fencingToken, lastErrorCode?, createdAt, updatedAt. Unique domain job key prevents
double enqueue. Claim with parameterized SKIP LOCKED through Prisma; heartbeat/terminal writes
require the current fencing token. Poll ready jobs every second; heartbeat 15s, lease 60s.
Safe transient work has at most two automatic retries inside its deadline; cleanup can be
requeued by the operator after bounded exhaustion. Stale generation dispatch is reconciled,
not blindly repeated. Email uses its specialized outbox lease with the same claim discipline.

### RateLimitBucket and IdempotencyReceipt

Buckets: scope, subjectHash, windowStart, count, expiresAt; unique scope+subjectHash+windowStart.
Atomic increments avoid process-local enforcement. HMAC IP/email subjects to avoid raw personal
data in diagnostics; hash key stays secret. Defaults in the REST contract, configurable.
Receipt: userId FK, authSessionId FK, operation, key, payloadHash, response resource ID,
createdAt. Scope keys by operation/user, verify same payload, retain while original auth session
can retry. Deletion receipt yields RESOURCE_DELETED rather than resubmission.

## Migration and recovery validation

Migrations create required foreign keys/checks/partial indexes and use explicit SQL only for
features Prisma schema cannot express. Seed controlled enums and singleton governance/pricing
rows; bootstrap first SUPER_ADMIN via a one-time operator command, never a public route or
hardcoded password. Each mutation validates before persistence and repeats invariants transactionally.

Test concurrent final-admin demotions, duplicate SKU/email, 11th image, primary removal/reorder,
rate revisions, competing reset consumption, refresh replay, repeated generation, and session
delete versus accept. Restore PostgreSQL and assets together; replay deletion tombstones before
serving restored media. Daily encrypted backup and quarterly restore drill are planning defaults;
initial recovery targets are ≤24h data loss and ≤4h restore, to be measured before production.
