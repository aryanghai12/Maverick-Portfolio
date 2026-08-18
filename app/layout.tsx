import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

/**
 * Two families, one superfamily, a clear division of labour between them.
 *
 * Geist for anything a person wrote and a person reads. Geist Mono for
 * anything a machine produced: counts, timestamps, repository paths, tags,
 * terminal output. Both are variable, so weight is a continuous control rather
 * than four separate downloads, and both ship self-hosted with no request to
 * Google at runtime.
 *
 * The previous build set every heading in monospace at display size. That is
 * the wrong tool: monospace exists to make every glyph the same width so code
 * lines up, and the same property turns a headline into a row of letters with
 * gaps between them.
 */
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const DESCRIPTION =
  'Backend and systems engineer. I build tools that prove their own claims: ' +
  'code review that runs the bug before it reports it, a resume parser that ' +
  'has to quote its source, and pull requests merged into CNCF and OWASP ' +
  'repositories I do not own.';

/* The origin every canonical and Open Graph URL resolves against.
 *
 * Overridable, because getting this wrong is silent: a relative og:image
 * resolves against the wrong host and every share renders a broken preview
 * with no error anywhere. Set NEXT_PUBLIC_SITE_URL in the deploy environment if
 * the site does not live at the default. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aryanghai.in';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Aryan Ghai · Backend & Systems Engineer',
  description: DESCRIPTION,
  authors: [{ name: 'Aryan Ghai', url: 'https://github.com/aryanghai12' }],
  keywords: [
    'Aryan Ghai',
    'backend engineer',
    'systems engineer',
    'Go',
    'Python',
    'Kubernetes',
    'Kubescape',
    'OWASP',
    'open source',
  ],
  alternates: { canonical: '/' },
  /* Without these, every paste of this link into LinkedIn, a Discord or a
     recruiter's inbox rendered as a grey text stub. The card is generated from
     data/stats.json by scripts/make-og.ts, so the figures on it are the same
     measured figures the page shows. */
  openGraph: {
    title: 'Aryan Ghai · Backend & Systems Engineer',
    description: DESCRIPTION,
    url: '/',
    siteName: 'Aryan Ghai',
    type: 'profile',
    locale: 'en_IN',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Aryan Ghai, backend and systems engineer. I build software that proves it is right before it says it is.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aryan Ghai · Backend & Systems Engineer',
    description: DESCRIPTION,
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0e0e11',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="grain">{children}</body>
    </html>
  );
}
