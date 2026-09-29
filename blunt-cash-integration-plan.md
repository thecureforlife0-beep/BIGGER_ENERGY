# Chad Kermit + blunt.cash Integration Plan

**Status:** Planning only — no application source changed in this analysis.

**Recommended target:** A custom, bottom-sheet-first crypto checkout on the existing Next.js site, with blunt.cash as the payment rail, signed webhooks as the payment authority, and a private media-delivery layer for the paid video.

---

## 1. Executive recommendation

Use the existing custom site rather than sending buyers to a separate blunt.cash storefront.

### Recommended purchase experience

```text
Landing page
  ↓ one tap: “Unlock the method”
Our bottom sheet opens
  ↓ email is collected by blunt.cash checkout configuration
Inline blunt.cash checkout mounts inside the sheet
  ↓ buyer chooses chain / wallet / QR / copy-paste
Buyer pays directly to the registered wallet
  ↓ blunt.cash confirms on-chain
Signed payment.confirmed webhook reaches our server
  ↓ server verifies signature + payment + order + amount + wallet
Order becomes paid; entitlement is created idempotently
  ↓ frontend observes paid state and email is sent
Success bottom sheet: “Your access is ready”
  ↓
Private course page verifies entitlement
  ↓
Private video playback URL and optional download URL are issued
```

The browser callback must never be the source of truth. A wallet saying “sent” and a client-side `onSuccess` callback are not enough. The blunt.cash webhook is authoritative because blunt.cash says it watches the chain, verifies the correct asset/amount, and only then confirms the payment.

### Bottom-sheet decision

Use `Blunt.embed` inside the existing custom bottom sheet, not `Blunt.pay` popup mode.

- `Blunt.pay` is explicitly a branded modal/popup and conflicts with the product direction.
- `Blunt.embed` is the docs-supported full inline checkout mode.
- The app owns the sheet, backdrop, drag handle, motion, focus management, and success/error states.
- blunt.cash owns the trusted payment mechanics inside the embedded checkout: chain choice, quote, wallet connection, wallet deep-link, QR, copy/paste, and on-chain monitoring.
- Do not attempt to redraw or fake the wallet/payment mechanics ourselves.

If the actual Blunt widget cannot mount cleanly in a bottom sheet or cannot return the metadata needed by our webhook flow, use a controlled fallback: open the blunt.cash hosted checkout in the same tab and return to a dedicated status page. Do not embed a secret API key or invent an undocumented iframe protocol.

---

## 2. What the blunt.cash docs establish

### Docs pages/sections reviewed

The docs site is a client-rendered/section-based documentation site. Several guessed nested URLs return 404, so missing pages were not fabricated. The canonical accessible sections and the user-provided excerpts were reconciled below.

| Area | Source | Integration consequence |
|---|---|---|
| Product / platform overview | [Merchant docs](https://blunt.cash/merchant/docs) | Hosted storefront is fastest; custom integration is appropriate for an existing Next.js site. Payments are non-custodial and settle directly to merchant-controlled wallets. |
| Pay Button Badges | User-supplied merchant docs excerpt; public docs page was not indexed by search | Useful as a no-code distribution/fallback surface: a light/dark SVG can link to a hosted product/payment URL, and the HTML snippet can auto-bind a branded checkout button. Not the primary integration for our bottom-sheet-first app. |
| Zero-code attributes | [Zero-code buttons](https://blunt.cash/merchant/docs/integrate/zero-code) | Public key is safe in client markup; amount, chains, description, order ID, and JSON metadata can be attached. Not sufficient by itself for our custom state model without a webhook. |
| Embed modes | [Popup, inline & hosted embeds](https://blunt.cash/merchant/docs/integrate/embed) | `Blunt.pay` is popup; `Blunt.embed` renders inline; hosted pages are useful as fallback/payment links. Inline is the correct mode for our sheet-first UX. |
| Webhook events | [Webhooks](https://blunt.cash/merchant/docs/integrate/webhooks) | Handle `payment.confirmed`, `payment.failed`, `payment.expired`, `payment.refunded`; subscription events are not needed for a one-time digital product. |
| Webhook signature | [Webhooks — HMAC section](https://blunt.cash/merchant/docs/integrate/webhooks#hmac) | Verify `X-Blunt-Signature` using HMAC-SHA256 over the exact raw request body before JSON parsing. |
| Webhook retries | [Webhooks — retries section](https://blunt.cash/merchant/docs/integrate/webhooks#retries) | Deduplicate using `payment_id`; return a fast 2xx after durable processing/queueing. Blunt retries failed delivery for up to 24 hours. |
| REST API | [REST API](https://blunt.cash/merchant/docs/reference/api) | Secret API key stays server-side. `merchant-create-payment`, `get-payment`, test simulation, wallet registration/listing, and refund recording are available. |
| Wallet routing | [REST API — destination routing](https://blunt.cash/merchant/docs/reference/api#destination) | A requested destination must be an active registered wallet for that chain. There is no silent fallback. The resolved destination must be stored and checked. |
| API idempotency | [REST API — idempotency](https://blunt.cash/merchant/docs/reference/api#idempotency) | Same key + same parameters replays safely; same key + changed parameters conflicts; expired/terminal sessions cannot be replayed. |
| Test simulation | [REST API — simulate section](https://blunt.cash/merchant/docs/reference/api#simulate) | Test API keys and `payment-simulate` can drive confirmed, underpaid, and expired states and deliver signed test webhooks. Test events carry `test: true` and `X-Blunt-Mode: test`. |
| Chain matrix | [Supported chains & tokens](https://blunt.cash/merchant/docs/reference/chains) | Configure the intersection of active registered wallets and supported chain/token pairs. Do not enable every chain by default. |
| Error cases | [Error codes](https://blunt.cash/merchant/docs/reference/errors) | Handle invalid key/chain/token, missing wallet, rate limiting, dust/minimum amount, wrong amount, wrong token, wrong chain, and expiry. |
| Storefront branding | [Branding & domain](https://blunt.cash/merchant/docs/storefront/branding) | Upload logo/accent in Blunt dashboard; the accent propagates through checkout/receipt/post-payment screen. Keep it visually aligned with our app accent. |
| Checkout behavior | [Checkout experience](https://blunt.cash/merchant/docs/storefront/checkout) | Volatile quotes last 10 minutes; stablecoin quotes last 30 minutes; a 5-minute grace window watches for late payment. Buyers can refresh the quote without restarting. Digital goods can require email without shipping. |
| Wallet buyer paths | [How buyers pay from their wallet](https://blunt.cash/merchant/docs/storefront/wallets) | Support connect wallet, open in wallet, QR, and copy/paste. In-app browsers often block app handoffs; QR/copy-paste remain fallbacks. |

### Important docs limitation

The public excerpts establish the payment and webhook contracts, but they do **not** establish the secure storage limits, file-size limits, download-link lifetime, or access-control guarantees of blunt.cash’s dashboard **File Download** option. Do not assume that uploading a private MP4/ZIP there gives the same protection as an application-controlled entitlement system until Blunt confirms it.

### Pay Button Badges: decision for this product

**Do we need it? Not for the primary site checkout.**

The badge feature gives us two additional distribution paths:

1. **Image drop-in:** download a light or dark SVG badge, upload it anywhere images are supported, and link it to a Blunt product/payment URL.
2. **HTML snippet:** load `https://blunt.cash/widget/blunt.js` once and place a button carrying `data-blunt-amount` and `data-blunt-description`; the widget opens Blunt’s branded checkout popup.

Those are valuable for:

- a link in bio / Linktree
- an email signature
- an affiliate or partner page
- a QR/NFC landing page
- a static fallback page
- a simple teaser microsite where our app is not present

They are **not** the right primary CTA here because:

- the image badge links away to a hosted checkout and cannot participate in our bottom-sheet status UI;
- the HTML snippet opens the Blunt popup, which violates the popup-free product direction;
- a static badge cannot create our local order/attempt state before checkout;
- neither path replaces the signed webhook, idempotent fulfillment, or secure media delivery.

**Implementation choice:** use the app’s custom bottom-sheet + `Blunt.embed` as primary. Add a dark/light SVG badge only as an optional external distribution asset, linked to a reusable hosted Payment Link after the webhook/fulfillment pipeline is working. Keep the badge link out of the main app purchase button.

**Security note:** the user-supplied snippet visibly includes a live public API key. Treat that key as exposed in public content; rotate/revoke it in the Blunt dashboard if it is active, then use a new public key. Never place a secret API key in the browser. A public key is safe to embed by Blunt’s docs, but it should still be rotated if you do not intend it to remain public.

---

## 3. Current application reality

| Current file | Current behavior | Problem for Blunt integration |
|---|---|---|
| `src/components/UnpurchasedHomepage.tsx` | Opens the custom `AntechamberModal`; its CTA currently points to `vendetta-machine.vercel.app`. | No Blunt payment session, no local order ID, no payment state. |
| `src/components/AntechamberModal.tsx` | Bottom sheet visual, then external checkout link. | Good shell for the new flow, but its primary action must mount `Blunt.embed`; no hard-coded external handoff. |
| `src/app/api/internal/fulfillment-trigger/route.ts` | Authenticated endpoint creates a 365-day Redis token and sends Gmail SMTP email. | It is an old connector-shaped fulfillment contract. It generates a new token on each retry and logs the access URL; it is not a safe idempotent Blunt webhook consumer. |
| `src/app/api/verify-code/route.ts` | Reads a token from Redis, checks course ID, keeps token valid for 365 days. | Token model can be retained conceptually, but direct bearer token URLs and plain Redis keys need hardening. |
| `src/app/my-course/[courseId]/page.tsx` | Client-side token verification, then renders purchased experience. | Access/loading/error state is not yet part of the new design system. Client page should not expose the full asset URL. |
| `src/components/PurchasedExperience.tsx` | Displays an image linking to a Google Drive folder. | This is not private video playback. The Drive URL is hard-coded client-side and can be shared directly. |
| `src/components/VideoPlayer.tsx` | Dailymotion teaser/player wrapper. | It can be retained for a public teaser only; never use a public Dailymotion URL for the paid full video. |
| `src/lib/course-data.ts` | Teaser and full URLs are Dailymotion URLs, with placeholder `picsum` thumbnails. | Paid asset must be removed from public data and replaced by a server-only private asset configuration. |
| `src/emails/AccessEmail.tsx` | Branded access email component exists. | It should become the single fulfillment email template and receive the durable access URL from the entitlement service. |
| `src/app/page.tsx` | Server page verifies query token by calling the app API and otherwise renders public page. | Avoid silently falling back from an invalid token to the sales page; show a clear access state and do not leak entitlement status. |

### Existing security/logic issues to fix as part of this integration

1. **Duplicate fulfillment risk:** current fulfillment creates a new token every time the connector retries.
2. **Token leakage:** current route logs the complete access URL.
3. **Direct asset leakage:** Google Drive folder URL is shipped to the browser.
4. **Unclear source of truth:** there is no local order record tying a payment ID to a token/entitlement.
5. **Email retry ambiguity:** if token creation succeeds and SMTP fails, retry can create another token and send multiple links.
6. **Public data contamination:** `course-data.ts` contains full-video URLs in client-consumable code.
7. **Gateway fallback ambiguity:** an invalid token on `/` renders the public page again instead of an explicit invalid/expired state.

---

## 4. Payment and fulfillment architecture

### 4.1 Data model

Use a durable order record. Redis can support an MVP, but a relational table is preferable for support, refunds, reporting, and reconciliation.

#### `orders`

```text
id                    internal order ID, opaque, unique
product_id            eggplant-method-v1
status                pending | awaiting_confirmation | paid | fulfilled |
                      payment_failed | expired | refunded | manual_review
email                 buyer email collected by Blunt checkout
amount_usd            expected price snapshot, e.g. 22.30
currency              USD
blunt_payment_id      nullable; do not assume only one attempt
blunt_merchant_id     merchant ID snapshot for audit
chain_id              confirmed chain
 token                confirmed token
amount_crypto         confirmed amount
destination_wallet    confirmed resolved payout wallet
sender_wallet         optional support/anti-fraud record
tx_hash              confirmed transaction reference
is_test               test/live marker
created_at
paid_at
fulfilled_at
expires_at
```

#### `payment_attempts`

```text
id                    internal attempt ID
order_id
blunt_payment_id      unique when known
status                pending | confirmed | failed | expired | partial | late
quoted_chain
token
quoted_amount_crypto
quote_expires_at
raw_provider_status   safe normalized status only
created_at
updated_at
```

One order may have multiple attempts if a buyer closes/restarts checkout. Only one confirmed payment should satisfy the order. A second confirmed payment for an already-paid order becomes `manual_review`/duplicate-payment handling; never silently mint a second entitlement.

#### `entitlements`

```text
id
order_id
course_id
email
access_token_hash
expires_at
media_policy_version
created_at
revoked_at nullable
```

Store a hash of the bearer token where practical; never store/log the raw token in application logs. The durable link can remain valid for 365 days if that is the product policy, but media URLs should be short-lived and regenerated after each entitlement check.

#### `webhook_events`

```text
payment_id           primary/deduplication key
event_type
signature_verified
is_test
raw_received_at
processed_at
processing_status
last_error
```

### 4.2 State machine

```text
ORDER_CREATED
  ↓
CHECKOUT_OPEN
  ├─ buyer closes → CHECKOUT_OPEN / resumable until expiry
  ├─ payment.failed → PAYMENT_FAILED (retry allowed)
  ├─ payment.expired → EXPIRED (new attempt allowed)
  ├─ partial / underpay → NEEDS_RECOVERY (never grant access)
  └─ payment.confirmed
        ↓
  PAYMENT_CONFIRMED
        ↓
  ENTITLEMENT_ISSUED
        ├─ email sent → FULFILLED
        └─ email failed → FULFILLMENT_RETRY_PENDING
                              (same entitlement, no new token)

FULFILLED
  ├─ access request → signed media URL issued
  └─ refund recorded → REFUNDED / policy-based access action
```

### 4.3 Webhook route behavior

Create `src/app/api/blunt/webhook/route.ts`.

1. Read `await request.text()` exactly once.
2. Read `X-Blunt-Signature` and optional `X-Blunt-Mode`.
3. HMAC-SHA256 the exact raw body with `BLUNT_WEBHOOK_SECRET`.
4. Compare signatures with a constant-time comparison.
5. Reject invalid signatures with 401 before parsing or changing state.
6. Parse JSON only after signature verification.
7. Validate the event shape with Zod.
8. In live mode, reject/ignore `test: true`; in test mode, explicitly mark it as test.
9. Require `event === payment.confirmed` before fulfillment.
10. Check `merchant_id` matches the configured merchant.
11. Require a valid `metadata.order_id` and known product/course ID.
12. Load the local order.
13. Check expected amount, chain/token, destination wallet, and order state.
14. Deduplicate by `payment_id` before issuing entitlement.
15. Create entitlement and token exactly once.
16. Queue/send email using the same entitlement on retries.
17. Return a 2xx quickly once durable processing is complete/queued.
18. Never log raw payloads, access URLs, API keys, webhook secrets, or bearer tokens.

### 4.4 Browser callback behavior

The inline widget’s `onSuccess` callback is only a **presentation hint**:

```text
onSuccess → show “Payment sent — confirming on-chain…”
          → poll our /api/orders/:id status
          → reveal access only when our server says fulfilled
```

Do not grant access from `onSuccess`, `window.location`, a wallet “sent” screen, or a client-controlled metadata value.

---

## 5. Bottom-sheet checkout design

### Sheet hierarchy

```text
Sheet: Unlock the method
  Drag handle
  Close button
  Product identity: Chad Kermit / The Viral 2-Step Method
  Price: $22.30 one-time
  “Email required so we can send your access link.”
  [Pay with crypto]  ← one dominant action
  Small trust line: direct-to-wallet / no account / email receipt

After inline Blunt embed mounts:
  Chain picker
  Quote + countdown
  Connect wallet
  Open in wallet
  QR
  Copy amount/address
  Refresh quote
  Payment monitoring state

After server fulfillment:
  Checkmark / “Access is ready”
  [Watch the lesson]  ← primary
  [Download a copy]   ← secondary if enabled
  [Email me the link again] ← tertiary
```

### One-tap principle

The first tap should open the sheet and immediately prepare/mount the inline checkout. Avoid a separate “Are you sure?” confirmation layer. The only required buyer field is email, configured through Blunt’s digital-product buyer-info setting. Do not ask for wallet login, username, shipping address, Telegram, or ZeroChat for this product.

### Sheet behavior

- Bottom sheet, not a centered popup.
- Backdrop tap closes only before payment is submitted; after a payment attempt, closing preserves the order and shows “Resume payment” next time.
- Drag down closes only when the checkout is idle; while a wallet confirmation/chain monitor is active, show a safe close action rather than silently destroying context.
- Escape closes only when safe.
- Focus trap while open; return focus to the opening CTA on close.
- `aria-modal="true"`, labeled title, live region for payment status.
- `env(safe-area-inset-bottom)` and short-viewport scroll handling.
- The close button must not be the only way out; backdrop and Escape remain available.
- No automatic redirect to a third-party page from a callback.

### Error copy mapping

| Provider condition | User-facing state | Allowed action |
|---|---|---|
| Invalid chain/token | “That payment route is unavailable right now.” | Choose another enabled route |
| Missing wallet | “This route is temporarily unavailable.” | Choose another chain; dashboard fix required |
| Quote expired | “The quote expired. Refresh to get a new amount.” | Refresh quote |
| Partial/underpay | “We can’t unlock access until the full amount arrives.” | Show recovery/manual-support path; never grant access |
| Wrong chain/token | “The transaction was sent on a different route. Keep the transaction hash for support.” | Manual reconciliation; do not auto-grant |
| Wallet rejected | “Payment wasn’t approved. You can try again.” | Retry or QR/copy-paste |
| API unavailable | “Checkout is temporarily unavailable. Your order was not charged by this page.” | Retry with same order attempt where safe |
| Webhook delayed | “Payment detected; confirming on-chain…” | Wait / email fallback |

---

## 6. Digital video delivery recommendation

### Do not use a ZIP as the primary playback mechanism

For a single video, deliver an MP4 or private streaming asset directly. A ZIP adds an extraction step and is poor on mobile.

Use a ZIP only when the buyer receives a bundle such as:

```text
full-video.mp4
captions.vtt
transcript.pdf
bonus-assets/
README.txt
```

### Do not host the paid full video in the Next.js repo or public `/public` folder

Vercel deployment is for the application, not for a private large media library. The paid URL must not be present in `course-data.ts`, client JavaScript, HTML, or a public Google Drive folder.

### Recommended hosting model: hybrid

| Asset | Recommended hosting | Access |
|---|---|---|
| Short teaser | Public CDN or public video host | Public; no entitlement required |
| Full playback | Private video/streaming provider or private object storage | Short-lived signed playback URL after entitlement check |
| Optional download | Private object storage/CDN | Short-lived signed download URL after entitlement check |
| Captions/transcript | Private object storage or app-controlled files | Same entitlement gate |

Choose a private streaming provider if watchability is primary. Choose private object storage/CDN if downloadable MP4/ZIP delivery is primary. A hybrid allows “Watch lesson” and “Download a copy” without exposing a permanent raw URL.

### Honest limitation

Once a customer can download a video, it can be copied. Signed URLs, expiring links, access logs, rate limits, and optional watermarking deter casual sharing; they do not make a downloaded video impossible to share.

### Playback flow

```text
GET /my-course/eggplant-method-v1?token=...
  ↓ server verifies entitlement
Set secure HttpOnly session/access cookie or exchange token
  ↓
GET /api/media/lesson
  ↓ server checks session + entitlement + not revoked
Issue short-lived signed playback URL
  ↓
Native video/HLS player loads URL
```

Do not put the full URL in the page’s static props. Do not use the current Google Drive folder link as the protected media source.

---

## 7. User segments and journeys

| Segment | Best path | Required fallback |
|---|---|---|
| Mobile inside a wallet browser | Inline sheet → connect wallet | QR/copy-paste |
| Mobile Safari/Chrome with wallet app installed | Inline sheet → open in wallet | QR/copy-paste |
| Desktop with extension | Inline sheet → connect wallet | QR on phone |
| Desktop without extension | Inline sheet → QR | Copy/paste |
| Telegram/Instagram/X in-app browser | Inline sheet | Copy/paste and QR; do not depend on app deep-link |
| New crypto buyer | Clear “Pay with crypto” explanation | Link to wallet setup/help; do not pretend fiat is supported |
| Returning buyer | Email link → token/session → watch/download | “Email my access link again” |
| Partial/wrong-chain payer | Pending/manual recovery | Keep payment hash and order ID; no automatic access |
| Paid but webhook delayed | Confirmation-pending sheet | Poll order status; email once fulfilled |
| Refunded buyer | Policy-defined access state | Do not silently delete already downloaded content |

### Happy path

```text
Tap Unlock
→ Sheet opens
→ Inline Blunt checkout appears
→ Email entered
→ Chain selected
→ Wallet/QR/copy-paste payment
→ Blunt confirms
→ Webhook verifies
→ Entitlement created
→ “Access is ready” sheet
→ Watch or download
→ Email receipt/access link
```

### Resume path

```text
Tap Unlock
→ Existing pending order found for this session
→ “Resume payment”
→ Same order ID; new attempt only if the previous session is expired/terminal
```

### Recovery path

```text
Transaction sent
→ No confirmation / quote expired
→ App says “Still checking”
→ Poll status
→ If confirmed: fulfill
→ If expired/failed: offer a new quote
→ If wrong chain/token/amount: manual-review state
```

---

## 8. Task breakdown matrix

### Phase 0 — Decisions and access

| ID | Task | Owner/output | Dependencies | Acceptance criteria | Risk |
|---|---|---|---|---|---|
| P0.1 | Confirm active Blunt merchant account, public key, live key, test key, merchant ID, webhook secret, and supported registered wallets | Merchant configuration sheet | User dashboard access | No secret appears in source; active wallet list is known | High |
| P0.2 | Rotate/revoke the live public key that was pasted into chat/docs, then create a replacement public key | Merchant dashboard | P0.1 | Exposed key is no longer active; replacement is used only in the intended site | Critical |
| P0.3 | Choose accepted chain/token allowlist | Product decision | P0.1 + current wallet registry | Only active registered wallet routes enabled; no unregistered destination | High |
| P0.4 | Decide storage mode | Architecture decision | Product delivery preference | Playback-only, download-only, or hybrid is explicit | High |
| P0.5 | Set digital product buyer info | Blunt dashboard | Product configuration | Email required; shipping off; Telegram/ZeroChat off | Medium |
| P0.6 | Create test product/payment key and webhook endpoint | Test environment | P0.1 | Test events are isolated and marked `test: true` | High |
| P0.7 | Produce optional light/dark Pay Button Badge assets and hosted-link destinations | Marketing/distribution | Primary pipeline is working | Badge links to a known reusable hosted payment link; no badge is mistaken for the main bottom-sheet CTA | Low |

### Phase 1 — Media and product model

| ID | Task | Files/systems | Acceptance criteria | Risk |
|---|---|---|---|---|
| P1.1 | Produce a real short teaser clip/poster | Video/media host | Teaser is public and never contains the full lesson | Medium |
| P1.2 | Upload full lesson to private media host | Storage/provider | No public URL; signed playback/download works | High |
| P1.3 | Remove paid URL from client course data | `src/lib/course-data.ts` | Client bundle contains no private asset URL | High |
| P1.4 | Define server-only asset configuration | server module/env | Asset IDs, not raw public URLs, are used client-side | High |
| P1.5 | Define delivery policy/version | order/entitlement model | Watch/download/refund policy is versioned | Medium |

### Phase 2 — Payment session and sheet

| ID | Task | Files | Acceptance criteria | Risk |
|---|---|---|---|---|
| P2.1 | Add local order creation endpoint | `src/app/api/blunt/create-order/route.ts` | Creates opaque order; validates product/price server-side | High |
| P2.2 | Add Blunt script/widget loader | client checkout component | Widget loaded once; no secret key in browser | High |
| P2.3 | Replace current CTA handoff | `UnpurchasedHomepage`, `AntechamberModal` | One tap opens our sheet and mounts inline checkout | Medium |
| P2.4 | Add stable metadata | widget config/order model | `order_id`, `course_id`, product version, source present | High |
| P2.5 | Add disabled/loading states | checkout sheet | Double taps cannot create duplicate local attempts | Medium |
| P2.6 | Add sheet focus/gesture behavior | sheet component | focus trap, focus restoration, safe drag-close, reduced motion | Medium |
| P2.7 | Add frontend status polling | order status hook/route | UI never grants access from client callback alone | High |
| P2.8 | Add hosted-link/badge fallback surface | optional `public/` badge assets + external placement docs | Light/dark badge links to a hosted payment link; primary app still uses inline sheet | Low |

### Phase 3 — Webhook and fulfillment

| ID | Task | Files | Acceptance criteria | Risk |
|---|---|---|---|---|
| P3.1 | Implement raw-body HMAC verification | `src/app/api/blunt/webhook/route.ts` | Valid signature passes; altered body/invalid signature rejected | Critical |
| P3.2 | Validate event schema and merchant identity | webhook service | Unknown order/merchant/product cannot fulfill | Critical |
| P3.3 | Add payment/payment-attempt deduplication | store | Same `payment_id` processed once | Critical |
| P3.4 | Add amount/chain/token/wallet checks | fulfillment service | Wrong settlement cannot grant entitlement | Critical |
| P3.5 | Make entitlement creation idempotent | entitlement service | Retries reuse same token/entitlement | Critical |
| P3.6 | Make email delivery idempotent/retryable | email service | Email failure never creates a second entitlement | High |
| P3.7 | Replace/deprecate old connector path | `fulfillment-trigger` route | One canonical fulfillment path; old route cannot create duplicates | High |
| P3.8 | Add event/order audit trail | database/Redis | Support can trace order → payment → tx → entitlement | High |

### Phase 4 — Secure media access

| ID | Task | Files | Acceptance criteria | Risk |
|---|---|---|---|---|
| P4.1 | Harden access token exchange | access routes | Token is not logged; URL is exchanged/handled safely | High |
| P4.2 | Add entitlement-protected media endpoint | `/api/media/*` | Unpaid/expired/revoked users get no media URL | Critical |
| P4.3 | Replace Google Drive anchor | `PurchasedExperience` | Player requests signed media URL from server | High |
| P4.4 | Add watch/download actions | purchased UI | “Watch” primary; “Download” optional; both enforce entitlement | Medium |
| P4.5 | Add access logging/rate limiting | media route | Suspicious repeated access is observable without storing sensitive raw data | Medium |

### Phase 5 — Testing and launch

| ID | Task | Acceptance criteria | Risk |
|---|---|---|---|
| P5.1 | Test create-order double tap/retry | Same logical order does not duplicate | High |
| P5.2 | Test `confirm` simulation | One entitlement, one email, paid state | Critical |
| P5.3 | Test `underpay` simulation | No entitlement; clear recovery state | Critical |
| P5.4 | Test `expire` simulation | No entitlement; new attempt allowed | High |
| P5.5 | Replay identical webhook | 2xx, no duplicate token/email | Critical |
| P5.6 | Tamper signature/body | 401, no state change | Critical |
| P5.7 | Test wrong order/course/amount/wallet | manual-review or rejection, no access | Critical |
| P5.8 | Test mobile wallet browser/in-app browser | Open-in-wallet failure still leaves QR/copy-paste path | High |
| P5.9 | Test real low-value live payment only after all test cases | Wallet receives expected route; entitlement delivered | Critical |
| P5.10 | Test media expiry/revocation | Signed media URL expires; entitlement policy behaves correctly | High |

---

## 9. Button audit

| Button | Current | Target behavior | Success signal | Failure signal |
|---|---|---|---|---|
| Start the method | Opens old sheet | Opens checkout sheet + prepares one local order | Sheet title + checkout visible | Inline widget load error |
| Continue to secure checkout | External Vendetta link | Mounts/activates inline Blunt checkout | Chain picker visible | “Checkout unavailable” retry |
| Optional Pay Button Badge | Not present | Light/dark SVG links to a reusable Blunt hosted payment link for external distribution only | Hosted checkout opens | Broken/expired hosted link |
| Optional HTML pay button | Not present | External static/partner page only; never the primary app CTA because it opens Blunt popup | Blunt popup opens | Widget load error |
| Email submit/continue | Not present in app | Blunt checkout requires email | Email accepted by Blunt | Inline validation |
| Pay with crypto | Not present | Single dominant action inside sheet | Blunt checkout active | Disabled while loading |
| Connect wallet | Blunt-controlled | Leave unchanged; do not fake | Wallet request appears | Copy/QR fallback |
| Open in wallet | Blunt-controlled | Preserve deep link | Wallet browser opens | Show QR/copy |
| QR | Blunt-controlled | Preserve | QR shown | Copy fallback |
| Copy amount/address | Blunt-controlled | Preserve | “Copied” confirmation | Retry clipboard / show text |
| Refresh quote | Blunt-controlled | Preserve | New quote timer | “Try again” |
| Watch lesson | New | Request signed playback URL then play | Video starts | Access/session error |
| Download a copy | New/optional | Request signed download URL | Download begins | Expired/retry |
| Email me the link again | New | Send existing entitlement link; no new entitlement | Email queued | Rate limit / try later |
| Theme toggle | Existing | Keep | Theme changes without sheet loss | No state loss |
| Close sheet | Existing | Close safely; preserve pending order | Sheet closes | Never lose payment state |

---

## 10. Motion audit

### Keep

- Sheet entrance from bottom: 240–360ms ease-out.
- Backdrop fade.
- Small status transition from “waiting” to “confirmed”.
- Quote countdown is provider-owned and must remain readable.
- Reduced-motion alternative: no slide, instant opacity/state change.

### Remove or avoid

- Continuous pulse on primary CTA.
- Decorative animation that competes with the chain/payment state.
- Auto-redirect while the user is reading the payment result.
- Closing/destroying the sheet while wallet approval is active.
- Animation that suggests access before the signed webhook confirms.

### Payment-state motion language

```text
idle                → no animation
preparing           → restrained spinner/skeleton
checkout ready      → one entrance transition
wallet pending      → stable waiting state; no bouncing CTA
confirmed           → single check transition
fulfilled           → access card rises into view
failed/expired      → stable error, direct recovery action
```

---

## 11. Code simplification and review checklist

### Simplify

- One `COURSE_ID` and one server-side product configuration.
- One canonical fulfillment function used by webhook and test harness.
- One order state machine instead of connector aliases plus ad-hoc token creation.
- One entitlement service responsible for token/media access/email orchestration.
- One checkout sheet component, with Blunt widget wrapper separated from sheet shell.
- Remove dead proof-gallery imports/routes from the purchase journey.
- Remove placeholder `picsum` assets and public full-video URLs.
- Remove comments that describe obsolete “fortress” behavior when they no longer match the code.

### Review gates before live keys

- [ ] No `mk_live_` key in client bundle, Git history, screenshots, or logs.
- [ ] No webhook secret in client code.
- [ ] Raw webhook body is verified before parsing.
- [ ] Timing-safe signature comparison used.
- [ ] `payment_id` deduplication exists.
- [ ] Order status transition is atomic/idempotent.
- [ ] Test webhooks cannot create live entitlements.
- [ ] Merchant ID/product ID/course ID checked.
- [ ] Amount/chain/token/destination wallet checked.
- [ ] No access on `onSuccess` alone.
- [ ] No direct Google Drive/full Dailymotion URL in client output.
- [ ] Signed media URL has short TTL.
- [ ] Access token is not logged.
- [ ] Email retry reuses existing entitlement.
- [ ] Refund behavior is explicitly defined.
- [ ] Rate limiting exists on order creation, status, email resend, and media endpoints.
- [ ] PII retention and deletion behavior documented.

---

## 12. Deployment and environment contract

Add server-only environment variables:

```text
BLUNT_PUBLIC_API_KEY=...
BLUNT_SECRET_API_KEY=...
BLUNT_MERCHANT_ID=...
BLUNT_WEBHOOK_SECRET=...
BLUNT_MODE=test|live
BLUNT_ACCEPTED_CHAINS=...
BLUNT_EXPECTED_DESTINATION_WALLETS_JSON=...
COURSE_PRICE_USD=22.30
NEXT_PUBLIC_BASE_URL=https://your-production-domain.example
```

Media variables should contain provider IDs/configuration, not public raw paid URLs:

```text
PRIVATE_VIDEO_PROVIDER=...
PRIVATE_VIDEO_ASSET_ID=...
PRIVATE_DOWNLOAD_OBJECT_KEY=...
MEDIA_SIGNING_SECRET=...
```

The webhook URL should be deployed under a stable HTTPS address, for example:

```text
https://your-production-domain.example/api/blunt/webhook
```

Do not deploy the webhook route behind a password or a browser-only auth wall; authenticate it by HMAC and enforce rate limits.

---

## 13. Final product recommendation

### Best MVP

1. Teaser remains public and is a genuine short clip/poster.
2. One primary CTA opens a bottom sheet.
3. Sheet mounts inline blunt.cash checkout.
4. Blunt product requires email only.
5. Accepted chains are a small, explicitly selected allowlist from the wallets already registered.
6. Webhook creates a 365-day entitlement once and emails the durable access link.
7. Purchased page requests a short-lived signed playback URL.
8. Optional download is added only after private storage is ready.
9. Test mode runs confirm/underpay/expire plus webhook replay tests.
10. One small live payment is used only after test coverage passes.

### What I would not do

- Do not use the popup embed.
- Do not let the browser grant access.
- Do not expose a secret Blunt API key.
- Do not accept arbitrary client-provided price/course values.
- Do not ship the full video in the repo or public client data.
- Do not rely on a public Google Drive folder as “secure access”.
- Do not use a ZIP for a single video unless Blunt’s file-delivery mode is the chosen, tested product path.
- Do not enable every chain merely because the dashboard lists it.
- Do not auto-revoke a downloaded file after a refund; define a clear digital-goods policy first.

### Recommended order of execution

```text
1. Blunt test credentials + wallet/chain allowlist
2. Private video hosting decision
3. Order/entitlement model
4. Inline bottom-sheet checkout
5. Signed webhook + idempotent fulfillment
6. Secure playback/download endpoint
7. Test simulations and replay tests
8. Mobile wallet/in-app-browser QA
9. One low-value live rehearsal
10. Production launch
```

---

## Sources

- [blunt.cash merchant docs](https://blunt.cash/merchant/docs)
- [blunt.cash inline/popup/hosted embeds](https://blunt.cash/merchant/docs/integrate/embed)
- [blunt.cash zero-code integration](https://blunt.cash/merchant/docs/integrate/zero-code)
- [blunt.cash webhooks](https://blunt.cash/merchant/docs/integrate/webhooks)
- [blunt.cash REST API](https://blunt.cash/merchant/docs/reference/api)
- [blunt.cash supported chains and quote windows](https://blunt.cash/merchant/docs/reference/chains)
- [blunt.cash error codes](https://blunt.cash/merchant/docs/reference/errors)
- [blunt.cash checkout experience](https://blunt.cash/merchant/docs/storefront/checkout)
- [blunt.cash wallet payment paths](https://blunt.cash/merchant/docs/storefront/wallets)
- [blunt.cash storefront branding](https://blunt.cash/merchant/docs/storefront/branding)

## Existing code reviewed

- [`src/components/UnpurchasedHomepage.tsx`](src/components/UnpurchasedHomepage.tsx)
- [`src/components/AntechamberModal.tsx`](src/components/AntechamberModal.tsx)
- [`src/app/api/internal/fulfillment-trigger/route.ts`](src/app/api/internal/fulfillment-trigger/route.ts)
- [`src/app/api/verify-code/route.ts`](src/app/api/verify-code/route.ts)
- [`src/app/my-course/[courseId]/page.tsx`](src/app/my-course/[courseId]/page.tsx)
- [`src/components/PurchasedExperience.tsx`](src/components/PurchasedExperience.tsx)
- [`src/components/VideoPlayer.tsx`](src/components/VideoPlayer.tsx)
- [`src/lib/course-data.ts`](src/lib/course-data.ts)
- [`src/emails/AccessEmail.tsx`](src/emails/AccessEmail.tsx)
