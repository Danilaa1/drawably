import type { CSSProperties, ReactNode } from "react";
import { Easing, continueRender, delayRender, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { roughCircle, roughLine, roughRoundedRect, variants } from "drawably";
import type { RoughOptions } from "drawably";
import penUrl from "../font/DrawablyPen.ttf";

// brand
export const PAPER = "#e3e3e1";
export const PEN = "#2724d1";
export const ERROR = "#d12724";
export const SUCCESS = "#188a42";
export const INK = "#18181b";
export const INK_2 = "#474645";
export const INK_3 = "#a1a1aa";
export const SANS = 'Geist, Inter, "Helvetica Neue", system-ui, sans-serif';
export const MONO = '"Geist Mono", "SFMono-Regular", Menlo, monospace';
// everything lettered inside a sketch is in the pen, like the site's demos;
// headlines stay in the UI face, code in mono
export const PEN_FACE = '"Drawably Pen", Geist, sans-serif';
const penFont = delayRender("Drawably Pen");
new FontFace("Drawably Pen", `url(${penUrl})`).load().then((face) => {
  document.fonts.add(face);
  continueRender(penFont);
});

export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FPS = 30;


// strokes are drawn ~3× the size the library draws them at; roughness and
// boil scale up with them or the wobble vanishes on a 1080p canvas
export const ROUGH = { roughness: 1.15, boil: 0.5 };
// the library's 1200 ms three-frame cycle, in frames of whatever rate the film runs at
const BOIL_SECONDS = 0.4;
export const boilFrames = (fps: number) => Math.round(fps * BOIL_SECONDS);
export const boilIndex = (frame: number, fps: number, n = 3) => Math.floor(frame / boilFrames(fps)) % n;
export const INSET = 3;
export const HERO = { w: 440, h: 112, r: 12, stroke: 3.5 };

export const ease = Easing.bezier(0.2, 0, 0, 1); // --drawably-ease
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const ramp = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], { ...clamp, easing: ease });
// a pen travels at a steady speed with soft ends, unlike UI which decelerates
export const pen = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Gen = (o: RoughOptions) => string;

export const rect =
  (w: number, h: number, r: number): Gen =>
  (o) =>
    roughRoundedRect(INSET, INSET, w - 2 * INSET, h - 2 * INSET, r, o);

export function Rough({
  gen,
  seed,
  draw = 1,
  color = PEN,
  width = 3,
  fill = "none",
  opacity = 1,
  rough = ROUGH,
}: {
  gen: Gen;
  seed: number;
  draw?: number;
  color?: string;
  width?: number;
  fill?: string;
  opacity?: number;
  rough?: { roughness: number; boil: number };
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frames = variants(gen, { ...rough, seed });
  return (
    <path
      d={frames[boilIndex(frame, fps, frames.length)]}
      fill={fill}
      opacity={draw <= 0 ? 0 : opacity}
      pathLength={1}
      stroke={color}
      strokeDasharray={1}
      strokeDashoffset={1 - draw}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={width}
    />
  );
}

export function Svg({ x, y, w, h, style, children }: { x: number; y: number; w: number; h: number; style?: CSSProperties; children: ReactNode }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: x, top: y, overflow: "visible", ...style }}>
      {children}
    </svg>
  );
}

// rise in, settle, blur out. `out` is optional: some things stay to the cut
export function Rise({
  from,
  dur = 14,
  out,
  outDur = 10,
  dy = 28,
  style,
  children,
}: {
  from: number;
  dur?: number;
  out?: number;
  outDur?: number;
  dy?: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const frame = useCurrentFrame();
  const enter = ramp(frame, from, from + dur);
  const exit = out === undefined ? 0 : ramp(frame, out, out + outDur);
  const v = enter * (1 - exit);
  return (
    <div
      style={{
        position: "absolute",
        opacity: v,
        filter: `blur(${(1 - v) * 10}px)`,
        transform: `translateY(${(1 - enter) * dy - exit * dy * 0.4}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export const headline: CSSProperties = {
  left: 0,
  right: 0,
  color: INK,
  fontFamily: SANS,
  fontSize: 104,
  fontWeight: 500,
  letterSpacing: "-0.05em",
  lineHeight: 1,
  textAlign: "center",
};

export const caption: CSSProperties = {
  left: 0,
  right: 0,
  color: INK_2,
  fontFamily: MONO,
  fontSize: 19,
  letterSpacing: "0.16em",
  textAlign: "center",
  textTransform: "uppercase",
};

export function Grain() {
  return (
    <svg width="100%" height="100%" aria-hidden="true" style={{ position: "absolute", inset: 0, opacity: 0.035, mixBlendMode: "multiply" }}>
      <filter id="grain">
        <feTurbulence baseFrequency="0.9" numOctaves="2" seed="9" type="fractalNoise" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}

export function HeroButton({
  seed,
  draw = 1,
  color = PEN,
  label,
  labelOpacity = 1,
  opacity = 1,
}: {
  seed: number;
  draw?: number;
  color?: string;
  label: string;
  labelOpacity?: number;
  opacity?: number;
}) {
  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <Svg x={0} y={0} w={HERO.w} h={HERO.h}>
        <Rough gen={rect(HERO.w, HERO.h, HERO.r)} seed={seed} draw={draw} color={color} width={HERO.stroke} />
      </Svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          color,
          fontFamily: PEN_FACE,
          fontSize: 38,
          opacity: labelOpacity,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export const HERO_X = (WIDTH - HERO.w) / 2;
export const HERO_Y = (HEIGHT - HERO.h) / 2;
export const HEADLINE_Y = 760;
export const CURSOR = "M0 0 L0 20.5 L5 15.8 L8.6 24 L11.6 22.7 L8 14.6 L14.8 14.6 Z";
export type Pt = [number, number];
export interface Seg { len: number; at(t: number): Pt; }
export const QUAD_STEPS = 16;
export function segments(d: string): Seg[] {
  const segs: Seg[] = [];
  let cur: Pt = [0, 0];
  let start: Pt = [0, 0];
  const line = (a: Pt, b: Pt): Seg => ({ len: Math.hypot(b[0] - a[0], b[1] - a[1]), at: (t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)] });
  const quad = (a: Pt, c: Pt, b: Pt): Seg => {
    const at = (t: number): Pt => [
      (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
      (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
    ];
    let len = 0;
    let prev = a;
    for (let i = 1; i <= QUAD_STEPS; i++) {
      const p = at(i / QUAD_STEPS);
      len += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      prev = p;
    }
    return { len, at };
  };
  for (const [, cmd, rest] of d.matchAll(/([MLQZ])([^MLQZ]*)/g)) {
    const n = rest.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (cmd === "M") cur = start = [n[0], n[1]];
    else if (cmd === "L") { segs.push(line(cur, [n[0], n[1]])); cur = [n[0], n[1]]; }
    else if (cmd === "Q") { segs.push(quad(cur, [n[0], n[1]], [n[2], n[3]])); cur = [n[2], n[3]]; }
    else if (cmd === "Z") { segs.push(line(cur, start)); cur = start; }
  }
  return segs;
}
export function totalLength(segs: Seg[]): number {
  return segs.reduce((sum, seg) => sum + seg.len, 0);
}
export function pointAt(segs: Seg[], fraction: number): Pt {
  return pointAtLength(segs, Math.min(fraction, 1) * totalLength(segs));
}
export function pointAtLength(segs: Seg[], length: number): Pt {
  let target = Math.max(0, length);
  for (const seg of segs) {
    if (target <= seg.len) return seg.at(seg.len ? target / seg.len : 0);
    target -= seg.len;
  }
  return segs[segs.length - 1].at(1);
}

/* ---------- 6. close: the wordmark writes itself ---------- */

// the site's pen-lettered wordmark on a 100-unit grid: monoline lowercase,
// baseline 100, one stroke per pen lift so the film can draw them in order
const X_TOP = 45;
const BASE = 100;
export const ASC = 0;
export const DESC = 135;
const BOWL = (BASE - X_TOP) / 2;
const GAP = 12;
type Stroke = (x: number, o: RoughOptions) => string;
const wline =
  (x1: number, y1: number, x2: number, y2: number): Stroke =>
  (x, o) =>
    roughLine(x + x1, y1, x + x2, y2, o);
const stem = (dx: number, top: number) => wline(dx, top, dx, BASE);
const bowl: Stroke = (x, o) => roughCircle(x + BOWL, X_TOP + BOWL, BOWL, o);
const LETTERS: Record<string, { w: number; strokes: Stroke[] }> = {
  d: { w: BOWL * 2, strokes: [bowl, stem(BOWL * 2, ASC)] },
  r: { w: 32, strokes: [stem(0, X_TOP), wline(0, 64, 14, 48), wline(14, 48, 32, 46)] },
  a: { w: BOWL * 2, strokes: [bowl, stem(BOWL * 2, X_TOP)] },
  w: { w: 68, strokes: [wline(0, X_TOP, 17, BASE), wline(17, BASE, 34, 52), wline(34, 52, 51, BASE), wline(51, BASE, 68, X_TOP)] },
  b: { w: BOWL * 2, strokes: [stem(0, ASC), bowl] },
  l: { w: 0, strokes: [stem(0, ASC)] },
  y: { w: 52, strokes: [wline(0, X_TOP, 26, BASE), wline(52, X_TOP, 12, DESC)] },
};

function wordStrokes(word: string): { gen: Gen; seed: number }[] {
  let x = 0;
  const out: { gen: Gen; seed: number }[] = [];
  for (const ch of word) {
    const glyph = LETTERS[ch];
    const x0 = x;
    for (const stroke of glyph.strokes) out.push({ gen: (o) => stroke(x0, o), seed: 42 + out.length });
    x += glyph.w + GAP;
  }
  return out;
}
export const WORD = wordStrokes("drawably");
export const WORD_W = "drawably".split("").reduce((w, ch) => w + LETTERS[ch].w + GAP, 0) - GAP;
export const WORD_PAD = 10;
const WORD_SCALE = 3.3;
// the wordmark's units are ~3.3 px, so its roughness is per unit
export const WORD_ROUGH = { roughness: 0.75, boil: 0.5 };
const STROKE_EVERY = 5;
const STROKE_DUR = 13;

export function Close() {
  // tuned at 30 fps; runs at the same speed whatever the composition's rate
  const { fps } = useVideoConfig();
  const k = fps / 30;
  const frame = useCurrentFrame() / k;
  const vw = WORD_W + WORD_PAD * 2;
  const vh = DESC - ASC + WORD_PAD * 2;
  const w = vw * WORD_SCALE;
  const h = vh * WORD_SCALE;
  const pill = { w: 420, h: 68, r: 10 };
  const pillIn = ramp(frame, 94, 110);
  return (
    <>
      <svg
        width={w}
        height={h}
        viewBox={`${-WORD_PAD} ${ASC - WORD_PAD} ${vw} ${vh}`}
        style={{ position: "absolute", left: (WIDTH - w) / 2, top: 250, overflow: "visible" }}
      >
        {WORD.map(({ gen, seed }, i) => (
          <Rough key={seed} gen={gen} seed={seed} draw={pen(frame, 4 + i * STROKE_EVERY, 4 + i * STROKE_EVERY + STROKE_DUR)} width={1.7} rough={WORD_ROUGH} />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          left: (WIDTH - pill.w) / 2,
          top: 250 + h + 56,
          width: pill.w,
          height: pill.h,
          opacity: pillIn,
          filter: `blur(${(1 - pillIn) * 10}px)`,
          transform: `translateY(${(1 - pillIn) * 24}px)`,
        }}
      >
        <Svg x={0} y={0} w={pill.w} h={pill.h}>
          <Rough gen={rect(pill.w, pill.h, pill.r)} seed={4242} width={3.5} />
        </Svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: INK, fontFamily: MONO, fontSize: 26, letterSpacing: "-0.01em" }}>
          <span>
            <span style={{ color: INK_3, marginRight: 16 }}>$</span>npm i drawably
          </span>
        </div>
      </div>
      <Rise from={Math.round(108 * k)} dur={Math.round(14 * k)} dy={12} style={{ ...caption, top: 250 + h + 56 + pill.h + 44 }}>
        hand-drawn ui controls
      </Rise>
    </>
  );
}
