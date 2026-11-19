import { phoneError } from "@/lib/text";

export const BOOKING_MIN_MS = 3000;
export const BOOKING_LIMIT = 5;
export const BOOKING_WINDOW_MS = 10 * 60 * 1000;
export const TELEGRAM_TIMEOUT_MS = 8000;

export type BookingResult = {
  status: number;
  body: { ok: true } | { error: "invalid" | "too_fast" | "rate_limited" | "unavailable" };
};

type Env = { token?: string; chatId?: string };

export type BookingDeps = {
  fetchImpl?: typeof fetch;
  now?: number;
  timeoutMs?: number;
  env?: Env;
  ip?: string;
};

const hits = new Map<string, number[]>();

export function resetBookingRateLimit(): void {
  hits.clear();
}

function oneLine(value: string): string {
  return value.replace(/[\u0000-\u001f]+/g, " ").trim();
}

function stringField(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = oneLine(value);
  if (!text || text.length > max) return null;
  return text;
}

function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function astanaStamp(now: number): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(now));
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("day")}.${pick("month")}.${pick("year")} ${pick("hour")}:${pick("minute")}`;
}

function limited(ip: string, now: number): boolean {
  const recent = (hits.get(ip) ?? []).filter((stamp) => now - stamp < BOOKING_WINDOW_MS);
  if (recent.length >= BOOKING_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function invalid(): BookingResult {
  return { status: 400, body: { error: "invalid" } };
}

function unavailable(): BookingResult {
  return { status: 502, body: { error: "unavailable" } };
}

export async function submitBooking(input: unknown, deps: BookingDeps = {}): Promise<BookingResult> {
  if (!input || typeof input !== "object") return invalid();
  const record = input as Record<string, unknown>;
  if (typeof record.company === "string" && record.company.trim() !== "") {
    return { status: 200, body: { ok: true } };
  }

  const name = stringField(record.name, 80);
  const phone = typeof record.phone === "string" ? record.phone.trim() : "";
  const className = stringField(record.className, 120) ?? stringField(record.class, 120);
  const date = stringField(record.date, 10);
  const time = stringField(record.time, 5);
  const locale = record.locale === "ru" || record.locale === "kk" ? record.locale : null;
  const startedAt = typeof record.startedAt === "number" && Number.isFinite(record.startedAt) ? record.startedAt : null;

  if (!name || name.length < 2 || !className || !date || !isDate(date) || !time || !isTime(time) || !locale || startedAt == null) {
    return invalid();
  }
  if (phone.length > 20 || phoneError(phone)) return invalid();

  const now = deps.now ?? Date.now();
  if (startedAt > now + 60_000 || now - startedAt > 24 * 60 * 60 * 1000) return invalid();
  if (now - startedAt < BOOKING_MIN_MS) return { status: 400, body: { error: "too_fast" } };

  const ip = (deps.ip || "unknown").slice(0, 64);
  if (limited(ip, now)) return { status: 429, body: { error: "rate_limited" } };

  const token = deps.env?.token;
  const chatId = deps.env?.chatId;
  if (!token || !chatId) return unavailable();

  const text = [
    "Заявка FORME",
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    `Занятие: ${className}`,
    `Дата: ${date}`,
    `Время: ${time}`,
    `Язык: ${locale}`,
    `Время заявки: ${astanaStamp(now)} (Астана)`,
  ].join("\n");

  const timeoutMs = deps.timeoutMs ?? TELEGRAM_TIMEOUT_MS;
  try {
    const response = await (deps.fetchImpl ?? fetch)(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null;
    if (!response.ok || payload?.ok !== true) return unavailable();
  } catch {
    return unavailable();
  }
  return { status: 200, body: { ok: true } };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return (first || request.headers.get("x-real-ip") || "unknown").slice(0, 64);
}
