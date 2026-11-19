import { directionKk } from "@/content/kk-copy";
import type { PhotoId } from "@/content/photos";
import type { Locale } from "@/lib/locale";

export type DirectionId = "strength" | "functional" | "yoga" | "mobility" | "recovery";

export type Direction = {
  id: DirectionId;
  tab: string;
  title: string;
  lead: string;
  scheduleLabel: string;
  /** Phrase used in empty-state copy: «Ближайшая йога». */
  nearestPhrase: string;
  photo: PhotoId;
  classes: { name: string; text: string; meta: string }[];
};

/** Tab order matches design-system.md. Home opens on yoga, as in the home mockup. */
export const directions: Direction[] = [
  {
    id: "strength",
    tab: "Сила",
    title: "Сила: техника важнее веса",
    lead: "Базовые упражнения со штангой и гантелями в небольшой группе. Тренер следит за техникой и подбирает вес — без гонки и шума.",
    scheduleLabel: "Расписание: сила",
    nearestPhrase: "Ближайшая силовая",
    photo: "strength",
    classes: [
      { name: "База", text: "Приседания, тяга, жим — основа силы.", meta: "60 мин · все уровни · пн 08:30, чт 18:30, сб 10:30" },
      { name: "Верх тела", text: "Спина, плечи и жим без перегруза поясницы.", meta: "45 мин · средний уровень · вт 18:00" },
      { name: "Низ тела", text: "Ноги и корпус, контроль, а не максимальный вес.", meta: "50 мин · все уровни" },
      { name: "Силовая для новичков", text: "Первая штанга: схема, вес и страховка.", meta: "60 мин · новичкам · ср 08:30" },
    ],
  },
  {
    id: "functional",
    tab: "Функциональный",
    title: "Функциональный: движение целиком",
    lead: "Движения целиком: корпус, выносливость и координация. Коротко, ясно, без случайных упражнений.",
    scheduleLabel: "Расписание: функциональный",
    nearestPhrase: "Ближайшее функциональное",
    photo: "functional",
    classes: [
      { name: "Функциональный круг", text: "Станции на время с отдыхом между ними.", meta: "50 мин · пн 18:00 средний уровень · вт, пт 09:00 все уровни · ср 18:30 средний уровень" },
      { name: "Корпус", text: "Пресс и стабилизация, без скручиваний «на количество».", meta: "40 мин · новичкам" },
      { name: "Выносливость", text: "Дыхание и темп, чтобы хватало на весь день.", meta: "45 мин · средний уровень" },
      { name: "Функциональный для новичков", text: "Техника движений до любой нагрузки.", meta: "50 мин · новичкам" },
    ],
  },
  {
    id: "yoga",
    tab: "Йога",
    title: "Йога: внимание к телу",
    lead: "Спокойная практика с вниманием к технике. Подходит и тем, кто впервые на коврике, и тем, кто занимается годами.",
    scheduleLabel: "Расписание: йога",
    nearestPhrase: "Ближайшая йога",
    photo: "yoga",
    classes: [
      { name: "Утренняя йога", text: "Мягкое пробуждение тела перед рабочим днём.", meta: "60 мин · новичкам · пн–пт 07:30, сб 09:00" },
      { name: "Хатха", text: "Удержание поз, дыхание, точное выравнивание.", meta: "75 мин · все уровни · пн 10:00" },
      { name: "Виньяса", text: "Динамичные связки на дыхании — самая «тёплая» йога.", meta: "75 мин · средний уровень · чт, пт 19:45" },
      { name: "Йога для спины", text: "Для тех, кто много сидит: осанка и подвижность.", meta: "45 мин · ср 13:00 новичкам · пт 13:00 средний уровень" },
    ],
  },
  {
    id: "mobility",
    tab: "Мобильность",
    title: "Мобильность: свобода в суставах",
    lead: "Суставы, осанка и амплитуда — чтобы силовые и йога давались легче. Медленно и точно.",
    scheduleLabel: "Расписание: мобильность",
    nearestPhrase: "Ближайшая мобильность",
    photo: "mobility",
    classes: [
      { name: "Мобильность суставов", text: "Таз, грудной отдел, голеностоп.", meta: "45 мин · новичкам · вт, чт, пт 12:30, сб 12:00" },
      { name: "Осанка", text: "Для тех, кто работает за столом.", meta: "40 мин · все уровни" },
      { name: "Бёдра и спина", text: "То, что обычно «тянет» после силовой.", meta: "45 мин · все уровни" },
      { name: "Дыхание и корпус", text: "Спокойная связка в конце дня.", meta: "30 мин · новичкам" },
    ],
  },
  {
    id: "recovery",
    tab: "Восстановление",
    title: "Восстановление: мягко после нагрузки",
    lead: "Мягкая практика после нагрузки и рабочего дня. Дыхание, расслабление, сон.",
    scheduleLabel: "Расписание: восстановление",
    nearestPhrase: "Ближайшее восстановление",
    photo: "recovery",
    classes: [
      { name: "Вечернее восстановление", text: "Снять напряжение с плеч и поясницы.", meta: "45 мин · новичкам · пн, ср, чт 21:00, сб 18:00" },
      { name: "Дыхание", text: "Спокойные техники, чтобы переключиться.", meta: "30 мин · все уровни · вт 19:30" },
      { name: "Мягкая растяжка", text: "Без боли и без «надо глубже».", meta: "45 мин · новичкам" },
      { name: "Восстановление после силовой", text: "На следующий день после тяжёлой тренировки.", meta: "40 мин · все уровни" },
    ],
  },
];

export const defaultDirectionId: DirectionId = "yoga";

export function getDirections(locale: Locale = "ru"): Direction[] {
  if (locale === "ru") return directions;
  return directions.map((item) => {
    const copy = directionKk[item.id];
    return {
      ...item,
      tab: copy.tab,
      title: copy.title,
      lead: copy.lead,
      scheduleLabel: copy.scheduleLabel,
      nearestPhrase: copy.nearestPhrase,
      classes: item.classes.map((klass, index) => ({
        name: copy.classes[index].name,
        text: copy.classes[index].text,
        meta: copy.classes[index].meta,
      })),
    };
  });
}

export function directionById(id: string, locale: Locale = "ru"): Direction | undefined {
  return getDirections(locale).find((item) => item.id === id);
}
