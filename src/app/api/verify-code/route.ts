
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifyTokenOnServer } from '@/lib/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RequestSchema = z.object({
  token: z.string().min(1).max(512),
  courseId: z.string().min(1).max(128),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { isValid: false, error: 'Token and course ID are required.' },
      { status: 400 },
    );
  }

  const result = await verifyTokenOnServer(parsed.data.token, parsed.data.courseId);
  if (!result.isValid) {
    const message = result.error ?? 'Unable to verify access.';
    const status = message.includes('temporarily unavailable')
      ? 503
      : message.includes('not valid for this course')
        ? 403
        : 404;
    return NextResponse.json({ isValid: false, error: message }, { status });
  }

  const response = NextResponse.json({ isValid: true, fulfillmentId: parsed.data.courseId });
  response.cookies.set('eggplant_access', parsed.data.token, {
    httpOnly: true,
    secure: req.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

export async function GET(req: NextRequest) {
  const courseId = req.nextUrl.searchParams.get('courseId') ?? '';
  const token = (await cookies()).get('eggplant_access')?.value ?? '';
  const result = await verifyTokenOnServer(token, courseId);
  if (!result.isValid) {
    const message = result.error ?? 'Unable to verify access.';
    const status = message.includes('temporarily unavailable')
      ? 503
      : message.includes('not valid for this course')
        ? 403
        : 404;
    return NextResponse.json({ isValid: false, error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.json({ isValid: true, fulfillmentId: courseId }, { headers: { 'Cache-Control': 'no-store' } });
}
