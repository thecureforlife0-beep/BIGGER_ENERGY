# blunt.cash Integration — Implementation Specification

**Status:** Written specification only. No application source was modified, installed, downloaded, built, or executed to produce this document.

**Companion documents:**
- `blunt-cash-integration-plan.md` — architecture, task matrix, audits
- `blunt-cash-source-notes.md` — docs capture notes

**Purpose:** the file-by-file, line-referenced change plan required to take the current app from "external checkout link" to "bottom-sheet crypto checkout with webhook-authoritative fulfillment."

---

## 0. Verified current state

All figures below were read from disk in this session, not recalled.

| File | Lines | Verified state |
|---|---|---|
| `src/app/page.tsx` | 61 | Contains its own inline `verifyTokenOnServer` (lines 12–38) |
| `src/lib/server-auth.ts` | 40 | Contains a **different** `verifyTokenOnServer` (lines 4–39) |
| `src/app/api/verify/route.ts` | 29 | Validates body then calls `server-auth.ts` |
| `src/app/api/verify-code/route.ts` | 56 | `Redis.fromEnv()`, token lookup, 365-day durable key |
| `src/app/api/internal/fulfillment-trigger/route.ts` | 91 | Bearer secret, creates token, Gmail SMTP, logs access URL |
| `src/app/my-course/[courseId]/page.tsx` | 97 | Client component, fetches `/api/verify-code` |
| `src/components/PurchasedExperience.tsx` | 157 | Google Drive anchor + rating widget |
| `src/components/VideoPlayer.tsx` | 92 | Dailymotion iframe wrapper |
| `src/components/AntechamberModal.tsx` | 98 | Bottom sheet, `<a href={redirectUrl}>` |
| `src/components/UnpurchasedHomepage.tsx` | 141 | Landing page, `VENDETTA_MACHINE_URL` on line 7 |
| `src/app/layout.tsx` | 24 | Imports `Header` |
| `src/lib/course-data.ts` | 19 | Public Dailymotion URLs + `picsum` thumbnails |
| `src/lib/reviews-data.ts` | 35 | 34 review objects |
| `src/components/AccessDenied.tsx` | 18 | Exists, unreferenced |
| `src/components/layout/LandingPageHeader.tsx` | 16 | Exists, only referenced by `ConditionalHeader` |
| `blunt-cash-integration-plan.md` | 717 | Current |
| `blunt-cash-source-notes.md` | 41 | Pay Button update now applied |

### Project root actually contains

```text
.next/                     build output
.preview-tools/            screenshot tooling (playwright-core, Pillow)
preview/                   9 PNGs + board + zip
src/
blunt-cash-integration-plan.md
blunt-cash-source-notes.md
blunt-cash-implementation-spec.md
eggplant-method-chad-kermit-ui.zip
next-env.d.ts
package-lock.json
package.json
postcss.config.mjs
tailwind.config.ts
tsconfig.json
```

**Notably absent:** no `public/`, no `.env*`, no `next.config.*`, no `.gitignore`, no `middleware.ts`.

---

## 1. New findings from this verification pass

These were not in the original plan and change the work order.

### F1 — Three divergent verification implementations

| Path | File | Checks `fulfillmentId === courseId`? | Base URL fallback? |
|---|---|---|---|
| `/` | `src/app/page.tsx:12-38` | **No** | **No** (`NEXT_PUBLIC_BASE_URL` only) |
| `/api/verify` | `src/lib/server-auth.ts:4-39` | Yes | Yes (`VERCEL_URL` → localhost) |
| `/my-course/[id]` | `my-course/[courseId]/page.tsx:46` | Checks `response.ok` only | n/a (relative fetch) |

Consequence: the inline copy on `/` is the one serving production traffic, and it is the **least strict** of the three. `src/lib/server-auth.ts` — the version with the course-binding check — is only reachable through `/api/verify`, which is itself a redundant wrapper around `/api/verify-code`.

### F2 — Silent failure on `/` when a token is present

`src/app/page.tsx:14` builds the verify URL with no fallback:

```ts
const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-code`;
```

If `NEXT_PUBLIC_BASE_URL` is unset, this becomes the literal string `undefined/api/verify-code`, the fetch throws, the `catch` returns `{ isValid: false }`, and line 59 renders `<UnpurchasedHomepage />`. A paying customer with a valid token sees the sales page with no error. Confirmed by reading lines 34–37 and 57–59.

### F3 — Redis client initialised two incompatible ways

| File | Line | Initialisation | Env vars read |
|---|---|---|---|
| `src/app/api/verify-code/route.ts` | 6 | `Redis.fromEnv()` | `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` |
| `src/app/api/internal/fulfillment-trigger/route.ts` | 7–10 | `new Redis({ url, token })` | `KV_REST_API_URL` / `KV_REST_API_TOKEN` |

`Redis.fromEnv()` from `@upstash/redis` reads the `UPSTASH_` names by default. On a Vercel KV / Upstash-for-Vercel integration the injected names are `KV_REST_API_*`. Unless both sets exist, token verification fails while fulfillment succeeds — access links are issued and then rejected. This is the most likely cause of any "link doesn't work" report.

### F4 — `public/` does not exist, but is referenced

`src/components/PurchasedExperience.tsx:98` requests `/course-access-thumbnail.webp`. There is no `public/` directory in the project root, so this resolves to a 404 on the purchased page today.

### F5 — README environment list contradicts the code

The README supplied earlier lists `EGGPLANT_METHOD_RESEND_API_KEY`. No code path references Resend. Email is sent via Nodemailer + Gmail SMTP (`fulfillment-trigger/route.ts:13-19`, reading `EGGPLANT_METHOD_GMAIL_USER` / `EGGPLANT_METHOD_GMAIL_APP_PASSWORD`). `KV_REST_API_READ_ONLY_TOKEN` is also unused. Treat the README as stale.

### F6 — Confirmed orphan set

A grep for imports of `AccessDenied`, `ConditionalHeader`, `LandingPageHeader`, `ProofGalleryHeader`, `ProofGallery`, `ProofBanner`, `HeroCarousel`, `ReviewsCarousel` returned exactly **one** match: `ConditionalHeader.tsx:4` importing `LandingPageHeader`.

`layout.tsx:3` imports `Header`, not `ConditionalHeader`. Therefore the following are fully unreferenced:

```text
src/components/ProofGallery.tsx
src/components/ProofBanner.tsx
src/components/HeroCarousel.tsx
src/components/ReviewsCarousel.tsx
src/components/AccessDenied.tsx
src/components/layout/ProofGalleryHeader.tsx
src/components/layout/ConditionalHeader.tsx   ← only imports LandingPageHeader
src/components/layout/LandingPageHeader.tsx   ← only imported by ConditionalHeader
src/lib/reviews-data.ts                       ← only imported by ReviewsCarousel
src/components/VideoPlayer.tsx                ← only imported by HeroCarousel
```

`VideoPlayer.tsx` becomes reusable again later if the teaser is served from Dailymotion — do not delete it outright.

### F7 — `LandingPageHeader` uses a non-existent Tailwind class

`LandingPageHeader.tsx:6` uses `bg-background-dark`. `tailwind.config.ts` only extends `background`, `foreground`, `primary`. The class resolves to nothing. Moot while orphaned, but relevant if it is ever restored.

---

## 2. Target architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│ PUBLIC LANDING  (existing redesigned UnpurchasedHomepage)        │
│  • teaser (public)   • price   • one CTA                         │
└───────────────────────────────┬──────────────────────────────────┘
                                │ tap: "Start the method"
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ CHECKOUT BOTTOM SHEET  (our component, ours to style)            │
│  1. POST /api/blunt/create-order  → { orderId }  (server truth)  │
│  2. mount Blunt.embed({ orderId in metadata, amount from server })│
│  3. onSuccess → CLOSE PERMISSION, open status polling            │
│  4. poll GET /api/orders/:id every 3s until fulfilled/terminal   │
│  5. fulfilled → "Access is ready" + Watch / Download             │
└───────────────┬──────────────────────────────┬───────────────────┘
                │                              │
   buyer pays (wallet/QR/copy)                 │ poll
                │                              │
                ▼                              │
      ┌─────────────────────┐                  │
      │ blunt.cash monitors │                  │
      │ the chain           │                  │
      └──────────┬──────────┘                  │
                 │ payment.confirmed (HMAC)    │
                 ▼                             │
┌──────────────────────────────────────────────────────────────────┐
│ POST /api/blunt/webhook   (AUTHORITY)                            │
│  raw body → HMAC verify → schema → merchant → order             │
│  → amount/chain/token/wallet match → dedupe by payment_id       │
│  → order.status = paid → issue entitlement ONCE → send email     │
└───────────────────────────────┬──────────────────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ GET /api/media/lesson   (entitlement-gated)                      │
│  session/entitlement check → mint short-TTL signed asset URL     │
└──────────────────────────────────────────────────────────────────┘
```

**Invariant:** the browser can *display* state. Only the webhook can *create* entitlement.

---

## 3. Data model (Redis, MVP-appropriate)

The existing stack already has Upstash/Vercel KV, so Redis is the pragmatic MVP store. Migrate to Postgres when you need reporting, partial refunds, and support queries across orders.

### Key schema

```text
order:{orderId}                 → JSON Order                TTL 30d
order:by-payment:{paymentId}    → orderId                   TTL 400d
order:open:{sessionId}          → orderId                   TTL 24h
order:attempt-count:{orderId}   → integer                   TTL 30d

payment:{paymentId}             → JSON PaymentRecord        TTL 400d
event:{paymentId}               → "processing" | "done"     TTL 400d  ← dedupe sentinel

ent:{sha256(token)}             → JSON Entitlement          TTL 365d
ent:by-order:{orderId}          → sha256(token)             TTL 365d
email:sent:{orderId}            → "1"                       TTL 400d

media:sig:{entitlementId}:{exp} → "1"                       TTL = exp window
```

### TypeScript shapes

```ts
export type OrderStatus =
  | 'created' | 'checkout_open' | 'awaiting_confirmation' | 'paid'
  | 'fulfilled' | 'payment_failed' | 'expired' | 'manual_review';

export interface Order {
  id: string;                    // opaque, e.g. ord_<24 hex>
  sessionId: string;             // browser-scoped bucket id
  courseId: string;
  productVersion: string;
  amountUsd: number;             // snapshot at creation, server-side only
  status: OrderStatus;
  email?: string;                // from webhook, never trusted from client
  paymentId?: string;
  paymentIds: string[];          // all attempts seen for this order
  merchantId?: string;
  chainId?: string;
  token?: string;
  amountCrypto?: number;
  destinationWallet?: string;
  senderWallet?: string;
  txHash?: string;
  isTest: boolean;
  createdAt: string;
  paidAt?: string;
  fulfilledAt?: string;
}

export interface Entitlement {
  id: string;
  orderId: string;
  courseId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  mediaPolicyVersion: string;
  revokedAt?: string;
}
```

### Why `ent:{sha256(token)}` instead of today's `token → data`

`src/app/api/verify-code/route.ts:29` currently uses the **raw token as the Redis key**, and `fulfillment-trigger/route.ts:60` logs the full access URL. Hashing the token removes raw bearer material from the datastore and from logs, and makes an accidental key dump non-exploitable. The lookup stays O(1).

---

## 4. Shared libraries

### 4.1 NEW — `src/lib/redis.ts`

Single client, one env-var contract. Fixes F3.

```ts
import 'server-only';
import { Redis } from '@upstash/redis';

// Vercel KV / Upstash-for-Vercel inject KV_REST_API_*.
// Do NOT use Redis.fromEnv() here — it expects UPSTASH_REDIS_REST_*.
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
```

**Then:** delete the local `new Redis(...)` in `fulfillment-trigger/route.ts:7-10` and `Redis.fromEnv()` in `verify-code/route.ts:6`; import from here.

### 4.2 NEW — `src/lib/blunt/config.ts`

```ts
import 'server-only';

export const PRODUCT = {
  courseId: 'eggplant-method-v1',
  productVersion: '2026-01',
  priceUsd: 22.3,
} as const;

export const BLUNT = {
  apiBase: 'https://blunt.cash/functions/v1',
  widgetScript: 'https://blunt.cash/widget/blunt.js',
  publicKey: process.env.NEXT_PUBLIC_BLUNT_PUBLIC_KEY ?? '',
  secretKey: process.env.BLUNT_SECRET_API_KEY ?? '',
  merchantId: process.env.BLUNT_MERCHANT_ID ?? '',
  webhookSecret: process.env.BLUNT_WEBHOOK_SECRET ?? '',
  mode: process.env.BLUNT_MODE === 'live' ? 'live' : 'test',
  acceptedChains: (process.env.BLUNT_ACCEPTED_CHAINS ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean),
  expectedWallets: JSON.parse(
    process.env.BLUNT_EXPECTED_DESTINATION_WALLETS_JSON ?? '{}',
  ) as Record<string, string>, // chainId -> lowercase address
} as const;

export function assertServerConfig() {
  const missing = [
    ['BLUNT_SECRET_API_KEY', BLUNT.secretKey],
    ['BLUNT_WEBHOOK_SECRET', BLUNT.webhookSecret],
    ['BLUNT_MERCHANT_ID', BLUNT.merchantId],
  ].filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) throw new Error(`Missing config: ${missing.join(', ')}`);
}
```

`amountUsd` lives **only** here. The client never sends a price.

### 4.3 NEW — `src/lib/orders/types.ts`

The `Order` / `OrderStatus` / `Entitlement` interfaces from §3, exported. Keep them out of `store.ts` to avoid a circular import between orders and entitlements.

### 4.4 NEW — `src/lib/orders/store.ts`

```ts
import 'server-only';
import { redis } from '@/lib/redis';
import { randomBytes } from 'node:crypto';
import type { Order } from './types';

const ORDER_TTL = 60 * 60 * 24 * 30;

export function newId(prefix: string) {
  return `${prefix}_${randomBytes(12).toString('hex')}`;
}

export async function createOrder(sessionId: string, amountUsd: number) {
  const order: Order = {
    id: newId('ord'),
    sessionId,
    courseId: 'eggplant-method-v1',
    productVersion: '2026-01',
    amountUsd,
    status: 'created',
    paymentIds: [],
    isTest: false,
    createdAt: new Date().toISOString(),
  };
  await redis.set(`order:${order.id}`, JSON.stringify(order), { ex: ORDER_TTL });
  await redis.set(`order:open:${sessionId}`, order.id, { ex: 60 * 60 * 24 });
  return order;
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const raw = await redis.get<string>(`order:${orderId}`);
  return raw ? (typeof raw === 'string' ? JSON.parse(raw) : (raw as Order)) : null;
}

/** Resume an existing open order for this browser session, if one exists. */
export async function findOpenOrderBySession(sessionId: string): Promise<Order | null> {
  const orderId = await redis.get<string>(`order:open:${sessionId}`);
  if (!orderId) return null;
  const order = await getOrder(orderId);
  if (!order) return null;
  if (order.status !== 'created' && order.status !== 'checkout_open') return null;
  return order;
}

export async function patchOrder(
  orderId: string,
  patch: Partial<Order>,
): Promise<Order | null> {
  const current = await getOrder(orderId);
  if (!current) return null;
  const next: Order = { ...current, ...patch };
  await redis.set(`order:${orderId}`, JSON.stringify(next), { ex: ORDER_TTL });
  return next;
}

/** Returns true only for the FIRST caller per paymentId. */
export async function claimPaymentEvent(paymentId: string): Promise<boolean> {
  const res = await redis.set(`event:${paymentId}`, 'processing', {
    nx: true, ex: 60 * 60 * 24 * 400,
  });
  return res === 'OK';
}

export async function markEventDone(paymentId: string) {
  await redis.set(`event:${paymentId}`, 'done', { ex: 60 * 60 * 24 * 400 });
}
```

> `redis.set(..., { nx: true })` is the atomic dedupe primitive. A duplicate delivery returns `null`, so the webhook can ack immediately without doing any work.

### 4.5 NEW — `src/lib/entitlements/store.ts`

```ts
import 'server-only';
import { redis } from '@/lib/redis';
import { createHash, randomBytes } from 'node:crypto';
import { newId } from '@/lib/orders/store';
import type { Entitlement } from '@/lib/orders/types';

const ENT_TTL = 60 * 60 * 24 * 365;

export const hashToken = (t: string) =>
  createHash('sha256').update(t, 'utf8').digest('hex');

/**
 * Idempotent: if this order already has an entitlement, return the existing
 * record instead of minting a second one. This is the fix for the
 * "new token on every connector retry" behaviour in fulfillment-trigger.
 */
export async function issueEntitlement(params: {
  orderId: string; courseId: string; email: string;
}): Promise<{ entitlement: Entitlement; token: string; created: boolean }> {
  const existingHash = await redis.get<string>(`ent:by-order:${params.orderId}`);
  if (existingHash) {
    const raw = await redis.get<string>(`ent:${existingHash}`);
    const entitlement: Entitlement =
      typeof raw === 'string' ? JSON.parse(raw) : (raw as Entitlement);
    return { entitlement, token: '', created: false };
  }

  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const entitlement: Entitlement = {
    id: newId('ent'),
    orderId: params.orderId,
    courseId: params.courseId,
    email: params.email,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ENT_TTL * 1000).toISOString(),
    mediaPolicyVersion: '2026-01',
  };

  await redis.set(`ent:${tokenHash}`, JSON.stringify(entitlement), { ex: ENT_TTL });
  await redis.set(`ent:by-order:${params.orderId}`, tokenHash, { ex: ENT_TTL });
  return { entitlement, token, created: true };
}

export async function lookupEntitlement(token: string): Promise<Entitlement | null> {
  if (!token) return null;
  const raw = await redis.get<string>(`ent:${hashToken(token)}`);
  if (!raw) return null;
  const ent: Entitlement = typeof raw === 'string' ? JSON.parse(raw) : (raw as Entitlement);
  if (ent.revokedAt) return null;
  if (new Date(ent.expiresAt).getTime() < Date.now()) return null;
  return ent;
}
```

**Behaviour on retry:** the second call finds `ent:by-order:{orderId}`, returns `created: false`, and the caller re-sends the **same** link. One order → one token, permanently.

---

## 5. API routes

### 5.1 NEW — `POST /api/blunt/create-order`

`src/app/api/blunt/create-order/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { PRODUCT, BLUNT } from '@/lib/blunt/config';
import { createOrder, findOpenOrderBySession } from '@/lib/orders/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ sessionId: z.string().min(8).max(64).optional() });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const sessionId = parsed.data.sessionId ?? randomUUID();

  // Resume rather than duplicate on double-tap / sheet re-open.
  const resumed = await findOpenOrderBySession(sessionId);
  const order = resumed ?? (await createOrder(sessionId, PRODUCT.priceUsd));

  return NextResponse.json({
    orderId: order.id,
    sessionId,
    amountUsd: order.amountUsd,   // server-derived, never client-sent
    courseId: order.courseId,
    publicKey: BLUNT.publicKey,
    chains: BLUNT.acceptedChains,
    mode: BLUNT.mode,
    resumed: Boolean(resumed),
  });
}
```

Rate-limit this route (per IP + per session). It is the only unauthenticated write path that allocates storage.

### 5.2 NEW — `POST /api/blunt/webhook` (the authority)

`src/app/api/blunt/webhook/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { BLUNT, PRODUCT } from '@/lib/blunt/config';
import {
  claimPaymentEvent, markEventDone, getOrder, patchOrder,
} from '@/lib/orders/store';
import { issueEntitlement } from '@/lib/entitlements/store';
import { sendAccessEmail } from '@/lib/email/sendAccessEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Payload = z.object({
  event: z.string(),
  payment_id: z.string(),
  merchant_id: z.string(),
  amount_usd: z.number(),
  amount_crypto: z.number().optional(),
  chain_id: z.string(),
  token: z.string().optional(),
  tx_hash: z.string().optional(),
  destination_wallet: z.string(),
  sender_wallet: z.string().optional(),
  confirmed_at: z.string().optional(),
  test: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function verifySignature(raw: string, header: string | null, secret: string) {
  if (!header) return false;
  const expected = createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(header.trim(), 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  // 1. Raw body FIRST — before any JSON parsing or middleware reshaping.
  const raw = await req.text();

  // 2. Signature.
  if (!verifySignature(raw, req.headers.get('x-blunt-signature'), BLUNT.webhookSecret)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  // 3. Parse only after verification.
  let json: unknown;
  try { json = JSON.parse(raw); } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = Payload.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }
  const e = parsed.data;
  const isTest = e.test === true || req.headers.get('x-blunt-mode') === 'test';

  // 4. Mode isolation.
  if (BLUNT.mode === 'live' && isTest) {
    return NextResponse.json({ ignored: 'test_event_in_live_mode' }, { status: 202 });
  }

  // 5. Only one event fulfils.
  if (e.event !== 'payment.confirmed') {
    return NextResponse.json({ received: true, ignored: e.event }, { status: 200 });
  }

  // 6. Merchant identity.
  if (e.merchant_id !== BLUNT.merchantId) {
    return NextResponse.json({ error: 'merchant_mismatch' }, { status: 403 });
  }

  // 7. Dedupe — FIRST caller only. Needs signature + merchant checks passed first,
  //    so a forged request cannot burn a real payment_id.
  const first = await claimPaymentEvent(e.payment_id);
  if (!first) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  const orderId = String(e.metadata?.order_id ?? '');
  const courseId = String(e.metadata?.course_id ?? '');
  const email = String(e.metadata?.email ?? '');

  if (!orderId || courseId !== PRODUCT.courseId || !email) {
    await markEventDone(e.payment_id);
    return NextResponse.json({ error: 'unmappable_payment' }, { status: 422 });
  }

  const order = await getOrder(orderId);
  if (!order) {
    await markEventDone(e.payment_id);
    return NextResponse.json({ error: 'unknown_order' }, { status: 422 });
  }

  // 8. Settlement checks.
  const expectedWallet = (BLUNT.expectedWallets[e.chain_id] ?? '').toLowerCase();
  const actualWallet = (e.destination_wallet ?? '').toLowerCase();
  const amountOk = Math.abs(e.amount_usd - order.amountUsd) < 0.01;
  const walletOk = expectedWallet ? expectedWallet === actualWallet : true;

  if (!amountOk || !walletOk) {
    await patchOrder(orderId, { status: 'manual_review' });
    await markEventDone(e.payment_id);
    return NextResponse.json(
      { error: 'amount_or_wallet_mismatch', amountOk, walletOk },
      { status: 409 },
    );
  }

  // 9. Mark paid.
  await patchOrder(orderId, {
    status: 'paid',
    email,
    paymentId: e.payment_id,
    paymentIds: [...new Set([...order.paymentIds, e.payment_id])],
    merchantId: e.merchant_id,
    chainId: e.chain_id,
    token: e.token,
    amountCrypto: e.amount_crypto,
    destinationWallet: e.destination_wallet,
    senderWallet: e.sender_wallet,
    txHash: e.tx_hash,
    isTest,
    paidAt: e.confirmed_at ?? new Date().toISOString(),
  });

  // 10. Entitlement — idempotent.
  const { created } = await issueEntitlement({ orderId, courseId, email });

  // 11. Email — reuses the same entitlement if the webhook is retried.
  try {
    await sendAccessEmail({ orderId, email, courseId });
    await patchOrder(orderId, {
      status: 'fulfilled',
      fulfilledAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[blunt] email failed', { orderId, err });
    // Entitlement exists; blunt replays within 24h and we resend then.
    return NextResponse.json({ received: true, emailQueued: false }, { status: 500 });
  }

  await markEventDone(e.payment_id);
  return NextResponse.json({ received: true, newlyIssued: created }, { status: 200 });
}
```

**On any 5xx**, `event:{paymentId}` stays `processing`; blunt's retry re-enters at step 7. A sentinel that never flips to `done` is the signal to investigate — add a sweep for it.

### 5.3 NEW — `GET /api/orders/[orderId]`

`src/app/api/orders/[orderId]/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '@/lib/orders/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Minimal projection — never leak wallets, tx hash, or sender address.
  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    fulfilled: order.status === 'fulfilled',
  });
}
```

The client polls this. It returns **no ability to unlock anything** — only status. Access still requires the emailed entitlement.

### 5.4 REWRITE — `src/app/api/verify-code/route.ts`

Replace the raw-token key and `Redis.fromEnv()`.

```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { lookupEntitlement } from '@/lib/entitlements/store';
import { PRODUCT } from '@/lib/blunt/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({ token: z.string().min(16), courseId: z.string() });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ isValid: false, error: 'invalid_request' }, { status: 400 });
  }

  const { token, courseId } = parsed.data;
  const ent = await lookupEntitlement(token);

  if (!ent) {
    return NextResponse.json(
      { isValid: false, error: 'Invalid or expired token.' },
      { status: 404 },
    );
  }
  if (ent.courseId !== courseId || courseId !== PRODUCT.courseId) {
    return NextResponse.json(
      { isValid: false, error: 'Token is not valid for this course.' },
      { status: 403 },
    );
  }

  return NextResponse.json({ isValid: true, courseId: ent.courseId, expiresAt: ent.expiresAt });
}
```

Drops the `fulfillmentId` field name the old contracts used. Update every caller in the same commit (§5.5, §6.4).

### 5.5 REWRITE — `src/lib/server-auth.ts`

Stop fetching our own API from a server component; call the function.

```ts
import 'server-only';
import { lookupEntitlement } from '@/lib/entitlements/store';
import { PRODUCT } from '@/lib/blunt/config';

export async function verifyTokenOnServer(
  token: string,
  courseId: string,
): Promise<{ isValid: boolean; error: string | null }> {
  if (!token) return { isValid: false, error: 'Missing token.' };
  const ent = await lookupEntitlement(token);
  if (!ent) return { isValid: false, error: 'Invalid or expired token.' };
  if (ent.courseId !== courseId || courseId !== PRODUCT.courseId) {
    return { isValid: false, error: 'Token is not valid for this course.' };
  }
  return { isValid: true, error: null };
}
```

This removes two failure modes at once: the `NEXT_PUBLIC_BASE_URL` dependency (F2) and the self-fetch indirection.

### 5.6 DELETE — `src/app/api/verify/route.ts`

Its only job is wrapping `/api/verify-code` over HTTP. With §5.5 in place nothing needs it.

### 5.7 REWRITE — `src/app/page.tsx`

```tsx
import { UnpurchasedHomepage } from '@/components/UnpurchasedHomepage';
import { PurchasedExperience } from '@/components/PurchasedExperience';
import { AccessProblem } from '@/components/AccessProblem';
import { verifyTokenOnServer } from '@/lib/server-auth';
import { PRODUCT } from '@/lib/blunt/config';

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: HomeProps) {
  const sp = await searchParams;
  const token = typeof sp?.token === 'string' ? sp.token : undefined;

  if (!token) return <UnpurchasedHomepage />;

  const { isValid, error } = await verifyTokenOnServer(token, PRODUCT.courseId);
  if (isValid) return <PurchasedExperience courseId={PRODUCT.courseId} />;

  // Fix F2: an invalid token is no longer indistinguishable from a cold visit.
  return <AccessProblem reason={error} />;
}
```

`AccessProblem` replaces the orphaned `AccessDenied.tsx` in the new design language. Do not revive `AccessDenied` — its `bg-red-900/20` box contradicts the redesign.

### 5.8 DELETE — `src/app/api/internal/fulfillment-trigger/route.ts`

The critical cleanup. Its behaviour (new token per retry, access URL in logs, separate bearer secret) is exactly what §5.2 + §4.5 replace. Leaving it live means two competing paths that can mint entitlement.

If rollout overlap is required, gate it behind a flag returning `410 Gone` and log any hit. Do not leave it live and silent.

---

## 6. Frontend

### 6.1 MODIFY — `src/components/AntechamberModal.tsx`

Current state (verified, 98 lines): already a correct bottom sheet with drag handle, backdrop button, Escape handler, safe-area padding, and `aria-modal`. **Keep all of that.** Five changes:

**1 — replace the anchor with a real action.** Lines 87–93 render `<a href={redirectUrl}>`:

```tsx
<button
  type="button"
  onClick={onStartCheckout}
  disabled={isPreparing}
  className="mt-7 flex min-h-[64px] w-full items-center justify-center gap-3 rounded-full
             bg-[var(--accent)] px-6 text-center text-sm font-bold tracking-[-0.01em]
             text-[var(--accent-ink)] shadow-[0_12px_34px_rgba(139,207,34,0.2)]
             transition hover:bg-[var(--accent-strong)]
             disabled:cursor-not-allowed disabled:opacity-60"
>
  {isPreparing ? 'Preparing secure checkout…' : 'Start secure checkout'}
  {!isPreparing && <ArrowRight size={18} strokeWidth={2} />}
</button>
```

`ArrowUpRight` → `ArrowRight`: the action no longer navigates away, so the external-link affordance is misleading.

**2 — rename props to match the new contract.**

```ts
interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStartCheckout: () => void;
  isPreparing: boolean;
  phase: 'idle' | 'preparing' | 'checkout' | 'confirming' | 'fulfilled' | 'error';
  errorMessage?: string | null;
  /** Rendered when the embed is live — replaces the illustrative step list. */
  embedSlot?: React.ReactNode;
}
```

**3 — make the three-step list conditional.** Lines 67–80 ("Leave the noise behind / Open the private checkout / Get the lesson link by email") are onboarding copy for `phase === 'idle'`. Render them only in that phase; render `embedSlot` when `phase === 'checkout'`. Buyer instructions sitting above a live wallet flow is the main clutter risk in the current sheet.

**4 — copy truth.** Line 84 says "You'll be taken to the secure acquisition page." Once checkout is embedded, the buyer is *not* taken anywhere. Rewrite: "Pay directly from your wallet. Access is emailed the moment the payment confirms on-chain."

**5 — close semantics.** Line 20 hides body overflow and line 17 closes on any Escape. After `phase === 'checkout'` the sheet must not be silently destroyed while a wallet prompt is open. Gate Escape and drag-close to `idle` / `fulfilled`; keep the backdrop button but relabel it `Close and keep my order`.

**Verified absent today** (add during this rework): focus trap, focus restoration to the opener, and drag-to-dismiss — the drag handle at line 41 is a decorative `h-1.5 w-12` div with no handlers.

### 6.2 NEW — `src/components/checkout/BluntEmbed.tsx`

Loads the widget once, mounts inline, treats `onSuccess` as a display hint only.

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';

const BLUNT_WIDGET_SRC = 'https://blunt.cash/widget/blunt.js';

declare global {
  interface Window {
    Blunt?: {
      embed: (opts: {
        target: string;
        api_key: string;
        amount_usd: number;
        accepted?: { chain: string }[];
        metadata?: Record<string, unknown>;
        onSuccess?: (payment: unknown) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadBlunt(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Blunt) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = BLUNT_WIDGET_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('blunt_widget_load_failed'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

interface Props {
  orderId: string;
  amountUsd: number;
  publicKey: string;
  chains: string[];
  email: string;
  courseId: string;
  onPaymentSubmitted: () => void;
  onWidgetClosed: () => void;
  onLoadError: (message: string) => void;
}

export function BluntEmbed({
  orderId, amountUsd, publicKey, chains, email, courseId,
  onPaymentSubmitted, onWidgetClosed, onLoadError,
}: Props) {
  const targetId = `blunt-embed-${orderId}`;
  const mounted = useRef(false);
  const [, setReady] = useState(false);

  useEffect(() => {
    if (mounted.current) return;      // guard against React 19 double-invoke
    mounted.current = true;

    let cancelled = false;
    loadBlunt()
      .then(() => {
        if (cancelled || !window.Blunt) return;
        window.Blunt.embed({
          target: `#${targetId}`,
          api_key: publicKey,
          amount_usd: amountUsd,
          accepted: chains.map((chain) => ({ chain })),
          metadata: { order_id: orderId, course_id: courseId, email },
          onSuccess: () => {
            // HINT ONLY. No entitlement, no unlock, no navigation.
            onPaymentSubmitted();
          },
          onClose: onWidgetClosed,
        });
        setReady(true);
      })
      .catch(() => onLoadError('Checkout could not load. Please try again.'));

    return () => { cancelled = true; };
  }, [targetId, orderId, amountUsd, publicKey, chains, email, courseId,
      onPaymentSubmitted, onWidgetClosed, onLoadError]);

  return <div id={targetId} className="min-h-[320px] w-full" />;
}
```

**Three cautions:**

1. **`email` in metadata is an assumption.** The docs establish that email can be *required* per product and that metadata is returned on confirmation, but **not** that a buyer-entered address is reflected back into metadata. If it is not, collect email in the sheet before mount and post it with `create-order`. Plan the fallback; do not assume.
2. **Metadata is not a security boundary.** Any client value can be forged — which is exactly why §5.2 re-derives `courseId`, re-checks the merchant, and compares amount and destination wallet. Metadata is a routing hint, never authorisation.
3. **The `mounted` ref** prevents two embeds mounting into one target under React 19 dev double-invoke.

### 6.3 NEW — `src/components/checkout/CheckoutSheet.tsx`

Owns the phase machine and polling. This is what `UnpurchasedHomepage` renders.

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AntechamberModal } from '@/components/AntechamberModal';
import { BluntEmbed } from './BluntEmbed';

type Phase = 'idle' | 'preparing' | 'checkout' | 'confirming' | 'fulfilled' | 'error';
interface Props { isOpen: boolean; onClose: () => void }

const POLL_MS = 3000;
const POLL_MAX_MS = 35 * 60 * 1000;   // covers the 30-min stablecoin quote + grace

export function CheckoutSheet({ isOpen, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [order, setOrder] = useState<{
    orderId: string; amountUsd: number; publicKey: string; chains: string[];
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollStart = useRef<number | null>(null);

  const startCheckout = useCallback(async () => {
    if (phase === 'preparing' || phase === 'checkout') return;  // double-tap guard
    setPhase('preparing');
    setErrorMessage(null);
    try {
      const sessionId = localStorage.getItem('ck_session') ?? crypto.randomUUID();
      localStorage.setItem('ck_session', sessionId);

      const res = await fetch('/api/blunt/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error('order_failed');
      setOrder(await res.json());
      setPhase('checkout');
    } catch {
      setErrorMessage('Checkout is temporarily unavailable. You have not been charged.');
      setPhase('error');
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== 'confirming' || !order) return;
    pollStart.current = Date.now();

    const tick = async () => {
      if (Date.now() - (pollStart.current ?? 0) > POLL_MAX_MS) {
        setPhase('error');
        setErrorMessage('Still confirming on-chain. Your access link will arrive by email.');
        return;
      }
      try {
        const res = await fetch(`/api/orders/${order.orderId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const s = await res.json();
        if (s.fulfilled) setPhase('fulfilled');
      } catch { /* transient — keep polling */ }
    };

    const id = setInterval(tick, POLL_MS);
    tick();
    return () => clearInterval(id);
  }, [phase, order]);

  const handleClose = useCallback(() => {
    if (phase !== 'confirming') setPhase('idle');
    onClose();
  }, [phase, onClose]);

  return (
    <AntechamberModal
      isOpen={isOpen}
      onClose={handleClose}
      onStartCheckout={startCheckout}
      isPreparing={phase === 'preparing'}
      phase={phase}
      errorMessage={errorMessage}
      embedSlot={
        phase === 'checkout' && order ? (
          <BluntEmbed
            orderId={order.orderId}
            amountUsd={order.amountUsd}
            publicKey={order.publicKey}
            chains={order.chains}
            email=""
            courseId="eggplant-method-v1"
            onPaymentSubmitted={() => setPhase('confirming')}
            onWidgetClosed={() => { /* stay in checkout */ }}
            onLoadError={(m) => { setErrorMessage(m); setPhase('error'); }}
          />
        ) : null
      }
    />
  );
}
```

`phase === 'confirming'` deliberately has **no access button**. The only exits are `fulfilled` from the server or the timeout that promises an email. That is where "the browser never grants access" is enforced.

### 6.4 MODIFY — `src/components/UnpurchasedHomepage.tsx`

Current 141 lines. Precise edits:

| Line(s) | Current | Change |
|---|---|---|
| 7 | `const VENDETTA_MACHINE_URL = 'https://vendetta-machine.vercel.app/art/eggplant-method-1';` | **Delete.** No external checkout URL should remain |
| 8 | `CHAD_KERMIT_IMAGE` pointing at `sc04.alicdn.com` | Move to a local `public/brand/` asset |
| 5 | `import { AntechamberModal }` | → `import { CheckoutSheet }` |
| 21–25 | `<AntechamberModal ... redirectUrl={...} />` | → `<CheckoutSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} />` |
| 48 | `11-minute lesson` | Verify against the final runtime |
| 62–65 | `See how it works` anchor | Keep |
| 69 | `$22.30` hardcoded | Drive from the same constant as `PRODUCT.priceUsd` |
| 79–98 | Full character-sheet collage as hero | Replace with a composed hero — still the biggest visual weakness from the screenshot review |

Price-drift risk is real: `PRODUCT.priceUsd` is what gets charged, line 69 is what gets displayed. Two sources for one number.

### 6.5 REWRITE — `src/components/PurchasedExperience.tsx`

Current 157 lines. The Google Drive anchor at lines 91–107 must go — a publicly shareable folder URL in the browser defeats the entire entitlement system.

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Play } from 'lucide-react';

type MediaState = 'idle' | 'loading' | 'ready' | 'error';

export function PurchasedExperience({ courseId }: { courseId: string }) {
  const [playback, setPlayback] = useState<{ url: string; expiresAt: string } | null>(null);
  const [state, setState] = useState<MediaState>('idle');
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadPlayback = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const res = await fetch(`/api/media/lesson?courseId=${courseId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('media_unavailable');
      setPlayback(await res.json());
      setState('ready');
    } catch {
      setError('We could not open the lesson. Your access may have expired.');
      setState('error');
    }
  }, [courseId]);

  useEffect(() => {
    if (playback && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => { /* autoplay refusal is fine */ });
    }
  }, [playback]);

  if (!playback) {
    return (
      <>
        <button
          type="button"
          onClick={loadPlayback}
          disabled={state === 'loading'}
          className="flex min-h-[68px] w-full items-center justify-center gap-3 rounded-full
                     bg-[var(--accent)] px-7 text-base font-bold text-[var(--accent-ink)]
                     disabled:opacity-60"
        >
          <Play size={19} />
          {state === 'loading' ? 'Opening…' : 'Watch the lesson'}
        </button>
        {error && <p className="mt-3 text-sm text-[var(--muted)]">{error}</p>}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <video ref={videoRef} controls playsInline preload="metadata"
             className="w-full rounded-[28px] bg-black">
        <source src={playback.url} />
      </video>
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <Check size={15} className="text-[var(--accent-strong)]" />
        Access valid until {new Date(playback.expiresAt).toLocaleDateString()}
      </div>
    </div>
  );
}
```

**Also remove from this file:**

- `PloyRatingSystem` (lines 7–79) — labelled a "ploy" in its own comment, stores nothing, resets after 3 seconds. It should not survive into a premium post-purchase surface.
- Sales copy at lines 126–143 — the "Simple 2-Step Method" line, the "6,700 men" paragraph, and the Instagram line. A paying customer does not need re-selling on a page they already bought. This is where the old body copy still lives (§12.3).
- Line 98's `/course-access-thumbnail.webp` reference — no `public/` exists (F4), so it 404s today.

### 6.6 NEW — `src/app/api/media/lesson/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { lookupEntitlement } from '@/lib/entitlements/store';
import { mintSignedAssetUrl } from '@/lib/media/sign';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token =
    req.nextUrl.searchParams.get('t') ??
    (await cookies()).get('ck_access')?.value ??
    '';

  const ent = await lookupEntitlement(token);
  if (!ent) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const courseId = req.nextUrl.searchParams.get('courseId');
  if (courseId && courseId !== ent.courseId) {
    return NextResponse.json({ error: 'course_mismatch' }, { status: 403 });
  }

  const { url, expiresAt } = await mintSignedAssetUrl({
    assetKey: process.env.PRIVATE_VIDEO_ASSET_KEY!,
    ttlSeconds: 900,                  // short TTL — minutes, not days
    entitlementId: ent.id,
  });

  return NextResponse.json({ url, expiresAt }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
```

`mintSignedAssetUrl` is provider-specific (S3/R2/B2 presign, or a streaming provider's signed-playback token). Keep it behind this one function so the provider can change without touching routes.

**Do not** stream the MP4 through this function on Vercel — function response limits and egress cost make it a dead end. Always hand back a signed URL.

---

## 7. Access, session, and token exchange

### 7.1 The problem

`src/app/my-course/[courseId]/page.tsx:17` reads the token from the query string. Query strings leak into browser history, referrer headers, analytics, support screenshots, and shared links. The current model keeps a leaked token valid for 365 days.

### 7.2 Recommended sequence

```text
Email link:  /access?order=ord_abc
             (no bearer token in the URL)

GET /access?order=ord_abc
  → server mints a fresh single-use exchange code
  → 302 to /access?c=<exchange_code>

POST /api/access/exchange  { code }
  → validates one-time code, marks used
  → Set-Cookie: ck_access=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000
  → returns { ok: true }

Page renders PurchasedExperience
  → /api/media/lesson reads the cookie, never the URL
```

Result: the durable bearer lives in an HttpOnly cookie. It never appears in the URL bar, never reaches JavaScript, and never enters the referrer chain.

### 7.3 Pragmatic interim (if shipping before the exchange layer exists)

Keep `?token=` but immediately:

1. `Set-Cookie` the token HttpOnly.
2. `history.replaceState` to strip the query.
3. Treat the URL token as single-use presentation only.

Weaker than §7.2, but a one-commit improvement over the current state. Do not skip both.

### 7.4 Media URL TTL

| Asset | Signed URL TTL | Notes |
|---|---|---|
| Playback (HLS/MP4) | 15 minutes | Regenerate on `needsRefresh`; never persist to `localStorage` |
| Download | 5 minutes, single use | Shortest comfortable window |
| Teaser | none (public) | No entitlement |

### 7.5 Honest limitation

Any customer who can watch can record. Signed URLs, expiring links, per-entitlement watermarking, and rate limits raise the cost of casual resharing; they do not prevent it. Set product expectations accordingly.

---

## 8. Wallet handling

We do not handle keys, signing, or chain interaction — blunt.cash does. Our responsibilities are chain configuration, fallbacks, and recovery copy.

### 8.1 Four buyer paths

| Path | Owner | Our responsibility |
|---|---|---|
| Connect wallet | blunt widget | Do not build or fake it |
| Open in wallet (deep link) | blunt widget | Ensure the sheet does not trap the handoff; verify on real phones |
| QR | blunt widget | Ensure the sheet scrolls so the QR is not clipped on short viewports |
| Copy / paste address + amount | blunt widget | Ensure clipboard failures degrade to visible selectable text |

QR and copy/paste are the universal fallbacks. Every error state must leave at least one reachable.

### 8.2 Browser matrix

| Environment | Smooth path | Must remain reachable |
|---|---|---|
| Wallet's own in-app browser | Connect wallet | QR, copy/paste |
| Mobile Safari / Chrome | Open in wallet, else QR | Copy/paste |
| Desktop with extension | Connect wallet | QR on phone |
| Desktop without extension | QR | Copy/paste |
| Telegram / Instagram / X in-app browser | Copy/paste | QR — app handoffs are usually blocked |
| Hardened browser (Firefox strict, Brave) | QR | Copy/paste — extension access frequently blocked |

### 8.3 Chain configuration

Enable only the intersection of:

1. chains blunt supports (`eth, base, polygon, arb, op, avax, bsc, pls, robinhood, sol`), **and**
2. chains where you have an active registered payout wallet, **and**
3. chains whose network fee is tolerable for a ~$22 purchase.

Recommendation: start with **one stablecoin chain** (Base or Solana) plus **one volatile option**. Enabling eight chains to look comprehensive raises support load and lets buyers land on routes you cannot service.

**Routing rule:** a destination that is not registered and active is rejected with `403 destination_not_registered` — there is no silent fallback. A chain enabled in the widget without a registered wallet is a dead end for the buyer, not a graceful redirect. Validate the mapping before launch.

### 8.4 Quote windows

| Asset class | Quote window | Grace |
|---|---|---|
| Volatile (ETH, SOL, PLS, BNB, AVAX, POL) | 10 minutes | 5 minutes |
| Stablecoins (USDT, USDC, DAI, USDG) | 30 minutes | 5 minutes |

The polling timeout in §6.3 is set to 35 minutes to cover the stablecoin window. A 10-minute timeout would show "check your email" to a slow stablecoin payer who is about to succeed.

### 8.5 Payment state mapping

| blunt status | Our order status | Buyer sees | Access? |
|---|---|---|---|
| `pending` | `awaiting_confirmation` | "Waiting for your transaction…" | No |
| `confirmed` | `paid` → `fulfilled` | "Access is ready" | Yes, after entitlement |
| `partial` | `manual_review` | "The full amount hasn't arrived yet." | **No** |
| `late` | `paid` (grace flag) | "Received — confirming" | Yes once confirmed |
| `failed` | `payment_failed` | "That payment didn't go through." | No |
| `expired` | `expired` | "The quote expired. Get a new one." | No |

`partial` must never grant access. It is the most likely accidental-access path.

---

## 9. Configuration

### 9.1 `.env.local` / Vercel environment

```bash
# ── blunt.cash ───────────────────────────────────────────
NEXT_PUBLIC_BLUNT_PUBLIC_KEY=mk_test_xxxxxxxx       # safe in browser
BLUNT_SECRET_API_KEY=mk_test_xxxxxxxx               # SERVER ONLY
BLUNT_MERCHANT_ID=m_xxxxxxxx
BLUNT_WEBHOOK_SECRET=whsec_xxxxxxxx                 # SERVER ONLY
BLUNT_MODE=test                                     # test | live
BLUNT_ACCEPTED_CHAINS=base,sol
BLUNT_EXPECTED_DESTINATION_WALLETS_JSON={"base":"0x...","sol":"..."}

# ── App ──────────────────────────────────────────────────
NEXT_PUBLIC_BASE_URL=https://your-domain.example

# ── Upstash / Vercel KV (must match lib/redis.ts) ────────
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# ── Email (Nodemailer + Gmail, as used today) ────────────
EGGPLANT_METHOD_GMAIL_USER=...
EGGPLANT_METHOD_GMAIL_APP_PASSWORD=...

# ── Private media ────────────────────────────────────────
PRIVATE_VIDEO_PROVIDER=s3|r2|b2|stream
PRIVATE_VIDEO_ASSET_KEY=...
PRIVATE_VIDEO_BUCKET=...
MEDIA_SIGNING_SECRET=...
```

### 9.2 Do not carry forward

| Variable | Why |
|---|---|
| `EGGPLANT_METHOD_INTERNAL_SECRET_KEY` | Belongs to the deleted `fulfillment-trigger` route (§5.8) |
| `EGGPLANT_METHOD_RESEND_API_KEY` | README-only; no code path uses Resend |
| `KV_REST_API_READ_ONLY_TOKEN` | README-only; unused |

**README drift is a live hazard** — it documents `RESEND` while the code sends via Gmail SMTP (F5). Reconcile in the same commit as the env change.

### 9.3 `.gitignore` — currently absent

```gitignore
node_modules/
.next/
.env
.env.local
.env*.local
.preview-tools/
preview/
*.zip
.DS_Store
```

`preview/` and `.preview-tools/` contain a locally-installed `playwright-core` and a Pillow install. They must not be committed or deployed.

### 9.4 `next.config.*` — currently absent

Consider adding one to set `poweredByHeader: false`, add security headers (`Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin` — the last matters because tokens must never leak via referrer), and pin `images.remotePatterns` if any remote image remains after moving brand assets into `public/`.

---

## 10. Testing

### 10.1 Signature verification (local, no blunt account needed)

```bash
# Valid signature → 200
RAW='{"event":"payment.confirmed","payment_id":"pay_test_1","merchant_id":"m_xxx","amount_usd":22.30,"chain_id":"base","destination_wallet":"0x...","metadata":{"order_id":"ord_abc","course_id":"eggplant-method-v1","email":"you@example.com"}}'
SIG=$(node -e "console.log(require('crypto').createHmac('sha256',process.env.BLUNT_WEBHOOK_SECRET).update(process.argv[1],'utf8').digest('hex'))" "$RAW")

curl -i -X POST http://localhost:3000/api/blunt/webhook \
  -H "Content-Type: application/json" \
  -H "X-Blunt-Signature: $SIG" \
  --data "$RAW"
```

```bash
# Tampered signature → must be 401, order untouched
curl -i -X POST http://localhost:3000/api/blunt/webhook \
  -H "Content-Type: application/json" \
  -H "X-Blunt-Signature: deadbeef" \
  --data "$RAW"

# Same payment_id twice → second must be {"duplicate":true}, no second email
curl -i -X POST http://localhost:3000/api/blunt/webhook \
  -H "Content-Type: application/json" -H "X-Blunt-Signature: $SIG" --data "$RAW"
```

```bash
# Re-serialised body → signature must FAIL (proves raw-body handling)
curl -i -X POST http://localhost:3000/api/blunt/webhook \
  -H "Content-Type: application/json" -H "X-Blunt-Signature: $SIG" \
  --data "$(node -e "console.log(JSON.stringify(JSON.parse(process.argv[1])))" "$RAW")"
```

That last test is the one most implementations get wrong. If it returns 200, the route is parsing before hashing and is not verifying signatures correctly.

### 10.2 Idempotency

| Test | Method | Expected |
|---|---|---|
| Double-tap the CTA | UI | One order created, not two |
| Re-open sheet | UI | Resumes existing order (`resumed: true`) |
| Duplicate webhook | curl replay | `duplicate: true`, one email, `created: false` |
| Webhook after email failure | force SMTP error, replay | Same entitlement reused, one new email attempt |
| Two confirmed payments, one order | two `payment_id`s | First fulfils; second → `manual_review`, no second entitlement |

### 10.3 blunt test-mode outcomes

Use a `mk_test_` key and the dashboard test controls:

| Action | Expected order status | Expected access |
|---|---|---|
| Mark as paid | `fulfilled` | Granted |
| Simulate underpayment | `manual_review` | **Denied** |
| Simulate expiry | `expired` | Denied, new attempt allowed |

Test webhooks carry `test: true` and `X-Blunt-Mode: test`. Confirm that with `BLUNT_MODE=live` they are ignored (202) and create nothing.

### 10.4 Negative settlement tests

| Scenario | Expected |
|---|---|
| `amount_usd` = 1.00 instead of 22.30 | 409, `manual_review`, no access |
| `destination_wallet` = an address you do not own | 409, `manual_review`, no access |
| `merchant_id` = another merchant | 403 |
| `metadata.order_id` unknown | 422, no access |
| `metadata.course_id` wrong | 422, no access |
| `event` = `payment.failed` | 200 ignored, no state change |

### 10.5 Access and media

| Test | Expected |
|---|---|
| Valid token → `/api/verify-code` | `isValid: true` |
| Token for course A used on course B | 403 |
| Expired entitlement | 404 |
| Revoked entitlement (`revokedAt` set) | 404 |
| `/api/media/lesson` with no cookie/token | 401 |
| Signed media URL after TTL | Provider rejects |
| Unpaid order polling `/api/orders/:id` | Never returns `fulfilled: true` |
| `/` with an invalid token | `AccessProblem`, **not** the sales page (regression test for F2) |
| `/` with `NEXT_PUBLIC_BASE_URL` unset | Still resolves correctly (F2) |

### 10.6 Manual crypto rehearsals

| Step | Notes |
|---|---|
| Test-key full flow | Simulated confirm end-to-end |
| Small live payment, low-fee chain | ~$1–2, one chain |
| Same payment replayed by blunt | Confirm single entitlement |
| Mobile: wallet in-app browser | Real device |
| Mobile: Safari, no wallet | QR + copy/paste reachable |
| Telegram in-app browser | Copy/paste only |
| Desktop: extension present | Connect wallet |
| Desktop: extension absent | QR shown |

### 10.7 Regression

```bash
npm run build     # must stay clean
npm run start
curl -s localhost:3000/proof -o /dev/null -w '%{http_code}\n'   # expect 307/308
```

Both themes and the proof redirect must survive. Re-run the `preview/` capture set after the change so the before/after is documented.

---

## 11. Deployment

### 11.1 Order of operations

```text
1.  Rotate the exposed mk_live_ public key (§12.1)
2.  Add .gitignore; confirm .env* and preview/ excluded
3.  Add lib/redis.ts; repoint both existing Redis callers
4.  Ship the F2 fix (lib/server-auth.ts rewrite + page.tsx)
5.  Deploy webhook route with BLUNT_MODE=test
6.  Register the webhook URL in the blunt dashboard
7.  Run §10.1–§10.5 against the deployed URL
8.  Move fulfillment off /api/internal/fulfillment-trigger
9.  Deploy sheet + embed; verify with test key
10. Set up private media; wire /api/media/lesson
11. Re-run §10.6
12. Flip BLUNT_MODE=live, swap to the live key
13. One small live payment
14. Launch
```

Steps 3–4 are independently shippable and fix production bugs today. Do not bundle them with the Blunt work.

### 11.2 Vercel configuration

- Add every variable from §9.1 to the Production environment.
- Use a **separate** Preview environment with test keys — never let a preview deployment hold live keys.
- Webhook URL: `https://<domain>/api/blunt/webhook`. Must be publicly reachable; authenticate by HMAC only.
- Do **not** put the webhook behind Vercel Authentication / Deployment Protection. That returns 401 to blunt, and every payment silently fails to fulfil after the buyer's money has already moved.
- Set function `maxDuration` appropriately — the webhook does KV writes plus one SMTP send.
- `dynamic = 'force-dynamic'` is already specified in §5.2.

### 11.3 Email deliverability

Gmail SMTP with an app password is acceptable for testing, poor for production: collector domains often reject it, and throughput is capped. Move to a transactional provider (Resend, Postmark, SES) before scaling, with SPF, DKIM, and DMARC configured. Resolve the README/code mismatch deliberately rather than by accident.

### 11.4 Still not a PWA

Unaffected by this work. No manifest, icons, service worker, or offline fallback exist.

---

## 12. Cleanup and content audit

### 12.1 Security actions (do first)

| # | Action |
|---|---|
| 1 | A `mk_live_` public key was pasted into a shareable conversation. Revoke it and issue a replacement. Docs treat the public key as safe to embed, but a key you did not choose to publish should not stay live. |
| 2 | Confirm no secret key (`BLUNT_SECRET_API_KEY`, `BLUNT_WEBHOOK_SECRET`) has ever appeared in chat, screenshots, or source. Rotate if uncertain. |
| 3 | `fulfillment-trigger/route.ts:60` logs full access URLs. Delete the route (§5.8) before logs accumulate entitlements. |
| 4 | The Google Drive folder URL in `PurchasedExperience.tsx:92` is publicly shareable. Treat the folder as already leaked; move the asset rather than trusting a takedown. |

### 12.2 Deletions

```text
src/app/api/internal/fulfillment-trigger/route.ts    delete
src/app/api/verify/route.ts                          delete
src/components/AccessDenied.tsx                      delete (replaced by AccessProblem)
src/components/ProofGallery.tsx                      delete
src/components/ProofBanner.tsx                       delete
src/components/ReviewsCarousel.tsx                   delete
src/lib/reviews-data.ts                              delete (only used by ReviewsCarousel)
src/components/layout/ProofGalleryHeader.tsx         delete
src/components/layout/ConditionalHeader.tsx          delete
src/components/layout/LandingPageHeader.tsx          delete (only used by ConditionalHeader)
```

**Keep:** `src/components/VideoPlayer.tsx` (§6.4 — reusable for a Dailymotion teaser). `HeroCarousel.tsx` only if the carousel returns; otherwise delete both.

All deletions verified unreferenced in §1/F6, except `VideoPlayer`, reachable only through `HeroCarousel`.

### 12.3 Old body copy — verified status

Direct answer to the earlier question, checked against the files:

| Old site content | Current location | Recommendation |
|---|---|---|
| `SIZE DOESN'T MATTER?` hero | Not in code | Stays gone |
| `Viral 2 Step Big Dick Growth Method 2025` | `course-data.ts:4` (`name`) | Replace with a shippable product name — the longest-lived piece of old copy because it lives in the data layer |
| `The Simple 2-Step Method to Naturally Boost Length & Girth` | `PurchasedExperience.tsx:127` | Remove from post-purchase |
| `Let's cut through the noise. No pills…` | `PurchasedExperience.tsx:129-134` | Remove |
| `tested by over 6,700 men… 11-minute video` | `PurchasedExperience.tsx:136-137` | Remove; the "6,700" claim needs substantiation before appearing anywhere |
| `I'm always on Instagram… 📩` | `PurchasedExperience.tsx:140-141` | Remove from post-purchase |
| `About the Creator` (Joshua Hiett, Tampa) | **Absent** | Discarded; recreate only with verified first-person copy |
| Customer reviews + `4.7 stars` | `reviews-data.ts` (34 entries), unreferenced | Delete, or move to the landing page with real attribution |
| `PloyRatingSystem` (self-labelled ploy) | `PurchasedExperience.tsx:7-79` | Remove |

**Summary:** the creator bio was discarded. The old sales copy was **not** rewritten out — it still sits on the purchased page. The landing page uses new copy (`Bigger energy.` / `Direct in. Useful out.` / `No gallery. No performance.`). The 34 reviews still exist on disk but are no longer rendered.

### 12.4 Claims needing verification before launch

`6,700 men`, `4.7 stars`, `983 likes`, and `11-minute lesson` are specific factual claims. Each needs substantiation or removal. The runtime claim is the only one trivially verifiable against the final video.

---

## 13. Execution order

```text
WAVE 0 — safety
  0.1 rotate exposed key
  0.2 add .gitignore
  0.3 delete fulfillment-trigger route

WAVE 1 — correctness (ship independent of Blunt)
  1.1 lib/redis.ts, repoint callers              (fixes F3)
  1.2 lib/server-auth.ts rewrite
  1.3 page.tsx rewrite + AccessProblem           (fixes F2)
  1.4 delete /api/verify + orphan set
  1.5 npm run build + re-capture preview/

WAVE 2 — payment core
  2.1 lib/blunt/config.ts
  2.2 lib/orders/*, lib/entitlements/*
  2.3 POST /api/blunt/create-order
  2.4 POST /api/blunt/webhook
  2.5 GET  /api/orders/[orderId]
  2.6 §10.1–10.4 pass on test keys

WAVE 3 — UI
  3.1 CheckoutSheet + BluntEmbed
  3.2 AntechamberModal changes
  3.3 UnpurchasedHomepage changes
  3.4 mobile matrix §10.6

WAVE 4 — media
  4.1 choose provider, upload full lesson privately
  4.2 lib/media/sign.ts
  4.3 GET /api/media/lesson
  4.4 PurchasedExperience rewrite
  4.5 token exchange §7.2
  4.6 §10.5 pass

WAVE 5 — go live
  5.1 transactional email provider
  5.2 README reconciliation
  5.3 one small live payment
  5.4 flip to live keys
```

Waves 0 and 1 are pure risk reduction and can ship immediately. Wave 2 gates everything payment-related. Wave 4 can run in parallel with Wave 3 if the media provider is chosen early.

---

## 14. Open questions blocking Wave 2+

| # | Question | Why it blocks |
|---|---|---|
| 1 | Does `Blunt.embed` return the buyer-entered email in the confirmation metadata? | Determines whether the sheet must collect email before mount (§6.2 caution 1). **Verify with a test payment before building the sheet.** |
| 2 | Which chains have an active registered payout wallet? | Determines `BLUNT_ACCEPTED_CHAINS`; avoids dead-end routes (§8.3) |
| 3 | Which private media provider? | Determines `mintSignedAssetUrl`, therefore Wave 4 |
| 4 | Playback only, download only, or both? | Changes the `/api/media` surface and purchase copy |
| 5 | Is 365-day entitlement still the policy? | Sets `ENT_TTL` and email copy |
| 6 | Refund policy for digital goods? | Determines whether refunded buyers keep access |
| 7 | Real teaser clip, or reuse the existing Dailymotion video? | Determines whether `VideoPlayer` stays |

Question 1 is the highest-risk unknown. Everything else has a sensible default; that one changes the architecture of the sheet.
