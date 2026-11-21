# 03-UI-AND-CUSTOMER-JOURNEY-AUDIT: BIGGER_ENERGY

## 1. Route Census & Interaction Surface

| Route | Type | Auth Required? | Primary Action / Purpose | Mobile (360px) | Desktop (1440px) | Loading State | Error Recovery |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | Dynamic | No | Convert visitor, stream teaser, open payment modal | Clean single-column stack, touch targets >= 48px | Sticky header, dual-column hero, high-contrast review cards | Skeleton loaders on dynamic blocks | Root error boundary |
| `/access` | Dynamic | Optional Token | Validate access token from URL or email link, issue cookie | Form auto-centers, numeric/alphanumeric code inputs | Centered obsidian card | Spinner on submission | Actionable error message with resend prompt |
| `/my-course/[courseId]` | Dynamic | Yes (Cookie) | Stream full 11-min masterclass with Mux player | 16:9 aspect ratio locked, full-screen enabled | Fluid widescreen layout with chapter notes | Player buffering indicator | Redirects to `/access` if cookie invalid or expired |
| `/proof` | Static | No | Supplementary social proof, anatomical diagrams, reviews | Responsive bento grid | 3-column layout | Static SSG (instant) | Static fallback |
| `/_not-found` | Static | No | 404 recovery page | Centered CTA to return home | Centered CTA to return home | Instant static | Direct link to `/` |

## 2. Interactive Control & Button Audit

1. **"Unlock Full Video ($22.30)" (Hero CTA):**
   - Event: Opens `AntechamberModal` / `CheckoutSheet`.
   - Double-Tap Prevention: State disables click once active.
   - Accessibility: ARIA dialog role, focus trap on open, ESC key closes modal.

2. **Teaser Play Button (Teaser Video Player):**
   - Event: Mounts Mux iframe embed with `autoplay=1`.
   - Behavior: Instantly plays public teaser `ac3dvpgq7mCwBZaa7eQQd7EhtvlFzc5xEY9j3c02W4DE` with sound toggle indicator.
   - Zero Dead-Click Guarantee: Fallback click listener opens video directly.

3. **"Pay via Blunt.cash" / "Pay via Secondary Gateway":**
   - Event: Dispatches order creation request to `/api/blunt/create-order` or navigates to hosted checkout link.
   - Loading State: Spinner rendered inside button, button disabled during pending fetch.
   - Error Handling: Displays inline toast with direct fallback link if API fails.

4. **"Access My Course" (Header Navigation):**
   - Event: Navigates directly to `/access`.
   - Behavior: If user already has valid `eggplant_access` cookie, automatically forwards to `/my-course/eggplant-method-v1`.

5. **Access Code Form Submission (`/access`):**
   - Event: POSTs to `/api/verify-code`.
   - Behavior: Validates code format, sets HttpOnly cookie upon success, redirects to course.
   - Failure: Shows red error banner with "Need help? Contact support" without wiping entered code.
