import { legacySmokeLayouts } from "./smokeFixtures";
import type { PuzzleLevel } from "../game/types";

const publicMetadata: Pick<PuzzleLevel, "id" | "name" | "description">[] = [
  { id: "tuklas", name: "TUKLAS", description: "Discover the Goals" },
  { id: "unawa", name: "UNAWA", description: "Understand the Connections" },
  { id: "kilos", name: "KILOS", description: "Move Toward 2030" },
];

/**
 * Transitional playable layouts. They intentionally carry no claimed minimum:
 * their old 4/6/9 values belonged to orientation-restricted movement. Replace
 * these only with exact-solver and quality-gate approved production finalists.
 */
export const levels: PuzzleLevel[] = legacySmokeLayouts.map((fixture, index) => ({
  ...fixture,
  ...publicMetadata[index],
  minimumMoves: undefined,
}));

export const getLevel = (id: PuzzleLevel["id"]) => levels.find((level) => level.id === id)!;
