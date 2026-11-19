import type { Metadata } from "next";
import { getDictionary } from "@/content/dictionary";
import type { Locale } from "@/lib/locale";

/** Preview origin for absolute canonical and hreflang. The site is not deployed. */
export const SITE_ORIGIN = "https://forme.studio";

export type SeoPage = "home" | "schedule" | "booking";

const BARE: Record<SeoPage, string> = {
  home: "/",
  schedule: "/schedule",
  booking: "/booking",
};

export function localePath(locale: Locale, page: SeoPage): string {
  const bare = BARE[page];
  if (locale === "ru") return bare;
  return bare === "/" ? "/kk" : `/kk${bare}`;
}

export function pageMetadata(locale: Locale, page: SeoPage): Metadata {
  const copy = getDictionary(locale);
  const title = page === "home" ? copy.meta.title : page === "schedule" ? copy.meta.scheduleTitle : copy.meta.bookingTitle;
  const description = copy.meta.description;
  return {
    title: page === "home" ? { absolute: title } : title,
    description,
    alternates: {
      canonical: localePath(locale, page),
      languages: {
        ru: BARE[page],
        kk: localePath("kk", page),
        "x-default": BARE[page],
      },
    },
    openGraph: {
      title,
      description,
      locale: locale === "kk" ? "kk_KZ" : "ru_RU",
      type: "website",
    },
  };
}

export function rootMetadata(locale: Locale): Metadata {
  const copy = getDictionary(locale);
  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: { default: copy.meta.title, template: "%s — FORME Studio" },
    description: copy.meta.description,
    openGraph: {
      title: copy.meta.title,
      description: copy.meta.description,
      locale: locale === "kk" ? "kk_KZ" : "ru_RU",
      type: "website",
    },
    robots: { index: false, follow: false },
    alternates: pageMetadata(locale, "home").alternates,
  };
}
