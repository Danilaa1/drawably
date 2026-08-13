import { describe, expect, it } from "vitest";
import { roughCheckmark, roughLine, roughRoundedRect, scribbleFill, variants } from "../src/rough.js";

const o = { seed: 42, roughness: 1 };

describe("rough generators", () => {
  it("are deterministic for a seed", () => {
    expect(roughRoundedRect(0, 0, 100, 40, 8, o)).toBe(roughRoundedRect(0, 0, 100, 40, 8, o));
    expect(roughCheckmark(0, 0, 12, 12, o)).toBe(roughCheckmark(0, 0, 12, 12, o));
    expect(scribbleFill(0, 0, 100, 40, o)).toBe(scribbleFill(0, 0, 100, 40, o));
  });

  it("differ across seeds", () => {
    expect(roughRoundedRect(0, 0, 100, 40, 8, o)).not.toBe(
      roughRoundedRect(0, 0, 100, 40, 8, { ...o, seed: 43 }),
    );
  });

  it("double-strokes line and rect (two subpaths)", () => {
    expect(roughLine(0, 0, 100, 0, o).match(/M/g)).toHaveLength(2);
    expect(roughRoundedRect(0, 0, 100, 40, 8, o).match(/M/g)).toHaveLength(2);
  });

  it("single-strokes the checkmark for pathLength draw-on", () => {
    expect(roughCheckmark(0, 0, 12, 12, o).match(/M/g)).toHaveLength(1);
  });

  it("closes the rect subpaths", () => {
    expect(roughRoundedRect(0, 0, 100, 40, 8, o).match(/Z/g)).toHaveLength(2);
  });

  it("roughness 0 keeps points on the ideal line", () => {
    const d = roughLine(0, 5, 100, 5, { seed: 1, roughness: 0 });
    const ys = [...d.matchAll(/[\d.]+ ([\d.]+)/g)].map((m) => Number(m[1]));
    for (const y of ys) expect(y).toBeCloseTo(5, 5);
  });
});

describe("variants", () => {
  it("returns 3 distinct deterministic paths", () => {
    const gen = (ro: { seed: number; roughness: number }) => roughRoundedRect(0, 0, 100, 40, 8, ro);
    const a = variants(gen, o);
    const b = variants(gen, o);
    expect(a).toHaveLength(3);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(3);
  });
});
