import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles.css", "utf8");
const main = readFileSync("src/main.ts", "utf8");

describe("post-UAT typography and copy", () => {
  it("uses the local two-font system and metric numerals", () => {
    expect(css).toContain("Bricolage Grotesque"); expect(css).toContain("Source Serif 4");
    expect(css).toContain("font-variant-numeric: tabular-nums");
    for (const prohibited of ["Arial", "Roboto", "Open Sans", "Montserrat", "Inter", "system-ui"]) expect(css).not.toContain(prohibited);
  });
  it("keeps the approved landing and intro copy", () => {
    expect(main).toContain("A sliding puzzle for the 17 Goals");
    expect(main).toContain("Slide the 17 Goals to create a path for Sustainable Development");
    expect(main).not.toContain("Sustainable Development.");
    expect(main).toContain("Make room for 2030"); expect(main).not.toContain("Make room for 2030.");
  });
});
