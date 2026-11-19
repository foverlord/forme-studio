import { bookingDelivery } from "@/content/booking-delivery";
import { kk as kkDraft } from "@/content/kk-dictionary";
import type { Locale } from "@/lib/locale";
import { studioHoursText } from "@/lib/time";

export type { Locale };

/**
 * UI copy for Russian (`/`) and the Kazakh preview (`/kk`).
 * Markup reads strings from here, not from JSX.
 */

export type Dictionary = {
  meta: { title: string; description: string; scheduleTitle: string; bookingTitle: string };
  skip: string;
  logo: string;
  lang: { group: string; ru: string; kk: string };
  nav: { id: string; href: string; label: string }[];
  menu: { id: string; href: string; label: string }[];
  menuOpen: string;
  menuClose: string;
  menuLabel: string;
  book: string;
  stickyLabel: string;
  bookTrial: string;
  bookTrialPrice: string;
  schedule: string;
  scheduleLink: string;
  allSchedule: string;
  hero: { kicker: string; line1: string; line2: string; lead: string; trial: string };
  today: {
    neutralTitle: string;
    todayTitle: string;
    tomorrowTitle: string;
    finished: string;
    sundayShort: string;
    sundayLong: string;
    inForme: string;
    trialLead: string;
    trialTail: string;
    bookAria: string;
    loading: string;
  };
  intro: { kicker: string; before: string; em1: string; mid: string; em2: string; after: string };
  directions: { kicker: string; title: string };
  pause: { kicker: string; title: string };
  first: { kicker: string; title: string; cardKicker: string; cardMeta: string; cta: string };
  team: { kicker: string; title: string };
  prices: { kicker: string; title: string; recommended: string; book: string; choose: string; note: string };
  about: { kicker: string; title: string; p1: string; p2: string };
  finalCta: { kicker: string; title: string; text: string; button: string };
  contacts: {
    kicker: string;
    title: string;
    maps: string;
    yandex: string;
    whatsapp: string;
    externalNote: string;
    mapLabel: string;
    route: string;
    openMap: string;
    mapHint: string;
    mapTitle: string;
    todayPrefix: string;
  };
  footer: {
    openUntil: string;
    closed: string;
    hoursFallback: string;
    aboutTitle: string;
    about: string;
    studioTitle: string;
    contactTitle: string;
    phoneNote: string;
    social: string;
    hoursTitle: string;
    hours: string;
    legal: string;
  };
  schedulePage: {
    kicker: string;
    title: string;
    days: string;
    directions: string;
    today: string;
    all: string;
    reset: string;
    morning: string;
    day: string;
    evening: string;
    book: string;
    waitlist: string;
    emptySunday: string;
    emptyDay: string;
    nearestAny: string;
    showDay: string;
    off: string;
  };
  booking: {
    step: string;
    sendingStep: string;
    picked: string;
    change: string;
    formTitle: string;
    name: string;
    phone: string;
    phoneHint: string;
    firstTime: string;
    optional: string;
    consent: string;
    submit: string;
    sending: string;
    delivered: { title: string; text: string };
    sendError: { title: string; text: string; whatsapp: string; retry: string; rateLimit: string };
    whatsappTemplate: string;
    summaryTrial: string;
    summaryOther: string;
    payAtStudio: string;
    errors: {
      name: string;
      phoneEmpty: string;
      phoneShort: string;
      phonePrefix: string;
      consent: string;
      summary: string;
      and: string;
      nameField: string;
      phoneField: string;
      consentField: string;
    };
    fields: { one: string; few: string; many: string };
    selectKicker: string;
    selectTitle: string;
    selectLead: string;
    chosen: string;
    keep: string;
    pick: string;
    successTitle: string;
    route: string;
    bring: string;
    bringList: string[];
    externalNote: string;
    errorTitle: string;
    errorText: string;
    alternatives: string;
    retry: string;
    waitlist: string;
    missing: string;
  };
  seats: { none: string; one: string; few: string; many: string };
  units: { min: string; classesOne: string; classesFew: string; classesMany: string };
  levels: { beginner: string; intermediate: string; all: string };
  weekdays: {
    short: string[];
    long: string[];
    title: string[];
  };
  notFound: { title: string; text: string; home: string };
};

export const ru: Dictionary = {
  meta: {
    title: "FORME Studio — сила и йога в Астане",
    description: "Студия силы и йоги в Астане: расписание, тренеры и запись на пробное.",
    scheduleTitle: "Расписание",
    bookingTitle: "Запись",
  },
  skip: "К содержанию",
  logo: "FORME",
  lang: { group: "Язык сайта", ru: "Рус", kk: "Қаз" },
  nav: [
    { id: "directions", href: "/#directions", label: "Занятия" },
    { id: "schedule", href: "/schedule", label: "Расписание" },
    { id: "trainers", href: "/#trainers", label: "Тренеры" },
    { id: "prices", href: "/#prices", label: "Цены" },
    { id: "studio", href: "/#studio", label: "Студия" },
    { id: "contacts", href: "/#contacts", label: "Контакты" },
  ],
  menu: [
    { id: "directions", href: "/#directions", label: "Занятия" },
    { id: "schedule", href: "/schedule", label: "Расписание" },
    { id: "first-visit", href: "/#first-visit", label: "Первый визит" },
    { id: "trainers", href: "/#trainers", label: "Тренеры" },
    { id: "prices", href: "/#prices", label: "Цены" },
    { id: "studio", href: "/#studio", label: "Студия" },
    { id: "contacts", href: "/#contacts", label: "Контакты" },
  ],
  menuOpen: "Меню",
  menuClose: "Закрыть меню",
  menuLabel: "Меню сайта",
  book: "Записаться",
  stickyLabel: "Пробное",
  bookTrial: "Записаться на пробное",
  bookTrialPrice: "Записаться на пробное · {price}",
  schedule: "Расписание",
  scheduleLink: "Расписание →",
  allSchedule: "Всё расписание →",
  hero: {
    kicker: "Сила · йога · восстановление · Астана",
    line1: "Сила",
    line2: "в тишине",
    lead: "Студия, где штанга и дыхание — части одной тренировки. Группы до 12 человек.",
    trial: "Пробное — {price}",
  },
  today: {
    neutralTitle: "Ближайшие занятия",
    todayTitle: "Сегодня в FORME",
    tomorrowTitle: "Завтра в FORME",
    finished: "сегодня занятий больше нет",
    sundayShort: "Воскресенье — выходной",
    sundayLong: "сегодня воскресенье, студия закрыта",
    inForme: "{day} в FORME",
    trialLead: "Пробное занятие —",
    trialTail: "· коврик и полотенце дадим",
    bookAria: "Записаться на {name} в {time}",
    loading: "Загружаем ближайшие занятия",
  },
  intro: {
    kicker: "Студия FORME",
    before: "Мы соединили ",
    em1: "силовые",
    mid: " и ",
    em2: "йогу",
    after: " в одном расписании: утром — работа, вечером — восстановление. Без шума, очередей и спешки.",
  },
  directions: { kicker: "Занятия", title: "Пять направлений, один ритм" },
  pause: { kicker: "Пауза", title: "Сначала работа. Потом тишина. Обе — часть тренировки." },
  first: {
    kicker: "Первый визит",
    title: "Пробное занятие без сюрпризов",
    cardKicker: "Пробное занятие",
    cardMeta: "60 минут · любое направление",
    cta: "Записаться на пробное",
  },
  team: {
    kicker: "Команда",
    title: "Тренеры, которые видят каждого",
  },
  prices: {
    kicker: "Абонементы",
    title: "Цены без звёздочек",
    recommended: "Чаще всего выбирают",
    book: "Записаться",
    choose: "Выбрать",
    note: "Оплата в студии.",
  },
  about: {
    kicker: "О студии",
    title: "Ритм и пауза",
    p1: "FORME — студия, где силовая тренировка и йога не спорят, а продолжают друг друга. Утром — штанга и техника, вечером — дыхание и растяжка.",
    p2: "Маленькие группы, чтобы тренер видел каждого. Честное расписание, чтобы запись занимала минуту.",
  },
  finalCta: {
    kicker: "Первый шаг",
    title: "Приходите на пробное",
    text: "Ближайшее занятие для новичков подберём автоматически — время можно поменять.",
    button: "Записаться на пробное · {price}",
  },
  contacts: {
    kicker: "Контакты",
    title: "Как добраться",
    maps: "2GIS",
    yandex: "Яндекс Карты",
    whatsapp: "WhatsApp",
    externalNote: "Ссылки на карты и мессенджеры откроются позже.",
    mapLabel: "Карта студии",
    route: "Как добраться",
    openMap: "Открыть в Яндекс Картах",
    mapHint: "Нажмите, чтобы двигать карту",
    mapTitle: "Карта: FORME Studio, {address}",
    todayPrefix: "Сегодня",
  },
  footer: {
    openUntil: "Открыто сейчас · до {time}",
    closed: "Сейчас закрыто",
    hoursFallback: "Время Астаны",
    aboutTitle: "FORME Studio",
    about: "Сила и йога в Астане.",
    studioTitle: "Студия",
    contactTitle: "Связь",
    phoneNote: "{phone}",
    social: "WhatsApp · Instagram",
    hoursTitle: "Часы",
    hours: studioHoursText(),
    legal: "© 2026 FORME Studio",
  },
  schedulePage: {
    kicker: "Расписание · время Астаны",
    title: "Неделя в FORME",
    days: "День",
    directions: "Направление",
    today: "Сегодня",
    all: "Все",
    reset: "Сбросить",
    morning: "Утро",
    day: "День",
    evening: "Вечер",
    book: "Записаться",
    waitlist: "В лист ожидания",
    emptySunday: "В воскресенье студия закрыта",
    emptyDay: "В этот день нет таких занятий",
    nearestAny: "Ближайшее занятие — {when}.",
    showDay: "Показать {day} →",
    off: "выходной",
  },
  booking: {
    step: "Шаг {current} из {total}",
    sendingStep: "Запись · отправка",
    picked: "Подобрали ближайшее пробное",
    change: "Изменить занятие",
    formTitle: "Ваши данные",
    name: "Имя",
    phone: "Телефон",
    phoneHint: "Формат +7 7XX XXX XX XX",
    firstTime: "Я впервые — тренер подберёт нагрузку",
    optional: "(необязательно)",
    consent: "Даю согласие на обработку персональных данных",
    submit: "Записаться на {time}",
    sending: bookingDelivery.ru.sending,
    delivered: bookingDelivery.ru.delivered,
    sendError: bookingDelivery.ru.sendError,
    whatsappTemplate: bookingDelivery.ru.whatsappTemplate,
    summaryTrial: "Пробное — {price}, оплата в студии",
    summaryOther: "Оплата в студии",
    payAtStudio: "оплата в студии",
    errors: {
      name: "Введите имя",
      phoneEmpty: "Введите номер телефона",
      phoneShort: "Номер неполный: нужно 10 цифр после +7",
      phonePrefix: "Номер должен начинаться с 7",
      consent: "Без согласия записать не получится",
      summary: "Проверьте {n} {fields}",
      and: "и",
      nameField: "Имя",
      phoneField: "Телефон",
      consentField: "согласие на обработку данных",
    },
    fields: { one: "поле", few: "поля", many: "полей" },
    selectKicker: "Изменить занятие (необязательный шаг)",
    selectTitle: "Другое время",
    selectLead: "По умолчанию выбрано ближайшее пробное. Здесь — другие занятия для новичков.",
    chosen: "Выбрано",
    keep: "Оставить",
    pick: "Выбрать",
    successTitle: "Спасибо за интерес к FORME",
    route: "Как добраться",
    bring: "Что взять с собой",
    bringList: ["Спортивную одежду, на йогу — босиком.", "Коврик и полотенце дадим в студии.", "Воду и 15 минут до начала."],
    externalNote: "Маршрут в 2GIS откроется позже.",
    errorTitle: "Пока вы оформляли запись, места закончились",
    errorText: "Ваши данные сохранены — выберите другое время.",
    alternatives: "Ближайшие альтернативы",
    retry: "Попробовать снова",
    waitlist: "В лист ожидания",
    missing: "Это занятие уже недоступно. Выберите другое время в расписании.",
  },
  seats: { none: "Мест нет", one: "место", few: "места", many: "мест" },
  units: { min: "мин", classesOne: "занятие", classesFew: "занятия", classesMany: "занятий" },
  levels: { beginner: "Новичкам", intermediate: "Средний", all: "Все уровни" },
  weekdays: {
    short: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    long: ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"],
    title: ["В понедельник", "Во вторник", "В среду", "В четверг", "В пятницу", "В субботу", "В воскресенье"],
  },
  notFound: {
    title: "Страница не найдена",
    text: "Такой страницы нет.",
    home: "На главную",
  },
};

const kk: Dictionary = {
  ...kkDraft,
  footer: { ...kkDraft.footer, hours: studioHoursText("kk") },
  booking: {
    ...kkDraft.booking,
    sending: bookingDelivery.kk.sending,
    delivered: bookingDelivery.kk.delivered,
    sendError: bookingDelivery.kk.sendError,
    whatsappTemplate: bookingDelivery.kk.whatsappTemplate,
  },
};

const dictionaries: Record<Locale, Dictionary> = { ru, kk };

export function getDictionary(locale: Locale = "ru"): Dictionary {
  return dictionaries[locale];
}

export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}
