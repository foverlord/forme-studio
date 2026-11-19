import { addressKk, factsKk, faqKk, plansKk, stepsKk } from "@/content/kk-copy";
import type { Locale } from "@/lib/locale";
import { studioHoursRows } from "@/lib/time";

export const trialPrice = "4 000 ₸";

/**
 * TODO: demo point on open lawn inside Парк влюблённых (Ғашықтар саябағы),
 * Left Bank, Astana. 51.1331, 71.4098 sits on Қонаев көшесі; this point is
 * farther into the lawn, off the road and off buildings. Replace lat and lon
 * when the client sends the studio address.
 * yandex.kz: the studio is in Kazakhstan, and the Maps terms point
 * residents there at yandex.kz/legal/maps_termsofuse.
 */
export const mapPoint = {
  lat: 51.1326,
  lon: 71.40982,
  url: "https://yandex.kz/maps/?ll=71.40982,51.1326&z=16&pt=71.40982,51.1326",
};

/**
 * Widget center, south of the pin. At z=16 the pin anchor sits 11px above
 * the iframe center when ll equals pt. Shifting the center 17.43px south
 * puts the anchor near 40% of the frame: about 36.5% at 210px (320),
 * 38.7% at 251px (375), and 43.5% at 440px (desktop).
 * The widget paints only pmbl, pmrd, and pmgn. The pin is pmbl, #177ee6.
 */
const mapView = { lat: 51.132365, lon: mapPoint.lon };

/** Free widget, no key. Pin stays on mapPoint; ll is the shifted view. */
export function mapWidgetUrl(point: { lat: number; lon: number } = mapPoint): string {
  const ll = `${mapView.lon},${mapView.lat}`;
  const pt = `${point.lon},${point.lat},pmbl`;
  return `https://yandex.kz/map-widget/v1/?ll=${ll}&z=16&pt=${pt}&lang=ru_RU`;
}

/** Route to mapPoint. Derived from the coordinates so a new point updates both links. */
export function mapDirectionsUrl(point: { lat: number; lon: number } = mapPoint): string {
  return `https://yandex.kz/maps/?rtext=~${point.lat},${point.lon}&rtt=auto`;
}

export const address = {
  line: "Астана, центр",
  short: "Центр Астаны",
  phone: "+7 700 000 00 00",
  footerLine: "Астана, центр",
};

export const facts = [
  { value: "12", label: "человек максимум в группе" },
  { value: "5", label: "направлений в одном абонементе" },
  { value: "07–22", label: "пн–чт, время Астаны" },
  { value: "15 мин", label: "на знакомство перед первым занятием" },
];

export const firstSteps = [
  { title: "Выберите время", text: "Мы сразу предложим ближайшее занятие для новичков — его можно поменять." },
  { title: "Приходите за 15 минут", text: "Покажем раздевалку и зал, познакомим с тренером." },
  { title: "Коврик и полотенце дадим", text: "Нужны только удобная одежда и вода." },
  { title: "Тренер подберёт нагрузку", text: "Опыт не нужен — отметьте в форме «Я впервые»." },
];

export const faq = [
  { q: "Что надеть?", a: "Спортивную одежду; йога — босиком." },
  { q: "Есть душ?", a: "Да, две душевые и фен." },
  { q: "Можно отменить?", a: "Бесплатно за 6 часов до начала." },
];

/** Contacts table. Same source as the open/closed clock in lib/time.ts. */
export const hoursRows = studioHoursRows();

export function getAddress(locale: Locale = "ru") {
  if (locale === "ru") return address;
  return {
    ...address,
    line: addressKk.line,
    short: addressKk.short,
    footerLine: addressKk.footerLine,
  };
}

export function getFacts(locale: Locale = "ru") {
  if (locale === "ru") return facts;
  return facts.map((fact, index) => ({ ...fact, label: factsKk[index] }));
}

export function getFirstSteps(locale: Locale = "ru") {
  if (locale === "ru") return firstSteps;
  return firstSteps.map((step, index) => ({ title: stepsKk[index].title, text: stepsKk[index].text }));
}

export function getFaq(locale: Locale = "ru") {
  if (locale === "ru") return faq;
  return faq.map((item, index) => ({ q: faqKk[index].q, a: faqKk[index].a }));
}

export function getHoursRows(locale: Locale = "ru") {
  return studioHoursRows(locale);
}

export function getPlans(locale: Locale = "ru") {
  if (locale === "ru") return plans;
  return plans.map((plan, index) => ({ ...plan, name: plansKk[index].name, details: plansKk[index].details }));
}

export const plans = [
  {
    id: "trial",
    name: "Пробное",
    price: "4 000 ₸",
    details: "1 занятие · для новых гостей",
    action: "book" as const,
    recommended: false,
  },
  {
    id: "eight",
    name: "8 занятий",
    price: "36 000 ₸",
    details: "≈ 4 500 ₸ за занятие · 30 дней · заморозка 7 дней",
    action: "choose" as const,
    recommended: true,
  },
  {
    id: "unlimited",
    name: "Безлимит",
    price: "52 000 ₸",
    details: "≈ 3 250 ₸ при 16 визитах · 30 дней · 2 гостевых",
    action: "choose" as const,
    recommended: false,
  },
];
