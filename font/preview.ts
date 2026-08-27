// node --experimental-strip-types font/preview.ts > sheet.svg
// every glyph as the filled outline the font will rasterise, y flipped
import { glyphs } from "./build.ts";
import type { Point } from "./ttf.ts";

function contourPath(c: Point[]): string {
  // all points off-curve: the curve passes through consecutive midpoints
  const mid = (a: Point, b: Point) => [(a.x + b.x) / 2, (a.y + b.y) / 2];
  const n = c.length;
  let d = `M${mid(c[n - 1], c[0]).join(" ")}`;
  for (let i = 0; i < n; i++) d += `Q${c[i].x} ${c[i].y} ${mid(c[i], c[(i + 1) % n]).join(" ")}`;
  return d + "Z";
}

const gs = glyphs();
const COLS = 12;
const CELL = 1200;
const rows = Math.ceil(gs.length / COLS);
let body = "";
gs.forEach((g, i) => {
  const x = (i % COLS) * CELL + 100;
  const y = Math.floor(i / COLS) * CELL + 900;
  body += `<g transform="translate(${x} ${y}) scale(1 -1)"><path d="${g.contours.map(contourPath).join("")}"/></g>`;
});
process.stdout.write(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COLS * CELL} ${rows * CELL}" width="${COLS * 100}" height="${rows * 100}"><rect width="100%" height="100%" fill="#e3e3e1"/><g fill="#2724d1" fill-rule="nonzero">${body}</g></svg>`,
);
