import 'server-only';
import { redis } from '@/lib/redis';
import { randomBytes } from 'node:crypto';
import type { Order } from './types';
import { PRODUCT } from '@/lib/blunt/config';

const ORDER_TTL = 60 * 60 * 24 * 30; // 30 days

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString('hex')}`;
}

export async function createOrder(sessionId: string, amountUsd: number): Promise<Order> {
  const order: Order = {
    id: newId('ord'),
    sessionId,
    courseId: PRODUCT.courseId,
    productVersion: PRODUCT.productVersion,
    amountUsd,
    status: 'created',
    paymentIds: [],
    isTest: process.env.BLUNT_MODE !== 'live',
    createdAt: new Date().toISOString(),
  };
  await redis.set(`order:${order.id}`, JSON.stringify(order), { ex: ORDER_TTL });
  await redis.set(`order:open:${sessionId}`, order.id, { ex: 60 * 60 * 24 });
  return order;
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const raw = await redis.get<string | Order>(`order:${orderId}`);
  if (!raw) return null;
  return typeof raw === 'string' ? (JSON.parse(raw) as Order) : raw;
}

/** Resume an existing open order for this browser session, if one exists. */
export async function findOpenOrderBySession(sessionId: string): Promise<Order | null> {
  const orderId = await redis.get<string>(`order:open:${sessionId}`);
  if (!orderId) return null;
  const order = await getOrder(orderId);
  if (!order) return null;
  if (order.status !== 'created' && order.status !== 'checkout_open') return null;
  return order;
}

export async function patchOrder(
  orderId: string,
  patch: Partial<Order>,
): Promise<Order | null> {
  const current = await getOrder(orderId);
  if (!current) return null;
  const next: Order = { ...current, ...patch };
  await redis.set(`order:${orderId}`, JSON.stringify(next), { ex: ORDER_TTL });
  return next;
}

/** Returns true only for the FIRST caller per paymentId (Atomic dedupe). */
export async function claimPaymentEvent(paymentId: string): Promise<boolean> {
  const res = await redis.set(`event:${paymentId}`, 'processing', {
    nx: true,
    ex: 60 * 60 * 24 * 400,
  });
  return res === 'OK';
}

export async function markEventDone(paymentId: string): Promise<void> {
  await redis.set(`event:${paymentId}`, 'done', { ex: 60 * 60 * 24 * 400 });
}
