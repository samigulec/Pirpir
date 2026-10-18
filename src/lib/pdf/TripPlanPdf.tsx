import path from "node:path";
import { Circle, Document, Ellipse, Font, Image, Page, Path, Rect, StyleSheet, Svg, Text, View, renderToBuffer } from "@react-pdf/renderer";

// PDF'te tarayıcı yazı tipleri yok: Türkçe harfleri ve ₺ simgesini içeren Nunito dosyaları gömülür.
// (Fredoka'nın dosyasında ğ, ş, İ ve ₺ olmadığı için başlıklarda da Nunito kullanılır.)
const FONT_DIR = path.join(process.cwd(), "assets/fonts");

function registerFonts() {
  Font.register({
    family: "Nunito",
    fonts: [
      { src: path.join(FONT_DIR, "Nunito_400Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "Nunito_600SemiBold.ttf"), fontWeight: 600 },
      { src: path.join(FONT_DIR, "Nunito_700Bold.ttf"), fontWeight: 700 },
      { src: path.join(FONT_DIR, "Nunito_800ExtraBold.ttf"), fontWeight: 800 },
    ],
  });
}
// Kelimeler hecelenmesin (tire eklenmesin)
Font.registerHyphenationCallback((word) => [word]);

let queue: Promise<unknown> = Promise.resolve();

/**
 * PDF'i çizer. Yazı tipi nesneleri belgeler arasında paylaşılınca sonraki PDF'lerde bazı harflerin
 * kaybolduğu görüldü; bu yüzden çizimler sırayla yapılır ve yazı tipleri her seferinde dosyadan taze yüklenir.
 */
export function renderPlanPdf(d: PlanData): Promise<Buffer> {
  const run = queue.then(() => {
    // Yalnız kendi yazı tipimiz yenilenir (varsayılan Helvetica kayıtlı kalmalı)
    delete Font.getRegisteredFonts().Nunito;
    registerFonts();
    return renderToBuffer(<TripPlanPdf d={d} />);
  });
  queue = run.catch(() => undefined);
  return run;
}

const C = {
  ink: "#1E2A44",
  muted: "#56607A",
  primary: "#2F5BD3",
  sky: "#EAF3FF",
  field: "#F5F8FD",
  line: "#E3E8F2",
  sun: "#FFD166",
  sunSoft: "#FFF4D6",
  sunText: "#8A5A00",
  coral: "#FF8A65",
  greenSoft: "#E4F4EA",
  greenText: "#2E7A4D",
};

/** PDF'e giden, önceden çevrilip biçimlenmiş metinler (bileşen next-intl'den bağımsızdır). */
export type PlanSegment = { flight: string; route: string; times: string; aircraft?: string; layover?: string };
export type PlanLeg = {
  title: string;
  airline: string;
  /** Havayolu logosu: sayfada adres, PDF'te PNG veri adresi (SVG PDF'e doğrudan konamaz) */
  logo?: string;
  dep: string;
  arr: string;
  nextDay?: string;
  fromCode: string;
  toCode: string;
  fromCity: string;
  toCity: string;
  duration: string;
  stops: string;
  segments: PlanSegment[];
};
export type PlanData = {
  brand: string;
  lang: string;
  docTitle: string;
  route: string;
  pnrLabel: string;
  pnr: string;
  status: { text: string; tone: "green" | "sun" | "muted" };
  sample?: string;
  facts: { label: string; value: string }[];
  legs: PlanLeg[];
  passengersTitle: string;
  passengerCol: string;
  bagsCol: string;
  passengers: { name: string; bags: string }[];
  bagNotes: string[];
  rulesTitle: string;
  rules: string[];
  infoTitle: string;
  info: string[];
  note: string;
  footer: string;
};

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 54, paddingHorizontal: 36, fontFamily: "Nunito", fontSize: 10, color: C.ink, lineHeight: 1.35 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  brand: { fontSize: 20, fontWeight: 800 },
  docTitle: { fontSize: 13, fontWeight: 800, color: C.muted, letterSpacing: 1.2 },
  hero: { flexDirection: "row", backgroundColor: C.sky, borderRadius: 16, padding: 16, gap: 14, alignItems: "center" },
  route: { fontSize: 22, fontWeight: 800, lineHeight: 1.15 },
  sample: { marginTop: 4, fontSize: 9, fontWeight: 700, color: C.muted },
  pnrBox: { backgroundColor: "#FFFFFF", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14, alignItems: "center", minWidth: 150 },
  label: { fontSize: 8, fontWeight: 800, color: C.muted, letterSpacing: 0.6 },
  pnr: { fontSize: 20, fontWeight: 800, letterSpacing: 3, marginTop: 2, lineHeight: 1.2 },
  chip: { marginTop: 7, borderRadius: 99, paddingVertical: 3, paddingHorizontal: 10, fontSize: 9, fontWeight: 800 },
  facts: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, borderWidth: 1.5, borderColor: C.line, borderRadius: 12 },
  fact: { paddingVertical: 8, paddingHorizontal: 10 },
  factValue: { fontSize: 10.5, fontWeight: 700, marginTop: 1 },
  leg: { marginTop: 12, borderWidth: 1.5, borderColor: C.line, borderRadius: 14, overflow: "hidden" },
  legHead: { flexDirection: "row", justifyContent: "space-between", backgroundColor: C.field, paddingVertical: 6, paddingHorizontal: 12 },
  legTitle: { fontSize: 9.5, fontWeight: 800, letterSpacing: 0.6 },
  legAirline: { fontSize: 9.5, fontWeight: 700, color: C.muted },
  legMain: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12 },
  end: { width: 150 },
  time: { fontSize: 22, fontWeight: 800, lineHeight: 1.1 },
  code: { fontSize: 11, fontWeight: 800, marginTop: 2 },
  city: { fontSize: 9.5, color: C.muted },
  mid: { flex: 1, alignItems: "center", paddingHorizontal: 6 },
  midText: { fontSize: 9, fontWeight: 700, color: C.muted },
  seg: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 5, paddingHorizontal: 12, fontSize: 9 },
  layover: { borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.sunSoft, paddingVertical: 4, paddingHorizontal: 12, fontSize: 9, fontWeight: 700, color: C.sunText },
  section: { marginTop: 14 },
  h2: { fontSize: 11.5, fontWeight: 800, marginBottom: 5 },
  tableHead: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: C.line, paddingBottom: 3 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 5 },
  cols: { flexDirection: "row", gap: 14, marginTop: 14 },
  box: { flex: 1, borderRadius: 12, padding: 11 },
  bullet: { flexDirection: "row", gap: 5, marginTop: 3 },
  note: { marginTop: 12, fontSize: 9, color: C.muted },
  footer: { position: "absolute", bottom: 22, left: 36, right: 36, fontSize: 8, color: C.muted, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6 },
});

/** Logo işareti: sevinen Pırpır (sitedeki logo ile aynı çizim). `size` yüksekliktir. */
function LogoMark({ size = 22 }: { size?: number }) {
  const line = { stroke: C.ink, strokeWidth: 4, strokeLinejoin: "round" as const };
  return (
    <Svg width={size * 1.57} height={size} viewBox="16 14 176 112">
      <Path d="M70 52 L 95 18 L 118 22 L 108 54 Z" fill="#9CC3FF" {...line} />
      <Path d="M34 58 L 20 26 L 40 26 L 58 52 Z" fill={C.coral} {...line} />
      <Rect x="24" y="46" width="146" height="56" rx="28" fill="#FFFFFF" {...line} />
      <Circle cx="52" cy="68" r="6" fill="#9CC3FF" />
      <Circle cx="72" cy="68" r="6" fill="#9CC3FF" />
      <Path d="M112 66 Q 118 60 124 66" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      <Path d="M140 66 Q 146 60 152 66" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      <Ellipse cx="110" cy="82" rx="7" ry="4.5" fill="#FFB4A2" />
      <Ellipse cx="156" cy="82" rx="7" ry="4.5" fill="#FFB4A2" />
      <Path d="M124 78 Q 132 94 140 78 Z" fill={C.ink} />
      <Path d="M84 84 L 70 122 L 100 122 L 112 88 Z" fill="#5B8DEF" {...line} />
      <Circle cx="176" cy="74" r="7" fill={C.sun} stroke={C.ink} strokeWidth={4} />
      <Ellipse cx="184" cy="56" rx="4" ry="13" fill={C.sun} stroke={C.ink} strokeWidth={3} />
      <Ellipse cx="184" cy="92" rx="4" ry="13" fill={C.sun} stroke={C.ink} strokeWidth={3} />
    </Svg>
  );
}

/** Kalkış ile varış arasındaki çizgi: iki uç noktası ve ortada uçak simgesi. */
function FlightLine() {
  return (
    <Svg width={150} height={14} viewBox="0 0 150 14" style={{ marginVertical: 3 }}>
      <Path d="M6 7 H144" stroke={C.line} strokeWidth={2} strokeDasharray="4 4" />
      <Circle cx="5" cy="7" r="3.5" fill={C.primary} />
      <Circle cx="145" cy="7" r="3.5" fill={C.coral} />
      <Path d="M68 7 L84 7 M78 2 L84 7 L78 12 M71 4 L73 7 L71 10" stroke={C.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

// Yolcular · tarih · e-posta (en uzun) · toplam
const FACT_WIDTHS = ["22%", "22%", "36%", "20%"];

const tones = {
  green: { backgroundColor: C.greenSoft, color: C.greenText },
  sun: { backgroundColor: C.sunSoft, color: C.sunText },
  muted: { backgroundColor: C.line, color: C.muted },
};

export function TripPlanPdf({ d }: { d: PlanData }) {
  // Büyük harf dile göre (tr: "tarihi" → "TARİHİ"); PDF çizicisinin büyük harf dönüşümü bunu bilmez
  const up = (text: string) => text.toLocaleUpperCase(d.lang);
  return (
    <Document title={`${d.docTitle} · ${d.route}`} author={d.brand} creator={d.brand} producer={d.brand} language={d.lang}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.brandRow}>
            <LogoMark />
            {/* Yazı logosu: dördüncü harf mercan (sitedeki gibi) */}
            <Text style={s.brand}>
              {d.brand.slice(0, 3)}
              <Text style={{ color: C.coral }}>{d.brand.slice(3, 4)}</Text>
              {d.brand.slice(4)}
            </Text>
          </View>
          <Text style={s.docTitle}>{up(d.docTitle)}</Text>
        </View>

        <View style={s.hero}>
          <View style={{ flex: 1 }}>
            <Text style={s.route}>{d.route}</Text>
            {d.sample && <Text style={s.sample}>{d.sample}</Text>}
          </View>
          <View style={s.pnrBox}>
            <Text style={s.label}>{up(d.pnrLabel)}</Text>
            <Text style={s.pnr}>{d.pnr}</Text>
            <View style={[s.chip, tones[d.status.tone]]}>
              <Text>{d.status.text}</Text>
            </View>
          </View>
        </View>

        <View style={s.facts}>
          {d.facts.map((f, i) => (
            <View key={f.label} style={[s.fact, { width: FACT_WIDTHS[i] ?? "25%" }]}>
              <Text style={s.label}>{up(f.label)}</Text>
              {/* Sütuna sığmayan uzun e-posta "@" işaretinden alt satıra geçer (tire eklenmeden) */}
              <Text style={s.factValue}>{f.value.length > 28 && f.value.includes("@") ? f.value.replace("@", "\n@") : f.value}</Text>
            </View>
          ))}
        </View>

        {d.legs.map((leg) => (
          <View key={leg.title} style={s.leg} wrap={false}>
            <View style={s.legHead}>
              <Text style={s.legTitle}>{up(leg.title)}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                {leg.logo?.startsWith("data:image/png") && <Image src={leg.logo} style={{ width: 13, height: 13 }} />}
                <Text style={s.legAirline}>{leg.airline}</Text>
              </View>
            </View>
            <View style={s.legMain}>
              <View style={s.end}>
                <Text style={s.time}>{leg.dep}</Text>
                <Text style={s.code}>{leg.fromCode}</Text>
                <Text style={s.city}>{leg.fromCity}</Text>
              </View>
              <View style={s.mid}>
                <Text style={s.midText}>{leg.duration}</Text>
                <FlightLine />
                <Text style={s.midText}>{leg.stops}</Text>
              </View>
              <View style={[s.end, { alignItems: "flex-end" }]}>
                <Text style={s.time}>
                  {leg.arr}
                  {leg.nextDay && <Text style={{ fontSize: 9, color: "#A3402A" }}> {leg.nextDay}</Text>}
                </Text>
                <Text style={s.code}>{leg.toCode}</Text>
                <Text style={[s.city, { textAlign: "right" }]}>{leg.toCity}</Text>
              </View>
            </View>
            {leg.segments.map((g, i) => (
              <View key={i}>
                <View style={s.seg}>
                  <Text style={{ width: 120, fontWeight: 800 }}>{g.flight}</Text>
                  <Text style={{ width: 90, fontWeight: 700 }}>{g.route}</Text>
                  <Text style={{ width: 120 }}>{g.times}</Text>
                  <Text style={{ flex: 1, color: C.muted, textAlign: "right" }}>{g.aircraft ?? ""}</Text>
                </View>
                {g.layover && <Text style={s.layover}>{g.layover}</Text>}
              </View>
            ))}
          </View>
        ))}

        {d.passengers.length > 0 && (
          <View style={s.section} wrap={false}>
            <Text style={s.h2}>{d.passengersTitle}</Text>
            <View style={s.tableHead}>
              <Text style={[s.label, { flex: 1 }]}>{up(d.passengerCol)}</Text>
              <Text style={[s.label, { flex: 1.3 }]}>{up(d.bagsCol)}</Text>
            </View>
            {d.passengers.map((p, i) => (
              <View key={i} style={s.row}>
                <Text style={{ flex: 1, fontWeight: 700 }}>{p.name}</Text>
                <Text style={{ flex: 1.3 }}>{p.bags}</Text>
              </View>
            ))}
            {d.bagNotes.map((n) => (
              <Text key={n} style={{ marginTop: 4, fontSize: 8.5, color: C.muted }}>{n}</Text>
            ))}
          </View>
        )}

        <View style={s.cols} wrap={false}>
          {d.rules.length > 0 && (
            <View style={[s.box, { backgroundColor: C.field }]}>
              <Text style={s.h2}>{d.rulesTitle}</Text>
              {d.rules.map((r) => (
                <View key={r} style={s.bullet}>
                  <Text>•</Text>
                  <Text style={{ flex: 1 }}>{r}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={[s.box, { backgroundColor: C.sunSoft }]}>
            <Text style={s.h2}>{d.infoTitle}</Text>
            {d.info.map((r) => (
              <View key={r} style={s.bullet}>
                <Text>•</Text>
                <Text style={{ flex: 1 }}>{r}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={s.note}>{d.note}</Text>

        <Text style={s.footer} fixed>{d.footer}</Text>
      </Page>
    </Document>
  );
}
