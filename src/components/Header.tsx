'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Moon, Sun } from 'lucide-react';

const THEME_KEY = 'eggplant-theme';

export function Header() {
  const [isDark, setIsDark] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    const shouldUseDark = saved ? saved === 'dark' : true;
    setIsDark(shouldUseDark);
    document.documentElement.dataset.theme = shouldUseDark ? 'dark' : 'light';

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 4);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    document.documentElement.dataset.theme = nextIsDark ? 'dark' : 'light';
    window.localStorage.setItem(THEME_KEY, nextIsDark ? 'dark' : 'light');
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-200 ${
        isScrolled
          ? 'border-b border-[var(--line)] bg-[var(--header-bg)] shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-2xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-[76px] w-full max-w-[1920px] items-center justify-between px-6 sm:px-12 lg:px-20">
        <a href="/" className="group flex min-h-11 items-center gap-3.5" aria-label="Chad Kermit home">
          <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-[var(--accent)] transition-transform group-hover:scale-105">
            <Image
              src="/images/chad-avatar.png"
              alt="Chad Kermit"
              width={44}
              height={44}
              className="h-full w-full object-cover object-top"
              priority
            />
          </div>
          <span className="hidden text-xs font-bold uppercase tracking-[0.24em] text-[var(--foreground)] sm:block">
            Chad Kermit
          </span>
        </a>

        <button
          type="button"
          onClick={toggleTheme}
          className="grid min-h-11 min-w-11 place-items-center rounded-full bg-[var(--surface)] text-[var(--foreground)] shadow-[0_10px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl transition hover:scale-105"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
        </button>
      </div>
    </header>
  );
}
