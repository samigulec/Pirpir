// Özel isimlere Türkçe ekler (ünlü uyumu ve ünsüz benzeşmesiyle): İzmir'de, Paris'ten, Roma'ya.
const BACK = "aıou";
const VOWELS = "aeıioöuü";
const HARD = "çfhkpsşt";

function parts(word: string) {
  const w = word.toLocaleLowerCase("tr-TR");
  const vowels = [...w].filter((c) => VOWELS.includes(c));
  const lastVowel = vowels[vowels.length - 1] ?? "e";
  const lastChar = w[w.length - 1] ?? "";
  return { back: BACK.includes(lastVowel), endsVowel: VOWELS.includes(lastChar), hard: HARD.includes(lastChar) };
}

/** Bulunma: İzmir'de, Antalya'da, Paris'te */
export function locative(name: string): string {
  const p = parts(name);
  return `${name}'${p.hard ? "t" : "d"}${p.back ? "a" : "e"}`;
}

/** Ayrılma: Amsterdam'dan, Paris'ten */
export function ablative(name: string): string {
  const p = parts(name);
  return `${name}'${p.hard ? "t" : "d"}${p.back ? "an" : "en"}`;
}

/** Yönelme: İstanbul'a, Roma'ya, Brüksel'e */
export function dative(name: string): string {
  const p = parts(name);
  return `${name}'${p.endsVowel ? "y" : ""}${p.back ? "a" : "e"}`;
}
