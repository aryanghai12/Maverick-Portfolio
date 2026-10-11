import type { Metadata, Viewport } from 'next';
import { Cosmos } from '@/components/cosmos/Cosmos';
import { Reveal } from '@/components/velra/Reveal';
import {
  Cta,
  Footer,
  Hero,
  How,
  Properties,
  ReplaySection,
  Trust,
  Why,
} from '@/components/velra/Sections';
import { VelraNav } from '@/components/velra/VelraNav';
import './velra.css';

/**
 * /velra
 *
 * The product page for Velra, served from the same static export as the
 * portfolio. It is an ordinary nested route: `next build` writes out/velra.html
 * and `cleanUrls` in vercel.json serves it at /velra, with no rewrite and no
 * second project.
 *
 * It shares one thing with the homepage on purpose: the particle field. The
 * portfolio's <Cosmos /> is mounted here unchanged. That component knows
 * nothing about pages. It reads the elements that carry data-stage, in order,
 * and morphs between forms as they scroll past, so giving this route's sections
 * the attribute is all it takes for /velra to sit in the same space as the
 * site it belongs to. It also looks for #hero to know when to open its scrim.
 *
 * The rest of the homepage's machinery (the smooth scroller, the custom cursor,
 * the command palette, the portfolio navigation) lives in app/page.tsx and is
 * not mounted. This route's own styles are scoped under .velra.
 *
 * Section order follows the argument: say what it is, show it working on real
 * output, explain why the state matters, then how it is produced, then exactly
 * what is and is not promised.
 */

const TITLE = 'Velra · Session continuity for Claude Code';
const DESCRIPTION =
  'Velra carries the engineering state that gets lost between coding sessions: the objective, ' +
  'constraints, test status, edits, reversions and what to do next. Local-first, deterministic, ' +
  'and bounded. An interactive replay of real commands and output.';

/* Merging with the root layout's metadata is shallow, so openGraph and twitter
   are restated in full here. Leaving the image out would drop it rather than
   inherit it. metadataBase still comes from the root layout. */
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'Velra',
    'Claude Code',
    'coding agent',
    'session continuity',
    'context handoff',
    'developer tools',
    'Aryan Ghai',
  ],
  alternates: { canonical: '/velra' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/velra',
    siteName: 'Aryan Ghai',
    type: 'website',
    locale: 'en_IN',
    images: [
      {
        url: '/velra-og.png',
        width: 1200,
        height: 630,
        alt: 'Velra. The work should survive the session. Session continuity for Claude Code.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/velra-og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#070912',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function VelraPage() {
  return (
    <div id="top" className="velra">
      <a className="vl-skip" href="#replay">
        Skip to the replay
      </a>

      {/* Decorative, fixed behind everything, and never intercepts a pointer. */}
      <Cosmos />

      <VelraNav />

      <main>
        <Hero />
        <Properties />
        <ReplaySection />
        <Why />
        <How />
        <Trust />
        <Cta />
      </main>

      <Footer />
      <Reveal />
    </div>
  );
}
