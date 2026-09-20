import { applyMove, getMaxTravel, targetCanExit } from "./movement";
import type { Direction, Move, PuzzleLevel, PuzzlePiece } from "./types";

const directions: Direction[] = ["up", "down", "left", "right"];

/** Stable identity-preserving encoding used by hint-path matching. */
export const stateKey = (pieces: PuzzlePiece[]) => String.fromCharCode(...pieces.map((piece) => piece.y * 6 + piece.x + 1));

export function legalMoves(pieces: PuzzlePiece[], level: PuzzleLevel): Move[] {
  return pieces.flatMap((piece) => directions.flatMap((direction) => {
    const maximum = getMaxTravel(piece.id, direction, pieces, level);
    return Array.from({ length: maximum }, (_, index) => ({ pieceId: piece.id, direction, distance: index + 1 }));
  }));
}

export type SolveStats = {
  solution: Move[] | null;
  statesVisited: number;
  statesEnqueued: number;
  hitStateLimit: boolean;
  elapsedMs: number;
};

type Geometry = {
  masksLow: Uint32Array;
  masksHigh: Uint32Array;
  validAnchor: Uint8Array;
  zobrist: Uint32Array;
  targetIndex: number;
};

function makeGeometry(level: PuzzleLevel): Geometry | null {
  const pieces = level.pieces;
  const cells = level.boardWidth * level.boardHeight;
  if (cells > 64) return null;
  const masksLow = new Uint32Array(pieces.length * cells);
  const masksHigh = new Uint32Array(pieces.length * cells);
  const validAnchor = new Uint8Array(pieces.length * cells);
  const zobrist = new Uint32Array(pieces.length * cells);
  let seed = 0x9e3779b9;
  const randomWord = () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return seed >>> 0;
  };
  let targetIndex = -1;
  for (let pieceIndex = 0; pieceIndex < pieces.length; pieceIndex += 1) {
    const piece = pieces[pieceIndex];
    if (piece.target) targetIndex = pieceIndex;
    for (let position = 0; position < cells; position += 1) {
      const x = position % level.boardWidth;
      const y = Math.floor(position / level.boardWidth);
      const slot = pieceIndex * cells + position;
      zobrist[slot] = randomWord();
      if (x + piece.width > level.boardWidth || y + piece.height > level.boardHeight) continue;
      validAnchor[slot] = 1;
      let low = 0; let high = 0;
      for (let cellY = y; cellY < y + piece.height; cellY += 1) for (let cellX = x; cellX < x + piece.width; cellX += 1) {
        const cell = cellY * level.boardWidth + cellX;
        if (cell < 32) low |= 1 << cell; else high |= 1 << (cell - 32);
      }
      masksLow[slot] = low >>> 0; masksHigh[slot] = high >>> 0;
    }
  }
  return targetIndex < 0 ? null : { masksLow, masksHigh, validAnchor, zobrist, targetIndex };
}

function positionHash(offset: number, piecesPerState: number, positions: Uint8Array, zobrist: Uint32Array, cells: number): number {
  let hash = 0;
  for (let pieceIndex = 0; pieceIndex < piecesPerState; pieceIndex += 1) hash ^= zobrist[pieceIndex * cells + positions[offset + pieceIndex]];
  return hash >>> 0;
}

/**
 * Exact FIFO BFS over compact one-byte anchors (x + boardWidth*y).
 *
 * Each expanded state rebuilds its occupancy in two 32-bit masks. Successors
 * are generated without piece-object or Set allocation. Zobrist hashes index
 * collision chains, but full byte-for-byte state comparison resolves every
 * collision; hashing therefore cannot change the result. Unit-cost FIFO order
 * makes the first exit-aligned target a guaranteed minimum-move solution.
 */
export function solveLevelWithStats(level: PuzzleLevel, maxStates = 600_000): SolveStats {
  const startedAt = performance.now();
  const pieces = level.pieces;
  const piecesPerState = pieces.length;
  const cells = level.boardWidth * level.boardHeight;
  const directionSteps = [-level.boardWidth, level.boardWidth, -1, 1] as const;
  const geometry = makeGeometry(level);
  const finish = (solution: Move[] | null, statesVisited: number, statesEnqueued: number, hitStateLimit: boolean): SolveStats => ({ solution, statesVisited, statesEnqueued, hitStateLimit, elapsedMs: performance.now() - startedAt });
  if (!geometry || maxStates < 1 || cells > 64) return finish(null, 0, 0, false);
  if (targetCanExit(pieces, level)) return finish([], 0, 1, false);

  const positions = new Uint8Array(maxStates * piecesPerState);
  const parents = new Int32Array(maxStates);
  const collisionNext = new Int32Array(maxStates); collisionNext.fill(-1);
  const hashes = new Uint32Array(maxStates);
  const movePieces = new Uint8Array(maxStates);
  const moveDirections = new Uint8Array(maxStates);
  const moveDistances = new Uint8Array(maxStates);
  let occupancyLow = 0; let occupancyHigh = 0;
  for (let pieceIndex = 0; pieceIndex < piecesPerState; pieceIndex += 1) {
    const position = pieces[pieceIndex].y * level.boardWidth + pieces[pieceIndex].x;
    const slot = pieceIndex * cells + position;
    if (!geometry.validAnchor[slot]) return finish(null, 0, 0, false);
    positions[pieceIndex] = position;
    occupancyLow |= geometry.masksLow[slot]; occupancyHigh |= geometry.masksHigh[slot];
  }
  let occupiedCellCount = 0;
  for (const piece of pieces) occupiedCellCount += piece.width * piece.height;
  if (popcount(occupancyLow) + popcount(occupancyHigh) !== occupiedCellCount) return finish(null, 0, 0, false);

  hashes[0] = positionHash(0, piecesPerState, positions, geometry.zobrist, cells);
  const seenHeads = new Map<number, number>([[hashes[0], 0]]);
  let queued = 1;
  for (let nodeIndex = 0; nodeIndex < queued; nodeIndex += 1) {
    const offset = nodeIndex * piecesPerState;
    occupancyLow = 0; occupancyHigh = 0;
    for (let pieceIndex = 0; pieceIndex < piecesPerState; pieceIndex += 1) {
      const slot = pieceIndex * cells + positions[offset + pieceIndex];
      occupancyLow |= geometry.masksLow[slot]; occupancyHigh |= geometry.masksHigh[slot];
    }
    for (let pieceIndex = 0; pieceIndex < piecesPerState; pieceIndex += 1) {
      const oldPosition = positions[offset + pieceIndex];
      const oldSlot = pieceIndex * cells + oldPosition;
      const withoutLow = (occupancyLow ^ geometry.masksLow[oldSlot]) >>> 0;
      const withoutHigh = (occupancyHigh ^ geometry.masksHigh[oldSlot]) >>> 0;
      for (let directionIndex = 0; directionIndex < directions.length; directionIndex += 1) {
        let nextPosition = oldPosition;
        for (let distance = 1; ; distance += 1) {
          nextPosition += directionSteps[directionIndex];
          if (nextPosition < 0 || nextPosition >= cells) break;
          if (directionIndex >= 2 && Math.floor(nextPosition / level.boardWidth) !== Math.floor(oldPosition / level.boardWidth)) break;
          const nextSlot = pieceIndex * cells + nextPosition;
          if (!geometry.validAnchor[nextSlot] || (geometry.masksLow[nextSlot] & withoutLow) !== 0 || (geometry.masksHigh[nextSlot] & withoutHigh) !== 0) break;
          const nextHash = (hashes[nodeIndex] ^ geometry.zobrist[oldSlot] ^ geometry.zobrist[nextSlot]) >>> 0;
          let duplicate = false;
          for (let candidate = seenHeads.get(nextHash) ?? -1; candidate >= 0; candidate = collisionNext[candidate]) {
            const candidateOffset = candidate * piecesPerState;
            let same = true;
            for (let index = 0; index < piecesPerState; index += 1) if (positions[candidateOffset + index] !== (index === pieceIndex ? nextPosition : positions[offset + index])) { same = false; break; }
            if (same) { duplicate = true; break; }
          }
          if (duplicate) continue;
          if (queued >= maxStates) return finish(null, nodeIndex + 1, queued, true);
          const nextOffset = queued * piecesPerState;
          positions.set(positions.subarray(offset, offset + piecesPerState), nextOffset);
          positions[nextOffset + pieceIndex] = nextPosition;
          parents[queued] = nodeIndex; movePieces[queued] = pieceIndex; moveDirections[queued] = directionIndex; moveDistances[queued] = distance; hashes[queued] = nextHash;
          const priorHead = seenHeads.get(nextHash); collisionNext[queued] = priorHead ?? -1; seenHeads.set(nextHash, queued);
          const discovered = queued; queued += 1;
          const target = pieces[geometry.targetIndex];
          if (positions[nextOffset + geometry.targetIndex] === (level.boardHeight - target.height) * level.boardWidth + level.exitColumns[0] && target.width === 2 && target.height === 2) {
            const path: Move[] = [];
            for (let pathIndex = discovered; pathIndex > 0; pathIndex = parents[pathIndex]) path.push({ pieceId: pieces[movePieces[pathIndex]].id, direction: directions[moveDirections[pathIndex]], distance: moveDistances[pathIndex] });
            return finish(path.reverse(), nodeIndex + 1, queued, false);
          }
        }
      }
    }
  }
  return finish(null, queued, queued, false);
}

function popcount(value: number): number {
  let count = 0; let remaining = value >>> 0;
  while (remaining) { remaining &= remaining - 1; count += 1; }
  return count;
}

export function solveLevel(level: PuzzleLevel, maxStates = 600_000): Move[] | null {
  return solveLevelWithStats(level, maxStates).solution;
}
