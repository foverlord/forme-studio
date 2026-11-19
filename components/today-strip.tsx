"use client";

import Link from "next/link";
import { useCopy, useLocalHref, useLocale } from "@/components/locale";
import { displayClassName } from "@/content/kk-copy";
import { fill } from "@/content/dictionary";
import { trialPrice } from "@/content/studio";
import { trainerById } from "@/content/trainers";
import { useStudioTime } from "@/components/studio-time";
import { resolveStrip, type Session } from "@/lib/schedule";
import { plural } from "@/lib/text";
import { bookingHref } from "@/lib/text";
import { formatShort, weekdayOf } from "@/lib/time";

function seatsText(count: number): string {
  const copy = useCopy();
  if (count <= 0) return copy.seats.none;
  return `${count} ${plural(count, copy.seats.one, copy.seats.few, copy.seats.many)}`;
}

function Skeleton() {
  const copy = useCopy();
  const href = useLocalHref();
  return (
    <div className="wrap today-wrap">
      <section className="today" aria-busy="true" aria-label={copy.today.loading}>
        <div className="top">
          <span className="cap">{copy.footer.hoursFallback}</span>
          <h2 className="h3">{copy.today.neutralTitle}</h2>
        </div>
        <div className="list">
          {[0, 1, 2].map((key) => (
            <div className="slot" key={key} aria-hidden="true">
              <div className="t">
                <div className="skel" style={{ width: 64, height: 24 }} />
              </div>
              <div>
                <div className="skel" style={{ width: 120, marginBottom: 8 }} />
                <div className="skel" style={{ width: 160 }} />
              </div>
              <div className="skel" style={{ width: 48, height: 48, borderRadius: 999 }} />
            </div>
          ))}
        </div>
        <div className="foot">
          <span>
            {copy.today.trialLead} <b className="num">{trialPrice}</b> {copy.today.trialTail}
          </span>
          <Link className="link" href={href("/schedule")} style={{ color: "var(--ink)" }}>
            {copy.allSchedule}
          </Link>
        </div>
      </section>
    </div>
  );
}

function Slot({ session }: { session: Session }) {
  const copy = useCopy();
  const locale = useLocale();
  const href = useLocalHref();
  const trainer = trainerById(session.trainerId, locale);
  const name = displayClassName(locale, session.name);
  return (
    <div className="slot">
      <div className="t">{session.start}</div>
      <div className="n">{name}</div>
      <div className="m">
        {trainer.short} · {session.durationMin} {copy.units.min} · {seatsText(session.seats)}
      </div>
      <Link
        className="icon-btn"
        href={href(bookingHref(session.sessionId))}
        aria-label={fill(copy.today.bookAria, { name, time: session.start })}
      >
        →
      </Link>
    </div>
  );
}

export function TodayStrip() {
  const copy = useCopy();
  const locale = useLocale();
  const href = useLocalHref();
  const { now, hydrated } = useStudioTime();
  if (!hydrated || !now) return <Skeleton />;

  const model = resolveStrip(now.getTime());
  let title = copy.today.todayTitle;
  let mobileCaption = "";
  let desktopCaption = "";

  if (model.kind === "today") {
    title = copy.today.todayTitle;
    mobileCaption = formatShort(model.date, locale);
    desktopCaption = mobileCaption;
  } else if (model.kind === "tomorrow") {
    title = copy.today.tomorrowTitle;
    mobileCaption = `${formatShort(model.date, locale)} · ${copy.today.finished}`;
    desktopCaption = mobileCaption;
  } else {
    title = fill(copy.today.inForme, { day: copy.weekdays.title[model.nextWeekday] });
    const closedWeekday = weekdayOf(model.closedIso);
    if (model.todayIsClosed && closedWeekday === 6) {
      mobileCaption = `${formatShort(model.closedIso, locale)} · ${copy.today.sundayLong}`;
      desktopCaption = copy.today.sundayShort;
    } else {
      mobileCaption = `${formatShort(model.nextIso, locale)} · ${copy.today.finished}`;
      desktopCaption = mobileCaption;
    }
  }

  return (
    <div className="wrap today-wrap">
      <section className="today" aria-live="polite">
        <div className="top">
          <span className="cap">
            <span className="cap-mobile">{mobileCaption}</span>
            <span className="cap-desktop">{desktopCaption}</span>
          </span>
          <h2 className="h3">{title}</h2>
        </div>
        <div className="list">
          {model.sessions.map((session) => (
            <Slot key={session.sessionId} session={session} />
          ))}
        </div>
        <div className="foot">
          <span>
            {copy.today.trialLead} <b className="num">{trialPrice}</b> {copy.today.trialTail}
          </span>
          <Link className="link" href={href("/schedule")} style={{ color: "var(--ink)" }}>
            {copy.allSchedule}
          </Link>
        </div>
      </section>
    </div>
  );
}
