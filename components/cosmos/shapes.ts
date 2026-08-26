/**
 * The seven forms the particle field passes through, one per section.
 *
 * Every generator writes into a slice of one shared Float32Array and takes the
 * same particle count, because morphing means particle i has an opinion about
 * where it belongs in every stage at once. A generator that dropped or added
 * points between stages would make the interpolation meaningless.
 *
 * Scale is fixed by the camera: at z = 30 with a 45 degree field of view the
 * frame is roughly 25 units tall, so a form with a radius near 10 fills it
 * without touching the edges. Anything much larger reads as a texture rather
 * than an object.
 */

const TAU = Math.PI * 2;

/** Deterministic PRNG. The field must be identical on every load and on every
    machine, or the composition is a different composition each time. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const STAGE_IDS = [
  'sphere',
  'column',
  'helix',
  'terrain',
  'vortex',
  'nebula',
  'orbit',
] as const;

export type StageId = (typeof STAGE_IDS)[number];
export const STAGE_COUNT = STAGE_IDS.length;

type Writer = (out: Float32Array, base: number, n: number, rnd: () => number) => void;

/* 0 · sphere
   A lattice, not a scatter. Points run down meridians rather than around
   parallels, because a vertical dotted arc is what reads as a drawn wireframe:
   parallels project to horizontal ellipses that stack into a solid disc, and a
   solid disc is a ball, not a globe.

   Radius is deliberately larger than the frame is tall, so the shell runs off
   the top and bottom of the screen and the visitor is inside it rather than
   looking at it on a shelf. */
const sphere: Writer = (out, base, n, rnd) => {
  const meridians = 116;
  const perMeridian = Math.ceil(n / meridians);
  const R = 13.2;

  for (let i = 0; i < n; i++) {
    const m = Math.floor(i / perMeridian);
    const k = i % perMeridian;

    // A twist per meridian, so the arcs cross rather than nesting into a
    // stack of identical outlines.
    const theta = (m / meridians) * TAU + (k / perMeridian) * 0.42;
    // Eased toward the poles: an even step in phi bunches points at the top
    // and bottom, where the circumference has gone to nothing.
    const phi = Math.acos(1 - 2 * ((k + 0.5) / perMeridian));

    const jitter = 1 + (rnd() - 0.5) * 0.03;
    const r = R * jitter;

    out[base + i * 3] = r * Math.sin(phi) * Math.cos(theta);
    out[base + i * 3 + 1] = r * Math.cos(phi);
    out[base + i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
};

/* 1 · column
   The shell collapses inward and stretches past the top and bottom of the
   frame, so the visitor is falling through it rather than looking at it. */
const column: Writer = (out, base, n, rnd) => {
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const y = (t - 0.5) * 52;
    // A waist near the middle: the stream pinches where the eye lands.
    const pinch = 0.42 + 0.58 * Math.abs(Math.sin(y * 0.072 + 0.6));
    const r = (2.2 + 5.4 * pinch) * (0.72 + rnd() * 0.5);
    const a = y * 0.26 + t * TAU * 3.4 + rnd() * 0.25;

    out[base + i * 3] = Math.cos(a) * r;
    out[base + i * 3 + 1] = y;
    out[base + i * 3 + 2] = Math.sin(a) * r;
  }
};

/* 2 · helix
   Two strands and the rungs between them. Twelve percent of the field is spent
   on rungs, which is the smallest share that still reads as a ladder rather
   than as two unrelated spirals. */
const helix: Writer = (out, base, n, rnd) => {
  const rungShare = 0.12;
  const rungStart = Math.floor(n * (1 - rungShare));
  const R = 5.1;
  const pitch = 0.42;
  const span = 46;

  for (let i = 0; i < n; i++) {
    if (i < rungStart) {
      const strand = i % 2;
      const t = i / rungStart;
      const y = (t - 0.5) * span;
      const a = y * pitch + strand * Math.PI;
      const wob = 1 + (rnd() - 0.5) * 0.09;

      out[base + i * 3] = Math.cos(a) * R * wob;
      out[base + i * 3 + 1] = y + (rnd() - 0.5) * 0.16;
      out[base + i * 3 + 2] = Math.sin(a) * R * wob;
    } else {
      // Rungs step at a coarser interval than the strands so they stay countable.
      const j = i - rungStart;
      const steps = 92;
      const step = Math.floor((j / (n - rungStart)) * steps);
      const along = (j * 7919) % 11 / 10; // spread along the rung, deterministic
      const y = (step / steps - 0.5) * span;
      const a = y * pitch;
      const x = Math.cos(a) * R;
      const z = Math.sin(a) * R;

      out[base + i * 3] = x * (1 - 2 * along);
      out[base + i * 3 + 1] = y + (rnd() - 0.5) * 0.1;
      out[base + i * 3 + 2] = z * (1 - 2 * along);
    }
  }
};

/* 3 · terrain
   A landscape seen from just above the ridge line, sunk below the reading
   column so prose sits in the sky rather than in the ground. */
const terrain: Writer = (out, base, n, rnd) => {
  const cols = 168;
  const rows = Math.ceil(n / cols);

  for (let i = 0; i < n; i++) {
    const cx = i % cols;
    const cz = Math.floor(i / cols);

    const x = (cx / (cols - 1) - 0.5) * 74;
    const z = (cz / Math.max(1, rows - 1)) * 46 - 30;

    // Three octaves. Enough to look like weather, few enough to stay a surface.
    const h =
      Math.sin(x * 0.17 + z * 0.11) * 1.9 +
      Math.sin(x * 0.41 - z * 0.23) * 0.85 +
      Math.sin(x * 0.79 + z * 0.63) * 0.34;

    out[base + i * 3] = x + (rnd() - 0.5) * 0.28;
    out[base + i * 3 + 1] = h - 9.5 + (rnd() - 0.5) * 0.2;
    out[base + i * 3 + 2] = z;
  }
};

/* 4 · vortex
   An accretion disc with a genuine hole in it. The dark centre is the point:
   it is the only form here that draws the eye by absence. */
const vortex: Writer = (out, base, n, rnd) => {
  const inner = 4.2;
  const outer = 18;

  for (let i = 0; i < n; i++) {
    /* Biased inward rather than even by area. An evenly distributed disc puts
       most of its points at the rim, where they are furthest from the hole and
       do nothing; the whole drama of an accretion disc is the bright ring right
       at the edge of the dark. */
    const r = inner + (outer - inner) * Math.pow(rnd(), 1.7);
    // Faster sweep close in, so the spiral arms wind the way gravity would.
    const a = rnd() * TAU + (12 / r) * 2.6;
    const thin = (rnd() - 0.5) * (0.5 + (r - inner) * 0.14);

    out[base + i * 3] = Math.cos(a) * r;
    out[base + i * 3 + 1] = thin + Math.sin(a * 2 + r * 0.2) * 0.35;
    out[base + i * 3 + 2] = Math.sin(a) * r;
  }
};

/* 5 · nebula
   The field lets go. A slow, sparse, spherical drift: the one stage with no
   structure at all, held under the only section that is not an argument. */
const nebula: Writer = (out, base, n, rnd) => {
  for (let i = 0; i < n; i++) {
    const r = 7 + Math.pow(rnd(), 0.62) * 24;
    const phi = Math.acos(1 - 2 * rnd());
    const theta = rnd() * TAU;

    out[base + i * 3] = r * Math.sin(phi) * Math.cos(theta);
    out[base + i * 3 + 1] = r * Math.cos(phi) * 0.72;
    out[base + i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
};

/* 6 · orbit
   A core with rings around it, seen almost edge on. Four bands, each tilted a
   little differently, plus the dust between them. */
const orbit: Writer = (out, base, n, rnd) => {
  const bands = [
    { r: 7.4, tilt: 0.1, share: 0.2 },
    { r: 11.2, tilt: -0.06, share: 0.24 },
    { r: 15.4, tilt: 0.16, share: 0.24 },
    { r: 20.2, tilt: -0.13, share: 0.2 },
  ];
  const coreShare = 0.12;
  const coreCount = Math.floor(n * coreShare);

  let i = 0;
  for (; i < coreCount; i++) {
    const r = Math.pow(rnd(), 2.1) * 3.2;
    const phi = Math.acos(1 - 2 * rnd());
    const theta = rnd() * TAU;
    out[base + i * 3] = r * Math.sin(phi) * Math.cos(theta);
    out[base + i * 3 + 1] = r * Math.cos(phi);
    out[base + i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }

  const rest = n - coreCount;
  let placed = 0;
  for (let b = 0; b < bands.length; b++) {
    const band = bands[b];
    const take = b === bands.length - 1 ? rest - placed : Math.floor(rest * band.share);
    for (let k = 0; k < take; k++, i++) {
      const a = rnd() * TAU;
      const r = band.r + (rnd() - 0.5) * 1.5;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = (rnd() - 0.5) * 0.5;

      // Flatten hard on Y, then tilt the whole band.
      const ty = y * 0.6 + z * band.tilt;
      out[base + i * 3] = x;
      out[base + i * 3 + 1] = ty - 0.4;
      out[base + i * 3 + 2] = z * 0.62;
    }
    placed += take;
  }
  // Any remainder from rounding lands in the core rather than at the origin.
  for (; i < n; i++) {
    out[base + i * 3] = (rnd() - 0.5) * 2;
    out[base + i * 3 + 1] = (rnd() - 0.5) * 2;
    out[base + i * 3 + 2] = (rnd() - 0.5) * 2;
  }
};

const WRITERS: Record<StageId, Writer> = {
  sphere,
  column,
  helix,
  terrain,
  vortex,
  nebula,
  orbit,
};

/**
 * Every stage, packed end to end: stage s occupies [s * n * 3, (s + 1) * n * 3).
 *
 * One allocation rather than seven, so swapping the morph endpoints is a single
 * typed-array copy out of a contiguous region instead of a scatter.
 */
export function buildStages(count: number): Float32Array {
  const out = new Float32Array(STAGE_COUNT * count * 3);
  STAGE_IDS.forEach((id, s) => {
    // Each stage gets its own stream, so changing one form cannot shift another.
    WRITERS[id](out, s * count * 3, count, mulberry32(0x5eed + s * 7919));
  });
  return out;
}

/** Per-particle constants: a random seed and a size multiplier. */
export function buildAttributes(count: number) {
  const rnd = mulberry32(0xc0ffee);
  const seed = new Float32Array(count);
  const scale = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    seed[i] = rnd();
    // Long tail: most points are small, a few carry the highlights.
    scale[i] = 0.55 + Math.pow(rnd(), 2.6) * 1.9;
  }
  return { seed, scale };
}

/** Camera and mood per stage. The camera moves very little; the field moves.
 *
 * Every z here is further back than the composition strictly needs. The field
 * is furniture: it should read as something happening in the room the page is
 * in, not as something the page is printed on. A form that fills the frame
 * competes with the writing in front of it, and the writing has to win. */
export const STAGE_CAMERA: {
  z: number;
  y: number;
  spin: number;
  spread: number;
  opacity: number;
}[] = [
  /* The field runs at full strength again.
   
     Dimming it was the wrong fix twice over: it did not make the writing any
     easier to read, and it took away the one thing on the page that is not
     text. What makes prose legible over a live field is the translucent panel
     it sits on, and that costs the field nothing — the panel blurs whatever is
     behind it into a smooth wash and the points stay bright everywhere else.
     Nebula stays lower because it is a drifting starfield by design. */
  { z: 37, y: 0, spin: 0.04, spread: 13, opacity: 1 },       // sphere
  { z: 30, y: 0, spin: 0.12, spread: 8, opacity: 1 },        // column
  { z: 34, y: 0, spin: 0.09, spread: 6, opacity: 1 },        // helix
  { z: 30, y: 3.4, spin: 0.014, spread: 30, opacity: 0.95 }, // terrain
  { z: 24, y: 19, spin: 0.075, spread: 18, opacity: 1 },     // vortex
  { z: 44, y: 0, spin: 0.03, spread: 24, opacity: 0.78 },    // nebula
  { z: 36, y: 4.2, spin: 0.05, spread: 20, opacity: 1 },     // orbit
];
