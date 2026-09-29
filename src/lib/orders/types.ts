export type OrderStatus =
  | 'created'
  | 'checkout_open'
  | 'awaiting_confirmation'
  | 'paid'
  | 'fulfilled'
  | 'payment_failed'
  | 'expired'
  | 'manual_review';

export interface Order {
  id: string; // opaque, e.g. ord_<24 hex>
  sessionId: string; // browser-scoped bucket id
  courseId: string;
  productVersion: string;
  amountUsd: number; // snapshot at creation, server-side only
  status: OrderStatus;
  email?: string; // from webhook, never trusted from client
  paymentId?: string;
  paymentIds: string[]; // all attempts seen for this order
  merchantId?: string;
  chainId?: string;
  token?: string;
  amountCrypto?: number;
  destinationWallet?: string;
  senderWallet?: string;
  txHash?: string;
  isTest: boolean;
  createdAt: string;
  paidAt?: string;
  fulfilledAt?: string;
}

export interface Entitlement {
  id: string;
  orderId: string;
  courseId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  mediaPolicyVersion: string;
  revokedAt?: string;
}
