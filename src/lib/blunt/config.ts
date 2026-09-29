import 'server-only';
import { storefrontContent } from '@/lib/course-content';

export const PRODUCT = {
  courseId: storefrontContent.course.id,
  productVersion: '2026-01',
  priceUsd: storefrontContent.product.priceUsd,
} as const;

export const BLUNT = {
  apiBase: 'https://blunt.cash/functions/v1',
  widgetScript: 'https://blunt.cash/widget/blunt.js',
  publicKey: process.env.NEXT_PUBLIC_BLUNT_PUBLIC_KEY ?? '',
  secretKey: process.env.BLUNT_SECRET_API_KEY ?? '',
  merchantId: process.env.BLUNT_MERCHANT_ID ?? '',
  webhookSecret: process.env.BLUNT_WEBHOOK_SECRET ?? '',
  mode: process.env.BLUNT_MODE === 'live' ? 'live' : 'test',
  acceptedChains: (process.env.BLUNT_ACCEPTED_CHAINS ?? 'base,sol')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  expectedWallets: (() => {
    try {
      return JSON.parse(process.env.BLUNT_EXPECTED_DESTINATION_WALLETS_JSON ?? '{}');
    } catch {
      return {};
    }
  })() as Record<string, string>, // chainId -> lowercase address
} as const;

export function assertServerConfig() {
  const missing = [
    ['BLUNT_SECRET_API_KEY', BLUNT.secretKey],
    ['BLUNT_WEBHOOK_SECRET', BLUNT.webhookSecret],
    ['BLUNT_MERCHANT_ID', BLUNT.merchantId],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) throw new Error(`Missing config: ${missing.join(', ')}`);
}
