import { trainerKk } from "@/content/kk-copy";
import type { PhotoId } from "@/content/photos";
import type { Locale } from "@/lib/locale";

export type TrainerId = "aigerim" | "daniyal" | "maria" | "timur";

export type Trainer = {
  id: TrainerId;
  name: string;
  short: string;
  focus: string;
  years: string;
  photo: PhotoId;
};

export const trainers: Trainer[] = [
  { id: "aigerim", name: "Айгерим С.", short: "Айгерим", focus: "Йога, мобильность", years: "6 лет", photo: "aigerim" },
  { id: "daniyal", name: "Даниял К.", short: "Даниял", focus: "Сила", years: "8 лет", photo: "daniyal" },
  { id: "maria", name: "Мария Л.", short: "Мария", focus: "Восстановление", years: "7 лет", photo: "maria" },
  { id: "timur", name: "Тимур А.", short: "Тимур", focus: "Функциональный", years: "5 лет", photo: "timur" },
];

export function getTrainers(locale: Locale = "ru"): Trainer[] {
  if (locale === "ru") return trainers;
  return trainers.map((trainer) => {
    const copy = trainerKk[trainer.id];
    return { ...trainer, name: copy.name, focus: copy.focus, years: copy.years };
  });
}

export function trainerById(id: TrainerId, locale: Locale = "ru"): Trainer {
  const trainer = getTrainers(locale).find((item) => item.id === id);
  if (!trainer) throw new Error(`Unknown trainer ${id}`);
  return trainer;
}
