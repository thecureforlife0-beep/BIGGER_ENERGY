# 09-PRODUCTION-AND-DEPLOYMENT-TRUTH: BIGGER_ENERGY

## 1. Target Infrastructure Topology

- **Platform:** Vercel Serverless Edge Network (works directly on free `.vercel.app` domain with zero custom domain purchase required)
- **Framework:** Next.js 16.3.6 (Turbopack Engine)
- **Node Runtime:** Node.js 20.x LTS
- **HTTPS Enforcement:** Automatic SSL/TLS termination via Vercel Edge Certificates
- **Zero Cold Start Impact:** Core landing page and proof sections are statically pre-rendered at build time (`○ (Static)`).
- **Video Delivery Architecture:** Mux Global CDN with dual-layer security:
  - Teaser: Public HLS stream (`ac3dvpgq7mCwBZaa7eQQd7EhtvlFzc5xEY9j3c02W4DE`)
  - Fulfillment: Encrypted RS256 Signed HLS stream (`tNGocfMgHTDM2201au01Q9mtKRc02qN8tkfUFcvFY01NOEo`)
- **Dual Payment Rail Architecture:**
  - Primary: Blunt.cash (`https://pay.blunt.cash/buy/bigger-energy`)
  - Secondary: Paymegate (`https://www.paymegate.com/checkout/884a31cd-6589-449e-90a8-da36aa5469ef`)
- **Zero-Domain Email Delivery:** Multi-transport engine prioritizing **Gmail SMTP (`nodemailer`)** or **Brevo HTTP API** so customers receive real access emails even when hosted on `.vercel.app` (avoiding Resend's `onboarding@resend.dev` 403 restriction).

---

## 2. Definitive Production Environment Variables Table (Sanitized — Inject Real Secrets in Vercel Dashboard)

| Variable Name | Environment Scope | Value / Where to Grab It | Verification Status |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_BASE_URL` | Production & Preview | `https://your-project.vercel.app` (or custom domain) | 🟢 Required |
| `NEXT_PUBLIC_ACTIVE_PAYMENT_PROVIDER` | Production & Preview | `both` (`blunt` \| `provider_b` \| `both`) | 🟢 Verified |
| `NEXT_PUBLIC_BLUNT_PAYMENT_URL` | Production & Preview | `https://pay.blunt.cash/buy/bigger-energy` | 🟢 Verified & Active |
| `BLUNT_MERCHANT_ID` | Production & Preview | `ed70a7cd-999a-46ac-8b3e-3c48c1cdafe6` | 🟢 Verified |
| `BLUNT_MODE` | Production & Preview | `live` | 🟢 Verified |
| `NEXT_PUBLIC_MUX_TEASER_PLAYBACK_ID` | Production & Preview | `ac3dvpgq7mCwBZaa7eQQd7EhtvlFzc5xEY9j3c02W4DE` | 🟢 Live Verified (Ready) |
| `MUX_PLAYBACK_ID` | Production & Preview | `tNGocfMgHTDM2201au01Q9mtKRc02qN8tkfUFcvFY01NOEo` | 🟢 Live Verified (Ready) |
| `MUX_SIGNING_KEY_ID` | Production & Preview | `Hn381Gx45Zd8Vy3D02RtFxlNygYRlDD9t9kgk01uDnJos` | 🟢 Live Tested (RS256) |
| `MUX_PRIVATE_KEY` | Production & Preview | *(Secret: paste Base64 string from local `.env.local`)* | 🟢 Live Tested (HTTP 200) |
| `SECONDARY_PAYMENT_PROVIDER` | Production & Preview | `paymegate` | 🟢 Fully Wired |
| `PAYMEGATE_API_KEY` | Production & Preview | *(Secret: paste from Paymegate Dashboard / `.env.local`)* | 🟢 Fully Wired |
| `PAYMEGATE_CHECKOUT_URL` | Production & Preview | `https://www.paymegate.com/checkout/884a31cd-6589-449e-90a8-da36aa5469ef` | 🟢 Live Verified |
| `PAYMEGATE_WEBHOOK_SECRET` | Production & Preview | *(Secret: reveal in Paymegate Dashboard after saving Webhook URL)* | 🟡 Set after Vercel URL live |
| `NEXT_PUBLIC_PROVIDER_B_NAME` | Production & Preview | `Paymegate` | 🟢 Active |
| `NEXT_PUBLIC_PROVIDER_B_BADGE` | Production & Preview | `Cards · Solana · BTC · EVM` | 🟢 Active |
| `NEXT_PUBLIC_PROVIDER_B_CHAINS` | Production & Preview | `Solana · Base · BTC · ETH` | 🟢 Active |
| `NEXT_PUBLIC_PROVIDER_B_PAYMENT_URL` | Production & Preview | `https://www.paymegate.com/checkout/884a31cd-6589-449e-90a8-da36aa5469ef` | 🟢 Active |
| `EMAIL_FROM_NAME` | Production & Preview | `Bigger Energy` | 🟢 Active |
| `GMAIL_USER` | Production & Preview | *(Recommended Free Zero-Domain: your `@gmail.com` address)* | 🟢 Supported via Nodemailer |
| `GMAIL_APP_PASSWORD` | Production & Preview | *(Secret: 16-char Google App Password — NOT your Gmail login)* | 🟢 Supported via Nodemailer |
| `BREVO_API_KEY` | Production & Preview | *(Optional Alternative Free Zero-Domain: from Brevo Dashboard)* | 🟢 Supported via HTTP API |
| `BREVO_SENDER_EMAIL` | Production & Preview | *(Optional: verified Gmail sender in Brevo)* | 🟢 Supported via HTTP API |
| `RESEND_API_KEY` | Production & Preview | *(Optional — only works for real buyers if custom domain verified)* | 🟡 Domain-gated by Resend |
| `RESEND_FROM_EMAIL` | Production & Preview | `onboarding@resend.dev` *(sandbox owner-only)* or `access@yourdomain.com` | 🟡 Domain-gated by Resend |

> [!CAUTION]
> **Secret Hygiene Rule:** Never commit raw API keys (`RESEND_API_KEY`, `PAYMEGATE_API_KEY`, `MUX_PRIVATE_KEY`, `GMAIL_APP_PASSWORD`) into Markdown docs or Git source files. Inject them strictly in `.env.local` (gitignored) and the Vercel Environment Variables dashboard.

---

## 3. Webhook URL Configuration in Paymegate Dashboard

From your Paymegate merchant dashboard:
- **Webhook URL:** `https://<YOUR-VERCEL-DOMAIN>.vercel.app/api/webhooks/paymegate`
- **Webhook Event:** `order.paid`
- **Signature Algorithm:** Unpadded Base64URL HMAC-SHA256 (`X-Paymegate-Signature`)
- **Deduplication:** Automatic idempotency handling via `X-Paymegate-Event-Id`
