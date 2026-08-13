import { describe, expect, it } from "vitest";
import {
  type RoughOptions,
  roughCheckmark,
  roughLine,
  roughRoundedRect,
  scribbleFill,
  variants,
} from "../src/rough.js";

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
  const gen = (ro: RoughOptions) => roughRoundedRect(0, 0, 100, 40, 8, ro);

  it("returns 3 distinct deterministic frames when boiling", () => {
    const bo = { ...o, boil: 0.5 };
    const a = variants(gen, bo);
    const b = variants(gen, bo);
    expect(a).toHaveLength(3);
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(3);
  });

  it("returns identical frames without boil", () => {
    expect(new Set(variants(gen, o)).size).toBe(1);
  });

  it("boil moves points less than a different seed does", () => {
    const nums = (d: string) => [...d.matchAll(/-?[\d.]+/g)].map((m) => Number(m[0]));
    const drift = (a: string, b: string) => {
      const na = nums(a);
      const nb = nums(b);
      return Math.max(...na.map((v, i) => Math.abs(v - nb[i])));
    };
    const [f0, f1] = variants(gen, { ...o, boil: 0.5 });
    const other = gen({ ...o, seed: 43 });
    expect(drift(f0, f1)).toBeLessThanOrEqual(2 * 0.5 + 1e-9);
    expect(drift(f0, other)).toBeGreaterThan(2 * 0.5);
  });
});
