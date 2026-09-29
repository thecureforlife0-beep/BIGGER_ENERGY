import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { PwaRegistrar } from '@/components/PwaRegistrar';

export const metadata: Metadata = {
  title: 'Chad Kermit — The Method',
  description: 'A direct, private lesson by Chad Kermit.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'The Method',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
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
