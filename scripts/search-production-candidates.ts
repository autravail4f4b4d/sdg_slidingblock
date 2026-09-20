import { goalAlignedPieces, legacySmokeLayouts } from "../src/data/smokeFixtures";
import { denseCandidateOrigin, kilosSevenRowOrigin } from "../src/data/candidateLevels";
import { formatCandidateReport, type CandidateReport } from "../src/game/levelSelection";
import { applyMove, targetCanExit } from "../src/game/movement";
import { legalMoves, solveLevelWithStats, stateKey } from "../src/game/solver";
import { analyzeSolutionQuality, passesQualityGate, qualityThresholds } from "../src/game/solutionQuality";
import type { Direction, Move, PuzzleLevel, PuzzlePiece } from "../src/game/types";

type Target = PuzzleLevel["id"];

const target = (process.argv[2] ?? "tuklas") as Target;
const attempts = Number(process.argv[3] ?? 40);
const stateBudget = Number(process.argv[4] ?? 8_000_000);
const startAttempt = Number(process.argv[5] ?? 0);
const originMode = process.argv[6] ?? "structured";
const direct = process.argv[7] === "direct";
const selfAvoiding = process.argv[8] !== "non-avoiding";
const summaryOnly = process.argv[9] === "summary";
const discoveryMode = process.argv[10] ?? "random";
const frontierStateLimit = Number(process.argv[11] ?? 20_000);
const settings: Record<Target, { minSteps: number; maxSteps: number; seed: number }> = {
  tuklas: { minSteps: 18, maxSteps: 72, seed: 0x51a7 },
  unawa: { minSteps: 60, maxSteps: 180, seed: 0x71a8 },
  kilos: { minSteps: 160, maxSteps: 480, seed: 0x91a9 },
};
// Development-only discovery bands for the established 6x6 dense topology.
// Production difficulty thresholds remain owned by solutionQuality.ts.
const provisionalDiscoveryBands: Record<Target, { min: number; max: number }> = {
  tuklas: { min: 10, max: 18 },
  unawa: { min: 18, max: 24 },
  kilos: { min: 24, max: 30 },
};

if (!(target in settings) || !Number.isInteger(attempts) || attempts < 1 || !Number.isInteger(stateBudget) || stateBudget < 1 || !Number.isInteger(startAttempt) || startAttempt < 0 || !Number.isInteger(frontierStateLimit) || frontierStateLimit < 1 || !["structured", "legacy", "classic-core", "dense", "kilos-6x7"].includes(originMode) || !["random", "frontier"].includes(discoveryMode) || (originMode === "kilos-6x7" && target !== "kilos")) {
  throw new Error("Usage: vite-node scripts/search-production-candidates.ts <tuklas|unawa|kilos> [attempts] [stateBudget] [startAttempt] [structured|legacy|classic-core|dense|kilos-6x7] [direct] [selfAvoiding] [summary] [random|frontier] [frontierStateLimit]");
}

const opposite: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };
const clonePieces = (pieces: PuzzlePiece[]) => pieces.map((piece) => ({ ...piece }));

function random(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 2 ** 32;
  };
}

/**
 * Starts from a known solvable state and makes a deterministic non-backtracking
 * legal walk. Its length is only a candidate source: evaluateCandidate proves
 * the actual minimum before a result is printed as a finalist.
 */
function reverseScramble(origin: PuzzleLevel, seed: number, steps: number): PuzzlePiece[] {
  const rng = random(seed);
  let pieces = clonePieces(origin.pieces);
  let previous: Move | null = null;
  const visited = new Set([stateKey(pieces)]);
  for (let index = 0; index < steps; index += 1) {
    const all = legalMoves(pieces, origin);
    const choices = all.filter((move) => {
      if (previous && move.pieceId === previous.pieceId && move.direction === opposite[previous.direction]) return false;
      const next = applyMove(move.pieceId, move.direction, move.distance, pieces, origin);
      return !selfAvoiding || !visited.has(stateKey(next));
    });
    if (choices.length === 0) break;
    const move = choices[Math.floor(rng() * choices.length)];
    pieces = applyMove(move.pieceId, move.direction, move.distance, pieces, origin); visited.add(stateKey(pieces));
    previous = move;
  }
  return pieces;
}

type ReverseFrontierState = { pieces: PuzzlePiece[]; reverseDepth: number };

/**
 * Breadth-first reverse discovery expands each reachable state once, then
 * returns the deepest non-goal states first. This deliberately prioritises
 * novel, distant candidates; only the exact forward solver establishes their
 * true minimum.
 */
function discoverDeepReverseStates(origin: PuzzleLevel, candidateCount: number, maxDepth = 70, maxStates = 20_000): { candidates: ReverseFrontierState[]; discoveredStates: number; deepestReverseDepth: number } {
  const root = clonePieces(origin.pieces);
  const queue: ReverseFrontierState[] = [{ pieces: root, reverseDepth: 0 }];
  const seen = new Set([stateKey(root)]);
  const candidates: ReverseFrontierState[] = [];
  let deepestReverseDepth = 0;

  for (let cursor = 0; cursor < queue.length && queue.length < maxStates; cursor += 1) {
    const current = queue[cursor];
    if (current.reverseDepth >= maxDepth) continue;
    for (const move of legalMoves(current.pieces, origin)) {
      const nextPieces = applyMove(move.pieceId, move.direction, move.distance, current.pieces, origin);
      const key = stateKey(nextPieces);
      if (seen.has(key)) continue;
      seen.add(key);
      const next: ReverseFrontierState = { pieces: nextPieces, reverseDepth: current.reverseDepth + 1 };
      queue.push(next);
      deepestReverseDepth = Math.max(deepestReverseDepth, next.reverseDepth);
      if (!targetCanExit(nextPieces, origin)) candidates.push(next);
      if (queue.length >= maxStates) break;
    }
  }

  return {
    candidates: candidates.sort((left, right) => right.reverseDepth - left.reverseDepth || stateKey(left.pieces).localeCompare(stateKey(right.pieces))).slice(0, candidateCount),
    discoveredStates: queue.length,
    deepestReverseDepth,
  };
}

const structuredOrigin: PuzzleLevel = {
  id: "tuklas",
  name: "goal-aligned search origin",
  description: "non-public",
  boardWidth: 6,
  boardHeight: 6,
  exitColumns: [2, 3],
  pieces: clonePieces(goalAlignedPieces),
};
const classicCoreOrigin: PuzzleLevel = {
  id: "tuklas",
  name: "classic core search origin",
  description: "non-public",
  boardWidth: 6,
  boardHeight: 6,
  exitColumns: [2, 3],
  pieces: [
    { id: "sdg-1", sdg: 1, x: 1, y: 0, width: 1, height: 2 }, { id: "sdg-2", sdg: 2, x: 4, y: 0, width: 1, height: 2 },
    { id: "sdg-3", sdg: 3, x: 0, y: 0, width: 1, height: 2 }, { id: "sdg-4", sdg: 4, x: 5, y: 0, width: 1, height: 2 },
    { id: "sdg-5", sdg: 5, x: 0, y: 2, width: 1, height: 2 }, { id: "sdg-6", sdg: 6, x: 2, y: 2, width: 2, height: 1 },
    { id: "sdg-7", sdg: 7, x: 2, y: 4, width: 2, height: 1 }, { id: "sdg-8", sdg: 8, x: 0, y: 5, width: 2, height: 1 },
    { id: "sdg-9", sdg: 9, x: 2, y: 5, width: 2, height: 1 }, { id: "sdg-10", sdg: 10, x: 4, y: 5, width: 2, height: 1 },
    { id: "sdg-11", sdg: 11, x: 2, y: 3, width: 1, height: 1 }, { id: "sdg-12", sdg: 12, x: 3, y: 3, width: 1, height: 1 },
    { id: "sdg-13", sdg: 13, x: 1, y: 4, width: 1, height: 1 }, { id: "sdg-14", sdg: 14, x: 4, y: 4, width: 1, height: 1 },
    { id: "sdg-15", sdg: 15, x: 5, y: 2, width: 1, height: 1 }, { id: "sdg-16", sdg: 16, x: 5, y: 3, width: 1, height: 1 },
    { id: "sdg-17", sdg: 17, x: 0, y: 4, width: 1, height: 1 }, { id: "sdg-master", x: 2, y: 0, width: 2, height: 2, target: true },
  ],
};
const legacyOrigin = legacySmokeLayouts[{ tuklas: 0, unawa: 1, kilos: 2 }[target]];
const origin = originMode === "legacy" ? legacyOrigin : originMode === "classic-core" ? classicCoreOrigin : originMode === "dense" ? denseCandidateOrigin : originMode === "kilos-6x7" ? kilosSevenRowOrigin : structuredOrigin;
const config = originMode === "kilos-6x7" ? { ...settings.kilos, minSteps: 30, maxSteps: 60 } : settings[target];
const exactDiscoveryRange = originMode === "kilos-6x7" ? { min: 30, max: 60 } : null;
const provisionalDiscoveryBand = originMode === "dense" ? provisionalDiscoveryBands[target] : null;
const frontierDiscovery = discoveryMode === "frontier"
  ? discoverDeepReverseStates(origin, attempts + startAttempt, originMode === "kilos-6x7" ? 60 : 70, frontierStateLimit)
  : null;
const frontierCandidates = frontierDiscovery?.candidates.slice(startAttempt, startAttempt + attempts) ?? [];
const candidateIterations = frontierDiscovery ? frontierCandidates.length : attempts;
let accepted = 0;
let proven = 0;
let unproven = 0;
let totalStates = 0;
let totalElapsedMs = 0;
const depthCounts = new Map<number, number>();
let best: { report: CandidateReport; states: number; elapsedMs: number } | null = null;
let deepest: { report: CandidateReport; states: number; elapsedMs: number } | null = null;
let alreadyExitAligned = 0;
let alreadyExitAlignedQualityPasses = 0;
let alreadyExitAlignedQualityReasons: string[] = [];
let exactDiscoveryRangeCount = 0;
let provisionalExactCount = 0;
type ProvisionalFinalist = { report: CandidateReport; states: number; elapsedMs: number; rank: number };
const provisionalFinalists: ProvisionalFinalist[] = [];

function provisionalRank(exactMinimum: number, metrics: ReturnType<typeof analyzeSolutionQuality>, band: { min: number; max: number }): number {
  const centre = (band.min + band.max) / 2;
  // This is selection-only: the existing quality gate determines eligibility.
  return 100 + metrics.distinctPiecesMoved * 3 - metrics.topThreePieceShare * 30 - metrics.immediateReversalRate * 20 - metrics.repeatedShuttleCycleCount * 8 - Math.abs(exactMinimum - centre) * .25;
}

for (let localAttempt = 0; localAttempt < candidateIterations; localAttempt += 1) {
  const attempt = startAttempt + localAttempt;
  const frontierCandidate = frontierDiscovery ? frontierCandidates[localAttempt] : undefined;
  const seed = (config.seed + attempt * 0x9e3779b9) >>> 0;
  const rng = random(seed);
  const steps = direct ? 0 : config.minSteps + Math.floor(rng() * (config.maxSteps - config.minSteps + 1));
  const candidateId = frontierCandidate ? `${target}-frontier-r${frontierCandidate.reverseDepth}-${attempt}` : `${target}-${seed.toString(16)}-${steps}`;
  const candidateLabel = frontierCandidate ? `frontier r${frontierCandidate.reverseDepth} #${attempt}` : seed.toString(16);
  const candidate: PuzzleLevel = {
    ...origin,
    id: target,
    name: target.toUpperCase(),
    pieces: frontierCandidate ? clonePieces(frontierCandidate.pieces) : direct ? clonePieces(origin.pieces) : reverseScramble(origin, seed, steps),
    minimumMoves: undefined,
    solution: undefined,
  };
  if (targetCanExit(candidate.pieces, candidate)) {
    const stats = solveLevelWithStats(candidate, stateBudget);
    alreadyExitAligned += 1;
    proven += 1;
    depthCounts.set(0, (depthCounts.get(0) ?? 0) + 1);
    totalStates += stats.statesEnqueued;
    totalElapsedMs += stats.elapsedMs;
    const quality = passesQualityGate(analyzeSolutionQuality([]), qualityThresholds[target]);
    if (quality.pass) alreadyExitAlignedQualityPasses += 1;
    else alreadyExitAlignedQualityReasons = quality.reasons;
    continue;
  }
  const stats = solveLevelWithStats(candidate, stateBudget);
  totalStates += stats.statesEnqueued;
  totalElapsedMs += stats.elapsedMs;
  if (!stats.solution) {
    unproven += 1;
    if (!summaryOnly) console.error(`${target.toUpperCase()} ${candidateLabel}: not proven (${stats.statesEnqueued.toLocaleString()} states, ${stats.elapsedMs.toFixed(1)} ms${stats.hitStateLimit ? ", limit" : ""})`);
    continue;
  }
  const solution = stats.solution;
  proven += 1;
  depthCounts.set(solution.length, (depthCounts.get(solution.length) ?? 0) + 1);
  if (exactDiscoveryRange && solution.length >= exactDiscoveryRange.min && solution.length <= exactDiscoveryRange.max) exactDiscoveryRangeCount += 1;
  const thresholds = qualityThresholds[target];
  const metrics = analyzeSolutionQuality(solution);
  const quality = passesQualityGate(metrics, thresholds);
  const reasons = quality.reasons;
  const report: CandidateReport = {
    candidateId,
    levelId: target,
    exactMinimum: solution.length,
    solution,
    metrics,
    quality,
    rank: null,
    reasons,
  };
  if (provisionalDiscoveryBand && solution.length >= provisionalDiscoveryBand.min && solution.length <= provisionalDiscoveryBand.max) {
    provisionalExactCount += 1;
    if (quality.pass) {
      provisionalFinalists.push({
        report,
        states: stats.statesEnqueued,
        elapsedMs: stats.elapsedMs,
        rank: provisionalRank(solution.length, metrics, provisionalDiscoveryBand),
      });
    }
  }
  if (!deepest || solution.length > (deepest.report.exactMinimum ?? -1)) deepest = { report, states: stats.statesEnqueued, elapsedMs: stats.elapsedMs };
  if (!summaryOnly) console.error(`${target.toUpperCase()} ${candidateLabel}: ${solution.length} moves, ${stats.statesEnqueued.toLocaleString()} states, ${stats.elapsedMs.toFixed(1)} ms${quality.pass ? " QUALITY PASS" : ""}`);
  if (!report.quality?.pass || !report.solution) continue;
  accepted += 1;
  if (!best || (report.rank ?? -Infinity) > (best.report.rank ?? -Infinity)) best = { report, states: stats.statesEnqueued, elapsedMs: stats.elapsedMs };
  if (!summaryOnly) {
    console.log(formatCandidateReport(report));
    console.log("\nLevel data:");
    console.log(JSON.stringify({ pieces: candidate.pieces, minimumMoves: report.exactMinimum, solution: report.solution, solver: stats }, null, 2));
    console.log("");
  }
}

if (summaryOnly) {
  const distribution = [...depthCounts.entries()].sort(([left], [right]) => left - right).map(([depth, count]) => `${depth}:${count}`).join(", ") || "none";
  if (frontierDiscovery) console.log(`${target.toUpperCase()} reverse frontier: ${frontierDiscovery.discoveredStates.toLocaleString()} unseen states, depth ${frontierDiscovery.deepestReverseDepth}, ${frontierCandidates.length} deepest candidates selected.`);
  console.log(`${target.toUpperCase()} depth distribution (exact moves: candidates): ${distribution}`);
  console.log(`${target.toUpperCase()} solver totals: ${proven} proven, ${unproven} unproven, ${totalStates.toLocaleString()} enqueued states, ${totalElapsedMs.toFixed(1)} ms`);
  if (exactDiscoveryRange) console.log(`${target.toUpperCase()} exact discovery range ${exactDiscoveryRange.min}–${exactDiscoveryRange.max}: ${exactDiscoveryRangeCount}/${proven} proven candidates.`);
  if (alreadyExitAligned) {
    console.log(`${target.toUpperCase()} excluded ${alreadyExitAligned} already-exit-aligned states (exact minimum 0).`);
    console.log(`${target.toUpperCase()} zero-move quality gate: ${alreadyExitAlignedQualityPasses}/${alreadyExitAligned} pass${alreadyExitAlignedQualityReasons.length ? `; ${alreadyExitAlignedQualityReasons.join(", ")}` : ""}.`);
  }
  if (provisionalDiscoveryBand) {
    provisionalFinalists.sort((left, right) => right.rank - left.rank || (right.report.exactMinimum ?? 0) - (left.report.exactMinimum ?? 0) || left.elapsedMs - right.elapsedMs || left.report.candidateId.localeCompare(right.report.candidateId));
    console.log(`${target.toUpperCase()} provisional dense discovery band ${provisionalDiscoveryBand.min}-${provisionalDiscoveryBand.max}: ${provisionalFinalists.length}/${provisionalExactCount} exact-band candidates pass the unchanged quality gate.`);
    for (const [index, finalist] of provisionalFinalists.slice(0, 10).entries()) {
      console.log(`\n#${index + 1} provisional finalist: ${finalist.report.candidateId} (rank ${finalist.rank.toFixed(2)}, ${finalist.states.toLocaleString()} states, ${finalist.elapsedMs.toFixed(1)} ms)`);
      console.log("Development-only band pass; production eligibility and pools are unchanged.");
      console.log(formatCandidateReport(finalist.report));
    }
  }
  if (best) {
    console.log(`\nBest passing candidate: ${best.report.candidateId} (${best.states.toLocaleString()} states, ${best.elapsedMs.toFixed(1)} ms)`);
    console.log(formatCandidateReport(best.report));
  } else if (deepest) {
    console.log(`\nDeepest verified near-miss: ${deepest.report.candidateId} (${deepest.states.toLocaleString()} states, ${deepest.elapsedMs.toFixed(1)} ms)`);
    console.log(formatCandidateReport(deepest.report));
  }
}
if (accepted === 0 && provisionalFinalists.length === 0) console.log(`No ${target.toUpperCase()} finalists in ${attempts} deterministic attempts.`);
