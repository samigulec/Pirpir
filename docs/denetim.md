# Performans ve Erişilebilirlik Denetimi (5.5)

Lighthouse 13.6.0 (Chromium `--headless=new --no-sandbox`) ile üretim derlemesi (`npx next build && npx next start`, çevrimdışı örnek veri modu) üzerinde 4 ana sayfa türü masaüstü ve mobil profillerde ölçüldü.

## Puan Özeti (Düzeltme Sonrası)

| Sayfa | Profil | Performans | Erişilebilirlik | En İyi Uygulamalar | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` (Ana sayfa) | Masaüstü | 100 | 100 *(önce 98)* | 100 | 100 | 0.3 s | 0 | 0 ms |
| `/` (Ana sayfa) | Mobil | 100 | 100 *(önce 98)* | 100 | 100 | 1.1 s | 0.001 | 0 ms |
| `/ara?from=AMS&to=IST&…` | Masaüstü | 100 *(önce 99)* | 100 | 100 | 100 | 0.8 s | 0.006 | 0 ms |
| `/ara?from=AMS&to=IST&…` | Mobil | 90–100 | 100 | 100 | 100 | 0.9–3.7 s | 0.013 | 0 ms |
| `/firsatlar` | Masaüstü | 100 | 100 | 100 | 100 | 0.2 s | 0 | 0 ms |
| `/firsatlar` | Mobil | 100 | 100 | 100 | 100 | 0.9 s | 0.001 | 0 ms |
| `/ucuslar/amsterdam/istanbul` | Masaüstü | 100 | 100 | 100 | 100 | 0.2 s | 0 | 0 ms |
| `/ucuslar/amsterdam/istanbul` | Mobil | 100 | 100 | 100 | 100 | 0.9 s | 0.001 | 0 ms |

*(Kontrast ≥ 4.5:1, görsel `alt`/`aria-label`, dokunma hedefleri ≥ 44 px, başlık ve meta etiketleri tüm sayfalarda ilk ölçümden itibaren %100 geçti.)*

## En Büyük 5 Bulgu ve Durumları

1. **`landmark-one-main` — Ana sayfada `<main>` eksikliği (DÜZELTİLDİ)**
   - **Sorun:** `src/app/[locale]/page.tsx` içinde `<HomeHeader />` ile `<SiteFooter />` arasındaki içerik `<main>` etiketiyle sarılı değildi (Erişilebilirlik puanı 98'di).
   - **Düzeltme:** Ana sayfa bölümleri `<main>` içine alındı; Erişilebilirlik 100'e yükseldi.

2. **`label-content-name-mismatch` — Ülke/dil/para birimi düğmesi (DÜZELTİLDİ)**
   - **Sorun:** `src/components/HeaderControls.tsx` içindeki bölge düğmesi görünür metin olarak `"TR · Türkçe · ₺ TRY"` gösterirken `aria-label="Ülke, dil ve para birimi"` görünür metni ezdiği için tüm sayfalarda WCAG 2.5.3 ihlali veriyordu.
   - **Düzeltme:** `aria-label` yerine `title` ve düğme içinde `<span className="sr-only">{t("open")}: </span>` kullanıldı. Tüm 4 sayfada (masaüstü + mobil) uyarı sıfırlandı.

3. **`bf-cache` — Dinamik sayfalarda `Cache-Control: no-store` (RAPORLANDI)**
   - **Sorun:** Next.js dinamik SSR sayfaları (`/`, `/ara`, `/firsatlar`) tarayıcı geri/ileri önbelleğine (`bfcache`) giremiyor; statik/ISR rota sayfası (`/ucuslar/amsterdam/istanbul`) ise bu sorundan etkilenmiyor.
   - **Not:** Oturum ve pazar çerezlerine göre kişiselleşen sayfalar için kasıtlı davranış; statik/ISR sayfalar etkilenmiyor.

4. **`render-blocking-insight` + `unused-javascript` / `legacy-javascript-insight` (RAPORLANDI)**
   - **Sorun:** Next.js derlenen tek CSS paketi mobilde ~130–150 ms engelleme yaratıyor; Next.js çalışma zamanı/polyfill parçasında ~25 KiB kullanılmayan / 14 KiB eski tarayıcı JS'i görünüyor.
   - **Not:** Tüm sayfalarda TBT = 0 ms ve LCP ≤ 1.1 s (sonuç sayfası mobil akışı hariç); agresif paket/polyfill müdahalesi tarayıcı uyumluluğu riski taşıdığından bırakıldı.

5. **Canlı üretimde üçüncü taraf canlı uçuş widget'ı (`tpwgt.com`) (YALNIZCA RAPOR — Claude alanında)**
   - **Not:** Yerel denetim çevrimdışı örnek modda yapıldığı için `tpwgt.com/wl_web/main.js` ölçülmedi. Canlı üretimde (`/ara`) bu üçüncü taraf betik yüklenip DOM'u doldurduğundan LCP/TBT/CLS üzerinde ek yük oluşturur (`LiveWidget.tsx`, `ResultsView.tsx`, `#tpwl-tickets` Claude'un sorumluluğunda olduğu için dokunulmadı; canlı performans iyileştirmesi gerekirse `preconnect` veya yükleme zamanlaması Claude tarafından değerlendirilebilir).

---

## SEO Temelleri (7.5)

- **Kanonik adres ve `hreflang` (`src/lib/seo.ts`):** Herkese açık tüm sayfalarda (`/`, `/ucuslar/[nereden]/[nereye]`, `/firsatlar`, `/firsatlar/[id]`, `/gizlilik`, `/kosullar`) mevcut dilin kanonik adresi, 7 dilin tamamı (`tr`, `en`, `nl`, `de`, `fr`, `es`, `it`) ve `x-default` `alternates` etiketleri tanımlandı.
- **Özgün başlık ve açıklamalar:** Rota sayfaları 7 dilde rota özelinde `metaTitle` ve `metaDescription` üretir; fırsat sayfaları rota, tarih ve fiyatla özgün başlık/açıklama verir; yasal sayfalar giriş metnini açıklama olarak kullanır.
- **Yapılandırılmış veri (JSON-LD):**
  - Ana sayfa SSS (`src/components/home/Faq.tsx`) → `FAQPage` (yalnızca sayfada gerçekten görünen soru ve cevaplarla birebir aynı metin).
  - Rota sayfası (`src/app/[locale]/ucuslar/[nereden]/[nereye]/page.tsx`) → `BreadcrumbList` (Ana sayfa › Ülke › Varış şehri).
  - Önbellekli fiyatlar için yanıltıcı olacağından `Offer` şeması **bilerek eklenmedi**.
- **Rota OpenGraph görseli:** `src/app/[locale]/ucuslar/[nereden]/[nereye]/opengraph-image.tsx` ile her rota için `next/og` 1200×630 PNG (`Nunito` Türkçe glifli; rota + `"…’dan"` fiyatı + varsa görüldüğü gün, 6 saat ISR önbellekli) üretilir.
- **Dizinleme & Site haritası:** `sitemap.xml` ana sayfa, `/firsatlar`, ~180 rota sayfası (pazar rotaları + TR koridorları) ve yasal sayfaları 7 dilde `hreflang` karşılıklarıyla listeler; yönetim (`/yonetim/*`), hesap, giriş ve eski rezervasyon rotaları `robots.txt` ve `noindex` ile kapalıdır.
- **Not (CLAUDE'A):** `/ara` (`src/app/[locale]/ara/page.tsx`) Claude alanında olduğu için dokunulmadı; sonuç sayfası zaten sorgu parametreli dinamik arama sayfası olduğundan `robots: { index: false }` kontrolü Claude tarafından uygunsa gözden geçirilebilir.
