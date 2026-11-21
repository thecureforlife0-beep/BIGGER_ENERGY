# 12-DEPENDENCY-AND-BLAST-RADIUS-MAP: BIGGER_ENERGY

## 1. Dependency Graph

```mermaid
graph TD
    User([Customer]) --> NextApp[Next.js Storefront]
    NextApp --> BluntGateway[Blunt.cash Payment Rail]
    NextApp --> SecondaryGateway[Secondary Payment Gateway]
    NextApp --> ResendSDK[Resend Email Delivery]
    NextApp --> MuxAPI[Mux Video Infrastructure]
    MuxAPI --> MuxCDN[Mux Global HLS Edge]
    User -.->|Streams Video| MuxCDN
```

## 2. Blast Radius Matrix

| Component Modified | Direct Blast Radius | Indirect Blast Radius | Second-Order Blast Radius | Safety Measures |
| :--- | :--- | :--- | :--- | :--- |
| **`src/lib/mux.ts`** | `/api/media/lesson`, video playback component | Customer video playback experience | Customer support volume regarding playback issues | Multi-env fallback (`primary` & `secondary`), dev-preview fallback |
| **`src/app/api/blunt/webhook/route.ts`** | Order processing from Blunt.cash | Email issuance via Resend, cookie generation | Customer access to purchased video | `getOrCreateOrderByPayment` auto-synthesizes un-tracked orders |
| **`src/lib/payments/`** | Secondary payment webhooks, checkout modal | Payment provider selection | Revenue flow redundancy | Isolated to separate route (`/api/webhooks/secondary`) |
| **`src/lib/course-content.ts`** | Landing page copy, teaser playback ID | Teaser video player component | Visitor conversion rate | Overridable via `NEXT_PUBLIC_MUX_TEASER_PLAYBACK_ID` env var |
