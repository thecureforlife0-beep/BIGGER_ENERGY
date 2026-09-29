import { NextRequest, NextResponse } from 'next/server';
import { storefrontContent } from '@/lib/course-content';
import { verifyTokenOnServer } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COURSE_ID = storefrontContent.course.id;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? '';
  const courseId = request.nextUrl.searchParams.get('courseId') ?? COURSE_ID;

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
