# 07-PAYMENT-PROVIDER-AND-EXTERNAL-INTEGRATIONS: BIGGER_ENERGY

## 1. Primary Provider: Blunt.cash Integration

- **Payment Link:** `https://pay.blunt.cash/buy/bigger-energy`
- **Supported Assets:** Solana SOL, USDC, Major Cryptocurrencies.
- **Hosted Flow:** Customer selects payment method on Blunt's hosted modal, broadcasts transaction on-chain.
- **Redirection:** Upon finality, Blunt redirects customer back to the store URL with query parameters.
- **Free-Tier Invariant:** Because Blunt free tier does not broadcast asynchronous webhooks to custom endpoints, the application does not rely solely on webhooks. It pairs hosted return redirects with client-side polling and instant cookie issuance.

## 2. Secondary Provider Architecture

- **Configuration:** Managed via `src/lib/payments/config.ts` and `SECONDARY_PAYMENT_PROVIDER` environment variable.
- **Supported Targets:**
  1. `coinbase`: Coinbase Commerce (crypto, direct webhooks).
  2. `stripe`: Stripe Checkout (credit cards / Apple Pay, webhooks).
  3. `helio`: Helio Pay (Solana native checkout, instant webhooks).
  4. `disabled`: Runs single-provider mode with Blunt.cash exclusively.
- **Webhook Endpoint:** `POST /api/webhooks/secondary`
  - Ingests charge events (`charge:confirmed`, `checkout.session.completed`, `payment.success`).
  - Resolves or creates order in `src/lib/orders/store.ts`.
  - Dispatches fulfillment access link via Resend.

## 3. Video Streaming Infrastructure: Mux Video

- **Environment Name:** `BIGGER-ENERGY`
- **Environment Key:** `girnh124eh2798iemmsbl2o75`
- **Teaser Video Asset:**
  - Asset ID: `4ANBwxJ5eZuJ023m7Dxk02W01O8rVG49FZW4lySdgz8IGI`
  - Playback Policy: `public`
  - Playback ID: `ac3dvpgq7mCwBZaa7eQQd7EhtvlFzc5xEY9j3c02W4DE`
  - Status: READY (1440p UHD, 30fps)
- **Fulfillment Video Asset:**
  - Upload ID: `xVK3HNBd01SclFfWt1tWPHOtamAolsIwssWDJmWzYdt00`
  - Playback Policy: `signed` (anti-piracy enforcement)
  - Signing Algorithm: RS256 with Mux RSA Key Pair
- **Webhooks:** Not required for static catalog playback.

## 4. Email Communications: Resend SDK

- **SDK Package:** `resend`
- **Configuration:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- **Failure Mode:** If Resend API fails or key is missing, system falls back to console logging the magic link in development and returns the access link directly in the API response so the customer is never stranded.
