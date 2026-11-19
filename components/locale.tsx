"use client";

import { createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { getDictionary, type Dictionary } from "@/content/dictionary";
import { localizeHref, stripLocale, type Locale } from "@/lib/locale";

const LocaleContext = createContext<Locale>("ru");

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useCopy(): Dictionary {
  return getDictionary(useLocale());
}

export function useLocalHref(): (href: string) => string {
  const locale = useLocale();
  return (href: string) => localizeHref(locale, href);
}

/** Browser path with the locale prefix removed. `/kk` and `/` are both home. */
export function useBarePath(): string {
  const pathname = usePathname() || "/";
  return stripLocale(pathname);
}
