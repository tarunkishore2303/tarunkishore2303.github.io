import React, { useEffect, useRef, useState } from "react";

function savedPreference(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preferences still work for this visit when browser storage is unavailable.
  }
}

export function usePresentation() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "dark",
  );
  const [motion, setMotion] = useState(
    () => document.documentElement.dataset.motion || "running",
  );
  const [reducedMotion, setReducedMotion] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const motionOverride = useRef(savedPreference("portfolio-motion"));

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#080808" : "#f6f4f3");
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.motion = motion;
    const elements = document.querySelectorAll(
      ".section-heading, .career-row, .project, .about-grid, .impact-strip > div",
    );
    if (motion === "paused" || !window.IntersectionObserver) {
      elements.forEach((element) => (element.dataset.reveal = "visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.dataset.reveal = "visible";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    elements.forEach((element) => {
      if (
        element.dataset.reveal !== "visible" &&
        element.getBoundingClientRect().top > window.innerHeight
      ) {
        element.dataset.reveal = "pending";
        observer.observe(element);
      } else {
        element.dataset.reveal = "visible";
      }
    });
    return () => observer.disconnect();
  }, [motion]);

  useEffect(() => {
    const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      setReducedMotion(motionQuery.matches);
      setMotion(
        motionQuery.matches || motionOverride.current === "paused"
          ? "paused"
          : "running",
      );
    };
    motionQuery.addEventListener("change", syncMotion);
    return () => {
      motionQuery.removeEventListener("change", syncMotion);
    };
  }, []);

  return {
    theme,
    motion,
    reducedMotion,
    toggleTheme() {
      const next = theme === "dark" ? "light" : "dark";
      savePreference("portfolio-theme", next);
      setTheme(next);
    },
    toggleMotion() {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const next = motion === "paused" ? "running" : "paused";
      motionOverride.current = next;
      savePreference("portfolio-motion", next);
      setMotion(next);
    },
  };
}

export function AppearanceControls({
  theme,
  motion,
  reducedMotion,
  toggleTheme,
  toggleMotion,
}) {
  return (
    <div className="appearance-controls">
      <button
        className="appearance-button theme-toggle"
        aria-label="Dark mode"
        aria-pressed={theme === "dark"}
        title={
          theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        }
        onClick={toggleTheme}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          aria-hidden="true"
        >
          {theme === "dark" ? (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
            </>
          ) : (
            <path d="M20 14.3A8.5 8.5 0 0 1 9.7 4a8.5 8.5 0 1 0 10.3 10.3Z" />
          )}
        </svg>
      </button>
      <button
        className="appearance-button motion-toggle"
        aria-label="Pause animations"
        aria-pressed={motion === "paused"}
        aria-disabled={reducedMotion}
        aria-describedby={reducedMotion ? "motion-preference" : undefined}
        title={
          reducedMotion
            ? "Reduced motion is enabled in your device settings"
            : motion === "paused"
              ? "Resume animations"
              : "Pause animations"
        }
        onClick={toggleMotion}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          aria-hidden="true"
        >
          {motion === "paused" ? (
            <path d="m8 5 11 7-11 7Z" />
          ) : (
            <>
              <path d="M8 5v14M16 5v14" />
              <circle cx="12" cy="12" r="10" strokeDasharray="2 4" />
            </>
          )}
        </svg>
      </button>
      {reducedMotion && (
        <span className="visually-hidden" id="motion-preference">
          Your device requests reduced motion. Change that device setting to
          enable animations.
        </span>
      )}
    </div>
  );
}
