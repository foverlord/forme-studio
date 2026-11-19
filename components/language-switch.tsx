"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCopy, useLocale } from "@/components/locale";
import { swapLocale, type Locale } from "@/lib/locale";

export function LanguageSwitch() {
  const copy = useCopy();
  const locale = useLocale();
  const pathname = usePathname() || "/";
  const [extra, setExtra] = useState("");

  useEffect(() => {
    const sync = () => setExtra(`${window.location.search}${window.location.hash}`);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  function hrefFor(target: Locale) {
    return `${swapLocale(pathname, "", "", target)}${extra}`;
  }

  return (
    <nav className="lang-switch" aria-label={copy.lang.group}>
      <a href={hrefFor("ru")} hrefLang="ru" lang="ru" aria-current={locale === "ru" ? "true" : undefined}>
        {copy.lang.ru}
      </a>
      <span className="lang-slash" aria-hidden="true">/</span>
      <a href={hrefFor("kk")} hrefLang="kk" lang="kk" aria-current={locale === "kk" ? "true" : undefined}>
        {copy.lang.kk}
      </a>
    </nav>
  );
}
