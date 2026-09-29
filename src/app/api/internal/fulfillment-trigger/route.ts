import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getRedis } from '@/lib/redis';
import { storefrontContent } from '@/lib/course-content';

// Initialize Nodemailer Transporter (Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EGGPLANT_METHOD_GMAIL_USER,
    pass: process.env.EGGPLANT_METHOD_GMAIL_APP_PASSWORD,
  },
});

const FulfillmentRequest = z.object({
  fulfillmentId: z.string().min(1).max(128).optional(),
  courseId: z.string().min(1).max(128).optional(),
  userEmail: z.string().email().max(254).optional(),
  customerEmail: z.string().email().max(254).optional(),
}).refine((data) => Boolean(data.fulfillmentId || data.courseId), { message: 'Course ID is required.' })
  .refine((data) => Boolean(data.userEmail || data.customerEmail), { message: 'Email is required.' });

export async function POST(request: NextRequest) {
  try {
    const internalSecret = process.env.EGGPLANT_METHOD_INTERNAL_SECRET_KEY;
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

    // 3. Generate Unique Token
    const token = `${fulfillmentId}-${uuidv4()}`;

    // 4. Store in Redis (Durable Key - 365 days)
    // Key: token, Value: { fulfillmentId, userEmail, createdAt }
    await getRedis().set(token, JSON.stringify({
      fulfillmentId,
      userEmail,
      createdAt: new Date().toISOString(),
    }), { ex: 31536000 }); // 365 days in seconds

    // 5. Construct Access URL
    // Use Vercel URL in production, localhost in dev
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://eggplant-method.vercel.app';
    const accessUrl = `${baseUrl}/access?courseId=${encodeURIComponent(fulfillmentId)}&token=${encodeURIComponent(token)}`;

    // Do not log bearer URLs, tokens, or buyer email addresses.

    // 6. Send Email via Gmail SMTP
    try {
      await transporter.sendMail({
        from: '"Eggplant Method Team" <ian19leakey@gmail.com>',
        to: userEmail,
        subject: 'Your Access to The Eggplant Method',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Welcome to the Inner Sanctum.</h1>
            <p>You have successfully unlocked the method.</p>
            <p>Click the button below to access your secure video stream.</p>
            <a href="${accessUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">Access Now</a>
            <p style="margin-top: 24px; font-size: 12px; color: #666;">This link is valid for 365 days. Do not share it.</p>
          </div>
        `,
      });

      return NextResponse.json({ success: true });
    } catch (emailError) {
      console.error('[fulfillment] email delivery failed', emailError);
      return NextResponse.json({ error: 'Failed to send access email.' }, { status: 500 });
    }

  } catch (error) {
    console.error('[fulfillment] request failed', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
