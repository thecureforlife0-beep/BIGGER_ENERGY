'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  ExternalLink,
  Flame,
  LockKeyhole,
  Play,
  ShieldCheck,
  Star,
  UserCheck,
  Zap,
} from 'lucide-react';
import { CheckoutSheet } from './checkout/CheckoutSheet';
import { TeaserVideoPlayer } from './TeaserVideoPlayer';
import { storefrontContent } from '@/lib/course-content';

const HERO_IMAGES = [
  '/images/hero-4.png', // Sunset Balcony
  '/images/hero-1.png', // Daylight Temple
  '/images/hero-2.png', // Stairs to Heaven
  '/images/hero-3.png', // Marble Throne
];

const methodSteps = [
  {
    number: '01',
    title: 'See the biological system',
    copy: 'A direct 11-minute lesson detailing corpora cavernosa blood-flow mechanics and cellular expansion.',
  },
  {
    number: '02',
    title: 'Execute the 2-step protocol',
    copy: 'Follow the precise morning sequence every day. No dangerous pumps, no sketchy pills, no hospital visits.',
  },
  {
    number: '03',
    title: 'Lock in permanent growth',
    copy: 'Measure your gains across length and girth. Your private encrypted access link stays ready forever.',
  },
];

export function UnpurchasedHomepage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  // Cycle through the 4 hero images every 1.2 seconds as mandated
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const openCheckout = useCallback(() => setIsSheetOpen(true), []);
  const closeCheckout = useCallback(() => setIsSheetOpen(false), []);

  return (
    <>
      <CheckoutSheet isOpen={isSheetOpen} onClose={closeCheckout} />

      <main className="w-full overflow-x-hidden bg-[var(--background)] pb-20 text-[var(--foreground)]">
        {/* =========================================================================
            SECTION 1: HERO SCENE (1920x1080 FULLSCREEN CINEMATIC CANVAS)
            Cycles through the 4 Chad Kermit scenes every 1.2s.
            No manual buttons, no redundant headings, true edge-to-edge fullscreen.
            ========================================================================= */}
        <section className="relative flex h-screen min-h-[720px] w-full flex-col justify-end overflow-hidden">
          {/* Preloaded Cycling Background Images with Cross-Fade */}
          {HERO_IMAGES.map((imgSrc, idx) => (
            <div
              key={imgSrc}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ease-in-out sm:bg-[center_top] ${
                idx === heroIndex ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
              style={{
                backgroundImage: `url('${imgSrc}')`,
              }}
              role="img"
              aria-label="Chad Kermit Masterclass"
            />
          ))}

          {/* Cinematic Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/40 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)]/60 via-transparent to-[var(--background)]/30" />

          {/* Minimalist Lower Hero Bar */}
          <div className="relative z-10 mx-auto w-full max-w-[1800px] px-6 pb-12 pt-32 sm:px-12 sm:pb-16 lg:px-20 xl:px-28">
            <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
              {/* Left Meta Tag */}
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--surface-strong)]/85 px-4 py-2 text-xs font-bold tracking-wide text-[var(--foreground)] shadow-lg backdrop-blur-md">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <span className="font-extrabold">{storefrontContent.product.rating}</span>
                  <span className="text-[var(--muted)]">({storefrontContent.product.reviewsCount} Verified Reviews)</span>
                </div>

                <p className="mt-4 text-lg font-semibold leading-snug text-[var(--foreground)] sm:text-2xl">
                  {storefrontContent.course.subtitle}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-[var(--muted)]">
                  <span className="flex items-center gap-1.5">
                    <Check size={15} className="text-[var(--accent-strong)]" /> Tested by 6,700+ Men
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-[var(--accent-strong)]" /> 100% Biology-Based
                  </span>
                  <span className="flex items-center gap-1.5">
                    <LockKeyhole size={15} className="text-[var(--accent-strong)]" /> Private 4K Stream
                  </span>
                </div>
              </div>

              {/* Right Single Unified Primary CTA */}
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[320px]">
                <button
                  type="button"
                  onClick={openCheckout}
                  className="flex h-[76px] sm:h-[80px] w-full items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-8 sm:px-10 text-base sm:text-lg font-extrabold tracking-tight text-[var(--accent-ink)] shadow-[0_20px_50px_rgba(139,207,34,0.35)] transition-all duration-200 active:scale-[0.98] hover:bg-[var(--accent-strong)] hover:shadow-[0_24px_60px_rgba(139,207,34,0.45)]"
                  data-testid="cta-button"
                >
                  <span>Start The Method</span>
                  <span className="rounded-full bg-black/10 px-2.5 py-1 text-sm font-black">
                    ${storefrontContent.product.priceUsd.toFixed(2)}
                  </span>
                  <ArrowRight size={20} strokeWidth={2.4} />
                </button>

                <div className="flex items-center justify-between px-2 text-[11px] font-semibold text-[var(--muted)]">
                  <span>{storefrontContent.product.billing}</span>
                  <a
                    href="#about-course"
                    className="flex items-center gap-1 text-[var(--foreground)] transition hover:text-[var(--accent-strong)]"
                  >
                    <span>Watch Free Teaser</span>
                    <Play size={12} fill="currentColor" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 2: ABOUT THE COURSE (Teaser Video Player + Biological Breakdown)
            Non-repetitive, widescreen cinema layout.
            ========================================================================= */}
        <section
          id="about-course"
          className="relative w-full scroll-mt-16 border-t border-[var(--line)] py-20 sm:py-32"
        >
          <div className="mx-auto w-full max-w-[1800px] px-6 sm:px-12 lg:px-20 xl:px-28">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                <Flame size={14} />
                <span>01 / The Method</span>
              </div>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
                {storefrontContent.course.title}
              </h2>
              <p className="mt-4 text-base font-medium leading-relaxed text-[var(--muted)] sm:text-xl">
                Watch the public preview below before deciding to unlock the full 11-minute unedited protocol.
              </p>
            </div>

            {/* Interactive Teaser Video Player Frame */}
            <div className="mt-10 w-full">
              <TeaserVideoPlayer onUnlockClick={openCheckout} />
            </div>

            {/* Biological Protocol & Deliverables Grid */}
            <div className="mt-16 grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
              <div className="space-y-6 text-base leading-8 text-[var(--muted)] sm:text-lg sm:leading-9">
                <p className="text-[var(--foreground)]/90">
                  {storefrontContent.course.summary}
                </p>
                <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
                  <p className="font-semibold text-[var(--foreground)]">
                    {storefrontContent.course.socialProofClaim}
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[var(--muted)] sm:text-base">
                    {storefrontContent.course.callToAction}
                  </p>
                </div>
              </div>

              {/* Deliverables Card */}
              <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-strong)] p-8 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                  Included In Your Order
                </p>
                <ul className="mt-5 space-y-3.5">
                  {storefrontContent.course.includes.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm font-semibold text-[var(--foreground)] sm:text-base">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)]">
                        <Check size={13} strokeWidth={3} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 border-t border-[var(--line)] pt-6">
                  <button
                    type="button"
                    onClick={openCheckout}
                    className="flex h-[72px] sm:h-[76px] w-full items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-8 text-base font-extrabold text-[var(--accent-ink)] shadow-[0_16px_40px_rgba(139,207,34,0.28)] transition-all duration-200 active:scale-[0.98] hover:bg-[var(--accent-strong)]"
                  >
                    <Zap size={20} fill="currentColor" />
                    <span>Unlock Full Video (${storefrontContent.product.priceUsd.toFixed(2)})</span>
                  </button>
                  <p className="mt-3 text-center text-xs text-[var(--muted)]">
                    Direct crypto settlement. Instant delivery to your email.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: THE PROCESS (01, 02, 03)
            Strict Architectural Sequence: [Hero -> About Course -> Process -> Creator]
            ========================================================================= */}
        <section id="process" className="w-full border-t border-[var(--line)] py-20 sm:py-32">
          <div className="mx-auto w-full max-w-[1800px] px-6 sm:px-12 lg:px-20 xl:px-28">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                  02 / The Protocol Sequence
                </p>
                <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-6xl">
                  Direct in.<br />Useful out.
                </h2>
                <p className="mt-6 max-w-md text-base leading-relaxed text-[var(--muted)]">
                  No multi-hour lectures, no filler content. Just an exact morning biological protocol engineered for cellular tissue adaptation.
                </p>
              </div>

              <div className="divide-y divide-[var(--line)]">
                {methodSteps.map((step) => (
                  <div
                    key={step.number}
                    className="grid gap-4 py-8 sm:grid-cols-[80px_1fr_1.2fr] sm:items-start sm:gap-8"
                  >
                    <span className="text-xl font-black tracking-widest text-[var(--accent-strong)]">
                      {step.number}
                    </span>
                    <h3 className="text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                      {step.copy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: ABOUT THE CREATOR (Uncensored Joshua Hiett Transformation)
            ========================================================================= */}
        <section id="creator" className="w-full border-t border-[var(--line)] py-20 sm:py-32">
          <div className="mx-auto w-full max-w-[1800px] px-6 sm:px-12 lg:px-20 xl:px-28">
            <div className="max-w-4xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                03 / The Origin Story
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
                About The Creator: {storefrontContent.creator.name}
              </h2>
              <p className="mt-2 text-base font-semibold text-[var(--muted)]">
                Age {storefrontContent.creator.age} · {storefrontContent.creator.location}
              </p>
            </div>

            {/* Measurement Metric Badges */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
              <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Starting Baseline
                </p>
                <p className="mt-2 text-2xl font-black text-red-400 sm:text-3xl">
                  {storefrontContent.creator.startingLength}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">Battled severe dysmorphia</p>
              </div>

              <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                  Verified Length
                </p>
                <p className="mt-2 text-2xl font-black text-[var(--accent-strong)] sm:text-3xl">
                  {storefrontContent.creator.currentLength}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">+5.07&quot; Verified Gain</p>
              </div>

              <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                  Verified Girth
                </p>
                <p className="mt-2 text-2xl font-black text-[var(--accent-strong)] sm:text-3xl">
                  {storefrontContent.creator.currentGirth}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">Massive density expansion</p>
              </div>

              <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-strong)] p-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                  Time To Results
                </p>
                <p className="mt-2 text-2xl font-black text-[var(--foreground)] sm:text-3xl">
                  {storefrontContent.creator.growthTimeline}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">And still expanding</p>
              </div>
            </div>

            {/* Uncensored Transformation Narrative */}
            <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-6 text-base leading-8 text-[var(--muted)] sm:text-lg sm:leading-9">
                {storefrontContent.creator.biography.map((paragraph, index) => (
                  <p key={index} className="text-[var(--foreground)]/90">
                    {paragraph}
                  </p>
                ))}

                <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 text-xs leading-6 text-[var(--muted)]">
                  {storefrontContent.creator.disclosure}
                </div>
              </div>

              {/* Direct Instagram Outreach Card */}
              <div className="space-y-6">
                <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-strong)] p-8 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                    Direct Outreach
                  </p>
                  <h4 className="mt-3 text-xl font-bold text-[var(--foreground)]">
                    Have questions for Joshua?
                  </h4>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                    Joshua personally replies on Instagram to men executing the protocol and shares verified growth milestones.
                  </p>

                  <a
                    href={storefrontContent.creator.socialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 flex h-[68px] sm:h-[72px] w-full items-center justify-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] px-8 text-base font-bold text-[var(--foreground)] transition-all duration-200 active:scale-[0.98] hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                  >
                    <span>Message Joshua on Instagram</span>
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: CUSTOMER REVIEWS (Mandated to be the LAST section before footer)
            ========================================================================= */}
        <section id="reviews" className="w-full border-t border-[var(--line)] py-20 sm:py-32">
          <div className="mx-auto w-full max-w-[1800px] px-6 sm:px-12 lg:px-20 xl:px-28">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                  04 / Social Proof
                </p>
                <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-5xl">
                  Customer Reviews
                </h3>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)]">
                <UserCheck size={18} />
                <span>1,302 Verified Reviews (4.7 / 5.0)</span>
              </div>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {storefrontContent.reviews.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm"
                >
                  <div>
                    <div className="flex text-amber-400">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                    <p className="mt-4 text-sm font-medium leading-relaxed text-[var(--foreground)]">
                      &ldquo;{item.review}&rdquo;
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-4 text-xs">
                    <span className="font-bold text-[var(--foreground)]">{item.name}</span>
                    <span className="text-[11px] font-semibold text-[var(--accent-strong)]">Verified Buyer</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 6: FINAL CONVERSION BANNER (Single, frictionless decision)
            ========================================================================= */}
        <section className="border-t border-[var(--line)] bg-[var(--surface)]/60 py-20 sm:py-24">
          <div className="mx-auto flex w-full max-w-[1800px] flex-col items-center justify-between gap-8 px-6 text-center sm:px-12 lg:flex-row lg:px-20 xl:px-28 lg:text-left">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                Permanent Access · Instant Token Unlock
              </p>
              <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
                Ready To Stop Coping?
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Join 6,700+ men. Get the full 11-minute unedited masterclass and biological regimen now.
              </p>
            </div>

            <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={openCheckout}
                className="flex h-[76px] sm:h-[80px] w-full items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-10 text-base sm:text-lg font-extrabold text-[var(--accent-ink)] shadow-[0_20px_50px_rgba(139,207,34,0.35)] transition-all duration-200 active:scale-[0.98] hover:bg-[var(--accent-strong)] sm:w-auto"
              >
                <span>Start The Method (${storefrontContent.product.priceUsd.toFixed(2)})</span>
                <ArrowRight size={20} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
