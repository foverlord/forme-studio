import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = "http://127.0.0.1:4317";
const out = "/opt/cursor/artifacts/screenshots";
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const report = { overflow: [], console: [], checks: [], shots: [] };
try {

function track(page, label) {
  page.on("console", (msg) => {
    if (msg.type() === "error") report.console.push(`${label}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => report.console.push(`${label}: ${err.message}`));
}

async function overflow(page, width, path) {
  const box = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
    body: document.body.scrollWidth,
  }));
  const delta = Math.max(box.scroll, box.body) - box.client;
  report.overflow.push({ width, path, delta, ...box });
  return delta;
}

const widths = [320, 375, 768, 1024, 1440];

{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  track(page, "home-js");
  await page.goto(`${base}/?demoNow=2026-10-15T16:00`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const today = await page.locator(".today h2").innerText();
  report.checks.push({ todayTitle: today, slots: await page.locator(".today .slot .t").allInnerTexts() });
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(100);
    await overflow(page, width, "/ today");
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: `${out}/home-today-375.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: `${out}/home-today-1440.png`, fullPage: true });
  report.shots.push("home-today-375.png", "home-today-1440.png");
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const title = await page.locator(".today h2").innerText();
  report.checks.push({ neutralTitle: title, skels: await page.locator(".today .skel").count() });
  await page.screenshot({ path: `${out}/home-neutral-1440.png`, fullPage: false });
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  track(page, "tomorrow");
  await page.goto(`${base}/?demoNow=2026-10-15T21:30`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  report.checks.push({
    tomorrowTitle: await page.locator(".today h2").innerText(),
    tomorrowCap: await page.locator(".today .cap-desktop").innerText(),
    tomorrowSlots: await page.locator(".today .slot .n").allInnerTexts(),
  });
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  track(page, "weekend");
  await page.goto(`${base}/?demoNow=2026-10-18T12:00`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  report.checks.push({
    weekendTitle: await page.locator(".today h2").innerText(),
    weekendCap: await page.locator(".today .cap-desktop").innerText(),
    weekendSlots: await page.locator(".today .slot .n").allInnerTexts(),
  });
  await page.screenshot({ path: `${out}/home-weekend-1440-fold.png` });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: `${out}/home-weekend-375.png` });
  report.shots.push("home-weekend-1440-fold.png", "home-weekend-375.png");
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, javaScriptEnabled: false });
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${out}/home-neutral-375.png` });
  report.shots.push("home-neutral-375.png");
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  track(page, "tomorrow-shots");
  await page.goto(`${base}/?demoNow=2026-10-15T21:30`, { waitUntil: "networkidle" });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/home-tomorrow-375.png` });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: `${out}/home-tomorrow-1440.png` });
  report.shots.push("home-tomorrow-375.png", "home-tomorrow-1440.png");
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  track(page, "menu");
  await page.goto(`${base}/?demoNow=2026-10-15T16:00`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Меню" }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/menu-open-375.png` });
  report.shots.push("menu-open-375.png");
  const trapped = await page.evaluate(() => document.activeElement?.id || document.activeElement?.textContent);
  await page.keyboard.press("Escape");
  const closed = await page.locator("#mobile-menu").count();
  const scroll = await page.evaluate(() => document.body.style.position);
  report.checks.push({ menuFocus: trapped, menuAfterEsc: closed, bodyPosition: scroll });
  await overflow(page, 375, "/ menu-closed");
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  track(page, "tabs");
  await page.goto(`${base}/?demoNow=2026-10-15T16:00`, { waitUntil: "networkidle" });
  await page.locator("#directions").scrollIntoViewIfNeeded();
  await page.getByRole("tab", { name: "Восстановление" }).click();
  await page.waitForTimeout(300);
  const visible = await page.evaluate(() => {
    const scroller = document.querySelector(".tabs");
    const tab = document.getElementById("tab-recovery");
    if (!scroller || !tab) return null;
    const s = scroller.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    return { left: t.left - s.left, right: s.right - t.right, scroll: scroller.scrollLeft };
  });
  report.checks.push({ recoveryTabVisible: visible, panel: await page.locator("#panel-recovery h3").innerText() });
  await page.close();
}

async function shotBooking(name, setup) {
  for (const width of [375, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: width === 375 ? 812 : 900 } });
    track(page, name + width);
    await setup(page);
    await page.screenshot({ path: `${out}/${name}-${width}.png`, fullPage: true });
    await overflow(page, width, name);
    report.shots.push(`${name}-${width}.png`);
    await page.close();
  }
}

await shotBooking("booking-form", async (page) => {
  await page.goto(`${base}/booking?demoNow=2026-10-15T21:30`, { waitUntil: "networkidle" });
  await page.waitForSelector("#name");
});

await shotBooking("booking-errors", async (page) => {
  await page.goto(`${base}/booking?demoNow=2026-10-15T21:30`, { waitUntil: "networkidle" });
  await page.waitForSelector("#name");
  await page.locator("#name").fill("Алия");
  await page.locator("#phone").fill("+7 701 234");
  await page.locator("button[type=submit]").click();
  await page.waitForSelector(".alert");
});

await shotBooking("booking-loading", async (page) => {
  await page.route("**/api/booking", () => new Promise(() => {}));
  await page.goto(`${base}/booking?demoNow=2026-10-15T21:30`, { waitUntil: "networkidle" });
  await page.locator("#name").fill("Алия");
  await page.locator("#phone").fill("+7 701 234 56 78");
  await page.locator("#consent").check();
  await page.locator("button[type=submit]").click();
  await page.getByRole("button", { name: "Отправляем…" }).waitFor();
});

await shotBooking("booking-success", async (page) => {
  await page.route("**/api/booking", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }),
  );
  await page.goto(`${base}/booking?demoNow=2026-10-15T21:30`, { waitUntil: "networkidle" });
  await page.locator("#name").fill("Алия");
  await page.locator("#phone").fill("+7 701 234 56 78");
  await page.locator("#consent").check();
  await page.locator("button[type=submit]").click();
  await page.getByRole("heading", { name: "Заявка отправлена" }).waitFor();
  const marginTop = await page.locator(".success-note").evaluate((el) => getComputedStyle(el).marginTop);
  if (marginTop !== "12px") throw new Error(`demo line margin-top is ${marginTop}`);
  if (await page.getByRole("button", { name: "В календарь" }).count()) {
    throw new Error("calendar button should be gone");
  }
  const route = page.getByRole("button", { name: "Как добраться" });
  const routeClass = (await route.getAttribute("class")) ?? "";
  if (!routeClass.split(/\s+/).includes("link") || routeClass.split(/\s+/).includes("btn")) {
    throw new Error(`route control class is ${routeClass}`);
  }
});

{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  track(page, "waitlist-success");
  await page.goto(`${base}/booking?demoNow=2026-10-15T16:00&session=yoga-thu-1945@2026-10-15`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "В лист ожидания" }).click();
  await page.locator("#name").waitFor();
  report.checks.push({ waitlistOpensForm: true });
  await page.close();
}

await shotBooking("booking-error", async (page) => {
  await page.goto(`${base}/booking?demoNow=2026-10-15T16:00&session=yoga-thu-1945@2026-10-15`, { waitUntil: "networkidle" });
  await page.getByText("места закончились").waitFor();
  const alternatives = await page.locator(".bk .row").count();
  const waitlist = await page.getByRole("button", { name: "В лист ожидания" }).count();
  if (alternatives < 2 || waitlist < 1) {
    throw new Error(`full-class URL should open the error state, rows=${alternatives} waitlist=${waitlist}`);
  }
});

{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  track(page, "keyboard");
  await page.goto(`${base}/booking?demoNow=reset`, { waitUntil: "networkidle" });
  await page.waitForSelector("#name");
  const seen = [];
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      return { tag: el?.tagName, id: el?.id, text: (el?.innerText || el?.getAttribute("aria-label") || "").slice(0, 40) };
    });
    seen.push(info);
    if (info.id === "name") break;
  }
  await page.keyboard.type("Алия");
  await page.keyboard.press("Tab");
  await page.keyboard.type("7012345678");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { name: "Спасибо за интерес к FORME" }).waitFor({ timeout: 8000 });
  const phone = await page.evaluate(() => null);
  report.checks.push({
    keyboardToName: seen,
    successHeading: await page.getByRole("heading", { name: "Спасибо за интерес к FORME" }).innerText(),
    phoneValueIgnored: phone,
  });
  await overflow(page, 375, "booking keyboard success");
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  track(page, "schedule");
  await page.goto(`${base}/schedule?demoNow=2026-10-16T08:00&day=2026-10-16&direction=yoga`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  report.checks.push({
    scheduleNames: await page.locator(".row .n").allInnerTexts(),
    full: await page.getByRole("link", { name: "В лист ожидания" }).count(),
  });
  await page.locator(".day.off").click();
  await page.waitForTimeout(150);
  report.checks.push({ empty: await page.locator(".empty h2").innerText() });
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await overflow(page, width, "/schedule");
  }
  await page.close();
}

} finally {
  await browser.close();
  const bad = report.overflow.filter((item) => item.delta > 0);
  console.log(JSON.stringify({ badOverflow: bad, checks: report.checks, console: report.console, shots: report.shots }, null, 2));
  if (bad.length || report.console.length) process.exitCode = 1;
}
