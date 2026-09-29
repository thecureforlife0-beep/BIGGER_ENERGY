'use client';

import React, { useCallback, useState } from 'react';
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

const methodSteps = [
  {
    number: '01',
    title: 'See the biological system',
    copy: 'A short, direct 11-minute lesson that cuts through the noise and explains the cellular expansion mechanics.',
  },
  {
    number: '02',
    title: 'Execute the 2-step protocol',
    copy: 'Follow the precise morning anatomical sequence. No dangerous pumps, no sketchy pills, no hospital visits.',
  },
  {
    number: '03',
    title: 'Lock in permanent growth',
    copy: 'Track visible measurement gains across length and girth. Your private access link stays active permanently.',
  },
];

export function UnpurchasedHomepage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedHeroImage, setSelectedHeroImage] = useState<string>('/images/hero-sunset.jpg');

  const openCheckout = useCallback(() => setIsSheetOpen(true), []);
  const closeCheckout = useCallback(() => setIsSheetOpen(false), []);

  return (
    <>
      <CheckoutSheet isOpen={isSheetOpen} onClose={closeCheckout} />

      <main className="w-full bg-[var(--background)] pb-28 text-[var(--foreground)]">
        {/* =========================================================================
            SECTION 1: HERO SCENE (1920x1080 FULLSCREEN CINEMATIC CANVAS)
            Minimalist text overlay so high-res artwork dominates the viewport
            ========================================================================= */}
        <section className="relative flex min-h-[94vh] w-full flex-col justify-end overflow-hidden sm:min-h-[100vh]">
          {/* Full-width 1920x1080 Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 sm:bg-[center_top]"
            style={{
              backgroundImage: `url('${selectedHeroImage}')`,
            }}
            role="img"
            aria-label="Bigger Energy Cinematic Canvas"
          />

          {/* Cinematic Vignette Gradients for Text Legibility without Clutter */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/35 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)]/70 via-transparent to-[var(--background)]/40" />

          {/* Minimalist Visual Preset Switcher (Sunset vs Daylight) */}
          <div className="absolute right-6 top-24 z-20 hidden items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)]/80 p-1.5 backdrop-blur-xl sm:flex">
            <button
              type="button"
              onClick={() => setSelectedHeroImage('/images/hero-sunset.jpg')}
              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
                selectedHeroImage === '/images/hero-sunset.jpg'
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Sunset Canvas
            </button>
            <button
              type="button"
              onClick={() => setSelectedHeroImage('/images/hero-daylight.jpg')}
              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
                selectedHeroImage === '/images/hero-daylight.jpg'
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Daylight Canvas
            </button>
          </div>

          {/* Clean, Spacious Lower Hero Bar */}
          <div className="relative z-10 mx-auto w-full max-w-[1600px] px-6 pb-12 pt-32 sm:px-12 sm:pb-20 lg:px-20">
            <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
              {/* Left Sub-Meta (Minimalist) */}
              <div className="max-w-xl">
                {/* Social Proof & Rating Chip */}
                <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--surface-strong)]/80 px-4 py-2 text-xs font-bold tracking-wide text-[var(--foreground)] shadow-sm backdrop-blur-md">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <span className="font-extrabold">{storefrontContent.product.rating}</span>
                  <span className="text-[var(--muted)]">({storefrontContent.product.reviewsCount} Verified Reviews)</span>
                </div>

                <p className="mt-4 text-base font-medium leading-relaxed text-[var(--foreground)]/90 sm:text-lg">
                  {storefrontContent.course.subtitle}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-[var(--muted)]">
                  <span className="flex items-center gap-1.5">
                    <Check size={15} className="text-[var(--accent-strong)]" /> Over 6,700 Men Tested
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={15} className="text-[var(--accent-strong)]" /> 100% Biology-Based
                  </span>
                  <span className="flex items-center gap-1.5">
                    <LockKeyhole size={15} className="text-[var(--accent-strong)]" /> Instant Private Stream
                  </span>
                </div>
              </div>

              {/* Right CTA Block */}
              <div className="flex w-full flex-col gap-3.5 sm:w-auto sm:min-w-[340px]">
                <button
                  type="button"
                  onClick={openCheckout}
                  className="flex min-h-[72px] w-full items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-8 text-lg font-bold tracking-tight text-[var(--accent-ink)] shadow-[0_20px_50px_rgba(139,207,34,0.32)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
                  data-testid="cta-button"
                >
                  <span>Start The Method</span>
                  <span className="rounded-full bg-black/10 px-2.5 py-0.5 text-sm font-black">
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
            SECTION 2: ABOUT THE COURSE (From original project screenshot)
            Includes Teaser Video Player, Uncensored Power Copy & Customer Reviews
            ========================================================================= */}
        <section
          id="about-course"
          className="relative scroll-mt-20 border-t border-[var(--line)] py-20 sm:py-32"
        >
          <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-12 lg:px-20">
            {/* Section Tag & Headline */}
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                <Flame size={14} />
                <span>About The Course</span>
              </div>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
                {storefrontContent.course.headline}
              </h2>
              <p className="mt-4 text-lg font-semibold leading-relaxed text-[var(--muted)] sm:text-2xl">
                {storefrontContent.course.subheadline}
              </p>
            </div>

            {/* Interactive Teaser Video Player Component */}
            <div className="mt-12 w-full">
              <TeaserVideoPlayer onUnlockClick={openCheckout} />
            </div>

            {/* Body Copy & Value Proposition Grid */}
            <div className="mt-16 grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
              {/* Unfiltered Authentic Body Copy */}
              <div className="space-y-6 text-base leading-8 text-[var(--muted)] sm:text-lg sm:leading-9">
                <h3 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
                  {storefrontContent.course.subtitle}
                </h3>
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

              {/* Deliverables & Access Specs */}
              <div className="space-y-4">
                <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface-strong)] p-7 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                    What You Receive
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
                      className="flex min-h-[60px] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-ink)] shadow-[0_12px_36px_rgba(139,207,34,0.22)] transition hover:bg-[var(--accent-strong)]"
                    >
                      <Zap size={18} fill="currentColor" />
                      <span>Get Instant Access (${storefrontContent.product.priceUsd.toFixed(2)})</span>
                    </button>
                    <p className="mt-3 text-center text-xs text-[var(--muted)]">
                      Instant delivery to your email right after crypto confirmation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Reviews Section (Matching original screenshot proof) */}
            <div className="mt-24 border-t border-[var(--line)] pt-16">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                    Real Verified Results
                  </p>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
                    Customer Reviews
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)]">
                  <UserCheck size={18} />
                  <span>1,302 Verified Reviews (4.7 / 5.0)</span>
                </div>
              </div>

              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: THE PROCESS (01, 02, 03)
            Strict Sequence mandated by Founder: [Hero, About Course, Process, About Creator]
            ========================================================================= */}
        <section id="process" className="border-t border-[var(--line)] py-20 sm:py-32">
          <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-12 lg:px-20">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                  The Protocol Sequence
                </p>
                <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-6xl">
                  Direct in.<br />Useful out.
                </h2>
                <p className="mt-6 max-w-md text-base leading-relaxed text-[var(--muted)]">
                  No fluff, no multi-hour lectures, no snake-oil pills. Just a direct biological protocol engineered for cellular adaptation and rapid visible expansion.
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
            SECTION 4: ABOUT THE CREATOR (Unfiltered Joshua Hiett Story)
            Full anatomical transformation, baseline stats, and personal journey
            ========================================================================= */}
        <section id="creator" className="border-t border-[var(--line)] py-20 sm:py-32">
          <div className="mx-auto w-full max-w-[1600px] px-6 sm:px-12 lg:px-20">
            <div className="max-w-4xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                The Real Story
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
                  Starting Size
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
                <p className="mt-1 text-xs text-[var(--muted)]">Massive density boost</p>
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
                    Direct Creator Contact
                  </p>
                  <h4 className="mt-3 text-xl font-bold text-[var(--foreground)]">
                    Have questions before or after buying?
                  </h4>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                    Joshua is personally active on Instagram to answer questions from men running the protocol and celebrate confirmed transformation wins.
                  </p>

                  <a
                    href={storefrontContent.creator.socialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                  >
                    <span>Message Joshua on Instagram</span>
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: FOOTER CALL TO ACTION & DUAL PAYMENT OPTIONS
            Includes in-drawer checkout & direct Blunt.cash checkout link
            ========================================================================= */}
        <section className="border-t border-[var(--line)] bg-[var(--surface)]/50 py-20">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-8 px-6 text-center sm:px-12 lg:flex-row lg:px-20 lg:text-left">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                Permanent Access · Instant Unlock
              </p>
              <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
                Ready To Stop Coping?
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Join 6,700+ men. Get the full 11-minute un-cut video masterclass now for $22.30.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={openCheckout}
                className="flex min-h-[64px] items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-8 text-base font-bold text-[var(--accent-ink)] shadow-[0_16px_40px_rgba(139,207,34,0.28)] transition hover:bg-[var(--accent-strong)]"
              >
                <span>Get Video Now ($22.30)</span>
                <ArrowRight size={19} strokeWidth={2.4} />
              </button>

              <a
                href={storefrontContent.product.paymentUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[64px] items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-6 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-strong)]"
              >
                <span>Direct Blunt.cash Link</span>
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
