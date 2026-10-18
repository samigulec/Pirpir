// Gizlilik politikası. Köşeli parantezli yer tutucular şirket bilgileriyle doldurulmalı ve
// metin yayın öncesi bir hukukçuya (KVKK / GDPR) kontrol ettirilmelidir.
import type { LegalDoc } from "./types";

export const privacy: Record<"tr" | "en" | "nl" | "de" | "fr" | "es" | "it", LegalDoc> = {
  tr: {
    title: "Gizlilik Politikası",
    updated: "Son güncelleme: 17 Ekim 2026",
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
  de: {
    title: "Datenschutzerklärung",
    updated: "Zuletzt aktualisiert: 17. Oktober 2026",
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
      { id: "sure", title: "Wie lange wir sie speichern", body: ["Kontodaten speichern wir, bis du dein Konto löschst.", "Buchungsdaten speichern wir so lange, wie es gesetzlich vorgeschrieben ist: [SAKLAMA SÜRESİ]."] },
      {
        id: "cerezler",
        title: "Cookies",
        body: [
          "Wir verwenden nur Cookies, die für den Betrieb der Website nötig sind: Sitzung (Anmeldung), Sprache, Währung und deine letzten Buchungen in diesem Browser.",
          "Wir verwenden keine Werbe- oder Tracking-Cookies. Sollten wir das jemals tun, fragen wir dich vorher um deine Einwilligung.",
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
    "updated": "Dernière mise à jour : 17 octobre 2026",
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
          "On utilise uniquement les cookies nécessaires au fonctionnement du site : session (connexion), langue, devise et tes réservations récentes dans ce navigateur.",
          "On n'utilise pas de cookies publicitaires ni de suivi. Si un jour c'est le cas, on te demandera d'abord ton consentement."
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
    "updated": "Última actualización: 17 de octubre de 2026",
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
          "Solo usamos las cookies necesarias para que el sitio funcione: sesión (inicio de sesión), idioma, moneda y tus reservas recientes en este navegador.",
          "No usamos cookies publicitarias ni de seguimiento. Si algún día lo hacemos, primero te pediremos tu consentimiento."
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
    "updated": "Ultimo aggiornamento: 17 ottobre 2026",
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
          "Usiamo solo i cookie necessari al funzionamento del sito: sessione (accesso), lingua, valuta e le tue prenotazioni recenti in questo browser.",
          "Non usiamo cookie pubblicitari o di tracciamento. Se mai lo faremo, ti chiederemo prima il consenso."
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
