# BIGGER_ENERGY // 06 — FINANCIAL INTEGRITY & VALUE RECONCILIATION

## 1. VALUE CONSERVATION & FLOW ANALYSIS

In `BIGGER_ENERGY`, every transaction represents a $22.30 USD digital license sale:

```text
Buyer Wallet (Crypto)
       │
       ▼ (Direct on-chain transfer on Solana / Base / Arbitrum / Ethereum)
Merchant Wallet (Protocol Owner)
       │
       ▼ (On-chain finality)
Blunt.cash Protocol / Provider B Webhook
       │
       ▼ (HMAC-SHA256 Signed POST)
/api/blunt/webhook (or /api/webhooks/secondary)
       │
       ▼ (Idempotency Claim: event:{payment_id})
Atomic Entitlement Minting + Access Email Dispatch
```

### Key Invariants:
1. **Zero Escrow Freeze Risk:** Because funds move directly from buyer to merchant wallet on-chain, no middleman holds custody of the funds.
2. **Atomic Webhook Deduplication:** Every webhook event checks `claimPaymentEvent(payment_id)` using Redis `SET ... NX`. Duplicate deliveries or network retries receive `200 OK { duplicate: true }` without re-minting entitlements or sending duplicate emails.
3. **Price Matching Invariant:** The webhook confirms that the received payment amount matches the product price (`Math.abs(e.amount_usd - order.amountUsd) < 0.05`). Mismatched or partial payments are flagged `manual_review` and rejected.
4. **Destination Wallet Invariant:** If `BLUNT_EXPECTED_DESTINATION_WALLETS_JSON` is populated, the webhook confirms that `destination_wallet` matches the merchant's registered receiving address for that chain.
