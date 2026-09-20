import { describe, expect, it } from "vitest";
import { levels } from "../src/data/levels";
import { legacySmokeLayouts } from "../src/data/smokeFixtures";
import { hasOverlaps, isInsideBoard } from "../src/game/movement";

describe("production levels", () => {
  it("contains all SDGs once, valid geometry, and a recorded solution", () => {
    for (const level of levels) {
      expect(level.pieces).toHaveLength(18); expect(level.pieces.filter((piece) => piece.target)).toHaveLength(1);
      expect(level.pieces.map((piece) => piece.sdg).filter(Boolean).sort((a, b) => a! - b!)).toEqual([...Array(17)].map((_, index) => index + 1));
      expect(level.pieces.every((piece) => isInsideBoard(piece, level))).toBe(true); expect(hasOverlaps(level.pieces)).toBe(false); expect(level.solution?.length).toBeGreaterThan(0);
    }
  });
  it("retains the former restricted-movement layouts as non-production smoke fixtures", () => {
    expect(legacySmokeLayouts.map((level) => level.minimumMoves)).toEqual([4, 6, 9]);
    for (const level of legacySmokeLayouts) {
      expect(level.pieces.every((piece) => isInsideBoard(piece, level))).toBe(true);
      expect(hasOverlaps(level.pieces)).toBe(false);
    }
  });
});
