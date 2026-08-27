// A TrueType writer from the spec, nothing else. Outlines are quadratic
// contours: on-curve points and off-curve controls, two off-curve points in a
// row implying the on-curve midpoint between them, which is how toPath's
// midpoint smoothing already thinks. Unhinted, no kerning, long loca offsets.

export interface Point {
  x: number;
  y: number;
  on: boolean;
}

export interface Glyph {
  /** unicode code point; undefined for .notdef */
  code?: number;
  advance: number;
  contours: Point[][];
}

export interface FontMetrics {
  family: string;
  unitsPerEm: number;
  ascender: number;
  descender: number;
  xHeight: number;
  capHeight: number;
  /** stroke weight of the pen, reported as underline thickness */
  pen: number;
}

const MAGIC = 0x5f0f3cf5;
const CHECKSUM_ADJUST = 0xb1b0afba;
/* head.created/modified: seconds since 1904; a fixed stamp keeps the build
   byte-identical for the same glyphs (2026-01-01T00:00:00Z) */
const EPOCH_1904_TO_2026 = 3850675200n;
const ON_CURVE = 1;

class Writer {
  private buf = new Uint8Array(1024);
  private view = new DataView(this.buf.buffer);
  length = 0;

  private grow(n: number) {
    if (this.length + n <= this.buf.length) return;
    const next = new Uint8Array(Math.max(this.buf.length * 2, this.length + n));
    next.set(this.buf);
    this.buf = next;
    this.view = new DataView(next.buffer);
  }
  u8(v: number) {
    this.grow(1);
    this.view.setUint8(this.length, v);
    this.length += 1;
  }
  u16(v: number) {
    this.grow(2);
    this.view.setUint16(this.length, v & 0xffff);
    this.length += 2;
  }
  i16(v: number) {
    this.grow(2);
    this.view.setInt16(this.length, Math.round(v));
    this.length += 2;
  }
  u32(v: number) {
    this.grow(4);
    this.view.setUint32(this.length, v >>> 0);
    this.length += 4;
  }
  i64(v: bigint) {
    this.grow(8);
    this.view.setBigInt64(this.length, v);
    this.length += 8;
  }
  /** 16.16 fixed */
  fixed(v: number) {
    this.u32(Math.round(v * 65536));
  }
  tag(s: string) {
    for (let i = 0; i < 4; i++) this.u8(s.charCodeAt(i));
  }
  bytes(b: Uint8Array) {
    this.grow(b.length);
    this.buf.set(b, this.length);
    this.length += b.length;
  }
  pad(to = 4) {
    while (this.length % to) this.u8(0);
  }
  done(): Uint8Array {
    return this.buf.slice(0, this.length);
  }
}

function checksum(b: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < b.length; i += 4) {
    const word =
      ((b[i] ?? 0) << 24) | ((b[i + 1] ?? 0) << 16) | ((b[i + 2] ?? 0) << 8) | (b[i + 3] ?? 0);
    sum = (sum + word) >>> 0;
  }
  return sum;
}

function bbox(points: Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return points.length
    ? { xMin: Math.min(...xs), yMin: Math.min(...ys), xMax: Math.max(...xs), yMax: Math.max(...ys) }
    : { xMin: 0, yMin: 0, xMax: 0, yMax: 0 };
}

function glyfEntry(g: Glyph): Uint8Array {
  const w = new Writer();
  const points = g.contours.flat();
  if (!points.length) return w.done();
  const box = bbox(points);
  w.i16(g.contours.length);
  w.i16(box.xMin);
  w.i16(box.yMin);
  w.i16(box.xMax);
  w.i16(box.yMax);
  let end = -1;
  for (const c of g.contours) {
    end += c.length;
    w.u16(end);
  }
  w.u16(0); // no instructions
  // flags: every coordinate as a full int16 delta; short vectors would save
  // bytes but not enough to earn their branching
  for (const p of points) w.u8(p.on ? ON_CURVE : 0);
  let px = 0;
  for (const p of points) {
    w.i16(Math.round(p.x) - px);
    px = Math.round(p.x);
  }
  let py = 0;
  for (const p of points) {
    w.i16(Math.round(p.y) - py);
    py = Math.round(p.y);
  }
  w.pad();
  return w.done();
}

function cmapTable(glyphs: Glyph[]): Uint8Array {
  const mapped = glyphs
    .map((g, gid) => ({ code: g.code, gid }))
    .filter((m): m is { code: number; gid: number } => m.code !== undefined)
    .sort((a, b) => a.code - b.code);
  // one segment per run of consecutive code points with consecutive glyph ids
  const segs: { start: number; end: number; delta: number }[] = [];
  for (const m of mapped) {
    const last = segs[segs.length - 1];
    if (last && m.code === last.end + 1 && (m.gid - m.code) % 65536 === last.delta) last.end = m.code;
    else segs.push({ start: m.code, end: m.code, delta: (m.gid - m.code) % 65536 });
  }
  segs.push({ start: 0xffff, end: 0xffff, delta: 1 });
  const segCount = segs.length;
  const searchRange = 2 * 2 ** Math.floor(Math.log2(segCount));

  const sub = new Writer();
  sub.u16(4);
  sub.u16(16 + segCount * 8);
  sub.u16(0); // language
  sub.u16(segCount * 2);
  sub.u16(searchRange);
  sub.u16(Math.log2(searchRange / 2));
  sub.u16(segCount * 2 - searchRange);
  for (const s of segs) sub.u16(s.end);
  sub.u16(0); // reservedPad
  for (const s of segs) sub.u16(s.start);
  for (const s of segs) sub.u16(s.delta);
  segs.forEach(() => sub.u16(0)); // idRangeOffset: deltas only

  const w = new Writer();
  w.u16(0);
  w.u16(2); // encoding records, sorted by platform: (0,3) unicode, (3,1) windows
  const recordsEnd = 4 + 2 * 8;
  w.u16(0);
  w.u16(3);
  w.u32(recordsEnd);
  w.u16(3);
  w.u16(1);
  w.u32(recordsEnd);
  w.bytes(sub.done());
  return w.done();
}

function nameTable(m: FontMetrics): Uint8Array {
  const ps = m.family.replace(/\s+/g, "");
  const entries: [number, string][] = [
    [1, m.family],
    [2, "Regular"],
    [3, `${ps}-Regular;1.0`],
    [4, m.family],
    [5, "Version 1.0"],
    [6, `${ps}-Regular`],
  ];
  const strings = new Writer();
  const records = new Writer();
  for (const [id, s] of entries) {
    records.u16(3);
    records.u16(1);
    records.u16(0x0409);
    records.u16(id);
    records.u16(s.length * 2);
    records.u16(strings.length);
    for (const ch of s) strings.u16(ch.charCodeAt(0));
  }
  const w = new Writer();
  w.u16(0);
  w.u16(entries.length);
  w.u16(6 + entries.length * 12);
  w.bytes(records.done());
  w.bytes(strings.done());
  return w.done();
}

export function buildTTF(glyphs: Glyph[], m: FontMetrics): Uint8Array {
  const entries = glyphs.map(glyfEntry);
  const allPoints = glyphs.flatMap((g) => g.contours.flat());
  const box = bbox(allPoints);
  const maxPoints = Math.max(0, ...glyphs.map((g) => g.contours.flat().length));
  const maxContours = Math.max(0, ...glyphs.map((g) => g.contours.length));
  const codes = glyphs.map((g) => g.code).filter((c): c is number => c !== undefined);

  const glyf = new Writer();
  const loca = new Writer();
  for (const e of entries) {
    loca.u32(glyf.length);
    glyf.bytes(e);
  }
  loca.u32(glyf.length);

  const head = new Writer();
  head.fixed(1);
  head.fixed(1);
  head.u32(0); // checkSumAdjustment, patched below
  head.u32(MAGIC);
  head.u16(0b1011); // baseline at y=0, lsb at x=0, integer ppem scaling
  head.u16(m.unitsPerEm);
  head.i64(EPOCH_1904_TO_2026);
  head.i64(EPOCH_1904_TO_2026);
  head.i16(box.xMin);
  head.i16(box.yMin);
  head.i16(box.xMax);
  head.i16(box.yMax);
  head.u16(0); // macStyle
  head.u16(8); // lowestRecPPEM
  head.i16(2); // fontDirectionHint
  head.i16(1); // long loca
  head.i16(0);

  const hhea = new Writer();
  hhea.fixed(1);
  hhea.i16(m.ascender);
  hhea.i16(m.descender);
  hhea.i16(0);
  hhea.u16(Math.max(...glyphs.map((g) => g.advance)));
  hhea.i16(Math.min(...glyphs.map((g) => bbox(g.contours.flat()).xMin)));
  hhea.i16(Math.min(...glyphs.map((g) => g.advance - bbox(g.contours.flat()).xMax)));
  hhea.i16(box.xMax);
  hhea.i16(1);
  hhea.i16(0);
  hhea.i16(0);
  for (let i = 0; i < 4; i++) hhea.i16(0);
  hhea.i16(0);
  hhea.u16(glyphs.length);

  const hmtx = new Writer();
  for (const g of glyphs) {
    hmtx.u16(g.advance);
    hmtx.i16(bbox(g.contours.flat()).xMin);
  }

  const maxp = new Writer();
  maxp.fixed(1);
  maxp.u16(glyphs.length);
  maxp.u16(maxPoints);
  maxp.u16(maxContours);
  maxp.u16(0);
  maxp.u16(0);
  maxp.u16(2); // maxZones
  for (let i = 0; i < 8; i++) maxp.u16(0);

  const os2 = new Writer();
  os2.u16(4);
  os2.i16(Math.round(glyphs.reduce((s, g) => s + g.advance, 0) / glyphs.length));
  os2.u16(400);
  os2.u16(5);
  os2.u16(0); // fsType: installable
  const sub = Math.round(m.unitsPerEm * 0.65);
  for (const v of [sub, sub, 0, Math.round(m.unitsPerEm * 0.14), sub, sub, 0, Math.round(m.unitsPerEm * 0.48)]) os2.i16(v);
  os2.i16(m.pen);
  os2.i16(Math.round(m.xHeight / 2));
  os2.i16(0); // sFamilyClass
  for (let i = 0; i < 10; i++) os2.u8(0); // panose
  os2.u32(1); // Basic Latin
  os2.u32(0);
  os2.u32(0);
  os2.u32(0);
  os2.tag("DRWB");
  os2.u16(0x40 | 0x80); // REGULAR, USE_TYPO_METRICS
  os2.u16(Math.min(...codes));
  os2.u16(Math.min(0xffff, Math.max(...codes)));
  os2.i16(m.ascender);
  os2.i16(m.descender);
  os2.i16(0);
  os2.u16(Math.max(m.ascender, box.yMax));
  os2.u16(Math.max(-m.descender, -box.yMin));
  os2.u32(1); // Latin 1
  os2.u32(0);
  os2.i16(m.xHeight);
  os2.i16(m.capHeight);
  os2.u16(0);
  os2.u16(32);
  os2.u16(0);

  const post = new Writer();
  post.fixed(3);
  post.fixed(0);
  post.i16(-Math.round(m.pen * 1.5));
  post.i16(m.pen);
  post.u32(0);
  for (let i = 0; i < 4; i++) post.u32(0);

  const tables: [string, Uint8Array][] = [
    ["OS/2", os2.done()],
    ["cmap", cmapTable(glyphs)],
    ["glyf", glyf.done()],
    ["head", head.done()],
    ["hhea", hhea.done()],
    ["hmtx", hmtx.done()],
    ["loca", loca.done()],
    ["maxp", maxp.done()],
    ["name", nameTable(m)],
    ["post", post.done()],
  ];

  const n = tables.length;
  const searchRange = 16 * 2 ** Math.floor(Math.log2(n));
  const file = new Writer();
  file.u32(0x00010000);
  file.u16(n);
  file.u16(searchRange);
  file.u16(Math.log2(searchRange / 16));
  file.u16(n * 16 - searchRange);
  let offset = 12 + n * 16;
  for (const [tag, data] of tables) {
    file.tag(tag);
    file.u32(checksum(data));
    file.u32(offset);
    file.u32(data.length);
    offset += Math.ceil(data.length / 4) * 4;
  }
  let headOffset = 0;
  for (const [tag, data] of tables) {
    if (tag === "head") headOffset = file.length;
    file.bytes(data);
    file.pad();
  }
  const out = file.done();
  const adjust = (CHECKSUM_ADJUST - checksum(out)) >>> 0;
  new DataView(out.buffer).setUint32(headOffset + 8, adjust);
  return out;
}
