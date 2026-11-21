# 13-COMPLETE-FAILURE-MATRIX: BIGGER_ENERGY

## 1. System-Wide Failure Modes & Recovery Procedures

| Failure Scenario | Layer | Impact | Fallback / Recovery Mechanism | User Experience |
| :--- | :--- | :--- | :--- | :--- |
| **Mux Token Signing Fails (Missing Key)** | Media | Cannot sign playback JWT | Tries secondary Mux keys; falls back to local dev-preview stream | Logs error in backend; shows retry message to user |
| **Blunt.cash Payment Gateway Down** | Commerce | Customer cannot complete checkout | Customer can toggle to Secondary Payment Provider (Coinbase/Stripe/Helio) | Smooth switch with zero code changes |
| **Resend Email Service Fails** | Communications | Delivery email delayed or undelivered | Access URL returned directly in checkout response; manual fulfillment endpoint available | Customer gets immediate access on-screen; email queued |
| **Customer Loses Access Cookie / Clears Cache** | Session | Cannot stream course on return visit | Customer visits `/access` and enters email or order code | Instant cookie re-issuance |
| **Mux Edge CDN Degradation** | CDN | Video buffering or playback stall | Mux player automatically switches adaptive bitrate tiers (1080p -> 720p -> 480p) | Continuous playback with lower resolution |
| **Invalid Access Code Entered** | Auth | Unauthorized request to `/access` | Form displays error message without resetting input field | Clean actionable feedback |
| **Order Polling Times Out (>3 min)** | Frontend | User remains in waiting modal | Modal updates to display "Check your email for your instant access link" | Reassuring prompt directing user to inbox |
