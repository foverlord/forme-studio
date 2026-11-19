"use client";

import { useEffect, useRef, useState } from "react";
import { mapWidgetUrl } from "@/content/studio";

export function StudioMap({ title, hint, label }: { title: string; hint: string; label: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) setActive(false);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const lock = () => setActive(false);
    const onHide = () => {
      if (document.hidden) lock();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) lock();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") lock();
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pagehide", lock);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pagehide", lock);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [active]);

  const showFrame = near && !failed;
  const interactive = ready && !failed;

  return (
    <div
      ref={rootRef}
      className={interactive ? "map is-ready" : "map"}
      role="group"
      aria-label={title}
      data-map-state={failed ? "failed" : interactive ? "ready" : "placeholder"}
      data-map-active={active ? "true" : "false"}
      onMouseLeave={() => setActive(false)}
    >
      {showFrame ? (
        <iframe
          className="map-stage"
          title={title}
          src={mapWidgetUrl()}
          tabIndex={-1}
          loading="lazy"
          onLoad={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
      {interactive ? null : <div className="map-fallback">{label}</div>}
      {interactive ? (
        <>
          <div className={active ? "map-shield is-off" : "map-shield"} onClick={() => setActive(true)} />
          <button
            type="button"
            className="map-hint"
            tabIndex={active ? -1 : 0}
            aria-hidden={active}
            onClick={() => setActive(true)}
          >
            {hint}
          </button>
        </>
      ) : null}
    </div>
  );
}
