"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitch } from "@/components/language-switch";
import { useCopy, useLocalHref } from "@/components/locale";
import { fill } from "@/content/dictionary";
import { trialPrice } from "@/content/studio";
import { anchorId, scrollToAnchor } from "@/lib/anchor";
import { stripLocale } from "@/lib/locale";

type MenuApi = { open: boolean; openMenu: () => void; closeMenu: (opts?: { restoreFocus?: boolean }) => void };

const MenuContext = createContext<MenuApi | null>(null);

export function useMenu(): MenuApi {
  const value = useContext(MenuContext);
  if (!value) throw new Error("MenuProvider missing");
  return value;
}

let touchBlock: ((event: TouchEvent) => void) | null = null;
let lockFrame = 0;

function blockMenuTouch(event: TouchEvent) {
  const menu = document.getElementById("mobile-menu");
  if (menu?.contains(event.target as Node) && menu.scrollHeight > menu.clientHeight + 1) return;
  event.preventDefault();
}

function lockScroll() {
  if (document.documentElement.dataset.scrollLock != null) return;
  const y = window.scrollY;
  const height = document.documentElement.scrollHeight;
  document.documentElement.dataset.scrollLock = String(y);
  const body = document.body;
  body.style.position = "fixed";
  body.style.top = `-${y}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  document.documentElement.style.overflow = "hidden";
  document.documentElement.style.overflowAnchor = "none";
  // position:fixed clamps window.scrollY to 0. A spacer keeps the real offset so
  // closing an anchor link can restore it in the same turn, before smooth scroll.
  const spacer = document.createElement("div");
  spacer.setAttribute("data-scroll-lock-spacer", "");
  spacer.setAttribute("aria-hidden", "true");
  spacer.style.height = `${height}px`;
  spacer.style.pointerEvents = "none";
  document.documentElement.appendChild(spacer);
  window.scrollTo({ top: y, left: 0, behavior: "instant" });
  touchBlock = blockMenuTouch;
  document.addEventListener("touchmove", touchBlock, { passive: false });
}

function unlockScroll() {
  const raw = document.documentElement.dataset.scrollLock;
  if (raw == null) {
    document.documentElement.style.overflow = "";
    return;
  }
  const y = Number(raw);
  if (touchBlock) {
    document.removeEventListener("touchmove", touchBlock);
    touchBlock = null;
  }
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.closest("#mobile-menu")) active.blur();
  const html = document.documentElement;
  const previousBehavior = html.style.scrollBehavior;
  // CSS scroll-behavior:smooth would animate the restore and the per-frame trace would see 0.
  html.style.scrollBehavior = "auto";
  const body = document.body;
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  window.scrollTo({ top: y, left: 0, behavior: "instant" });
  document.querySelector("[data-scroll-lock-spacer]")?.remove();
  html.style.overflow = "";
  html.style.overflowAnchor = "";
  delete html.dataset.scrollLock;
  window.scrollTo({ top: y, left: 0, behavior: "instant" });
  html.style.scrollBehavior = previousBehavior;
}

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  const copy = useCopy();
  const href = useLocalHref();
  const home = stripLocale(pathname) === "/";

  useEffect(() => {
    return () => unlockScroll();
  }, []);

  function holdLockedScroll() {
    const raw = document.documentElement.dataset.scrollLock;
    if (raw == null) return;
    const y = Number(raw);
    if (window.scrollY !== y) window.scrollTo({ top: y, left: 0, behavior: "instant" });
  }

  useLayoutEffect(() => {
    if (!open) return;
    holdLockedScroll();
  }, [open]);

  function openMenu() {
    lockScroll();
    setOpen(true);
    lockFrame = window.requestAnimationFrame(() => {
      lockFrame = 0;
      if (document.documentElement.dataset.scrollLock == null) return;
      document.getElementById("menu-close")?.focus({ preventScroll: true });
      holdLockedScroll();
    });
  }

  function closeMenu(opts?: { restoreFocus?: boolean }) {
    if (lockFrame) {
      window.cancelAnimationFrame(lockFrame);
      lockFrame = 0;
    }
    unlockScroll();
    setOpen(false);
    if (opts?.restoreFocus !== false) {
      window.requestAnimationFrame(() => document.getElementById("menu-button")?.focus({ preventScroll: true }));
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key !== "Tab") return;
    const root = event.currentTarget;
    const items = Array.from(root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <MenuContext.Provider value={{ open, openMenu, closeMenu }}>
      <div inert={open ? true : undefined}>
        <a className="skip" href="#content">
          {copy.skip}
        </a>
        {children}
      </div>
      {open ? (
        <div
          id="mobile-menu"
          className="menu"
          role="dialog"
          aria-modal="true"
          aria-label={copy.menuLabel}
          onKeyDown={onKeyDown}
        >
          <div className="menu-top">
            <Link href={href("/")} className="logo" onClick={() => closeMenu({ restoreFocus: false })}>
              {copy.logo}
            </Link>
            <button id="menu-close" className="burger" type="button" aria-label={copy.menuClose} onClick={() => closeMenu()}>
              ✕
            </button>
          </div>
          <nav>
            {copy.menu.map((item) => {
              const itemHref = href(item.href);
              return (
                <Link
                  key={item.id}
                  href={itemHref}
                  onClick={(event) => {
                    const id = anchorId(itemHref);
                    closeMenu({ restoreFocus: false });
                    if (!id || !home) return;
                    event.preventDefault();
                    window.requestAnimationFrame(() => {
                      window.requestAnimationFrame(() => scrollToAnchor(id));
                    });
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="menu-lang-row">
            <LanguageSwitch />
          </div>
          <div className="menu-foot">
            <Link className="btn btn-cta btn-block" href={href("/booking")} onClick={() => closeMenu({ restoreFocus: false })}>
              {fill(copy.bookTrialPrice, { price: trialPrice })}
            </Link>
          </div>
        </div>
      ) : null}
    </MenuContext.Provider>
  );
}
