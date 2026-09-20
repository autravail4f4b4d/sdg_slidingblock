import type { Move, PuzzleLevel } from "../game/types";

/** The three visitor-facing difficulty tiers. */
export const productionTiers = ["tuklas", "unawa", "kilos"] as const;
export type ProductionTier = (typeof productionTiers)[number];

/**
 * A pre-generated puzzle that has passed every promotion gate.  These flags
 * are intentionally data, rather than something the runtime can infer: the
 * manual-UAT decision belongs to the release process.
 */
export type ProductionLevelVariant = PuzzleLevel & {
  tier: ProductionTier;
  variantId: string;
  exactMinimum: number;
  minimumMoves: number;
  solution: Move[];
  qualityApproved: true;
  manualUatApproved: true;
};

export type ProductionPools = Record<ProductionTier, readonly ProductionLevelVariant[]>;

/**
 * Release-only pools. Do not add a candidate here until `verify:pools` has
 * passed and its manual UAT sign-off has been recorded.
 *
 * There are presently no approved all-axis candidates. Keeping the pools
 * empty is deliberate: the retired smoke layouts must never be promoted just
 * to make a pool non-empty.
 */
export const productionPools: ProductionPools = {
  tuklas: [],
  unawa: [],
  kilos: [],
};

export function getProductionPool(tier: ProductionTier): readonly ProductionLevelVariant[] {
  return productionPools[tier];
}

export function getProductionVariant(tier: ProductionTier, variantId: string): ProductionLevelVariant | undefined {
  return getProductionPool(tier).find((variant) => variant.variantId === variantId);
}
