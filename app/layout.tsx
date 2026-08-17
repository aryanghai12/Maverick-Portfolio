import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Instrument_Sans, Instrument_Serif } from 'next/font/google';
import './globals.css';

/* Machine voice. Also carries the hero name at display size. */
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-jetbrains',
  display: 'swap',
});

/* Human voice. */
const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-instrument-sans',
  display: 'swap',
});

/* Used exactly once, on the thesis line. */
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

const DESCRIPTION =
  'Backend and systems engineer. I build systems that verify other systems — ' +
  'execution-grounded code review, client-side document verification, and ' +
  'merged contributions to CNCF and OWASP projects.';

export const metadata: Metadata = {
  metadataBase: new URL('https://aryanghai.dev'),
  title: 'Aryan Ghai — Backend & Systems Engineer',
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
    title: 'Aryan Ghai — Backend & Systems Engineer',
    description: DESCRIPTION,
    type: 'profile',
    locale: 'en_IN',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#06080a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jetbrains.variable} ${instrumentSans.variable} ${instrumentSerif.variable}`}
    >
      <body className="grain">{children}</body>
    </html>
  );
}
