import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { getDictionary } from "../content/dictionary.ts";
import { getDirections } from "../content/directions.ts";
import { getTrainers } from "../content/trainers.ts";
import { getAddress, getFacts, getFaq, getFirstSteps, getPlans } from "../content/studio.ts";
import { photos, photoFor } from "../content/photos.ts";
import { classNameKk, hallKk, photoAltKk } from "../content/kk-copy.ts";
import { formatLong, formatShort, studioHoursText } from "../lib/time.ts";

const base = process.env.BASE ?? "http://127.0.0.1:4325";
const out = "/opt/cursor/artifacts";
await mkdir(out, { recursive: true });

function flatten(value, bag) {
  if (typeof value === "string") bag.push(value);
  else if (Array.isArray(value)) value.forEach((item) => flatten(item, bag));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => flatten(item, bag));
}

const ru = getDictionary("ru");
const kk = getDictionary("kk");
const ruStrings = [];
const kkStrings = [];
flatten(ru, ruStrings);
flatten(kk, kkStrings);
flatten(getDirections("ru"), ruStrings);
flatten(getDirections("kk"), kkStrings);
flatten(getTrainers("ru"), ruStrings);
flatten(getTrainers("kk"), kkStrings);
flatten(getAddress("ru"), ruStrings);
flatten(getAddress("kk"), kkStrings);
flatten(getFacts("ru"), ruStrings);
flatten(getFacts("kk"), kkStrings);
flatten(getFaq("ru"), ruStrings);
flatten(getFaq("kk"), kkStrings);
flatten(getFirstSteps("ru"), ruStrings);
flatten(getFirstSteps("kk"), kkStrings);
flatten(getPlans("ru"), ruStrings);
flatten(getPlans("kk"), kkStrings);
for (const photo of Object.values(photos)) ruStrings.push(photo.alt);
for (const alt of Object.values(photoAltKk)) kkStrings.push(alt);
for (const name of Object.values(classNameKk)) kkStrings.push(name);
for (const hall of Object.values(hallKk)) kkStrings.push(hall);
kkStrings.push(studioHoursText("kk"));
ruStrings.push(studioHoursText("ru"));
kkStrings.push(formatShort("2026-10-22", "kk"), formatLong("2026-10-22", "kk"));
ruStrings.push(formatShort("2026-10-22", "ru"), formatLong("2026-10-22", "ru"));

const wordRe = /[\u0400-\u04FF]+/g;
function wordsOf(text) {
  return text.match(wordRe) || [];
}
const kkWords = new Set();
const ruWords = new Set();
const ruValues = new Set(ruStrings.map((item) => item.trim()).filter(Boolean));
const kkValues = new Set(kkStrings.map((item) => item.trim()).filter(Boolean));
for (const item of kkStrings) for (const word of wordsOf(item)) kkWords.add(word.toLowerCase());
for (const item of ruStrings) for (const word of wordsOf(item)) ruWords.add(word.toLowerCase());

function scanText(text, where) {
  const hits = [];
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return hits;
  if (ruValues.has(trimmed) && !kkValues.has(trimmed)) hits.push({ where, kind: "ru-value", text: trimmed });
  for (const word of wordsOf(trimmed)) {
    const key = word.toLowerCase();
    if (kkWords.has(key)) continue;
    if (/[ыэъёЫЭЪЁ]/.test(word) || ruValues.has(word) || (ruWords.has(key) && !kkWords.has(key))) {
      hits.push({ where, kind: /[ыэъёЫЭЪЁ]/.test(word) ? "marker" : "ru-word", text: word, context: trimmed.slice(0, 140) });
    }
  }
  return hits;
}

const browser = await chromium.launch({ headless: true });
const report = { base, failures: [], leaks: [], overflow: [], fonts: null, meta: {}, intl: {}, switcher: {}, screenshots: [] };

function fail(name, detail) {
  report.failures.push({ name, detail });
  console.error("FAIL", name, JSON.stringify(detail).slice(0, 500));
}

async function collect(page, where) {
  const payload = await page.evaluate(() => {
    const visible = (el) => {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 || rect.height > 0 || el.tagName === "TITLE";
    };
    const bits = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const parent = node.parentElement;
      if (parent && visible(parent) && node.textContent.trim()) bits.push(node.textContent);
      node = walker.nextNode();
    }
    for (const el of document.querySelectorAll("[alt], [aria-label], [title]")) {
      for (const attr of ["alt", "aria-label", "title"]) {
        const value = el.getAttribute(attr);
        if (value) bits.push(value);
      }
    }
    bits.push(document.title);
    for (const selector of ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]']) {
      const value = document.querySelector(selector)?.getAttribute("content");
      if (value) bits.push(value);
    }
    const bar = document.querySelector(".sticky");
    const meta = bar?.querySelector(".meta");
    const btn = bar?.querySelector(".btn");
    let sticky = null;
    if (bar && meta && btn) {
      const barRect = bar.getBoundingClientRect();
      const metaRect = meta.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const line = parseFloat(getComputedStyle(meta).lineHeight) || 16;
      sticky = {
        metaText: meta.textContent.trim(),
        btnText: btn.textContent.trim(),
        metaLines: Math.round((meta.scrollHeight / line) * 10) / 10,
        clipped: bar.scrollWidth > bar.clientWidth + 1 || meta.scrollWidth > meta.clientWidth + 1 || btn.scrollWidth > btn.clientWidth + 1,
        overlaps: metaRect.right > btnRect.left + 1,
        offscreen: barRect.right > window.innerWidth + 1 || btnRect.right > window.innerWidth + 1 || metaRect.left < 0,
        barHeight: Math.round(barRect.height),
      };
    }
    return {
      bits,
      lang: document.documentElement.lang,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      title: document.title,
      sticky,
    };
  });
  if (payload.lang !== "kk") fail(`${where}-lang`, payload.lang);
  if (payload.overflow > 1) {
    report.overflow.push({ where, px: payload.overflow });
    fail(`${where}-overflow`, payload.overflow);
  }
  if (where.endsWith("-320") && payload.sticky) {
    report.sticky = report.sticky || {};
    report.sticky[where] = payload.sticky;
    if (payload.sticky.clipped || payload.sticky.overlaps || payload.sticky.offscreen || payload.sticky.metaLines > 1) {
      fail(`${where}-sticky`, payload.sticky);
    }
  }
  for (const bit of payload.bits) {
    for (const hit of scanText(bit, where)) report.leaks.push(hit);
  }
  return payload;
}

async function shot(page, name) {
  const path = `${out}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  report.screenshots.push(name);
}

const widths = [320, 375, 1440];
for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: width < 500 ? 700 : 900 } });
  const page = await context.newPage();
  await page.goto(`${base}/kk`, { waitUntil: "networkidle" });
  await collect(page, `home-${width}`);
  await shot(page, `kk-home-${width}`);
  await page.goto(`${base}/kk/schedule?demoNow=2026-10-16T12:00`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Жұма" }).click().catch(() => {});
  await collect(page, `schedule-${width}`);
  await shot(page, `kk-schedule-${width}`);
  await page.goto(`${base}/kk/booking?demoNow=2026-10-16T08:00`, { waitUntil: "networkidle" });
  await page.locator("#name").waitFor();
  await collect(page, `booking-${width}`);
  await shot(page, `kk-booking-${width}`);
  await context.close();
}

const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

await page.goto(`${base}/kk/schedule?demoNow=2026-10-16T12:00`, { waitUntil: "networkidle" });
const waitlist = page.getByRole("link", { name: "Күту тізіміне" }).first();
if (await waitlist.count()) {
  await collect(page, "schedule-waitlist");
} else fail("waitlist-missing", "no waitlist link");

await page.goto(`${base}/kk/booking?demoNow=2026-10-16T08:00`, { waitUntil: "networkidle" });
await page.locator("button[type=submit]").click();
await page.locator("#name-error, [role=alert], .alert").first().waitFor({ timeout: 4000 }).catch(() => {});
await collect(page, "booking-errors");

await page.getByRole("button", { name: "Сабақты ауыстыру" }).click();
await page.getByRole("heading", { name: "Басқа уақыт" }).waitFor();
await collect(page, "booking-select");

await page.goto(`${base}/kk/booking?demoNow=2026-10-16T08:00`, { waitUntil: "networkidle" });
await page.route("**/api/booking", (route) =>
  route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }),
);
await page.locator("#name").fill("Алия");
await page.locator("#phone").fill("+7 701 234 56 78");
await page.locator("#consent").check();
await page.locator("button[type=submit]").click();
await page.getByRole("heading", { name: "Өтінім жіберілді" }).waitFor();
await collect(page, "booking-success");
await page.getByRole("button", { name: "Өзіңізбен не алу керек" }).click();
await collect(page, "booking-bring");

await page.goto(`${base}/kk/booking?session=yoga-thu-1945@2026-10-15&demoNow=2026-10-15T18:00`, { waitUntil: "networkidle" });
await page.locator("#seats-alert").waitFor({ timeout: 8000 });
await collect(page, "booking-full");

await page.goto(`${base}/kk#prices`, { waitUntil: "networkidle" });
const sw = await page.evaluate(() => {
  const nav = document.querySelector(".lang-switch");
  const links = [...nav.querySelectorAll("a")].map((a) => {
    const rect = a.getBoundingClientRect();
    const style = getComputedStyle(a);
    return {
      text: a.textContent.trim(),
      lang: a.lang,
      hrefLang: a.getAttribute("hreflang"),
      current: a.getAttribute("aria-current"),
      href: a.getAttribute("href"),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
      font: style.fontFamily,
      size: style.fontSize,
      color: style.color,
    };
  });
  return { label: nav.getAttribute("aria-label"), links };
});
report.switcher = sw;
for (const link of sw.links) {
  if (link.w < 44 || link.h < 44) fail("switch-target", link);
  if (link.size !== "14px") fail("switch-size", link);
}
if (sw.links.find((link) => link.lang === "kk")?.current !== "true") fail("switch-current", sw);
if (!sw.links.find((link) => link.lang === "ru")?.href?.includes("#prices")) fail("switch-hash", sw);

const meta = await page.evaluate(() => {
  const link = (rel, lang) => {
    const nodes = [...document.querySelectorAll(`link[rel="${rel}"]`)];
    const node = lang ? nodes.find((item) => item.getAttribute("hreflang") === lang) : nodes[0];
    return node ? node.getAttribute("href") : null;
  };
  return {
    lang: document.documentElement.lang,
    title: document.title,
    canonical: link("canonical"),
    ru: link("alternate", "ru"),
    kk: link("alternate", "kk"),
    xdefault: link("alternate", "x-default"),
    og: document.querySelector('meta[property="og:locale"]')?.getAttribute("content") ?? null,
  };
});
report.meta.kkHome = meta;
if (meta.lang !== "kk") fail("meta-lang", meta);
if (meta.og !== "kk_KZ") fail("meta-og", meta);
if (!meta.title.includes("Астанадағы")) fail("meta-title", meta);
if (!String(meta.canonical).endsWith("/kk")) fail("meta-canonical", meta);
if (!String(meta.kk).endsWith("/kk") || !String(meta.ru).endsWith("/") && !String(meta.ru).endsWith("forme.studio")) fail("meta-hreflang", meta);

const switchPairs = [
  ["/", "/kk"],
  ["/kk", "/"],
  ["/schedule", "/kk/schedule"],
  ["/kk/schedule", "/schedule"],
  ["/booking", "/kk/booking"],
  ["/kk/booking", "/booking"],
];
report.switchRoutes = [];
for (const [from, to] of switchPairs) {
  await page.goto(`${base}${from}`, { waitUntil: "networkidle" });
  const targetLang = to.startsWith("/kk") ? "kk" : "ru";
  const link = page.locator(`.hdr .lang-switch a[lang="${targetLang}"]`);
  const href = await link.getAttribute("href");
  await link.click();
  await page.waitForURL((url) => url.pathname === to, { timeout: 8000 });
  const landed = new URL(page.url()).pathname;
  report.switchRoutes.push({ from, to, href, landed });
  if (landed !== to) fail("switch-route", { from, to, landed, href });
}

await page.goto(`${base}/`, { waitUntil: "networkidle" });
const ruMeta = await page.evaluate(() => ({
  lang: document.documentElement.lang,
  og: document.querySelector('meta[property="og:locale"]')?.getAttribute("content"),
  title: document.title,
}));
report.meta.ruHome = ruMeta;
if (ruMeta.lang !== "ru" || ruMeta.og !== "ru_RU") fail("ru-meta", ruMeta);

const intl = await page.evaluate(() => {
  const date = new Date("2026-10-22T12:00:00+05:00");
  const zone = "Asia/Almaty";
  return {
    short: new Intl.DateTimeFormat("kk-KZ", { timeZone: zone, weekday: "short" }).format(date),
    long: new Intl.DateTimeFormat("kk-KZ", { timeZone: zone, weekday: "long", day: "numeric", month: "long" }).format(date),
    month: new Intl.DateTimeFormat("kk-KZ", { timeZone: zone, month: "long" }).format(date),
  };
});
report.intl = intl;
if (!intl.long.includes("қазан") || !intl.long.includes("бейсенбі")) fail("intl-chromium", intl);

const probe = await page.evaluate(() => {
  const sample = "Әә Ғғ Ққ Ңң Өө Ұұ Үү Һһ Іі";
  const el = document.createElement("p");
  el.id = "kk-probe";
  el.textContent = sample;
  el.style.font = "40px var(--font-text)";
  document.body.appendChild(el);
  const h = document.createElement("p");
  h.id = "kk-probe-display";
  h.textContent = sample;
  h.style.font = "40px var(--font-display)";
  document.body.appendChild(h);
  const bodyFamily = getComputedStyle(document.body).fontFamily;
  const textFamily = getComputedStyle(el).fontFamily;
  const displayFamily = getComputedStyle(h).fontFamily;
  return {
    bodyFamily,
    textFamily,
    displayFamily,
    textCheck: document.fonts.check(`400 40px ${textFamily}`, sample),
    displayCheck: document.fonts.check(`700 40px ${displayFamily}`, sample),
  };
});
const client = await page.context().newCDPSession(page);
await client.send("DOM.enable");
await client.send("CSS.enable");
const { root } = await client.send("DOM.getDocument");
async function platformFonts(selector) {
  const { nodeId } = await client.send("DOM.querySelector", { nodeId: root.nodeId, selector });
  const result = await client.send("CSS.getPlatformFontsForNode", { nodeId });
  return result.fonts;
}
const textFonts = await platformFonts("#kk-probe");
const displayFonts = await platformFonts("#kk-probe-display");
report.fonts = { probe, textFonts, displayFonts };
const textNames = textFonts.map((font) => font.familyName).join(" ");
const displayNames = displayFonts.map((font) => font.familyName).join(" ");
if (!/onest/i.test(textNames)) fail("font-onest", textFonts);
if (!/geologica/i.test(displayNames)) fail("font-geologica", displayFonts);

await page.goto(`${base}/kk`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Мәзір" }).click();
const menuSwitch = await page.locator("#mobile-menu .lang-switch a").count();
if (menuSwitch !== 2) fail("menu-switch", menuSwitch);
await collect(page, "mobile-menu");

await context.close();
await browser.close();

const uniqueLeaks = [];
const seen = new Set();
for (const hit of report.leaks) {
  const key = `${hit.kind}|${hit.text}|${hit.where}`;
  if (seen.has(key)) continue;
  seen.add(key);
  uniqueLeaks.push(hit);
}
report.leaks = uniqueLeaks;
report.leakCount = uniqueLeaks.length;
await writeFile(`${out}/kk-audit.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  failures: report.failures,
  leakCount: report.leakCount,
  leaks: uniqueLeaks.slice(0, 40),
  overflow: report.overflow,
  sticky: report.sticky,
  switchRoutes: report.switchRoutes,
  fonts: { probe: report.fonts.probe, textFonts: report.fonts.textFonts, displayFonts: report.fonts.displayFonts },
  meta: report.meta,
  intl: report.intl,
  switcher: report.switcher,
  screenshots: report.screenshots,
}, null, 2));
if (report.failures.length || report.leakCount) process.exit(1);
