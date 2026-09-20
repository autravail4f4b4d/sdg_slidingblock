import { applyMove, hasOverlaps, isInsideBoard, targetCanExit } from "../game/movement";
import { legalMoves } from "../game/solver";
import type { Move, PuzzlePiece } from "../game/types";
import { evaluateCandidate } from "../game/levelSelection";
import { productionTiers, type ProductionLevelVariant, type ProductionPools, type ProductionTier } from "./productionLevels";

export type ProductionValidationFailure = {
  tier: ProductionTier;
  variantId: string;
  reason: string;
};

export type ProductionPoolValidation = {
  candidateCount: number;
  approvedCount: number;
  failures: ProductionValidationFailure[];
  tierCounts: Record<ProductionTier, number>;
  tiersBelowUsefulMinimum: ProductionTier[];
  tiersBelowPreferredMinimum: ProductionTier[];
};

const clonePieces = (pieces: PuzzlePiece[]) => pieces.map((piece) => ({ ...piece }));

function hasCompleteSdgSet(variant: ProductionLevelVariant): boolean {
  const sdgs = variant.pieces.flatMap((piece) => piece.sdg === undefined ? [] : [piece.sdg]).sort((left, right) => left - right);
  return sdgs.length === 17 && sdgs.every((sdg, index) => sdg === index + 1) && variant.pieces.filter((piece) => piece.target).length === 1;
}

function isExactStoredSolution(variant: ProductionLevelVariant): boolean {
  if (!variant.solution || variant.solution.length !== variant.exactMinimum) return false;
  let pieces = clonePieces(variant.pieces);
  for (const move of variant.solution) {
    const legal = legalMoves(pieces, variant).some((candidate: Move) => candidate.pieceId === move.pieceId && candidate.direction === move.direction && candidate.distance === move.distance);
    if (!legal) return false;
    pieces = applyMove(move.pieceId, move.direction, move.distance, pieces, variant);
  }
  return targetCanExit(pieces, variant);
}

/**
 * Performs the release promotion checks. This is intentionally separate from
 * runtime selection: tablets only read pre-approved data and never solve
 * puzzles while a visitor is playing.
 */
export function validateProductionPools(pools: ProductionPools, maxStates?: number): ProductionPoolValidation {
  const failures: ProductionValidationFailure[] = [];
  const tierCounts = Object.fromEntries(productionTiers.map((tier) => [tier, 0])) as Record<ProductionTier, number>;
  const seenVariantIds = new Set<string>();
  let candidateCount = 0;

  for (const tier of productionTiers) {
    for (const variant of pools[tier]) {
      candidateCount += 1;
      tierCounts[tier] += 1;
      const fail = (reason: string) => failures.push({ tier, variantId: variant.variantId, reason });

      if (variant.tier !== tier) fail(`declares tier ${variant.tier}, but is in the ${tier} pool`);
      if (!variant.variantId.trim()) fail("has no variant ID");
      if (seenVariantIds.has(variant.variantId)) fail("duplicates a production variant ID");
      seenVariantIds.add(variant.variantId);
      if (variant.id !== tier) fail(`uses level ID ${variant.id}, expected ${tier}`);
      if (variant.qualityApproved !== true) fail("is not quality approved");
      if (variant.manualUatApproved !== true) fail("is not manual-UAT approved");
      if (variant.minimumMoves !== variant.exactMinimum) fail(`displays minimum ${variant.minimumMoves}, expected verified minimum ${variant.exactMinimum}`);
      if (!hasCompleteSdgSet(variant)) fail("does not contain exactly one of each SDG and one target");
      if (!variant.pieces.every((piece) => isInsideBoard(piece, variant)) || hasOverlaps(variant.pieces)) fail("has invalid board geometry");
      if (!isExactStoredSolution(variant)) fail("does not carry a legal stored exact solution");

      const report = evaluateCandidate(variant, variant.variantId, maxStates);
      if (report.exactMinimum === null) fail("exact solver did not prove a solution within the configured state budget");
      else if (report.exactMinimum !== variant.exactMinimum) fail(`declares exact minimum ${variant.exactMinimum}, solver proved ${report.exactMinimum}`);
      if (report.quality?.pass !== true) fail("does not pass the quality gate");
    }
  }

  const exactMinima = Object.fromEntries(productionTiers.map((tier) => [tier, pools[tier].map((variant) => variant.exactMinimum)])) as Record<ProductionTier, number[]>;
  const hasEveryTier = productionTiers.every((tier) => exactMinima[tier].length > 0);
  if (hasEveryTier) {
    const highestTuklas = Math.max(...exactMinima.tuklas);
    const lowestUnawa = Math.min(...exactMinima.unawa);
    const highestUnawa = Math.max(...exactMinima.unawa);
    const lowestKilos = Math.min(...exactMinima.kilos);
    if (highestTuklas >= lowestUnawa || highestUnawa >= lowestKilos) {
      for (const tier of productionTiers) {
        for (const variant of pools[tier]) failures.push({ tier, variantId: variant.variantId, reason: "does not preserve strictly increasing exact difficulty across tiers" });
      }
    }
  }
  const approvedCount = candidateCount - new Set(failures.map((failure) => `${failure.tier}:${failure.variantId}`)).size;

  return {
    candidateCount,
    approvedCount,
    failures,
    tierCounts,
    tiersBelowUsefulMinimum: productionTiers.filter((tier) => tierCounts[tier] < 3),
    tiersBelowPreferredMinimum: productionTiers.filter((tier) => tierCounts[tier] < 5),
  };
}
