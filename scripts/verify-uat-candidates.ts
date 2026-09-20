import { uatCandidates } from "../src/data/candidateLevels";
import { applyMove, targetCanExit } from "../src/game/movement";
import { legalMoves } from "../src/game/solver";
import { evaluateCandidate, formatCandidateReport } from "../src/game/levelSelection";
import type { PuzzlePiece } from "../src/game/types";

const ordered = [uatCandidates.tuklas, uatCandidates.unawa, uatCandidates.kilos];
let failed = false;

for (const candidate of ordered) {
  const report = evaluateCandidate(candidate, candidate.candidateId, 2_000_000);
  console.log(formatCandidateReport(report));
  if (report.exactMinimum !== candidate.exactMinimum || report.quality?.pass !== true || candidate.minimumMoves !== candidate.exactMinimum || candidate.qualityApproved !== true || candidate.manualUatApproved !== false) {
    console.error(`${candidate.candidateId} failed fixed-candidate validation.`);
    failed = true;
  }

  let pieces: PuzzlePiece[] = candidate.pieces.map((piece) => ({ ...piece }));
  for (const move of candidate.solution) {
    const legal = legalMoves(pieces, candidate).some((option) => option.pieceId === move.pieceId && option.direction === move.direction && option.distance === move.distance);
    if (!legal) { console.error(`${candidate.candidateId} has an illegal stored move.`); failed = true; break; }
    pieces = applyMove(move.pieceId, move.direction, move.distance, pieces, candidate);
  }
  if (!targetCanExit(pieces, candidate)) { console.error(`${candidate.candidateId} stored solution does not exit.`); failed = true; }
}

if (!(uatCandidates.tuklas.exactMinimum < uatCandidates.unawa.exactMinimum && uatCandidates.unawa.exactMinimum < uatCandidates.kilos.exactMinimum)) {
  console.error("UAT candidates are not strictly increasing in exact difficulty.");
  failed = true;
}

if (failed) process.exit(1);
console.log("All fixed candidates are solver-proven and quality-approved. Manual UAT remains pending for every tier.");
