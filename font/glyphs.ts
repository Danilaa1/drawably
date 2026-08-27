// Skeletons for Drawably Pen: monoline letters on a 1000-unit em, y up,
// baseline 0. Each glyph is a few pen strokes; the build jitters them with
// the library's own roughness and expands them to outlines. Corners are
// separate strokes on purpose: overlapping contours union under nonzero
// fill, a sharp join inside one stroke would not.

export const UPM = 1000;
export const X_HEIGHT = 500;
export const CAP = 700;
export const ASC = 720;
export const DESC = -220;

const D = Math.PI / 180;

export type Skeleton =
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number }
  | { kind: "arc"; cx: number; cy: number; rx: number; ry: number; a0: number; a1: number }
  | { kind: "ring"; cx: number; cy: number; rx: number; ry: number };

export interface GlyphDef {
  /** ink width of the skeleton, before the pen and sidebearings */
  w: number;
  strokes: Skeleton[];
}

const line = (x1: number, y1: number, x2: number, y2: number): Skeleton => ({ kind: "line", x1, y1, x2, y2 });
/** angles in degrees, 0 = right, 90 = up */
const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number): Skeleton => ({
  kind: "arc", cx, cy, rx, ry, a0: a0 * D, a1: a1 * D,
});
const ring = (cx: number, cy: number, rx: number, ry: number): Skeleton => ({ kind: "ring", cx, cy, rx, ry });
const poly = (...pts: [number, number][]): Skeleton[] =>
  pts.slice(1).map(([x, y], i) => line(pts[i][0], pts[i][1], x, y));
const dot = (x: number, y: number) => line(x, y, x, y + 10);

// lowercase bowls: a hair narrower than tall, stems tangent to the bowl
const BX = 230;
const BY = X_HEIGHT / 2;
const bowl = ring(BX, BY, BX, BY);
const BOWL_W = BX * 2;

export const GLYPHS: Record<string, GlyphDef> = {
  a: { w: BOWL_W, strokes: [bowl, line(BOWL_W, X_HEIGHT, BOWL_W, 0)] },
  b: { w: BOWL_W, strokes: [line(0, ASC, 0, 0), bowl] },
  c: { w: 400, strokes: [arc(BX, BY, BX, BY, 45, 315)] },
  d: { w: BOWL_W, strokes: [bowl, line(BOWL_W, ASC, BOWL_W, 0)] },
  e: { w: BOWL_W, strokes: [arc(BX, BY, BX, BY, 0, 310), line(0, BY, BOWL_W, BY)] },
  f: { w: 360, strokes: [line(100, 0, 100, 600), arc(250, 600, 150, 120, 180, 40), line(0, X_HEIGHT, 300, X_HEIGHT)] },
  g: { w: BOWL_W, strokes: [bowl, line(BOWL_W, X_HEIGHT, BOWL_W, -100), arc(BX, -100, BX, 120, 0, -180)] },
  h: { w: 400, strokes: [line(0, ASC, 0, 0), arc(200, 300, 200, 200, 180, 0), line(400, 300, 400, 0)] },
  i: { w: 0, strokes: [line(0, X_HEIGHT, 0, 0), dot(0, 640)] },
  j: { w: 200, strokes: [line(200, X_HEIGHT, 200, -100), arc(100, -100, 100, 120, 0, -180), dot(200, 640)] },
  k: { w: 320, strokes: [line(0, ASC, 0, 0), line(0, 200, 300, X_HEIGHT), line(80, 280, 320, 0)] },
  l: { w: 0, strokes: [line(0, ASC, 0, 0)] },
  m: { w: 560, strokes: [line(0, X_HEIGHT, 0, 0), arc(140, 360, 140, 140, 180, 0), line(280, 360, 280, 0), arc(420, 360, 140, 140, 180, 0), line(560, 360, 560, 0)] },
  n: { w: 400, strokes: [line(0, X_HEIGHT, 0, 0), arc(200, 300, 200, 200, 180, 0), line(400, 300, 400, 0)] },
  o: { w: BOWL_W, strokes: [bowl] },
  p: { w: BOWL_W, strokes: [line(0, X_HEIGHT, 0, DESC), bowl] },
  q: { w: BOWL_W, strokes: [bowl, line(BOWL_W, X_HEIGHT, BOWL_W, DESC)] },
  r: { w: 340, strokes: [line(0, X_HEIGHT, 0, 0), arc(180, 320, 180, 180, 180, 30)] },
  s: { w: 380, strokes: [arc(190, 375, 180, 125, 40, 270), arc(190, 125, 180, 125, 90, -140)] },
  t: { w: 300, strokes: [line(100, 650, 100, 100), arc(200, 100, 100, 100, 180, 330), line(0, X_HEIGHT, 260, X_HEIGHT)] },
  u: { w: 400, strokes: [line(0, X_HEIGHT, 0, 200), arc(200, 200, 200, 200, 180, 360), line(400, X_HEIGHT, 400, 0)] },
  v: { w: 400, strokes: poly([0, X_HEIGHT], [200, 0], [400, X_HEIGHT]) },
  w: { w: 600, strokes: poly([0, X_HEIGHT], [150, 0], [300, 420], [450, 0], [600, X_HEIGHT]) },
  x: { w: 400, strokes: [line(0, X_HEIGHT, 400, 0), line(0, 0, 400, X_HEIGHT)] },
  y: { w: 470, strokes: [line(0, X_HEIGHT, 236, 0), line(473, X_HEIGHT, 109, DESC)] },
  z: { w: 400, strokes: poly([0, X_HEIGHT], [400, X_HEIGHT], [0, 0], [400, 0]) },

  A: { w: 460, strokes: [line(0, 0, 230, CAP), line(230, CAP, 460, 0), line(90, 240, 370, 240)] },
  B: { w: 410, strokes: [line(0, 0, 0, CAP), line(0, CAP, 200, CAP), arc(200, 525, 175, 175, 90, -90), line(200, 350, 0, 350), line(0, 350, 220, 350), arc(220, 175, 190, 175, 90, -90), line(220, 0, 0, 0)] },
  C: { w: 420, strokes: [arc(250, 350, 250, 350, 50, 310)] },
  D: { w: 450, strokes: [line(0, 0, 0, CAP), line(0, CAP, 180, CAP), arc(180, 350, 270, 350, 90, -90), line(180, 0, 0, 0)] },
  E: { w: 400, strokes: [line(0, 0, 0, CAP), line(0, CAP, 400, CAP), line(0, 350, 340, 350), line(0, 0, 400, 0)] },
  F: { w: 400, strokes: [line(0, 0, 0, CAP), line(0, CAP, 400, CAP), line(0, 350, 320, 350)] },
  G: { w: 500, strokes: [arc(250, 350, 250, 350, 50, 360), line(280, 350, 500, 350)] },
  H: { w: 440, strokes: [line(0, 0, 0, CAP), line(440, 0, 440, CAP), line(0, 350, 440, 350)] },
  I: { w: 200, strokes: [line(0, CAP, 200, CAP), line(100, CAP, 100, 0), line(0, 0, 200, 0)] },
  J: { w: 300, strokes: [line(300, CAP, 300, 180), arc(150, 180, 150, 180, 0, -180)] },
  K: { w: 400, strokes: [line(0, 0, 0, CAP), line(0, 280, 380, CAP), line(110, 370, 400, 0)] },
  L: { w: 380, strokes: [line(0, CAP, 0, 0), line(0, 0, 380, 0)] },
  M: { w: 500, strokes: poly([0, 0], [0, CAP], [250, 180], [500, CAP], [500, 0]) },
  N: { w: 440, strokes: poly([0, 0], [0, CAP], [440, 0], [440, CAP]) },
  O: { w: 520, strokes: [ring(260, 350, 260, 350)] },
  P: { w: 410, strokes: [line(0, 0, 0, CAP), line(0, CAP, 220, CAP), arc(220, 510, 190, 190, 90, -90), line(220, 320, 0, 320)] },
  Q: { w: 520, strokes: [ring(260, 350, 260, 350), line(320, 180, 520, -40)] },
  R: { w: 420, strokes: [line(0, 0, 0, CAP), line(0, CAP, 220, CAP), arc(220, 510, 190, 190, 90, -90), line(220, 320, 0, 320), line(200, 320, 420, 0)] },
  S: { w: 410, strokes: [arc(210, 525, 190, 175, 40, 270), arc(210, 175, 200, 175, 90, -140)] },
  T: { w: 440, strokes: [line(0, CAP, 440, CAP), line(220, CAP, 220, 0)] },
  U: { w: 440, strokes: [line(0, CAP, 0, 220), arc(220, 220, 220, 220, 180, 360), line(440, CAP, 440, 0)] },
  V: { w: 460, strokes: [line(0, CAP, 230, 0), line(230, 0, 460, CAP)] },
  W: { w: 640, strokes: poly([0, CAP], [160, 0], [320, 560], [480, 0], [640, CAP]) },
  X: { w: 440, strokes: [line(0, CAP, 440, 0), line(0, 0, 440, CAP)] },
  Y: { w: 440, strokes: [line(0, CAP, 220, 340), line(440, CAP, 220, 340), line(220, 340, 220, 0)] },
  Z: { w: 440, strokes: poly([0, CAP], [440, CAP], [0, 0], [440, 0]) },

  "0": { w: 460, strokes: [ring(230, 350, 230, 350)] },
  "1": { w: 160, strokes: [line(0, 560, 160, CAP), line(160, CAP, 160, 0)] },
  "2": { w: 400, strokes: [arc(200, 500, 200, 200, 160, -40), line(353, 371, 0, 0), line(0, 0, 400, 0)] },
  "3": { w: 400, strokes: [arc(210, 525, 190, 175, 150, -90), arc(210, 175, 190, 175, 90, -150)] },
  "4": { w: 420, strokes: [line(300, CAP, 0, 200), line(0, 200, 420, 200), line(300, CAP, 300, 0)] },
  "5": { w: 400, strokes: [line(380, CAP, 40, CAP), line(40, CAP, 0, 380), arc(190, 210, 210, 210, 130, -150)] },
  "6": { w: 440, strokes: [ring(220, 220, 220, 220), arc(220, 400, 220, 300, 180, 70)] },
  "7": { w: 420, strokes: [line(0, CAP, 420, CAP), line(420, CAP, 140, 0)] },
  "8": { w: 400, strokes: [ring(200, 530, 165, 170), ring(200, 180, 200, 180)] },
  "9": { w: 440, strokes: [ring(220, 480, 220, 220), arc(220, 300, 220, 300, 0, -110)] },

  ".": { w: 0, strokes: [dot(0, 0)] },
  ",": { w: 40, strokes: [line(40, 40, 0, -100)] },
  ":": { w: 0, strokes: [dot(0, 0), dot(0, 480)] },
  ";": { w: 40, strokes: [line(40, 40, 0, -100), dot(40, 480)] },
  "!": { w: 0, strokes: [line(0, CAP, 0, 180), dot(0, 0)] },
  "?": { w: 400, strokes: [arc(200, 500, 200, 200, 180, -70), line(268, 312, 200, 170), dot(200, 0)] },
  "-": { w: 300, strokes: [line(0, 260, 300, 260)] },
  "(": { w: 160, strokes: [arc(240, 250, 240, 520, 110, 250)] },
  ")": { w: 160, strokes: [arc(-80, 250, 240, 520, 70, -70)] },
  "'": { w: 0, strokes: [line(0, CAP, 0, 560)] },
  '"': { w: 120, strokes: [line(0, CAP, 0, 560), line(120, CAP, 120, 560)] },
  "/": { w: 360, strokes: [line(0, -60, 360, 760)] },
  _: { w: 500, strokes: [line(0, -120, 500, -120)] },
  "+": { w: 360, strokes: [line(0, 260, 360, 260), line(180, 440, 180, 80)] },
  "=": { w: 360, strokes: [line(0, 340, 360, 340), line(0, 180, 360, 180)] },
  "*": { w: 300, strokes: [line(150, CAP, 150, 420), line(20, 630, 280, 490), line(20, 490, 280, 630)] },
  "#": { w: 460, strokes: [line(110, 0, 170, CAP), line(290, 0, 350, CAP), line(0, 450, 440, 450), line(20, 230, 460, 230)] },
  "%": { w: 440, strokes: [line(0, 0, 440, CAP), ring(110, 560, 100, 120), ring(330, 140, 100, 120)] },
  "&": { w: 460, strokes: [arc(230, 540, 130, 140, -60, 220), line(150, 420, 400, 0), arc(190, 190, 190, 190, 60, 300), line(300, 240, 460, 0)] },
  "@": { w: 560, strokes: [ring(280, 250, 130, 140), line(410, 250, 410, 100), arc(280, 250, 280, 300, -30, 300)] },
};
