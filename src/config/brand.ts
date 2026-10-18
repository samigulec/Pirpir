// Marka: tek yerden değiştirilir. Logo işareti ana karakter Pırpır'dır (src/components/Logo.tsx).
export const brand = {
  name: "pirpir",
  tagline: "Pırpır bulur, sen uçarsın.",
  /** Ana alan adı (flypirpir.com alınınca buraya yazılır; eski adres Vercel'de ona yönlendirilir) */
  domain: "flypirpir.nl",
} as const;

/** Metinlerdeki {brand} yer tutucusunu marka adıyla değiştirir (yasal metinler gibi çeviri dışı içerik için). */
export const withBrand = (s: string) => s.replaceAll("{brand}", brand.name);

/** Sitenin kanonik adresi (site haritası, paylaşım önizlemeleri): önce ortam değişkeni, yoksa ana alan adı. */
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || `https://${brand.domain}`).replace(/\/$/, "");
