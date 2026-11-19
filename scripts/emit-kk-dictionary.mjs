/**
 * Build content/kk-dictionary.ts and content/kk-copy.ts from the art CSV.
 * Kazakh sentences come from the CSV cells. This script does not author them.
 *
 * Lookup order: uploads/strings.csv, then the Cursor upload of the same sheet.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const candidates = [
  join(root, "uploads/strings.csv"),
  "/home/ubuntu/.cursor/projects/workspace/uploads/strings_a352.csv",
];
const csvPath = candidates.find((path) => existsSync(path));
if (!csvPath) throw new Error(`CSV not found. Looked in:\n${candidates.join("\n")}`);

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    if (quoted) {
      if (char === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function dictKey(raw) {
  return raw
    .replace(/^dictionary\.ts:\s*/, "")
    .replace(/^NEW:\s*/, "")
    .replace(/\s*\(.*$/, "")
    .replace(/\s+#.*$/, "")
    .trim();
}

const table = parseCsv(readFileSync(csvPath, "utf8"));
const header = table[0];
if (header[0] !== "key_or_location" || header[2] !== "kk") {
  throw new Error(`Unexpected CSV header: ${header.join("|")}`);
}

const dict = new Map();
const notes = new Map();
const lists = new Map();
for (const cells of table.slice(1)) {
  const raw = cells[0];
  if (!raw) continue;
  const kk = cells[2] ?? "";
  const ru = cells[1] ?? "";
  const note = cells[4] ?? "";
  if (raw.startsWith("dictionary.ts:") || raw.startsWith("NEW:")) {
    const key = dictKey(raw);
    dict.set(key, kk);
    notes.set(key, note);
  } else {
    const key = raw.replace(/\s*\(.*$/, "").trim();
    if (!lists.has(key)) lists.set(key, []);
    lists.get(key).push({ ru, kk, note });
  }
}

const missing = [];
function get(path) {
  if (!dict.has(path) || dict.get(path) === "") {
    missing.push(path);
    return "";
  }
  return dict.get(path);
}

function list(key) {
  return lists.get(key) ?? [];
}

const dictionaryPath = join(root, "content/kk-dictionary.ts");
function retained(field) {
  if (!existsSync(dictionaryPath)) return "";
  const source = readFileSync(dictionaryPath, "utf8");
  const match = new RegExp(`"${field}": "((?:\\\\.|[^"\\\\])*)"`).exec(source);
  return match ? JSON.parse(`"${match[1]}"`) : "";
}

const navIds = [
  ["directions", "/#directions"],
  ["schedule", "/schedule"],
  ["trainers", "/#trainers"],
  ["prices", "/#prices"],
  ["studio", "/#studio"],
  ["contacts", "/#contacts"],
];
const menuIds = [
  ["directions", "/#directions"],
  ["schedule", "/schedule"],
  ["first-visit", "/#first-visit"],
  ["trainers", "/#trainers"],
  ["prices", "/#prices"],
  ["studio", "/#studio"],
  ["contacts", "/#contacts"],
];

const stepNote = notes.get("booking.step") ?? "";
const stepTemplate = /Шаблон:\s*«([^»]+)»/.exec(stepNote)?.[1] ?? "";
if (!stepTemplate) missing.push("booking.step template in notes");

const mapHint = dict.get("contacts.mapHint") || retained("mapHint");
const mapTitle = dict.get("contacts.mapTitle") || retained("mapTitle");
if (!dict.has("contacts.mapHint")) missing.push("contacts.mapHint");
if (!dict.has("contacts.mapTitle")) missing.push("contacts.mapTitle");
if (!dict.has("contacts.route")) missing.push("contacts.route (reuses booking.route)");
if (!dict.has("contacts.openMap")) missing.push("contacts.openMap (reuses contacts.maps)");

const kk = {
  meta: {
    title: get("meta.title"),
    description: get("meta.description"),
    scheduleTitle: get("meta.scheduleTitle"),
    bookingTitle: get("meta.bookingTitle"),
  },
  skip: get("skip"),
  logo: get("logo"),
  lang: {
    group: get("lang.switchAria"),
    ru: "Рус",
    kk: "Қаз",
  },
  nav: navIds.map(([id, href], index) => ({ id, href, label: get(`nav[${index}]`) })),
  menu: menuIds.map(([id, href], index) => ({ id, href, label: get(`menu[${index}]`) })),
  menuOpen: get("menuOpen"),
  menuClose: get("menuClose"),
  menuLabel: get("menuLabel"),
  book: get("book"),
  stickyLabel: get("stickyLabel"),
  bookTrial: get("bookTrial"),
  bookTrialPrice: get("bookTrialPrice"),
  schedule: get("schedule"),
  scheduleLink: get("scheduleLink"),
  allSchedule: get("allSchedule"),
  hero: {
    kicker: get("hero.kicker"),
    line1: get("hero.line1"),
    line2: get("hero.line2"),
    lead: get("hero.lead"),
    trial: get("hero.trial"),
  },
  today: {
    neutralTitle: get("today.neutralTitle"),
    todayTitle: get("today.todayTitle"),
    tomorrowTitle: get("today.tomorrowTitle"),
    finished: get("today.finished"),
    sundayShort: get("today.sundayShort"),
    sundayLong: get("today.sundayLong"),
    inForme: get("today.inForme"),
    trialLead: get("today.trialLead"),
    trialTail: get("today.trialTail"),
    bookAria: get("today.bookAria"),
    loading: get("today.loading"),
  },
  intro: {
    kicker: get("intro.kicker"),
    before: get("intro.before"),
    em1: get("intro.em1"),
    mid: get("intro.mid"),
    em2: get("intro.em2"),
    after: get("intro.after"),
  },
  directions: { kicker: get("directions.kicker"), title: get("directions.title") },
  pause: { kicker: get("pause.kicker"), title: get("pause.title") },
  first: {
    kicker: get("first.kicker"),
    title: get("first.title"),
    cardKicker: get("first.cardKicker"),
    cardMeta: get("first.cardMeta"),
    cta: get("first.cta"),
  },
  team: { kicker: get("team.kicker"), title: get("team.title") },
  prices: {
    kicker: get("prices.kicker"),
    title: get("prices.title"),
    recommended: get("prices.recommended"),
    book: get("prices.book"),
    choose: get("prices.choose"),
    note: get("prices.note"),
  },
  about: {
    kicker: get("about.kicker"),
    title: get("about.title"),
    p1: get("about.p1"),
    p2: get("about.p2"),
  },
  finalCta: {
    kicker: get("finalCta.kicker"),
    title: get("finalCta.title"),
    text: get("finalCta.text"),
    button: get("finalCta.button"),
  },
  contacts: {
    kicker: get("contacts.kicker"),
    title: get("contacts.title"),
    maps: get("contacts.maps"),
    yandex: get("contacts.yandex"),
    whatsapp: get("contacts.whatsapp"),
    externalNote: get("contacts.externalNote"),
    mapLabel: get("contacts.mapLabel"),
    route: get("booking.route"),
    openMap: get("contacts.maps"),
    mapHint,
    mapTitle,
    todayPrefix: get("contacts.todayPrefix"),
  },
  footer: {
    openUntil: get("footer.openUntil"),
    closed: get("footer.closed"),
    hoursFallback: get("footer.hoursFallback"),
    aboutTitle: get("footer.aboutTitle"),
    about: get("footer.about"),
    studioTitle: get("footer.studioTitle"),
    contactTitle: get("footer.contactTitle"),
    phoneNote: get("footer.phoneNote"),
    social: get("footer.social"),
    hoursTitle: get("footer.hoursTitle"),
    hours: get("footer.hours"),
    legal: get("footer.legal"),
  },
  schedulePage: {
    kicker: get("schedulePage.kicker"),
    title: get("schedulePage.title"),
    days: get("schedulePage.days"),
    directions: get("schedulePage.directions"),
    today: get("schedulePage.today"),
    all: get("schedulePage.all"),
    reset: get("schedulePage.reset"),
    morning: get("schedulePage.morning"),
    day: get("schedulePage.day"),
    evening: get("schedulePage.evening"),
    book: get("schedulePage.book"),
    waitlist: get("schedulePage.waitlist"),
    emptySunday: get("schedulePage.emptySunday"),
    emptyDay: get("schedulePage.emptyDay"),
    nearestAny: get("schedulePage.nearestAny"),
    showDay: get("schedulePage.showDay"),
    off: get("schedulePage.off"),
  },
  booking: {
    step: stepTemplate,
    sendingStep: get("booking.sendingStep"),
    picked: get("booking.picked"),
    change: get("booking.change"),
    formTitle: get("booking.formTitle"),
    name: get("booking.name"),
    phone: get("booking.phone"),
    phoneHint: get("booking.phoneHint"),
    firstTime: get("booking.firstTime"),
    optional: get("booking.optional"),
    consent: get("booking.consent"),
    submit: get("booking.submit"),
    sending: get("booking.sending"),
    summaryTrial: get("booking.summaryTrial"),
    summaryOther: get("booking.summaryOther"),
    payAtStudio: get("booking.payAtStudio"),
    errors: {
      name: get("booking.errors.name"),
      phoneEmpty: get("booking.errors.phoneEmpty"),
      phoneShort: get("booking.errors.phoneShort"),
      phonePrefix: get("booking.errors.phonePrefix"),
      consent: get("booking.errors.consent"),
      summary: get("booking.errors.summary"),
      and: get("booking.errors.and"),
      nameField: get("booking.errors.nameField"),
      phoneField: get("booking.errors.phoneField"),
      consentField: get("booking.errors.consentField"),
    },
    fields: {
      one: get("booking.fields.one"),
      few: get("booking.fields.few"),
      many: get("booking.fields.many"),
    },
    selectKicker: get("booking.selectKicker"),
    selectTitle: get("booking.selectTitle"),
    selectLead: get("booking.selectLead"),
    chosen: get("booking.chosen"),
    keep: get("booking.keep"),
    pick: get("booking.pick"),
    successTitle: get("booking.successTitle"),
    route: get("booking.route"),
    bring: get("booking.bring"),
    bringList: [0, 1, 2].map((index) => get(`booking.bringList[${index}]`)),
    externalNote: get("booking.externalNote"),
    errorTitle: get("booking.errorTitle"),
    errorText: get("booking.errorText"),
    alternatives: get("booking.alternatives"),
    retry: get("booking.retry"),
    waitlist: get("booking.waitlist"),
    missing: get("booking.missing"),
  },
  seats: {
    none: get("seats.none"),
    one: get("seats.one"),
    few: get("seats.few"),
    many: get("seats.many"),
  },
  units: {
    min: get("units.min"),
    classesOne: get("units.classesOne"),
    classesFew: get("units.classesFew"),
    classesMany: get("units.classesMany"),
  },
  levels: {
    beginner: get("levels.beginner"),
    intermediate: get("levels.intermediate"),
    all: get("levels.all"),
  },
  weekdays: {
    short: [0, 1, 2, 3, 4, 5, 6].map((index) => get(`weekdays.short[${index}]`)),
    long: [0, 1, 2, 3, 4, 5, 6].map((index) => get(`weekdays.long[${index}]`)),
    title: [0, 1, 2, 3, 4, 5, 6].map((index) => get(`weekdays.title[${index}]`)),
  },
  notFound: {
    title: get("notFound.title"),
    text: get("notFound.text"),
    home: get("notFound.home"),
  },
};

function cell(key) {
  const row = list(key)[0];
  if (!row || row.kk === "") {
    missing.push(key);
    return "";
  }
  return row.kk;
}

const directionIds = ["strength", "functional", "yoga", "mobility", "recovery"];
const directionKk = {};
for (const id of directionIds) {
  directionKk[id] = {
    classes: [0, 1, 2, 3].map((index) => ({
      name: cell(`directions.ts: ${id}.classes[${index}].name`),
      text: cell(`directions.ts: ${id}.classes[${index}].text`),
      meta: cell(`directions.ts: ${id}.classes[${index}].meta`),
    })),
    tab: cell(`directions.ts: ${id}.tab`),
    title: cell(`directions.ts: ${id}.title`),
    lead: cell(`directions.ts: ${id}.lead`),
    scheduleLabel: cell(`directions.ts: ${id}.scheduleLabel`),
    nearestPhrase: cell(`directions.ts: ${id}.nearestPhrase`),
  };
}

const classNameKk = {};
for (const row of list("schedule.ts: classTemplates.name")) {
  if (!row.ru || !row.kk) missing.push(`schedule.ts: classTemplates.name ${row.ru}`);
  else classNameKk[row.ru] = row.kk;
}

const hallKk = {};
for (const row of list("schedule.ts: classTemplates.hall")) {
  if (!row.ru || !row.kk) missing.push(`schedule.ts: classTemplates.hall ${row.ru}`);
  else hallKk[row.ru] = row.kk;
}

const trainerIds = ["aigerim", "daniyal", "maria", "timur"];
const trainerNames = list("trainers.ts: name");
const trainerFocus = list("trainers.ts: focus");
const trainerYears = list("trainers.ts: years");
const trainerKk = {};
trainerIds.forEach((id, index) => {
  trainerKk[id] = {
    name: trainerNames[index]?.kk ?? "",
    focus: trainerFocus[index]?.kk ?? "",
    years: trainerYears[index]?.kk ?? "",
  };
  if (!trainerKk[id].name) missing.push(`trainers.ts: name[${index}]`);
  if (!trainerKk[id].focus) missing.push(`trainers.ts: focus[${index}]`);
  if (!trainerKk[id].years) missing.push(`trainers.ts: years[${index}]`);
});

const addressKk = {
  line: cell("studio.ts: address.line"),
  short: cell("studio.ts: address.short"),
  footerLine: cell("studio.ts: address.footerLine"),
};

const factsKk = [0, 1, 2, 3].map((index) => cell(`studio.ts: facts[${index}].label`));
const stepsKk = [0, 1, 2, 3].map((index) => ({
  title: cell(`studio.ts: firstSteps[${index}].title`),
  text: cell(`studio.ts: firstSteps[${index}].text`),
}));
const faqKk = [0, 1, 2].map((index) => ({
  q: cell(`studio.ts: faq[${index}].q`),
  a: cell(`studio.ts: faq[${index}].a`),
}));
const plansKk = [0, 1, 2].map((index) => ({
  name: cell(`studio.ts: plans[${index}].name`),
  details: cell(`studio.ts: plans[${index}].details`),
}));

const photoIds = [
  "hero",
  "yoga",
  "strength",
  "functional",
  "mobility",
  "recovery",
  "pause",
  "aigerim",
  "daniyal",
  "maria",
  "timur",
  "interior",
  "final",
];
const photoAltKk = {};
for (const id of photoIds) photoAltKk[id] = cell(`photos.ts: ${id}.alt`);

const unexpected = missing.filter((item) => !item.startsWith("contacts."));
if (unexpected.length) {
  console.error("missing keys:");
  for (const item of unexpected) console.error(`  ${item}`);
  throw new Error(`${unexpected.length} required CSV keys are missing`);
}

const dictionaryBanner = `/**
 * Generated by scripts/emit-kk-dictionary.mjs from the art CSV.
 * Kazakh sentences are copied from that sheet. Do not edit them here.
 */
export const kk = ${JSON.stringify(kk, null, 2)};
`;

const copyBanner = `import type { Locale } from "@/lib/locale";

/** Generated by scripts/emit-kk-dictionary.mjs from the art CSV. */

export const directionKk = ${JSON.stringify(directionKk, null, 2)} as const;

export const classNameKk: Record<string, string> = ${JSON.stringify(classNameKk, null, 2)};

export const hallKk: Record<string, string> = ${JSON.stringify(hallKk, null, 2)};

export const trainerKk = ${JSON.stringify(trainerKk, null, 2)} as const;

export const addressKk = ${JSON.stringify(addressKk, null, 2)};

export const factsKk = ${JSON.stringify(factsKk, null, 2)};

export const stepsKk = ${JSON.stringify(stepsKk, null, 2)};

export const faqKk = ${JSON.stringify(faqKk, null, 2)};

export const plansKk = ${JSON.stringify(plansKk, null, 2)};

export function displayClassName(locale: Locale, name: string): string {
  if (locale !== "kk") return name;
  return classNameKk[name] ?? name;
}

export function displayHall(locale: Locale, hall: string): string {
  if (locale !== "kk") return hall;
  return hallKk[hall] ?? hall;
}

export const photoAltKk: Record<string, string> = ${JSON.stringify(photoAltKk, null, 2)};
`;

writeFileSync(dictionaryPath, dictionaryBanner);
writeFileSync(join(root, "content/kk-copy.ts"), copyBanner);

console.log(`source: ${csvPath}`);
console.log(`dictionary keys: ${dict.size}`);
console.log(`switch labels kept: Рус / Қаз`);
console.log(`CSV lang.ru / lang.kk not applied: ${dict.get("lang.ru")} / ${dict.get("lang.kk")}`);
console.log("gaps (no dedicated CSV row, not invented):");
for (const item of missing) console.log(`  ${item}`);
if (!mapHint || !mapTitle) {
  throw new Error("contacts.mapHint / contacts.mapTitle are absent from the CSV and from the previous dictionary");
}
