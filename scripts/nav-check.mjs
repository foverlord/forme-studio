import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.env.BASE ?? "http://127.0.0.1:4325";
const locale = process.env.LOCALE === "kk" ? "kk" : "ru";
const home = locale === "kk" ? "/kk" : "/";
const schedulePath = locale === "kk" ? "/kk/schedule" : "/schedule";
const bookingPath = locale === "kk" ? "/kk/booking" : "/booking";
const pricesHref = locale === "kk" ? "/kk#prices" : "/#prices";
const contactsHref = locale === "kk" ? "/kk#contacts" : "/#contacts";
const shot = locale === "kk" ? "kk-nav" : "nav";
const ui = locale === "kk"
  ? {
      menu: "Мәзір",
      schedule: "Кесте",
      prices: "Бағалар",
      hours: "Дс–Бс 07:00–22:00\nЖм 07:00–21:00\nСб 09:00–20:00\nЖс демалыс",
      hourLines: ["Дс–Бс", "07:00–22:00", "Жм", "07:00–21:00", "Сб", "09:00–20:00", "Жс", "демалыс"],
      fact: ["07–22", "дс–бс"],
      metas: [
        ["Күш", "Негіз", "60 мин · барлық деңгей · дс–жм 08:30"],
        ["Қозғалғыштық", "Буын қозғалғыштығы", "45 мин · бастаушыларға · дс–жм 12:30"],
        ["Қалпына келу", "Кешкі қалпына келу", "45 мин · бастаушыларға · дс, ср, бс 21:00"],
      ],
    }
  : {
      menu: "Меню",
      schedule: "Расписание",
      prices: "Цены",
      hours: "Пн–Чт 07:00–22:00\nПт 07:00–21:00\nСб 09:00–20:00\nВс выходной",
      hourLines: ["Пн–Чт", "07:00–22:00", "Пт", "07:00–21:00", "Сб", "09:00–20:00", "Вс", "выходной"],
      fact: ["07–22", "пн–чт"],
      metas: [
        ["Сила", "База", "60 мин · все уровни · пн 08:30, чт 18:30, сб 10:30"],
        ["Мобильность", "Мобильность суставов", "45 мин · новичкам · вт, чт, пт 12:30, сб 12:00"],
        ["Восстановление", "Вечернее восстановление", "45 мин · новичкам · пн, ср, чт 21:00, сб 18:00"],
      ],
    };
const out = "/opt/cursor/artifacts";
await mkdir(out, { recursive: true });

const report = { base, failures: [], checks: {} };
function fail(name, detail) {
  report.failures.push({ name, detail });
  console.error("FAIL", name, JSON.stringify(detail));
}

const browser = await chromium.launch({ headless: true });
const targets = locale === "kk"
  ? [
      ["directions", "Сабақтар"],
      ["trainers", "Бапкерлер"],
      ["prices", "Бағалар"],
      ["studio", "Студия"],
      ["contacts", "Байланыс"],
    ]
  : [
      ["directions", "Занятия"],
      ["trainers", "Тренеры"],
      ["prices", "Цены"],
      ["studio", "Студия"],
      ["contacts", "Контакты"],
    ];

async function headingOffset(page, id) {
  return page.evaluate((id) => {
    const section = document.getElementById(id);
    const heading = section?.querySelector("h2, h1");
    const header = document.querySelector("header");
    const max = Math.round(document.documentElement.scrollHeight - window.innerHeight);
    const sectionDoc = section ? section.getBoundingClientRect().top + window.scrollY : 0;
    const margin = section ? parseFloat(getComputedStyle(section).scrollMarginTop) || 0 : 0;
    const targetY = Math.max(0, Math.round(sectionDoc - margin));
    const focusEl = document.activeElement;
    const focusStyle = focusEl ? getComputedStyle(focusEl) : null;
    return {
      headingTop: heading ? Math.round(heading.getBoundingClientRect().top) : null,
      sectionTop: section ? Math.round(section.getBoundingClientRect().top) : null,
      headerH: header ? Math.round(header.offsetHeight) : null,
      headerVar: getComputedStyle(document.documentElement).getPropertyValue("--header-h").trim(),
      margin: section ? getComputedStyle(section).scrollMarginTop : null,
      scrollY: Math.round(window.scrollY),
      expectedY: Math.min(max, targetY),
      max,
      hash: location.hash,
      focus: focusEl?.id || focusEl?.tagName,
      outline: focusStyle ? focusStyle.outlineStyle : null,
      menu: Boolean(document.getElementById("mobile-menu")),
      bodyPos: document.body.style.position,
    };
  }, id);
}

async function waitForScroll(page, id) {
  await page.waitForFunction((id) => {
    const section = document.getElementById(id);
    if (!section) return false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const sectionDoc = section.getBoundingClientRect().top + window.scrollY;
    const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
    const expected = Math.min(max, Math.max(0, sectionDoc - margin));
    return Math.abs(window.scrollY - expected) < 2;
  }, id, { timeout: 8000 });
}

function assertLanded(name, info, opts = {}) {
  if (info.headingTop == null || info.headerH == null || info.headingTop < info.headerH) fail(`${name}-offset`, info);
  if (Math.abs(info.scrollY - info.expectedY) > 4) fail(`${name}-short`, info);
  if (info.hash !== `#${name.split("-").pop()}`) fail(`${name}-hash`, info);
  if (info.focus !== name.split("-").pop()) fail(`${name}-focus`, info);
  if (!opts.skipRing && info.outline && info.outline !== "none") fail(`${name}-ring`, info);
  if (info.menu || info.bodyPos === "fixed") fail(`${name}-menu`, info);
}

async function currentCount(page) {
  return page.locator("[aria-current='location']").count();
}

async function desktop(width) {
  const context = await browser.newContext({ viewport: { width, height: width < 700 ? 812 : 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto(`${base}${home}`, { waitUntil: "networkidle" });
  const heroCurrent = await currentCount(page);
  if (heroCurrent !== 0) fail(`${width}-hero-current`, { heroCurrent });
  const rows = [];
  for (const [id, label] of targets) {
    const link = page.locator("nav.nav").getByRole("link", { name: label, exact: true });
    await link.click();
    await page.waitForFunction((id) => location.hash === `#${id}`, id);
    await waitForScroll(page, id);
    const info = await headingOffset(page, id);
    const current = await link.getAttribute("aria-current");
    rows.push({ id, ...info, current });
    assertLanded(`${width}-${id}`, info);
    const marked = await currentCount(page);
    if (current !== "location" || marked !== 1) fail(`${width}-${id}-current`, { current, id, marked });
    await page.screenshot({ path: `${out}/${shot}-${width}-${id}.png` });
  }
  const studio = rows.find((row) => row.id === "studio");
  const beforeBack = await page.evaluate(() => ({ hash: location.hash, y: Math.round(scrollY) }));
  await page.goBack();
  await page.waitForFunction(() => location.hash === "#studio");
  await waitForScroll(page, "studio");
  const afterBack = await page.evaluate(() => ({ hash: location.hash, y: Math.round(scrollY) }));
  report.checks[width] = { rows, beforeBack, afterBack, errors };
  if (afterBack.hash !== "#studio") fail(`${width}-back-hash`, afterBack);
  if (Math.abs(afterBack.y - studio.scrollY) > 40) fail(`${width}-back-y`, { afterBack, studio: studio.scrollY });
  if (errors.length) fail(`${width}-console`, errors);
  report.checks[width].heroCurrent = heroCurrent;
  await context.close();
}

async function mobile() {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto(`${base}${home}`, { waitUntil: "networkidle" });
  const rows = [];
  for (const [id, label] of targets) {
    await page.getByRole("button", { name: ui.menu }).click();
    await page.waitForSelector("#mobile-menu");
    await page.locator("#mobile-menu").getByRole("link", { name: label, exact: true }).click();
    await page.waitForFunction((id) => location.hash === `#${id}`, id);
    await waitForScroll(page, id);
    const info = await headingOffset(page, id);
    rows.push({ id, ...info });
    assertLanded(`375-${id}`, info);
    await page.screenshot({ path: `${out}/${shot}-375-${id}.png` });
  }
  await page.getByRole("button", { name: ui.menu }).click();
  await page.waitForSelector("#mobile-menu");
  const trace = await page.evaluate((contactsHref) => new Promise((resolve) => {
    const start = performance.now();
    const samples = [];
    const link = [...document.querySelectorAll("#mobile-menu a")].find((node) => node.getAttribute("href") === contactsHref);
    link.click();
    function frame() {
      const section = document.getElementById("contacts");
      samples.push({
        t: Math.round(performance.now() - start),
        y: Math.round(window.scrollY),
        menu: Boolean(document.getElementById("mobile-menu")),
        fixed: document.body.style.position === "fixed",
        hash: location.hash,
      });
      if (samples.length < 12) requestAnimationFrame(frame);
      else resolve({ samples, headingTop: Math.round(section.querySelector("h2").getBoundingClientRect().top), max: Math.round(document.documentElement.scrollHeight - innerHeight) });
    }
    requestAnimationFrame(frame);
  }), contactsHref);
  await waitForScroll(page, "contacts");
  const end = await headingOffset(page, "contacts");
  const scrollStart = trace.samples.find((sample) => sample.y > 20);
  report.checks.mobile = { rows, trace: trace.samples, end, scrollStart, errors };
  if (!scrollStart || scrollStart.menu || scrollStart.fixed) fail("menu-before-scroll", { scrollStart, samples: trace.samples });
  assertLanded("trace-contacts", end);
  if (errors.length) fail("mobile-console", errors);
  await page.screenshot({ path: `${out}/${shot}-375-contacts-menu.png` });
  await context.close();
}

async function reduced() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(`${base}${home}`, { waitUntil: "networkidle" });
  const result = await page.evaluate((pricesHref) => new Promise((resolve) => {
    const link = [...document.querySelectorAll("nav.nav a")].find((node) => node.getAttribute("href") === pricesHref);
    link.click();
    const y0 = Math.round(window.scrollY);
    requestAnimationFrame(() => {
      const section = document.getElementById("prices");
      resolve({
        y0,
        y1: Math.round(window.scrollY),
        expectedY: Math.min(
          Math.round(document.documentElement.scrollHeight - innerHeight),
          Math.max(0, Math.round(section.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(section).scrollMarginTop) || 0))),
        ),
        headingTop: Math.round(section.querySelector("h2").getBoundingClientRect().top),
        headerH: Math.round(document.querySelector("header").offsetHeight),
        behavior: getComputedStyle(document.documentElement).scrollBehavior,
      });
    });
  }), pricesHref);
  report.checks.reduced = result;
  if (result.y1 < 100 || Math.abs(result.y1 - result.expectedY) > 4) fail("reduced-not-instant", result);
  if (result.headingTop < result.headerH) fail("reduced-offset", result);
  if (result.behavior !== "auto") fail("reduced-css", result);
  await context.close();
}

async function otherPages() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`${base}${schedulePath}`, { waitUntil: "networkidle" });
  const schedule = await page.locator("nav.nav [aria-current='location']").allTextContents();
  await page.goto(`${base}${bookingPath}`, { waitUntil: "networkidle" });
  const booking = await currentCount(page);
  report.checks.otherPages = { schedule, booking };
  if (schedule.length !== 1 || schedule[0] !== ui.schedule) fail("schedule-current", { schedule });
  if (booking !== 0) fail("booking-current", { booking });
  await context.close();
}

async function hours() {
  const expected = ui.hours;
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`${base}${home}`, { waitUntil: "networkidle" });
  const footer = await page.locator("footer .num").last().innerText();
  const contacts = await page.locator("#contacts .hours").innerText();
  const fact = await page.locator(".facts").innerText();
  report.checks.hours = { footer, contacts, fact };
  if (footer !== expected) fail("footer-hours", { footer, expected });
  for (const line of ui.hourLines) {
    if (!contacts.includes(line)) fail("contacts-hours", { missing: line, contacts });
  }
  if (!fact.includes(ui.fact[0]) || !fact.includes(ui.fact[1])) fail("fact-hours", { fact });
  const metas = {};
  for (const [tab, name, meta] of ui.metas) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    metas[name] = await page.locator("#directions .subs li").filter({ hasText: name }).locator(".meta").innerText();
    if (metas[name] !== meta) fail("class-meta", { name, meta: metas[name], expected: meta });
  }
  report.checks.hours.metas = metas;
  await context.close();
}

async function routeTop() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto(`${base}${home}`, { waitUntil: "networkidle" });
  const setup = await page.evaluate(() => {
    window.scrollTo({ top: 2400, behavior: "instant" });
    return {
      y: Math.round(window.scrollY),
      behavior: getComputedStyle(document.documentElement).scrollBehavior,
      flag: document.documentElement.dataset.scrollBehavior,
    };
  });
  const samples = await page.evaluate((schedulePath) => new Promise((resolve) => {
    const link = [...document.querySelectorAll("nav.nav a")].find((node) => node.getAttribute("href") === schedulePath);
    const frames = [];
    link.click();
    const start = performance.now();
    function frame() {
      frames.push({
        t: Math.round(performance.now() - start),
        y: Math.round(window.scrollY),
        path: location.pathname,
      });
      const onSchedule = frames.filter((sample) => sample.path === schedulePath);
      if (onSchedule.length < 2 && performance.now() - start < 5000) requestAnimationFrame(frame);
      else resolve(frames);
    }
    requestAnimationFrame(frame);
  }), schedulePath);
  const first = samples.find((sample) => sample.path === schedulePath);
  report.checks.routeTop = { setup, first, samples, errors };
  if (setup.behavior !== "smooth" || setup.flag !== "smooth") fail("smooth-css", setup);
  if (setup.y < 2000) fail("route-setup", setup);
  if (!first || first.y !== 0) fail("schedule-first-frame", { first, samples });
  if (errors.length) fail("route-console", errors);
  await context.close();
}

async function fromSchedule() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(`${base}${schedulePath}`, { waitUntil: "networkidle" });
  await page.getByRole("navigation").getByRole("link", { name: ui.prices, exact: true }).click();
  await page.waitForURL(/#prices/);
  await page.waitForTimeout(900);
  const info = await headingOffset(page, "prices");
  report.checks.fromSchedule = info;
  if (info.hash !== "#prices") fail("cross-hash", info);
  if (info.headingTop < info.headerH) fail("cross-offset", info);
  await page.screenshot({ path: `${out}/${shot}-1440-from-schedule.png` });
  await context.close();
}

function collapse(samples) {
  const steps = [];
  for (const y of samples) {
    if (steps.length === 0 || steps[steps.length - 1] !== y) steps.push(y);
  }
  return steps;
}

function assertTrace(name, samples) {
  const steps = collapse(samples);
  report.checks[name] = steps;
  if (samples.length < 2) {
    fail(`${name}-samples`, steps);
    return;
  }
  const start = samples[0];
  const end = samples[samples.length - 1];
  const floor = Math.min(start, end) - 2;
  if (samples.some((y) => y < floor)) fail(`${name}-dip`, { floor, steps });
  if (end > 2 && samples.some((y) => y === 0)) fail(`${name}-zero`, { steps });
  const descending = end + 2 < start;
  for (let index = 1; index < samples.length; index += 1) {
    const backward = descending ? samples[index] > samples[index - 1] + 2 : samples[index] < samples[index - 1] - 2;
    if (backward) {
      fail(`${name}-backwards`, { steps });
      return;
    }
  }
}

async function tracePair(page, fromId, toId, toLabel, mobile) {
  if (mobile) {
    await page.evaluate(() => document.getElementById("menu-button").click());
    await page.waitForSelector("#mobile-menu");
  }
  const samples = await page.evaluate(
    ({ toLabel, mobile, toId }) =>
      new Promise((resolve) => {
        const samples = [Math.round(window.scrollY)];
        let stop = false;
        const mark = () => samples.push(Math.round(window.scrollY));
        window.addEventListener("scroll", mark, { passive: true });
        function frame() {
          if (stop) return;
          mark();
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        const root = mobile ? document.querySelector("#mobile-menu") : document.querySelector("nav.nav");
        const link = [...root.querySelectorAll("a")].find((node) => node.textContent.trim() === toLabel);
        link.click();
        const started = performance.now();
        function finish() {
          const section = document.getElementById(toId);
          const max = document.documentElement.scrollHeight - innerHeight;
          const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
          const expected = Math.min(max, Math.max(0, section.getBoundingClientRect().top + window.scrollY - margin));
          const settled = Math.abs(window.scrollY - expected) < 2 && performance.now() - started > 80;
          if (settled || performance.now() - started > 7000) {
            stop = true;
            window.removeEventListener("scroll", mark);
            samples.push(Math.round(window.scrollY));
            resolve(samples);
            return;
          }
          requestAnimationFrame(finish);
        }
        requestAnimationFrame(finish);
      }),
    { toLabel, mobile, toId },
  );
  assertTrace(`${mobile ? "375" : "1440"}-${fromId}-to-${toId}`, samples);
  await waitForScroll(page, toId);
  const info = await headingOffset(page, toId);
  assertLanded(`${mobile ? "m" : "d"}-${toId}`, info, { skipRing: true });
}

async function pairPass(mobile) {
  const width = mobile ? 375 : 1440;
  const context = await browser.newContext({ viewport: { width, height: mobile ? 812 : 1000 } });
  const page = await context.newPage();
  await page.goto(`${base}${home}`, { waitUntil: "networkidle" });
  const pricesLabel = targets.find((item) => item[0] === "prices")[1];
  if (mobile) {
    await page.evaluate(() => document.getElementById("menu-button").click());
    await page.waitForSelector("#mobile-menu");
    await page.evaluate((pricesLabel) => {
      const link = [...document.querySelectorAll("#mobile-menu a")].find((node) => node.textContent.trim() === pricesLabel);
      link.click();
    }, pricesLabel);
  } else {
    await page.locator("nav.nav").getByRole("link", { name: pricesLabel, exact: true }).click();
  }
  await waitForScroll(page, "prices");
  for (const [fromId, toId] of [
    ["prices", "studio"],
    ["studio", "contacts"],
    ["contacts", "prices"],
  ]) {
    const label = targets.find((item) => item[0] === toId)[1];
    await tracePair(page, fromId, toId, label, mobile);
  }
  await context.close();
}

try {
  await desktop(1440);
  await mobile();
  await pairPass(false);
  await pairPass(true);
  await reduced();
  await fromSchedule();
  await otherPages();
  await hours();
  await routeTop();
} catch (error) {
  fail("crash", String(error?.stack || error));
}
await browser.close();
console.log(JSON.stringify(report, null, 2));
if (report.failures.length) process.exit(1);
