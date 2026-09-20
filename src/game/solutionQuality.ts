import type { Direction, Move } from "./types";

export type SolutionQualityMetrics = {
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
  directionMinorityShare: number;
};

export type QualityThresholds = {
  minDistinctPieces: number;
  maxSinglePieceShare: number;
  maxTopThreePieceShare: number;
  maxImmediateReversalRate: number;
  maxIdenticalShuttleCycles: number;
  maxConsecutiveMovesSamePiece: number;
  warnIfDirectionMinorityShareBelow: number;
};

export const qualityThresholds: Record<"tuklas" | "unawa" | "kilos", QualityThresholds> = {
  tuklas: { minDistinctPieces: 5, maxSinglePieceShare: .35, maxTopThreePieceShare: .75, maxImmediateReversalRate: .18, maxIdenticalShuttleCycles: 2, maxConsecutiveMovesSamePiece: 5, warnIfDirectionMinorityShareBelow: .15 },
  unawa: { minDistinctPieces: 7, maxSinglePieceShare: .30, maxTopThreePieceShare: .65, maxImmediateReversalRate: .15, maxIdenticalShuttleCycles: 2, maxConsecutiveMovesSamePiece: 4, warnIfDirectionMinorityShareBelow: .15 },
  kilos: { minDistinctPieces: 8, maxSinglePieceShare: .25, maxTopThreePieceShare: .55, maxImmediateReversalRate: .12, maxIdenticalShuttleCycles: 2, maxConsecutiveMovesSamePiece: 4, warnIfDirectionMinorityShareBelow: .15 },
};

const opposite: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };
export const moveToken = (move: Move) => `${move.pieceId}:${move.direction}:${move.distance}`;

/** A reversal is the same piece moving immediately in the opposite direction. */
export function isImmediateReverse(previous: Move, next: Move): boolean {
  return previous.pieceId === next.pieceId && opposite[previous.direction] === next.direction;
}

/**
 * Counts consecutive, non-overlapping repetitions of the same 3–6 move sequence.
 * Requiring adjacent blocks keeps ordinary temporary repositioning from reading
 * as a shuttle cycle.
 */
export function countRepeatedMoveWindows(moves: Move[], minWindow = 3, maxWindow = 6): number {
  let count = 0;
  const consumed = new Set<number>();
  const ceiling = Math.min(maxWindow, Math.floor(moves.length / 2));
  for (let size = minWindow; size <= ceiling; size += 1) {
    for (let start = 0; start + size * 2 <= moves.length; start += 1) {
      if (Array.from({ length: size * 2 }, (_, index) => consumed.has(start + index)).some(Boolean)) continue;
      const first = moves.slice(start, start + size).map(moveToken).join("|");
      const second = moves.slice(start + size, start + size * 2).map(moveToken).join("|");
      if (first === second) {
        count += 1;
        for (let index = 0; index < size * 2; index += 1) consumed.add(start + index);
      }
    }
  }
  return count;
}

export function analyzeSolutionQuality(solution: Move[]): SolutionQualityMetrics {
  const totalMoves = solution.length;
  const moveCountByPiece: Record<string, number> = {};
  let horizontalMoves = 0; let verticalMoves = 0; let immediateReversalCount = 0;
  let longestSamePieceStreak = 0; let currentStreak = 0; let previousPiece = "";
  for (let index = 0; index < solution.length; index += 1) {
    const move = solution[index];
    moveCountByPiece[move.pieceId] = (moveCountByPiece[move.pieceId] ?? 0) + 1;
    if (move.direction === "left" || move.direction === "right") horizontalMoves += 1; else verticalMoves += 1;
    currentStreak = move.pieceId === previousPiece ? currentStreak + 1 : 1;
    longestSamePieceStreak = Math.max(longestSamePieceStreak, currentStreak); previousPiece = move.pieceId;
    if (index > 0 && isImmediateReverse(solution[index - 1], move)) immediateReversalCount += 1;
  }
  const counts = Object.values(moveCountByPiece).sort((a, b) => b - a);
  return {
    totalMoves,
    distinctPiecesMoved: counts.length,
    moveCountByPiece,
    maxSinglePieceShare: totalMoves ? (counts[0] ?? 0) / totalMoves : 0,
    topThreePieceShare: totalMoves ? counts.slice(0, 3).reduce((sum, value) => sum + value, 0) / totalMoves : 0,
    immediateReversalCount,
    immediateReversalRate: totalMoves > 1 ? immediateReversalCount / (totalMoves - 1) : 0,
    repeatedShuttleCycleCount: countRepeatedMoveWindows(solution),
    longestSamePieceStreak,
    horizontalMoves,
    verticalMoves,
    directionMinorityShare: totalMoves ? Math.min(horizontalMoves, verticalMoves) / totalMoves : 0,
  };
}

export type QualityGateResult = { pass: boolean; checks: Record<string, boolean>; reasons: string[]; warnings: string[] };
export function passesQualityGate(metrics: SolutionQualityMetrics, thresholds: QualityThresholds): QualityGateResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const checks = {
    distinctPieces: metrics.distinctPiecesMoved >= thresholds.minDistinctPieces,
    singlePieceShare: metrics.maxSinglePieceShare <= thresholds.maxSinglePieceShare,
    topThreeShare: metrics.topThreePieceShare <= thresholds.maxTopThreePieceShare,
    immediateReversals: metrics.immediateReversalRate <= thresholds.maxImmediateReversalRate,
    shuttleCycles: metrics.repeatedShuttleCycleCount <= thresholds.maxIdenticalShuttleCycles,
    samePieceStreak: metrics.longestSamePieceStreak <= thresholds.maxConsecutiveMovesSamePiece,
  };
  if (!checks.distinctPieces) reasons.push("insufficient piece participation");
  if (!checks.singlePieceShare) reasons.push("single-piece concentration too high");
  if (!checks.topThreeShare) reasons.push("top-three concentration too high");
  if (!checks.immediateReversals) reasons.push("immediate reversal rate too high");
  if (!checks.shuttleCycles) reasons.push("repeated shuttle cycles detected");
  if (!checks.samePieceStreak) reasons.push("same-piece streak too long");
  if (metrics.directionMinorityShare < thresholds.warnIfDirectionMinorityShareBelow) warnings.push("direction diversity is low");
  return { pass: reasons.length === 0, checks, reasons, warnings };
}
