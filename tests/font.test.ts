import { describe, expect, it } from "vitest";
import { buildTTF, type Glyph } from "../font/ttf.js";

const metrics = { family: "Drawably Pen", unitsPerEm: 1000, ascender: 800, descender: -200, xHeight: 500, capHeight: 700, pen: 70 };

const square: Glyph = {
  code: 65,
  advance: 700,
  contours: [[{ x: 100, y: 0, on: true }, { x: 100, y: 600, on: true }, { x: 600, y: 600, on: true }, { x: 600, y: 0, on: true }]],
};
const glyphs: Glyph[] = [{ advance: 500, contours: [] }, { code: 32, advance: 300, contours: [] }, square];

function checksum(b: Uint8Array, start = 0, len = b.length - start) {
  let sum = 0;
  for (let i = start; i < start + len; i += 4) {
    sum = (sum + (((b[i] ?? 0) << 24) | ((b[i + 1] ?? 0) << 16) | ((b[i + 2] ?? 0) << 8) | (b[i + 3] ?? 0))) >>> 0;
  }
  return sum;
}

function directory(ttf: Uint8Array) {
  const v = new DataView(ttf.buffer);
  const n = v.getUint16(4);
  const tables: Record<string, { offset: number; length: number; checksum: number }> = {};
  for (let i = 0; i < n; i++) {
    const at = 12 + i * 16;
    const tag = String.fromCharCode(...ttf.slice(at, at + 4));
    tables[tag] = { checksum: v.getUint32(at + 4), offset: v.getUint32(at + 8), length: v.getUint32(at + 12) };
  }
  return { v, tables };
}

function lookup(ttf: Uint8Array, code: number): number {
  const { v, tables } = directory(ttf);
  const base = tables.cmap.offset;
  const records = v.getUint16(base + 2);
  let sub = 0;
  for (let i = 0; i < records; i++) {
    const at = base + 4 + i * 8;
    if (v.getUint16(at) === 3 && v.getUint16(at + 2) === 1) sub = base + v.getUint32(at + 4);
  }
  expect(v.getUint16(sub)).toBe(4);
  const segCount = v.getUint16(sub + 6) / 2;
  const ends = sub + 14;
  const starts = ends + segCount * 2 + 2;
  const deltas = starts + segCount * 2;
  for (let i = 0; i < segCount; i++) {
    const end = v.getUint16(ends + i * 2);
    const start = v.getUint16(starts + i * 2);
    if (code >= start && code <= end) return (code + v.getUint16(deltas + i * 2)) & 0xffff;
  }
  return 0;
}

describe("ttf writer", () => {
  const ttf = buildTTF(glyphs, metrics);
  const { v, tables } = directory(ttf);

  it("writes a directory whose table checksums and file checksum verify", () => {
    expect(v.getUint32(0)).toBe(0x00010000);
    expect(Object.keys(tables).sort()).toEqual(["OS/2", "cmap", "glyf", "head", "hhea", "hmtx", "loca", "maxp", "name", "post"]);
    for (const [tag, t] of Object.entries(tables)) {
      expect(t.offset % 4, tag).toBe(0);
      if (tag !== "head") expect(checksum(ttf, t.offset, t.length), tag).toBe(t.checksum);
    }
    expect(checksum(ttf)).toBe(0xb1b0afba);
    expect(v.getUint32(tables.head.offset + 12)).toBe(0x5f0f3cf5);
    expect(v.getUint16(tables.head.offset + 18)).toBe(1000);
  });

  it("maps code points through cmap format 4, unmapped to .notdef", () => {
    expect(lookup(ttf, 65)).toBe(2);
    expect(lookup(ttf, 32)).toBe(1);
    expect(lookup(ttf, 66)).toBe(0);
    expect(v.getUint16(tables.maxp.offset + 4)).toBe(3);
  });

  it("stores the square as one four-point on-curve contour with its metrics", () => {
    const loca = tables.loca.offset;
    const start = v.getUint32(loca + 2 * 4);
    const end = v.getUint32(loca + 3 * 4);
    expect(v.getUint32(loca + 1 * 4)).toBe(start); // empty glyphs take no bytes
    expect(end).toBeGreaterThan(start);
    const g = tables.glyf.offset + start;
    expect(v.getInt16(g)).toBe(1);
    expect([v.getInt16(g + 2), v.getInt16(g + 4), v.getInt16(g + 6), v.getInt16(g + 8)]).toEqual([100, 0, 600, 600]);
    expect(v.getUint16(g + 10)).toBe(3);
    expect(v.getUint16(g + 12)).toBe(0);
    expect([...ttf.slice(g + 14, g + 18)]).toEqual([1, 1, 1, 1]);
    const hmtx = tables.hmtx.offset;
    expect(v.getUint16(hmtx + 2 * 4)).toBe(700);
    expect(v.getInt16(hmtx + 2 * 4 + 2)).toBe(100);
  });

  it("is byte-identical across builds", () => {
    expect(buildTTF(glyphs, metrics)).toEqual(ttf);
  });
});
