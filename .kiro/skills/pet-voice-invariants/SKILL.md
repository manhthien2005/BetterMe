---
name: pet-voice-invariants
description: Use when writing or editing any user-facing Vietnamese copy — pet/companion voice lines, toasts, greetings, milestone text, or friend/garden messaging. Covers the no-guilt and no-comparison invariants, host vs guest voice, per-species tone, and the test that enforces them.
---

# BetterMe — pet voice & copy invariants

The product's emotional promise is **cozy and guilt-free**. Copy is not decoration here — two
invariants are enforced by tests and must never be broken. Voice lives in
`src/components/dashboard/pet-voice.ts`; the guard is `pet-voice.test.ts`.

## No-guilt (hard rule)
- Never blame the user for a missed day, a broken streak, or low activity. A miss is met with
  warmth or silence — never a reproach.
- Never compare the user *downward* to anyone. Forbidden Vietnamese tokens in voice text include
  **"thua", "kém hơn", "xếp cuối"** (and their guilt-tripping cousins). The test scans every
  pool for these.
- The weekly fair / social surfaces are positive-only: a zero-good-week is **silent**, never
  broadcast. Misses are never shared.

## No-comparison across the social layer
Friends' data is shown to celebrate, never to rank. Ordering is by relationship
(`friendships.accepted_at`), **never by score**. Summaries structurally omit any field that
could reveal a friend's miss-day or inactivity gap.

## Voice structure (match the existing shape)
- **Host voice** (`getPetLine(species, bondTier, event)`): the user's own pet speaks. Dog voice
  calls the owner "Sếp"; cat voice is tsundere. Bond tier changes warmth.
- **Guest voice** (`getGuestLine(species, event)`): when visiting a friend's garden — the pet
  addresses a *guest*, has no bond tier. Dog says "bạn"; "Sếp" is reserved for the owner only.
- Every pool needs enough variants (typically 3) per species × tier-group × event. A
  `friendVisit` line must not mention a gift (🎁 / "quà") unless a real gift was given
  (`friendVisitGift`).

## When editing voice
1. Read the relevant spec section first (`docs/superpowers/specs/` — social + pet-companion specs).
2. Add lines to the correct pool; keep tone per-species.
3. Run `pnpm vitest run src/components/dashboard/pet-voice.test.ts` and confirm the no-guilt /
   no-comparison assertions pass. If you added a new event/pool, extend the test to cover it.
