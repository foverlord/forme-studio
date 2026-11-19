import { chromium, webkit, devices } from "playwright";

const base = process.env.BASE ?? "http://127.0.0.1:4325";
const iPhone = devices["iPhone 13"];
const report = { base, failures: [], checks: {} };

function fail(name, detail) {
  report.failures.push({ name, detail });
  console.error("FAIL", name, JSON.stringify(detail));
}

async function touchSwipe(client, x, y, dy) {
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  const steps = 12;
  for (let step = 1; step <= steps; step += 1) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y + (dy * step) / steps }],
    });
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...iPhone });
const page = await context.newPage();
const client = await context.newCDPSession(page);

try {
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const before = await page.evaluate(() => Math.round(window.scrollY));
  await touchSwipe(client, 180, 420, -360);
  const after = await page.evaluate(() => Math.round(window.scrollY));
  if (Math.abs(after - before) < 40) fail("gesture-inert", { before, after });
  else report.checks.unlockedSwipe = { before, after };

  await page.evaluate(() => document.getElementById("prices")?.scrollIntoView({ behavior: "instant", block: "start" }));
  const saved = await page.evaluate(() => Math.round(window.scrollY));
  await page.evaluate(() => document.getElementById("menu-button").click());
  await page.waitForSelector("#mobile-menu");
  const locked = await page.evaluate(() => ({
    y: Math.round(window.scrollY),
    fixed: document.body.style.position,
    top: document.body.style.top,
    overflow: document.documentElement.style.overflow,
    overscroll: getComputedStyle(document.getElementById("mobile-menu")).overscrollBehavior,
  }));
  if (locked.fixed !== "fixed" || locked.overflow !== "hidden") fail("lock-styles", locked);
  if (Math.abs(locked.y - saved) > 1) fail("lock-y", { saved, locked });
  const box = await page.locator("#mobile-menu").boundingBox();
  await touchSwipe(client, box.x + box.width / 2, box.y + 280, -320);
  await touchSwipe(client, box.x + box.width / 2, box.y + 240, 280);
  const during = await page.evaluate(() => Math.round(window.scrollY));
  if (during !== locked.y) fail("swipe-scroll", { locked: locked.y, during });
  else report.checks.swipe = { saved, during, overscroll: locked.overscroll };

  await page.locator("#menu-close").click();
  await page.waitForFunction(() => !document.getElementById("mobile-menu"));
  const closed = await page.evaluate(() => ({
    y: Math.round(window.scrollY),
    fixed: document.body.style.position,
  }));
  if (closed.fixed === "fixed" || Math.abs(closed.y - saved) > 1) fail("restore", { saved, closed });
  else report.checks.restore = closed;
} catch (error) {
  fail("crash", String(error?.stack || error));
}
await browser.close();

let webkitBrowser;
try {
  webkitBrowser = await webkit.launch({ headless: true });
  const webContext = await webkitBrowser.newContext({ ...iPhone });
  const webPage = await webContext.newPage();
  await webPage.goto(`${base}/`, { waitUntil: "networkidle" });
  await webPage.evaluate(() => document.getElementById("prices")?.scrollIntoView({ behavior: "instant", block: "start" }));
  const saved = await webPage.evaluate(() => Math.round(window.scrollY));
  await webPage.evaluate(() => document.getElementById("menu-button").click());
  await webPage.waitForSelector("#mobile-menu");
  const box = await webPage.locator("#mobile-menu").boundingBox();
  await webPage.mouse.move(box.x + box.width / 2, box.y + 300);
  await webPage.mouse.down();
  for (let step = 1; step <= 16; step += 1) {
    await webPage.mouse.move(box.x + box.width / 2, box.y + 300 - step * 18);
    await webPage.waitForTimeout(16);
  }
  await webPage.mouse.up();
  const during = await webPage.evaluate(() => ({
    y: Math.round(window.scrollY),
    fixed: document.body.style.position,
  }));
  if (during.fixed !== "fixed" || during.y !== saved) fail("webkit-swipe", { saved, during });
  else report.checks.webkit = { saved, during: during.y };
  await webPage.locator("#menu-close").click();
  const closed = await webPage.evaluate(() => Math.round(window.scrollY));
  if (Math.abs(closed - saved) > 1) fail("webkit-restore", { saved, closed });
} catch (error) {
  fail("webkit", String(error?.stack || error));
} finally {
  await webkitBrowser?.close();
}

console.log(JSON.stringify(report, null, 2));
if (report.failures.length) process.exit(1);
