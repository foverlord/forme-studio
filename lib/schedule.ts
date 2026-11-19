import { classTemplates, type ClassTemplate, type Level } from "@/content/schedule";
import type { DirectionId } from "@/content/directions";
import { addDays, atTime, isClosedWeekday, nextOpenIso, parseHM, weekdayOf, zoned } from "@/lib/time";

export type Session = ClassTemplate & {
  sessionId: string;
  date: string;
  startsAt: number;
};

export type DirectionFilter = DirectionId | "all";

export type StripModel =
  | { kind: "today"; date: string; sessions: Session[] }
  | { kind: "tomorrow"; date: string; sessions: Session[] }
  | {
      kind: "weekend";
      /** The closed day the visitor is in. Sunday in the approved mockup. */
      closedIso: string;
      nextIso: string;
      nextWeekday: number;
      /** True when today itself is the closed day (not "Saturday night, Sunday ahead"). */
      todayIsClosed: boolean;
      sessions: Session[];
    };

export function sessionsOn(iso: string): Session[] {
  const weekday = weekdayOf(iso) as ClassTemplate["weekday"];
  return classTemplates
    .filter((item) => item.weekday === weekday)
    .map((item) => ({
      ...item,
      sessionId: `${item.id}@${iso}`,
      date: iso,
      startsAt: atTime(iso, item.start),
    }))
    .sort((a, b) => a.startsAt - b.startsAt || a.name.localeCompare(b.name, "ru"));
}

export function findSession(sessionId: string): Session | null {
  const [id, iso] = sessionId.split("@");
  if (!id || !iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return sessionsOn(iso).find((item) => item.id === id) ?? null;
}

export function upcoming(now: number, withinDays: number): Session[] {
  const start = zoned(new Date(now)).iso;
  const list: Session[] = [];
  for (let i = 0; i < withinDays; i += 1) {
    const iso = addDays(start, i);
    for (const session of sessionsOn(iso)) {
      if (session.startsAt > now) list.push(session);
    }
  }
  return list;
}

export function resolveStrip(now: number): StripModel {
  const zone = zoned(new Date(now));
  if (isClosedWeekday(zone.weekday)) {
    const nextIso = nextOpenIso(zone.iso);
    return {
      kind: "weekend",
      closedIso: zone.iso,
      nextIso,
      nextWeekday: weekdayOf(nextIso),
      todayIsClosed: true,
      sessions: sessionsOn(nextIso).slice(0, 3),
    };
  }
  const remaining = sessionsOn(zone.iso).filter((session) => session.startsAt > now);
  if (remaining.length > 0) {
    return { kind: "today", date: zone.iso, sessions: remaining.slice(0, 3) };
  }
  const tomorrow = addDays(zone.iso, 1);
  if (isClosedWeekday(weekdayOf(tomorrow))) {
    const nextIso = nextOpenIso(zone.iso);
    return {
      kind: "weekend",
      closedIso: zone.iso,
      nextIso,
      nextWeekday: weekdayOf(nextIso),
      todayIsClosed: false,
      sessions: sessionsOn(nextIso).slice(0, 3),
    };
  }
  return { kind: "tomorrow", date: tomorrow, sessions: sessionsOn(tomorrow).slice(0, 3) };
}

export function nearestTrial(now: number): Session | null {
  const future = upcoming(now, 14);
  return (
    future.find((session) => session.trial && session.seats > 0 && !session.demoFullOnSubmit) ??
    future.find((session) => session.seats > 0 && !session.demoFullOnSubmit) ??
    null
  );
}

export function alternatives(now: number, excludeId: string): Session[] {
  return upcoming(now, 14)
    .filter((session) => session.sessionId !== excludeId && session.seats > 0 && !session.demoFullOnSubmit)
    .slice(0, 2);
}

export function beginnerChoices(now: number, currentId: string | null): Session[] {
  const list = upcoming(now, 10).filter(
    (session) => (session.trial || session.level === "beginner") && session.seats > 0,
  );
  if (currentId) {
    const current = findSession(currentId);
    if (current && !list.some((session) => session.sessionId === current.sessionId)) {
      list.unshift(current);
    }
  }
  return list.slice(0, 8);
}

export function daySessions(iso: string, direction: DirectionFilter, now: number): Session[] {
  const today = zoned(new Date(now)).iso;
  return sessionsOn(iso).filter((session) => {
    if (direction !== "all" && session.directionId !== direction) return false;
    if (iso === today && session.startsAt <= now) return false;
    return true;
  });
}

export function nextWithDirection(
  fromIso: string,
  direction: DirectionFilter,
  now: number,
): { iso: string; session: Session } | null {
  for (let i = 1; i <= 14; i += 1) {
    const iso = addDays(fromIso, i);
    const session = daySessions(iso, direction, now)[0];
    if (session) return { iso, session };
  }
  return null;
}

export type DayPart = "morning" | "day" | "evening";

export function dayPart(start: string): DayPart {
  const minutes = parseHM(start);
  if (minutes < 12 * 60) return "morning";
  if (minutes < 17 * 60) return "day";
  return "evening";
}

export function isTrialPrice(level: Level, trial: boolean): boolean {
  return trial || level === "beginner";
}
