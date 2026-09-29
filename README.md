# Chad Kermit / Eggplant Method — Project

A single-product digital-video storefront built with Next.js (App Router), Tailwind, and Upstash Redis.
Public marketing page + bottom-sheet checkout + email-delivered private access + protected course page + PWA shell.

> **Launch status:** NOT production-ready. Crypto checkout (blunt.cash) and private video (Mux) are **planned, not implemented**. The current checkout button is intentionally disabled. See `production-transfer-audit.md` for the full assessment.

---

## 1. What you download

Download the single ZIP: **`chad-kermit-method-project-export.zip`**.

It contains everything needed to run and continue the project:

```
src/                         app code (pages, components, API routes, libs)
public/                      manifest, service worker, icons, offline page
archive/                     legacy proof-gallery UI (reference only, not built)
package.json                 dependencies + scripts
package-lock.json            exact dependency versions (use with `npm ci`)
tsconfig.json                TypeScript config
next.config.ts               Next.js config + security headers
tailwind.config.ts           Tailwind config
postcss.config.mjs           PostCSS config
next-env.d.ts                Next.js types
.gitignore                   ignore rules
.env.example                 environment variable template (no secrets)
README.md                    this file
production-transfer-audit.md full production/Mux/payment/migration audit
blunt-cash-integration-plan.md      payment integration plan
blunt-cash-implementation-spec.md   detailed payment code spec
blunt-cash-source-notes.md          payment docs notes
```

**Not included (on purpose):** `node_modules/`, `.next/`, any `.env` with real secrets, screenshots/preview tooling. You regenerate `node_modules` with `npm ci` and create your own `.env.local` from `.env.example`.

---

## 2. Tools you need first

| Tool | Why | Get it |
|---|---|---|
| Node.js (current LTS) | runs the app | https://nodejs.org |
| npm | installs dependencies (bundled with Node) | included with Node |
| A code editor | editing (VS Code etc.) | optional |
| Upstash Redis (or Vercel KV) | access-token storage | https://upstash.com |
| Git | version control | optional but recommended |

Check Node is installed:

```bash
node --version
npm --version
```

---

## 3. Install and run locally

```bash
# 1. unzip the download, then open a terminal inside the project folder
cd chad-kermit-method-project-export

# 2. install exact dependencies
npm ci

# 3. create your local env file from the template
cp .env.example .env.local
#    then edit .env.local and fill in the values you have

# 4. start the dev server
npm run dev
```

Open http://localhost:3000

The public homepage works without any environment variables. The access/course pages need Redis values in `.env.local`.

---

## 4. Validate the build

```bash
npm ci
./node_modules/.bin/tsc --noEmit    # type check
npm run build                        # production build
npm run start                        # run the production build locally
```

> Note: the `lint` script (`next lint`) is broken on Next 16 and must be replaced with an ESLint CLI script before using lint in CI. See the audit, issue P1.

---

## 5. Environment variables

Copy `.env.example` to `.env.local` and fill values. Summary:

**Needed now (existing features):**
- `KV_REST_API_URL`, `KV_REST_API_TOKEN` — Upstash/Vercel KV Redis
- `NEXT_PUBLIC_BASE_URL` — your site URL (e.g. http://localhost:3000 in dev)
- `EGGPLANT_METHOD_INTERNAL_SECRET_KEY` — bearer secret for the fulfillment endpoint
- `EGGPLANT_METHOD_GMAIL_USER`, `EGGPLANT_METHOD_GMAIL_APP_PASSWORD` — Gmail SMTP for access emails

**Needed later (not yet implemented):**
- `BLUNT_*` — crypto checkout (see `blunt-cash-integration-plan.md`)
- `MUX_*` — private video hosting (see `production-transfer-audit.md`)

Never commit real secrets. `.env*` is git-ignored except `.env.example`.

---

## 6. Deploy to production (Vercel)

1. Push the project to a Git repository.
2. Import it into Vercel.
3. Add environment variables in Vercel (Production and Preview separately).
4. Use **test** keys in Preview and **live** keys only in Production.
5. Mark secret values as Sensitive.
6. Set `NEXT_PUBLIC_BASE_URL` to your real HTTPS domain.
7. Deploy.

Full production checklist, rollback plan, Mux setup, and payment wiring are in `production-transfer-audit.md`.

---

## 7. What still has to be built before selling

- blunt.cash order + inline checkout + signed webhook + idempotent fulfillment
- Mux teaser + signed paid playback + entitlement gate
- order/entitlement ledger
- legal pages, refund/support/recovery flows
- final approved brand/creator/marketing copy and media assets

See `production-transfer-audit.md` sections 9–15 for the prioritized plan.
