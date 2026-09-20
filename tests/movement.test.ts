import { describe, expect, it } from "vitest";
import { getLevel } from "../src/data/levels";
import { applyMove, canMove, getMaxTravel, getOccupiedCells, hasOverlaps, targetCanExit } from "../src/game/movement";
import type { PuzzleLevel, PuzzlePiece } from "../src/game/types";

const testLevel: PuzzleLevel = { id: "tuklas", name: "test", description: "test", boardWidth: 6, boardHeight: 6, exitColumns: [2, 3], pieces: [] };
const piece = (id: string, x: number, y: number, width: number, height: number): PuzzlePiece => ({ id, x, y, width, height });

describe("puzzle movement", () => {
  const level = getLevel("tuklas");
  it("calculates every occupied cell for a rectangular piece", () => {
    expect(getOccupiedCells({ id: "x", x: 2, y: 1, width: 2, height: 2 })).toEqual(["2,1", "3,1", "2,2", "3,2"]);
  });
  it("never allows a block to cross a board boundary", () => {
    const piece = level.pieces.find((entry) => entry.x === 0)!;
    expect(canMove(piece.id, "left", level.pieces, level)).toBe(false);
  });
  it.each([
    ["wide 2 by 1", piece("wide", 2, 2, 2, 1)],
    ["tall 1 by 2", piece("tall", 2, 2, 1, 2)],
    ["single 1 by 1", piece("single", 2, 2, 1, 1)],
    ["master 2 by 2", piece("master", 2, 2, 2, 2)],
  ])("allows a %s piece to move in every legal direction", (_name, movable) => {
    for (const direction of ["up", "down", "left", "right"] as const) {
      expect(getMaxTravel(movable.id, direction, [movable], testLevel)).toBeGreaterThan(0);
    }
  });
  it("allows Tile 9 to move upward when every destination cell above its footprint is empty", () => {
    const tile9 = { ...piece("sdg-9", 2, 2, 2, 1), sdg: 9 };
    const blockers = [piece("left", 0, 0, 1, 2), piece("right", 5, 0, 1, 2)];
    expect(getMaxTravel(tile9.id, "up", [tile9, ...blockers], testLevel)).toBe(2);
    expect(canMove(tile9.id, "up", [tile9, ...blockers], testLevel)).toBe(true);
  });
  it("moves through clear cells only and retains non-overlap", () => {
    const piece = level.pieces.find((candidate) => ["up", "down", "left", "right"].some((direction) => getMaxTravel(candidate.id, direction as "up", level.pieces, level) > 0));
    expect(piece).toBeDefined();
    const move = ["up", "down", "left", "right"].find((direction) => getMaxTravel(piece!.id, direction as "up", level.pieces, level) > 0);
    expect(move).toBeDefined();
    const next = applyMove(piece!.id, move as "up", 1, level.pieces, level);
    expect(hasOverlaps(next)).toBe(false);
  });
  it("recognises the exact target exit alignment", () => {
    const aligned = level.pieces.map((piece) => piece.target ? { ...piece, x: 2, y: 4 } : piece);
    expect(targetCanExit(aligned, level)).toBe(true);
    expect(targetCanExit(aligned.map((piece) => piece.target ? { ...piece, x: 1 } : piece), level)).toBe(false);
  });
  it("blocks collision, board-boundary movement, and non-exit master escape", () => {
    const movable = piece("wide", 2, 1, 2, 1);
    const blocking = piece("block", 2, 0, 2, 1);
    expect(getMaxTravel(movable.id, "up", [movable, blocking], testLevel)).toBe(0);
    expect(getMaxTravel(movable.id, "left", [{ ...movable, x: 0 }], testLevel)).toBe(0);
    const master = { ...piece("master", 1, 4, 2, 2), target: true };
    expect(getMaxTravel(master.id, "down", [master], testLevel)).toBe(0);
    expect(targetCanExit([master], testLevel)).toBe(false);
  });
});
