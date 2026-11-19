import type { Locale } from "@/lib/locale";

export const TIME_ZONE = "Asia/Almaty";
const OFFSET = "+05:00";

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

export type Zoned = {
  iso: string;
  hour: number;
  minute: number;
  /** 0 Monday … 6 Sunday */
  weekday: number;
};

export function parseDemoNow(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "reset") return null;
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) return null;
  const parsed = new Date(`${match[1]}T${match[2]}:${match[3] ?? "00"}${OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function zoned(date: Date): Zoned {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return {
    iso: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAY_INDEX[parts.weekday] ?? 0,
  };
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00${OFFSET}`);
  date.setUTCDate(date.getUTCDate() + days);
  return zoned(date).iso;
}

export function weekdayOf(iso: string): number {
  return zoned(new Date(`${iso}T12:00:00${OFFSET}`)).weekday;
}

export function atTime(iso: string, hm: string): number {
  return new Date(`${iso}T${hm}:00${OFFSET}`).getTime();
}

export function parseHM(hm: string): number {
  const [hour, minute] = hm.split(":").map(Number);
  return hour * 60 + minute;
}

const DAY_LABEL: Record<Locale, readonly string[]> = {
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  kk: ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"],
};

const CLOSED: Record<Locale, string> = {
  ru: "выходной",
  kk: "демалыс",
};

export type StudioHoursRow = {
  label: string;
  time: string;
  /** 0 Monday … 6 Sunday */
  weekdays: number[];
};

/** Mon–Thu 07–22, Fri 07–21, Sat 09–20, Sun closed. Times are Asia/Almaty. */
const OPEN: Record<number, { open: string; close: string } | null> = {
  0: { open: "07:00", close: "22:00" },
  1: { open: "07:00", close: "22:00" },
  2: { open: "07:00", close: "22:00" },
  3: { open: "07:00", close: "22:00" },
  4: { open: "07:00", close: "21:00" },
  5: { open: "09:00", close: "20:00" },
  6: null,
};

/** Grouped studio hours. Footer and the contacts table both read this. */
export function studioHoursRows(locale: Locale = "ru"): StudioHoursRow[] {
  const labels = DAY_LABEL[locale];
  const closed = CLOSED[locale];
  const rows: StudioHoursRow[] = [];
  for (let day = 0; day <= 6; day += 1) {
    const slot = OPEN[day];
    const time = slot ? `${slot.open}–${slot.close}` : closed;
    const last = rows[rows.length - 1];
    if (last && last.time === time && last.weekdays[last.weekdays.length - 1] === day - 1) {
      last.weekdays.push(day);
      last.label = `${labels[last.weekdays[0]]}–${labels[day]}`;
    } else {
      rows.push({ label: labels[day], time, weekdays: [day] });
    }
  }
  return rows;
}

export function studioHoursText(locale: Locale = "ru"): string {
  const closed = CLOSED[locale];
  return studioHoursRows(locale)
    .map((row) => (row.time === closed ? `${row.label} ${closed}` : `${row.label} ${row.time}`))
    .join("\n");
}

export function isClosedWeekday(weekday: number): boolean {
  return OPEN[weekday] == null;
}

export function openStatus(date: Date): { open: boolean; close: string | null } {
  const zone = zoned(date);
  const hours = OPEN[zone.weekday];
  if (!hours) return { open: false, close: null };
  const nowMin = zone.hour * 60 + zone.minute;
  const open = nowMin >= parseHM(hours.open) && nowMin < parseHM(hours.close);
  return { open, close: hours.close };
}

export function nextOpenIso(fromIso: string): string {
  let iso = addDays(fromIso, 1);
  for (let i = 0; i < 7; i += 1) {
    if (!isClosedWeekday(weekdayOf(iso))) return iso;
    iso = addDays(iso, 1);
  }
  return iso;
}

function dateLocale(locale: Locale): string {
  return locale === "kk" ? "kk-KZ" : "ru-RU";
}

export function formatShort(iso: string, locale: Locale = "ru"): string {
  const date = new Date(`${iso}T12:00:00${OFFSET}`);
  const tag = dateLocale(locale);
  const weekday = new Intl.DateTimeFormat(tag, { timeZone: TIME_ZONE, weekday: "short" })
    .format(date)
    .replace(/\./g, "");
  const rest = new Intl.DateTimeFormat(tag, { timeZone: TIME_ZONE, day: "numeric", month: "long" }).format(date);
  return `${weekday}, ${rest}`;
}

export function formatLong(iso: string, locale: Locale = "ru"): string {
  const date = new Date(`${iso}T12:00:00${OFFSET}`);
  const text = new Intl.DateTimeFormat(dateLocale(locale), {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatWeekdayIn(iso: string, locale: Locale = "ru"): string {
  const date = new Date(`${iso}T12:00:00${OFFSET}`);
  const weekday = new Intl.DateTimeFormat(dateLocale(locale), { timeZone: TIME_ZONE, weekday: "short" })
    .format(date)
    .replace(/\./g, "");
  return weekday;
}

const DEMO_NOW_KEY = "forme-demo-now";
let cacheKey = "";
let cacheValue = 0;

function computeNow(): number {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("demoNow");
  if (query === "reset") {
    window.sessionStorage.removeItem(DEMO_NOW_KEY);
    return Date.now();
  }
  if (query) {
    const parsed = parseDemoNow(query);
    if (parsed) {
      window.sessionStorage.setItem(DEMO_NOW_KEY, query);
      return parsed.getTime();
    }
  }
  const stored = window.sessionStorage.getItem(DEMO_NOW_KEY);
  if (stored) {
    const parsed = parseDemoNow(stored);
    if (parsed) return parsed.getTime();
  }
  return Date.now();
}

/** Client clock. `?demoNow=2026-10-18T20:00` is Asia/Almaty wall time and sticks for the tab. */
export function getClientNow(): number {
  const stored = window.sessionStorage.getItem(DEMO_NOW_KEY) ?? "";
  const key = `${window.location.search}|${stored}|${window.location.pathname}`;
  if (key === cacheKey && cacheValue !== 0) return cacheValue;
  cacheValue = computeNow();
  cacheKey = `${window.location.search}|${window.sessionStorage.getItem(DEMO_NOW_KEY) ?? ""}|${window.location.pathname}`;
  return cacheValue;
}

export function getServerNow(): number {
  return 0;
}
