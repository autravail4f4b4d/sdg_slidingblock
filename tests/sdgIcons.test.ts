import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { sdgs } from "../src/data/sdgs";

describe("local SDG icon assets", () => {
  it("maps every official goal to a locally bundled square icon", () => {
    for (const sdg of sdgs) {
      const asset = (sdg as typeof sdg & { iconPath?: string }).iconPath;
      expect(asset).toBe(`/assets/sdg/goal-${String(sdg.number).padStart(2, "0")}.png`);
      expect(existsSync(resolve(process.cwd(), "public", asset!.slice(1)))).toBe(true);
    }
  });
});
