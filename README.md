# pirpir

Uçuş bileti sitesi arayüzü — Next.js (App Router) + TypeScript + Tailwind. Proje kuralları için `CLAUDE.md`.

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

Türkçe (varsayılan, öneksiz), İngilizce ve Hollandaca. Adresler dile göre çevrilir:

| Türkçe | English | Nederlands |
|---|---|---|
| `/ara` | `/en/search` | `/nl/zoeken` |
| `/ucuslar/amsterdam/istanbul` | `/en/flights/amsterdam/istanbul` | `/nl/vluchten/amsterdam/istanbul` |
| `/rezervasyon/…` | `/en/booking/…` | `/nl/boeking/…` |
| `/giris` · `/biletlerim` · `/hesap` | `/en/login` · `/en/my-trips` · `/en/account` | `/nl/inloggen` · `/nl/mijn-reizen` · `/nl/account` |

Metinler `messages/<dil>/*.json`; yeni dil eklemek için klasörü kopyala, `src/i18n/routing.ts` ve `src/i18n/config.ts`'e ekle.
Tarayıcı dili Hollandaca olan biri `/`'e gelirse `/nl`'ye yönlenir; seçilen dil çerezde hatırlanır.

## Giriş ve Biletlerim (Supabase)

- Supabase değişkenleri boşsa **örnek mod**: e-posta doğrulamasız giriş, biletler yalnızca tarayıcıda.
- Kurulum: Supabase'de proje aç → `supabase/migrations/0001_bookings.sql`'i SQL Editor'da çalıştır →
  Authentication → URL Configuration'da **Site URL** ve **Redirect URLs**'e `https://<site>/auth/callback` ekle →
  `.env.example`'daki üç Supabase değişkenini Vercel'e gir.
- Giriş: "Giriş yap"a basınca sayfa değişmeden açılan pencere (`src/components/auth/LoginModal.tsx`): Google / Facebook / Apple ve e-postaya tek kullanımlık bağlantı. Sosyal sağlayıcılar Supabase → Authentication → Providers'ta açılıp `NEXT_PUBLIC_AUTH_PROVIDERS`'a yazılır. Biletler hesaba ve aynı e-postaya bağlanır (RLS).

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
