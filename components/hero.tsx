"use client";

import Image from "next/image";
import Link from "next/link";
import { useCopy, useLocalHref, useLocale } from "@/components/locale";
import { fill } from "@/content/dictionary";
import { photoFor } from "@/content/photos";
import { trialPrice } from "@/content/studio";

export function Hero() {
  const copy = useCopy();
  const href = useLocalHref();
  const photo = photoFor(useLocale(), "hero");
  return (
    <section className="hero on-photo">
      <Image className="hero-img" src={photo.src} alt={photo.alt} fill priority sizes="100vw" />
      <div className="scrim" />
      <div className="wrap hin">
        <p className="cap kicker">{copy.hero.kicker}</p>
        <h1 className="display hero-in">
          {copy.hero.line1}
          <br />
          {copy.hero.line2}
        </h1>
        <p className="lead">{copy.hero.lead}</p>
        <div className="hero-desktop">
          <Link className="btn btn-out-light" href={href("/booking")}>
            {fill(copy.hero.trial, { price: trialPrice })}
          </Link>
          <Link className="btn btn-out-light" href={href("/schedule")}>
            {copy.schedule}
          </Link>
        </div>
        <Link className="link hero-mobile" href={href("/schedule")}>
          {copy.scheduleLink}
        </Link>
      </div>
    </section>
  );
}
