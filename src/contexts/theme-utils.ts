export type Theme = "dark" | "light" | "system";

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem("theme");
  return (stored as Theme) || "system";
}

export function applyTheme(theme: Theme) {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }

  localStorage.setItem("theme", theme);
}
