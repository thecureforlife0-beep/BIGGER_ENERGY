import { NextRequest, NextResponse } from 'next/server';
import { storefrontContent } from '@/lib/course-content';
import { verifyTokenOnServer } from '@/lib/server-auth';
import { getOrder } from '@/lib/orders/store';
import { lookupTokenByOrderId } from '@/lib/entitlements/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COURSE_ID = storefrontContent.course.id;

export async function GET(request: NextRequest) {
  let token = request.nextUrl.searchParams.get('token') ?? '';
  const orderId = (request.nextUrl.searchParams.get('orderId') ?? '').trim();
  const courseId = request.nextUrl.searchParams.get('courseId') ?? COURSE_ID;

  // Support Paymegate post-checkout backUrl (/access?orderId=<ord_...>)
  if (!token && orderId) {
    try {
      const order = await getOrder(orderId);
      if (order && (order.status === 'paid' || order.status === 'fulfilled')) {
        const issuedToken = await lookupTokenByOrderId(order.id);
        if (issuedToken) {
          token = issuedToken;
        }
      }
    } catch (err) {
      console.error('[access] Order lookup failed:', err);
    }

    // If buyer clicked "Return to Bigger Energy" before paying or before webhook arrival,
    // send them cleanly to the homepage instead of showing a false "Access Denied" error.
    if (!token) {
      const homeUrl = new URL('/', request.url);
      const response = NextResponse.redirect(homeUrl, 303);
      response.headers.set('Cache-Control', 'no-store');
      response.headers.set('Referrer-Policy', 'no-referrer');
      return response;
    }
  }

  if (!token || courseId !== COURSE_ID) {
    const errorUrl = new URL('/', request.url);
    errorUrl.searchParams.set('access', 'invalid');
    const response = NextResponse.redirect(errorUrl, 303);
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }

  const result = await verifyTokenOnServer(token, courseId);
  if (!result.isValid) {
    const errorUrl = new URL('/', request.url);
    errorUrl.searchParams.set(
      'access',
      result.error?.includes('temporarily unavailable') ? 'unavailable' : 'invalid',
    );
    const response = NextResponse.redirect(errorUrl, 303);
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }

  const destination = new URL(`/my-course/${COURSE_ID}`, request.url);
  const response = NextResponse.redirect(destination, 303);
  response.cookies.set('eggplant_access', token, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
