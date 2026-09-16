# Integration and Operational Contracts

These are adapter boundaries and execution rules, not service implementations.
See [research](../research.md) for sources and [data model](../data-model.md) for persistence.

## ImageGenerationService

Input: application attemptId; request deadline; room image bytes without EXIF; ordered surface
references `{surface, bytes, inspectedMediaType, productSnapshot, hash}`; model-independent
options `{outputCount:1, size, quality, promptVersion}`; abort signal. No user-provided prompt,
remote URL, provider SDK type, or object key crosses the domain interface.

Output: inspected candidate result bytes/media type plus safe providerName/model/requestId,
effective options, and timing/usage metadata if available. Errors categorized as INVALID_INPUT,
UNAVAILABLE, TIMEOUT, OUTCOME_UNKNOWN, or FAILED; raw provider exception retained only in
redacted internal diagnostics. Provider result never implies successful persistence.

Initial adapter: OpenAI Images edit API, configurable model `gpt-image-2.5-sunburst`, room first
then floor/wall references as selected. One output, explicit size/quality, server prompt version
`room-surfaces-v1`. Adapter capability discovery/configuration validation must reject an unsupported
model/option combination before normal operation. No mask, Files API or conversation history.
Prompt maps references to surfaces, requests preserved geometry/furniture/unselected surfaces,
and treats image content as data, not instructions. Privacy policy version is captured on acceptance.

No automatic retries after ambiguous transport errors. At most two safe pre-acceptance retries
with 1s/3s backoff within deadline; provider 429/5xx is retried only when confirmed to represent
nonacceptance. SDK implicit retries disabled. Future adapter can support operation lookup or
idempotency, but those semantics must be verified before enabling ambiguous-call retries.

## Worker lifecycle and fencing

1. Acceptance transaction checks user/draft/catalog/media, copies snapshots, creates attempt/job,
   reserves owner's active slot and idempotency receipt; commit then return202.
2. Worker claims available job through Prisma using row locks/SKIP LOCKED, new fencing token,
   60s lease; heartbeat15s. Only current fencing token can persist progress/result.
3. Mark dispatch started durably before calling provider; set GENERATING. External request is
   outside transactions, with a deadline shorter than remaining total time to allow persistence.
4. Decode/bound result, stage a private asset. In a transaction recheck fence, attempt status,
   deadline and live session; attach READY result and mark COMPLETED. Otherwise cleanup result.
5. Watchdog and read-time reconciliation fail elapsed attempts. A lost lease before dispatch
   can safely retry; after possible dispatch, use provider lookup if supported, else fail
   PROVIDER_OUTCOME_UNKNOWN and let user decide whether to retry. Never silently recreate work.
6. Status deadline remains acceptance+10min including queue time. Poll/watchdog once per second.
   On recovery from complete database/service outage, reconcile before returning active statuses.

Initial concurrency: two image generations per worker, adjustable through configuration. If
sustained queue age threatens deadline, alert and increase worker capacity after load validation;
never silently extend accepted deadlines. Other job kinds have separate concurrency limits so
slow generation does not starve reset email or cleanup. No singleton process owns durable state.

## StorageService and image validation

Interface operations: putPrivate(staging key, bounded bytes), openPrivate(key), deleteIfPresent(key),
createDerivative(parent,purpose). Domain receives asset IDs; only adapters see storage keys.
Local adapter confines keys under a configured private root, rejects path traversal/symlinks,
and uses server-generated names. Production S3-compatible adapter uses a private bucket and
least-privilege credentials, authenticated operations, no public ACLs or permanent browser URLs.

Upload route streams at most10MiB to quarantine and returns an UploadReceipt after durable staging.
Worker detects type, decodes with pixel/frame limits, rejects malformed/animated files, records
hash and dimensions, and prepares EXIF-stripped derivatives. Product attachment rechecks permissions,
max10/duplicate/archive state under lock; room attachment compares expected draft revision.
A failed new upload does not replace the existing room original. Default result cap is25MiB/25MP;
provider candidate exceeding it fails safely and is not exposed. Media streams go through current
resource authorization; server proxy/Next optimizer caching is disabled.

Delete flow: tombstone session → remove domain references in cleanup transaction → lock each
candidate asset → verify all explicit live references absent → mark DELETING → delete object
and derivatives → mark DELETED. Ref attachment locks asset and rejects DELETING state.
Idempotent reconciliation handles missing objects or interrupted cleanup. After bounded automatic
retries, operator requeues failures without un-hiding records. Shared references prohibit byte deletion.

## MailService

Input: outbox/reset identifier, verified registered address, locale, trusted-origin reset URL,
expiresAt. SMTP adapter uses configured sender and verified TLS (465 or required STARTTLS587).
Never derive reset host from request headers. Mailpit captures messages locally; live SMTP only
in explicit production/staging configuration. Templates exist in Persian/English and contain
expiry and safe reset instructions, never a password.

Outbox link encrypted at rest with an external key; hashed token only in PasswordReset.
Worker validates not superseded/expired before send. Retry same message/link at most twice
within expiry; no regenerated token on retry. Delete encrypted payload when sent/expired.
Request response is generic regardless of account existence or downstream send outcome.
SMTP delivery can duplicate on uncertain acknowledgement; token consumption remains single-use.

## Configuration contract

Implementation MUST supply a safe `.env.example` and fail startup on missing/invalid settings.
No defaults with real credentials. Client-exposed configuration is limited to public origin/name.

| Group | Required configuration |
| --- | --- |
| Runtime | NODE_ENV, PORT, APP_ORIGIN, API_INTERNAL_ORIGIN, TRUSTED_PROXY_HOPS |
| Persistence | DATABASE_URL; Prisma7 driver/SSL settings |
| Auth | JWT signing/verification key, JWT_ISSUER, JWT_AUDIENCE, CSRF_SECRET, SUBJECT_HMAC_KEY |
| Mail | SMTP_HOST/PORT/TLS/USER/PASSWORD, MAIL_FROM, RESET_PUBLIC_ORIGIN, OUTBOX_ENCRYPTION_KEY |
| Storage | STORAGE_DRIVER, PRIVATE_STORAGE_ROOT or S3_ENDPOINT/BUCKET/REGION/access credentials |
| Images | IMAGE_PROVIDER=fake/openai, IMAGE_MODEL, IMAGE_API_KEY, IMAGE_SIZE, IMAGE_QUALITY |
| Policy | PRIVACY_POLICY_VERSION, bilingual provider/retention notice text, LOG_RETENTION_DAYS |
| Operations | WORKER_GENERATION_CONCURRENCY, upload/cleanup concurrency, rate thresholds |

Development fake provider and Mailpit require no paid account. Real-image generation must not be
accidentally enabled in automated tests. Environment-dependent URLs never appear as compiled
business constants. Reset lifetime30min, generation10min, image bounds and other spec limits
cannot be overridden to weaken acceptance silently.

## Observability, recovery, and release conditions

Structured logs: time, severity, request/job/attempt ID, operation, outcome, duration, safe error
code. Redact Authorization/Cookie, CSRF/reset tokens, passwords, email body, signed URLs, image
bytes, and provider prompts containing user data. Security event identity uses internal identifiers.
Audit role/status/FX/deletion changes. Metrics: request latency/errors, queue age, leased jobs,
generation outcomes/timeout, mail retry/failure, staged asset age, cleanup backlog and DB capacity.

Public health endpoints return only minimal liveness/readiness; detailed metrics are internal.
Readiness checks DB and required worker heartbeat/storage configuration without calling a paid
provider per probe. Graceful worker shutdown stops claims and either finishes or fences work.
Daily encrypted DB/asset backups, ≤24h recovery-point and ≤4h recovery-time initial targets;
quarterly restore drill and deletion-tombstone replay before restored media becomes available.
These are design targets, not measured availability claims. Provider/API downtime can result in
failed attempts; normal catalog operation must remain usable when image provider or SMTP is down.

Release conditions: real model account access/capabilities; approved provider retention disclosure;
SMTP delivery; SC-006 first-attempt 30-case review; critical automated and concurrency checks;
backup/restore and deletion drill. App deletion must never be advertised as erasing provider-held
copies without verified provider behavior. No infrastructure is provisioned by this document.
