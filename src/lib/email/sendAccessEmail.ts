import 'server-only';
import nodemailer from 'nodemailer';
import { redis } from '@/lib/redis';
import { storefrontContent } from '@/lib/course-content';

interface SendAccessEmailParams {
  orderId: string;
  email: string;
  courseId: string;
  token?: string;
}

export async function sendAccessEmail({
  orderId,
  email,
  courseId,
  token: providedToken,
}: SendAccessEmailParams): Promise<void> {
  // 1. Replay protection: check if an email was already dispatched for this order
  const alreadySent = await redis.get<string>(`email:sent:${orderId}`);
  if (alreadySent) {
    return;
  }

  // 2. Resolve the issued entitlement token for this order
  let token = providedToken;
  if (!token) {
    token = (await redis.get<string>(`ent:token-by-order:${orderId}`)) ?? undefined;
  }
  if (!token) {
    throw new Error(`Cannot send access email: no entitlement token found for order ${orderId}`);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  // Construct direct course access URL with token
  const accessUrl = `${baseUrl}/access?token=${encodeURIComponent(token)}&courseId=${encodeURIComponent(courseId)}`;

  const gmailUser = process.env.EGGPLANT_METHOD_GMAIL_USER;
  const gmailPass = process.env.EGGPLANT_METHOD_GMAIL_APP_PASSWORD;

  // In local dev without SMTP credentials, log the access link safely and mark sent
  if (!gmailUser || !gmailPass) {
    console.info(`[email:dev] Simulated delivery for order ${orderId} to ${email}:`);
    console.info(`[email:dev] Access URL: ${accessUrl}`);
    await redis.set(`email:sent:${orderId}`, '1', { ex: 60 * 60 * 24 * 400 });
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  await transporter.sendMail({
    from: `"Chad Kermit" <${gmailUser}>`,
    to: email,
    subject: `Your Private Access: ${storefrontContent.course.title}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; color: #111; background-color: #f9f9f9; border-radius: 16px;">
        <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: #65a30d; margin: 0 0 12px 0;">Private Entitlement Confirmed</p>
          <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 16px 0; color: #000;">Your access is ready.</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin: 0 0 24px 0;">
            Your payment confirmed on-chain. Click below to enter the private student portal and stream your lesson.
          </p>
          <a href="${accessUrl}" style="display: inline-block; background-color: #8bcf22; color: #000; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-size: 15px;">
            Open Private Lesson
          </a>
          <p style="margin: 32px 0 0 0; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 16px;">
            Bookmark this email. This link remains valid for 365 days.
          </p>
        </div>
      </div>
    `,
  });

  await redis.set(`email:sent:${orderId}`, '1', { ex: 60 * 60 * 24 * 400 });
}
