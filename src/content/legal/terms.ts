// Kullanım koşulları. Köşeli parantezli yer tutucular doldurulmalı ve metin yayın öncesi
// bir hukukçuya kontrol ettirilmelidir.
import type { LegalDoc } from "./types";

export const terms: Record<"tr" | "en" | "nl", LegalDoc> = {
  tr: {
    title: "Kullanım Koşulları",
    updated: "Son güncelleme: 17 Ekim 2026",
    intro: "rotala'yı kullanarak bu koşulları kabul etmiş olursun. Kısa ve anlaşılır tutmaya çalıştık.",
    sections: [
      { id: "hizmet", title: "Hizmetimiz", body: ["rotala, havayollarının uçuşlarını aramanı, karşılaştırmanı ve bilet almanı sağlayan bir aracıdır. Hizmeti [ŞİRKET ADI] ([ADRES]) sunar.", "Uçuşu gerçekleştiren taraf havayoludur. Bilet satın aldığında taşıma sözleşmen havayoluyla kurulur ve havayolunun taşıma kuralları geçerlidir."] },
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
    intro: "By using rotala you accept these terms. We've tried to keep them short and clear.",
    sections: [
      { id: "hizmet", title: "Our service", body: ["rotala is an intermediary that lets you search, compare and book airline flights. The service is provided by [ŞİRKET ADI] ([ADRES]).", "The airline operates the flight. When you buy a ticket, your contract of carriage is with the airline and its conditions of carriage apply."] },
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
    intro: "Door rotala te gebruiken ga je akkoord met deze voorwaarden. We hebben ze zo kort en duidelijk mogelijk gehouden.",
    sections: [
      { id: "hizmet", title: "Onze dienst", body: ["rotala is een tussenpersoon waarmee je vluchten van luchtvaartmaatschappijen zoekt, vergelijkt en boekt. De dienst wordt geleverd door [ŞİRKET ADI] ([ADRES]).", "De luchtvaartmaatschappij voert de vlucht uit. Als je een ticket koopt, sluit je de vervoersovereenkomst met de maatschappij en gelden haar vervoersvoorwaarden."] },
      { id: "fiyat", title: "Prijzen en betaling", body: ["Onze prijzen zijn inclusief belastingen en servicekosten; extra's die je kiest, zoals extra bagage, staan apart vermeld.", "Maatschappijen kunnen prijzen op elk moment wijzigen. De prijs op het moment van betalen geldt."] },
      { id: "iptal", title: "Annuleren en wijzigen", body: ["Binnen 24 uur na boeking kun je gratis annuleren. Daarna gelden de regels van de maatschappij. [İPTAL KOŞULLARI]"] },
      { id: "yolcu", title: "Verantwoordelijkheden van de reiziger", body: ["Je bent zelf verantwoordelijk voor het juist invullen van reizigersgegevens, precies zoals in het paspoort.", "Reizigers zorgen zelf voor geldige reisdocumenten zoals paspoort, visum en gezondheidsverklaringen."] },
      { id: "hesap", title: "Je account", body: ["Je bent zelf verantwoordelijk voor de beveiliging van je account. Deel je inloglinks met niemand.", "Je kunt je account op elk moment laten verwijderen: [İLETİŞİM E-POSTASI]."] },
      { id: "sorumluluk", title: "Aansprakelijkheid", body: ["De maatschappij is verantwoordelijk voor annuleringen, vertragingen of wijzigingen van vluchten; we helpen je in die gevallen je rechten uit te oefenen.", "Voor zover de wet dat toestaat, is onze aansprakelijkheid beperkt tot het bedrag dat je voor onze dienst hebt betaald."] },
      { id: "hukuk", title: "Toepasselijk recht", body: ["Op deze voorwaarden is [UYGULANACAK HUKUK] van toepassing. Je dwingende consumentenrechten in je woonland blijven gelden."] },
      { id: "iletisim", title: "Contact", body: ["Vragen en suggesties: [İLETİŞİM E-POSTASI] · [DESTEK TELEFONU]"] },
    ],
  },
};
