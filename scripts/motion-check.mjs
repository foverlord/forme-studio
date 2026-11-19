import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.BASE ?? "http://127.0.0.1:4318";
const locale = process.env.LOCALE === "kk" ? "kk" : "ru";
const homePath = locale === "kk" ? "/kk" : "/";
const bookingPath = locale === "kk" ? "/kk/booking" : "/booking";
const copy = locale === "kk"
  ? {
      hero: "Күш",
      success: "Өтінім жіберілді",
      tab: "Күш",
      bring: "Өзіңізбен не алу керек",
    }
  : {
      hero: "Сила",
      success: "Заявка отправлена",
      tab: "Сила",
      bring: "Что взять с собой",
    };
const shot = (name) => `/opt/cursor/artifacts/${locale === "kk" ? "kk-" : ""}${name}`;
const out = "/opt/cursor/artifacts";
await mkdir(out, { recursive: true });

const report = { base, checks: {}, failures: [] };

function fail(name, detail) {
  report.failures.push({ name, detail });
  console.error("FAIL", name, detail);
}

const browser = await chromium.launch({ headless: true });

async function noJs() {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(`${base}${homePath}`, { waitUntil: "load" });
  const result = await page.evaluate(() => {
    const htmlClass = document.documentElement.className;
    const reveals = [...document.querySelectorAll(".reveal")].map((el) => {
      const style = getComputedStyle(el);
      return {
        tag: el.tagName,
        text: (el.textContent || "").trim().slice(0, 40),
        opacity: style.opacity,
        display: style.display,
        visibility: style.visibility,
      };
    });
    const images = [...document.querySelectorAll("main img, .hero img")].map((img) => {
      const style = getComputedStyle(img);
      return {
        alt: img.getAttribute("alt"),
        src: img.getAttribute("src"),
        opacity: style.opacity,
        display: style.display,
        visibility: style.visibility,
        w: img.naturalWidth,
      };
    });
    const hiddenText = reveals.filter((item) => item.opacity !== "1" || item.visibility === "hidden" || item.display === "none");
    const hiddenPhotos = images.filter((item) => item.opacity !== "1" || item.visibility === "hidden" || item.display === "none" || !item.src);
    return {
      htmlClass,
      revealCount: reveals.length,
      imageCount: images.length,
      hiddenText,
      hiddenPhotos,
      sample: document.querySelector("h1")?.textContent,
      textLength: document.body.innerText.length,
    };
  });
  await page.screenshot({ path: shot("motion-nojs-home.png"), fullPage: false });
  report.checks.noJs = result;
  if (/\bjs\b/.test(result.htmlClass)) fail("noJs", "html has js class with JavaScript disabled");
  if (result.revealCount < 8) fail("noJs", `expected reveal nodes in HTML, got ${result.revealCount}`);
  if (result.hiddenText.length) fail("noJs", result.hiddenText);
  if (result.hiddenPhotos.length) fail("noJs", result.hiddenPhotos);
  if (!result.sample?.includes(copy.hero) || result.textLength < 400) fail("noJs", result.sample);
  await context.close();
}

async function reduced() {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(`${base}${homePath}`, { waitUntil: "networkidle" });
  const home = await page.evaluate(() => {
    const reveals = [...document.querySelectorAll(".reveal")].map((el) => {
      const style = getComputedStyle(el);
      return {
        opacity: style.opacity,
        transform: style.transform,
        transitionDuration: style.transitionDuration,
        animationName: style.animationName,
      };
    });
    const btn = document.querySelector(".btn");
    const btnStyle = getComputedStyle(btn);
    btn.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    btn.classList.add("is-active-probe");
    const active = getComputedStyle(btn);
    return {
      js: document.documentElement.classList.contains("js"),
      bad: reveals.filter((item) => item.opacity !== "1" || item.transform !== "none" || item.transitionDuration !== "0s" || item.animationName !== "none"),
      revealCount: reveals.length,
      btnTransition: btnStyle.transitionDuration,
      btnTransform: active.transform,
    };
  });
  report.checks.reducedHome = { js: home.js, revealCount: home.revealCount, bad: home.bad.length, btnTransition: home.btnTransition, btnTransform: home.btnTransform };
  if (!home.js) fail("reduced", "js class missing");
  if (home.bad.length) fail("reduced-reveal", home.bad.slice(0, 4));
  if (home.btnTransition !== "0s") fail("reduced-btn", home.btnTransition);
  if (home.btnTransform !== "none") fail("reduced-btn-transform", home.btnTransform);

  await page.goto(`${base}${bookingPath}?demoNow=2026-10-16T08:00`, { waitUntil: "networkidle" });
  await page.locator("#name").fill("Алия");
  await page.locator("#phone").fill("+7 701 234 56 78");
  await page.locator("#consent").check();
  await page.locator("button[type=submit]").click();
  await page.getByRole("heading", { name: copy.success }).waitFor();
  const success = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll(".ok-pop, .ok-rise")].map((el) => {
      const style = getComputedStyle(el);
      return { opacity: style.opacity, transform: style.transform, animationName: style.animationName, transitionDuration: style.transitionDuration };
    });
    const panel = document.querySelector(".bring-panel");
    const panelStyle = getComputedStyle(panel);
    return {
      nodes,
      panelTransition: panelStyle.transitionDuration,
      panelOpacity: panelStyle.opacity,
    };
  });
  report.checks.reducedSuccess = success;
  if (success.nodes.some((item) => item.opacity !== "1" || item.transform !== "none" || item.animationName !== "none")) {
    fail("reduced-success", success.nodes);
  }
  if (success.panelTransition !== "0s") fail("reduced-panel", success.panelTransition);
  await context.close();
}

async function directionsAndButtons() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const orig = EventTarget.prototype.addEventListener;
    window.__scrollListeners = [];
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (type === "scroll") window.__scrollListeners.push(new Error("scroll").stack.split("\n").slice(1, 4).join(" | "));
      return orig.call(this, type, listener, options);
    };
  });
  await page.goto(`${base}${homePath}`, { waitUntil: "networkidle" });
  await page.locator("#directions").scrollIntoViewIfNeeded();
  const before = await page.locator(".cat-img").boundingBox();
  const samples = [before.height];
  await page.getByRole("tab", { name: copy.tab }).click();
  for (let i = 0; i < 10; i += 1) {
    const box = await page.locator(".cat-img").boundingBox();
    samples.push(Math.round(box.height * 100) / 100);
    await page.waitForTimeout(30);
  }
  const photo = await page.evaluate(() => {
    const el = document.querySelector(".cat-photo-in");
    const text = document.querySelector(".cat-text-in");
    const img = getComputedStyle(document.querySelector(".cat-img"));
    return {
      photo: el ? getComputedStyle(el).animationName : null,
      photoDur: el ? getComputedStyle(el).animationDuration : null,
      photoEase: el ? getComputedStyle(el).animationTimingFunction : null,
      textDur: text ? getComputedStyle(text).animationDuration : null,
      textDelay: text ? getComputedStyle(text).animationDelay : null,
      textEase: text ? getComputedStyle(text).animationTimingFunction : null,
      ratio: img.aspectRatio,
      height: document.querySelector(".cat-img").getBoundingClientRect().height,
    };
  });
  const button = await page.evaluate(() => {
    const el = document.querySelector(".btn");
    const idle = getComputedStyle(el).transform;
    el.style.setProperty("transform", "scale(0.97)");
    return { idle, transition: getComputedStyle(el).transitionProperty, duration: getComputedStyle(el).transitionDuration };
  });
  const rule = await page.evaluate(() => {
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      for (const rule of rules) {
        if (rule.selectorText === ".btn:active") return rule.cssText;
      }
    }
    return null;
  });
  const scrollListeners = await page.evaluate(() => window.__scrollListeners);
  report.checks.directions = { samples, photo, button, rule, scrollListeners: scrollListeners.length };
  const unique = [...new Set(samples.map((n) => Math.round(n)))];
  if (unique.length !== 1) fail("directions-height", samples);
  if (photo.photo !== "cat-photo") fail("directions-photo-anim", photo);
  if (photo.photoDur !== "0.24s") fail("directions-photo-dur", photo);
  if (photo.textDur !== "0.2s") fail("directions-text-dur", photo);
  if (photo.textDelay !== "0.04s") fail("directions-text-delay", photo);
  if (!button.transition.includes("transform")) fail("btn-transition", button);
  if (!String(button.duration).includes("0.14s")) fail("btn-duration", button);
  if (!rule?.includes("scale(0.97)")) fail("btn-active", rule);
  await page.screenshot({ path: shot("motion-directions.png") });
  await context.close();
}

async function checklistAndSuccess() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.route("**/api/booking", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }),
  );
  await page.goto(`${base}${bookingPath}?demoNow=2026-10-16T08:00`, { waitUntil: "networkidle" });
  await page.locator("#name").fill("Алия");
  await page.locator("#phone").fill("+7 701 234 56 78");
  await page.locator("#consent").check();
  const early = await page.evaluate(() => new Promise((resolve) => {
    document.querySelector("button[type=submit]").click();
    const started = performance.now();
    function check() {
      const heading = document.getElementById("success-title");
      if (heading) {
        const animation = heading.getAnimations()[0];
        resolve({
          active: document.activeElement?.id ?? null,
          opacity: getComputedStyle(heading).opacity,
          currentTime: animation ? animation.currentTime : null,
          playState: animation ? animation.playState : null,
          elapsed: Math.round(performance.now() - started),
        });
        return;
      }
      if (performance.now() - started > 6000) resolve({ timeout: true, elapsed: 6000 });
      else requestAnimationFrame(check);
    }
    requestAnimationFrame(check);
  }));
  report.checks.successFocus = early;
  if (early.timeout) fail("success", "heading never appeared");
  if (early.active !== "success-title") fail("success-focus", early);

  const motion = await page.evaluate(() => {
    const check = document.querySelector(".ok-pop");
    const note = document.querySelector(".success-note");
    const details = document.querySelectorAll(".ok-rise")[2];
    const style = (el) => {
      const computed = getComputedStyle(el);
      return {
        name: computed.animationName,
        duration: computed.animationDuration,
        delay: computed.animationDelay,
        easing: computed.animationTimingFunction,
      };
    };
    return { check: style(check), note: style(note), details: style(details) };
  });
  report.checks.successMotion = motion;
  if (motion.check.duration !== "0.32s" || motion.check.name !== "ok-pop") fail("success-check", motion.check);
  if (motion.note.delay !== "0.38s" || motion.details.delay !== "0.44s") fail("success-stagger", motion);

  const toggle = page.getByRole("button", { name: copy.bring });
  const closed = await page.evaluate((bring) => {
    const panel = document.querySelector(".bring-panel");
    const clip = document.querySelector(".bring-clip");
    const button = [...document.querySelectorAll("button")].find((node) => node.textContent?.includes(bring));
    return {
      expanded: button?.getAttribute("aria-expanded"),
      inert: panel.inert,
      height: clip.getBoundingClientRect().height,
      rows: getComputedStyle(panel).gridTemplateRows,
      transition: getComputedStyle(panel).transitionProperty,
      duration: getComputedStyle(panel).transitionDuration,
    };
  }, copy.bring);
  await toggle.focus();
  await page.keyboard.press("Tab");
  const focusAfter = await page.evaluate(() => ({
    inside: document.querySelector(".bring-panel")?.contains(document.activeElement) ?? false,
    active: document.activeElement?.tagName,
  }));
  await toggle.click();
  await page.waitForTimeout(280);
  const opened = await page.evaluate((bring) => {
    const panel = document.querySelector(".bring-panel");
    const clip = document.querySelector(".bring-clip");
    const button = [...document.querySelectorAll("button")].find((node) => node.textContent?.includes(bring));
    return {
      expanded: button?.getAttribute("aria-expanded"),
      inert: panel.inert,
      height: clip.getBoundingClientRect().height,
      text: document.querySelector(".bring")?.innerText?.slice(0, 40),
    };
  }, copy.bring);
  await toggle.click();
  await page.waitForTimeout(280);
  const reclosed = await page.evaluate((bring) => {
    const button = [...document.querySelectorAll("button")].find((node) => node.textContent?.includes(bring));
    return {
      expanded: button?.getAttribute("aria-expanded"),
      inert: document.querySelector(".bring-panel").inert,
      height: document.querySelector(".bring-clip").getBoundingClientRect().height,
    };
  }, copy.bring);
  report.checks.checklist = { closed, focusAfter, opened, reclosed };
  if (closed.expanded !== "false" || closed.inert !== true || closed.height !== 0) fail("checklist-closed", closed);
  if (!closed.transition.includes("grid-template-rows") || !closed.duration.includes("0.24s")) fail("checklist-transition", closed);
  if (focusAfter.inside) fail("checklist-focus", focusAfter);
  if (opened.expanded !== "true" || opened.inert !== false || opened.height < 20) fail("checklist-open", opened);
  if (reclosed.expanded !== "false" || reclosed.height !== 0 || reclosed.inert !== true) fail("checklist-reclose", reclosed);
  await page.screenshot({ path: shot("motion-success.png") });
  await context.close();
}

async function revealOnce() {
  const tall = await browser.newContext({ viewport: { width: 1280, height: 1600 } });
  const tallPage = await tall.newPage();
  await tallPage.goto(`${base}${homePath}`, { waitUntil: "networkidle" });
  const immediate = await tallPage.evaluate(() => {
    const intro = document.querySelector(".intro.reveal");
    const contacts = document.querySelector("#contacts .reveal");
    const style = (el) => (el ? { opacity: getComputedStyle(el).opacity, cls: el.className } : null);
    return { intro: style(intro), contacts: style(contacts) };
  });
  await tall.close();

  const context = await browser.newContext({ viewport: { width: 375, height: 700 } });
  const page = await context.newPage();
  await page.goto(`${base}${homePath}`, { waitUntil: "networkidle" });
  const before = await page.evaluate(() => {
    const facts = [...document.querySelectorAll(".facts .reveal")];
    return facts.map((el) => ({
      cls: el.className,
      opacity: getComputedStyle(el).opacity,
      delay: getComputedStyle(el).transitionDelay,
      index: el.style.getPropertyValue("--reveal-i"),
    }));
  });
  await page.locator(".facts").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => {
    const facts = [...document.querySelectorAll(".facts .reveal")];
    const contacts = document.querySelector("#contacts .reveal");
    return {
      facts: facts.map((el) => ({
        cls: el.className,
        opacity: getComputedStyle(el).opacity,
        delay: getComputedStyle(el).transitionDelay,
      })),
      contacts: contacts ? { opacity: getComputedStyle(contacts).opacity, cls: contacts.className } : null,
    };
  });
  report.checks.reveal = { immediate, before, after };
  if (immediate.intro?.opacity !== "1") fail("reveal-above-fold", immediate.intro);
  if (immediate.contacts?.opacity !== "0") fail("reveal-below-hidden", immediate.contacts);
  if (before.some((item) => item.opacity !== "0" || item.cls.includes("no-anim"))) fail("reveal-facts-initial", before);
  if (after.facts.some((item) => item.opacity !== "1" || !item.cls.includes("is-in"))) fail("reveal-facts-in", after.facts);
  const delays = after.facts.map((item) => item.delay);
  if (delays[0] !== "0s" || delays[1] !== "0.06s" || delays[3] !== "0.18s") fail("reveal-stagger", delays);
  await context.close();
}

async function performance() {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto(`${base}${homePath}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const busy = await page.evaluate(() => {
    const started = performance.now();
    let total = 0;
    for (let i = 0; i < 400000; i += 1) total += Math.sqrt(i);
    return { ms: Math.round(performance.now() - started), total };
  });
  const metrics = await page.evaluate(async () => {
    const longTasks = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) longTasks.push(Math.round(entry.duration * 10) / 10);
    });
    observer.observe({ type: "longtask", buffered: false });
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    let frames = 0;
    let dropped = 0;
    let last = 0;
    const started = performance.now();
    await new Promise((resolve) => {
      const scrollStart = performance.now();
      const duration = 3000;
      function frame(now) {
        if (last) {
          const dt = now - last;
          if (dt > 16.67 * 1.5) dropped += Math.max(1, Math.round(dt / 16.67) - 1);
        }
        last = now;
        frames += 1;
        const progress = Math.min(1, (now - scrollStart) / duration);
        window.scrollTo({ top: distance * progress, behavior: "instant" });
        if (progress < 1) requestAnimationFrame(frame);
        else requestAnimationFrame(() => requestAnimationFrame(resolve));
      }
      requestAnimationFrame(frame);
    });
    observer.disconnect();
    const elapsed = performance.now() - started;
    const painted = frames;
    const total = painted + dropped;
    return {
      elapsed: Math.round(elapsed),
      frames: painted,
      dropped,
      droppedPct: total ? Math.round((dropped / total) * 1000) / 10 : 0,
      longest: longTasks.reduce((max, value) => Math.max(max, value), 0),
      longTasks,
      distance,
    };
  });
  const calm = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const calmPage = await calm.newPage();
  await calmPage.goto(`${base}${homePath}`, { waitUntil: "domcontentloaded" });
  const unthrottled = await calmPage.evaluate(() => {
    const started = performance.now();
    let total = 0;
    for (let i = 0; i < 400000; i += 1) total += Math.sqrt(i);
    return { ms: Math.round(performance.now() - started), total };
  });
  await calm.close();
  report.checks.performance = {
    cpu: { throttledMs: busy.ms, unthrottledMs: unthrottled.ms },
    ...metrics,
    method: "Playwright Chromium, viewport 375x812, CDP Emulation.setCPUThrottlingRate 4 before navigation. After networkidle plus 800ms idle, a 3s linear window.scrollTo from top to bottom. Dropped frames: requestAnimationFrame gaps longer than 25ms count as round(dt/16.67)-1 missed 60Hz frames. Percent = dropped / (painted + dropped). Longest task: PerformanceObserver longtask (tasks >= 50ms) during that scroll only.",
  };
  if (metrics.droppedPct > 5) fail("dropped-frames", metrics);
  if (metrics.longest >= 100) fail("longest-task", metrics);
  await page.screenshot({ path: `${out}/motion-home-375.png` });
  await context.close();
}

try {
  await noJs();
  await reduced();
  await directionsAndButtons();
  await checklistAndSuccess();
  await revealOnce();
  await performance();
} catch (error) {
  fail("crash", String(error?.stack || error));
}

await browser.close();
await writeFile(`${out}/motion-note.md`, `# Motion checks\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`);
console.log(JSON.stringify(report, null, 2));
if (report.failures.length) process.exit(1);
