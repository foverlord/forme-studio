"use client";

import { useLayoutEffect } from "react";

function visibleRatio(el: Element) {
  const rect = el.getBoundingClientRect();
  if (rect.height <= 0) return 0;
  const view = window.innerHeight || document.documentElement.clientHeight;
  const visible = Math.min(rect.bottom, view) - Math.max(rect.top, 0);
  return visible / rect.height;
}

/** Reveals home-page headings, photos, and grids once they enter view. */
export function RevealObserver() {
  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pending = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.is-in)"));
    const observer = reduce
      ? null
      : new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              entry.target.classList.add("is-in");
              observer?.unobserve(entry.target);
            }
          },
          { threshold: 0.15 },
        );

    for (const el of pending) {
      if (reduce || visibleRatio(el) >= 0.15) {
        el.classList.add("is-in", "no-anim");
        continue;
      }
      observer?.observe(el);
    }

    return () => observer?.disconnect();
  }, []);

  return null;
}
