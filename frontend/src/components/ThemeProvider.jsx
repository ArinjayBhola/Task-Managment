/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { AppearanceContext, useAppearance } from "../hooks/useAppearance";
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("taskmaster-theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch {
      /* Storage may be disabled. */
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    try {
      localStorage.setItem("taskmaster-theme", theme);
    } catch {
      /* Theme works without storage. */
    }
  }, [theme]);
  return (
    <AppearanceContext.Provider value={{ theme, setTheme }}>
      {children}
    </AppearanceContext.Provider>
  );
}
export function ThemeToggle() {
  const { theme, setTheme } = useAppearance();
  const label = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
