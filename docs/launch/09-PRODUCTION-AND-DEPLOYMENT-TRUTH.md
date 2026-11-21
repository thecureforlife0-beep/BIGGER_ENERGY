# 09-PRODUCTION-AND-DEPLOYMENT-TRUTH: BIGGER_ENERGY

## 1. Target Infrastructure Topology

- **Platform:** Vercel Serverless Edge Network
- **Framework:** Next.js 16.3.6 (Turbopack Engine)
- **Node Runtime:** Node.js 20.x LTS
- **Domain Configuration:** Primary custom domain + Vercel deployment preview URL
- **HTTPS Enforcement:** Automatic SSL/TLS termination via Vercel Edge Certificates (Let's Encrypt / DigiCert)
- **Zero Cold Start Impact:** Core landing page and proof sections are statically pre-rendered at build time (`○ (Static)`).

## 2. Environment Variables Verification Table

| Variable | Deployment Scope | Verified Locally? | Required for Launch? |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Production & Preview | Yes | Yes |
| `NEXT_PUBLIC_BLUNT_PAYMENT_URL` | Production & Preview | Yes | Yes |
| `NEXT_PUBLIC_MUX_TEASER_PLAYBACK_ID` | Production & Preview | Yes (`ac3dvpgq...`) | Yes |
| `MUX_TOKEN_ID` | Production & Preview | Yes | Yes |
| `MUX_TOKEN_SECRET` | Production & Preview | Yes | Yes |
| `MUX_PLAYBACK_ID` | Production & Preview | Staged | Yes |
| `MUX_SIGNING_KEY_ID` | Production & Preview | Staged | Yes |
| `MUX_PRIVATE_KEY` | Production & Preview | Staged | Yes |
| `ACCESS_COOKIE_SECRET` | Production & Preview | Yes (in .env.local) | Yes |
| `RESEND_API_KEY` | Production & Preview | Fallback ready | Optional (Recommended) |
| `SECONDARY_PAYMENT_PROVIDER` | Production & Preview | Configured (`disabled`/`coinbase`) | Optional |
