// Yazı tipleri ayrı dosyada: Turbopack, köşeli parantezli yollardaki ([locale]) next/font çağrılarını çözemiyor.
import { Baloo_2, Fredoka, Nunito } from "next/font/google";

// Fredoka'da ğ, Ğ, ş, Ş, İ ve ₺ yok. Bu harfler sistem yazı tipine değil, ona çok benzeyen
// Baloo 2'ye düşsün diye Fredoka'nın otomatik yedeği kapatılır (yedek zinciri tailwind.config'te).
export const fredoka = Fredoka({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
  adjustFontFallback: false,
  fallback: [],
});

// Yalnızca Fredoka'da olmayan harfler için; unicode-range sayesinde sayfada bu harfler yoksa indirilmez.
export const baloo = Baloo_2({
  subsets: ["latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-baloo",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: [],
});

export const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});
