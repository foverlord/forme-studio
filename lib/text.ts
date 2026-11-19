export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  const n10 = abs % 10;
  const n100 = abs % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

export function formatPhone(input: string): string {
  const trimmed = input.trim();
  let digits = input.replace(/\D/g, "");
  if (trimmed.startsWith("+")) {
    if (digits.startsWith("7")) digits = digits.slice(1);
  } else if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)];
  let out = "+7";
  if (parts[0]) out += ` ${parts[0]}`;
  if (parts[1]) out += ` ${parts[1]}`;
  if (parts[2]) out += ` ${parts[2]}`;
  if (parts[3]) out += ` ${parts[3]}`;
  return out;
}

export function nationalDigits(formatted: string): string {
  const digits = formatted.replace(/\D/g, "");
  return digits.startsWith("7") ? digits.slice(1) : digits;
}

export type PhoneError = "empty" | "short" | "prefix";

export function phoneError(formatted: string): PhoneError | null {
  const national = nationalDigits(formatted);
  if (national.length === 0) return "empty";
  if (national.length < 10) return "short";
  if (!national.startsWith("7")) return "prefix";
  return null;
}

export function bookingHref(sessionId?: string, extra?: Record<string, string>): string {
  const params = new URLSearchParams();
  if (sessionId) params.set("session", sessionId);
  if (extra) {
    for (const [key, value] of Object.entries(extra)) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/booking?${query}` : "/booking";
}
