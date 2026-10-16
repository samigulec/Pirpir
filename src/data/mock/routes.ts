// Örnek rota sayfası verisi — Destination.dc.html. Diğer şehirler aynı şablonu kullanır.
// Metinler şimdilik Türkçe içerik olarak burada; sonra CMS/çeviri dosyalarına taşınacak.

export type CharacterKey = "marti" | "gunes" | "pasi" | "bulut" | "valiz" | "pirpir" | "biletcik";

export type RouteData = {
  from: { slug: string; city: string; ablative: string };
  to: { slug: string; city: string; dative: string; country: string; countryLocative: string; illustration: "istanbul" };
  directMins: number;
  airportsShort: string;
  airlines: string;
  timeDiff: string;
  /** Ocak → Aralık, en düşük gidiş-dönüş (TRY). */
  monthly: number[];
  defaultMonth: number;
  deals: { dates: string; nights: string; airline: string; stops: string; price: number }[];
  airports: { code: string; name: string; side: string; tone: "ink" | "coral"; facts: string[] }[];
  tips: { character: CharacterKey; name: string; quote: string }[];
  others: { city: string; price: number }[];
};

export const routes: RouteData[] = [
  {
    from: { slug: "amsterdam", city: "Amsterdam", ablative: "Amsterdam'dan" },
    to: { slug: "istanbul", city: "İstanbul", dative: "İstanbul'a", country: "Türkiye", countryLocative: "Türkiye'de", illustration: "istanbul" },
    directMins: 215,
    airportsShort: "IST · SAW",
    airlines: "Turkish Airlines, Pegasus, KLM",
    timeDiff: "Yazın +1, kışın +2 saat",
    monthly: [2650, 2480, 2790, 3150, 3380, 4120, 4680, 4590, 3720, 2980, 2390, 3260],
    defaultMonth: 10,
    deals: [
      { dates: "7 – 14 Kasım", nights: "7 gece", airline: "Pegasus", stops: "Direkt · SAW", price: 2390 },
      { dates: "14 – 21 Kasım", nights: "7 gece", airline: "Turkish Airlines", stops: "Direkt · IST", price: 2620 },
      { dates: "21 – 24 Kasım", nights: "Hafta sonu · 3 gece", airline: "Pegasus", stops: "Direkt · SAW", price: 2540 },
      { dates: "28 Kas – 5 Ara", nights: "7 gece", airline: "KLM", stops: "Direkt · IST", price: 2890 },
    ],
    airports: [
      { code: "IST", name: "İstanbul Havalimanı", side: "Avrupa yakası", tone: "ink", facts: ["Taksim'e yaklaşık 40 km", "Şehre M11 metro ve Havaist otobüsleriyle", "Turkish Airlines ve KLM uçuşları buraya iner"] },
      { code: "SAW", name: "Sabiha Gökçen", side: "Anadolu yakası", tone: "coral", facts: ["Kadıköy'e yaklaşık 40 km", "Şehre M4 metro ve Havabüs ile", "Pegasus uçuşları genelde buraya iner"] },
    ],
    tips: [
      { character: "marti", name: "Martı · İstanbul rehberi", quote: "“Vapura binip simit atmadan dönme, söz mü?”" },
      { character: "gunes", name: "Güneş · hava durumu", quote: "“Sonbaharda İstanbul ılıktır, yanına ince bir ceket al.”" },
      { character: "pasi", name: "Pasi · belge dostu", quote: "“Yola çıkmadan pasaportunun geçerlilik tarihini kontrol et.”" },
    ],
    others: [
      { city: "Antalya", price: 3090 },
      { city: "İzmir", price: 3420 },
      { city: "Ankara", price: 3250 },
      { city: "Kayseri", price: 3680 },
      { city: "Trabzon", price: 3990 },
    ],
  },
];
