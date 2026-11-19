"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCopy, useLocalHref, useLocale } from "@/components/locale";
import { defaultDirectionId, getDirections, type DirectionId } from "@/content/directions";
import { photoFor } from "@/content/photos";

export function Directions() {
  const copy = useCopy();
  const href = useLocalHref();
  const locale = useLocale();
  const directions = getDirections(locale);
  const [selected, setSelected] = useState<DirectionId>(defaultDirectionId);
  const [switched, setSwitched] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const seen = useRef(false);
  const current = directions.find((item) => item.id === selected) ?? directions[2];
  const photo = photoFor(locale, current.photo);

  function scrollTab(node: HTMLButtonElement | null) {
    const scroller = scrollerRef.current;
    if (!node || !scroller) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = Math.max(0, node.offsetLeft - 20);
    const fullyVisible =
      node.offsetLeft >= scroller.scrollLeft + 20 &&
      node.offsetLeft + node.offsetWidth <= scroller.scrollLeft + scroller.clientWidth - 8;
    if (fullyVisible) return;
    scroller.scrollTo({ left, behavior: !seen.current || reduce ? "instant" : "smooth" });
    seen.current = true;
  }

  function move(next: DirectionId, focus: boolean) {
    if (next !== selected) setSwitched(true);
    setSelected(next);
    if (focus) {
      window.requestAnimationFrame(() => document.getElementById(`tab-${next}`)?.focus());
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const ids = directions.map((item) => item.id);
    const index = ids.indexOf(selected);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % ids.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + ids.length) % ids.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = ids.length - 1;
    else return;
    event.preventDefault();
    move(ids[next], true);
  }

  return (
    <section className="sec sandbg anchor" id="directions" tabIndex={-1}>
      <div className="wrap">
        <div className="sec-head reveal">
          <p className="cap">{copy.directions.kicker}</p>
          <h2 className="h2">{copy.directions.title}</h2>
        </div>
        <div className="tabs" role="tablist" aria-label={copy.directions.title} ref={scrollerRef} onKeyDown={onKeyDown}>
          {directions.map((item) => {
            const isSelected = item.id === selected;
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                className="tab"
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`panel-${item.id}`}
                tabIndex={isSelected ? 0 : -1}
                ref={isSelected ? scrollTab : undefined}
                onClick={() => move(item.id, false)}
              >
                {item.tab}
              </button>
            );
          })}
        </div>
        <div className="cat" key={current.id} role="tabpanel" id={`panel-${current.id}`} aria-labelledby={`tab-${current.id}`}>
          <div>
            <div className={switched ? "cat-img cat-photo-in" : "cat-img"}>
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                style={photo.objectPosition ? { objectPosition: photo.objectPosition } : undefined}
              />
            </div>
          </div>
          <div className={switched ? "cat-text-in" : undefined}>
            <h3 className="h3">{current.title}</h3>
            <p className="lead" style={{ marginTop: 12 }}>
              {current.lead}
            </p>
            <ol className="subs">
              {current.classes.map((item, index) => (
                <li key={item.name}>
                  <span className="n">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <b>{item.name}</b>
                    <span>{item.text}</span>
                    <span className="meta">{item.meta}</span>
                  </div>
                </li>
              ))}
            </ol>
            <Link className="btn btn-out" href={href(`/schedule?direction=${current.id}`)} style={{ marginTop: 24 }}>
              {current.scheduleLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
