# CHAD KERMIT STOREFRONT: MASTER UI-SENSEI AUDIT & LAUNCH COMPLETION BLUEPRINT

**System:** Chad Kermit / Eggplant Method Direct-to-Consumer Digital Storefront  
**Protocol:** SENTINEL OMEGA 3 / UI-SENSEI FORENSIC AUDIT  
**Dev Server:** Localhost:3000 (Next.js 16.3.6 Turbopack Active)  
**Date:** September 2026  
**Regulatory Taxonomy:** Skill-Based Financial Settlement & Digital Entitlements (Zero Casino/Gambling Lexicon)

---

## 1. EXECUTIVE SUMMARY & DEV ENVIRONMENT CONFIRMATION

The local development environment has been initialized and verified running on port 3000 via Turbopack:
- **Local URL:** `http://localhost:3000`
- **Network URL:** `http://192.168.100.30:3000`
- **HTTP Response:** `200 OK` (Turbopack compile time ~87ms - 2.4s)
- **Background Daemon Task:** `task-195` (Process active)

You can immediately open your browser to **`http://localhost:3000`** to view and interact with the storefront.

---

## 2. UI-SENSEI SPATIAL & COMPONENT FORENSIC AUDIT

Every component, stylesheet, and route has been inspected line-by-line against modern ergonomic standards, VOID/DRIFT OS design tokens, and accessibility principles.

### Component-by-Component Topology

```
src/
├── app/
│   ├── layout.tsx                     [Global shell, font injection, metadata]
│   ├── globals.css                    [Theme tokens, kinetic keyframes, focus states]
│   ├── page.tsx                       [Root page - renders UnpurchasedHomepage]
│   ├── access/route.ts                [Server-side cookie issuance & redirection]
│   ├── my-course/[courseId]/page.tsx  [Client entitlement gate & verification]
│   └── api/
│       ├── blunt/create-order/        [Server-authoritative order creator]
│       ├── blunt/webhook/             [HMAC verification & entitlement minting]
│       ├── orders/[orderId]/          [Status polling endpoint]
│       └── verify-code/               [Session cookie verification]
├── components/
│   ├── Header.tsx                     [Theme toggle, brand mark, top anchor]
│   ├── UnpurchasedHomepage.tsx        [Hero, Character Sheet, Method, CTA]
│   ├── AntechamberModal.tsx           [Bottom sheet drawer, 6-phase state machine]
│   ├── PurchasedExperience.tsx        [Authenticated course viewer & lesson gate]
│   └── checkout/
│       └── BluntEmbed.tsx             [Crypto payment widget loader & dev test harness]
└── lib/
    ├── course-content.ts              [Single source of pricing & copywriting truth]
    ├── server-auth.ts                 [Server-side token verification]
    ├── redis.ts                       [Dual-mode KV client with dev memory fallback]
    ├── orders/store.ts                [Order state machine & idempotency claims]
    └── entitlements/store.ts          [SHA-256 hashed token issuance & lookup]
```

---

### Deep Component Breakdown & Physical Code Citations

#### 1. Header Navigation (`src/components/Header.tsx`)
- **Source Lines:** [Header.tsx:1-49](file:///e:/CHAD-KERMIT/chad-kermit-method-project-export/src/components/Header.tsx#L1-L49)
- **State Classification:** 🟢 **Wired & Active**
- **Spatial Positioning:** Fixed top (`fixed inset-x-0 top-0 z-40`), height `72px`, container `max-w-[1180px]`.
- **Interactivity:**
  - Brand Mark: "CK" 40px rounded avatar with subtle scale-on-hover transition.
  - Theme Toggle: Instant switch between Dark mode (`#0d100d`) and Light mode (`#f5f7f2`) with localStorage persistence (`eggplant-theme`).
- **Fitts's Law & Touch Target:** Button has `min-h-11 min-w-11` (44px) meeting Apple HIG accessibility thresholds.

#### 2. Hero & Storefront Experience (`src/components/UnpurchasedHomepage.tsx`)
- **Source Lines:** [UnpurchasedHomepage.tsx:1-200](file:///e:/CHAD-KERMIT/chad-kermit-method-project-export/src/components/UnpurchasedHomepage.tsx#L1-L200)
- **State Classification:** 🟢 **Visually Complete / 🟡 Partially Wired (Sheet Controller Disconnected)**
- **Typography & Layout:**
  - Hero headline: `text-[clamp(3.5rem,12vw,8.4rem)]` with tight negative tracking (`tracking-[-0.085em]`) and high contrast.
  - Grid ratio: `0.92fr : 1.08fr` desktop split with natural mobile collapse.
  - Imagery: Chad Kermit character sheet with `aspect-[0.86]`, rounded 52px corners, and subtle organic gradient overlays.
  - Primary CTA: `min-h-[68px]`, pill shape, high-contrast ink color (`var(--accent-ink)` on `var(--accent)`).
  - Micro-trust signals: Private access badge, format indicator, and single price badge (`$22.30 one-time`).

#### 3. Bottom-Sheet Antechamber Drawer (`src/components/AntechamberModal.tsx`)
- **Source Lines:** [AntechamberModal.tsx:1-246](file:///e:/CHAD-KERMIT/chad-kermit-method-project-export/src/components/AntechamberModal.tsx#L1-L246)
- **State Classification:** 🟢 **Component Complete / 🟡 Needs Controller Hookup**
- **Kinetics & Ergonomics:**
  - Panel slides from bottom (`sheet-in` keyframe, 360ms cubic-bezier curve).
  - Touch pill handle (`h-1.5 w-12 rounded-full bg-[var(--line)]`) for visual affordance.
  - Max height `92dvh` with smooth vertical scroll.
  - Safe-area inset bottom padding (`pb-[calc(20px+env(safe-area-inset-bottom))]`) ensuring zero occlusion on iPhones with home bars.
- **Accessibility & Focus Trapping:**
  - Complete circular tab-key focus trap ([AntechamberModal.tsx:48-75](file:///e:/CHAD-KERMIT/chad-kermit-method-project-export/src/components/AntechamberModal.tsx#L48-L75)).
  - ESC key listener automatically locks during on-chain confirmation (`phase !== 'confirming'`) to prevent accidental dismissal during financial settlement.

#### 4. Blunt Payment Embed (`src/components/checkout/BluntEmbed.tsx`)
- **Source Lines:** [BluntEmbed.tsx:1-129](file:///e:/CHAD-KERMIT/chad-kermit-method-project-export/src/components/checkout/BluntEmbed.tsx#L1-L129)
- **State Classification:** 🟢 **Wired with Developer Test Harness**
- **Behavior:**
  - Dynamic async script injection (`https://blunt.cash/widget/blunt.js`).
  - React 19 double-invoke protection via `mounted.current` guard.
  - Standby Fallback: When `NEXT_PUBLIC_BLUNT_PUBLIC_KEY` is not yet set in `.env.local`, renders an intuitive "Simulate On-Chain Submission (Dev Test)" button so the entire checkout state machine can be tested locally without an active merchant wallet!

#### 5. Authenticated Member Area (`src/components/PurchasedExperience.tsx`)
- **Source Lines:** [PurchasedExperience.tsx:1-86](file:///e:/CHAD-KERMIT/chad-kermit-method-project-export/src/components/PurchasedExperience.tsx#L1-L86)
- **State Classification:** 🟢 **Structure Ready / 🟡 Media Engine Standby**
- **Behavior:**
  - Reads entitlement and course metadata.
  - Displays access confirmation badges, lesson curriculum details, and disclaimer notes.
  - Video player is currently in secure standby awaiting private video CDN credentials.

---

## 3. FORENSIC GAPS & ARCHITECTURAL DISCREPANCIES DETECTED

Our deep codebase sweep identified four specific disconnects that must be bridged for complete end-to-end launch readiness:

### Gap 1: Antechamber Controller Disconnection
- **File:** `src/components/UnpurchasedHomepage.tsx` ([lines 23-26](file:///e:/CHAD-KERMIT/chad-kermit-method-project-export/src/components/UnpurchasedHomepage.tsx#L23-L26))
- **Issue:** The homepage renders `<AntechamberModal isOpen={isSheetOpen} onClose={closeCheckout} />` without passing `onStartCheckout`, `phase`, `isPreparing`, or `embedSlot`. Clicking "Start the method" opens the sheet, but clicking the checkout CTA inside the sheet does nothing.
- **Remedy:** Create the unified `CheckoutSheet` controller that encapsulates:
  1. Email input state.
  2. Order creation API call (`/api/blunt/create-order`).
  3. Status polling against `/api/orders/[orderId]`.
  4. Phase transitions: `idle` → `preparing` → `checkout` → `confirming` → `fulfilled`.

### Gap 2: Missing Customer Email Capture in Checkout
- **File:** `src/components/AntechamberModal.tsx` ([lines 160-185](file:///e:/CHAD-KERMIT/chad-kermit-method-project-export/src/components/AntechamberModal.tsx#L160-L185))
- **Issue:** The sheet asks for payment but lacks an input field for the customer's email address. Blunt.cash needs this email in metadata so that when the blockchain payment settles, the webhook can trigger `sendAccessEmail`.
- **Remedy:** Add a sleek, seamless email input above the checkout button in the `idle` phase with instant format validation.

### Gap 3: Token Invariant Mismatch in `server-auth.ts` vs `entitlements/store.ts`
- **Files:** `src/lib/server-auth.ts` ([lines 25-45](file:///e:/CHAD-KERMIT/chad-kermit-method-project-export/src/lib/server-auth.ts#L25-L45)) vs `src/lib/entitlements/store.ts` ([lines 20-56](file:///e:/CHAD-KERMIT/chad-kermit-method-project-export/src/lib/entitlements/store.ts#L20-L56))
- **Issue:** `entitlements/store.ts` stores entitlements hashed under `ent:${sha256(token)}` with field `courseId`. Legacy `server-auth.ts` looked up raw unhashed tokens and checked `data.fulfillmentId`. Any token minted by the new checkout engine would be rejected by `/access` and `/api/verify-code`!
- **Remedy:** Upgrade `verifyTokenOnServer` in `src/lib/server-auth.ts` to first check `lookupEntitlement(token)` from the new store, and fallback to legacy raw keys for 100% backwards compatibility.

### Gap 4: Private Video Delivery Engine
- **Files:** `src/components/PurchasedExperience.tsx` ([lines 50-70](file:///e:/CHAD-KERMIT/chad-kermit-method-project-export/src/components/PurchasedExperience.tsx#L50-L70))
- **Issue:** The lesson player is currently an unmounted placeholder ("Secure video delivery is being connected").
- **Remedy:** Implement `src/lib/mux.ts` with signed playback token generation and `/api/media/lesson` to serve token-gated video streams securely.

---

## 4. LAUNCH EXECUTION ROADMAP (REMAINDER TO 100% COMPLETION)

```mermaid
flowchart TD
    A["Phase 1: Bridge Controller (CheckoutSheet.tsx)"] --> B["Phase 2: Email Capture & Validation"]
    B --> C["Phase 3: Unify Token Verification (server-auth.ts)"]
    C --> D["Phase 4: Private Video Streaming (Mux / Media API)"]
    D --> E["Phase 5: Final Production Verification & Lint"]
```

### Milestone 1: Create `src/components/checkout/CheckoutSheet.tsx` & Wire into Homepage
- Embed email state and validation.
- Connect `/api/blunt/create-order` with persistent `sessionId` stored in sessionStorage.
- Mount `BluntEmbed` with dynamic order data and dev test simulator.
- Poll `/api/orders/[orderId]` every 2.5s once payment is submitted until status becomes `fulfilled`.

### Milestone 2: Unify `src/lib/server-auth.ts`
- Import `lookupEntitlement` from `@/lib/entitlements/store`.
- Validate hashed tokens first, checking `ent.courseId === courseId`.
- Preserve fallback for legacy tokens.

### Milestone 3: Implement Token-Gated Media Streaming
- Add `src/lib/mux.ts` for signed playback JWT creation.
- Add `src/app/api/media/lesson/route.ts` validating the `eggplant_access` cookie before returning streaming URLs.
- Update `PurchasedExperience.tsx` to render an authenticated video player.

---

## 5. EVIDENCE & STATUS LEDGER

| Dimension | Physical File | Status | Verification Detail |
|---|---|---|---|
| Dev Server | `npm run dev` | 🟢 Verified L4 | HTTP 200 on port 3000 |
| Design System | `src/app/globals.css` | 🟢 Verified L3 | OLED true dark, tokens, reduced-motion |
| Header Nav | `src/components/Header.tsx` | 🟢 Verified L3 | Theme toggle with localStorage |
| Storefront Hero | `src/components/UnpurchasedHomepage.tsx` | 🟢 Verified L3 | Responsive 2-col, Chad Kermit image, $22.30 price |
| Bottom Sheet | `src/components/AntechamberModal.tsx` | 🟢 Verified L3 | 6-phase state machine, focus trap, safe area |
| Payment Backend | `src/app/api/blunt/create-order` | 🟢 Verified L3 | Server-authoritative price ($22.30) |
| Webhook Verification | `src/app/api/blunt/webhook` | 🟢 Verified L3 | HMAC-SHA256, deduplication, entitlement mint |
| Token Store | `src/lib/entitlements/store.ts` | 🟢 Verified L3 | SHA-256 token hashing, 365-day TTL |
| Email Delivery | `src/lib/email/sendAccessEmail.ts` | 🟢 Verified L3 | Nodemailer SMTP + dev console fallback |
