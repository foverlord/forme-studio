import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { POST } from "../app/api/booking/route.ts";
import {
  BOOKING_LIMIT,
  BOOKING_MIN_MS,
  TELEGRAM_TIMEOUT_MS,
  resetBookingRateLimit,
  submitBooking,
} from "../lib/booking-api.ts";

const token = "test-token-not-real";
const chatId = "1001";
const env = { token, chatId };

function body(now, patch = {}) {
  return {
    name: "Алия",
    phone: "+7 701 234 56 78",
    className: "Таңғы йога",
    date: "2026-10-22",
    time: "07:30",
    locale: "kk",
    startedAt: now - BOOKING_MIN_MS - 50,
    company: "",
    ...patch,
  };
}

afterEach(() => {
  resetBookingRateLimit();
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
});

test("success sends escaped plain text and hides the token", async () => {
  const calls = [];
  const result = await submitBooking(body(1_000_000, { name: "Алия <b>&", phone: "+7 701 234 56 78" }), {
    now: 1_000_000,
    ip: "203.0.113.10",
    env,
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), body: JSON.parse(init.body) });
      return { ok: true, json: async () => ({ ok: true }) };
    },
  });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { ok: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.chat_id, chatId);
  assert.equal(calls[0].body.parse_mode, undefined);
  assert.match(calls[0].body.text, /Алия <b>&/);
  assert.match(calls[0].body.text, /Таңғы йога/);
  assert.match(calls[0].body.text, /2026-10-22/);
  assert.match(calls[0].body.text, /07:30/);
  assert.match(calls[0].body.text, /Язык: kk/);
  assert.match(calls[0].body.text, /Астана/);
  assert.equal(JSON.stringify(result).includes(token), false);
  assert.equal(calls[0].url.includes(token), true);
  assert.equal(TELEGRAM_TIMEOUT_MS, 8000);
});

test("telegram error and missing env return 502 without details", async () => {
  const failed = await submitBooking(body(2_000_000), {
    now: 2_000_000,
    ip: "203.0.113.11",
    env,
    fetchImpl: async () => ({ ok: false, json: async () => ({ ok: false, description: "bot exploded " + token }) }),
  });
  assert.equal(failed.status, 502);
  assert.deepEqual(failed.body, { error: "unavailable" });
  assert.equal(JSON.stringify(failed).includes(token), false);

  const missing = await submitBooking(body(2_000_000), {
    now: 2_000_000,
    ip: "203.0.113.11",
    env: {},
    fetchImpl: async () => {
      throw new Error("should not send");
    },
  });
  assert.equal(missing.status, 502);
  assert.deepEqual(missing.body, { error: "unavailable" });
});

test("timeout returns 502", async () => {
  const result = await submitBooking(body(3_000_000), {
    now: 3_000_000,
    ip: "203.0.113.12",
    env,
    timeoutMs: 20,
    fetchImpl: (_url, init) =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve({ ok: true, json: async () => ({ ok: true }) }), 1000);
        init.signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(init.signal.reason ?? new Error("aborted"));
        });
      }),
  });
  assert.equal(result.status, 502);
  assert.deepEqual(result.body, { error: "unavailable" });
});

test("honeypot does not call Telegram", async () => {
  let called = false;
  const result = await submitBooking(body(4_000_000, { company: "https://spam.example" }), {
    now: 4_000_000,
    ip: "203.0.113.13",
    env,
    fetchImpl: async () => {
      called = true;
      return { ok: true, json: async () => ({ ok: true }) };
    },
  });
  assert.equal(result.status, 200);
  assert.equal(called, false);
});

test("too fast is rejected before Telegram", async () => {
  let called = false;
  const now = 5_000_000;
  const result = await submitBooking(body(now, { startedAt: now - 500 }), {
    now,
    ip: "203.0.113.14",
    env,
    fetchImpl: async () => {
      called = true;
      return { ok: true, json: async () => ({ ok: true }) };
    },
  });
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: "too_fast" });
  assert.equal(called, false);
});

test("sixth request from one IP is 429", async () => {
  let called = 0;
  const now = 6_000_000;
  const deps = {
    now,
    ip: "203.0.113.15",
    env,
    fetchImpl: async () => {
      called += 1;
      return { ok: true, json: async () => ({ ok: true }) };
    },
  };
  for (let i = 0; i < BOOKING_LIMIT; i += 1) {
    const result = await submitBooking(body(now), deps);
    assert.equal(result.status, 200);
  }
  const blocked = await submitBooking(body(now), deps);
  assert.equal(blocked.status, 429);
  assert.deepEqual(blocked.body, { error: "rate_limited" });
  assert.equal(called, BOOKING_LIMIT);
});

test("invalid phone is rejected", async () => {
  const result = await submitBooking(body(7_000_000, { phone: "+7 701" }), {
    now: 7_000_000,
    ip: "203.0.113.16",
    env,
    fetchImpl: async () => ({ ok: true, json: async () => ({ ok: true }) }),
  });
  assert.equal(result.status, 400);
  assert.deepEqual(result.body, { error: "invalid" });
});

test("POST route returns JSON and does not echo the token", async () => {
  process.env.TELEGRAM_BOT_TOKEN = token;
  process.env.TELEGRAM_CHAT_ID = chatId;
  const now = Date.now();
  const original = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ ok: true, result: { text: token } }) });
  try {
    const response = await POST(
      new Request("http://studio.local/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.20" },
        body: JSON.stringify(body(now)),
      }),
    );
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(payload, { ok: true });
    assert.equal(JSON.stringify(payload).includes(token), false);
  } finally {
    globalThis.fetch = original;
  }
});
