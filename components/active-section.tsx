"use client";

import { useEffect, useState } from "react";

/** Desktop nav highlight. Delete this file and its call in the header to remove it. */
const SECTION_IDS = ["directions", "trainers", "prices", "studio", "contacts"];

export function useActiveSection(enabled: boolean): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setActive(null);
      return;
    }
    const nodes = SECTION_IDS.map((id) => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node));
    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) ratios.set(entry.target.id, entry.intersectionRatio);
          else ratios.delete(entry.target.id);
        }
        let best: string | null = null;
        let bestRatio = -1;
        for (const id of SECTION_IDS) {
          const ratio = ratios.get(id);
          if (ratio == null || ratio <= bestRatio) continue;
          best = id;
          bestRatio = ratio;
        }
        setActive(best);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.1, 0.3, 0.6, 1] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [enabled]);

  return active;
}
