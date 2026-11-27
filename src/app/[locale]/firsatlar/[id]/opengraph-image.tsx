import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getTranslations } from "next-intl/server";
import { brand } from "@/config/brand";
import { marketById, resolveMarket } from "@/config/markets";
import { cityByCode } from "@/data/airports";
import { formatPrice, toTry } from "@/lib/currency";
import { getRates } from "@/lib/currency-server";
import { getPublishedDeal } from "@/lib/deal-store";
import { formatDayWithWeekday, formatRange } from "@/lib/dates";
import { asLocale, intlLocale } from "@/lib/intl";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(file: string): Promise<ArrayBuffer | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), "assets", "fonts", file));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } catch {
    return null;
  }
}

export default async function DealOgImage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale = asLocale(rawLocale);
  const loc = intlLocale(locale);
  const [found, t, rates, fontBold, fontExtra] = await Promise.all([
    getPublishedDeal(id),
    getTranslations({ locale, namespace: "deals" }),
    getRates(),
    loadFont("Nunito_700Bold.ttf"),
    loadFont("Nunito_800ExtraBold.ttf"),
  ]);

  const fonts = [
    ...(fontBold ? [{ name: "Nunito", data: fontBold, weight: 700 as const, style: "normal" as const }] : []),
    ...(fontExtra ? [{ name: "Nunito", data: fontExtra, weight: 800 as const, style: "normal" as const }] : []),
  ];

  if (!found) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#EAF3FF",
            color: "#1E2A44",
            fontFamily: "Nunito, sans-serif",
            fontSize: 64,
            fontWeight: 800,
          }}
        >
          <span>pir</span>
          <span style={{ color: "#FF8A65" }}>p</span>
          <span>ir</span>
        </div>
      ),
      { ...size, fonts },
    );
  }

  const { deal } = found;
  const cur = marketById(resolveMarket(null, null, locale)).currency;
  const fromCity = cityByCode(deal.origin, locale);
  const toCity = cityByCode(deal.destination, locale);
  const priceText = formatPrice(toTry(deal.price_eur, "EUR", rates), cur, loc, rates);
  const normalText = t("normalPrice", { price: formatPrice(toTry(deal.median_eur, "EUR", rates), cur, loc, rates) });
  const datesText = formatRange(deal.depart, deal.return_date ?? undefined, loc);
  const pct = deal.median_eur > 0 ? Math.round(((deal.median_eur - deal.price_eur) / deal.median_eur) * 100) : 0;
  const seenText = deal.seen_at ? t("seenOn", { date: formatDayWithWeekday(deal.seen_at, loc) }) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "44px",
          background: "#EAF3FF",
          fontFamily: "Nunito, sans-serif",
          color: "#1E2A44",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "#FFFFFF",
            borderRadius: "40px",
            padding: "52px 60px",
            border: "4px solid #E3E8F2",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 800, letterSpacing: "-0.02em" }}>
              <span>pir</span>
              <span style={{ color: "#FF8A65" }}>p</span>
              <span>ir</span>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div
                style={{
                  background: "#F5F8FD",
                  color: "#56607A",
                  borderRadius: "999px",
                  padding: "10px 22px",
                  fontSize: 22,
                  fontWeight: 800,
                }}
              >
                {deal.return_date ? t("roundTrip") : t("oneWay")} · {deal.origin} → {deal.destination}
              </div>
              {pct > 0 && (
                <div
                  style={{
                    background: "#E4F4EA",
                    color: "#2E7A4D",
                    borderRadius: "999px",
                    padding: "10px 24px",
                    fontSize: 24,
                    fontWeight: 800,
                  }}
                >
                  {t("saveBadge", { pct })}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.08 }}>
              {fromCity} → {toCity}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "24px" }}>
              <div style={{ fontSize: 82, fontWeight: 800, color: "#2F5BD3", lineHeight: 1 }}>{priceText}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#56607A" }}>{t("perPerson")}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#56607A", textDecoration: "line-through" }}>
                {normalText}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 24, fontWeight: 700, color: "#56607A" }}>
            <div>{datesText}{seenText ? ` · ${seenText}` : ""}</div>
            <div style={{ color: "#2F5BD3", fontWeight: 800 }}>{brand.domain}</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
