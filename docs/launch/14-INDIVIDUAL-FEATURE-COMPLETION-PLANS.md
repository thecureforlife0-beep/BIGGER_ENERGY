# 14-INDIVIDUAL-FEATURE-COMPLETION-PLANS: BIGGER_ENERGY

## 1. Actionable Pre-Launch Feature Plans

### FEAT-MUX-01: Fulfillment Video Upload Completion
- **Owner:** Founder / Operator
- **Target:** Mux Asset `xVK3HNBd01SclFfWt1tWPHOtamAolsIwssWDJmWzYdt00`
- **Action:**
  1. Keep browser tab open until `FULL_VIDEO_FULLFILLMENT` reaches 100% and displays "Ready".
  2. Copy the resulting **Signed Playback ID**.
  3. Generate Mux Signing Key pair in Mux Dashboard: **Settings** -> **Signing Keys** -> **Generate New Key**.
  4. Inject `MUX_PLAYBACK_ID`, `MUX_SIGNING_KEY_ID`, and `MUX_PRIVATE_KEY` into Vercel Project Settings.
- **Verification:** Run `curl https://your-domain.vercel.app/api/media/lesson` to verify RS256 token signing.

### FEAT-GIT-02: New GitHub Remote Synchronization
- **Owner:** Operator
- **Target:** `https://github.com/thecureforlife0-beep/BIGGER_ENERGY.git`
- **Action:**
  1. Either invite `Ian-Leakey-G0At` as a collaborator in repository settings OR clear cached credentials with `cmdkey /delete:git:https://github.com`.
  2. Run `git push -u origin main`.
- **Verification:** Verify GitHub repository displays all committed files, documentation, and source code.

### FEAT-VERCEL-03: Production Deployment Connection
- **Owner:** Operator
- **Target:** Vercel Dashboard
- **Action:**
  1. Select "Import Git Repository" and pick `thecureforlife0-beep/BIGGER_ENERGY`.
  2. Paste all environment variables from `docs/launch/09-PRODUCTION-AND-DEPLOYMENT-TRUTH.md`.
  3. Deploy.
- **Verification:** Execute production smoke test against live deployment.
