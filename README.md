# rotala

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
- `src/app/rezervasyon/actions.ts` — rezervasyon (sunucuda doğrulama ve fiyat hesaplama)
- `src/lib/currency.ts` + `src/components/CurrencyProvider.tsx` — para birimi (URL `?cur=EUR` → localStorage → çerez)
- `messages/tr/*.json` — tüm arayüz metinleri (next-intl)
- `src/components/characters`, `cities`, `payment` — SVG bileşenleri
- `tailwind.config.ts` — tasarım tokenları
