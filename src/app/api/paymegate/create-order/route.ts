import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { storefrontContent } from '@/lib/course-content';
import { createOrder, findOpenOrderBySession } from '@/lib/orders/store';
import { createPaymegateOrder } from '@/lib/payments/paymegate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  sessionId: z.string().min(8).max(64).optional(),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const sessionId = parsed.data.sessionId ?? randomUUID();
  const resumed = await findOpenOrderBySession(sessionId);
  const order = resumed ?? (await createOrder(sessionId, storefrontContent.product.priceUsd));

  try {
    const paymegateRes = await createPaymegateOrder({
      orderId: order.id,
      email: parsed.data.email,
      amount: order.amountUsd,
      currency: storefrontContent.product.currency,
      backUrl: `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/access?orderId=${order.id}`,
      metadata: {
        orderId: order.id,
        courseId: storefrontContent.course.id,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      sessionId,
      amountUsd: order.amountUsd,
      checkoutUrl: paymegateRes.checkoutUrl,
      orderUUID: paymegateRes.orderUUID,
      resumed: Boolean(resumed),
    });
  } catch (err) {
    console.error('[paymegate] Failed to initialize checkout:', err);
    return NextResponse.json(
      { error: 'Paymegate checkout is temporarily unavailable. Please try Blunt.cash or retry.' },
      { status: 502 },
    );
  }
}
