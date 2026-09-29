'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const THEME_KEY = 'eggplant-theme';

export function Header() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    const shouldUseDark = saved ? saved === 'dark' : true;
    setIsDark(shouldUseDark);
    document.documentElement.dataset.theme = shouldUseDark ? 'dark' : 'light';
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    document.documentElement.dataset.theme = nextIsDark ? 'dark' : 'light';
    window.localStorage.setItem(THEME_KEY, nextIsDark ? 'dark' : 'light');
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <a href="/" className="group flex min-h-11 items-center gap-3" aria-label="Chad Kermit home">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_8px_24px_rgba(139,207,34,0.24)] transition-transform group-hover:scale-105">
            <span className="text-lg font-black tracking-[-0.12em]">CK</span>
          </span>
          <span className="hidden text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--foreground)] sm:block">
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
