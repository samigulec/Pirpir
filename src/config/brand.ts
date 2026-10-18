// Marka: tek yerden değiştirilir. Logo işareti ana karakter Pırpır'dır (src/components/Logo.tsx).
export const brand = {
  name: "pirpir",
  tagline: "Pırpır bulur, sen uçarsın.",
} as const;

/** Metinlerdeki {brand} yer tutucusunu marka adıyla değiştirir (yasal metinler gibi çeviri dışı içerik için). */
export const withBrand = (s: string) => s.replaceAll("{brand}", brand.name);
