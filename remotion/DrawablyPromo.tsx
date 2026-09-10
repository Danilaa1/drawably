import type { CSSProperties } from "react";
import { AbsoluteFill, Sequence, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { roughCheckmark, roughCircle, variants } from "drawably";
import {
  boilIndex, CURSOR, Close, ERROR, Grain, HEADLINE_Y, HEIGHT, HERO, HERO_X, HERO_Y, HeroButton, INK, INK_2, INK_3, INSET, MONO, PAPER, PEN, PEN_FACE, ROUGH, Rise, Rough, SUCCESS, Svg, WIDTH,
  caption, clamp, headline, lerp, pen, pointAt, ramp, rect, segments,
} from "./lib";
export { FPS, HEIGHT, WIDTH } from "./lib";
// shots: [start, length]
const SHOT = {
  open: [0, 200],
  seeds: [200, 190],
  form: [390, 190],
  theme: [580, 90],
  claim: [670, 70],
  close: [740, 130],
} as const;
export const DURATION = SHOT.close[0] + SHOT.close[1];

/* ---------- 1. open: macro on the pen, pull back to the button ---------- */

// the camera follows the pen tip, measured on the very path being drawn:
// dash offset is a fraction of the browser's path length, so the tip is that
// fraction along the same segments, not a point on the ideal rectangle
const HERO_SEED = 17;
const HERO_FRAMES = variants(rect(HERO.w, HERO.h, HERO.r), { ...ROUGH, seed: HERO_SEED }).map(segments);
const PEN_FROM = 4;
const PEN_TO = 128;
const MACRO = 5;

function Open() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [, len] = SHOT.open;
  const draw = pen(frame, PEN_FROM, PEN_TO);
  const zoom = pen(frame, 14, 146);
  const s = lerp(MACRO, 1, zoom);
  const [tx, ty] = pointAt(HERO_FRAMES[boilIndex(frame, fps)], draw);
  const fx = lerp(HERO_X + tx, WIDTH / 2, zoom);
  const fy = lerp(HERO_Y + ty, HEIGHT / 2, zoom);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${WIDTH / 2 - s * fx}px, ${HEIGHT / 2 - s * fy}px) scale(${s})`, transformOrigin: "0 0" }}>
        <div style={{ position: "absolute", left: HERO_X, top: HERO_Y, width: HERO.w, height: HERO.h }}>
          <HeroButton seed={HERO_SEED} draw={draw} label="Continue" labelOpacity={ramp(frame, 118, 134)} />
        </div>
      </AbsoluteFill>
      <Rise from={142} out={len - 10} style={{ ...headline, top: HEADLINE_Y }}>
        Same button.
      </Rise>
      <Rise from={150} out={len - 10} dy={12} style={{ ...caption, top: HEADLINE_Y + 136 }}>
        seed {HERO_SEED}
      </Rise>
    </AbsoluteFill>
  );
}

/* ---------- 2. seeds: re-sketch in rhythm, then hover and press ---------- */

const SEEDS = [17, 83, 149, 211, 277];
const SEED_HOLD = 16;
const SEED_FADE = 5;
const HOVER_SEED = 331;
const PRESS_SEED = 397;
const CURSOR_FROM = 92;
const HOVER_AT = 118;
const PRESS_DOWN = 140;
const PRESS_UP = 148;
// macOS arrow, 24px tall

function Seeds() {
  const frame = useCurrentFrame();
  const [, len] = SHOT.seeds;
  const out = ramp(frame, len - 16, len - 2);
  const glide = ramp(frame, CURSOR_FROM, HOVER_AT);
  const hovered = frame >= HOVER_AT;
  const pressed = frame >= PRESS_DOWN;
  const press = interpolate(frame, [PRESS_DOWN, PRESS_DOWN + 3, PRESS_UP, PRESS_UP + 6], [0, 0.03, 0.03, 0], clamp);
  const seed = pressed ? PRESS_SEED : hovered ? HOVER_SEED : SEEDS[Math.min(SEEDS.length - 1, Math.floor(frame / SEED_HOLD))];
  // cursor: enters from off-frame bottom-right, lands a third of the way in
  const cx = lerp(WIDTH + 40, HERO_X + HERO.w * 0.62, glide);
  const cy = lerp(HEIGHT + 40, HERO_Y + HERO.h * 0.58, glide);

  return (
    <>
      <AbsoluteFill style={{ opacity: 1 - out, filter: `blur(${out * 10}px)` }}>
        <div style={{ position: "absolute", left: HERO_X, top: HERO_Y, width: HERO.w, height: HERO.h, transform: `scale(${1 - press})` }}>
          {SEEDS.map((s, i) => {
            const enter = i === 0 ? 1 : ramp(frame, i * SEED_HOLD, i * SEED_HOLD + SEED_FADE);
            const exit = i === SEEDS.length - 1 ? (hovered ? 1 : 0) : ramp(frame, (i + 1) * SEED_HOLD, (i + 1) * SEED_HOLD + SEED_FADE);
            return <HeroButton key={s} seed={s} label="Continue" opacity={enter * (1 - exit)} />;
          })}
          {hovered && !pressed && <HeroButton seed={HOVER_SEED} label="Continue" />}
          {pressed && <HeroButton seed={PRESS_SEED} label="Continue" />}
        </div>

        <svg width="16" height="25" viewBox="0 0 16 25" style={{ position: "absolute", left: cx, top: cy, overflow: "visible", transform: "scale(1.5)", transformOrigin: "0 0", opacity: glide > 0 ? 1 : 0 }}>
          <path d={CURSOR} fill={INK} stroke={PAPER} strokeWidth="1.5" strokeLinejoin="round" />
        </svg>

        <Rise from={12} out={len - 16} style={{ ...headline, top: HEADLINE_Y }}>
          Never the same twice.
        </Rise>
        <Rise from={0} dur={1} out={len - 16} dy={0} style={{ ...caption, top: HEADLINE_Y + 136 }}>
          {pressed ? "press · " : hovered ? "hover · " : ""}seed {seed}
        </Rise>
      </AbsoluteFill>
    </>
  );
}

/* ---------- 3. form: real controls doing real things ---------- */

const CARD = { x: 570, y: 220, w: 780, h: 536, pad: 56 };
const FIELD_W = CARD.w - CARD.pad * 2;
const TYPED = "jane@example.com";
const TYPE_AT = 62;
const TYPE_EVERY = 2;
const CHECK_AT = 100;
const TOGGLE_AT = 112;
const PRESS_AT = 128;
const DONE_AT = 136;

const label: CSSProperties = {
  position: "absolute",
  color: INK,
  fontFamily: PEN_FACE,
  fontSize: 26,
  lineHeight: 1,
};
const FORM_BUTTON_H = 60;

function Form() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [, len] = SHOT.form;
  const enter = (i: number) => pen(frame, 8 + i * 7, 26 + i * 7);
  const fade = (i: number) => ramp(frame, 16 + i * 7, 28 + i * 7);
  const out = ramp(frame, len - 14, len - 2);
  const typed = TYPED.slice(0, Math.max(0, Math.floor((frame - TYPE_AT) / TYPE_EVERY)));
  const caret = frame >= TYPE_AT - 20 && Math.floor(frame / 15) % 2 === 0;
  const knob = spring({ frame: frame - TOGGLE_AT, fps, config: { damping: 14, stiffness: 160 } });
  const press = interpolate(frame, [PRESS_AT, PRESS_AT + 3, PRESS_AT + 9], [0, 0.03, 0], clamp);
  const done = ramp(frame, DONE_AT, DONE_AT + 8);
  const buttonColor = interpolateColors(done, [0, 1], [PEN, SUCCESS]);

  const x = CARD.x + CARD.pad;
  const rows = { input: CARD.y + 150, check: CARD.y + 262, toggle: CARD.y + 338, button: CARD.y + 432 };

  return (
    <>
      <AbsoluteFill style={{ opacity: 1 - out, filter: `blur(${out * 10}px)`, transform: `scale(${1 + out * 0.04})` }}>
        <Svg x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h}>
          <Rough gen={rect(CARD.w, CARD.h, 14)} seed={901} draw={enter(0)} width={3} />
        </Svg>
        <div style={{ ...label, left: x, top: CARD.y + 40, fontSize: 32, opacity: fade(0) }}>Create account</div>

        {/* badge: outline, sharp corners */}
        <Svg x={CARD.x + CARD.w - CARD.pad - 78} y={CARD.y + 40} w={78} h={30}>
          <Rough gen={rect(78, 30, 2)} seed={934} draw={enter(4)} width={2.5} />
        </Svg>
        <div style={{ position: "absolute", left: CARD.x + CARD.w - CARD.pad - 78, top: CARD.y + 40, width: 78, height: 30, display: "grid", placeItems: "center", color: PEN, fontFamily: PEN_FACE, fontSize: 18, opacity: fade(4) }}>
          beta
        </div>

        {/* input */}
        <div style={{ ...label, left: x, top: rows.input - 36, fontSize: 18, color: INK_2, opacity: fade(1) }}>Email</div>
        <Svg x={x} y={rows.input} w={FIELD_W} h={64}>
          <Rough gen={rect(FIELD_W, 64, 6)} seed={911} draw={enter(1)} />
        </Svg>
        <div style={{ position: "absolute", left: x + 22, top: rows.input, height: 64, display: "flex", alignItems: "center", color: INK, fontFamily: PEN_FACE, fontSize: 26, opacity: fade(1) }}>
          <span style={{ color: typed ? INK : INK_3 }}>{typed || "you@example.com"}</span>
          <span style={{ width: 2, height: 30, marginLeft: 2, background: INK, opacity: caret ? 1 : 0 }} />
        </div>

        {/* checkbox */}
        <Svg x={x} y={rows.check} w={36} h={36}>
          <Rough gen={rect(36, 36, 5)} seed={921} draw={enter(2)} />
          <Rough gen={(o) => roughCheckmark(36 * 0.24, 36 * 0.2, 36 * 0.52, 36 * 0.5, o)} seed={922} draw={pen(frame, CHECK_AT, CHECK_AT + 9)} width={3.5} />
        </Svg>
        <div style={{ ...label, left: x + 56, top: rows.check + 6, opacity: fade(2) }}>Remember me</div>

        {/* toggle */}
        <Svg x={x} y={rows.toggle} w={76} h={40}>
          <Rough gen={rect(76, 40, (40 - 2 * INSET) / 2)} seed={925} draw={enter(3)} />
          <g transform={`translate(${lerp(0, 36, knob)} 0)`}>
            <Rough gen={(o) => roughCircle(20, 20, 20 - INSET - 3, o)} seed={926} fill={PEN} width={4} opacity={fade(3)} />
          </g>
        </Svg>
        <div style={{ ...label, left: x + 96, top: rows.toggle + 8, opacity: fade(3) }}>Email me updates</div>

        {/* button: both states own the whole box so the swap moves nothing */}
        <div style={{ position: "absolute", left: x, top: rows.button, width: FIELD_W, height: FORM_BUTTON_H, transform: `scale(${1 - press})` }}>
          <Svg x={0} y={0} w={FIELD_W} h={FORM_BUTTON_H}>
            <Rough gen={rect(FIELD_W, FORM_BUTTON_H, 10)} seed={941} draw={enter(4)} color={buttonColor} width={3.5} />
          </Svg>
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: PEN, fontFamily: PEN_FACE, fontSize: 28, opacity: fade(4) * (1 - done), filter: `blur(${done * 6}px)` }}>
            Continue
          </div>
          <div style={{ position: "absolute", inset: 0, display: "flex", gap: 12, alignItems: "center", justifyContent: "center", color: SUCCESS, fontFamily: PEN_FACE, fontSize: 28, opacity: done, filter: `blur(${(1 - done) * 6}px)` }}>
            <svg width="24" height="24" viewBox="0 0 24 24" style={{ overflow: "visible", flex: "none" }}>
              <Rough gen={(o) => roughCheckmark(2, 4, 20, 16, o)} seed={942} draw={pen(frame, DONE_AT + 2, DONE_AT + 10)} color={SUCCESS} width={3.5} />
            </svg>
            <span>Account created</span>
          </div>
        </div>

        <Rise from={26} out={len - 14} style={{ ...headline, top: 838, fontSize: 88 }}>
          Real elements. Fake chrome.
        </Rise>
      </AbsoluteFill>
    </>
  );
}

/* ---------- 4. theme: the same sketch, four inks ---------- */

const INKS: [string, string][] = [
  [PEN, "--drawably-stroke: #2724d1"],
  [ERROR, "--drawably-stroke: #d12724"],
  [SUCCESS, "--drawably-stroke: #188a42"],
  [INK, "--drawably-stroke: #18181b"],
];
const INK_AT = 18;
const INK_HOLD = 16;
const INK_FADE = 6;

function Theme() {
  const frame = useCurrentFrame();
  const [, len] = SHOT.theme;
  const enter = ramp(frame, 0, 14);
  const out = ramp(frame, len - 12, len - 2);
  const stops = INKS.flatMap((_, i) => (i === 0 ? [0] : [INK_AT + (i - 1) * INK_HOLD, INK_AT + (i - 1) * INK_HOLD + INK_FADE]));
  const colors = INKS.flatMap(([c], i) => (i === 0 ? [c] : [INKS[i - 1][0], c]));
  const color = interpolateColors(frame, stops, colors);
  const which = Math.min(INKS.length - 1, Math.max(0, Math.floor((frame - INK_AT + INK_HOLD - INK_FADE / 2) / INK_HOLD)));

  return (
    <>
      <AbsoluteFill style={{ opacity: enter * (1 - out), filter: `blur(${(1 - enter * (1 - out)) * 10}px)` }}>
        <div style={{ position: "absolute", left: HERO_X, top: HERO_Y - 40, width: HERO.w, height: HERO.h, transform: `translateY(${(1 - enter) * 28}px)` }}>
          <HeroButton seed={149} color={color} label="Continue" />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: HERO_Y + HERO.h + 22, textAlign: "center", color: INK_2, fontFamily: MONO, fontSize: 26, letterSpacing: "0.02em" }}>
          {INKS.map(([, text], i) => (
            <span key={text} style={{ position: "absolute", left: 0, right: 0, opacity: i === which ? 1 : 0 }}>
              {text}
            </span>
          ))}
        </div>
        <Rise from={6} out={len - 12} style={{ ...headline, top: HEADLINE_Y + 10 }}>
          Theme it in CSS.
        </Rise>
      </AbsoluteFill>
    </>
  );
}

/* ---------- 5. claim ---------- */

const CLAIMS = ["~7 KB gzipped.", "Zero dependencies.", "Real HTML."];

function Claim() {
  const [, len] = SHOT.claim;
  return (
    <>
      <div style={{ position: "absolute", left: 0, right: 0, top: HEIGHT / 2 - 170, display: "grid", justifyItems: "center" }}>
        {CLAIMS.map((text, i) => (
          <Rise key={text} from={i * 8} out={len - 12 + i * 2} style={{ ...headline, position: "relative", fontSize: 108, lineHeight: 1.06, fontVariantNumeric: "tabular-nums" }}>
            {text}
          </Rise>
        ))}
      </div>
    </>
  );
}

export function DrawablyPromo() {
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER, overflow: "hidden", WebkitFontSmoothing: "antialiased" }}>
      <Sequence from={SHOT.open[0]} durationInFrames={SHOT.open[1]} name="open">
        <Open />
      </Sequence>
      <Sequence from={SHOT.seeds[0]} durationInFrames={SHOT.seeds[1]} name="seeds">
        <Seeds />
      </Sequence>
      <Sequence from={SHOT.form[0]} durationInFrames={SHOT.form[1]} name="form">
        <Form />
      </Sequence>
      <Sequence from={SHOT.theme[0]} durationInFrames={SHOT.theme[1]} name="theme">
        <Theme />
      </Sequence>
      <Sequence from={SHOT.claim[0]} durationInFrames={SHOT.claim[1]} name="claim">
        <Claim />
      </Sequence>
      <Sequence from={SHOT.close[0]} durationInFrames={SHOT.close[1]} name="close">
        <Close />
      </Sequence>
      <Grain />
    </AbsoluteFill>
  );
}

