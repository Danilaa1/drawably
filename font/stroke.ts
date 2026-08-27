// pen → outline. A font is filled shapes, so each stroke's point list is
// offset to both sides of the pen and closed with round caps. Every point is
// off-curve: TrueType then draws the quadratic through the midpoints, which
// is the same smoothing toPath applies to the on-screen strokes.

import type { Pt } from "../dist/rough.js";
import type { Point } from "./ttf.ts";

const CAP_SEGMENTS = 4;
// a join sharper than this is a corner the skeleton should have split into
// two strokes; the miter is capped so a jitter kink can't spike
const MITER_LIMIT = 2;

function unit(dx: number, dy: number): Pt {
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
}

function area(pts: Pt[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
}

/** TrueType wants outer contours clockwise in y-up coordinates: negative area */
function clockwise(pts: Pt[]): Pt[] {
  return area(pts) > 0 ? [...pts].reverse() : pts;
}

function offsets(pts: Pt[], r: number, closed: boolean): { left: Pt[]; right: Pt[] } {
  const n = pts.length;
  const left: Pt[] = [];
  const right: Pt[] = [];
  const tangent = (i: number): Pt => {
    const a = pts[(i - 1 + n) % n];
    const b = pts[(i + 1) % n];
    if (!closed && i === 0) return unit(b[0] - pts[0][0], b[1] - pts[0][1]);
    if (!closed && i === n - 1) return unit(pts[i][0] - a[0], pts[i][1] - a[1]);
    const din = unit(pts[i][0] - a[0], pts[i][1] - a[1]);
    const dout = unit(b[0] - pts[i][0], b[1] - pts[i][1]);
    return unit(din[0] + dout[0], din[1] + dout[1]);
  };
  for (let i = 0; i < n; i++) {
    const [tx, ty] = tangent(i);
    const nx = -ty;
    const ny = tx;
    // the averaged tangent's normal is the miter direction; scale it so the
    // offset edge stays r from both segments
    let scale = 1;
    if (closed || (i > 0 && i < n - 1)) {
      const a = pts[(i - 1 + n) % n];
      const din = unit(pts[i][0] - a[0], pts[i][1] - a[1]);
      const cos = Math.abs(din[0] * tx + din[1] * ty) || 1;
      scale = Math.min(1 / cos, MITER_LIMIT);
    }
    left.push([pts[i][0] + nx * r * scale, pts[i][1] + ny * r * scale]);
    right.push([pts[i][0] - nx * r * scale, pts[i][1] - ny * r * scale]);
  }
  return { left, right };
}

function cap(at: Pt, tangent: Pt, r: number): Pt[] {
  const [tx, ty] = tangent;
  const out: Pt[] = [];
  for (let k = 1; k < CAP_SEGMENTS; k++) {
    const phi = Math.PI / 2 - (k * Math.PI) / CAP_SEGMENTS;
    const cx = Math.cos(phi);
    const sy = Math.sin(phi);
    out.push([at[0] + r * (cx * tx - sy * ty), at[1] + r * (cx * ty + sy * tx)]);
  }
  return out;
}

const off = (pts: Pt[]): Point[] => pts.map(([x, y]) => ({ x, y, on: false }));

/** an open pen stroke: one contour */
export function strokeOutline(pts: Pt[], pen: number): Point[][] {
  const r = pen / 2;
  const { left, right } = offsets(pts, r, false);
  const n = pts.length;
  const tEnd = unit(pts[n - 1][0] - pts[n - 2][0], pts[n - 1][1] - pts[n - 2][1]);
  const tStart = unit(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
  const ring = [...left, ...cap(pts[n - 1], tEnd, r).map(([x, y]): Pt => [x, y]), ...right.reverse(), ...cap(pts[0], tStart, r).map(([x, y]): Pt => [x, y])];
  return [off(clockwise(ring))];
}

/** a closed pen stroke (a bowl): outer ring clockwise, inner ring the other way */
export function ringOutline(pts: Pt[], pen: number): Point[][] {
  const r = pen / 2;
  const { left, right } = offsets(pts, r, true);
  const outerFirst = Math.abs(area(left)) > Math.abs(area(right));
  const outer = clockwise(outerFirst ? left : right);
  const inner = [...clockwise(outerFirst ? right : left)].reverse();
  return [off(outer), off(inner)];
}
