"use client";

import Link from "next/link";
import { useCopy, useLocalHref, useLocale } from "@/components/locale";
import { fill } from "@/content/dictionary";
import { getAddress } from "@/content/studio";
import { useStudioTime } from "@/components/studio-time";
import { openStatus } from "@/lib/time";

export function SiteFooter() {
  const copy = useCopy();
  const href = useLocalHref();
  const address = getAddress(useLocale());
  const { now, hydrated } = useStudioTime();
  let status = copy.footer.hoursFallback;
  if (hydrated && now) {
    const state = openStatus(now);
    status = state.open && state.close ? fill(copy.footer.openUntil, { time: state.close }) : copy.footer.closed;
  }
  return (
    <footer className="site surface-night">
      <div className="wrap">
        <div className="top">
          <Link href={href("/")} className="logo">
            {copy.logo}
          </Link>
          <span className="status num">{status}</span>
        </div>
        <div className="cols">
          <div>
            <h2>{copy.footer.aboutTitle}</h2>
            <p>
              {copy.footer.about}
              <br />
              {address.footerLine}
            </p>
          </div>
          <div>
            <h2>{copy.footer.studioTitle}</h2>
            {copy.nav.slice(0, 4).map((item) => (
              <Link key={item.id} href={href(item.href)}>
                {item.label}
              </Link>
            ))}
          </div>
          <div>
            <h2>{copy.footer.contactTitle}</h2>
            <p>
              {fill(copy.footer.phoneNote, { phone: address.phone })}
              <br />
              {copy.footer.social}
            </p>
          </div>
          <div>
            <h2>{copy.footer.hoursTitle}</h2>
            <p className="num" style={{ whiteSpace: "pre-line" }}>
              {copy.footer.hours}
            </p>
          </div>
        </div>
        <p className="legal">{copy.footer.legal}</p>
      </div>
    </footer>
  );
}
