# DEVAM — sonraki geliştirici için iş listesi

Bu dosya, projeye devam edecek yapay zekâ asistanı (Gemini) içindir. İşler bittiğinde Claude değişiklikleri
kontrol edecek; bu yüzden aşağıdaki **kurallara** ve **teslim biçimine** uy.

Önce sırasıyla oku: `CLAUDE.md` (tasarım ve ürün kuralları), `docs/GELISTIRME.md` (ortam değişkenleri, çalıştırma),
bu dosya.

---

## 1. Değişmez kurallar

1. **Git:** Yalnızca `claude/relaxed-hamilton-imw25d` dalında çalış. Başka dala push etme, force-push yapma,
   geçmişi yeniden yazma. Her iş ayrı ve anlaşılır bir commit olsun (Türkçe mesaj, ne ve neden).
2. **Gizli bilgiler:** Token, API anahtarı, şifre **asla** koda, commit'e ya da bu dosyaya yazılmaz. Hepsi Vercel'deki
   ortam değişkenlerindedir. Yeni bir anahtar gerekiyorsa kullanıcıdan Vercel'e eklemesini iste.
3. **Ortaklık modu kapanmaz:** Site bilet satmaz. `src/config/affiliate.ts` (satış modu, ortak seçimi) ve
   `src/lib/outbound*.ts` + `src/app/git/route.ts` ("Fırsata git" yönlendirmesi, tıklama kaydı) bilerek böyle kuruldu.
   Duffel ile satış kodu silinmez (`NEXT_PUBLIC_SALES_MODE=booking` ile geri açılır).
4. **Fiyat verisi:** `src/lib/providers/travelpayouts.ts`. Aviasales önbelleği; canlı değildir. Kartlardaki
   "x gün önce görülen fiyat" etiketi ve sonuç notu kaldırılmaz (dürüstlük kuralı).
5. **Önbellek anahtarı:** `Offer` tipinin biçimi ya da sağlayıcının ürettiği alanlar değişirse
   `src/lib/flights.ts` içindeki `"search-v5"` anahtarını bir artır (`"search-v6"`), yoksa eski kartlar görünür.
6. **Tasarım:** `CLAUDE.md`'deki altın kural geçerli (renk tokenları, yazı tipleri, Türkçe kopya, en fazla iki karakter,
   uydurma istatistik yok, köşeli parantezli yer tutucular kalır, gerçek havayolu/ödeme logosu çizilmez —
   havayolu logoları yalnızca Aviasales görsel sunucusundan gelir).
7. **Çeviri:** Arayüz 7 dilde (`messages/{tr,en,nl,de,fr,es,it}/*.json`). Yeni her metin **7 dilin hepsine** eklenir.
   JSON biçimi korunur (2 boşluk girinti, dosya sonunda satır sonu).
8. **Alan adı / DNS:** TransIP'teki **Nameservers** ayarına dokunma (Vercel'i gösteriyor). DNS kayıtları Vercel'de.
9. **Ödeme ve kişisel veri:** Kart bilgisi hiçbir zaman sunucuda tutulmaz. Kullanıcı e-postası loglara yazılmaz.

## 2. Her iş bitmeden önce kontrol

```bash
npm ci                 # node_modules yoksa
npm run lint           # tsc --noEmit, hatasız olmalı
npx next build         # ilk denemede Next.js güvenlik uyarısıyla durabilir; aynı komutu bir kez daha çalıştır
```

Yerelde gerçek veriyle denemek için (token'ı dosyaya yazmadan, yalnızca komut satırında):

```bash
TRAVELPAYOUTS_TOKEN=... NODE_USE_ENV_PROXY=1 npx next start -p 3000
# ör. http://localhost:3000/ara?from=AMS&to=IST&date=2027-01-22&return=2027-01-25
```

Arayüz değişikliğinde 1440 px ve 390 px genişlikte ekran görüntüsü alıp kontrol et.

---

## 3. İş listesi (öncelik sırasıyla)

### 3.1 White Label'ı bağla — kullanıcıyla birlikte
Durum: Travelpayouts'ta oluşturuldu (Page, Türkçe, EUR), DNS kaydı Vercel'de çalışıyor
(`ucus` CNAME `whitelabel.travelpayouts.com`). **SSL sertifikası bekleniyor** (48 saate kadar).

- `https://ucus.flypirpir.nl` uyarısız açılınca kullanıcıya şunu yaptır: Vercel → Settings → Environment Variables →
  Type **Config**, Key `NEXT_PUBLIC_TP_WL_HOST`, Value `ucus.flypirpir.nl` → Redeploy.
- Kod hazır (`whiteLabelHost()`), kod değişikliği gerekmez. Yayından sonra bir sonuç kartındaki "Fırsata git"in
  `https://ucus.flypirpir.nl/flights/...` adresine gittiğini ve sayfanın canlı fiyat gösterdiğini doğrula.
- Logo: kullanıcı Travelpayouts → White Label → Design'dan `https://flypirpir.nl/email/pirpir.png` dosyasını yükler.

### 3.2 Next.js güvenlik güncellemesi
`next` şu an 16.4.2; bilinen açıklar 16.4.5'te kapalı (`npm audit --omit=dev`). `npm install next@16.4.5`, ardından lint + build + ana sayfa, `/ara`, `/git` denemesi. Ayrı commit.

### 3.3 Fiyat alarmı e-postalarının kontrolü — kullanıcıyla birlikte
Kod: `src/lib/price-alerts.ts`, cron `/api/cron/price-alerts` (her gün 05:00 UTC, `vercel.json`).
Kullanıcıdan Vercel → Logs'ta `Fiyat alarmları kontrol edildi` satırını iste:
- `"email": false` → Vercel'de `RESEND_API_KEY` / `EMAIL_FROM` eksik (kurulum `docs/GELISTIRME.md`).
- `dropped > 0` ama `emailed: 0` → gönderim hatası; logdaki hata satırını incele.
Not: Alarmlar artık Travelpayouts önbelleğiyle kontrol ediliyor; bagaj koşulu bu fiyatlara uygulanmıyor
(`src/lib/alert-criteria.ts`, `bagsUnknown`).

### 3.4 Tarih şeridi ve fiyat takvimini ay verisine çevir
Şu an her gün için ayrı arama yapılıyor (`src/components/results/DateStrip.tsx` → `/api/date-prices`,
`src/lib/price-calendar.ts`). Travelpayouts `GET /aviasales/v3/grouped_prices?origin=&destination=&departure_at=YYYY-MM&group_by=departure_at&currency=eur`
tek istekte ayın her günü için en ucuz fiyatı verir. Ortaklık modunda (`priceSource() === "travelpayouts"`) bunu kullan;
Duffel/örnek modda eski yol kalsın. "Fiyata bak" durumu (kayıt yok) korunur.

### 3.5 Fırsat motoru (en büyük iş — 3. aşama)
Referans: ucuzaucak.net'in fırsat kartları ve fırsat sayfaları (kopyalama yok, yalnızca akış fikri).
1. **Veri:** Popüler rotalar listesi (`src/data/mock/*` ve pazarlara göre `src/config/markets.ts`). Her gün bir cron
   (Vercel cron, `CRON_SECRET` ile) bu rotalar için önümüzdeki 3 ayın `grouped_prices` verisini çeker, rotanın
   normal fiyatına göre belirgin ucuz günleri "fırsat adayı" olarak Supabase `deals` tablosuna yazar
   (yeni migration `supabase/migrations/0006_deals.sql`, RLS açık, yalnızca service role).
2. **Onay:** `/yonetim/firsatlar` sayfası; yalnızca `ADMIN_EMAILS` ortam değişkenindeki e-postalarla girilir.
   Aday listesi, "Yayınla / Reddet" düğmeleri.
3. **Yayın:** `/firsatlar` listesi ve `/firsatlar/[id]` fırsat sayfası: rota, fiyat, uygun tarihlerin listesi; her tarih
   `goHref(..., "deal:<id>", locale)` ile "Fırsata git". Fiyatın görüldüğü zaman yazılır.
4. **Paylaşım:** Fırsat sayfası için OG görseli (`next/og`), WhatsApp/Telegram için kısa paylaşım metni düğmesi.
5. Ana sayfadaki fırsat kartları (`src/lib/deals.ts`) yayınlanmış fırsatlardan beslenir; yoksa eski davranış.
7 dil, tasarım tokenları, karakter kuralları geçerli. Bu işi alt adımlara bölüp her birini ayrı commit yap.

### 3.6 Gerçek döviz kuru
`src/lib/currency.ts` sabit örnek kur kullanıyor (EUR = TRY/40). Ücretsiz bir kaynak (ör. ECB günlük kurları XML)
sunucuda günde bir çekilip `unstable_cache` ile saklansın; hata olursa mevcut örnek kurlara düşülsün.
`RATES` kullanan yerler tarayıcıda da çalışıyor; kurlar sunucudan sağlayıcıyla (CurrencyProvider) aktarılmalı.

### 3.7 Tıklama raporu
`/yonetim/tiklamalar` (yine `ADMIN_EMAILS`): `clicks` tablosundan son 7/30 gün, en çok tıklanan rotalar ve kaynaklar
(`src`: results, empty, deal:...). Yalnızca okuma.

### 3.8 Gizlilik ve çerez metni
White Label ve Aviasales/Travelpayouts çerez kullanır. Gizlilik/çerez sayfasına (yoksa oluştur, 7 dil) ortaklık
bağlantıları ve bu çerezler hakkında kısa, dürüst bir bölüm ekle. Hukuki yer tutucular köşeli parantezle kalır.

### Sonraya (kullanıcı karar verecek, kod yazma)
- Skyscanner ortaklık başvurusu (aylık 5.000+ ziyaretçi). Kimlik gelince yalnızca `SKYSCANNER_MEDIA_PARTNER_ID` eklenir.
- Travelpayouts canlı arama API'si (aylık 50.000+ aktif kullanıcı şartı).
- Travelpayouts API token'ının yenilenmesi (kullanıcı yapar, yalnızca Vercel'de güncellenir).

---

## 4. Teslim biçimi (Claude kontrol edecek)

Her işi bitirdiğinde bu dosyanın en altındaki **İş günlüğü**ne bir satır ekle:

```
- [3.x] Kısa başlık — commit <kısa hash> — ne değişti, nasıl denendi (komutlar/URL'ler), bilinen eksikler
```

Yapamadığın ya da kullanıcı kararı gereken bir şey olursa onu da yaz; tahminle ilerleme.

---

## 5. İkinci tur iş listesi (Gemini) — öncelik sırasıyla

Kurallar (bölüm 1) ve kontrol komutları (bölüm 2) aynen geçerli. Her alt adım ayrı commit, her iş sonunda iş günlüğüne
satır. **Claude'un alanına dokunma:** `src/components/results/LiveWidget.tsx`, `ResultsView.tsx`, `LiveResults.tsx`,
`OfferCard.tsx`, `src/app/[locale]/ara/page.tsx` ve `globals.css` içindeki `#tpwl-tickets` bloğu Claude'da (canlı liste
ve stili üzerinde çalışıyor). Bu dosyalarda değişiklik gerekirse iş günlüğüne yaz, Claude yapsın.
Bitince bir sonraki işe geç; kullanıcı kararı gereken yerde dur ve günlüğe "KARAR GEREKİYOR" diye yaz.

### 5.1 Uçtan uca test paketi (önce bu — sonraki işlerin güvenlik ağı)
- `@playwright/test` geliştirme bağımlılığı (ortamda Playwright kurulu; sürümü ona uydur, tarayıcı indirme yok:
  `executablePath` gerekirse `/opt/pw-browsers/chromium`). `playwright.config.ts`, `tests/e2e/`, `npm run e2e`.
- Testler **örnek veri modunda** çalışsın (token yok → `priceSource()` "demo"; ağ gerektirmez): `npx next build &&
  npx next start` üzerinde. Kapsam: ana sayfa (TR + EN), arama kutusundan sonuç sayfasına (şehir yaz → öneriden seç →
  takvimden tarih → Bilet bul), sonuç sayfasında filtre/sıralama/tarih şeridi, `/git` yönlendirmesi (302, parametreler),
  `/firsatlar`, rota sayfası, gizlilik sayfası (7 dil 200), `/yonetim/*` girişsiz 307, `/api/cron/*` anahtarsız 401,
  telefon boyutu (iPhone 13) için ana sayfa + sonuç sayfası, sayfalarda JS hatası olmaması.
- `--trace off` varsayılan. README/GELISTIRME.md'ye nasıl çalıştırılacağını yaz.

### 5.2 Rota sayfaları gerçek veriye (en önemli içerik işi)
Şu an `/ucuslar/[nereden]/[nereye]` (`Destination.dc.html`) **örnek veri** (`src/data/mock/routes.ts`) gösteriyor:
aylık fiyat grafiği, en ucuz tarihler uydurma. Ortaklık modunda gerçek veriye çevir:
- Aylık grafik ve "en ucuz tarihler": `groupedPrices` (Travelpayouts, `group_by=month` ve ay içi `departure_at`),
  `unstable_cache` 6–12 saat. Fiyatın görüldüğü gün yazılsın; veri yoksa o ay "Fiyata bak" (uydurma yok).
- Her tarih/ay satırı arama sayfasına (`searchHref`) gitsin; "Fırsata git" gerekiyorsa `goHref(..., "route:<slug>")`.
- Rota listesi: mevcut rotalar + pazarların (`src/config/markets.ts`) popüler rotaları; `generateStaticParams` +
  ISR (`revalidate`), sitemap'e ekle. Şehir başına havalimanları ve ipuçları bölümü tasarımdaki gibi kalsın.
- Tasarıma birebir sadakat (CLAUDE.md altın kural) ve 7 dil. Demo modda eski örnek veri çalışmaya devam etsin.

### 5.3 Ana sayfa ortaklık moduna tam uyum
- Popüler uçuşlar / karakter ipuçlarındaki fiyatlar: yayınlanmış fırsat yoksa `groupedPrices` ile rotanın
  önümüzdeki 60 gündeki en ucuz gününden ("…'dan", görüldüğü gün ile). Boş kart kalmasın.
- Kategori filtresi (Tümü / Türkiye / Avrupa / Deniz & güneş / Şehir turu) gerçek veriyle çalışsın.
- "Fiyat alarmı" formu ve SSS metinleri ortaklık modunda doğru mu kontrol et (bilet satmıyoruz, ödeme satıcıda).

### 5.4 Fiyat alarmı e-postası ortaklık moduna
`src/lib/emails/price-drop.ts`: e-postadaki ana düğme sonuç sayfasına (canlı liste) gitsin; "Fırsata git" için
`goHref(..., "alert:<id>")` bağlantısı da olsun (tıklama raporunda `alert` kaynağı görünsün). Önbellekli fiyatın
görüldüğü gün e-postada yazsın ("Fiyat x gün önce görüldü"). 7 dil, mevcut tasarım.

### 5.5 Performans ve erişilebilirlik denetimi
- Lighthouse (Chromium, `--headless --no-sandbox`) ile `/`, `/ara?...`, `/firsatlar`, bir rota sayfası: masaüstü + mobil.
  Raporu `docs/denetim.md`'ye özetle (puanlar, en büyük 5 sorun). Kolay ve güvenli olanları düzelt (görsel boyutları,
  `alt`/`aria-label`, kontrast ≥ 4.5:1, dokunma hedefi ≥ 44 px, gereksiz istemci JS).
- Üçüncü taraf betikler (tpwgt.com) için yalnızca rapor, değişiklik Claude'da.

### 5.6 Hukuki yer tutucular listesi (yalnızca rapor)
`[ŞİRKET ADI]`, `[ADRES]`, `[İLETİŞİM E-POSTASI]`, `[İPTAL KOŞULLARI]`, `[DESTEK SAATLERİ]` vb. tüm köşeli parantezli
yer tutucuları dosya/satırıyla `docs/yer-tutucular.md`'ye listele; kullanıcı dolduracak. Metinleri değiştirme.

### 5.7 Sonraki fikirler (kod yazma, yalnızca öneri yaz)
Telegram/WhatsApp fırsat kanalı otomasyonu, e-posta bülteni, fırsat sayfalarının SEO'su — her biri için 3–5 satırlık
öneri ve gereken hesap/anahtar listesi `docs/DEVAM.md` sonuna.

## 7. Üçüncü tur iş listesi (Gemini) — öncelik sırasıyla

Kurallar (bölüm 1), kontrol komutları (bölüm 2) ve teslim biçimi (bölüm 4) aynen geçerli. Ek olarak her işte
`npm run e2e` geçmeli; yeni davranış için test ekle. **Claude'un alanı (dokunma):** `src/components/results/LiveWidget.tsx`,
`ResultsView.tsx`, `LiveResults.tsx`, `OfferCard.tsx`, `DateStrip.tsx`, `src/app/[locale]/ara/page.tsx`,
`src/lib/providers/travelpayouts.ts`, `src/lib/outbound*.ts`, `src/app/git/route.ts`, `globals.css` içindeki `#tpwl-tickets`.
Bunlarda değişiklik gerekiyorsa iş günlüğüne "CLAUDE'A" diye yaz. Kullanıcı kararı gerekiyorsa "KARAR GEREKİYOR" yaz ve
sıradaki işe geç.

### 7.1 Travelpayouts için yerel sahte sunucu ve gerçek-veri testleri
`TRAVELPAYOUTS_API_URL` değişkeni zaten var. `tests/e2e/fixtures/` altında kayıtlı örnek yanıtlarla (prices_for_dates,
grouped_prices — gerçek yanıt biçiminde, uydurma ama gerçekçi değerler, dosyada "test verisi" notu) küçük bir Node sahte
sunucusu yaz; e2e'de ikinci bir proje "affiliate" bu sunucuyla çalışsın (`TRAVELPAYOUTS_TOKEN=test`). Kapsam: rota sayfası
aylık grafik + en ucuz tarihler, ana sayfa popüler uçuş fiyatları, `/api/date-prices?strip=1`, fırsat tarayıcısının aday
seçimi (`pickDealCandidates` için birim testi de olur). Canlı widget bu projede kapalı (`NEXT_PUBLIC_TP_WL_WIDGET_ID` boş).

### 7.2 Fiyat alarmı penceresi önbellek fiyatıyla
`src/components/results/PriceAlertButton.tsx` ("Neyi takip edelim?") şu an sonuç kartlarından en ucuzu gösteriyor; sonuç
listesi artık canlı widget olduğundan kartlar boş ve pencere "Bu seçimle şu an uçuş yok" diyor. Pencere, seçilen
tarih/esneklik/aktarma için en düşük **önbellekli** fiyatı yeni bir uç noktadan (`/api/alert-price`, `travelpayoutsDayPrices` /
`prices_for_dates` ile, 10 dk önbellek) alsın; "x gün önce görülen fiyat" yazsın; veri yoksa "Şu an kayıtlı fiyat yok,
düşünce haber veririz" desin ve alarm yine kurulabilsin. Bileşenin dışarıdan aldığı props değişirse `LiveResults.tsx`'te
gereken tek satırı iş günlüğüne "CLAUDE'A" diye yaz.

### 7.3 Ortaklık modunda satış kalıntılarını temizle
Bilet satmıyoruz. `/biletlerim`, `/rezervasyon/*` ortaklık modunda `/hesap`'a (biletlerim) ya da ana sayfaya yönlendirsin
(satış modunda aynen çalışsın). Hesap, profil menüsü, e-postalar, SSS, koşullar ve ana sayfadaki "rezervasyon / ödeme /
e-bilet / iptal" ifadelerini tara; ortaklık modunda yanlış olanları düzelt (7 dil). Liste + değişiklikleri günlüğe yaz.

### 7.4 Rota sayfası kataloğu ve iç bağlantılar
"Türkiye'de başka nereler?" gibi bölümlerdeki bağlantıların bir kısmı rota sayfası yerine aramaya gidiyor. Pazarların
(`src/config/markets.ts`) tüm popüler rotaları ve Türkiye'nin büyük havalimanları (IST/SAW, AYT, ADB, ESB, DLM, BJV, GZT,
TZX, ASR) için kalkış şehri × varış rota sayfaları üret (makul bir üst sınır, ör. 150 sayfa), sitemap'e ekle, iç bağlantılar
rota sayfalarına gitsin. İçerik uydurulmasın: rota rehberi yoksa bölüm gizlensin.

### 7.5 SEO temelleri
- Her sayfada doğru `alternates` (7 dil hreflang + x-default) ve kanonik adres; rota ve fırsat sayfalarında özgün başlık
  ve açıklama.
- Yapılandırılmış veri: ana sayfa SSS → `FAQPage` (yalnızca sayfadaki gerçek metin), rota sayfası `BreadcrumbList`.
  Fiyat için `Offer` şeması **ekleme** (önbellekli fiyat, yanıltıcı olur).
- Rota sayfaları için `opengraph-image` (fırsat sayfalarındaki gibi, rota + "…'dan" fiyatı + görüldüğü gün).
- `docs/denetim.md`'ye SEO bölümü ekle.

### 7.6 Çeviri bütünlüğü
`scripts/check-messages.mjs`: 7 dilde anahtar kümesi aynı mı, ICU yer tutucuları (`{brand}`, `{partner, select, …}`)
tutarlı mı, boş metin var mı. `npm run check:messages` ve e2e öncesi çalışsın. Bulunan eksikleri düzelt (çeviri kalitesini
koru; emin olmadığın dilde İngilizce bırakma, doğru çevir).

### 7.7 Telegram fırsat kanalı (kapalı özellik olarak)
5.7'deki öneriye göre: fırsat yönetim panelinde "Yayınla" denince, `TELEGRAM_BOT_TOKEN` ve `TELEGRAM_CHANNEL_ID`
tanımlıysa kanala kısa mesaj (rota, fiyat, görüldüğü gün, fırsat sayfası bağlantısı, OG görseli) gönderilsin. Değişkenler
yoksa hiçbir şey yapmasın. Gönderim hatası yayınlamayı engellemesin. Token'ı kullanıcıdan isteme; kurulum adımlarını
`docs/GELISTIRME.md`'ye yaz. Gerçek gönderim testi yok; birim testi sahte fetch ile.

## 8. Dördüncü tur (Gemini) — kullanıcının bildirdiği hatalar, öncelik sırasıyla

Kullanıcı: "halen aynı sorunlar". Bu turda sonuç sayfası ve canlı widget dahil **her dosyaya dokunabilirsin**;
bölüm 7'deki "Claude'un alanı" kısıtı bu tur için kalktı. Kurallar (bölüm 1), kontrol komutları (bölüm 2) ve teslim biçimi
(bölüm 4) aynen geçerli; her işte `npm run lint`, `npm run check:messages`, `npm run e2e` geçmeli.

**En önemli kural — canlıda, gerçek tarayıcıda, son kullanıcı gibi dene.** Claude'un ortamından widget'ın canlı araması
(`tickets-api.apistp.com`) 403 veriyor. Bu yüzden aşağıdaki hatalar yerelde hiç görülemedi. Sen https://flypirpir.nl
üzerinde gerçek bir tarayıcıyla dene: masaüstü ve telefon, Türkçe ve İngilizce, Hollanda saati. Her iş için iş günlüğüne
şunları yaz: denediğin adımlar, adres çubuğundaki tam URL (özellikle `flightSearch=` kodu) ve gördüğün sonuç.
Ekran görüntüsü alabiliyorsan `docs/ekran/` altına koy. Bot tespitini atlatmaya çalışma (UA/webdriver gizleme yok);
normal tarayıcı kullan.

**Canlı widget nasıl çalışıyor (bilmen gerekenler):**
- `src/components/results/LiveWidget.tsx`: Travelpayouts White Label widget'ı (wl_id 25161, `tpwgt.com/wl_web/main.js`)
  `#tpwl-tickets` içine yüklenir. Widget açık bir **shadow root** içine çizer. Stil oraya `<style>` ile enjekte edilir
  (`SHADOW_CSS`). Kartlar `MutationObserver` ile en ucuzdan sıralanır (`enhanceShadow`).
- Widget aramayı yalnızca açılışta adresteki `flightSearch` kodundan okur. Kod biçimi:
  `AMS0201ADB09011` = AMS, 02.01, ADB, 09.01, 1 yetişkin. Ayrıştırıcı ve üretici: `src/lib/outbound.ts`
  (`aviasalesRoute`, `parseAviasalesRoute`).
- Widget kendi tarih şeridinden ya da formundan başka aramaya geçince window'a `urlchange` olayı yayınlar. Sayfa bunu
  dinleyip adresi ve arama kutusunu eşitler (`LiveWidget.tsx`, `onChange`).
- Widget'ın kaynak kodu okunabilir: `https://tpwgt.com/wl_web/main.js?wl_id=25161` ve onun yüklediği `main-*.js`,
  `index-*.js`. Adresten okuduğu parametreler: flightSearch, origin/destination(_iata/_airports), depart_date,
  return_date, adults, children, infants, trip_class, currency, language, locale, marker, ticketId, open_datepicker.
  **Bagaj parametresi yok.**

### 8.1 Tarih kayması: "2–9 Ocak seçtim, 1–8 Ocak geldi"
Claude'un bulguları:
- Ana sayfa → Amsterdam → İzmir → takvimde 2 ve 9 Ocak → "Bilet bul" akışını yerelde UTC, Europe/Amsterdam ve
  Europe/Istanbul saatleriyle denedi. Her seferinde adres `date=2027-01-02&return=2027-01-09&flightSearch=AMS0201ADB09011`,
  kutu "2 – 9 Oca" çıktı.
- Canlı sitede (firecrawl) widget kartları da "Sat, Jan 2" / "Sat, Jan 9" gösterdi.
- Yani kayma ya yalnızca gerçek tarayıcıda widget'ın canlı araması çalışınca oluyor, ya da başka bir yoldan geliyor.

Yapılacaklar:
1. Kullanıcının akışını canlıda birebir dene. Ana sayfadaki "en ucuz" tarih önerisinin üzerine tarih seçmeyi ve
   takvimde "± gün esnek" seçeneklerini de dene. Ayrıca sonuç sayfasındaki küçük arama kutusundan tarih değiştirmeyi,
   widget'ın kendi tarih şeridine/matrisine tıklamayı ve sayfayı yenilemeyi dene.
2. Her adımda `flightSearch` kodunu, `date`/`return` parametrelerini ve widget'ın gösterdiği günleri karşılaştır. Bir
   gün kayma nerede başlıyor: bizim kodumuzda mı (adres yanlış), yoksa widget mı yanlış günü arıyor (adres doğru,
   kartlar yanlış)?
3. Kökü düzelt ve bu durum için bir e2e testi ekle. Widget'ın kendisi yanlış arıyorsa: adres doğruyken kartların günü
   farklıysa sayfa uyarı göstersin ya da widget doğru kodla yeniden yüklensin. Hangisini seçtiğini günlüğe yaz.
4. Saat dilimi tuzakları: `toISOString()`, `new Date("YYYY-MM-DD")` (UTC) ile `getDate()` (yerel) karışımı. Bizim
   tarih kodumuz (`src/lib/search.ts`, `src/lib/dates.ts`, `DateRangePicker.tsx`) UTC'de tutarlı görünüyor; widget'ın
   `urlchange` ile verdiği kodu da kontrol et.

### 8.2 Bavul seçimi çalışmıyor
Mevcut durum (Claude, son commit): arama kutusunda kontrol edilen bagaj (`checkedBags`) seçilince `applyBaggageFilter`
widget'ın `[data-testid="baggage-included-filter"]` çipine bir kez tıklıyor. Bu yalnızca sahte gölge kökle denendi.
Kullanıcı "halen aynı" diyor.

Yapılacaklar:
1. Canlıda dene: bavul 1 seç, ara, listede "Bagaj dahil" açık mı, kartlar bagajlı fiyata göre mi?
2. Çalışmıyorsa nedenini bul. Olasılıklar: çip o test etiketiyle yalnızca masaüstü "Popüler filtreler" içinde var
   (telefon menüsündeki çipte test etiketi yok); çipe programla tıklamak Preact'in olayını tetiklemiyor; çip kartlardan
   önce çiziliyor ve sonra sıfırlanıyor. Düzelt.
3. Ayrıca widget adresi kendi biçimine çevirince `checkedBags` adresten düşüyor; sayfa yenilenince bavul seçimi
   kayboluyor. Bunu da çöz (ör. seçimi `sessionStorage`'da rota koduyla tut).
4. Kabin bagajının widget'ta karşılığı yok. Bagaj panelindeki not ("Bagaj seçenekleri ve ek ücretler canlı uçuş
   listesinde … gösterilir") bunu dürüstçe anlatıyor; gerekirse metni netleştir (7 dil).
5. Kartlardaki fiyat: "Bagaj dahil" açıkken kartta bagajlı toplam mı görünüyor? Görünmüyorsa günlüğe yaz.

### 8.3 Sonuç sayfasının uçtan uca gözden geçirmesi
Kullanıcı "hata üzerine hata" diyor. Canlıda sonuç sayfasını baştan sona son kullanıcı gibi kullan: filtreler, sıralama,
"Daha fazla", "Bileti seç" (satıcıya gidiyor mu, marker 812756 adreste mi), para birimi ve dil değiştirme, telefon
görünümü, yükleme süresi. Bulduğun her hatayı iş günlüğüne madde madde yaz: adım, beklenen, görülen. Küçükleri düzelt,
büyükleri "KARAR GEREKİYOR" ya da "CLAUDE'A" diye işaretle.

### 8.4 Fiyat trendleri — KAPANDI (kullanıcı kararı: sonuç sayfasından kaldırıldı, bkz. 10. tur)
Kullanıcı: "trend fiyatları doğru vermiyor". Trendler Aviasales önbelleğinden geliyor, canlı widget fiyatlarıyla
uyuşmuyor. İki seçenek kullanıcıya soruldu, **henüz cevap yok**:
(a) canlı listenin olduğu sonuç sayfasından kaldır (Claude'un önerisi), (b) "önbellek fiyatı, canlı değil" diye etiketle.
Kullanıcıdan cevap almadan kod yazma; ikisini de kolay uygulanır halde planla ve günlüğe yaz.

### 8.5 Test ortamı notu
`NEXT_PUBLIC_TP_WL_WIDGET_ID` derleme anında koda gömülür. Bu değişkenle derlenen bir yapıyla `npm run e2e` çalıştırılırsa
4 test (örnek veri modunu bekleyenler) düşer. `playwright.config.ts` / testleri buna dayanıklı yap: ya e2e öncesi
değişkensiz derle, ya da canlı mod için ayrı bir proje ekle (widget betiği engellenip sahte gölge kökle).

---

## 9. Beşinci tur (Gemini) — canlı widget'ı pirpir tasarımına yaklaştır

Kullanıcı kararı: "1 yapalım" = canlı widget kalır, görünümü ve sadeliği bizim tasarıma (`design/Results.dc.html`)
olabildiğince yaklaştırılır. Kendi sonuç kartlarımızı çizmek (canlı arama API'si) bu turun konusu **değil**.

Kurallar (bölüm 1), kontrol komutları (bölüm 2), teslim biçimi (bölüm 4) ve 8. turdaki "canlıda, gerçek tarayıcıda dene"
kuralı aynen geçerli. Bu turda `LiveWidget.tsx` (özellikle `SHADOW_CSS`, `enhanceShadow`) ve `globals.css`'teki
`#tpwl-tickets` bloğu senin alanın. Her işte `npm run lint`, `npm run check:messages`, `npm run e2e` geçmeli.

**Nasıl çalışılır:**
- Widget açık bir shadow root içine çizer. Stil yalnızca `SHADOW_CSS` ile, sınıf adının sabit kısmına göre seçilir
  (`[class*="FlightCard-module__card___"]`; sondaki karma değişebilir, kullanma).
- Kartlara sadece CSS ve küçük, geri alınabilir DOM eklemeleriyle müdahale et. Widget'ın olay akışını bozma: "Bileti seç"
  → satıcı yönlendirmesi ve marker 812756 her zaman çalışmalı. Widget'ın kendi metnini değiştirme, yalnızca gizle.
- Her adımda önce/sonra ekran görüntüsü al (`docs/ekran/9-*.png`): masaüstü 1440 px ve telefon 390 px, TR ve EN.
  Tasarım dosyasını tarayıcıda yan yana açıp karşılaştır.

### 9.1 Uçuş kartı — `design/Results.dc.html` ölçüleri
Tasarımdaki kart (satır 53–81) hedef:
- Kart: beyaz zemin, `2px solid #E3E8F2`, köşe `28px`, iç boşluk `20px 24px`, iç aralık `16px 28px`.
- Kalkış/varış saatleri: Fredoka 600, `28px`, satır yüksekliği 1. Arada süre (`13px`, 700, `#56607A`), `3px dotted #9CC3FF`
  çizgi ve aktarma bilgisi (`13px`, 800, `#1E2A44`; "Direkt" / "1 aktarma").
- Havayolu satırı: `15px`, 600, `#56607A`.
- Bilgi hapları: `13px`, 800, `padding 3px 10px`, köşe 999px. Bagaj bilgisi `#F5F8FD` zeminde, aktarma bilgisi (yer + bekleme)
  `#FFE8E0` zeminde.
- Fiyat: Fredoka 700, `30px`, `#1E2A44`.
- Seç butonu: `#2F5BD3` zemin, beyaz Fredoka 600 `19px`, `padding 12px 26px`, köşe 999px, en az `48px` yükseklik.
- Rozetler: Fredoka 600 `14px`, `padding 4px 12px`, köşe 999px, lacivert metin. "En ucuz" `#FFD166`, "En hızlı" `#CFE0FF`.
  Widget'ın kendi rozetleri ("Cheapest", "The only direct flight" vb.) bu renklere boyansın.
- Gölge yok. Widget'ın kendi gölgeleri, gri zeminleri ve ince çizgileri kaldırılsın.
Widget'ın kart içi yapısı farklı olabilir. Birebir olmayan yerleri iş günlüğüne "WIDGET SINIRI" diye yaz
(ör. kalkış ve dönüş iki ayrı satır).

### 9.2 Sadeleştirme (kullanıcı "karmaşık geliyor" dedi)
Varsayılan görünüm tasarımdaki kadar sade olsun:
- Üstte yalnızca sıralama hapları: "En ucuz / En hızlı / Sadece direkt" gibi. Widget'ın sıralama ve "Aktarmasız" kontrolleriyle
  eşleştir; yoksa widget'ın kendi sıralamasını tasarımdaki hap görünümüne boya. Aktif hap: `#1E2A44` zemin, beyaz metin.
  Pasif hap: `#F5F8FD` zemin, lacivert metin. Fredoka 600 `17px`, `padding 10px 22px`, en az `44px`.
- Uzun filtre paneli (havayolları, aktarma havalimanları, uçak tipleri, acenteler vb.) varsayılan kapalı ya da tek bir
  "Filtreler" düğmesinin arkasında olsun. Kullanıcı açtığında hepsi çalışmaya devam etmeli. Hiçbir filtreyi tamamen
  kaldırma; kullanıcı daha önce "filtreyi neden kaldırdın" diye itiraz etti.
- Masaüstünde sol filtre sütunu sayfayı 880 px içerik genişliğinden taşırıyorsa listeyi tek sütuna al.
- "Multi-city", "Share", acente adları gibi gürültü öğelerini gizle (bağlantı/satın alma akışını etkilemeden).
- Yükleme çubuğu ve "sağlayıcılarda aranıyor" durumu kalsın ama bizim renklerle (`#2F5BD3`, köşe 999px).

### 9.3 Telefon (390 px)
`design/Mobile.dc.html` dili: kartlar tam genişlik, saatler ve fiyat okunaklı, Seç butonu en az 44 px, yatay taşma yok.
Mobil filtre çubuğu (hap sırası) bizim hap stilinde.

### 9.4 Erişilebilirlik ve kontrast
Metin kontrastı en az 4.5:1. Düğmeler klavyeyle ulaşılabilir kalsın. Yalnızca CSS ile gizlenen öğeler tıklanamaz olsun
(`display:none`); sadece `opacity:0` kullanma.

### 9.5 Test
`tests/e2e/live-widget.spec.ts`'teki sahte gölge köke 9.1–9.2 için kontroller ekle. Örnek: kartın köşesi 28px; "Daha fazla"
ve "Bileti seç" görünür ve tıklanabilir; gizlenen gürültü öğeleri görünmez; sıralama hapları çalışır.

### 9.6 Ayrıca (küçük)
- Ana sayfadaki 3 React `#418` hidrasyon uyarısının nedenini bul ve düzelt (8.3'te not edilmişti). Saat dilimine veya
  `localStorage`'a bağlı ilk çizim farkları olası nedenler.
- 8.4 (fiyat trendleri) hâlâ **KULLANICI KARARI BEKLİYOR**; dokunma.

Teslimde iş günlüğüne her alt iş için ekran görüntüsü yolu, değişen dosyalar ve "WIDGET SINIRI" maddelerini yaz.

---

## 10. Altıncı tur (Gemini) — sonuç sayfası düzeni (Kiwi'deki yerleşimden ilham), iki hata

Kullanıcı: "Site çok daha iyi olmuş, daha gerçekçi çalışıyor. Kiwi'den referans aldım; çok bozmadan, seçeneklerin nasıl
durduğuna bakabilirseniz çok güzel durur." Yani **yerleşim** fikri Kiwi'den alınacak. Renk, yazı tipi, köşe ve karakterler
pirpir'in kalacak (`CLAUDE.md` tokenları, `design/Results.dc.html`). Kiwi'nin markası, logosu, yeşil rengi, "Guarantee" ve
reklam kutuları, "Yapay Zeka Modu" gibi öğeler **kopyalanmaz**. 9. turda yapılanlar korunur; "çok bozmadan" şartı var.

Claude'un yaptığı (bu turdan önce): kullanıcı kararıyla sonuç sayfasından **Fiyat trendleri** ve **Fiyat alarmı kur**
düğmeleri kaldırıldı (`LiveResults.tsx`; bileşen dosyaları duruyor, başka yerde kullanılmıyor). `/api/alert-price` duruyor.
8.4 kapandı. Bunları geri ekleme.

Kurallar (bölüm 1), kontrol komutları (bölüm 2), teslim biçimi (bölüm 4) ve "canlıda gerçek tarayıcıda dene" kuralı aynen
geçerli. Önce/sonra ekran görüntüleri: `docs/ekran/10-*.png`, masaüstü 1440 ve telefon 390, TR ve EN.
`npm run e2e` iki derlemede de geçmeli (widget kimliğiyle ve kimliksiz).

### 10.1 HATA: İngilizce sayfada widget Türkçe (öncelik 1)
Kullanıcının ekran görüntüsü: `/en/search`, site İngilizce ve EUR, ama widget içi Türkçe: "Seçme bilet", "7 şub, Pz",
"Seyahat süresi: 3s 25dk", "En ucuz bilet". Para birimi doğru, dil yanlış. 8.3'te "dil değişince widget yeniden yüklenir"
denmişti; ya ilk yüklemede `TPWL_CONFIGURATION.defaultLanguage` dikkate alınmıyor, ya widget dili adresteki `language`/`locale`
parametresinden ya da kendi `localStorage` kaydından (önceki Türkçe ziyaret) okuyor. Canlıda şu adımlarla dene:
- temiz profil + `/en/search?...`;
- önce `/ara` sonra `/en/search` (aynı sekme);
- dil seçiciden TR → EN.
Kökü bul ve düzelt. NL/DE için de doğrula; FR/ES/IT için widget İngilizce olmalı.

### 10.2 HATA: widget'ın üstteki tarih şeridi boş
Ekran görüntüsünde kartların üstünde "Şub, 6 - 13 · -", "Şub, 7 - 14 · -", "Şub, 8 - 15 · -" var: fiyat yerine tire.
Bozuk görünüyor. Bu şerit (widget'ın FlightMatrix/esnek tarih bileşeni) fiyat geliyorsa bizim stilde dursun. Hiç fiyat yoksa
gizlensin. Fiyat sonradan geliyorsa gelince görünsün. Hangisini nasıl yaptığını günlüğe yaz.

### 10.3 Masaüstü yerleşimi (≥ 1024 px) — Kiwi'deki gibi üç bölüm
Referans: kullanıcının Kiwi ekran görüntüsündeki yerleşim (sol filtre sütunu, ortada sıralama sekmeleri + kartlar).
- **Sol sütun (≈ 260 px, kaydırırken yapışkan):** widget'ın filtre paneli artık "Filtreler" düğmesinin arkasında değil,
  solda hep açık dursun. Bölümler başlıklı ve açılır/kapanır olsun. Bagaj, Aktarmalar ve Kalkış/varış saatleri açık;
  Havayolları, Havalimanları, Uçak tipleri, Acenteler kapalı başlasın. Stil: zemin beyaz, bölümler arasında `#E3E8F2`
  ince çizgi, başlıklar Fredoka 600 17px, seçenekler Nunito 15px. Radyo ve onay kutuları `#2F5BD3`, en az 44 px dokunma alanı.
- **Üst sıralama sekmeleri, özetli:** "En ucuz / En hızlı / Sadece direkt" haplarının içinde o sekmedeki en iyi seçeneğin
  fiyatı ve süresi küçük satırda yazsın (Kiwi'deki "En ucuz · 194 € · 7h 25m" gibi). Değerler kartlardan okunur
  (`priceOf` ve süre metni). Okunamıyorsa yalnızca etiket kalır, uydurma değer yazılmaz. "Bagaj dahil" hapı kalır.
  Hap çubuğundaki "Filtreler" düğmesi masaüstünde kalkar (filtreler zaten solda).
- **Orta sütun kartlar:** 9.1'deki kart stili kalır. Kiwi'deki gibi iki bölümlü kart dene:
  - sol: gidiş ve dönüş satırları (saat, havalimanı kodu, ortada süre hapı + "Direkt"/aktarma);
  - sağ: dikey çizgiyle ayrılmış fiyat sütunu (büyük fiyat, bagaj hapı, Seç butonu).
  Gidiş ve dönüş arasında "İzmir'de 7 gece" gibi bir ayırıcı ancak widget verisinden doğru okunabiliyorsa olsun.
  Widget'ın DOM'u buna izin vermiyorsa yalnızca CSS (grid/order) ile yapabildiğin kadarını yap, kalanını "WIDGET SINIRI"
  diye yaz.
- Sayfa genişliği: sol sütun + kartlar, üstteki arama kutusuyla aynı genişliğe (1120 px) otursun. 9. turdaki 880 px tek
  sütun masaüstünde kalkar. Sağda boş üçüncü sütun ya da reklam kutusu **yok**.

### 10.4 Telefon (< 1024 px)
9.3'teki düzen kalır: üstte haplar, "Filtreler" widget'ın mobil filtre penceresini açar. Kartlar tek sütun. Özetli sekmeler
telefonda tek satıra sığmıyorsa yalnızca etiket göster.

### 10.5 Küçük iyileştirmeler (9. turdaki önerilerden)
- Telefonda "Filtreler" hapında aktif filtre sayısı: "Filtreler (2)". Masaüstünde sol sütunun en üstünde "Temizle" bağlantısı
  yalnızca aktif filtre varken görünsün.
- İlk kart gelene kadar (4–6 sn) widget'ın yükleme çubuğunun yanında küçük Pırpır ve kısa metin (7 dil), ör. "Pırpır en
  güncel fiyatlara bakıyor…". Karakter çizimi `src/components/characters/`'dan, değiştirmeden. Bir yerde en fazla iki karakter.
- `scripts/verify-live.mjs`: yayından sonra tek komutla canlı sitede (`https://www.flypirpir.nl`) şunları denetleyen kısa
  duman testi:
  - TR ve EN sonuç sayfası açılır;
  - widget kartları gelir;
  - adresteki tarih kodu doğru;
  - widget dili sayfa diliyle aynı;
  - "Seç" → satıcı yönlendirmesinde `marker=812756`.
  Gerçek tarayıcı kullanır, bot tespiti atlatma yok. `docs/GELISTIRME.md`'ye nasıl çalıştırılacağını yaz.

### 10.6 Test
`tests/e2e/live-widget.spec.ts` sahte gölge köküne şunları ekle:
- masaüstünde sol filtre sütunu görünür ve yapışkan;
- telefonda gizli ve "Filtreler" ile açılır;
- sekme özetleri kartlardaki en düşük fiyatı gösterir;
- tarih şeridi fiyatsızken gizli;
- dil yapılandırması sayfa diliyle aynı;
- sonuç sayfasında "Fiyat trendleri" ve "Fiyat alarmı kur" yok.

Teslimde iş günlüğüne her alt iş için önce/sonra ekran görüntüsü, değişen dosyalar ve "WIDGET SINIRI" maddelerini yaz.

---

## 11. Yedinci tur (Gemini) — sonuç sayfası: çakışmalar, bagaj, Kiwi düzeni

Kullanıcı (NL, Amsterdam → Antalya, 11–17 Ara ekran görüntüsüyle): "eksikler var, birbirlerine çarpışıyorlar ve bagaj
eklenince hatalar oluşuyor, burayı dediğim gibi Kiwi'den referans almamız lazım".

Kurallar (bölüm 1, 2, 4) ve 10. turdaki ilkeler aynen geçerli. Kiwi'den yalnızca **yerleşim ve davranış** alınır; marka,
renk, logo, reklam ve "Guarantee" alınmaz. Renkler ve yazılar pirpir tokenlarıyla kalır. Fiyat trendi ve fiyat alarmı düğmesi
geri gelmez.

### 11.0 Ekran görüntüsünde görülen hatalar (hepsi düzelmeli)
1. **Çakışma:** Sıralama hapları ("Goedkoopst / Snelst / Alleen direct / Bagage inbegrepen") altındaki widget tarih şeridi
   kutusuna ("Prijzen voor data in de buurt") yapışıyor, üst üste biniyor. Aralarında boşluk yok.
2. **Aynı anda üç koyu hap:** "Goedkoopst", "Alleen direct" ve "Bagage inbegrepen" üçü birden seçili (koyu) görünüyor.
   Sıralama (tek seçim) ile filtre (aç/kapa) aynı görünümde olduğu için kullanıcı ne seçili anlamıyor.
3. **Filtre çifte gösteriliyor:** Sol sütunda "Inclusief bagage ⓧ" ve "Geen tussenstops ⓧ" çipleri, "Direct" onay kutusu ve
   üstteki haplar aynı filtrenin üç ayrı kontrolü. Birini kapatınca diğerleri eşitleniyor mu, belli değil.
4. **Bagaj + direkt = sonuç yok:** Widget "No tickets matching your parameters. We removed some filters and found a few
   available options…" diyor ve **aktarmalı** (SAW) uçuşları gösteriyor. "Alleen direct" açık görünürken aktarmalı kart
   gösterilmesi yanıltıcı. Ayrıca bu metin NL sayfada İngilizce ve stilsiz.
5. **Bagaj seçimi tutarsız:** Üstteki arama kutusunda bagaj "0 · 0", ama listede "Bagage inbegrepen" açık. Her kartta ayrı
   "Inclusief bagage" anahtarı da var. Kullanıcı bagajı nereden seçeceğini bilmiyor. Bagaj ekleyince hatalar oluşuyor.
6. **İç içe kaydırma:** Sol filtre sütununun kendi kaydırma çubuğu var (sayfa içinde ikinci kaydırma).
7. **Tarih şeridi yarım:** Fiyatsız hücreler büyüteç simgesiyle boş duruyor, son hücre "Dec, 1" kesik, "Show" düğmesi
   İngilizce.
8. **İngilizce kalan widget metinleri:** "Cheapest with baggage", "Show", "No tickets matching…" NL sayfada İngilizce.
   Widget'ın kendi çevirisi yoksa en azından stilimizde kalsın. Bizim eklediğimiz hiçbir metin İngilizce kalmasın (7 dil).
9. "Goedkoopst" ve "Snelst" özetleri aynı (€281 · 4u 10min). Bu bir filtre uygulanmışken doğru olabilir. Özetin,
   görünen kartlardan değil **o sekmenin gerçek en iyisinden** hesaplandığından emin ol; emin değilsen özeti gizle.

### 11.1 Kiwi'deki ayrım: sıralama ayrı, filtre ayrı (öncelik 1)
Kullanıcının daha önce paylaştığı Kiwi görüntüsündeki düzen:
- **Sıralama = tek parça sekme çubuğu** (Kiwi: "En iyi / En ucuz / En kısa", her biri altında "194 € · 7h 25m", seçili
  olanın altında çizgi). Bizde: "En ucuz / En hızlı" (widget'ta "En iyi" karşılığı varsa o da) tek bir beyaz kutu içinde,
  eşit genişlikte sekmeler. Seçili sekme: `#2F5BD3` metin + alt çizgi (3px). Diğerleri lacivert/gri. Tek seçim.
  Hap görünümü sıralamada kullanılmaz.
- **Filtreler yalnızca sol sütunda** (masaüstü). "Sadece direkt" ve "Bagaj dahil" üstteki haplardan **kalkar**. Bunlar sol
  sütundaki Aktarmalar ve Bagaj bölümlerinde zaten var. Widget'ın "Popüler filtreler" çipleri de sol sütunda tekrar
  ediyorsa gizle. Her filtrenin tek bir kontrolü olsun.
- Telefonda: sekme çubuğu üstte (yatay kaydırmasız, sığmazsa yalnızca etiket), altında tek "Filtreler (N)" düğmesi.
- Sekme çubuğu ile altındaki tarih şeridi ya da kartlar arasında en az 16px boşluk; hiçbir öğe diğerinin üstüne binmesin.

### 11.2 Bagaj: Kiwi'deki gibi tek yer, sayaçlarla (öncelik 1)
Kiwi'de bagaj, sol sütunun en üstünde "Bagajlar" bölümü: "Kabin bagajı − 0 +" ve "Kontrol edilmiş bagaj − 0 +" sayaçları.
Fiyatlar seçilen bagaja göre gösterilir.
- Sol sütunun en üstüne "Bagaj" bölümü: kabin ve kontrol edilen bagaj sayaçları (bizim arama kutusundaki bagaj seçiciyle
  aynı bileşen/görünüm). Telefonda "Filtreler" penceresinin en üstünde.
- Bu sayaçlar, üstteki arama kutusundaki bagaj seçiciyle **aynı durumu** paylaşsın (biri değişince diğeri de değişsin;
  `live-widget-bags.ts` + adres). Kontrol edilen bagaj ≥ 1 ise widget'ın "Bagaj dahil" filtresi açılır, 0 ise kapanır.
  Kartlardaki bagajlı fiyat widget'ın kendi hesabıdır.
- Widget'ın kartlardaki tek tek "Bagaj dahil" anahtarları kalabilir (kartın fiyatını değiştiriyorlar). Ama üstteki/soldaki
  seçimle çelişmesinler: bagaj seçiliyken kart bagajlı fiyatla açılsın.
- Kabin bagajının widget'ta karşılığı yoksa sayaç durur ama altında kısa not olur (7 dil): kabin bagajı kuralları satıcıda
  gösterilir. Uydurma fiyat yok.
- "Bagaj eklenince hatalar oluşuyor": kullanıcı ayrıntı vermedi. Canlıda şu senaryoları dene, her birinde gördüğün hatayı
  ve düzeltmeyi günlüğe yaz:
  - arama kutusundan bagaj 1 ile ara;
  - sonuç sayfasında bagajı 0 → 1 → 0 yap;
  - bagaj + direkt (sonuç yokken);
  - bagaj + dil değiştir;
  - bagaj + sayfayı yenile;
  - telefonda bagaj.

### 11.3 "Sonuç yok, filtreleri gevşettik" durumu
Widget filtreleri kendisi gevşetip başka uçuşlar gösterdiğinde bizim stilde net bir uyarı kutusu göster (7 dil, `#FFF4D6`
zemin, 28px köşe). Örnek: "Seçtiğin filtrelere uyan uçuş yok. Bazı filtreleri kaldırıp yakın seçenekleri gösteriyoruz."
Yanında "Filtreleri temizle" bağlantısı olsun. Bu durumda "Sadece direkt" seçili görünüp aktarmalı kart gösterilmesin:
ya filtre görünümü gerçeğe eşitlensin ya da uyarı bunu açıkça söylesin. Widget'ın İngilizce metni gizlenebilir.

### 11.4 Sol sütun ve tarih şeridi
- Sol sütun sayfayla birlikte kaysın (yapışkan olabilir), **kendi iç kaydırma çubuğu olmasın**. Uzun bölümler kapalı
  başlar.
- Widget tarih şeridi ("Yakın tarihlerin fiyatları"): fiyatlı hücreler düzgün, fiyatsız hücreler sade ("—"), kesik hücre
  olmasın (yatay kaydırma ya da sığdır). "Show" düğmesi gizlenir ya da stilimize alınır. Şerit kart sütununun tam
  genişliğinde ve sekme çubuğundan ayrı dursun.

### 11.5 Kart
- Havayolu logoları: bilinmeyen/boş logo (ekrandaki sarı daire) yerine havayolu adı ya da hiçbir şey. Logo çizme; logolar
  yalnızca widget'tan gelir.
- "Cheapest with baggage" gibi widget rozetleri: dil sayfa diliyle eşitse olduğu gibi kalır; değilse stilimizde kalır.

### 11.6 Test (zorunlu, son kullanıcı gibi)
Teslimden önce canlıda bu matrisi dene ve sonucu günlüğe tablo olarak yaz:
- diller: TR, EN, NL;
- görünümler: masaüstü 1440 ve telefon 390;
- senaryolar: sıralama sekmeleri × (bagaj 0/1) × (direkt açık/kapalı) × sayfa yenileme × "Seç" → satıcı.
Her hücre için: çakışma var mı, seçili durum doğru mu, uyarı doğru mu.
`live-widget.spec.ts`'e şu kontrolleri ekle:
- sekme tek seçimli;
- filtrelerin tek kontrolü var;
- bagaj sayacı ile arama kutusu eşit;
- sol sütunda iç kaydırma yok;
- öğeler üst üste binmiyor (sınır kutuları kesişmiyor).
`npm run verify:live`'a bagaj senaryosunu ekle. Önce/sonra ekran görüntüleri: `docs/ekran/11-*.png`.

---

## 12. Sekizinci tur (Gemini) — Claude'un canlı denemesinden çıkan sorunlar

Claude, canlı sitede (`https://www.flypirpir.nl`) üç senaryoyu denedi:
- TR, masaüstü, AMS → AYT, 11–17 Ara, 1 kontrol edilen bagaj;
- EN, telefon 360 px, AMS → IST, 15–22 Oca, 2 yetişkin;
- NL, masaüstü, tek yön AMS → ADB, 20 Ara.

Tarih, dil, para birimi ve bagaj eşitlemesi doğru çalışıyor. Aşağıdakiler düzeltilecek.

**KULLANICI KARARI — DEĞİŞTİRME:** Sıralama varsayılanı **"En iyi"** kalır. Kullanıcı, direkt uçuşla en ucuzun ilk iki
sırada gelmesini çok beğendi. Varsayılanı "En ucuz"a çevirme. `enhanceShadow`'un en ucuza göre yeniden sıralaması
"En iyi" sekmesinde widget'ın kendi sırasını bozmamalı; şu anki davranışı koru ve testle sabitle.

Kurallar (bölüm 1, 2, 4), 10. ve 11. turdaki ilkeler aynen geçerli. Önce/sonra ekran görüntüleri: `docs/ekran/12-*.png`.
`npm run e2e` iki derlemede de geçmeli. `npm run verify:live` canlıda geçmeli.

### 12.1 Çok aktarmalı uçuşta havalimanı kodları üst üste biniyor
NL, AMS → ADB tek yön, LOT + Ajet kartı (AMS → WAW → TIA → SAW → ADB, "Reistijd: 2d"): rota çizgisinin altındaki kodlar
"SAW" ile "ADB" çakışıp "SAWDB" gibi okunuyor. 3 aktarmalı uçuşlarda kodlar birbirine değmesin. Gerekirse ara kodları
küçült, satırı iki satıra böl ya da yalnızca uç kodları göster ve aktarma sayısını yaz. 2 ve 3 aktarmalı kartlarla sahte
gölge kökte test et.

### 12.2 Telefonda (360–390 px) kart satırı sıkışık
EN, 360 px, AMS → IST: "03:55 pm" · "Direct flight 3h 30min" · "09:25 pm" birbirine değiyor, sağdaki saat kenara dayanıyor.
12 saatlik biçimde ("pm") daha da sıkışıyor. Telefonda saat satırı rahat okunsun:
- saatler biraz küçülebilir;
- "Direct flight" ile süre alt satıra inebilir;
- kenarlarda en az 12 px boşluk kalsın.
360, 375 ve 390 px'te, TR (24 saat) ve EN (12 saat) ile dene.

### 12.3 Tarih şeridindeki fiyat kartlarla uyuşmuyor
Kullanıcının NL ekran görüntüsü: şeritte "Dec, 1 · €110" seçili, ama o günün en ucuz kartı €129 ("The only direct flight").
Diğer günler "–". Şerit fiyatı widget'ın kendi önbelleğinden geliyor olabilir. Önce nedenini bul:
- €110 hangi uçuşun fiyatı (bagaj, kişi sayısı, aktarma filtresi farkı)?
- Seçili gün için gösterilen fiyat listede var mı?
Sonra düzelt:
- seçili gün hücresi kartlardaki en düşük fiyatla eşleşsin, ya da
- şerit fiyatlarının "yaklaşık" olduğu kısa bir notla belirtilsin (7 dil).
Uydurma fiyat yazma.

### 12.4 Sekme özetleri hiç görünmüyor
"En iyi / En ucuz / En hızlı" sekmelerinin altındaki fiyat · süre özeti canlıda üç senaryonun hiçbirinde görünmedi. Liste
tam yüklenmediği için gizleniyor; pratikte hep gizli. İki yoldan birini seç ve gerekçesini günlüğe yaz:
- (a) widget'ın kendi verisinden (ör. "Aktarmalar" bölümündeki en düşük fiyatlar ya da widget'ın sıralama sonucu) güvenilir
  bir özet çıkar;
- (b) özeti tamamen kaldır, sekmeler sade kalsın.
Yanlış özet göstermektense hiç göstermemek daha iyi.

### 12.5 Bagaj seçiliyken sol sütun fiyatları bagajsız
TR, bagaj 1: kartlar bagajlı fiyat gösteriyor (€276, €294…), ama sol "Aktarmalar" bölümünde "Aktarmasız €187, 1 aktarma
€187" bagajsız fiyatlar. Kullanıcı ikisini karşılaştırınca kafası karışır. Ya bu fiyatları bagaj seçiliyken gizle, ya da
yanlarına "bagajsız" notu ekle (7 dil). Widget'ın bu fiyatları bagajlı vermesi mümkünse onu kullan.

### 12.6 Birden çok yolcu: fiyat kişi başı mı, toplam mı?
EN, 2 yetişkin: kartta "€355". Widget'ın bu fiyatı kişi başı mı toplam mı verdiğini canlıda doğrula (satıcı sayfasındaki
toplamla karşılaştır). Sonra kartın fiyatının altına küçük bir not ekle (7 dil): "2 kişi toplam" ya da "kişi başı". Tek
yolcuda not gerekmez.

### 12.7 Widget'ın İngilizce / bozuk metinleri (bilgi + mümkünse)
NL sayfada "The only direct flight", "Cheapest", "Cheapest with a convenient layover", "May be of interest",
"Baggage +€21", "Show more options" İngilizce. TR'de "Seçme bilet" ("Bileti seç" olmalı), "1 konaklama" ("1 aktarma"
olmalı). Bunlar widget'ın kendi çevirisi.
- Bizim stilde **en sık görülen birkaç metni** (rozetler, Seç butonu, "Daha fazla") gölge kökte metin düğümünü değiştirmeden,
  CSS ile gizleyip yerine kendi 7 dil metnimizi göstermek mümkünse yap. Örnek: `::after` ile içerik ya da yanına küçük bir
  `span`. Widget'ın tıklama/satın alma akışı bozulmamalı.
- Mümkün değilse bunu "WIDGET SINIRI" diye yaz ve Travelpayouts'a iletilecek kısa bir hata bildirimi taslağı hazırla:
  `docs/travelpayouts-ceviri.md`, bozuk metinler ve doğru karşılıkları. Kullanıcı bunu kendisi gönderir.

### 12.8 Küçük
Corendon (CD) logosu küçük boyutta sarı daire gibi görünüyor. Logo widget'ın, dokunma. Yalnızca logonun yanında havayolu
adı gösterilebiliyorsa (çok havayollu kartlarda) bunu dene; gösterilemiyorsa bırak.

### 12.9 Teslim
İş günlüğüne her madde için: neden, ne yapıldı, önce/sonra ekran görüntüsü, "WIDGET SINIRI" notları. Claude kontrol edecek.
Bir maddeyi çözemezsen "CLAUDE'A" diye yaz ve nerede takıldığını açıkla; Claude devralacak.

---

## İş günlüğü

- [hazırlık] Claude — White Label kodu (`NEXT_PUBLIC_TP_WL_HOST`), Travelpayouts sağlayıcısı, logolar, tazelik etiketi,
  direkt uçuş sorgusu, seyrek rotalarda gidiş/dönüş ayrı tek yön fiyatlar. Son commit bu dosyayı ekleyen commit.
- [3.1] White Label bağlandı — kod değişikliği yok — `NEXT_PUBLIC_TP_WL_HOST=ucus.flypirpir.nl` Vercel'e eklenip
  yeniden yayınlandı, Travelpayouts Custom HTML header'ına pirpir logosu konuldu. Doğrulandı:
  `curl -sSI "https://www.flypirpir.nl/git?from=AMS&to=IST&d=2027-01-22&r=2027-01-25&a=1&l=tr&src=results"` →
  `HTTP/2 302` → `https://ucus.flypirpir.nl/flights/AMS2201IST25011?currency=eur&marker=812756.results`;
  `https://ucus.flypirpir.nl` HTTP/2 200 (SSL aktif) ve kullanıcı canlı arama ekranını doğruladı. Bilinen eksik yok.
- [3.2] Next.js güvenlik güncellemesi — commit 736d7df — `next` 16.4.2 → 16.4.5 yükseltildi (`package.json`, `package-lock.json`).
  Denendi: `npm audit --omit=dev` (0 açık), `npm run lint` (`tsc --noEmit` hatasız), `npx next build` (71/71 sayfa),
  yerel `npx next start -p 3123` üzerinde `/` (HTTP 200), `/ara?from=AMS&to=IST&date=2027-01-22&return=2027-01-25` (HTTP 200) ve
  `/git?from=AMS&to=IST&d=2027-01-22&r=2027-01-25&a=1&l=tr&src=results` (HTTP 302 → `tp.media`). Bilinen eksik yok.
- [kontrol] Claude — 3.1 ve 3.2 onaylandı. `npm ci` + `npm audit --omit=dev` (0 açık), `npm run lint`, `npx next build`
  (71/71) temiz; yerelde `/`, `/ara`, sonuç kartları gerçek veriyle çalışıyor. Canlı: `www.flypirpir.nl/git?…a=2&c=1`
  → `ucus.flypirpir.nl/?flightSearch=AMS2201IST250121&marker=812756.results` (3 yolcu, canlı sonuçlar, kimlik doğru).
  Not: White Label para birimini kendi ayarından (EUR) alıyor, adresteki `currency` dikkate alınmıyor; TRY seçen
  ziyaretçi orada EUR görür. Sıradaki iş: 3.3.
- [3.3] Fiyat alarmı e-postaları doğrulandı — kod değişikliği yok — Vercel Production cron (`/api/cron/price-alerts`)
  çalıştırıldı (`Status 200 OK`, Supabase `user_items` okuma+güncelleme, Travelpayouts `prices_for_dates` sorguları).
  Log çıktısı: `Fiyat alarmları kontrol edildi: {"checked":1,"dropped":0,"emailed":0,"skipped":0,"failed":0,"remaining":0,"email":true}`
  (`RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` Production'da tanımlı ve etkin). Bilinen eksik yok.
- [3.4] Tarih şeridi ve fiyat takvimi ay verisine çevrildi — commit 80b50e7 — `src/lib/providers/travelpayouts.ts` içine
  `groupedPrices` (`/aviasales/v3/grouped_prices`) ve `returnMonthPrices` eklendi; `src/lib/price-calendar.ts` ortaklık
  modunda (`priceSource() === "travelpayouts"`) 10 dk `unstable_cache` ile ay verisini kullanıyor (Duffel/örnek mod korundu).
  `DateStrip` (`monthlyPrices`) `/api/date-prices?strip=1` ile ±3 günü tek istekte dolduruyor, kayıt olmayan günler `null` ("Fiyata bak")
  kalıyor. Denendi: `npm run lint`, `npx next build` (71/71 sayfa), yerel mock Travelpayouts + demo sunucularında 8 uçtan uca kontrol
  ve canlı Production doğrulaması (`https://www.flypirpir.nl/api/date-prices?from=AMS&to=IST&date=2027-01-22&return=2027-01-25&strip=1`
  → `{"prices":{"2027-01-19":null,"2027-01-20":null,"2027-01-21":7560,"2027-01-22":7080,...},"failed":false}`). Bilinen eksik yok.
- [not / karar] Gemini — 3.3 ve 3.4 tamamlanıp canlıda doğrulandı; Claude kontrolü ve 3.5 öncesi kararlar için duruldu:
  (1) 3.5'ten mi devam edelim, yoksa önce 3.6–3.8 mi?
  (2) Vercel Hobby planda en fazla 2 cron var (`price-alerts` 1.'si): fırsat taraması ayrı günlük cron (`/api/cron/deals`, 06:00 UTC)
  mı olsun, yoksa mevcut cron'la mı birleşsin?
  (3) `0006_deals.sql` şeması ve fırsat adayı eşiği (ör. rota ortancasına göre belirli yüzde ucuz günler) için özel bir tercih var mı?
- [kontrol] Claude — 3.3 ve 3.4 onaylandı. 80b50e7 incelendi: `groupedPrices`/`returnMonthPrices`, `travelpayoutsDayPrices`
  (gece sayısı kontrolü, ay geçişi, 10 dk önbellek), `DateStrip` tek istek yolu, Duffel/örnek yolu korunmuş. `npm run lint`,
  `npx next build` temiz; gerçek veriyle `/api/date-prices?…&strip=1` (AMS–IST 21: 7560, 22: 7080; AMS–ADB tek yön 21: 5200)
  ve `/api/calendar-prices` (Ocak: 2, 3, 21, 22, 30) doğru. Kayıt olmayan günler `null` ("Fiyata bak").
- [öneri — KULLANICI KARARI BEKLENİYOR] Claude'un Gemini'nin sorularına önerisi. Kullanıcı onaylamadan 3.5'e başlama:
  (1) Sıra: önce **3.6 döviz kuru** (küçük iş, TL fiyatların doğruluğunu etkiliyor), sonra **3.5 fırsat motoru**, sonra 3.7, 3.8.
  (2) Cron: **ayrı** günlük `/api/cron/deals` (06:00 UTC, `CRON_SECRET`). Hobby'de 2 cron sınırı böylece dolar; döviz kuru için
  cron kullanma (istekte `unstable_cache` ile günde bir çek). Tarama 60 sn sınırına sığmalı: rota başına 1–3 `grouped_prices`
  isteği, gerekirse rotalar günlere bölünür.
  (3) `0006_deals.sql`: `id uuid pk default gen_random_uuid()`, `origin`, `destination`, `depart date`, `return_date date null`,
  `price_eur numeric`, `median_eur numeric`, `airline text null`, `transfers int null`, `seen_at date null`, `link text null`
  (Aviasales `/search/…` yolu), `status text check in ('candidate','published','rejected') default 'candidate'`,
  `created_at timestamptz default now()`, `published_at timestamptz null`; `unique (origin, destination, depart, return_date)`;
  RLS açık, politika yok (yalnızca service role). Aday eşiği: rotanın önümüzdeki 90 günlük gün fiyatlarının ortancasının
  **%75'i veya altı** VE en az **30 €** tasarruf VE fiyat **son 3 gün içinde görülmüş**; rota başına en fazla 3 aday.
  Fırsat sayfasında fiyatın görüldüğü gün yazılır; uydurma tazelik ("x saat önce") yazılmaz.
- [düzeltme] Claude — kullanıcı geri bildirimi (sonuç sayfası, seyrek rotalar): yakın tarih kartları seçilen tarihe
  yakınlığa göre sıralanıyor (önce tam gün, sonra ±1…), seçilenden farklı günde "Gidiş: Per 17 Ara · 1 gün önce" etiketi;
  önbellekli modda tarih şeridi hep görünüyor; sonuç yokken filtre paneli ve sıralama sekmeleri gizli (yakın tarih
  kartlarına uygulanmıyorlardı); "Filtreleri temizle" tek satır. Denendi: AMS–ADB 18–25 Ara (lint, build, ekran görüntüsü).
- [düzeltme 2] Claude — kullanıcı: "biletleri bulamıyorum", "filtre neden kaldırıldı". Filtre paneli ve sıralama geri geldi;
  sonuç yokken filtreler yakın tarih kartlarına da uygulanıyor (havayolu/süre seçenekleri onlardan). Gidiş-dönüş kaydı
  yoksa aynı günlerin tek yön biletleri birleştirilip normal sonuç oluyor ("2 ayrı bilet", "Gidiş biletine git" /
  "Dönüş biletine git"; filtre, sıralama, rozetler çalışır). Az sonuçta (1–4) ve sonuç yokken net canlı arama çağrısı.
  Önbellek anahtarı `search-v5`. Son kullanıcı testi (Playwright, masaüstü + iPhone 13): ana sayfadan arama akışı;
  AMS–IST GD (19 kart), AMS–ADB 18–25 Ara (yakın tarih + canlı arama), AMS–ADB tek yön, AMS–ADB 21–30 Oca (birleşik
  biletler), DUS–AYT; "Aktarmasız" filtresi her senaryoda doğru, JS hatası yok.
- [3.6] Gerçek döviz kurları (ECB günlük XML) — commit c894146 — `src/lib/currency-server.ts` içine `parseEcbXml` ve
  `getRates` (`unstable_cache`, 24 saat, cron yok; `AED = USD * 3.6725`; hatada örnek kurlara düşer, hata önbelleklenmez) eklendi.
  `LocaleLayout` → `CurrencyProvider` ile kurlar tarayıcıya aktarılıyor (`PriceAlertButton` dahil); `travelpayouts`, `duffel`,
  `price-calendar`, `price-drop` e-postası ve `plan-data` PDF'i güncel kurları kullanıyor. Denendi: `npm run lint`,
  `npx next build` (71/71 sayfa, tüm SSG sayfaları korundu) ve uçtan uca test: canlı ECB XML (1 EUR = 55.6474 TRY),
  `100 EUR → 5565 TRY`, SSR HTML içinde güncel kur, kırık ECB URL'inde `100 EUR → 4000 TRY` yedek kur + HTTP 200. Bilinen eksik yok.
- [canlı widget] Claude — kullanıcı kararı: önbellekte olmayan günler için canlı sonuçlar sayfanın içinde (White Label
  **Widget** türü). Kod hazır (`LiveWidget.tsx`, `NEXT_PUBLIC_TP_WL_WIDGET_ID`), kullanıcı widget'ı Travelpayouts'ta
  oluşturup kimliği verince Vercel'e eklenecek ve canlıda doğrulanacak. 3.6 (Gemini, ECB kurları) birleştirildi ve
  kontrol edildi: lint + build temiz, son kullanıcı senaryoları (masaüstü + telefon) geçti.
- [3.5] Fırsat motoru (5 alt adım) — commits 70f7284 (1/5 veri+cron), 95c85e5 (2/5 `/yonetim/firsatlar`), 723ac8f (3/5 `/firsatlar`
  ve `/firsatlar/[id]`, 7 dil), b46776c (4/5 `next/og` görsel + WhatsApp/Telegram paylaşım), 46f1f72 (5/5 ana sayfa fırsat kartları
  entegrasyonu + async server action düzeltmesi).
  - `supabase/migrations/0006_deals.sql`: `deals` tablosu, `unique nulls not distinct (origin, destination, depart, return_date)`, RLS açık (politika yok).
  - `/api/cron/deals` (`vercel.json` 06:00 UTC, `CRON_SECRET`): günlük 24 rota × 3 ay `grouped_prices`; 90 günlük ortancanın ≤%75'i,
    ≥30 € tasarruf, son 3 günde görülmüş, rota başına en fazla 3 aday.
  - `/yonetim/firsatlar`: `ADMIN_EMAILS` korumalı (üretimde yalnızca doğrulanmış Supabase oturumu), Yayınla / Reddet / Adaya al / Şimdi tara, `noindex` + `robots.txt`.
  - `/firsatlar` + `/firsatlar/[id]` (7 dilde yerelleştirilmiş adres ve `messages/*/deals.json`): `goHref(..., "deal:<id>", locale)`,
    fiyatın görüldüğü gerçek gün (`seen_at`), `next/og` 1200x630 PNG (`Nunito` Türkçe glifli), WhatsApp/Telegram/Kopyala paylaşım.
  - Ana sayfa (`src/lib/deals.ts` + `PopularFlights.tsx`): yayınlanmış fırsat varsa ondan beslenir, yoksa eski davranış.
  - Denendi: `npm run lint`, `npx next build` (85/85 sayfa), `/api/cron/deals` (401 + 200, 24 rota, 75%/30 €/3 gün/max-3 eşiği),
    7 dilde `/firsatlar` (HTTP 200), `/firsatlar/<yok>` (404), `opengraph-image` (geçerli PNG 20199 bayt), `/yonetim/firsatlar` (girişsiz 307 → `/giris`),
    `/robots.txt` ve `/sitemap.xml`.
  - Kullanıcı kurulumu gerekiyor (canlı aktivasyon): (1) Supabase SQL Editor'da `supabase/migrations/0006_deals.sql` çalıştırılmalı,
    (2) Vercel → Environment Variables → `ADMIN_EMAILS` (kendi giriş e-postası, Production) eklenip yeniden yayınlanmalı.
  - Sıradaki işler: 3.7 (`/yonetim/tiklamalar`) ve 3.8 (Gizlilik/çerez metni).
- [kontrol] Claude — 3.5 onaylandı. İncelendi: `ADMIN_EMAILS` + doğrulanmış Supabase oturumu (`getAdminUser`), tüm yönetim
  eylemleri sunucuda yetki kontrolünden geçiyor; herkese açık sayfalar yalnızca `published` okuyor (taslak id → 404);
  cron `CRON_SECRET` (anahtarsız 401); `deals` RLS açık, politika yok; aday kuralları DEVAM önerisiyle aynı. lint + build
  (temiz) ve son kullanıcı senaryoları geçti. `/firsatlar`, `/en/deals` 200, `/yonetim/firsatlar` girişsiz 307.
  Canlı widget: `NEXT_PUBLIC_TP_WL_WIDGET_ID=25161` ile yerelde betik yükleniyor ve `flightSearch=AMS2712ADB1` ekleniyor;
  sonuçların gerçekten göründüğü Vercel'de değişken eklenince canlıda doğrulanacak. 3.7 ve 3.8'e geçilebilir; 3.8'de
  White Label widget'ının (tpwgt.com) çerezleri de gizlilik metnine girmeli.
- [3.7] Tıklama raporu (`/yonetim/tiklamalar`) — commit e241125 — `src/lib/click-report.ts` Supabase `clicks` tablosundan
  son 30 günü tek sorguda okuyup 7/30 gün toplamı, günlük dağılım, en çok tıklanan rotalar, kaynaklar (`src`: `results`, `empty`,
  `deal:...`), ortak (`partner`) ve pazar (`market`) kırılımını hesaplıyor (salt okunur). `/yonetim/tiklamalar` sayfası
  `ADMIN_EMAILS` + doğrulanmış Supabase oturumu korumalı, `noindex` + `robots.txt`, `/yonetim/firsatlar` ile karşılıklı bağlantılı.
  Denendi: `npm run lint`, `npx next build` (92/92 sayfa), `/yonetim/tiklamalar` girişsiz 307 → `/giris`. Bilinen eksik yok.
- [3.8] Gizlilik ve çerez metni (7 dil) — commit c331099 — `src/content/legal/privacy.ts` içinde 7 dilin tamamına (`tr`, `en`, `nl`,
  `de`, `fr`, `es`, `it`) "Ortaklık bağlantıları ve canlı arama" (`id: "ortaklik"`) bölümü eklendi ve `id: "cerezler"` bölümü
  Travelpayouts / Aviasales White Label arama sayfası ile canlı arama widget'ının (`tpwgt.com`) üçüncü taraf çerezlerini dürüstçe
  açıklayacak şekilde güncellendi; tüm hukuki yer tutucular (`[ŞİRKET ADI]`, `[ADRES]`, `[İLETİŞİM E-POSTASI]`, `[SAKLAMA SÜRESİ]`,
  `[ORTAKLIK ÇEREZ DETAYLARI]`) köşeli parantezle korundu. Denendi: `npm run lint`, `npx next build` (92/92 sayfa), 7 dilde
  `/gizlilik`, `/en/privacy`, `/nl/privacy`, `/de/datenschutz`, `/fr/confidentialite`, `/es/privacidad`, `/it/privacy` HTTP 200
  ve içerik doğrulaması (`tpwgt.com`, `Travelpayouts`, `[ORTAKLIK ÇEREZ DETAYLARI]`). İş listesindeki 3.1–3.8 maddelerinin tamamı tamamlandı.
- [canlı widget — canlıda doğrulandı] Claude — `NEXT_PUBLIC_TP_WL_WIDGET_ID=25161` ile www.flypirpir.nl'de AMS→ADB 27 Ara:
  "Canlı uçuşlar" bölümünde gerçek sonuçlar (SunExpress direkt 182 €, en ucuz 144 €, "Daha fazla uçuş göster").
  3.7 ve 3.8 onaylandı (tıklama raporu yönetici korumalı ve salt okunur; gizlilik metni 7 dilde, yer tutucular korunmuş).
  Düzeltme: widget adresi `?flightSearch=AMS2712ADB1` biçimine çeviriyor; `parseSearch` bu kodu okuyor
  (`fromAviasalesRoute`), yenilemede/paylaşımda arama korunuyor.
- [karar + uygulama] Claude — kullanıcı kararı: sonuç sayfasının ana listesi her aramada **canlı uçuşlar** (White Label
  widget). Ortaklık modunda ve widget kimliği tanımlıyken (`liveOnly`, tek kalkış/varış) önbellekli kart listesi
  gösterilmez; tarih şeridi, fiyat trendi ve fiyat alarmı önbellek verisiyle kalır. Birden çok kalkış/varış yerinde eski
  liste. Widget sayfa içi geçişte (tarih şeridi, arama kutusu) sayfayı yeniden yükleyerek yeni aramayla başlar.
- [5.1] Son kullanıcı test takımı (`@playwright/test`) — commit 3cac615 — `playwright.config.ts`, `tests/e2e/pirpir.spec.ts`
  ve `tests/e2e/mobile.spec.ts` eklendi; `package.json`'a `"e2e": "playwright test"`, `.gitignore`'a rapor klasörleri,
  `docs/GELISTIRME.md`'ye çalıştırma notu işlendi. Tarayıcı yolu hem Linux (`/opt/pw-browsers/chromium`) hem macOS Chrome'u
  otomatik algılar, `trace: "off"` ve ağsız örnek modda (`next start -p 3111`) koşar. Masaüstü (1440×900) ve iPhone 13
  (390×844) testleri: ana sayfa (TR/EN), arama kutusu→öneri→takvim→sonuç akışı, sonuçlarda filtre/sıralama/tarih şeridi,
  `/git` 302+parametreler, `/firsatlar` + `/en/deals`, `/ucuslar/amsterdam/istanbul`, 7 dil gizlilik 200, `/yonetim/*` 307,
  `/api/cron/*` 401, yatay taşma ve JS/konsol hatası yok. Denendi: `npm run lint`, `npx next build` (92/92), `npm run e2e`
  (11/11 geçti, 4.9 sn). Bilinen eksik yok.
- [5.2] Rota sayfaları gerçek veriye ve pazar rotalarına bağlandı — commit 0d4ad0d — `src/lib/providers/travelpayouts.ts`
  (`groupedPrices` için `departureAt` isteğe bağlı), `src/data/route-guides.ts` (14 popüler varış şehri için 7 dilde
  havalimanı kartları, karakter ipuçları ve illüstrasyon eşlemesi), `src/lib/route-data.ts` (editöryal + tüm `MARKETS`
  rotaları kataloğu, Travelpayouts `grouped_prices` `group_by=month` + 3 ay `departure_at`, 8 saat `unstable_cache`,
  ECB döviz kurları, otomatik saat farkı ve süre). `MonthlyPrices.tsx` veri olmayan aylarda "Fiyata bak" gösterir (fiyat
  uydurmaz) ve görüldüğü gün (`seenAt`) ile arama bağlantısı sunar; `CheapestDates` her satırda `searchHref` ("Seç") ve
  ortaklık modunda `goHref(..., "route:<slug>")` ("Fırsata git") + `seenAt` verir. `page.tsx` öncelikli rotaları statik
  (`generateStaticParams`), kalan pazar rotalarını ISR (`revalidate = 21600`) ile sunar, bilinmeyen rotalar 404;
  `sitemap.ts` tüm katalog rotalarını 7 dilde içerir; 7 dil `messages/*/route.json` güncellendi; demo mod korundu.
  Denendi: `npm run lint`, `npx next build` (274/274 sayfa), yerel mock Travelpayouts doğrulaması (`grouped_prices`
  ay+gün çağrıları, `26 Kas` görülme tarihi, `src=route:viyana-istanbul`, "Fiyata bak", 404, EN rota, `/sitemap.xml`),
  `npm run e2e` (11/11 geçti). Bilinen eksik yok.
- [5.3] Ana sayfa ortaklık moduna tam uyum — commit aa76f40 — `src/lib/deals.ts` içinde ortaklık modunda
  (`priceSource() === "travelpayouts"`) yayınlanmış fırsatı olmayan popüler hedefler için önümüzdeki 60 günün
  `groupedPrices` taraması (`cachedTpCheapest60d`, 2 saat `unstable_cache`, ECB kurları, `seenDate`) eklendi
  (`getBestDates` de bunu kullanır). `PopularFlights.tsx` ve `CharacterTips.tsx` (Bulut/Roma, Güneş/Antalya)
  ortaklık modunda `"…’dan"` biçimini, fiyatın görüldüğü gerçek günü (`seenDate`) ve 60 günlük Aviasales önbellek
  notunu (`noteLiveAff`) gösterir. `Faq.tsx` ve 7 dilde `messages/*/home.json` (`bagsAff`, `transferAff`, `priceFrom`,
  `seenDate`, `noteLiveAff`) ortaklık gerçeğine uyarlandı (bilet satmıyoruz, bagaj/aktarma ayrıntıları canlı listede ve
  satıcıda; `[İPTAL KOŞULLARI]` yer tutucusuna dokunulmadı). Denendi: `npm run lint`, `npx next build` (274/274),
  yerel mock Travelpayouts doğrulaması (`/api/deals?from=AMS` → 17/17 hedef dolu, `seenDate`, `"…’dan"`, SSS metinleri)
  ve `npm run e2e` (tüm 5 kategori sekmesi dahil 11/11 geçti). Bilinen eksik yok.
- [5.4] Fiyat alarmı e-postası ortaklık moduna uyarlandı — commit 6cbfa00 — `src/lib/alert-criteria.ts` (`AlertBest` içine
  `seenAt` ve `deepLink` eklendi), `src/lib/price-alerts.ts` (ana düğme canlı sonuç sayfasına `searchUrl` giderken
  ortaklık modunda ikincil `dealUrl = goHref(..., "alert:<id>", lang)` ve `best.seenAt` iletilir; böylece tıklama
  raporunda `alert:<id>` kaynağı görünür), `src/lib/emails/price-drop.ts` (7 dilde `"Fırsata git"` ikincil düğmesi ve
  `"Fiyat bugün / dün / {n} gün önce görüldü"` satırı hem HTML hem düz metin e-postaya eklendi, mevcut e-posta tasarımı
  korundu). Denendi: `npm run lint`, `npx next build` (274/274), `npm run e2e` (11/11 geçti). Bilinen eksik yok.
- [5.5] Performans ve erişilebilirlik denetimi — commit 17e7069 — Lighthouse 13.6.0 (`--headless=new --no-sandbox`) ile
  `/`, `/ara?...`, `/firsatlar` ve `/ucuslar/amsterdam/istanbul` masaüstü + mobil profillerde denetlendi; özet ve en
  büyük 5 bulgu `docs/denetim.md`'ye yazıldı. İki güvenli erişilebilirlik düzeltmesi yapıldı: (1) `src/app/[locale]/page.tsx`
  ana içeriği `<main>` içine alındı (`landmark-one-main`, ana sayfa Erişilebilirlik 98 → 100), (2) `HeaderControls.tsx`
  bölge düğmesinde `aria-label` yerine `title` + `sr-only` kullanıldı (`label-content-name-mismatch` tüm sayfalarda
  sıfırlandı). Düzeltme sonrası tüm 4 sayfada (masaüstü + mobil) Erişilebilirlik 100, En İyi Uygulamalar 100, SEO 100,
  Performans 90–100. Canlı widget betiği (`tpwgt.com`) için yalnızca rapor yazıldı, Claude'un dosyalarına dokunulmadı.
  Denendi: `npm run lint`, `npx next build` (274/274), 8 Lighthouse ölçümü ve `npm run e2e` (11/11 geçti). Bilinen eksik yok.
- [5.6] Hukuki yer tutucular listesi — commit 32fd29a — `src/` ve `messages/` taranarak tüm köşeli parantezli hukuki ve
  destek yer tutucuları (`[ŞİRKET ADI]`, `[ADRES]`, `[İLETİŞİM E-POSTASI]`, `[SAKLAMA SÜRESİ]`, `[ORTAKLIK ÇEREZ DETAYLARI]`,
  `[UYGULANACAK HUKUK]`, `[DESTEK TELEFONU]`, `[İPTAL KOŞULLARI]`, `[DESTEK SAATLERİ]`, teknik `[PNR]`) dosya/satır
  numaraları ve öncelik tablosuyla `docs/yer-tutucular.md`'ye listelendi. Hiçbir metin değiştirilmedi. Bilinen eksik yok.
- [5.7] Sonraki fikirler öneri bölümü eklendi — kod değişikliği yok — Telegram/WhatsApp fırsat kanalı otomasyonu,
  haftalık e-posta bülteni ve fırsat sayfaları SEO'su için 3–5 satırlık öneriler ve gereken hesap/anahtar listesi
  aşağıdaki bölüme eklendi. İkinci tur iş listesindeki 5.1–5.7 maddelerinin tamamı tamamlandı.

---

## 6. Sonraki Fikirler (5.7 Önerileri — Kod Yok, Kullanıcı Kararı İçin)

### 6.1 Telegram / WhatsApp Fırsat Kanalı Otomasyonu
- `/yonetim/firsatlar` panelinde bir fırsat "Yayınla" dendiğinde, halihazırda üretilen `opengraph-image` (1200×630 PNG) görseli, fiyat/tasarruf özeti ve `goHref(..., "tg:<id>")` / `firsatlar/<id>` bağlantısıyla otomatik olarak Telegram kanalına gönderilebilir (`sendPhoto`).
- WhatsApp Kanalları (Channels) için resmî Meta Cloud API doğrudan otomatik yayın açmadığından, şimdilik yönetim panelindeki tek tıkla "WhatsApp paylaşım metnini kopyala" akışı korunabilir; ileri aşamada yalnızca onaylı şablonlarla WhatsApp Business API (birebir bildirim) düşünülebilir.
- **Gereken hesap/anahtar:** Telegram için `@BotFather` botu (`TELEGRAM_BOT_TOKEN`) + herkese açık kanal adı/kimliği (`TELEGRAM_CHANNEL_ID`, bot kanalda yönetici olmalı). WhatsApp Business API istenirse Meta Business doğrulaması + `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID` (ücretli konuşma tarifesi).

### 6.2 Haftalık Fırsat E-posta Bülteni
- Ana sayfa ve `/firsatlar` altına tek satırlık çift onaylı (double opt-in, GDPR/KVKK uyumlu) "Haftanın en ucuz uçuşları" kaydı eklenebilir; kalkış pazarı (ör. Hollanda / Almanya / Türkiye) ve dil bilgisi Supabase `newsletter_subscribers` tablosunda tutulur.
- Haftada bir (ör. Perşembe sabahı) yayınlanmış en iyi 5 fırsat seçilip mevcut Resend altyapısı ve `price-drop.ts` tasarım diliyle gönderilir; her e-postada tek tıkla `List-Unsubscribe` ve `src=newsletter:<tarih>` tıklama takibi bulunur.
- **Gereken hesap/anahtar:** Mevcut `RESEND_API_KEY` ve `EMAIL_FROM` yeterli (ücretsiz katman günde 100 / ayda 3.000 e-posta; abone büyüyünce Resend Pro veya Brevo/Buttondown düşünülebilir) + yeni Supabase göçü (`0007_newsletter.sql`). Vercel Hobby'de 2 cron sınırı dolu olduğundan gönderim ya `/yonetim/firsatlar` içinden tek tuşla ("Haftalık bülteni gönder") tetiklenir ya da Vercel Pro'ya geçilir.

### 6.3 Fırsat Sayfalarının SEO'su
- `/firsatlar/[id]` sayfalarına `Event`/`Offer` veya `Product` yerine Google'ın kurallarına uygun `BreadcrumbList` + `FAQPage` (veya temiz `WebPage` + `Offer` yapılandırılmış veri) ve her yayınlanmış fırsatın `sitemap.xml` içine dinamik eklenmesi organik trafik getirir.
- Süresi geçmiş (tarihi geçmiş) fırsat sayfaları sert 404 yerine ilgili kalıcı rota sayfasına (`/ucuslar/[nereden]/[nereye]`) yönlendiren "Bu fırsat sona erdi — bu rotanın güncel fiyatlarına bak" bilgi kartı (veya `301` yönlendirme) göstererek kazanılan bağlantı değerini korur.
- Şehir bazlı fırsat arşiv sayfaları (ör. `/firsatlar/amsterdam-cikisli`, `/firsatlar/istanbul-ucuslari`) ile dahili bağlantılar güçlendirilebilir.
- **Gereken hesap/anahtar:** Ek ücretli anahtar gerekmez; yalnızca Google Search Console ve Bing Webmaster Tools doğrulanıp `https://www.flypirpir.nl/sitemap.xml` bildirilmelidir (isteğe bağlı olarak trafik ölçümü için çerezsiz Plausible/Umami).
- [kontrol] Claude — 5.1–5.7 onaylandı. Claude'un dosyalarına dokunulmamış. `npm ci`, `npm run lint`, `npx next build`,
  `npx playwright test` (11/11 geçti, masaüstü + iPhone 13). Canlı rota sayfası gerçek veri: AMS–IST "€131'dan", aylık grafik
  (veri olmayan ay "—"), yaklaşan tarihlerde görülme günü. Not: rota sayfaları derlemede üretiliyor; token'sız yerel derleme
  örnek veri gösterir (beklenen).
- [düzeltme] Claude — canlı liste: widget'ın kendi tarih şeridi gizlendi (sayfada iki şerit vardı, widget'ınkine tıklayınca
  arama kutusu ve üst şerit eski günde kalıyordu); kart/rozet/düğme/fiyat stili gölge DOM'a eklenerek uygulandı (canlıda
  masaüstü + telefon doğrulandı). Widget'ın canlı araması bu bulut ortamından 403 alıyor; widget içi filtre testi yapılamadı.
- [7.1] Travelpayouts yerel sahte sunucusu ve gerçek-veri testleri — commit 10cd673 — `tests/e2e/fixtures/travelpayouts-data.json`
  (gerçek Aviasales v3 yanıt biçiminde test verisi) ve `tests/e2e/fixtures/mock-travelpayouts.mjs` (`grouped_prices` +
  `prices_for_dates`) eklendi. `playwright.config.ts` içine ikinci Next sunucusu + sahte Travelpayouts sunucusuyla çalışan
  `"affiliate"` projesi (`TRAVELPAYOUTS_TOKEN=test`, `NEXT_PUBLIC_TP_WL_WIDGET_ID=""`) eklendi; saf fırsat seçim kuralları
  `src/lib/deal-rules.ts` olarak ayrıldı (`deal-scanner.ts` yeniden dışa aktarır). `tests/e2e/affiliate.spec.ts` kapsamı:
  rota sayfası (`/ucuslar/viyana/istanbul` aylık grafik + "Fiyata bak" + görülme günü + `src=route:viyana-istanbul`),
  ana sayfa popüler uçuşlar (60 günlük `groupedPrices` + kategori sekmeleri), `/api/date-prices?strip=1` (±3 gün + `null`)
  ve `pickDealCandidates` birim testi (%75 / 30 € / 3 gün / max 3). Denendi: `npm run lint`, `npx next build` (274/274),
  `npm run e2e` (15/15 geçti, 6.9 sn). Bilinen eksik yok.
- [7.2] Fiyat alarmı penceresi önbellek fiyatıyla — commit 37fb41e — `src/lib/alert-price.ts` ve `src/app/api/alert-price/route.ts`
  eklendi (10 dk `unstable_cache` + `Cache-Control: private, max-age=600`; tam tarihte `searchFlightsCached`/`prices_for_dates`,
  ±3 gün esnek veya boş sonuçta `groupedPrices`; geçersiz sorguda 400). `PriceAlertButton.tsx` dış props'unu değiştirmeden
  (`LiveResults.tsx` değişikliği gerekmedi) pencere açılınca ve esneklik/aktarma değişince `/api/alert-price` çağırır,
  "x gün önce görülen fiyat" yazar, veri yoksa "Şu an kayıtlı fiyat yok, düşünce haber veririz." diyerek alarm kurulumunu
  açık bırakır. 7 dilde `messages/*/results.json` güncellendi. Denendi: `npm run lint`, `npx next build` (275/275),
  `npm run e2e` (yeni `/api/alert-price` + pencere akışı testi dahil 16/16 geçti, 6.8 sn). Bilinen eksik yok.
- [7.3] Ortaklık modunda satış kalıntıları temizlendi — commit 97ab49d — Taranan ve düzeltilen kalıntılar (tümü
  `isAffiliate()` korumalı, satış modu bozulmadı):
  (1) Yönlendirmeler: `src/proxy.ts` (7 dilde `/biletlerim` → `/hesap`, `/rezervasyon/*` → `/` HTTP 307) ve
  `biletlerim/page.tsx`, `rezervasyon/[teklifId]/onay/page.tsx`, `rezervasyon/[teklifId]/plan/page.tsx` sunucu
  yönlendirmeleri eklendi.
  (2) Hesap ve profil menüsü: `hesap/page.tsx` ve `ProfileMenu.tsx` içinde "Kayıtlı yolcular" (`#yolcular` — "rezervasyonda
  tek tıkla doldur") ortaklık modunda gizlendi; alarmlar ve favoriler kaldı.
  (3) Giriş penceresi: `LoginPanel.tsx` içinde "Rezervasyonu yanlış e-postayla mı yaptın?" satırı ortaklık modunda gizlendi.
  (4) Arama kutusu & altbilgi: `SearchForm.tsx` ve 7 dilde `messages/*/home.json` (`search.bagsNoteAff`) bagaj ücretlerinin
  satıcıda gösterildiğini dürüstçe yazar; `SiteFooter.tsx` Yardım/Bagaj/İptal linkleri `/#sss`, `/#sss-bags`, `/#sss-cancel`
  bölümlerine bağlandı.
  (5) Kullanım Koşulları: `src/content/legal/terms.ts` içine 7 dilde `termsAffiliate` eklendi ("bilet satmaz", ödeme/iptal/bagaj
  satıcıda, hukuki yer tutucular korundu) ve `kosullar/page.tsx` ortaklık modunda bunu gösterir. (E-postalar, SSS, `Steps`,
  `HomeHero`, `MobileNav` kontrol edildi — zaten ortaklık moduna uyumlu.)
  Denendi: `npm run lint`, `npx next build` (275/275), `npm run e2e` (TR/EN 307 yönlendirmeleri ve `/kosullar` doğrulaması
  dahil 17/17 geçti, 7.1 sn). Bilinen eksik yok.
- [7.4] Rota sayfası kataloğu ve iç bağlantılar — commit 850bfda — `src/lib/route-data.ts` kataloğu tüm `MARKETS`
  rotaları + ana kalkış merkezleri (`AMS`, `DUS`, `FRA`, `BRU`, `IST`) × Türkiye'nin büyük havalimanları (`IST/SAW`,
  `AYT`, `ADB`, `ESB`, `DLM`, `BJV`, `GZT`, `TZX`, `ASR`) ile 180 rota üst sınırında genişletildi ve `sitemap.ts`
  otomatik içerir. İç bağlantılar rota sayfalarına çevrildi: `OtherCities` ("Türkiye'de başka nereler?" dahil), ana sayfa
  `PopularRoutes.tsx` ve `SiteFooter.tsx` (İstanbul/Antalya/İzmir). İçerik uydurulmaz: şehir rehberi olmayan rotalarda
  (ör. Ankara, Trabzon) `Airports` ve `RouteTips` bölümleri gizlenir; mevcut şehir SVG'leri (`Ankara`, `Bodrum`,
  `Gaziantep`, `Trabzon`, `Kayseri`) hero görselinde kullanılır. Denendi: `npm run lint`, `npx next build` (324/324),
  `npm run e2e` (iç bağlantı + rehbersiz gizleme + sitemap kontrolleri dahil 17/17 geçti, 8.3 sn). Bilinen eksik yok.
- [7.5] SEO temelleri — commit a8358cc — `src/lib/seo.ts` (`alternatesFor` 7 dil hreflang + `x-default` + kanonik adres,
  `safeJsonLd`) eklendi ve tüm herkese açık sayfalara (`/`, `/ucuslar/[nereden]/[nereye]`, `/firsatlar`, `/firsatlar/[id]`,
  `/gizlilik`, `/kosullar`) uygulandı; rota sayfalarına 7 dilde özgün `metaDescription` ve `ogFromPrice` eklendi.
  Yapılandırılmış veri: `Faq.tsx` → `FAQPage` (yalnızca sayfadaki gerçek metin), rota sayfası → `BreadcrumbList`; fiyat
  için `Offer` şeması eklenmedi. `ucuslar/[nereden]/[nereye]/opengraph-image.tsx` (1200×630 `next/og` PNG, Nunito fontu,
  rota + `"…’dan"` fiyatı + görüldüğü gün, 6 saat ISR) eklendi. `docs/denetim.md`'ye SEO bölümü eklendi.
  CLAUDE'A: `src/app/[locale]/ara/page.tsx` Claude alanında olduğu için dokunulmadı; sorgu parametreli sonuç sayfasının
  `robots: { index: false }` / `alternates` ayarı uygunsa Claude tarafından kontrol edilebilir.
  Denendi: `npm run lint`, `npx next build` (324/324), `npm run e2e` (canonical, 7 dil hreflang + x-default, FAQPage,
  BreadcrumbList, Offer yok, geçerli rota OG PNG dahil 18/18 geçti, 8.4 sn). Bilinen eksik yok.
- [7.6] Çeviri bütünlüğü denetimi — commit b7eefef — `scripts/check-messages.mjs` eklendi (`7 dil × 8 dosya` için
  dosya listesi, anahtar/dizi eşitliği, boş metin yokluğu, dengeli ICU parantezleri, `{brand}` / `{partner, select, …}`
  yer tutucu ve zengin metin `<tag>` tutarlılığı). `package.json`'a `"check:messages"` eklendi ve `"e2e"` öncesi
  otomatik çalışacak şekilde bağlandı. 7 dil tarandı: 0 eksik/fazla anahtar, 0 boş metin, 0 çevrilmemiş İngilizce metin.
  Denendi: `npm run check:messages`, `npm run lint`, `npm run e2e` (18/18 geçti, 9.1 sn). Bilinen eksik yok.
- [7.7] Telegram fırsat kanalı (kapalı özellik olarak) — commit 78d9755 — `src/lib/telegram.ts` (`isTelegramConfigured`,
  `buildDealTelegramPayload`, `postDealToTelegram`) eklendi ve `src/actions/admin-deals.ts` içindeki `approveDeal` eylemine
  bağlandı. `TELEGRAM_BOT_TOKEN` ve `TELEGRAM_CHANNEL_ID` ikisi birden tanımlıysa fırsat yayınlandığında Telegram Bot API
  `sendPhoto` ile fırsatın `opengraph-image` görseli + kısa mesaj (rota, fiyat, normal fiyat/indirim, tarih, görüldüğü gün,
  `/firsatlar/<id>` bağlantısı) gönderilir; değişkenler eksikse hiçbir şey yapmaz. Ağ/API hataları loglanır (token asla
  loglanmaz) ve yayınlamayı engellemez. Kurulum adımları `docs/GELISTIRME.md` ve `.env.example` dosyalarına eklendi.
  Denendi: `npm run lint`, `npm run check:messages`, `npx next build` (324/324), `npm run e2e` (sahte `fetch` ile kapalı/açık/hata
  birim testi dahil 19/19 geçti, 7.9 sn). Bilinen eksik yok.
- [8.1] Tarih kayması ("2–9 Ocak seçtim, 1–8 Ocak geldi") — commit 6ee73d7 — Canlı sitede (`https://www.flypirpir.nl`,
  gerçek Chrome, `Europe/Amsterdam` ve `Europe/Istanbul` saat dilimleri, TR ve EN) birebir yakalandı:
  - **Canlıda görülen hata:** Ana sayfa (en ucuz önerisi `4 – 6 Ara` üzerine) → Amsterdam → İzmir → `2 – 9 Oca` → "Bilet bul"
    → adres önce `https://www.flypirpir.nl/ara?from=AMS&to=ADB&date=2027-01-02&return=2027-01-09&adults=1`, sonra
    `LiveWidget` buna `&flightSearch=AMS0201ADB09011` ekledi, ardından Travelpayouts widget'ı (`tpwgt.com/wl_web/main.js`)
    sayfayı `https://www.flypirpir.nl/ara?flightSearch=AMS0101ADB08011` adresine `window.location.replace` ile yönlendirdi;
    üst kutu `1 – 8 Oca` ve kartlar `1 oca, Cu / 8 oca, Cu` gösterdi (ekran görüntüsü: `docs/ekran/8-1-tr-desktop.png`).
    Aynı kayma üst çubuktan `12 – 19 Oca` (`AMS1201ADB19011` → `AMS1101ADB18011`) ve EN (`/en/search?...` →
    `/en/search?flightSearch=AMS0101ADB08011`) aramalarında da tekrarlandı.
  - **Kök neden (`tpwgt.com/wl_web/main-KJY88x2v.js`, `Vl()` → `Fq()`):** Widget adreste `flightSearch` ile birlikte
    `adults` (veya `children`/`infants`/`depart_date`/`return_date`) görünce `Q = true` dalına girip `flightSearch`'ü
    yeniden üretiyor; `Fq()` yerel gece yarısı tarihine `.toISOString().split("T")[0]` uyguladığı için UTC+1 / UTC+3
    saat dilimlerinde tarihler 1 gün geri kayıyor (`2027-01-02` → `2027-01-01`) ve `window.location.replace` ile sayfa
    yeniden yükleniyor. Ayrıca `LiveWidget`'ın `urlchange` eşitlemesi `adults=1`'i adrese geri koyduğu için yenilemede
    ikinci kez kayma riski vardı.
  - **Canlıda kanıt:** `https://www.flypirpir.nl/ara?flightSearch=AMS0201ADB09011` (`adults` olmadan) doğrudan açıldığında
    hem `Europe/Amsterdam` hem `Europe/Istanbul` saat dilimlerinde `tickets-api.apistp.com/search/wl/start` isteği tam
    olarak `2027-01-02` ve `2027-01-09` ile gitti, kartlar `2 oca, Ct / 9 oca, Ct` ve üst çubuk `2 – 9 Oca` gösterdi.
  - **Düzeltme:** `src/lib/live-widget-url.ts` (`cleanWidgetUrl`, `widgetSyncQuery`) eklendi. `LiveWidget.tsx` betiği
    yüklemeden önce adresi yalnızca `flightSearch` (ve zararsız widget parametreleri) kalacak şekilde temizler; yeni aramada
    `window.location.replace(cleanWidgetUrl(...))` kullanır; `urlchange` eşitlemesinde `adults` vb. geri eklenmez.
    Test altyapısı için `src/config/affiliate.ts` + `ara/page.tsx` + `LiveResults.tsx` çalışma zamanı `widgetId` desteğine
    kavuştu; `playwright.config.ts` içine `Europe/Amsterdam` saat dilimli `"live-widget"` projesi ve `tests/e2e/live-widget.spec.ts`
    (widget'ın gerçek `Vl()` hatasını simüle eden sahte betikle ana sayfa → sonuç → yenileme → üst çubuk → `urlchange`) eklendi.
  - Denendi: `npm run lint`, `npm run check:messages`, `npx next build` (324/324), `npm run e2e` (21/21 geçti, 11.5 sn).
    Not: Canlı `flypirpir.nl` üzerinde son doğrulama Vercel'e yayınlandıktan sonra yapılabilir.
- [8.2] Bavul seçimi masaüstü ve mobilde düzeltildi — commit 5adbd88 — Canlıda (`https://www.flypirpir.nl/ara?from=AMS&to=ADB&date=2027-01-02&return=2027-01-09&adults=1&checkedBags=1`, masaüstü 1440×900 + iPhone 13 390×844) bulgular:
  - **Neden çalışmıyordu:** (1) 8.1'deki `window.location.replace` yönlendirmesi `checkedBags=1`'i daha widget başlamadan
    adresten siliyordu; üst çubuk bile `0 0` görünüyordu (`docs/ekran/8-2-bagaj-desktop.png`). (2) Mobil görünümde
    `[data-testid="baggage-included-filter"]` gizli (`display: none`), görünür çip `FlightFiltersMobileMenu-module__list`
    içindeki ilk `ClearableParameter-module__root` düğmesi (`data-testid` yok, `docs/ekran/8-2-bagaj-mobile.png`).
    (3) Eski `applyBaggageFilter` ilk karta tıklayıp hemen duruyordu (`valueChanged` doğrulaması yoktu). (4) Sayfa
    yenilenince (`?flightSearch=...`) `checkedBags` adresten düştüğü için seçim kayboluyordu.
  - **Canlıda kart fiyatı doğrulaması:** Masaüstü ve mobilde "Bagaj dahil" açıldığında (`valueChanged` aktif) kart
    fiyatları doğrudan **bagajlı toplam fiyata** dönüyor (ör. SunExpress `€ 291 (+€ 21)` → `€ 312`, `Bagaj dahil 1x20 kilogram`;
    Ajet/SunExpress `€ 267 (+€ 51)` → `€ 318`, `Bagaj dahil 1x15 kilogram`; mobil ilk kart `€ 312 · Bagajlı en ucuz`).
  - **Düzeltme:** `src/lib/live-widget-bags.ts` (`sessionStorage`, anahtar `pirpir:bags:<flightSearch>`) eklendi;
    `SearchForm.tsx` gönderimde bagajı kaydeder ve yenilemede üst çubuğu geri yükler; `LiveWidget.tsx` masaüstünde
    `[data-testid="baggage-included-filter"]`, mobilde görünür mobil çipi bulup `valueChanged` sınıfı aktifleşene kadar
    doğrular, kullanıcı çipi kendisi kapatırsa (`e.isTrusted`) seçimi günceller, `urlchange` geçişinde yeni rotaya taşır.
    7 dilde `messages/*/home.json` (`search.bagsNoteAff`) kontrol edilen bagajın "Bagaj dahil" filtresini açtığını, kabin
    bagajı ve ek ücretlerin uçuş kartında ve satıcıda göründüğünü netleştirdi.
  - Denendi: `npm run lint`, `npm run check:messages`, `npx next build` (324/324), `npm run e2e` (masaüstü + 390px mobil +
    yenileme + kullanıcı kapatma testleri dahil 23/23 geçti, 12.3 sn). Bilinen eksik yok.
- [8.3] Sonuç sayfası uçtan uca canlı gözden geçirmesi ve düzeltmeler — commit d45f4a2 — `https://www.flypirpir.nl`
  üzerinde gerçek Chrome (masaüstü 1440×900 + iPhone 13 390×844, TR ve EN, `Europe/Amsterdam`) ile denendi
  (`docs/ekran/8-3-sonuc-en.png`):
  - **Düzeltilen bulgular:**
    1. *Para birimi ve dil değişiminde widget güncellenmiyordu:* Adım: `/ara?flightSearch=AMS0201ADB09011` üzerinde
       üstteki bölge ayarından para birimi (`EUR` → `TRY`/`USD`) veya dil (`Türkçe` → `English`) değiştirildi →
       beklenen: widget yeni para birimi/dille açılsın → görülen: `LiveWidget.tsx` bağımlılık dizisi yalnızca
       `[src, route]` olduğu için widget eski para birimi/dilde takılı kalıyordu. Düzeltildi: `w.__tpwlLang` /
       `w.__tpwlCur` izlenir, değişiklikte sayfa temiz adresle (`cleanWidgetUrl`) yeniden yüklenir.
    2. *Canlı kart sıralaması yerinde fiyat değişimlerinde ve birden çok kapsayıcıda güncel kalmıyordu:* Adım:
       canlı sonuçlar akarken ve "Bagaj dahil" açıldığında kart `style.order` değerleri incelendi → beklenen:
       tüm kartlar güncel fiyata göre en ucuzdan pahalıya sıralansın → görülen: `MutationObserver` `characterData`
       izlemediği ve yalnızca `cards[0].parentElement`'a baktığı için bazı kartlarda `order` boş veya eski fiyatta
       kalıyordu (`€ 318` kartında `order: 327`). Düzeltildi: tüm kart kapsayıcıları gruplanıp sıralanır ve
       `characterData: true` gözlenir.
    3. *Sonuç sayfası indeksleme:* `src/app/[locale]/ara/page.tsx` `generateMetadata` içine `robots: { index: false, follow: true }`
       eklendi (7.5'teki not kapandı).
  - **Canlıda sorunsuz çalışan kontroller:**
    - `Aktarmasız` filtresi: çalıştı (`€ 594` → `€ 291` SunExpress direkt).
    - `Göre sırala` (`Radiolist`): 7 sıralama seçeneği açılıyor, tıklanınca bizim CSS `order` temizlenip widget sıralaması devralıyor.
    - `Daha fazla uçuş göster`: çalıştı (`10` → `200` kart).
    - `Seçme bilet` → `tpwl-modals` gölge kökünde `Satın al`: `https://tpwgt.com/wl/redirect?locale=tr&gate_name=City.Travel&redirect_url=...&fallback_url=...`
      adresine gidiyor ve canlı arama isteği `"marker":"812756.Zz...-812756"` ile başlıyor.
    - Mobil görünüm (iPhone 13, 390×844): yatay taşma yok (`scrollWidth: 390 === innerWidth: 390`), JS hatası yok.
    - Yükleme süresi: ana sayfa ~2.0 sn; canlı sonuçların ilk kartları ~10.8 sn (8.1'deki çift sayfa yenilemesi
      kaldırıldığı için gerçek kullanımda ~3–4 sn hızlanacak).
  - **Bilinen / dış kaynaklı notlar (KARAR GEREKİYOR / gözlem):**
    - *Widget'ın kendi Türkçe metinleri:* Travelpayouts'un `tpwgt.com/wl_web/tr-*.js` paketi masaüstünde `"Seçme bilet"`,
      mobilde `"Seçme"`, `"1 konaklama"`, kenar çubuğunda `"Airports"`, `"Aircraft types"`, `"Göre sırala"` yazıyor.
      Bu metinler widget paketinden geliyor; kırılgan DOM metin değiştirmesi yapılmadı.
    - *Ana sayfada React `#418` hidrasyon uyarısı:* Canlı `/` açılışında 3 kez `Minified React error #418` gözlendi
      (`/ara` sayfasında 0 hata). Ayrı küçük takip işi olarak bakılabilir.
  - Denendi: `npm run lint`, `npm run check:messages`, `npx next build` (324/324), `npm run e2e` (24/24 geçti, 12.0 sn).
- [8.4 — KULLANICI KARARI BEKLENİYOR] Fiyat trendleri — kod değişikliği yok — İki seçenek için hazır uygulama planı:
  - **Seçenek (a) — Canlı sonuç sayfasından kaldır (Claude'un önerisi):** `src/components/results/LiveResults.tsx` satır
    93–94'te `liveListFor(q)` dalında `<PriceTrends q={q} actions={...} />` yerine yalnızca `<PriceAlertButton q={q} offers={chunk.offers} filters={filters} />`
    (sağa/sola hizalı tek düğme çubuğu) döndürülür; önbellekli modda (çoklu havalimanı / widget kapalı) `PriceTrends`
    aynen kalır. (~10 satır değişiklik, sıfır çeviri riski.)
  - **Seçenek (b) — Önbellek etiketiyle tut:** `src/components/results/PriceTrends.tsx` içine ortaklık + canlı liste
    modunda başlık altına 7 dilde kısa, dürüst bir not (`messages/*/results.json` → `trends.cachedNote`:
    "Grafik Aviasales önbellek fiyatlarını gösterir; aşağıdaki canlı fiyatlarla farklılık gösterebilir.") eklenir.
    Kullanıcı onayı gelmeden kod yazılmadı.
- [8.5] E2E test ortamı `NEXT_PUBLIC_TP_WL_WIDGET_ID` dayanıklılığı — commits 6ee73d7 + 5b43285 — `src/config/affiliate.ts`
  sunucuda `PIRPIR_DISABLE_LIVE_WIDGET=1` (örnek/ortaklık test sunucuları için) ve `TP_WL_WIDGET_ID` (canlı widget test
  sunucusu için) çalışma zamanı geçersiz kılmalarını destekler; `playwright.config.ts` 4 proje (`desktop`, `mobile`,
  `affiliate`, `live-widget`) ile koşar; `docs/GELISTIRME.md` güncellendi. Doğrulandı: `NEXT_PUBLIC_TP_WL_WIDGET_ID=25161 npx next build`
  sonrasında `npm run e2e` tüm 24/24 testi hatasız geçti (12.0 sn). Bilinen eksik yok.
- [9.6] Ana sayfa React `#418` hidrasyon uyarısı düzeltildi — commit fbbf71b — Akışlı `<Suspense>` sınırları
  (`MobileDealFrom`, `LiveFlights`, `TipsWithDeals`) `CurrencyProvider`'ın `useEffect`'i `TRY → EUR` (NL) yaptıktan
  sonra hidrate olduğu için 3 fiyat metninde SSR (`₺`) / istemci (`€`) uyuşmazlığı oluşuyordu. `src/components/Price.tsx`,
  `src/components/home/MobileDeal.tsx` ve `src/components/home/PopularFlights.tsx` fiyat yaprak düğümlerine
  `suppressHydrationWarning` eklendi (324 statik SSG sayfası bozulmadı). Canlıda `https://www.flypirpir.nl/` üzerinde
  doğrulandı: **0 `pageerror` / 0 React `#418`**.
- [9.1–9.5] Canlı widget pirpir tasarımına yaklaştırıldı ve sadeleştirildi — commit b229bfb — Değişen dosyalar:
  `src/components/results/LiveWidget.tsx`, `src/app/globals.css`, 7 dilde `messages/*/results.json` (`liveBaggage`),
  `tests/e2e/live-widget.spec.ts`.
  - **9.1 Uçuş kartı (`design/Results.dc.html`):** Kart `#FFFFFF`, `2px solid #E3E8F2`, `28px` köşe, `20px 24px` iç boşluk,
    `16px 28px` aralık, gölge yok; kalkış/varış saatleri Fredoka 600 `28px` (mobilde `22px`), satır yüksekliği 1;
    süre `13px` 700 `#56607A`, noktalı mavi rota çizgisi (`3px dotted #9CC3FF`) + aktarma çubuğu `#FF8A65`; havayolu
    satırı `15px` 600 `#56607A`; bilgi hapları (bagaj `#F5F8FD`, aktarma `#FFE8E0`, `13px` 800, `999px`); fiyat
    Fredoka 700 `30px`; Seç butonu `#2F5BD3`, Fredoka 600 `19px`, `12px 26px`, `999px`, en az `48px` (mobilde `44px`);
    rozetler `enhanceShadow` ile sınıflandırılıp "En ucuz" `#FFD166`, diğerleri (`Tek direkt uçuş`, `İlginizi çekebilir` vb.)
    `#CFE0FF` boyanır (`Fredoka 600 14px`, `4px 12px`, `999px`, `#1E2A44`).
  - **9.2 Sadeleştirme:** Sayfa tek sütunlu (`880px`) düzene alındı. Üste 7 dilde pirpir hap çubuğu eklendi:
    `En ucuz | En hızlı | Sadece direkt | Bagaj dahil | Filtreler ▾` (`#1E2A44`/beyaz aktif, `#F5F8FD`/`#1E2A44` pasif,
    Fredoka 600 `17px`, `10px 22px`, min `44px`). Uzun filtre paneli varsayılan kapalı (`display: none`); "Filtreler"
    tıklanınca masaüstünde 3 sütunlu `#F5F8FD` `28px` panel olarak açılır (tüm filtreler eksiksiz çalışır), mobilde
    widget'ın kendi mobil filtre penceresini açar. Gürültü öğeleri (`FlightCard-module__share`, `cardTopRight`,
    `DirectFlights`, mükerrer mobil filtre şeridi) `display: none` ile gizlendi. Yükleme çubuğu (`SearchProgressbar`)
    `#2F5BD3` / `#F5F8FD` / `999px` pirpir stilinde.
  - **9.3 Mobil (390 px) & 9.4 Erişilebilirlik:** Yatay taşma yok (`390 === 390`), Seç butonu `44px`, haplar ≥ `44px`,
    tüm kontrastlar ≥ 4.5:1 (`#1E2A44`/`#F5F8FD` 13.7:1, `#FFFFFF`/`#2F5BD3` 5.8:1), gizli öğeler yalnızca `display: none`
    (`opacity: 0` yok), `:focus-visible` halkası eklendi.
  - **9.5 Testler:** `tests/e2e/live-widget.spec.ts` sahte gölge kökü gerçek sınıf yapısıyla genişletildi (kart `28px`,
    gölge yok, rozet renkleri, gürültü ve kapalı filtre `display: none`, açılır filtre paneli, `En hızlı`/`Sadece direkt`/
    `Bagaj dahil` hapları, `Daha fazla` ve `Seçme bilet` tıklanabilirliği, 390px mobil taşma ve düğme yüksekliği).
  - **Canlı doğrulama (`https://www.flypirpir.nl`, gerçek Chrome, `Europe/Amsterdam`, TR + EN, masaüstü + iPhone 13):**
    - URL: `https://www.flypirpir.nl/ara?flightSearch=AMS0201ADB09011` (`2 – 9 Oca`, tarih kayması yok) ve
      `https://www.flypirpir.nl/en/search?flightSearch=AMS0201ADB09011` (`2 – 9 Jan`).
    - Canlı etkileşimler: `Sadece direkt` (`1` kart, `€ 280`, `aria-pressed="true"`), `Bagaj dahil` (`€ 303` = bagajlı toplam,
      `aria-pressed="true"`), `En hızlı` (en kısa `3s 25dk` direkt uçuşlar en üstte), `Seçme bilet` → `Satın al`
      (`https://tpwgt.com/wl/redirect?locale=tr&gate_name=Farera&...`, marker `812756` aktif).
    - Mobil (390×844): `scrollWidth: 390 === innerWidth: 390`, `Seçme` yüksekliği `44px`.
    - Ekran görüntüleri: öncesi `docs/ekran/9-before-desktop-tr.png`, `docs/ekran/9-before-mobile-tr.png`;
      sonrası `docs/ekran/9-after-desktop-tr.png`, `docs/ekran/9-after-desktop-filters-tr.png`,
      `docs/ekran/9-after-mobile-tr.png`, `docs/ekran/9-after-desktop-en.png`.
  - **WIDGET SINIRI maddeleri:**
    1. Kart içi kolon düzeni: Travelpayouts widget'ı fiyat+bagaj+Seç alanını solda (`cardLeft`), gidiş ve dönüşü sağda
       iki ayrı satır (`cardRight`) olarak çizer (`design/Results.dc.html`'de gidiş/dönüş tek blokta solda, fiyat+Seç
       sağda). Olay akışını ve responsive yapıyı bozmamak için grid yönü zorlanmadı; tüm ölçü, renk, font, köşe ve
       boşluklar birebir eşlendi.
    2. Widget Türkçe metinleri: `"Seçme bilet"`, `"Seçme"`, `"1 konaklama"`, `"Airports"`, `"Aircraft types"`, `"Göre sırala"`
       Travelpayouts'un `tr-*.js` paketinden geliyor; kural gereği widget'ın kendi metni değiştirilmedi.
    3. Rota çizgisi: Widget'ın kendi gri uçuş çizgisi alt katmanda duruyor; üstüne `3px dotted #9CC3FF` ve aktarma
       bölümüne `#FF8A65` eklendi.
  - Denendi: `npm run lint`, `npm run check:messages`, `npx next build` (324/324), `npm run e2e` (24/24 geçti, 12.8 sn)
    ve canlı `https://www.flypirpir.nl` doğrulaması. 8.4 (fiyat trendleri) kullanıcı kararı beklediği için dokunulmadı.
- [CLAUDE'A ÖNERİLER — Gemini (9. tur sonrası fikirler)] Canlı sitedeki 8. ve 9. tur gözlemlerine dayanarak daha iyi sonuç
  vereceğini düşündüğüm somut öneriler:
  1. **Sayfa genişliği bütünlüğü (`ara/page.tsx`):** Canlı liste modunda (`isLiveList`) `<main>`'in tamamını `max-w-[928px]`
     yapmak ya da sağda kalan ~240 px alana tek bir sakin "Fiyat alarmı" kartı yerleştirmek üst arama çubuğu ile `880px`
     uçuş kartları arasındaki sağ boşluğu dengeler.
  2. **8.4 Fiyat trendleri + tek satır aksiyon:** Kullanıcı (a) seçeneğini onaylarsa, canlı sonuç sayfasından `PriceTrends`'i
     kaldırıp `"Fiyat alarmı kur"` düğmesini doğrudan üstteki `En ucuz / En hızlı / Sadece direkt / Bagaj dahil / Filtreler`
     çubuğunun sağ ucuna (`ml-auto`) koymak sayfayı ~60 px kısaltır ve ilk uçuş kartı masaüstü ve mobilde hemen görünür.
  3. **Aktif filtre sayacı (`Filtreler (2)`):** Kullanıcı `"Filtreler"` panelinden havayolu/saat/aktarma seçip paneli
     kapattığında aktif filtre sayısını hap üzerinde göstermek (7 dilde `results.filters.active` anahtarı zaten var)
     ve yanına küçük "Temizle" eklemek "sonuçlar neden az?" karışıklığını önler.
  4. **Widget Türkçe çeviri kalitesi (`"Seçme bilet"` / `"1 konaklama"`):** Tasarım artık pirpir'e çok yakın; canlıda en
     çok göze batan kusur Travelpayouts'un makine çevirisi. Önce Travelpayouts destek/panelinden TR düzeltmesi istenebilir;
     olmazsa kullanıcı onayıyla yalnızca sabit seçicilerdeki (`Button-module__primary` gibi) 3–4 metin için kontrollü bir
     düzeltme değerlendirilebilir.
  5. **İlk yükleme algısı (4–6 sn):** 8.1'deki çift yenileme kalkınca yükleme hızlandı; ilk kart gelene kadar
     `SearchProgressbar` üstünde küçük bir Pırpır uçuş durumu (`"Havayollarından canlı fiyatlar getiriliyor…"`) göstermek
     ve ilk kartla gizlemek bekleme algısını yumuşatır.
  6. **Tek komutluk canlı duman testi (`scripts/verify-live.mjs`):** 8.1 (UTC+1 tarih kayması) ve 8.2 (mobil bagaj) yerel
     örnek modda değil yalnızca gerçek `flypirpir.nl` + gerçek Chrome'da yakalanabildi. Yayın sonrası elle çalıştırılacak
     küçük bir canlı doğrulama betiği (2–9 Oca → `AMS0201ADB09011`, `Sadece direkt`, `Bagaj dahil`, `Satın al` →
     `tpwgt.com/wl/redirect`, 0 React hatası, 390px taşma yok) Travelpayouts widget güncellemelerinin sessizce gerileme
     yaratmasını anında yakalar.
- [10.1–10.6] Sonuç sayfası Kiwi'den ilham yerleşim + dil/tarih şeridi hataları + `verify:live` — commits bcccc6e, c697d66 —
  Değişen dosyalar: `src/lib/live-widget-url.ts`, `src/lib/live-widget-summary.ts`, `src/components/results/LiveWidget.tsx`,
  7 dilde `messages/*/results.json` (`liveLoading`), `scripts/verify-live.mjs`, `package.json`, `docs/GELISTIRME.md`,
  `tests/e2e/live-widget.spec.ts`.
  - **10.1 İngilizce sayfada Türkçe widget hatası (canlıda yakalanıp düzeltildi):**
    - *Kök neden (`tpwl-main.js`, `qX()` & `BX()`):* Widget dil ve para biriminde sırasıyla (1) URL `?language=`/`?currency=`,
      (2) kendi `.flypirpir.nl` çerezleri (`tpwl_locale`, `tpwl_currency`), (3) `TPWL_CONFIGURATION.defaultLanguage`
      önceliğini kullanıyor. Önceki bir Türkçe `/ara` ziyareti `.flypirpir.nl` üzerinde `tpwl_locale=tr` bıraktığı için
      `/en/search` açıldığında `defaultLanguage: "EN"` yok sayılıyor, widget Türkçe ("Seçme bilet", "Tek direkt uçuş")
      kalıyordu (`docs/ekran/10-before-desktop-en.png`).
    - *Düzeltme:* `syncWidgetCookies` (`.flypirpir.nl` + yerel alan adı `tpwl_locale`/`tpwl_currency`) ve
      `cleanWidgetUrl(..., { language, currency })` birlikte uygulanır; widget URL'deki `language`/`currency`'yi 1. öncelikle
      okuyup kendi `Fc()` çağrısıyla adresten temizler (`adults` olmadığı için 8.1 tarih kayması tetiklenmez).
    - *Canlı doğrulama (`https://www.flypirpir.nl`, aynı tarayıcı oturumunda peş peşe):* TR `"Seçme bilet"` →
      EN `"Select ticket"` (`"The only direct flight"`) → NL `"Selecteer ticket"` → DE `"Auswählen"` → FR `"Select ticket"` (EN).
  - **10.2 Boş tarih şeridi (`FlightMatrix`) gizlendi:** `enhanceShadow` içindeki `syncMatrixVisibility`,
    `FlightMatrixDesktop-module__root___` ve `FlightMatrixMobile-module__flightMatrixMobile___` içindeki `dateCellPrice___`
    hücrelerinde rakam (`/\d/`) yoksa `data-pirpir-empty="1"` ile (`display: none !important`) gizler; fiyat sonradan
    gelirse özniteliği kaldırıp pirpir stiliyle (`2px solid #E3E8F2`, `24px`, gölgesiz) görünür kılar.
  - **10.3 Masaüstü (≥ 1024 px, 1120 px) Kiwi'den ilham yerleşim:**
    - *Sol sütun (`260 px`, yapışkan `sticky`, üstte `"Filtreler"` + yalnızca aktif filtre varken `"Filtreleri temizle"`):*
      beyaz zemin, `#E3E8F2` ince çizgiler, Fredoka 600 `17px` başlıklar, Nunito `15px` seçenekler, `#2F5BD3` onay/radyo,
      en az `44px` dokunma alanı. Aktarmalar, Bagaj ve Kalkış/varış saatleri açık; Havayolları, Havalimanları, Uçak tipleri,
      Acenteler ve Sıralama kapalı başlar (`openDefaultFilterSections`).
    - *Üst özetli sıralama sekmeleri:* `En ucuz`, `En hızlı`, `Sadece direkt` hapları kartlardan okunan gerçek fiyat ve
      süreyi küçük satırda gösterir (`src/lib/live-widget-summary.ts`; gün içeren `1g 1s` / `1d 2h` süreleri doğru hesaplanır,
      okunamayan değer uydurulmaz). `Bagaj dahil` hapı korunur; masaüstünde `"Filtreler"` hapı gizlenir.
    - *İki bölmeli kart (≥ 641 px):* Saf CSS Grid ile solda gidiş/dönüş uçuş satırları (`cardRight`), sağda `2px solid #E3E8F2`
      dikey çizgiyle ayrılmış fiyat + bagaj hapı + Seç sütunu (`cardLeft`, `232 px`). Sağda boş 3. sütun/reklam yok.
  - **10.4 Telefon (< 1024 px):** Sol sütun `display: none`; özet alt satırları gizli (yalnızca etiket), `"Filtreler"`
    (aktif varsa `"Filtreler (N)"`) widget'ın mobil filtre modalını açar; kartlar tek sütun, yatay taşma yok (`390 === 390`).
  - **10.5 Küçük iyileştirmeler:** İlk kart gelene kadar küçük `<Pirpir />` + 7 dilde `results.liveLoading` ("Pırpır en
    güncel fiyatlara bakıyor…"); mobilde aktif filtre sayacı + masaüstünde `"Filtreleri temizle"`; tek komutluk canlı
    duman testi `scripts/verify-live.mjs` (`npm run verify:live`, `docs/GELISTIRME.md`'ye eklendi).
  - **10.6 Testler & canlı doğrulama:**
    - `npm run lint`, `npm run check:messages` (0 hata).
    - `npm run e2e` iki derlemede de geçti: widget kimliksiz (**25/25**, 15.5 sn) ve `NEXT_PUBLIC_TP_WL_WIDGET_ID=25161`
      ile (**25/25**, 13.6 sn); süre düzeltmesi sonrası tekrar (**25/25**, 13.1 sn).
    - Canlı `npm run verify:live` (`https://www.flypirpir.nl`): **9/9 geçti** (TR+EN kartlar, `AMS0201ADB09011`,
      TR `"Seçme bilet"` → EN `"Select ticket"`, `marker="812756…"`, `tpwgt.com/wl/redirect`, 0 JS/React hatası).
    - Ekran görüntüleri: öncesi `docs/ekran/10-before-desktop-tr.png`, `docs/ekran/10-before-desktop-en.png`,
      `docs/ekran/10-before-mobile-tr.png`; sonrası `docs/ekran/10-after-desktop-tr.png`, `docs/ekran/10-after-desktop-en.png`,
      `docs/ekran/10-after-mobile-tr.png`.
  - **WIDGET SINIRI maddeleri:**
    1. Kart içi "İzmir'de 7 gece" ayırıcısı: widget gidiş ve dönüş satırlarını ayrı tarih nesneleri yerine yerelleştirilmiş
       kısa metinlerle ("2 oca, Ct", "Sat, Jan 2") çizdiği için arada gece sayısı ayırıcısı eklenmedi (uydurma hesap riski yok).
    2. Kart içi dikey hizalama: `FlightCard-module__cardLeft___` ve `cardRight___` saf CSS Grid ile sağ/sol yer değiştirdi;
       Preact olayları ve mobil düzen korundu.
    3. Canlı sonuç sayfasında Claude'un kaldırdığı "Fiyat trendleri" ve "Fiyat alarmı kur" geri eklenmedi.
- [11.0–11.6] Sonuç sayfası: çakışmalar, tek bagaj sayacı, Kiwi sıralama/filtre ayrımı ve canlı matris — commits 792b89d, bbd2e2a —
  Değişen dosyalar: `src/components/results/LiveWidget.tsx`, `src/components/home/SearchForm.tsx`,
  `src/lib/live-widget-bags.ts`, `src/lib/live-widget-summary.ts`, 7 dilde `messages/*/results.json`
  (`liveCabinNote`, `liveRelaxed`), `tests/e2e/live-widget.spec.ts`, `scripts/verify-live.mjs`.
  - **11.0 Canlıda yakalanan kök nedenler (NL AMS→AYT 11–17 Ara, `11-before-desktop-nl.png` & `11-before-mobile-nl.png`):**
    1. *Üst üste binme:* Travelpayouts'un `FlightMatrixDesktop-module__root___` sınıfında gömülü `margin-top: -20px` vardı
       (`toolbar.bottom=417.4 px > matrix.top=409.4 px`) → `margin: 0 0 16px 0 !important` ve `gap-4` (`16 px`) ile giderildi.
    2. *Üç koyu hap + üçlü filtre tekrarı:* Üstteki sıralama + direkt + bagaj hapları aynı koyu stildeydi; sol sütunda
       `Popular-module__body___`, `BaggageFilter` ve `Transfers` aynı filtreleri tekrarlıyordu ve `countActiveFilters`
       aktif filtreleri çift sayıyordu.
    3. *Tarih şeridi kesilmesi ve İngilizce "Show":* `FlightMatrixDesktop` `836 px` içinde `overflow: hidden` ile
       `985.6 px` genişliğindeki 7 hücreyi ("Dec, 1") kesiyordu; boş hücrelerde büyüteç SVG (`noPriceIcon`) ve sağda
       İngilizce `"Show"` düğmesi vardı.
    4. *Sol sütun iç kaydırması:* 10. turdaki `max-height: calc(100vh - 32px); overflow-y: auto` ikinci kaydırma çubuğu
       oluşturuyordu (`scrollHeight=2816 > clientHeight=968`).
    5. *Yanıltıcı özetler:* `readCardMetrics` gidiş-dönüşte yalnızca ilk bacağın süresini (`4u 10min`) alıyordu ve widget
       DOM'a ilk 10 kartı çizdiği için kısmi listeden hesaplanan `Snelst` özeti gerçek en hızlıyı yansıtmıyordu.
    6. *Yumuşak filtre uyarısının alta itilmesi:* Eski `sortCards` CSS `order` döngüsü `data-testid="soft-tickets-notice"`
       öğesine `order: 2000000000` verip kartların en altına itiyordu.
  - **11.1 Kiwi ayrımı (sıralama ayrı, filtreler yalnızca sol sütunda):**
    - Üstte tek parça beyaz sıralama sekme çubuğu (`role="tablist"`, 3 eşit sekme: **En iyi** / **En ucuz** / **En hızlı**,
      seçili sekmede `#2F5BD3` metin + `3px` alt çizgi; tek seçim, hap görünümü yok). Sekmeler widget'ın gerçek sıralama
      radyolarını (`0`, `1`, `5`) tetikler; sahte CSS `order` sıralaması kaldırıldı.
    - `"Sadece direkt"` ve `"Bagaj dahil"` üstten kaldırıldı; widget'ın yinelenen `"Popüler filtreler"`, `"Bagaj"` ve
      `"Sıralama"` bölümleri gizlendi (`display: none !important`, programatik erişim için DOM'da kalır). Her filtrenin
      yalnızca tek görünür kontrolü var; aktif filtre sayacı çift saymaz.
    - Özet satırı (`src/lib/live-widget-summary.ts`, toplam gidiş-dönüş süresi `formatTotalMins`) yalnızca tüm biletler
      DOM'dayken ve filtreler gevşetilmemişken gösterilir; kısmi listede (`moreTickets` varken) yanıltıcı özet gizlenir.
    - Telefonda (`< 1024 px`): üstte yatay kaydırmasız tek parça sekme çubuğu, altında tek `"Filtreler (N)"` düğmesi
      (ve aktif filtre varsa `"Filtreleri temizle"`).
  - **11.2 Bagaj: tek yer, Kiwi sayaçları + canlıda 6 senaryo teşhisi ve düzeltmeler:**
    - Masaüstünde sol sütunun en üstüne (`260 px`, `ResizeObserver` ile `--pirpir-bags-offset` üzerinden altındaki filtrelerle
      tam `16 px` boşluk — sıfır çakışma), telefonda `"Filtreler"` açılınca en üstüne `Bagaj` kartı (`Kabin bagajı − 0 +`,
      `Kontrol edilen bagaj − 0 +` ve 7 dilde kısa kabin bagajı notu `results.liveCabinNote`) eklendi.
    - `src/lib/live-widget-bags.ts` içine `pirpir:bags` olay akışı (`subscribeWidgetBags`) eklendi; sol sütun sayaçları
      ile üstteki `SearchForm` bagaj göstergesi (`0 · 0` ↔ `0 · 1`) anında ve çift yönlü eşitlenir.
    - **6 canlı bagaj senaryosunda bulunan hatalar ve çözümleri:**
      1. *Arama kutusundan bagaj 1 ile ara (`checkedBags=1`) & sonuç sayfasında arama kutusunu yeniden gönderme:*
         *Bulunan kritik hata:* Sonuç sayfasındayken üst `SearchForm`'da bagaj ekleyip `"Bilet bul"`a basınca aynı rota
         için `?from=...&adults=1&checkedBags=1` gönderiliyordu; `LiveWidget` etkisi aynı rotada yeniden çalışmadığı için
         widget URL gözlemcisi tüm sorguyu silip adresi çıplak `/ara` yapıyordu (sayfa yenilenince `"Bu aramayı yapamadık"`
         hatası!). *Düzeltme:* `SearchForm` compact modda bagaj değişimini anında `saveWidgetBags` ile eşitler ve aynı rota
         canlı widget'ta zaten açıksa `?from=...` itmeden `flightSearch` adresini korur; `LiveWidget` da koruma ekler.
      2. *Sonuç sayfasında bagajı `0 → 1 → 0` yapmak:*
         *Bulunan hata:* Üstteki hap değiştirildiğinde widget fiyatı (`€ 186 ↔ € 281` / `€ 277 ↔ € 373`) güncelleniyordu
         fakat üst `SearchForm` hâlâ `"0 · 0"` gösteriyordu; ayrıca sol sütunda hem çip hem onay kutusu tekrarı vardı.
         *Düzeltme:* Tek `Bagaj` sayaç kartı + `pirpir:bags` eşitlemesiyle `0 → 1 → 0` her yerde anında eşitlenir.
      3. *Bagaj + direkt (sonuç yokken, NL AMS→AYT 11–17 Ara):*
         *Bulunan hata:* Widget `data-testid="soft-tickets-notice"` İngilizce uyarısını gösterip aktarmalı (`IST`/`SAW`)
         uçuşları listeliyordu; CSS `order` bu uyarıyı en alta itiyor, üstte `"Alleen direct"` koyu seçili kalıyordu.
         *Düzeltme:* 11.3 pirpir uyarısı (`#FFF4D6`, 7 dil) en üstte görünür, `"Filtreleri temizle"` tek tıkla hem bagajı
         hem direkti sıfırlar.
      4. *Bagaj + dil değiştirme (`TR → NL`):*
         *Doğrulandı:* `pirpir:bags:<flightSearch>` rota anahtarı dilden bağımsız olduğu için `TR → NL` geçişinde bagaj
         (`0 · 1`), sol sayaç (`1`) ve widget bagaj filtresi korunuyor.
      5. *Bagaj + sayfayı yenileme:*
         *Doğrulandı:* `flightSearch` ve `sessionStorage` ile yenileme sonrası bagaj `1` (veya kullanıcı `0` yaptıysa `0`)
         olarak korunuyor; `SearchForm` ve widget birebir eşit.
      6. *Telefonda bagaj (`390 px`):*
         *Bulunan hata:* Üstte 5 koyu/açık hap iki satıra taşıyordu ve mobil filtre penceresinde pirpir bagaj sayacı yoktu.
         *Düzeltme:* Tek `"Filtreler (1)"` düğmesi açılınca en üstte `Bagaj` sayaçları + hemen altında widget filtreleri
         açılır; `1 → 0` widget fiyatını ve arama kutusunu günceller, yatay taşma `0`.
  - **11.3 "Sonuç yok, filtreleri gevşettik" uyarısı (7 dil):** Widget'ın ham İngilizce `SoftTicketsNotice` metni
    gizlenir; yerine `#FFF4D6` zeminli, `28px` köşeli, 7 dilde `results.liveRelaxed` uyarısı (aktarmalı uçuşların
    listelenebileceğini açıkça belirtir) ve çalışan `"Filtreleri temizle"` düğmesi gösterilir.
  - **11.4 Sol sütun ve tarih şeridi:** Sol sütunda `overflow: visible; max-height: none; position: static` (iç kaydırma
    çubuğu tamamen kaldırıldı; yalnızca Aktarmalar ve Kalkış/varış saatleri açık başlar). `FlightMatrixDesktop` tam sütun
    genişliğinde 2 satırlı karta çevrildi: 7 tarih hücresi kesilmeden sığar, fiyatsız hücrelerde büyüteç yerine `"—"`
    gösterilir, İngilizce `"Show"` düğmesi gizlenir, tüm hücreler boşsa şerit gizli kalır.
  - **11.5 Kart havayolu logoları & rozetler:** Kırık/0 px `img` (`complete && naturalWidth === 0` veya `error`) otomatik
    gizlenir (özel logo çizilmez). *Canlı inceleme notu:* AMS–AYT ekran görüntüsündeki sarı daire kırık/boş yer tutucu
    değil, Corendon Dutch Airlines'ın (`CD`) `img.avs.io/pics/al_square/CD@avif` (128×128, HTTP 200) kare simgesidir.
  - **11.6 Canlı matris testi (`https://www.flypirpir.nl`, gerçek Chrome, `Europe/Amsterdam`):**

| Dil / Görünüm | Sıralama sekmeleri (tek seçim) | Bagaj `0→1→0` & yenileme | Bagaj + Direkt uyarısı & Temizle | Çakışma / İç kaydırma / Taşma | `"Seç"` → satıcı | JS hatası |
|---|---|---|---|---|---|---|
| **TR Masaüstü 1440** | En iyi / En ucuz / En hızlı (1 aktif) | `0→1→0` + yenileme (`01`, widget=true) | `#FFF4D6` TR uyarı (ham EN gizli) + temizle | 0 çakışma · iç kaydırma yok · taşma yok | `tpwgt.com/wl/redirect` ✓ | 0 |
| **EN Masaüstü 1440** | Best / Cheapest / Fastest (1 aktif) | `0→1→0` + yenileme (`01`, widget=true) | `#FFF4D6` EN uyarı (ham EN gizli) + temizle | 0 çakışma · iç kaydırma yok · taşma yok | `tpwgt.com/wl/redirect` ✓ | 0 |
| **NL Masaüstü 1440** | Beste / Goedkoopst / Snelst (1 aktif) | `0→1→0` + yenileme (`01`, widget=true) | `#FFF4D6` NL uyarı (ham EN gizli) + temizle | 0 çakışma · iç kaydırma yok · taşma yok | `tpwgt.com/wl/redirect` ✓ | 0 |
| **TR Mobil 390** | En iyi / En ucuz / En hızlı (1 aktif) | `checkedBags=1` → Filtreler(1) → `1→0` | Mobil filtre en üstte Bagaj + widget filtreleri | 0 çakışma · taşma yok (`390===390`) | `tpwgt.com/wl/redirect` ✓ | 0 |
| **EN Mobil 390** | Best / Cheapest / Fastest (1 aktif) | `checkedBags=1` → Filters(1) → `1→0` | Mobil filtre en üstte Baggage + widget filtreleri | 0 çakışma · taşma yok (`390===390`) | `tpwgt.com/wl/redirect` ✓ | 0 |
| **NL Mobil 390** | Beste / Goedkoopst / Snelst (1 aktif) | `checkedBags=1` → Filters(1) → `1→0` | Mobil filtre en üstte Bagage + widget filtreleri | 0 çakışma · taşma yok (`390===390`) | `tpwgt.com/wl/redirect` ✓ | 0 |

  - **Otomatik testler & ekran görüntüleri:**
    - `npm run lint` ve `npm run check:messages` (7 dil × 8 dosya, 0 hata).
    - `npm run e2e` iki derlemede de geçti: `NEXT_PUBLIC_TP_WL_WIDGET_ID=25161` ile (**25/25**, 13.9 sn / polish sonrası **25/25**)
      ve widget kimliksiz (**25/25**, 13.0 sn / polish sonrası **25/25**, 12.4 sn).
    - Canlı `npm run verify:live` (`https://www.flypirpir.nl`, bagaj senaryosu dahil): **12/12 geçti**.
    - Ekran görüntüleri: öncesi `docs/ekran/11-before-desktop-nl.png`, `docs/ekran/11-before-mobile-nl.png`;
      sonrası `docs/ekran/11-after-desktop-tr.png`, `docs/ekran/11-after-desktop-en.png`,
      `docs/ekran/11-after-desktop-nl-clean.png`, `docs/ekran/11-after-desktop-nl.png`,
      `docs/ekran/11-after-mobile-tr.png`, `docs/ekran/11-after-mobile-en.png`,
      `docs/ekran/11-after-mobile-nl.png`, `docs/ekran/11-after-mobile-nl-filters.png`.
  - **WIDGET SINIRI maddeleri:**
    1. *Kısmi listede sekme özetleri:* Travelpayouts widget'ı DOM'a ilk 10 kartı çizer; diğer sıralama sekmelerinin gerçek
       #1 fiyatı/süresi için dışa açık API vermediğinden, `"Daha fazla uçuş göster"` varken yanıltıcı özet yerine yalnızca
       sekme etiketleri gösterilir (tüm biletler DOM'dayken gerçek özetler görünür).
    2. *Kabin bagajı:* Widget yalnızca kontrol edilen bagaj filtresini (`full_baggage`) destekler; kabin bagajı sayacı
       arama kutusuyla eşit tutulur ve altında 7 dilde `"Kabin bagajı kuralları satıcıda gösterilir"` notu yer alır.
    3. *Widget içi rozet/tarih çevirileri:* `"Cheapest with baggage"`, `"Optimal"` gibi rozet metinleri ile tarih şeridi
       ay kısaltmaları Travelpayouts'un kendi dil paketinden gelir; pirpir stilinde kalır.
    4. *Corendon Dutch Airlines (`CD`) logosu:* `img.avs.io/pics/al_square/CD@avif` 128×128 geçerli görsel olarak sarı
       daire döndürür; yalnızca gerçekten kırık (`naturalWidth === 0` / `error`) logolar gizlenir, özel logo çizilmez.
