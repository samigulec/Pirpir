import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/brand";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getRouteSlugs } from "@/lib/flights";

type Href = "/" | "/gizlilik" | "/kosullar" | { pathname: "/ucuslar/[nereden]/[nereye]"; params: { nereden: string; nereye: string } };

// Arama motorları için herkese açık sayfalar, her dilde ayrı adresle ve diğer dillerin karşılıklarıyla.
// Rezervasyon, hesap ve giriş sayfaları listede yok (robots.ts'te de kapalı).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const url = (href: Href, locale: string) => base + getPathname({ href, locale }).replace(/\/$/, "");
  const pages: Href[] = [
    "/",
    ...getRouteSlugs().map((params) => ({ pathname: "/ucuslar/[nereden]/[nereye]" as const, params })),
    "/gizlilik",
    "/kosullar",
  ];
  return pages.flatMap((href) => {
    const languages = Object.fromEntries(routing.locales.map((l) => [l, url(href, l) || base]));
    return routing.locales.map((locale) => ({
      url: url(href, locale) || base,
      alternates: { languages },
      changeFrequency: href === "/" ? ("daily" as const) : ("weekly" as const),
      priority: href === "/" ? 1 : typeof href === "string" ? 0.3 : 0.8,
    }));
  });
}
