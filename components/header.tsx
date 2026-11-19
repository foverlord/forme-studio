"use client";

import Link from "next/link";
import { useActiveSection } from "@/components/active-section";
import { LanguageSwitch } from "@/components/language-switch";
import { useBarePath, useCopy, useLocalHref } from "@/components/locale";
import { useMenu } from "@/components/menu";
import { anchorId, scrollToAnchor } from "@/lib/anchor";

export function SiteHeader() {
  const copy = useCopy();
  const href = useLocalHref();
  const bare = useBarePath();
  const { open, openMenu } = useMenu();
  const home = bare === "/";
  const overlay = home;
  const onBooking = bare.startsWith("/booking");
  const section = useActiveSection(home);
  const active = bare.startsWith("/schedule") ? "schedule" : home ? section : null;

  return (
    <header className={overlay ? "hdr overlay on-photo" : "hdr solid"}>
      <div className="wrap">
        <Link href={href("/")} className="logo">
          {copy.logo}
        </Link>
        <span className="sp" />
        <nav className="nav" aria-label={copy.menuLabel}>
          {copy.nav.map((item) => {
            const itemHref = href(item.href);
            const isActive = item.id === "schedule" ? bare.startsWith("/schedule") : active === item.id;
            return (
              <Link
                key={item.id}
                href={itemHref}
                data-active={isActive ? "true" : undefined}
                aria-current={isActive ? "location" : undefined}
                onClick={(event) => {
                  const id = anchorId(itemHref);
                  if (!id || !home) return;
                  event.preventDefault();
                  scrollToAnchor(id);
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <span className="hdr-rule" aria-hidden="true" />
        <LanguageSwitch />
        {onBooking ? null : (
          <Link className="btn btn-cta" href={href("/booking")}>
            {copy.book}
          </Link>
        )}
        <button
          id="menu-button"
          className="burger"
          type="button"
          aria-label={copy.menuOpen}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={openMenu}
        >
          <i />
        </button>
      </div>
    </header>
  );
}
