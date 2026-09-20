import { describe, expect, it } from "vitest";
import { evaluateCandidate, formatCandidateReport } from "../src/game/levelSelection";
import type { PuzzleLevel } from "../src/game/types";

const level: PuzzleLevel = {
  id: "tuklas", name: "candidate", description: "candidate", boardWidth: 6, boardHeight: 6, exitColumns: [2, 3],
  pieces: [{ id: "sdg-master", target: true, x: 2, y: 3, width: 2, height: 2 }],
};

describe("candidate selection", () => {
  it("reports exact proof separately from a quality result", () => {
    const report = evaluateCandidate(level, "smoke", 100);
    expect(report.exactMinimum).toBe(1);
    expect(report.quality?.pass).toBe(false);
    expect(report.reasons).not.toContain(expect.stringMatching(/outside/));
    expect(formatCandidateReport(report)).toContain("Exact solver: PASS");
    expect(formatCandidateReport(report)).toContain("Quality gate: FAIL");
  });
});
