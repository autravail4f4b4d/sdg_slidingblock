import { levels } from "../src/data/levels";
import { evaluateCandidate, formatCandidateReport } from "../src/game/levelSelection";

for (const level of levels) console.log(`${formatCandidateReport(evaluateCandidate(level))}\n`);
