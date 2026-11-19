export type Locale = "ru" | "kk";

export function localeFromPathname(pathname: string): Locale {
  return pathname === "/kk" || pathname.startsWith("/kk/") ? "kk" : "ru";
}

/** Path without the `/kk` prefix. Home is always `/`. */
export function stripLocale(pathname: string): string {
  if (pathname === "/kk") return "/";
  if (pathname.startsWith("/kk/")) {
    const rest = pathname.slice(3);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return pathname || "/";
}

/** Prefix an internal href for the Kazakh tree. Russian hrefs stay as authored. */
export function localizeHref(locale: Locale, href: string): string {
  if (locale === "ru" || !href.startsWith("/")) return href;
  const hashAt = href.indexOf("#");
  const hash = hashAt >= 0 ? href.slice(hashAt) : "";
  const before = hashAt >= 0 ? href.slice(0, hashAt) : href;
  const queryAt = before.indexOf("?");
  const path = queryAt >= 0 ? before.slice(0, queryAt) : before;
  const query = queryAt >= 0 ? before.slice(queryAt) : "";
  const prefixed = path === "" || path === "/" ? "/kk" : `/kk${path}`;
  return `${prefixed}${query}${hash}`;
}

/** Same page in the other locale, including the current query and hash. */
export function swapLocale(pathname: string, search: string, hash: string, target: Locale): string {
  const bare = stripLocale(pathname);
  const path = target === "kk" ? (bare === "/" ? "/kk" : `/kk${bare}`) : bare;
  const query = search && search !== "?" ? (search.startsWith("?") ? search : `?${search}`) : "";
  const fragment = hash && hash !== "#" ? (hash.startsWith("#") ? hash : `#${hash}`) : "";
  return `${path}${query}${fragment}`;
}
