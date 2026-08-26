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

export function registerLenis(l: Lenis | null) {
  instance = l;
}

/**
 * Jump to a section.
 *
 * Clearance for the fixed navigation bar is expressed once, in CSS, as
 * scroll-padding-top on <html>. Both paths below honour that same number and
 * neither adds its own.
 *
 * That is not a stylistic preference, it is the bug this function used to have.
 * It passed Lenis an explicit `offset: -88` on the assumption that Lenis knows
 * nothing about scroll-padding. It does: since 1.3, scrollTo() with an element
 * computes
 *
 *     target = rect.top + animatedScroll - scrollMarginTop - scrollPaddingTop
 *
 * and only then adds `offset`. So the clearance was being applied twice, 90px
 * from the stylesheet and 88px from here, and every destination on the site
 * landed 178px low — a screenful of the previous section still showing under
 * the bar, which reads exactly like the navigation going to the wrong place.
 */
export function scrollToId(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  if (instance) {
    instance.scrollTo(target);
    return;
  }

  // No Lenis: either reduced motion, or the module never loaded. Both cases
  // want a plain native jump, and scroll-padding-top handles the clearance.
  target.scrollIntoView({ block: 'start' });
}
