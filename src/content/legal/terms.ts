// Kullanım koşulları. Köşeli parantezli yer tutucular doldurulmalı ve metin yayın öncesi
// bir hukukçuya kontrol ettirilmelidir.
import type { LegalDoc } from "./types";

export const terms: Record<"tr" | "en" | "nl" | "de" | "fr" | "es" | "it", LegalDoc> = {
  tr: {
    title: "Kullanım Koşulları",
    updated: "Son güncelleme: 17 Ekim 2026",
    intro: "{brand} hizmetini kullanarak bu koşulları kabul etmiş olursun. Kısa ve anlaşılır tutmaya çalıştık.",
    sections: [
      { id: "hizmet", title: "Hizmetimiz", body: ["{brand}, havayollarının uçuşlarını aramanı, karşılaştırmanı ve bilet almanı sağlayan bir aracıdır. Hizmeti [ŞİRKET ADI] ([ADRES]) sunar.", "Uçuşu gerçekleştiren taraf havayoludur. Bilet satın aldığında taşıma sözleşmen havayoluyla kurulur ve havayolunun taşıma kuralları geçerlidir."] },
      { id: "fiyat", title: "Fiyatlar ve ödeme", body: ["Gösterdiğimiz fiyatlara vergiler ve hizmet bedeli dahildir; ek bagaj gibi seçtiğin ekstralar ayrıca gösterilir.", "Fiyatlar havayolları tarafından anlık değişebilir. Ödeme anındaki fiyat geçerlidir."] },
      { id: "iptal", title: "İptal ve değişiklik", body: ["Satın aldıktan sonraki 24 saat içinde ücretsiz iptal edebilirsin. Sonrasında havayolunun kuralları geçerlidir. [İPTAL KOŞULLARI]"] },
      { id: "yolcu", title: "Yolcunun sorumlulukları", body: ["Yolcu bilgilerini pasaporttaki gibi ve doğru girmek senin sorumluluğundadır.", "Pasaport, vize ve sağlık belgeleri gibi seyahat belgelerinin geçerli olmasını sağlamak yolcuya aittir."] },
      { id: "hesap", title: "Hesabın", body: ["Hesabının güvenliğinden sen sorumlusun. Giriş bağlantılarını kimseyle paylaşma.", "Hesabını istediğin zaman silebilirsin: [İLETİŞİM E-POSTASI]."] },
      { id: "sorumluluk", title: "Sorumluluk", body: ["Uçuşların iptali, gecikmesi ya da değişmesinden havayolu sorumludur; bu durumlarda haklarını kullanmana yardımcı oluruz.", "Yasaların izin verdiği ölçüde sorumluluğumuz, hizmetimiz için ödediğin bedelle sınırlıdır."] },
      { id: "hukuk", title: "Uygulanacak hukuk", body: ["Bu koşullara [UYGULANACAK HUKUK] uygulanır. Tüketici olarak yaşadığın ülkenin zorunlu tüketici hakların saklıdır."] },
      { id: "iletisim", title: "İletişim", body: ["Sorun ve önerilerin için: [İLETİŞİM E-POSTASI] · [DESTEK TELEFONU]"] },
    ],
  },
  en: {
    title: "Terms of Use",
    updated: "Last updated: 17 October 2026",
    intro: "By using {brand} you accept these terms. We've tried to keep them short and clear.",
    sections: [
      { id: "hizmet", title: "Our service", body: ["{brand} is an intermediary that lets you search, compare and book airline flights. The service is provided by [ŞİRKET ADI] ([ADRES]).", "The airline operates the flight. When you buy a ticket, your contract of carriage is with the airline and its conditions of carriage apply."] },
      { id: "fiyat", title: "Prices and payment", body: ["Our prices include taxes and service fees; extras you choose, such as additional baggage, are shown separately.", "Airlines can change prices at any time. The price at the moment of payment applies."] },
      { id: "iptal", title: "Cancellations and changes", body: ["You can cancel for free within 24 hours of booking. After that, the airline's rules apply. [İPTAL KOŞULLARI]"] },
      { id: "yolcu", title: "Traveller responsibilities", body: ["You are responsible for entering traveller details correctly, exactly as in the passport.", "Travellers are responsible for valid travel documents such as passports, visas and health documents."] },
      { id: "hesap", title: "Your account", body: ["You are responsible for keeping your account secure. Don't share your sign-in links.", "You can delete your account at any time: [İLETİŞİM E-POSTASI]."] },
      { id: "sorumluluk", title: "Liability", body: ["The airline is responsible for cancellations, delays or changes to flights; we will help you exercise your rights in these cases.", "To the extent permitted by law, our liability is limited to the amount you paid for our service."] },
      { id: "hukuk", title: "Governing law", body: ["These terms are governed by [UYGULANACAK HUKUK]. Your mandatory consumer rights in your country of residence are not affected."] },
      { id: "iletisim", title: "Contact", body: ["Questions and feedback: [İLETİŞİM E-POSTASI] · [DESTEK TELEFONU]"] },
    ],
  },
  nl: {
    title: "Gebruiksvoorwaarden",
    updated: "Laatst bijgewerkt: 17 oktober 2026",
    intro: "Door {brand} te gebruiken ga je akkoord met deze voorwaarden. We hebben ze zo kort en duidelijk mogelijk gehouden.",
    sections: [
      { id: "hizmet", title: "Onze dienst", body: ["{brand} is een tussenpersoon waarmee je vluchten van luchtvaartmaatschappijen zoekt, vergelijkt en boekt. De dienst wordt geleverd door [ŞİRKET ADI] ([ADRES]).", "De luchtvaartmaatschappij voert de vlucht uit. Als je een ticket koopt, sluit je de vervoersovereenkomst met de maatschappij en gelden haar vervoersvoorwaarden."] },
      { id: "fiyat", title: "Prijzen en betaling", body: ["Onze prijzen zijn inclusief belastingen en servicekosten; extra's die je kiest, zoals extra bagage, staan apart vermeld.", "Maatschappijen kunnen prijzen op elk moment wijzigen. De prijs op het moment van betalen geldt."] },
      { id: "iptal", title: "Annuleren en wijzigen", body: ["Binnen 24 uur na boeking kun je gratis annuleren. Daarna gelden de regels van de maatschappij. [İPTAL KOŞULLARI]"] },
      { id: "yolcu", title: "Verantwoordelijkheden van de reiziger", body: ["Je bent zelf verantwoordelijk voor het juist invullen van reizigersgegevens, precies zoals in het paspoort.", "Reizigers zorgen zelf voor geldige reisdocumenten zoals paspoort, visum en gezondheidsverklaringen."] },
      { id: "hesap", title: "Je account", body: ["Je bent zelf verantwoordelijk voor de beveiliging van je account. Deel je inloglinks met niemand.", "Je kunt je account op elk moment laten verwijderen: [İLETİŞİM E-POSTASI]."] },
      { id: "sorumluluk", title: "Aansprakelijkheid", body: ["De maatschappij is verantwoordelijk voor annuleringen, vertragingen of wijzigingen van vluchten; we helpen je in die gevallen je rechten uit te oefenen.", "Voor zover de wet dat toestaat, is onze aansprakelijkheid beperkt tot het bedrag dat je voor onze dienst hebt betaald."] },
      { id: "hukuk", title: "Toepasselijk recht", body: ["Op deze voorwaarden is [UYGULANACAK HUKUK] van toepassing. Je dwingende consumentenrechten in je woonland blijven gelden."] },
      { id: "iletisim", title: "Contact", body: ["Vragen en suggesties: [İLETİŞİM E-POSTASI] · [DESTEK TELEFONU]"] },
    ],
  },
  de: {
    title: "Nutzungsbedingungen",
    updated: "Zuletzt aktualisiert: 17. Oktober 2026",
    intro: "Wenn du {brand} nutzt, akzeptierst du diese Bedingungen. Wir haben versucht, sie kurz und verständlich zu halten.",
    sections: [
      { id: "hizmet", title: "Unser Service", body: ["{brand} ist ein Vermittler, mit dem du Flüge von Airlines suchen, vergleichen und buchen kannst. Der Service wird von [ŞİRKET ADI] ([ADRES]) angeboten.", "Den Flug führt die Airline durch. Wenn du ein Ticket kaufst, schließt du den Beförderungsvertrag mit der Airline und es gelten ihre Beförderungsbedingungen."] },
      { id: "fiyat", title: "Preise und Zahlung", body: ["Unsere Preise enthalten Steuern und Servicegebühren; Extras, die du wählst, zum Beispiel zusätzliches Gepäck, werden separat angezeigt.", "Airlines können Preise jederzeit ändern. Es gilt der Preis zum Zeitpunkt der Zahlung."] },
      { id: "iptal", title: "Stornierung und Umbuchung", body: ["Innerhalb von 24 Stunden nach der Buchung kannst du kostenlos stornieren. Danach gelten die Regeln der Airline. [İPTAL KOŞULLARI]"] },
      { id: "yolcu", title: "Pflichten der Reisenden", body: ["Du bist dafür verantwortlich, die Daten der Reisenden korrekt einzugeben, genau so wie im Reisepass.", "Reisende sind selbst für gültige Reisedokumente wie Reisepass, Visum und Gesundheitsnachweise verantwortlich."] },
      { id: "hesap", title: "Dein Konto", body: ["Du bist dafür verantwortlich, dein Konto sicher zu halten. Teile deine Anmeldelinks mit niemandem.", "Du kannst dein Konto jederzeit löschen lassen: [İLETİŞİM E-POSTASI]."] },
      { id: "sorumluluk", title: "Haftung", body: ["Für Annullierungen, Verspätungen oder Änderungen von Flügen ist die Airline verantwortlich; wir helfen dir in diesen Fällen, deine Rechte wahrzunehmen.", "Soweit gesetzlich zulässig, ist unsere Haftung auf den Betrag begrenzt, den du für unseren Service bezahlt hast."] },
      { id: "hukuk", title: "Anwendbares Recht", body: ["Für diese Bedingungen gilt [UYGULANACAK HUKUK]. Deine zwingenden Verbraucherrechte in deinem Wohnsitzland bleiben unberührt."] },
      { id: "iletisim", title: "Kontakt", body: ["Fragen und Feedback: [İLETİŞİM E-POSTASI] · [DESTEK TELEFONU]"] },
    ],
  },
  fr: {
    "title": "Conditions d'utilisation",
    "updated": "Dernière mise à jour : 17 octobre 2026",
    "intro": "En utilisant {brand}, tu acceptes ces conditions. On a essayé de les garder courtes et claires.",
    "sections": [
      {
        "id": "hizmet",
        "title": "Notre service",
        "body": [
          "{brand} est un intermédiaire qui te permet de rechercher, comparer et réserver des vols. Le service est fourni par [ŞİRKET ADI] ([ADRES]).",
          "C'est la compagnie aérienne qui opère le vol. Quand tu achètes un billet, ton contrat de transport est conclu avec la compagnie et ses conditions de transport s'appliquent."
        ]
      },
      {
        "id": "fiyat",
        "title": "Prix et paiement",
        "body": [
          "Nos prix incluent les taxes et les frais de service ; les options que tu choisis, comme les bagages supplémentaires, sont affichées à part.",
          "Les compagnies aériennes peuvent modifier leurs prix à tout moment. C'est le prix au moment du paiement qui s'applique."
        ]
      },
      {
        "id": "iptal",
        "title": "Annulations et modifications",
        "body": [
          "Tu peux annuler gratuitement dans les 24 heures suivant la réservation. Ensuite, ce sont les règles de la compagnie qui s'appliquent. [İPTAL KOŞULLARI]"
        ]
      },
      {
        "id": "yolcu",
        "title": "Responsabilités des voyageurs",
        "body": [
          "Tu es responsable de saisir correctement les informations des voyageurs, exactement comme sur le passeport.",
          "Les voyageurs sont responsables de disposer de documents de voyage valides, comme le passeport, le visa et les documents sanitaires."
        ]
      },
      {
        "id": "hesap",
        "title": "Ton compte",
        "body": [
          "Tu es responsable de la sécurité de ton compte. Ne partage pas tes liens de connexion.",
          "Tu peux supprimer ton compte à tout moment : [İLETİŞİM E-POSTASI]."
        ]
      },
      {
        "id": "sorumluluk",
        "title": "Responsabilité",
        "body": [
          "La compagnie aérienne est responsable des annulations, retards ou modifications de vols ; on t'aidera à faire valoir tes droits dans ces cas.",
          "Dans les limites autorisées par la loi, notre responsabilité est limitée au montant que tu as payé pour notre service."
        ]
      },
      {
        "id": "hukuk",
        "title": "Droit applicable",
        "body": [
          "Ces conditions sont régies par [UYGULANACAK HUKUK]. Les droits impératifs dont tu bénéficies en tant que consommateur dans ton pays de résidence ne sont pas affectés."
        ]
      },
      {
        "id": "iletisim",
        "title": "Contact",
        "body": [
          "Questions et retours : [İLETİŞİM E-POSTASI] · [DESTEK TELEFONU]"
        ]
      }
    ]
  },
  es: {
    "title": "Condiciones de uso",
    "updated": "Última actualización: 17 de octubre de 2026",
    "intro": "Al usar {brand} aceptas estas condiciones. Hemos intentado que sean breves y claras.",
    "sections": [
      {
        "id": "hizmet",
        "title": "Nuestro servicio",
        "body": [
          "{brand} es un intermediario que te permite buscar, comparar y reservar vuelos de aerolíneas. El servicio lo presta [ŞİRKET ADI] ([ADRES]).",
          "El vuelo lo opera la aerolínea. Cuando compras un billete, tu contrato de transporte es con la aerolínea y se aplican sus condiciones de transporte."
        ]
      },
      {
        "id": "fiyat",
        "title": "Precios y pago",
        "body": [
          "Nuestros precios incluyen impuestos y gastos de gestión; los extras que elijas, como el equipaje adicional, se muestran aparte.",
          "Las aerolíneas pueden cambiar los precios en cualquier momento. Se aplica el precio vigente en el momento del pago."
        ]
      },
      {
        "id": "iptal",
        "title": "Cancelaciones y cambios",
        "body": [
          "Puedes cancelar gratis en las 24 horas siguientes a la reserva. Después se aplican las normas de la aerolínea. [İPTAL KOŞULLARI]"
        ]
      },
      {
        "id": "yolcu",
        "title": "Responsabilidades del viajero",
        "body": [
          "Eres responsable de introducir correctamente los datos de los viajeros, exactamente como en el pasaporte.",
          "Los viajeros son responsables de llevar documentos de viaje válidos, como pasaportes, visados y documentos sanitarios."
        ]
      },
      {
        "id": "hesap",
        "title": "Tu cuenta",
        "body": [
          "Eres responsable de mantener tu cuenta segura. No compartas tus enlaces de inicio de sesión.",
          "Puedes eliminar tu cuenta en cualquier momento: [İLETİŞİM E-POSTASI]."
        ]
      },
      {
        "id": "sorumluluk",
        "title": "Responsabilidad",
        "body": [
          "La aerolínea es responsable de las cancelaciones, los retrasos o los cambios de los vuelos; te ayudaremos a ejercer tus derechos en estos casos.",
          "En la medida en que lo permita la ley, nuestra responsabilidad se limita al importe que pagaste por nuestro servicio."
        ]
      },
      {
        "id": "hukuk",
        "title": "Legislación aplicable",
        "body": [
          "Estas condiciones se rigen por [UYGULANACAK HUKUK]. Esto no afecta a tus derechos obligatorios como consumidor en tu país de residencia."
        ]
      },
      {
        "id": "iletisim",
        "title": "Contacto",
        "body": [
          "Preguntas y comentarios: [İLETİŞİM E-POSTASI] · [DESTEK TELEFONU]"
        ]
      }
    ]
  },
  it: {
    "title": "Condizioni d'uso",
    "updated": "Ultimo aggiornamento: 17 ottobre 2026",
    "intro": "Usando {brand} accetti queste condizioni. Abbiamo cercato di tenerle brevi e chiare.",
    "sections": [
      {
        "id": "hizmet",
        "title": "Il nostro servizio",
        "body": [
          "{brand} è un intermediario che ti permette di cercare, confrontare e prenotare voli delle compagnie aeree. Il servizio è fornito da [ŞİRKET ADI] ([ADRES]).",
          "Il volo è operato dalla compagnia aerea. Quando acquisti un biglietto, il tuo contratto di trasporto è con la compagnia aerea e si applicano le sue condizioni di trasporto."
        ]
      },
      {
        "id": "fiyat",
        "title": "Prezzi e pagamento",
        "body": [
          "I nostri prezzi includono tasse e commissioni di servizio; gli extra che scegli, come bagagli aggiuntivi, sono indicati a parte.",
          "Le compagnie aeree possono cambiare i prezzi in qualsiasi momento. Vale il prezzo al momento del pagamento."
        ]
      },
      {
        "id": "iptal",
        "title": "Cancellazioni e modifiche",
        "body": [
          "Puoi cancellare gratuitamente entro 24 ore dalla prenotazione. Dopo valgono le regole della compagnia aerea. [İPTAL KOŞULLARI]"
        ]
      },
      {
        "id": "yolcu",
        "title": "Responsabilità del viaggiatore",
        "body": [
          "Sei responsabile di inserire correttamente i dati dei viaggiatori, esattamente come nel passaporto.",
          "I viaggiatori sono responsabili di avere documenti di viaggio validi, come passaporto, visto e certificati sanitari."
        ]
      },
      {
        "id": "hesap",
        "title": "Il tuo account",
        "body": [
          "Sei responsabile della sicurezza del tuo account. Non condividere i tuoi link di accesso.",
          "Puoi eliminare il tuo account in qualsiasi momento: [İLETİŞİM E-POSTASI]."
        ]
      },
      {
        "id": "sorumluluk",
        "title": "Responsabilità",
        "body": [
          "La compagnia aerea è responsabile di cancellazioni, ritardi o modifiche dei voli; in questi casi ti aiutiamo a far valere i tuoi diritti.",
          "Nei limiti consentiti dalla legge, la nostra responsabilità è limitata all'importo che hai pagato per il nostro servizio."
        ]
      },
      {
        "id": "hukuk",
        "title": "Legge applicabile",
        "body": [
          "Queste condizioni sono regolate da [UYGULANACAK HUKUK]. Restano salvi i diritti inderogabili che hai come consumatore nel tuo paese di residenza."
        ]
      },
      {
        "id": "iletisim",
        "title": "Contatti",
        "body": [
          "Domande e suggerimenti: [İLETİŞİM E-POSTASI] · [DESTEK TELEFONU]"
        ]
      }
    ]
  },
};
