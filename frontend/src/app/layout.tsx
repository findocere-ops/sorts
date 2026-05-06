import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { Providers } from '@/components/providers/PrivyProvider';
import { DisclaimerFooter } from '@/components/layout/DisclaimerFooter';
import { env } from '@/lib/env';

// Touch the validated env at module load so misconfiguration surfaces during
// the build / first request, not buried in a stack trace from a downstream caller.
void env;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'SORTS — Confidential Community Protocol',
    template: '%s · SORTS',
  },
  description:
    'Private subscription rails for paid communities on Solana. Hidden membership state, aggregate-only creator analytics, no public member graph.',
  applicationName: 'SORTS',
  icons: {
    icon: [
      { url: '/assets/sorts-logo-mark-trans.png', type: 'image/png' },
    ],
    apple: '/assets/sorts-app-icon.png',
  },
  openGraph: {
    title: 'SORTS — Confidential Community Protocol',
    description:
      'Confidential community monetization. Privacy is the architecture, not a UI toggle.',
    type: 'website',
    siteName: 'SORTS',
    images: ['/assets/sorts-app-tile.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SORTS — Confidential Community Protocol',
    description: 'Private subscription rails for paid communities on Solana devnet.',
    images: ['/assets/sorts-app-tile.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#05070A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <DisclaimerFooter />
        </Providers>
      </body>
    </html>
  );
}
