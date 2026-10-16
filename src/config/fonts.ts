// Yazı tipleri ayrı dosyada: Turbopack, köşeli parantezli yollardaki ([locale]) next/font çağrılarını çözemiyor.
import { Fredoka, Nunito } from "next/font/google";

export const fredoka = Fredoka({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

export const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});
