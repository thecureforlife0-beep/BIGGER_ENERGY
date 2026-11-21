# 11-SECURITY-PERFORMANCE-AND-OPERATIONS: BIGGER_ENERGY

## 1. Threat Model & Security Invariants

| Threat Vector | Risk Level | Defense Architecture | Residual Risk |
| :--- | :--- | :--- | :--- |
| **Stream Piracy / Direct .m3u8 Scraping** | Critical (P0) | Mux Signed Playback Policy (`signed`). Mux Edge rejects requests lacking valid RS256 JWT. | Minimal (Requires screen capture, raw stream is protected) |
| **Tampered Access Cookies** | High (P1) | AES-256-GCM / HMAC token signing with `ACCESS_COOKIE_SECRET`. Invalid signatures rejected immediately. | Zero |
| **Unauthorized Media API Calls** | High (P1) | `/api/media/lesson` strictly gates JWT issuance behind valid session verification. | Zero |
| **CSRF & XSS Token Theft** | Medium (P2) | Session cookies configured with `HttpOnly; Secure; SameSite=Lax`. Tokens inaccessible to browser JS. | Zero |
| **Denial of Service via Polling** | Medium (P2) | Client polling capped at 3 minutes (180s) maximum. Server rejects polling requests for non-existent orders. | Low |
| **Secret Leakage in Git / Bundles** | High (P1) | Secrets isolated to server-only routes (`import 'server-only'`). Private keys never prefixed with `NEXT_PUBLIC_`. | Zero |

## 2. Performance & Latency Targets
- **Lighthouse Performance Score:** 95+ (Pre-rendered static HTML, optimized WebP/PNG images).
- **Time to First Byte (TTFB):** < 80ms globally via Vercel Edge Cache.
- **Video Startup Time:** < 500ms via Mux Global CDN (HLS chunk streaming).
- **Bundle Size:** Under 120KB initial JS chunk (Zero bloated third-party video players, native Mux embed).
