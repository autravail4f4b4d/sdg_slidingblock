import { describe, expect, it } from "vitest";
import { applyMove, targetCanExit } from "../src/game/movement";
import { solveLevel, solveLevelWithStats } from "../src/game/solver";
import type { PuzzleLevel } from "../src/game/types";

const baseLevel = (pieces: PuzzleLevel["pieces"]): PuzzleLevel => ({
  id: "tuklas", name: "solver fixture", description: "", boardWidth: 6, boardHeight: 6, exitColumns: [2, 3], pieces,
});

describe("exact compact solver", () => {
  it("returns the one-move exit path and records bounded-search stats", () => {
    const level = baseLevel([{ id: "master", target: true, x: 2, y: 2, width: 2, height: 2 }]);
    const result = solveLevelWithStats(level, 16);
    expect(result.solution).toEqual([{ pieceId: "master", direction: "down", distance: 2 }]);
    expect(result.hitStateLimit).toBe(false);
    expect(result.statesEnqueued).toBeGreaterThan(1);
  });

  it("keeps all-axis collision rules while proving a two-move minimum", () => {
    const level = baseLevel([
      { id: "blocker", x: 2, y: 4, width: 1, height: 1 },
      { id: "master", target: true, x: 2, y: 2, width: 2, height: 2 },
    ]);
    const solution = solveLevel(level, 256);
    expect(solution).toHaveLength(2);
    const end = solution!.reduce((pieces, move) => applyMove(move.pieceId, move.direction, move.distance, pieces, level), level.pieces);
    expect(targetCanExit(end, level)).toBe(true);
  });

  it("reports a state-budget stop as unproven instead of returning a non-exact path", () => {
    const level = baseLevel([{ id: "master", target: true, x: 2, y: 2, width: 2, height: 2 }]);
    const result = solveLevelWithStats(level, 1);
    expect(result.solution).toBeNull();
    expect(result.hitStateLimit).toBe(true);
  });
});
