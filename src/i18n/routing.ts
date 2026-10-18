import { defineRouting } from "next-intl/routing";

// Türkçe varsayılan dil ve önek almaz (/ara); diğerleri önekli ve kendi dilinde adresli (/en/search, /nl/zoeken, /de/suche).
export const routing = defineRouting({
  locales: ["tr", "en", "nl", "de", "fr", "es", "it"],
  defaultLocale: "tr",
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/ara": { tr: "/ara", en: "/search", nl: "/zoeken", de: "/suche", fr: "/recherche", es: "/buscar", it: "/cerca" },
    "/ucuslar/[nereden]/[nereye]": {
      tr: "/ucuslar/[nereden]/[nereye]",
      en: "/flights/[nereden]/[nereye]",
      nl: "/vluchten/[nereden]/[nereye]",
      de: "/fluege/[nereden]/[nereye]",
      fr: "/vols/[nereden]/[nereye]",
      es: "/vuelos/[nereden]/[nereye]",
      it: "/voli/[nereden]/[nereye]",
    },
    "/rezervasyon/[teklifId]": { tr: "/rezervasyon/[teklifId]", en: "/booking/[teklifId]", nl: "/boeking/[teklifId]", de: "/buchung/[teklifId]", fr: "/reservation/[teklifId]", es: "/reserva/[teklifId]", it: "/prenotazione/[teklifId]" },
    "/rezervasyon/[teklifId]/onay": {
      tr: "/rezervasyon/[teklifId]/onay",
      en: "/booking/[teklifId]/confirmation",
      nl: "/boeking/[teklifId]/bevestiging",
      de: "/buchung/[teklifId]/bestaetigung",
      fr: "/reservation/[teklifId]/confirmation",
      es: "/reserva/[teklifId]/confirmacion",
      it: "/prenotazione/[teklifId]/conferma",
    },
    "/rezervasyon/[teklifId]/plan": {
      tr: "/rezervasyon/[teklifId]/plan",
      en: "/booking/[teklifId]/plan",
      nl: "/boeking/[teklifId]/reisplan",
      de: "/buchung/[teklifId]/reiseplan",
      fr: "/reservation/[teklifId]/itineraire",
      es: "/reserva/[teklifId]/itinerario",
      it: "/prenotazione/[teklifId]/itinerario",
    },
    "/giris": { tr: "/giris", en: "/login", nl: "/inloggen", de: "/anmelden", fr: "/connexion", es: "/iniciar-sesion", it: "/accedi" },
    "/biletlerim": { tr: "/biletlerim", en: "/my-trips", nl: "/mijn-reizen", de: "/meine-reisen", fr: "/mes-voyages", es: "/mis-viajes", it: "/i-miei-viaggi" },
    "/hesap": { tr: "/hesap", en: "/account", nl: "/account", de: "/konto", fr: "/compte", es: "/cuenta", it: "/account" },
    "/gizlilik": { tr: "/gizlilik", en: "/privacy", nl: "/privacy", de: "/datenschutz", fr: "/confidentialite", es: "/privacidad", it: "/privacy" },
    "/kosullar": { tr: "/kosullar", en: "/terms", nl: "/voorwaarden", de: "/agb", fr: "/conditions", es: "/condiciones", it: "/termini" },
  },
});

export type AppPathname = keyof typeof routing.pathnames;
