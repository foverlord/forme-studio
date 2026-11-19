/** Kazakh class metas keep the live Russian days and times. Only abbreviations and level words change. */
const DAY = ["дс", "сс", "ср", "бс", "жм", "сб", "жс"] as const;
const RU_DAY = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"] as const;

export function translateClassMeta(meta: string): string {
  return meta
    .replaceAll("все уровни", "барлық деңгей")
    .replaceAll("средний уровень", "орта деңгей")
    .replaceAll("новичкам", "бастаушыларға")
    .replace(/пн|вт|ср|чт|пт|сб|вс/g, (day) => {
      const index = RU_DAY.indexOf(day as (typeof RU_DAY)[number]);
      return index >= 0 ? DAY[index] : day;
    });
}
