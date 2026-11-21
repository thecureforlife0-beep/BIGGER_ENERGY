# 08-BACKEND-DATA-CONSISTENCY: BIGGER_ENERGY

## 1. Storage Model & State Durability

The application utilizes a lightweight, highly performant hybrid storage model:
1. **Server-Side Order Store (`src/lib/orders/store.ts`):**
   - In-memory order tracking with persistent file/cache adapter capability.
   - Atomic mutation methods: `createOrder`, `updateOrderStatus`, `getOrderByPaymentId`, `getOrCreateOrderByPayment`.
   - Prevents duplicate order records across race conditions.
2. **Stateless Encrypted Client Tokens (`eggplant_access`):**
   - Issued upon verified order completion.
   - Encrypted with AES-256-GCM / HMAC using `ACCESS_COOKIE_SECRET`.
   - Payload: `{ orderId, email, courseId, exp }`.
   - HttpOnly, Secure, SameSite=Lax flags prevent XSS access.
   - Allows users to access their purchased video across sessions without requiring a database query on every video segment fetch.

## 2. Invariant Reconciliation

| State | Order Store State | Cookie State | Delivery Email | Allowed Action |
| :--- | :--- | :--- | :--- | :--- |
| **Pending Payment** | `status: 'pending'` | None | Not Sent | Display checkout modal / payment link |
| **Paid (Instant)** | `status: 'paid'` | Set (`eggplant_access`) | Dispatched | Stream masterclass immediately |
| **Returned via Link** | `status: 'paid'` | Set upon token redemption | Dispatched | Redirect to masterclass stream |
| **Tampered Token** | Rejected | Cleared | None | Redirect to `/access` with invalid code error |
