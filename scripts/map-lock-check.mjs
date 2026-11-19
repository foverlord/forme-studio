import { chromium } from "playwright";

const base = process.env.BASE ?? "http://127.0.0.1:4325";
const report = { base, failures: [], checks: {} };

function fail(name, detail) {
  report.failures.push({ name, detail });
  console.error("FAIL", name, JSON.stringify(detail));
}

async function lockState(page) {
  return page.evaluate(() => {
    const map = document.querySelector(".map");
    const stage = document.querySelector(".map-stage");
    const shield = document.querySelector(".map-shield");
    const rect = map.getBoundingClientRect();
    const kind = (x, y) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      if (el.closest(".map-hint")) return "hint";
      if (el.closest(".map-shield")) return "shield";
      if (el.closest(".map-stage")) return "frame";
      return el.tagName;
    };
    const inView = rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
    return {
      active: map?.dataset.mapActive ?? null,
      pointerEvents: stage ? getComputedStyle(stage).pointerEvents : null,
      shieldOff: shield ? shield.classList.contains("is-off") : null,
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      scrollY: Math.round(window.scrollY),
      innerHeight: window.innerHeight,
      center: inView ? kind(rect.left + rect.width / 2, rect.top + rect.height / 2) : null,
      chromeTop: inView ? kind(rect.left + 24, rect.top + 16) : null,
      chromeBottom: inView ? kind(rect.left + 36, rect.bottom - 10) : null,
    };
  });
}

async function waitLocked(page, locked) {
  await page.waitForFunction(
    (want) => document.querySelector(".map")?.dataset.mapActive === (want ? "false" : "true"),
    locked,
    { timeout: 4000 },
  );
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true });
const page = await context.newPage();

try {
  await page.goto(`${base}/#contacts`, { waitUntil: "networkidle" });
  const map = page.locator(".map");
  await map.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector(".map")?.dataset.mapState === "ready");

  const address = await page.locator("#contacts p").evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.trim()).filter((text) => text?.startsWith("Астана")),
  );
  if (address[0] !== "Астана, центр") fail("address", address);
  else report.checks.address = address[0];

  const box = await map.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await waitLocked(page, false);
  const opened = await lockState(page);
  if (opened.active !== "true" || opened.shieldOff !== true || opened.center !== "frame") {
    fail("activate", opened);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  let scrolled = await lockState(page);
  if (scrolled.scrollY > 2) {
    await page.keyboard.press("Home");
    scrolled = await lockState(page);
  }
  if (scrolled.bottom > 0 && scrolled.top < scrolled.innerHeight) {
    await page.mouse.move(24, 400);
    for (let step = 0; step < 30 && (await lockState(page)).bottom > 0; step += 1) {
      await page.mouse.wheel(0, -600);
    }
    scrolled = await lockState(page);
  }
  const outOfView = scrolled.bottom <= 0 || scrolled.top >= scrolled.innerHeight;
  if (!outOfView) fail("scrolled-out", scrolled);
  await waitLocked(page, true);
  const afterScroll = await lockState(page);
  if (afterScroll.active !== "false" || afterScroll.shieldOff !== false) {
    fail("relock-scroll", afterScroll);
  } else report.checks.relockScroll = afterScroll;

  await map.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const again = await map.boundingBox();
  await page.touchscreen.tap(again.x + again.width / 2, again.y + again.height / 2);
  await waitLocked(page, false);
  const heading = await page.locator("#contacts h2").boundingBox();
  await page.touchscreen.tap(heading.x + 12, heading.y + 12);
  await waitLocked(page, true);
  const afterTap = await lockState(page);
  if (afterTap.active !== "false" || afterTap.shieldOff !== false || !["shield", "hint"].includes(afterTap.center) || afterTap.chromeTop !== "frame" || afterTap.chromeBottom !== "frame") {
    fail("relock-tap", afterTap);
  } else report.checks.relockTap = { active: afterTap.active, center: afterTap.center, chromeTop: afterTap.chromeTop, chromeBottom: afterTap.chromeBottom };

  const hover = await map.boundingBox();
  await page.mouse.click(hover.x + hover.width / 2, hover.y + hover.height / 2);
  await waitLocked(page, false);
  await page.mouse.move(24, 24);
  await waitLocked(page, true);
  const afterLeave = await lockState(page);
  if (afterLeave.active !== "false" || afterLeave.shieldOff !== false || afterLeave.center === "frame") fail("relock-mouseleave", afterLeave);
  else report.checks.relockMouseleave = { active: afterLeave.active, pointerEvents: afterLeave.pointerEvents };

  await page.touchscreen.tap(hover.x + hover.width / 2, hover.y + hover.height / 2);
  await waitLocked(page, false);
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await waitLocked(page, true);
  const afterHide = await lockState(page);
  if (afterHide.active !== "false" || afterHide.shieldOff !== false || afterHide.center === "frame") fail("relock-pagehide", afterHide);
  else report.checks.relockPagehide = { active: afterHide.active, pointerEvents: afterHide.pointerEvents };

  await page.locator("#contacts").focus();
  await page.keyboard.press("Tab");
  const key = await page.evaluate(() => {
    const el = document.activeElement;
    const style = el ? getComputedStyle(el) : null;
    return {
      tag: el?.tagName ?? null,
      type: el?.getAttribute("type") ?? null,
      label: el?.getAttribute("aria-label") ?? null,
      text: el?.textContent?.trim() ?? null,
      outline: style ? `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}` : null,
    };
  });
  if (key.tag !== "BUTTON" || key.type !== "button" || key.label !== "Активировать карту" || key.text !== "Нажмите, чтобы двигать карту") {
    fail("keyboard-button", key);
  }
  if (!key.outline?.startsWith("2px solid")) fail("focus-ring", key);
  else report.checks.keyboard = key;
  await page.keyboard.press("Enter");
  await waitLocked(page, false);
  await page.keyboard.press("Escape");
  await waitLocked(page, true);
  report.checks.escape = await lockState(page);
  if (report.checks.escape.active !== "false") fail("escape", report.checks.escape);
} catch (error) {
  fail("crash", String(error?.stack || error));
}

await browser.close();
console.log(JSON.stringify(report, null, 2));
if (report.failures.length) process.exit(1);
