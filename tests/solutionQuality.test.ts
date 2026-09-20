import { describe, expect, it } from "vitest";
import { analyzeSolutionQuality, countRepeatedMoveWindows, isImmediateReverse, passesQualityGate, qualityThresholds } from "../src/game/solutionQuality";
import type { Move } from "../src/game/types";

const move = (pieceId: string, direction: Move["direction"], distance = 1): Move => ({ pieceId, direction, distance });
const balanced: Move[] = [
  move("a", "up"), move("b", "right"), move("c", "down"), move("d", "left"), move("e", "up"),
  move("a", "right"), move("b", "down"), move("c", "left"), move("d", "up"), move("e", "right"),
  move("a", "down"), move("b", "left"), move("c", "up"), move("d", "right"), move("e", "down"),
];

describe("solution quality", () => {
  it("measures participation and concentration per continuous slide", () => {
    const metrics = analyzeSolutionQuality([...balanced, move("a", "right", 3)]);
    expect(metrics.totalMoves).toBe(16); expect(metrics.distinctPiecesMoved).toBe(5);
    expect(metrics.moveCountByPiece.a).toBe(4); expect(metrics.maxSinglePieceShare).toBe(.25);
    expect(metrics.topThreePieceShare).toBe(10 / 16);
  });

  it("detects only adjacent opposite-direction movement by the same piece", () => {
    expect(isImmediateReverse(move("9", "up", 2), move("9", "down"))).toBe(true);
    expect(isImmediateReverse(move("9", "up"), move("6", "down"))).toBe(false);
    const metrics = analyzeSolutionQuality([move("9", "up"), move("6", "left"), move("9", "down")]);
    expect(metrics.immediateReversalCount).toBe(0); expect(metrics.immediateReversalRate).toBe(0);
  });

  it("finds repeated 3–6 move shuttle cycles without flagging a single cycle", () => {
    const cycle = [move("9", "up"), move("6", "left"), move("9", "down"), move("6", "right")];
    expect(countRepeatedMoveWindows(cycle)).toBe(0);
    expect(countRepeatedMoveWindows([...cycle, ...cycle])).toBeGreaterThanOrEqual(1);
  });

  it("finds the longest consecutive same-piece streak", () => {
    expect(analyzeSolutionQuality([move("a", "up"), move("a", "right"), move("a", "down"), move("b", "left")]).longestSamePieceStreak).toBe(3);
  });

  it("passes a diverse TUKLAS path and rejects concentrated, reversal-heavy, and shuttle paths", () => {
    expect(passesQualityGate(analyzeSolutionQuality(balanced), qualityThresholds.tuklas).pass).toBe(true);
    const concentrated = Array.from({ length: 15 }, () => move("a", "right"));
    const concentratedGate = passesQualityGate(analyzeSolutionQuality(concentrated), qualityThresholds.tuklas);
    expect(concentratedGate.pass).toBe(false); expect(concentratedGate.reasons).toContain("insufficient piece participation");
    const reversals = Array.from({ length: 10 }, (_, index) => move("a", index % 2 ? "down" : "up"));
    expect(passesQualityGate(analyzeSolutionQuality(reversals), qualityThresholds.tuklas).reasons).toContain("immediate reversal rate too high");
    const cycle = [move("9", "up"), move("6", "left"), move("9", "down"), move("6", "right")];
    const shuttleGate = passesQualityGate(analyzeSolutionQuality([...cycle, ...cycle, ...cycle, ...cycle, ...cycle, ...cycle]), qualityThresholds.tuklas);
    expect(shuttleGate.reasons).toContain("repeated shuttle cycles detected");
  });
});
