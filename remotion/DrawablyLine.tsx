import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { roughCheckmark, roughCircle, roughLine, variants } from "drawably";
import type { RoughOptions } from "drawably";
import {
  ASC, DESC, Grain, HEIGHT, INK, INK_2, INSET, MONO, PEN, PEN_FACE, ROUGH, Rough, SANS, WIDTH, WORD, WORD_PAD, WORD_ROUGH, WORD_W,
  clamp, lerp, pen, pointAtLength, ramp, rect, segments, totalLength,
} from "./lib";
import type { Seg } from "./lib";

// one pen, one take. The line never lifts: checkbox → toggle → input →
// button, the camera riding the tip with a little lag, each control coming
// alive behind the pen as it moves on. The pen then writes the name and the
// camera pulls back to show it was all one line. No cuts, 60 fps.

export const LINE_FPS = 60;
const sec = (s: number) => Math.round(s * LINE_FPS);

// world layout: every control hangs from the same line, so all tops sit at
// y = 0 and the connectors run along the top edges
interface Shape { x: number; y: number; w: number; h: number; r: number; seed: number; width: number; caption: string }
const CHECK: Shape = { x: 0, y: 0, w: 48, h: 48, r: 5, seed: 11, width: 3, caption: "Real controls." };
const TOGGLE: Shape = { x: 330, y: 0, w: 104, h: 52, r: (52 - 2 * INSET) / 2, seed: 23, width: 3, caption: "Sketched on mount." };
const INPUT: Shape = { x: 700, y: 0, w: 400, h: 64, r: 6, seed: 37, width: 3, caption: "Boils like a doodle." };
const BUTTON: Shape = { x: 1380, y: 0, w: 380, h: 96, r: 12, seed: 53, width: 3.5, caption: "7 KB. Zero dependencies." };
const SHAPES = [CHECK, TOGGLE, INPUT, BUTTON];
// one baseline for every caption, under the tallest control
const CAPTION_Y = BUTTON.h + 36;
const CAPTION_SIZE = 30;

// where a rounded-rect path begins: the library starts at the top edge, r in
const start = (s: Shape): [number, number] => [s.x + INSET + Math.min(s.r, (s.h - 2 * INSET) / 2), s.y + INSET];

const WORD_SCALE = 1.6;
const WORD_X = 2020;
const WORD_Y = -80;
const WORD_VW = WORD_W + WORD_PAD * 2;
const WORD_VH = DESC - ASC + WORD_PAD * 2;
const WORD_CENTRE: [number, number] = [WORD_X + (WORD_VW * WORD_SCALE) / 2, WORD_Y + (WORD_VH * WORD_SCALE) / 2 - 10];
const WORLD_CENTRE: [number, number] = [(CHECK.x + WORD_X + WORD_VW * WORD_SCALE) / 2, 60];

// the pen: shapes are the library's double pass, connectors a single pass so
// the pen travels each gap once
type Piece = { kind: "shape"; shape: Shape } | { kind: "link"; from: [number, number]; to: [number, number] };
const PIECES: Piece[] = SHAPES.flatMap((shape, i): Piece[] =>
  i === 0 ? [{ kind: "shape", shape }] : [{ kind: "link", from: start(SHAPES[i - 1]), to: start(shape) }, { kind: "shape", shape }],
);
const LINK_ROUGH = { roughness: 0.9, boil: 0.4 };
const LINK_WIDTH = 2.6;

function pieceGen(p: Piece): (o: RoughOptions) => string {
  if (p.kind === "shape") return rect(p.shape.w, p.shape.h, p.shape.r);
  // first pass only
  return (o) => "M" + roughLine(p.from[0], p.from[1], p.to[0], p.to[1], o).split("M")[1];
}
function pieceSeed(p: Piece, i: number) {
  return p.kind === "shape" ? p.shape.seed : 1000 + i;
}
function pieceOrigin(p: Piece): [number, number] {
  return p.kind === "shape" ? [p.shape.x, p.shape.y] : [0, 0];
}

// three boil variants of the whole journey, each as one segment list in world space
const JOURNEY: { segs: Seg[]; offsets: number[]; total: number }[] = [0, 1, 2].map((v) => {
  const segs: Seg[] = [];
  const offsets: number[] = [];
  PIECES.forEach((p, i) => {
    const d = variants(pieceGen(p), { ...(p.kind === "shape" ? ROUGH : LINK_ROUGH), seed: pieceSeed(p, i) })[v];
    const [ox, oy] = pieceOrigin(p);
    offsets.push(totalLength(segs));
    for (const seg of segments(d)) segs.push({ len: seg.len, at: (t) => { const [x, y] = seg.at(t); return [x + ox, y + oy]; } });
  });
  return { segs, offsets, total: totalLength(segs) };
});

// the pen's schedule: steady travel, a pause after each control so the camera
// and the viewer can settle on it, soft into and out of every stop
const PEN_FROM = sec(0.6);
const SPEED = 600; // world units per second
const HOLD = sec(1.2);
const LAST_HOLD = sec(1.6);
const glide = Easing.bezier(0.3, 0, 0.7, 1);
const SCHEDULE = (() => {
  const j = JOURNEY[0];
  const t: number[] = [PEN_FROM];
  const l: number[] = [0];
  const done: number[] = [];
  PIECES.forEach((p, i) => {
    const end = i + 1 < PIECES.length ? j.offsets[i + 1] : j.total;
    const len = end - j.offsets[i];
    t.push(t[t.length - 1] + Math.round((len / SPEED) * LINE_FPS));
    l.push(end);
    if (p.kind === "shape") {
      done.push(t[t.length - 1]);
      t.push(t[t.length - 1] + (i === PIECES.length - 1 ? LAST_HOLD : HOLD));
      l.push(end);
    }
  });
  return { t, l, done };
})();
const PEN_TO = SCHEDULE.t[SCHEDULE.t.length - 1];
const penLength = (frame: number) => interpolate(frame, SCHEDULE.t, SCHEDULE.l, { ...clamp, easing: glide });
const SHAPE_DONE = SCHEDULE.done;

// camera and the rest of the take hang off the moment the pen finishes
const CAM_LAG = sec(0.25);
const STROKE_EVERY = sec(0.16);
const STROKE_DUR = sec(0.45);
const WORD_AT = PEN_TO + sec(0.2);
const WORD_END = WORD_AT + (WORD.length - 1) * STROKE_EVERY + STROKE_DUR;
const REVEAL = [WORD_END + sec(0.8), WORD_END + sec(4.6)] as const;
export const LINE_DURATION = REVEAL[1] + sec(2.4);
const INSTALL_AT = REVEAL[1] - sec(0.8);
const ZOOM_KEYS = [0, sec(1.6), sec(3.4), sec(5.2), sec(9.4), PEN_TO, WORD_AT + sec(1), REVEAL[0], REVEAL[1], LINE_DURATION];
const ZOOM_VALS = [6.0, 4.6, 3.2, 2.3, 1.75, 1.5, 1.3, 1.3, 0.62, 0.62];
// camera moves ease with soft ends; zoom runs in log space so a pull-back
// feels the same speed all the way out
const settle = Easing.inOut(Easing.cubic);
// after each control is drawn the camera breathes out to show it whole, then
// tightens again as the pen leaves
const BREATH = Math.log(0.7);
const BREATH_IN = sec(0.7);
const BREATH_OUT = sec(1.4);
function breathAt(frame: number): number {
  let b = 0;
  SHAPES.forEach((_, i) => {
    const done = SHAPE_DONE[i];
    const hold = done + (i === SHAPES.length - 1 ? LAST_HOLD : HOLD);
    const up = interpolate(frame, [done, done + BREATH_IN], [0, 1], { ...clamp, easing: settle });
    const down = interpolate(frame, [hold, hold + BREATH_OUT], [1, 0], { ...clamp, easing: settle });
    b += Math.min(up, down);
  });
  return Math.min(1, b);
}
const zoomAt = (frame: number) =>
  Math.exp(interpolate(frame, ZOOM_KEYS, ZOOM_VALS.map(Math.log), { ...clamp, easing: settle }) + breathAt(frame) * BREATH);

function Caption({ shape, at, children }: { shape: Shape; at: number; children: ReactNode }) {
  const frame = useCurrentFrame();
  const v = ramp(frame, at, at + sec(0.35));
  return (
    <div
      style={{
        position: "absolute",
        left: shape.x,
        top: CAPTION_Y,
        color: INK,
        fontFamily: SANS,
        fontSize: CAPTION_SIZE,
        fontWeight: 500,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        whiteSpace: "nowrap",
        opacity: v,
        transform: `translateY(${(1 - v) * 10}px)`,
      }}
    >
      {children}
    </div>
  );
}

function World() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const j = JOURNEY[0];
  const L = penLength(frame);
  const draw = (i: number) => {
    const from = j.offsets[i];
    const to = i + 1 < PIECES.length ? j.offsets[i + 1] : j.total;
    return Math.min(1, Math.max(0, (L - from) / (to - from)));
  };
  const [checkDone, toggleDone, inputDone, buttonDone] = SHAPE_DONE;

  const tick = pen(frame, checkDone + sec(0.3), checkDone + sec(0.7));
  const knob = spring({ frame: frame - (toggleDone + sec(0.3)), fps, config: { damping: 15, stiffness: 150 } });
  const TYPED = "hello, world";
  const typed = TYPED.slice(0, Math.max(0, Math.floor((frame - (inputDone + sec(0.3))) / sec(0.06))));
  const caret = frame >= inputDone && Math.floor(frame / sec(0.5)) % 2 === 0;
  const label = ramp(frame, buttonDone + sec(0.2), buttonDone + sec(0.6));
  const press = interpolate(frame, [buttonDone + sec(0.9), buttonDone + sec(1.0), buttonDone + sec(1.25)], [0, 0.03, 0], { ...clamp, easing: Easing.inOut(Easing.sin) });
  const install = ramp(frame, INSTALL_AT, INSTALL_AT + sec(0.6));

  const knobShift = lerp(0, TOGGLE.w - TOGGLE.h, knob);

  return (
    <>
      {PIECES.map((p, i) => {
        const [ox, oy] = pieceOrigin(p);
        return (
          <svg key={i} style={{ position: "absolute", left: ox, top: oy, overflow: "visible" }} width="1" height="1">
            <Rough
              gen={pieceGen(p)}
              seed={pieceSeed(p, i)}
              draw={draw(i)}
              width={p.kind === "shape" ? p.shape.width : LINK_WIDTH}
              rough={p.kind === "shape" ? ROUGH : LINK_ROUGH}
            />
          </svg>
        );
      })}

      {/* the controls come alive behind the pen */}
      <svg style={{ position: "absolute", left: CHECK.x, top: CHECK.y, overflow: "visible" }} width="1" height="1">
        <Rough gen={(o) => roughCheckmark(CHECK.w * 0.24, CHECK.h * 0.2, CHECK.w * 0.52, CHECK.h * 0.5, o)} seed={12} draw={tick} width={3.5} />
      </svg>
      <svg style={{ position: "absolute", left: TOGGLE.x, top: TOGGLE.y, overflow: "visible" }} width="1" height="1">
        <g transform={`translate(${knobShift} 0)`}>
          <Rough gen={(o) => roughCircle(TOGGLE.h / 2, TOGGLE.h / 2, TOGGLE.h / 2 - INSET - 3, o)} seed={24} fill={PEN} width={2} opacity={ramp(frame, toggleDone - sec(0.1), toggleDone + sec(0.2))} />
        </g>
      </svg>
      <div style={{ position: "absolute", left: INPUT.x + 18, top: INPUT.y, height: INPUT.h, display: "flex", alignItems: "center", color: INK, fontFamily: PEN_FACE, fontSize: 27, whiteSpace: "pre" }}>
        <span>{typed}</span>
        <span style={{ width: 2, height: 32, marginLeft: 2, background: INK, opacity: caret ? 1 : 0 }} />
      </div>
      <div style={{ position: "absolute", left: BUTTON.x, top: BUTTON.y, width: BUTTON.w, height: BUTTON.h, transform: `scale(${1 - press})` }}>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: PEN, fontFamily: PEN_FACE, fontSize: 32, opacity: label }}>Continue</div>
      </div>

      {SHAPES.map((s, i) => (
        <Caption key={s.caption} shape={s} at={SHAPE_DONE[i] + sec(0.05)}>
          {s.caption}
        </Caption>
      ))}

      {/* the pen lifts for the name, as a hand does */}
      <svg
        width={WORD_VW * WORD_SCALE}
        height={WORD_VH * WORD_SCALE}
        viewBox={`${-WORD_PAD} ${ASC - WORD_PAD} ${WORD_VW} ${WORD_VH}`}
        style={{ position: "absolute", left: WORD_X, top: WORD_Y, overflow: "visible" }}
      >
        {WORD.map(({ gen, seed }, i) => (
          <Rough key={seed} gen={gen} seed={seed} draw={pen(frame, WORD_AT + i * STROKE_EVERY, WORD_AT + i * STROKE_EVERY + STROKE_DUR)} width={1.9} rough={WORD_ROUGH} />
        ))}
      </svg>

      <div
        style={{
          position: "absolute",
          left: WORLD_CENTRE[0],
          top: WORD_Y + WORD_VH * WORD_SCALE + 150,
          transform: `translate(-50%, ${(1 - install) * 10}px)`,
          color: INK_2,
          fontFamily: MONO,
          fontSize: 44,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          opacity: install,
        }}
      >
        <span style={{ color: PEN, marginRight: 18 }}>$</span>npm i drawably
      </div>
    </>
  );
}

function tipAt(frame: number): [number, number] {
  return pointAtLength(JOURNEY[0].segs, penLength(Math.max(0, frame)));
}

function focusAt(frame: number): [number, number] {
  // the camera trails the tip by a beat, averaged so the corners don't jerk it
  let x = 0;
  for (let k = 0; k < CAM_LAG; k++) x += tipAt(frame - k)[0];
  // frame centre sits between the line and the caption baseline, whatever the zoom
  const tip: [number, number] = [x / CAM_LAG, (CAPTION_Y + CAPTION_SIZE) / 2 - 18];
  // while breathing out, settle on the control just drawn. The pen always
  // stops at a control's top-left, so settling moves forward; on release the
  // frame waits at the centre until the pen has passed it, never backing up
  SHAPES.forEach((sh, i) => {
    const done = SHAPE_DONE[i];
    const hold = done + (i === SHAPES.length - 1 ? LAST_HOLD : HOLD);
    const centre = sh.x + sh.w / 2;
    const up = interpolate(frame, [done, done + BREATH_IN], [0, 1], { ...clamp, easing: settle });
    const down = interpolate(frame, [hold, hold + BREATH_OUT], [1, 0], { ...clamp, easing: settle });
    const from = down < 1 ? Math.max(tip[0], centre) : tip[0];
    tip[0] = lerp(from, centre, Math.min(up, down));
  });
  const toWord = pen(frame, PEN_TO, WORD_AT + sec(0.8));
  const toWorld = interpolate(frame, [REVEAL[0], REVEAL[1]], [0, 1], { ...clamp, easing: settle });
  const held: [number, number] = [lerp(tip[0], WORD_CENTRE[0], toWord), lerp(tip[1], WORD_CENTRE[1], toWord)];
  return [lerp(held[0], WORLD_CENTRE[0], toWorld), lerp(held[1], WORLD_CENTRE[1], toWorld)];
}

export function DrawablyLine() {
  const frame = useCurrentFrame();
  const s = zoomAt(frame);
  const [fx, fy] = focusAt(frame);
  const camera: CSSProperties = { transform: `translate(${WIDTH / 2 - s * fx}px, ${HEIGHT / 2 - s * fy}px) scale(${s})`, transformOrigin: "0 0" };
  return (
    <AbsoluteFill style={{ backgroundColor: "#e3e3e1", overflow: "hidden", WebkitFontSmoothing: "antialiased" }}>
      <AbsoluteFill style={camera}>
        <World />
      </AbsoluteFill>
      <Grain />
    </AbsoluteFill>
  );
}
