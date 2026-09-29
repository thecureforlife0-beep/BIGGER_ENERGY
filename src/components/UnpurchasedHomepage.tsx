'use client';

import React, { useCallback, useState } from 'react';
import { ArrowDown, ArrowRight, Check, LockKeyhole, Play, Sparkles, UserRound } from 'lucide-react';
import { CheckoutSheet } from './checkout/CheckoutSheet';
import { storefrontContent } from '@/lib/course-content';

const CHAD_KERMIT_IMAGE = 'https://sc04.alicdn.com/kf/S2391668237824498831703e44d4821b0X.jpg';

const methodSteps = [
  { number: '01', title: 'See the system', copy: 'A short, direct lesson that makes the whole method easy to understand.' },
  { number: '02', title: 'Make your move', copy: 'Take the next step with a clear process instead of more noise.' },
  { number: '03', title: 'Keep your edge', copy: 'Your access link arrives after checkout and stays ready when you need it.' },
];

export function UnpurchasedHomepage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const openCheckout = useCallback(() => setIsSheetOpen(true), []);
  const closeCheckout = useCallback(() => setIsSheetOpen(false), []);

  return (
    <>
      <CheckoutSheet
        isOpen={isSheetOpen}
        onClose={closeCheckout}
      />

      <main className="relative overflow-hidden px-5 pb-32 pt-[92px] sm:px-8 lg:pb-24">
        <div className="mx-auto max-w-[1180px]">
          <section className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
            <div className="max-w-[570px]">
              <div className="mb-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_0_6px_rgba(139,207,34,0.12)]" />
                A private lesson by Chad Kermit
              </div>

              <h1 className="max-w-[640px] text-[clamp(3.5rem,12vw,8.4rem)] font-semibold leading-[0.82] tracking-[-0.085em] text-[var(--foreground)]">
                Bigger
                <br />
                <span className="text-[var(--accent-strong)]">energy.</span>
              </h1>

              <p className="mt-8 max-w-[460px] text-lg leading-8 text-[var(--muted)] sm:text-xl">
                The Viral 2-Step Method, stripped back to the part that matters: one clear lesson, one confident next move.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-medium text-[var(--muted)]">
                <span className="flex items-center gap-2"><LockKeyhole size={15} /> Private access</span>
                <span className="flex items-center gap-2"><Play size={15} /> {storefrontContent.course.format}</span>
                <span className="flex items-center gap-2"><Sparkles size={15} /> No clutter</span>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={openCheckout}
                  className="flex min-h-[68px] w-full items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-7 text-base font-bold text-[var(--accent-ink)] shadow-[0_16px_42px_rgba(139,207,34,0.2)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] sm:w-auto sm:min-w-[250px]"
                  data-testid="cta-button"
                >
                  Start the method
                  <ArrowRight size={19} strokeWidth={2.2} />
                </button>
                <a href="#method" className="flex min-h-[56px] items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)]">
                  See how it works
                  <ArrowDown size={16} />
                </a>
              </div>

              <div className="mt-10 flex items-center gap-4 border-t border-[var(--line)] pt-5 text-xs text-[var(--muted)]">
                <span className="text-2xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">
                  ${storefrontContent.product.priceUsd.toFixed(2)}
                </span>
                <span className="h-1 w-1 rounded-full bg-[var(--line)]" />
                <span>{storefrontContent.product.billing}</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[600px] lg:ml-auto">
              <div className="hero-float absolute -left-5 top-10 z-10 rounded-full bg-[var(--surface-strong)] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground)] shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:-left-8">
                Pure confidence
              </div>
              <div className="relative aspect-[0.86] overflow-hidden rounded-[38px] bg-[#dbead0] shadow-[var(--shadow)] sm:rounded-[52px]">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${CHAD_KERMIT_IMAGE}')` }}
                  role="img"
                  aria-label="Chad Kermit character sheet"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-white/10" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/70">The character</p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">Chad Kermit</p>
                    </div>
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 backdrop-blur-md">
                      <ArrowRight size={20} />
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -right-2 rounded-2xl bg-[var(--surface)] px-4 py-3 text-right shadow-[0_18px_50px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:-right-7">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Built for</p>
                <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">clarity over noise</p>
              </div>
            </div>
          </section>

          <section id="method" className="mt-28 scroll-mt-24 border-t border-[var(--line)] pt-8 sm:mt-40">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--accent-strong)]">The process</p>
                <h2 className="mt-4 max-w-[380px] text-4xl font-semibold leading-[0.95] tracking-[-0.07em] text-[var(--foreground)] sm:text-5xl">
                  Direct in.<br />Useful out.
                </h2>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {methodSteps.map((step) => (
                  <div key={step.number} className="grid gap-4 py-6 sm:grid-cols-[72px_0.8fr_1fr] sm:items-start sm:gap-8">
                    <span className="text-xs font-bold tracking-[0.2em] text-[var(--accent-strong)]">{step.number}</span>
                    <h3 className="text-xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{step.title}</h3>
                    <p className="max-w-[340px] text-sm leading-6 text-[var(--muted)]">{step.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="course" className="mt-24 scroll-mt-24 border-t border-[var(--line)] pt-8 sm:mt-32">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--accent-strong)]">About the course</p>
                <h2 className="mt-4 max-w-[380px] text-4xl font-semibold leading-[0.95] tracking-[-0.07em] text-[var(--foreground)] sm:text-5xl">
                  One lesson.<br />A clear method.
                </h2>
              </div>
              <div className="max-w-[700px]">
                <h3 className="text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">{storefrontContent.course.subtitle}</h3>
                <p className="mt-4 text-base leading-7 text-[var(--muted)] sm:text-lg">
                  {storefrontContent.course.summary}
                </p>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-[var(--surface)] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Format</p>
                    <p className="mt-2 text-base font-semibold text-[var(--foreground)]">{storefrontContent.course.format}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{storefrontContent.course.duration}</p>
                  </div>
                  <div className="rounded-3xl bg-[var(--surface)] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Included</p>
                    <ul className="mt-2 space-y-1 text-sm text-[var(--foreground)]">
                      {storefrontContent.course.includes.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="creator" className="mt-24 scroll-mt-24 border-t border-[var(--line)] pt-8 sm:mt-32">
            <div className="grid gap-6 sm:grid-cols-[72px_1fr] sm:items-start sm:gap-8">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-[var(--surface)] text-[var(--muted)]" aria-hidden="true">
                {storefrontContent.creator.portraitUrl
                  ? <img src={storefrontContent.creator.portraitUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                  : <UserRound size={24} strokeWidth={1.5} />}
              </div>
              <div className="max-w-[760px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--accent-strong)]">About the creator</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-[var(--foreground)]">{storefrontContent.creator.name}</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">Age {storefrontContent.creator.age} · {storefrontContent.creator.location}</p>
                <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--muted)]">
                  {storefrontContent.creator.biography.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                <p className="mt-6 rounded-2xl bg-[var(--surface)] p-4 text-xs leading-5 text-[var(--muted)]">
                  {storefrontContent.creator.disclosure} {storefrontContent.course.socialProofClaim}
                </p>
                {storefrontContent.creator.socialUrl && (
                  <a href={storefrontContent.creator.socialUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent-strong)]">
                    Message the creator <ArrowRight size={16} className="ml-2" />
                  </a>
                )}
              </div>
            </div>
          </section>

          <section className="mt-24 flex flex-col justify-between gap-6 border-t border-[var(--line)] pt-7 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">No gallery. No performance.</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Just the lesson and the next step.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <Check size={15} className="text-[var(--accent-strong)]" />
              Secure handoff after checkout
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
