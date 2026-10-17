import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // PDF çizici Node paketidir; paketlenmeden çalışsın
  serverExternalPackages: ["@react-pdf/renderer"],
  // PDF'e gömülen yazı tipleri sunucu fonksiyonuyla birlikte yüklensin (Vercel)
  outputFileTracingIncludes: { "/api/bilet-pdf/[id]": ["./assets/fonts/*.ttf"] },
};

export default withNextIntl(nextConfig);
