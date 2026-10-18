import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/brand";

// Kişisel sayfalar (rezervasyon, hesap, biletler) ve API dizine eklenmez; sayfalar ayrıca noindex taşır.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/", "/*rezervasyon/", "/*/booking/", "/*/boeking/", "/*/buchung/", "/*/reservation/", "/*/reserva/", "/*/prenotazione/"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
