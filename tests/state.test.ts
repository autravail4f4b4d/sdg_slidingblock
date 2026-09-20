import { describe, expect, it } from "vitest";
import { getLevel } from "../src/data/levels";
import { applyMove, getMaxTravel } from "../src/game/movement";
import { newGame, recordMove, resetGame, undo } from "../src/game/state";

describe("game state", () => {
  it("undo restores the prior coordinates and move count", () => {
    const level = getLevel("tuklas"); const state = newGame(level);
    const piece = level.pieces.find((candidate) => ["up", "down", "left", "right"].some((direction) => getMaxTravel(candidate.id, direction as "up", state.pieces, level) > 0))!;
    const direction = ["up", "down", "left", "right"].find((candidate) => getMaxTravel(piece.id, candidate as "up", state.pieces, level) > 0)!;
    const next = recordMove(state, applyMove(piece.id, direction as "up", 1, state.pieces, level));
    expect(next.moves).toBe(1); expect(undo(next).pieces).toEqual(state.pieces); expect(undo(next).moves).toBe(0);
    expect(undo(state)).toEqual(state);
  });
  it("does not mutate canonical pieces until a drag is committed as one move", () => {
    const level = getLevel("tuklas"); const state = newGame(level);
    const piece = state.pieces.find((candidate) => ["up", "down", "left", "right"].some((direction) => getMaxTravel(candidate.id, direction as "up", state.pieces, level) > 0))!;
    const direction = ["up", "down", "left", "right"].find((candidate) => getMaxTravel(piece.id, candidate as "up", state.pieces, level) > 0)!;
    const proposed = applyMove(piece.id, direction as "up", 1, state.pieces, level);
    expect(state.pieces).toEqual(level.pieces);
    expect(state.moves).toBe(0);
    expect(recordMove(state, proposed).moves).toBe(1);
  });
  it("does not add history for a released or cancelled no-op drag", () => {
    const state = newGame(getLevel("tuklas"));
    expect(recordMove(state, state.pieces)).toBe(state);
    expect(state.history).toEqual([]);
  });
  it("keeps the selected variant when restarting that level", () => {
    const variant = { ...getLevel("tuklas"), variantId: "T2" };
    expect(newGame(variant).variantId).toBe("T2");
    expect(resetGame(variant).variantId).toBe("T2");
  });
});
