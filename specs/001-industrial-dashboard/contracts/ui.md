# UI and State Contract

Applies to [spec](../spec.md) stories1–8. Engineering styling follows the constitution's Material
principles through Tailwind tokens, not a requirement to add another UI framework.

## Routes and boundaries

| Route | Visibility | Main behavior |
| --- | --- | --- |
| `/login`, `/register` | Public | Labelled forms; generic errors; pending access status after credential verification |
| `/forgot-password`, `/reset-password` | Public | Generic request acknowledgement; single-use link entry, no auto-login |
| `/dashboard` | Approved enabled | Allowed shortcuts and scoped counts |
| `/products` | All approved | Search/filter/paging; primary thumbnail or placeholder; retained query on return |
| `/products/new`, `/products/{id}/edit` | CAT | Grouped product fields, gallery controls; archived read-only |
| `/products/{id}` | Product visibility | Details, image gallery, base/derived price with rate date |
| `/visualization` | All approved | Room draft, floor/wall choices, eligible catalog selection, submit |
| `/visualizations`, `/visualizations/{attemptId}` | Owner; SA all scope | History/status/comparison/variation; SA confirmed session deletion |
| `/users`, `/users/{id}` | ADM target boundaries | Approval/access controls; role assignment only SA |
| `/settings/exchange-rate` | SA | Current rate, revision/date, confirmed manual replacement |

Route guards improve navigation but API is the security boundary. App layout and initial reads
can be Server Components; interactive fields, gallery, locale controls, comparison and polling
are Client Components. Shared API layer maps stable error codes, manages CSRF/single-flight
refresh and preserves idempotency keys. Protected fetches and media are no-store.

## Localization without losing state

Persistent locale provider above pages; never key forms/page trees by locale or navigate to a
new locale route on switch. Cookie initializes server `lang`/`dir`; preference updates immediately
in the client, then persists to cookie/user preference. Localized server-rendered text must be
updated through dictionary-backed client labels or a controlled refresh preserving stable client
component identity. Test both to avoid stale-language fragments. First visit: browser `fa`→Persian,
otherwise English; explicit choice wins on future visits.

Every system string has matching en/fa keys: labels, options, validation, statuses, confirmations,
empty states, safe errors and email templates. Input values, query filters, draft selections and
attempt status remain unchanged. Catalog names/descriptions are not translated. Use logical CSS
start/end, inline bidirectional isolation for SKU/email and `dir=auto` for free text. Normalize
Persian/Arabic digits before numeric validation; store canonical decimal strings. Gregorian dates
with localized labels are V1 default. Currency remains explicit IRR/TOMAN/USD independent of locale.
Self-host a licensed font covering Persian and Latin; retain license in implementation.

## Common controls and state matrix

Material semantic color/type/shape/elevation/spacing tokens. Target48px controls on tablet,
4.5:1 text contrast, visible focus, reduced-motion support, and no hover-only actions. Forms use
visible labels, required indicators and units. After failed submit focus a summary linking to
invalid fields; preserve inline errors with aria-describedby. Toast alone is insufficient.
Dialogs trap focus, name consequence/target, default to safe cancel, and return focus on close.

| State | Required interface behavior |
| --- | --- |
| Loading read | Stable skeleton/placeholders with accessible label; do not show false zero counts |
| Saving | Disable duplicate submit; retain input; indicate operation |
| Success | Localized confirmation and updated current revision |
| Empty | Distinguish no products, no matches, no images, no history, and no FX rate |
| Validation failure | Summary plus inline translated errors; focus management; keep valid values |
| Revision conflict | Explain newer saved version; preserve user's values, offer reload/review, no silent overwrite |
| Auth expiry | Clear protected views; sign-in recovery; retain nonsecret draft only for same verified account |
| Forbidden/not found | Safe message/navigation without revealing inaccessible owner or record |
| Provider failure | Safe reason, retained input, deliberate retry; no raw provider exception |
| Deleted session | Leave detail view and remove stale history/counts; fresh media access404 |

Maintain non-secret dirty product-form state only in a browser in-memory store keyed by current
account/form while sign-in overlay occurs; clear visible data on expiry and discard on different
account login/logout. Durable room drafts remain API-owned. Never save passwords/reset secrets
as drafts. On explicit logout clear private client caches; subsequent room recovery requires sign-in.

## Catalog and gallery

24-card catalog pages, search name/SKU, distinct filter controls and clear-all; status filters only
for managers. Picker reuses catalog controls with surface eligibility and active filter fixed.
Product editing groups identity, physical properties, usage, pricing/stock, and description; optional
fields visibly optional. New products default inactive, image optional. Stock0 does not block selection.

Gallery first image primary; badge identifies it. Reorder by drag plus labelled move-earlier/later
buttons for keyboard and touch. Removal confirmation describes primary replacement. Per-file uploads
show transfer then validation progress and individual success/errors; retry only failed files.
Batch attachments update product revision before later primary/order requests. Primary selection
is independent of order. No bare asset IDs exposed as public links.

## Visualization

One room preview → choose floor/wall/both → select eligible product for each chosen surface →
review references and privacy notice → submit. Incomplete draft valid but Generate disabled with
explanation. Changing original requires confirmation; do not discard existing draft if upload fails.
Persist selections after edit, show save state, restore after refresh. One active attempt blocks a
second start with “View current generation.” Status uses PREPARING/GENERATING labels, not fabricated
percentages. Poll2s while visible, refetch on return; ten-minute deadline includes preparing time.

Compare labelled original/result side-by-side at desktop and stacked at narrow widths; optional
slider cannot be the only accessible comparison. Show selected products, generation date, and
AI-approximation notice. Retry/variation populates draft with a new submission key; parent attempt
remains unchanged. SA all-history detail is not impersonation; variations belong to the actor.
Session deletion confirms owner plus all variations, blocks active attempts, and removes detail
access immediately even if physical cleanup is ongoing.

## User administration and pricing

ADMIN list contains USER accounts only, including pending registrations; no higher-role search
results/counts. SA sees all and fixed permissions; no editable permission matrix. Approve/reject
and disable/enable are separate actions. Last-enabled-SA protection comes from API conflict.

Rate form accepts rials per1USD only; static note states 1toman=10rials. Show previous rate and
new conversion example before confirmation. Display base price distinct from derived prices, rate
time for USD-related conversion, and unavailable rather than0 if no rate. Locale never changes
selected currency or base price. Round only derived display values per REST/data-model rules.

## Validation evidence

Playwright checks each route/role in both locales, switching mid-form and mid-generation, keyboard
image reorder, reset expiry, confirmation cancellation, forbidden direct URLs, and private image
reload after deletion. Run desktop/tablet and narrow smoke sizes; check dictionary parity, accessible
names/focus, translated errors and no clipping. Async Server Components are covered through browser
flows rather than assumed to be supported by client unit tests.
