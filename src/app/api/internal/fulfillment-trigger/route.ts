import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { redis } from '@/lib/redis';
import { storefrontContent } from '@/lib/course-content';
import { buildAccessEmailHtml, dispatchEmail } from '@/lib/email/sendAccessEmail';

const FulfillmentRequest = z.object({
  fulfillmentId: z.string().min(1).max(128).optional(),
  courseId: z.string().min(1).max(128).optional(),
  userEmail: z.string().email().max(254).optional(),
  customerEmail: z.string().email().max(254).optional(),
}).refine((data) => Boolean(data.fulfillmentId || data.courseId), { message: 'Course ID is required.' })
  .refine((data) => Boolean(data.userEmail || data.customerEmail), { message: 'Email is required.' });

export async function POST(request: NextRequest) {
  try {
    const internalSecret = process.env.INTERNAL_FULFILLMENT_SECRET || process.env.EGGPLANT_METHOD_INTERNAL_SECRET_KEY;
    const authHeader = request.headers.get('authorization');
    if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const candidate = body?.payload ?? body;
    const parsed = FulfillmentRequest.safeParse(candidate);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid course ID and customer email are required.' }, { status: 400 });
    }

    const data = parsed.data;
    const fulfillmentId = data.fulfillmentId || data.courseId!;
    const userEmail = data.userEmail || data.customerEmail!;

    if (fulfillmentId !== storefrontContent.course.id) {
      return NextResponse.json({ error: 'Unknown course.' }, { status: 400 });
    }

    // 1. Generate Unique Token
    const token = `${fulfillmentId}-${uuidv4()}`;

    // 2. Store entitlement in Redis (365 days TTL)
    await redis.set(`ent:by-token:${token}`, JSON.stringify({
      courseId: fulfillmentId,
      userEmail,
      createdAt: new Date().toISOString(),
    }), { ex: 31536000 });

    // Also store by token key for compatibility
    await redis.set(token, JSON.stringify({
      fulfillmentId,
      userEmail,
      createdAt: new Date().toISOString(),
    }), { ex: 31536000 });

    // 3. Construct Access URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const accessUrl = `${baseUrl}/access?courseId=${encodeURIComponent(fulfillmentId)}&token=${encodeURIComponent(token)}`;

    // 4. Send Email via configured transport (Gmail SMTP / Custom SMTP / Brevo / Resend)
    try {
      const result = await dispatchEmail({
        to: userEmail,
        subject: `Your Private Access: ${storefrontContent.course.title}`,
        html: buildAccessEmailHtml(
          accessUrl,
          'Your order has been verified. Click below to enter the private student portal and stream your lesson.',
        ),
      });
      if (result.provider === 'dev_log') {
        console.info(`[fulfillment:dev] Email transport not configured. Access URL: ${accessUrl}`);
      }
      return NextResponse.json({ success: true, accessUrl, emailProvider: result.provider });
    } catch (sendError) {
      console.error('[fulfillment] Email delivery failed', sendError);
      return NextResponse.json(
        { error: 'Failed to send access email', accessUrl },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('[fulfillment] request failed', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
