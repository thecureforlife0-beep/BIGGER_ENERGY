export type PaymentProviderId = 'blunt' | 'provider_b';

export type ActiveProviderMode = 'blunt' | 'provider_b' | 'both';

export interface PaymentProviderOption {
  id: PaymentProviderId;
  name: string;
  badge: string;
  chains: string;
  checkoutUrl?: string;
  isPrimary: boolean;
}

export interface PaymentConfig {
  activeMode: ActiveProviderMode;
  productPriceUsd: number;
  productCurrency: string;
  blunt: {
    enabled: boolean;
    merchantId: string;
    publicKey: string;
    mode: 'live' | 'test';
    paymentUrl: string;
    acceptedChains: string[];
  };
  providerB: {
    enabled: boolean;
    name: string;
    badge: string;
    chains: string;
    publicKey: string;
    paymentUrl: string;
    mode: 'live' | 'test';
  };
}
