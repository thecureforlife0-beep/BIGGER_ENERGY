import 'server-only';
import { createSign } from 'node:crypto';
import { storefrontContent } from '@/lib/course-content';

interface MuxPlaybackTokenOptions {
  playbackId: string;
  keyId: string;
  privateKeyBase64OrPem: string;
  expirationSeconds?: number;
}

/**
 * Generates an RS256 signed JWT for Mux Playback without external heavy dependencies.
 */
export function generateMuxPlaybackToken({
  playbackId,
  keyId,
  privateKeyBase64OrPem,
  expirationSeconds = 3600 * 24, // 24 hours
}: MuxPlaybackTokenOptions): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: keyId,
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: playbackId,
    aud: 'v',
    exp: now + expirationSeconds,
    kid: keyId,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // Decode private key if base64-encoded and normalize newlines
  let pem = privateKeyBase64OrPem.trim();
  if (pem.startsWith('"') && pem.endsWith('"')) {
    pem = pem.slice(1, -1);
  }
  if (!pem.includes('-----BEGIN')) {
    try {
      pem = Buffer.from(pem, 'base64').toString('utf8');
    } catch {
      // Keep as is if not valid base64
    }
  }
  // Convert any escaped literal \n back into actual newlines (critical for Vercel env injection)
  pem = pem.replace(/\\n/g, '\n');

  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer.sign(pem, 'base64url');

  return `${signingInput}.${signature}`;
}

export interface LessonMediaResponse {
  playbackUrl: string;
  playbackId: string;
  token?: string;
  isDevFallback: boolean;
  format: string;
}

/**
 * Resolves lesson media across Primary and Secondary Mux environments.
 * If Primary Mux environment is not set or signing fails, it automatically
 * attempts Secondary Mux environment before falling back to local preview.
 */
export function getLessonMedia(): LessonMediaResponse {
  const activeEnv = (process.env.MUX_ACTIVE_ENV ?? 'primary').toLowerCase();

  const primaryKeys = {
    keyId: process.env.MUX_SIGNING_KEY_ID,
    privateKey: process.env.MUX_PRIVATE_KEY,
    playbackId: process.env.MUX_PLAYBACK_ID || storefrontContent.course.fullVideoPlaybackId,
    envName: 'primary',
  };

  const secondaryKeys = {
    keyId: process.env.MUX_SECONDARY_SIGNING_KEY_ID,
    privateKey: process.env.MUX_SECONDARY_PRIVATE_KEY,
    playbackId: process.env.MUX_SECONDARY_PLAYBACK_ID,
    envName: 'secondary',
  };

  const candidates =
    activeEnv === 'secondary'
      ? [secondaryKeys, primaryKeys]
      : [primaryKeys, secondaryKeys];

  for (const candidate of candidates) {
    if (candidate.keyId && candidate.privateKey && candidate.playbackId) {
      try {
        const token = generateMuxPlaybackToken({
          playbackId: candidate.playbackId,
          keyId: candidate.keyId,
          privateKeyBase64OrPem: candidate.privateKey,
        });

        return {
          playbackUrl: `https://stream.mux.com/${candidate.playbackId}.m3u8?token=${token}`,
          playbackId: candidate.playbackId,
          token,
          isDevFallback: false,
          format: 'hls',
        };
      } catch (err) {
        console.error(`[mux] token signing failed for ${candidate.envName} environment`, err);
      }
    }
  }

  // Graceful fallback for local development or staging before Mux keys are injected
  return {
    playbackUrl: storefrontContent.course.teaserVideoUrl,
    playbackId: 'dev-preview',
    isDevFallback: true,
    format: 'stream',
  };
}
