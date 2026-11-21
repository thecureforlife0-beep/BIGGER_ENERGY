import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { storefrontContent } from '@/lib/course-content';
import { createOrder, patchOrder } from '@/lib/orders/store';
import { issueEntitlement } from '@/lib/entitlements/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function secretsMatch(provided: string, expected: string): boolean {
  try {
    const a = Buffer.from(provided.trim(), 'utf8');
    const b = Buffer.from(expected.trim(), 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Zero-webhook fulfillment return endpoint for Blunt.cash Free Tier ("After Payment -> Redirect to URL").
 * Validates the shared secret query param (`?k=...`), mints a unique 365-day Redis entitlement,
 * sets the HttpOnly access cookie, and 302-redirects straight into the private course player.
 */
export async function GET(req: NextRequest) {
  const configuredSecret = process.env.BLUNT_RETURN_SECRET?.trim();
  const providedKey = req.nextUrl.searchParams.get('k') ?? '';
  const paymentRef =
    req.nextUrl.searchParams.get('payment_id') ??
    req.nextUrl.searchParams.get('order_id') ??
    `blunt_return_${Date.now()}`;
  const buyerEmail = (req.nextUrl.searchParams.get('email') ?? 'blunt-buyer@biggerenergy.local').trim();

  if (!configuredSecret) {
    console.error('[blunt/return] BLUNT_RETURN_SECRET is not configured.');
    return NextResponse.redirect(new URL('/access?error=return_not_configured', req.url));
  }

  if (!providedKey || !secretsMatch(providedKey, configuredSecret)) {
    return NextResponse.redirect(new URL('/access?error=invalid_return_key', req.url));
  }

  try {
    const order = await createOrder(paymentRef, storefrontContent.product.priceUsd);
    await patchOrder(order.id, {
      status: 'fulfilled',
      email: buyerEmail,
      paymentId: paymentRef,
      paidAt: new Date().toISOString(),
      fulfilledAt: new Date().toISOString(),
    });

    const { token } = await issueEntitlement({
      orderId: order.id,
      courseId: storefrontContent.course.id,
      email: buyerEmail,
    });

    const destination = new URL(`/my-course/${storefrontContent.course.id}`, req.url);
    const res = NextResponse.redirect(destination, { status: 302 });

    res.cookies.set('eggplant_access', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });

    return res;
  } catch (err) {
    console.error('[blunt/return] Fulfillment error:', err);
    return NextResponse.redirect(new URL('/access?error=fulfillment_error', req.url));
  }
}
