# Screenshot index

Captures live in `frontend/public/demo-screenshots/`. The directory is
**gitignored** so heavy PNGs don't bloat the repo — drop the files locally
and link to them from the demo doc / submission writeups.

## Files (capture against the deployed Vercel URL)

| # | File | Page | What it proves |
|---|---|---|---|
| 1 | `01-landing.png` | `/` | Devnet badge in topbar, hero "Solana — devnet" copy, DisclaimerFooter visible. |
| 2 | `02-studio-create.png` | `/studio/create` | Solana wallet button, ContractNotConfigured copy hides Arbitrum, devnet badge. |
| 3 | `03-studio-create-wizard.png` | `/studio/create` (wizard) | Basics step rendered with chain-aware copy ("Solana — devnet" / SOL). |
| 4 | `04-create-tx-confirmed.png` | `/studio/create` post-deploy | TransactionState confirmed; explorer URL points at `explorer.solana.com/tx/<sig>?cluster=devnet`. |
| 5 | `05-join-preview.png` | `/join/<cid>` | UmbraMembershipCard "On-chain commitment fallback" + "Umbra v2 in progress" badge. |
| 6 | `06-preview-quota-exceeded.png` | `/api/content/<cid>` (network tab) | 403 response `{error:'preview_quota_exceeded', limit:2}` after 3rd distinct community. |
| 7 | `07-subscribe-tx.png` | `/join/<cid>/subscribe` | Wallet adapter modal, signing the `subscribe` ix on devnet. |
| 8 | `08-feed-unlocked.png` | `/app/<cid>/feed` | Active membership state, post bodies visible, preview-eligible post tagged. |
| 9 | `09-feed-locked-non-member.png` | `/app/<cid>/feed` (different wallet) | Locked-state for non-preview posts; only preview-eligible bodies render. |
| 10 | `10-studio-analytics.png` | `/studio/<cid>/analytics` | AggregateStatsCard with the 6 scalar fields and the "no individual data" disclosure. NO wallets visible. |
| 11 | `11-studio-content-toggle.png` | `/studio/<cid>/content` | PreviewToggle row per post; one toggle ON. |
| 12 | `12-account-ika.png` | `/account` | SignerCapabilitiesCard with the red/orange "PRE-ALPHA — NOT FOR REAL FUNDS" banner + capability matrix (`✓ pre-alpha` cells). |
| 13 | `13-account-multichain.png` | `/account` | MultichainAssetPanel placeholder values + MessageApprovalLifecycle (state: prepared). |
| 14 | `14-telegram-status.png` | Telegram client | Bot reply: `✅ <community> — active (expires <date>)`; **never** "tier" or "level". |

## Capture rules

- **Redact wallet addresses** in any capture that includes one — blur the
  middle 8+ chars. The deployer + treasury are public on devnet but we
  still don't paste them into screenshots.
- **Redact RPC URLs** if a custom Helius/Alchemy/QuickNode key is in the
  topbar / network tab.
- **Mask the Privy login email** if signed in with a personal account.
- **Console clean:** open DevTools and screenshot the Console tab on
  `/` — it should show zero red errors. Any warnings should be from
  wagmi peer-dep noise, never from SORTS code.

## Tooling

Recommended: macOS `Cmd+Shift+5` for PNG capture, then drag into
`frontend/public/demo-screenshots/`. The folder ships with a `.gitkeep`
placeholder so it exists pre-capture.

## What this index intentionally does NOT cover

- No screenshots of wallet recovery phrases.
- No screenshots of Render / Supabase / Privy admin consoles.
- No screenshots of mainnet anything.
