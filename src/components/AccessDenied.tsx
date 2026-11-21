import React from 'react';

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
            ? 'This access link is invalid or has expired. Re-open the original access email or contact support.'
            : reason || 'We could not verify this access link. Please try again shortly or contact support.'}
        </p>
        <a
          href="/"
          className="mt-7 inline-flex h-[68px] sm:h-[72px] items-center justify-center rounded-full bg-[var(--accent)] px-8 text-base font-extrabold text-[var(--accent-ink)] transition-colors duration-200 active:scale-[0.98] hover:bg-[var(--accent-strong)]"
        >
          Return to the course page
        </a>
      </div>
    </main>
  );
}
