/**
 * Scroll position expressed as a fractional station index.
 *
 * Sections carry data-cam; each becomes an anchor at its own centre. Scrolling
 * between section 2 and section 3 yields values from 2.0 to 3.0, so the camera
 * rig can simply lerp between two stations and never has to know anything about
 * pixels, section heights, or where the page ends.
 *
 * The pattern is lifted from how mengto.github.io/kage drives its camera, which
 * is the cleanest solution to this I have seen: measurement stays in one place
 * and every consumer downstream reads a single number.
 */

export type StationTable = {
  anchors: number[];
  count: number;
};

export function measureStations(selector = '[data-cam]'): StationTable {
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

  const anchors = els.map((el, i) => {
    if (i === 0) return 0;
    if (i === els.length - 1) return maxScroll;
    const centre = el.offsetTop + el.offsetHeight * 0.5 - window.innerHeight * 0.5;
    return Math.min(Math.max(centre, 0), maxScroll);
  });

  // Anchors must strictly increase or progressFor divides by zero.
  for (let i = 1; i < anchors.length; i++) {
    anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1);
  }

  return { anchors, count: els.length };
}

export function progressFor(y: number, { anchors }: StationTable): number {
  if (anchors.length === 0) return 0;
  if (y <= anchors[0]) return 0;
  for (let i = 0; i < anchors.length - 1; i++) {
    if (y <= anchors[i + 1]) {
      return i + (y - anchors[i]) / (anchors[i + 1] - anchors[i]);
    }
  }
  return anchors.length - 1;
}

/** Frame-rate independent exponential smoothing. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
