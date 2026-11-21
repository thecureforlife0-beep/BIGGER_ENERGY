import 'server-only';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { redis } from '@/lib/redis';
import { storefrontContent } from '@/lib/course-content';

interface SendAccessEmailParams {
  orderId: string;
  email: string;
  courseId: string;
  token?: string;
}

export interface DispatchEmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface DispatchEmailResult {
  provider: 'gmail_smtp' | 'custom_smtp' | 'brevo_api' | 'resend' | 'dev_log';
}

export function buildAccessEmailHtml(accessUrl: string, introText?: string): string {
  const intro =
    introText ||
    'Your transaction confirmed. Click below to enter the private student portal and stream your lesson.';

  return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; color: #111; background-color: #f9f9f9; border-radius: 16px;">
        <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <p style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: #65a30d; margin: 0 0 12px 0;">Private Entitlement Confirmed</p>
          <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 16px 0; color: #000;">Your access is ready.</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin: 0 0 24px 0;">
            ${intro}
          </p>
          <a href="${accessUrl}" style="display: inline-block; background-color: #8bcf22; color: #000; font-weight: 700; text-decoration: none; padding: 18px 40px; border-radius: 9999px; font-size: 15px;">
            Open Private Lesson
          </a>
          <p style="margin: 32px 0 0 0; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 16px;">
            Bookmark this email. This link remains valid for 365 days.
          </p>
        </div>
      </div>
    `;
}

/**
 * Multi-transport transactional email dispatcher.
 * Priority:
 * 1. Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD) — FREE, NO custom domain needed (500/day)
 * 2. Custom SMTP (SMTP_HOST + SMTP_USER + SMTP_PASS) — Works with Brevo SMTP, Zoho, etc.
 * 3. Brevo HTTP API (BREVO_API_KEY + BREVO_SENDER_EMAIL) — FREE, NO custom domain needed (300/day)
 * 4. Resend SDK (RESEND_API_KEY + RESEND_FROM_EMAIL) — Requires verified domain for external buyers
 * 5. Dev Console Fallback
 */
export async function dispatchEmail({
  to,
  subject,
  html,
}: DispatchEmailParams): Promise<DispatchEmailResult> {
  const senderName = process.env.EMAIL_FROM_NAME || 'Bigger Energy';

  // 1. Gmail SMTP via Nodemailer (Zero custom domain required!)
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
  if (gmailUser && gmailAppPassword) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    await transporter.sendMail({
      from: `${senderName} <${gmailUser}>`,
      to,
      subject,
      html,
    });

    return { provider: 'gmail_smtp' };
  }

  // 2. Generic SMTP via Nodemailer (Brevo SMTP, Mailjet, etc.)
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  if (smtpHost && smtpUser && smtpPass) {
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpFrom = process.env.SMTP_FROM_EMAIL?.trim() || smtpUser;
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `${senderName} <${smtpFrom}>`,
      to,
      subject,
      html,
    });

    return { provider: 'custom_smtp' };
  }

  // 3. Brevo HTTP API (300/day free, works with verified Gmail sender without buying a domain)
  const brevoApiKey = process.env.BREVO_API_KEY?.trim();
  const brevoSender = process.env.BREVO_SENDER_EMAIL?.trim();
  if (brevoApiKey && brevoSender) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: brevoSender },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`[Brevo] Failed to send email (${res.status}): ${errBody}`);
    }

    return { provider: 'brevo_api' };
  }

  // 4. Resend SDK (Requires custom domain verified in Resend for non-owner recipients)
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const resend = new Resend(resendKey);
    const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || 'onboarding@resend.dev';

    const { error } = await resend.emails.send({
      from: `${senderName} <${fromAddress}>`,
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(`[Resend] Failed to send access email: ${error.message}`);
    }

    return { provider: 'resend' };
  }

  // 5. Dev Console Fallback
  console.info(`[email:dev] No email transport configured. Simulated delivery to ${to}: ${subject}`);
  return { provider: 'dev_log' };
}

export async function sendAccessEmail({
  orderId,
  email,
  courseId,
  token: providedToken,
}: SendAccessEmailParams): Promise<void> {
  // 1. Replay protection — never double-send for the same order
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
  const accessUrl = `${baseUrl}/access?token=${encodeURIComponent(token)}&courseId=${encodeURIComponent(courseId)}`;

  const result = await dispatchEmail({
    to: email,
    subject: `Your Private Access: ${storefrontContent.course.title}`,
    html: buildAccessEmailHtml(accessUrl),
  });

  if (result.provider === 'dev_log') {
    console.info(`[email:dev] Access URL for order ${orderId}: ${accessUrl}`);
  }

  await redis.set(`email:sent:${orderId}`, '1', { ex: 60 * 60 * 24 * 400 });
}
