// Dünya havalimanı listesini OurAirports açık verisinden (kamu malı) üretir.
// Kullanım: npm run airports  → src/data/world-airports.json
// Yalnızca IATA kodu olan ve tarifeli uçuşu bulunan havalimanları alınır.
import { writeFileSync } from "node:fs";

const SOURCE = "https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv";
const SIZE = { large_airport: 3, medium_airport: 2, small_airport: 1 };

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`İndirme başarısız: ${res.status}`);
const [head, ...rows] = parseCsv(await res.text());
const col = Object.fromEntries(head.map((h, i) => [h, i]));

const out = rows
  .filter((r) => r[col.iata_code] && r[col.scheduled_service] === "yes" && SIZE[r[col.type]])
  .map((r) => {
    // "Pendik, Istanbul" gibi ilçe bilgisi varsa şehir son parçadır.
    const muni = (r[col.municipality] || "").split(",").pop().trim();
    return [
      r[col.iata_code],
      r[col.name],
      muni || r[col.name],
      r[col.iso_country],
      Math.round(Number(r[col.latitude_deg]) * 100) / 100,
      Math.round(Number(r[col.longitude_deg]) * 100) / 100,
      SIZE[r[col.type]],
    ];
  })
  .sort((a, b) => a[0].localeCompare(b[0]));

writeFileSync(new URL("../src/data/world-airports.json", import.meta.url), JSON.stringify(out));
console.log(`${out.length} havalimanı yazıldı.`);
