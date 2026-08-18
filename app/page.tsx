import { Hero } from '@/components/Hero';
import { About } from '@/components/About';
import { Work } from '@/components/Work';
import { Upstream } from '@/components/Upstream';
import { Connect } from '@/components/Connect';
import { Nav } from '@/components/Nav';
import { Reveals } from '@/components/Reveals';
import { SmoothScroll } from '@/components/SmoothScroll';
import { IndexBackground } from '@/components/index3d/IndexBackground';
import { Cursor } from '@/components/Cursor';
import { CommandPalette } from '@/components/CommandPalette';

export default function Page() {
  return (
    <>
      {/* Keyboard users get out of the persistent chrome in one press. */}
      <a
        href="#about"
        className="u-mono sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[70] focus-visible:rounded focus-visible:bg-[var(--panel-1)] focus-visible:px-4 focus-visible:py-2 focus-visible:text-[0.8rem]"
      >
        Skip to content
      </a>

      <SmoothScroll />
      <Reveals />
      <IndexBackground />
      <Nav />
      <Cursor />
      <CommandPalette />

      {/* Sits above the canvas. The canvas is decorative and never intercepts
          a pointer, so everything here stays clickable. */}
      <main id="main" className="relative z-10">
        {/* Prove first, explain second.
             The 23 merges into repositories with maintainers are the rarest and
             most checkable thing here, and they used to arrive as section four
             of six, after two thousand words. An argument lands harder once the
             evidence is already on the table. */}
        <Hero />
        <Upstream />
        <Work />
        <About />
        <Connect />
      </main>
    </>
  );
}
