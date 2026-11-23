'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Clock,
  CreditCard,
  ExternalLink,
  Instagram,
  Loader2,
  Mail,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';
import { storefrontContent } from '@/lib/course-content';
import { getAvailablePaymentProviders } from '@/lib/payments/config';

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
  phase = 'idle',
  errorMessage = null,
  embedSlot,
  email = '',
  onEmailChange,
  emailError = null,
}: AntechamberModalProps) => {
  const panelRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [paymegateLoading, setPaymegateLoading] = useState(false);
  const [paymegateError, setPaymegateError] = useState<string | null>(null);

  const handlePaymegateCheckout = async () => {
    if (paymegateLoading) return;
    const trimmedEmail = email?.trim() ?? '';
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setPaymegateError('Please enter a valid email address (or leave it blank to enter it on Paymegate).');
      return;
    }

    setPaymegateError(null);
    setPaymegateLoading(true);
    try {
      const res = await fetch('/api/paymegate/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail ? trimmedEmail : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.checkoutUrl) {
        throw new Error(data?.detail || data?.error || 'Could not initialize Paymegate checkout.');
      }
      window.location.assign(data.checkoutUrl);
    } catch (err) {
      setPaymegateError(
        err instanceof Error ? err.message : 'Unable to initialize Paymegate checkout. Please try again.',
      );
      setPaymegateLoading(false);
    }
  };

  const providers = getAvailablePaymentProviders();
  const primaryProvider = providers.find((p) => p.isPrimary) ?? providers[0] ?? {
    id: 'blunt',
    name: 'Blunt.cash',
    badge: 'Direct Crypto Checkout',
    chains: 'Arbitrum · Base · Solana · ETH',
    checkoutUrl: storefrontContent.product.paymentUrl,
    isPrimary: true,
  };
  const secondaryProviders = providers.filter((p) => p.id !== primaryProvider.id && p.checkoutUrl);

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
              className="max-w-[520px] text-[clamp(1.8rem,7vw,3rem)] font-semibold leading-[0.98] tracking-[-0.055em]"
            >
              {phase === 'fulfilled'
                ? 'Access is ready.'
                : phase === 'confirming'
                  ? 'Confirming payment…'
                  : 'Unlock Instant Access.'}
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
            <div className="mt-6 overflow-hidden rounded-[24px] bg-[var(--background)]">
              <div
                className="aspect-[16/6] bg-cover bg-center"
                style={{
                  backgroundImage: "url('/images/hero-4.png')",
                }}
                role="img"
                aria-label="Bigger Energy Masterclass"
              />
              <div className="grid grid-cols-3 gap-3 px-4 py-4 sm:px-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">01</p>
                  <p className="mt-1 text-xs font-semibold sm:text-sm">Enter email</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">02</p>
                  <p className="mt-1 text-xs font-semibold sm:text-sm">Pay ${storefrontContent.product.priceUsd.toFixed(2)} once</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">03</p>
                  <p className="mt-1 text-xs font-semibold sm:text-sm">Watch full video</p>
                </div>
              </div>
            </div>

            {/* PRIMARY CHECKOUT OPTION (PAYMEGATE) */}
            <div className="mt-5 rounded-3xl border border-[var(--line)] bg-[var(--background)] p-5 sm:p-6 text-left">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(139,207,34,0.15)] px-3 py-1 text-[11px] font-bold text-[var(--accent-strong)]">
                  {primaryProvider.id === 'provider_b' ? (
                    <CreditCard size={13} strokeWidth={2.2} />
                  ) : (
                    <Zap size={13} className="fill-current" />
                  )}
                  {primaryProvider.badge}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--muted)]">
                  <Clock size={12} className="text-[var(--accent-strong)]" />
                  30-min quote lock
                </span>
              </div>

              <h3 className="mt-3 text-lg font-bold text-[var(--foreground)]">
                Pay With {primaryProvider.name}
              </h3>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-[var(--muted)]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1">
                  <Check size={12} strokeWidth={2.8} className="text-[var(--accent-strong)]" />
                  Full Digital Video
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1">
                  <Check size={12} strokeWidth={2.8} className="text-[var(--accent-strong)]" />
                  Private Email Link
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1">
                  <Check size={12} strokeWidth={2.8} className="text-[var(--accent-strong)]" />
                  Digital Only · Instant
                </span>
              </div>

              {primaryProvider.id === 'provider_b' ? (
                <>
                  {onEmailChange && (
                    <div className="mt-4">
                      <label
                        htmlFor="primary-checkout-email"
                        className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]"
                      >
                        <Mail size={12} className="text-[var(--accent-strong)]" />
                        <span>Delivery Email (Optional)</span>
                      </label>
                      <input
                        id="primary-checkout-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          onEmailChange(e.target.value);
                          if (paymegateError) setPaymegateError(null);
                        }}
                        disabled={paymegateLoading}
                        className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/50 focus:border-[var(--accent)] focus:outline-none"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePaymegateCheckout}
                    disabled={paymegateLoading}
                    className="mt-4 flex h-[68px] sm:h-[74px] w-full items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-7 text-center text-base sm:text-lg font-extrabold tracking-tight text-[var(--accent-ink)] transition-colors duration-200 active:scale-[0.98] hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {paymegateLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Opening Checkout…</span>
                      </>
                    ) : (
                      <>
                        <span>Pay Card / Crypto · ${storefrontContent.product.priceUsd.toFixed(2)}</span>
                        <ExternalLink size={19} strokeWidth={2.4} />
                      </>
                    )}
                  </button>
                  {(paymegateError || emailError) && (
                    <p className="mt-2.5 text-xs font-medium text-red-400">{paymegateError || emailError}</p>
                  )}
                </>
              ) : (
                <a
                  href={primaryProvider.checkoutUrl || storefrontContent.product.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex h-[68px] sm:h-[74px] w-full items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-7 text-center text-base sm:text-lg font-extrabold tracking-tight text-[var(--accent-ink)] transition-colors duration-200 active:scale-[0.98] hover:bg-[var(--accent-strong)]"
                >
                  <span>Pay Direct Crypto · ${storefrontContent.product.priceUsd.toFixed(2)}</span>
                  <ExternalLink size={19} strokeWidth={2.4} />
                </a>
              )}
            </div>

            {/* SECONDARY PAYMENT RAIL (BLUNT.CASH BACKUP) */}
            {secondaryProviders.map((sec) => (
              <div key={sec.id} className="mt-3.5 rounded-3xl border border-[var(--line)] bg-[var(--background)] p-4 sm:p-5 text-left">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)]">
                    <Zap size={13} className="fill-current text-[var(--accent-strong)]" />
                    Backup: {sec.name}
                  </span>
                  <span className="text-[11px] font-semibold text-[var(--muted)]">{sec.chains}</span>
                </div>
                {sec.id === 'provider_b' ? (
                  <button
                    type="button"
                    onClick={handlePaymegateCheckout}
                    disabled={paymegateLoading}
                    className="mt-3 flex h-[56px] w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-6 text-sm font-bold text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--accent-strong)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {paymegateLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Opening Checkout…</span>
                      </>
                    ) : (
                      <>
                        <span>Pay Card / Crypto · ${storefrontContent.product.priceUsd.toFixed(2)}</span>
                        <ExternalLink size={16} />
                      </>
                    )}
                  </button>
                ) : (
                  <a
                    href={sec.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex h-[56px] w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-6 text-sm font-bold text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--accent-strong)] active:scale-[0.98]"
                  >
                    <span>Pay Direct Crypto · ${storefrontContent.product.priceUsd.toFixed(2)}</span>
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            ))}

            {/* ANTI-CHURN ESCAPE HATCH: CAN'T PAY WITH CRYPTO OR CARD? DM ON INSTAGRAM */}
            <a
              href={storefrontContent.product.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3.5 flex items-center justify-between gap-4 rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3.5 text-left transition-colors duration-200 hover:border-[var(--accent)]"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--surface)] text-[var(--accent-strong)]">
                  <Instagram size={17} strokeWidth={2} />
                </span>
                <div>
                  <p className="text-xs font-bold text-[var(--foreground)]">
                    Can&apos;t pay? DM {storefrontContent.product.instagramHandle}
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
                    Trouble paying with crypto or card? Message us on Instagram for help.
                  </p>
                </div>
              </div>
              <ExternalLink size={15} className="shrink-0 text-[var(--muted)]" />
            </a>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--muted)]/75">
              Private access for purchaser only — do not share or redistribute. Digital entertainment &amp; personal-development experience; not medical, psychological, financial, or professional advice.
            </p>
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
              className="mt-6 flex h-[72px] sm:h-[76px] w-full items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-8 text-base sm:text-lg font-extrabold text-[var(--accent-ink)] transition-colors duration-200 active:scale-[0.98] hover:bg-[var(--accent-strong)]"
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
