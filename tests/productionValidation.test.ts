import { describe, expect, it } from "vitest";
import { productionPools, type ProductionLevelVariant, type ProductionPools } from "../src/data/productionLevels";
import { validateProductionPools } from "../src/data/productionValidation";
import { uatCandidates } from "../src/data/candidateLevels";
import type { PuzzleLevel } from "../src/game/types";

const oneMoveLevel: PuzzleLevel = {
  id: "tuklas", name: "Validation fixture", description: "fixture", boardWidth: 6, boardHeight: 6, exitColumns: [2, 3], minimumMoves: 1,
  pieces: [
    ...Array.from({ length: 17 }, (_, index) => ({ id: `sdg-${index + 1}`, sdg: index + 1, x: index % 6, y: Math.floor(index / 6), width: 1, height: 1 })),
    { id: "sdg-master", x: 2, y: 4, width: 2, height: 2, target: true },
  ],
  solution: [{ pieceId: "sdg-master", direction: "down", distance: 0 }],
};

function poolsWith(variant: ProductionLevelVariant): ProductionPools {
  return { tuklas: [variant], unawa: [], kilos: [] };
}

describe("production pool validation", () => {
  it("keeps unapproved smoke/candidate data out of release pools", () => {
    const result = validateProductionPools(productionPools);
    expect(result.failures).toEqual([]);
    expect(result.tiersBelowUsefulMinimum).toEqual(["tuklas", "unawa", "kilos"]);
  });

  it("rejects variants without recorded manual UAT approval", () => {
    const candidate = {
      ...oneMoveLevel, tier: "tuklas", variantId: "T-invalid", exactMinimum: 1, qualityApproved: true, manualUatApproved: false,
    } as unknown as ProductionLevelVariant;
    const result = validateProductionPools(poolsWith(candidate), 10_000);
    expect(result.failures.map((failure) => failure.reason)).toContain("is not manual-UAT approved");
  });

  it("requires strictly increasing exact difficulty once every tier is promoted", () => {
    const toProduction = (candidate: typeof uatCandidates.tuklas | typeof uatCandidates.unawa | typeof uatCandidates.kilos) => ({
      ...candidate, tier: candidate.id, variantId: candidate.candidateId, manualUatApproved: true,
    }) as unknown as ProductionLevelVariant;
    const pools: ProductionPools = {
      tuklas: [toProduction(uatCandidates.tuklas)],
      unawa: [toProduction(uatCandidates.unawa)],
      kilos: [{ ...toProduction(uatCandidates.kilos), exactMinimum: 20, minimumMoves: 20 }],
    };
    const result = validateProductionPools(pools, 1);
    expect(result.failures.map((failure) => failure.reason)).toContain("does not preserve strictly increasing exact difficulty across tiers");
  });
});
