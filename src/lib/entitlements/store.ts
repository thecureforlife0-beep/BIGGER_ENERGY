import 'server-only';
import { redis } from '@/lib/redis';
import { createHash, randomBytes } from 'node:crypto';
import { newId } from '@/lib/orders/store';
import type { Entitlement } from '@/lib/orders/types';

const ENT_TTL = 60 * 60 * 24 * 365; // 365 days

export const hashToken = (t: string) =>
  createHash('sha256').update(t, 'utf8').digest('hex');

/**
 * Idempotent: if this order already has an entitlement, return the existing
 * record instead of minting a second one.
 */
export async function issueEntitlement(params: {
  orderId: string;
  courseId: string;
  email: string;
}): Promise<{ entitlement: Entitlement; token: string; created: boolean }> {
  const existingHash = await redis.get<string>(`ent:by-order:${params.orderId}`);
  if (existingHash) {
    const raw = await redis.get<string | Entitlement>(`ent:${existingHash}`);
    if (raw) {
      const entitlement: Entitlement =
        typeof raw === 'string' ? JSON.parse(raw) : (raw as Entitlement);
      const existingToken =
        (await redis.get<string>(`ent:token-by-order:${params.orderId}`)) ?? '';
      return { entitlement, token: existingToken, created: false };
    }
  }

  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const entitlement: Entitlement = {
    id: newId('ent'),
    orderId: params.orderId,
    courseId: params.courseId,
    email: params.email,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + ENT_TTL * 1000).toISOString(),
    mediaPolicyVersion: '2026-01',
  };

  await redis.set(`ent:${tokenHash}`, JSON.stringify(entitlement), { ex: ENT_TTL });
  await redis.set(`ent:by-order:${params.orderId}`, tokenHash, { ex: ENT_TTL });
  await redis.set(`ent:token-by-order:${params.orderId}`, token, { ex: ENT_TTL });
  return { entitlement, token, created: true };
}

export async function lookupEntitlement(token: string): Promise<Entitlement | null> {
  if (!token) return null;
  const raw = await redis.get<string | Entitlement>(`ent:${hashToken(token)}`);
  if (!raw) return null;
  const ent: Entitlement = typeof raw === 'string' ? JSON.parse(raw) : (raw as Entitlement);
  if (ent.revokedAt) return null;
  if (new Date(ent.expiresAt).getTime() < Date.now()) return null;
  return ent;
}

export async function lookupTokenByOrderId(orderId: string): Promise<string | null> {
  if (!orderId) return null;
  const token = await redis.get<string>(`ent:token-by-order:${orderId}`);
  return token && typeof token === 'string' ? token : null;
}
