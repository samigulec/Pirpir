# pirpir — Uçuş bileti platformu

Sade, sevimli, karakterli bir uçuş bileti sitesi. Hedef: kullanıcıya inanılmaz basit bir akış (Ara → Seç → Öde → Uç). Marka adı "pirpir"dir, logo işareti ana karakter Pırpır; ad tek bir yerden değiştirilir (`src/config/brand.ts`).

## Altın kural: tasarıma birebir sadakat

`design/` klasöründeki `.dc.html` dosyaları onaylanmış tasarımdır. Her sayfa bunlarla **piksel piksel aynı** görünmelidir: renkler, yazı tipleri, boyutlar, boşluklar, köşe yuvarlaklıkları, metinler (Türkçe kopya dahil) ve etkileşimler.

- Bir sayfayı kodlamadan önce ilgili `.dc.html` dosyasını baştan sona oku.
- Bu dosyalar özel bir şablon formatı kullanır; React'e şöyle çevir:
  - `<x-dc>` … `</x-dc>` içi = sayfanın JSX'i. `<helmet>` içindeki font linki ve stiller → global CSS / `next/font`.
  - `{{isim}}` = `renderVals()` fonksiyonunun döndürdüğü değer → React state/props.
  - `<sc-for list="{{x}}" as="y">` → `x.map(y => …)`; `<sc-if value="{{k}}">` → `{k && …}`.
  - `onClick="{{fn}}"` → `onClick={fn}`.
  - En alttaki `<script type="text/x-dc">` içindeki `class Component extends DCLogic` = sayfanın mantığı (state, örnek veri, fiyat formatlama). Buradaki state ve hesaplamaları React hook'larına taşı.
  - Satır içi `style="…"` değerlerini Tailwind sınıflarına çevir; tam eşleşme yoksa Tailwind'in köşeli parantezli değerlerini kullan (`rounded-[28px]`, `text-[17px]`). Tasarımdan sapma yok.
- Her sayfayı bitirince tarayıcıda tasarım dosyasıyla yan yana açıp karşılaştır (1440 px masaüstü ve 390 px telefon genişliğinde).

## Teknoloji

- Next.js (App Router) + React + TypeScript (strict)
- Tailwind CSS — tasarım değerleri `tailwind.config` içinde token olarak
- Yazı tipleri: `next/font/google` ile **Fredoka** (500/600/700, başlıklar, fiyatlar, butonlar) ve **Nunito** (400/600/700/800, gövde metni)
- SVG'ler `assets/` klasöründen React bileşenine dönüştürülür (`src/components/characters/Pirpir.tsx` vb.). Çizimler değiştirilmez.
- Şimdilik veri: `src/data/mock/*.ts` içinde örnek veri (tasarım dosyalarındaki değerler). Sonradan gerçek API'ye geçilecek; veri erişimini `src/lib/flights.ts` gibi tek bir katmanda topla.

## Tasarım tokenları

Renkler:
| Token | Hex | Kullanım |
|---|---|---|
| ink | #1E2A44 | Ana metin, çizgiler, koyu kutular |
| muted | #56607A | İkincil metin |
| primary | #2F5BD3 | Ana buton (beyaz metin), linkler |
| primary-dark | #1E3F9E | Link hover |
| sky | #EAF3FF | Açık mavi zemin (hero, kartlar) |
| field | #F5F8FD | Form alanı ve çip zemini |
| line | #E3E8F2 | Kenarlıklar |
| sun | #FFD166 | Sarı vurgu, ikincil buton (lacivert metin) |
| sun-soft | #FFF4D6 / #FFF1C9 | Sarı kart zemini |
| coral | #FF8A65 | Valiz, vurgular |
| coral-soft | #FFE8E0 | Mercan kart zemini |
| cheek | #FFB4A2 | Karakter yanakları |
| blue-soft | #9CC3FF / #CFE0FF | Çizim ve grafik |
| plum | #B5446E | Pasi |
| green | #4CAF7A / #2E7A4D (metin) | Onay, Biletçik |
| green-soft | #E4F4EA | Yeşil kart zemini |
| pink-soft | #F6E6EE | Pasi kart zemini |

Köşe yuvarlaklıkları: 999px (hap butonlar), 40px (hero blokları), 28–32px (kartlar), 18–24px (form alanları, küçük kartlar).
Gölge (arama kutusu): `0 18px 48px rgba(47,91,211,0.14)`.
İçerik genişliği: ana sayfa 1120px, form sayfaları 720px, sonuçlar 880px; yatay boşluk 24px.
Dokunma hedefleri en az 44px. Metin kontrastı en az 4.5:1.

## Sayfalar ve rotalar

| Tasarım dosyası | Rota | Not |
|---|---|---|
| `Main.dc.html` | `/` | Hero + arama, güven satırı, popüler uçuşlar (kategori filtresi), karakter ipuçları, popüler rotalar, 3 adım, fiyat alarmı, SSS, footer |
| `Destination.dc.html` | `/ucuslar/[nereden]/[nereye]` (örn. `/ucuslar/amsterdam/istanbul`) | Rota sayfası; aylık fiyat grafiği, en ucuz tarihler, havalimanları, ipuçları. Diğer şehirler için şablon olacak, SEO için statik üretilsin |
| `Results.dc.html` | `/ara?from=…&to=…&date=…` | Sıralama: En ucuz / En hızlı / Sadece direkt |
| `Booking.dc.html` | `/rezervasyon/[teklifId]` | Yolcu, iletişim, bagaj, ödeme (Kart / iDEAL / Apple Pay / Google Pay), indirim kodu, koşul onayı |
| `Confirm.dc.html` | `/rezervasyon/[id]/onay` | Bilet hazır ekranı |
| `Mobile.dc.html` | — | Ana sayfanın telefon görünümü referansı; `/` 390px'te buna benzemeli |
| `Characters.dc.html` | `/karakterler` (isteğe bağlı) | Karakter rehberi; reklamlar için referans |

## Etkileşimler (hepsi çalışmalı)

- **Para birimi** (₺ TRY / € EUR / $ USD): her sayfanın başlığında. Seçim global olmalı (Context + `localStorage` + URL/çerez) ve tüm fiyatlar anında çevrilmeli. Format: `₺2.760` (tr-TR binlik ayırıcı). Örnek kurlar: EUR = TRY/40, USD = TRY/34.5 — `src/lib/currency.ts` içinde, sonra canlı kur servisine bağlanacak.
- **Dil seçici** (Türkçe / English / Nederlands): şimdilik arayüz; metinleri baştan `next-intl` gibi bir yapıyla anahtarlara koy.
- **Arama kutusu:** Gidiş-dönüş / Tek yön (tek yönde dönüş tarihi gizlenir), Nereden ↔ Nereye değiştir butonu, yolcu seçimi (yetişkin / çocuk / bebek).
- **Popüler uçuşlar filtresi:** Tümü / Türkiye / Avrupa / Deniz & güneş / Şehir turu.
- **Fiyat alarmı formu:** gönderince teşekkür mesajı.
- **SSS:** açılır/kapanır (`<details>`).
- **Rota sayfası:** ay çubuğuna tıklayınca o ayın fiyatı ve en ucuz aya göre farkı gösterilir.
- **Sonuçlar:** sıralama sekmeleri; "En ucuz" / "En hızlı" rozetleri otomatik hesaplanır; aktarmalı uçuşta aktarma yeri ve bekleme süresi gösterilir.
- **Rezervasyon:** bagaj seçimi toplamı günceller; kart numarası 4'lü gruplanır ve kart türü (4 → Visa, 5/2 → Mastercard, 3 → Amex) tanınır; iDEAL seçilince banka listesi açılır; indirim kodu fiyat dökümüne eklenir; koşullar işaretlenmeden ödeme butonu pasiftir; buton metni yönteme ve tutara göre değişir.
- **Onay:** "Hatırlat" butonu açılıp kapanır.

## Karakterler (assets/characters)

Pırpır (uçak, ana karakter, fiyat bekçisi), Bulut (fırsat avcısı), Valiz (bagaj uzmanı), Pasi (pasaport, belge dostu), Biletçik (biniş kartı, check-in), Güneş (tatil), Martı (İstanbul rehberi). Hepsi aynı lacivert (#1E2A44) çizgi ve pembe yanak stilinde. Bir yerde en fazla iki karakter; karakter her zaman kısa, tırnak içinde konuşur.

## Önemli kısıtlar

- Gerçek havayolu ya da ödeme markası logosu çizme veya taklit etme. Ödeme simgeleri `assets/payment/` içindeki özgün simgelerdir; resmi logo dosyaları gelirse onların yanına eklenecek.
- Uydurma istatistik veya vaat yazma. Köşeli parantezli yer tutucular (`[İPTAL KOŞULLARI]`, `[DESTEK SAATLERİ]`, `[DESTEK TELEFONU]`, `[PNR]`) olduğu gibi kalsın.
- Fiyatlar örnek veridir; arayüzde "örnek" notları tasarımdaki gibi kalsın.
- Erişilebilirlik: gerçek `<button>`, `<a>`, `<label>` kullan; simge butonlarına `aria-label`; dekoratif SVG'lere `aria-hidden`.

## Yol haritası

1. **Arayüz (şimdi):** tüm sayfalar, örnek veriyle, tasarıma birebir.
2. **Uçuş verisi:** bilet kesimini üstlenen bir API (Duffel, Amadeus vb. — güncel koşulları kontrol edilecek). `src/lib/flights.ts` arkasında.
3. **Ödeme:** Mollie (kart, iDEAL, Apple Pay, Google Pay tek entegrasyonda). Kart bilgisi asla kendi sunucumuzda tutulmaz; sağlayıcının güvenli bileşenleri kullanılır.
4. **Hesap ve "Biletlerim":** Supabase (auth + veritabanı).
5. **E-posta ve fiyat alarmı**, sonra **yayın** (Vercel).
