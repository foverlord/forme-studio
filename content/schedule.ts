import type { DirectionId } from "@/content/directions";
import type { TrainerId } from "@/content/trainers";

export type Level = "beginner" | "intermediate" | "all";

export type ClassTemplate = {
  id: string;
  directionId: DirectionId;
  name: string;
  trainerId: TrainerId;
  /** 0 Monday … 6 Sunday. Sunday has no classes. */
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start: string;
  durationMin: number;
  hall: string;
  level: Level;
  seats: number;
  /** Suitable as the auto-picked trial class. */
  trial: boolean;
  /**
   * Submitting this class always ends in the demo "seats ran out" state,
   * even though the row still shows seats. QA hook: yoga-thu-1945.
   */
  demoFullOnSubmit?: boolean;
};

/**
 * Weekly template. Thursday evening, Friday morning and Monday morning
 * match the approved mockup rows when `demoNow` is set to those moments.
 */
export const classTemplates: ClassTemplate[] = [
  { id: "yoga-mon-0730", directionId: "yoga", name: "Утренняя йога", trainerId: "aigerim", weekday: 0, start: "07:30", durationMin: 60, hall: "зал 2", level: "beginner", seats: 12, trial: true },
  { id: "strength-mon-0830", directionId: "strength", name: "Сила: база", trainerId: "daniyal", weekday: 0, start: "08:30", durationMin: 60, hall: "зал 1", level: "all", seats: 6, trial: false },
  { id: "yoga-mon-1000", directionId: "yoga", name: "Хатха-йога", trainerId: "maria", weekday: 0, start: "10:00", durationMin: 75, hall: "зал 2", level: "all", seats: 10, trial: false },
  { id: "functional-mon-1800", directionId: "functional", name: "Функциональный круг", trainerId: "timur", weekday: 0, start: "18:00", durationMin: 50, hall: "зал 1", level: "intermediate", seats: 5, trial: false },
  { id: "recovery-mon-2100", directionId: "recovery", name: "Вечернее восстановление", trainerId: "maria", weekday: 0, start: "21:00", durationMin: 45, hall: "зал 2", level: "beginner", seats: 10, trial: true },

  { id: "yoga-tue-0730", directionId: "yoga", name: "Утренняя йога", trainerId: "aigerim", weekday: 1, start: "07:30", durationMin: 60, hall: "зал 2", level: "beginner", seats: 10, trial: true },
  { id: "functional-tue-0900", directionId: "functional", name: "Функциональный", trainerId: "timur", weekday: 1, start: "09:00", durationMin: 50, hall: "зал 1", level: "all", seats: 8, trial: false },
  { id: "mobility-tue-1230", directionId: "mobility", name: "Мобильность", trainerId: "maria", weekday: 1, start: "12:30", durationMin: 45, hall: "зал 2", level: "beginner", seats: 9, trial: true },
  { id: "strength-tue-1800", directionId: "strength", name: "Сила: верх", trainerId: "daniyal", weekday: 1, start: "18:00", durationMin: 45, hall: "зал 1", level: "intermediate", seats: 4, trial: false },
  { id: "recovery-tue-1930", directionId: "recovery", name: "Дыхание", trainerId: "maria", weekday: 1, start: "19:30", durationMin: 30, hall: "зал 2", level: "all", seats: 12, trial: false },

  { id: "yoga-wed-0730", directionId: "yoga", name: "Утренняя йога", trainerId: "aigerim", weekday: 2, start: "07:30", durationMin: 60, hall: "зал 2", level: "beginner", seats: 11, trial: true },
  { id: "strength-wed-0830", directionId: "strength", name: "Силовая для новичков", trainerId: "daniyal", weekday: 2, start: "08:30", durationMin: 60, hall: "зал 1", level: "beginner", seats: 7, trial: true },
  { id: "yoga-wed-1300", directionId: "yoga", name: "Йога для спины", trainerId: "maria", weekday: 2, start: "13:00", durationMin: 45, hall: "зал 2", level: "beginner", seats: 6, trial: true },
  { id: "functional-wed-1830", directionId: "functional", name: "Функциональный", trainerId: "timur", weekday: 2, start: "18:30", durationMin: 50, hall: "зал 1", level: "intermediate", seats: 3, trial: false },
  { id: "recovery-wed-2100", directionId: "recovery", name: "Вечернее восстановление", trainerId: "maria", weekday: 2, start: "21:00", durationMin: 45, hall: "зал 2", level: "beginner", seats: 10, trial: true },

  { id: "yoga-thu-0730", directionId: "yoga", name: "Утренняя йога", trainerId: "aigerim", weekday: 3, start: "07:30", durationMin: 60, hall: "зал 2", level: "beginner", seats: 8, trial: true },
  { id: "mobility-thu-1230", directionId: "mobility", name: "Мобильность", trainerId: "maria", weekday: 3, start: "12:30", durationMin: 45, hall: "зал 2", level: "beginner", seats: 7, trial: true },
  { id: "strength-thu-1830", directionId: "strength", name: "Сила: база", trainerId: "daniyal", weekday: 3, start: "18:30", durationMin: 60, hall: "зал 1", level: "all", seats: 3, trial: false },
  { id: "yoga-thu-1945", directionId: "yoga", name: "Виньяса-йога", trainerId: "aigerim", weekday: 3, start: "19:45", durationMin: 75, hall: "зал 2", level: "intermediate", seats: 8, trial: false, demoFullOnSubmit: true },
  { id: "recovery-thu-2100", directionId: "recovery", name: "Восстановление", trainerId: "maria", weekday: 3, start: "21:00", durationMin: 45, hall: "зал 2", level: "beginner", seats: 10, trial: true },

  { id: "yoga-fri-0730", directionId: "yoga", name: "Утренняя йога", trainerId: "aigerim", weekday: 4, start: "07:30", durationMin: 60, hall: "зал 2", level: "beginner", seats: 9, trial: true },
  { id: "functional-fri-0900", directionId: "functional", name: "Функциональный", trainerId: "timur", weekday: 4, start: "09:00", durationMin: 50, hall: "зал 1", level: "all", seats: 4, trial: false },
  { id: "mobility-fri-1230", directionId: "mobility", name: "Мобильность", trainerId: "maria", weekday: 4, start: "12:30", durationMin: 45, hall: "зал 2", level: "beginner", seats: 11, trial: true },
  { id: "yoga-fri-1300", directionId: "yoga", name: "Йога для спины", trainerId: "maria", weekday: 4, start: "13:00", durationMin: 45, hall: "зал 2", level: "intermediate", seats: 0, trial: false },
  { id: "yoga-fri-1945", directionId: "yoga", name: "Виньяса-йога", trainerId: "aigerim", weekday: 4, start: "19:45", durationMin: 75, hall: "зал 2", level: "intermediate", seats: 2, trial: false },

  { id: "yoga-sat-0900", directionId: "yoga", name: "Утренняя йога", trainerId: "aigerim", weekday: 5, start: "09:00", durationMin: 60, hall: "зал 2", level: "beginner", seats: 8, trial: true },
  { id: "strength-sat-1030", directionId: "strength", name: "Сила: база", trainerId: "daniyal", weekday: 5, start: "10:30", durationMin: 60, hall: "зал 1", level: "all", seats: 5, trial: false },
  { id: "mobility-sat-1200", directionId: "mobility", name: "Мобильность", trainerId: "maria", weekday: 5, start: "12:00", durationMin: 45, hall: "зал 2", level: "beginner", seats: 6, trial: true },
  { id: "recovery-sat-1800", directionId: "recovery", name: "Восстановление", trainerId: "maria", weekday: 5, start: "18:00", durationMin: 45, hall: "зал 2", level: "beginner", seats: 9, trial: true },
];

/** Class that always returns the "места закончились" demo error on submit. */
export const DEMO_FULL_TEMPLATE_ID = "yoga-thu-1945";
