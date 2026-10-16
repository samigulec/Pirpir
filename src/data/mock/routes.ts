// Rota sayfası verisi — Destination.dc.html. Diğer şehirler aynı şablonu kullanır.
// Metinler üç dilde; sonra CMS'e taşınabilir. Şehir ve ülke adları havalimanı listesinden gelir.

export type CharacterKey = "marti" | "gunes" | "pasi" | "bulut" | "valiz" | "pirpir" | "biletcik";

/** Çok dilli metin */
export type L = { tr: string; en: string; nl: string };

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
    timeDiff: { tr: "Yazın +1, kışın +2 saat", en: "+1 h in summer, +2 h in winter", nl: "+1 uur in de zomer, +2 in de winter" },
    monthly: [2650, 2480, 2790, 3150, 3380, 4120, 4680, 4590, 3720, 2980, 2390, 3260],
    defaultMonth: 10,
    deals: [
      { date: "2026-11-07", returnDate: "2026-11-14", nights: { tr: "7 gece", en: "7 nights", nl: "7 nachten" }, airline: "Pegasus", stops: { tr: "Direkt · SAW", en: "Direct · SAW", nl: "Direct · SAW" }, price: 2390 },
      { date: "2026-11-14", returnDate: "2026-11-21", nights: { tr: "7 gece", en: "7 nights", nl: "7 nachten" }, airline: "Turkish Airlines", stops: { tr: "Direkt · IST", en: "Direct · IST", nl: "Direct · IST" }, price: 2620 },
      { date: "2026-11-21", returnDate: "2026-11-24", nights: { tr: "Hafta sonu · 3 gece", en: "Weekend · 3 nights", nl: "Weekend · 3 nachten" }, airline: "Pegasus", stops: { tr: "Direkt · SAW", en: "Direct · SAW", nl: "Direct · SAW" }, price: 2540 },
      { date: "2026-11-28", returnDate: "2026-12-05", nights: { tr: "7 gece", en: "7 nights", nl: "7 nachten" }, airline: "KLM", stops: { tr: "Direkt · IST", en: "Direct · IST", nl: "Direct · IST" }, price: 2890 },
    ],
    airports: [
      {
        code: "IST",
        name: { tr: "İstanbul Havalimanı", en: "Istanbul Airport", nl: "Luchthaven Istanbul" },
        side: { tr: "Avrupa yakası", en: "European side", nl: "Europese kant" },
        tone: "ink",
        facts: [
          { tr: "Taksim'e yaklaşık 40 km", en: "About 40 km to Taksim", nl: "Ongeveer 40 km naar Taksim" },
          { tr: "Şehre M11 metro ve Havaist otobüsleriyle", en: "To the city by M11 metro and Havaist buses", nl: "Naar de stad met metro M11 en Havaist-bussen" },
          { tr: "Turkish Airlines ve KLM uçuşları buraya iner", en: "Turkish Airlines and KLM flights land here", nl: "Vluchten van Turkish Airlines en KLM landen hier" },
        ],
      },
      {
        code: "SAW",
        name: { tr: "Sabiha Gökçen", en: "Sabiha Gökçen", nl: "Sabiha Gökçen" },
        side: { tr: "Anadolu yakası", en: "Asian side", nl: "Aziatische kant" },
        tone: "coral",
        facts: [
          { tr: "Kadıköy'e yaklaşık 40 km", en: "About 40 km to Kadıköy", nl: "Ongeveer 40 km naar Kadıköy" },
          { tr: "Şehre M4 metro ve Havabüs ile", en: "To the city by M4 metro and Havabüs", nl: "Naar de stad met metro M4 en Havabüs" },
          { tr: "Pegasus uçuşları genelde buraya iner", en: "Pegasus flights usually land here", nl: "Pegasus-vluchten landen meestal hier" },
        ],
      },
    ],
    tips: [
      {
        character: "marti",
        role: { tr: "Martı · İstanbul rehberi", en: "Martı · Istanbul guide", nl: "Martı · gids voor Istanbul" },
        quote: { tr: "“Vapura binip simit atmadan dönme, söz mü?”", en: "“Don't leave without a ferry ride and a simit, promise?”", nl: "“Ga niet terug zonder een boottocht en een simit, beloofd?”" },
      },
      {
        character: "gunes",
        role: { tr: "Güneş · hava durumu", en: "Güneş · weather", nl: "Güneş · het weer" },
        quote: { tr: "“Sonbaharda İstanbul ılıktır, yanına ince bir ceket al.”", en: "“Istanbul is mild in autumn, pack a light jacket.”", nl: "“In de herfst is Istanbul zacht, neem een dun jasje mee.”" },
      },
      {
        character: "pasi",
        role: { tr: "Pasi · belge dostu", en: "Pasi · document buddy", nl: "Pasi · documentenmaatje" },
        quote: { tr: "“Yola çıkmadan pasaportunun geçerlilik tarihini kontrol et.”", en: "“Check your passport's expiry date before you go.”", nl: "“Controleer de geldigheid van je paspoort voor vertrek.”" },
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
