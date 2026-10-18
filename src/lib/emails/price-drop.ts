// "Fiyat düştü" e-postası: 7 dilde metin, sade HTML (e-posta programları için tablo ve satır içi stil) ve düz metin.
// Metinler çeviri dosyalarında değil burada: istek dışında (günlük kontrol) çalışır ve yalnızca e-postada kullanılır.
import "server-only";
import { brand, siteUrl } from "@/config/brand";
import { isCurrency, formatPrice, type Currency } from "../currency";
import { formatRange } from "../dates";
import { intlLocale } from "../intl";
import { isLocale, type Locale } from "@/i18n/config";

type Texts = {
  subject: string;
  heading: string;
  quote: string;
  was: string;
  now: string;
  saving: string;
  perPerson: string;
  cta: string;
  note: string;
  test: string;
  why: string;
  manage: string;
  stop: string;
};

export const PRICE_DROP_TEXTS: Record<Locale, Texts> = {
  tr: {
    subject: "Fiyat düştü: {route} şimdi {price}",
    heading: "Fiyat düştü!",
    quote: "“Takip ettiğin uçuş ucuzladı, kaçırma!”",
    was: "Önce",
    now: "Şimdi",
    saving: "{price} daha ucuz",
    perPerson: "kişi başı",
    cta: "Uçuşları gör",
    note: "Fiyatlar sık değişir; kesin fiyatı aramada görürsün.",
    test: "Test modu: bu fiyatlar örnek veridir, gerçek bilet fiyatı değildir.",
    why: "Bu e-postayı {brand}'de bu uçuş için fiyat alarmı kurduğun için aldın.",
    manage: "Alarmlarım",
    stop: "Bu alarmı kapat",
  },
  en: {
    subject: "Price drop: {route} now {price}",
    heading: "The price dropped!",
    quote: "“The flight you're watching just got cheaper. Don't miss it!”",
    was: "Before",
    now: "Now",
    saving: "{price} cheaper",
    perPerson: "per person",
    cta: "See flights",
    note: "Prices change often; you'll see the exact price in the search.",
    test: "Test mode: these are sample prices, not real fares.",
    why: "You're getting this email because you set a price alert for this flight on {brand}.",
    manage: "My alerts",
    stop: "Turn off this alert",
  },
  nl: {
    subject: "Prijsdaling: {route} nu {price}",
    heading: "De prijs is gedaald!",
    quote: "“De vlucht die je volgt is goedkoper geworden. Mis het niet!”",
    was: "Eerst",
    now: "Nu",
    saving: "{price} goedkoper",
    perPerson: "per persoon",
    cta: "Bekijk vluchten",
    note: "Prijzen veranderen vaak; de exacte prijs zie je in de zoekresultaten.",
    test: "Testmodus: dit zijn voorbeeldprijzen, geen echte tarieven.",
    why: "Je krijgt deze e-mail omdat je bij {brand} een prijsalarm voor deze vlucht hebt ingesteld.",
    manage: "Mijn alarmen",
    stop: "Dit alarm uitzetten",
  },
  de: {
    subject: "Preis gesunken: {route} jetzt {price}",
    heading: "Der Preis ist gesunken!",
    quote: "„Der Flug, den du beobachtest, ist günstiger geworden. Nicht verpassen!“",
    was: "Vorher",
    now: "Jetzt",
    saving: "{price} günstiger",
    perPerson: "pro Person",
    cta: "Flüge ansehen",
    note: "Preise ändern sich oft; den genauen Preis siehst du in der Suche.",
    test: "Testmodus: Das sind Beispielpreise, keine echten Tarife.",
    why: "Du erhältst diese E-Mail, weil du bei {brand} einen Preisalarm für diesen Flug eingerichtet hast.",
    manage: "Meine Alarme",
    stop: "Diesen Alarm ausschalten",
  },
  fr: {
    subject: "Baisse de prix : {route} maintenant à {price}",
    heading: "Le prix a baissé !",
    quote: "« Le vol que tu surveilles est moins cher. Ne le rate pas ! »",
    was: "Avant",
    now: "Maintenant",
    saving: "{price} de moins",
    perPerson: "par personne",
    cta: "Voir les vols",
    note: "Les prix changent souvent ; tu verras le prix exact dans la recherche.",
    test: "Mode test : ce sont des prix d'exemple, pas de vrais tarifs.",
    why: "Tu reçois cet e-mail car tu as créé une alerte prix pour ce vol sur {brand}.",
    manage: "Mes alertes",
    stop: "Désactiver cette alerte",
  },
  es: {
    subject: "Bajada de precio: {route} ahora a {price}",
    heading: "¡El precio ha bajado!",
    quote: "«El vuelo que sigues está más barato. ¡No te lo pierdas!»",
    was: "Antes",
    now: "Ahora",
    saving: "{price} más barato",
    perPerson: "por persona",
    cta: "Ver vuelos",
    note: "Los precios cambian a menudo; verás el precio exacto en la búsqueda.",
    test: "Modo de prueba: son precios de ejemplo, no tarifas reales.",
    why: "Recibes este correo porque creaste una alerta de precio para este vuelo en {brand}.",
    manage: "Mis alertas",
    stop: "Desactivar esta alerta",
  },
  it: {
    subject: "Prezzo sceso: {route} ora a {price}",
    heading: "Il prezzo è sceso!",
    quote: "«Il volo che segui è più economico. Non perderlo!»",
    was: "Prima",
    now: "Ora",
    saving: "{price} in meno",
    perPerson: "a persona",
    cta: "Vedi i voli",
    note: "I prezzi cambiano spesso; il prezzo esatto lo vedi nella ricerca.",
    test: "Modalità test: sono prezzi di esempio, non tariffe reali.",
    why: "Ricevi questa email perché hai impostato un avviso prezzo per questo volo su {brand}.",
    manage: "I miei avvisi",
    stop: "Disattiva questo avviso",
  },
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

export type PriceDrop = {
  lang: string;
  cur: string;
  /** "Amsterdam → İstanbul" */
  route: string;
  date: string;
  returnDate?: string;
  was: number;
  now: number;
  /** Mutlak bağlantılar */
  searchUrl: string;
  alertsUrl: string;
  stopUrl: string | null;
  testMode: boolean;
};

export function priceDropEmail(d: PriceDrop) {
  const lang: Locale = isLocale(d.lang) ? d.lang : "tr";
  const t = PRICE_DROP_TEXTS[lang];
  const cur: Currency = isCurrency(d.cur) ? d.cur : "EUR";
  const loc = intlLocale(lang);
  const price = (v: number) => formatPrice(v, cur, loc);
  const dates = formatRange(d.date, d.returnDate, loc);
  const subject = fill(t.subject, { route: d.route, price: price(d.now) });
  const saving = fill(t.saving, { price: price(d.was - d.now) });
  const why = fill(t.why, { brand: brand.name });
  const base = siteUrl();

  const text = [
    t.heading,
    "",
    `${d.route} · ${dates}`,
    `${t.was}: ${price(d.was)} → ${t.now}: ${price(d.now)} (${t.perPerson}, ${saving})`,
    "",
    `${t.cta}: ${d.searchUrl}`,
    "",
    t.note,
    ...(d.testMode ? [t.test] : []),
    "",
    why,
    `${t.manage}: ${d.alertsUrl}`,
    ...(d.stopUrl ? [`${t.stop}: ${d.stopUrl}`] : []),
  ].join("\n");

  const F = "font-family:Nunito,'Segoe UI',Helvetica,Arial,sans-serif";
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#F5F8FD;${F};color:#1E2A44">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F8FD"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:28px">
  <tr><td style="padding:28px 28px 0;font-size:28px;font-weight:800;letter-spacing:-0.01em">pir<span style="color:#FF8A65">p</span>ir</td></tr>
  <tr><td style="padding:20px 28px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EAF3FF;border-radius:24px"><tr>
      <td style="padding:20px 0 20px 20px;width:120px" valign="middle"><img src="${base}/email/pirpir.png" width="120" height="84" alt="" style="display:block;border:0"></td>
      <td style="padding:20px" valign="middle">
        <div style="font-size:26px;font-weight:800;line-height:1.15">${esc(t.heading)}</div>
        <div style="font-size:16px;font-weight:700;color:#56607A;margin-top:6px">${esc(t.quote)}</div>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:20px 28px 0">
    <div style="font-size:20px;font-weight:800">${esc(d.route)}</div>
    <div style="font-size:15px;font-weight:600;color:#56607A;margin-top:2px">${esc(dates)}</div>
  </td></tr>
  <tr><td style="padding:16px 28px 0">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:22px" valign="bottom">
        <div style="font-size:13px;font-weight:800;color:#56607A">${esc(t.was)}</div>
        <div style="font-size:20px;font-weight:700;color:#56607A;text-decoration:line-through">${esc(price(d.was))}</div>
      </td>
      <td valign="bottom">
        <div style="font-size:13px;font-weight:800;color:#2E7A4D">${esc(t.now)} · ${esc(t.perPerson)}</div>
        <div style="font-size:34px;font-weight:800;line-height:1.1">${esc(price(d.now))}</div>
      </td>
    </tr></table>
    <div style="display:inline-block;margin-top:10px;background:#E4F4EA;color:#2E7A4D;border-radius:999px;padding:6px 14px;font-size:14px;font-weight:800">↓ ${esc(saving)}</div>
  </td></tr>
  <tr><td style="padding:22px 28px 0">
    <a href="${esc(d.searchUrl)}" style="display:inline-block;background:#2F5BD3;color:#FFFFFF;text-decoration:none;border-radius:999px;padding:14px 28px;font-size:18px;font-weight:800">${esc(t.cta)}</a>
  </td></tr>
  <tr><td style="padding:18px 28px 0;font-size:14px;color:#56607A;line-height:1.5">
    ${esc(t.note)}${d.testMode ? `<br><span style="color:#8A5A00;font-weight:700">${esc(t.test)}</span>` : ""}
  </td></tr>
  <tr><td style="padding:22px 28px 28px">
    <div style="border-top:1px solid #E3E8F2;padding-top:16px;font-size:13px;color:#56607A;line-height:1.5">
      ${esc(why)}<br>
      <a href="${esc(d.alertsUrl)}" style="color:#2F5BD3;font-weight:700">${esc(t.manage)}</a>${
        d.stopUrl ? ` · <a href="${esc(d.stopUrl)}" style="color:#2F5BD3;font-weight:700">${esc(t.stop)}</a>` : ""
      }
    </div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  return { subject, html, text };
}
