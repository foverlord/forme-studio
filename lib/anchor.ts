/** Same-page section links such as `/#prices`. Schedule and other routes stay normal navigations. */
export function anchorId(href: string): string | null {
  const hash = href.indexOf("#");
  if (hash < 0) return null;
  const path = href.slice(0, hash);
  if (path !== "" && path !== "/" && path !== "/kk" && path !== "/kk/") return null;
  const id = href.slice(hash + 1);
  return id || null;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function withHistoryState(extra: Record<string, unknown>) {
  const current = window.history.state;
  const base = current && typeof current === "object" ? current : {};
  return { ...base, ...extra };
}

/**
 * Next patches `window.history.pushState` and treats a hash change as a navigation,
 * which scrolls to the top before our own scroll. The prototype methods stay native.
 */
function historyReplace(state: unknown) {
  History.prototype.replaceState.call(window.history, state, "");
}

function historyPush(state: unknown, url: string) {
  History.prototype.pushState.call(window.history, state, "", url);
}

export function scrollToAnchor(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = prefersReducedMotion();
  if (window.location.hash !== `#${id}`) {
    historyReplace(withHistoryState({ formeScrollY: window.scrollY }));
    historyPush(withHistoryState({ formeAnchor: id }), `#${id}`);
  }
  el.scrollIntoView({ behavior: reduce ? "instant" : "smooth", block: "start" });
  el.focus({ preventScroll: true });
}

/** Back/Forward. Call on the frame after popstate so the browser's own restoration cannot cancel the scroll. */
export function scrollToHistory() {
  const id = window.location.hash.replace(/^#/, "");
  if (id && document.getElementById(id)) {
    scrollToAnchor(id);
    return;
  }
  const y = window.history.state?.formeScrollY;
  if (typeof y !== "number") return;
  window.scrollTo({ top: y, behavior: prefersReducedMotion() ? "instant" : "smooth" });
}
