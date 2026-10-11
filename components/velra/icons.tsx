/**
 * The handful of icons /velra needs, drawn inline.
 *
 * No icon font and no package: sixteen-pixel strokes that take the colour of
 * the text beside them. All of them are decorative, so they are hidden from
 * assistive technology and the control they sit in carries the name.
 */

import type { ReactNode } from 'react';

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      className="vl-icon"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const IconExternal = () => (
  <Svg>
    <path d="M5 11 11 5M6 5h5v5" />
  </Svg>
);

export const IconArrowDown = () => (
  <Svg>
    <path d="M8 3v10M4 9l4 4 4-4" />
  </Svg>
);

export const IconPlay = () => (
  <Svg>
    <path d="M5 3.5v9l7-4.5z" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconPause = () => (
  <Svg>
    <path d="M5.5 3.5v9M10.5 3.5v9" strokeWidth="2" />
  </Svg>
);

export const IconRestart = () => (
  <Svg>
    <path d="M3 8a5 5 0 1 0 1.6-3.7M3 3v3h3" />
  </Svg>
);

export const IconPrev = () => (
  <Svg>
    <path d="M10 3 5 8l5 5" />
  </Svg>
);

export const IconNext = () => (
  <Svg>
    <path d="m6 3 5 5-5 5" />
  </Svg>
);

export const IconChevron = () => (
  <Svg>
    <path d="m3 6 5 5 5-5" />
  </Svg>
);

export const IconCopy = () => (
  <Svg>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
  </Svg>
);

export const IconCheck = () => (
  <Svg>
    <path d="m3 8.5 3.2 3.2L13 4.8" />
  </Svg>
);

export const IconInfo = () => (
  <Svg>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 7.2v4M8 4.8v.2" />
  </Svg>
);

export const IconMenu = () => (
  <Svg>
    <path d="M2.5 5h11M2.5 11h11" />
  </Svg>
);

export const IconClose = () => (
  <Svg>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Svg>
);

/** The mark: a V and the dot that follows it, the state that carries over. */
export function LogoMark() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <rect x="0.5" y="0.5" width="27" height="27" rx="7.5" fill="#121820" stroke="rgba(160,178,200,0.3)" />
      <path d="m7 8.5 5.2 11h1.2L18.6 8.5" fill="none" stroke="#e7ecf2" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="21.2" cy="18.6" r="1.7" fill="#73c991" />
    </svg>
  );
}
