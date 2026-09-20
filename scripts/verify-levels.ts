import { levels } from "../src/data/levels";
import { hasOverlaps, isInsideBoard } from "../src/game/movement";
import { evaluateCandidate, formatCandidateReport } from "../src/game/levelSelection";

let failed = false;
let verifiedProductionCount = 0;
for (const level of levels) {
  const numbers = level.pieces.filter((piece) => piece.sdg).map((piece) => piece.sdg).sort((a, b) => a! - b!);
  const validPieces = numbers.length === 17 && numbers.every((number, index) => number === index + 1) && level.pieces.filter((piece) => piece.target).length === 1;
  const geometry = level.pieces.every((piece) => isInsideBoard(piece, level)) && !hasOverlaps(level.pieces);
  if (!validPieces || !geometry) { console.error(`${level.name} failed geometry validation.`); failed = true; continue; }
  if (level.minimumMoves === undefined) { console.log(`${level.name}: transitional layout; no all-axis minimum claimed.`); continue; }
  const report = evaluateCandidate(level, level.id);
  console.log(formatCandidateReport(report));
  verifiedProductionCount += 1;
  if (!report.quality?.pass || report.exactMinimum !== level.minimumMoves) { console.error(`${level.name} failed production validation.`); failed = true; }
}
if (verifiedProductionCount === 0) { console.error("No exact-solver and quality-gate approved production levels are configured."); failed = true; }
if (failed) process.exit(1);
