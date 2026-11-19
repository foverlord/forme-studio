import { Geologica, Onest } from "next/font/google";

export const geologica = Geologica({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-geologica",
  display: "swap",
});

export const onest = Onest({
  subsets: ["cyrillic", "cyrillic-ext", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-onest",
  display: "swap",
});
