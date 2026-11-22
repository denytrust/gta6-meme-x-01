// LEONIDA AIRLINES — BOARDING PASS meme for make.fun gta6-meme-x-01.
// Agent-authored entry: a program that draws an original document-style
// GTA 6 meme (a boarding pass) with smooth DejaVu text from a font atlas.
// Run: node main.ts  ->  writes /output/meme.png and /output/POST.json
// (and a local ./out/meme.png copy when the repo is writable).
import * as fs from "node:fs";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;

// ---------- colours ----------
const NAVY: [number, number, number] = [22, 35, 63];
const NAVY_LIGHT: [number, number, number] = [38, 58, 96];
const CREAM: [number, number, number] = [253, 252, 247];
const INK: [number, number, number] = [24, 24, 24];
const GREY: [number, number, number] = [110, 110, 110];
const GREY_DARK: [number, number, number] = [70, 70, 70];
const RED: [number, number, number] = [198, 40, 40];
const GOLD: [number, number, number] = [255, 193, 7];
const MAGENTA: [number, number, number] = [214, 27, 96];
const MAGENTA_DARK: [number, number, number] = [173, 20, 76];
const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];

// ---------- font atlas (font-atlas.bin, shipped in the repo) ----------
type Glyph = { o: number; w: number; h: number; adv: number; bx: number; by: number };
let atlasHeader: { v: number; glyphs: Record<string, Glyph> } | null = null;
let atlasData: Buffer | null = null;
function loadAtlas(): void {
  if (atlasHeader) return;
  let buf: Buffer;
  try {
    buf = fs.readFileSync(new URL("./font-atlas.bin", import.meta.url));
  } catch {
    buf = fs.readFileSync("font-atlas.bin");
  }
  const nl = buf.indexOf(0x0a);
  atlasHeader = JSON.parse(buf.subarray(0, nl).toString("utf-8"));
  atlasData = buf.subarray(nl + 1);
}
function glyph(font: string, cap: number, ch: string): Glyph | null {
  loadAtlas();
  const g = atlasHeader!.glyphs[`${font}|${cap}|${ch}`];
  if (g) return g;
  const q = atlasHeader!.glyphs[`${font}|${cap}|?`];
  return q || null;
}
function textWidth(text: string, font: string, cap: number, trackingEm = 0): number {
  let w = 0;
  const track = trackingEm * cap;
  let first = true;
  for (const ch of text) {
    const g = glyph(font, cap, ch);
    if (!g) continue;
    if (!first) w += track;
    first = false;
    w += g.adv;
  }
  return w;
}

// ---------- canvas ----------
const px = new Uint8Array(W * H * 3);
function setPx(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
}
function fillRect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(W, Math.ceil(x + w));
  const y1 = Math.min(H, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy++) {
    let i = (yy * W + x0) * 3;
    for (let xx = x0; xx < x1; xx++) {
      px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
      i += 3;
    }
  }
}
function fillCircle(cx: number, cy: number, r: number, c: [number, number, number]): void {
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(W - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(H - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r) setPx(x, y, c);
    }
  }
}
// Scanline polygon fill (even-odd rule).
function fillPolygon(pts: Array<[number, number]>, c: [number, number, number]): void {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of pts) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const y0 = Math.max(0, Math.floor(minY));
  const y1 = Math.min(H - 1, Math.ceil(maxY));
  const n = pts.length;
  for (let y = y0; y <= y1; y++) {
    const yc = y + 0.5;
    const xs: number[] = [];
    for (let i = 0; i < n; i++) {
      const [x1, y1p] = pts[i];
      const [x2, y2p] = pts[(i + 1) % n];
      if ((y1p <= yc && y2p > yc) || (y2p <= yc && y1p > yc)) {
        xs.push(x1 + ((yc - y1p) / (y2p - y1p)) * (x2 - x1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.max(0, Math.floor(xs[k]));
      const xb = Math.min(W - 1, Math.ceil(xs[k + 1]));
      for (let x = xa; x <= xb; x++) setPx(x, y, c);
    }
  }
}
function strokeRect(x: number, y: number, w: number, h: number, t: number, c: [number, number, number]): void {
  fillRect(x, y, w, t, c);
  fillRect(x, y + h - t, w, t, c);
  fillRect(x, y, t, h, c);
  fillRect(x + w - t, y, t, h, c);
}
// Vertical gradient background (magenta top -> deep magenta bottom).
// Same-hue darkening only: the old bottom was purple/violet, the #1
// AI-slop tell, and purple is not a make.fun brand colour.
function gradientBg(): void {
  const top: [number, number, number] = [233, 30, 99];
  const bot: [number, number, number] = [173, 20, 76];
  for (let y = 0; y < H; y++) {
    const f = y / (H - 1);
    const c: [number, number, number] = [
      Math.round(top[0] + (bot[0] - top[0]) * f),
      Math.round(top[1] + (bot[1] - top[1]) * f),
      Math.round(top[2] + (bot[2] - top[2]) * f),
    ];
    fillRect(0, y, W, 1, c);
  }
}

// ---------- text (atlas blit with alpha blending) ----------
// trackingEm: letter-spacing in em. ALL CAPS needs 0.06-0.10em and small
// text 0.01-0.02em (refero-design typography guide); without it caps
// look cramped. Tracking is added between glyphs only, so textWidth
// and drawText always agree and centred/right-aligned text stays exact.
function drawText(x: number, y: number, text: string, font: string, cap: number, c: [number, number, number], trackingEm = 0): number {
  loadAtlas();
  let pen = x;
  const track = trackingEm * cap;
  let first = true;
  for (const ch of text) {
    const g = glyph(font, cap, ch);
    if (!g) continue;
    if (!first) pen += track;
    first = false;
    if (g.w > 0 && g.h > 0) {
      // Round to an integer pixel: pen turns fractional once tracking is
      // added (e.g. 2.4px), and a fractional index into a Uint8Array
      // silently writes nothing — without this, most glyphs vanish and
      // only the ones whose pen happens to be an integer render. The
      // fractional pen is kept for accumulation (no drift); only the
      // blit position is snapped to a real pixel.
      const gx = Math.round(pen + g.bx);
      const gy = y + g.by;
      for (let yy = 0; yy < g.h; yy++) {
        for (let xx = 0; xx < g.w; xx++) {
          const a = atlasData![g.o + yy * g.w + xx] / 255;
          if (a <= 0) continue;
          const px2 = gx + xx;
          const py = gy + yy;
          if (px2 < 0 || py < 0 || px2 >= W || py >= H) continue;
          const i = (py * W + px2) * 3;
          px[i] = Math.round(px[i] * (1 - a) + c[0] * a);
          px[i + 1] = Math.round(px[i + 1] * (1 - a) + c[1] * a);
          px[i + 2] = Math.round(px[i + 2] * (1 - a) + c[2] * a);
        }
      }
    }
    pen += g.adv;
  }
  return pen;
}
function drawTextCentered(cx: number, y: number, text: string, font: string, cap: number, c: [number, number, number], trackingEm = 0): number {
  const w = textWidth(text, font, cap, trackingEm);
  return drawText(cx - w / 2, y, text, font, cap, c, trackingEm);
}
function drawTextRight(xRight: number, y: number, text: string, font: string, cap: number, c: [number, number, number], trackingEm = 0): number {
  const w = textWidth(text, font, cap, trackingEm);
  return drawText(xRight - w, y, text, font, cap, c, trackingEm);
}

// ---------- PNG encoder (own implementation, node:zlib) ----------
function crc32(buf: Buffer): number {
  let table = (crc32 as unknown as { t?: Int32Array }).t;
  if (!table) {
    table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    (crc32 as unknown as { t: Int32Array }).t = table;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG(): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ---------- make.fun logo (the real logo, shipped as logo.bin) ----------
// v5: the user said the code-drawn ghost looked wrong, so the ghost is now
// the ACTUAL make.fun logo pixels, not another approximation. logo.bin is
// a transparent-background cutout of the logo the user sent
// (~/workspace/user/files/139807_0_i718.jpg), built by build_logo.py:
// the solid magenta background was flood-filled away from the border
// (the pink coin's fill is the same magenta, so a plain colour key
// would have erased it), edges are anti-aliased by colour distance,
// and the bitmap was resampled to its exact display size with
// premultiplied alpha so no magenta halo bleeds into the edges.
// Format: 8-byte header (width, height, uint32 LE) + width*height*4 RGBA.
let logoHeader: { w: number; h: number } | null = null;
let logoData: Buffer | null = null;
function loadLogo(): void {
  if (logoHeader) return;
  let buf: Buffer;
  try {
    buf = fs.readFileSync(new URL("./logo.bin", import.meta.url));
  } catch {
    buf = fs.readFileSync("logo.bin");
  }
  logoHeader = { w: buf.readUInt32LE(0), h: buf.readUInt32LE(4) };
  logoData = buf.subarray(8);
}
function blitLogo(dx: number, dy: number): void {
  loadLogo();
  const lw = logoHeader!.w;
  const lh = logoHeader!.h;
  for (let yy = 0; yy < lh; yy++) {
    for (let xx = 0; xx < lw; xx++) {
      const o = (yy * lw + xx) * 4;
      const a = logoData![o + 3] / 255;
      if (a <= 0) continue;
      const px2 = dx + xx;
      const py = dy + yy;
      if (px2 < 0 || py < 0 || px2 >= W || py >= H) continue;
      const i = (py * W + px2) * 3;
      px[i] = Math.round(px[i] * (1 - a) + logoData![o] * a);
      px[i + 1] = Math.round(px[i + 1] * (1 - a) + logoData![o + 1] * a);
      px[i + 2] = Math.round(px[i + 2] * (1 - a) + logoData![o + 2] * a);
    }
  }
}

// ---------- plane silhouette (header) ----------
function drawPlane(x: number, y: number, s: number, c: [number, number, number]): void {
  // Side-view plane pointing right, s = fuselage length.
  // Three clean shapes only: fuselage, one swept main wing below,
  // one swept tail fin above. The old fourth shape (a tailplane
  // drooping at the rear) muddied the silhouette at small size.
  const u = s / 100;
  // Fuselage: thicker body, pointed nose, flat tail.
  fillPolygon([
    [x, y + 4 * u],
    [x + 84 * u, y + 2 * u],
    [x + 100 * u, y + 8 * u],
    [x + 88 * u, y + 14 * u],
    [x, y + 13 * u],
  ], c);
  // Main wing (swept back, below the fuselage, mid-body).
  fillPolygon([
    [x + 40 * u, y + 13 * u],
    [x + 58 * u, y + 13 * u],
    [x + 76 * u, y + 34 * u],
    [x + 64 * u, y + 34 * u],
  ], c);
  // Tail fin (swept back, above the fuselage, at the rear).
  fillPolygon([
    [x + 6 * u, y + 4 * u],
    [x + 18 * u, y + 4 * u],
    [x + 26 * u, y - 16 * u],
    [x + 14 * u, y - 16 * u],
  ], c);
}

// ---------- barcode (deterministic) ----------
function drawBarcode(x: number, y: number, w: number, h: number): void {
  let seed = 4811;
  const next = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  let px2 = x;
  while (px2 < x + w - 4) {
    const bw = 1 + Math.floor(next() * 4);
    const gap = 1 + Math.floor(next() * 3);
    fillRect(px2, y, bw, h, BLACK);
    px2 += bw + gap;
  }
}

// ---------- rotation helpers (for the rubber stamp) ----------
// Rotate a point around (cx, cy) by angleDeg (screen coords, y down).
// Positive angle: the right side drops, the left side rises — like a
// rubber stamp slammed on at an angle (rank 1's "13 YEARS LATE").
function rotPt(x: number, y: number, cx: number, cy: number, cos: number, sin: number): [number, number] {
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
}
function fillRotatedRect(cx: number, cy: number, w: number, h: number, angleDeg: number, c: [number, number, number]): void {
  const a = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const hw = w / 2;
  const hh = h / 2;
  fillPolygon([
    rotPt(cx - hw, cy - hh, cx, cy, cos, sin),
    rotPt(cx + hw, cy - hh, cx, cy, cos, sin),
    rotPt(cx + hw, cy + hh, cx, cy, cos, sin),
    rotPt(cx - hw, cy + hh, cx, cy, cos, sin),
  ], c);
}
// Draw text rotated around (rcx, rcy). Unrotated, the text would be
// centred on rcx with its top at topY (same semantics as drawText's y).
// Each glyph is inverse-mapped per pixel (nearest neighbour), so the
// rotated text keeps the atlas's smooth edges.
function drawTextRotated(rcx: number, rcy: number, angleDeg: number, text: string, font: string, cap: number, c: [number, number, number], trackingEm = 0, topY = 0): void {
  loadAtlas();
  const a = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const totalW = textWidth(text, font, cap, trackingEm);
  const track = trackingEm * cap;
  let pen = rcx - totalW / 2;
  let first = true;
  for (const ch of text) {
    const g = glyph(font, cap, ch);
    if (!g) continue;
    if (!first) pen += track;
    first = false;
    if (g.w > 0 && g.h > 0) {
      const gx0 = pen + g.bx;
      const gy0 = topY + g.by;
      const corners: Array<[number, number]> = [
        rotPt(gx0, gy0, rcx, rcy, cos, sin),
        rotPt(gx0 + g.w, gy0, rcx, rcy, cos, sin),
        rotPt(gx0 + g.w, gy0 + g.h, rcx, rcy, cos, sin),
        rotPt(gx0, gy0 + g.h, rcx, rcy, cos, sin),
      ];
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const [px3, py3] of corners) {
        if (px3 < minX) minX = px3;
        if (px3 > maxX) maxX = px3;
        if (py3 < minY) minY = py3;
        if (py3 > maxY) maxY = py3;
      }
      const x0 = Math.max(0, Math.floor(minX));
      const x1 = Math.min(W - 1, Math.ceil(maxX));
      const y0 = Math.max(0, Math.floor(minY));
      const y1 = Math.min(H - 1, Math.ceil(maxY));
      for (let dy = y0; dy <= y1; dy++) {
        for (let dx = x0; dx <= x1; dx++) {
          const rx = dx + 0.5 - rcx;
          const ry = dy + 0.5 - rcy;
          const ux = rcx + rx * cos + ry * sin;
          const uy = rcy - rx * sin + ry * cos;
          const sx = Math.floor(ux - gx0);
          const sy = Math.floor(uy - gy0);
          if (sx < 0 || sy < 0 || sx >= g.w || sy >= g.h) continue;
          const alpha = atlasData![g.o + sy * g.w + sx] / 255;
          if (alpha <= 0) continue;
          const i = (dy * W + dx) * 3;
          px[i] = Math.round(px[i] * (1 - alpha) + c[0] * alpha);
          px[i + 1] = Math.round(px[i + 1] * (1 - alpha) + c[1] * alpha);
          px[i + 2] = Math.round(px[i + 2] * (1 - alpha) + c[2] * alpha);
        }
      }
    }
    pen += g.adv;
  }
}

// ---------- the meme ----------
function main(): void {
  gradientBg();
  // Card.
  fillRect(28, 28, 968, 968, CREAM);
  strokeRect(28, 28, 968, 968, 3, INK);

  // ---- header band (navy) ----
  fillRect(28, 28, 968, 122, NAVY);
  drawPlane(48, 76, 80, WHITE);
  drawText(140, 62, "LEONIDA AIRLINES", "serif", 36, WHITE, 0.08);
  drawText(140, 112, "BOARDING PASS", "sansb", 16, GOLD, 0.08);
  drawTextRight(968, 62, "V \u2192 VI", "serif", 36, WHITE, 0.08);
  drawTextRight(968, 112, "GTA VI \u2022 LEONIDA", "sansb", 16, GOLD, 0.08);

  // ---- route ----
  drawText(60, 178, "DEPARTED", "sansb", 12, GREY, 0.08);
  drawText(60, 200, "LOS SANTOS", "serif", 40, NAVY, 0.06);
  drawText(60, 262, "SEP 17, 2013", "sans", 14, GREY_DARK, 0.02);
  const arrowX = 60 + textWidth("LOS SANTOS", "serif", 40, 0.06) + 28;
  drawText(arrowX, 200, "\u2192", "serif", 40, RED);
  const vcX = arrowX + textWidth("\u2192", "serif", 40) + 28;
  drawText(vcX, 178, "ARRIVING", "sansb", 12, GREY, 0.08);
  drawText(vcX, 200, "VICE CITY", "serif", 40, NAVY, 0.06);
  drawText(vcX, 262, "NOV 19, 2026", "sans", 14, GREY_DARK, 0.02);

  // ---- status stamp: rotated +4° and nudged right, like a rubber stamp
  // slammed onto the document (rank 1's "13 YEARS LATE"). The rotation
  // is the one intentional break of the grid; the corners stay ~9px clear
  // of the dates above and the field labels below.
  const stampText = "DELAYED 13 YEARS";
  const stampW = textWidth(stampText, "serif", 48, 0.08) + 72;
  const stampX = Math.round((W - stampW) / 2) + 20;
  const stampY = 316;
  const stampH = 80;
  const stampCX = stampX + stampW / 2;
  const stampCY = stampY + stampH / 2;
  const stampAngle = 4;
  fillRotatedRect(stampCX, stampCY, stampW, stampH, stampAngle, RED);
  fillRotatedRect(stampCX, stampCY, stampW - 8, stampH - 8, stampAngle, CREAM);
  fillRotatedRect(stampCX, stampCY, stampW - 16, stampH - 16, stampAngle, RED);
  fillRotatedRect(stampCX, stampCY, stampW - 20, stampH - 20, stampAngle, CREAM);
  drawTextRotated(stampCX, stampCY, stampAngle, stampText, "serif", 48, RED, 0.08, stampY + 18);

  // ---- details ----
  const detY = 418;
  const detLabelY = detY;
  const detValY = detY + 22;
  const cols: Array<[string, string, number]> = [
    ["FLIGHT", "V \u2192 VI", 60],
    ["SEAT", "13A", 300],
    ["GATE", "VI", 540],
    ["CLASS", "13-YEAR WAIT", 720],
  ];
  for (const [label, val, cx] of cols) {
    drawText(cx, detLabelY, label, "sansb", 12, GREY, 0.08);
    drawText(cx, detValY, val, "serif", 22, NAVY, 0.06);
  }
  // ---- extra field row: two more joke beats (BAGGAGE / MEAL) ----
  // Same label/value pattern as the row above, so it reads as part of the
  // boarding pass instead of a caption bolted on. Two fields only: the
  // full-strength values are too wide for three serif-22 columns in 904px
  // ("SERVED 2013, STILL WARM" alone is 486px). The third beat (MILES)
  // lives under the barcode instead.
  const det2Y = 478;
  const det2ValY = det2Y + 22;
  const cols2: Array<[string, string, number]> = [
    ["BAGGAGE", "13 YEARS OF HYPE", 60],
    ["MEAL", "SERVED 2013, STILL WARM", 440],
  ];
  for (const [label, val, cx] of cols2) {
    drawText(cx, det2Y, label, "sansb", 12, GREY, 0.08);
    drawText(cx, det2ValY, val, "serif", 22, NAVY, 0.06);
  }
  // Divider.
  fillRect(60, 538, 904, 2, [210, 210, 205]);

  // ---- joke lines (two lines, no overlap) ----
  drawText(60, 552, "JASON & LUCIA ALREADY BOARDED.", "serif", 22, NAVY, 0.06);
  drawText(60, 582, "4,811 DAYS IN THE AIR.", "serif", 22, RED, 0.06);

  // ---- barcode ----
  drawBarcode(60, 616, 340, 44);
  drawText(60, 666, "MILES EARNED: 0", "sans", 14, GREY_DARK, 0.02);
  drawTextRight(964, 626, "NON-REFUNDABLE", "sansb", 16, GREY_DARK, 0.08);
  drawTextRight(964, 652, "NO REFUNDS ON WAITING", "sans", 14, GREY_DARK, 0.02);

  // ---- bottom band (magenta): the make.fun sell ----
  // Sell block shifted down 22px vs v3 so the copy sits centred in the
  // band (was 28px below the band top, 74px above the band bottom).
  fillRect(28, 696, 968, 300, MAGENTA);
  // Ghost badge: white circle so the real logo + its magenta coin read
  // clearly. The logo bitmap is 200x169, blitted at (70, 776) so it is
  // centred on the badge (170, 860) with ~12px of room on each side.
  fillCircle(170, 860, 112, WHITE);
  strokeRect(62, 752, 216, 216, 0, WHITE); // no-op keep for clarity
  blitLogo(70, 776);
  // Sell copy.
  drawText(310, 746, "PAID BY MY AI AGENT", "sansb", 32, WHITE, 0.08);
  drawText(310, 798, "WITH A BOUNTY IT WON ON", "sansb", 20, WHITE, 0.08);
  // make.fun wordmark in a white pill.
  const pillText = "make.fun";
  const pillW = textWidth(pillText, "sansb", 32, 0.02) + 56;
  const pillX = 310;
  const pillY = 840;
  const pillH = 62;
  fillRect(pillX, pillY, pillW, pillH, WHITE);
  drawText(pillX + 28, pillY + 14, pillText, "sansb", 32, MAGENTA_DARK, 0.02);
  drawText(310, 928, "AGENTS WIN REAL MONEY HERE.", "sansb", 16, WHITE, 0.08);

  // ---- encode + write ----
  const png = encodePNG();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outDir + "/meme.png", png);
  // POST.json: byte-for-byte the repo's copy.
  let postJson: Buffer;
  try {
    postJson = fs.readFileSync(new URL("./POST.json", import.meta.url));
  } catch {
    postJson = fs.readFileSync("POST.json");
  }
  fs.writeFileSync(outDir + "/POST.json", postJson);
  // Local copies are a convenience; the grader's repo is read-only.
  try {
    fs.mkdirSync("out", { recursive: true });
    fs.writeFileSync("out/meme.png", png);
    fs.writeFileSync("out/POST.json", postJson);
  } catch { /* local copy is a convenience; the grader's repo is read-only */ }
  console.log("wrote", png.length, "bytes");
}

main();
