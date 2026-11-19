"use client";

import { useState } from "react";
import Link from "next/link";
import { directionById, getDirections, type DirectionId } from "@/content/directions";
import { useCopy, useLocalHref, useLocale } from "@/components/locale";
import { fill } from "@/content/dictionary";
import { displayClassName, displayHall } from "@/content/kk-copy";
import { trainerById } from "@/content/trainers";
import { useStudioTime } from "@/components/studio-time";
import {
  dayPart,
  daySessions,
  nextWithDirection,
  type DirectionFilter,
  type Session,
} from "@/lib/schedule";
import { bookingHref, plural } from "@/lib/text";
import { addDays, formatLong, isClosedWeekday, weekdayOf, zoned } from "@/lib/time";

const DAY_COUNT = 7;

const DIRECTION_IDS: DirectionId[] = ["strength", "functional", "yoga", "mobility", "recovery"];

function seatsText(count: number): string {
  const copy = useCopy();
  if (count <= 0) return copy.seats.none;
  return `${count} ${plural(count, copy.seats.one, copy.seats.few, copy.seats.many)}`;
}

function parseDirection(value: string | null): DirectionFilter {
  if (value && DIRECTION_IDS.includes(value as DirectionId)) return value as DirectionId;
  return "all";
}

export function ScheduleBoard() {
  const copy = useCopy();
  const locale = useLocale();
  const directions = getDirections(locale);
  const { now, hydrated } = useStudioTime();
  const [day, setDay] = useState<string | null>(null);
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [ready, setReady] = useState(false);

  if (hydrated && now && !ready) {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get("day");
    const today = zoned(now).iso;
    setDay(fromQuery && /^\d{4}-\d{2}-\d{2}$/.test(fromQuery) ? fromQuery : today);
    setDirection(parseDirection(params.get("direction")));
    setReady(true);
  }

  function sync(nextDay: string, nextDirection: DirectionFilter) {
    const url = new URL(window.location.href);
    url.searchParams.set("day", nextDay);
    if (nextDirection === "all") url.searchParams.delete("direction");
    else url.searchParams.set("direction", nextDirection);
    window.history.replaceState(null, "", url);
  }

  if (!ready || !now || !day) {
    return (
      <section className="sec" style={{ paddingTop: 48 }} aria-busy="true">
        <div className="wrap">
          <p className="cap">{copy.schedulePage.kicker}</p>
          <h1 className="page-title">{copy.schedulePage.title}</h1>
          <div className="days" aria-hidden="true">
            {Array.from({ length: DAY_COUNT }, (_, index) => (
              <div className="day" key={index}>
                <span className="skel" style={{ width: 28, height: 10, marginBottom: 6 }} />
                <span className="skel" style={{ width: 20, height: 16 }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const today = zoned(now).iso;
  const days = Array.from({ length: DAY_COUNT }, (_, index) => addDays(today, index));
  const selected = days.includes(day) ? day : today;
  const sessions = daySessions(selected, direction, now.getTime());
  const closed = isClosedWeekday(weekdayOf(selected));
  const directionInfo = direction === "all" ? null : directionById(direction, locale);
  const countLabel = `${sessions.length} ${plural(sessions.length, copy.units.classesOne, copy.units.classesFew, copy.units.classesMany)}`;
  const parts: Array<"morning" | "day" | "evening"> = ["morning", "day", "evening"];
  const partLabel = { morning: copy.schedulePage.morning, day: copy.schedulePage.day, evening: copy.schedulePage.evening };
  const nearest = sessions.length === 0 ? nextWithDirection(selected, direction, now.getTime()) : null;

  return (
    <section className="sec" style={{ paddingTop: 48 }}>
      <div className="wrap">
        <p className="cap">{copy.schedulePage.kicker}</p>
        <h1 className="page-title">{copy.schedulePage.title}</h1>
        <div className="days" role="group" aria-label={copy.schedulePage.days}>
          {days.map((iso) => {
            const weekday = weekdayOf(iso);
            const isToday = iso === today;
            const isSel = iso === selected;
            const label = isToday ? copy.schedulePage.today : copy.weekdays.short[weekday];
            return (
              <button
                key={iso}
                type="button"
                className={`day${isSel ? " sel" : ""}${isToday ? " now" : ""}${weekday === 6 ? " off" : ""}`}
                aria-pressed={isSel}
                onClick={() => {
                  setDay(iso);
                  sync(iso, direction);
                }}
              >
                {label}
                <b>{Number(iso.slice(8))}</b>
                {weekday === 6 ? <span className="cap">{copy.schedulePage.off}</span> : null}
              </button>
            );
          })}
        </div>
        <div className="chips" role="group" aria-label={copy.schedulePage.directions}>
          <button
            type="button"
            className={direction === "all" ? "chip on" : "chip"}
            aria-pressed={direction === "all"}
            onClick={() => {
              setDirection("all");
              sync(selected, "all");
            }}
          >
            {direction === "all" ? "✓ " : ""}
            {copy.schedulePage.all}
          </button>
          {directions.map((item) => {
            const on = direction === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={on ? "chip on" : "chip"}
                aria-pressed={on}
                onClick={() => {
                  setDirection(item.id);
                  sync(selected, item.id);
                }}
              >
                {on ? "✓ " : ""}
                {item.tab}
              </button>
            );
          })}
        </div>
        <p className="result">
          {formatLong(selected, locale)} · {directionInfo ? directionInfo.tab : copy.schedulePage.all} · {countLabel}
          {direction !== "all" ? (
            <>
              {" · "}
              <button
                type="button"
                className="link"
                style={{ color: "var(--ink)" }}
                onClick={() => {
                  setDirection("all");
                  sync(selected, "all");
                }}
              >
                {copy.schedulePage.reset}
              </button>
            </>
          ) : null}
        </p>
        {sessions.length === 0 ? (
          <div className="empty">
            <h2 className="h3">{closed ? copy.schedulePage.emptySunday : copy.schedulePage.emptyDay}</h2>
            {nearest ? (
              <p style={{ color: "var(--muted)", margin: "8px 0 16px" }}>
                {directionInfo
                  ? `${directionInfo.nearestPhrase} — ${formatLong(nearest.iso, locale).charAt(0).toLowerCase()}${formatLong(nearest.iso, locale).slice(1)}, ${nearest.session.start}.`
                  : fill(copy.schedulePage.nearestAny, {
                      when: `${formatLong(nearest.iso, locale).charAt(0).toLowerCase()}${formatLong(nearest.iso, locale).slice(1)}, ${nearest.session.start}`,
                    })}
              </p>
            ) : null}
            {nearest ? (
              <button
                type="button"
                className="link"
                onClick={() => {
                  setDay(nearest.iso);
                  sync(nearest.iso, direction);
                }}
              >
                {fill(copy.schedulePage.showDay, { day: copy.weekdays.long[weekdayOf(nearest.iso)] })}
              </button>
            ) : null}
          </div>
        ) : (
          parts.map((part) => {
            const group = sessions.filter((session) => dayPart(session.start) === part);
            if (group.length === 0) return null;
            return (
              <div key={part}>
                <p className="cap part">{partLabel[part]}</p>
                {group.map((session) => (
                  <ClassRow key={session.sessionId} session={session} />
                ))}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function ClassRow({ session }: { session: Session }) {
  const copy = useCopy();
  const locale = useLocale();
  const href = useLocalHref();
  const trainer = trainerById(session.trainerId, locale);
  const name = displayClassName(locale, session.name);
  const full = session.seats <= 0;
  const low = session.seats > 0 && session.seats <= 3;
  return (
    <article className="row">
      <div className="t">
        {session.start}
        <small>
          {session.durationMin} {copy.units.min}
        </small>
      </div>
      <div>
        <p className="n">{name}</p>
        <p className="m">
          {trainer.name} · {displayHall(locale, session.hall)}
        </p>
      </div>
      <div className="x">
        <span>
          {session.level === "beginner" ? <span className="tag">{copy.levels.beginner}</span> : null}
          {session.level === "intermediate" ? <span className="tag o">{copy.levels.intermediate}</span> : null}{" "}
          <span className={full || low ? "seats low" : "seats"}>{seatsText(session.seats)}</span>
        </span>
        {full ? (
          <Link className="btn btn-muted" href={href(bookingHref(session.sessionId, { intent: "waitlist" }))}>
            {copy.schedulePage.waitlist}
          </Link>
        ) : (
          <Link className="btn btn-out" href={href(bookingHref(session.sessionId))}>
            {copy.schedulePage.book}
          </Link>
        )}
      </div>
    </article>
  );
}
