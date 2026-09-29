import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyTokenOnServer } from '@/lib/server-auth';
import { getLessonMedia } from '@/lib/mux';
import { storefrontContent } from '@/lib/course-content';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('eggplant_access')?.value;
  const courseId = req.nextUrl.searchParams.get('courseId') ?? storefrontContent.course.id;

  if (!token) {
    return NextResponse.json({ error: 'unauthorized', message: 'No access session token found.' }, { status: 401 });
  }

  const verification = await verifyTokenOnServer(token, courseId);
  if (!verification.isValid) {
    return NextResponse.json({ error: 'forbidden', message: verification.error ?? 'Access denied.' }, { status: 403 });
  }

  const media = getLessonMedia();
  return NextResponse.json(media, {
    headers: {
      'Cache-Control': 'no-store, private',
    },
  });
}
