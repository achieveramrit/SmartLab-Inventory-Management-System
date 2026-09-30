import { useTheme } from "../../context/ThemeContext";
import { SunIcon, MoonIcon } from "./Icons";

/**
 * ThemeToggle
 * Renders an interactive toggle button for Light Mode and Dark Mode using clean SVG icons.
 * Props:
 *   variant: "pill" | "icon" | "button" (default: "pill")
 *   className: additional class string
 */
export default function ThemeToggle({ variant = "pill", className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "icon") {
    return (
      <button
        type="button"
        className={`theme-toggle-icon ${className}`}
        onClick={toggleTheme}
        title={`Switch to ${isDark ? "Light" : "Dark"} mode (Press T)`}
        aria-label={`Switch to ${isDark ? "Light" : "Dark"} mode`}
      >
        {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
      </button>
    );
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        className={`ghost theme-btn ${className}`}
        onClick={toggleTheme}
        title={`Switch to ${isDark ? "Light" : "Dark"} mode (Press T)`}
      >
        <span className="btn-icon">{isDark ? <SunIcon size={14} /> : <MoonIcon size={14} />}</span>
        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
      </button>
    );
  }

  // Default "pill" segmented switch
  return (
    <div
      className={`theme-pill-toggle ${className}`}
      onClick={toggleTheme}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleTheme()}
      title={`Current: ${isDark ? "Dark" : "Light"} mode. Click or press T to switch.`}
      aria-label="Toggle light or dark theme"
    >
      <div className={`theme-pill-option ${!isDark ? "active" : ""}`}>
        <span className="theme-pill-icon"><SunIcon size={13} /></span>
        <span className="theme-pill-label">Light</span>
      </div>
      <div className={`theme-pill-option ${isDark ? "active" : ""}`}>
        <span className="theme-pill-icon"><MoonIcon size={13} /></span>
        <span className="theme-pill-label">Dark</span>
      </div>
      <div className={`theme-pill-slider ${isDark ? "dark" : "light"}`} />
    </div>
  );
}
