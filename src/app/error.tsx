'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log unexpected runtime error without exposing credentials or tokens
    console.error('[runtime-error]', error?.message || error);
  }, [error]);

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 py-20 text-center">
      <div className="w-full max-w-[560px] rounded-3xl border border-[var(--line)] bg-[var(--surface-strong)] p-8 shadow-2xl sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-500/10 text-red-400">
          <AlertCircle size={32} />
        </div>

        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
          Application Recovery
        </p>

        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Something interrupted the experience
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          A temporary client-side error occurred. Your orders and entitlements are completely safe on-chain.
        </p>

        {error?.digest && (
          <p className="mt-2 font-mono text-[11px] text-[var(--muted)]/60">
            Reference code: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="flex h-[64px] sm:h-[68px] items-center justify-center gap-2.5 rounded-full bg-[var(--accent)] px-8 text-base font-extrabold text-[var(--accent-ink)] shadow-[0_12px_36px_rgba(139,207,34,0.3)] transition-all duration-200 active:scale-[0.98] hover:bg-[var(--accent-strong)]"
          >
            <RotateCcw size={18} />
            <span>Try Again</span>
          </button>

          <a
            href="/"
            className="flex h-[64px] sm:h-[68px] items-center justify-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-8 text-base font-bold text-[var(--foreground)] transition-all duration-200 active:scale-[0.98] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
          >
            <Home size={18} />
            <span>Return to Storefront</span>
          </a>
        </div>
      </div>
    </main>
  );
}
