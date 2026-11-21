# 18-ROLLBACK-AND-INCIDENT-RUNBOOK: BIGGER_ENERGY

## 1. Incident Response Matrix

### Scenario A: Payment Gateway Downtime (Blunt.cash down)
1. **Detection:** Alerts from customers or checkout failure toasts.
2. **Action:**
   - In Vercel Environment Variables, set `SECONDARY_PAYMENT_PROVIDER=coinbase` (or `stripe` / `helio`).
   - Trigger instant redeploy (takes ~30s).
   - Checkout modal now routes customers to secondary provider.
3. **Recovery:** Once Blunt is restored, revert `SECONDARY_PAYMENT_PROVIDER=disabled` or keep dual-provider toggle active.

### Scenario B: Mux Signing Key Compromise
1. **Detection:** Unauthorized traffic spikes on Mux analytics or key leak report.
2. **Action:**
   - Open Mux Dashboard -> **Settings** -> **Signing Keys**.
   - Generate a replacement key pair.
   - Update `MUX_SIGNING_KEY_ID` and `MUX_PRIVATE_KEY` in Vercel.
   - Delete the old compromised key in Mux dashboard (all previously signed JWTs instantly become invalid).

### Scenario C: Customer Paid but Did Not Receive Access Link
1. **Detection:** Customer emails support or messages on Instagram with transaction hash.
2. **Action:**
   - Use internal fulfillment endpoint:
     ```bash
     curl -X POST https://yourdomain.com/api/internal/fulfillment-trigger \
       -H "Authorization: Bearer <INTERNAL_SECRET>" \
       -H "Content-Type: application/json" \
       -d '{"email": "customer@example.com", "courseId": "eggplant-method-v1"}'
     ```
   - Customer instantly receives new access link and session cookie.

## 2. Instant Vercel Rollback Procedure
1. Open Vercel Project Dashboard -> **Deployments**.
2. Locate previous known-good deployment.
3. Click `...` menu -> **Instant Rollback**.
4. Traffic instantly shifts to previous deployment in 0 downtime.
