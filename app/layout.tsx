import type { Metadata, Viewport } from 'next';
import { Inter_Tight, JetBrains_Mono } from 'next/font/google';
import './globals.css';

/**
 * Two families, and the split is the obvious one for a site about writing code.
 *
 * JetBrains Mono is the voice of the site. It sets every heading, the opening
 * statement, the navigation, every index, count, date, repository path, label
 * and button. It was drawn for reading code for eight hours at a stretch, which
 * means it is unusually legible at small sizes and has enough character at large
 * ones to carry a headline — and a headline set in the same face as the terminal
 * output below it says what this site is before a word of it is read.
 *
 * Inter Tight sets paragraphs and nothing else. Monospace is the wrong tool for
 * a hundred-word paragraph: every letter claims the same width, so the word
 * shapes a reader scans by stop existing. Prose stays in a proportional face so
 * the writing is genuinely easy to read, which is the whole point.
 *
 * Both are self-hosted by next/font and make no request to Google at runtime.
 */
const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--ff-sans',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--ff-mono',
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
  themeColor: '#070912',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${jetbrains.variable}`}
    >
      <body className="grain">{children}</body>
    </html>
  );
}
