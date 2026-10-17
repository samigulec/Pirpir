import { defineRouting } from "next-intl/routing";

// Türkçe varsayılan dil ve önek almaz (/ara); diğerleri önekli ve kendi dilinde adresli (/en/search, /nl/zoeken).
export const routing = defineRouting({
  locales: ["tr", "en", "nl"],
  defaultLocale: "tr",
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/ara": { tr: "/ara", en: "/search", nl: "/zoeken" },
    "/ucuslar/[nereden]/[nereye]": {
      tr: "/ucuslar/[nereden]/[nereye]",
      en: "/flights/[nereden]/[nereye]",
      nl: "/vluchten/[nereden]/[nereye]",
    },
    "/rezervasyon/[teklifId]": { tr: "/rezervasyon/[teklifId]", en: "/booking/[teklifId]", nl: "/boeking/[teklifId]" },
    "/rezervasyon/[teklifId]/onay": {
      tr: "/rezervasyon/[teklifId]/onay",
      en: "/booking/[teklifId]/confirmation",
      nl: "/boeking/[teklifId]/bevestiging",
    },
    "/rezervasyon/[teklifId]/plan": {
      tr: "/rezervasyon/[teklifId]/plan",
      en: "/booking/[teklifId]/plan",
      nl: "/boeking/[teklifId]/reisplan",
    },
    "/giris": { tr: "/giris", en: "/login", nl: "/inloggen" },
    "/biletlerim": { tr: "/biletlerim", en: "/my-trips", nl: "/mijn-reizen" },
    "/hesap": { tr: "/hesap", en: "/account", nl: "/account" },
    "/gizlilik": { tr: "/gizlilik", en: "/privacy", nl: "/privacy" },
    "/kosullar": { tr: "/kosullar", en: "/terms", nl: "/voorwaarden" },
  },
});

export type AppPathname = keyof typeof routing.pathnames;
