import { getDictionary } from "@/content/dictionary";
import { clientIp, submitBooking, type BookingResult } from "@/lib/booking-api";
import { whatsAppGreetingHref } from "@/lib/whatsapp";

// Node.js is the only runtime Cache Components allows. The `runtime` segment
// config is rejected while that flag is on, so this handler stays on Node by default.

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function htmlResult(result: BookingResult, locale: "ru" | "kk"): Response {
  const copy = getDictionary(locale);
  const title = result.status === 200 ? copy.booking.delivered.title : copy.booking.sendError.title;
  const text =
    result.status === 200
      ? copy.booking.delivered.text
      : result.status === 429
        ? copy.booking.sendError.rateLimit
        : copy.booking.sendError.text;
  const href = whatsAppGreetingHref(copy.booking.whatsappTemplate);
  const body = `<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><body style="font:16px/1.5 sans-serif;padding:32px;max-width:36rem"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p><p><a href="${escapeHtml(href)}">${escapeHtml(copy.booking.sendError.whatsapp)}</a></p></body></html>`;
  return new Response(body, {
    status: result.status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function POST(request: Request): Promise<Response> {
  const type = request.headers.get("content-type") ?? "";
  let input: unknown;
  try {
    if (type.includes("application/json")) input = await request.json();
    else {
      const form = await request.formData();
      const started = form.get("startedAt");
      input = {
        name: form.get("name"),
        phone: form.get("phone"),
        className: form.get("class_name"),
        date: form.get("date"),
        time: form.get("time"),
        locale: form.get("locale"),
        company: form.get("company"),
        startedAt: typeof started === "string" && started ? Number(started) : undefined,
      };
    }
  } catch {
    input = null;
  }

  const result = await submitBooking(input, {
    ip: clientIp(request),
    env: {
      token: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
    },
  });

  const locale = input && typeof input === "object" && (input as { locale?: string }).locale === "kk" ? "kk" : "ru";
  if (!type.includes("application/json")) return htmlResult(result, locale);
  return Response.json(result.body, { status: result.status, headers: { "cache-control": "no-store" } });
}
