import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '@/lib/orders/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // Minimal projection — never leak wallets, tx hash, or internal metadata
  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    fulfilled: order.status === 'fulfilled',
  });
}
