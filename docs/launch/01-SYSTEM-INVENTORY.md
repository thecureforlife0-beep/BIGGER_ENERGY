# BIGGER_ENERGY // 01 — SYSTEM INVENTORY & ARCHITECTURAL CENSUS

## 1. ROUTES (APP ROUTER)

| Route | Type | Auth Gate | Handlers / Component | Purpose |
|---|---|---|---|---|
| `/` | Server (Dynamic) | Public / Cookie Check | `page.tsx` → `UnpurchasedHomepage` | Main storefront landing page. |
| `/_not-found` | Static | Public | Next.js internal 404 | Error route. |
| `/access` | Server (Dynamic) | Token in query param | `route.ts` | Token-to-HttpOnly cookie exchange. |
| `/my-course/[courseId]` | Client (Dynamic) | `eggplant_access` cookie | `page.tsx` → `PurchasedExperience` | Protected video course streaming player. |
| `/proof` | Static | Public | `page.tsx` | Permanent 301 redirect to `/`. |
| `POST /api/blunt/create-order` | Server (Dynamic) | Public | `route.ts` | Initializes or resumes internal order for widget. |
| `POST /api/blunt/webhook` | Server (Dynamic) | HMAC-SHA256 signature | `route.ts` | Authoritative Blunt.cash payment confirmation. |
| `POST /api/webhooks/secondary` | Server (Dynamic) | Optional HMAC signature | `route.ts` | Authoritative Provider B payment confirmation. |
| `GET /api/orders/[orderId]` | Server (Dynamic) | Public | `route.ts` | Order status polling endpoint for checkout widget. |
| `GET /api/media/lesson` | Server (Dynamic) | `eggplant_access` cookie | `route.ts` | Gated Mux RS256 JWT minting endpoint. |
| `GET/POST /api/verify-code` | Server (Dynamic) | Cookie or bearer token | `route.ts` | Entitlement verification endpoint. |
| `POST /api/internal/fulfillment-trigger` | Server (Dynamic) | Bearer secret key | `route.ts` | Manual / emergency fulfillment endpoint. |

---

## 2. KEY LIBRARIES & STATE STORES

- `src/lib/course-content.ts`: Single source of truth for pricing ($22.30), course metadata, copy, creator story.
- `src/lib/redis.ts`: Upstash Redis REST singleton with automatic `LocalDevInMemoryRedis` fallback.
- `src/lib/orders/store.ts`: Atomic order creation, session resumption, and hosted-payment synthesis.
- `src/lib/entitlements/store.ts`: SHA-256 token hashing and 365-day access entitlement ledger.
- `src/lib/payments/config.ts`: Pluggable dual payment provider configuration.
- `src/lib/mux.ts`: Native Node.js `RS256` signed JWT token generator with multi-environment fallback.
- `src/lib/email/sendAccessEmail.ts`: Resend email dispatcher with replay deduplication protection.

---

## 3. EXTERNAL DEPENDENCIES & INTEGRATIONS

1. **Payment Provider 1 (Blunt.cash):** Non-custodial crypto checkout across Solana, Base, Arbitrum, Ethereum.
2. **Payment Provider 2 (Secondary Adapter):** Configured for backup crypto / card rails.
3. **Media Streaming (Mux Video):** HLS adaptive private streaming with signed JWT authorization.
4. **Data Persistence (Upstash Redis / Vercel KV):** Order and entitlement storage.
5. **Email Delivery (Resend):** Transactional email delivery.
6. **Hosting (Vercel):** Edge and serverless runtime.
