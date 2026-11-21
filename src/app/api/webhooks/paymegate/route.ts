import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPaymegateSignature,
  type PaymegateWebhookPayload,
} from '@/lib/payments/paymegate';
import {
  claimPaymentEvent,
  markEventDone,
  getOrder,
  patchOrder,
  getOrCreateOrderByPayment,
} from '@/lib/orders/store';
import { issueEntitlement } from '@/lib/entitlements/store';
import { sendAccessEmail } from '@/lib/email/sendAccessEmail';
import { storefrontContent } from '@/lib/course-content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. Read raw body for HMAC verification
  const rawBody = await req.text();

  const signature = req.headers.get('x-paymegate-signature');
  const timestamp = req.headers.get('x-paymegate-timestamp');
  const eventId = req.headers.get('x-paymegate-event-id');
  const eventType = req.headers.get('x-paymegate-event');
  const secret = process.env.PAYMEGATE_WEBHOOK_SECRET;

  // 2. Signature verification if secret is configured
  if (secret) {
    const isValid = verifyPaymegateSignature(rawBody, timestamp, signature, secret);
    if (!isValid) {
      console.warn('[paymegate] Invalid webhook signature or timestamp drift');
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
    }
  }

  // 3. Parse JSON payload
  let payload: PaymegateWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // 4. Verify event type and status
  const type = payload.type || eventType;
  if (type !== 'order.paid' || payload.status !== 'PAID') {
    return NextResponse.json(
      { received: true, ignored: type, status: payload.status },
      { status: 200 }
    );
  }

  const paymentKey = payload.orderUUID || payload.transactionUUID || eventId || payload.id;
  if (!paymentKey) {
    return NextResponse.json({ error: 'missing_payment_key' }, { status: 400 });
  }

  // 5. Deduplication check — process event once
  const isFirstClaim = await claimPaymentEvent(`pmg_${paymentKey}`);
  if (!isFirstClaim) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  const orderIdFromMeta = payload.metadata?.orderId || payload.externalId;
  const courseId = payload.metadata?.courseId || storefrontContent.course.id;
  const email = (payload.customerEmail || '').trim();
  const amountUsd = parseFloat(payload.amount || `${storefrontContent.product.priceUsd}`);

  let order = orderIdFromMeta ? await getOrder(orderIdFromMeta) : null;

  if (!order) {
    if (!email) {
      await markEventDone(`pmg_${paymentKey}`);
      return NextResponse.json(
        { error: 'unmappable_payment_no_email' },
        { status: 422 }
      );
    }
    order = await getOrCreateOrderByPayment(
      paymentKey,
      isNaN(amountUsd) ? storefrontContent.product.priceUsd : amountUsd,
      email,
      courseId
    );
  }

  const activeOrderId = order.id;

  // 6. Update order record
  await patchOrder(activeOrderId, {
    status: 'paid',
    email,
    paymentId: paymentKey,
    paymentIds: [...new Set([...order.paymentIds, paymentKey])],
    amountCrypto: payload.receivedAmount ? parseFloat(payload.receivedAmount) : undefined,
    txHash: payload.transactionRef,
    paidAt: payload.paidAt || payload.createdAt || new Date().toISOString(),
  });

  // 7. Issue entitlement token
  const { created, token } = await issueEntitlement({
    orderId: activeOrderId,
    courseId,
    email,
  });

  // 8. Send delivery email via Resend
  try {
    await sendAccessEmail({
      orderId: activeOrderId,
      email,
      courseId,
      token,
    });
    await patchOrder(activeOrderId, {
      status: 'fulfilled',
      fulfilledAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[paymegate] Access email delivery failed:', err);
  }

  await markEventDone(`pmg_${paymentKey}`);

  return NextResponse.json(
    {
      received: true,
      newlyIssued: created,
      orderId: activeOrderId,
    },
    { status: 200 }
  );
}
