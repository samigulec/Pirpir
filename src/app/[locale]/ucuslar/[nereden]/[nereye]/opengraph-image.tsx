import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getTranslations } from "next-intl/server";
import { brand } from "@/config/brand";
import { marketById, resolveMarket } from "@/config/markets";
import { cityByCode } from "@/data/airports";
import { formatPrice } from "@/lib/currency";
import { getRates } from "@/lib/currency-server";
import { formatDayShort } from "@/lib/dates";
import { asLocale, intlLocale } from "@/lib/intl";
import { getRoutePageData } from "@/lib/route-data";

export const runtime = "nodejs";
export const revalidate = 21600;
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

export default async function RouteOgImage({
  params,
}: {
  params: Promise<{ locale: string; nereden: string; nereye: string }>;
}) {
  const { locale: rawLocale, nereden, nereye } = await params;
  const locale = asLocale(rawLocale);
  const loc = intlLocale(locale);
  const [route, t, tc, rates, fontBold, fontExtra] = await Promise.all([
    getRoutePageData(nereden, nereye),
    getTranslations({ locale, namespace: "route" }),
    getTranslations({ locale, namespace: "common" }),
    getRates(),
    loadFont("Nunito_700Bold.ttf"),
    loadFont("Nunito_800ExtraBold.ttf"),
  ]);

  const fonts = [
    ...(fontBold ? [{ name: "Nunito", data: fontBold, weight: 700 as const, style: "normal" as const }] : []),
    ...(fontExtra ? [{ name: "Nunito", data: fontExtra, weight: 800 as const, style: "normal" as const }] : []),
  ];

  if (!route) {
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

  const cur = marketById(resolveMarket(null, null, locale)).currency;
  const fromCity = cityByCode(route.from.searchCode, locale);
  const toCity = cityByCode(route.to.searchCode, locale);
  const priceText =
    route.minPrice !== null
      ? t("ogFromPrice", { price: formatPrice(route.minPrice, cur, loc, rates) })
      : t("noPriceHero");
  const seenText =
    route.live && route.latestSeenAt ? t("seenOn", { date: formatDayShort(route.latestSeenAt, loc) }) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "44px",
          background: route.to.heroBg || "#EAF3FF",
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
            <div
              style={{
                display: "flex",
                background: "#EAF3FF",
                color: "#2F5BD3",
                borderRadius: "999px",
                padding: "10px 22px",
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              {`${route.from.tpCode} → ${route.to.tpCode}`}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.08 }}>
              {`${fromCity} → ${toCity}`}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "20px" }}>
              <div style={{ display: "flex", fontSize: 54, fontWeight: 800, color: "#2F5BD3" }}>
                {priceText}
              </div>
              {route.minPrice !== null && (
                <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "#56607A" }}>
                  {tc("roundTrip")}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 22, fontWeight: 700, color: "#56607A" }}>
            <div style={{ display: "flex" }}>{seenText || t("cta")}</div>
            <div style={{ display: "flex", color: "#1E2A44", fontWeight: 800 }}>{brand.domain}</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
