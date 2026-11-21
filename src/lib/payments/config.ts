import { storefrontContent } from '@/lib/course-content';
import type { PaymentConfig, PaymentProviderOption, ActiveProviderMode } from './types';

const rawMode = (
  process.env.NEXT_PUBLIC_ACTIVE_PAYMENT_PROVIDER ??
  (process.env.PAYMEGATE_CHECKOUT_URL || process.env.PAYMEGATE_API_KEY ? 'both' : 'blunt')
).toLowerCase();
const activeMode: ActiveProviderMode =
  rawMode === 'provider_b' || rawMode === 'both' ? rawMode : 'blunt';

const rawChains = process.env.NEXT_PUBLIC_BLUNT_ACCEPTED_CHAINS ?? 'base,sol';
const acceptedChains = rawChains.split(',').map((s) => s.trim()).filter(Boolean);

const providerBPaymentUrl =
  process.env.NEXT_PUBLIC_PROVIDER_B_PAYMENT_URL ||
  process.env.PAYMEGATE_CHECKOUT_URL ||
  'https://www.paymegate.com/checkout/884a31cd-6589-449e-90a8-da36aa5469ef';

const isPaymegate =
  (process.env.SECONDARY_PAYMENT_PROVIDER ?? '').toLowerCase() === 'paymegate' ||
  Boolean(process.env.PAYMEGATE_CHECKOUT_URL || process.env.PAYMEGATE_API_KEY);

export const paymentConfig: PaymentConfig = {
  activeMode,
  productPriceUsd: storefrontContent.product.priceUsd,
  productCurrency: 'USD',
  blunt: {
    enabled: activeMode === 'blunt' || activeMode === 'both',
    merchantId: process.env.NEXT_PUBLIC_BLUNT_MERCHANT_ID ?? 'ed70a7cd-999a-46ac-8b3e-3c48c1cdafe6',
    publicKey: process.env.NEXT_PUBLIC_BLUNT_PUBLIC_KEY ?? '',
    mode: process.env.NEXT_PUBLIC_BLUNT_MODE === 'live' ? 'live' : 'test',
    paymentUrl: storefrontContent.product.paymentUrl,
    acceptedChains,
  },
  providerB: {
    enabled: activeMode === 'provider_b' || activeMode === 'both',
    name:
      process.env.NEXT_PUBLIC_PROVIDER_B_NAME ??
      (isPaymegate ? 'Paymegate' : 'Alternative Checkout'),
    badge:
      process.env.NEXT_PUBLIC_PROVIDER_B_BADGE ??
      (isPaymegate ? 'Cards · Solana · BTC · EVM' : 'Direct Crypto / Card Rail'),
    chains:
      process.env.NEXT_PUBLIC_PROVIDER_B_CHAINS ??
      (isPaymegate ? 'Solana · Base · BTC · ETH' : 'Arbitrum · Base · Solana · ETH'),
    publicKey: process.env.NEXT_PUBLIC_PROVIDER_B_PUBLIC_KEY ?? '',
    paymentUrl: providerBPaymentUrl,
    mode: process.env.NEXT_PUBLIC_PROVIDER_B_MODE === 'live' ? 'live' : 'test',
  },
};

export function getAvailablePaymentProviders(): PaymentProviderOption[] {
  const options: PaymentProviderOption[] = [];

  if (paymentConfig.blunt.enabled) {
    options.push({
      id: 'blunt',
      name: 'Blunt.cash',
      badge: 'Direct Crypto Checkout',
      chains: 'Arbitrum · Base · Solana · ETH',
      checkoutUrl: paymentConfig.blunt.paymentUrl,
      isPrimary: activeMode !== 'provider_b',
    });
  }

  if (paymentConfig.providerB.enabled && paymentConfig.providerB.paymentUrl) {
    options.push({
      id: 'provider_b',
      name: paymentConfig.providerB.name,
      badge: paymentConfig.providerB.badge,
      chains: paymentConfig.providerB.chains,
      checkoutUrl: paymentConfig.providerB.paymentUrl,
      isPrimary: activeMode === 'provider_b',
    });
  }

  return options;
}
