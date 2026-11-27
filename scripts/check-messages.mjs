// 7 dildeki çeviri dosyalarının (messages/{tr,en,nl,de,fr,es,it}/*.json) bütünlük denetimi.
// Kontrol edilenler: dosya listesi eşitliği, anahtar kümesi eşitliği, boş metin yokluğu,
// dengeli süslü parantezler, ICU yer tutucuları ({brand}, {partner, select, …}) ve zengin metin etiketleri (<price>).
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "messages");
const LOCALES = ["tr", "en", "nl", "de", "fr", "es", "it"];
const BASE = "tr";

// Türkçede ses uyumuna göre ekli varyantı olan değişkenler (diğer dillerde yalın hali kullanılır)
const TR_SUFFIX_MAP = {
  fromAbl: "from",
  toDat: "to",
  countryLoc: "country",
  cityLoc: "city",
  place: "city",
};

function flatten(obj, prefix = "", out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) {
      v.forEach((item, idx) => {
        const itemKey = `${key}[${idx}]`;
        if (item !== null && typeof item === "object") flatten(item, itemKey, out);
        else out.set(itemKey, item);
      });
    } else if (v !== null && typeof v === "object") {
      flatten(v, key, out);
    } else {
      out.set(key, v);
    }
  }
  return out;
}

/**
 * ICU mesajındaki üst düzey yer tutucularını ve iç içe select/plural içindeki yer tutucuları çıkarır.
 * Ayrıca süslü parantez dengesizliğini yakalar.
 */
function parseIcu(str) {
  const vars = new Set();
  const selectKeys = new Map();
  let balanced = true;

  function scan(s, start, end) {
    let i = start;
    while (i < end) {
      const ch = s[i];
      if (ch === "'") {
        // ICU tek tırnak kaçışı ('' -> literal ')
        if (s[i + 1] === "'") {
          i += 2;
          continue;
        }
        if (s[i + 1] === "{" || s[i + 1] === "}") {
          const close = s.indexOf("'", i + 2);
          i = close === -1 ? end : close + 1;
          continue;
        }
        i++;
        continue;
      }
      if (ch === "}") {
        balanced = false;
        return;
      }
      if (ch === "{") {
        let depth = 1;
        let j = i + 1;
        while (j < end && depth > 0) {
          if (s[j] === "{") depth++;
          else if (s[j] === "}") depth--;
          j++;
        }
        if (depth !== 0) {
          balanced = false;
          return;
        }
        const inner = s.slice(i + 1, j - 1);
        const comma = inner.indexOf(",");
        if (comma === -1) {
          const name = inner.trim();
          if (name) vars.add(name);
        } else {
          const name = inner.slice(0, comma).trim();
          if (name) vars.add(name);
          const rest = inner.slice(comma + 1).trim();
          const comma2 = rest.indexOf(",");
          const kind = (comma2 === -1 ? rest : rest.slice(0, comma2)).trim();
          if ((kind === "select" || kind === "plural") && comma2 !== -1) {
            const body = rest.slice(comma2 + 1);
            const opts = new Set();
            let k = 0;
            while (k < body.length) {
              while (k < body.length && /\s/.test(body[k])) k++;
              if (k >= body.length) break;
              const optStart = k;
              while (k < body.length && !/[\s{]/.test(body[k])) k++;
              const optName = body.slice(optStart, k);
              while (k < body.length && /\s/.test(body[k])) k++;
              if (body[k] !== "{") {
                balanced = false;
                return;
              }
              let d = 1;
              let m = k + 1;
              while (m < body.length && d > 0) {
                if (body[m] === "{") d++;
                else if (body[m] === "}") d--;
                m++;
              }
              if (d !== 0) {
                balanced = false;
                return;
              }
              if (optName) opts.add(optName);
              scan(body, k + 1, m - 1);
              k = m;
            }
            if (kind === "select") {
              selectKeys.set(name, [...opts].sort().join(","));
            }
          }
        }
        i = j;
        continue;
      }
      i++;
    }
  }

  scan(str, 0, str.length);

  // Zengin metin etiketleri: <price></price>, <terms>...</terms>
  const tags = new Set([...str.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)\s*>/g)].map((m) => m[1]));
  return { vars, selectKeys, tags, balanced };
}

const normalizeVar = (v) => TR_SUFFIX_MAP[v] ?? v;

const errors = [];

const baseFiles = fs.readdirSync(path.join(ROOT, BASE)).filter((f) => f.endsWith(".json")).sort();

for (const locale of LOCALES) {
  const dir = path.join(ROOT, locale);
  if (!fs.existsSync(dir)) {
    errors.push(`Eksik dil klasörü: messages/${locale}`);
    continue;
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  if (files.join(",") !== baseFiles.join(",")) {
    errors.push(`Dosya listesi uyumsuz (${locale}): beklenen [${baseFiles.join(", ")}], bulunan [${files.join(", ")}]`);
  }
}

for (const file of baseFiles) {
  const maps = new Map();
  for (const locale of LOCALES) {
    const p = path.join(ROOT, locale, file);
    if (!fs.existsSync(p)) continue;
    try {
      const json = JSON.parse(fs.readFileSync(p, "utf8"));
      maps.set(locale, flatten(json));
    } catch (e) {
      errors.push(`JSON parse hatası (${locale}/${file}): ${e.message}`);
    }
  }

  const baseMap = maps.get(BASE);
  if (!baseMap) continue;

  for (const locale of LOCALES) {
    const m = maps.get(locale);
    if (!m) continue;

    for (const key of baseMap.keys()) {
      if (!m.has(key)) errors.push(`Eksik anahtar: ${locale}/${file} → ${key}`);
    }
    for (const key of m.keys()) {
      if (!baseMap.has(key)) errors.push(`Fazla anahtar: ${locale}/${file} → ${key}`);
    }

    for (const [key, val] of m.entries()) {
      if (typeof val !== "string" || val.trim().length === 0) {
        errors.push(`Boş veya metin olmayan değer: ${locale}/${file} → ${key}`);
        continue;
      }
      const parsed = parseIcu(val);
      if (!parsed.balanced) {
        errors.push(`Dengesiz ICU parantezi: ${locale}/${file} → ${key}`);
        continue;
      }

      if (locale !== BASE && baseMap.has(key) && typeof baseMap.get(key) === "string") {
        const ref = parseIcu(baseMap.get(key));
        const refVars = [...new Set([...ref.vars].map(normalizeVar))].sort().join(",");
        const curVars = [...new Set([...parsed.vars].map(normalizeVar))].sort().join(",");
        if (refVars !== curVars) {
          errors.push(`ICU yer tutucu farkı: ${locale}/${file} → ${key} (tr: [${refVars}], ${locale}: [${curVars}])`);
        }

        const refTags = [...ref.tags].sort().join(",");
        const curTags = [...parsed.tags].sort().join(",");
        if (refTags !== curTags) {
          errors.push(`Zengin etiket farkı: ${locale}/${file} → ${key} (tr: [${refTags}], ${locale}: [${curTags}])`);
        }

        for (const [selVar, refOpts] of ref.selectKeys.entries()) {
          const curOpts = parsed.selectKeys.get(selVar);
          if (curOpts !== refOpts) {
            errors.push(`ICU select seçenek farkı: ${locale}/${file} → ${key} ({${selVar}} tr: [${refOpts}], ${locale}: [${curOpts ?? "yok"}])`);
          }
        }
      }
    }
  }
}

if (errors.length) {
  console.error(`Çeviri bütünlüğü kontrolü BAŞARISIZ (${errors.length} hata):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`Çeviri bütünlüğü temiz: ${LOCALES.length} dil × ${baseFiles.length} dosya denetlendi, 0 hata.`);
