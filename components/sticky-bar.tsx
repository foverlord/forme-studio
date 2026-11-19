"use client";

import Link from "next/link";
import { useBarePath, useCopy, useLocalHref, useLocale } from "@/components/locale";
import { trialPrice } from "@/content/studio";

export function StickyBar() {
  const bare = useBarePath();
  const copy = useCopy();
  const href = useLocalHref();
  const locale = useLocale();
  const cta = locale === "kk" ? copy.book : copy.bookTrial;
  if (bare.startsWith("/booking")) return null;
  return (
    <>
      <div className="sticky-spacer" aria-hidden="true" />
      <div className="sticky">
        <div>
          <div className="meta">{copy.stickyLabel}</div>
          <div className="sum num">{trialPrice}</div>
        </div>
        <Link className="btn btn-cta" href={href("/booking")}>
          {cta}
        </Link>
      </div>
    </>
  );
}
