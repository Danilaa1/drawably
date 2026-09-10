import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  interpolateColors,
  useCurrentFrame,
} from "remotion";
import { roughCheckmark, variants } from "drawably";
import {
  CURSOR,
  Close,
  Grain,
  HEADLINE_Y,
  HEIGHT,
  HERO,
  INK,
  PAPER,
  PEN,
  PEN_FACE,
  ROUGH,
  Rise,
  SANS,
  SUCCESS,
  Svg,
  WIDTH,
  caption,
  clamp,
  headline,
  lerp,
  pen,
  pointAtLength,
  ramp,
  rect,
  segments,
  totalLength,
} from "./lib";

// anatomy of one button, one take at 60 fps. The pen draws it at macro, the
// camera pulls back, then the button lifts apart into what it really is: a
// real <button> underneath and the three sketches the boil steps through.
// It stacks back together, gets pressed, and the native button does the rest.

export const ANATOMY_FPS = 60;
const sec = (s: number) => Math.round(s * ANATOMY_FPS);
const settle = Easing.inOut(Easing.cubic);
const move = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], { ...clamp, easing: settle });

const SEED = 77;
const HOVER_SEED = 331;
const PRESS_SEED = 397;
const GEN = rect(HERO.w, HERO.h, HERO.r);
const PATH = segments(variants(GEN, { ...ROUGH, seed: SEED })[0]);
const LEN = totalLength(PATH);
const LABEL = "Send email";
const DONE_LABEL = "Sent";

/* ---------- schedule ---------- */

const PEN_FROM = sec(0.3);
const PEN_SPEED = 720; // world units per second, the pace the one-line film settled on
const PEN_TO = PEN_FROM + Math.round((LEN / PEN_SPEED) * ANATOMY_FPS);
const PULL = [PEN_TO + sec(0.6), PEN_TO + sec(2.6)];
const EXPLODE = [PULL[1] + sec(0.9), PULL[1] + sec(3.1)];
// three beats while exploded: the real button, the three sketches, the swap
const BEAT_LEN = sec(2.6);
const BEAT = [
  EXPLODE[0] + sec(1.3),
  EXPLODE[0] + sec(1.3) + BEAT_LEN,
  EXPLODE[0] + sec(1.3) + BEAT_LEN * 2,
];
const SWAP_LEN = sec(3.4);
const COLLAPSE = [BEAT[2] + SWAP_LEN, BEAT[2] + SWAP_LEN + sec(1.9)];
const CURSOR_FROM = COLLAPSE[1] - sec(0.5);
const HOVER_AT = CURSOR_FROM + sec(1.3);
const PRESS_DOWN = HOVER_AT + sec(0.8);
const PRESS_UP = PRESS_DOWN + sec(0.15);
const DONE_AT = PRESS_UP + sec(0.15);
const HEAD_AT = DONE_AT + sec(0.7);
const TAKE_END = HEAD_AT + sec(3.6);
const CLOSE_LEN = sec(4.4);
export const ANATOMY_DURATION = TAKE_END + CLOSE_LEN;

const FADE = sec(0.4);
const BOIL = sec(0.4);

/* ---------- camera ---------- */

const ZOOM_KEYS = [
  0,
  PEN_TO,
  PULL[0],
  PULL[1],
  EXPLODE[0],
  EXPLODE[1],
  COLLAPSE[0],
  COLLAPSE[1],
];
const ZOOM_VALS = [5.2, 3.6, 3.6, 1.7, 1.7, 1.42, 1.42, 1.7];
const zoomAt = (frame: number) =>
  Math.exp(
    interpolate(frame, ZOOM_KEYS, ZOOM_VALS.map(Math.log), {
      ...clamp,
      easing: settle,
    }),
  );

const CAM_LAG = sec(0.25);
const CENTRE: [number, number] = [HERO.w / 2, HERO.h / 2];
// exploded, the stack sits right of centre so the words have the left
const ASIDE = 330;
const penLength = (frame: number) => pen(frame, PEN_FROM, PEN_TO) * LEN;
const tipAt = (frame: number) =>
  pointAtLength(PATH, penLength(Math.max(0, frame)));

function focusAt(frame: number): [number, number] {
  let x = 0;
  let y = 0;
  for (let k = 0; k < CAM_LAG; k++) {
    const [tx, ty] = tipAt(frame - k);
    x += tx;
    y += ty;
  }
  const tip: [number, number] = [x / CAM_LAG, y / CAM_LAG];
  const toCentre = move(frame, PULL[0], PULL[1]);
  const aside =
    move(frame, EXPLODE[0], EXPLODE[1]) - move(frame, COLLAPSE[0], COLLAPSE[1]);
  const s = zoomAt(frame);
  return [
    lerp(tip[0], CENTRE[0], toCentre) - (aside * ASIDE) / s,
    lerp(tip[1], CENTRE[1], toCentre),
  ];
}

/* ---------- the stack ---------- */

const TILT = { x: 40, y: -26, drift: 12 }; // degrees; drift is the slow orbit while exploded
const GAP = 150; // world units between layers
const PERSPECTIVE = 2600;
const LAYERS = 4; // native + three sketches
const DIM = 0.32;
// layers only become individually visible once they have some air between them,
// otherwise three sketches pile up on one outline at both ends of the move
const apart = (e: number) =>
  interpolate(e, [0.28, 0.8], [0, 1], { ...clamp, easing: settle });
const SWAP_DIM = 0.16;

const layer: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: HERO.w,
  height: HERO.h,
};
const labelBox: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "grid",
  placeItems: "center",
  fontSize: 38,
  lineHeight: 1,
};

function Sheet({ e }: { e: number }) {
  const a = apart(e);
  return (
    <div
      style={{
        ...layer,
        borderRadius: HERO.r + 2,
        background: `rgba(227,227,225,${0.72 * a})`,
        boxShadow: `inset 0 0 0 1px rgba(161,161,170,${0.55 * a})`,
      }}
    />
  );
}

function Stack() {
  const frame = useCurrentFrame();
  const e =
    move(frame, EXPLODE[0], EXPLODE[1]) - move(frame, COLLAPSE[0], COLLAPSE[1]);
  const drift = move(frame, EXPLODE[0], COLLAPSE[1]);
  const draw = pen(frame, PEN_FROM, PEN_TO);
  const active = Math.floor(frame / BOIL) % 3;
  const hovered = frame >= HOVER_AT;
  const pressed = frame >= PRESS_DOWN;
  const press = interpolate(
    frame,
    [PRESS_DOWN, PRESS_DOWN + sec(0.1), PRESS_UP, PRESS_UP + sec(0.2)],
    [0, 0.03, 0.03, 0],
    clamp,
  );
  const done = ramp(frame, DONE_AT, DONE_AT + sec(0.5));
  const seed = pressed ? PRESS_SEED : hovered ? HOVER_SEED : SEED;
  const frames = variants(GEN, { ...ROUGH, seed });
  const stroke = interpolateColors(done, [0, 1], [PEN, SUCCESS]);
  const label = ramp(frame, PULL[0], PULL[1]);

  // beat highlights: the real button, then the sketches, then one sketch at a time
  const nativeHi = interpolate(
    frame,
    [BEAT[1] - FADE, BEAT[1], COLLAPSE[0], COLLAPSE[0] + FADE],
    [1, DIM, DIM, 1],
    { ...clamp, easing: settle },
  );
  const sketchBase = interpolate(
    frame,
    [BEAT[0] - FADE, BEAT[0], BEAT[1] - FADE, BEAT[1]],
    [1, DIM, DIM, 1],
    { ...clamp, easing: settle },
  );
  const swap = interpolate(
    frame,
    [BEAT[2] - FADE, BEAT[2], COLLAPSE[0], COLLAPSE[0] + FADE],
    [0, 1, 1, 0],
    { ...clamp, easing: settle },
  );

  const group: CSSProperties = {
    ...layer,
    transformStyle: "preserve-3d",
    transform: `scale(${1 - press}) rotateX(${TILT.x * e}deg) rotateY(${(TILT.y + TILT.drift * drift) * e}deg)`,
  };
  const z = (i: number) => (i - (LAYERS - 1) / 2) * GAP * e;
  const a = apart(e);

  return (
    <div
      style={{
        ...layer,
        perspective: PERSPECTIVE,
        perspectiveOrigin: "50% 50%",
      }}
    >
      <div style={group}>
        {/* 0 · the real <button>: chrome shows only while exploded */}
        <div
          style={{
            ...layer,
            transform: `translateZ(${z(0)}px)`,
            opacity: lerp(1, nativeHi, a),
          }}
        >
          <div
            style={{
              ...layer,
              borderRadius: 6,
              background: `rgba(239,239,239,${a})`,
              boxShadow: `0 0 0 1px rgba(139,139,139,${a})`,
            }}
          />
          <div
            style={{
              ...labelBox,
              fontFamily: SANS,
              fontWeight: 500,
              color: INK,
              opacity: a * label,
            }}
          >
            {LABEL}
          </div>
        </div>
        {/* 1–3 · the sketches the boil steps through; collapsed, only the live one shows */}
        {frames.map((d, i) => {
          const hi = lerp(sketchBase, i === active ? 1 : SWAP_DIM, swap);
          const opacity = lerp(i === active ? 1 : 0, hi, a);
          return (
            <div
              key={i}
              style={{
                ...layer,
                transform: `translateZ(${z(i + 1)}px)`,
                opacity,
              }}
            >
              <Sheet e={e} />
              <Svg x={0} y={0} w={HERO.w} h={HERO.h}>
                <path
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={HERO.stroke}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - draw}
                  opacity={draw <= 0 ? 0 : 1}
                />
              </Svg>
            </div>
          );
        })}
      </div>
      {/* flat-state lettering lives outside the 3D group so it never inherits the tilt */}
      <div
        style={{ ...layer, transform: `scale(${1 - press})`, opacity: 1 - a }}
      >
        <div
          style={{
            ...labelBox,
            fontFamily: PEN_FACE,
            color: stroke,
            opacity: label * (1 - done),
          }}
        >
          {LABEL}
        </div>
        <div
          style={{
            ...labelBox,
            fontFamily: PEN_FACE,
            color: SUCCESS,
            opacity: done,
          }}
        >
          <span
            style={{
              display: "inline-grid",
              gridTemplateColumns: "34px auto",
              alignItems: "center",
            }}
          >
            <Svg x={0} y={0} w={26} h={26} style={{ position: "relative" }}>
              <path
                d={
                  variants((o) => roughCheckmark(2, 4, 20, 16, o), {
                    ...ROUGH,
                    seed: 942,
                  })[active]
                }
                fill="none"
                stroke={SUCCESS}
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - ramp(done, 0.2, 1)}
              />
            </Svg>
            <span>{DONE_LABEL}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function Cursor() {
  const frame = useCurrentFrame();
  const glide = ramp(frame, CURSOR_FROM, HOVER_AT);
  if (glide <= 0) return null;
  const x = lerp(HERO.w + 900, HERO.w * 0.62, glide);
  const y = lerp(HERO.h + 640, HERO.h * 0.58, glide);
  return (
    <svg
      width="16"
      height="25"
      viewBox="0 0 16 25"
      style={{
        position: "absolute",
        left: x,
        top: y,
        overflow: "visible",
        transform: "scale(1.5)",
        transformOrigin: "0 0",
      }}
    >
      <path
        d={CURSOR}
        fill={INK}
        stroke={PAPER}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- words, in screen space ---------- */

const aside: CSSProperties = {
  ...headline,
  left: 140,
  right: "auto",
  width: 860,
  textAlign: "left",
  fontSize: 80,
};
const asideSub: CSSProperties = {
  ...caption,
  left: 142,
  right: "auto",
  textAlign: "left",
  fontSize: 21,
};
const BEAT_Y = 440;

function Beat({
  from,
  out,
  sub,
  children,
}: {
  from: number;
  out: number;
  sub: string;
  children: ReactNode;
}) {
  return (
    <>
      <Rise
        from={from}
        dur={sec(0.55)}
        out={out}
        outDur={sec(0.4)}
        dy={22}
        style={{ ...aside, top: BEAT_Y }}
      >
        {children}
      </Rise>
      <Rise
        from={from + sec(0.25)}
        dur={sec(0.55)}
        out={out}
        outDur={sec(0.4)}
        dy={14}
        style={{ ...asideSub, top: BEAT_Y + 108 }}
      >
        {sub}
      </Rise>
    </>
  );
}

function Words() {
  const frame = useCurrentFrame();
  const swapFrame = Math.floor(frame / BOIL) % 3;
  return (
    <>
      <Beat from={BEAT[0]} out={BEAT[1] - sec(0.5)} sub="underneath, untouched">
        A real button.
      </Beat>
      <Beat
        from={BEAT[1]}
        out={BEAT[2] - sec(0.5)}
        sub="one seed, three passes"
      >
        Three sketches.
      </Beat>
      <Beat
        from={BEAT[2]}
        out={COLLAPSE[0] - sec(0.3)}
        sub={`frame ${swapFrame + 1} of 3 · css only`}
      >
        Swapped every 400 ms.
      </Beat>
      <Rise
        from={HEAD_AT}
        dur={sec(0.6)}
        dy={24}
        style={{ ...headline, top: HEADLINE_Y }}
      >
        Native does the rest.
      </Rise>
      <Rise
        from={HEAD_AT + sec(0.5)}
        dur={sec(0.5)}
        dy={12}
        style={{ ...caption, top: HEADLINE_Y + 136 }}
      >
        focus · keyboard · forms · screen readers
      </Rise>
    </>
  );
}

function Take() {
  const frame = useCurrentFrame();
  const s = zoomAt(frame);
  const [fx, fy] = focusAt(frame);
  const out = move(frame, TAKE_END - sec(0.8), TAKE_END);
  const camera: CSSProperties = {
    transform: `translate(${WIDTH / 2 - s * fx}px, ${HEIGHT / 2 - s * fy}px) scale(${s})`,
    transformOrigin: "0 0",
  };
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - out,
        filter: `blur(${out * 12}px)`,
        transform: `scale(${1 + out * 0.04})`,
      }}
    >
      <AbsoluteFill style={camera}>
        <Stack />
        <Cursor />
      </AbsoluteFill>
      <Words />
    </AbsoluteFill>
  );
}

export function DrawablyAnatomy() {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: PAPER,
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <Sequence from={0} durationInFrames={TAKE_END} layout="none">
        <Take />
      </Sequence>
      <Sequence from={TAKE_END} durationInFrames={CLOSE_LEN} layout="none">
        <Close />
      </Sequence>
      <Grain />
    </AbsoluteFill>
  );
}
