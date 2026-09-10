import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { roughCheckmark, roughCircle, variants } from "drawably";
import {
  Close, Grain, HEIGHT, INK, INK_2, INK_3, INSET, MONO, PEN, PEN_FACE, ROUGH, Rise, Rough, SANS, SUCCESS, Svg, WIDTH,
  caption, clamp, headline, lerp, pen, pointAtLength, ramp, rect, segments, totalLength,
} from "./lib";

// a plain HTML form gets sketched over by one pen and keeps working. One
// continuous camera: it pushes in from the plain form to the pen's first
// mark, rides the tip round the card, pulls back as the rest is sketched and
// the native chrome lets go. 60 fps, no cuts inside the take.

export const FORM_FPS = 60;
const sec = (s: number) => Math.round(s * FORM_FPS);

const CARD = { x: 570, y: 220, w: 780, h: 536, pad: 56, r: 14 };
const X = CARD.x + CARD.pad;
const FIELD_W = CARD.w - CARD.pad * 2;
const ROWS = { title: CARD.y + 40, label: CARD.y + 114, input: CARD.y + 150, check: CARD.y + 262, toggle: CARD.y + 338, button: CARD.y + 432 };
const INPUT_H = 64;
const CHECK = 36;
const TOGGLE = { w: 76, h: 40 };
const BUTTON_H = 60;
const TYPED = "jane@example.com";
const PLACEHOLDER = "you@example.com";

// browser default chrome, roughly Chrome on macOS
const NATIVE = { border: "#8b8b8b", cardBorder: "#d4d4d4", face: "#efefef", track: "#c9c9c9", white: "#ffffff" };

// which sketch each piece of chrome belongs to; the pen draws them in order
const PIECE = { card: 0, input: 1, check: 2, toggle: 3, button: 4 } as const;
const PIECES = 5;

interface SceneState {
  /** 0–1 draw-on per piece */
  enter(i: number): number;
  /** 0–1 native → sketch per piece; drives chrome opacity and label typeface */
  fade(i: number): number;
  typed: string;
  caret: boolean;
  tick: number;
  knob: number;
  press: number;
  done: number;
}

const still: SceneState = { enter: () => 0, fade: () => 0, typed: "", caret: false, tick: 0, knob: 0, press: 0, done: 0 };

// a label set in the system face that becomes the pen in place: both faces
// occupy the same box so nothing moves when they trade
function Lettered({ fade, size, color = INK, penColor = color, weight = 500, x, y, w = 700, h, center = false, caret = false, children }: {
  fade: number; size: number; color?: string; penColor?: string; weight?: number; x: number; y: number; w?: number; h: number; center?: boolean; caret?: boolean; children: ReactNode;
}) {
  const base: CSSProperties = { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: center ? "center" : "flex-start", whiteSpace: "pre" };
  const bar = <span style={{ width: 2, height: size * 1.25, marginLeft: 2, background: INK, opacity: caret ? 1 : 0 }} />;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h }}>
      <div style={{ ...base, color, fontFamily: SANS, fontSize: size, fontWeight: weight, letterSpacing: "-0.01em", opacity: 1 - fade }}>{children}{bar}</div>
      <div style={{ ...base, color: penColor, fontFamily: PEN_FACE, fontSize: size + 2, opacity: fade }}>{children}{bar}</div>
    </div>
  );
}

function Scene({ s }: { s: SceneState }) {
  const native = (i: number): CSSProperties => ({ position: "absolute", opacity: 1 - s.fade(i), boxSizing: "border-box" });
  const knobX = lerp(0, TOGGLE.w - TOGGLE.h, s.knob);
  const buttonColor = interpolateColors(s.done, [0, 1], [PEN, SUCCESS]);
  const typedText = s.typed || PLACEHOLDER;
  const typedColor = s.typed ? INK : INK_3;

  return (
    <>
      {/* native chrome */}
      <div style={{ ...native(PIECE.card), left: CARD.x, top: CARD.y, width: CARD.w, height: CARD.h, background: NATIVE.white, border: `1px solid ${NATIVE.cardBorder}`, borderRadius: 8 }} />
      <div style={{ ...native(PIECE.input), left: X, top: ROWS.input, width: FIELD_W, height: INPUT_H, background: NATIVE.white, border: `1px solid ${NATIVE.border}`, borderRadius: 4 }} />
      <div style={{ ...native(PIECE.check), left: X, top: ROWS.check, width: CHECK, height: CHECK, background: NATIVE.white, border: `1px solid ${NATIVE.border}`, borderRadius: 4 }} />
      <div style={{ ...native(PIECE.toggle), left: X, top: ROWS.toggle, width: TOGGLE.w, height: TOGGLE.h, background: NATIVE.track, borderRadius: TOGGLE.h / 2 }}>
        <div style={{ position: "absolute", left: 4 + knobX, top: 4, width: TOGGLE.h - 8, height: TOGGLE.h - 8, background: NATIVE.white, borderRadius: "50%" }} />
      </div>
      <div style={{ ...native(PIECE.button), left: X, top: ROWS.button, width: FIELD_W, height: BUTTON_H, background: NATIVE.face, border: `1px solid ${NATIVE.border}`, borderRadius: 4, transform: `scale(${1 - s.press})` }} />

      {/* sketch */}
      <Svg x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h}>
        <Rough gen={rect(CARD.w, CARD.h, CARD.r)} seed={901} draw={s.enter(PIECE.card)} width={3} />
      </Svg>
      <Svg x={X} y={ROWS.input} w={FIELD_W} h={INPUT_H}>
        <Rough gen={rect(FIELD_W, INPUT_H, 6)} seed={911} draw={s.enter(PIECE.input)} />
      </Svg>
      <Svg x={X} y={ROWS.check} w={CHECK} h={CHECK}>
        <Rough gen={rect(CHECK, CHECK, 5)} seed={921} draw={s.enter(PIECE.check)} />
        <Rough gen={(o) => roughCheckmark(CHECK * 0.24, CHECK * 0.2, CHECK * 0.52, CHECK * 0.5, o)} seed={922} draw={s.tick} width={3.5} />
      </Svg>
      <Svg x={X} y={ROWS.toggle} w={TOGGLE.w} h={TOGGLE.h}>
        <Rough gen={rect(TOGGLE.w, TOGGLE.h, (TOGGLE.h - 2 * INSET) / 2)} seed={925} draw={s.enter(PIECE.toggle)} />
        <g transform={`translate(${knobX} 0)`}>
          <Rough gen={(o) => roughCircle(TOGGLE.h / 2, TOGGLE.h / 2, TOGGLE.h / 2 - INSET - 3, o)} seed={926} fill={PEN} width={4} opacity={s.fade(PIECE.toggle)} />
        </g>
      </Svg>
      <div style={{ position: "absolute", left: X, top: ROWS.button, width: FIELD_W, height: BUTTON_H, transform: `scale(${1 - s.press})` }}>
        <Svg x={0} y={0} w={FIELD_W} h={BUTTON_H}>
          <Rough gen={rect(FIELD_W, BUTTON_H, 10)} seed={941} draw={s.enter(PIECE.button)} color={buttonColor} width={3.5} />
        </Svg>
        {/* both states own the whole box so the swap moves nothing */}
        <div style={{ position: "absolute", inset: 0, opacity: 1 - s.done, filter: `blur(${s.done * 6}px)` }}>
          <Lettered fade={s.fade(PIECE.button)} size={24} color={INK} penColor={PEN} x={0} y={0} w={FIELD_W} h={BUTTON_H} center>
            Continue
          </Lettered>
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", gap: 12, alignItems: "center", justifyContent: "center", color: SUCCESS, fontFamily: PEN_FACE, fontSize: 28, opacity: s.done, filter: `blur(${(1 - s.done) * 6}px)` }}>
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ overflow: "visible", flex: "none" }}>
            <Rough gen={(o) => roughCheckmark(2, 4, 20, 16, o)} seed={942} draw={ramp(s.done, 0.2, 1)} color={SUCCESS} width={3.5} />
          </svg>
          <span>Account created</span>
        </div>
      </div>

      {/* lettering */}
      <Lettered fade={s.fade(PIECE.card)} size={30} weight={600} x={X} y={ROWS.title} h={36}>Create account</Lettered>
      <Lettered fade={s.fade(PIECE.input)} size={17} color={INK_2} weight={500} x={X} y={ROWS.label} h={22}>Email</Lettered>
      <Lettered fade={s.fade(PIECE.input)} size={24} color={typedColor} weight={400} x={X + 22} y={ROWS.input} h={INPUT_H} caret={s.caret}>{typedText}</Lettered>
      <Lettered fade={s.fade(PIECE.check)} size={24} x={X + 56} y={ROWS.check} h={CHECK}>Remember me</Lettered>
      <Lettered fade={s.fade(PIECE.toggle)} size={24} x={X + 96} y={ROWS.toggle} h={TOGGLE.h}>Email me updates</Lettered>
    </>
  );
}

/* ---------- the take ---------- */

const CARD_PATH = segments(variants(rect(CARD.w, CARD.h, CARD.r), { ...ROUGH, seed: 901 })[0]);
const CARD_LEN = totalLength(CARD_PATH);
const CARD_START: [number, number] = [CARD.x + INSET + CARD.r, CARD.y + INSET];
const CENTRE: [number, number] = [WIDTH / 2, HEIGHT / 2];

const PLAIN_HOLD = sec(1.2);
const PEN_FROM = sec(3.0); // the push-in lands exactly as the pen touches down
const CARD_SPEED = 1100; // px per second along the path, both passes
const PEN_TO = PEN_FROM + Math.round((CARD_LEN / CARD_SPEED) * FORM_FPS);
const MACRO = 4.5;
const PULL = [sec(4.2), sec(8.2)] as const;
const CAM_LAG = sec(0.25);
// the other pieces are drawn while the shot widens, each closing a beat apart
const PIECE_AT: Record<number, [number, number]> = {
  [PIECE.input]: [sec(5.0), sec(6.1)],
  [PIECE.check]: [sec(5.7), sec(6.3)],
  [PIECE.toggle]: [sec(6.2), sec(6.9)],
  [PIECE.button]: [sec(6.7), sec(7.8)],
};
const TYPE_AT = sec(8.3);
const TYPE_EVERY = sec(0.05);
const CHECK_AT = sec(9.4);
const TOGGLE_AT = sec(9.8);
const PRESS_AT = sec(10.5);
const DONE_AT = sec(10.8);
const TAKE_END = sec(13.2);
const CODE_LEN = sec(3.8);
const CLOSE_LEN = sec(4.4);
export const FORM_DURATION = TAKE_END + CODE_LEN + CLOSE_LEN;

const settle = Easing.inOut(Easing.cubic);
const glide = Easing.bezier(0.3, 0, 0.7, 1);
const cardDraw = (frame: number) => interpolate(frame, [PEN_FROM, PEN_TO], [0, 1], { ...clamp, easing: glide });
const tipAt = (frame: number): [number, number] => {
  const [x, y] = pointAtLength(CARD_PATH, cardDraw(Math.max(0, frame)) * CARD_LEN);
  return [CARD.x + x, CARD.y + y];
};

function Take() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = (i: number) => (i === PIECE.card ? cardDraw(frame) : pen(frame, PIECE_AT[i][0], PIECE_AT[i][1]));
  const end = (i: number) => (i === PIECE.card ? PEN_TO : PIECE_AT[i][1]);
  // chrome lets go as the pen closes each sketch
  const fade = (i: number) => ramp(frame, end(i) - sec(0.3), end(i) + sec(0.05));

  // camera: hold, push in to the pen's first mark, ride the tip, pull back
  const push = interpolate(frame, [PLAIN_HOLD, PEN_FROM], [0, 1], { ...clamp, easing: settle });
  const pull = interpolate(frame, [PULL[0], PULL[1]], [0, 1], { ...clamp, easing: settle });
  const zoom = Math.exp(interpolate(frame, [PLAIN_HOLD, PEN_FROM, PULL[0], PULL[1]], [0, Math.log(MACRO), Math.log(MACRO), 0], { ...clamp, easing: settle }));
  let lx = 0;
  let ly = 0;
  for (let k = 0; k < CAM_LAG; k++) {
    const [tx, ty] = tipAt(frame - k);
    lx += tx;
    ly += ty;
  }
  const tip: [number, number] = [lx / CAM_LAG, ly / CAM_LAG];
  const pushed: [number, number] = [lerp(CENTRE[0], tip[0], push), lerp(CENTRE[1], tip[1], push)];
  const focus: [number, number] = [lerp(pushed[0], CENTRE[0], pull), lerp(pushed[1], CENTRE[1], pull)];
  const out = interpolate(frame, [TAKE_END - sec(0.7), TAKE_END], [0, 1], { ...clamp, easing: settle });

  const s: SceneState = {
    enter,
    fade,
    typed: TYPED.slice(0, Math.max(0, Math.floor((frame - TYPE_AT) / TYPE_EVERY))),
    caret: Math.floor(frame / sec(0.5)) % 2 === 0,
    tick: pen(frame, CHECK_AT, CHECK_AT + sec(0.3)),
    knob: spring({ frame: frame - TOGGLE_AT, fps, config: { damping: 15, stiffness: 150 } }),
    press: interpolate(frame, [PRESS_AT, PRESS_AT + sec(0.1), PRESS_AT + sec(0.35)], [0, 0.03, 0], { ...clamp, easing: Easing.inOut(Easing.sin) }),
    done: ramp(frame, DONE_AT, DONE_AT + sec(0.35)),
  };

  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: `blur(${out * 10}px)`, transform: `scale(${1 + out * 0.04})` }}>
      <AbsoluteFill style={{ transform: `translate(${WIDTH / 2 - zoom * focus[0]}px, ${HEIGHT / 2 - zoom * focus[1]}px) scale(${zoom})`, transformOrigin: "0 0" }}>
        <Scene s={s} />
      </AbsoluteFill>
      <Rise from={sec(0.2)} out={PLAIN_HOLD} outDur={sec(0.5)} dur={sec(0.5)} dy={8} style={{ ...caption, top: HEIGHT - 84 }}>
        a plain html form
      </Rise>
      <Rise from={sec(7.9)} dur={sec(0.6)} out={TAKE_END - sec(0.7)} outDur={sec(0.5)} style={{ ...headline, top: 838, fontSize: 88 }}>
        Still the same HTML.
      </Rise>
      <Rise from={sec(9.9)} dur={sec(0.5)} out={TAKE_END - sec(0.7)} outDur={sec(0.5)} dy={8} style={{ ...caption, top: HEIGHT - 84 }}>
        keyboard · focus · forms · screen readers · untouched
      </Rise>
    </AbsoluteFill>
  );
}

/* ---------- code: one line per control ---------- */

const LINES = ["drawablyInput(email)", "drawablyCheckbox(remember)", "drawablyToggle(updates)", "drawablyButton(submit)"];
const CODE_AT = sec(0.3);
const CHARS_PER_SEC = 45;
const LINE_PAUSE = sec(0.15);
const CODE_SIZE = 40;
const CODE_LEADING = 1.6;

function Code() {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [CODE_LEN - sec(0.6), CODE_LEN - sec(0.05)], [0, 1], { ...clamp, easing: settle });
  let cursor = CODE_AT;
  const rows = LINES.map((line) => {
    const start = cursor;
    cursor += (line.length / CHARS_PER_SEC) * FORM_FPS + LINE_PAUSE;
    const shown = Math.max(0, Math.min(line.length, Math.floor(((frame - start) / FORM_FPS) * CHARS_PER_SEC)));
    return { text: line.slice(0, shown), active: frame >= start && shown < line.length };
  });
  const typing = rows.some((r) => r.active);
  const lastVisible = rows.reduce((k, r, i) => (r.text ? i : k), -1);
  const blink = Math.floor(frame / sec(0.5)) % 2 === 0;
  const width = Math.max(...LINES.map((l) => l.length)) * CODE_SIZE * 0.6;

  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: `blur(${out * 10}px)` }}>
      <Rise from={0} dur={sec(0.6)} style={{ ...headline, top: 300 }}>
        One line per control.
      </Rise>
      <div style={{ position: "absolute", left: (WIDTH - width) / 2, top: 470, width, fontFamily: MONO, fontSize: CODE_SIZE, lineHeight: CODE_LEADING, color: INK, whiteSpace: "pre" }}>
        {rows.map((r, i) => (
          <div key={LINES[i]} style={{ height: CODE_SIZE * CODE_LEADING, display: "flex", alignItems: "center" }}>
            <span style={{ color: PEN }}>{r.text.slice(0, Math.min(r.text.length, 8))}</span>
            <span>{r.text.slice(8)}</span>
            {i === lastVisible && (typing || blink) && <span style={{ width: 3, height: CODE_SIZE * 1.05, marginLeft: 3, background: INK }} />}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

export function DrawablyForm() {
  return (
    <AbsoluteFill style={{ backgroundColor: "#e3e3e1", overflow: "hidden", WebkitFontSmoothing: "antialiased" }}>
      <Sequence from={0} durationInFrames={TAKE_END} name="take">
        <Take />
      </Sequence>
      <Sequence from={TAKE_END} durationInFrames={CODE_LEN} name="code">
        <Code />
      </Sequence>
      <Sequence from={TAKE_END + CODE_LEN} durationInFrames={CLOSE_LEN} name="close">
        <Close />
      </Sequence>
      <Grain />
    </AbsoluteFill>
  );
}
