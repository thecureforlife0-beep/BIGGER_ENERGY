# BIGGER_ENERGY // 17 — LAUNCH SEQUENCE & RELEASE GATES

## PRE-LAUNCH CHECKLIST (BEFORE GOING LIVE ON VERCEL)

### Gate 1: Git Push to New GitHub Repository
```bash
git add .
git commit -m "feat(launch): dual payment adapter, hosted link fulfillment auto-mapping, and universal Mux playback"
git push -u origin main
```
*Destination verified:* `https://github.com/thecureforlife0-beep/BIGGER_ENERGY.git`

---

### Gate 2: Vercel Project Creation
1. Go to [vercel.com](https://vercel.com) and click **Add New... -> Project**.
2. Import `thecureforlife0-beep/BIGGER_ENERGY`.
3. Set Framework Preset to **Next.js**.

---

### Gate 3: Production Environment Variables (Vercel Project Settings)

| Key | Description | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | Production URL (e.g. `https://bigger-energy.vercel.app`) | Vercel domain |
| `NEXT_PUBLIC_ACTIVE_PAYMENT_PROVIDER` | `blunt` (or `provider_b` or `both`) | Founder decision |
| `BLUNT_MERCHANT_ID` | `ed70a7cd-999a-46ac-8b3e-3c48c1cdafe6` | Blunt.cash dashboard |
| `NEXT_PUBLIC_BLUNT_PUBLIC_KEY` | Merchant public key | Blunt.cash dashboard |
| `BLUNT_WEBHOOK_SECRET` | Webhook HMAC secret | Blunt.cash dashboard -> Webhooks |
| `BLUNT_MODE` | `live` (set to `test` for staging checks) | Blunt.cash dashboard |
| `BLUNT_ACCEPTED_CHAINS` | `base,sol,arb,eth` | Supported chains |
| `KV_REST_API_URL` | Redis REST URL | Upstash Redis console |
| `KV_REST_API_TOKEN` | Redis REST Token | Upstash Redis console |
| `MUX_PLAYBACK_ID` | Private video playback ID | Mux dashboard -> Video Assets |
| `MUX_SIGNING_KEY_ID` | Mux Signing Key ID | Mux dashboard -> Settings -> Signing Keys |
| `MUX_PRIVATE_KEY` | Mux RSA Private Key | Mux dashboard -> Signing Keys modal |
| `RESEND_API_KEY` | Resend API key | Resend.com console |
| `RESEND_FROM_EMAIL` | Sender email (e.g. `access@yourdomain.com`) | Resend verified domain |

---

### Gate 4: Webhook Endpoint Registration in Blunt Dashboard
1. Log in to [blunt.cash/merchant](https://blunt.cash/merchant).
2. Add Webhook URL:
   `https://<your-domain>/api/blunt/webhook`
3. Copy the generated Webhook Secret and paste into `BLUNT_WEBHOOK_SECRET` in Vercel.

---

### Gate 5: Production Smoke Test
1. Make a live test purchase of $22.30 on Base or Solana.
2. Verify on-chain transaction confirmation.
3. Verify access email arrives in buyer inbox with valid `/access?token=...` link.
4. Open the link, verify HttpOnly cookie exchange, and confirm video streams cleanly in `/my-course/eggplant-method-v1`.
