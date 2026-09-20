# SDG ESCAPE — Unlock 2030
## Implementation Specification + Coding-Agent Handoff

**Target:** Android tablet, landscape-first, offline-capable web game  
**Implementation mode:** Progressive Web App (PWA)  
**Primary stack:** Vite + TypeScript + HTML/CSS  
**Backend:** None  
**Authentication:** None  
**Database:** None  
**Internet required during play:** No  
**Primary use case:** Public SDG Corner / exhibit / booth activity

---

# 1. Project Goal

Build a low-cost, quick-to-deploy tablet game inspired by the general mechanics of classic sliding-block escape puzzles.

The game represents:

- **17 colored pieces** = Sustainable Development Goals 1–17
- **1 large white piece** = the overall Sustainable Development Goals / Agenda 2030
- **1 exit opening** = the path toward **2030 / a sustainable future**

The player must rearrange the 17 SDG blocks by sliding them horizontally or vertically until the large white Sustainable Development Goals block can pass through the exit.

The conceptual message is:

> **Sustainable development requires the 17 Goals to work together. Coordinate the goals and create a pathway toward 2030.**

The game should feel like a digital version of a handmade wooden tabletop puzzle rather than a generic mobile app.

---

# 2. Important Design / IP Constraint

Use only the **general sliding-block puzzle mechanic**.

Do **not** reproduce:

- Dilemma Games branding
- Khun Phan branding/story
- exact commercial artwork
- exact proprietary board artwork
- exact commercial starting configuration unless independently recreated and verified as generic/public-domain puzzle logic

The SDG game must have its own:

- board design
- theme
- level configuration
- copy
- visual treatment
- title
- progression

---

# 3. Game Title

Primary title:

> **SDG ESCAPE — UNLOCK 2030**

Recommended subtitle:

> **17 Goals. One Shared Future.**

Optional Cebuano/Filipino booth framing can be added later.

---

# 4. Core Gameplay

## 4.1 Objective

Move the 17 SDG pieces strategically so that the large white **SUSTAINABLE DEVELOPMENT GOALS** tile can reach and exit through the opening at the bottom of the board.

## 4.2 Rules

1. Pieces can move only **horizontally or vertically**.
2. Pieces cannot rotate.
3. Pieces cannot overlap.
4. Pieces cannot leave the board except the white target piece through the designated exit.
5. Only one piece is manipulated at a time.
6. Pieces snap to the board grid after movement.
7. Illegal movement must be prevented rather than accepted and rolled back later.
8. Each completed grid displacement counts as a move according to the move-counting rule defined below.
9. The player wins when the white target piece exits through the 2030 opening.

## 4.3 Move Counting

For MVP:

- A continuous drag of a piece in one direction until release counts as **1 move**, regardless of whether it travels 1 or several empty grid cells.
- Changing direction requires release and a new drag.
- Undo reverses exactly one move.

This is easier for booth visitors to understand than counting every single grid cell.

---

# 5. Board Geometry

Use a **6 × 6 logical grid** for the initial implementation.

Suggested coordinate system:

- columns: `0..5`
- rows: `0..5`

The board exit is centered at the bottom.

Recommended exit:

- width: **2 grid cells**
- exit columns: `2` and `3`
- location: immediately below row `5`

The target white tile:

- size: **2 × 2**
- win alignment before exit:
  - `x = 2`
  - `y = 4`

When the target reaches this alignment, it can slide downward through the exit.

Do not hard-code visual pixels to this geometry. Compute all positions from board dimensions.

---

# 6. Piece Set

Use 18 pieces total.

## 6.1 Target Piece

| Property | Value |
|---|---|
| ID | `sdg-master` |
| Label | `SUSTAINABLE DEVELOPMENT GOALS` |
| Color | White / warm off-white |
| Size | `2 × 2` |
| Role | Escape piece |

## 6.2 SDG Pieces

Recommended initial geometry:

- SDGs 1–5: five `1 × 2` vertical blocks
- SDGs 6–10: five `2 × 1` horizontal blocks
- SDGs 11–17: seven `1 × 1` square blocks

Total occupied area:

- white target: 4 cells
- SDGs 1–5: 10 cells
- SDGs 6–10: 10 cells
- SDGs 11–17: 7 cells

**Total = 31 cells**

A 6×6 board has 36 cells, leaving **5 empty cells** for movement.

This geometry is a starting design constraint, not proof that a specific level is solvable.

---

# 7. SDG Metadata

Create a local `sdgs.ts` or `sdgs.json` file containing:

1. No Poverty
2. Zero Hunger
3. Good Health and Well-Being
4. Quality Education
5. Gender Equality
6. Clean Water and Sanitation
7. Affordable and Clean Energy
8. Decent Work and Economic Growth
9. Industry, Innovation and Infrastructure
10. Reduced Inequalities
11. Sustainable Cities and Communities
12. Responsible Consumption and Production
13. Climate Action
14. Life Below Water
15. Life on Land
16. Peace, Justice and Strong Institutions
17. Partnerships for the Goals

Each object should contain at minimum:

```ts
type SDG = {
  number: number;
  title: string;
  shortTitle: string;
  color: string;
  iconPath?: string;
};
```

If official SDG icons are not supplied, the game must still work using:

- official SDG-style colors
- SDG number
- short title

Place optional icon files under:

```text
/public/assets/sdg/
```

Do not make icons mandatory for the game to run.

---

# 8. Difficulty / Progression

Implement three named levels.

## Level 1 — TUKLAS

Purpose:

- teach mechanics
- quick public interaction

Target optimal solution:

- approximately **20–30 moves**

UI label:

> **TUKLAS — Discover the Goals**

---

## Level 2 — UNAWA

Purpose:

- moderate challenge
- require planning

Target optimal solution:

- approximately **35–55 moves**

UI label:

> **UNAWA — Understand the Connections**

---

## Level 3 — KILOS

Purpose:

- expert booth challenge

Target optimal solution:

- approximately **60–90 moves**

UI label:

> **KILOS — Move Toward 2030**

---

# 9. Level Design Requirement

Do **not** manually guess a level and assume it is solvable.

Each shipping level must be verified by a solver.

Store a level like:

```ts
type PuzzlePiece = {
  id: string;
  sdg?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  target?: boolean;
};

type PuzzleLevel = {
  id: string;
  name: string;
  description: string;
  boardWidth: 6;
  boardHeight: 6;
  exitColumns: [2, 3];
  pieces: PuzzlePiece[];
  minimumMoves?: number;
  solution?: Move[];
};
```

---

# 10. Solver / Level Verification

Implement a development-time solver or verification script.

Preferred approach:

- canonicalize each board state
- generate every legal slide
- use BFS for shallow levels
- use A* if BFS becomes too expensive
- avoid revisiting equivalent states

A state is determined only by the positions of all pieces.

The solver must be capable of:

1. verifying a level is solvable
2. returning one valid solution path
3. calculating or estimating minimum move count
4. rejecting unsolvable levels

The solver does **not** need to run continuously during normal gameplay.

Preferred structure:

```text
/src/game/solver.ts
/scripts/verify-levels.ts
```

Store the verified solution with each production level so Hint does not require an expensive live search.

---

# 11. Interaction Model

## 11.1 Primary Input

Use **Pointer Events** so one implementation works for:

- touchscreen
- mouse
- stylus

Events:

- `pointerdown`
- `pointermove`
- `pointerup`
- `pointercancel`

## 11.2 Drag Behavior

On pointer down:

1. identify selected piece
2. capture pointer
3. identify allowed movement axis/axes based on free neighboring cells
4. visually raise the selected piece slightly

During drag:

1. constrain movement to legal axis
2. clamp movement against:
   - board edges
   - neighboring blocks
3. never allow visual overlap

On release:

1. snap to nearest valid logical grid coordinate
2. update game state
3. increment move counter if the logical position changed
4. store previous state in undo stack
5. check win condition

## 11.3 Touch UX

Minimum touch behavior requirements:

- no browser text selection while dragging game pieces
- no accidental page scrolling while dragging inside the board
- large enough pieces and controls for tablet use
- movement should feel immediate
- no hover-only interaction

---

# 12. Win Condition

The white target piece must first align with the exit:

```text
x = 2
y = 4
width = 2
height = 2
```

Then the player may drag it downward through the exit.

Once the white block crosses the board boundary:

1. lock input
2. play a short completion animation
3. stop timer
4. show results

Success message:

> **2030 UNLOCKED**

Then:

> **17 Goals. One Shared Future.**

Optional educational message:

> Sustainable development depends on progress across interconnected goals.

---

# 13. End Animation

Keep the animation lightweight.

Suggested sequence:

1. white target slides through the exit
2. remaining 17 colored tiles briefly pulse
3. tiles visually converge or transition into a simplified SDG wheel motif
4. display:

```text
17 GOALS
    ↓
ONE SHARED FUTURE
```

5. display score summary
6. provide:
   - Play Again
   - Next Level

Respect `prefers-reduced-motion`.

---

# 14. Scoring

MVP scoring should prioritize clarity over complexity.

Display:

- **Moves**
- **Time**
- **Best Moves**
- **Best Time**

Recommended result classification:

```text
EXCELLENT
GREAT
COMPLETED
```

Do not make the classification punitive.

A simple score can be calculated later, but moves and time are the primary metrics.

Do not require an online leaderboard for MVP.

---

# 15. Local Best Scores

For the exhibit tablet, local persistence is acceptable.

Use `localStorage` only for:

- best move count per level
- best time per level
- settings such as sound on/off

No personal information.

Suggested keys:

```text
sdg-escape.best.tuklas
sdg-escape.best.unawa
sdg-escape.best.kilos
sdg-escape.settings
```

Provide a hidden or settings-based **Reset Local Scores** action.

---

# 16. Core UI

Landscape-first layout.

Recommended composition:

```text
┌────────────────────────────────────────────────────┐
│ SDG ESCAPE — UNLOCK 2030      MOVES 18   01:04    │
│                                                    │
│        ┌──────────────────────────────┐            │
│        │                              │            │
│        │          PUZZLE BOARD        │            │
│        │                              │            │
│        └──────────────┐  ┌────────────┘            │
│                       │2030│                        │
│                       └────┘                        │
│                                                    │
│   ↶ Undo        ↺ Restart       ? Hint             │
└────────────────────────────────────────────────────┘
```

The puzzle board should dominate the screen.

Avoid:

- sidebars
- hamburger menus
- dense settings screens
- unnecessary navigation
- long instructions during play

---

# 17. Start Screen

Keep the start screen extremely short.

Show:

> **SDG ESCAPE**  
> **Unlock 2030**

Then one-line instruction:

> Slide the 17 Goals to create a path for Sustainable Development.

Buttons:

- `TUKLAS`
- `UNAWA`
- `KILOS`

Optional:

- `How to Play`

---

# 18. How to Play Overlay

Maximum 3 instructions:

1. **Slide** blocks horizontally or vertically.
2. **Do not rotate** or overlap pieces.
3. Guide the **white Sustainable Development Goals block** through the **2030 exit**.

Add:

> Every Goal matters. Coordinate them to move forward.

Button:

> **START**

---

# 19. Visual Direction

The game should resemble a handcrafted physical tabletop puzzle.

Use:

- plywood / kraft / recycled-board visual language
- recessed board channels
- slightly raised tiles
- subtle shadows
- rounded corners only where appropriate
- tactile pressed/wooden visual treatment
- restrained motion

Do **not** make it look like:

- a corporate dashboard
- a casino game
- a neon arcade
- a generic Material Design settings app

---

# 19A. Primary Visual Target / Fidelity Requirements

A generated concept image should be supplied to the coding agent together with this handoff and treated as the **primary visual-quality reference** for the finished tablet game.

Recommended reference filename:

```text
docs/reference/SDG_ESCAPE_VISUAL_TARGET.png
```

The reference image is **not** an exact geometry specification. It defines the expected **look, feel, hierarchy, material treatment, and presentation quality**.

The implementation should aim to reproduce the following qualities as closely as practical in HTML/CSS/TypeScript:

## 19A.1 Overall Feel

The game should look like a **physical wooden sliding-block puzzle rendered digitally**, not like a normal web application.

Visual qualities:

- warm, tactile wood grain
- handcrafted / recycled-material aesthetic
- recessed puzzle tray
- visibly raised wooden tiles
- believable depth between tiles and tray
- subtle beveling
- soft contact shadows
- engraved or wood-burned frame text
- crisp SDG-colored printed tile faces
- restrained, premium presentation
- warm natural-light impression
- clean, uncluttered composition

The design should communicate:

> **handmade educational exhibit + polished digital tablet game**

rather than:

> **generic browser app with colored rectangles**

## 19A.2 Frame

The outer frame should visually resemble a solid wooden tabletop puzzle frame.

Required visual features:

- thick wooden border
- inset central playing tray
- visible inner groove/recess
- subtle edge bevel
- engraved title at the top:
  - `SDG ESCAPE — UNLOCK 2030`
- engraved or printed footer:
  - `17 Goals. One Shared Future.`
- clearly defined bottom-center exit
- exit labeled:
  - `2030`

The frame may include restrained decorative engravings such as:

- small leaves
- globe motif
- short sustainability phrases

These are optional and must not compete visually with the puzzle itself.

## 19A.3 Playing Tray

The tray should appear recessed below the frame.

Use:

- darker inner wood tone than the frame
- shallow inset shadow
- visible channel logic without drawing a harsh spreadsheet-like grid
- narrow gaps between movable blocks
- enough empty space to make sliding mechanics obvious

The board must remain visually legible even when viewed from several feet away at a booth.

## 19A.4 Puzzle Tiles

Each puzzle tile should look like a small physical wooden block.

Required treatment:

- wood or painted-wood base
- slight bevel or rounded edge
- subtle surface texture
- shallow shadow beneath each block
- responsive pressed/raised state during drag

During pointer interaction:

- selected tile should lift visually by a small amount
- shadow may increase slightly
- invalid movement must not create overlap
- tile should settle/snap back into the tray with a subtle tactile effect

Do not use exaggerated glossy 3D effects.

## 19A.5 SDG Tile Faces

Each SDG 1–17 piece must clearly show:

- SDG number
- short readable SDG title
- recognizable SDG color

Optional if assets are available:

- official SDG iconography

The tile face should use high-contrast white or near-white typography where appropriate.

On small `1×1` tiles, priority order is:

1. SDG number
2. icon, if available
3. short title, only if still readable

On larger tiles, use:

- SDG number
- short title
- optional icon

Avoid overcrowding.

## 19A.6 White Master Tile

The `sdg-master` tile is the visual focal point.

It should:

- be visibly larger than all other pieces
- use warm white / off-white rather than pure digital white
- look like painted or printed wood
- show:

```text
SUSTAINABLE
DEVELOPMENT
GOALS
```

Optionally show a multicolor SDG-wheel-style graphic if a suitable asset is supplied.

This target piece should be immediately understandable as the piece that must reach the 2030 exit.

## 19A.7 2030 Exit

The exit is a core visual feature and must not look like a generic missing border.

It should appear deliberately carved into the wooden frame.

Recommended treatment:

```text
▼ 2030 ▼
```

or equivalent.

The exit should be:

- bottom-center
- exactly aligned to the white 2×2 target tile
- visually distinct
- obvious at first glance
- integrated into the wooden frame

When the target tile reaches the exit, the visual path toward 2030 should feel intentional.

## 19A.8 Secondary Controls

The concept reference may show round wooden control buttons around the puzzle.

Recommended controls:

- `How to Play`
- `Undo`
- `Restart`
- `Hint`
- optional `Settings`

These should visually resemble part of the same handcrafted game rather than standard web buttons.

However:

- the puzzle board remains dominant
- controls must be secondary
- do not clutter the frame
- do not reduce usable puzzle size on tablet

If space is limited, prioritize:

1. Undo
2. Restart
3. Hint
4. How to Play

Settings can be moved to a smaller secondary action.

## 19A.9 Typography

Use a combination of:

- clean condensed sans-serif for SDG tile faces
- engraved/block-style display typography for wooden-frame labels

Typography should be:

- highly legible
- bold enough for public-exhibit use
- not overly decorative

Do not rely on an external web font for offline operation unless it is bundled locally.

## 19A.10 Visual Quality Benchmark

The implementation should not stop at:

- flat brown rectangle
- colored CSS boxes
- plain text labels

The finished board should include enough material treatment to clearly resemble the supplied visual concept.

At minimum, the final polished version should include:

- frame wood texture/treatment
- recessed tray depth
- raised tile depth
- tile contact shadows
- engraved-title treatment
- distinct carved exit
- tactile selected-tile state
- coherent SDG color treatment

CSS gradients, layered shadows, pseudo-elements, and locally bundled texture assets may be used.

Do not depend on remote CDN images for production visuals.

## 19A.11 Visual Reference vs Puzzle Geometry

**Critical distinction:**

> The visual reference defines appearance.  
> The solver defines puzzle geometry.

Do **not** copy the exact block positions shown in the concept art merely to match the image.

The image may contain:

- decorative arrangements
- non-solvable spacing
- illustrative block proportions
- simplified SDG placements

The production board must instead use the solver-verified level data.

Therefore:

- keep the same handcrafted visual language
- keep the same target hierarchy
- keep the same wooden frame and 2030 exit concept
- but render the actual solver-approved positions from `levels.ts`

Never modify verified gameplay geometry just to make a screenshot resemble the visual target.

## 19A.12 Visual Reference Integration

If the coding agent has access to the reference image, place it at:

```text
docs/reference/SDG_ESCAPE_VISUAL_TARGET.png
```

and include a short note in the project README:

> `docs/reference/SDG_ESCAPE_VISUAL_TARGET.png` defines the intended visual direction only. Production puzzle geometry is defined by the solver-verified level configuration.

If the image is unavailable, this section of the handoff remains the authoritative visual specification.

## 19A.13 Screenshot Acceptance Gate

Before declaring visual completion, capture at least one desktop/browser screenshot of:

- TUKLAS start state
- an in-progress board
- win/result state

Compare them manually against the supplied visual target.

The agent should explicitly report whether the build includes:

- [ ] wood-frame treatment
- [ ] recessed tray
- [ ] raised tile depth
- [ ] tactile block shadows
- [ ] correct SDG visual hierarchy
- [ ] white master tile emphasis
- [ ] clearly carved/defined 2030 exit
- [ ] coherent wooden control treatment
- [ ] no generic dashboard appearance

If any of these are missing, visual polish is incomplete.

---

# 20. SDG Tile Design

Each SDG tile must visibly contain:

- SDG number
- short SDG title
- goal color

Optional:

- official icon if supplied

On small `1×1` pieces:

- prioritize the large goal number
- use compact title or icon only if readable

On larger pieces:

- show number + short title

The white target tile should contain:

> **SUSTAINABLE  
> DEVELOPMENT  
> GOALS**

and optionally a multicolor SDG wheel asset.

---

# 21. Audio

Optional but recommended.

Use very short local audio files:

- `slide.mp3`
- `clack.mp3`
- `success.mp3`

Behavior:

- low volume
- no continuous background music required
- sound toggle available
- if assets are absent, the game must still function

Do not block game startup waiting for audio.

---

# 22. Technical Architecture

Recommended repository structure:

```text
sdg-escape/
├─ public/
│  ├─ assets/
│  │  ├─ sdg/
│  │  ├─ audio/
│  │  └─ textures/
│  ├─ icons/
│  └─ manifest.webmanifest
│
├─ src/
│  ├─ main.ts
│  ├─ styles.css
│  │
│  ├─ data/
│  │  ├─ sdgs.ts
│  │  └─ levels.ts
│  │
│  ├─ game/
│  │  ├─ types.ts
│  │  ├─ state.ts
│  │  ├─ movement.ts
│  │  ├─ collision.ts
│  │  ├─ solver.ts
│  │  ├─ scoring.ts
│  │  └─ storage.ts
│  │
│  ├─ ui/
│  │  ├─ board.ts
│  │  ├─ controls.ts
│  │  ├─ dialogs.ts
│  │  └─ results.ts
│  │
│  └─ pwa/
│     └─ registerServiceWorker.ts
│
├─ scripts/
│  └─ verify-levels.ts
│
├─ tests/
│  ├─ movement.test.ts
│  ├─ collision.test.ts
│  ├─ solver.test.ts
│  ├─ levels.test.ts
│  └─ win-condition.test.ts
│
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md
```

Do not add a framework unless there is a clear technical reason.

For MVP, vanilla TypeScript is preferred.

---

# 23. State Model

Suggested state:

```ts
type GameStatus =
  | "menu"
  | "playing"
  | "won"
  | "paused";

type GameState = {
  levelId: string;
  status: GameStatus;
  pieces: PuzzlePiece[];
  moves: number;
  elapsedMs: number;
  history: PuzzlePiece[][];
  hintIndex: number | null;
};
```

The logical board state must be authoritative.

DOM/CSS transforms are only a rendering of that state.

---

# 24. Collision Rules

A piece can move only into cells not occupied by another piece.

Implement helpers such as:

```ts
getOccupiedCells(piece)
canMove(pieceId, direction, state)
getMaxTravel(pieceId, direction, state)
applyMove(pieceId, direction, distance, state)
```

Movement logic should be completely independent of DOM rendering.

This is required for:

- unit tests
- solver
- undo
- hints
- future level generation

---

# 25. Undo

Undo is required.

Behavior:

- maintain stack of prior logical states
- undo one completed drag/move at a time
- decrement move counter
- timer continues
- disable Undo when stack is empty

Restart:

- return level to exact starting state
- reset move count
- reset timer
- clear undo stack

---

# 26. Hint System

MVP hint behavior:

- use the precomputed verified solution path for the current production level
- compare current state against known solution states where possible
- if current state is no longer on the stored path:
  - either compute a local solution
  - or show a generic legal-move hint

Preferred hint UI:

- pulse the recommended tile
- draw a small arrow indicating recommended direction

Do not automatically perform the move.

A hint should help without taking control away from the player.

---

# 27. Timer

Timer starts:

- on first valid move

Timer stops:

- on win

Format:

```text
MM:SS
```

Do not start counting while the player is reading the start screen.

---

# 28. PWA Requirements

The game must be installable to an Android tablet Home Screen.

Required:

- `manifest.webmanifest`
- app name
- short name
- icons
- theme color
- landscape-friendly display
- standalone display mode
- service worker
- offline caching of all production assets

After the game is loaded/installed once, it should run without network access.

Do not require a remote API.

---

# 29. Android / Tablet Requirements

Target first:

- modern Chrome on Android tablet
- landscape orientation
- approximately 10-inch tablet class
- touch-first interaction

Also remain usable on:

- desktop Chrome
- tablet portrait as a graceful fallback

Do not force a viewport size tied to one hardware model.

---

# 30. Responsive Layout

At large landscape widths:

- board centered
- status above
- controls below

At narrow or portrait widths:

- preserve board aspect ratio
- reduce text density
- keep controls tappable
- show optional message:

> Best experienced in landscape.

Do not make the app unusable in portrait.

---

# 31. Accessibility

Minimum requirements:

- sufficient text contrast
- visible keyboard focus
- every control is a real `<button>`
- SDG tiles include accessible labels such as:
  - `SDG 6: Clean Water and Sanitation`
- board status announced after win
- reduced-motion support

Provide keyboard fallback for development/desktop if feasible:

- select piece
- arrow keys to move

Touch remains primary.

---

# 32. No-Backend Constraint

MVP must **not** introduce:

- Firebase
- Supabase
- login
- user profiles
- cloud leaderboard
- analytics SDK
- external database

The goal is a self-contained, low-maintenance exhibit game.

---

# 33. Optional Future Features

Do not implement these before MVP unless explicitly requested:

- local top-10 leaderboard with nickname
- QR-linked educational content
- PSA statistics challenges
- dynamic SDG facts
- multi-tablet competition
- admin configuration
- APK packaging with Capacitor
- kiosk-mode wrapper
- multilingual content
- Davao Occidental / PSA-localized statistics

Design the code so these can be added later.

---

# 34. Test Requirements

Use an automated test runner such as Vitest.

Minimum unit tests:

## Movement

- horizontal block moves through empty cells
- horizontal block cannot move vertically if orientation/space does not permit the intended move rule
- vertical block respects collisions
- block cannot cross board boundary
- target cannot exit through non-exit columns

## Collision

- no overlap after legal move
- occupied-cell calculation correct
- maximum legal travel distance correct

## Undo

- restores prior coordinates
- restores move count
- cannot underflow

## Win Condition

- target aligned above exit is not yet automatically won
- target crossing designated bottom exit triggers win
- target cannot escape elsewhere

## Level Validation

For every production level:

- all pieces inside board
- no starting overlaps
- exactly one target
- all SDGs 1–17 represented exactly once
- solver confirms solvable
- stored minimum move count matches solver result if exact BFS is feasible

---

# 35. Acceptance Criteria

The MVP is complete only when all conditions below pass.

## Gameplay

- [ ] 18 pieces are displayed.
- [ ] SDGs 1–17 each appear exactly once.
- [ ] White master tile appears exactly once.
- [ ] Pieces move only legally.
- [ ] Pieces cannot overlap.
- [ ] Pieces cannot rotate.
- [ ] Pieces cannot leave the board improperly.
- [ ] Target can exit only through the 2030 opening.
- [ ] Win state triggers reliably.

## Controls

- [ ] Touch drag works on Android Chrome.
- [ ] Mouse drag works on desktop.
- [ ] Undo works.
- [ ] Restart works.
- [ ] Hint works or is clearly disabled until implemented.

## Levels

- [ ] TUKLAS is solver-verified.
- [ ] UNAWA is solver-verified.
- [ ] KILOS is solver-verified.
- [ ] Every level has a recorded solution.

## PWA

- [ ] Installable.
- [ ] Runs in standalone mode.
- [ ] Works offline after first install/load.
- [ ] No backend dependency.

## UX

- [ ] Board is readable on a 10-inch Android tablet.
- [ ] No accidental page scroll during piece drag.
- [ ] Controls are large enough for touch.
- [ ] Game can be understood with no facilitator explanation longer than ~10 seconds.
- [ ] Win/restart loop is suitable for repeated booth visitors.

## Quality

- [ ] Automated tests pass.
- [ ] `npm run build` succeeds.
- [ ] No console errors during ordinary play.
- [ ] No network dependency during offline play.

---

# 36. Implementation Order

Use this sequence.

## Phase 1 — Repository Bootstrap

1. Create Vite + TypeScript project.
2. Add lint/test configuration.
3. Add PWA manifest/service worker.
4. Establish directory structure.

## Phase 2 — Pure Puzzle Engine

1. Define types.
2. Implement board occupancy.
3. Implement legal movement.
4. Implement collisions.
5. Implement win condition.
6. Implement undo/restart.
7. Add unit tests.

Do not build polished UI until this phase is reliable.

## Phase 3 — Solver + Levels

1. Implement solver.
2. Create candidate level configurations.
3. Verify solvability.
4. Calculate solution lengths.
5. Select three production levels.
6. Store solution paths.

## Phase 4 — Tablet UI

1. Render board.
2. Render SDG tiles.
3. Implement Pointer Events.
4. Add snapping.
5. Add timer/moves.
6. Add controls.
7. Add start/results overlays.

## Phase 5 — Visual Polish

1. Wood/recycled-board treatment.
2. Tile shadows.
3. SDG typography.
4. optional sound.
5. success animation.
6. reduced-motion handling.

## Phase 6 — Offline / PWA Validation

1. Build production bundle.
2. install on Android tablet.
3. disable internet.
4. reload/reopen game.
5. verify all assets remain available.

## Phase 7 — Booth QA

Test with people unfamiliar with the project.

Observe:

- can they understand dragging?
- do they recognize the exit?
- can they identify the white target?
- do they accidentally scroll?
- is the easiest level too long?
- does the game reset quickly for the next visitor?

---

# 37. Performance Requirements

The app is small enough that performance should be straightforward.

Still enforce:

- no heavy game engine unless required
- no continuous physics loop
- no unnecessary canvas renderer
- no large remote images
- no runtime network calls
- use CSS transforms for tile movement
- maintain game logic in logical grid coordinates

Target:

- instant local interaction
- smooth dragging on ordinary Android tablets
- production bundle kept reasonably small

---

# 38. Recommended Technical Choice

For this specific game, **do not use Phaser for the first implementation**.

The puzzle does not require:

- real physics
- complex collision bodies
- sprite animation systems
- particle simulation

A DOM/CSS + TypeScript implementation is simpler, cheaper, easier to test, and easier to maintain.

Use Phaser only if later visual requirements justify it.

---

# 39. Educational Copy

Use short copy only.

Start:

> **17 Goals. One Shared Future.**

Instruction:

> **Slide the Goals and create a path toward 2030.**

Win:

> **2030 UNLOCKED**

Then:

> Sustainable development depends on progress across interconnected goals.

Optional booth tie-in:

> **TUKLAS → UNAWA → KILOS**

---

# 40. Definition of Done for Initial Handoff

The coding agent should stop and report after producing:

1. working repository
2. three solver-verified levels
3. functional touch/mouse sliding
4. undo/restart
5. timer and move count
6. win sequence
7. local best score
8. offline PWA behavior
9. automated tests
10. build instructions
11. Android tablet testing instructions
12. clean README
13. visual implementation that follows Section 19A and, when supplied, the visual target image
14. screenshots or equivalent visual QA evidence for start, in-progress, and win/result states

Do not silently expand scope.

---

# 41. Coding-Agent Working Rules

The agent implementing this should:

1. Inspect the repository before editing.
2. State the current branch and working-tree status.
3. Avoid overwriting unrelated files.
4. Implement in small coherent commits where Git is available.
5. Keep puzzle rules in pure TypeScript modules.
6. Add tests together with logic changes.
7. Never claim a level is solvable without solver verification.
8. Never claim Android/PWA behavior was physically tested unless it actually was.
9. Distinguish automated browser checks from real-device testing.
10. Report any assumptions clearly.
11. Keep the MVP backend-free.
12. Stop if an existing project architecture conflicts materially with this specification and report the conflict before refactoring broadly.

---

# 42. Suggested Commands

A typical initial setup may use:

```bash
npm create vite@latest sdg-escape -- --template vanilla-ts
cd sdg-escape
npm install
npm install -D vitest
```

Then add PWA support either through a lightweight Vite PWA plugin or a small explicit service-worker implementation.

Expected scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "verify:levels": "tsx scripts/verify-levels.ts"
  }
}
```

Exact dependencies may be adjusted by the coding agent.

Avoid adding packages merely for convenience.

---

# 43. Final Handoff Prompt for Codex / Claude Code

Paste the following after placing this specification in the repository as:

```text
docs/SDG_ESCAPE_IMPLEMENTATION_HANDOFF.md
```

---

## AGENT PROMPT

Implement the project described in `docs/SDG_ESCAPE_IMPLEMENTATION_HANDOFF.md`.

Treat that document as the product and acceptance specification.

Start by inspecting the repository and reporting:

1. current branch
2. HEAD commit if Git exists
3. working-tree status
4. current project structure
5. whether this is a new project or an existing app
6. any conflicts between the current architecture and the specification

Then implement the MVP in the phases defined in the handoff.

Important constraints:

- Keep the application backend-free.
- Use Vite + TypeScript unless the existing repository already has an equally suitable lightweight stack.
- Keep puzzle mechanics independent from rendering.
- Do not manually assume level solvability.
- Implement a solver/verification path and verify all three production levels.
- Use Pointer Events for tablet/mouse interaction.
- Make the app installable and offline-capable as a PWA.
- Do not add Firebase, authentication, cloud storage, analytics, or a remote leaderboard.
- Do not copy Dilemma Games branding, artwork, story, or proprietary board design.
- Preserve the SDG theme and the `TUKLAS → UNAWA → KILOS` progression.
- If `docs/reference/SDG_ESCAPE_VISUAL_TARGET.png` is present, treat it as the primary visual target. Match its tactile wooden-board feel, visual hierarchy, raised SDG tile treatment, recessed tray, engraved frame, and carved 2030 exit as closely as practical in HTML/CSS/TypeScript.
- Do **not** copy the reference image's exact tile arrangement. Use only the solver-verified level geometry.
- The finished UI must look like a physical handcrafted wooden puzzle rendered digitally, not like a generic web dashboard.
- Add automated tests for movement, collision, undo, win logic, and level validity.
- Do not claim physical Android testing unless a physical device was actually used.

Work in small coherent steps.

After implementation, run all available checks, including at minimum:

```bash
npm test
npm run build
npm run verify:levels
```

If the actual script names differ, report the exact commands used.

Then provide a completion report containing:

- files created/changed
- architecture summary
- three level IDs and verified minimum/solution move counts
- test results
- production build result
- PWA/offline implementation summary
- visual-fidelity report against Section 19A and the supplied visual target
- screenshots or paths for the TUKLAS start state, in-progress state, and win/result state
- any items requiring real Android-tablet verification
- exact local run instructions
- exact install-on-tablet instructions
- remaining optional enhancements

Do not expand into optional future features until the MVP acceptance criteria are satisfied.

---

# 44. Recommended Agent Choice

This handoff is deliberately tool-agnostic and can be given to either **Codex** or **Claude Code**.

For a repository-first implementation, choose whichever agent currently has direct access to the target project and can run:

- Git
- npm
- tests
- production builds

Do not split the first MVP implementation between two coding agents. Use one agent as the primary implementer to avoid conflicting architectural changes.

A second agent can be used later for an independent code review or QA pass.

---

# 45. Recommended First Milestone

The first milestone should **not** be the polished SDG artwork.

The first proof should be:

> A plain 6×6 board with 18 labeled blocks, legal sliding, collision prevention, undo, a verified solvable level, and a working target exit.

Once that passes, apply the SDG visual design.

This prevents visual work from hiding defects in the actual puzzle mechanics.
