'use client';

import React, { useEffect, useRef } from 'react';
import { ArrowRight, Check, Loader2, LockKeyhole, ShieldCheck, X } from 'lucide-react';
import { storefrontContent } from '@/lib/course-content';

export type CheckoutPhase = 'idle' | 'preparing' | 'checkout' | 'confirming' | 'fulfilled' | 'error';

interface AntechamberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCheckout?: () => void;
  isPreparing?: boolean;
  phase?: CheckoutPhase;
  errorMessage?: string | null;
  embedSlot?: React.ReactNode;
  email?: string;
  onEmailChange?: (email: string) => void;
  emailError?: string | null;
}

export const AntechamberModal = ({
  isOpen,
  onClose,
  onStartCheckout,
  isPreparing = false,
  phase = 'idle',
  errorMessage = null,
  embedSlot,
  email = '',
  onEmailChange,
  emailError = null,
}: AntechamberModalProps) => {
  const panelRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    panelRef.current
      ?.querySelector<HTMLElement>('button, a, input, [tabindex]:not([tabindex="-1"])')
      ?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      // Do not allow accidental escape dismissal while on-chain confirmation is in progress
      if (event.key === 'Escape') {
        if (phase !== 'confirming') onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || !panelRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !panelRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose, phase]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <button
        type="button"
        aria-label="Close secure access sheet"
        onClick={() => {
          if (phase !== 'confirming') onClose();
        }}
        className="sheet-backdrop absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-[3px]"
      />

      <section
        ref={panelRef}
        tabIndex={-1}
        className="sheet-panel absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] w-full max-w-[680px] overflow-y-auto rounded-t-[32px] bg-[var(--surface-strong)] px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3 text-[var(--foreground)] shadow-[0_-24px_100px_rgba(0,0,0,0.24)] sm:px-8"
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[var(--line)]" />

        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
              {phase === 'fulfilled' ? 'Complete' : 'Next step'}
            </p>
            <h2
              id="sheet-title"
              className="max-w-[520px] text-[clamp(1.8rem,7vw,3.2rem)] font-semibold leading-[0.98] tracking-[-0.055em]"
            >
              {phase === 'fulfilled'
                ? 'Access is ready.'
                : phase === 'confirming'
                  ? 'Confirming payment…'
                  : 'Take the method with you.'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full bg-[var(--background)] text-[var(--muted)] transition hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <X size={19} strokeWidth={1.7} />
          </button>
        </div>

        {/* Phase: IDLE or PREPARING */}
        {(phase === 'idle' || phase === 'preparing') && (
          <>
            <div className="mt-7 overflow-hidden rounded-[24px] bg-[var(--background)]">
              <div
                className="aspect-[16/7] bg-cover bg-center"
                style={{
                  backgroundImage: "url('/images/hero-4.png')",
                }}
                role="img"
                aria-label="Bigger Energy Masterclass"
              />
              <div className="grid gap-4 px-5 py-5 sm:grid-cols-3 sm:px-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">01</p>
                  <p className="mt-2 text-sm font-medium">Leave the noise behind</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">02</p>
                  <p className="mt-2 text-sm font-medium">Open direct checkout</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">03</p>
                  <p className="mt-2 text-sm font-medium">Get link by email</p>
                </div>
              </div>
            </div>

            <p className="mt-6 max-w-[560px] text-sm leading-6 text-[var(--muted)]">
              Pay directly from your wallet with crypto. Access is issued the moment payment confirms on-chain.
            </p>

            {onEmailChange && (
              <div className="mt-6 space-y-2 text-left">
                <label
                  htmlFor="customer-delivery-email"
                  className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]"
                >
                  Your Delivery Email
                </label>
                <input
                  id="customer-delivery-email"
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  disabled={isPreparing}
                  className="w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-5 py-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/40 focus:border-[var(--accent)] focus:outline-none"
                />
                {emailError && <p className="text-xs font-medium text-red-400">{emailError}</p>}
              </div>
            )}

            <button
              type="button"
              onClick={onStartCheckout}
              disabled={isPreparing}
              className="mt-7 flex h-[72px] sm:h-[76px] w-full items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-8 text-center text-base sm:text-lg font-extrabold tracking-tight text-[var(--accent-ink)] shadow-[0_20px_50px_rgba(139,207,34,0.35)] transition-all duration-200 active:scale-[0.98] hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPreparing ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Preparing secure checkout…
                </>
              ) : (
                <>
                  <LockKeyhole size={17} /> Start secure checkout (${storefrontContent.product.priceUsd.toFixed(2)})
                  <ArrowRight size={18} strokeWidth={2} />
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs leading-5 text-[var(--muted)]">
              Direct settlement to merchant wallets via Blunt.cash.
            </p>
            <div className="mt-3 border-t border-[var(--line)] pt-3 text-center">
              <a
                href={storefrontContent.product.paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-[var(--muted)] underline transition hover:text-[var(--accent-strong)]"
              >
                Or pay directly on blunt.cash ↗
              </a>
            </div>
          </>
        )}

        {/* Phase: CHECKOUT (Blunt Embed Active) */}
        {phase === 'checkout' && (
          <div className="mt-6 space-y-4">
            <p className="text-xs text-[var(--muted)]">
              Select your payment asset and sign the transaction from your connected wallet or QR code.
            </p>
            {embedSlot}
          </div>
        )}

        {/* Phase: CONFIRMING */}
        {phase === 'confirming' && (
          <div className="my-10 flex flex-col items-center justify-center rounded-3xl bg-[var(--background)] p-8 text-center">
            <Loader2 size={36} className="animate-spin text-[var(--accent-strong)]" />
            <p className="mt-4 text-base font-semibold text-[var(--foreground)]">Transaction detected</p>
            <p className="mt-2 max-w-sm text-xs leading-5 text-[var(--muted)]">
              Awaiting on-chain finality. Your private entitlement is being generated. Do not close this drawer.
            </p>
          </div>
        )}

        {/* Phase: FULFILLED */}
        {phase === 'fulfilled' && (
          <div className="my-8 rounded-3xl bg-[var(--background)] p-7 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[rgba(139,207,34,0.15)] text-[var(--accent-strong)]">
              <Check size={28} strokeWidth={2.5} />
            </div>
            <p className="mt-4 text-lg font-bold text-[var(--foreground)]">Entitlement Activated</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Your access link has been delivered to your email. You can also proceed directly to the private lesson now.
            </p>
            <a
              href={`/my-course/${storefrontContent.course.id}`}
              className="mt-6 flex h-[72px] sm:h-[76px] w-full items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-8 text-base sm:text-lg font-extrabold text-[var(--accent-ink)] shadow-[0_16px_40px_rgba(139,207,34,0.3)] transition-all duration-200 active:scale-[0.98] hover:bg-[var(--accent-strong)]"
            >
              <ShieldCheck size={18} /> Enter Course Now
            </a>
          </div>
        )}

        {/* Phase: ERROR */}
        {phase === 'error' && (
          <div className="mt-6 rounded-2xl bg-red-950/20 p-5 text-sm text-red-300">
            <p className="font-semibold">Checkout Notice</p>
            <p className="mt-1 text-xs">{errorMessage || 'An error occurred during checkout. Please try again.'}</p>
            <button
              type="button"
              onClick={onStartCheckout}
              className="mt-4 rounded-full bg-[var(--foreground)] px-5 py-2 text-xs font-bold text-[var(--background)]"
            >
              Retry
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
