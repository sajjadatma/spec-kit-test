# Feature Specification: Ceramic and Tile Industrial Dashboard V1

**Feature Branch**: Not created; no branch hook is configured.

**Created**: 2026-09-15

**Status**: Ready for planning — specification quality review passed

**Input**: Internal dashboard for authentication, role-based user management, ceramic/tile
catalog management, multiple product images, and AI room visualization with private history.
Source: user application brief supplied on 2026-09-15. Engineering constraints are governed by
[the project constitution](../../.specify/memory/constitution.md).

## Clarifications

### Session 2026-09-15

- Q: How long should V1 retain submitted room images, generated results, and visualization history? → A: Retain sessions until SUPER_ADMIN explicitly deletes them; include this administrative action in V1.

- Q: Which interface language and reading direction should V1 support? → A: Persian and English, with a language switch and matching right-to-left or left-to-right layout.

- Q: Which currencies should V1 support, and how should their prices relate to each product? → A: Iranian rial, Iranian toman, and USD; each product has one base price, with other currencies calculated using managed exchange rates.

- Q: How should V1 maintain the exchange rate used to convert USD prices to rial and toman? → A: Only SUPER_ADMIN manually updates the USD-to-rial rate; one toman equals 10 rials.

- Q: How should users regain access when they forget their password in V1? → A: Users request a single-use password-reset link by email.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Obtain and Use Authorized Access (Priority: P1)

As a USER, I register, sign in, reach my dashboard, and sign out so I can use approved business
resources without exposing them to unauthorized people.

**Why this priority**: All business journeys require an authorized identity.

**Independent Test**: Use approved and restricted accounts to verify entry, session expiry,
and sign-out without requiring products or generation results.

**Acceptance Scenarios**:

1. **Given** a visitor, **When** they submit valid registration details, **Then** their account
   is created as pending USER, cannot access protected content, and awaits administrator approval.
2. **Given** an enabled, approved account, **When** correct credentials are submitted, **Then**
   the user reaches a dashboard containing only actions they are permitted to perform.
3. **Given** invalid credentials, **When** sign-in fails, **Then** a generic sign-in error is
   shown without revealing whether the email exists; the password is not redisplayed.
4. **Given** a signed-in user, **When** they sign out or their session expires, **Then** protected
   content becomes inaccessible and the next protected action requests sign-in.
5. **Given** a USER, **When** they directly attempt to create a product or inspect another user's
   visualization, **Then** access is denied and neither data nor state changes are exposed.

6. **Given** an enabled approved account, **When** its user requests recovery and follows
   the emailed link within 30 minutes, **Then** a valid replacement password restores sign-in
   access, the old password stops working, and all previous sessions and reset links are invalid.
7. **Given** an unknown email or an existing account, **When** recovery is requested, **Then**
   the same public acknowledgement appears; any reset link goes only to the registered address.
8. **Given** an expired, superseded, or already used link, **When** reset is attempted, **Then**
   no password is changed and the user can request a new link. Resetting a pending, rejected,
   or deactivated account MUST NOT grant protected access.

### User Story 2 - Govern Accounts and Permissions (Priority: P1)

As a SUPER_ADMIN, I control authorized staff access and role assignments. As an ADMIN, I manage
accounts within my permitted boundary without escalating my own authority.

**Why this priority**: Operational access must be controllable before catalog and image use.

**Independent Test**: Use accounts in all four roles and verify permitted changes, prohibited
changes, deactivation, and protection of the last enabled SUPER_ADMIN.

**Acceptance Scenarios**:

1. **Given** a SUPER_ADMIN, **When** they inspect users and the four fixed roles, **Then**
   account identity, role, access status, and fixed permissions are visible without credentials.
   The role definitions cannot be created, edited, or deleted.
2. **Given** an allowed account change under FR-007, **When** an administrator confirms it,
   **Then** it persists and permissions reflect the change on the next protected action.
3. **Given** an ADMIN, **When** they attempt to manage a SUPER_ADMIN or grant authority outside
   their boundary, **Then** the attempt is denied and the account is unchanged. An ADMIN
   likewise cannot inspect or manage ADMIN or PRODUCT_MANAGER accounts.
4. **Given** only one enabled SUPER_ADMIN, **When** deactivation or demotion would remove that
   final administrator, **Then** the change is blocked with an explanation.
5. **Given** a deactivated account, **When** an existing session attempts any protected action,
   **Then** access is denied; historical records remain associated with that account.
6. **Given** a pending USER, **When** ADMIN approves the registration, **Then** that account
   can sign in with USER permissions; rejecting it keeps protected access denied.
7. **Given** an ADMIN viewing accounts, **When** they search for a PRODUCT_MANAGER or ADMIN,
   **Then** those account records are not disclosed. Only SUPER_ADMIN can change assigned roles.

### User Story 3 - Maintain Ceramic and Tile Products (Priority: P1)

As a PRODUCT_MANAGER, I create and edit accurate catalog entries. As an ADMIN, I archive or
remove eligible entries so staff select current products without destroying historical work.

**Why this priority**: Product discovery and visualization depend on trustworthy catalog data.

**Independent Test**: Create, edit, archive, and delete seeded products without generation.

**Acceptance Scenarios**:

1. **Given** an authorized creator, **When** all required fields satisfy the product rules,
   **Then** the product is saved, a success message appears, and its details can be reopened.
2. **Given** a duplicate SKU differing only in case or surrounding spaces, **When** submitted,
   **Then** saving is blocked with a SKU error and other entered values are retained.
3. **Given** missing required fields or invalid numbers, **When** saving is attempted, **Then**
   each affected field identifies the problem and no partial product is created.
4. **Given** an existing product, **When** an authorized edit is saved, **Then** future views
   reflect it while previous visualization input records remain unchanged.
5. **Given** a product referenced by a generation, **When** an ADMIN requests permanent
   deletion, **Then** deletion is blocked and archiving is offered instead.
6. **Given** an unreferenced product, **When** an ADMIN confirms deletion, **Then** it disappears
   from catalog results; cancelling the confirmation leaves it unchanged.
7. **Given** a product changed since the editor opened it, **When** that editor saves,
   **Then** an overwrite is prevented and the user can reload while retaining their entered values.

8. **Given** a priced product and a saved rate of 600,000 rials per USD, **When** its base
   price is USD 2, **Then** its equivalent prices show 1,200,000 rials and 120,000 tomans.
9. **Given** that product, **When** SUPER_ADMIN confirms a rate of 700,000 rials per USD,
   **Then** subsequent views show 1,400,000 rials and 140,000 tomans, preserve the USD 2 base
   price, and identify the new rate date. ADMIN and other roles cannot change the rate.
10. **Given** no USD rate, **When** a rial-priced product is viewed, **Then** its toman amount
    is available and its USD amount is explicitly unavailable; invalid or conflicting rate
    edits leave the saved rate unchanged.

### User Story 4 - Maintain Product Images (Priority: P1)

As a PRODUCT_MANAGER, I upload and arrange product images so colleagues can recognize products
and use a deliberate visual reference for room generation.

**Why this priority**: Generation requires usable product references.

**Independent Test**: Manage several images on a product and verify gallery order and validation.

**Acceptance Scenarios**:

1. **Given** a product without images, **When** its first valid image uploads successfully,
   **Then** it becomes primary and appears in the gallery and catalog thumbnail.
2. **Given** multiple images, **When** another is made primary or the gallery is reordered,
   **Then** the choice persists; reordering alone does not change the primary image.
3. **Given** a batch with valid and invalid files, **When** uploaded, **Then** each file has its
   own result; successful images remain and failed files can be retried individually.
4. **Given** an existing primary image, **When** its removal is confirmed, **Then** the next
   image by gallery order becomes primary, or an empty-image state appears if none remain.
5. **Given** unsupported, oversized, unreadable, or duplicate content, **When** uploaded,
   **Then** a specific reason appears and no duplicate or unusable catalog image is added.

### User Story 5 - Find a Suitable Product (Priority: P1)

As a USER, I browse, search, filter, and inspect active products so I can choose suitable tiles.

**Why this priority**: Staff must locate products both independently and during visualization.

**Independent Test**: Use a mixed catalog to verify name/SKU search, combined filters, paging,
primary thumbnails, details, and empty results.

**Acceptance Scenarios**:

1. **Given** a populated catalog, **When** a partial product name or SKU is searched without
   matching capitalization, **Then** matching visible products are returned.
2. **Given** multiple selected filter types, **When** results load, **Then** each result meets
   every filter type and the search term; clearing filters restores the accessible catalog.
3. **Given** a floor selection step, **When** the catalog opens, **Then** only active,
   floor-compatible products with usable reference images can be selected.
4. **Given** no matching products or no images, **When** the corresponding view opens,
   **Then** an explanatory empty result or image placeholder appears, without blocking navigation.

### User Story 6 - Visualize Floor and Wall Choices (Priority: P1)

As a USER, I upload a room photo, select floor and/or wall products, and generate a comparison
so I can evaluate how products might look in that space.

**Why this priority**: This is the primary visual decision-support capability.

**Independent Test**: With a prepared eligible catalog, complete floor-only, wall-only, and
combined requests, including progress, failure, and return-after-navigation behavior.

**Acceptance Scenarios**:

1. **Given** a valid room image, **When** upload completes, **Then** its preview appears before
   generation; replacing it requires confirmation if selections or prior draft work would be lost.
2. **Given** floor only, wall only, or both surfaces, **When** products are selected, **Then**
   exactly one eligible product is required for each selected surface and each reference is shown.
3. **Given** a missing product, no surface, invalid room image, or unusable product reference,
   **When** generation is requested, **Then** it is blocked with an actionable explanation.
4. **Given** a valid draft, **When** generation starts, **Then** one attempt is created, progress
   shows preparing/generating, and repeated clicks do not create additional attempts.
5. **Given** completed generation, **When** opened, **Then** the original and generated image
   can be compared and the selected products and surfaces are identified.
6. **Given** a generation in progress, **When** the user navigates away and returns or refreshes,
   **Then** its status and any completed result remain accessible without restarting it.
7. **Given** a failed or timed-out attempt, **When** retry is requested, **Then** a new linked
   attempt uses the retained inputs after eligibility checks; the failed attempt remains visible.

### User Story 7 - Revisit and Vary Visualizations (Priority: P2)

As a USER, I reopen my prior work and create variations. As an authorized administrator, I
review visualization activity within my access boundary.

**Why this priority**: Reuse avoids repeated setup and preserves decision context.

**Independent Test**: Seed attempts for two users and verify ownership, administrative access,
original/result comparison, historical product context, and variation links.

**Acceptance Scenarios**:

1. **Given** previous attempts, **When** history opens, **Then** newest entries appear first
   with date, status, selected surfaces/products, and an available preview.
2. **Given** another user's record or image link, **When** a user without all-history authority
   opens it, **Then** neither its existence nor private images are disclosed.
3. **Given** a completed attempt, **When** a variation is started, **Then** its original room
   image and choices prefill a new draft and may be changed without modifying earlier attempts.
4. **Given** a selected product later edited, archived, or stripped of an image, **When** old
   history opens, **Then** the original input context and result remain understandable; a new
   attempt requires currently eligible products and references.
5. **Given** an administrator inspecting someone else's history, **When** reviewing an entry,
   **Then** it is read-only except for SUPER_ADMIN session deletion; any permitted new variation
   belongs to the acting user and does
   not alter or impersonate the original owner.

6. **Given** a session without an active attempt, **When** SUPER_ADMIN confirms permanent
   deletion, **Then** its attempts and variations disappear from history, its images become
   inaccessible, and files still used by other records remain available. Cancelling changes nothing.
7. **Given** another role or a session with an active attempt, **When** deletion is attempted,
   **Then** it is denied without changing the session or images.

### User Story 8 - Navigate the Daily Dashboard (Priority: P2)

As any enabled user, I reach the permitted everyday tools from a simple landing page.

**Why this priority**: Consistent navigation makes the core capabilities discoverable.

**Independent Test**: Sign in with each role and inspect shortcuts, permitted counts, keyboard
navigation, tablet layout, and empty/error states.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** the dashboard opens, **Then** Products, AI Visualization,
   and Visualization History are available; Add Product and User Management appear only if permitted.
2. **Given** summary counts, **When** displayed, **Then** they count only records visible to that
   user and link to the corresponding filtered view.
3. **Given** a keyboard-only or tablet user, **When** completing a core workflow, **Then** all
   controls are reachable, labelled, and usable without hover-only actions or clipped form controls.
4. **Given** a partially completed form or visualization draft, **When** the user switches
   between Persian and English, **Then** system text and layout direction change while entered
   values, selections, current page, and generation state remain intact; their language choice
   remains selected on the next visit.

### Edge Cases

| Case | Required outcome |
| --- | --- |
| Invalid credentials / repeated attempts | Generic sign-in error; excessive attempts receive a temporary retry-later message. |
| Password recovery / delivery failure / expired link | Give non-disclosing request feedback; allow a new request; reject expired, superseded, or used links without changing the password or account permissions. |
| Duplicate registration email | Safe account-creation feedback without revealing account access status. |
| Expired session mid-edit | Require sign-in; preserve non-secret draft work for the same returning account, never show it to a different account. |
| Unauthorized direct action or image access | Deny without protected content or a state change; provide safe navigation. |
| Duplicate SKU / missing fields / negative or non-finite numbers | Block save, identify fields, retain valid inputs. |
| Product without images | Allow management and display a placeholder; block selection for generation. |
| Product referenced by previous or active generation | Block permanent deletion; permit authorized archiving without changing history. |
| Unsupported / oversized / corrupt image | Reject with the applicable format, size, or readability rule before it becomes usable. |
| Partial upload or lost connection | Show individual outcomes; retry failed files without duplicating successful ones. |
| Identical file under a different name | Detect content duplicate within the product; retain the existing image and order. |
| Room image with no recognizable requested surface | Explain inability to use it when detected; preserve draft and allow a replacement or different surface. |
| Product becomes inactive or reference removed before start | Revalidate, block start, and request a replacement selection. |
| Product changes after generation starts | Continue using the captured request context; do not silently substitute a new reference. |
| Provider unavailable or generation failure | Mark failed with a safe reason and retry option; keep original image and choices. |
| Generation exceeds ten minutes | Mark failed as timed out; do not leave an indefinite progress state. |
| Late result after timeout or duplicate completion | Keep the terminal attempt outcome stable; do not overwrite a retry or show a second success. |
| User leaves / refreshes during generation | Continue the accepted attempt and restore its current state on return. |
| Retry / double-click | Deliberate retry creates one linked attempt; repeated submission of the same action does not. |
| All references removed after completion | History remains readable using captured input references; new generation requires a current reference. |
| Session deletion / shared image / cleanup failure | Only SUPER_ADMIN can confirm deletion of a non-active session; revoke access immediately, preserve shared files, and retry incomplete cleanup. |
| Missing / invalid / concurrently changed exchange rate | Show unavailable USD conversions when missing, reject nonpositive or invalid rates, and prevent silent overwrites; keep base prices unchanged. |
| Last enabled SUPER_ADMIN removal | Block the operation and explain that another enabled SUPER_ADMIN is required. |
| Unsaved navigation / accidental back action | Retain the room draft and selections; confirm explicit discard or destructive replacement. |

## Requirements *(mandatory)*

### Functional Requirements

#### Access and account management

- **FR-001**: The system MUST support registration with display name, unique email, password,
  and password confirmation; login by email/password; logout; and authenticated sessions.
  Display names MUST contain 1–100 trimmed characters, and email addresses MUST have a valid
  email format. Email comparison MUST ignore case and surrounding spaces. Passwords MUST allow passphrases,
  require at least 12 characters, permit at least 64, and never be silently truncated.
- **FR-002**: Registration MUST create a pending USER account with no protected access.
  ADMIN or SUPER_ADMIN MUST be able to approve or reject pending USER registrations. Approval
  enables access; rejection leaves access denied and is visible to administrators. The applicant
  MUST see a pending or not-approved message after authenticating successfully. Approval MUST
  NOT grant a privileged role; only SUPER_ADMIN can subsequently assign another fixed role.
- **FR-003**: Unauthenticated visitors MUST be limited to entry/account-access screens. Failed
  sign-in MUST not reveal whether an email exists. Repeated failed attempts MUST temporarily
  restrict further attempts with understandable feedback.
- **FR-004**: Logout MUST end the current session. Expiry, deactivation, or permission removal
  MUST prevent the next protected action from using obsolete access. Passwords MUST not be
  retained in drafts or shown in user management. Users MUST be able to request a single-use
  password-reset link sent only to their registered email address. The request response MUST
  be the same whether or not the account exists. Links MUST expire after 30 minutes; issuing
  a new link MUST invalidate previous unused links. A valid link MUST allow a replacement
  password satisfying FR-001, invalidate all existing sessions and reset links, and return the
  user to sign-in without automatically signing them in. Password reset MUST NOT change role,
  approval, rejection, or deactivation status. Invalid, expired, or used links MUST show safe
  feedback and allow another request. Reset requests and attempts MUST be rate limited; email
  delivery failures MUST permit retry without revealing account existence.
- **FR-005**: Protected actions and related images MUST follow the role matrix below, including
  direct access attempts. Denials MUST cause no state change and reveal no inaccessible records.
- **FR-006**: SUPER_ADMIN MUST have all listed capabilities, including all-history access,
  assignment of the four fixed roles, and inspection of their permissions. V1 MUST NOT allow
  creating roles or changing/deleting their permission definitions.
- **FR-007**: User management MUST provide a searchable, paginated account list, account details,
  role assignment, and activation/deactivation within the actor's boundary. Actions affecting
  access MUST require confirmation and record actor, affected account, change, and date.
  ADMIN MUST inspect and manage only USER accounts, including pending registrations, and MUST
  NOT change roles. SUPER_ADMIN alone MUST assign roles or manage PRODUCT_MANAGER, ADMIN,
  and SUPER_ADMIN accounts. ADMIN MUST see only its own visualization history.
- **FR-008**: No user MUST grant authority beyond their own management boundary. ADMIN MUST NOT
  manage SUPER_ADMIN. Deactivating or demoting the last enabled SUPER_ADMIN MUST be blocked.
  Account removal MUST use deactivation in V1, preserving associated historical records.

#### Initial role and permission boundaries

“Yes” denotes permitted access for enabled approved accounts. Unlisted actions are denied.
These are fixed V1 permissions; role assignment does not permit changing their definitions.

| Protected action | SUPER_ADMIN | ADMIN | PRODUCT_MANAGER | USER |
| --- | --- | --- | --- | --- |
| View active products and images | Yes | Yes | Yes | Yes |
| View inactive / archived catalog records | Yes | Yes | Yes | No |
| Create / edit product, set active or inactive | Yes | Yes | Yes | No |
| Archive / restore / permanently delete eligible product | Yes | Yes | No | No |
| Upload / remove / reorder / select primary image | Yes | Yes | Yes | No |
| Generate floor / wall visualization | Yes | Yes | Yes | Yes |
| View own history and create own variations | Yes | Yes | Yes | Yes |
| View all visualization history and associated images | Yes | No | No | No |
| Permanently delete a visualization session and its variations | Yes | No | No | No |
| Approve / reject pending USER registration | Yes | Yes | No | No |
| Inspect / activate / deactivate accounts | All roles | USER only | No | No |
| View current exchange rate and converted product prices | Yes | Yes | Yes | Yes |
| Update the USD-to-rial exchange rate | Yes | No | No | No |
| Assign one of the four fixed roles | Yes | No | No | No |
| Inspect fixed role permissions | Yes | No | No | No |
| Create / edit / delete role definitions | No | No | No | No |

#### Product information and lifecycle

- **FR-009**: Authorized users MUST create, view, and edit products according to the field
  rules below. Invalid submissions MUST show field-level feedback and retain valid inputs.
- **FR-010**: SKU uniqueness MUST include active, inactive, and archived records and compare
  trimmed values without case sensitivity. Concurrent duplicate creation MUST not create two products.
- **FR-011**: New products MUST default to inactive. Activation MUST require all mandatory
  data but MUST NOT require an image. Changes to previously opened records MUST not silently
  overwrite another user's saved changes.
- **FR-012**: Archiving MUST hide products from ordinary active browsing and new visualization
  selection while preserving history. Restoring MUST return the product to inactive status.
  Archived records MUST be read-only until an authorized restore; editing status MUST NOT
  bypass restore permission. Permanent deletion MUST be limited to products not referenced
  by any submitted generation.
- **FR-013**: Deletion and archiving MUST require confirmation naming the product. Historical
  requests MUST retain the name, SKU, chosen references, and appearance context used at submission.

| Field | Required | Input and business validation |
| --- | --- | --- |
| Product name | Yes | Trimmed free text, 1–150 characters. |
| SKU / product code | Yes | Trimmed free text, 1–64 characters; unique per FR-010. |
| Category | Yes | Single controlled choice: ceramic tile, porcelain tile, mosaic tile. |
| Brand | No | Trimmed free text, up to 100 characters. |
| Collection | No | Trimmed free text, up to 100 characters. |
| Color | Yes | One primary controlled color: white, black, gray, beige, brown, red, blue, green, yellow, multicolor, other. |
| Material | Yes | Controlled choice: ceramic, porcelain, glass, natural stone, mixed; ceramic/porcelain categories require the matching material. |
| Dimensions | Derived | Display width × height, plus thickness when supplied, in millimeters; not independently editable. |
| Width / height | Yes | Positive finite decimal numbers in millimeters, up to two decimal places; mosaic dimensions describe the sold sheet. |
| Thickness | No | Positive finite decimal millimeters, up to two decimal places. |
| Surface / finish | Yes | Controlled choice: matte, polished, glossy, satin, textured, other. |
| Texture | No | Controlled choice: plain, stone-look, marble-look, wood-look, concrete-look, patterned, other. |
| Usage type | Derived | Floor, wall, or floor and wall, from compatibility flags. |
| Floor compatibility | Yes | Boolean; at least one of floor/wall compatibility must be true. |
| Wall compatibility | Yes | Boolean; at least one compatibility flag must be true. |
| Indoor/outdoor suitability | Yes | Controlled choice: indoor, outdoor, both. |
| Slip resistance | No | Free text, up to 100 characters, including rating scheme and value if supplied; blank displays “Not specified,” never an inferred safety rating. |
| Rectified | Yes | Boolean. |
| Country of origin | No | Selectable country name. |
| Price | No | One nonnegative finite base amount per unit of sale and selected base currency: Iranian rial, Iranian toman, or USD. Rial/toman base amounts are whole numbers; USD permits two decimal places. Other currency amounts are calculated using managed exchange rates. Blank means not supplied, not zero. |
| Stock quantity | No | Nonnegative finite decimal up to three decimal places in the stated sale unit; piece/box quantities must be whole numbers. Blank means unknown. |
| Unit of sale | Yes | Controlled choice: square meter, piece, box. |
| Description | No | Plain free text, up to 5,000 characters. |
| Active/inactive status | Yes | Controlled choice, inactive by default; archiving is a separate lifecycle action. |

- **FR-014**: Controlled product values MUST be consistently labelled across editing, browsing,
  filters, and selection. V1 MUST NOT require a separate taxonomy-management workflow.
- **FR-015**: Price and stock MUST be informational only; zero stock MUST NOT prevent
  visualization, and generation MUST NOT reserve or change stock. Prices MUST support Iranian
  rial, Iranian toman, and USD. Each priced product MUST retain one entered base amount and
  currency; the other two amounts MUST be derived using managed exchange rates. Converted
  prices MUST identify their currency and applied rate date. Changing a rate MUST NOT alter
  the entered base price. Missing required conversion rates MUST show an unavailable converted
  price, not zero or a guessed amount. Currency display MUST remain independent of interface language.
  Only SUPER_ADMIN MUST be able to manually set a positive finite rate expressed as rials per
  USD, with up to six decimal places. One toman MUST equal 10 rials; this relationship MUST NOT
  be editable. Rate updates MUST require confirmation and record the previous/new rate, actor,
  and effective timestamp. The latest saved rate MUST apply to subsequent price views without
  changing base amounts. No automatic rate feed or scheduled rate change is included in V1.
  Rial/toman conversions MUST display whole units and USD two decimal places, rounding half up
  only at final display. Conversions MUST derive directly from the base amount rather than
  converting an already rounded display value. Before a USD rate exists, rial/toman conversion
  MUST still work; only conversions involving USD are unavailable. Concurrent rate edits MUST
  not silently overwrite a newer saved rate.

#### Catalog and images

- **FR-016**: The catalog MUST provide case-insensitive partial name/SKU search, paging, and
  filters for category, primary color, finish, width/height, floor/wall compatibility, and
  permitted lifecycle status. Different filter types combine with AND; multiple values within
  one type combine with OR. Dimension matching uses the recorded width/height orientation.
- **FR-017**: Results MUST default to active products, sorted by name then SKU, with 24 per
  page, total matching count, primary thumbnail or placeholder, name, SKU, and dimensions.
  Managers MUST be able to explicitly view inactive and archived records. Filters and search
  MUST survive opening a product and returning to results.
- **FR-018**: Product details MUST show all supplied information and gallery images. Optional
  missing data MUST be distinguishable from zero, false, or a claimed product property.
- **FR-019**: Each product MUST support zero to 10 images. Authorized users MUST upload,
  view, remove, reorder, and choose a primary image. A nonempty gallery MUST have exactly one
  primary image. The first successful upload becomes primary; primary removal selects the
  first remaining image in order. Removal MUST require confirmation.
- **FR-020**: Product and room uploads MUST accept readable JPEG, PNG, or WebP still images,
  at most 10 MiB per file and 25 megapixels, with both dimensions at least 256 pixels. Animated,
  corrupted, disguised, or unsupported files MUST be rejected with a specific explanation.
  User-facing limits MUST be visible before upload. Product duplicate content MUST be detected
  within that product regardless of filename; the same image on a different product is allowed.
- **FR-021**: Upload progress and per-file success/failure MUST be visible. Retrying MUST NOT
  duplicate successful uploads. Failed product-image uploads MUST NOT discard saved product
  data or other images. An image removed from a catalog gallery MUST not break retained history.

#### Room visualization and history

- **FR-022**: The dedicated visualization journey MUST accept one room image per draft and
  preview it. Before submitting, the user MUST acknowledge they may use the image and that
  it will be processed by an external image-generation service; the notice MUST explain the
  configured image retention policy. Unreadable images MUST be rejected; detected non-room
  images MUST receive a request for a suitable room photo.
- **FR-023**: The user MUST choose floor, wall, or both and exactly one active compatible
  product with a usable image for each chosen surface. The same product MAY serve both when
  compatible with both. Deselecting a surface MUST exclude its product from the request.
- **FR-024**: Selection MUST reuse catalog search/filter behavior and show the product and
  its primary reference image. V1 MUST use that primary image as the generation reference.
  There MUST be no requirement for manual surface masking or multiple products on one surface.
- **FR-025**: Before accepting generation, the system MUST recheck account access, room input,
  selected surfaces, product eligibility, and references. Ineligible choices MUST be identified
  without discarding other draft inputs. Accepted attempts MUST capture their input context.
- **FR-026**: Each accepted attempt MUST show preparing, generating, completed, or failed.
  Preparing covers accepted work not yet generating. Completed requires a usable result.
  Attempts MUST leave active status within ten minutes of acceptance, failing with a timeout
  if necessary. Progress MUST not invent percentages. Terminal outcomes MUST remain stable.
- **FR-027**: A completed result MUST visually apply selected products to their designated
  floor/wall surfaces and permit original/result comparison. The room's viewpoint, geometry,
  furniture, and unselected surfaces MUST remain recognizable under the SC-006 evaluation.
  The result MUST be labelled an AI approximation, not an exact color, scale, or installation guarantee.
- **FR-028**: Refresh or navigation MUST NOT cancel an accepted attempt. Returning through
  history MUST restore progress or result. One draft per user MUST retain successfully uploaded
  room input and selections through normal navigation, refresh, and same-account reauthentication
  for at least 24 hours; explicit discard clears it. Unfinished file transfers are not saved drafts.
- **FR-029**: Failures MUST show a safe reason and retry action, retaining inputs. A deliberate
  retry or variation MUST create a new linked attempt, rechecking current eligibility. Repeated
  clicks or uncertain submission retries MUST not create duplicate attempts. A user MUST have
  at most one active attempt at a time; further starts MUST explain how to reopen that attempt.
- **FR-030**: Variations MUST allow the same or different products and surface selections with
  the same original image; replacing the room photo starts a new visualization session.
  Previous attempts and results MUST not be overwritten.
- **FR-031**: History MUST show all of the user's submitted attempts, including failures and
  in-progress attempts, newest first, with 20 entries per page and status filtering. Detail
  MUST show original image, captured product identity/references, surfaces, date, owner, status,
  and result or failure explanation; variations MUST be linked to their session.
- **FR-032**: All-history authority MUST follow the matrix. Authorized administrators MUST be
  able to filter activity by owner and status; ordinary users MUST never see other users'
  records, counts, originals, references, or results. History inspection MUST be read-only
  except for the SUPER_ADMIN session-deletion action defined in FR-033.
- **FR-033**: Submitted visualization sessions, original images, captured references, results,
  and variations MUST be retained without automatic expiry until SUPER_ADMIN explicitly deletes
  the session. Catalog changes and account deactivation MUST NOT delete this history. Only
  SUPER_ADMIN MUST be allowed to delete a session, with confirmation identifying its owner and
  warning that all its attempts and variations will be permanently removed. Sessions with an
  active attempt MUST be blocked from deletion until it reaches a terminal status. Confirmed
  deletion MUST make the session and its images inaccessible, remove it from history/counts,
  and remove its associated files unless they are still needed by another retained session,
  draft, or catalog product. Cleanup failures MUST remain recoverable without restoring access
  or deleting shared files. Record the actor, session identifier, and deletion date without
  retaining deleted image content. Other roles MUST NOT delete history; public sharing is
  excluded. The external-image processing policy MUST be documented before production;
  application deletion MUST NOT claim to erase provider-held copies unless that is verified.

#### Dashboard and experience

- **FR-034**: The post-login dashboard MUST provide Products, AI Visualization, and History,
  plus Add Product and User Management only when allowed. V1 summary cards MUST be limited
  to total visible products, active visible products, and visible generation-attempt count;
  advanced analytics and a separate activity feed are excluded.
- **FR-035**: Forms and data views MUST have labelled inputs, field feedback, loading,
  success, empty, and error states as applicable. Destructive actions MUST require explicit
  confirmation. Recoverable errors MUST retain valid input and offer a safe next action.
- **FR-036**: Core journeys MUST be usable with keyboard access, visible focus, labelled
  controls, readable contrast, and no color-only status signals. Desktop and tablet layouts
  MUST avoid clipped controls and hover-only actions; narrow screens MUST remain usable.
  The interface MUST support Persian with right-to-left layout and English with left-to-right
  layout. A language switch MUST be available on entry screens and throughout authenticated
  workflows. Switching MUST preserve the current page, entered form values, room draft, and
  generation state. The selected language MUST persist across navigation and subsequent visits.
  All system-provided labels, validation messages, statuses, confirmations, and empty/error
  states MUST be available in both languages. User-entered content and product names MUST NOT
  be automatically translated; SKUs, email addresses, and mixed-direction text MUST remain legible.

### Key Entities *(include if feature involves data)*

- **User**: An internal participant with identity, role, access status, and owned visualizations.
- **Role and permission**: Authority to perform named actions and access own or all records;
  four initial roles with protected administrative boundaries.
- **Product**: A catalog item with unique SKU, industry attributes, sale information,
  compatibility, active/inactive status, archive state, and an ordered image gallery.
- **Product image**: A visual reference belonging to one product, with primary designation,
  order, readability/availability, and descriptive file information.
- **Room draft**: One user's retained uploaded room image and current surface/product selections
  before submission; not a generation attempt.
- **Visualization session**: An owner and original room image grouping related attempts/variations.
- **Generation attempt**: One captured request with selected products, reference images,
  surfaces, effective generation settings, provider/model context, dates, status, failure or
  result, and optional predecessor. Captured inputs explain historical results without promising
  identical regeneration.
- **Exchange rate**: A positive rials-per-USD value manually maintained by SUPER_ADMIN, with
  effective timestamp, actor, and prior values for change traceability; the toman relationship
  is fixed at 10 rials and has no editable rate.
- **Access change record**: Who changed an account's role or access status, when, and what changed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance checks covering all four roles, 100% of prohibited actions and
  cross-user image/history accesses without all-history authority are denied without data
  disclosure or unintended changes.
- **SC-002**: At least 90% of 10 representative staff complete sign-in and find a named product
  without assistance within two minutes; approval waiting time is excluded.
- **SC-003**: At least 90% of 10 authorized staff create a valid product, upload two prepared
  images, and set the intended primary image without assistance within five minutes.
- **SC-004**: With 10,000 catalog products and 50 simultaneously active users on the agreed
  business connection, 95% of catalog searches/filter changes show usable results within two
  seconds, and dashboard/history views within three seconds, excluding initial image transfers.
- **SC-005**: At least 90% of 10 representative staff prepare and submit each of floor-only,
  wall-only, and combined requests within three minutes using prepared inputs. Every accepted
  attempt shows an active status within two seconds and reaches completed or failed within ten minutes.
- **SC-006**: Evaluate 30 agreed room/product combinations, 10 per surface mode, using the first
  attempt per case without cherry-picking variations. At least 24 of 30 MUST receive
  agreement from at least two of three business reviewers that (a) intended surfaces changed,
  (b) reference color/pattern resembles the selected product, (c) viewpoint and room geometry
  remain recognizable, and (d) furniture and unselected surfaces are substantially preserved.
  Failed attempts count as unsuccessful cases. Record each criterion per case.
- **SC-007**: In all specified failure, refresh, and navigation acceptance cases, saved inputs
  and prior results remain intact; retries produce exactly one new intended attempt and no
  unauthorized or duplicate result.
- **SC-008**: Every submitted attempt in acceptance testing is retrievable by its authorized
  owner with correct original, captured choices, status, and available result after product edits,
  archiving, and reference removal until explicit SUPER_ADMIN deletion; unauthorized accounts
  retrieve none. After deletion, no role can retrieve the deleted session or its exclusive images,
  and other sessions sharing an image remain readable.
- **SC-009**: All critical scenarios above pass on desktop (1440 × 900) and tablet (1024 × 768),
  in both Persian/right-to-left and English/left-to-right layouts, and all core controls can
  be reached and operated using only a keyboard. Language-switch acceptance checks MUST show
  no lost form values or visualization state and no untranslated system messages in core flows.

## Assumptions

- V1 serves one business with a shared catalog; multi-tenant organizations are excluded.
  All four roles may generate visualizations, including SUPER_ADMIN and ADMIN.
- Confirmed by the user: registration requires administrator approval; ADMIN manages only
  USER accounts and views only its own history; SUPER_ADMIN assigns four fixed roles and
  inspects their fixed permissions. Other boundaries are conservative defaults: PRODUCT_MANAGER
  edits products but does not archive/delete; USER sees active products; removal means deactivation.
- The initial SUPER_ADMIN is designated by the business before staff onboarding.
  Self-service email password recovery is included; invitations remain outside V1. The business
  MUST provide a working transactional email sender before release. The 30-minute reset-link
  lifetime is the V1 default; recovery never bypasses approval or account deactivation.
- Catalog fields, controlled choices, lengths, upload limits, inactive defaults, paging sizes,
  and the ten-minute timeout are proposed V1 defaults. Category expansion requires a later change;
  no taxonomy editor or separate supplier/brand management is included.
- Confirmed pricing scope: Iranian rial, Iranian toman, and USD, with one base price per
  product and derived amounts using a SUPER_ADMIN-maintained USD-to-rial rate and a fixed
  10-rials-per-toman relationship. Tax, discounts, inventory movements,
  and box-coverage calculations remain excluded.
- Confirmed language scope: Persian and English with a persistent language switch and matching
  layout direction. V1 translates system-provided interface text, not user-entered catalog content.
  A separate translation-management interface is excluded. Currency MUST NOT change merely
  because the user switches interface language.
- Generation is visual inspiration rather than measurement or installation guidance. Product
  availability does not imply stock reservation; finish, safety rating, or suitability is never
  inferred from an image. Manual masks, prompt editors, and reference-image selection are excluded.
- Dependencies are an approved generation service capable of room/reference processing,
  business-supplied product/reference content, a working recovery-email sender, a designated
  initial administrator, and documented
  provider image-use and deletion policies before production. Provider quality is evaluated by
  SC-006; production readiness cannot be claimed without that evaluation.
- Drafts persist for at least 24 hours. Confirmed retention policy: submitted sessions and
  associated images have no automatic expiry and remain until SUPER_ADMIN deletes the session.
  Provider-held copies follow the documented provider policy, not an assumed deletion guarantee.
- V1 scope comprises authentication, role-based user management, product CRUD/search/filter,
  email password recovery, bilingual Persian/English UI, SUPER_ADMIN-managed exchange rates,
  SUPER_ADMIN session deletion, multiple images and primary selection, one room image,
  floor/wall selection with one product
  per surface, generation/progress/results, variations, history, and a simple dashboard.
- Explicitly out of scope: ecommerce checkout, payments, customer ordering, ERP integration,
  warehouse management, inventory forecasting, advanced analytics, native mobile applications,
  AR, real-time 3D, automatic room measurement, multi-room projects, collaborative editing,
  complex workflow automation, public sharing, and history deletion by roles other than SUPER_ADMIN.
- Engineering decisions, schemas, service contracts, deployment design, and implementation
  tasks belong to later phases and MUST comply with the existing constitution.
