// Popüler varış şehirleri için havalimanı rehberi, karakter ipuçları ve illüstrasyon eşlemesi.
// Pazarlardaki (src/config/markets.ts) tüm rota sayfaları şehir bilgilerini buradan alır.
import type { CharacterKey, L } from "./mock/routes";

export type HeroArtKey =
  | "istanbul"
  | "antalya"
  | "izmir"
  | "ankara"
  | "bodrum"
  | "gaziantep"
  | "trabzon"
  | "kayseri"
  | "londra"
  | "barselona"
  | "roma"
  | "lizbon"
  | "paris"
  | "amsterdam"
  | "dubai"
  | "new-york"
  | "sky";

export type AirportCard = {
  code: string;
  name: L;
  side: L;
  tone: "ink" | "coral";
  facts: L[];
};

export type TipCard = {
  character: CharacterKey;
  role: L;
  quote: L;
};

export type CityGuide = {
  illustration: HeroArtKey;
  heroBg: string;
  airportsShort: string;
  airports: AirportCard[];
  tips: TipCard[];
  /** Aynı ülkedeki (veya yakın bölgedeki) diğer önerilen şehir kodları */
  others: string[];
};

const PASSPORT_TIP: TipCard = {
  character: "pasi",
  role: {
    tr: "Pasi · belge dostu",
    en: "Pasi · document buddy",
    nl: "Pasi · documentenmaatje",
    de: "Pasi · Dokumentenfreund",
    fr: "Pasi · ami des documents",
    es: "Pasi · amigo de los documentos",
    it: "Pasi · amico dei documenti",
  },
  quote: {
    tr: "“Yola çıkmadan pasaportunun geçerlilik tarihini kontrol et.”",
    en: "“Check your passport's expiry date before you go.”",
    nl: "“Controleer de geldigheid van je paspoort voor vertrek.”",
    de: "“Prüf vor der Abreise, wie lange dein Reisepass noch gültig ist.”",
    fr: "“Vérifie la date d'expiration de ton passeport avant de partir.”",
    es: "“Revisa la fecha de caducidad de tu pasaporte antes de salir.”",
    it: "“Prima di partire controlla la scadenza del tuo passaporto.”",
  },
};

const BAG_TIP: TipCard = {
  character: "valiz",
  role: {
    tr: "Valiz · bagaj notu",
    en: "Valiz · baggage note",
    nl: "Valiz · bagagetip",
    de: "Valiz · Gepäcktipp",
    fr: "Valiz · conseil bagages",
    es: "Valiz · consejo de equipaje",
    it: "Valiz · consiglio bagagli",
  },
  quote: {
    tr: "“Ekonomik biletlerde kabin bagajı boyutu değişebilir; ödeme adımında kontrol et.”",
    en: "“Cabin bag sizes vary on budget fares — double-check at checkout.”",
    nl: "“Handbagageregels verschillen per tarief — kijk het even na bij het boeken.”",
    de: "“Handgepäckmaße variieren bei günstigen Tarifen — kurz vor der Buchung prüfen.”",
    fr: "“Les dimensions du bagage cabine varient selon le tarif : vérifie avant de payer.”",
    es: "“Las medidas del equipaje de mano cambian según la tarifa; revísalo al reservar.”",
    it: "“Le dimensioni del bagaglio a mano variano per tariffa: controllale prima di pagare.”",
  },
};

export const CITY_GUIDES: Record<string, CityGuide> = {
  IST: {
    illustration: "istanbul",
    heroBg: "#FFD9C7",
    airportsShort: "IST · SAW",
    airports: [
      {
        code: "IST",
        name: { tr: "İstanbul Havalimanı", en: "Istanbul Airport", nl: "Luchthaven Istanbul", de: "Flughafen Istanbul", fr: "Aéroport d'Istanbul", es: "Aeropuerto de Estambul", it: "Aeroporto di Istanbul" },
        side: { tr: "Avrupa yakası", en: "European side", nl: "Europese kant", de: "Europäische Seite", fr: "Rive européenne", es: "Lado europeo", it: "Lato europeo" },
        tone: "ink",
        facts: [
          { tr: "Taksim'e yaklaşık 40 km", en: "About 40 km to Taksim", nl: "Ongeveer 40 km naar Taksim", de: "Etwa 40 km bis Taksim", fr: "Environ 40 km jusqu'à Taksim", es: "Unos 40 km hasta Taksim", it: "Circa 40 km da Taksim" },
          { tr: "Şehre M11 metro ve Havaist otobüsleriyle", en: "To the city by M11 metro and Havaist buses", nl: "Naar de stad met metro M11 en Havaist-bussen", de: "In die Stadt mit der Metro M11 und Havaist-Bussen", fr: "Accès au centre par le métro M11 et les bus Havaist", es: "A la ciudad en la línea de metro M11 y en los autobuses Havaist", it: "In città con la metro M11 e gli autobus Havaist" },
          { tr: "Turkish Airlines ve KLM uçuşları buraya iner", en: "Turkish Airlines and KLM flights land here", nl: "Vluchten van Turkish Airlines en KLM landen hier", de: "Flüge von Turkish Airlines und KLM landen hier", fr: "Les vols Turkish Airlines et KLM atterrissent ici", es: "Aquí aterrizan los vuelos de Turkish Airlines y KLM", it: "Qui atterrano i voli di Turkish Airlines e KLM" },
        ],
      },
      {
        code: "SAW",
        name: { tr: "Sabiha Gökçen", en: "Sabiha Gökçen", nl: "Sabiha Gökçen", de: "Sabiha Gökçen", fr: "Sabiha Gökçen", es: "Sabiha Gökçen", it: "Sabiha Gökçen" },
        side: { tr: "Anadolu yakası", en: "Asian side", nl: "Aziatische kant", de: "Asiatische Seite", fr: "Rive asiatique", es: "Lado asiático", it: "Lato asiatico" },
        tone: "coral",
        facts: [
          { tr: "Kadıköy'e yaklaşık 40 km", en: "About 40 km to Kadıköy", nl: "Ongeveer 40 km naar Kadıköy", de: "Etwa 40 km bis Kadıköy", fr: "Environ 40 km jusqu'à Kadıköy", es: "Unos 40 km hasta Kadıköy", it: "Circa 40 km da Kadıköy" },
          { tr: "Şehre M4 metro ve Havabüs ile", en: "To the city by M4 metro and Havabüs", nl: "Naar de stad met metro M4 en Havabüs", de: "In die Stadt mit der Metro M4 und Havabüs", fr: "Accès au centre par le métro M4 et Havabüs", es: "A la ciudad en la línea de metro M4 y en Havabüs", it: "In città con la metro M4 e Havabüs" },
          { tr: "Pegasus ve AJet uçuşları genelde buraya iner", en: "Pegasus and AJet flights usually land here", nl: "Pegasus- en AJet-vluchten landen meestal hier", de: "Pegasus- und AJet-Flüge landen meistens hier", fr: "Les vols Pegasus et AJet atterrissent généralement ici", es: "Los vuelos de Pegasus y AJet suelen aterrizar aquí", it: "Di solito qui atterrano i voli Pegasus e AJet" },
        ],
      },
    ],
    tips: [
      {
        character: "marti",
        role: { tr: "Martı · İstanbul rehberi", en: "Martı · Istanbul guide", nl: "Martı · gids voor Istanbul", de: "Martı · Istanbul-Guide", fr: "Martı · guide d'Istanbul", es: "Martı · guía de Estambul", it: "Martı · guida di Istanbul" },
        quote: { tr: "“Vapura binip simit atmadan dönme, söz mü?”", en: "“Don't leave without a ferry ride and a simit, promise?”", nl: "“Ga niet terug zonder een boottocht en een simit, beloofd?”", de: "“Fahr nicht nach Hause ohne eine Fährfahrt und einen Simit, versprochen?”", fr: "“Ne repars pas sans un tour en ferry et un simit, promis ?”", es: "“No te vayas sin dar un paseo en ferri y comerte un simit, ¿prometido?”", it: "“Non tornare a casa senza un giro in traghetto e un simit, promesso?”" },
      },
      {
        character: "gunes",
        role: { tr: "Güneş · hava durumu", en: "Güneş · weather", nl: "Güneş · het weer", de: "Güneş · das Wetter", fr: "Güneş · la météo", es: "Güneş · el tiempo", it: "Güneş · meteo" },
        quote: { tr: "“Sonbaharda İstanbul ılıktır, yanına ince bir ceket al.”", en: "“Istanbul is mild in autumn, pack a light jacket.”", nl: "“In de herfst is Istanbul zacht, neem een dun jasje mee.”", de: "“Im Herbst ist Istanbul mild, pack eine leichte Jacke ein.”", fr: "“Istanbul est douce en automne, prends une veste légère.”", es: "“En otoño hace un tiempo suave en Estambul, llévate una chaqueta ligera.”", it: "“In autunno Istanbul è mite, metti in valigia una giacca leggera.”" },
      },
      PASSPORT_TIP,
    ],
    others: ["AYT", "ADB", "ESB", "ASR", "TZX"],
  },

  AYT: {
    illustration: "antalya",
    heroBg: "#BFE3FF",
    airportsShort: "AYT",
    airports: [
      {
        code: "AYT",
        name: { tr: "Antalya Havalimanı", en: "Antalya Airport", nl: "Luchthaven Antalya", de: "Flughafen Antalya", fr: "Aéroport d'Antalya", es: "Aeropuerto de Antalya", it: "Aeroporto di Antalya" },
        side: { tr: "Şehir merkezinin doğusu", en: "East of city centre", nl: "Ten oosten van het centrum", de: "Östlich des Zentrums", fr: "À l'est du centre-ville", es: "Al este del centro", it: "A est del centro" },
        tone: "ink",
        facts: [
          { tr: "Kaleiçi ve şehir merkezine yaklaşık 13 km", en: "About 13 km to Kaleiçi and the city centre", nl: "Ongeveer 13 km naar Kaleiçi en het centrum", de: "Etwa 13 km nach Kaleiçi und ins Zentrum", fr: "Environ 13 km jusqu'à Kaleiçi et le centre", es: "Unos 13 km hasta Kaleiçi y el centro", it: "Circa 13 km da Kaleiçi e dal centro" },
          { tr: "AntRay tramvay (T1A) ve Havaş servisleriyle kolay ulaşım", en: "Easy access via AntRay tram (T1A) and Havaş shuttles", nl: "Gemakkelijk bereikbaar met AntRay-tram (T1A) en Havaş-bussen", de: "Bequem mit der Straßenbahn AntRay (T1A) und Havaş-Shuttles", fr: "Accès facile par le tram AntRay (T1A) et les navettes Havaş", es: "Fácil acceso en tranvía AntRay (T1A) y autobuses Havaş", it: "Facile accesso con il tram AntRay (T1A) e navette Havaş" },
          { tr: "İç hatlar ve iki dış hat terminali bulunur", en: "One domestic and two international terminals", nl: "Eén binnenlandse en twee internationale terminals", de: "Ein Inlands- und zwei internationale Terminals", fr: "Un terminal domestique et deux terminaux internationaux", es: "Una terminal nacional y dos internacionales", it: "Un terminal nazionale e due internazionali" },
        ],
      },
    ],
    tips: [
      {
        character: "gunes",
        role: { tr: "Güneş · sezon ipucu", en: "Güneş · season tip", nl: "Güneş · seizoenstip", de: "Güneş · Saisontipp", fr: "Güneş · conseil saison", es: "Güneş · consejo de temporada", it: "Güneş · consiglio stagione" },
        quote: { tr: "“Mayıs ve Ekim'de deniz hâlâ ılık, biletler ise yaza göre daha sakin.”", en: "“In May and October the sea is still warm and fares are calmer.”", nl: "“In mei en oktober is de zee nog warm en zijn tickets rustiger geprijsd.”", de: "“Im Mai und Oktober ist das Meer noch warm und die Preise sind entspannter.”", fr: "“En mai et octobre la mer reste douce et les tarifs sont plus calmes.”", es: "“En mayo y octubre el mar sigue templado y las tarifas son más bajas.”", it: "“A maggio e ottobre il mare è ancora caldo e i prezzi sono più tranquilli.”" },
      },
      BAG_TIP,
      PASSPORT_TIP,
    ],
    others: ["IST", "ADB", "DLM", "BJV", "ESB"],
  },

  ADB: {
    illustration: "izmir",
    heroBg: "#D7ECFF",
    airportsShort: "ADB",
    airports: [
      {
        code: "ADB",
        name: { tr: "Adnan Menderes Havalimanı", en: "Adnan Menderes Airport", nl: "Luchthaven Adnan Menderes", de: "Flughafen Adnan Menderes", fr: "Aéroport Adnan Menderes", es: "Aeropuerto Adnan Menderes", it: "Aeroporto Adnan Menderes" },
        side: { tr: "Gaziemir · güney", en: "Gaziemir · south", nl: "Gaziemir · zuid", de: "Gaziemir · Süden", fr: "Gaziemir · sud", es: "Gaziemir · sur", it: "Gaziemir · sud" },
        tone: "ink",
        facts: [
          { tr: "İzmir şehir merkezine yaklaşık 18 km", en: "About 18 km to central Izmir", nl: "Ongeveer 18 km naar het centrum van Izmir", de: "Etwa 18 km bis ins Zentrum von Izmir", fr: "Environ 18 km du centre d'Izmir", es: "Unos 18 km hasta el centro de Esmirna", it: "Circa 18 km dal centro di Smirne" },
          { tr: "İZBAN banliyö treni terminalden merkeze doğrudan gider", en: "İZBAN commuter train connects directly to the centre", nl: "De İZBAN-trein rijdt rechtstreeks naar het centrum", de: "Die İZBAN-S-Bahn fährt direkt ins Stadtzentrum", fr: "Le train İZBAN relie directement le terminal au centre", es: "El tren İZBAN conecta directamente con el centro", it: "Il treno İZBAN collega direttamente al centro" },
          { tr: "Çeşme, Alaçatı ve Kuşadası servisleri terminal çıkışından kalkar", en: "Shuttles to Çeşme, Alaçatı and Kuşadası depart right outside", nl: "Bussen naar Çeşme, Alaçatı en Kuşadası vertrekken voor de terminal", de: "Shuttles nach Çeşme, Alaçatı und Kuşadası starten am Terminal", fr: "Navettes vers Çeşme, Alaçatı et Kuşadası devant le terminal", es: "Autobuses a Çeşme, Alaçatı y Kuşadası frente a la terminal", it: "Navette per Çeşme, Alaçatı e Kuşadası fuori dal terminal" },
        ],
      },
    ],
    tips: [
      {
        character: "marti",
        role: { tr: "Martı · Ege rehberi", en: "Martı · Aegean guide", nl: "Martı · Egeïsche gids", de: "Martı · Ägäis-Guide", fr: "Martı · guide Égée", es: "Martı · guía del Egeo", it: "Martı · guida Egeo" },
        quote: { tr: "“Kordon'da gün batımı ve sabah boyozu olmadan İzmir eksik kalır.”", en: "“Sunset at Kordon and a morning boyoz make Izmir complete.”", nl: "“Zonsondergang op de Kordon en een verse boyoz horen bij Izmir.”", de: "“Sonnenuntergang am Kordon und Boyoz am Morgen gehören zu Izmir.”", fr: "“Coucher de soleil sur le Kordon et boyoz du matin : un classique.”", es: "“Atardecer en Kordon y un boyoz por la mañana completan el viaje.”", it: "“Tramonto sul Kordon e boyoz al mattino rendono Smirne unica.”" },
      },
      BAG_TIP,
      PASSPORT_TIP,
    ],
    others: ["IST", "AYT", "BJV", "DLM", "ESB"],
  },

  DLM: {
    illustration: "sky",
    heroBg: "#EAF3FF",
    airportsShort: "DLM",
    airports: [
      {
        code: "DLM",
        name: { tr: "Dalaman Havalimanı", en: "Dalaman Airport", nl: "Luchthaven Dalaman", de: "Flughafen Dalaman", fr: "Aéroport de Dalaman", es: "Aeropuerto de Dalaman", it: "Aeroporto di Dalaman" },
        side: { tr: "Muğla · güneybatı", en: "Muğla · southwest", nl: "Muğla · zuidwest", de: "Muğla · Südwesten", fr: "Muğla · sud-ouest", es: "Muğla · suroeste", it: "Muğla · sud-ovest" },
        tone: "ink",
        facts: [
          { tr: "Fethiye'ye yaklaşık 50 km, Marmaris'e 95 km", en: "About 50 km to Fethiye, 95 km to Marmaris", nl: "Ongeveer 50 km naar Fethiye, 95 km naar Marmaris", de: "Etwa 50 km nach Fethiye, 95 km nach Marmaris", fr: "Environ 50 km jusqu'à Fethiye, 95 km jusqu'à Marmaris", es: "Unos 50 km a Fethiye y 95 km a Marmaris", it: "Circa 50 km da Fethiye, 95 km da Marmaris" },
          { tr: "MUTTAŞ ve Havaş servisleri Fethiye ile Marmaris'e düzenli gider", en: "MUTTAŞ and Havaş shuttles run regularly to Fethiye and Marmaris", nl: "MUTTAŞ- en Havaş-bussen rijden regelmatig naar Fethiye en Marmaris", de: "MUTTAŞ- und Havaş-Busse fahren regelmäßig nach Fethiye und Marmaris", fr: "Navettes MUTTAŞ et Havaş régulières vers Fethiye et Marmaris", es: "Autobuses MUTTAŞ y Havaş regulares a Fethiye y Marmaris", it: "Navette MUTTAŞ e Havaş regolari per Fethiye e Marmaris" },
          { tr: "Nisan–Ekim arasında direkt Avrupa seferleri yoğunlaşır", en: "Direct European flights peak from April to October", nl: "Directe vluchten uit Europa pieken van april tot oktober", de: "Direktflüge aus Europa sind von April bis Oktober am häufigsten", fr: "Les vols directs européens sont nombreux d'avril à octobre", es: "Los vuelos directos europeos abundan de abril a octubre", it: "I voli diretti europei si concentrano da aprile a ottobre" },
        ],
      },
    ],
    tips: [
      {
        character: "gunes",
        role: { tr: "Güneş · tatil notu", en: "Güneş · holiday tip", nl: "Güneş · vakantietip", de: "Güneş · Urlaubstipp", fr: "Güneş · conseil séjour", es: "Güneş · consejo de viaje", it: "Güneş · consiglio vacanza" },
        quote: { tr: "“Ölüdeniz ve Göcek koyları için Haziran ve Eylül hem sıcak hem sakin.”", en: "“For Ölüdeniz and Göcek bays, June and September are warm and peaceful.”", nl: "“Voor Ölüdeniz en Göcek zijn juni en september warm en rustig.”", de: "“Für Ölüdeniz und Göcek sind Juni und September warm und ruhig.”", fr: "“Pour Ölüdeniz et Göcek, juin et septembre allient chaleur et calme.”", es: "“Para Ölüdeniz y Göcek, junio y septiembre son cálidos y tranquilos.”", it: "“Per Ölüdeniz e Göcek, giugno e settembre sono caldi e tranquilli.”" },
      },
      BAG_TIP,
      PASSPORT_TIP,
    ],
    others: ["AYT", "BJV", "ADB", "IST"],
  },

  LON: {
    illustration: "londra",
    heroBg: "#D7ECFF",
    airportsShort: "LHR · LGW · STN",
    airports: [
      {
        code: "LHR",
        name: { tr: "Heathrow", en: "Heathrow", nl: "Heathrow", de: "Heathrow", fr: "Heathrow", es: "Heathrow", it: "Heathrow" },
        side: { tr: "Batı Londra", en: "West London", nl: "West-Londen", de: "West-London", fr: "Ouest de Londres", es: "Oeste de Londres", it: "Ovest di Londra" },
        tone: "ink",
        facts: [
          { tr: "Merkeze Elizabeth Line ve Piccadilly metrosuyla 30–45 dk", en: "30–45 min to central London via Elizabeth Line or Piccadilly line", nl: "30–45 min naar het centrum met Elizabeth Line of Piccadilly Line", de: "30–45 Min. ins Zentrum mit Elizabeth Line oder Piccadilly Line", fr: "30 à 45 min du centre via l'Elizabeth Line ou la Piccadilly Line", es: "30–45 min al centro con Elizabeth Line o Piccadilly Line", it: "30–45 min dal centro con Elizabeth Line o Piccadilly Line" },
          { tr: "British Airways, Turkish Airlines ve ana taşıyıcılar", en: "Main hub for British Airways and full-service carriers", nl: "Knooppunt voor British Airways en grote maatschappijen", de: "Drehkreuz für British Airways und Linienfluggesellschaften", fr: "Hub principal pour British Airways et grandes compagnies", es: "Centro principal de British Airways y aerolíneas tradicionales", it: "Hub principale per British Airways e grandi compagnie" },
          { tr: "Temassız kart veya Oyster ile şehir içi ulaşım kolay", en: "Pay easily with contactless card or Oyster", nl: "Eenvoudig betalen met contactloze pas of Oyster", de: "Einfach mit kontaktloser Karte oder Oyster zahlen", fr: "Paiement simple par carte sans contact ou Oyster", es: "Paga fácil con tarjeta sin contacto u Oyster", it: "Paga facilmente con carta contactless o Oyster" },
        ],
      },
      {
        code: "LGW",
        name: { tr: "Gatwick", en: "Gatwick", nl: "Gatwick", de: "Gatwick", fr: "Gatwick", es: "Gatwick", it: "Gatwick" },
        side: { tr: "Güney Londra", en: "South London", nl: "Zuid-Londen", de: "Süd-London", fr: "Sud de Londres", es: "Sur de Londres", it: "Sud di Londra" },
        tone: "coral",
        facts: [
          { tr: "Victoria veya London Bridge'e trenle 30–35 dk", en: "30–35 min by train to Victoria or London Bridge", nl: "30–35 min per trein naar Victoria of London Bridge", de: "30–35 Min. mit dem Zug nach Victoria oder London Bridge", fr: "30 à 35 min en train vers Victoria ou London Bridge", es: "30–35 min en tren a Victoria o London Bridge", it: "30–35 min in treno per Victoria o London Bridge" },
          { tr: "easyJet, Vueling ve ekonomik Avrupa seferleri yaygın", en: "Popular for easyJet and budget European flights", nl: "Veel easyJet- en voordelige Europese vluchten", de: "Beliebt für easyJet und günstige Europaflüge", fr: "Très fréquenté par easyJet et les vols européens économiques", es: "Muy usado por easyJet y vuelos europeos económicos", it: "Molto usato da easyJet e voli europei economici" },
          { tr: "Kuzey ve Güney terminalleri ücretsiz trenle bağlı", en: "Free shuttle links North and South terminals", nl: "Gratis shuttle verbindt Noord- en Zuidterminal", de: "Kostenloser Shuttle verbindet Nord- und Südterminal", fr: "Navette gratuite entre les terminaux Nord et Sud", es: "Lanzadera gratuita entre las terminales Norte y Sur", it: "Navetta gratuita tra i terminal Nord e Sud" },
        ],
      },
    ],
    tips: [
      {
        character: "bulut",
        role: { tr: "Bulut · hava notu", en: "Bulut · weather note", nl: "Bulut · weertip", de: "Bulut · Wettertipp", fr: "Bulut · conseil météo", es: "Bulut · consejo del tiempo", it: "Bulut · consiglio meteo" },
        quote: { tr: "“Londra'da hava gün içinde değişebilir; küçük bir şemsiye her zaman işe yarar.”", en: "“London weather changes fast — a compact umbrella always helps.”", nl: "“Het weer in Londen slaat snel om — een kleine paraplu is altijd handig.”", de: "“Das Londoner Wetter wechselt schnell — ein kleiner Schirm hilft immer.”", fr: "“À Londres la météo change vite : garde un petit parapluie dans ton sac.”", es: "“El tiempo en Londres cambia rápido; un paraguas compacto siempre ayuda.”", it: "“A Londra il meteo cambia in fretta: un ombrello pieghevole torna sempre utile.”" },
      },
      BAG_TIP,
      PASSPORT_TIP,
    ],
    others: ["PAR", "AMS", "DUB", "BCN", "ROM"],
  },

  BCN: {
    illustration: "barselona",
    heroBg: "#FFE2C6",
    airportsShort: "BCN",
    airports: [
      {
        code: "BCN",
        name: { tr: "Barcelona El Prat", en: "Barcelona El Prat", nl: "Barcelona El Prat", de: "Barcelona El Prat", fr: "Barcelone El Prat", es: "Barcelona-El Prat", it: "Barcellona El Prat" },
        side: { tr: "Şehrin güneybatısı", en: "Southwest of the city", nl: "Ten zuidwesten van de stad", de: "Südwestlich der Stadt", fr: "Sud-ouest de la ville", es: "Suroeste de la ciudad", it: "Sud-ovest della città" },
        tone: "ink",
        facts: [
          { tr: "Plaça de Catalunya'ya yaklaşık 15 km", en: "About 15 km to Plaça de Catalunya", nl: "Ongeveer 15 km naar Plaça de Catalunya", de: "Etwa 15 km bis zur Plaça de Catalunya", fr: "Environ 15 km jusqu'à la Plaça de Catalunya", es: "Unos 15 km hasta la Plaza de Cataluña", it: "Circa 15 km da Plaça de Catalunya" },
          { tr: "Aerobús ekspres otobüsü ve L9 Sud metrosu ile merkeze ulaşım", en: "Aerobús express and L9 Sud metro go straight into town", nl: "Aerobús en metro L9 Sud brengen je direct naar de stad", de: "Aerobús-Express und Metro L9 Sud fahren direkt in die Stadt", fr: "Aerobús express et métro L9 Sud directs vers le centre", es: "Aerobús exprés y metro L9 Sud directos al centro", it: "Aerobús espresso e metro L9 Sud diretti in centro" },
          { tr: "Terminal 1 ve Terminal 2 arasında ücretsiz otobüs çalışır", en: "Free shuttle bus connects Terminal 1 and Terminal 2", nl: "Gratis pendelbus tussen Terminal 1 en Terminal 2", de: "Kostenloser Shuttlebus zwischen Terminal 1 und Terminal 2", fr: "Navette gratuite entre le Terminal 1 et le Terminal 2", es: "Autobús gratuito entre la Terminal 1 y la Terminal 2", it: "Navetta gratuita tra il Terminal 1 e il Terminal 2" },
        ],
      },
    ],
    tips: [
      {
        character: "gunes",
        role: { tr: "Güneş · şehir ipucu", en: "Güneş · city tip", nl: "Güneş · stadstip", de: "Güneş · Städtetipp", fr: "Güneş · conseil ville", es: "Güneş · consejo local", it: "Güneş · consiglio città" },
        quote: { tr: "“İlkbahar ve sonbaharda Barselona yürümek için harika, biletler de daha uygun.”", en: "“Spring and autumn are ideal for walking Barcelona, with gentler fares.”", nl: "“Lente en herfst zijn ideaal voor Barcelona, met vriendelijkere prijzen.”", de: "“Frühling und Herbst sind perfekt für Barcelona — auch bei den Preisen.”", fr: "“Le printemps et l'automne sont parfaits pour Barcelone, à tarifs plus doux.”", es: "“Primavera y otoño son ideales para pasear por Barcelona con mejores precios.”", it: "“Primavera e autunno sono ideali per Barcellona, con tariffe più convenienti.”" },
      },
      BAG_TIP,
      PASSPORT_TIP,
    ],
    others: ["MAD", "LIS", "ROM", "PAR"],
  },

  ROM: {
    illustration: "roma",
    heroBg: "#FFE2C6",
    airportsShort: "FCO · CIA",
    airports: [
      {
        code: "FCO",
        name: { tr: "Fiumicino (Leonardo da Vinci)", en: "Fiumicino (Leonardo da Vinci)", nl: "Fiumicino (Leonardo da Vinci)", de: "Fiumicino (Leonardo da Vinci)", fr: "Fiumicino (Leonardo da Vinci)", es: "Fiumicino (Leonardo da Vinci)", it: "Fiumicino (Leonardo da Vinci)" },
        side: { tr: "Ana havalimanı · batı", en: "Main airport · west", nl: "Hoofdluchthaven · west", de: "Hauptflughafen · Westen", fr: "Aéroport principal · ouest", es: "Aeropuerto principal · oeste", it: "Aeroporto principale · ovest" },
        tone: "ink",
        facts: [
          { tr: "Termini istasyonuna Leonardo Express treniyle 32 dk", en: "32 min to Termini station via Leonardo Express train", nl: "32 min naar station Termini met de Leonardo Express", de: "32 Min. zum Bahnhof Termini mit dem Leonardo Express", fr: "32 min jusqu'à la gare Termini avec le Leonardo Express", es: "32 min hasta la estación Termini en el Leonardo Express", it: "32 min per la stazione Termini con il Leonardo Express" },
          { tr: "Kısa ve uzun mesafe ana havayolları buraya iner", en: "Served by major European and long-haul airlines", nl: "Grote Europese en intercontinentale luchtvaartmaatschappijen", de: "Angefahren von großen europäischen und Langstrecken-Airlines", fr: "Desservi par les grandes compagnies européennes et long-courriers", es: "Operado por grandes aerolíneas europeas y de larga distancia", it: "Servito dalle principali compagnie europee e intercontinentali" },
          { tr: "FL1 bölgesel treni daha ekonomik bir şehir içi seçenek", en: "FL1 regional train is a budget-friendly city link", nl: "De regionale FL1-trein is een voordelige verbinding", de: "Der Regionalzug FL1 ist eine günstige Verbindung", fr: "Le train régional FL1 est une option plus économique", es: "El tren regional FL1 es una alternativa económica", it: "Il treno regionale FL1 è una scelta più economica" },
        ],
      },
      {
        code: "CIA",
        name: { tr: "Ciampino", en: "Ciampino", nl: "Ciampino", de: "Ciampino", fr: "Ciampino", es: "Ciampino", it: "Ciampino" },
        side: { tr: "Güneydoğu Roma", en: "Southeast Rome", nl: "Zuidoost-Rome", de: "Südost-Rom", fr: "Sud-est de Rome", es: "Sureste de Roma", it: "Sud-est di Roma" },
        tone: "coral",
        facts: [
          { tr: "Şehir merkezine yaklaşık 15 km", en: "About 15 km to central Rome", nl: "Ongeveer 15 km naar het centrum van Rome", de: "Etwa 15 km bis ins Zentrum von Rom", fr: "Environ 15 km du centre de Rome", es: "Unos 15 km hasta el centro de Roma", it: "Circa 15 km dal centro di Roma" },
          { tr: "Termini'ye ekspres otobüsler yaklaşık 40 dk sürer", en: "Express buses to Termini take about 40 min", nl: "Snelbussen naar Termini duren ongeveer 40 min", de: "Expressbusse nach Termini dauern rund 40 Min.", fr: "Les bus express vers Termini mettent environ 40 min", es: "Los autobuses exprés a Termini tardan unos 40 min", it: "Gli autobus espressi per Termini impiegano circa 40 min" },
          { tr: "Genellikle ekonomik Avrupa seferleri kullanır", en: "Mostly used by European low-cost carriers", nl: "Vooral gebruikt door voordelige Europese maatschappijen", de: "Vor allem für günstige europäische Airlines", fr: "Surtout utilisé par les compagnies européennes économiques", es: "Usado sobre todo por aerolíneas europeas de bajo coste", it: "Usato soprattutto dalle compagnie europee low-cost" },
        ],
      },
    ],
    tips: [
      {
        character: "gunes",
        role: { tr: "Güneş · Roma rehberi", en: "Güneş · Rome guide", nl: "Güneş · gids voor Rome", de: "Güneş · Rom-Guide", fr: "Güneş · guide de Rome", es: "Güneş · guía de Roma", it: "Güneş · guida di Roma" },
        quote: { tr: "“Rahat yürüyüş ayakkabısı şart; Roma'nın en güzel sokakları yürüyerek keşfedilir.”", en: "“Pack comfy walking shoes — Rome's best corners are explored on foot.”", nl: "“Neem fijne wandelschoenen mee — Rome ontdek je het best te voet.”", de: "“Bequeme Schuhe einpacken — Rom entdeckt man am besten zu Fuß.”", fr: "“Prends de bonnes chaussures : Rome se découvre surtout à pied.”", es: "“Lleva calzado cómodo: los mejores rincones de Roma se recorren a pie.”", it: "“Scarpe comode indispensabili: gli angoli più belli di Roma si girano a piedi.”" },
      },
      BAG_TIP,
      PASSPORT_TIP,
    ],
    others: ["BCN", "ATH", "PAR", "LIS"],
  },

  LIS: {
    illustration: "lizbon",
    heroBg: "#FFE8B8",
    airportsShort: "LIS",
    airports: [
      {
        code: "LIS",
        name: { tr: "Humberto Delgado", en: "Humberto Delgado", nl: "Humberto Delgado", de: "Humberto Delgado", fr: "Humberto Delgado", es: "Humberto Delgado", it: "Humberto Delgado" },
        side: { tr: "Şehrin kuzeyi", en: "North of the city", nl: "Ten noorden van de stad", de: "Nördlich der Stadt", fr: "Nord de la ville", es: "Norte de la ciudad", it: "Nord della città" },
        tone: "ink",
        facts: [
          { tr: "Şehir merkezine sadece 7 km uzaklıkta", en: "Just 7 km from central Lisbon", nl: "Slechts 7 km van het centrum van Lissabon", de: "Nur 7 km vom Zentrum Lissabons entfernt", fr: "À seulement 7 km du centre de Lisbonne", es: "A solo 7 km del centro de Lisboa", it: "A soli 7 km dal centro di Lisbona" },
          { tr: "Kırmızı metro hattı (Linha Vermelha) doğrudan terminalden kalkar", en: "Red metro line (Linha Vermelha) departs right from Terminal 1", nl: "Rode metrolijn (Linha Vermelha) vertrekt direct bij Terminal 1", de: "Rote Metrolinie (Linha Vermelha) fährt direkt ab Terminal 1", fr: "La ligne rouge du métro (Linha Vermelha) part directement du Terminal 1", es: "La línea roja de metro (Linha Vermelha) sale de la Terminal 1", it: "La linea rossa della metro (Linha Vermelha) parte dal Terminal 1" },
          { tr: "Terminal 2 (ekonomik seferler) ile T1 arasında ücretsiz servis var", en: "Free shuttle links Terminal 2 (budget airlines) with Terminal 1", nl: "Gratis pendelbus tussen Terminal 2 en Terminal 1", de: "Kostenloser Shuttle zwischen Terminal 2 und Terminal 1", fr: "Navette gratuite entre le Terminal 2 et le Terminal 1", es: "Lanzadera gratuita entre la Terminal 2 y la Terminal 1", it: "Navetta gratuita tra il Terminal 2 e il Terminal 1" },
        ],
      },
    ],
    tips: [
      {
        character: "marti",
        role: { tr: "Martı · Lizbon notu", en: "Martı · Lisbon note", nl: "Martı · tip voor Lissabon", de: "Martı · Lissabon-Tipp", fr: "Martı · conseil Lisbonne", es: "Martı · consejo Lisboa", it: "Martı · consiglio Lisbona" },
        quote: { tr: "“Okyanus rüzgârı akşamları serinletir; yazın bile hafif bir üstlük iyi gider.”", en: "“Atlantic breezes cool the evenings — bring a light layer even in summer.”", nl: "“De oceaanwind maakt avonden fris — een licht vestje is zelfs in de zomer fijn.”", de: "“Der Atlantikwind kühlt die Abende ab — eine leichte Jacke lohnt sich immer.”", fr: "“La brise atlantique rafraîchit les soirées : prévois une petite veste.”", es: "“La brisa del Atlántico refresca las noches; lleva algo ligero incluso en verano.”", it: "“La brezza atlantica rinfresca la sera: porta un capo leggero anche d'estate.”" },
      },
      BAG_TIP,
      PASSPORT_TIP,
    ],
    others: ["MAD", "BCN", "ROM", "PAR"],
  },

  PAR: {
    illustration: "paris",
    heroBg: "#FCE2EC",
    airportsShort: "CDG · ORY",
    airports: [
      {
        code: "CDG",
        name: { tr: "Charles de Gaulle", en: "Charles de Gaulle", nl: "Charles de Gaulle", de: "Charles de Gaulle", fr: "Charles-de-Gaulle", es: "Charles de Gaulle", it: "Charles de Gaulle" },
        side: { tr: "Kuzeydoğu Paris", en: "Northeast Paris", nl: "Noordoost-Parijs", de: "Nordost-Paris", fr: "Nord-est de Paris", es: "Noreste de París", it: "Nord-est di Parigi" },
        tone: "ink",
        facts: [
          { tr: "Merkeze RER B treniyle yaklaşık 35–40 dk", en: "About 35–40 min to central Paris on RER B train", nl: "Ongeveer 35–40 min naar het centrum met RER B", de: "Etwa 35–40 Min. ins Zentrum mit der RER B", fr: "Environ 35 à 40 min jusqu'au centre en RER B", es: "Unos 35–40 min al centro en el tren RER B", it: "Circa 35–40 min dal centro con il treno RER B" },
          { tr: "Air France ve uzun mesafe seferlerinin ana üssü", en: "Main hub for Air France and international flights", nl: "Hoofdbasis van Air France en internationale vluchten", de: "Hauptdrehkreuz für Air France und Fernflüge", fr: "Hub principal d'Air France et des vols internationaux", es: "Base principal de Air France y vuelos internacionales", it: "Hub principale di Air France e voli internazionali" },
          { tr: "RoissyBus doğrudan Opéra meydanına gider", en: "RoissyBus goes directly to Opéra", nl: "RoissyBus rijdt rechtstreeks naar Opéra", de: "RoissyBus fährt direkt zur Opéra", fr: "Le RoissyBus rejoint directement Opéra", es: "El RoissyBus va directo hasta Opéra", it: "Il RoissyBus arriva direttamente a Opéra" },
        ],
      },
      {
        code: "ORY",
        name: { tr: "Orly", en: "Orly", nl: "Orly", de: "Orly", fr: "Orly", es: "Orly", it: "Orly" },
        side: { tr: "Güney Paris", en: "South Paris", nl: "Zuid-Parijs", de: "Süd-Paris", fr: "Sud de Paris", es: "Sur de París", it: "Sud di Parigi" },
        tone: "coral",
        facts: [
          { tr: "Merkeze yalnızca 14 km uzaklıkta", en: "Only 14 km from central Paris", nl: "Slechts 14 km van het centrum van Parijs", de: "Nur 14 km vom Pariser Zentrum entfernt", fr: "À seulement 14 km du centre de Paris", es: "A solo 14 km del centro de París", it: "A soli 14 km dal centro di Parigi" },
          { tr: "14 numaralı metro hattı doğrudan şehir merkezine bağlanır", en: "Metro Line 14 connects directly to central Paris", nl: "Metrolijn 14 rijdt rechtstreeks naar het centrum", de: "Metrolinie 14 verbindet direkt mit dem Zentrum", fr: "La ligne 14 du métro relie directement le centre", es: "La línea 14 de metro conecta directamente con el centro", it: "La linea 14 della metro collega direttamente al centro" },
          { tr: "Transavia, Vueling ve pek çok Avrupa uçuşu buradan", en: "Popular for Transavia, Vueling and European routes", nl: "Veel gebruikt door Transavia, Vueling en Europese vluchten", de: "Beliebt für Transavia, Vueling und Europaflüge", fr: "Très fréquenté par Transavia, Vueling et les vols européens", es: "Muy usado por Transavia, Vueling y rutas europeas", it: "Molto usato da Transavia, Vueling e rotte europee" },
        ],
      },
    ],
    tips: [
      {
        character: "bulut",
        role: { tr: "Bulut · şehir notu", en: "Bulut · city note", nl: "Bulut · stadstip", de: "Bulut · Städtetipp", fr: "Bulut · conseil ville", es: "Bulut · consejo urbano", it: "Bulut · consiglio città" },
        quote: { tr: "“Biletini seçerken CDG mi ORY mi indiğine bak; 14. metro ile Orly merkeze çok hızlı.”", en: "“Check whether your flight lands at CDG or ORY — Metro 14 makes Orly super quick.”", nl: "“Let bij het boeken op CDG of ORY — met metro 14 is Orly erg snel.”", de: "“Achte auf CDG oder ORY — mit Metro 14 geht es ab Orly besonders schnell.”", fr: "“Regarde si tu arrives à CDG ou ORY : avec la ligne 14, Orly est très rapide.”", es: "“Fíjate si llegas a CDG u ORY: con la línea 14, Orly es muy rápido.”", it: "“Controlla se atterri a CDG o ORY: con la metro 14 Orly è velocissimo.”" },
      },
      BAG_TIP,
      PASSPORT_TIP,
    ],
    others: ["LON", "AMS", "BCN", "ROM"],
  },

  AMS: {
    illustration: "amsterdam",
    heroBg: "#D7ECFF",
    airportsShort: "AMS",
    airports: [
      {
        code: "AMS",
        name: { tr: "Amsterdam Schiphol", en: "Amsterdam Schiphol", nl: "Amsterdam Schiphol", de: "Amsterdam Schiphol", fr: "Amsterdam Schiphol", es: "Ámsterdam Schiphol", it: "Amsterdam Schiphol" },
        side: { tr: "Güneybatı Amsterdam", en: "Southwest Amsterdam", nl: "Ten zuidwesten van Amsterdam", de: "Südwestlich von Amsterdam", fr: "Sud-ouest d'Amsterdam", es: "Suroeste de Ámsterdam", it: "Sud-ovest di Amsterdam" },
        tone: "ink",
        facts: [
          { tr: "Amsterdam Centraal'a trenle sadece 15–17 dk", en: "Just 15–17 min by train to Amsterdam Centraal", nl: "Slechts 15–17 min per trein naar Amsterdam Centraal", de: "Nur 15–17 Min. mit dem Zug nach Amsterdam Centraal", fr: "Seulement 15 à 17 min en train jusqu'à Amsterdam Centraal", es: "Solo 15–17 min en tren a Amsterdam Centraal", it: "Solo 15–17 min in treno per Amsterdam Centraal" },
          { tr: "Tren istasyonu doğrudan terminalin altında yer alır", en: "The train station sits right underneath the terminal", nl: "Het treinstation ligt direct onder de terminal", de: "Der Bahnhof liegt direkt unter dem Terminal", fr: "La gare se trouve juste sous le terminal", es: "La estación de tren está justo debajo de la terminal", it: "La stazione ferroviaria si trova proprio sotto il terminal" },
          { tr: "KLM, Transavia ve pek çok Avrupa/Türkiye direkt seferi", en: "Hub for KLM, Transavia and frequent European direct flights", nl: "Thuisbasis van KLM, Transavia en veel directe vluchten", de: "Drehkreuz für KLM, Transavia und viele Direktflüge", fr: "Hub de KLM, Transavia et nombreux vols directs européens", es: "Centro de KLM, Transavia y muchos vuelos directos", it: "Hub di KLM, Transavia e molti voli diretti europei" },
        ],
      },
    ],
    tips: [
      {
        character: "bulut",
        role: { tr: "Bulut · hava notu", en: "Bulut · weather note", nl: "Bulut · weertip", de: "Bulut · Wettertipp", fr: "Bulut · conseil météo", es: "Bulut · consejo del tiempo", it: "Bulut · consiglio meteo" },
        quote: { tr: "“Kanal kenarında rüzgâr serin olabilir; yağmurluk şemsiyeden daha pratik.”", en: "“Canal breezes can feel brisk — a light raincoat beats an umbrella.”", nl: "“Langs de grachten kan het waaien — een regenjas is handiger dan een paraplu.”", de: "“An den Grachten weht oft Wind — eine Regenjacke ist praktischer als ein Schirm.”", fr: "“Le vent souffle vite sur les canaux : un coupe-vent imperméable vaut mieux qu'un parapluie.”", es: "“Junto a los canales suele haber viento: un chubasquero es mejor que un paraguas.”", it: "“Lungo i canali c'è spesso vento: meglio un impermeabile dell'ombrello.”" },
      },
      BAG_TIP,
      PASSPORT_TIP,
    ],
    others: ["LON", "PAR", "BCN", "IST"],
  },

  DXB: {
    illustration: "dubai",
    heroBg: "#FFE2C6",
    airportsShort: "DXB",
    airports: [
      {
        code: "DXB",
        name: { tr: "Dubai Uluslararası Havalimanı", en: "Dubai International Airport", nl: "Dubai International Airport", de: "Flughafen Dubai International", fr: "Aéroport international de Dubaï", es: "Aeropuerto Internacional de Dubái", it: "Aeroporto Internazionale di Dubai" },
        side: { tr: "Al Garhoud · merkeze yakın", en: "Al Garhoud · close to centre", nl: "Al Garhoud · dicht bij centrum", de: "Al Garhoud · zentrumsnah", fr: "Al Garhoud · proche du centre", es: "Al Garhoud · cerca del centro", it: "Al Garhoud · vicino al centro" },
        tone: "ink",
        facts: [
          { tr: "Downtown Dubai'ye yaklaşık 15 km", en: "About 15 km to Downtown Dubai", nl: "Ongeveer 15 km naar Downtown Dubai", de: "Etwa 15 km nach Downtown Dubai", fr: "Environ 15 km jusqu'à Downtown Dubaï", es: "Unos 15 km hasta Downtown Dubái", it: "Circa 15 km da Downtown Dubai" },
          { tr: "Kırmızı metro hattı Terminal 1 ve Terminal 3'ten doğrudan geçer", en: "Red metro line serves Terminal 1 and Terminal 3 directly", nl: "Rode metrolijn stopt direct bij Terminal 1 en Terminal 3", de: "Rote Metrolinie bedient Terminal 1 und Terminal 3 direkt", fr: "La ligne rouge du métro dessert directement T1 et T3", es: "La línea roja de metro pasa directo por las terminales 1 y 3", it: "La linea rossa della metro serve direttamente i Terminal 1 e 3" },
          { tr: "Emirates, flydubai ve geniş aktarmasız bağlantı ağı", en: "Hub for Emirates, flydubai and major international airlines", nl: "Knooppunt voor Emirates, flydubai en internationale vluchten", de: "Drehkreuz für Emirates, flydubai und internationale Airlines", fr: "Hub d'Emirates, flydubai et grandes compagnies internationales", es: "Hub de Emirates, flydubai y aerolíneas internacionales", it: "Hub di Emirates, flydubai e grandi compagnie internazionali" },
        ],
      },
    ],
    tips: [
      {
        character: "gunes",
        role: { tr: "Güneş · sezon ipucu", en: "Güneş · season tip", nl: "Güneş · seizoenstip", de: "Güneş · Saisontipp", fr: "Güneş · conseil saison", es: "Güneş · consejo de temporada", it: "Güneş · consiglio stagione" },
        quote: { tr: "“Kasım–Mart arası hava açık havada gezmek için en keyifli dönemdir.”", en: "“November to March offers the most comfortable weather for exploring outdoors.”", nl: "“Van november tot maart is het weer het prettigst om buiten rond te lopen.”", de: "“Von November bis März ist das Wetter draußen am angenehmsten.”", fr: "“De novembre à mars, la météo est idéale pour profiter de l'extérieur.”", es: "“De noviembre a marzo el clima es el más agradable para pasear al aire libre.”", it: "“Da novembre a marzo il clima è il migliore per girare all'aperto.”" },
      },
      BAG_TIP,
      PASSPORT_TIP,
    ],
    others: ["IST", "ATH", "ROM", "BCN"],
  },

  NYC: {
    illustration: "new-york",
    heroBg: "#D7ECFF",
    airportsShort: "JFK · EWR",
    airports: [
      {
        code: "JFK",
        name: { tr: "John F. Kennedy", en: "John F. Kennedy", nl: "John F. Kennedy", de: "John F. Kennedy", fr: "John F. Kennedy", es: "John F. Kennedy", it: "John F. Kennedy" },
        side: { tr: "Queens · güneydoğu", en: "Queens · southeast", nl: "Queens · zuidoost", de: "Queens · Südosten", fr: "Queens · sud-est", es: "Queens · sureste", it: "Queens · sud-est" },
        tone: "ink",
        facts: [
          { tr: "Manhattan'a AirTrain + LIRR veya metro ile 45–60 dk", en: "45–60 min to Manhattan via AirTrain + LIRR or subway", nl: "45–60 min naar Manhattan via AirTrain + LIRR of metro", de: "45–60 Min. nach Manhattan mit AirTrain + LIRR oder U-Bahn", fr: "45 à 60 min vers Manhattan via AirTrain + LIRR ou métro", es: "45–60 min a Manhattan en AirTrain + LIRR o metro", it: "45–60 min per Manhattan con AirTrain + LIRR o metro" },
          { tr: "Avrupa'dan pek çok direkt transatlantik sefer buraya iner", en: "Main gateway for direct transatlantic flights from Europe", nl: "Belangrijkste aankomstpunt voor vluchten vanuit Europa", de: "Hauptziel für Direktflüge aus Europa", fr: "Principale porte d'entrée des vols directs depuis l'Europe", es: "Puerta principal de los vuelos directos desde Europa", it: "Porta principale per i voli diretti dall'Europa" },
          { tr: "Pasaport kontrolü yoğun saatlerde uzun sürebilir, pay bırak", en: "Immigration queues can be busy at peak times — allow buffer", nl: "Paspoortcontrole kan druk zijn — reken op extra tijd", de: "Die Einreise kann zu Stoßzeiten dauern — etwas Puffer einplanen", fr: "Le contrôle des passeports peut prendre du temps aux heures de pointe", es: "El control de pasaportes puede tardar en horas punta", it: "Il controllo passaporti può richiedere tempo nelle ore di punta" },
        ],
      },
      {
        code: "EWR",
        name: { tr: "Newark Liberty", en: "Newark Liberty", nl: "Newark Liberty", de: "Newark Liberty", fr: "Newark Liberty", es: "Newark Liberty", it: "Newark Liberty" },
        side: { tr: "New Jersey · batı", en: "New Jersey · west", nl: "New Jersey · west", de: "New Jersey · Westen", fr: "New Jersey · ouest", es: "Nueva Jersey · oeste", it: "New Jersey · ovest" },
        tone: "coral",
        facts: [
          { tr: "Manhattan Penn Station'a AirTrain + NJ Transit ile ~35 dk", en: "~35 min to Manhattan Penn Station via AirTrain + NJ Transit", nl: "~35 min naar Penn Station via AirTrain + NJ Transit", de: "~35 Min. zur Penn Station mit AirTrain + NJ Transit", fr: "~35 min jusqu'à Penn Station via AirTrain + NJ Transit", es: "~35 min a Penn Station en AirTrain + NJ Transit", it: "~35 min per Penn Station con AirTrain + NJ Transit" },
          { tr: "Midtown'ın batısına ulaşım sık sık JFK'den daha hızlı olur", en: "Often faster to West Midtown than JFK", nl: "Vaak sneller naar West Midtown dan vanaf JFK", de: "Oft schneller nach West Midtown als ab JFK", fr: "Souvent plus rapide vers l'ouest de Midtown que JFK", es: "A menudo más rápido hacia el oeste de Midtown que JFK", it: "Spesso più veloce verso Midtown ovest rispetto a JFK" },
          { tr: "United ve birçok Avrupa havayolu doğrudan uçar", en: "Served directly by United and several European carriers", nl: "Directe vluchten van United en diverse Europese maatschappijen", de: "Direktflüge von United und mehreren europäischen Airlines", fr: "Desservi directement par United et plusieurs compagnies européennes", es: "Vuelos directos de United y varias aerolíneas europeas", it: "Servito direttamente da United e varie compagnie europee" },
        ],
      },
    ],
    tips: [
      {
        character: "pasi",
        role: { tr: "Pasi · ABD belgesi", en: "Pasi · US entry check", nl: "Pasi · VS-reistip", de: "Pasi · USA-Einreise", fr: "Pasi · entrée aux États-Unis", es: "Pasi · entrada a EE. UU.", it: "Pasi · ingresso USA" },
        quote: { tr: "“ABD uçuşundan önce ESTA veya vize gerekliliğini en az birkaç gün önce tamamla.”", en: "“Sort out your ESTA or visa at least a few days before flying to the US.”", nl: "“Regel je ESTA of visum minstens een paar dagen voor vertrek naar de VS.”", de: "“Kümmere dich mindestens ein paar Tage vor Abflug um ESTA oder Visum.”", fr: "“Pense à faire ton ESTA ou visa quelques jours avant le départ.”", es: "“Tramita tu ESTA o visado al menos unos días antes de volar a EE. UU.”", it: "“Richiedi ESTA o visto con qualche giorno di anticipo prima di volare negli USA.”" },
      },
      BAG_TIP,
      {
        character: "bulut",
        role: { tr: "Bulut · zaman notu", en: "Bulut · timing tip", nl: "Bulut · timingtip", de: "Bulut · Zeittipp", fr: "Bulut · conseil timing", es: "Bulut · consejo de fechas", it: "Bulut · consiglio periodo" },
        quote: { tr: "“Ocak–Mart dönemi New York biletlerinin en sakin ve uygun olduğu aylardandır.”", en: "“January to March often brings the calmest fares to New York.”", nl: "“Januari tot maart biedt vaak de laagste prijzen naar New York.”", de: "“Von Januar bis März sind Flüge nach New York oft am günstigsten.”", fr: "“De janvier à mars, les billets pour New York sont souvent plus abordables.”", es: "“De enero a marzo suelen verse las tarifas más bajas a Nueva York.”", it: "“Da gennaio a marzo i biglietti per New York sono spesso più convenienti.”" },
      },
    ],
    others: ["LON", "PAR", "AMS", "LIS"],
  },

  ATH: {
    illustration: "sky",
    heroBg: "#EAF3FF",
    airportsShort: "ATH",
    airports: [
      {
        code: "ATH",
        name: { tr: "Eleftherios Venizelos", en: "Eleftherios Venizelos", nl: "Eleftherios Venizelos", de: "Eleftherios Venizelos", fr: "Elefthérios-Venizélos", es: "Eleftherios Venizelos", it: "Eleftherios Venizelos" },
        side: { tr: "Spata · doğu", en: "Spata · east", nl: "Spata · oost", de: "Spata · Osten", fr: "Spata · est", es: "Spata · este", it: "Spata · est" },
        tone: "ink",
        facts: [
          { tr: "Syntagma meydanına M3 metrosuyla yaklaşık 40 dk", en: "About 40 min to Syntagma Square on Metro Line 3", nl: "Ongeveer 40 min naar het Syntagmaplein met metrolijn 3", de: "Etwa 40 Min. zum Syntagma-Platz mit Metrolinie 3", fr: "Environ 40 min jusqu'à la place Syntagma par la ligne 3", es: "Unos 40 min hasta la plaza Syntagma en la línea 3 de metro", it: "Circa 40 min da piazza Syntagma con la metro linea 3" },
          { tr: "X95 ekspres otobüsü 24 saat şehir merkezine çalışır", en: "X95 express bus runs 24/7 to the city centre", nl: "De X95-snelbus rijdt 24 uur per dag naar het centrum", de: "Der Expressbus X95 fährt rund um die Uhr ins Zentrum", fr: "Le bus express X95 dessert le centre 24h/24", es: "El autobús exprés X95 funciona las 24 horas hacia el centro", it: "L'autobus espresso X95 collega il centro 24 ore su 24" },
          { tr: "Pire limanına (feribotlar) doğrudan X96 otobüsü gider", en: "X96 bus connects directly to Piraeus ferry port", nl: "Bus X96 rijdt rechtstreeks naar de haven van Piraeus", de: "Bus X96 fährt direkt zum Fährhafen Piräus", fr: "Le bus X96 relie directement le port du Pirée", es: "El autobús X96 conecta directamente con el puerto del Pireo", it: "Il bus X96 collega direttamente al porto del Pireo" },
        ],
      },
    ],
    tips: [
      {
        character: "gunes",
        role: { tr: "Güneş · Atina notu", en: "Güneş · Athens tip", nl: "Güneş · tip voor Athene", de: "Güneş · Athen-Tipp", fr: "Güneş · conseil Athènes", es: "Güneş · consejo Atenas", it: "Güneş · consiglio Atene" },
        quote: { tr: "“Akropolis'i serin sabah saatlerinde gezmek yaz sıcağında büyük rahatlık sağlar.”", en: "“Visiting the Acropolis early in the morning beats both heat and crowds.”", nl: "“Bezoek de Akropolis vroeg in de ochtend om de warmte en drukte voor te zijn.”", de: "“Die Akropolis frühmorgens zu besuchen spart Hitze und Gedränge.”", fr: "“Visiter l'Acropole tôt le matin évite la chaleur et la foule.”", es: "“Visitar la Acrópolis temprano evita el calor y las colas.”", it: "“Visitare l'Acropoli al mattino presto evita caldo e folla.”" },
      },
      BAG_TIP,
      PASSPORT_TIP,
    ],
    others: ["ROM", "IST", "BCN", "LIS"],
  },

  MAD: {
    illustration: "sky",
    heroBg: "#FFE8E0",
    airportsShort: "MAD",
    airports: [
      {
        code: "MAD",
        name: { tr: "Adolfo Suárez Madrid-Barajas", en: "Adolfo Suárez Madrid-Barajas", nl: "Adolfo Suárez Madrid-Barajas", de: "Adolfo Suárez Madrid-Barajas", fr: "Adolfo-Suárez Madrid-Barajas", es: "Adolfo Suárez Madrid-Barajas", it: "Adolfo Suárez Madrid-Barajas" },
        side: { tr: "Kuzeydoğu Madrid", en: "Northeast Madrid", nl: "Noordoost-Madrid", de: "Nordost-Madrid", fr: "Nord-est de Madrid", es: "Noreste de Madrid", it: "Nord-est di Madrid" },
        tone: "ink",
        facts: [
          { tr: "Şehir merkezine yaklaşık 13 km uzaklıkta", en: "About 13 km from central Madrid", nl: "Ongeveer 13 km van het centrum van Madrid", de: "Etwa 13 km vom Zentrum Madrids entfernt", fr: "Environ 13 km du centre de Madrid", es: "A unos 13 km del centro de Madrid", it: "Circa 13 km dal centro di Madrid" },
          { tr: "8 numaralı metro hattı tüm terminalleri Nuevos Ministerios'a bağlar", en: "Metro Line 8 links all terminals to Nuevos Ministerios", nl: "Metrolijn 8 verbindt alle terminals met Nuevos Ministerios", de: "Metrolinie 8 verbindet alle Terminals mit Nuevos Ministerios", fr: "La ligne 8 du métro relie tous les terminaux à Nuevos Ministerios", es: "La línea 8 de metro conecta todas las terminales con Nuevos Ministerios", it: "La linea 8 della metro collega tutti i terminal a Nuevos Ministerios" },
          { tr: "Exprés Aeropuerto otobüsü 24 saat Cibeles ve Atocha'ya gider", en: "Airport Express bus runs 24/7 to Cibeles and Atocha", nl: "De Airport Express-bus rijdt 24/7 naar Cibeles en Atocha", de: "Der Airport-Expressbus fährt 24/7 nach Cibeles und Atocha", fr: "Le bus Exprés Aeropuerto dessert Cibeles et Atocha 24h/24", es: "El Exprés Aeropuerto llega las 24 h a Cibeles y Atocha", it: "Il bus Exprés Aeropuerto raggiunge Cibeles e Atocha 24 ore su 24" },
        ],
      },
    ],
    tips: [
      {
        character: "gunes",
        role: { tr: "Güneş · Madrid notu", en: "Güneş · Madrid tip", nl: "Güneş · tip voor Madrid", de: "Güneş · Madrid-Tipp", fr: "Güneş · conseil Madrid", es: "Güneş · consejo Madrid", it: "Güneş · consiglio Madrid" },
        quote: { tr: "“Madrid'de akşam yemeği geç başlar; öğleden sonra Retiro Parkı'nda mola iyi gelir.”", en: "“Dinner starts late in Madrid — take a slow afternoon stroll in Retiro Park.”", nl: "“Dineren begint laat in Madrid — een rustige middag in Retiro Park past er perfect bij.”", de: "“In Madrid wird spät gegessen — ein Nachmittag im Retiro-Park passt perfekt.”", fr: "“À Madrid on dîne tard : profite de l'après-midi dans le parc du Retiro.”", es: "“En Madrid se cena tarde; una pausa por la tarde en el Retiro sienta genial.”", it: "“A Madrid si cena tardi: una pausa pomeridiana al Parco del Retiro è l'ideale.”" },
      },
      BAG_TIP,
      PASSPORT_TIP,
    ],
    others: ["BCN", "LIS", "ROM", "PAR"],
  },
};

export const CITY_HERO_ART: Record<string, { illustration: HeroArtKey; heroBg: string }> = {
  IST: { illustration: "istanbul", heroBg: "#FFD9C7" },
  SAW: { illustration: "istanbul", heroBg: "#FFD9C7" },
  AYT: { illustration: "antalya", heroBg: "#BFE3FF" },
  ADB: { illustration: "izmir", heroBg: "#D7ECFF" },
  ESB: { illustration: "ankara", heroBg: "#FFE2C6" },
  BJV: { illustration: "bodrum", heroBg: "#BFE3FF" },
  GZT: { illustration: "gaziantep", heroBg: "#FFE8B8" },
  TZX: { illustration: "trabzon", heroBg: "#D8F1E2" },
  ASR: { illustration: "kayseri", heroBg: "#D7ECFF" },
  LON: { illustration: "londra", heroBg: "#D7ECFF" },
  LHR: { illustration: "londra", heroBg: "#D7ECFF" },
  BCN: { illustration: "barselona", heroBg: "#FFE2C6" },
  ROM: { illustration: "roma", heroBg: "#FFE2C6" },
  FCO: { illustration: "roma", heroBg: "#FFE2C6" },
  LIS: { illustration: "lizbon", heroBg: "#FFE8B8" },
  PAR: { illustration: "paris", heroBg: "#FCE2EC" },
  CDG: { illustration: "paris", heroBg: "#FCE2EC" },
  AMS: { illustration: "amsterdam", heroBg: "#D7ECFF" },
  DXB: { illustration: "dubai", heroBg: "#FFE2C6" },
  NYC: { illustration: "new-york", heroBg: "#D7ECFF" },
  JFK: { illustration: "new-york", heroBg: "#D7ECFF" },
};

export function heroArtForDestination(code: string): { illustration: HeroArtKey; heroBg: string } {
  const clean = code.replace(/^city:/, "").toUpperCase();
  return CITY_HERO_ART[clean] ?? { illustration: "sky", heroBg: "#EAF3FF" };
}

export function guideForDestination(code: string): CityGuide | null {
  const clean = code.replace(/^city:/, "").toUpperCase();
  if (CITY_GUIDES[clean]) return CITY_GUIDES[clean];
  if (clean === "SAW") return CITY_GUIDES.IST;
  if (clean === "LHR" || clean === "LGW" || clean === "STN") return CITY_GUIDES.LON;
  if (clean === "FCO" || clean === "CIA") return CITY_GUIDES.ROM;
  if (clean === "CDG" || clean === "ORY") return CITY_GUIDES.PAR;
  if (clean === "JFK" || clean === "EWR" || clean === "LGA") return CITY_GUIDES.NYC;
  return null;
}
