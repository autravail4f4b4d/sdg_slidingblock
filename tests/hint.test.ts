import { describe, expect, it } from "vitest";
import { getHintMove } from "../src/game/hint";
import { applyMove } from "../src/game/movement";
import type { PuzzleLevel, PuzzlePiece } from "../src/game/types";

const master: PuzzlePiece = { id: "sdg-master", target: true, x: 2, y: 3, width: 2, height: 2 };
const marker: PuzzlePiece = { id: "marker", x: 0, y: 0, width: 1, height: 1 };
const level: PuzzleLevel = { id: "tuklas", name: "hint", description: "hint", boardWidth: 6, boardHeight: 6, exitColumns: [2, 3], pieces: [master, marker], minimumMoves: 1, solution: [{ pieceId: "sdg-master", direction: "down", distance: 1 }] };

describe("hints", () => {
  it("uses the stored route initially and after undo", () => {
    expect(getHintMove(level, level.pieces)).toEqual(level.solution![0]);
    const moved = applyMove("sdg-master", "down", 1, level.pieces, level);
    expect(getHintMove(level, moved)).toBeNull();
    expect(getHintMove(level, level.pieces)).toEqual(level.solution![0]);
  });

  it("solves a legal deviation instead of indexing a stale route", () => {
    const deviated = applyMove("marker", "right", 1, level.pieces, level);
    expect(getHintMove(level, deviated)).toEqual(level.solution![0]);
  });

  it("resolves hints from the active variant rather than a prior variant's route", () => {
    const t1: PuzzleLevel = { ...level, variantId: "T1", solution: [{ pieceId: "sdg-master", direction: "down", distance: 1 }] };
    const t2: PuzzleLevel = { ...level, variantId: "T2", solution: [{ pieceId: "marker", direction: "right", distance: 1 }] };
    expect(getHintMove(t1, t1.pieces)).toEqual(t1.solution![0]);
    expect(getHintMove(t2, t2.pieces)).toEqual(t2.solution![0]);
  });
});
