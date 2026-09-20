import { analyzeSolutionQuality, passesQualityGate, qualityThresholds, type QualityGateResult, type SolutionQualityMetrics } from "./solutionQuality";
import { solveLevel } from "./solver";
import type { Move, PuzzleLevel } from "./types";

export type CandidateReport = {
  candidateId: string;
  levelId: PuzzleLevel["id"];
  exactMinimum: number | null;
  solution: Move[] | null;
  metrics: SolutionQualityMetrics | null;
  quality: QualityGateResult | null;
  rank: number | null;
  reasons: string[];
};

/** Solves first, then applies the independently auditable quality acceptance gate. */
export function evaluateCandidate(level: PuzzleLevel, candidateId: string = level.id, maxStates?: number): CandidateReport {
  const solution = solveLevel(level, maxStates);
  const thresholds = qualityThresholds[level.id];
  if (!solution) return { candidateId, levelId: level.id, exactMinimum: null, solution: null, metrics: null, quality: null, rank: null, reasons: ["solver did not prove an exact solution within the configured state budget"] };
  const exactMinimum = solution.length;
  const metrics = analyzeSolutionQuality(solution);
  const quality = passesQualityGate(metrics, thresholds);
  const reasons = quality.reasons;
  // Higher is better. This only ranks candidates that are already exact-solver proven.
  const rank = quality.pass
    ? 100 + metrics.distinctPiecesMoved * 3 - metrics.topThreePieceShare * 30 - metrics.immediateReversalRate * 20 - metrics.repeatedShuttleCycleCount * 8
    : null;
  return { candidateId, levelId: level.id, exactMinimum, solution, metrics, quality, rank, reasons };
}

export function formatCandidateReport(report: CandidateReport): string {
  const heading = `${report.levelId.toUpperCase()} CANDIDATE ${report.candidateId}`;
  if (!report.metrics || !report.quality) return `${heading}\n\nExact minimum: not proven\nExact solver: FAIL\nQuality gate: NOT RUN\n\nReasons:\n${report.reasons.map((reason) => `- ${reason}`).join("\n")}`;
  const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
  return `${heading}\n\nExact minimum:             ${report.exactMinimum}\nDistinct pieces:           ${report.metrics.distinctPiecesMoved}\nLargest single share:      ${percent(report.metrics.maxSinglePieceShare)}\nTop-three share:           ${percent(report.metrics.topThreePieceShare)}\nImmediate reversal rate:   ${percent(report.metrics.immediateReversalRate)}\nRepeated shuttle cycles:   ${report.metrics.repeatedShuttleCycleCount}\nLongest same-piece streak: ${report.metrics.longestSamePieceStreak}\n\nExact solver: PASS\nQuality gate: ${report.quality.pass ? "PASS" : "FAIL"}${report.reasons.length ? `\n\nReasons:\n${report.reasons.map((reason) => `- ${reason}`).join("\n")}` : ""}${report.quality.warnings.length ? `\n\nWarnings:\n${report.quality.warnings.map((warning) => `- ${warning}`).join("\n")}` : ""}`;
}
