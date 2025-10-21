// frontend/src/components/ThemeToggle.jsx
import React, { useEffect, useState } from "react";

/**
 * ThemeToggle
 * - Stores preference in localStorage ('theme' = 'light' | 'dark' | 'system')
 * - Adds/removes 'dark' class on document.documentElement for Tailwind class-based dark mode
 * - Exposes a compact UI (sun/moon icons via simple SVG) you can drop into Navbar
 *
 * How it works:
 * - If the saved preference is "system", it mirrors the OS preference via matchMedia.
 * - Otherwise it forces 'dark' class on <html> when theme === 'dark'.
 */

const THEME_KEY = "eduvision_theme_pref";

const IconSun = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 2v1.5" />
      <path d="M12 20.5V22" />
      <path d="M4.22 4.22l1.06 1.06" />
      <path d="M18.72 18.72l1.06 1.06" />
      <path d="M2 12h1.5" />
      <path d="M20.5 12H22" />
      <path d="M4.22 19.78l1.06-1.06" />
      <path d="M18.72 5.28l1.06-1.06" />
    </g>
  </svg>
);

const IconMoon = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || "system";
    } catch {
      return "system";
    }
  });

  // sync class on root element
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (t) => {
      if (t === "system") {
        // follow prefers-color-scheme
        const isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", isDark);
      } else {
        root.classList.toggle("dark", t === "dark");
      }
    };

    applyTheme(theme);

    // listen for system changes when theme === 'system'
    let mql;
    const handleSysChange = (e) => {
      if (theme === "system") {
        root.classList.toggle("dark", e.matches);
      }
    };
    if (window.matchMedia) {
      mql = window.matchMedia("(prefers-color-scheme: dark)");
      mql.addEventListener?.("change", handleSysChange);
      mql.addListener?.(handleSysChange); // fallback older browsers
    }

    return () => {
      mql?.removeEventListener?.("change", handleSysChange);
      mql?.removeListener?.(handleSysChange);
    };
  }, [theme]);

  const saveTheme = (t) => {
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {}
    setTheme(t);
  };

  // Small accessible menu: cycles through [light -> dark -> system]
  const cycle = () => {
    if (theme === "light") saveTheme("dark");
    else if (theme === "dark") saveTheme("system");
    else saveTheme("light");
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <button
        aria-label={`Toggle theme (current: ${theme})`}
        title={`Theme: ${theme} — click to cycle (light → dark → system)`}
        onClick={cycle}
        className="flex items-center gap-2 px-3 py-1 rounded-md border transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                   bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-100 shadow-sm"
      >
        <span className="sr-only">Toggle theme</span>
        <span className="flex items-center">
          {theme === "dark" ? <IconMoon /> : <IconSun />}
        </span>
        <span className="hidden sm:inline text-sm font-medium capitalize">{theme}</span>
      </button>
    </div>
  );
}
