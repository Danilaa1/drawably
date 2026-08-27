import { describe, expect, it } from "vitest";
import { ringOutline, strokeOutline } from "../font/stroke.js";
import type { Pt } from "../dist/rough.js";

const area = (pts: { x: number; y: number }[]) =>
  pts.reduce((a, p, i) => {
    const q = pts[(i + 1) % pts.length];
    return a + (p.x * q.y - q.x * p.y) / 2;
  }, 0);

describe("stroke outline", () => {
  it("wraps a horizontal line in one clockwise contour the pen's width tall", () => {
    const [c] = strokeOutline([[0, 0], [100, 0], [200, 0]], 40);
    expect(c.every((p) => !p.on)).toBe(true);
    expect(area(c)).toBeLessThan(0);
    const ys = c.map((p) => p.y);
    expect(Math.max(...ys)).toBeCloseTo(20);
    expect(Math.min(...ys)).toBeCloseTo(-20);
    const xs = c.map((p) => p.x);
    expect(Math.max(...xs)).toBeCloseTo(220); // round cap reaches r past the end
    expect(Math.min(...xs)).toBeCloseTo(-20);
  });

  it("keeps a right-angle join within the miter limit", () => {
    const [c] = strokeOutline([[0, 0], [100, 0], [100, 100]], 40);
    const xs = c.map((p) => p.x);
    expect(Math.max(...xs)).toBeLessThanOrEqual(100 + 40);
  });

  it("makes a ring from a closed loop, outer clockwise and inner reversed", () => {
    const n = 16;
    const circle: Pt[] = Array.from({ length: n }, (_, i) => [
      100 * Math.cos((i / n) * Math.PI * 2),
      100 * Math.sin((i / n) * Math.PI * 2),
    ]);
    const [outer, inner] = ringOutline(circle, 40);
    expect(area(outer)).toBeLessThan(0);
    expect(area(inner)).toBeGreaterThan(0);
    expect(Math.max(...outer.map((p) => p.x))).toBeCloseTo(120, 0);
    expect(Math.max(...inner.map((p) => p.x))).toBeCloseTo(80, 0);
  });
});
