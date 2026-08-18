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

export const metadata: Metadata = {
  metadataBase: new URL('https://aryanghai.dev'),
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
  openGraph: {
    title: 'Aryan Ghai · Backend & Systems Engineer',
    description: DESCRIPTION,
    type: 'profile',
    locale: 'en_IN',
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
