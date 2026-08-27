// node --experimental-strip-types font/build.ts → font/DrawablyPen.ttf
import { writeFileSync } from "node:fs";
import { mulberry32 } from "../dist/prng.js";
import { ellipsePoints, jitter, sampleLine, type Pt } from "../dist/rough.js";
import { ASC, CAP, DESC, GLYPHS, UPM, X_HEIGHT, type Skeleton } from "./glyphs.ts";
import { ringOutline, strokeOutline } from "./stroke.ts";
import { buildTTF, type Glyph } from "./ttf.ts";

export const FAMILY = "Drawably Pen";
export const PEN = 84;
// pen wobble in em units: invisible at 16px, a hair at 48px, the whole point
// on a headline (tuned against the site's hero wordmark)
const AMP = 14;
// sample spacing: the library's 8px at the ~13px-per-100-units the controls
// draw at, so the wobble has the same rhythm
const STEP = 60;
const SIDE = 70;
const SEED = 42;
const SPACE = 260;

function sample(s: Skeleton): Pt[] {
  switch (s.kind) {
    case "line":
      return sampleLine(s.x1, s.y1, s.x2, s.y2, STEP);
    case "arc": {
      const n = Math.max(3, Math.ceil((Math.abs(s.a1 - s.a0) * (s.rx + s.ry)) / 2 / STEP));
      return ellipsePoints(s.cx, s.cy, s.rx, s.ry, s.a0, s.a1, n);
    }
    case "ring": {
      const n = Math.max(8, Math.ceil((Math.PI * (s.rx + s.ry)) / STEP));
      return ellipsePoints(s.cx, s.cy, s.rx, s.ry, 0, Math.PI * 2, n).slice(0, -1);
    }
  }
}

function glyph(ch: string): Glyph {
  const def = GLYPHS[ch];
  const code = ch.codePointAt(0)!;
  const rand = mulberry32(SEED + code);
  const dx = SIDE + PEN / 2;
  const contours = def.strokes.flatMap((s) => {
    const pts = jitter(sample(s), rand, AMP).map(([x, y]): Pt => [x + dx, y]);
    return s.kind === "ring" ? ringOutline(pts, PEN) : strokeOutline(pts, PEN);
  });
  return { code, advance: def.w + PEN + SIDE * 2, contours };
}

export function glyphs(): Glyph[] {
  const box: Pt[] = [[100, 0], [100, CAP], [500, CAP], [500, 0]];
  return [
    { advance: 600, contours: ringOutline(box, PEN / 2) },
    { code: 32, advance: SPACE, contours: [] },
    ...Object.keys(GLYPHS).map(glyph),
  ];
}

export function build(): Uint8Array {
  return buildTTF(glyphs(), {
    family: FAMILY,
    unitsPerEm: UPM,
    ascender: ASC + 80,
    descender: DESC - 40,
    xHeight: X_HEIGHT,
    capHeight: CAP,
    pen: PEN,
  });
}

if (process.argv[1]?.endsWith("build.ts")) {
  const out = new URL("./DrawablyPen.ttf", import.meta.url);
  const ttf = build();
  writeFileSync(out, ttf);
  console.log(`${out.pathname} ${ttf.length} bytes, ${Object.keys(GLYPHS).length + 2} glyphs`);
}
