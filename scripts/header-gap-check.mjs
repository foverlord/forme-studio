import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import sharp from "sharp";

const base = process.env.BASE ?? "http://127.0.0.1:4325";
const outDir = process.env.OUT ?? "/opt/cursor/artifacts";
const widths = [1024, 1280, 1440];
const expected = {
  1024: { nav: 20, lastToRule: 20, ruleToRu: 20, ruToSlash: 6, slashToKk: 6, kkToBtn: 24 },
  1280: { nav: 24, lastToRule: 20, ruleToRu: 20, ruToSlash: 6, slashToKk: 6, kkToBtn: 24 },
  1440: { nav: 32, lastToRule: 24, ruleToRu: 24, ruToSlash: 6, slashToKk: 6, kkToBtn: 28 },
};

function lin(c) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}
function lum(r, g, b) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(a, b) {
  const L1 = lum(a[0], a[1], a[2]);
  const L2 = lum(b[0], b[1], b[2]);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
function parseColor(value) {
  const m = value.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(",").map((part) => Number.parseFloat(part.trim()));
  return parts.slice(0, 3);
}

const report = { base, failures: [], gaps: [], contrast: [], mobile: null, pin: null };

function fail(name, detail) {
  report.failures.push({ name, detail });
  console.error("FAIL", name, JSON.stringify(detail));
}

async function measure(page) {
  return page.evaluate(() => {
    const textBox = (el) => {
      const text = [...el.childNodes].find((node) => node.nodeType === 3 && node.textContent.trim());
      const range = document.createRange();
      range.selectNodeContents(text || el);
      const rect = range.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    };
    const nav = [...document.querySelectorAll(".hdr .nav a")];
    const navGaps = [];
    for (let i = 1; i < nav.length; i += 1) navGaps.push(textBox(nav[i]).left - textBox(nav[i - 1]).right);
    const rule = document.querySelector(".hdr-rule").getBoundingClientRect();
    const last = textBox(nav.at(-1));
    const ru = document.querySelector('.hdr .lang-switch a[lang="ru"]');
    const kk = document.querySelector('.hdr .lang-switch a[lang="kk"]');
    const ruBox = textBox(ru);
    const kkBox = textBox(kk);
    const slash = textBox(document.querySelector(".hdr .lang-slash"));
    const btn = document.querySelector(".hdr .btn-cta").getBoundingClientRect();
    const hdr = document.querySelector(".hdr").getBoundingClientRect();
    const wrap = document.querySelector(".hdr .wrap");
    const wrapStyle = getComputedStyle(wrap);
    const btnStyle = getComputedStyle(document.querySelector(".hdr .btn-cta"));
    const inactive = kk.getAttribute("aria-current") === "true" ? ru : kk;
    const inactiveStyle = getComputedStyle(inactive);
    const hits = [ru, kk].map((link) => {
      const rect = link.getBoundingClientRect();
      const before = getComputedStyle(link, "::before");
      const width = Number.parseFloat(before.width);
      const height = Number.parseFloat(before.height);
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const outerX = link === ru ? cx - width / 2 + 1 : cx + width / 2 - 1;
      const hit = document.elementFromPoint(outerX, cy);
      return {
        text: link.textContent,
        before: { width, height },
        outerHitsLink: hit === link || link.contains(hit),
      };
    });
    return {
      navGaps,
      lastToRule: rule.left - last.right,
      ruleToRu: ruBox.left - rule.right,
      ruToSlash: slash.left - ruBox.right,
      slashToKk: kkBox.left - slash.right,
      kkToBtn: btn.left - kkBox.right,
      ruleBox: { width: rule.width, height: rule.height },
      headerHeight: hdr.height,
      wrapHeight: wrap.getBoundingClientRect().height,
      wrapGap: wrapStyle.gap,
      wrapPad: wrapStyle.paddingLeft,
      btnHeight: btn.height,
      btnPad: btnStyle.paddingLeft,
      inactiveColor: inactiveStyle.color,
      inactiveText: inactive.textContent,
      hits,
      btnRight: btn.right,
      wrapRight: wrap.getBoundingClientRect().right,
      spacer: document.querySelector(".hdr .sp").getBoundingClientRect().width,
    };
  });
}

async function lightest(buffer, width, height) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let best = null;
  let bestL = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * info.channels;
      const L = lum(data[i], data[i + 1], data[i + 2]);
      if (L > bestL) {
        bestL = L;
        best = [data[i], data[i + 1], data[i + 2], x, y];
      }
    }
  }
  return { rgb: best.slice(0, 3), x: best[3], y: best[4], width, height };
}

async function shot(page, name, height) {
  const width = page.viewportSize().width;
  await page.screenshot({
    path: `${outDir}/header-${name}.png`,
    clip: { x: 0, y: 0, width, height },
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
await mkdir(outDir, { recursive: true });

for (const width of widths) {
  await page.setViewportSize({ width, height: 900 });
  for (const [mode, path] of [
    ["overlay", "/"],
    ["solid", "/schedule"],
  ]) {
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    const measured = await measure(page);
    const want = expected[width];
    const navOk = measured.navGaps.every((gap) => Math.abs(gap - want.nav) <= 1);
    const pairs = [
      ["lastToRule", measured.lastToRule, want.lastToRule],
      ["ruleToRu", measured.ruleToRu, want.ruleToRu],
      ["ruToSlash", measured.ruToSlash, want.ruToSlash],
      ["slashToKk", measured.slashToKk, want.slashToKk],
      ["kkToBtn", measured.kkToBtn, want.kkToBtn],
    ];
    const bad = pairs.filter(([, got, exp]) => Math.abs(got - exp) > 1);
    if (!navOk || bad.length) fail(`${mode}-${width}`, { navGaps: measured.navGaps, bad, want });
    const bar = mode === "solid" ? 65 : 64;
    if (Math.abs(measured.headerHeight - bar) > 0.6) fail(`header-height-${mode}-${width}`, measured.headerHeight);
    if (Math.abs(measured.wrapHeight - 64) > 0.6) fail(`wrap-height-${mode}-${width}`, measured.wrapHeight);
    if (Math.abs(measured.btnHeight - 48) > 0.6) fail(`btn-height-${mode}-${width}`, measured.btnHeight);
    if (measured.btnPad !== "24px") fail(`btn-pad-${mode}-${width}`, measured.btnPad);
    if (measured.wrapPad !== "64px") fail(`wrap-pad-${mode}-${width}`, measured.wrapPad);
    if (Math.abs(measured.ruleBox.width - 1) > 0.6 || Math.abs(measured.ruleBox.height - 16) > 0.6) {
      fail(`rule-box-${mode}-${width}`, measured.ruleBox);
    }
    for (const hit of measured.hits) {
      if (hit.before.width < 44 || hit.before.height < 44 || !hit.outerHitsLink) fail(`hit-${mode}-${width}`, hit);
    }
    const fg = parseColor(measured.inactiveColor);
    await page.locator(".hdr").evaluate((el) => {
      el.style.visibility = "hidden";
    });
    const buffer = await page.screenshot({ clip: { x: 0, y: 0, width, height: 64 }, type: "png" });
    await page.locator(".hdr").evaluate((el) => {
      el.style.visibility = "";
    });
    const sample = await lightest(buffer, width, 64);
    const ratio = contrast(fg, sample.rgb);
    report.contrast.push({
      mode,
      width,
      inactive: measured.inactiveText,
      color: measured.inactiveColor,
      lightest: { rgb: sample.rgb, x: sample.x, y: sample.y },
      ratio: Number(ratio.toFixed(2)),
    });
    if (ratio < 4.5) fail(`contrast-${mode}-${width}`, { ratio, color: measured.inactiveColor, lightest: sample.rgb });
    await shot(page, `${mode}-${width}`, 96);
    report.gaps.push({
      mode,
      width,
      navGaps: measured.navGaps.map((gap) => Number(gap.toFixed(2))),
      lastToRule: Number(measured.lastToRule.toFixed(2)),
      ruleToRu: Number(measured.ruleToRu.toFixed(2)),
      ruToSlash: Number(measured.ruToSlash.toFixed(2)),
      slashToKk: Number(measured.slashToKk.toFixed(2)),
      kkToBtn: Number(measured.kkToBtn.toFixed(2)),
      rule: measured.ruleBox,
      spacer: Number(measured.spacer.toFixed(1)),
      btnRightInset: Number((measured.wrapRight - measured.btnRight).toFixed(2)),
    });
  }
}

await page.setViewportSize({ width: 375, height: 800 });
await page.goto(`${base}/`, { waitUntil: "networkidle" });
report.mobile = await page.evaluate(() => {
  const wrap = document.querySelector(".hdr .wrap");
  const visible = [...wrap.children]
    .filter((el) => getComputedStyle(el).display !== "none")
    .map((el) => el.className);
  const link = document.querySelector(".hdr .lang-switch a");
  const box = link.getBoundingClientRect();
  return {
    gap: getComputedStyle(wrap).gap,
    visible,
    langMin: getComputedStyle(link).minWidth,
    langBox: { width: box.width, height: box.height },
    headerHeight: document.querySelector(".hdr").getBoundingClientRect().height,
  };
});
if (report.mobile.gap !== "12px") fail("mobile-gap", report.mobile.gap);
if (report.mobile.visible.join(" ") !== "logo sp lang-switch burger") fail("mobile-order", report.mobile.visible);
if (report.mobile.langBox.width < 44 || report.mobile.langBox.height < 44) fail("mobile-hit", report.mobile.langBox);

await browser.close();
console.log(JSON.stringify(report, null, 2));
if (report.failures.length) process.exit(1);
