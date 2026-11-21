# 07-PAYMENT-PROVIDER-AND-EXTERNAL-INTEGRATIONS: BIGGER_ENERGY

## 1. Primary Provider: Blunt.cash Integration

- **Payment Link:** `https://pay.blunt.cash/buy/bigger-energy`
- **Supported Assets:** Solana SOL, USDC, Major Cryptocurrencies.
- **Hosted Flow:** Customer selects payment method on Blunt's hosted modal, broadcasts transaction on-chain.
- **Redirection:** Upon finality, Blunt redirects customer back to the store URL with query parameters.
- **Free-Tier Invariant:** Because Blunt free tier does not broadcast asynchronous webhooks to custom endpoints, the application does not rely solely on webhooks. It pairs hosted return redirects with client-side polling and instant cookie issuance.

## 2. Secondary Provider: Paymegate Integration

- **Merchant Portal:** `https://www.paymegate.com`
- **Account:** Bigger Energy (`ian19leakey@gmail.com`)
- **Checkout URL:** `https://www.paymegate.com/checkout/884a31cd-6589-449e-90a8-da36aa5469ef`
- **API Key:** Configured via `PAYMEGATE_API_KEY` environment variable (never committed to Git).
- **Order Creation Endpoint:** `POST /api/paymegate/create-order`
  - Calls `https://api.paymegate.com/v1/orders` with header `X-API-Key: $PAYMEGATE_API_KEY`.
  - Supports card payments, BTC, EVM, Solana, TRC20.
  - Automatically falls back to hosted checkout URL `https://www.paymegate.com/checkout/884a31cd-6589-449e-90a8-da36aa5469ef`.
- **Webhook Endpoint:** `POST /api/webhooks/paymegate`
  - Ingests `order.paid` events.
  - Enforces `X-Paymegate-Signature` verification using raw unpadded Base64URL HMAC-SHA256.
  - Enforces 5-minute timestamp replay window (`X-Paymegate-Timestamp`).
  - Idempotent deduplication via `X-Paymegate-Event-Id` and `claimPaymentEvent`.
  - Automatically issues `eggplant_access` entitlement and dispatches delivery email via Resend.

## 3. Video Streaming Infrastructure: Mux Video

- **Environment Name:** `BIGGER-ENERGY`
- **Environment Key:** `girnh124eh2798iemmsbl2o75`
- **Teaser Video Asset (Public):**
  - Asset ID: `4ANBwxJ5eZuJ023m7Dxk02W01O8rVG49FZW4lySdgz8IGI`
  - Playback Policy: `public`
  - Playback ID: `ac3dvpgq7mCwBZaa7eQQd7EhtvlFzc5xEY9j3c02W4DE`
  - Status: READY (1440p UHD, 30fps)
- **Fulfillment Video Asset (Signed):**
  - Asset ID: `LXqfKBm9DsfA902Rgn4S3v4DAYDVk11uMxo5cmzM7Lrw`
  - Playback Policy: `signed` (anti-piracy paywall)
  - Playback ID: `tNGocfMgHTDM2201au01Q9mtKRc02qN8tkfUFcvFY01NOEo`
  - Signing Key ID: `Hn381Gx45Zd8Vy3D02RtFxlNygYRlDD9t9kgk01uDnJos`
  - Signing Algorithm: RS256 with Mux RSA Private Key
  - Live Verification: Live HTTP test confirmed token returns HTTP 200, without token returns HTTP 403 Forbidden.

## 4. Email Communications: Multi-Transport Engine (Zero-Domain Ready)

- **Priority 1 (Recommended without custom domain):** Gmail SMTP via `nodemailer` (`GMAIL_USER` + `GMAIL_APP_PASSWORD`) — 100% free, 500 emails/day to any buyer email, zero `.com`/`.xyz` required.
- **Priority 2:** Generic SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
- **Priority 3 (Alternative zero-domain API):** Brevo HTTP API (`BREVO_API_KEY` + `BREVO_SENDER_EMAIL`) — 300 emails/day free.
- **Priority 4 (Requires custom domain):** Resend SDK (`RESEND_API_KEY` + `RESEND_FROM_EMAIL`). Note: Resend's `onboarding@resend.dev` sandbox blocks external buyer emails with HTTP 403 unless a custom domain is verified.
- **Failure Mode:** If all email transports fail or are unset, local dev logs the access link and internal fulfillment returns `accessUrl` directly so no buyer is ever stranded.
