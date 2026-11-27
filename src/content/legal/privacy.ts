// Gizlilik politikası. Köşeli parantezli yer tutucular şirket bilgileriyle doldurulmalı ve
// metin yayın öncesi bir hukukçuya (KVKK / GDPR) kontrol ettirilmelidir.
import type { LegalDoc } from "./types";

export const privacy: Record<"tr" | "en" | "nl" | "de" | "fr" | "es" | "it", LegalDoc> = {
  tr: {
    title: "Gizlilik Politikası",
    updated: "Son güncelleme: 27 Kasım 2026",
    intro: "{brand} olarak kişisel verilerini yalnızca uçuşunu bulmak, biletini kesmek ve hesabını yönetmek için kullanıyoruz. Bu sayfa hangi bilgileri neden topladığımızı ve haklarını anlatır.",
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
      {
        id: "ortaklik",
        title: "Ortaklık bağlantıları ve canlı arama",
        body: [
          "{brand} uçuş biletlerini doğrudan satmaz; “Fırsata git” bağlantıları seni Travelpayouts / Aviasales (kendi alt alan adımızdaki White Label arama sayfası dahil) ya da diğer iş ortaklarımıza yönlendirir. Bu bağlantılar üzerinden yapılan rezervasyonlardan komisyon alabiliriz; bu durum ödediğin fiyatı değiştirmez.",
          "Tıklama istatistiklerini tutarken kişisel veri (IP adresi, ad, e-posta) kaydetmiyoruz; yalnızca rota, uçuş tarihi, pazar ve sayfa kaynağı saklanır.",
        ],
      },
      { id: "sure", title: "Ne kadar süre saklıyoruz", body: ["Hesap bilgilerini hesabını silene kadar saklarız.", "Rezervasyon kayıtlarını yasal saklama süreleri boyunca tutarız: [SAKLAMA SÜRESİ]."] },
      {
        id: "cerezler",
        title: "Çerezler",
        body: [
          "Sitenin çalışması için gerekli kendi çerezlerimizi kullanıyoruz: oturum (giriş), ülke, dil, para birimi ve bu tarayıcıda yaptığın son rezervasyonlar.",
          "Ortaklık ve White Label çerezleri: sonuç sayfasında açılan canlı uçuş arama bileşeni (Travelpayouts White Label widget — tpwgt.com), White Label arama sayfası ve yönlendirildiğin Aviasales / Travelpayouts sayfaları; arama geçmişini, seçtiğin filtreleri ve ortaklık yönlendirmesini hatırlamak için kendi çerezlerini yerleştirebilir.",
          "Bu üçüncü taraf çerezler ilgili sağlayıcının kendi gizlilik ve çerez politikasına tabidir ([ORTAKLIK ÇEREZ DETAYLARI]). Tarayıcı ayarlarından çerezleri istediğin zaman silebilir ya da engelleyebilirsin.",
          "Kendi adımıza reklam çerezi kullanmıyoruz. İleride eklersek önce açık iznini isteriz.",
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
    updated: "Last updated: 27 November 2026",
    intro: "At {brand} we only use your personal data to find your flight, issue your ticket and manage your account. This page explains what we collect, why, and your rights.",
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
      {
        id: "ortaklik",
        title: "Affiliate links and live search",
        body: [
          "{brand} does not sell tickets directly; “Go to deal” links redirect you to Travelpayouts / Aviasales (including our White Label search subdomain) or other travel partners. We may earn a commission on bookings made through these links; this does not change the price you pay.",
          "When counting outbound clicks we do not store personal data (no IP address, name or email); only route, travel date, market and page source are recorded.",
        ],
      },
      { id: "sure", title: "How long we keep it", body: ["We keep account details until you delete your account.", "We keep booking records for the legally required period: [SAKLAMA SÜRESİ]."] },
      {
        id: "cerezler",
        title: "Cookies",
        body: [
          "We use our own strictly necessary cookies so the site works: session (sign-in), country, language, currency and your recent bookings in this browser.",
          "Affiliate and White Label cookies: the embedded live flight search widget on results pages (Travelpayouts White Label widget — tpwgt.com), our White Label search page, and external Aviasales / Travelpayouts pages may set their own cookies to remember your search history, selected filters and affiliate referral.",
          "Those third-party cookies are governed by the respective provider's privacy and cookie policy ([ORTAKLIK ÇEREZ DETAYLARI]). You can delete or block cookies at any time in your browser settings.",
          "We do not run our own advertising cookies. If we ever add them, we will ask for your consent first.",
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
    updated: "Laatst bijgewerkt: 27 november 2026",
    intro: "Bij {brand} gebruiken we je persoonsgegevens alleen om je vlucht te vinden, je ticket uit te geven en je account te beheren. Hier lees je wat we verzamelen, waarom, en wat je rechten zijn.",
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
      {
        id: "ortaklik",
        title: "Affiliatelinks en live zoeken",
        body: [
          "{brand} verkoopt zelf geen tickets; knoppen zoals “Naar deal” sturen je door naar Travelpayouts / Aviasales (inclusief onze White Label-zoekpagina) of andere reispartners. Bij een boeking via deze links kunnen wij een commissie ontvangen; dit verandert de prijs voor jou niet.",
          "Bij het tellen van uitgaande kliks slaan we geen persoonsgegevens op (geen IP-adres, naam of e-mail); alleen route, reisdatum, markt en herkomst op de site.",
        ],
      },
      { id: "sure", title: "Hoe lang we ze bewaren", body: ["Accountgegevens bewaren we tot je je account verwijdert.", "Boekingsgegevens bewaren we zolang de wet dat vereist: [SAKLAMA SÜRESİ]."] },
      {
        id: "cerezler",
        title: "Cookies",
        body: [
          "We gebruiken eigen noodzakelijke cookies om de site te laten werken: sessie (inloggen), land, taal, valuta en je recente boekingen in deze browser.",
          "Affiliate- en White Label-cookies: de live zoekwidget op de resultatenpagina (Travelpayouts White Label widget — tpwgt.com), onze White Label-zoekpagina en pagina's van Aviasales / Travelpayouts kunnen eigen cookies plaatsen om je zoekgeschiedenis, filters en affiliateverwijzing te onthouden.",
          "Op die cookies van derden is het privacy- en cookiebeleid van de betreffende aanbieder van toepassing ([ORTAKLIK ÇEREZ DETAYLARI]). Je kunt cookies altijd verwijderen of blokkeren via je browserinstellingen.",
          "We plaatsen zelf geen advertentiecookies. Als we dat ooit doen, vragen we eerst je toestemming.",
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
  de: {
    title: "Datenschutzerklärung",
    updated: "Zuletzt aktualisiert: 27. November 2026",
    intro: "Bei {brand} nutzen wir deine personenbezogenen Daten nur, um deinen Flug zu finden, dein Ticket auszustellen und dein Konto zu verwalten. Hier erfährst du, was wir erheben, warum, und welche Rechte du hast.",
    sections: [
      { id: "biz", title: "Wer wir sind", body: ["Verantwortlicher: [ŞİRKET ADI], [ADRES].", "Bei Fragen zum Datenschutz: [İLETİŞİM E-POSTASI]."] },
      {
        id: "veriler",
        title: "Welche Daten wir erheben",
        body: [
          "Kontodaten: deine E-Mail-Adresse und dein Name. Wenn du dich mit Google, Facebook oder Apple anmeldest, der Name und die E-Mail-Adresse, die dieser Dienst mit uns teilt.",
          "Buchungsdaten: Name, Geburtsdatum, Geschlecht, Staatsangehörigkeit und Reisepassnummer der Reisenden; E-Mail-Adresse und Telefonnummer für den Kontakt. Airlines brauchen diese Angaben, um Tickets auszustellen.",
          "Zahlungsdaten: Wir speichern keine Kartendaten auf unseren Servern. Zahlungen laufen über die sicheren Komponenten des Zahlungsanbieters.",
          "Einstellungen: deine gewählte Sprache und Währung, in deinem Browser als Cookies und im lokalen Speicher abgelegt.",
          "Technische Daten: IP-Adresse und Browserinformationen in Serverprotokollen, damit die Website sicher bleibt und funktioniert.",
        ],
      },
      {
        id: "amac",
        title: "Wofür wir sie nutzen",
        body: [
          "Um Flüge zu suchen, dein Ticket auszustellen und deine Buchung zu verwalten.",
          "Um dir dein Ticket und eventuelle Flugänderungen zu schicken.",
          "Um dein Konto anzulegen, dich anmelden zu lassen und deine Tickets unter Meine Reisen anzuzeigen.",
          "Um Betrug zu verhindern und unsere gesetzlichen Pflichten zu erfüllen.",
          "Nachrichten wie Preisalarme schicken wir nur, wenn du sie anforderst, und du kannst sie jederzeit abbestellen.",
        ],
      },
      {
        id: "paylasim",
        title: "Mit wem wir sie teilen",
        body: [
          "Airlines und unser Flugdatenanbieter (Duffel): die Reise- und Kontaktdaten, die zum Ausstellen der Tickets nötig sind.",
          "Infrastrukturanbieter: Supabase (Konten und Datenbank), Vercel (Hosting der Website).",
          "Anmeldeanbieter: Google, Facebook oder Apple, wenn du dich damit anmeldest.",
          "Zahlungsanbieter: um deine Zahlung abzuwickeln.",
          "Wir verkaufen deine personenbezogenen Daten nicht und geben sie nicht für Werbung weiter. Manche Anbieter verarbeiten Daten möglicherweise außerhalb des Europäischen Wirtschaftsraums; dann gelten gesetzliche Garantien (zum Beispiel Standardvertragsklauseln).",
        ],
      },
      {
        id: "ortaklik",
        title: "Partnerlinks und Live-Suche",
        body: [
          "{brand} verkauft selbst keine Tickets; Links wie „Zum Angebot“ leiten dich zu Travelpayouts / Aviasales (einschließlich unserer White-Label-Suchseite) oder anderen Reisepartnern weiter. Für Buchungen über diese Links erhalten wir möglicherweise eine Provision; dein Preis ändert sich dadurch nicht.",
          "Beim Zählen ausgehender Klicks speichern wir keine personenbezogenen Daten (keine IP-Adresse, kein Name, keine E-Mail), sondern nur Strecke, Datum, Markt und Seitenquelle.",
        ],
      },
      { id: "sure", title: "Wie lange wir sie speichern", body: ["Kontodaten speichern wir, bis du dein Konto löschst.", "Buchungsdaten speichern wir so lange, wie es gesetzlich vorgeschrieben ist: [SAKLAMA SÜRESİ]."] },
      {
        id: "cerezler",
        title: "Cookies",
        body: [
          "Wir verwenden eigene technisch notwendige Cookies für den Betrieb der Website: Sitzung (Anmeldung), Land, Sprache, Währung und deine letzten Buchungen in diesem Browser.",
          "Partner- und White-Label-Cookies: Das eingebettete Live-Suchwidget auf der Ergebnisseite (Travelpayouts White Label Widget — tpwgt.com), unsere White-Label-Suchseite sowie Seiten von Aviasales / Travelpayouts können eigene Cookies setzen, um deinen Suchverlauf, gewählte Filter und die Partnerzuordnung zu speichern.",
          "Für diese Drittanbieter-Cookies gelten die Datenschutz- und Cookie-Richtlinien des jeweiligen Anbieters ([ORTAKLIK ÇEREZ DETAYLARI]). Du kannst Cookies jederzeit in deinen Browsereinstellungen löschen oder blockieren.",
          "Wir setzen selbst keine Werbe-Cookies ein. Sollten wir das künftig tun, holen wir vorher deine Einwilligung ein.",
        ],
      },
      {
        id: "haklar",
        title: "Deine Rechte",
        body: [
          "Nach der DSGVO (und dem türkischen KVKK) hast du das Recht auf Auskunft, Berichtigung und Löschung deiner Daten, auf Widerspruch gegen die Verarbeitung und auf Übertragung deiner Daten an einen anderen Dienst.",
          "Schick deine Anfrage an [İLETİŞİM E-POSTASI]. Über dieselbe Adresse kannst du auch dein Konto löschen lassen.",
          "Du kannst dich außerdem bei deiner zuständigen Datenschutzaufsichtsbehörde beschweren (in den Niederlanden: Autoriteit Persoonsgegevens).",
        ],
      },
      { id: "degisiklik", title: "Änderungen", body: ["Wenn wir diese Erklärung aktualisieren, veröffentlichen wir sie auf dieser Seite und informieren dich per E-Mail über wichtige Änderungen."] },
    ],
  },
  fr: {
    "title": "Politique de confidentialité",
    "updated": "Dernière mise à jour : 27 novembre 2026",
    "intro": "Chez {brand}, on utilise tes données personnelles uniquement pour trouver ton vol, émettre ton billet et gérer ton compte. Cette page explique ce qu'on collecte, pourquoi, et quels sont tes droits.",
    "sections": [
      {
        "id": "biz",
        "title": "Qui sommes-nous",
        "body": [
          "Responsable du traitement : [ŞİRKET ADI], [ADRES].",
          "Pour toute question sur la confidentialité : [İLETİŞİM E-POSTASI]."
        ]
      },
      {
        "id": "veriler",
        "title": "Ce qu'on collecte",
        "body": [
          "Données de compte : ton adresse e-mail et ton nom. Si tu te connectes avec Google, Facebook ou Apple, le nom et l'adresse e-mail que ce service nous transmet.",
          "Données de réservation : nom, date de naissance, sexe, nationalité et numéro de passeport des voyageurs ; adresse e-mail et numéro de téléphone pour le contact. Les compagnies aériennes en ont besoin pour émettre les billets.",
          "Données de paiement : on ne conserve pas les données de carte sur nos serveurs. Les paiements passent par les composants sécurisés du prestataire de paiement.",
          "Préférences : la langue et la devise que tu as choisies, enregistrées dans ton navigateur sous forme de cookies et de stockage local.",
          "Données techniques : adresse IP et informations sur le navigateur dans les journaux du serveur, pour assurer la sécurité et le bon fonctionnement du site."
        ]
      },
      {
        "id": "amac",
        "title": "Comment on les utilise",
        "body": [
          "Pour rechercher des vols, émettre ton billet et gérer ta réservation.",
          "Pour t'envoyer ton billet et t'informer de tout changement de vol.",
          "Pour créer ton compte, te permettre de te connecter et afficher tes billets dans Mes voyages.",
          "Pour prévenir la fraude et respecter nos obligations légales.",
          "On t'envoie des nouvelles comme les alertes prix uniquement si tu les demandes, et tu peux te désinscrire à tout moment."
        ]
      },
      {
        "id": "paylasim",
        "title": "Avec qui on les partage",
        "body": [
          "Les compagnies aériennes et notre fournisseur de vols (Duffel) : les données des voyageurs et de contact nécessaires à l'émission des billets.",
          "Les prestataires d'infrastructure : Supabase (comptes et base de données), Vercel (hébergement du site).",
          "Les services de connexion : Google, Facebook ou Apple, si tu choisis de te connecter avec eux.",
          "Le prestataire de paiement : pour encaisser ton paiement.",
          "On ne vend pas tes données personnelles et on ne les partage pas à des fins publicitaires. Certains prestataires peuvent traiter des données en dehors de l'Espace économique européen ; dans ce cas, des garanties juridiques (comme les clauses contractuelles types) s'appliquent."
        ]
      },
      {
        "id": "ortaklik",
        "title": "Liens affiliés et recherche en direct",
        "body": [
          "{brand} ne vend pas directement de billets : les liens « Voir l'offre » te redirigent vers Travelpayouts / Aviasales (y compris notre page de recherche White Label) ou d'autres partenaires. Nous pouvons percevoir une commission sur les réservations effectuées via ces liens, sans changer le prix que tu paies.",
          "Lorsque nous comptons les clics sortants, nous n'enregistrons aucune donnée personnelle (ni IP, ni nom, ni e-mail) : seuls l'itinéraire, la date, le marché et la page source sont conservés."
        ]
      },
      {
        "id": "sure",
        "title": "Combien de temps on les garde",
        "body": [
          "On conserve les données de compte jusqu'à ce que tu supprimes ton compte.",
          "On conserve les dossiers de réservation pendant la durée exigée par la loi : [SAKLAMA SÜRESİ]."
        ]
      },
      {
        "id": "cerezler",
        "title": "Cookies",
        "body": [
          "On utilise nos propres cookies strictement nécessaires au fonctionnement du site : session (connexion), pays, langue, devise et tes réservations récentes dans ce navigateur.",
          "Cookies d'affiliation et White Label : le widget de recherche en direct intégré sur la page de résultats (Travelpayouts White Label widget — tpwgt.com), notre page de recherche White Label et les pages d'Aviasales / Travelpayouts peuvent déposer leurs propres cookies pour mémoriser ton historique de recherche, tes filtres et le suivi d'affiliation.",
          "Ces cookies tiers relèvent de la politique de confidentialité et de cookies du prestataire concerné ([ORTAKLIK ÇEREZ DETAYLARI]). Tu peux supprimer ou bloquer les cookies à tout moment depuis les réglages de ton navigateur.",
          "On n'utilise pas de cookies publicitaires propres. Si un jour c'est le cas, on te demandera d'abord ton consentement."
        ]
      },
      {
        "id": "haklar",
        "title": "Tes droits",
        "body": [
          "En vertu du RGPD (et de la loi turque KVKK), tu as le droit d'accéder à tes données, de les rectifier et de les supprimer, de t'opposer à leur traitement et de les transférer vers un autre service.",
          "Pour faire une demande, écris à [İLETİŞİM E-POSTASI]. Tu peux utiliser la même adresse pour supprimer ton compte.",
          "Tu peux aussi déposer une réclamation auprès de l'autorité de protection des données de ton pays (aux Pays-Bas : Autoriteit Persoonsgegevens)."
        ]
      },
      {
        "id": "degisiklik",
        "title": "Modifications",
        "body": [
          "Si on met à jour cette politique, on la publiera sur cette page et on t'informera des changements importants par e-mail."
        ]
      }
    ]
  },
  es: {
    "title": "Política de privacidad",
    "updated": "Última actualización: 27 de noviembre de 2026",
    "intro": "En {brand} solo usamos tus datos personales para encontrar tu vuelo, emitir tu billete y gestionar tu cuenta. Esta página explica qué recogemos, para qué y cuáles son tus derechos.",
    "sections": [
      {
        "id": "biz",
        "title": "Quiénes somos",
        "body": [
          "Responsable del tratamiento: [ŞİRKET ADI], [ADRES].",
          "Para cualquier duda sobre privacidad: [İLETİŞİM E-POSTASI]."
        ]
      },
      {
        "id": "veriler",
        "title": "Qué datos recogemos",
        "body": [
          "Datos de la cuenta: tu correo electrónico y tu nombre. Si inicias sesión con Google, Facebook o Apple, el nombre y el correo electrónico que ese servicio comparte con nosotros.",
          "Datos de la reserva: nombre y apellidos, fecha de nacimiento, sexo, nacionalidad y número de pasaporte de los viajeros; correo electrónico y número de teléfono de contacto. Las aerolíneas los exigen para emitir los billetes.",
          "Datos de pago: no guardamos los datos de tu tarjeta en nuestros servidores. Los pagos se hacen a través de los componentes seguros del proveedor de pagos.",
          "Preferencias: el idioma y la moneda que eliges, guardados en tu navegador como cookies y almacenamiento local.",
          "Datos técnicos: la dirección IP y la información del navegador en los registros del servidor, para mantener el sitio seguro y en funcionamiento."
        ]
      },
      {
        "id": "amac",
        "title": "Para qué los usamos",
        "body": [
          "Para buscar vuelos, emitir tu billete y gestionar tu reserva.",
          "Para enviarte tu billete y cualquier cambio en tu vuelo.",
          "Para crear tu cuenta, permitirte iniciar sesión y mostrar tus billetes en Mis viajes.",
          "Para prevenir el fraude y cumplir nuestras obligaciones legales.",
          "Solo te enviamos avisos como las alertas de precio si los pides, y puedes darte de baja cuando quieras."
        ]
      },
      {
        "id": "paylasim",
        "title": "Con quién los compartimos",
        "body": [
          "Las aerolíneas y nuestro proveedor de vuelos (Duffel): los datos de los viajeros y de contacto necesarios para emitir los billetes.",
          "Proveedores de infraestructura: Supabase (cuentas y base de datos), Vercel (alojamiento del sitio web).",
          "Proveedores de inicio de sesión: Google, Facebook o Apple, si eliges iniciar sesión con ellos.",
          "Proveedor de pagos: para cobrar tu pago.",
          "No vendemos tus datos personales ni los compartimos con fines publicitarios. Algunos proveedores pueden tratar datos fuera del Espacio Económico Europeo; en ese caso se aplican garantías legales (como las cláusulas contractuales tipo)."
        ]
      },
      {
        "id": "ortaklik",
        "title": "Enlaces de afiliación y búsqueda en vivo",
        "body": [
          "{brand} no vende billetes directamente: los enlaces «Ir a la oferta» te redirigen a Travelpayouts / Aviasales (incluida nuestra página de búsqueda White Label) u otros socios de viaje. Podemos recibir una comisión por las reservas realizadas a través de estos enlaces, sin modificar el precio que pagas.",
          "Al contar los clics salientes no guardamos datos personales (sin IP, nombre ni correo); solo registramos ruta, fecha, mercado y sección de origen."
        ]
      },
      {
        "id": "sure",
        "title": "Cuánto tiempo los guardamos",
        "body": [
          "Guardamos los datos de la cuenta hasta que la eliminas.",
          "Guardamos los registros de reservas durante el plazo exigido por la ley: [SAKLAMA SÜRESİ]."
        ]
      },
      {
        "id": "cerezler",
        "title": "Cookies",
        "body": [
          "Usamos cookies propias estrictamente necesarias para que el sitio funcione: sesión (inicio de sesión), país, idioma, moneda y tus reservas recientes en este navegador.",
          "Cookies de afiliación y White Label: el widget de búsqueda en vivo integrado en la página de resultados (Travelpayouts White Label widget — tpwgt.com), nuestra página White Label y las páginas de Aviasales / Travelpayouts pueden colocar sus propias cookies para recordar tu historial de búsqueda, filtros y referencia de afiliación.",
          "Estas cookies de terceros se rigen por la política de privacidad y cookies del proveedor correspondiente ([ORTAKLIK ÇEREZ DETAYLARI]). Puedes eliminar o bloquear las cookies en cualquier momento desde los ajustes de tu navegador.",
          "No usamos cookies publicitarias propias. Si algún día las añadimos, primero te pediremos tu consentimiento."
        ]
      },
      {
        "id": "haklar",
        "title": "Tus derechos",
        "body": [
          "Según el RGPD (y la KVKK turca) tienes derecho a acceder a tus datos, corregirlos y eliminarlos, a oponerte a su tratamiento y a llevarlos a otro servicio.",
          "Para hacer una solicitud, escribe a [İLETİŞİM E-POSTASI]. Puedes usar la misma dirección para eliminar tu cuenta.",
          "También puedes presentar una reclamación ante la autoridad de protección de datos de tu país (en los Países Bajos: Autoriteit Persoonsgegevens)."
        ]
      },
      {
        "id": "degisiklik",
        "title": "Cambios",
        "body": [
          "Si actualizamos esta política, la publicaremos en esta página y te avisaremos por correo de los cambios importantes."
        ]
      }
    ]
  },
  it: {
    "title": "Informativa sulla privacy",
    "updated": "Ultimo aggiornamento: 27 novembre 2026",
    "intro": "Su {brand} usiamo i tuoi dati personali solo per trovare il tuo volo, emettere il tuo biglietto e gestire il tuo account. Questa pagina spiega cosa raccogliamo, perché e quali sono i tuoi diritti.",
    "sections": [
      {
        "id": "biz",
        "title": "Chi siamo",
        "body": [
          "Titolare del trattamento: [ŞİRKET ADI], [ADRES].",
          "Per qualsiasi domanda sulla privacy: [İLETİŞİM E-POSTASI]."
        ]
      },
      {
        "id": "veriler",
        "title": "Quali dati raccogliamo",
        "body": [
          "Dati dell'account: il tuo indirizzo email e il tuo nome. Se accedi con Google, Facebook o Apple, il nome e l'indirizzo email che quel servizio condivide con noi.",
          "Dati della prenotazione: nome dei viaggiatori, data di nascita, sesso, nazionalità e numero di passaporto; indirizzo email e numero di telefono per i contatti. Le compagnie aeree li richiedono per emettere i biglietti.",
          "Dati di pagamento: non conserviamo i dati delle carte sui nostri server. I pagamenti avvengono tramite i componenti sicuri del fornitore dei pagamenti.",
          "Preferenze: la lingua e la valuta che hai scelto, salvate nel tuo browser come cookie e nella memoria locale.",
          "Dati tecnici: indirizzo IP e informazioni sul browser nei log del server, per mantenere il sito sicuro e funzionante."
        ]
      },
      {
        "id": "amac",
        "title": "Come li usiamo",
        "body": [
          "Per cercare voli, emettere il tuo biglietto e gestire la tua prenotazione.",
          "Per inviarti il biglietto ed eventuali modifiche al volo.",
          "Per creare il tuo account, farti accedere e mostrare i tuoi biglietti in I miei viaggi.",
          "Per prevenire le frodi e rispettare i nostri obblighi di legge.",
          "Ti inviamo aggiornamenti come gli avvisi di prezzo solo se li richiedi, e puoi disiscriverti in qualsiasi momento."
        ]
      },
      {
        "id": "paylasim",
        "title": "Con chi li condividiamo",
        "body": [
          "Compagnie aeree e il nostro fornitore di voli (Duffel): i dati dei viaggiatori e di contatto necessari per emettere i biglietti.",
          "Fornitori di infrastruttura: Supabase (account e database), Vercel (hosting del sito).",
          "Fornitori di accesso: Google, Facebook o Apple, se scegli di accedere con loro.",
          "Fornitore dei pagamenti: per ricevere il tuo pagamento.",
          "Non vendiamo i tuoi dati personali e non li condividiamo per fini pubblicitari. Alcuni fornitori potrebbero trattare i dati al di fuori dello Spazio economico europeo; in tal caso si applicano garanzie previste dalla legge (come le clausole contrattuali standard)."
        ]
      },
      {
        "id": "ortaklik",
        "title": "Link di affiliazione e ricerca in tempo reale",
        "body": [
          "{brand} non vende biglietti direttamente: i link «Vai all'offerta» ti reindirizzano a Travelpayouts / Aviasales (inclusa la nostra pagina di ricerca White Label) o ad altri partner di viaggio. Possiamo ricevere una commissione sulle prenotazioni effettuate tramite questi link, senza modificare il prezzo che paghi.",
          "Nel conteggio dei clic in uscita non salviamo dati personali (nessun IP, nome o email): registriamo solo tratta, data, mercato e origine della pagina."
        ]
      },
      {
        "id": "sure",
        "title": "Per quanto tempo li conserviamo",
        "body": [
          "Conserviamo i dati dell'account finché non elimini il tuo account.",
          "Conserviamo i dati delle prenotazioni per il periodo previsto dalla legge: [SAKLAMA SÜRESİ]."
        ]
      },
      {
        "id": "cerezler",
        "title": "Cookie",
        "body": [
          "Usiamo i nostri cookie strettamente necessari al funzionamento del sito: sessione (accesso), paese, lingua, valuta e le tue prenotazioni recenti in questo browser.",
          "Cookie di affiliazione e White Label: il widget di ricerca in tempo reale integrato nella pagina dei risultati (Travelpayouts White Label widget — tpwgt.com), la nostra pagina di ricerca White Label e le pagine di Aviasales / Travelpayouts possono impostare propri cookie per ricordare la cronologia di ricerca, i filtri selezionati e il riferimento di affiliazione.",
          "Tali cookie di terze parti sono regolati dall'informativa su privacy e cookie del rispettivo fornitore ([ORTAKLIK ÇEREZ DETAYLARI]). Puoi eliminare o bloccare i cookie in qualsiasi momento dalle impostazioni del browser.",
          "Non utilizziamo nostri cookie pubblicitari. Se mai li introdurremo, ti chiederemo prima il consenso."
        ]
      },
      {
        "id": "haklar",
        "title": "I tuoi diritti",
        "body": [
          "In base al GDPR (e alla legge turca KVKK) hai il diritto di accedere ai tuoi dati, correggerli e cancellarli, di opporti al trattamento e di trasferire i tuoi dati a un altro servizio.",
          "Per fare una richiesta, scrivi a [İLETİŞİM E-POSTASI]. Puoi usare lo stesso indirizzo per eliminare il tuo account.",
          "Puoi anche presentare un reclamo all'autorità per la protezione dei dati del tuo paese (nei Paesi Bassi: Autoriteit Persoonsgegevens)."
        ]
      },
      {
        "id": "degisiklik",
        "title": "Modifiche",
        "body": [
          "Se aggiorniamo questa informativa, la pubblichiamo su questa pagina e ti avvisiamo via email delle modifiche importanti."
        ]
      }
    ]
  },
};
