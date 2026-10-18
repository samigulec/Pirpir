import { defineRouting } from "next-intl/routing";

// Türkçe varsayılan dil ve önek almaz (/ara); diğerleri önekli ve kendi dilinde adresli (/en/search, /nl/zoeken, /de/suche).
export const routing = defineRouting({
  locales: ["tr", "en", "nl", "de"],
  defaultLocale: "tr",
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/ara": { tr: "/ara", en: "/search", nl: "/zoeken", de: "/suche" },
    "/ucuslar/[nereden]/[nereye]": {
      tr: "/ucuslar/[nereden]/[nereye]",
      en: "/flights/[nereden]/[nereye]",
      nl: "/vluchten/[nereden]/[nereye]",
      de: "/fluege/[nereden]/[nereye]",
    },
    "/rezervasyon/[teklifId]": { tr: "/rezervasyon/[teklifId]", en: "/booking/[teklifId]", nl: "/boeking/[teklifId]", de: "/buchung/[teklifId]" },
    "/rezervasyon/[teklifId]/onay": {
      tr: "/rezervasyon/[teklifId]/onay",
      en: "/booking/[teklifId]/confirmation",
      nl: "/boeking/[teklifId]/bevestiging",
      de: "/buchung/[teklifId]/bestaetigung",
    },
    "/rezervasyon/[teklifId]/plan": {
      tr: "/rezervasyon/[teklifId]/plan",
      en: "/booking/[teklifId]/plan",
      nl: "/boeking/[teklifId]/reisplan",
      de: "/buchung/[teklifId]/reiseplan",
    },
    "/giris": { tr: "/giris", en: "/login", nl: "/inloggen", de: "/anmelden" },
    "/biletlerim": { tr: "/biletlerim", en: "/my-trips", nl: "/mijn-reizen", de: "/meine-reisen" },
    "/hesap": { tr: "/hesap", en: "/account", nl: "/account", de: "/konto" },
    "/gizlilik": { tr: "/gizlilik", en: "/privacy", nl: "/privacy", de: "/datenschutz" },
    "/kosullar": { tr: "/kosullar", en: "/terms", nl: "/voorwaarden", de: "/agb" },
  },
});

export type AppPathname = keyof typeof routing.pathnames;
