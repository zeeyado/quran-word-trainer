import { useState, useEffect, useCallback } from "react";

export type ThemePreference = "auto" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "qwt-theme";

function getStoredPreference(): ThemePreference {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === "light" || val === "dark" || val === "auto") return val;
  } catch { /* ignore */ }
  return "auto";
}

function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.setAttribute("data-theme", resolved);
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(getStoredPreference);
  const [systemDark, setSystemDark] = useState(
    () => !window.matchMedia("(prefers-color-scheme: light)").matches
  );

  // Derive resolved theme (pure computation, no effect setState)
  const resolved: ResolvedTheme = preference === "auto"
    ? (systemDark ? "dark" : "light")
    : preference;

  // Sync resolved theme to DOM
  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  // Persist preference
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, preference); } catch { /* ignore */ }
  }, [preference]);

  // Listen for system theme changes
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: light)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(!e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const setTheme = useCallback((pref: ThemePreference) => {
    setPreference(pref);
  }, []);

  return { preference, resolved, setTheme };
}
