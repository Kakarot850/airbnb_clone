// Dark mode toggle. The inline script in app/layout.tsx applies the saved choice before first paint.
export type Theme = "light" | "dark";

export function getTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // storage unavailable (private mode): the theme still applies for this visit
  }
}
