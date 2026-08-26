import { Hero } from '@/components/Hero';
import { Proof } from '@/components/Proof';
import { Work } from '@/components/Work';
import { About } from '@/components/About';
import { Toolkit } from '@/components/Toolkit';
import { Hope } from '@/components/Hope';
import { Connect } from '@/components/Connect';
import { Nav } from '@/components/Nav';
import { Reveals } from '@/components/Reveals';
import { SmoothScroll } from '@/components/SmoothScroll';
import { Cosmos } from '@/components/cosmos/Cosmos';
import { Cursor } from '@/components/Cursor';
import { CommandPalette } from '@/components/CommandPalette';
import { ScrollDepth } from '@/components/ui/ScrollDepth';
import { Spotlight } from '@/components/ui/Spotlight';

/**
 * The page.
 *
 * Section order is an argument. Prove first, explain second: the merges into
 * repositories with maintainers are the rarest and most checkable thing here,
 * and they used to arrive as section four of six, after two thousand words. An
 * argument lands harder once the evidence is already on the table.
 *
 * Every section carries data-stage. That attribute is the only coupling between
 * the writing and the field behind it: the particle system measures those
 * elements, turns scroll position into a fractional stage index, and morphs
 * between forms. Nothing in a section knows anything about WebGL.
 */
export default function Page() {
  return (
    <>
      {/* Keyboard users get out of the persistent chrome in one press. */}
      <a
        href="#proof"
        className="u-mono sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[70] focus-visible:rounded focus-visible:bg-[var(--panel-1)] focus-visible:px-4 focus-visible:py-2 focus-visible:text-[0.8rem]"
      >
        Skip to content
      </a>

      <SmoothScroll />
      <Reveals />
      <ScrollDepth />
      <Spotlight />
      <Cosmos />
      <Nav />
      <Cursor />
      <CommandPalette />

      {/* Sits above the canvas. The canvas is decorative and never intercepts a
          pointer, so everything here stays clickable. */}
      <main id="main" className="relative z-10">
        <Hero />
        <Proof />
        <Work />
        <About />
        <Toolkit />
        <Hope />
        <Connect />
      </main>
    </>
  );
}
