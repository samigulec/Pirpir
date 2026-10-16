import type { Locale } from "./config";

const NAMESPACES = ["common", "home", "route", "results", "booking", "confirm", "characters"] as const;

// messages/<dil>/<alan>.json dosyalarını tek nesnede birleştirir.
// Henüz çevrilmemiş diller Türkçeye düşer.
export async function loadMessages(locale: Locale) {
  const load = async (l: Locale) =>
    Object.fromEntries(
      await Promise.all(
        NAMESPACES.map(async (ns) => [ns, (await import(`../../messages/${l}/${ns}.json`)).default]),
      ),
    );
  try {
    return await load(locale);
  } catch {
    return load("tr");
  }
}
