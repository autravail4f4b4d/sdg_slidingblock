import type { PuzzleLevel } from "./types";
export type Score = { moves: number; elapsedMs: number };

type KeyValueStore = Pick<Storage, "getItem" | "setItem">;

/**
 * Scores are deliberately not migrated from the old v2 tier-only keys. A v2
 * score describes a different board set and must never become the score for a
 * structurally distinct production variant.
 */
export const bestScoreKey = (tier: PuzzleLevel["id"], variantId: string) => `sdg-escape.v3.best.${tier}.${variantId}`;

function browserStorage(): KeyValueStore | null {
  try { return typeof localStorage === "undefined" ? null : localStorage; } catch { return null; }
}

export function getBestScore(tier: PuzzleLevel["id"], variantId = "legacy", store: KeyValueStore | null = browserStorage()): Score | null {
  try {
    const value = store?.getItem(bestScoreKey(tier, variantId));
    if (!value) return null;
    const score = JSON.parse(value) as Partial<Score>;
    return typeof score.moves === "number" && typeof score.elapsedMs === "number" ? { moves: score.moves, elapsedMs: score.elapsedMs } : null;
  } catch { return null; }
}

export function saveBestScore(tier: PuzzleLevel["id"], score: Score, variantId = "legacy", store: KeyValueStore | null = browserStorage()): Score {
  const prior = getBestScore(tier, variantId, store);
  const best = !prior || score.moves < prior.moves || (score.moves === prior.moves && score.elapsedMs < prior.elapsedMs) ? score : prior;
  try { store?.setItem(bestScoreKey(tier, variantId), JSON.stringify(best)); } catch { /* exhibit remains usable */ }
  return best;
}
