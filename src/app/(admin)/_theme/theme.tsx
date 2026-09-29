"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";

// Light, dark or the device's choice — remembered per browser. No package: the inline script in
// the root layout applies the class before the first paint, this context keeps it in step.
export type Theme = "light" | "dark" | "system";
const KEY = "cms-theme";

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})()`;

const listeners = new Set<() => void>();
const read = (): Theme => {
  try {
    const value = localStorage.getItem(KEY);
    return value === "dark" || value === "light" ? value : "system";
  } catch {
    return "system";
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
  theme: "system",
  resolved: "light",
  setTheme: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, read, () => "system" as Theme);
  const resolved = useSyncExternalStore(
    subscribe,
    () => (document.documentElement.classList.contains("dark") ? "dark" : "light"),
    () => "light" as const,
  );
  const setTheme = useCallback((next: Theme) => {
    try {
      if (next === "system") localStorage.removeItem(KEY);
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
