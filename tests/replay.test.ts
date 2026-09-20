import { describe, expect, it } from "vitest";
import { getNextVariant, getReplayState, replayStorageKey, resetAllReplayBags, resetReplayBag } from "../src/game/replay";
import { bestScoreKey, getBestScore, saveBestScore } from "../src/game/storage";

class MemoryStore {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const deterministicRandom = () => 0;

describe("replay shuffle bags", () => {
  it("uses every approved variant before repetition and avoids a boundary repeat", () => {
    const store = new MemoryStore(); const pool = ["T1", "T2", "T3"];
    const firstCycle = pool.map(() => getNextVariant("tuklas", pool, deterministicRandom, store));
    const secondCycle = pool.map(() => getNextVariant("tuklas", pool, deterministicRandom, store));
    expect(new Set(firstCycle).size).toBe(3);
    expect(new Set(secondCycle).size).toBe(3);
    expect(secondCycle[0]).not.toBe(firstCycle[2]);
  });

  it("handles one- and two-variant pools", () => {
    const store = new MemoryStore();
    expect(getNextVariant("unawa", ["U1"], deterministicRandom, store)).toBe("U1");
    expect(getNextVariant("unawa", ["U1"], deterministicRandom, store)).toBe("U1");
    const first = getNextVariant("kilos", ["K1", "K2"], deterministicRandom, store);
    const second = getNextVariant("kilos", ["K1", "K2"], deterministicRandom, store);
    const third = getNextVariant("kilos", ["K1", "K2"], deterministicRandom, store);
    expect(first).not.toBe(second); expect(third).not.toBe(second);
  });

  it("self-recovers corrupt or stale saved tier IDs", () => {
    const store = new MemoryStore();
    store.setItem(replayStorageKey, JSON.stringify({ version: 1, tuklas: { remaining: ["T2", "removed"], lastPlayed: "removed" }, unawa: {}, kilos: {} }));
    const next = getNextVariant("tuklas", ["T1", "T2"], deterministicRandom, store);
    expect(["T1", "T2"]).toContain(next);
    expect(getReplayState(store).tuklas.remaining).not.toContain("removed");
  });

  it("resets only the requested bag or all bags", () => {
    const store = new MemoryStore();
    getNextVariant("tuklas", ["T1", "T2"], deterministicRandom, store);
    getNextVariant("unawa", ["U1", "U2"], deterministicRandom, store);
    resetReplayBag("tuklas", store);
    expect(getReplayState(store).tuklas.remaining).toEqual([]);
    expect(getReplayState(store).unawa.lastPlayed).toBeDefined();
    resetAllReplayBags(store);
    expect(getReplayState(store).unawa.remaining).toEqual([]);
  });
});

describe("variant-specific best scores", () => {
  it("isolates records per variant and does not read v2 tier-only data", () => {
    const store = new MemoryStore();
    store.setItem("sdg-escape.v2.best.tuklas", JSON.stringify({ moves: 1, elapsedMs: 1 }));
    expect(getBestScore("tuklas", "T1", store)).toBeNull();
    saveBestScore("tuklas", { moves: 12, elapsedMs: 3000 }, "T1", store);
    saveBestScore("tuklas", { moves: 9, elapsedMs: 5000 }, "T2", store);
    expect(getBestScore("tuklas", "T1", store)).toEqual({ moves: 12, elapsedMs: 3000 });
    expect(getBestScore("tuklas", "T2", store)).toEqual({ moves: 9, elapsedMs: 5000 });
    expect(getBestScore("tuklas", "T3", store)).toBeNull();
    expect(store.getItem(bestScoreKey("tuklas", "T1"))).toBeTruthy();
  });
});
