'use client';

import React, { useState } from 'react';
import { Play, Sparkles, Volume2, ShieldCheck, ArrowRight } from 'lucide-react';
import { storefrontContent } from '@/lib/course-content';

interface TeaserVideoPlayerProps {
  onUnlockClick?: () => void;
}

export function TeaserVideoPlayer({ onUnlockClick }: TeaserVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative w-full overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface-strong)] shadow-[var(--shadow)] sm:rounded-[36px]">
      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-5 py-3.5 sm:px-7">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent-strong)]" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            Free Teaser Preview · Watch Before Purchasing
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
          <Volume2 size={15} />
          <span>Sound On</span>
        </div>
      </div>

      {/* Video / Poster Stage */}
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {isPlaying ? (
          <iframe
            src={`${storefrontContent.course.teaserVideoUrl}?autoplay=1&mute=0`}
            title="Bigger Energy Teaser Preview"
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div
            onClick={() => setIsPlaying(true)}
            className="group relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsPlaying(true);
            }}
            aria-label="Play teaser video"
          >
            {/* Background Graphic */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: "url('/images/hero-sunset.jpg')",
              }}
            />
            {/* Dark Dramatic Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

            {/* Teaser Copy Overlay */}
            <div className="relative z-10 mx-auto max-w-2xl px-6 text-center text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-white/90 backdrop-blur-md">
                <Sparkles size={13} className="text-[var(--accent)]" />
                Biological Proof & Research
              </div>

              <h3 className="mt-4 text-2xl font-black uppercase tracking-tight sm:text-4xl lg:text-5xl">
                Size Doesn’t Matter? <br />
                <span className="text-[var(--accent)]">Stop Coping.</span>
              </h3>

              <p className="mx-auto mt-3 max-w-lg text-xs leading-relaxed text-zinc-300 sm:text-sm">
                The biology doesn’t lie, even if she does. The only 2-step fix based on human anatomy.
              </p>

              {/* Pulsing Play Button */}
              <div className="mt-6 flex flex-col items-center justify-center gap-3">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_0_50px_rgba(139,207,34,0.6)] transition-all duration-300 group-hover:scale-110 sm:h-20 sm:w-20">
                  <Play size={28} fill="currentColor" className="ml-1" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/90">
                  Click To Play Teaser (Free)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Conversion Prompt */}
      <div className="flex flex-col items-center justify-between gap-4 bg-[var(--surface)] p-5 sm:flex-row sm:px-8">
        <div>
          <p className="text-sm font-bold text-[var(--foreground)]">
            Ready for the full 11-minute un-cut regimen?
          </p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Instant private access link delivered to your email. No monthly subscriptions.
          </p>
        </div>
        {onUnlockClick && (
          <button
            type="button"
            onClick={onUnlockClick}
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] shadow-[0_10px_30px_rgba(139,207,34,0.22)] transition hover:bg-[var(--accent-strong)] sm:w-auto"
          >
            <span>Unlock Full Video (${storefrontContent.product.priceUsd.toFixed(2)})</span>
            <ArrowRight size={16} strokeWidth={2.2} />
          </button>
        )}
      </div>
    </div>
  );
}
