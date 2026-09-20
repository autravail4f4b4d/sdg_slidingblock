import type { TierId } from "./types";

export type TierReplayState = {
  remaining: string[];
  lastPlayed?: string;
};

export type ReplayState = {
  version: 1;
  tuklas: TierReplayState;
  unawa: TierReplayState;
  kilos: TierReplayState;
};

type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Random = () => number;

export const replayStorageKey = "sdg-escape.replay.v1";

const emptyTier = (): TierReplayState => ({ remaining: [] });
const emptyReplayState = (): ReplayState => ({ version: 1, tuklas: emptyTier(), unawa: emptyTier(), kilos: emptyTier() });

function browserStorage(): KeyValueStore | null {
  try { return typeof localStorage === "undefined" ? null : localStorage; } catch { return null; }
}

function readState(store: KeyValueStore | null): ReplayState {
  try {
    const value = store?.getItem(replayStorageKey);
    if (!value) return emptyReplayState();
    const parsed = JSON.parse(value) as Partial<ReplayState>;
    if (parsed.version !== 1) return emptyReplayState();
    return {
      version: 1,
      tuklas: readTier(parsed.tuklas),
      unawa: readTier(parsed.unawa),
      kilos: readTier(parsed.kilos),
    };
  } catch { return emptyReplayState(); }
}

function readTier(value: unknown): TierReplayState {
  if (!value || typeof value !== "object") return emptyTier();
  const candidate = value as Partial<TierReplayState>;
  if (!Array.isArray(candidate.remaining) || candidate.remaining.some((id) => typeof id !== "string")) return emptyTier();
  return {
    remaining: candidate.remaining.slice(),
    ...(typeof candidate.lastPlayed === "string" ? { lastPlayed: candidate.lastPlayed } : {}),
  };
}

function writeState(state: ReplayState, store: KeyValueStore | null): void {
  try { store?.setItem(replayStorageKey, JSON.stringify(state)); } catch { /* play remains available without persistence */ }
}

function uniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id) => typeof id === "string" && id.length > 0))];
}

function shuffle(ids: readonly string[], random: Random): string[] {
  const bag = ids.slice();
  for (let index = bag.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
  }
  return bag;
}

function freshBag(ids: readonly string[], lastPlayed: string | undefined, random: Random): string[] {
  const bag = shuffle(ids, random);
  if (bag.length > 1 && bag[0] === lastPlayed) {
    const replacementIndex = bag.findIndex((id) => id !== lastPlayed);
    [bag[0], bag[replacementIndex]] = [bag[replacementIndex], bag[0]];
  }
  return bag;
}

/**
 * Returns the next approved variant for a tier and consumes it from that
 * tier's persistent shuffle bag. Invalid saved IDs rebuild the tier safely.
 */
export function getNextVariant(tier: TierId, variantIds: readonly string[], random: Random = Math.random, store: KeyValueStore | null = browserStorage()): string | null {
  const approved = uniqueIds(variantIds);
  if (!approved.length) return null;

  const state = readState(store);
  const saved = state[tier];
  const savedIdsAreValid = saved.remaining.length === new Set(saved.remaining).size && saved.remaining.every((id) => approved.includes(id));
  const lastPlayed = approved.includes(saved.lastPlayed ?? "") ? saved.lastPlayed : undefined;
  const remaining = savedIdsAreValid ? saved.remaining.slice() : freshBag(approved, lastPlayed, random);
  const bag = remaining.length ? remaining : freshBag(approved, lastPlayed, random);
  const next = bag.shift()!;
  state[tier] = { remaining: bag, lastPlayed: next };
  writeState(state, store);
  return next;
}

/** Clear one tier's cycle. Its next request starts a newly shuffled bag. */
export function resetReplayBag(tier: TierId, store: KeyValueStore | null = browserStorage()): void {
  const state = readState(store);
  state[tier] = emptyTier();
  writeState(state, store);
}

/** Clear every tier's cycle without affecting scores or any other settings. */
export function resetAllReplayBags(store: KeyValueStore | null = browserStorage()): void {
  writeState(emptyReplayState(), store);
}

/** Read-only diagnostic/testing view; callers receive fresh arrays. */
export function getReplayState(store: KeyValueStore | null = browserStorage()): ReplayState {
  const state = readState(store);
  return {
    version: 1,
    tuklas: { ...state.tuklas, remaining: state.tuklas.remaining.slice() },
    unawa: { ...state.unawa, remaining: state.unawa.remaining.slice() },
    kilos: { ...state.kilos, remaining: state.kilos.remaining.slice() },
  };
}
