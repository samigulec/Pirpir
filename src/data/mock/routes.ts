// Rota sayfası verisi — Destination.dc.html. Diğer şehirler aynı şablonu kullanır.
// Metinler dört dilde; sonra CMS'e taşınabilir. Şehir ve ülke adları havalimanı listesinden gelir.

export type CharacterKey = "marti" | "gunes" | "pasi" | "bulut" | "valiz" | "pirpir" | "biletcik";

/** Çok dilli metin */
export type L = { tr: string; en: string; nl: string; de: string; fr: string; es: string; it: string };

export type RouteData = {
  from: { slug: string; code: string };
  to: { slug: string; code: string; illustration: "istanbul" };
  directMins: number;
  airportsShort: string;
  airlines: string;
  timeDiff: L;
  /** Ocak → Aralık, en düşük gidiş-dönüş (TRY). */
  monthly: number[];
  defaultMonth: number;
  deals: { date: string; returnDate: string; nights: L; airline: string; stops: L; price: number }[];
  airports: { code: string; name: L; side: L; tone: "ink" | "coral"; facts: L[] }[];
  tips: { character: CharacterKey; role: L; quote: L }[];
  others: { code: string; price: number }[];
};

export const routes: RouteData[] = [
  {
    from: { slug: "amsterdam", code: "AMS" },
    to: { slug: "istanbul", code: "IST", illustration: "istanbul" },
    directMins: 215,
    airportsShort: "IST · SAW",
    airlines: "Turkish Airlines, Pegasus, KLM",
    timeDiff: { tr: "Yazın +1, kışın +2 saat", en: "+1 h in summer, +2 h in winter", nl: "+1 uur in de zomer, +2 in de winter", de: "+1 Std. im Sommer, +2 Std. im Winter", fr: "+1 h en été, +2 h en hiver", es: "+1 h en verano, +2 h en invierno", it: "+1 h in estate, +2 h in inverno" },
    monthly: [2650, 2480, 2790, 3150, 3380, 4120, 4680, 4590, 3720, 2980, 2390, 3260],
    defaultMonth: 10,
    deals: [
      { date: "2026-11-07", returnDate: "2026-11-14", nights: { tr: "7 gece", en: "7 nights", nl: "7 nachten", de: "7 Nächte", fr: "7 nuits", es: "7 noches", it: "7 notti" }, airline: "Pegasus", stops: { tr: "Direkt · SAW", en: "Direct · SAW", nl: "Direct · SAW", de: "Direkt · SAW", fr: "Direct · SAW", es: "Directo · SAW", it: "Diretto · SAW" }, price: 2390 },
      { date: "2026-11-14", returnDate: "2026-11-21", nights: { tr: "7 gece", en: "7 nights", nl: "7 nachten", de: "7 Nächte", fr: "7 nuits", es: "7 noches", it: "7 notti" }, airline: "Turkish Airlines", stops: { tr: "Direkt · IST", en: "Direct · IST", nl: "Direct · IST", de: "Direkt · IST", fr: "Direct · IST", es: "Directo · IST", it: "Diretto · IST" }, price: 2620 },
      { date: "2026-11-21", returnDate: "2026-11-24", nights: { tr: "Hafta sonu · 3 gece", en: "Weekend · 3 nights", nl: "Weekend · 3 nachten", de: "Wochenende · 3 Nächte", fr: "Week-end · 3 nuits", es: "Fin de semana · 3 noches", it: "Weekend · 3 notti" }, airline: "Pegasus", stops: { tr: "Direkt · SAW", en: "Direct · SAW", nl: "Direct · SAW", de: "Direkt · SAW", fr: "Direct · SAW", es: "Directo · SAW", it: "Diretto · SAW" }, price: 2540 },
      { date: "2026-11-28", returnDate: "2026-12-05", nights: { tr: "7 gece", en: "7 nights", nl: "7 nachten", de: "7 Nächte", fr: "7 nuits", es: "7 noches", it: "7 notti" }, airline: "KLM", stops: { tr: "Direkt · IST", en: "Direct · IST", nl: "Direct · IST", de: "Direkt · IST", fr: "Direct · IST", es: "Directo · IST", it: "Diretto · IST" }, price: 2890 },
    ],
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
          { tr: "Pegasus uçuşları genelde buraya iner", en: "Pegasus flights usually land here", nl: "Pegasus-vluchten landen meestal hier", de: "Pegasus-Flüge landen meistens hier", fr: "Les vols Pegasus atterrissent généralement ici", es: "Los vuelos de Pegasus suelen aterrizar aquí", it: "Di solito qui atterrano i voli Pegasus" },
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
      {
        character: "pasi",
        role: { tr: "Pasi · belge dostu", en: "Pasi · document buddy", nl: "Pasi · documentenmaatje", de: "Pasi · Dokumentenfreund", fr: "Pasi · ami des documents", es: "Pasi · amigo de los documentos", it: "Pasi · amico dei documenti" },
        quote: { tr: "“Yola çıkmadan pasaportunun geçerlilik tarihini kontrol et.”", en: "“Check your passport's expiry date before you go.”", nl: "“Controleer de geldigheid van je paspoort voor vertrek.”", de: "“Prüf vor der Abreise, wie lange dein Reisepass noch gültig ist.”", fr: "“Vérifie la date d'expiration de ton passeport avant de partir.”", es: "“Revisa la fecha de caducidad de tu pasaporte antes de salir.”", it: "“Prima di partire controlla la scadenza del tuo passaporto.”" },
      },
    ],
    others: [
      { code: "AYT", price: 3090 },
      { code: "ADB", price: 3420 },
      { code: "ESB", price: 3250 },
      { code: "ASR", price: 3680 },
      { code: "TZX", price: 3990 },
    ],
  },
];

export const pick = (l: L, locale: string) => l[(locale as keyof L) in l ? (locale as keyof L) : "tr"];
