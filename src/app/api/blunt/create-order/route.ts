import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { PRODUCT, BLUNT } from '@/lib/blunt/config';
import { createOrder, findOpenOrderBySession } from '@/lib/orders/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  sessionId: z.string().min(8).max(64).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const sessionId = parsed.data.sessionId ?? randomUUID();

  // Resume rather than duplicate on double-tap / sheet re-open
  const resumed = await findOpenOrderBySession(sessionId);
  const order = resumed ?? (await createOrder(sessionId, PRODUCT.priceUsd));

  return NextResponse.json({
    orderId: order.id,
    sessionId,
    amountUsd: order.amountUsd, // server-derived, never client-sent
    courseId: order.courseId,
    publicKey: BLUNT.publicKey,
    chains: BLUNT.acceptedChains,
    mode: BLUNT.mode,
    resumed: Boolean(resumed),
  });
}
