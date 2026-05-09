# Prompt for claude design — SORTS marketing motion graphic

A self-contained prompt for producing the upper-funnel marketing video.
Paste this entire document into claude design (or any equivalent
generative video tool) along with the repo path. The brand spec,
storyboard, voice, motion language, and output specs are all here —
the tool should not need to ask follow-up questions.

This video is **not** the operator-runbook screen-recording (that one
lives in `docs/SOLANA_PHASE2_DEMO.md`, target 2:45). This is the
**awareness-stage motion graphic** — 60-90 seconds, type-driven,
editorial, brand-locked.

---

## 1. What we're producing

A 60-90 second motion graphic that:

- Communicates the SORTS pitch in under 90 seconds without a wallet,
  without a dashboard screen-recording, and without a person
  speaking on camera.
- Reads as the same brand as the website (per
  `docs/UX_DESIGN_BRIEF.md` — Direction A "Editorial workstation").
- Survives a paste into a Twitter / LinkedIn share without looking
  like a generic AI-generated motion-graphic template.
- Ends on one CTA: visit the site, see the demo.

Three output cuts required:

| Aspect | Resolution | Use |
|---|---|---|
| 16:9 | 1920×1080 | YouTube, embeds, demo-day projector |
| 9:16 | 1080×1920 | Twitter/X video, Instagram Reels, TikTok |
| 1:1  | 1080×1080 | LinkedIn, Twitter timeline |

All three from the same master comp — recompose the 16:9 frames into
9:16 + 1:1 by cropping with safe zones (per Section 8 below). No
re-narration, no re-typesetting between cuts.

---

## 2. Project context (brief; full context in repo)

SORTS is **private subscription rails for paid communities on Solana
devnet**. Creators sell recurring access to gated content. Subscribers
prove membership without leaking a public member graph. The product is
privacy-first by construction:

- Aggregate-only creator dashboard (no member roster, ever)
- On-chain commitment scheme on the Subscription account (no
  plaintext tier column)
- Anonymous preview path (visitors can read creator-marked posts
  without connecting a wallet)
- Telegram delivery for gated access without exposing identity

**Honesty calibration (load-bearing):** the build is devnet only.
Umbra hidden-state and IKA dWallet integrations are pre-alpha; the
website surfaces this honestly via badges and disclaimers. The video
must mirror that calibration — no overclaiming, no production-grade
privacy promises.

**Voice the video must carry:**

- Calm, not loud
- Calibrated, not aspirational
- Architectural, not decorative
- Confident in restraint

---

## 3. Brand lock — must match `docs/UX_DESIGN_BRIEF.md`

The video shares the website's brand spec verbatim. If anything in
this section conflicts with `UX_DESIGN_BRIEF.md`, the design brief
wins.

### 3.1 Color palette (single source of truth)

| Token | Hex | Used for |
|---|---|---|
| `--ink-1` | `#0B0F14` | Frame background |
| `--ink-2` | `#10161D` | Secondary surface (cards, panels) |
| `--ink-3` | `#181F27` | Tertiary surface |
| `--paper-1` | `#E8EAEC` | Primary type |
| `--paper-2` | `#A8AFB7` | Secondary type |
| `--paper-3` | `#6E7680` | Captions, dates, subtle labels |
| `--accent` | `#5BD9C9` | **Single accent.** Use sparingly — at most twice per frame. |
| `--warn` | `#D9A85B` | Pre-alpha + devnet (warm gold, NOT neon orange) |
| `--success` | `#7CC992` | Confirmed / live (sage, NOT Slack green) |
| `--danger` | `#E5707A` | Error / leaking surfaces (coral, NOT neon red) |

**Forbidden:** any color outside this list. No neon cyan, no purple,
no electric blue, no magenta. The current website's `#2DE8E0`
electric-cyan is **deprecated** — do not use it in the video.

### 3.2 Typography (locked)

- **Display + body:** Inter Tight at -0.02em letter-spacing for sizes
  ≥32px. Inter at 0em for body sizes.
- **Editorial / quote:** Tiempos Text or Source Serif 4 for the
  occasional pull-quote.
- **Mono:** JetBrains Mono Light. Used **only** for on-chain
  identifiers (program ID, hashes, addresses), never for UI labels.

Type sizes used in the video — pick from this set, no in-betweens:

```
display  64-88px  -0.02em  600
h1       40-48px  -0.015em 600
h2       28-32px  -0.01em  600
body     20-24px  0        400
caption  14-16px  0.04em   500 uppercase  (small caps eyebrows)
mono     16-20px  0        400 monospace
```

**Forbidden:** outlined / inline / 3D / chrome / drop-shadow type.
Type lays flat on the frame.

### 3.3 Forbidden visual patterns

These are the same anti-AI-slop rules from `UX_DESIGN_BRIEF.md`,
extended for video:

- **No glow rings, no neon outlines.** No `box-shadow` equivalents.
- **No glassmorphism.** No frosted-blur stacks behind type.
- **No gradient fills** on chrome, on type, on backgrounds. Solid
  colors only. (Exception: a single 1px hairline rule may animate in
  with a fade — that's a stroke-dashoffset, not a gradient.)
- **No kinetic-typography swoosh.** Type does not fly in from
  off-screen on rotation, scale-up-and-bounce, or wave-deform.
- **No particle effects, no bokeh, no animated noise overlays.**
- **No 3D logo reveal.** No camera flythrough, no extruded text,
  no isometric "data city" visualization.
- **No HUD-style overlays.** No targeting reticles, no scanning
  lines, no terminal glitch effects.
- **No countdown timers, no spinning loader rings.**
- **No abstract "data" cube/sphere/network-graph visualizations.**
- **No music drop or big crescendo.** No EDM. No epic trailer
  whoosh. Audio is sparse (Section 7).
- **No drone footage, no city skyline, no stock business b-roll.**
- **No human faces** (we are not pretending to have a team intro
  reel).

### 3.4 Required visual patterns

- **Hairline rules.** 1px lines (#1C2530) animate in via
  stroke-dashoffset over 240-360ms. Used to divide sections of the
  frame.
- **Small-caps eyebrows.** `0.04em` letter-spacing, uppercase,
  `--paper-3` color, 14-16px. Used as section labels.
- **Type sets, not type animates.** Letters appear character-by-
  character at 30ms/char or fade-in as a complete block. They do
  not rotate, scale, or skew.
- **Cursor-style accent reveal.** A 2px tall, 12px wide accent bar
  (`--accent` color) writes-on alongside type to mark active focus.
  Reads like a typing cursor, not a highlighter.
- **Tabular figures, mono digits.** Numbers count up using
  JetBrains Mono Light, not the body type.

---

## 4. Storyboard (target run-time 75 seconds)

Six scenes, each 8-15 seconds. Frame numbering matches the
`docs/SCREENSHOT_INDEX.md` capture rules — no real wallet addresses,
no real RPC URLs in any frame.

The video is silent-or-minimal-narration. Voiceover is **optional**.
If a narrator is used, see Section 6 for the script. Default
recommendation: ship the type-only version first, add VO only if
post-edit testing shows the silent version reads as confusing.

### Scene 1 — Cold open (0:00–0:10)

**Frame:** Black `--ink-1` background, full-bleed. A single hairline
rule animates in horizontally across the middle of the frame
(stroke-dashoffset, 360ms ease-out). Above the rule: small-caps
eyebrow `PRIVATE SUBSCRIPTION RAILS` in `--paper-3`. Below the rule,
delayed by 200ms: display-size headline `For paid communities on
Solana.` in `--paper-1`.

**Motion:**
- 0:00 — black frame, no audio
- 0:00.4 — hairline rule writes on
- 0:00.8 — eyebrow fades in (20% opacity → 100%, 240ms)
- 0:01.2 — headline characters appear at 30ms/char (40 chars × 30ms
  = 1.2s through 0:02.4)
- 0:02.4–0:08 — frame holds, only ambient audio
- 0:08–0:10 — frame begins to dissolve toward Scene 2 (1.5s
  cross-fade)

**Audio:** ambient pad fades in at 0:00.4 alongside the rule. Single
mechanical click on rule reveal. No music yet.

**No CTA, no logo, no badge in this scene.** The first 10 seconds
build attention through restraint.

### Scene 2 — The leak (0:10–0:25)

**Frame:** Two columns, 50/50 split. Vertical hairline rule down
the middle.

- **Left column** small-caps `EVERY OTHER PLATFORM`. Below: a
  visualization of a member roster — a 4×8 grid of plain rectangles
  (each 32px wide, 16px tall) labelled with anonymized strings
  `member-001`, `member-002`, etc. Rectangles are `--paper-2` on
  `--ink-2`. As the scene plays, rectangles get **highlighted in
  `--danger`** one by one, suggesting a scrape.
- **Right column** small-caps `ON SORTS`. Below: a single
  `--ink-2` panel with three numbers — `12 members`, `8 active`,
  `0.42 SOL`. JetBrains Mono Light, large size. Counters tick
  upward subtly (members 7→12, active 5→8). The numbers are static-
  feeling — they don't pulse, they don't glow.

**Motion:**
- 0:10 — both columns fade in together (200ms)
- 0:11–0:18 — left column rectangles highlight in `--danger` at
  220ms intervals (one per beat), with one quiet tick per highlight
- 0:18 — left column "members" fade slightly toward `--paper-3`
  (the leak is now total). Right column counter completes.
- 0:21 — small caption appears under the right column:
  `aggregate only · creator never sees identities`. Text in
  `--paper-3`, 14px.

**Audio:** soft mechanical click per left-column highlight. Pad
holds steady. No drum, no melody.

**Copy on screen (verbatim):**
- Left eyebrow: `EVERY OTHER PLATFORM`
- Left caption (small, below grid): `member graph public · scrapeable`
- Right eyebrow: `ON SORTS`
- Right caption: `aggregate only · creator never sees identities`

### Scene 3 — How it works (0:25–0:45)

**Frame:** Three horizontal rows, separated by 1px rules. Each row
is one-line of explanation, paired with a small monogram glyph on
the left.

Row 1: `[ glyph ]  Subscription is a Solana account in your wallet.`
Row 2: `[ glyph ]  Identity is hidden behind a commitment.`
Row 3: `[ glyph ]  Creator dashboard shows counters, not names.`

The glyphs are hairline-stroke icons (Phosphor line-weight 1.5px),
each rendered at 24×24px. Suggested icons: `wallet-2`, `lock`,
`gauge`. Each glyph animates in via stroke-dashoffset write-on
(360ms each, staggered 400ms apart).

**Motion:**
- 0:25 — rows appear sequentially (stagger 600ms)
- For each row:
  - 0:00 (row local) — hairline rule above writes in
  - 0:00.2 — glyph stroke writes on
  - 0:00.5 — text fades in left-to-right (no character animation,
    just opacity 0→100% over 240ms)
- 0:43–0:45 — frame holds, all three rows visible

**Audio:** one click per row appearance. No music.

**Copy on screen (verbatim):**
- Row 1: `Subscription is a Solana account in your wallet.`
- Row 2: `Identity is hidden behind a commitment scheme.`
- Row 3: `Creator dashboard shows counters, not names.`

### Scene 4 — Calibrated honesty (0:45–0:58)

**Frame:** A `DemoStatusCard`-style panel centred on screen.
Mirror the React component shape from
`frontend/src/components/states/DemoStatusCard.tsx`.

Six rows in a list:
- ✅ Solana devnet community creation
- ✅ Subscriber subscribe + access check
- ✅ Aggregate-only creator analytics
- ✅ Privy auth (email + Solana wallet)
- 🧪 Umbra hidden membership state — coming in v2
- 🧪 IKA dWallet — pre-alpha

(The emoji here are the data, not decoration. Keep them.)

The card has a small-caps header `WHAT WORKS TODAY`. Bottom of the
card: `Devnet only — no real funds.` in `--paper-3`.

**Motion:**
- 0:45 — card frame fades in (200ms)
- 0:46–0:54 — rows fade in sequentially, 800ms stagger. Each row
  ticks one click. The 🧪 rows arrive last, slightly delayed (no
  punishment animation; just sequenced in).
- 0:55–0:58 — frame holds.

**Audio:** subtle click per row. Pad continues.

**Why this scene matters:** if a viewer skips the rest of the video
they should leave with this calibrated frame in their head. It is
the load-bearing trust signal.

### Scene 5 — Privacy demo close (0:58–1:08)

**Frame:** Single line of text on `--ink-1`:

`Hidden from the creator. Not hidden from a determined investigator.
Yet.`

The word `Yet.` is in `--accent` color. The rest is `--paper-1`.

**Motion:**
- 0:58 — text appears character-by-character (30ms/char)
- 1:05 — `Yet.` punches in slightly larger (no glow, no scale; just
  a 1px-thicker font weight switch from 400 to 600 over 200ms)
- 1:05–1:08 — frame holds

**Audio:** a single longer click on `Yet.`.

**This scene is the payoff line — it carries the honesty pass into
the marketing surface.** Do not soften. Do not replace `Yet.` with
"Soon." or "Coming."

### Scene 6 — End card (1:08–1:15)

**Frame:** Centered, generous whitespace.

Small-caps eyebrow at top: `PRIVATE SUBSCRIPTION RAILS · SOLANA DEVNET`.
Below: the SORTS wordmark (DM Mono → Inter Tight version per the new
brand spec).
Below the wordmark: a single CTA in `--accent`:
`See it work — sorts.app/demo`.
Below the CTA, in `--paper-3`: `Devnet only · no real funds`.

**Motion:**
- 1:08 — eyebrow fades in
- 1:09 — wordmark fades in
- 1:10 — CTA fades in
- 1:10.4 — disclaimer caption fades in
- 1:13 — a thin underline animates in below the CTA (stroke-dashoffset,
  300ms)
- 1:13–1:15 — frame holds, then hard cut to black

**Audio:** ambient pad fades out 1:13 → 1:15. One final click on the
underline reveal.

---

## 5. Total run-time + cut downs

| Cut | Duration | Use |
|---|---|---|
| Master | 75s | YouTube, embed, demo-day |
| Twitter/LinkedIn cut | 60s | Drop Scene 3's stagger, compress Scene 4 stagger to 400ms |
| 30s teaser | 30s | Scenes 1 + 5 + 6 only |

Recompose to vertical / square via crop. Keep the same scene order
and same on-screen copy. Do not re-typeset for the smaller cuts —
crop the master.

---

## 6. Voiceover script (optional — ship type-only first)

If a narrator is added, single voice, conversational, low-key. No
"epic trailer" delivery. Recommended: female voice, 28-45 age range,
neutral accent, dry tone. Script timed to type reveals:

```
[0:00 — silence as Scene 1 builds]

[0:10] "Every paid community platform leaks the one thing that matters."
[0:14] "Who is a member. What they pay for. What they read."

[0:25] "SORTS is different by construction."
[0:30] "Your subscription lives in your wallet, not on a server."
[0:34] "Your tier and identity are hidden behind a commitment."
[0:38] "And the creator dashboard never shows a member list."

[0:45] [silence — let the status card breathe]

[0:58] "Hidden from the creator."
[1:01] "Not hidden from a determined investigator."
[1:04] "Yet."

[1:09] "See the demo at sorts dot app slash demo."
[1:13] "Devnet only. No real funds."

[1:15 — end]
```

If shipping silent: skip VO, lean harder on the type reveals. The
silent cut is the recommended default.

---

## 7. Audio direction

**Type:** ambient + restrained mechanical clicks. NOT a music track.

- **Ambient bed:** a single sustained low pad (root note, no chord
  progression). 60-80 BPM equivalent if anything implies tempo.
  Suggested instruments — analog modular pad, soft tape hum,
  Tycho-adjacent at 1/4 the brightness. Volume sits at -24 LUFS,
  ducks 4dB under any narration.
- **Mechanical clicks:** typewriter-style key clicks for type
  reveals. Each click 80ms, attack-only, no ring-out. Stereo:
  alternate left/right per character so the percussion stays
  pleasant during character-by-character type.
- **No drum kit.** No 808s. No snare hits. No risers. No
  cinematic boom.
- **End:** pad fades out over 2 seconds. No final stinger.

Mastering: -16 LUFS integrated for YouTube/landing master. -14 LUFS
for the social cuts.

**Sources:** royalty-free pad layers from Cafe Music BGM Channel /
Yusuke Tsutsumi-style ambient. Avoid corporate-stock-music trap.
Custom Ableton patch is fine if it sticks to the rules above.

---

## 8. Output specs

### 8.1 Files to deliver

| File | Format | Resolution | Codec | Bitrate | Duration |
|---|---|---|---|---|---|
| `sorts-marketing-master.mp4` | MP4 | 1920×1080 | H.264 High | 12 Mbps | 75s |
| `sorts-marketing-master.webm` | WebM | 1920×1080 | VP9 | 8 Mbps | 75s |
| `sorts-marketing-9x16.mp4` | MP4 | 1080×1920 | H.264 | 8 Mbps | 60s |
| `sorts-marketing-1x1.mp4` | MP4 | 1080×1080 | H.264 | 8 Mbps | 60s |
| `sorts-marketing-30s-teaser.mp4` | MP4 | 1920×1080 | H.264 | 10 Mbps | 30s |
| `sorts-poster-frame.png` | PNG | 1920×1080 | — | — | (single frame) |

The poster frame should be Scene 6 — the end card with the wordmark
+ CTA. Use as YouTube thumbnail and as the OG-image for the landing.

### 8.2 Frame rate + safe zones

- 30 fps for all cuts.
- 9:16 + 1:1 cuts: keep the headline + CTA inside a 90% center
  safe zone. Mobile players overlay UI at the top + bottom 10%.

### 8.3 Captions / subtitles

Generate `.vtt` and `.srt` for the master cut. Required even on
the silent version — captions describe the on-screen type for
screen readers and for muted-autoplay social players.

### 8.4 Naming / metadata

- File names lowercase, hyphenated.
- `mp4` metadata: title `SORTS — Private subscription rails on
  Solana`, comment `Devnet only. No real funds.`, copyright
  `(c) 2026 SORTS Protocol — MIT`.

---

## 9. Frame-by-frame integrity checks (run before delivery)

The design tool should self-check the output against this list. If
any item fails, regenerate the affected scene.

1. **No frame contains an actual wallet address, RPC URL, or env
   value.** Including the Day-1 program ID
   `AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV` — even though
   it's public devnet, do not put 44-character base58 strings in
   the marketing video. They look like clutter.
2. **No frame shows a member list, member roster, or any
   per-subscriber data.** Privacy invariant 5 must hold across
   every frame. Scene 2's left-column "scrape" visualization uses
   anonymized fixtures (`member-001`, etc.) — never real data.
3. **No frame shows the word "tier", "tier_level", or any
   tier-shape number** outside the explanatory `commitment scheme`
   text in Scene 3. Privacy invariant 10.
4. **No frame claims production privacy.** No "encrypted on
   mainnet" copy. No "MPC-secured" copy. No "FHE" anywhere.
5. **No frame shows a person's face, real name, or org logo** —
   except the SORTS wordmark in Scene 6.
6. **The CTA URL ends in `/demo`** — match the landing's primary
   CTA from `frontend/src/app/page.tsx` Day-10 A2 change.
7. **Devnet disclosure visible in Scene 4 + Scene 6** — both
   "Devnet only" and "no real funds" copy must appear before the
   end of the video.
8. **No emoji outside the 6 status-card rows in Scene 4.** Drop any
   ✓ / 🚀 / 🔥 the tool wants to add elsewhere.

If any of these fail, fix before producing the social cuts. Cuts
inherit any error in the master.

---

## 10. References — do look like

For motion language and editorial tone:

- **Stripe — "Hello world" intro video** (the original Stripe
  developer-platform video, not the recent product launches).
  Calm, type-driven, single accent.
- **Linear — launch videos** (the Cycles announcement, the v1
  reveal). Hairline rules, mono numbers, one accent.
- **Notion — original 2018-2019 product videos** (before they
  pivoted to illustration-heavy). Sober, confident.
- **Substack — 2021 brand video** (the typewriter-feel one).
- **Fonts In Use — annual-report style motion graphics** for type
  rhythm.
- **Klim Type Foundry — specimen videos** for editorial type
  composition.
- **Bret Victor — "Inventing on Principle" talk slides** (yes, a
  talk, but the slide design is the closest reference for how
  SORTS marketing should feel).

## 11. References — do NOT look like

- **Phantom wallet promo** (cyber-purple, glassy, neon).
- **Magic Eden splash videos** (gradient maximalism).
- **Most Solana ecosystem launch videos** (trailer-music, drone
  shots, kinetic typography).
- **A16z crypto fund announcement videos** (CGI globe spinning,
  data-cube visualizations, "the future of money" voiceover).
- **Generic SaaS landing page videos** (centered hero animation,
  scroll reveals, soft-blue gradients).
- **AI-tool launch videos** (especially the genre that intercuts
  glossy chrome 3D type with ambient piano).

If the output, watched at 1× speed with no audio, feels like any of
these — start over.

---

## 12. Hand-off checklist

Before claude design ships the deliverables, verify:

- [ ] All 6 scenes match the storyboard verbatim.
- [ ] All 6 integrity checks (Section 9) pass.
- [ ] Color palette uses ONLY the 10 tokens from Section 3.1.
- [ ] Type uses ONLY the sizes from Section 3.2.
- [ ] No forbidden patterns from Section 3.3 appear in any frame.
- [ ] All 5 output files (16:9 master, WebM, 9:16, 1:1, 30s
      teaser) plus poster + VTT/SRT delivered.
- [ ] Total master run-time is 75s ± 1s.
- [ ] Master master meta tags + filenames match Section 8.4.
- [ ] If VO is included: it matches Section 6's script verbatim.
- [ ] If VO is not included: the silent version is the chosen
      default and reads as confident, not as "we ran out of budget".

---

## 13. Hard constraints (cannot be violated)

- Devnet badge / pre-alpha disclosure / "no real funds" appears
  somewhere in the video.
- The video does not claim production privacy.
- The video does not show real wallet data.
- The video does not use the deprecated `#2DE8E0` neon cyan from
  the current website. It uses the new `--accent` `#5BD9C9`.
- The video matches the website's brand spec — they share tokens.
  If the website doesn't ship the new tokens before the video
  goes live, **update the website first**, then publish the video.
- The video does not use stock footage of people, cities, drones,
  servers, or "data".
- The video runs without sound and still communicates the pitch.
- The video does not exceed 90 seconds.

End of prompt.
