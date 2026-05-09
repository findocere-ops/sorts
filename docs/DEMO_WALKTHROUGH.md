# SORTS — Demo Walkthrough Guide (Beginner)

**Audience:** you, recording the demo video for the Colosseum submission.
**Time budget:** 90 minutes total — 45 min setup, 30 min walkthrough,
15 min recording.
**Outcome:** every privacy claim proven on screen, plus a working
local SORTS stack confirmed before you deploy anything public.

---

## What you're proving

The demo establishes seven privacy claims, each verifiable on devnet
or in code. The Cloak (Tier 1.3) claim is mainnet-only by design — see
step 7 for the honest narration script.

| # | Claim | Provable on devnet? | How |
|---|---|---|---|
| 1 | Aggregate-only creator analytics | ✅ Yes | Look at the analytics page; capture screenshot showing counters only, no wallet rows |
| 2 | No member enumeration via `getProgramAccounts` | ✅ Yes | Run `solana account` on Subscription PDA; bytes 33–65 are a commitment, not a wallet |
| 3 | Tier-level secrecy (Tier 1.1) | ✅ Yes | Same Subscription account; bytes 73–105 are `tier_commitment` hash, not a plaintext level |
| 4 | Subscriber pseudonymization (Tier 1.2) | ✅ Yes | Same account: byte 33 is `subscriber_commitment`, NOT subscriber pubkey |
| 5 | Devnet + pre-alpha disclosure | ✅ Yes | DisclaimerFooter visible site-wide; screenshot any page |
| 6 | Privy server-side auth on protected routes | ✅ Yes | `curl` a POST endpoint without bearer → 401 |
| 7 | Cloak payment rail (Tier 1.3) | ⚠️ Code only on devnet | Show `cloak_payment_sigs` slot all-zero on devnet, source-level dual-path branch in `subscribe.rs`, and the `CreatorPayrollWithdraw` "mainnet only" placeholder card |

---

## Step 0 — Prerequisites (15 min, one-time)

Run these **once** on the machine you'll use to record. If you've
already done one, skip it.

### 0.1 Install Node.js 20 + pnpm

macOS:
```bash
# Homebrew
brew install node@20
brew install pnpm
```

Linux:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm@10
```

Verify:
```bash
node -v   # must be v20.x
pnpm -v   # must be 10.x or higher
```

### 0.2 Install Rust + Solana CLI

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Solana CLI 3.1 or newer
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
# Follow the prompt to add the install dir to your PATH.

# cargo build-sbf (used by SORTS' program build)
cargo install --git https://github.com/anza-xyz/cargo-build-sbf cargo-build-sbf || true
# (often bundled with the Solana CLI; the line above is a no-op if already present)
```

Verify:
```bash
rustc --version              # 1.89+ ok
solana --version             # solana-cli 3.x
solana-test-validator --version
```

### 0.3 Create a wallet for the demo

```bash
solana-keygen new --outfile ~/.config/solana/demo.json --no-bip39-passphrase --force
solana config set --keypair ~/.config/solana/demo.json
solana config set --url devnet
solana airdrop 2 $(solana-keygen pubkey ~/.config/solana/demo.json)
solana balance
```

Expected: `2 SOL` after a few seconds. If the faucet rate-limits, wait
60s and retry.

### 0.4 Get a Privy app id

1. Sign in at https://dashboard.privy.io.
2. Create a new app. Name: `SORTS demo`.
3. From the app dashboard, copy:
   - **App ID** (looks like `clxxxxxxxxxxxxxxxxxxxxxxxxx`).
   - **App Secret** (server-side, keep private).
4. Under **Settings → Login methods**, enable `Email` and `Wallet`.
5. Under **Settings → Networks**, add `Solana devnet`. Save.

Hold these two values aside; you'll paste them in step 2.

### 0.5 (Optional) Telegram bot token

Skip if you don't plan to demo Telegram. Otherwise:

1. Open Telegram, message `@BotFather`, send `/newbot`.
2. Follow prompts. Save the token (looks like `123456:AABBCCDD…`).

---

## Step 1 — Get the code (3 min)

```bash
cd ~
git clone https://github.com/findocere-ops/sorts.git
cd sorts
git checkout claude/clever-bhaskara-541ed3   # the Tier-1.3 PR branch
git config core.hooksPath .githooks          # one-time hook activation
```

Verify:
```bash
git log --oneline -3
# expected first line: e5df74c Tier 1.3 Cloak SDK integration ...
```

---

## Step 2 — Configure environment files (5 min)

> Important: never commit `.env` or `.env.local`. They are gitignored.

### 2.1 Frontend

```bash
cp frontend/.env.example frontend/.env.local
```

Open `frontend/.env.local` in your editor and fill the four required
fields. Leave `NEXT_PUBLIC_ENABLE_CLOAK_MAINNET=false` (Cloak path
stays dormant on devnet by design).

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_PRIVY_APP_ID=<paste your Privy App ID here>
NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_PROGRAM_ID=AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_CLOAK_MAINNET=false
```

### 2.2 Backend

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill:

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
DATABASE_PATH=./data/sorts.db

SOLANA_DEVNET_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV

PRIVY_APP_ID=<paste your Privy App ID>
PRIVY_APP_SECRET=<paste your Privy App Secret>

TELEGRAM_BOT_TOKEN=<optional, paste from @BotFather or leave empty>

ENABLE_CLOAK_MAINNET=false
```

Save and close.

---

## Step 3 — Install dependencies (5 min)

```bash
cd ~/sorts
pnpm install --frozen-lockfile
```

Expected: ~15s wall time, no version-resolution errors. If `pnpm`
warns about `better-sqlite3` failing native build:

```bash
pnpm rebuild better-sqlite3
```

If that still fails, you're on a Node version newer than what
`better-sqlite3` has prebuilds for — install Node 20 LTS specifically
(see step 0.1) and retry.

---

## Step 4 — Verify the local stack runs (10 min)

This step is the "make sure SORTS runs before deploying" check. If
**any** verification below fails, stop and fix before recording.

### 4.1 Run the program tests

```bash
cd programs/sorts-community
cargo test
```

Expected:
```
running 7 tests
test logic::tests::fee_split_handles_round_down ... ok
... (7 passing)
test result: ok. 7 passed; ...

running 9 tests
test t1_initialize_community_with_3_tiers_validates_and_stores ... ok
... (t9_cloak_payment_dual_path included)
test result: ok. 9 passed; ...
```

### 4.2 Run the backend build + tests

```bash
cd ~/sorts
pnpm --filter @sorts/backend build
pnpm --filter @sorts/backend test
```

Expected:
```
Test Suites: 12 passed, 12 total
Tests:       78 passed, 78 total
```

### 4.3 Run the frontend build

```bash
pnpm --filter @sorts/frontend build
```

Expected: `✓ Compiled successfully` near the bottom; bundle size table.
There will be one MetaMask SDK transitive warning that comes from
wagmi/Privy — ignore.

### 4.4 Start the dev servers

In **terminal A**:
```bash
cd ~/sorts/backend
pnpm dev
```
Wait for: `[api] Sorts backend running on :3001` and `[bot] Telegram
bot started` (or warning if no token).

In **terminal B**:
```bash
cd ~/sorts/frontend
pnpm dev
```
Wait for: `Ready in <5s` and `▲ http://localhost:3000`.

Open http://localhost:3000 in Chrome (or Chromium-based) — landing
page renders with the cyan/orange brand, "Solana devnet launch sprint"
pill, and DisclaimerFooter at the bottom.

### 4.5 Smoke-test the privacy invariants

In **terminal C**:
```bash
cd ~/sorts/programs/sorts-community
ts-node ../../scripts/smoke-solana-flow.ts 2>&1 | tee /tmp/sorts-smoke.log
```

If `scripts/smoke-solana-flow.ts` is missing (depends on the branch),
run a manual replacement:

```bash
solana program show AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV \
  --url devnet
```

Expected output includes `Last Deployed In Slot:` and a recent
upgrade tx — confirms the v3 program is alive on devnet.

If any 4.x check fails, do NOT proceed to recording. Reread
[INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) for the closest matching
scenario.

---

## Step 5 — Connect a wallet to the running app (5 min)

1. Install the Phantom wallet browser extension if you haven't:
   https://phantom.app
2. In Phantom: **Settings → Developer Settings → Change Network →
   Devnet**.
3. Phantom now lists your wallet on devnet. Airdrop 2 SOL there too:
   ```bash
   solana airdrop 2 <Phantom_wallet_pubkey> --url devnet
   ```
   (You can see your Phantom pubkey in the wallet UI; copy it.)
4. Back at http://localhost:3000, click **Sign in** in the top-right.
   Privy modal opens.
5. Choose **Continue with Wallet → Solana → Phantom**. Approve in
   Phantom.
6. Modal closes. You're signed in.

Take a screenshot of the landing page **after sign-in** showing your
wallet address abbreviation in the topbar. This is **shot 1**.

---

## Step 6 — Walk through the demo flow with proof captures (30 min)

The total demo video should land at ~3 minutes. The recording sequence
below produces **9 screenshots / 3 explorer links / 1 narration block**
that you'll later edit into the video per
[DEMO_RECORDING_PLAN.md](DEMO_RECORDING_PLAN.md).

> **Tip:** keep a `recordings/` folder. Save each screenshot as
> `01-landing.png`, `02-create.png`, etc. Save explorer URLs in a
> `recordings/links.md` file as you go.

### 6.1 Create a community (Privacy claim 1, 5)

1. From the landing page, click **Create a community** (hero CTA).
2. The wizard opens at `/studio/create`. Fill:
   - Name: `Alpha Signals`
   - Symbol: `ALFA`
   - Tier 1: 0.05 SOL · 30 days
   - Tier 2: 0.25 SOL · 30 days
   - Tier 3: 1.00 SOL · 30 days
3. Click **Create**. Phantom prompts twice (first `signMessage` for
   the Tier-1.2 nonce derivation, then `signTransaction` for the
   actual ix). Approve both.
4. Wait 5–10s for confirmation.

**Screenshot 2 (`02-create-confirmed.png`):** the success state with
the new community PDA address visible.

**Explorer link 1:** copy the create-tx signature and open
`https://explorer.solana.com/tx/<sig>?cluster=devnet`. Save the URL.

### 6.2 Subscribe from a second wallet (Privacy claims 2, 3, 4)

> Use a fresh wallet for the subscriber side. In Phantom: **+ Add /
> Connect Wallet → Generate New Wallet → name it "Subscriber".**
> Switch to it, then airdrop 2 SOL via:
>
> ```bash
> solana airdrop 2 <Subscriber_pubkey> --url devnet
> ```

1. Click your wallet badge in the topbar → **Disconnect**. Sign in
   again with the Subscriber wallet.
2. Navigate to `/role`, then your community appears in the list (if
   not, paste the URL `/join/<community-pda>` directly).
3. Click **Preview**. The first preview is allowed by the quota.
4. Click **Subscribe → Tier 1**. Phantom prompts twice (signMessage
   for the nonce, signTransaction for the subscribe ix). Approve.
5. Wait for confirmation. UI shows "Subscription active".

**Screenshot 3 (`03-subscribe-confirmed.png`):** the post-subscribe
page showing membership active.

**Explorer link 2:** subscribe-tx signature → save URL.

### 6.3 Prove privacy invariants on the on-chain account (Privacy claims 2, 3, 4, 7-code)

Now we directly prove the privacy claims by reading the Subscription
account bytes. This is the most credible 30 seconds of the demo.

In a terminal:

```bash
# Derive the Subscription PDA. The bash version below assumes you
# saved the community PDA from step 6.1 as $COMMUNITY and the
# subscriber Phantom pubkey as $SUBSCRIBER.

# 1. Compute the subscriber_commitment client-side (matches what the
#    program stores). The frontend already did this in the browser;
#    we recompute here for verification.
node -e '
const { PublicKey } = require("@solana/web3.js");
const community = new PublicKey(process.argv[1]);
const subscriber = new PublicKey(process.argv[2]);
const programId = new PublicKey("AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV");

// (in the real flow, the nonce comes from the wallet signature; for
// inspection we just print the on-chain account directly)
console.log("Community:", community.toBase58());
console.log("Subscriber:", subscriber.toBase58());
' "$COMMUNITY" "$SUBSCRIBER"
```

Now fetch the Subscription account directly. Use the
`getProgramAccounts` filter to enumerate ALL Subscription accounts and
verify nothing leaks:

```bash
solana account --url devnet --output json $(node -e '
const { PublicKey } = require("@solana/web3.js");
// Use the actual Subscription PDA address from your subscribe tx (it
// appears as a `Wrote` line in the explorer view of the subscribe tx).
console.log(process.argv[1]);
' "<Subscription_PDA_from_explorer>")
```

The output JSON has a `data: [base64, "base64"]` field. Decode and
inspect the byte layout:

```bash
echo "<the base64 string>" | base64 -d | xxd | head -15
```

Read the output:

| Byte offset | Hex value | Field | What it proves |
|---|---|---|---|
| 0 | `03` | discriminator | This is a Subscription |
| 1–32 | (32 bytes) | community pubkey | Confirms which community |
| 33–64 | (32 bytes — looks random!) | **subscriber_commitment** | Tier 1.2: NOT the subscriber wallet |
| 65–72 | (8 bytes, little-endian i64) | expiry_ts | Subscription end |
| 73–104 | (32 bytes — looks random!) | **tier_commitment** | Tier 1.1: NOT a plaintext level |
| 105–136 | (32 bytes) | salt_pubkey | Public salt (not secret) |
| 137–200 | (64 zero bytes) | **cloak_payment_sigs** | Tier 1.3: ALL-ZERO on devnet (transparent path) |
| 201 | (1 byte) | bump |

**Screenshot 4 (`04-subscription-bytes.png`):** the terminal showing
the `xxd` output with bytes 33–64 (subscriber_commitment) and 137–200
(all-zero cloak slot) clearly visible.

This single screenshot proves Tier 1.2 + Tier 1.3-on-devnet
simultaneously.

### 6.4 Confirm no member-list endpoint exists (Privacy claim 2)

```bash
curl -s http://localhost:3001/api/communities/<community-pda>/members
# expected: 404 Not Found
curl -s http://localhost:3001/api/communities/<community-pda>/subscribers
# expected: 404 Not Found
curl -s "http://localhost:3001/api/analytics/community/<community-pda>" | jq
# expected: { totalMembers: 1, activeMemberships: 1, ... } — counters only
```

**Screenshot 5 (`05-no-member-endpoint.png`):** the terminal showing
the two 404s and the analytics response side by side.

### 6.5 Try a third community preview (preview quota)

> Run on the subscriber wallet, still signed in.

1. Open the discover route `/role` again.
2. Find a second community (you may need to create one with the
   creator wallet first; or pre-seed via `pnpm --filter @sorts/backend
   run seed:devnet-demo`).
3. Click **Preview**. Allowed.
4. Find a third community. Click **Preview**.

Expected: a banner / error toast `Preview quota exceeded — subscribe
to one of these communities to keep browsing`.

**Screenshot 6 (`06-quota-blocked.png`):** the third preview rejection.

### 6.6 Check the creator's analytics dashboard (Privacy claim 1)

1. Disconnect, sign in with the **Creator** wallet (the one that
   made `Alpha Signals`).
2. Go to `/studio/<community-pda>/analytics`.
3. The page loads with three counter rows + the
   `CreatorPayrollWithdraw` card at the bottom.

**Screenshot 7 (`07-creator-analytics.png`):** the full page. Note:
**no wallet addresses, no per-member rows, no tier ownership lists.**
Just totals.

### 6.7 Capture the Cloak payroll placeholder (Privacy claim 7-code)

The same analytics page already has the
`CreatorPayrollWithdraw` widget. On devnet (flag off), it renders the
labeled "Cloak payroll · mainnet only" disabled card.

**Screenshot 8 (`08-cloak-payroll-placeholder.png`):** zoom on the
payroll widget showing the orange `Cloak payroll · mainnet only`
badge + the explanatory copy: *"Private payout via Cloak activates on
mainnet. The current devnet build uses transparent system_program::
transfer for payments."*

### 6.8 Capture the source-level Cloak dual-path (Privacy claim 7-code)

Open `programs/sorts-community/src/instructions/subscribe.rs` in your
editor. Highlight the dual-path block (around lines 78–110):

```rust
let cloak_path_active = !is_zero_64(&cloak_payment_sigs);
if !cloak_path_active {
    let (fee, creator_share) = split_protocol_fee(price)?;
    if fee > 0 {
        self.system_program
            .transfer(&self.subscriber, &self.protocol_treasury, fee)
            .invoke()?;
    }
    if creator_share > 0 {
        self.system_program
            .transfer(&self.subscriber, &self.creator, creator_share)
            .invoke()?;
    }
}
```

**Screenshot 9 (`09-subscribe-rs-dual-path.png`):** the editor showing
this exact block. Crop the path/filename in the title bar so it's
visible.

### 6.9 (Optional) Telegram bot status

If you set `TELEGRAM_BOT_TOKEN` in step 0.5:

1. From a Phantom-linked wallet, run `/link` from the SORTS UI to
   link your Telegram → wallet.
2. In Telegram: `@your_bot` → `/status`.
3. The bot replies with `active (expires <date>)` or
   `expired Renew: <url>` — **never** the tier number.

**Screenshot 10 (`10-telegram-status.png`):** the bot reply showing
no tier and no community-member-count.

---

## Step 7 — The Cloak narration segment (~25s, mandatory)

Per [DEMO_RECORDING_PLAN.md](DEMO_RECORDING_PLAN.md) "Cloak narration
segment", the recorded video must include a labeled walkthrough of
the Cloak code path WITHOUT firing it. This is the honesty contract.

### Suggested script

> "On devnet, payments use a transparent `system_program::transfer`.
> The dual-path code in `programs/sorts-community/src/instructions/
> subscribe.rs` switches automatically when we activate Cloak on
> mainnet — the Subscription account already carries a 64-byte
> `cloak_payment_sigs` slot, the frontend already orchestrates Cloak's
> `transact` and `partialWithdraw`, and the creator payroll widget on
> the analytics page is wired. This devnet recording does not show
> Cloak firing. Mainnet activation is gated behind a feature flag and
> requires a backend verifier service that we've documented as the
> next-sprint commitment."

### Visual aid during this narration

Split-screen, recorded as a single 25-second clip:

- **Left half:** screenshot 9 (`09-subscribe-rs-dual-path.png`).
- **Right half:** screenshot 8 (`08-cloak-payroll-placeholder.png`).

Place the labeled "no real funds" disclaimer footer along the bottom
of both halves so it's visible throughout the segment.

### What the narration must NOT do

- ❌ Claim "the demo uses Cloak" or "this payment is private now."
- ❌ Show the Cloak relayer URL (`https://api.cloak.ag`) on screen.
- ❌ Show non-zero `cloak_payment_sigs` on any explorer view.

This is the same posture as the IKA pre-alpha card already in the
build.

---

## Step 8 — Pre-deploy verification checklist (15 min)

Run this BEFORE you push the code to a public host (Vercel / Render /
Supabase). If any item fails, fix before deploying — it's vastly
cheaper to find a bug here than after a public URL is live.

### 8.1 Code & tests

```bash
cd ~/sorts

# All builds + tests
pnpm install --frozen-lockfile           # lockfile must be unchanged
pnpm --filter @sorts/shared build
pnpm --filter @sorts/backend build
pnpm --filter @sorts/backend test
pnpm --filter @sorts/frontend build

cd programs/sorts-community
cargo test                                # 7 unit + 9 integration

cd ~/sorts/contracts
pnpm compile                              # Phase-1 Arbitrum legacy
```

Every command must exit with code 0. No skipped tests.

### 8.2 Privacy-grep clean

```bash
cd ~/sorts

# 1. No plaintext subscriber on Subscription
rg "pub subscriber:" programs/sorts-community/src/state.rs   # must be empty

# 2. No iterable subscriber lists anywhere
rg "Vec<Pubkey>|Vec<Address>|Vec<\[u8; 32\]>" \
   programs/sorts-community/src \
   backend/src                                              # must be empty

# 3. Backend analytics returns no wallet-shaped strings
rg "0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44}" \
   backend/src/api/routes/analytics.ts                      # only the doc-comments / comments
```

### 8.3 Pre-commit hook works

```bash
git config --get core.hooksPath          # must print: .githooks
ls -l .githooks/pre-commit                # must be -rwxr-xr-x
```

If `core.hooksPath` is empty, run `git config core.hooksPath
.githooks` once.

### 8.4 No real env values in repo

```bash
git diff --cached --name-only | grep -E "\\.env(\$|\\.[^e])" \
  && echo "DANGER: real .env staged" || echo "OK: only .env.example tracked"

git log -p HEAD~3..HEAD -- '.env*' | head     # should show only example files
```

### 8.5 Devnet program is alive and matches local artifact

```bash
solana program show AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV \
  --url devnet | grep "Data Length"
# Expected: Data Length: 27360 bytes (matches local .so file)

ls -l programs/sorts-community/target/deploy/sorts_community.so
# Expected: file size near the deployed bytecode size
```

### 8.6 Devnet deployer wallet has buffer SOL for hot-fixes

```bash
solana balance --url devnet
# Expected: ≥ 0.5 SOL
# (per INCIDENT_RESPONSE.md S3 cut-off, you need this to redeploy
# under pressure if a critical bug surfaces)
```

### 8.7 Documentation honest

Open these files in your browser / editor and read top to bottom; each
must read true today:

- `README.md` § "Current Demo Status"
- `docs/PRIVACY_REVIEW.md` § "Run — 2026-05-07 (v3)"
- `docs/SUBMISSION_RISKS.md`
- `docs/DEMO_RECORDING_PLAN.md`

If any sentence references a feature that's no longer there, fix it.
Documentation drift is the easiest privacy-claim regression to miss.

### 8.8 Submission portal access

Confirmed from at least two networks (or one network + mobile
hotspot) within the last 24 hours: you can log in to the Colosseum
portal, the form draft is saved, and the linked URLs (when filled)
return 200 in incognito.

---

## Step 9 — Recording checklist (15 min)

You're ready to record once steps 0–8 are complete. The actual
recording session should take ~30 minutes for a 3-minute video
(multiple takes, one or two retries acceptable per
INCIDENT_RESPONSE.md S1 scenario B).

### Equipment

- Microphone you've used before (don't change setups now).
- QuickTime / OBS Studio for screen capture (1280×800 window or
  full-screen 1080p).
- Chromium-based browser (Chrome/Brave) at 100% scale, DevTools closed.
- Phantom wallet ready, two wallets switched (creator + subscriber).
- Editor open at `programs/sorts-community/src/instructions/
  subscribe.rs` for the dual-path screenshot.

### Recording sequence (~3 minutes total)

1. **0:00–0:15** — Hook. "SORTS — private subscription rails for
   paid communities on Solana devnet."
2. **0:15–0:45** — Creator: open studio → create `Alpha Signals` →
   confirm tx. Cut to Solana Explorer showing the create-tx.
3. **0:45–1:30** — Subscriber: sign in → preview 2 communities → 3rd
   blocked → subscribe to one. Phantom prompts visible.
4. **1:30–2:00** — Gated content unlocks. Cut to creator dashboard
   (screenshot 7) showing only counters.
5. **2:00–2:30** — On-chain proof: terminal showing the Subscription
   bytes (screenshot 4) with byte-offset overlay highlighting
   `subscriber_commitment` (Tier 1.2) and `cloak_payment_sigs` slot
   (Tier 1.3).
6. **2:30–2:55** — Cloak narration segment (step 7 of this guide):
   split-screen of `subscribe.rs` dual-path code + payroll placeholder
   card. Read the script.
7. **2:55–3:00** — Close. "Private subscription rails. Devnet
   pre-alpha. Code at github.com/findocere-ops/sorts."

### After recording

1. Watch the video once at 1× speed without pausing. Note any frame
   that contradicts a written claim.
2. Watch a second time looking for visible secrets (a wallet's full
   address visible end-to-end, RPC URL with API keys, the Privy app
   secret in any DevTools panel). Re-record if anything sensitive
   leaks.
3. Upload to Loom (unlisted) or YouTube (unlisted). Save the URL in
   `docs/SOLANA_PHASE2_DEMO.md`.

---

## Step 10 — When you're ready to deploy

Only **after** every check in step 8 has passed and the demo video is
recorded:

1. Provision Supabase (free tier) → save `DATABASE_URL` somewhere
   secure (1Password, etc).
2. Provision Render → set env from `backend/.env.example` plus
   `DATABASE_URL`. Run `pnpm --filter @sorts/backend migrate` once.
3. Provision Vercel → import the repo, set env from
   `frontend/.env.example` populated values, deploy.
4. Smoke-test the live URL by repeating step 6 against the public
   URL instead of `localhost`. If the live flow diverges from the
   local recording, do NOT swap the recording — investigate and fix.

`docs/INFRASTRUCTURE.md` has the longer form of these steps with the
specific Render and Supabase settings used.

---

## What goes wrong and what to do

| Symptom | Most likely cause | Fix |
|---|---|---|
| `pnpm install` resolves a different lockfile | Wrong pnpm version | `npm install -g pnpm@10` |
| Frontend dev server reloads forever | Stale `.next` cache | `rm -rf frontend/.next && pnpm --filter @sorts/frontend dev` |
| Phantom prompts only once on subscribe instead of twice | Wallet adapter doesn't support `signMessage` | Update Phantom; or fall back to a different supported wallet (Solflare) |
| Subscription account doesn't decode | You're pointed at the v1 or v2 program | Confirm `SOLANA_PROGRAM_ID=AEp6V…BkFV` in env files; v3 deploy was 2026-05-07 |
| `getProgramAccounts` returns rate-limit error | Public devnet RPC throttling | Switch to Helius free tier; set `NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL` to the Helius URL |
| Privy login hangs | App id wrong, callback URL not set | Re-check Privy dashboard → Settings → URLs; `http://localhost:3000` must be allowed |
| Backend test goes red on `analytics-no-leak` | Known flake (PG-015) | Re-run; if persistent see `INCIDENT_RESPONSE.md` |
| Demo video shows full wallet address | You forgot to redact | Re-record OR blur in post; never publish a full pubkey + 2FA-related metadata side by side |

---

## Where to ask for help

In order of preference:

1. **`docs/INCIDENT_RESPONSE.md`** — covers eight scenarios with
   pre-decided answers. Most "what do I do now" questions are answered
   here.
2. **`docs/SUBMISSION_RISKS.md`** — if you're confused about WHY a
   feature is dormant, this explains the trade-off and the v2 plan.
3. **`docs/PRIVACY_REVIEW.md`** — if you want to understand what
   "Tier 1.x" means and which file enforces which invariant.
4. **The PR description on GitHub** — the latest scope summary lives
   there.
5. **As a last resort**, add a question to a new
   `docs/OPEN_QUESTIONS.md` file (create it). Avoid editing existing
   docs in submission week unless they are factually wrong.

---

## TL;DR — One-page sequence

```text
PREP (15 min, once)
  brew install node@20 pnpm  (or platform equivalent)
  curl https://sh.rustup.rs | sh
  curl -sSfL https://release.anza.xyz/stable/install | sh
  solana-keygen new --outfile ~/.config/solana/demo.json
  solana airdrop 2 --url devnet
  Get Privy app id at dashboard.privy.io

CODE (3 min, once)
  git clone https://github.com/findocere-ops/sorts.git
  cd sorts
  git checkout claude/clever-bhaskara-541ed3
  git config core.hooksPath .githooks

ENV (5 min, once)
  cp frontend/.env.example frontend/.env.local      → fill PRIVY_APP_ID
  cp backend/.env.example backend/.env              → fill PRIVY_APP_ID + SECRET

INSTALL (5 min)
  pnpm install --frozen-lockfile

VERIFY LOCAL (10 min)
  cargo test -p sorts-community
  pnpm --filter @sorts/backend build && pnpm --filter @sorts/backend test
  pnpm --filter @sorts/frontend build

RUN (continuous)
  Terminal A:  cd backend && pnpm dev
  Terminal B:  cd frontend && pnpm dev
  Browser:     http://localhost:3000

WALK + CAPTURE (30 min)
  Wallet 1 (creator):  create Alpha Signals → screenshots 1-2
  Wallet 2 (subscriber): subscribe → screenshots 3-5
  Try 3rd preview → screenshot 6 (quota blocked)
  Creator: analytics page → screenshots 7-8
  Editor:  open subscribe.rs → screenshot 9
  Telegram (optional): /status → screenshot 10

PRE-DEPLOY CHECK (15 min)
  Run every test command above; all must pass
  rg "pub subscriber:" programs/sorts-community/src/state.rs   (empty)
  solana balance --url devnet                                   (≥ 0.5 SOL)
  README + PRIVACY_REVIEW + SUBMISSION_RISKS read true

RECORD (30 min, last)
  3-minute video per DEMO_RECORDING_PLAN.md
  Upload Loom unlisted; save URL in SOLANA_PHASE2_DEMO.md

DEPLOY (90 min, only after the above all green)
  Supabase → Render → Vercel
  Smoke the live URL same way; do NOT swap the recording
```

If you stop reading any time during the 90-minute window, this
TL;DR is enough to resume from where you left off.
