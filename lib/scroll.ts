/**
 * One place that knows how to move the page.
 *
 * Smooth scrolling runs on Lenis, which drives window.scrollTo itself on every
 * frame. Anything that also tries to scroll natively, including a plain
 * element.scrollIntoView({ behavior: 'smooth' }), ends up fighting it for the
 * same pixels and the page stutters or lands in the wrong place. So every
 * in-page jump on the site goes through here, and here hands it to Lenis when
 * Lenis is running and to the browser when it is not.
 */

import type Lenis from 'lenis';

let instance: Lenis | null = null;

/** Clears the fixed navigation bar so a section never lands under it. */
const NAV_CLEARANCE = 88;

export function registerLenis(l: Lenis | null) {
  instance = l;
}

export function scrollToId(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  if (instance) {
    instance.scrollTo(target, { offset: -NAV_CLEARANCE });
    return;
  }

  // No Lenis: either reduced motion, or the module never loaded. Both cases
  // want a plain native jump, and scroll-padding-top on <html> handles the
  // clearance for us.
  target.scrollIntoView({ block: 'start' });
}
