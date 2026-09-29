# Eggplant Method / Chad Kermit
# Local Export, Mux Migration, Production Readiness & Resident-AI Handoff

**Research/audit date:** 2026-09-28 (Asia/Singapore)

**Scope:** read-only assessment and implementation handoff. No production account was changed, no wallet/payment was initiated, and no Mux asset was uploaded.

**Important evidence rule:** the current source tree was inspected separately from the older planning Markdown. Where they disagree, this report treats the current source as authoritative and labels the planning statement stale.

## 0. Executive decision

### Recommended target architecture

```text
Public Chad Kermit landing page
  → bottom sheet
  → Blunt inline crypto checkout (Blunt.embed; not popup)
  → payment.confirmed webhook
  → idempotent order + entitlement
  → email access link
  → /access exchange to HttpOnly entitlement cookie
  → server entitlement check
  → short-lived Mux signed playback JWT
  → Mux HLS player
  → optional signed Mux static MP4 download

Admin/media pipeline
  → private master archive (R2/S3/B2 or equivalent)
  → Mux direct upload / asset processing
  → Mux asset.ready webhook
  → playback IDs + captions + poster
```

### Decision on Mux

Use Mux for **both**:

1. a public teaser/cut clip, using a public or signed playback policy depending on whether the teaser should be shareable; and
2. the paid course lesson, using a **signed playback policy**, server-minted JWTs, short expiration, and entitlement checks.

Keep the original master in a separate private archive. Mux's streaming asset is delivery/encoding infrastructure, not the sole archival copy. Mux documentation states that the original file is not stored in its exact uploaded form.

### Decision on download

Do not make a ZIP the primary product for a single lesson. Offer:

- **Watch the lesson** — Mux HLS playback;
- **Download a copy** — optional signed static MP4 URL, only after entitlement verification.

A ZIP is appropriate only when the product includes multiple deliverables such as MP4 + captions + transcript + bonus materials. If downloads are offered, record the download action and rate-limit signed URL issuance; do not make the URL permanent.

### Launch status

The project is **not production-ready** and does not currently take payment. The sheet's primary action is explicitly disabled with “Crypto checkout setup pending.” There is no Blunt webhook, order store, Mux asset, Mux token route, or private playback route in `src/`.

---

## 1. What this project is for

The project is a single-product digital-video storefront for a Chad Kermit / Eggplant Method lesson:

- a public marketing page;
- a mobile-first bottom-sheet purchase handoff;
- email-delivered access;
- a protected purchased-course surface;
- a video teaser on the public side;
- a full paid lesson after payment and entitlement verification;
- optional download access;
- light/dark theme and PWA shell.

The actual business-critical path is currently incomplete. The UI is ahead of the commerce/media backend: it can show the product, but it cannot yet safely accept Blunt crypto payment and unlock Mux video.

---

## 2. Current state — observed in source

### 2.1 Routes

| Route | Current behavior | Status |
|---|---|---|
| `/` | Server page checks access query state, legacy token, then `eggplant_access` cookie; otherwise public homepage | Partially functional |
| `/access?token=&courseId=` | Verifies a legacy token, sets an HttpOnly cookie, redirects to clean course URL | Implemented, requires end-to-end verification |
| `/my-course/[courseId]` | Client checks legacy token or cookie through `/api/verify-code`, then renders `PurchasedExperience` | Auth shell exists; video missing |
| `/proof` | Redirects to `/` | Intentional removal of proof gallery |
| `POST /api/verify` | Zod-validates and calls shared verifier | Redundant route; should eventually be removed or documented |
| `POST/GET /api/verify-code` | Verifies token; POST sets cookie; GET checks cookie | Current access API |
| `POST /api/internal/fulfillment-trigger` | Bearer-protected legacy fulfillment: creates token in Redis and sends Gmail SMTP email | Not idempotent; not Blunt webhook; unsafe as payment authority |

No `src/app/api/blunt/*` or `src/app/api/mux/*` routes exist.

### 2.2 Current public experience

- `UnpurchasedHomepage.tsx` owns the landing page.
- `AntechamberModal.tsx` owns the bottom sheet.
- The bottom sheet is accessible in the basic sense: dialog semantics, Escape, body scroll lock, focus restoration and a focus-trap implementation are present.
- The button is disabled rather than pretending checkout works.
- Course and creator copy is data-driven through `src/lib/course-content.ts`.
- The creator fields currently contain the old screenshot-derived personal/health claims. They are attributed/disclosed in source, but should not be treated as independently verified evidence.
- Current hero imagery is hotlinked from an external Alibaba CDN URL rather than stored locally or in a controlled image host.

### 2.3 Current purchased experience

`PurchasedExperience.tsx` correctly refuses to show a public file URL. It currently shows:

> Secure video delivery is being connected

and disables Watch and Download. This is honest but incomplete. The component also references `storefrontContent.course.subtitle` and `socialProofClaim`, so the data model must remain synchronized with the component.

### 2.4 Current PWA shell

The current source tree contains:

- `public/manifest.webmanifest`;
- `public/sw.js`;
- `public/offline.html`;
- `public/icons/icon-192.png`;
- `public/icons/icon-512.png`;
- `public/icons/apple-touch-icon.png`;
- `src/components/PwaRegistrar.tsx`;
- metadata in `src/app/layout.tsx`.

The service worker only handles same-origin navigation fallback and deliberately skips API, access, course and media paths. That is the correct security posture for protected media, but it is not an offline video feature.

### 2.5 Current validation state

At the latest audit point, `node_modules` was absent. `npm run build` failed with:

```text
sh: 1: next: not found
```

The workspace therefore cannot currently be claimed to have a fresh passing build. Earlier in the session, a build had passed after dependency installation, but that is not current evidence. To reproduce locally, run `npm ci` first, then `npm run build` and `./node_modules/.bin/tsc --noEmit`.

---

## 3. Mux evaluation

### 3.1 Why Mux fits this product

Mux matches the product's needs because it provides:

- adaptive HLS delivery;
- asset processing and readiness webhooks;
- public or signed playback policies;
- server-side JWT signing for protected playback;
- posters/thumbnails derived from playback IDs;
- WebVTT/SRT captions and optional automatic caption generation;
- optional static MP4 renditions for downloads;
- player integrations suitable for Next.js;
- delivery analytics through Mux Data if deliberately enabled.

### 3.2 Teaser design

Recommended public teaser:

- a short cut clip rather than the full lesson;
- no paid-course asset URL exposed in client course data;
- public playback ID if the teaser is intended to be shareable; or signed playback if the teaser is only for the storefront;
- poster generated by Mux or stored in a controlled image layer;
- captions if speech is present;
- no claims in the teaser that are not substantiated.

If the teaser is public, assume the URL can be shared. It should not contain the complete lesson or a meaningful portion that substitutes for the paid product.

### 3.3 Paid lesson design

Paid lesson:

1. Store Mux asset ID and signed playback ID server-side.
2. Create a server route such as `GET /api/media/playback`.
3. Verify the `eggplant_access` entitlement cookie against Redis/order state.
4. Mint a short-lived Mux JWT using the Mux signing private key and key ID.
5. Return only the playback ID/token needed by the player.
6. Render the Mux player client-side.
7. Never put Mux API secret, signing private key, or a permanent paid URL into a client module.

Mux signed playback requires an expiration. Add a short TTL appropriate for playback, for example 15–60 minutes, and re-mint after expiry. The entitlement remains the durable authorization; the Mux JWT is only a short-lived delivery credential.

### 3.4 Playback restrictions

Use Mux playback restrictions where appropriate:

- referrer/domain validation for the production domain;
- user-agent validation only if its operational tradeoffs are understood;
- no claim that restrictions prevent screen recording;
- consider DRM only if the commercial value justifies it.

Mux DRM supports Widevine, PlayReady and FairPlay but requires signed playback and higher video quality/DRM configuration. FairPlay requires an Apple FPS certificate. DRM is not necessary for the first launch of a low-price single lesson; signed playback plus entitlement is the pragmatic launch baseline.

### 3.5 Captions and accessibility

Create captions as WebVTT/SRT tracks. For a paid lesson, captions are not just a polish feature:

- improves accessibility;
- supports silent mobile viewing;
- permits translation later;
- provides a transcript asset if legally and commercially appropriate;
- makes the video more usable when audio is unavailable.

If using a default subtitle language with signed playback, include the required modifier in the signed token as required by Mux documentation.

### 3.6 Mux webhooks

Create a separate route such as:

```text
POST /api/webhooks/mux
```

Verify the `mux-signature` header over `timestamp + "." + raw_body` with the endpoint secret. Verify the timestamp tolerance (Mux documents a default five-minute tolerance), reject replayed/out-of-window events, deduplicate by event ID, and return a fast 2xx after durable state handling.

Useful events:

- `video.upload.asset_created` — associate an upload to a Mux asset;
- `video.asset.ready` — mark the asset playable;
- `video.asset.errored` — mark failed processing and alert;
- asset/track updates — reconcile captions/posters/metadata.

Do not confuse Mux webhook event IDs with Blunt `payment_id`. They require separate dedupe namespaces.

### 3.7 Mux cost model

Mux pricing is a snapshot and must be rechecked before launch:

- cost dimensions are input/encoding, storage and delivery, generally based on minutes and delivered resolution;
- Basic quality has free input encoding for on-demand video;
- published example Plus 1080p input pricing is approximately $0.031250/minute for the first tier;
- published first-tier 1080p storage example is approximately $0.003000/minute/month for Basic/Plus;
- Mux publishes 100,000 free delivery minutes/month and a $20 monthly usage credit for the relevant pay-as-you-go offering in the reviewed pricing material;
- exact delivery rates vary by resolution/tier and must be read from the current pricing table;
- static MP4 rendition generation/storage has its own rules and should be included only if downloads are offered;
- DRM is an additional paid capability.

For a single short lesson with low traffic, early Mux cost is likely dominated by the free/credit thresholds and then delivery usage rather than encoding. Do not budget from this paragraph alone; record the current Mux calculator output in the deployment ledger.

Sources:

- [Mux documentation](https://www.mux.com/docs)
- [Stream video files](https://www.mux.com/docs/guides/stream-video-files)
- [Direct uploads](https://www.mux.com/docs/guides/upload-files-directly)
- [Secure video playback](https://www.mux.com/docs/guides/secure-video-playback)
- [Mux Player React](https://www.mux.com/docs/guides/mux-player-react)
- [Mux webhooks](https://www.mux.com/docs/core/listen-for-webhooks)
- [Verify Mux webhook signatures](https://www.mux.com/docs/core/verify-webhook-signatures)
- [Mux playback images](https://www.mux.com/docs/guides/get-images-from-a-video)
- [Mux subtitles](https://www.mux.com/docs/guides/add-subtitles-to-your-videos)
- [Mux DRM](https://www.mux.com/docs/guides/protect-videos-with-drm)
- [Mux pricing overview](https://www.mux.com/docs/pricing/overview)
- [Mux pricing text export](https://www.mux.com/docs/pricing.txt)
- [Mux usage CSV export](https://www.mux.com/docs/pricing/export-usage-data-as-a-csv)
- [Mux privacy policy](https://www.mux.com/privacy)
- [Mux DPA](https://www.mux.com/dpa)

---

## 4. Payment evaluation and method matrix

### 4.1 Selected payment rail: blunt.cash crypto

The application’s current payment plan is Blunt, not Stripe or PayPal. Blunt facts below come from the user-provided docs and the canonical URLs recorded in the project's Blunt notes.

| Payment method | Buyer path | Where it comes from | Product decision |
|---|---|---|---|
| Connect wallet | Buyer connects a compatible wallet and approves the transaction | [Blunt wallet payment docs](https://blunt.cash/merchant/docs/storefront/wallets) | Support; do not treat wallet connection as payment confirmation |
| Open in wallet | Mobile checkout hands off to a wallet's own browser | [Blunt wallet payment docs](https://blunt.cash/merchant/docs/storefront/wallets) | Support; preserve QR/copy fallback for in-app browsers |
| Scan QR | Buyer scans payment instructions with a wallet on another device | [Blunt wallet payment docs](https://blunt.cash/merchant/docs/storefront/wallets) | Always keep available |
| Copy/paste | Buyer copies exact amount/destination into their wallet | [Blunt wallet payment docs](https://blunt.cash/merchant/docs/storefront/wallets) | Always keep available; most robust fallback |
| Inline checkout | Checkout renders inside a DOM target | [Blunt embed docs](https://blunt.cash/merchant/docs/integrate/embed) | Primary integration inside our bottom sheet |
| Popup checkout | Branded modal opened by `Blunt.pay` | [Blunt embed docs](https://blunt.cash/merchant/docs/integrate/embed) | Do not use; conflicts with popup-free direction |
| Hosted checkout | Link to Blunt-hosted page/payment link | [Blunt embed docs](https://blunt.cash/merchant/docs/integrate/embed) | Fallback only if inline cannot mount reliably |
| Image pay badge | Light/dark SVG linked to a hosted payment URL | User-supplied Pay Button Badges excerpt; notes state the page was not independently retrieved | External distribution only: Linktree, QR, email, partners |
| HTML pay button | `blunt.js` + `data-blunt-*` button opens Blunt popup | User-supplied Pay Button Badges excerpt | Not primary; it opens a popup and bypasses our sheet state |

Blunt webhook and API sources:

- [Blunt merchant docs](https://blunt.cash/merchant/docs)
- [Embeds](https://blunt.cash/merchant/docs/integrate/embed)
- [Zero-code integration](https://blunt.cash/merchant/docs/integrate/zero-code)
- [Webhooks](https://blunt.cash/merchant/docs/integrate/webhooks)
- [REST API](https://blunt.cash/merchant/docs/reference/api)
- [Chains](https://blunt.cash/merchant/docs/reference/chains)
- [Errors](https://blunt.cash/merchant/docs/reference/errors)
- [Checkout experience](https://blunt.cash/merchant/docs/storefront/checkout)
- [Wallet payment paths](https://blunt.cash/merchant/docs/storefront/wallets)
- [Branding](https://blunt.cash/merchant/docs/storefront/branding)

### 4.2 Blunt state machine

```text
order.created
  → payment.pending
  → payment.partial        (never grant access)
  → payment.confirmed      (only grant access here)
  → entitlement.active
  → access.email.sent

Alternative terminal/recovery states:
  payment.failed
  payment.expired
  payment.late
  payment.refunded
  email.pending / email.failed
```

The browser `onSuccess` callback is not a fulfillment authority. Only the verified `payment.confirmed` webhook should activate access.

### 4.3 Blunt order requirements

Create a server-side order before mounting checkout:

- opaque internal `order_id`;
- immutable product ID;
- server-owned price/currency;
- accepted chain/token allowlist;
- registered destination wallet mapping;
- buyer email if supplied by checkout or collected by our sheet;
- Blunt payment ID(s);
- payment state and timestamps;
- live/test mode;
- webhook event ledger.

Use an idempotency key tied to the order/attempt. Never derive price or destination wallet from untrusted browser input.

### 4.4 Conventional payment expansion

No conventional payment provider is currently implemented. If card/mobile-wallet acceptance is later added, do not merge it into the Blunt state machine without a provider adapter:

- Stripe official docs describe Payment Intents/Elements and Checkout; its Payment Sheet is documented for mobile apps and uses a bottom sheet: [Stripe Payment Sheet](https://docs.stripe.com/payments/mobile/accept-payment), [Stripe Checkout](https://docs.stripe.com/payments/checkout/how-checkout-works).
- PayPal is not currently selected and was not used as a source of truth for this plan.

The production abstraction should be:

```text
PaymentProviderAdapter
  createAttempt()
  normalizeEvent()
  verifyWebhook()
  getStatus()
  refund()
```

Blunt is adapter one. Adding cards later becomes adapter two, not a rewrite of entitlement logic.

---

## 5. Complete transfer and migration matrix

| Domain | Current asset/state | Owner | Export/transfer action | Destination | Risk | Backup/rollback |
|---|---|---|---|---|---|---|
| Source | `src/` | Project owner | Git commit/archive; preserve history if available | Git provider | Missing original repo history; archive may be reconstructed | Keep original RAR and separately hash ZIP export |
| Build config | `package.json`, lock, TS/Tailwind/PostCSS/Next config | Project owner | Export exact files; compare reconstructed manifest with canonical repo | Git + deployment | Next/ESLint/React type-version mismatch | Pin versions; keep pre-upgrade lockfile |
| App routes | `src/app/**` | Developer | Route inventory and smoke tests | Git | Auth/payment route drift | Tag release; retain prior deployment |
| Public assets | `public/manifest.webmanifest`, SW, icons, offline page | Designer/developer | Export binary assets and verify MIME/dimensions | Git/CDN | Brand icons may be placeholders | Keep source SVG/PNG originals outside repo |
| Hero imagery | External Alibaba CDN URLs | Brand owner | Obtain licensed/local originals; replace hotlinks | Object storage/CDN | Link rot, licensing, performance | Keep approved originals + license record |
| Teaser | Current public Dailymotion URL in course data | Content owner | Confirm ownership and final cut; migrate to Mux public/signed teaser | Mux + archive | Existing URL may be public/uncontrolled | Preserve original only if licensed; can roll back teaser ID |
| Full master | Not present in current source; old plan says full media must be private | Content owner | Obtain original MP4/master; checksum; archive | R2/S3/B2 + Mux | No source master in export | 2 independent encrypted copies + checksum manifest |
| Mux account | Not connected | Account owner | Create org/env, API credentials, signing key, webhook endpoint | Mux production + staging envs | Wrong environment or lost signing key | Key rotation procedure; record IDs, not secrets |
| Mux assets | None currently referenced | Account owner | Upload via direct upload; map `passthrough` to product/media ID | Mux | Asset readiness/captions missed | Mux ready/errored webhook ledger; archive master |
| Playback keys | None | Security owner | Generate signing key; store private key as secret | Vercel secret env | Leak grants playback token creation | Rotate key; retain key IDs and rotation dates |
| Blunt account | Dashboard/wallets user-managed | Merchant owner | Confirm public/test/live keys, merchant ID, webhook secret, registered wallets | Blunt dashboard + Vercel | Exposed key; wrong wallet routing | Revoke/rotate; test/live isolation |
| Blunt wallets | User says supported wallets added | Merchant owner | Export/record chain/address/activity without seeds | Secure ops ledger | Wrong chain/address; irreversible funds | Verify small test payment before launch; never store seed phrases |
| Orders | No order database/model | Project owner | Build order store in Redis or durable DB | Upstash/DB | No support/refund/audit trail | Append-only event ledger + backups |
| Entitlements | Raw token Redis records only | Project owner | Migrate to hashed-token/entitlement records; preserve legacy read path during cutover | Redis/DB | Invalidating existing links | Dual-read, new-write, staged retirement |
| Redis | `KV_REST_API_*`/Upstash compatibility helper | Infra owner | Export schema/key prefixes and TTL policy; do not export live values casually | New Upstash/Redis | PII/access token leakage | Encrypted export; restore drill; key rotation |
| Email | Inline Gmail SMTP | Email owner | Confirm sender/domain/auth; migrate to transactional provider or keep verified SMTP | Email provider | Sender mismatch, delivery/retry issues | Test inbox set; fallback template; delivery log without tokens |
| Email template | `src/emails/AccessEmail.tsx` exists but is unused; inline HTML is used | Developer/designer | Choose one template source; render/test all clients | App + email provider | Brand divergence; missing logo asset | Snapshot HTML; send test matrix |
| Domain/DNS | Not present in repo | Owner/infra | Transfer registrar/DNS records; set Vercel domain and webhook URL | Registrar + Vercel | Wrong target or webhook inaccessible | Low TTL cutover; keep old domain until verified |
| Environment | No `.env.example`; no env files | Security/infra owner | Build redacted env contract; set Preview/Production separately | Vercel env scopes | Preview accidentally uses live money/media | Test keys only in Preview; production secrets Sensitive |
| Documents | Blunt plan/spec/source notes; no README in current tree | Project owner | Keep report, add README/runbook and data map | Git/docs | Resident AI lacks context | Version docs with release tag |
| Legal | No privacy/terms/refund/withdrawal docs in repo | Owner + counsel | Draft and approve policy set | Site pages + checkout links | Regulatory/consumer/comms exposure | Legal review + versioned policy records |
| Analytics | Mux Data not configured; no product analytics contract observed | Owner | Choose minimal privacy-preserving analytics | Mux/Vercel/analytics vendor | Sensitive data leakage | Consent/opt-out and event schema |
| CI/CD | No verified CI workflow observed | Developer | Add install/typecheck/build/audit/test pipeline | Git provider + Vercel | Broken main deploy | Required checks + rollback deploy alias |
| Test fixtures | No order/webhook/media fixtures observed | Developer | Create sanitized test payloads; never commit secrets | `tests/fixtures` | False positives or leaked data | Synthetic data only |
| Support | No resend/access recovery/support route | Operations owner | Define email lookup/recovery with rate limit and proof of ownership | App/support inbox | Account enumeration/privacy leaks | Generic responses + audit log |
| Refunds | No refund route; Blunt only records refund after merchant sends funds | Merchant/finance owner | Define policy and admin process; record `payment.refunded` | Blunt + internal ledger | Refund mismatch/tax records | Reconcile tx hash and payment ID |
| Tax/accounting | No ledger/export | Finance owner | Export payment IDs, crypto amount, USD quote, chain, timestamp, wallet, refunds | Secure accounting store | Incorrect basis/reporting | Monthly reconciliation and immutable export |
| Ownership | Not recorded in repo | Owner | Create `OWNERSHIP.md` with account/domain/code/media/data contacts | Git | Orphaned access when people change | Two-person recovery/rotation process |

---

## 6. Export package requirements

A production handoff must include:

```text
project/
  src/
  public/
  archive/                 # legacy UI, clearly labeled
  package.json
  package-lock.json
  tsconfig.json
  next.config.ts
  tailwind.config.ts
  postcss.config.mjs
  next-env.d.ts
  .gitignore
  README.md
  .env.example             # names and safe placeholders only
  docs/
    architecture.md
    operations.md
    payment-state-machine.md
    media-runbook.md
    data-retention.md
    legal-links.md
    migration-manifest.md
  tests/
    fixtures/               # synthetic payloads only
```

Do **not** export:

- `node_modules/`;
- `.next/`;
- `.env*` secrets;
- Blunt secret/public key values from chat or screenshots;
- Mux signing private key;
- wallet seed phrases/private keys;
- raw buyer emails/access tokens unless encrypted and explicitly needed;
- production webhook payloads with PII;
- preview tooling/screenshot archives unless intentionally retained.

Create SHA-256 hashes for the source archive, media masters and migration manifest. Store the hash manifest separately from the public repository.

---

## 7. Local run/export instructions

### Prerequisites

- Node.js version pinned by the project owner; use the current LTS compatible with the chosen Next version.
- npm.
- Redis/Upstash development credentials if testing access routes.
- Mux test credentials only after the Mux account is configured.
- Blunt test key/webhook secret only after the merchant dashboard is configured.

### Run

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

### Validate

```bash
./node_modules/.bin/tsc --noEmit
npm run build
```

The current `lint` script is `next lint`; with Next 16 this must be replaced by an ESLint CLI script before relying on lint in CI.

### Required environment contract

The project currently uses or should use these groups:

```text
# Access/infra
KV_REST_API_URL=
KV_REST_API_TOKEN=
NEXT_PUBLIC_BASE_URL=

# Current legacy fulfillment (replace with provider-independent mail)
EGGPLANT_METHOD_INTERNAL_SECRET_KEY=
EGGPLANT_METHOD_GMAIL_USER=
EGGPLANT_METHOD_GMAIL_APP_PASSWORD=

# Blunt test/production
BLUNT_PUBLIC_API_KEY=
BLUNT_SECRET_API_KEY=
BLUNT_MERCHANT_ID=
BLUNT_WEBHOOK_SECRET=
BLUNT_MODE=test
BLUNT_ACCEPTED_CHAINS=
BLUNT_EXPECTED_DESTINATION_WALLETS_JSON=

# Mux
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
MUX_SIGNING_KEY_ID=
MUX_SIGNING_PRIVATE_KEY=
MUX_WEBHOOK_SECRET=
MUX_ENVIRONMENT=

# Media/archive (provider-specific)
MEDIA_MASTER_BUCKET=
MEDIA_MASTER_ENDPOINT=
MEDIA_MASTER_ACCESS_KEY_ID=
MEDIA_MASTER_SECRET_ACCESS_KEY=
```

Do not put real values in `.env.example`. Use Vercel Development/Preview/Production scopes and separate test/live Blunt keys.

---

## 8. Resident local AI instructions

The local AI that manages this project should follow this operating contract:

### Read first

1. Read `README.md`, `docs/architecture.md`, `docs/operations.md`, `docs/migration-manifest.md`.
2. Inspect `package.json`, lockfile, `tsconfig`, `next.config`, routes and environment contract.
3. Treat `archive/legacy-proof` as historical reference, not live UI.
4. Treat `blunt-cash-integration-plan.md` and this report as plans; verify current source before claiming completion.

### Never do

- Never use a live Blunt secret, Mux signing key, wallet private key or seed phrase in source.
- Never log buyer email + access URL/token together.
- Never grant access from a browser callback.
- Never grant access for `partial`, `failed`, `expired` or unverified events.
- Never expose the full paid Mux playback URL/token in public course data.
- Never upload or stream a master through a Next.js function.
- Never invent creator biography, health claims, testimonials, ratings or social-proof counts.
- Never enable a chain whose destination wallet has not been verified as registered and active.
- Never use a production wallet in Preview.
- Never run automatic dependency upgrades without reviewing lockfile/security impact.

### Every feature change must include

1. affected file list;
2. expected behavior;
3. failure states;
4. security/privacy impact;
5. mobile/accessibility impact;
6. test cases;
7. rollback plan;
8. environment variables added/removed;
9. whether the change is live, test-only or UI-only.

### Payment rule

The only fulfillment authority is the verified Blunt `payment.confirmed` event. The UI may say “payment detected” but not “access granted” until the server entitlement is active.

### Mux rule

The only source of paid playback authorization is a server route that verifies entitlement and mints a short-lived signed Mux JWT. The client receives a playback token, not a signing key.

### Reporting rule

At the end of each task report:

```text
Changed:
Verified:
Not verified:
Blocked by:
Rollback:
Next safe step:
```

---

## 9. Production implementation plan

### Wave 0 — Freeze and protect

- Revoke/rotate any Blunt public key copied into public/shared material if it is not intentionally public.
- Ensure no secret appears in screenshots, Markdown, ZIPs or logs.
- Add Git repository protection, branch protection and CI.
- Pin Node/package versions.
- Add `README.md`, `.env.example`, ownership and migration manifest.

### Wave 1 — Correct core access

- Keep current legacy-token read compatibility.
- Introduce hashed entitlement records for new orders.
- Make cookie Secure in production regardless of proxy protocol detection.
- Add rate limits for `/access`, `/api/verify-code` and support/recovery paths.
- Add generic error responses to avoid account/token enumeration.
- Remove redundant `/api/verify` after all clients are migrated.
- Make fulfillment idempotent by internal order ID/payment ID.

### Wave 2 — Mux media

- Obtain and checksum master files.
- Create Mux staging environment.
- Create direct upload route for admin-only use; do not expose Mux secret.
- Attach `passthrough` product/media ID.
- Handle `video.asset.ready` and `video.asset.errored`.
- Add captions and poster.
- Add teaser playback ID.
- Add paid signed playback ID.
- Add `/api/media/playback` entitlement gate.
- Add optional `/api/media/download` static rendition gate.
- Add Mux webhook signature verification and event dedupe.

### Wave 3 — Blunt payments

- Configure Product in Blunt dashboard as a digital good.
- Require email only; no shipping.
- Choose only verified chain/token pairs.
- Create order endpoint with server-side price and metadata.
- Mount `Blunt.embed` inside the existing sheet.
- Add payment state polling/status UI without granting access from polling.
- Add Blunt webhook with raw-body HMAC verification.
- Add event dedupe by `payment_id`.
- Activate entitlement only on confirmed events.
- Send email once; retries reuse the same entitlement and do not mint a second token.

### Wave 4 — product quality

- Replace hotlinked hero art with approved local/CDN assets.
- Add real teaser poster and creator-approved content.
- Add legal policy links, refund and digital-delivery language.
- Fix email template/logo and sender identity.
- Add support/recovery flow.
- Add analytics only after privacy review.
- Add error tracking with token/PII redaction.

### Wave 5 — launch

- Preview uses test Blunt keys and Mux staging assets.
- Run full simulated payment suite.
- Run a small live payment on a low-fee supported chain.
- Verify correct wallet, webhook, entitlement, email, playback and download.
- Promote exact commit to Production.
- Keep previous deployment available for rollback.

---

## 10. Test and validation matrix

### Build and static checks

- `npm ci` from a clean checkout;
- TypeScript strict check;
- production build;
- ESLint CLI check;
- dependency audit reviewed, not blindly auto-fixed;
- no secret scanner findings;
- no untracked generated assets;
- all route imports resolve.

### Payment tests

- valid test payment confirmed;
- duplicate confirmed webhook;
- changed-body invalid signature;
- missing signature;
- stale/replayed signature;
- wrong merchant ID;
- unknown order ID;
- wrong amount;
- wrong chain/token;
- partial payment;
- failed payment;
- expired payment;
- late payment in grace period;
- payment refund;
- test event rejected from production;
- create-payment retry with same idempotency key;
- double-click CTA;
- sheet close/reopen during pending quote;
- chain wallet not registered;
- Blunt rate limiting.

### Mux tests

- direct upload completion;
- `asset_created` mapping;
- `asset.ready` makes media available;
- `asset.errored` blocks playback and alerts;
- Mux invalid signature;
- Mux stale signature;
- duplicate Mux webhook;
- paid route without entitlement;
- paid route with expired entitlement;
- signed token expiration;
- playback restriction on wrong referrer;
- captions visible;
- poster works;
- download URL expires;
- master archive checksum matches source.

### Access/privacy tests

- no token in final URL after access exchange;
- cookie is HttpOnly, Secure in Production, SameSite=Lax;
- invalid link does not reveal whether an account exists;
- Redis unavailable returns temporary failure, not invalid-link claim;
- access only works for bound course;
- token not logged;
- email not logged with token;
- analytics does not capture token query strings;
- no Mux private key in client bundle;
- API routes use no-store where access status is involved.

### UX/accessibility tests

- 320, 390, 430, tablet and desktop widths;
- light/dark theme;
- keyboard-only sheet navigation;
- focus stays inside sheet including backdrop handling;
- focus returns to CTA;
- Escape and backdrop close before payment starts;
- payment sheet close behavior during pending payment is explicit;
- screen-reader status for pending/confirmed/failed/expired;
- captions and poster available;
- reduced motion;
- no horizontal overflow;
- touch targets ≥44px;
- safe-area bottom padding;
- wallet deep-link failure has QR/copy fallback.

---

## 11. Deployment procedure

### Staging

1. Create a separate Vercel Preview/Development environment.
2. Add `mk_test_*` Blunt key and test webhook secret.
3. Add Mux staging credentials and staging playback restrictions.
4. Register the staging Blunt webhook URL publicly; do not put it behind deployment protection.
5. Deploy a tagged commit.
6. Run the simulated Blunt payment suite.
7. Upload a non-sensitive test video to Mux staging.
8. Confirm Mux webhooks and signed playback.
9. Confirm email sandbox/inbox.

### Production

1. Confirm legal pages and refund/digital-content language.
2. Confirm domain/DNS and HTTPS.
3. Confirm Blunt live wallet registrations and accepted chain allowlist.
4. Confirm Mux production asset, poster, captions and playback restrictions.
5. Add production secrets as sensitive variables; never paste into repo.
6. Deploy immutable release commit.
7. Run smoke tests without making a payment.
8. Make one small real payment.
9. Confirm: wallet → Blunt event → order → entitlement → email → `/access` cookie → Mux playback.
10. Export payment/Mux/Redis operational records and record timestamps.
11. Announce launch only after end-to-end evidence is captured.

### Rollback

- Stop the public CTA by feature flag or set checkout state to unavailable.
- Do not delete paid entitlements during rollback.
- Keep the webhook route returning a safe 2xx only when the event is durably recorded; otherwise allow provider retry.
- Repoint Vercel to the prior known-good deployment.
- Revoke compromised Mux signing keys or Blunt keys if required.
- If Mux playback fails, do not substitute a public full-video URL. Show a service message and retain entitlements.
- If email fails, retry from the existing entitlement; never mint a new access token solely because email failed.

---

## 12. Legal, privacy and business requirements

This section is general operational guidance, not legal advice.

### Required before public launch

- Privacy policy identifying the site as controller/business and vendors as processors/service providers where applicable;
- Mux DPA/subprocessor review;
- Blunt merchant/payment terms and crypto risk disclosure;
- digital-content delivery/refund policy;
- jurisdiction-specific withdrawal/instant-access consent where required;
- clear one-time price and currency;
- no hidden recurring billing;
- support contact and access-recovery procedure;
- evidence/substantiation for testimonial, rating, outcome, social-proof and health claims;
- consent and retention statement for buyer email;
- cookie/analytics disclosure if non-essential tracking is enabled;
- crypto accounting/tax process.

Relevant authoritative sources:

- [Mux privacy](https://www.mux.com/privacy)
- [Mux DPA](https://www.mux.com/dpa)
- [California Attorney General — CCPA](https://oag.ca.gov/privacy/ccpa)
- [EU GDPR official text](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [FTC advertising and marketing guidance](https://www.ftc.gov/business-guidance/advertising-marketing)
- [FTC negative-option rule](https://www.ftc.gov/legal-library/browse/rules/negative-option-rule)

The existing creator and result copy includes sensitive personal/health/measurement claims. It should not be treated as verified merely because it appeared in the original screenshot. Keep disclosures or replace with approved, substantiated copy.

---

## 13. Prioritized issue register

### P0 — launch blockers

1. No Blunt integration.
2. No Mux integration/private playback.
3. No idempotent order/entitlement model.
4. Legacy fulfillment route can mint multiple tokens on retries.
5. No verified end-to-end build in the current workspace because dependencies are absent.
6. No documented production env contract or README.
7. No production payment/media legal and support flow.

### P1 — serious security/reliability

8. Raw bearer tokens are still accepted and stored as Redis keys for legacy compatibility.
9. Access cookies determine Secure from request protocol; production should force Secure.
10. No rate limiting.
11. Inline Gmail sender is hardcoded and may not match authenticated sender.
12. Mux/Blunt webhook routes absent.
13. No database/event ledger for orders, refunds, entitlement delivery or support.
14. `next lint` script is incompatible with Next 16.
15. Dependency version mismatches: Next 16 vs eslint-config-next 14; React 19 vs React types 18.
16. Latest full build/type check must be rerun after a clean `npm ci`.

### P2 — product and UX

17. Teaser still points to Dailymotion; paid video is unavailable.
18. Hero image is hotlinked and not optimized.
19. Creator content needs approved final copy and identity alignment.
20. Current course content includes attributed health claims; needs claim policy.
21. No checkout pending/confirmed/failure integration states beyond disabled preview.
22. No customer recovery/resend flow.
23. No persistent review system; do not display fake review/rating UI.
24. Need final poster, captions, transcript/download decision, OG image and favicon strategy.

### P3 — operational maturity

25. CI/CD absent or unverified.
26. No ownership/on-call matrix.
27. No backup/restore drill documented.
28. No monthly Mux/Blunt/Redis reconciliation.
29. No privacy-preserving analytics/event schema.
30. No release/rollback runbook in repository.

---

## 14. Final self-audit for omissions and contradictions

- [x] Current source inspected separately from stale planning Markdown.
- [x] Current routes and public assets inventoried.
- [x] Mux upload, asset, playback, signed-token, webhook, captions, DRM, poster and pricing topics covered.
- [x] Mux source URLs cited.
- [x] All Blunt buyer payment methods in the supplied docs listed and cited.
- [x] Blunt embed vs popup decision stated.
- [x] Blunt webhook authority and idempotency stated.
- [x] Local export files and exclusions specified.
- [x] Credentials/secrets/ownership/backups covered.
- [x] Local run and production deployment instructions covered.
- [x] Resident local-AI operating contract included.
- [x] Security, privacy, legal, tax and claim-substantiation risks identified.
- [x] Mux costs labeled as a dated snapshot requiring recheck.
- [x] No claim that Mux or Blunt was already integrated.
- [x] No claim that the current workspace has a fresh passing build.
- [x] Rollback and failure-state procedures included.

### Remaining open decisions

1. Final approved product/brand name: Eggplant Method vs Chad Kermit title.
2. Verified creator name/bio/photo/social link and which personal/health claims, if any, are legally approved.
3. Whether paid download is offered in addition to streaming.
4. Final Mux quality tier and whether DRM is worth the cost.
5. Blunt accepted chain/token allowlist and wallet routing map.
6. Email provider and sender-domain decision.
7. Database choice: Redis-only vs durable relational order ledger.
8. Production domain and deployment owner.
9. Final legal jurisdiction/policies.

---

## 15. Bottom line

This project can be exported and taken local, but it is not currently a complete production product. The correct next build order is:

```text
clean export + README/env contract
→ dependency/version repair + clean build
→ order/entitlement ledger
→ Mux staging upload + signed playback
→ Blunt test checkout + signed webhook
→ email/recovery
→ captions/poster/download decision
→ legal/support/reconciliation
→ one small live payment
→ production launch
```

Do not ship the current disabled checkout as if it were a payment flow, do not use a public full-video URL as a fallback, and do not make paid access depend on a client callback. The product-grade system is achievable, but the payment, entitlement and private-media layers still need to be implemented and tested as separate, auditable capabilities.
