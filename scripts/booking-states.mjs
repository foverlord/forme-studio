import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.env.BASE ?? "http://127.0.0.1:4325";
const out = "/opt/cursor/artifacts";
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = { shots: [], checks: [] };

function fail(name, detail) {
  report.checks.push({ name, ok: false, detail });
  console.error("FAIL", name, JSON.stringify(detail));
}

async function prepare(page) {
  await page.goto(`${base}/booking?demoNow=2026-10-16T08:00`, { waitUntil: "networkidle" });
  await page.locator("#name").waitFor();
  await page.locator("#name").fill("Алия");
  await page.locator("#phone").fill("+7 701 234 56 78");
  await page.locator("#consent").check();
}

for (const width of [375, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: width < 500 ? 812 : 900 } });
  const page = await context.newPage();

  await page.route("**/api/booking", () => new Promise(() => {}));
  await prepare(page);
  const before = await page.locator("button[type=submit]").boundingBox();
  await page.locator("button[type=submit]").click();
  const sending = page.getByRole("button", { name: "Отправляем…" });
  await sending.waitFor();
  const during = await sending.boundingBox();
  if (!before || !during || Math.abs(before.width - during.width) > 1) fail(`width-${width}`, { before, during });
  if (await sending.isEnabled()) fail(`disabled-${width}`, true);
  await page.screenshot({ path: `${out}/booking-sending-${width}.png` });
  report.shots.push(`booking-sending-${width}.png`);
  await context.close();

  const ok = await browser.newContext({ viewport: { width, height: width < 500 ? 812 : 900 } });
  const okPage = await ok.newPage();
  await okPage.route("**/api/booking", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }),
  );
  await prepare(okPage);
  await okPage.locator("button[type=submit]").click();
  const heading = okPage.getByRole("heading", { name: "Заявка отправлена" });
  await heading.waitFor();
  const status = await okPage.locator("[role=status]").count();
  const focused = await okPage.evaluate(() => document.activeElement?.id);
  if (!status) fail(`status-${width}`, status);
  if (focused !== "success-title") fail(`focus-success-${width}`, focused);
  await okPage.getByText("Мы свяжемся с вами").waitFor();
  await okPage.screenshot({ path: `${out}/booking-success-${width}.png` });
  report.shots.push(`booking-success-${width}.png`);
  await ok.close();

  const bad = await browser.newContext({ viewport: { width, height: width < 500 ? 812 : 900 } });
  const badPage = await bad.newPage();
  await badPage.route("**/api/booking", (route) =>
    route.fulfill({ status: 502, contentType: "application/json", body: '{"error":"unavailable"}' }),
  );
  await prepare(badPage);
  await badPage.locator("button[type=submit]").click();
  const errTitle = badPage.getByRole("heading", { name: "Не удалось отправить заявку" });
  await errTitle.waitFor();
  const kept = await badPage.locator("#name").inputValue();
  if (kept !== "Алия") fail(`kept-${width}`, kept);
  const errFocus = await badPage.evaluate(() => document.activeElement?.id);
  if (errFocus !== "send-status-title") fail(`focus-error-${width}`, errFocus);
  const href = await badPage.getByRole("link", { name: "Написать в WhatsApp" }).getAttribute("href");
  if (!href?.startsWith("https://wa.me/77717799438?text=")) fail(`wa-${width}`, href);
  const decoded = decodeURIComponent(href.split("text=")[1] ?? "");
  if (!decoded.includes("Алия") || !decoded.includes("+7 701 234 56 78")) fail(`wa-text-${width}`, decoded);
  const stack = await badPage.locator(".send-actions").evaluate((el) => {
    const style = getComputedStyle(el);
    const buttons = [...el.children].map((node) => node.getBoundingClientRect().width);
    return { direction: style.flexDirection, buttons, box: el.getBoundingClientRect().width };
  });
  if (stack.direction !== "column") fail(`stack-${width}`, stack);
  if (stack.buttons.some((item) => item < stack.box - 1)) fail(`full-${width}`, stack);
  const bg = await badPage.locator(".send-status").evaluate((el) => getComputedStyle(el).backgroundColor);
  if (bg === "rgb(247, 231, 227)") fail(`red-${width}`, bg);
  await badPage.screenshot({ path: `${out}/booking-error-${width}.png` });
  report.shots.push(`booking-error-${width}.png`);
  await bad.close();

  const limited = await browser.newContext({ viewport: { width, height: width < 500 ? 812 : 900 } });
  const limitPage = await limited.newPage();
  await limitPage.route("**/api/booking", (route) =>
    route.fulfill({ status: 429, contentType: "application/json", body: '{"error":"rate_limited"}' }),
  );
  await prepare(limitPage);
  await limitPage.locator("button[type=submit]").click();
  await limitPage.getByText("Слишком много попыток").waitFor();
  if ((await limitPage.locator("#name").inputValue()) !== "Алия") fail(`rate-kept-${width}`, true);
  await limitPage.screenshot({ path: `${out}/booking-rate-${width}.png` });
  report.shots.push(`booking-rate-${width}.png`);
  await limited.close();
}

await browser.close();
const failed = report.checks.filter((item) => item.ok === false);
console.log(JSON.stringify({ shots: report.shots, failed }, null, 2));
if (failed.length) process.exit(1);
