"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { scrollToAnchor, scrollToHistory } from "@/lib/anchor";

/** Lands `/#prices` (and Back/Forward between hashes) on the section, with the header offset. */
export function AnchorScroll() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const id = window.location.hash.replace(/^#/, "");
    if (!id || !document.getElementById(id)) return;
    scrollToAnchor(id);
  }, [pathname]);

  useEffect(() => {
    function onPop() {
      window.requestAnimationFrame(() => scrollToHistory());
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return null;
}
