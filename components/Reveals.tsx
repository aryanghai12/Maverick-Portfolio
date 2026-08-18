'use client';

import { useEffect } from 'react';

/**
 * Wires every [data-rv] element to a single IntersectionObserver and adds the
 * .rv-in class when it arrives. Elements are staggered by their position within
 * their own parent, so a group of siblings cascades without anyone hand-writing
 * a delay for each one.
 *
 * Nothing here creates content. The elements and their text are already in the
 * HTML. This only changes whether they are visible, which is what keeps the
 * page intact for crawlers, for screen readers, and with JS disabled.
 */
export function Reveals() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-rv], .kinetic'));

    if (reduce) {
      items.forEach((el) => el.classList.add('rv-in'));
      return;
    }

    // Stagger siblings. An element with an author-set transitionDelay keeps it.
    const groups = new Map<Element | null, HTMLElement[]>();
    for (const el of items) {
      const key = el.parentElement;
      const arr = groups.get(key) ?? [];
      arr.push(el);
      groups.set(key, arr);
    }
    for (const arr of groups.values()) {
      arr.forEach((el, i) => {
        if (!el.dataset.rvd && !el.style.transitionDelay) {
          el.dataset.rvd = String(i * 70);
        }
      });
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          const el = e.target as HTMLElement;
          const d = Number(el.dataset.rvd ?? 0);
          if (d) timers.push(setTimeout(() => el.classList.add('rv-in'), d));
          else el.classList.add('rv-in');
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );

    // The hero is above the fold; revealing it on intersection would make it
    // race the first paint. It resolves on its own schedule instead.
    const hero = document.getElementById('hero');
    for (const el of items) {
      if (hero?.contains(el)) {
        timers.push(setTimeout(() => el.classList.add('rv-in'), 180));
      } else {
        io.observe(el);
      }
    }

    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return null;
}
