import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface PaymegateCreateOrderParams {
  orderId: string;
  email?: string;
  fullName?: string;
  amount?: number;
  currency?: string;
  backUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymegateOrderResponse {
  success: boolean;
  orderUUID: string;
  checkoutUrl: string;
  externalId?: string;
}

export interface PaymegateWebhookPayload {
  id: string;
  type: string;
  createdAt: string;
  orderUUID: string;
  transactionUUID?: string;
  transactionRef?: string;
  status: 'PAID' | 'UNPAID' | 'EXPIRED' | string;
  amount: string;
  currency: string;
  receivedAmount?: string;
  receivedCurrency?: string;
  customerEmail?: string;
  externalId?: string;
  metadata?: {
    orderId?: string;
    courseId?: string;
    cartId?: string;
    workspaceId?: string;
  };
  paidAt?: string;
}

/**
 * Creates an order on Paymegate via their Merchant API (POST /v1/orders).
 * Returns the checkoutUrl to redirect the customer to.
 */
export async function createPaymegateOrder(
  params: PaymegateCreateOrderParams
): Promise<PaymegateOrderResponse> {
  const apiKey = process.env.PAYMEGATE_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('PAYMEGATE_API_KEY is not configured.');
  }

  const amountStr = (params.amount ?? 22.3).toFixed(2);
  const currency = params.currency ?? 'USD';

  const body = {
    externalId: params.orderId,
    amount: amountStr,
    currency,
    paymentMethodsKeys: ['*'],
    backUrl: params.backUrl ?? `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/access?orderId=${params.orderId}`,
    customer: {
      email: params.email || 'customer@biggerenergy.com',
      fullName: params.fullName || 'Bigger Energy Customer',
    },
    metadata: {
      orderId: params.orderId,
      courseId: 'eggplant-method-v1',
      ...(params.metadata || {}),
    },
  };

  const res = await fetch('https://api.paymegate.com/v1/orders', {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Paymegate API responded with ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const checkoutUrl = data?.data?.checkoutUrl || data?.checkoutUrl;
  const orderUUID = data?.data?.orderUUID || data?.orderUUID;

  if (!checkoutUrl) {
    throw new Error('Paymegate API did not return a checkoutUrl.');
  }

  return {
    success: true,
    orderUUID,
    checkoutUrl,
    externalId: data?.data?.externalId || params.orderId,
  };
}

/**
 * Verifies Paymegate webhook signature.
 * Header: X-Paymegate-Signature — raw unpadded Base64URL HMAC-SHA256 over timestamp + "." + raw body.
 */
export function verifyPaymegateSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !timestamp || !secret) {
    return false;
  }

  // Reject events older than 5 minutes (300 seconds) to prevent replay attacks
  const tsNumber = Number(timestamp);
  if (!isNaN(tsNumber)) {
    const nowMs = Date.now();
    // Support both second and millisecond timestamps
    const tsMs = tsNumber > 1e11 ? tsNumber : tsNumber * 1000;
    const diffMs = Math.abs(nowMs - tsMs);
    if (diffMs > 5 * 60 * 1000) {
      console.warn(`[paymegate] Webhook timestamp outside 5-minute tolerance: diff=${diffMs}ms`);
      return false;
    }
  }

  const payloadToSign = `${timestamp}.${rawBody}`;
  const hmac = createHmac('sha256', secret);
  hmac.update(payloadToSign);
  const expectedSignature = hmac.digest('base64url');

  try {
    const a = Buffer.from(signature, 'utf8');
    const b = Buffer.from(expectedSignature, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
