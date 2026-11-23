import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { PwaRegistrar } from '@/components/PwaRegistrar';

export const metadata: Metadata = {
  metadataBase: new URL(
    (process.env.NEXT_PUBLIC_BASE_URL || 'https://biggerenergy.vercel.app').trim().replace(/\/+$/, ''),
  ),
  title: 'Chad Kermit — The Method',
  description: 'BIGGER ENERGY — A private digital video experience from the Chad Kermit universe.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'The Method',
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=2', sizes: 'any' },
      { url: '/icons/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png?v=2', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png?v=2', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=2',
    apple: '/icons/apple-touch-icon.png?v=2',
  },
  openGraph: {
    title: 'Chad Kermit — The Method',
    description: 'Private digital video experience. Watch the free preview and unlock instant access.',
    images: [{ url: '/images/hero-4.png', width: 1200, height: 630, alt: 'Chad Kermit — Bigger Energy' }],
    type: 'website',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <Header />
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
