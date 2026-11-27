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

/** Ortaklık modu kullanım koşulları: bilet satışı, ödeme ve iptal işlemleri satıcı tarafında yapılır. */
export const termsAffiliate: Record<"tr" | "en" | "nl" | "de" | "fr" | "es" | "it", LegalDoc> = {
  tr: {
    title: "Kullanım Koşulları",
    updated: "Son güncelleme: 27 Kasım 2026",
    intro: "{brand} hizmetini kullanarak bu koşulları kabul etmiş olursun. Kısa ve anlaşılır tutmaya çalıştık.",
    sections: [
      {
        id: "hizmet",
        title: "Hizmetimiz",
        body: [
          "{brand} bir uçuş arama ve fiyat karşılaştırma hizmetidir; doğrudan bilet satmaz. Hizmeti [ŞİRKET ADI] ([ADRES]) sunar.",
          "Bir uçuşu seçtiğinde veya ortaklık bağlantısına tıkladığında işlemini Travelpayouts / Aviasales arama altyapısı üzerinden seçtiğin havayolu ya da seyahat sitesinde tamamlarsın. Taşıma sözleşmen bilet aldığın satıcı ve havayoluyla kurulur.",
        ],
      },
      {
        id: "fiyat",
        title: "Fiyatlar ve ortaklık bağlantıları",
        body: [
          "Ana sayfada, rota sayfalarında, fırsat listesinde ve fiyat alarmlarında gösterilen tutarlar iş ortağımızın önbelleğinden alınır ve her zaman görüldüğü günle birlikte belirtilir. Canlı uçuş listesinde ve satıcı sayfasında fiyatlar koltuk durumuna göre anlık değişebilir.",
          "{brand} ödeme almaz, kart bilgini görmez ve fiyatın üstüne ek komisyon koymaz; yönlendirdiğimiz bağlantılardan iş ortaklarımızdan tanıtım komisyonu alabiliriz.",
        ],
      },
      {
        id: "iptal",
        title: "İptal, değişiklik ve bagaj",
        body: [
          "Bilet iptali, tarih değişikliği, iade ve bagaj kuralları tamamen bileti satın aldığın havayolunun ya da seyahat sitesinin koşullarına tabidir. Bu işlemler için doğrudan bileti aldığın satıcıyla iletişime geçmelisin.",
        ],
      },
      {
        id: "yolcu",
        title: "Yolcunun sorumlulukları",
        body: [
          "Satıcı sitesinde yolcu bilgilerini pasaporttaki gibi doğru girmek ve pasaport, vize gibi seyahat belgelerinin geçerliliğini kontrol etmek yolcunun sorumluluğundadır.",
        ],
      },
      {
        id: "hesap",
        title: "Hesabın ve fiyat alarmları",
        body: [
          "Hesabınla fiyat alarmları ve favori uçuşlar oluşturabilirsin. Giriş bağlantılarını kimseyle paylaşma.",
          "Fiyat alarmları bilgilendirme amaçlıdır; e-postadaki tek tıkla veya hesabından istediğin zaman kapatabilirsin. Hesabını silmek için: [İLETİŞİM E-POSTASI].",
        ],
      },
      {
        id: "sorumluluk",
        title: "Sorumluluk",
        body: [
          "{brand} taşıma sözleşmesinin tarafı değildir. Uçuş iptali, gecikme, fiyat değişikliği veya üçüncü taraf satıcıların hizmetlerinden ilgili havayolu ve satıcı sorumludur.",
        ],
      },
      {
        id: "hukuk",
        title: "Uygulanacak hukuk",
        body: ["Bu koşullara [UYGULANACAK HUKUK] uygulanır. Yaşadığın ülkenin zorunlu tüketici hakları saklıdır."],
      },
      {
        id: "iletisim",
        title: "İletişim",
        body: ["Soruların ve geri bildirimlerin için: [İLETİŞİM E-POSTASI]"],
      },
    ],
  },
  en: {
    title: "Terms of Use",
    updated: "Last updated: 27 November 2026",
    intro: "By using {brand} you accept these terms. We've tried to keep them short and clear.",
    sections: [
      {
        id: "hizmet",
        title: "Our service",
        body: [
          "{brand} is a flight search and price comparison service; it does not sell tickets directly. The service is provided by [ŞİRKET ADI] ([ADRES]).",
          "When you select a flight or follow an outbound link, you complete your booking with the airline or travel agency you choose via Travelpayouts / Aviasales. Your contract of carriage is formed with that seller and airline.",
        ],
      },
      {
        id: "fiyat",
        title: "Prices and affiliate links",
        body: [
          "Fares shown on the homepage, route pages, deals and price alerts may come from our partner's price cache and are shown with the date they were seen. Live prices can change at any time depending on seat availability.",
          "{brand} does not process payments, never sees your card details and adds no booking fee; we may earn an affiliate commission from partner links at no extra cost to you.",
        ],
      },
      {
        id: "iptal",
        title: "Cancellations, changes and baggage",
        body: [
          "Cancellations, changes, refunds and baggage allowances are governed solely by the airline or travel site where you bought your ticket. Please contact them directly for any booking support.",
        ],
      },
      {
        id: "yolcu",
        title: "Traveller responsibilities",
        body: [
          "You are responsible for entering traveller details accurately on the seller's site and ensuring your passport, visa and travel documents are valid.",
        ],
      },
      {
        id: "hesap",
        title: "Your account and price alerts",
        body: [
          "You can use your account to save price alerts and favourite flights. Keep your sign-in links private.",
          "Price alerts are for information only and can be turned off with one click at any time. To delete your account: [İLETİŞİM E-POSTASI].",
        ],
      },
      {
        id: "sorumluluk",
        title: "Liability",
        body: [
          "{brand} is not a party to your ticket purchase or carriage contract. Airlines and third-party sellers are responsible for flight changes, delays, cancellations and customer service.",
        ],
      },
      {
        id: "hukuk",
        title: "Governing law",
        body: ["These terms are governed by [UYGULANACAK HUKUK]. Your mandatory consumer rights in your country of residence remain unaffected."],
      },
      {
        id: "iletisim",
        title: "Contact",
        body: ["Questions and feedback: [İLETİŞİM E-POSTASI]"],
      },
    ],
  },
  nl: {
    title: "Gebruiksvoorwaarden",
    updated: "Laatst bijgewerkt: 27 november 2026",
    intro: "Door {brand} te gebruiken ga je akkoord met deze voorwaarden. We hebben ze zo kort en duidelijk mogelijk gehouden.",
    sections: [
      {
        id: "hizmet",
        title: "Onze dienst",
        body: [
          "{brand} is een vluchtzoek- en prijsvergelijkingsdienst en verkoopt zelf geen tickets. De dienst wordt aangeboden door [ŞİRKET ADI] ([ADRES]).",
          "Wanneer je een vlucht kiest of op een link klikt, rond je de boeking af bij de luchtvaartmaatschappij of reisaanbieder van jouw keuze via Travelpayouts / Aviasales. Je vervoersovereenkomst komt rechtstreeks met die aanbieder en maatschappij tot stand.",
        ],
      },
      {
        id: "fiyat",
        title: "Prijzen en affiliatelinks",
        body: [
          "Prijzen op de homepage, routepagina's, deals en prijsalarmen kunnen uit de prijscache van onze partner komen en tonen altijd wanneer de prijs is gezien. Live prijzen kunnen elk moment veranderen.",
          "{brand} verwerkt geen betalingen, ziet je betaalgegevens niet en rekent geen boekingskosten; we kunnen wel een commissie ontvangen via partnerlinks zonder dat jij meer betaalt.",
        ],
      },
      {
        id: "iptal",
        title: "Annuleren, wijzigen en bagage",
        body: [
          "Annuleringen, wijzigingen, terugbetalingen en bagageregels vallen volledig onder de voorwaarden van de luchtvaartmaatschappij of website waar je het ticket koopt. Neem daarvoor rechtstreeks contact met hen op.",
        ],
      },
      {
        id: "yolcu",
        title: "Verantwoordelijkheden van de reiziger",
        body: [
          "Je bent zelf verantwoordelijk voor het juist invullen van reizigersgegevens bij de aanbieder en voor geldige reisdocumenten zoals paspoort en visum.",
        ],
      },
      {
        id: "hesap",
        title: "Je account en prijsalarmen",
        body: [
          "Met je account kun je prijsalarmen en favoriete vluchten bewaren. Deel je inloglinks met niemand.",
          "Prijsalarmen zijn informatief en kun je altijd met één klik uitzetten. Je account laten verwijderen kan via: [İLETİŞİM E-POSTASI].",
        ],
      },
      {
        id: "sorumluluk",
        title: "Aansprakelijkheid",
        body: [
          "{brand} is geen partij bij je ticketkoop of vervoersovereenkomst. Luchtvaartmaatschappijen en aanbieders zijn verantwoordelijk voor annuleringen, vertragingen en klantenservice.",
        ],
      },
      {
        id: "hukuk",
        title: "Toepasselijk recht",
        body: ["Op deze voorwaarden is [UYGULANACAK HUKUK] van toepassing. Je dwingende consumentenrechten in je woonland blijven gelden."],
      },
      {
        id: "iletisim",
        title: "Contact",
        body: ["Vragen en suggesties: [İLETİŞİM E-POSTASI]"],
      },
    ],
  },
  de: {
    title: "Nutzungsbedingungen",
    updated: "Zuletzt aktualisiert: 27. November 2026",
    intro: "Wenn du {brand} nutzt, akzeptierst du diese Bedingungen. Wir haben versucht, sie kurz und verständlich zu halten.",
    sections: [
      {
        id: "hizmet",
        title: "Unser Service",
        body: [
          "{brand} ist ein Flugsuch- und Preisvergleichsdienst und verkauft selbst keine Tickets. Der Service wird von [ŞİRKET ADI] ([ADRES]) angeboten.",
          "Wenn du einen Flug auswählst oder einem Link folgst, buchst du direkt bei der gewählten Airline oder Reiseplattform über Travelpayouts / Aviasales. Dein Beförderungsvertrag kommt mit diesem Anbieter bzw. der Airline zustande.",
        ],
      },
      {
        id: "fiyat",
        title: "Preise und Affiliate-Links",
        body: [
          "Preise auf der Startseite, auf Streckenseiten, bei Deals und Preisalarmen stammen teilweise aus dem Cache unseres Partners und zeigen das Datum der Preisfindung. Live-Preise können sich je nach Verfügbarkeit jederzeit ändern.",
          "{brand} nimmt keine Zahlungen entgegen, sieht deine Kartendaten nicht und erhebt keine Buchungsgebühr; über Partnerlinks können wir eine Provision erhalten, ohne dass dein Ticket teurer wird.",
        ],
      },
      {
        id: "iptal",
        title: "Stornierung, Umbuchung und Gepäck",
        body: [
          "Stornierungen, Umbuchungen, Erstattungen und Gepäckregeln richten sich ausschließlich nach den Bedingungen der Airline oder Buchungsseite, bei der du dein Ticket kaufst. Wende dich dafür direkt an den Anbieter.",
        ],
      },
      {
        id: "yolcu",
        title: "Pflichten der Reisenden",
        body: [
          "Du bist selbst verantwortlich für korrekte Angaben beim Anbieter sowie für gültige Reisedokumente wie Reisepass und Visum.",
        ],
      },
      {
        id: "hesap",
        title: "Dein Konto und Preisalarme",
        body: [
          "Mit deinem Konto kannst du Preisalarme und Favoriten speichern. Teile deine Anmeldelinks mit niemandem.",
          "Preisalarme dienen nur zur Information und lassen sich jederzeit mit einem Klick abschalten. Konto löschen: [İLETİŞİM E-POSTASI].",
        ],
      },
      {
        id: "sorumluluk",
        title: "Haftung",
        body: [
          "{brand} ist nicht Vertragspartei deines Ticketkaufs oder Beförderungsvertrags. Für Flugänderungen, Verspätungen, Annullierungen und Kundenservice haften die jeweilige Airline und der Anbieter.",
        ],
      },
      {
        id: "hukuk",
        title: "Anwendbares Recht",
        body: ["Für diese Bedingungen gilt [UYGULANACAK HUKUK]. Zwingende Verbraucherrechte in deinem Wohnsitzland bleiben unberührt."],
      },
      {
        id: "iletisim",
        title: "Kontakt",
        body: ["Fragen und Feedback: [İLETİŞİM E-POSTASI]"],
      },
    ],
  },
  fr: {
    title: "Conditions d'utilisation",
    updated: "Dernière mise à jour : 27 novembre 2026",
    intro: "En utilisant {brand}, tu acceptes ces conditions. On a essayé de les garder courtes et claires.",
    sections: [
      {
        id: "hizmet",
        title: "Notre service",
        body: [
          "{brand} est un service de recherche et de comparaison de vols ; nous ne vendons pas de billets directement. Le service est fourni par [ŞİRKET ADI] ([ADRES]).",
          "Lorsque tu sélectionnes un vol ou cliques sur un lien, tu finalises ton achat auprès de la compagnie aérienne ou de l'agence choisie via Travelpayouts / Aviasales. Ton contrat de transport est conclu avec ce vendeur et la compagnie.",
        ],
      },
      {
        id: "fiyat",
        title: "Prix et liens d'affiliation",
        body: [
          "Les prix affichés sur l'accueil, les pages de trajets, les offres et les alertes peuvent provenir du cache de notre partenaire et indiquent le jour où ils ont été vus. Les prix en direct peuvent varier à tout moment.",
          "{brand} n'encaisse aucun paiement, ne voit jamais tes coordonnées bancaires et n'ajoute aucuns frais ; nous pouvons percevoir une commission d'affiliation sans surcoût pour toi.",
        ],
      },
      {
        id: "iptal",
        title: "Annulations, modifications et bagages",
        body: [
          "Les conditions d'annulation, de modification, de remboursement et de bagages dépendent uniquement de la compagnie aérienne ou du site vendeur auprès duquel tu achètes ton billet. Contacte-les directement pour toute demande.",
        ],
      },
      {
        id: "yolcu",
        title: "Responsabilités des voyageurs",
        body: [
          "Tu es responsable de l'exactitude des informations saisies sur le site du vendeur ainsi que de la validité de ton passeport, de tes visas et documents de voyage.",
        ],
      },
      {
        id: "hesap",
        title: "Ton compte et les alertes prix",
        body: [
          "Ton compte te permet de gérer tes alertes prix et favoris. Ne partage pas tes liens de connexion.",
          "Les alertes prix sont fournies à titre indicatif et désactivables en un clic. Pour supprimer ton compte : [İLETİŞİM E-POSTASI].",
        ],
      },
      {
        id: "sorumluluk",
        title: "Responsabilité",
        body: [
          "{brand} n'est pas partie au contrat de vente ou de transport. La compagnie aérienne et le vendeur tiers sont responsables des vols, retards, annulations et du service client.",
        ],
      },
      {
        id: "hukuk",
        title: "Droit applicable",
        body: ["Ces conditions sont régies par [UYGULANACAK HUKUK]. Tes droits impératifs de consommateur dans ton pays de résidence restent protégés."],
      },
      {
        id: "iletisim",
        title: "Contact",
        body: ["Questions et suggestions : [İLETİŞİM E-POSTASI]"],
      },
    ],
  },
  es: {
    title: "Condiciones de uso",
    updated: "Última actualización: 27 de noviembre de 2026",
    intro: "Al usar {brand}, aceptas estas condiciones. Hemos intentado mantenerlas breves y claras.",
    sections: [
      {
        id: "hizmet",
        title: "Nuestro servicio",
        body: [
          "{brand} es un servicio de búsqueda y comparación de vuelos; no vende billetes directamente. El servicio lo presta [ŞİRKET ADI] ([ADRES]).",
          "Al elegir un vuelo o pulsar un enlace, completas la compra con la aerolínea o agencia que elijas a través de Travelpayouts / Aviasales. Tu contrato de transporte se formaliza con ese vendedor y la aerolínea.",
        ],
      },
      {
        id: "fiyat",
        title: "Precios y enlaces de afiliación",
        body: [
          "Los precios mostrados en inicio, rutas, ofertas y alertas pueden proceder de la caché de nuestro socio e indican el día en que se vieron. Los precios en directo pueden cambiar en cualquier momento.",
          "{brand} no cobra pagos, nunca ve los datos de tu tarjeta ni añade comisiones sobre el precio; podemos recibir una comisión de afiliación del socio sin coste adicional para ti.",
        ],
      },
      {
        id: "iptal",
        title: "Cancelaciones, cambios y equipaje",
        body: [
          "Las cancelaciones, cambios, reembolsos y condiciones de equipaje dependen exclusivamente de la aerolínea o web donde compres el billete. Para gestionarlos debes contactar directamente con ellos.",
        ],
      },
      {
        id: "yolcu",
        title: "Responsabilidades del pasajero",
        body: [
          "Eres responsable de introducir correctamente tus datos en la web del vendedor y de contar con pasaporte, visado y documentos de viaje válidos.",
        ],
      },
      {
        id: "hesap",
        title: "Tu cuenta y alertas de precio",
        body: [
          "Tu cuenta te permite guardar alertas de precio y vuelos favoritos. No compartas tus enlaces de acceso.",
          "Las alertas son informativas y puedes desactivarlas con un clic en cualquier momento. Para eliminar tu cuenta: [İLETİŞİM E-POSTASI].",
        ],
      },
      {
        id: "sorumluluk",
        title: "Responsabilidad",
        body: [
          "{brand} no es parte del contrato de compra ni de transporte. Las aerolíneas y vendedores terceros son responsables de cancelaciones, retrasos y atención al cliente.",
        ],
      },
      {
        id: "hukuk",
        title: "Ley aplicable",
        body: ["Estas condiciones se rigen por [UYGULANACAK HUKUK]. Se mantienen intactos tus derechos imperativos como consumidor en tu país de residencia."],
      },
      {
        id: "iletisim",
        title: "Contacto",
        body: ["Preguntas y comentarios: [İLETİŞİM E-POSTASI]"],
      },
    ],
  },
  it: {
    title: "Condizioni d'uso",
    updated: "Ultimo aggiornamento: 27 novembre 2026",
    intro: "Usando {brand} accetti queste condizioni. Abbiamo cercato di tenerle brevi e chiare.",
    sections: [
      {
        id: "hizmet",
        title: "Il nostro servizio",
        body: [
          "{brand} è un servizio di ricerca e confronto voli e non vende biglietti direttamente. Il servizio è fornito da [ŞİRKET ADI] ([ADRES]).",
          "Quando selezioni un volo o clicchi un link, completi l'acquisto presso la compagnia aerea o l'agenzia scelta tramite Travelpayouts / Aviasales. Il contratto di trasporto si stipula con quel venditore e la compagnia aerea.",
        ],
      },
      {
        id: "fiyat",
        title: "Prezzi e link di affiliazione",
        body: [
          "I prezzi mostrati in home, nelle tratte, nelle offerte e negli avvisi possono provenire dalla cache del nostro partner e indicano il giorno in cui sono stati visti. I prezzi dal vivo possono variare in qualsiasi momento.",
          "{brand} non gestisce pagamenti, non vede i dati della tua carta e non aggiunge costi extra; possiamo ricevere una commissione di affiliazione dai partner senza alcun sovrapprezzo per te.",
        ],
      },
      {
        id: "iptal",
        title: "Cancellazioni, modifiche e bagaglio",
        body: [
          "Cancellazioni, modifiche, rimborsi e regole sui bagagli sono disciplinati esclusivamente dalla compagnia aerea o dal sito presso cui acquisti il biglietto. Contattali direttamente per assistenza.",
        ],
      },
      {
        id: "yolcu",
        title: "Responsabilità del passeggero",
        body: [
          "Sei responsabile della correttezza dei dati inseriti sul sito del venditore e della validità di passaporto, visti e documenti di viaggio.",
        ],
      },
      {
        id: "hesap",
        title: "Il tuo account e gli avvisi prezzo",
        body: [
          "Con il tuo account puoi salvare avvisi prezzo e voli preferiti. Non condividere i tuoi link di accesso.",
          "Gli avvisi hanno scopo informativo e si possono disattivare con un clic. Per eliminare l'account: [İLETİŞİM E-POSTASI].",
        ],
      },
      {
        id: "sorumluluk",
        title: "Responsabilità",
        body: [
          "{brand} non è parte del contratto di acquisto o di trasporto. Le compagnie aeree e i venditori terzi sono responsabili di cancellazioni, ritardi e assistenza clienti.",
        ],
      },
      {
        id: "hukuk",
        title: "Legge applicabile",
        body: ["Queste condizioni sono regolate da [UYGULANACAK HUKUK]. Restano salvi i tuoi diritti inderogabili di consumatore nel paese di residenza."],
      },
      {
        id: "iletisim",
        title: "Contatti",
        body: ["Domande e suggerimenti: [İLETİŞİM E-POSTASI]"],
      },
    ],
  },
};
