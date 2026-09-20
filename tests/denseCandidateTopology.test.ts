import { describe, expect, it } from "vitest";
import { denseCandidateOrigin, kilosSevenRowOrigin } from "../src/data/candidateLevels";
import { getMaxTravel, getOccupiedCells, hasOverlaps, isInsideBoard, targetCanExit } from "../src/game/movement";

describe("dense 6 by 6 candidate topology", () => {
  it("uses 34 cells: master, thirteen dominoes, four singles, and two empty cells", () => {
    const master = denseCandidateOrigin.pieces.find((piece) => piece.target)!;
    const sdgPieces = denseCandidateOrigin.pieces.filter((piece) => !piece.target);
    const dominoes = sdgPieces.filter((piece) => piece.width * piece.height === 2);
    const singles = sdgPieces.filter((piece) => piece.width * piece.height === 1);

    expect(denseCandidateOrigin.pieces).toHaveLength(18);
    expect(master.width * master.height).toBe(4);
    expect(dominoes).toHaveLength(13);
    expect(singles).toHaveLength(4);
    expect(denseCandidateOrigin.pieces.flatMap(getOccupiedCells)).toHaveLength(34);
    expect(denseCandidateOrigin.pieces.every((piece) => isInsideBoard(piece, denseCandidateOrigin))).toBe(true);
    expect(hasOverlaps(denseCandidateOrigin.pieces)).toBe(false);
    expect(targetCanExit(denseCandidateOrigin.pieces, denseCandidateOrigin)).toBe(true);
    expect(getMaxTravel(master.id, "up", denseCandidateOrigin.pieces, denseCandidateOrigin)).toBeGreaterThan(0);
  });
});

describe("two-hole 6 by 7 KILOS topology", () => {
  it("has the requested 40-cell composition and a movable master", () => {
    const level = kilosSevenRowOrigin;
    const master = level.pieces.find((piece) => piece.target)!;
    const sdgPieces = level.pieces.filter((piece) => !piece.target);

    expect(level.pieces).toHaveLength(18);
    expect(level.boardWidth).toBe(6); expect(level.boardHeight).toBe(7);
    expect(sdgPieces.filter((piece) => piece.width * piece.height === 4)).toHaveLength(2);
    expect(sdgPieces.filter((piece) => piece.width * piece.height === 3)).toHaveLength(4);
    expect(sdgPieces.filter((piece) => piece.width * piece.height === 2)).toHaveLength(5);
    expect(sdgPieces.filter((piece) => piece.width * piece.height === 1)).toHaveLength(6);
    expect(level.pieces.flatMap(getOccupiedCells)).toHaveLength(40);
    expect(level.pieces.every((piece) => isInsideBoard(piece, level))).toBe(true);
    expect(hasOverlaps(level.pieces)).toBe(false);
    expect(targetCanExit(level.pieces, level)).toBe(true);
    expect(getMaxTravel(master.id, "up", level.pieces, level)).toBeGreaterThan(0);
  });
});
