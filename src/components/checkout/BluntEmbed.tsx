'use client';

import { useEffect, useRef, useState } from 'react';

const BLUNT_WIDGET_SRC = 'https://blunt.cash/widget/blunt.js';

declare global {
  interface Window {
    Blunt?: {
      embed: (opts: {
        target: string;
        api_key: string;
        amount_usd: number;
        accepted?: { chain: string }[];
        metadata?: Record<string, unknown>;
        onSuccess?: (payment: unknown) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadBlunt(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Blunt) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = BLUNT_WIDGET_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('blunt_widget_load_failed'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

interface Props {
  orderId: string;
  amountUsd: number;
  publicKey: string;
  chains: string[];
  email: string;
  courseId: string;
  onPaymentSubmitted: () => void;
  onWidgetClosed: () => void;
  onLoadError: (message: string) => void;
}

export function BluntEmbed({
  orderId,
  amountUsd,
  publicKey,
  chains,
  email,
  courseId,
  onPaymentSubmitted,
  onWidgetClosed,
  onLoadError,
}: Props) {
  const targetId = `blunt-embed-${orderId}`;
  const mounted = useRef(false);
  const [, setReady] = useState(false);

  useEffect(() => {
    if (mounted.current) return; // Guard against React 19 double-invoke
    mounted.current = true;

    let cancelled = false;
    loadBlunt()
      .then(() => {
        if (cancelled || !window.Blunt) return;
        window.Blunt.embed({
          target: `#${targetId}`,
          api_key: publicKey,
          amount_usd: amountUsd,
          accepted: chains.map((chain) => ({ chain })),
          metadata: { order_id: orderId, course_id: courseId, email },
          onSuccess: () => {
            // HINT ONLY. No entitlement, no unlock, no navigation.
            onPaymentSubmitted();
          },
          onClose: onWidgetClosed,
        });
        setReady(true);
      })
      .catch(() => onLoadError('Checkout could not load. Please check your connection and retry.'));

    return () => {
      cancelled = true;
    };
  }, [
    targetId,
    orderId,
    amountUsd,
    publicKey,
    chains,
    email,
    courseId,
    onPaymentSubmitted,
    onWidgetClosed,
    onLoadError,
  ]);

  return (
    <div id={targetId} className="min-h-[320px] w-full rounded-2xl bg-[var(--surface)] p-2">
      {/* If in test mode with no public key, display a developer prompt */}
      {!publicKey && (
        <div className="flex min-h-[280px] flex-col items-center justify-center p-6 text-center text-xs text-[var(--muted)]">
          <p className="font-semibold text-[var(--foreground)]">Blunt Widget Standby</p>
          <p className="mt-2 max-w-sm">
            Set <code className="rounded bg-[var(--background)] px-1.5 py-0.5 font-mono">NEXT_PUBLIC_BLUNT_PUBLIC_KEY</code> in{' '}
            <code className="rounded bg-[var(--background)] px-1.5 py-0.5 font-mono">.env.local</code> to render the live crypto payment iframe.
          </p>
          <button
            type="button"
            onClick={onPaymentSubmitted}
            className="mt-5 rounded-full bg-[var(--accent)] px-5 py-2.5 font-bold text-[var(--accent-ink)]"
          >
            Simulate On-Chain Submission (Dev Test)
          </button>
        </div>
      )}
    </div>
  );
}
