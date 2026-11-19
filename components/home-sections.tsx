"use client";

import { Fragment, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCopy, useLocalHref, useLocale } from "@/components/locale";
import { fill } from "@/content/dictionary";
import { photoFor } from "@/content/photos";
import { getAddress, getFacts, getFaq, getFirstSteps, getHoursRows, getPlans, mapDirectionsUrl, mapPoint, trialPrice } from "@/content/studio";
import { StudioMap } from "@/components/studio-map";
import { getTrainers } from "@/content/trainers";
import { useStudioTime } from "@/components/studio-time";
import { formatWeekdayIn, zoned } from "@/lib/time";

function revealDelay(index: number): CSSProperties {
  return { "--reveal-i": Math.min(index, 3) } as CSSProperties;
}

export function Intro() {
  const copy = useCopy();
  const facts = getFacts(useLocale());
  return (
    <section className="sec">
      <div className="wrap">
        <p className="cap">{copy.intro.kicker}</p>
        <p className="intro reveal" style={{ marginTop: 16 }}>
          {copy.intro.before}
          <em>{copy.intro.em1}</em>
          {copy.intro.mid}
          <em>{copy.intro.em2}</em>
          {copy.intro.after}
        </p>
        <div className="facts">
          {facts.map((fact, index) => (
            <div className="reveal" key={fact.label} style={revealDelay(index)}>
              <b>{fact.value}</b>
              <span>{fact.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pause() {
  const copy = useCopy();
  const photo = photoFor(useLocale(), "pause");
  return (
    <section className="pause on-photo">
      <Image className="reveal" src={photo.src} alt={photo.alt} fill sizes="100vw" />
      <div className="scrim" />
      <div className="wrap hin">
        <p className="cap" style={{ color: "var(--on-dark-muted)" }}>
          {copy.pause.kicker}
        </p>
        <h2 className="h2 reveal">{copy.pause.title}</h2>
      </div>
    </section>
  );
}

export function FirstVisit() {
  const copy = useCopy();
  const href = useLocalHref();
  const locale = useLocale();
  const firstSteps = getFirstSteps(locale);
  const faq = getFaq(locale);
  return (
    <section className="sec anchor" id="first-visit" tabIndex={-1}>
      <div className="wrap fv">
        <div>
          <p className="cap">{copy.first.kicker}</p>
          <h2 className="h2 reveal" style={{ margin: "12px 0 32px" }}>
            {copy.first.title}
          </h2>
          <ol className="steps">
            {firstSteps.map((step, index) => (
              <li className="reveal" key={step.title} style={revealDelay(index)}>
                <span className="n">0{index + 1}</span>
                <div>
                  <b>{step.title}</b>
                  <span>{step.text}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="trial">
          <p className="cap">{copy.first.cardKicker}</p>
          <p className="sum">{trialPrice}</p>
          <p style={{ color: "var(--muted)" }}>{copy.first.cardMeta}</p>
          <Link className="btn btn-out btn-block" href={href("/booking")} style={{ marginTop: 24 }}>
            {copy.first.cta}
          </Link>
          <dl className="faq">
            {faq.map((item) => (
              <div key={item.q}>
                <dt>{item.q}</dt>
                <dd>{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function Team() {
  const copy = useCopy();
  const locale = useLocale();
  const trainers = getTrainers(locale);
  return (
    <section className="sec surface-night anchor" id="trainers" tabIndex={-1}>
      <div className="wrap">
        <div className="sec-head reveal">
          <p className="cap">{copy.team.kicker}</p>
          <h2 className="h2">{copy.team.title}</h2>
        </div>
        <div className="team">
          {trainers.map((trainer, index) => {
            const photo = photoFor(locale, trainer.photo);
            return (
              <article className="tm reveal" key={trainer.id} style={revealDelay(index)}>
                <div className="tm-photo">
                  <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 768px) 25vw, 50vw" />
                </div>
                <h3 className="nm">{trainer.name}</h3>
                <p className="role">
                  {trainer.focus} · {trainer.years}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Prices() {
  const copy = useCopy();
  const href = useLocalHref();
  const plans = getPlans(useLocale());
  return (
    <section className="sec anchor" id="prices" tabIndex={-1}>
      <div className="wrap">
        <div className="sec-head reveal">
          <p className="cap">{copy.prices.kicker}</p>
          <h2 className="h2">{copy.prices.title}</h2>
        </div>
        <div className="prices">
          {plans.map((plan, index) => (
            <article className={plan.recommended ? "price rec reveal" : "price reveal"} key={plan.id} style={revealDelay(index)}>
              {plan.recommended ? <p className="cap">{copy.prices.recommended}</p> : null}
              <h3 className="h3 pn">{plan.name}</h3>
              <p className="pv">{plan.price}</p>
              <p className="pp">{plan.details}</p>
              <div className="sp3" />
              <Link className={plan.recommended ? "btn btn-light" : "btn btn-out"} href={href("/booking")}>
                {plan.action === "book" ? copy.prices.book : copy.prices.choose}
              </Link>
            </article>
          ))}
        </div>
        <p style={{ marginTop: 24, color: "var(--muted)" }}>{copy.prices.note}</p>
      </div>
    </section>
  );
}

export function About() {
  const copy = useCopy();
  const photo = photoFor(useLocale(), "interior");
  return (
    <section className="sec sandbg anchor" id="studio" tabIndex={-1}>
      <div className="wrap about">
        <div>
          <div className="about-photo reveal">
            <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" />
          </div>
        </div>
        <div>
          <p className="cap">{copy.about.kicker}</p>
          <h2 className="h2 reveal" style={{ margin: "12px 0 24px" }}>
            {copy.about.title}
          </h2>
          <p>{copy.about.p1}</p>
          <p>{copy.about.p2}</p>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  const copy = useCopy();
  const href = useLocalHref();
  const photo = photoFor(useLocale(), "final");
  return (
    <section className="sec sec-flush">
      <div className="wrap">
        <div className="final">
          <Image className="reveal" src={photo.src} alt={photo.alt} fill sizes="100vw" />
          <div className="card">
            <p className="cap">{copy.finalCta.kicker}</p>
            <h2 className="h2 reveal">{copy.finalCta.title}</h2>
            <p>{copy.finalCta.text}</p>
            <Link className="btn btn-out" href={href("/booking")}>
              {fill(copy.finalCta.button, { price: trialPrice })}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Contacts() {
  const copy = useCopy();
  const locale = useLocale();
  const address = getAddress(locale);
  const hoursRows = getHoursRows(locale);
  const { now, hydrated } = useStudioTime();
  const weekday = hydrated && now ? zoned(now).weekday : null;
  const short = hydrated && now ? formatWeekdayIn(zoned(now).iso, locale) : "";
  const mapTitle = fill(copy.contacts.mapTitle, { address: address.line });

  return (
    <section className="sec anchor" id="contacts" tabIndex={-1}>
      <div className="wrap contact">
        <div className="contact-copy">
          <p className="cap">{copy.contacts.kicker}</p>
          <h2 className="h2 reveal" style={{ margin: "12px 0 24px" }}>
            {copy.contacts.title}
          </h2>
          <p style={{ fontSize: 18 }}>{address.line}</p>
          <div className="hours">
            {hoursRows.map((row) => {
              const isToday = weekday != null && row.weekdays.includes(weekday);
              return (
                <Fragment key={row.label}>
                  <div>
                    <span>{row.label}</span>
                    <span>{row.time}</span>
                  </div>
                  {isToday ? (
                    <div className="is-today">
                      <span>
                        {copy.contacts.todayPrefix}, {short}
                      </span>
                      <span>{row.time}</span>
                    </div>
                  ) : null}
                </Fragment>
              );
            })}
          </div>
        </div>
        <StudioMap title={mapTitle} hint={copy.contacts.mapHint} label={copy.contacts.mapLabel} />
        <div className="contact-actions">
          <a className="btn btn-out" href={mapDirectionsUrl()} target="_blank" rel="noopener noreferrer">
            {copy.contacts.route}
          </a>
          <a className="btn btn-out" href={mapPoint.url} target="_blank" rel="noopener noreferrer">
            {copy.contacts.openMap}
          </a>
        </div>
      </div>
    </section>
  );
}
