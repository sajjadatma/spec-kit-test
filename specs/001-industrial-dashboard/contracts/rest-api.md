# REST Contract: `/api/v1`

Normative design contract for implementation; not a running API. Nest DTOs/OpenAPI must implement
these operations, and `packages/contracts` must generate public types from that definition.
[Data model](../data-model.md) defines invariants; [spec](../spec.md) defines permissions.

## Transport and errors

JSON UTF-8; UUID IDs; UTC ISO 8601 timestamps; decimal strings (never JSON floating money).
Success: `{ "data": ... }`; list: `{ "data": [], "meta": { "page": 1, "pageSize": 24,
"total": 0 } }`. Empty deletion responses use 204. Asynchronous operations use 202 plus
resource data and Location. No success:false with HTTP 200 for failed business operations.
Error: `{ "error": { "code": "VALIDATION_FAILED", "message": "Safe fallback",
"fields": [{ "path": "sku", "code": "SKU_TAKEN" }], "requestId": "..." } }`.
Frontend translates codes/field codes; messages contain no raw exceptions or secrets.

400 malformed/validation; 401 absent/expired/revoked session; 403 known forbidden action or
valid-credential inactive account; 404 absent or inaccessible record/media; 409 business conflict
or stale revision; 413 bytes too large; 415 unsupported image; 422 unreadable/ineligible image;
429 rate limit with Retry-After; 503 unavailable dependency. Unexpected errors return 500 with
safe code/requestId. Existence-hiding 404 takes precedence on cross-user record access.

Mutations require `X-CSRF-Token` bound to session/pre-auth context and allowed Origin; cookies
are HttpOnly, SameSite=Lax and Secure outside local development. No wildcard credentialed CORS.
Access JWT cookie + opaque refresh cookie; current account/session checked on every protected
call. Refresh/logout cookies are restricted to auth routes; access cookie covers API routes.
Never forward cookies or credentials to arbitrary URLs. Backend validates JWT algorithm, issuer,
audience, expiry, session and authVersion. All routes protected unless explicitly public below.

`Idempotency-Key` (UUID) required for creates/uploads/generation; same user+operation+key and
same canonical payload replays original outcome; different payload returns IDEMPOTENCY_CONFLICT.
Product/account/rate/draft/gallery mutations require `If-Match: "<revision>"`; stale gives
REVISION_CONFLICT. No lost-update retry without user review. Read representations include revision.
Deletion replays are safe but never permit stale resource recreation. User-controlled unknown
properties are rejected. All pagination starts at one; invalid pages/sizes rejected.

Default distributed rate limits: login 10 attempts/15min per IP and 5/15min per normalized account;
register 5/hour/IP; reset requests 3/hour/account and 10/hour/IP; reset consumption 10/15min/IP;
refresh 60/min/session; uploads 30/min/user; generation starts 10/hour/user plus one active attempt.
Use generic acknowledgements for account-keyed recovery suppression to avoid enumeration;
IP-wide limit may return 429. Configurable thresholds, fixed security semantics.

Role shorthand: ALL = approved enabled account; CAT = SUPER_ADMIN/ADMIN/PRODUCT_MANAGER;
ADM = SUPER_ADMIN/ADMIN; SA = SUPER_ADMIN. ADMIN user operations only target USER accounts.
All-history and deleted-session management are SA-only; ADMIN history is always own history.

## Auth and users — FR-001–008

| Method/path | Access | Request | Success / special behavior |
| --- | --- | --- | --- |
| GET `/auth/csrf` | Public or ALL | None | 200 token bound to pre-auth/session context; no-store |
| POST `/auth/register` | Public + CSRF | displayName,email,password,passwordConfirmation | 202 generic acknowledgement; creates pending USER if email unused; no role/status input |
| POST `/auth/login` | Public + CSRF | email,password | 200 UserSummary + sets cookies; invalid credentials 401; valid pending/rejected/disabled 403 safe access-status code, no business session |
| POST `/auth/refresh` | Refresh + CSRF | Empty | 200 UserSummary, rotates cookies; replay revokes family, 401 |
| POST `/auth/logout` | Auth context + CSRF | Empty | 204 revokes current session, clears cookies; repeat safe |
| GET `/auth/me` | ALL | None | 200 UserSummary incl fixed capabilities and locale |
| POST `/auth/password-reset-requests` | Public + CSRF | email | 202 generic acknowledgement regardless of existence/delivery/account suppression |
| POST `/auth/password-resets` | Public + CSRF | token,newPassword,passwordConfirmation | 204; atomically consumes reset, revokes sessions; invalid/used/expired 400 RESET_LINK_INVALID |
| PATCH `/users/me/preferences` | ALL | locale: fa/en | 200 UserSummary; no role/status/profile credential fields |
| GET `/users` | ADM | q,approval,disabled,page,pageSize | 200 UserSummary list; default 20/max100; ADMIN scope applied before search/count |
| GET `/users/{id}` | ADM | None | 200 UserSummary, target boundaries enforced |
| POST `/users/{id}/approval` | ADM | decision: APPROVED/REJECTED | 200 UserSummary; pending/rejected USER approval only, audit; If-Match |
| PATCH `/users/{id}/access` | ADM | disabled: boolean | 200 UserSummary; preserve approval/role; last-enabled-SA guard |
| PATCH `/users/{id}/role` | SA | role: fixed enum | 200 UserSummary; If-Match, last-SA protection; immediate authority change |
| GET `/roles` | SA | None | 200 fixed role/capability matrix; no role mutation endpoints |

UserSummary: id, displayName, email, role, approval, disabled, locale, revision, createdAt;
self response also includes allowed capabilities. No hash/token/verifier fields. Email addresses
only visible within authorized user-management scope. Rejected accounts can be approved; approved
accounts use access disable rather than rejection. Identity changes outside these shapes are V1-excluded.
Reset request creates a hashed token and encrypted email outbox item in one transaction; response
never contains token. Reset link expiry is 30min; replacement invalidates previous links.

## Products and pricing — FR-009–018

ProductWrite: name,sku,category,brand?,collection?,color,material,widthMm,heightMm,thicknessMm?,
finish,texture?,floorCompatible,wallCompatible,suitability,slipResistance?,rectified,
countryOfOrigin?,basePrice?,baseCurrency?,stockQuantity?,unitOfSale,description?,active.
Required/optional/control lists match spec. Currency IRR/TOMAN/USD; decimals are strings;
explicit null clears optional fields. PATCH validates merged state and disallows computed fields.
Server defaults active=false on creation. Derived dimensions/usage/convertedPrices cannot be written.

ProductSummary: id,name,sku,category,dimensions,active,archived,primaryImage?,revision.
ProductDetail adds all ProductWrite values, derived usage, ordered images, convertedPrices,
createdAt,updatedAt. ConvertedPrice: currency, amount nullable, availability
(AVAILABLE/RATE_UNAVAILABLE/NO_BASE_PRICE), rateId?,rateEffectiveAt?,conversionBasis
(BASE/FIXED_RATIO/USD_RATE). Preserve base amount; derive all currencies from one rate snapshot.

| Method/path | Access | Request | Success / special behavior |
| --- | --- | --- | --- |
| GET `/products` | ALL | q,category[],color[],finish[],widthMm,heightMm,usage[],status,page,pageSize | 200 summaries; pageSize24/max100, name then SKU; status ACTIVE default, INACTIVE/ARCHIVED only CAT |
| GET `/products/{id}` | ALL | None | 200 detail; USER inactive/archived 404 |
| POST `/products` | CAT | ProductWrite | 201 detail, Location; SKU_TAKEN 409 |
| PATCH `/products/{id}` | CAT | Partial ProductWrite + If-Match | 200 detail; archived read-only, revision conflict 409 |
| POST `/products/{id}/archive` | ADM | Empty + If-Match | 200 detail, active false |
| POST `/products/{id}/restore` | ADM | Empty + If-Match | 200 detail, inactive |
| DELETE `/products/{id}` | ADM | If-Match | 204 only never-visualized product; PRODUCT_USED 409 otherwise |
| GET `/pricing/exchange-rate` | ALL | None | 200 {revision,current: null or Rate} |
| PUT `/pricing/exchange-rate` | SA | rialsPerUsd + If-Match | 200 {revision,current:Rate}; positive decimal ≤6 places, audit |

Search: trimmed case-insensitive partial name or SKU. Different filter types AND; values inside
a type OR. usage values FLOOR/WALL/BOTH: FLOOR means floor-compatible, WALL wall-compatible,
BOTH requires both. width/height compare supplied dimensions without rotation. Additional
`selectionSurface=FLOOR|WALL` restricts to active, compatible, usable-primary-image entries and
cannot be combined with a nonactive status. No option to bypass eligibility.
Rate: id,rialsPerUsd,effectiveAt. No automatic feed or mutable toman ratio. Missing rate returns
null current, not fabricated zero. Updates are immediate; stale revision conflicts. Unreferenced
product hard deletion releases gallery files, clears dangling draft selections, and respects any
independent live asset references.

## Uploads and protected media — FR-019–024

Client batches consist of independent single-file requests for per-file progress/retry.
Product limit10, ≤10MiB/file, ≤25MP, width/height≥256, still JPEG/PNG/WebP. Content hash within
one product defines duplicate, regardless of filename. Metadata inspection never trusts filename.
Uploads are not gallery entries/draft originals until validated and attached.

| Method/path | Access | Request | Success / special behavior |
| --- | --- | --- | --- |
| POST `/products/{id}/image-uploads` | CAT | multipart file, Idempotency-Key | 202 UploadReceipt; product must not be archived |
| GET `/uploads/{id}` | Uploader or SA | None | 200 {id,state,attachedImage?,draft?,errorCode?}; owner-only no-store |
| PATCH `/products/{id}/images/primary` | CAT | imageId + If-Match product revision | 200 ProductDetail; verifies product ownership |
| PUT `/products/{id}/images/order` | CAT | imageIds[] full unique permutation + If-Match | 200 ProductDetail; primary unchanged |
| DELETE `/products/{id}/images/{imageId}` | CAT | If-Match product revision | 204; replace primary by next gallery order |
| GET `/products/{id}/images/{imageId}/content` | Product read policy | variant=original/preview | 200 authenticated bytes; absent/unready/inaccessible 404 |
| POST `/visualization-draft/room-uploads` | ALL | multipart file, expected draft revision, Idempotency-Key | 202 UploadReceipt; successful validation attaches only if revision still matches |
| GET `/visualization-draft/room-image` | Own draft | variant=original/preview | 200 authenticated bytes |
| GET `/visualization-sessions/{id}/original` | Owner or SA | variant=original/preview | 200 authenticated bytes, nondeleted session |
| GET `/generation-attempts/{id}/result` | Owner or SA | variant=original/preview | 200 only completed/nondeleted; other state404 |
| GET `/generation-attempts/{id}/references/{surface}` | Owner or SA | FLOOR/WALL; variant | 200 captured reference bytes |

UploadReceipt: id,state (VALIDATING/READY/FAILED), statusUrl. Store staged asset and validation
job durably. After validation, lock owning product/draft, recheck actor authority and bounds,
attach and revise. Product upload attachment serializes against latest gallery state rather than
requiring a stale browser revision; duplicate/max10/archive race yields a per-file failure.
Draft replacement requires its initial revision so a slow upload cannot overwrite a newer draft.
Room upload failure leaves existing original/selections intact. Old original replacement clears
session linkage only after successful attachment. Rejection code explains exact limit or conflict.

All content uses correct inspected Content-Type, X-Content-Type-Options:nosniff and
Cache-Control:private,no-store. No public asset-by-ID route, presigned browser URLs, object keys,
or shared Next optimizer cache. Already downloaded user copies cannot be revoked; fresh access
is denied immediately after deletion/revocation. Derivative not ready may serve validated original.

## Draft, generation, history — FR-025–033

| Method/path | Access | Request | Success / special behavior |
| --- | --- | --- | --- |
| GET `/visualization-draft` | ALL own | None | 200 Draft or null |
| PATCH `/visualization-draft` | ALL own | floorSelected,wallSelected,floorProductId?,wallProductId? + If-Match | 200 Draft; incomplete draft allowed |
| DELETE `/visualization-draft` | ALL own | If-Match | 204 explicit discard; no history deletion |
| POST `/visualization-draft/from-attempt` | Attempt owner or SA | attemptId + If-Match draft | 200 prefilled Draft; inaccessible404; new actor-owned session if source owner differs |
| POST `/generation-attempts` | ALL | draftId,draftRevision,consentPolicyVersion,consentAccepted:true + Idempotency-Key | 202 Attempt; validate current eligibility, one active attempt; input errors422/conflicts409 |
| GET `/generation-attempts` | ALL | scope=own/all,status,ownerId,page,pageSize | 200 history summaries; default own,20/max100; scope all/owner filter SA-only |
| GET `/generation-attempts/{id}` | Owner or SA | None | 200 Attempt detail incl captured inputs, status, safe failure and contextual image routes |
| DELETE `/visualization-sessions/{id}` | SA | confirmSessionId,confirmOwnerId | 202 {id,deleted:true}; immediately inaccessible; active attempts409 SESSION_ACTIVE |
| GET `/visualization-policy` | ALL | None | 200 version, bilingual notice, model-independent retention/disclosure text |

Draft: id,revision,originalImage?,floorSelected,wallSelected,floorProductId?,wallProductId?,
sourceSessionId?,predecessorAttemptId?,updatedAt,expiresAt. Initial GET returns an empty virtual draft with revision0 and no persisted ID; it MUST NOT
write to the database. First PATCH or successful room attachment uses If-Match0 to create it
atomically; generation requires the resulting persisted draft ID. Once a persisted
draft expires GET returns virtual empty draft; expires after24h since last edit.

Attempt summary: id,sessionId,status,acceptedAt,deadlineAt,finishedAt?,surface product summaries,
preview?,predecessorId?. Detail adds owner summary only to authorized readers, captured selections,
original/reference/result contextual routes and safeErrorCode. Provider secrets/raw responses and
storage keys are excluded. Owner consistency follows session; admin variation never impersonates.

Known failure codes: PRODUCT_INELIGIBLE, REFERENCE_UNAVAILABLE, ROOM_IMAGE_INVALID,
PROVIDER_UNAVAILABLE, GENERATION_TIMEOUT, PROVIDER_OUTCOME_UNKNOWN, GENERATION_FAILED.
Status PREPARING→GENERATING→COMPLETED/FAILED; no terminal rewrites. Poll every2s while visible,
pause when hidden, refetch immediately on return. Original HTTP retries reuse the key; deliberate
retry/variation starts from draft/from-attempt and uses a new key. Retrying a deleted resource
returns RESOURCE_DELETED, never creates fresh work. One active slot enforced transactionally.

Deletion confirmation comes after UI names owner and warns that every variation is removed.
Transaction tombstones session, writes audit and cleanup job. No success waits for physical
object deletion, and cleanup failure never restores access. Shared assets remain accessible only
through their other authorized contexts. New acceptance cannot attach to a deleted session.

## Dashboard — FR-034–036

GET `/dashboard` (ALL) → 200 `{data:{visibleProducts,activeProducts,visibleAttempts,links}}`.
USER product counts include active only; CAT includes inactive/archive in total. Own attempts
for all except SA, whose visible count includes all nondeleted attempts. Links encode the matching
scope/filter so counts and destination agree. Shortcuts AddProduct/UserManagement match role.
SA has an Exchange Rates destination; locale switch available everywhere. All no-store personalized
responses; failures show localized empty/error controls without leaking another user's counts.

## Contract acceptance

Implementation must generate OpenAPI with these paths, DTOs, response codes and auth policies;
contract tests verify route inventory and DTO/unknown-field enforcement. Verify every matrix
entry, not just UI visibility. Run all money examples, last-admin and account-target races,
image deletion privacy, upload limit/duplicate races, generation idempotency and reset replay.
