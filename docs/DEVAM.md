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
   `src/lib/flights.ts` içindeki `"search-v4"` anahtarını bir artır (`"search-v5"`), yoksa eski kartlar görünür.
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
- [3.4] Tarih şeridi ve fiyat takvimi ay verisine çevrildi — commit 80b50e7 — `src/lib/providers/travelpayouts.ts` içine
  `groupedPrices` (`/aviasales/v3/grouped_prices`) ve `returnMonthPrices` eklendi; `src/lib/price-calendar.ts` ortaklık
  modunda (`priceSource() === "travelpayouts"`) 10 dk `unstable_cache` ile ay verisini kullanıyor (Duffel/örnek mod korundu).
  `DateStrip` (`monthlyPrices`) `/api/date-prices?strip=1` ile ±3 günü tek istekte dolduruyor, kayıt olmayan günler `null` ("Fiyata bak")
  kalıyor. Denendi: `npm run lint`, `npx next build` (71/71 sayfa) ve yerel mock Travelpayouts sunucusu + demo mod üzerinde
  8 uçtan uca kontrol (`strip=1` tek istek, önbellek isabeti, ay sınırı birleştirme, gidiş/dönüş/tek yön `/api/calendar-prices`,
  `/ara` HTTP 200, demo geri dönüşü). Not: Gerçek `TRAVELPAYOUTS_TOKEN` yalnızca Vercel'de olduğu için canlı veri doğrulaması
  yayın sonrası `flypirpir.nl` üzerinde yapılmalı.
