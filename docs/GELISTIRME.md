# pirpir · Geliştirici notları

Uçuş bileti sitesi — Next.js (App Router) + TypeScript + Tailwind. Proje kuralları için kök dizindeki `CLAUDE.md`, tanıtım için `README.md`.

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # üretim derlemesi
npm run lint     # TypeScript kontrolü
npm run svg      # assets/ içindeki SVG'leri bileşenlere yeniden çevir
```

## Veri modları

| `DUFFEL_ACCESS_TOKEN` | Mod | Arama | Rezervasyon |
|---|---|---|---|
| (boş) | Örnek veri | Her rota/tarih/yolcu için tutarlı örnek teklifler | Onay ekranına kadar çalışır, bilet kesilmez |
| `duffel_test_…` | Test | Duffel test ortamındaki gerçek teklif yapısı | Duffel test bakiyesiyle sipariş, gerçek para yok |
| `duffel_live_…` | Canlı | Gerçek uçuşlar | Mollie bağlanana kadar kapalı |

Anahtar `.env.local` dosyasına (yerelde) ya da Vercel → Settings → Environment Variables'a eklenir; `.env.example`'a bak.

## Diller

7 dil: Türkçe (varsayılan, öneksiz), English, Nederlands, Deutsch, Français, Español, Italiano. Adresler dile göre çevrilir
(tam liste `src/i18n/routing.ts`):

| Türkçe | English | Nederlands | Deutsch |
|---|---|---|---|
| `/ara` | `/en/search` | `/nl/zoeken` | `/de/suche` |
| `/ucuslar/amsterdam/istanbul` | `/en/flights/…` | `/nl/vluchten/…` | `/de/fluege/…` |
| `/rezervasyon/…` | `/en/booking/…` | `/nl/boeking/…` | `/de/buchung/…` |
| `/biletlerim` | `/en/my-trips` | `/nl/mijn-reizen` | `/de/meine-reisen` |

Metinler `messages/<dil>/*.json`; yeni dil eklemek için klasörü kopyala, `src/i18n/routing.ts` ve `src/i18n/config.ts`'e ekle.
Tarayıcı dili desteklenen bir dilse `/`'e gelen ziyaretçi o dile yönlenir; seçilen dil çerezde hatırlanır.
Ülke (16 pazar, `src/config/markets.ts`) ve para birimi (12, `src/lib/currency.ts`) dilden bağımsız seçilir.

## Giriş ve Biletlerim (Supabase)

- Supabase değişkenleri boşsa **örnek mod**: e-posta doğrulamasız giriş, biletler yalnızca tarayıcıda.
- Kurulum: Supabase'de proje aç → `supabase/migrations/` içindeki dosyaları sırayla (0001 → 0004) SQL Editor'da çalıştır →
  Authentication → URL Configuration'da **Site URL** ve **Redirect URLs**'e `https://<site>/auth/callback` ekle →
  `.env.example`'daki üç Supabase değişkenini Vercel'e gir.
- Giriş: "Giriş yap"a basınca sayfa değişmeden açılan pencere (`src/components/auth/LoginModal.tsx`): Google / Facebook / Apple ve e-postaya tek kullanımlık bağlantı. Sosyal sağlayıcılar Supabase → Authentication → Providers'ta açılıp `NEXT_PUBLIC_AUTH_PROVIDERS`'a yazılır. Biletler hesaba ve aynı e-postaya bağlanır (RLS).

## Alan adı (flypirpir.nl)

Ana adres `src/config/brand.ts` içindeki `domain`; site haritası (`/sitemap.xml`), `robots.txt` ve paylaşım önizlemeleri bunu kullanır.

1. Vercel → proje → Settings → Domains → `flypirpir.nl` ve `www.flypirpir.nl` ekle; `www`'yi ana adrese yönlendir.
2. Alan adını aldığın yerde Vercel'in gösterdiği DNS kayıtlarını gir (genelde kök için `A 76.76.21.21`, `www` için `CNAME cname.vercel-dns.com`; Vercel'deki değerler geçerlidir).
3. Vercel → Environment Variables: `NEXT_PUBLIC_SITE_URL=https://flypirpir.nl`, sonra yeniden yayınla.
4. Supabase → Authentication → URL Configuration: Site URL `https://flypirpir.nl`, Redirect URLs'e `https://flypirpir.nl/auth/callback`.
   Google/Facebook/Apple girişinde sağlayıcı panellerindeki izinli adreslere de aynı alan adı eklenir.
5. `flypirpir.com` alınınca: Vercel'e ekle, ana adres yap, `.nl`'yi ona yönlendir (308); `brand.ts`'teki `domain`'i ve
   `NEXT_PUBLIC_SITE_URL`'i güncelle, Supabase adreslerine `.com`'u ekle.

## Sayfalar

| Rota | Tasarım |
|---|---|
| `/` | Main.dc.html (+ 390px'te Mobile.dc.html) |
| `/ucuslar/amsterdam/istanbul` | Destination.dc.html (statik üretilir) |
| `/ara?from=AMS&to=ADB&date=2026-10-24&return=2026-10-31&adults=1` | Results.dc.html |
| `/rezervasyon/<teklifId>` | Booking.dc.html |
| `/rezervasyon/<rezervasyonId>/onay` (örnek: `/rezervasyon/ornek/onay`) | Confirm.dc.html |

## Yapı

- `src/lib/flights.ts` — tek veri katmanı; sağlayıcıyı seçer (`src/lib/providers/demo.ts`, `duffel.ts`)
- `src/lib/search.ts` — arama sorgusu, URL ve doğrulama; `src/data/airports.ts` — havalimanı listesi
- `src/actions/booking.ts` — rezervasyon (sunucuda doğrulama ve fiyat hesaplama); `src/actions/auth.ts` — giriş/çıkış/profil
- `src/lib/bookings.ts` — rezervasyon kaydı (çerez + Supabase); `src/lib/auth/*` — oturum
- `src/proxy.ts` — dil yönlendirmesi ve oturum yenileme (Next 16'da middleware'in yeni adı)
- `src/lib/currency.ts` + `src/components/CurrencyProvider.tsx` — para birimi (URL `?cur=EUR` → localStorage → çerez)
- `messages/tr/*.json` — tüm arayüz metinleri (next-intl)
- `src/components/characters`, `cities`, `payment` — SVG bileşenleri
- `tailwind.config.ts` — tasarım tokenları
