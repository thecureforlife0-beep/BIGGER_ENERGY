import React from 'react';
import { Instagram } from 'lucide-react';
import { storefrontContent } from '@/lib/course-content';

export function AccessDenied({ reason }: { reason: string | null }) {
  const normalizedReason = reason?.toLowerCase() ?? '';
  const isTemporary = normalizedReason.includes('temporarily unavailable');
  const isInvalid = normalizedReason.includes('invalid') || normalizedReason.includes('expired') || normalizedReason.includes('not valid');

  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center px-5 py-16 text-center">
      <div className="w-full max-w-[520px] rounded-[32px] bg-[var(--surface)] p-7 sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
          {isTemporary ? 'Try again shortly' : 'Private access'}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">
          {isTemporary ? 'Access check unavailable' : isInvalid ? 'This link needs attention' : 'We could not check this link'}
        </h1>
        <p role="alert" aria-live="assertive" className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {isInvalid
            ? 'This access link is invalid or has expired. Re-open your email link or message us on Instagram.'
            : reason || 'We could not verify this access link. Try again shortly or message us on Instagram.'}
        </p>
        <div className="mt-7 flex flex-col gap-3">
          <a
            href="/"
            className="inline-flex h-[64px] sm:h-[68px] items-center justify-center rounded-full bg-[var(--accent)] px-8 text-base font-extrabold text-[var(--accent-ink)] transition-colors duration-200 active:scale-[0.98] hover:bg-[var(--accent-strong)]"
          >
            Back To Home
          </a>
          <a
            href={storefrontContent.product.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-[56px] items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--background)] px-6 text-sm font-bold text-[var(--foreground)] transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
          >
            <Instagram size={16} />
            <span>DM {storefrontContent.product.instagramHandle} for Help</span>
          </a>
        </div>
      </div>
    </main>
  );
}
