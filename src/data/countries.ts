// Uyruk listesi: ISO 3166-1 alfa-2 kodları. Adlar sayfa dilinde tarayıcı/sunucu Intl verisinden gelir
// (Türkiye / Turkey / Turkije / Türkei), böylece her dil için ayrı liste tutulmaz.
import { countryName } from "./airports-core";

export const COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AL", "AM", "AO", "AR", "AT", "AU", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ",
  "BN", "BO", "BR", "BS", "BT", "BW", "BY", "BZ", "CA", "CD", "CF", "CG", "CH", "CI", "CL", "CM", "CN", "CO", "CR", "CU",
  "CV", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "ER", "ES", "ET", "FI", "FJ", "FM", "FR", "GA",
  "GB", "GD", "GE", "GH", "GM", "GN", "GQ", "GR", "GT", "GW", "GY", "HK", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IN",
  "IQ", "IR", "IS", "IT", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KZ", "LA", "LB", "LC",
  "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MR",
  "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NE", "NG", "NI", "NL", "NO", "NP", "NR", "NZ", "OM", "PA", "PE", "PG",
  "PH", "PK", "PL", "PS", "PT", "PW", "PY", "QA", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SI", "SK",
  "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SY", "SZ", "TD", "TG", "TH", "TJ", "TL", "TM", "TN", "TO", "TR", "TT",
  "TV", "TW", "TZ", "UA", "UG", "US", "UY", "UZ", "VA", "VC", "VE", "VN", "VU", "WS", "XK", "YE", "ZA", "ZM", "ZW",
] as const;

/** Listenin başında gösterilenler (hizmet verdiğimiz pazarlar). */
export const COMMON_COUNTRIES = ["TR", "NL", "BE", "DE", "GB", "US", "FR", "AT", "CH"] as const;

/** Sayfa diline göre önceden seçili uyruk (İngilizcede seçim yolcuya bırakılır). */
export const DEFAULT_NATIONALITY: Record<string, string> = { tr: "TR", nl: "NL", de: "DE" };

const CODES = new Set<string>(COUNTRY_CODES);
export const isCountryCode = (v: unknown): v is string => typeof v === "string" && CODES.has(v);

/** Eski kayıtlarda uyruk Türkçe adla tutuluyordu. */
const LEGACY: Record<string, string> = { Türkiye: "TR", Hollanda: "NL", Belçika: "BE", Almanya: "DE" };

/** Kayıttaki uyruk → ISO kodu (eski adlar da çevrilir; bilinmiyorsa boş). */
export function toCountryCode(v: string | undefined): string {
  if (!v) return "";
  if (isCountryCode(v)) return v;
  return LEGACY[v] ?? "";
}

/** Uyruğun sayfa dilindeki adı (eski kayıtlarda yazılan ad olduğu gibi). */
export function nationalityName(v: string | undefined, lang: string): string {
  const code = toCountryCode(v);
  return code ? countryName(code, lang) : (v ?? "");
}

/** Seçim listesi: önce sık seçilenler, sonra tüm ülkeler sayfa dilinin alfabetik sırasıyla. */
export function countryOptions(lang: string) {
  const name = (c: string) => countryName(c, lang);
  const all = COUNTRY_CODES.map((c) => ({ code: c, name: name(c) })).sort((a, b) => a.name.localeCompare(b.name, lang));
  return { common: COMMON_COUNTRIES.map((c) => ({ code: c, name: name(c) })), all };
}
