# SDG ESCAPE — Post-UAT Hardening & Production Readiness
## Consolidated Implementation Handoff for Codex / Claude Code

**Project:** SDG Escape — Unlock 2030  
**Local repo:** `D:\dev\sdg_game_slide_block`  
**Scope:** Implement all changes identified after the first local UAT, without rewriting the working Vite/TypeScript PWA architecture.

---

# 0. Executive Goal

The MVP works, but first UAT exposed four production issues:

1. **Movement correctness:** some pieces that appear to have a legal path cannot be dragged in that direction (e.g. `9 Innovation` upward).
2. **Drag feel:** tile movement needs to be smoother and more tactile.
3. **Difficulty:** current public levels are solver-valid but too short (`4 / 6 / 9` minimum moves).
4. **Typography / landing + intro UI:** the visual system needs a deliberate two-font hierarchy, cleaner copy, and consistent presentation.

This pass must produce a **production-candidate build** suitable for browser/UAT deployment and subsequent Android-tablet QA.

Do not add unrelated features.

---

# 1. Non-Negotiable Gameplay Rule

This is a sliding-block puzzle.

A piece may move:

- up
- down
- left
- right

provided that:

- all destination cells are free
- the piece stays within the tray, except the master tile through the valid 2030 exit
- the piece does not rotate
- the piece does not overlap another piece

**Piece aspect ratio must NOT determine movement axis.**

Therefore:

- a `2×1` horizontal piece may move vertically if space permits
- a `1×2` vertical piece may move horizontally if space permits

If current code restricts motion based on orientation, remove that restriction.

---

# 2. First-UAT Regression: Tile 9

The screenshot/UAT observation showed `9 Innovation` could not be dragged upward even though the space above appeared free.

Treat this as a required regression case.

Add a deterministic test fixture representing the relevant board state and assert:

```text
tile 9 can move upward when every destination cell above its footprint is empty
```

Also verify equivalent cases:

```text
2×1 piece: up / down / left / right where legal
1×2 piece: up / down / left / right where legal
1×1 piece: up / down / left / right where legal
2×2 master: up / down / left / right where legal
```

Movement must be blocked only by:

```text
collision
board boundary
invalid master-tile exit geometry
```

---

# 3. Smooth Dragging

Improve touch and mouse dragging without changing logical rules.

## Required behavior

Use:

```text
Pointer Events
setPointerCapture()
requestAnimationFrame()
CSS transform: translate3d(...)
```

During active drag:

- keep logical board coordinates unchanged until commit
- render temporary visual translation only
- clamp visual travel to the maximum legal displacement
- prevent overlap visually
- prevent accidental page scrolling inside the board
- slightly elevate the active tile using shadow / tiny scale change

On release:

- snap to the nearest legal grid position
- commit exactly one logical move if position changed
- push prior state to undo history
- update move counter once
- run win detection
- clear temporary transform state

Recommended snap duration:

```text
120–180 ms
```

Recommended easing:

```css
cubic-bezier(.2,.8,.2,1)
```

Do not animate every board tile during drag.

Do not rebuild the whole board DOM on every `pointermove`.

---

# 4. Production Difficulty Hardening

Current minimums:

```text
TUKLAS = 4
UNAWA = 6
KILOS = 9
```

Preserve these as non-public smoke fixtures.

Suggested IDs:

```text
smoke-tuklas-4
smoke-unawa-6
smoke-kilos-9
```

Public production levels must be replaced with solver-verified configurations in these bands:

| Level | Required minimum | Preferred zone |
|---|---:|---:|
| TUKLAS | 10–20 | 12–18 |
| UNAWA | 25–40 | 28–36 |
| KILOS | 50–80 | 55–70 |

## Rules

- exact solver proof is authoritative
- scramble length is not difficulty
- do not manually claim a minimum
- every production level must store a verified solution path
- retain the existing move-count definition: one continuous directional slide until release = one move

## Candidate generation

Prefer reverse-scramble generation from a valid solved/almost-solved state:

```text
solved state
  ↓
legal reverse scramble
  ↓
candidate states
  ↓
exact solver
  ↓
filter by target band
  ↓
manual quality review
  ↓
production level
```

Reject candidates that are:

- visually almost solved
- long only because of repetitive shuttling
- dominated by one piece moving back and forth
- technically difficult but mechanically dull
- poor on touch due to cramped/ambiguous interaction

If solver performance becomes an issue:

1. profile first
2. improve canonical state encoding / hashing
3. reduce allocation
4. use bidirectional BFS if appropriate
5. use A* only with an admissible heuristic if exact optimality remains guaranteed

Do not replace exact minimum verification with approximation.

---

# 5. Hint Robustness

After changing levels, verify Hint on:

- initial state
- after one optimal move
- after Undo
- after a legal deviation from the precomputed optimal path

If the player is no longer on the stored solution path, Hint must still recommend a legal route toward a solution.

Preferred behavior:

```text
current state
  ↓
resolve against cached/state solver
  ↓
return one legal next move
```

Do not perform the move automatically.

---

# 6. Local Best-Score Migration

Old records from 4/6/9-move production levels must not carry into the new production levels.

Preferred key version:

```text
sdg-escape.v2.best.tuklas
sdg-escape.v2.best.unawa
sdg-escape.v2.best.kilos
```

or implement an explicit level-set version.

Do not delete unrelated user settings such as sound preference.

---

# 7. Typography System

## 7.1 Ban generic defaults

Do not use as the brand/UI voice:

- Inter
- Roboto
- Arial
- Open Sans
- Montserrat
- `system-ui`

Fallback fonts are acceptable only as technical fallbacks after the intended fonts.

## 7.2 Required two-font system

### Display / UI font

Use:

```text
Bricolage Grotesque
```

For:

- SDG ESCAPE
- UNLOCK 2030
- screen headlines
- TUKLAS / UNAWA / KILOS
- START
- major controls
- compact UI labels
- move/time metrics

### Body / editorial font

Use:

```text
Source Serif 4
```

For:

- landing-page descriptive sentence
- level descriptors
- instructions
- explanatory copy
- “Choose another level”

Bundle fonts locally for offline PWA use where licensing permits.

Do not depend on Google Fonts or other remote font delivery in production.

## 7.3 Type scale

Use explicit CSS variables/tokens rather than arbitrary framework defaults.

Suggested starting scale:

```css
--type-display-xl: clamp(3.75rem, 8vw, 6rem);
--type-display-lg: clamp(2.75rem, 6vw, 4.75rem);
--type-heading:    clamp(2rem, 4vw, 3rem);
--type-level:      clamp(1.5rem, 3vw, 2rem);
--type-body-lg:    clamp(1.15rem, 2vw, 1.5rem);
--type-body:       1rem;
--type-label:      0.9rem;
--type-caption:    0.8rem;
```

Adjust to the existing responsive layout, but preserve clear hierarchy.

## 7.4 Readability

For paragraph/instruction text:

```text
line-height ≈ 1.5
max readable width ≈ 65–75 characters
```

For:

- timer
- moves
- best score
- optimal moves

use:

```css
font-variant-numeric: tabular-nums;
```

---

# 8. Landing Page UI Changes

Preserve the warm wooden-frame visual direction.

## Remove / restate top line

Remove:

```text
A HANDCRAFTED PUZZLE FOR A SHARED FUTURE
```

Replace with the subtler line:

```text
A sliding puzzle for the 17 Goals
```

Do not render it inside a heavy boxed banner.

It may use Source Serif 4 or a restrained Bricolage treatment, but should remain visually secondary.

## Main title

Keep:

```text
SDG
ESCAPE
UNLOCK 2030
```

Use Bricolage Grotesque.

## Main description

Use exactly:

```text
Slide the 17 Goals to create a path for Sustainable Development
```

No trailing period.

Use Source Serif 4.

## Level buttons

Keep:

```text
TUKLAS
UNAWA
KILOS
```

Use Bricolage Grotesque.

Right-side descriptors:

```text
Discover the Goals
Understand the Connections
Move Toward 2030
```

Use Source Serif 4.

Do not use the previous generic/default font for these descriptor texts.

Keep the existing wood/tactile button treatment.

## Footer

Keep:

```text
17 GOALS. ONE SHARED FUTURE.
```

---

# 9. Level Intro / Instruction Screens

Apply the same typography system and spacing to all three levels.

## UNAWA

Header:

```text
UNAWA · UNDERSTAND THE CONNECTIONS
```

Main title:

```text
Make room for 2030
```

**No period.**

Instructions:

```text
1. Slide each tile along its clear channel
2. Keep every tile inside the wooden tray
3. Guide the white Goals tile through the 2030 exit
```

No trailing periods.

Use Source Serif 4 for the instruction body.

Keep `START` in Bricolage Grotesque.

Keep:

```text
Choose another level
```

using Source Serif 4.

## TUKLAS and KILOS

Apply the same rule:

- remove unnecessary terminal period from the large title
- maintain equivalent editorial tone
- same font pairing
- same spacing hierarchy
- no arbitrary screen-specific font substitutions

Do not rewrite their meaning unless required for consistency.

---

# 10. Visual Consistency

Preserve the current:

- recessed dark tray
- warm wood-grain frame
- raised SDG tiles
- white master tile
- carved 2030 exit
- tactile controls
- SDG color system

This pass should not redesign the board.

The typography and drag polish should make the existing visual system feel more intentional.

---

# 11. Test Matrix

## 11.1 Unit tests — movement

Required:

- `2×1` can move vertically when legal
- `1×2` can move horizontally when legal
- `1×1` moves in all four directions when legal
- `2×2` master moves in all four directions when legal
- collision blocks movement
- board boundary blocks movement
- non-exit escape is blocked
- master can exit only via the valid 2030 opening
- Tile 9 upward regression passes

## 11.2 Drag/state tests

Verify:

- one drag = one move
- no move when released in original logical cell
- Undo restores previous position
- visual drag never mutates canonical state before commit
- pointer cancel restores stable state
- pointer capture is released cleanly
- rapid repeated drag does not duplicate listeners/history

## 11.3 Solver tests

Smoke fixtures remain exactly:

```text
4 / 6 / 9
```

Production:

```text
TUKLAS 10–20
UNAWA 25–40
KILOS 50–80
```

Stored solution length must equal exact solver minimum.

## 11.4 Hint tests

- legal from initial state
- legal after one move
- legal after Undo
- legal after deliberate deviation

## 11.5 Typography/static checks

Where practical, add lightweight tests or lint assertions that:

- intended font tokens are used
- prohibited fonts are not introduced in app CSS
- metric elements use tabular numbers
- core landing/intro copy matches specification

Do not over-engineer snapshot tests for decorative CSS.

---

# 12. Manual UAT Checklist

Before deployment, manually verify in desktop browser:

### Movement

- [ ] Tile 9 moves upward when space is available.
- [ ] Wide blocks can move vertically.
- [ ] Tall blocks can move horizontally.
- [ ] No piece overlaps another.
- [ ] No illegal escape is possible.

### Drag feel

- [ ] Drag tracks pointer smoothly.
- [ ] No obvious lag/jitter.
- [ ] Active tile visually lifts.
- [ ] Snap feels quick, not bouncy.
- [ ] Board does not scroll during tile drag.
- [ ] Undo/restart remain correct after fast dragging.

### Landing

- [ ] Top line reads `A sliding puzzle for the 17 Goals`.
- [ ] Main description has no trailing period.
- [ ] Level descriptors use Source Serif 4.
- [ ] TUKLAS/UNAWA/KILOS use Bricolage Grotesque.
- [ ] Layout remains readable in landscape tablet dimensions.

### Intro screens

- [ ] `Make room for 2030` has no period.
- [ ] Other level titles follow same punctuation rule.
- [ ] Instructions use Source Serif 4.
- [ ] START uses Bricolage Grotesque.
- [ ] spacing and hierarchy match landing-page visual language.

### Levels

- [ ] TUKLAS feels quick but not trivial.
- [ ] UNAWA requires planning.
- [ ] KILOS feels genuinely challenging.
- [ ] Hint remains usable.

---

# 13. Android / Real-Device Gate

Do not call the build production-ready until a real Android tablet is tested.

Minimum real-device QA:

```text
touch drag
pointer capture
scroll suppression
snap smoothness
font rendering
orientation
PWA install
offline reopen
local scores
restart
undo
hint
all 3 levels
```

If no device is available, report:

```text
Browser/UAT candidate complete; real Android QA pending.
```

Do not claim physical QA from desktop emulation.

---

# 14. Deployment Gate

Before any production deployment:

```bash
npm test
npm run verify:levels
npm run build
```

Run existing lint/typecheck scripts too if present.

The build may be deployed to Vercel for online UAT after these pass.

PWA/offline behavior must still be tested after deployment.

---

# 15. Graph Engineering Plan

Use dependency-aware parallel work. Do not serialize independent tasks.

## 15.1 Dependency graph

```text
                    ┌──────────────────┐
                    │ A. Baseline audit │
                    └────────┬─────────┘
                             │
            ┌────────────────┼─────────────────┐
            │                │                 │
            ▼                ▼                 ▼
 ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐
 │ B. Movement +   │ │ C. Typography + │ │ D. Level/solver  │
 │ drag hardening  │ │ landing/intro UI│ │ difficulty       │
 └────────┬────────┘ └────────┬────────┘ └────────┬─────────┘
          │                   │                   │
          └────────────┬──────┴────────────┬──────┘
                       ▼                   ▼
             ┌──────────────────┐  ┌─────────────────┐
             │ E. Integration   │  │ F. Test updates │
             │ + hint/storage   │  │ / regression    │
             └────────┬─────────┘  └────────┬────────┘
                      └────────────┬─────────┘
                                   ▼
                         ┌────────────────────┐
                         │ G. Final UAT gates │
                         └────────────────────┘
```

## 15.2 Parallelizable workstreams

After baseline audit, B/C/D can proceed in parallel **only if the coding environment supports isolated worktrees/agents safely**.

### Workstream B — Gameplay interaction

Own:

- movement legality
- Tile 9 regression
- pointer handling
- drag smoothing
- snap behavior

Avoid editing:

- landing-page copy
- level generation data unless needed for regression fixture

### Workstream C — UI / typography

Own:

- font assets/tokens
- landing page
- level intro pages
- copy/punctuation
- responsive type scale

Avoid editing:

- solver
- movement engine

### Workstream D — Difficulty

Own:

- smoke-level preservation
- candidate generation
- solver performance
- production level data
- exact minimum verification

Avoid editing:

- visual CSS
- pointer code

## 15.3 Integration workstream

After B/C/D:

- resolve shared type changes
- validate Hint against new levels
- version best-score storage
- run complete test suite
- perform manual browser UAT

## 15.4 Token-efficiency rules for coding agents

- inspect only files relevant to each workstream
- do not repeatedly dump whole files into context
- use targeted searches (`rg`) before opening files
- reuse existing abstractions instead of rewriting modules
- report diffs/results, not full source unless necessary
- run focused tests during each workstream, full suite only at integration gates
- do not re-explain settled product requirements

---

# 16. Suggested Git Strategy

Before changes:

```bash
git status
git branch --show-current
git rev-parse --short HEAD
```

Recommended branch:

```bash
git switch -c feature/post-uat-hardening
```

Suggested commit structure:

```text
fix: allow legal cross-axis tile movement
perf: smooth pointer drag and snapping
feat: harden production puzzle difficulty
style: refine landing and intro typography
test: expand post-uat regression coverage
```

Exact commit grouping may vary.

Do not rewrite unrelated history.

---

# 17. Definition of Done

This post-UAT pass is complete only when:

- [ ] Tile 9 upward regression is fixed.
- [ ] Piece orientation no longer incorrectly limits movement axis.
- [ ] Dragging is perceptibly smoother.
- [ ] Pointer Events use capture safely.
- [ ] Canonical state is committed on release, not every pointermove.
- [ ] 4/6/9 levels are preserved as smoke fixtures.
- [ ] Public TUKLAS is 10–20 exact minimum moves.
- [ ] Public UNAWA is 25–40 exact minimum moves.
- [ ] Public KILOS is 50–80 exact minimum moves.
- [ ] Hint works after path deviation.
- [ ] Old trivial best scores are versioned/incompatible.
- [ ] Bricolage Grotesque is the display/UI family.
- [ ] Source Serif 4 is the body/editorial family.
- [ ] prohibited generic brand fonts are absent.
- [ ] landing copy and level descriptors match this specification.
- [ ] intro titles have no unnecessary terminal periods.
- [ ] body line-height/readability constraints are applied.
- [ ] timers/move counts use tabular numerals.
- [ ] `npm test` passes.
- [ ] `npm run verify:levels` passes.
- [ ] `npm run build` passes.
- [ ] browser UAT passes.
- [ ] real Android QA is either completed or explicitly reported pending.

---

# 18. Brief Codex / Claude Code Handoff

Implement `docs/SDG_ESCAPE_POST_UAT_HARDENING.md`.

This is a focused post-UAT hardening pass. Preserve the existing Vite/TypeScript PWA and wood/SDG visual system.

Priorities:

1. Fix legal cross-axis movement, including the Tile 9 upward regression.
2. Make Pointer Event dragging smoother using pointer capture, `requestAnimationFrame`, `translate3d`, legal clamping, and short snap easing.
3. Preserve the current 4/6/9 levels as smoke fixtures and replace public levels with exact solver-verified bands: TUKLAS 10–20, UNAWA 25–40, KILOS 50–80.
4. Apply the required typography system: Bricolage Grotesque for display/UI and Source Serif 4 for body/editorial text; no Inter/Roboto/Arial/Open Sans/Montserrat/system-ui as brand fonts.
5. Implement the specified landing-page and level-intro copy/punctuation changes.
6. Version old local best scores.
7. Expand regression tests and complete the acceptance gates.

Use the dependency graph in Section 15 for parallel work where safe. Keep tool/context usage targeted and concise. Do not expand scope.

Before editing, report branch/HEAD/status and identify the exact files for movement, drag, levels/solver, storage, landing UI, intro UI, and typography.

After implementation, run at minimum:

```bash
npm test
npm run verify:levels
npm run build
```

Then report final production minimum move counts, test/build results, changed files, manual browser-UAT findings, and any Android real-device QA still pending.
