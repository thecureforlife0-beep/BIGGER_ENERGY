# blunt.cash Docs Capture Notes

Read-only research notes used to build `blunt-cash-integration-plan.md`. No secrets or account data are included.

## Accessible canonical pages

- https://blunt.cash/merchant/docs
- https://blunt.cash/merchant/docs/integrate/zero-code
- https://blunt.cash/merchant/docs/integrate/embed
- https://blunt.cash/merchant/docs/integrate/webhooks
- https://blunt.cash/merchant/docs/reference/api
- https://blunt.cash/merchant/docs/reference/chains
- https://blunt.cash/merchant/docs/reference/errors
- https://blunt.cash/merchant/docs/storefront/branding
- https://blunt.cash/merchant/docs/storefront/checkout
- https://blunt.cash/merchant/docs/storefront/wallets

## Key facts captured

- Blunt says payments are non-custodial and settle directly to merchant-controlled wallets.
- Inline embed is `Blunt.embed`; popup is `Blunt.pay`; hosted page is a separate checkout.
- Secret API keys are server-only; a separate public key is safe to embed.
- `payment.confirmed` is the primary fulfillment event.
- Webhooks have an `X-Blunt-Signature` HMAC-SHA256 signature over the exact raw body.
- Provider retries failed webhook deliveries for up to 24 hours; deduplicate by `payment_id`.
- REST payment creation accepts `amount_usd`, `chain_id`, `token`, optional `destination_wallet`, and metadata.
- Destination wallets must be registered and active; no silent fallback exists.
- Idempotency keys are required for safe retry/double-tap handling; same parameters replay, changed parameters conflict.
- Test keys begin with `mk_test_`; live keys begin with `mk_live_` according to the supplied docs excerpt.
- Test simulation supports confirm, underpay, and expire; test webhooks carry `test: true` and `X-Blunt-Mode: test`.
- Volatile quote windows are 10 minutes; stablecoins are 30 minutes; a 5-minute grace period watches late transactions.
- Digital products should require email only; no shipping address.
- Buyer paths are connect wallet, open in wallet, QR, and copy/paste.
- In-app browsers may block app handoffs; QR/copy-paste must remain available.
- The docs do not establish private-media storage/security limits for dashboard file downloads; do not assume them.
- Pay Button Badges add two distribution modes: light/dark SVG image badges (360×96) linked to a hosted product or payment URL, and a two-tag HTML snippet (`blunt.js` + a `data-blunt-*` button) that opens a branded checkout popup.
- Badge surfaces are useful for Linktree, email signatures, static partner pages, NFC/QR destinations, and hosted-link fallback. They are not the primary bottom-sheet integration: the SVG navigates away, and the HTML snippet opens a popup.
- The HTML snippet path auto-binds via data attributes: `data-blunt-amount`, `data-blunt-description`, `data-blunt-chains`, `data-blunt-order-id`, `data-blunt-metadata`, `data-blunt-nostyle`.
- A live public key was included in user-supplied content. Rotate/revoke it if active; never expose a secret key in the browser.
- The Pay Button Badges page was not retrievable at a guessed nested URL and was not indexed by web search. Facts above come from the user-supplied excerpt, not from a fetched canonical page.
