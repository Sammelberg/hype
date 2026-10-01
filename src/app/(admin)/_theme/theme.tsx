"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

// Dark (the brand's Deep Space, the default), light or the device's choice — remembered per
// browser. No package: the inline script in the root layout applies the class before the first
// paint, this context keeps it in step.
export type Theme = "light" | "dark" | "system";
const KEY = "cms-theme";

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${KEY}");var d=t!=="light"&&(t!=="system"||matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})()`;

const listeners = new Set<() => void>();
const read = (): Theme => {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "system" ? value : "dark";
  } catch {
    return "dark";
  }
};
const apply = (theme: Theme) => {
  const dark =
    theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
};
const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  const media = matchMedia("(prefers-color-scheme: dark)");
  const onMedia = () => {
    apply(read());
    onChange();
  };
  media.addEventListener("change", onMedia);
  window.addEventListener("storage", onMedia);
  return () => {
    listeners.delete(onChange);
    media.removeEventListener("change", onMedia);
    window.removeEventListener("storage", onMedia);
  };
};

const ThemeContext = createContext<{
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
}>({
  theme: "dark",
  resolved: "dark",
  setTheme: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, read, () => "dark" as Theme);
  // Once more after mounting: when hydration fails (a form sent before it finished), React
  // renders the document anew and <html> loses the class the inline script had set.
  useEffect(() => {
    apply(read());
    for (const listener of listeners) listener();
  }, []);
  const resolved = useSyncExternalStore(
    subscribe,
    () => (document.documentElement.classList.contains("dark") ? "dark" : "light"),
    () => "dark" as const,
  );
  const setTheme = useCallback((next: Theme) => {
    try {
      if (next === "dark") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      /* private mode: the choice lasts for this page */
    }
    apply(next);
    for (const listener of listeners) listener();
  }, []);
  return <ThemeContext value={{ theme, resolved, setTheme }}>{children}</ThemeContext>;
}

export const useTheme = () => useContext(ThemeContext);
