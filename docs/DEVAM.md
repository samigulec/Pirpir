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
