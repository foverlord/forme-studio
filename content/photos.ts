import { photoAltKk } from "@/content/kk-copy";
import type { Locale } from "@/lib/locale";

export type PhotoId =
  | "hero"
  | "yoga"
  | "strength"
  | "functional"
  | "mobility"
  | "recovery"
  | "pause"
  | "aigerim"
  | "daniyal"
  | "maria"
  | "timur"
  | "interior"
  | "final";

export type Photo = {
  src: string;
  width: number;
  height: number;
  alt: string;
  author: string;
  unsplash?: string;
  /** Framing inside the direction card so the person is not cropped. */
  objectPosition?: string;
};

export const photos: Record<PhotoId, Photo> = {
  hero: {
    src: "/photos/hero.jpg",
    width: 2000,
    height: 1333,
    alt: "Женщина в позе йоги у большого окна в мягком утреннем свете",
    author: "Alireza Skndari",
    unsplash: "https://unsplash.com/photos/VU3HQFJBh3A",
  },
  yoga: {
    src: "/photos/yoga.webp",
    width: 2400,
    height: 1920,
    alt: "Женщина сидит со скрещёнными ногами на коврике",
    author: "Dane Wetton",
    unsplash: "https://unsplash.com/photos/woman-performing-yoga-t1NEMSm1rgI",
    objectPosition: "42% center",
  },
  strength: {
    src: "/photos/strength.webp",
    width: 2400,
    height: 1600,
    alt: "Женщина делает выпад с гантелью в светлом зале",
    author: "MART PRODUCTION",
    unsplash: "https://www.pexels.com/photo/a-woman-doing-lunges-while-holding-a-dumbbell-8846122/",
    objectPosition: "50% 50%",
  },
  functional: {
    src: "/photos/functional.webp",
    width: 2400,
    height: 3600,
    alt: "Женщина делает прыжок с высоким коленом у большого окна",
    author: "Julia Rekamie",
    unsplash: "https://unsplash.com/photos/woman-performing-high-knee-workout-2aHSA17X17c",
    objectPosition: "center 42%",
  },
  mobility: {
    src: "/photos/mobility.webp",
    width: 2400,
    height: 1600,
    alt: "Женщина растягивается в низком выпаде у окна",
    author: "Alireza Skndari",
    unsplash: "https://unsplash.com/photos/a-woman-sitting-on-the-floor-in-a-yoga-pose-vDV-JauWp3Q",
    objectPosition: "40% center",
  },
  recovery: {
    src: "/photos/recovery.webp",
    width: 2400,
    height: 3600,
    alt: "Женщина в светлой одежде стоит у стены, руки у груди",
    author: "Katrin Bolovtsova",
    unsplash: "https://www.pexels.com/photo/photo-of-woman-stretching-4051518/",
    objectPosition: "50% 50%",
  },
  pause: {
    src: "/photos/pause.jpg",
    width: 2000,
    height: 1333,
    alt: "Женщина в позе йоги на камнях в мягком свете",
    author: "Stephanie Greene",
    unsplash: "https://unsplash.com/photos/rMzg35fH6K0",
  },
  aigerim: {
    src: "/photos/aigerim.jpg",
    width: 1400,
    height: 2100,
    alt: "Тренер у окна в светлом зале",
    author: "Look Studio",
    unsplash: "https://unsplash.com/photos/1Bb2eBSNErE",
  },
  daniyal: {
    src: "/photos/daniyal.jpg",
    width: 1400,
    height: 2097,
    alt: "Портрет тренера в тёплом свете",
    author: "Taiyou",
    unsplash: "https://unsplash.com/photos/mb_75ZJYyR4",
  },
  maria: {
    src: "/photos/maria.jpg",
    width: 1400,
    height: 1750,
    alt: "Тренер сидит на коврике в мягком свете",
    author: "Dane Wetton",
    unsplash: "https://unsplash.com/photos/kh0jOHmZp0E",
  },
  timur: {
    src: "/photos/timur.jpg",
    width: 1400,
    height: 2100,
    alt: "Тренер отдыхает на скамье в зале",
    author: "George Dagerotip",
    unsplash: "https://unsplash.com/photos/mYaf3lj2Vs8",
  },
  interior: {
    src: "/photos/interior.jpg",
    width: 2000,
    height: 1333,
    alt: "Светлый зал с большими окнами",
    author: "eran design",
    unsplash: "https://unsplash.com/photos/2G2nlUR9VrU",
  },
  final: {
    src: "/photos/final.jpg",
    width: 2000,
    height: 3000,
    alt: "Девушка в лесу в тёплом свете",
    author: "Ashley Inguanta",
    unsplash: "https://unsplash.com/photos/LZvg1db_Rv4",
  },
};

export function photoFor(locale: Locale, id: PhotoId): Photo {
  const photo = photos[id];
  if (locale === "ru") return photo;
  return { ...photo, alt: photoAltKk[id] ?? photo.alt };
}
