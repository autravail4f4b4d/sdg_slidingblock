# SDG ESCAPE — Level Quality & Anti-Shuttle Handoff
## Preventing Artificial Difficulty in Solver-Verified Levels

**Project:** SDG Escape — Unlock 2030  
**Repo:** `D:\dev\sdg_game_slide_block`  
**Scope:** Add a second-stage **solution-quality filter** so production levels are not selected by minimum move count alone.

---

# 1. Problem

A level can satisfy the target minimum move count and still be poor for visitors.

Example:

```text
KILOS minimum = 55 moves
```

This is not automatically a good puzzle.

A poor 55-move solution may consist mostly of:

```text
tile 6
tile 9
tile 13
tile 6
tile 9
tile 13
...
```

with the same few tiles repeatedly shuttled back and forth.

That produces **solver depth** without a satisfying **visitor experience**.

Production level selection must therefore use two distinct gates:

```text
GATE 1 — Exact difficulty
Solver proves minimum-move distance.

GATE 2 — Puzzle quality
Optimal solution is sufficiently diverse, non-repetitive, and dependency-rich.
```

A level must pass both.

---

# 2. Core Principle

Do not select production puzzles by `minimumMoves` alone.

Use:

```text
candidate
    ↓
exact solver
    ↓
minimum inside level band?
    ↓
solution-quality analysis
    ↓
manual playtest
    ↓
production level
```

The solver answers **how many moves are required**.  
The quality analyzer answers **whether those moves are interesting**.  
Manual UAT answers **whether the puzzle is actually enjoyable**.

---

# 3. Production Difficulty Bands

Retain:

| Level | Exact minimum target |
|---|---:|
| TUKLAS | 10–20 |
| UNAWA | 25–40 |
| KILOS | 50–80 |

These remain the first filter.

---

# 4. Required Solution-Quality Metrics

For every solver-verified candidate, analyze at least one optimal path.

Recommended shape:

```ts
type SolutionQualityMetrics = {
  totalMoves: number;
  distinctPiecesMoved: number;
  moveCountByPiece: Record<string, number>;
  maxSinglePieceShare: number;
  topThreePieceShare: number;
  immediateReversalCount: number;
  immediateReversalRate: number;
  repeatedShuttleCycleCount: number;
  longestSamePieceStreak: number;
  horizontalMoves: number;
  verticalMoves: number;
  phaseDiversity?: number;
};
```

---

# 5. Distinct Pieces Moved

Count how many different pieces participate in the optimal path.

Initial minimums:

```yaml
tuklas:
  min_distinct_pieces: 5

unawa:
  min_distinct_pieces: 7

kilos:
  min_distinct_pieces: 8
```

Do **not** require all 18 pieces to move. Some static anchor pieces are acceptable.

---

# 6. Single-Piece Concentration

Calculate:

```text
moves by most-used piece
────────────────────────
total solution moves
```

Recommended starting limits:

```yaml
tuklas:
  max_single_piece_share: 0.35
unawa:
  max_single_piece_share: 0.30
kilos:
  max_single_piece_share: 0.25
```

For KILOS, no single piece should normally account for more than about 25% of the optimal path.

---

# 7. Top-Three Piece Concentration

Calculate:

```text
moves by the 3 most-used pieces
────────────────────────────────
total solution moves
```

Suggested thresholds:

```yaml
tuklas:
  max_top_three_share: 0.75
unawa:
  max_top_three_share: 0.65
kilos:
  max_top_three_share: 0.55
```

Example:

```text
top 3 pieces = 23 moves
total         = 58
share         = 39.7%
```

This is healthier than:

```text
top 3 pieces = 45 moves
total         = 58
share         = 77.6%
```

---

# 8. Immediate Reversal Detection

Detect:

```text
9 UP
9 DOWN
```

or:

```text
13 LEFT
13 RIGHT
```

Implement something equivalent to:

```ts
function isImmediateReverse(a: Move, b: Move): boolean
```

Recommended limits:

```yaml
tuklas:
  max_immediate_reversal_rate: 0.18
unawa:
  max_immediate_reversal_rate: 0.15
kilos:
  max_immediate_reversal_rate: 0.12
```

A few reversals are normal. Reversal-heavy paths are not.

---

# 9. Delayed Reversal / Shuttle Detection

Also detect short shuttle structures such as:

```text
9 UP
6 LEFT
9 DOWN
```

or:

```text
9 UP
6 LEFT
13 DOWN
9 DOWN
```

Canonicalize moves as:

```text
pieceId:direction:distance
```

Analyze windows of approximately:

```text
3–6 moves
```

The goal is to detect repeated cycles, not to penalize every temporary reposition.

---

# 10. Repeated Shuttle Cycle Detection

Example poor path:

```text
9 UP
6 LEFT
9 DOWN
6 RIGHT

9 UP
6 LEFT
9 DOWN
6 RIGHT

9 UP
6 LEFT
9 DOWN
6 RIGHT
```

Implement:

```ts
function countRepeatedMoveWindows(
  moves: Move[],
  minWindow = 3,
  maxWindow = 6
): number
```

Recommended starting limit:

```yaml
max_identical_shuttle_cycles: 2
```

Repeated cycling should strongly penalize or reject the candidate.

---

# 11. Longest Same-Piece Streak

Measure the longest consecutive run using the same piece.

Recommended thresholds:

```yaml
tuklas:
  max_consecutive_moves_same_piece: 5
unawa:
  max_consecutive_moves_same_piece: 4
kilos:
  max_consecutive_moves_same_piece: 4
```

---

# 12. Direction Diversity

Track:

```text
horizontalMoves
verticalMoves
```

Optional diagnostic:

```ts
directionMinorityShare =
  Math.min(horizontalMoves, verticalMoves) / totalMoves;
```

Suggested warning threshold:

```yaml
warn_if_direction_minority_share_below: 0.15
```

Use as a warning initially, not a hard failure.

---

# 13. Phase Diversity

A satisfying puzzle should tend to progress through stages.

Example:

```text
Phase 1 — Clear upper-left region
Phase 2 — Reposition central blocks
Phase 3 — Create space beside master tile
Phase 4 — Open lower corridor
Phase 5 — Move master toward 2030
```

Approximate phase diversity by splitting an optimal path into windows of roughly 8–10 moves and comparing:

- unique pieces in each window
- dominant pieces in each window
- changes in participating pieces between adjacent windows

Use phase diversity primarily for ranking at first.

---

# 14. Master-Tile Progression

Track:

```text
master first moved at move N
master total moves
master movement phases
distance-to-exit progression
```

Do not impose a hard threshold initially. Use it to compare finalists.

---

# 15. Multiple Optimal Solutions

The solver may return one arbitrary shortest path.

A good board should not be rejected merely because that one path is repetitive if other equally short paths are more diverse.

For finalists:

1. compute exact minimum distance
2. retain enough predecessor information to recover alternative shortest paths
3. sample multiple distinct optimal paths
4. analyze quality across the sample

Suggested sample:

```text
10–50 distinct optimal paths
```

subject to solver cost.

---

# 16. Aggregate Multi-Path Evaluation

For sampled optimal paths, use median metrics.

Example:

```text
Candidate K-17
minimum moves: 58
sampled optimal paths: 20

median distinct pieces:       10
median top-3 share:           0.43
median reversal rate:         0.07
median max same-piece streak: 3
```

Prefer candidates whose quality remains acceptable across multiple shortest solutions.

---

# 17. Initial Threshold Configuration

Use as a starting point:

```yaml
tuklas:
  minimum_moves:
    min: 10
    max: 20
  min_distinct_pieces: 5
  max_single_piece_share: 0.35
  max_top_three_share: 0.75
  max_immediate_reversal_rate: 0.18
  max_identical_shuttle_cycles: 2
  max_consecutive_moves_same_piece: 5

unawa:
  minimum_moves:
    min: 25
    max: 40
  min_distinct_pieces: 7
  max_single_piece_share: 0.30
  max_top_three_share: 0.65
  max_immediate_reversal_rate: 0.15
  max_identical_shuttle_cycles: 2
  max_consecutive_moves_same_piece: 4

kilos:
  minimum_moves:
    min: 50
    max: 80
  min_distinct_pieces: 8
  max_single_piece_share: 0.25
  max_top_three_share: 0.55
  max_immediate_reversal_rate: 0.12
  max_identical_shuttle_cycles: 2
  max_consecutive_moves_same_piece: 4
```

These are tunable engineering defaults, not permanent mathematical rules.

---

# 18. Candidate Evaluation Pipeline

Implement approximately:

```text
GENERATE CANDIDATE
        │
        ▼
EXACT SOLVER
        │
        ▼
SOLVABLE?
   no ───────► reject
        │ yes
        ▼
MINIMUM IN TARGET BAND?
   no ───────► reject
        │ yes
        ▼
ANALYZE OPTIMAL PATH
        │
        ▼
QUALITY HARD GATES PASS?
   no ───────► reject
        │ yes
        ▼
OPTIONAL MULTI-PATH ANALYSIS
        │
        ▼
QUALITY RANKING
        │
        ▼
KEEP TOP FINALISTS
        │
        ▼
MANUAL PLAYTEST
        │
        ▼
PRODUCTION LEVEL
```

---

# 19. Candidate Ranking

After hard gates, rank surviving candidates internally using:

1. exact minimum inside preferred range
2. distinct-piece participation
3. low top-three concentration
4. low reversal rate
5. low repeated-shuttle count
6. stronger phase diversity
7. healthy master-tile progression

Do not expose this engineering rank to players.

---

# 20. Avoid Over-Optimization

Do not require:

```text
all 18 pieces must move
```

or:

```text
every piece must move equally
```

The objective is **purposeful dependency**, not uniformity.

Static anchor pieces are acceptable.

---

# 21. Manual Finalist Review

Keep roughly 5–10 finalists per difficulty after automated filtering.

## TUKLAS

Check:

- understandable quickly
- not trivial
- no repetitive fiddling
- satisfying opening of the 2030 path

## UNAWA

Check:

- clear dependency chain
- requires planning
- at least one non-obvious reposition
- no dominant shuttle loop

## KILOS

Check:

- genuinely challenging
- several interacting regions/pieces
- strategic temporary displacement
- no small group dominates most of the experience
- Hint remains useful
- completion feels earned rather than tedious

---

# 22. Suggested Module Structure

Keep quality analysis separate from exact solving.

```text
src/game/
├─ solver.ts
├─ solutionQuality.ts
├─ candidateGenerator.ts
└─ levelSelection.ts
```

Suggested APIs:

```ts
analyzeSolutionQuality(
  solution: Move[],
  level: PuzzleLevel
): SolutionQualityMetrics
```

```ts
passesQualityGate(
  metrics: SolutionQualityMetrics,
  thresholds: QualityThresholds
): boolean
```

```ts
rankCandidate(
  metrics: SolutionQualityMetrics,
  thresholds: QualityThresholds
): number
```

The rank remains internal.

---

# 23. Tests

Add focused tests for:

## Move concentration

- move counts per piece
- max single-piece share
- top-three share

## Reversals

- immediate reverse detected
- unrelated moves not falsely detected
- reversal rate correct

## Shuttle cycles

Given:

```text
9:U
6:L
9:D
6:R
9:U
6:L
9:D
6:R
```

the analyzer must detect a repeated shuttle pattern.

## Distinct pieces

Count unique moved pieces correctly.

## Same-piece streak

Detect longest consecutive same-piece run.

## Threshold gates

Create synthetic:

- good solution
- concentrated solution
- reversal-heavy solution
- shuttle-loop solution

Verify expected pass/fail behavior.

---

# 24. Candidate Verification Report

Extend candidate output with quality metrics.

Accepted example:

```text
KILOS CANDIDATE K-17

Exact minimum:             58
Distinct pieces:           10
Largest single share:      17.2%
Top-three share:           43.1%
Immediate reversal rate:    6.9%
Repeated shuttle cycles:    0
Longest same-piece streak:  3

Difficulty gate: PASS
Quality gate:    PASS
```

Rejected example:

```text
KILOS CANDIDATE K-31

Exact minimum:             61
Distinct pieces:            5
Largest single share:      29.5%
Top-three share:           73.8%
Immediate reversal rate:   18.0%
Repeated shuttle cycles:    4
Longest same-piece streak:  6

Difficulty gate: PASS
Quality gate:    FAIL

Reasons:
- insufficient piece participation
- top-three concentration too high
- excessive reversals
- repeated shuttle cycles
```

Rejection must be auditable.

---

# 25. Production Acceptance Rule

A production level is acceptable only when:

```text
EXACT DIFFICULTY PASS
        +
QUALITY FILTER PASS
        +
MANUAL UAT PASS
```

All three are required.

---

# 26. Parallel Engineering Plan

After solver state representation is stable:

```text
                 ┌──────────────────────┐
                 │ Existing exact solver │
                 └──────────┬───────────┘
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
┌────────────────────────┐     ┌─────────────────────────┐
│ A. Quality metrics     │     │ B. Candidate generation│
│ + shuttle detection    │     │ + exact difficulty     │
└────────────┬───────────┘     └────────────┬────────────┘
             │                              │
             └──────────────┬───────────────┘
                            ▼
                ┌────────────────────────┐
                │ C. Candidate filtering │
                │ + ranking              │
                └────────────┬───────────┘
                             ▼
                ┌────────────────────────┐
                │ D. Multi-path analysis │
                │ for finalists          │
                └────────────┬───────────┘
                             ▼
                ┌────────────────────────┐
                │ E. Manual playtest     │
                └────────────────────────┘
```

Token-efficient agent behavior:

- inspect only solver, level, move-model, and candidate files needed
- do not reopen unrelated UI/CSS
- use focused tests while implementing
- run full suite only at integration gates
- report metric summaries rather than dumping candidate states

---

# 27. Non-Goals

Do not modify:

- landing page
- typography
- wooden visual theme
- drag interaction
- PWA configuration
- Android packaging
- Vercel deployment
- scoring UI
- game copy

This pass is strictly about:

```text
level quality
candidate filtering
anti-shuttle detection
manual finalist selection
```

---

# 28. Definition of Done

Complete only when:

- [ ] Solution-quality analyzer exists.
- [ ] Distinct-piece metric exists.
- [ ] Single-piece concentration exists.
- [ ] Top-three concentration exists.
- [ ] Immediate reversal detection exists.
- [ ] Repeated shuttle detection exists.
- [ ] Same-piece streak detection exists.
- [ ] TUKLAS/UNAWA/KILOS thresholds are configurable.
- [ ] Candidate generator rejects poor-quality solutions.
- [ ] Candidate reports explain rejection reasons.
- [ ] Promising candidates can be ranked.
- [ ] Multi-optimal-path analysis is implemented for finalists if computationally practical.
- [ ] Automated tests cover all hard-gate metrics.
- [ ] Final production candidates are manually playtested before promotion.
- [ ] No production level is selected solely because it has a high move count.

---

# 29. Brief Codex / Claude Code Handoff

Implement `docs/SDG_ESCAPE_LEVEL_QUALITY_FILTERS.md`.

Keep the exact solver authoritative for minimum move count, but add a second candidate-quality gate so long solutions dominated by a few repeatedly shuttled pieces are rejected.

Implement, at minimum:

- distinct pieces moved
- maximum single-piece move share
- top-three piece move share
- immediate reversal rate
- repeated 3–6 move shuttle-cycle detection
- longest same-piece streak
- configurable thresholds for TUKLAS / UNAWA / KILOS
- auditable candidate pass/fail reports
- focused unit tests

Do not alter UI, typography, dragging, PWA behavior, or visual design.

Use the dependency graph in Section 26 where safe. Keep context usage targeted.

After implementation, report:

- files changed
- metric definitions
- threshold configuration
- test results
- sample accepted/rejected candidate reports
- whether multi-optimal-path sampling is computationally practical with the current solver
- thresholds that should be tuned after manual UAT
