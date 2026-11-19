import type { ReactNode } from "react";
import { geologica, onest } from "@/app/fonts";
import "@/app/globals.css";
import { KazakhIntl } from "@/components/kazakh-intl";
import { LocaleProvider } from "@/components/locale";
import { MenuProvider } from "@/components/menu";
import { SiteFooter } from "@/components/footer";
import { StickyBar } from "@/components/sticky-bar";
import { StudioTimeProvider } from "@/components/studio-time";
import type { Locale } from "@/lib/locale";

const markJs = `document.documentElement.classList.add("js");`;

/** Marks headings already on screen before first paint so they do not fade in. */
const markVisible = `(function(){
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nodes = document.querySelectorAll(".reveal");
  var view = window.innerHeight || document.documentElement.clientHeight;
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    var rect = el.getBoundingClientRect();
    var visible = Math.min(rect.bottom, view) - Math.max(rect.top, 0);
    if (reduce || (rect.height > 0 && visible / rect.height >= 0.15)) el.classList.add("is-in", "no-anim");
  }
})();`;

function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <StudioTimeProvider>
      <LocaleProvider locale={locale}>
        <MenuProvider>
          {children}
          <SiteFooter />
          <StickyBar />
        </MenuProvider>
      </LocaleProvider>
    </StudioTimeProvider>
  );
}

export function RootDocument({ locale, children }: { locale: Locale; children: ReactNode }) {
  const app = <Providers locale={locale}>{children}</Providers>;
  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${geologica.variable} ${onest.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: markJs }} />
        {locale === "kk" ? <KazakhIntl>{app}</KazakhIntl> : app}
        <script dangerouslySetInnerHTML={{ __html: markVisible }} />
      </body>
    </html>
  );
}
