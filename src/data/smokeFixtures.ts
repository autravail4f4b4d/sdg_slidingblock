import { applyMove, targetCanExit } from "../game/movement";
import { legalMoves } from "../game/solver";
import type { Direction, Move, PuzzleLevel, PuzzlePiece } from "../game/types";

/**
 * Goal-aligned source geometry for deterministic reverse-scramble searches.
 * It is deliberately not exported by `levels.ts`, so it cannot become a
 * visitor-selectable level by accident.
 */
export const goalAlignedPieces: PuzzlePiece[] = [
  { id: "sdg-1", sdg: 1, x: 0, y: 0, width: 1, height: 2 }, { id: "sdg-2", sdg: 2, x: 1, y: 0, width: 1, height: 2 },
  { id: "sdg-3", sdg: 3, x: 4, y: 0, width: 1, height: 2 }, { id: "sdg-4", sdg: 4, x: 5, y: 0, width: 1, height: 2 },
  { id: "sdg-5", sdg: 5, x: 0, y: 2, width: 1, height: 2 }, { id: "sdg-6", sdg: 6, x: 2, y: 0, width: 2, height: 1 },
  { id: "sdg-7", sdg: 7, x: 2, y: 1, width: 2, height: 1 }, { id: "sdg-8", sdg: 8, x: 1, y: 2, width: 2, height: 1 },
  { id: "sdg-9", sdg: 9, x: 1, y: 3, width: 2, height: 1 }, { id: "sdg-10", sdg: 10, x: 3, y: 2, width: 2, height: 1 },
  { id: "sdg-11", sdg: 11, x: 5, y: 2, width: 1, height: 1 }, { id: "sdg-12", sdg: 12, x: 3, y: 3, width: 1, height: 1 },
  { id: "sdg-13", sdg: 13, x: 4, y: 3, width: 1, height: 1 }, { id: "sdg-14", sdg: 14, x: 5, y: 3, width: 1, height: 1 },
  { id: "sdg-15", sdg: 15, x: 0, y: 4, width: 1, height: 1 }, { id: "sdg-16", sdg: 16, x: 1, y: 4, width: 1, height: 1 },
  { id: "sdg-17", sdg: 17, x: 4, y: 4, width: 1, height: 1 }, { id: "sdg-master", x: 2, y: 4, width: 2, height: 2, target: true },
];

const reverse: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };
const rng = (initialSeed: number) => {
  let seed = initialSeed;
  return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
};
const clone = (pieces: PuzzlePiece[]) => pieces.map((piece) => ({ ...piece }));

function legacyLayout(id: PuzzleLevel["id"], name: string, description: string, seed: number, steps: number, obsoleteMinimum: number): PuzzleLevel {
  const result: PuzzleLevel = { id, name, description, boardWidth: 6, boardHeight: 6, exitColumns: [2, 3], pieces: clone(goalAlignedPieces), minimumMoves: obsoleteMinimum };
  const random = rng(seed); let pieces = result.pieces; const trail: Move[] = [];
  for (let index = 0; index < steps; index += 1) {
    const choices = legalMoves(pieces, result).filter((move) => !(move.pieceId === "sdg-master" && move.direction === "down"));
    const move = choices[Math.floor(random() * choices.length)];
    pieces = applyMove(move.pieceId, move.direction, move.distance, pieces, result); trail.push(move);
  }
  let extra = 0;
  while ((targetCanExit(pieces, result) || (() => { const master = pieces.find((piece) => piece.target)!; return Math.abs(master.x - 2) + Math.abs(master.y - 4) < 3; })()) && extra < 3000) {
    const choices = legalMoves(pieces, result).filter((move) => !(move.pieceId === "sdg-master" && move.direction === "down"));
    const move = choices[Math.floor(random() * choices.length)];
    pieces = applyMove(move.pieceId, move.direction, move.distance, pieces, result); trail.push(move); extra += 1;
  }
  result.pieces = pieces;
  result.solution = trail.reverse().map((move) => ({ ...move, direction: reverse[move.direction] }));
  return result;
}

/**
 * Historical layouts retained only as regression/smoke fixtures. Their
 * 4/6/9 metadata belongs to the retired restricted-movement model and must
 * never be treated as an all-axis exact minimum.
 */
export const legacySmokeLayouts = [
  legacyLayout("tuklas", "SMOKE TUKLAS", "Legacy 4-move-model layout", 314159, 27, 4),
  legacyLayout("unawa", "SMOKE UNAWA", "Legacy 6-move-model layout", 271828, 70, 6),
  legacyLayout("kilos", "SMOKE KILOS", "Legacy 9-move-model layout", 161803, 135, 9),
];
