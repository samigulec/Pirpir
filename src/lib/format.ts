/** Dakikayı { h, m } olarak böler; `pad` ile dakika iki haneli olur (4 sa 05 dk). */
export function splitDuration(mins: number, pad = false) {
  const m = mins % 60;
  return { h: Math.floor(mins / 60), m: pad ? String(m).padStart(2, "0") : String(m) };
}
