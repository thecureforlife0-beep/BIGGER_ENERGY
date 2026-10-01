import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { Resend } from 'resend';
import { redis } from '@/lib/redis';
import { storefrontContent } from '@/lib/course-content';

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

    // 4. Send Email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    if (resendKey) {
      const resend = new Resend(resendKey);
      const { error: sendError } = await resend.emails.send({
        from: `Chad Kermit <${fromAddress}>`,
        to: userEmail,
        subject: `Your Private Access: ${storefrontContent.course.title}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; color: #111; background-color: #f9f9f9; border-radius: 16px;">
            <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: #65a30d; margin: 0 0 12px 0;">Private Entitlement Confirmed</p>
              <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 16px 0; color: #000;">Your access is ready.</h1>
              <p style="font-size: 15px; line-height: 1.6; color: #555; margin: 0 0 24px 0;">
                Your order has been verified. Click below to enter the private student portal and stream your lesson.
              </p>
              <a href="${accessUrl}" style="display: inline-block; background-color: #8bcf22; color: #000; font-weight: 700; text-decoration: none; padding: 18px 40px; border-radius: 9999px; font-size: 15px;">
                Open Private Lesson
              </a>
              <p style="margin: 32px 0 0 0; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 16px;">
                Bookmark this email. This link remains valid for 365 days.
              </p>
            </div>
          </div>
        `,
      });

      if (sendError) {
        console.error('[fulfillment] Resend email delivery failed', sendError);
        return NextResponse.json({ error: 'Failed to send access email via Resend', accessUrl }, { status: 500 });
      }
    } else {
      console.info(`[fulfillment:dev] Resend key absent. Access URL: ${accessUrl}`);
    }

    return NextResponse.json({ success: true, accessUrl });
  } catch (error) {
    console.error('[fulfillment] request failed', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
