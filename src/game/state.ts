import { clonePieces } from "./movement";
import type { GameState, Move, PuzzleLevel } from "./types";

export function newGame(level: PuzzleLevel): GameState {
  return { levelId: level.id, variantId: level.variantId, status: "menu", pieces: clonePieces(level.pieces), moves: 0, elapsedMs: 0, history: [], startedAt: null, hint: null };
}

export function recordMove(state: GameState, nextPieces: GameState["pieces"], now = Date.now()): GameState {
  if (JSON.stringify(state.pieces) === JSON.stringify(nextPieces)) return state;
  return { ...state, pieces: clonePieces(nextPieces), history: [...state.history, clonePieces(state.pieces)], moves: state.moves + 1, startedAt: state.startedAt ?? now, status: "playing", hint: null };
}

export function undo(state: GameState): GameState {
  const previous = state.history.at(-1);
  if (!previous) return state;
  return { ...state, pieces: clonePieces(previous), history: state.history.slice(0, -1), moves: Math.max(0, state.moves - 1), hint: null };
}

export function resetGame(level: PuzzleLevel): GameState { return newGame(level); }
export function setHint(state: GameState, hint: Move | null): GameState { return { ...state, hint }; }
