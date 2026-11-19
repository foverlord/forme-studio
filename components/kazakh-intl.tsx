"use client";

import { useEffect, useState, type ReactNode } from "react";

let pending: Promise<void> | null = null;

function nativeKazakhMonths(): boolean {
  try {
    const month = new Intl.DateTimeFormat("kk-KZ", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 9, 15)));
    return month.toLocaleLowerCase("kk").includes("қаз");
  } catch {
    return false;
  }
}

function loadKazakhIntl(): Promise<void> {
  if (typeof window === "undefined" || nativeKazakhMonths()) return Promise.resolve();
  if (!pending) {
    pending = (async () => {
      const { DateTimeFormat: Polyfill } = await import("@formatjs/intl-datetimeformat");
      const Native = Intl.DateTimeFormat;
      function DateTimeFormat(this: Intl.DateTimeFormat, locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions) {
        const list = Array.isArray(locales) ? locales : [locales];
        const first = list[0] ? String(list[0]) : "";
        if (first.toLowerCase().startsWith("kk")) return new Polyfill(locales as string, options);
        return new Native(locales, options);
      }
      DateTimeFormat.prototype = Native.prototype;
      DateTimeFormat.supportedLocalesOf = Native.supportedLocalesOf;
      DateTimeFormat.__addLocaleData = Polyfill.__addLocaleData;
      DateTimeFormat.__addTZData = Polyfill.__addTZData;
      Intl.DateTimeFormat = DateTimeFormat as unknown as typeof Intl.DateTimeFormat;
      await import("@formatjs/intl-datetimeformat/add-golden-tz.js");
      await import("@formatjs/intl-datetimeformat/locale-data/kk.js");
    })();
  }
  return pending;
}

/**
 * Some Chromium builds list kk-KZ as supported and still format months in English.
 * Kazakh formatting goes through CLDR data. en-GB, used for the studio clock, stays native.
 */
export function KazakhIntl({ children }: { children: ReactNode }) {
  const [, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadKazakhIntl().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return children;
}
