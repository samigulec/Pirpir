import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // "Fırsata git" ortağı derlemede belirlenir (sunucu ve tarayıcı aynı adı görsün): Skyscanner kimliği varsa Skyscanner
  env: { NEXT_PUBLIC_OUTBOUND_PARTNER: process.env.SKYSCANNER_MEDIA_PARTNER_ID?.trim() ? "skyscanner" : "aviasales" },
  // PDF çizici Node paketidir; paketlenmeden çalışsın
  serverExternalPackages: ["@react-pdf/renderer"],
  // PDF'e gömülen yazı tipleri sunucu fonksiyonuyla birlikte yüklensin (Vercel)
  outputFileTracingIncludes: { "/api/bilet-pdf/[id]": ["./assets/fonts/*.ttf"] },
};

export default withNextIntl(nextConfig);
