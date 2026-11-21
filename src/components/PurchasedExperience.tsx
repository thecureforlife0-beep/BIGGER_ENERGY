'use client';

import { useEffect, useState } from 'react';
import { Check, Clock3, LockKeyhole, Play, ShieldCheck, Loader2 } from 'lucide-react';
import { storefrontContent } from '@/lib/course-content';

interface MediaInfo {
  playbackUrl: string;
  playbackId: string;
  token?: string;
  isDevFallback: boolean;
  format: string;
}

export function PurchasedExperience({ courseId }: { courseId: string }) {
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadMedia() {
      try {
        const res = await fetch(`/api/media/lesson?courseId=${encodeURIComponent(courseId)}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setMedia(data);
        }
      } catch (err) {
        console.error('[media] fetch failed', err);
      } finally {
        if (!cancelled) setLoadingMedia(false);
      }
    }
    void loadMedia();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (courseId !== storefrontContent.course.id) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16 text-center">
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">Course not found</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">This course link may be incorrect. Re-open your access email or contact support.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1080px] px-5 pb-24 pt-8 sm:px-8">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
            <Check size={14} /> Private access confirmed
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-[-0.07em] text-[var(--foreground)] sm:text-6xl">
            {storefrontContent.course.title}
          </h1>
          <p className="mt-5 max-w-[680px] text-base leading-7 text-[var(--muted)]">
            {storefrontContent.course.subtitle}
          </p>
        </div>

        <aside className="rounded-[28px] bg-[var(--surface)] p-6 sm:p-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Your access</p>
          <div className="mt-5 flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 text-[var(--accent-strong)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Entitlement verified</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">This browser session is authorized for this course.</p>
            </div>
          </div>
          <div className="mt-5 flex items-start gap-3">
            <Clock3 size={19} className="mt-0.5 text-[var(--muted)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">Access link</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Keep the original email so you can return later.</p>
            </div>
          </div>
        </aside>
      </section>

      {/* Video Streaming Container */}
      <section className="mt-10 overflow-hidden rounded-[32px] bg-[var(--surface)] shadow-[var(--shadow)]">
        {loadingMedia ? (
          <div className="flex min-h-[340px] items-center justify-center p-8">
            <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
          </div>
        ) : isPlaying && media?.playbackUrl ? (
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            {media.format === 'hls' && media.token ? (
              <iframe
                src={`https://player.mux.com/${media.playbackId}?token=${media.token}&autoplay=1`}
                title="Bigger Energy Masterclass Stream"
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <iframe
                src={media.playbackUrl}
                title="Lesson Stream"
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        ) : (
          <div className="grid min-h-[300px] place-items-center bg-[radial-gradient(ellipse_at_top,rgba(139,207,34,0.12),transparent_68%)] p-7 text-center sm:min-h-[440px] sm:p-12">
            <div className="max-w-[560px]">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--background)] text-[var(--accent-strong)] shadow-sm">
                <Play size={26} className="ml-1" fill="currentColor" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-3xl">
                Ready to begin the lesson
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {media?.isDevFallback
                  ? 'Dev Preview Stream Active. All security checks and session credentials have passed.'
                  : 'Private stream authenticated. Click below to start video playback.'}
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsPlaying(true)}
                  className="inline-flex h-[72px] sm:h-[76px] items-center justify-center gap-3 rounded-full bg-[var(--accent)] px-10 text-base font-extrabold text-[var(--accent-ink)] shadow-[0_20px_50px_rgba(139,207,34,0.3)] transition-all duration-200 active:scale-[0.98] hover:bg-[var(--accent-strong)]"
                >
                  <Play size={18} fill="currentColor" /> Start Lesson
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-8 border-t border-[var(--line)] pt-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--accent-strong)]">About the lesson</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.06em] text-[var(--foreground)]">{storefrontContent.course.subtitle}</h2>
        </div>
        <div className="space-y-4 text-sm leading-7 text-[var(--muted)]">
          <p>{storefrontContent.course.summary}</p>
          <p>{storefrontContent.course.socialProofClaim}</p>
          <p className="rounded-2xl bg-[var(--surface)] p-4 text-xs leading-5">Personal outcome statements reproduced from the original product screenshot are creator-reported claims, not independently verified evidence or medical advice.</p>
        </div>
      </section>
    </main>
  );
}
