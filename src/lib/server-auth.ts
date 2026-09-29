import 'server-only';
import { getRedis } from '@/lib/redis';
import { lookupEntitlement } from '@/lib/entitlements/store';

interface TokenData {
  fulfillmentId: string;
  userEmail: string;
  createdAt?: string;
}

export interface TokenVerification {
  isValid: boolean;
  error: string | null;
}

/** Verify against both hashed entitlements and legacy raw token contracts. */
export async function verifyTokenOnServer(
  token: string,
  courseId: string,
): Promise<TokenVerification> {
  if (!token || !courseId) {
    return { isValid: false, error: 'Token and course ID are required.' };
  }

  try {
    // 1. Check current hashed entitlement store
    const entitlement = await lookupEntitlement(token);
    if (entitlement) {
      if (entitlement.courseId !== courseId) {
        return { isValid: false, error: 'This access link is not valid for this course.' };
      }
      return { isValid: true, error: null };
    }

    // 2. Fallback for legacy raw tokens
    const stored = await getRedis().get<string | TokenData>(token);
    if (!stored) return { isValid: false, error: 'Invalid or expired access link.' };

    let data: TokenData;
    if (typeof stored === 'string') {
      try {
        data = JSON.parse(stored) as TokenData;
      } catch {
        return { isValid: false, error: 'Invalid or expired access link.' };
      }
    } else {
      data = stored;
    }

    if (!data || typeof data.fulfillmentId !== 'string') {
      return { isValid: false, error: 'Invalid or expired access link.' };
    }
    if (data.fulfillmentId !== courseId) {
      return { isValid: false, error: 'This access link is not valid for this course.' };
    }
    return { isValid: true, error: null };
  } catch (error) {
    console.error('[access] token verification failed', error);
    return { isValid: false, error: 'Access verification is temporarily unavailable.' };
  }
}
