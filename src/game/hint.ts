import { applyMove, clonePieces } from "./movement";
import { solveLevel, stateKey } from "./solver";
import type { Move, PuzzleLevel, PuzzlePiece } from "./types";

/** Returns the stored optimal continuation when possible, then exactly solves a deviation. */
export function getHintMove(level: PuzzleLevel, pieces: PuzzlePiece[]): Move | null {
  const currentKey = stateKey(pieces);
  let replay = clonePieces(level.pieces);
  for (let index = 0; index < (level.solution?.length ?? 0); index += 1) {
    if (stateKey(replay) === currentKey) return level.solution![index];
    const move = level.solution![index];
    replay = applyMove(move.pieceId, move.direction, move.distance, replay, level);
  }
  if (stateKey(replay) === currentKey) return null;
  return solveLevel({ ...level, pieces: clonePieces(pieces) })?.[0] ?? null;
}
