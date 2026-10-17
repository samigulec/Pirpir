// Gizlilik politikası. Köşeli parantezli yer tutucular şirket bilgileriyle doldurulmalı ve
// metin yayın öncesi bir hukukçuya (KVKK / GDPR) kontrol ettirilmelidir.
import type { LegalDoc } from "./types";

export const privacy: Record<"tr" | "en" | "nl", LegalDoc> = {
  tr: {
    title: "Gizlilik Politikası",
    updated: "Son güncelleme: 17 Ekim 2026",
    intro: "rotala olarak kişisel verilerini yalnızca uçuşunu bulmak, biletini kesmek ve hesabını yönetmek için kullanıyoruz. Bu sayfa hangi bilgileri neden topladığımızı ve haklarını anlatır.",
    sections: [
      { id: "biz", title: "Biz kimiz", body: ["Veri sorumlusu: [ŞİRKET ADI], [ADRES].", "Gizlilikle ilgili her sorun için: [İLETİŞİM E-POSTASI]."] },
      {
        id: "veriler",
        title: "Hangi bilgileri topluyoruz",
        body: [
          "Hesap bilgileri: e-posta adresin ve adın. Google, Facebook ya da Apple ile girersen bu hizmetin bizimle paylaştığı ad ve e-posta adresi.",
          "Rezervasyon bilgileri: yolcuların adı-soyadı, doğum tarihi, cinsiyeti, uyruğu ve pasaport numarası; iletişim için e-posta adresi ve telefon numarası. Havayolları bu bilgileri bilet kesmek için zorunlu tutar.",
          "Ödeme bilgileri: kart bilgilerini kendi sunucularımızda saklamıyoruz. Ödemeler ödeme sağlayıcısının güvenli bileşenleriyle alınır.",
          "Tercihler: seçtiğin dil ve para birimi, tarayıcında çerez ve yerel depolama olarak tutulur.",
          "Teknik bilgiler: siteyi güvenli ve çalışır tutmak için sunucu kayıtlarında IP adresi ve tarayıcı bilgisi.",
        ],
      },
      {
        id: "amac",
        title: "Bilgileri ne için kullanıyoruz",
        body: [
          "Uçuş aramak, biletini kesmek ve rezervasyonunu yönetmek.",
          "Biletini ve uçuş değişikliklerini sana iletmek.",
          "Hesabını açmak, giriş yapmanı sağlamak ve Biletlerim sayfasında biletlerini göstermek.",
          "Dolandırıcılığı önlemek ve yasal yükümlülüklerimizi yerine getirmek.",
          "Fiyat alarmı gibi bilgilendirme e-postalarını yalnızca sen istersen gönderiyoruz; istediğin zaman çıkabilirsin.",
        ],
      },
      {
        id: "paylasim",
        title: "Bilgileri kimlerle paylaşıyoruz",
        body: [
          "Havayolları ve uçuş sağlayıcımız (Duffel): bilet kesimi için gereken yolcu ve iletişim bilgileri.",
          "Altyapı sağlayıcılarımız: Supabase (hesap ve veritabanı), Vercel (sitenin barındırılması).",
          "Giriş sağlayıcıları: Google, Facebook ya da Apple ile girmeyi seçersen ilgili hizmet.",
          "Ödeme sağlayıcısı: ödemeni almak için.",
          "Kişisel verilerini satmıyoruz ve reklam amacıyla paylaşmıyoruz. Bazı sağlayıcılarımız verileri Avrupa Ekonomik Alanı dışında işleyebilir; bu durumda yasal güvenceler (ör. standart sözleşme maddeleri) uygulanır.",
        ],
      },
      { id: "sure", title: "Ne kadar süre saklıyoruz", body: ["Hesap bilgilerini hesabını silene kadar saklarız.", "Rezervasyon kayıtlarını yasal saklama süreleri boyunca tutarız: [SAKLAMA SÜRESİ]."] },
      {
        id: "cerezler",
        title: "Çerezler",
        body: [
          "Yalnızca sitenin çalışması için gerekli çerezleri kullanıyoruz: oturum (giriş), dil, para birimi ve bu tarayıcıda yaptığın son rezervasyonlar.",
          "Reklam ya da izleme çerezi kullanmıyoruz. İleride kullanırsak önce iznini isteriz.",
        ],
      },
      {
        id: "haklar",
        title: "Hakların",
        body: [
          "KVKK ve GDPR kapsamında verilerine erişme, düzeltme, silme, işlemeye itiraz etme ve verilerini başka bir hizmete taşıma hakkın var.",
          "Başvurmak için [İLETİŞİM E-POSTASI] adresine yaz. Hesabını silmek istersen de aynı adresi kullanabilirsin.",
          "Ayrıca Kişisel Verileri Koruma Kurumu'na ya da yaşadığın ülkedeki veri koruma otoritesine (Hollanda'da Autoriteit Persoonsgegevens) şikâyette bulunabilirsin.",
        ],
      },
      { id: "degisiklik", title: "Değişiklikler", body: ["Bu politikayı güncellersek bu sayfada yayınlar, önemli değişiklikleri e-postayla bildiririz."] },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: 17 October 2026",
    intro: "At rotala we only use your personal data to find your flight, issue your ticket and manage your account. This page explains what we collect, why, and your rights.",
    sections: [
      { id: "biz", title: "Who we are", body: ["Data controller: [ŞİRKET ADI], [ADRES].", "For any privacy question: [İLETİŞİM E-POSTASI]."] },
      {
        id: "veriler",
        title: "What we collect",
        body: [
          "Account details: your email address and name. If you sign in with Google, Facebook or Apple, the name and email address that service shares with us.",
          "Booking details: travellers' names, date of birth, gender, nationality and passport number; email address and phone number for contact. Airlines require these to issue tickets.",
          "Payment details: we do not store card details on our servers. Payments are taken through the payment provider's secure components.",
          "Preferences: your chosen language and currency, stored in your browser as cookies and local storage.",
          "Technical data: IP address and browser information in server logs, to keep the site secure and working.",
        ],
      },
      {
        id: "amac",
        title: "How we use it",
        body: [
          "To search flights, issue your ticket and manage your booking.",
          "To send you your ticket and any flight changes.",
          "To create your account, let you sign in and show your tickets on My trips.",
          "To prevent fraud and meet our legal obligations.",
          "We only send updates such as price alerts if you ask for them, and you can unsubscribe at any time.",
        ],
      },
      {
        id: "paylasim",
        title: "Who we share it with",
        body: [
          "Airlines and our flight provider (Duffel): the traveller and contact details needed to issue tickets.",
          "Infrastructure providers: Supabase (accounts and database), Vercel (website hosting).",
          "Sign-in providers: Google, Facebook or Apple, if you choose to sign in with them.",
          "Payment provider: to take your payment.",
          "We do not sell your personal data or share it for advertising. Some providers may process data outside the European Economic Area; in that case legal safeguards (such as standard contractual clauses) apply.",
        ],
      },
      { id: "sure", title: "How long we keep it", body: ["We keep account details until you delete your account.", "We keep booking records for the legally required period: [SAKLAMA SÜRESİ]."] },
      {
        id: "cerezler",
        title: "Cookies",
        body: [
          "We only use cookies that are needed for the site to work: session (sign-in), language, currency and your recent bookings in this browser.",
          "We do not use advertising or tracking cookies. If we ever do, we will ask for your consent first.",
        ],
      },
      {
        id: "haklar",
        title: "Your rights",
        body: [
          "Under the GDPR (and Turkish KVKK) you have the right to access, correct and delete your data, to object to processing and to take your data to another service.",
          "To make a request, write to [İLETİŞİM E-POSTASI]. You can use the same address to delete your account.",
          "You can also complain to your local data protection authority (in the Netherlands: Autoriteit Persoonsgegevens).",
        ],
      },
      { id: "degisiklik", title: "Changes", body: ["If we update this policy we will publish it on this page and notify you of important changes by email."] },
    ],
  },
  nl: {
    title: "Privacybeleid",
    updated: "Laatst bijgewerkt: 17 oktober 2026",
    intro: "Bij rotala gebruiken we je persoonsgegevens alleen om je vlucht te vinden, je ticket uit te geven en je account te beheren. Hier lees je wat we verzamelen, waarom, en wat je rechten zijn.",
    sections: [
      { id: "biz", title: "Wie we zijn", body: ["Verwerkingsverantwoordelijke: [ŞİRKET ADI], [ADRES].", "Voor vragen over privacy: [İLETİŞİM E-POSTASI]."] },
      {
        id: "veriler",
        title: "Welke gegevens we verzamelen",
        body: [
          "Accountgegevens: je e-mailadres en naam. Log je in met Google, Facebook of Apple, dan de naam en het e-mailadres die die dienst met ons deelt.",
          "Boekingsgegevens: naam, geboortedatum, geslacht, nationaliteit en paspoortnummer van de reizigers; e-mailadres en telefoonnummer voor contact. Luchtvaartmaatschappijen hebben deze nodig om tickets uit te geven.",
          "Betaalgegevens: we bewaren geen kaartgegevens op onze servers. Betalingen lopen via de beveiligde onderdelen van de betaalprovider.",
          "Voorkeuren: je gekozen taal en valuta, opgeslagen in je browser als cookies en lokale opslag.",
          "Technische gegevens: IP-adres en browserinformatie in serverlogs, om de site veilig en werkend te houden.",
        ],
      },
      {
        id: "amac",
        title: "Waarvoor we ze gebruiken",
        body: [
          "Om vluchten te zoeken, je ticket uit te geven en je boeking te beheren.",
          "Om je ticket en eventuele vluchtwijzigingen naar je te sturen.",
          "Om je account aan te maken, je te laten inloggen en je tickets te tonen bij Mijn reizen.",
          "Om fraude te voorkomen en aan onze wettelijke verplichtingen te voldoen.",
          "Berichten zoals prijsalarmen sturen we alleen als je erom vraagt; afmelden kan altijd.",
        ],
      },
      {
        id: "paylasim",
        title: "Met wie we ze delen",
        body: [
          "Luchtvaartmaatschappijen en onze vluchtprovider (Duffel): de reizigers- en contactgegevens die nodig zijn om tickets uit te geven.",
          "Infrastructuurproviders: Supabase (accounts en database), Vercel (hosting van de website).",
          "Inlogproviders: Google, Facebook of Apple, als je ervoor kiest daarmee in te loggen.",
          "Betaalprovider: om je betaling te verwerken.",
          "We verkopen je persoonsgegevens niet en delen ze niet voor advertenties. Sommige providers verwerken gegevens mogelijk buiten de Europese Economische Ruimte; dan gelden wettelijke waarborgen (zoals modelcontractbepalingen).",
        ],
      },
      { id: "sure", title: "Hoe lang we ze bewaren", body: ["Accountgegevens bewaren we tot je je account verwijdert.", "Boekingsgegevens bewaren we zolang de wet dat vereist: [SAKLAMA SÜRESİ]."] },
      {
        id: "cerezler",
        title: "Cookies",
        body: [
          "We gebruiken alleen cookies die nodig zijn om de site te laten werken: sessie (inloggen), taal, valuta en je recente boekingen in deze browser.",
          "We gebruiken geen advertentie- of trackingcookies. Als we dat ooit doen, vragen we eerst je toestemming.",
        ],
      },
      {
        id: "haklar",
        title: "Je rechten",
        body: [
          "Onder de AVG heb je het recht je gegevens in te zien, te corrigeren en te laten verwijderen, bezwaar te maken tegen verwerking en je gegevens over te dragen aan een andere dienst.",
          "Stuur je verzoek naar [İLETİŞİM E-POSTASI]. Via hetzelfde adres kun je ook je account laten verwijderen.",
          "Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens.",
        ],
      },
      { id: "degisiklik", title: "Wijzigingen", body: ["Als we dit beleid aanpassen, publiceren we dat op deze pagina en melden we belangrijke wijzigingen per e-mail."] },
    ],
  },
};
