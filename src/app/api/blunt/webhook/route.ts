import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { BLUNT, PRODUCT } from '@/lib/blunt/config';
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

const Payload = z.object({
  event: z.string(),
  payment_id: z.string(),
  merchant_id: z.string(),
  amount_usd: z.number(),
  amount_crypto: z.number().optional(),
  chain_id: z.string(),
  token: z.string().optional(),
  tx_hash: z.string().optional(),
  destination_wallet: z.string(),
  sender_wallet: z.string().optional(),
  confirmed_at: z.string().optional(),
  test: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
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
  // 1. Raw body FIRST — before any JSON parsing
  const raw = await req.text();

  // 2. Signature verification
  const sigHeader = req.headers.get('x-blunt-signature');
  const isDevBypass =
    process.env.NODE_ENV === 'development' &&
    !BLUNT.webhookSecret &&
    sigHeader === 'dev_test_signature';

  if (!isDevBypass && !verifySignature(raw, sigHeader, BLUNT.webhookSecret)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  // 3. Parse only after verification
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = Payload.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }
  const e = parsed.data;
  const isTest = e.test === true || req.headers.get('x-blunt-mode') === 'test';

  // 4. Mode isolation
  if (BLUNT.mode === 'live' && isTest) {
    return NextResponse.json({ ignored: 'test_event_in_live_mode' }, { status: 202 });
  }

  // 5. Only payment.confirmed triggers fulfillment
  if (e.event !== 'payment.confirmed') {
    return NextResponse.json({ received: true, ignored: e.event }, { status: 200 });
  }

  // 6. Merchant identity check
  if (BLUNT.merchantId && e.merchant_id !== BLUNT.merchantId) {
    return NextResponse.json({ error: 'merchant_mismatch' }, { status: 403 });
  }

  // 7. Dedupe — FIRST caller only (Atomic check)
  const first = await claimPaymentEvent(e.payment_id);
  if (!first) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  let orderId = String(e.metadata?.order_id ?? e.metadata?.orderId ?? '');
  const courseId = String(e.metadata?.course_id ?? e.metadata?.courseId ?? PRODUCT.courseId);
  const email = String(
    e.metadata?.email ??
    e.metadata?.customerEmail ??
    e.metadata?.customer_email ??
    e.sender_wallet ??
    ''
  ).trim();

  if (courseId !== PRODUCT.courseId) {
    await markEventDone(e.payment_id);
    return NextResponse.json({ error: 'unmappable_course', courseId }, { status: 422 });
  }

  let order: Awaited<ReturnType<typeof getOrder>> = null;
  if (orderId) {
    order = await getOrder(orderId);
  }

  // If orderId is absent (e.g. buyer paid via direct hosted link at pay.blunt.cash/buy/bigger-energy),
  // auto-synthesize an order record so the buyer receives their access entitlement without delay.
  if (!order) {
    if (!email) {
      await markEventDone(e.payment_id);
      return NextResponse.json({ error: 'unmappable_payment_no_email' }, { status: 422 });
    }
    order = await getOrCreateOrderByPayment(e.payment_id, e.amount_usd, email, courseId);
    orderId = order.id;
  }

  // 8. Settlement checks
  const expectedWallet = (BLUNT.expectedWallets[e.chain_id] ?? '').toLowerCase();
  const actualWallet = (e.destination_wallet ?? '').toLowerCase();
  const amountOk = Math.abs(e.amount_usd - order.amountUsd) < 0.05;
  const walletOk = expectedWallet ? expectedWallet === actualWallet : true;

  if (!amountOk || !walletOk) {
    await patchOrder(orderId, { status: 'manual_review' });
    await markEventDone(e.payment_id);
    return NextResponse.json(
      { error: 'amount_or_wallet_mismatch', amountOk, walletOk },
      { status: 409 },
    );
  }

  // 9. Mark order paid
  await patchOrder(orderId, {
    status: 'paid',
    email,
    paymentId: e.payment_id,
    paymentIds: [...new Set([...order.paymentIds, e.payment_id])],
    merchantId: e.merchant_id,
    chainId: e.chain_id,
    token: e.token,
    amountCrypto: e.amount_crypto,
    destinationWallet: e.destination_wallet,
    senderWallet: e.sender_wallet,
    txHash: e.tx_hash,
    isTest,
    paidAt: e.confirmed_at ?? new Date().toISOString(),
  });

  // 10. Entitlement issuance — idempotent
  const { created, token } = await issueEntitlement({ orderId, courseId, email });

  // 11. Dispatch Email
  try {
    await sendAccessEmail({ orderId, email, courseId, token });
    await patchOrder(orderId, {
      status: 'fulfilled',
      fulfilledAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[blunt] email dispatch failed', { orderId, err });
    return NextResponse.json({ received: true, emailQueued: false }, { status: 500 });
  }

  await markEventDone(e.payment_id);
  return NextResponse.json({ received: true, newlyIssued: created }, { status: 200 });
}
