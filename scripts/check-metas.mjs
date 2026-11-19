/**
 * Compare direction class meta strings with content/schedule.ts.
 * Schedule is the source of truth. Does not edit either file.
 *
 * A meta that names a clock time is checked against rows of that direction
 * at that time (name match first, otherwise every row at that time).
 * A meta without a time is checked against name matches in the same direction.
 * Day lists use «пн, ср, чт» and a range like «пн–пт» only for consecutive days.
 */
import { readFileSync } from "node:fs";

const directionsPath = new URL("../content/directions.ts", import.meta.url);
const schedulePath = new URL("../content/schedule.ts", import.meta.url);
const directionsSrc = readFileSync(directionsPath, "utf8");
const scheduleSrc = readFileSync(schedulePath, "utf8");

const DAY = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const DAY_INDEX = Object.fromEntries(DAY.map((label, index) => [label, index]));
const LEVEL_LABEL = { beginner: "новичкам", intermediate: "средний уровень", all: "все уровни" };

function nameKey(name) {
  return name
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/сила:\s*/g, "")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .replace(/ йога$/g, "")
    .trim();
}

function namesMatch(className, scheduleName) {
  const card = nameKey(className);
  const row = nameKey(scheduleName);
  if (card === row) return true;
  const extra = card.slice(row.length).trim();
  const prefix = card.startsWith(`${row} `);
  if (prefix && extra && !extra.startsWith("для") && !extra.startsWith("после")) return true;
  if (card.endsWith(` ${row}`)) return true;
  return false;
}

function parseSchedule(source) {
  const rows = [];
  for (const line of source.split("\n")) {
    if (!line.includes("start:") || !line.includes("durationMin:")) continue;
    const directionId = /directionId:\s*"([^"]+)"/.exec(line)?.[1];
    const name = /name:\s*"([^"]+)"/.exec(line)?.[1];
    const weekday = Number(/weekday:\s*(\d)/.exec(line)?.[1]);
    const start = /start:\s*"([^"]+)"/.exec(line)?.[1];
    const durationMin = Number(/durationMin:\s*(\d+)/.exec(line)?.[1]);
    const level = /level:\s*"([^"]+)"/.exec(line)?.[1];
    if (!directionId || !name || !start || !level || Number.isNaN(weekday) || Number.isNaN(durationMin)) {
      throw new Error(`Unparsed schedule line: ${line.trim()}`);
    }
    rows.push({ directionId, name, weekday, start, durationMin, level });
  }
  return rows;
}

function parseClasses(source) {
  const classes = [];
  const blockRe = /id:\s*"(strength|functional|yoga|mobility|recovery)"[\s\S]*?classes:\s*\[([\s\S]*?)\]/g;
  for (const block of source.matchAll(blockRe)) {
    const directionId = block[1];
    const body = block[2];
    const classRe = /name:\s*"([^"]+)"\s*,\s*text:\s*"([^"]*)"\s*,\s*meta:\s*"([^"]+)"/g;
    for (const item of body.matchAll(classRe)) {
      classes.push({ directionId, name: item[1], meta: item[3] });
    }
  }
  return classes;
}

function parseMeta(meta) {
  const duration = Number(/(\d+)\s*мин/.exec(meta)?.[1]);
  let level = null;
  if (meta.includes("новичкам")) level = "beginner";
  else if (meta.includes("средний уровень")) level = "intermediate";
  else if (meta.includes("все уровни")) level = "all";
  const time = /\d{1,2}:\d{2}/.exec(meta)?.[0] ?? null;
  const days = new Set();
  const dayRe = /(пн|вт|ср|чт|пт|сб|вс)(?:\s*[–-]\s*(пн|вт|ср|чт|пт|сб|вс))?(?![а-яё])/g;
  for (const match of meta.matchAll(dayRe)) {
    const from = DAY_INDEX[match[1]];
    const to = match[2] ? DAY_INDEX[match[2]] : from;
    for (let day = from; day <= to; day += 1) days.add(day);
  }
  return { duration: Number.isNaN(duration) ? null : duration, level, time, days };
}

function formatDays(weekdays, dayLabels = DAY) {
  const days = [...new Set(weekdays)].sort((a, b) => a - b);
  const parts = [];
  let start = days[0];
  let prev = days[0];
  for (let index = 1; index <= days.length; index += 1) {
    const day = days[index];
    if (day === prev + 1) {
      prev = day;
      continue;
    }
    const span = prev - start + 1;
    parts.push(span >= 3 ? `${dayLabels[start]}–${dayLabels[prev]}` : dayLabels.slice(start, prev + 1).join(", "));
    start = day;
    prev = day;
  }
  return parts.join(", ");
}

function expectedMeta(rows, dayLabels = DAY, levelLabel = LEVEL_LABEL) {
  const duration = rows[0].durationMin;
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.start}|${row.level}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row.weekday);
  }
  const ordered = [...groups.entries()].sort((a, b) => {
    const [aTime] = a[0].split("|");
    const [bTime] = b[0].split("|");
    const aMin = Math.min(...a[1]);
    const bMin = Math.min(...b[1]);
    const aClock = Number(aTime.slice(0, 2)) * 60 + Number(aTime.slice(3));
    const bClock = Number(bTime.slice(0, 2)) * 60 + Number(bTime.slice(3));
    return aMin - bMin || aClock - bClock;
  });
  const levels = new Set(rows.map((row) => row.level));
  const times = new Set(rows.map((row) => row.start));
  if (levels.size === 1 && times.size === 1) {
    const [time, level] = ordered[0][0].split("|");
    return `${duration} мин · ${levelLabel[level]} · ${formatDays(ordered[0][1], dayLabels)} ${time}`;
  }
  if (levels.size === 1) {
    const level = [...levels][0];
    const slots = ordered.map(([key, weekdays]) => {
      const [time] = key.split("|");
      return `${formatDays(weekdays, dayLabels)} ${time}`;
    });
    return `${duration} мин · ${levelLabel[level]} · ${slots.join(", ")}`;
  }
  const slots = ordered.map(([key, weekdays]) => {
    const [time, level] = key.split("|");
    return `${formatDays(weekdays, dayLabels)} ${time} ${levelLabel[level]}`;
  });
  return `${duration} мин · ${slots.join(" · ")}`;
}

/** Every schedule row of this class, including Saturday and other times. */
function matchRows(schedule, item) {
  const inDirection = schedule.filter((row) => row.directionId === item.directionId);
  const byName = inDirection.filter((row) => namesMatch(item.name, row.name));
  if (byName.length) return { rows: byName, how: "name" };
  return { rows: [], how: "none" };
}

const schedule = parseSchedule(scheduleSrc);
const classes = parseClasses(directionsSrc);
const mismatches = [];
const unscheduled = [];
const ok = [];

for (const item of classes) {
  const parsed = parseMeta(item.meta);
  const { rows, how } = matchRows(schedule, item);
  if (!rows.length) {
    if (parsed.time || parsed.days.size) {
      mismatches.push({ ...item, how, reason: "meta names a day or time with no schedule row", expected: null });
    } else {
      unscheduled.push(item);
    }
    continue;
  }
  const expected = expectedMeta(rows);
  if (item.meta !== expected) {
    const durations = [...new Set(rows.map((row) => row.durationMin))];
    const levels = [...new Set(rows.map((row) => LEVEL_LABEL[row.level]))];
    mismatches.push({
      ...item,
      how,
      expected,
      scheduleDays: formatDays(rows.map((row) => row.weekday)),
      scheduleTimes: [...new Set(rows.map((row) => row.start))].join(", "),
      durations: durations.join(", "),
      levels: levels.join(", "),
      parsedDays: formatDays([...parsed.days]),
      parsedLevel: parsed.level ? LEVEL_LABEL[parsed.level] : null,
      parsedDuration: parsed.duration,
    });
  } else {
    ok.push({ ...item, how });
  }
}

console.log(`classes: ${classes.length}`);
console.log(`ok: ${ok.length}`);
console.log(`unscheduled: ${unscheduled.length}`);
console.log(`mismatches: ${mismatches.length}`);
if (unscheduled.length) {
  console.log("\nno schedule row (meta states no day or time, left as written):");
  for (const item of unscheduled) console.log(`  ${item.directionId} / ${item.name} — ${item.meta}`);
}
if (ok.length) {
  console.log("\nok:");
  for (const item of ok) console.log(`  ${item.directionId} / ${item.name} — ${item.meta} [${item.how}]`);
}
if (mismatches.length) {
  console.log("\nmismatches:");
  for (const item of mismatches) {
    console.log(`  ${item.directionId} / ${item.name} [${item.how}]`);
    console.log(`    old: ${item.meta}`);
    console.log(`    new: ${item.expected}`);
    if (item.scheduleDays) {
      console.log(`    schedule: days ${item.scheduleDays}; time ${item.scheduleTimes}; ${item.durations} мин; ${item.levels}`);
      console.log(`    parsed:   days ${item.parsedDays || "—"}; ${item.parsedDuration ?? "—"} мин; ${item.parsedLevel || "—"}`);
    }
  }
}

const kkDictSrc = readFileSync(new URL("../content/kk-dictionary.ts", import.meta.url), "utf8");
const kkMarker = ["export const kk: Dictionary = ", "export const kk = "].find((marker) => kkDictSrc.includes(marker));
if (!kkMarker) throw new Error("kk dictionary export not found");
const kkStart = kkDictSrc.indexOf(kkMarker);
const kkDict = JSON.parse(kkDictSrc.slice(kkStart + kkMarker.length).replace(/;\s*$/, ""));
const kkDay = kkDict.weekdays.short.map((label) => label.toLowerCase());
const kkLevel = {
  beginner: kkDict.levels.beginner.toLowerCase(),
  intermediate: kkDict.levels.intermediate.toLowerCase(),
  all: kkDict.levels.all.toLowerCase(),
};

const kkCopySrc = readFileSync(new URL("../content/kk-copy.ts", import.meta.url), "utf8");
const kkMetas = [...kkCopySrc.matchAll(/"meta": "([^"]+)"/g)].map((match) => match[1]);

console.log("\nkk (same schedule, Kazakh day and level labels from the dictionary):");
console.log(`kk metas in copy: ${kkMetas.length}`);
const kkMismatches = [];
const kkOk = [];
classes.forEach((item, index) => {
  const kkMeta = kkMetas[index] ?? "";
  const { rows } = matchRows(schedule, item);
  if (!rows.length) {
    if (/\d{1,2}:\d{2}/.test(kkMeta)) {
      kkMismatches.push({ name: item.name, kk: kkMeta, expected: null });
      console.log(`  mismatch ${item.name}: meta names a time with no schedule row`);
      console.log(`    csv: ${kkMeta}`);
    } else {
      console.log(`  unscheduled ${item.name}: ${kkMeta}`);
    }
    return;
  }
  const expected = expectedMeta(rows, kkDay, kkLevel);
  if (kkMeta !== expected) {
    kkMismatches.push({ name: item.name, kk: kkMeta, expected });
    console.log(`  mismatch ${item.name}`);
    console.log(`    csv: ${kkMeta}`);
    console.log(`    new: ${expected}`);
  } else {
    kkOk.push(item.name);
  }
});
console.log(`kk ok: ${kkOk.length}`);
console.log(`kk mismatches: ${kkMismatches.length}`);

if (mismatches.length || kkMismatches.length) process.exit(1);
