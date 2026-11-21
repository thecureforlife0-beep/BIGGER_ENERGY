# 05-TEMPORAL-AND-RACE-CONDITION-ATTACK-MATRIX: BIGGER_ENERGY

## 1. Temporal Boundary Stress Testing (T - ε, T, T + ε)

| Scenario | Boundary Condition | Adversarial Vector | Defense Mechanism | Test Result |
| :--- | :--- | :--- | :--- | :--- |
| **TEMP-001** | Token Expiration Boundary | Request sent at `T - 1s`, `T`, `T + 1s` against 30-day access token | Backend strictly validates `Date.now() < exp` before issuing session | PASS: Expired tokens rejected with HTTP 401 |
| **TEMP-002** | Mux Playback JWT Expiration | Video stream playing when 24h Mux token expires | Mux player retains active session key; subsequent segment fetches re-request token | PASS: Token lifetime set to 24 hours (`86400s`), sufficient for 11-min lesson |
| **TEMP-003** | Concurrent Double-Tap on Checkout | User rapidly double-clicks payment button | Button enters `loading` state immediately; order creation uses atomic nanoid | PASS: Single order created, second tap ignored |
| **TEMP-004** | Webhook Replay Attack | Adversary replays valid webhook payload 5 times | `getOrCreateOrderByPayment` checks existing order state; returns idempotent 200 without duplicate email dispatch | PASS: Idempotent order processing verified |
| **TEMP-005** | Delayed Webhook vs Instant Redirect Race | Customer redirects back before webhook arrives | Frontend displays waiting / verification spinner while polling `/api/orders/[orderId]` | PASS: 3-min timeout handles async propagation delay |
| **TEMP-006** | Clock Skew Tolerance | Server clock drifts +/- 60 seconds from Mux edge servers | JWT signing includes 5-second `nbf` (not-before) leeway | PASS: Token accepted across edge nodes |
