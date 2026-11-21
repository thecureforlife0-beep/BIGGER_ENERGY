import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { PRODUCT } from '@/lib/blunt/config';
import {
  claimPaymentEvent,
  markEventDone,
  getOrder,
  patchOrder,
  getOrCreateOrderByPayment,
} from '@/lib/orders/store';
import { issueEntitlement } from '@/lib/entitlements/store';
import { sendAccessEmail } from '@/lib/email/sendAccessEmail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GenericPaymentPayload = z.object({
  payment_id: z.string().optional(),
  id: z.string().optional(),
  amount_usd: z.number().optional(),
  amount: z.number().optional(),
  email: z.string().email().optional(),
  customer_email: z.string().email().optional(),
  order_id: z.string().optional(),
  tx_hash: z.string().optional(),
  status: z.string().optional(),
  event: z.string().optional(),
});

function verifySignature(raw: string, header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  try {
    const expected = createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(header.trim(), 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.PROVIDER_B_WEBHOOK_SECRET ?? '';

  // If secret is set, enforce HMAC signature
  if (secret) {
    const sigHeader =
      req.headers.get('x-provider-signature') ??
      req.headers.get('x-webhook-signature') ??
      req.headers.get('signature');
    if (!verifySignature(raw, sigHeader, secret)) {
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
    }
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = GenericPaymentPayload.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const data = parsed.data;
  const paymentId = data.payment_id ?? data.id;
  if (!paymentId) {
    return NextResponse.json({ error: 'missing_payment_id' }, { status: 400 });
  }

  // Dedupe check
  const first = await claimPaymentEvent(paymentId);
  if (!first) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  const email = (data.email ?? data.customer_email ?? '').trim();
  const amountUsd = data.amount_usd ?? data.amount ?? PRODUCT.priceUsd;
  let orderId = data.order_id ?? '';

  let order = orderId ? await getOrder(orderId) : null;
  if (!order) {
    if (!email) {
      await markEventDone(paymentId);
      return NextResponse.json({ error: 'unmappable_payment_no_email' }, { status: 422 });
    }
    order = await getOrCreateOrderByPayment(paymentId, amountUsd, email, PRODUCT.courseId);
    orderId = order.id;
  }

  // Mark order paid
  await patchOrder(orderId, {
    status: 'paid',
    email,
    paymentId,
    amountUsd,
    txHash: data.tx_hash,
    paidAt: new Date().toISOString(),
  });

  // Issue entitlement
  const { created, token } = await issueEntitlement({
    orderId,
    courseId: PRODUCT.courseId,
    email,
  });

  // Dispatch access email
  try {
    await sendAccessEmail({ orderId, email, courseId: PRODUCT.courseId, token });
    await patchOrder(orderId, {
      status: 'fulfilled',
      fulfilledAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[provider_b] email dispatch failed', { orderId, err });
    return NextResponse.json({ received: true, emailQueued: false }, { status: 500 });
  }

  await markEventDone(paymentId);
  return NextResponse.json({ received: true, newlyIssued: created }, { status: 200 });
}
