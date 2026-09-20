import { describe, expect, it } from "vitest";
import * as candidateLevels from "../src/data/candidateLevels";
import { qualityThresholds } from "../src/game/solutionQuality";

describe("fixed UAT candidates", () => {
  it("records the requested 10, 21, and 28 move candidates without release approval", () => {
    expect((candidateLevels as { uatCandidates?: unknown }).uatCandidates).toEqual(expect.objectContaining({
      tuklas: expect.objectContaining({ candidateId: "tuklas-df007c26-66", exactMinimum: 10, manualUatApproved: false }),
      unawa: expect.objectContaining({ candidateId: "unawa-90a18d5c-151", exactMinimum: 21, manualUatApproved: false }),
      kilos: expect.objectContaining({ candidateId: "kilos-811429d4-451", exactMinimum: 28, manualUatApproved: false }),
    }));
  });

  it("does not retain obsolete per-tier production move ranges", () => {
    expect(qualityThresholds.unawa).not.toHaveProperty("minimumMoves");
    expect(qualityThresholds.kilos).not.toHaveProperty("minimumMoves");
  });

  it("exposes fixed fixtures only when local UAT mode is enabled", () => {
    const getUatCandidate = (candidateLevels as { getUatCandidate?: (tier: "tuklas" | "unawa" | "kilos", enabled: boolean) => { candidateId: string } | undefined }).getUatCandidate;
    expect(getUatCandidate?.("tuklas", false)).toBeUndefined();
    expect(getUatCandidate?.("unawa", false)).toBeUndefined();
    expect(getUatCandidate?.("kilos", false)).toBeUndefined();
    expect(getUatCandidate?.("tuklas", true)?.candidateId).toBe("tuklas-df007c26-66");
    expect(getUatCandidate?.("unawa", true)?.candidateId).toBe("unawa-90a18d5c-151");
    expect(getUatCandidate?.("kilos", true)?.candidateId).toBe("kilos-811429d4-451");
  });

  it("enables local UAT only for the explicit Vite true value", () => {
    const isUatModeEnabled = (candidateLevels as { isUatModeEnabled?: (value: string | undefined) => boolean }).isUatModeEnabled;
    expect(isUatModeEnabled?.("true")).toBe(true);
    expect(isUatModeEnabled?.("TRUE")).toBe(false);
    expect(isUatModeEnabled?.("false")).toBe(false);
    expect(isUatModeEnabled?.(undefined)).toBe(false);
  });
});
