/**
 * The geometry of The Index.
 *
 * A codebase rendered as architecture. Each instance is one line of source: a
 * thin horizontal bar whose length is the length of the line. Lines stack into
 * file blocks, file blocks are arrayed down a corridor in Z, and the camera
 * travels through them on scroll. The silhouette reads as indented source at a
 * glance without a single glyph being rendered.
 *
 * Everything here is generated once, from a seeded PRNG, so the layout is
 * identical on every load and between the server and the browser. All of it is
 * plain data: the render layer only uploads it.
 */

export type HallConfig = {
  /** Total instances. The single biggest lever on frame time. */
  count: number;
  /** Corridor depth. Blocks are distributed from +nearZ to -farZ. */
  nearZ: number;
  farZ: number;
};

export type Hall = {
  /** xyz per instance. */
  positions: Float32Array;
  /** Per-instance x-scale (line length). y and z are constant. */
  lengths: Float32Array;
  /** rgb per instance, linear-ish sRGB values in 0..1. */
  colors: Float32Array;
  /** Block centre per instance, used to draw call-graph edges between files. */
  blockIds: Uint16Array;
  blockCentres: Float32Array;
  blockCount: number;
  count: number;
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Palette, as linear rgb triples.

   The overwhelming majority of lines are dormant slate. A minority are
   "indexed" bone. Ember is spent on roughly one line in seventy, which is what
   keeps the accent at the 1–2% of pixels the design allows — an ember bar is
   a changed line, and most lines in a repository are not changed. */
const SLATE: [number, number, number] = [0.106, 0.132, 0.156];
const SLATE_HI: [number, number, number] = [0.148, 0.182, 0.212];
const BONE: [number, number, number] = [0.34, 0.38, 0.42];
const EMBER: [number, number, number] = [0.62, 0.3, 0.09];

/**
 * Indentation is what makes this legible as code rather than as a barcode.
 * Real source sits mostly at one or two levels with occasional deeper nesting,
 * so the depth walks rather than being drawn uniformly.
 */
function nextIndent(current: number, rnd: () => number) {
  const r = rnd();
  if (r < 0.18) return Math.min(4, current + 1);
  if (r < 0.34) return Math.max(0, current - 1);
  if (r < 0.42) return 0;
  return current;
}

export function buildHall({ count, nearZ, farZ }: HallConfig): Hall {
  const rnd = mulberry32(74213);

  const positions = new Float32Array(count * 3);
  const lengths = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const blockIds = new Uint16Array(count);

  const centres: number[] = [];
  const LINE_H = 0.17;

  let i = 0;
  let block = 0;

  /* Lanes sit either side of a wide empty corridor.

     The first pass put the innermost lane at ±6.4 and the hall ran straight
     through the body copy — legible geometry behind illegible prose, which is
     the wrong trade every time. The content column is the subject; the hall is
     the room it is standing in. Nothing is drawn where the text lives. */
  const lanes = [-24, -17.5, -11.5, 11.5, 17.5, 24];

  while (i < count) {
    const lane = lanes[block % lanes.length];
    const depth = nearZ - ((block / lanes.length) | 0) * 10.6 - rnd() * 3.4;
    if (depth < -farZ) break;

    const lines = 16 + ((rnd() * 42) | 0);
    const baseY = 6.5 - rnd() * 13;
    const jitterX = (rnd() - 0.5) * 3.2;
    const bx = lane + jitterX;

    centres.push(bx, baseY - (lines * LINE_H) / 2, depth);

    // A minority of files are "touched by this change" and carry ember lines.
    const touched = rnd() < 0.14;
    let indent = 0;

    for (let l = 0; l < lines && i < count; l++, i++) {
      indent = nextIndent(indent, rnd);
      // Blank lines are part of what source looks like; a wall with no gaps
      // reads as a texture rather than as a file.
      const blank = rnd() < 0.09;
      const len = blank ? 0 : 0.55 + rnd() * (3.6 - indent * 0.45);

      positions[i * 3] = bx + indent * 0.32 + len / 2;
      positions[i * 3 + 1] = baseY - l * LINE_H;
      positions[i * 3 + 2] = depth;

      lengths[i] = Math.max(len, 0.0001);
      blockIds[i] = block;

      /* Brighter lines are what make the wall read as source rather than as
         texture: the eye needs a few high-contrast rows per block to lock onto
         the indentation. Ember stays rare — a changed line, not a decoration. */
      const r = rnd();
      const c =
        touched && r < 0.2
          ? EMBER
          : r < 0.19
            ? BONE
            : r < 0.52
              ? SLATE_HI
              : SLATE;

      colors[i * 3] = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
    }

    block++;
    if (block > 4000) break;
  }

  return {
    positions,
    lengths,
    colors,
    blockIds,
    blockCentres: new Float32Array(centres),
    blockCount: centres.length / 3,
    count: i,
  };
}

/**
 * Call-graph edges between file blocks.
 *
 * Only drawn between blocks that are near each other in depth, because an edge
 * spanning the whole corridor reads as a stray line rather than as a call. This
 * is the geometry that makes the work section look like what Cavix actually
 * computes: symbol flow between files.
 */
export function buildEdges(hall: Hall, max = 90) {
  const rnd = mulberry32(991);
  const { blockCentres, blockCount } = hall;
  const out: number[] = [];

  for (let n = 0; n < max * 6 && out.length < max * 6; n++) {
    const a = (rnd() * blockCount) | 0;
    const b = (rnd() * blockCount) | 0;
    if (a === b) continue;

    const az = blockCentres[a * 3 + 2];
    const bz = blockCentres[b * 3 + 2];
    if (Math.abs(az - bz) > 26) continue;

    out.push(
      blockCentres[a * 3],
      blockCentres[a * 3 + 1],
      az,
      blockCentres[b * 3],
      blockCentres[b * 3 + 1],
      bz,
    );
  }

  return new Float32Array(out);
}
