# SDG ESCAPE — Replayable Verified Level Pools
## Implementation Handoff

**Project:** SDG Escape — Unlock 2030  
**Repo:** `D:\dev\sdg_game_slide_block`  
**Goal:** Make repeat play load a different **pre-generated, solver-verified** puzzle instead of generating puzzles at runtime.

---

# 1. Product Decision

Do **not** generate new puzzles on the tablet during play.

Use approved development-time pools:

```text
TUKLAS → 5–8 verified variants
UNAWA  → 5–8 verified variants
KILOS  → 5–8 verified variants
```

Every public variant must pass:

1. exact solver verification
2. tier difficulty gate
3. anti-shuttle / quality gate
4. manual UAT approval

Runtime should only select and load an approved level.

---

# 2. Player Experience

Example:

```text
ROUND 1
TUKLAS → T4
UNAWA  → U2
KILOS  → K7

PLAY AGAIN

ROUND 2
TUKLAS → T1
UNAWA  → U6
KILOS  → K3
```

Do not expose internal IDs in normal booth mode.

---

# 3. Shuffle-Bag Selection

Do not use naive random selection.

Use one **shuffle bag per tier**:

```text
T1 T2 T3 T4 T5 T6
→ shuffle
→ T4 T1 T6 T2 T5 T3
→ reshuffle after exhaustion
```

Rules:

- no repeat until all variants in that tier are used
- after exhaustion, reshuffle
- when pool size > 1, avoid making the first item of the new bag equal to the immediately previous variant
- selector must work offline
- no backend

---

# 4. Persistence

Store replay history locally:

```ts
type TierReplayState = {
  remaining: string[];
  lastPlayed?: string;
};

type ReplayState = {
  version: 1;
  tuklas: TierReplayState;
  unawa: TierReplayState;
  kilos: TierReplayState;
};
```

Suggested key:

```text
sdg-escape.replay.v1
```

If saved IDs no longer exist after an update, rebuild that tier's bag safely.

Do not store personal data.

---

# 5. Production Pool Data

Separate approved production variants from smoke/candidate data.

Suggested:

```text
src/data/
├─ productionLevels.ts
├─ smokeFixtures.ts
└─ candidateLevels.ts
```

Recommended shape:

```ts
type ProductionLevelVariant = PuzzleLevel & {
  tier: "tuklas" | "unawa" | "kilos";
  variantId: string;
  exactMinimum: number;
  qualityApproved: true;
  manualUatApproved: true;
};
```

Example:

```ts
export const productionPools = {
  tuklas: [T1, T2, T3, T4, T5],
  unawa:  [U1, U2, U3, U4, U5],
  kilos:  [K1, K2, K3, K4, K5]
};
```

Only approved variants may appear here.

---

# 6. Promotion Gate

Development pipeline:

```text
candidate
  ↓
exact solver
  ↓
difficulty gate
  ↓
quality gate
  ↓
manual UAT
  ↓
approved production pool
```

Required:

```text
exact verified
AND quality approved
AND manual UAT approved
= production eligible
```

If fewer than 5 approved variants exist for a tier, ship fewer rather than admitting weak or unproven levels.

Target:

```text
minimum useful pool: 3 variants/tier
preferred:           5–8 variants/tier
```

Selector must still work with pool sizes 1 or 2.

---

# 7. Runtime Behavior

Add:

```ts
getNextVariant(tier)
resetReplayBag(tier)
resetAllReplayBags()
```

Behavior:

- starting a fresh level → load next variant for that tier
- `PLAY AGAIN` after completing the round → advance to new variants
- `Restart` → reload the **same** current variant
- `Undo` → same variant
- returning to an unfinished active level → preserve current variant where current architecture supports it

`Restart` must never silently change puzzles.

---

# 8. Best Scores

Scores must be per variant.

Suggested keys:

```text
sdg-escape.v3.best.tuklas.T1
sdg-escape.v3.best.unawa.U4
sdg-escape.v3.best.kilos.K2
```

Do not compare structurally different variants as though they were the same puzzle.

Migrate safely from current `v2` tier-only keys; old scores must not overwrite variant-specific records.

---

# 9. Hint Compatibility

Each variant must have or support:

- exact solution
- exact minimum
- solver fallback after path deviation

Hint must resolve only against the active variant.

Add a regression test ensuring hint/solution state does not leak between variants.

---

# 10. Tests

Required:

## Shuffle bag
- each variant appears once before repetition
- reshuffles after exhaustion
- avoids immediate repeat across bag boundaries when possible
- pool of 1 works
- pool of 2 works
- stale/corrupt saved IDs recover safely

## Runtime
- `PLAY AGAIN` advances variants
- `Restart` preserves current variant
- tier selection uses correct pool
- active variant remains stable during play

## Scores
- records are per variant
- T1 cannot overwrite T2
- v2 data cannot corrupt v3 keys

## Hints
- hint uses active variant
- switching variants resets/replaces solution context

## Production validation
For every production-pool item:

```text
exact solver verification = pass
quality gate = pass
manualUatApproved = true
```

Verifier must fail if an unapproved candidate is included.

---

# 11. Optional Debug Mode

Development only:

```text
TUKLAS / T4
minimum 16
quality PASS
```

Do not expose variant IDs/engineering metadata in normal booth mode.

---

# 12. Graph Engineering

Use dependency-aware parallel work:

```text
                  ┌───────────────┐
                  │ A. Pool schema│
                  └───────┬───────┘
                          │
          ┌───────────────┼────────────────┐
          ▼               ▼                ▼
 ┌──────────────┐ ┌──────────────┐ ┌────────────────┐
 │ B. Shuffle   │ │ C. Score     │ │ D. Validator   │
 │ + persistence│ │ migration    │ │ + promotion    │
 └──────┬───────┘ └──────┬───────┘ └───────┬────────┘
        │                │                 │
        └──────────┬─────┴─────────┬───────┘
                   ▼               ▼
          ┌────────────────┐ ┌─────────────┐
          │ E. Runtime     │ │ F. Tests    │
          │ integration    │ │ + fixtures  │
          └───────┬────────┘ └──────┬──────┘
                  └──────────┬───────┘
                             ▼
                    ┌────────────────┐
                    │ G. Full verify │
                    └────────────────┘
```

Parallelize B/C/D after A when isolated changes are safe.

Token-efficiency:

- inspect only level, storage, hint, selector, and verifier files
- use targeted `rg`/file reads
- focused tests per workstream
- full test/build only at integration
- do not revisit settled UI/typography/drag code

---

# 13. Non-Goals

Do not add:

- runtime procedural generation
- runtime exhaustive search just to choose a level
- backend/database
- login
- cloud leaderboard
- UI redesign
- typography/drag changes
- new gameplay rules

This task is replayability through **approved pre-generated pools**.

---

# 14. Acceptance Criteria

Complete when:

- [ ] production pools exist by tier
- [ ] runtime uses shuffle bags
- [ ] no repeat before pool exhaustion
- [ ] immediate repeat across reshuffle avoided when possible
- [ ] `Restart` preserves current variant
- [ ] `PLAY AGAIN` advances variants
- [ ] replay history works offline
- [ ] best scores are variant-specific
- [ ] hint context is variant-specific
- [ ] stale replay state self-recovers
- [ ] verifier rejects unverified/unapproved variants
- [ ] automated tests pass
- [ ] `npm run build` passes
- [ ] existing UI, drag, typography, PWA, solver, and quality gates remain intact

---

# 15. Brief Agent Handoff

Implement `docs/SDG_ESCAPE_REPLAYABLE_LEVEL_POOLS.md`.

Add replayable **pre-generated production level pools**, not runtime puzzle generation. Use a persistent shuffle bag per tier so all approved variants are played before repetition. `Restart` keeps the current variant; `PLAY AGAIN` advances to new ones.

Make scores and hint context variant-specific. Production pools may contain only exact-solver-verified, quality-approved, manual-UAT-approved variants. Preserve existing UI, drag, typography, PWA, solver, and quality-gate behavior.

Use the graph in Section 12 for parallel work where safe and keep file reads targeted.

After implementation, run tests/build and report: files changed, pool/selector design, persistence, score migration, validation gates, test results, and any tier still lacking enough approved variants.
