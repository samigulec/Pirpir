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

## Sayfalar

| Rota | Tasarım |
|---|---|
| `/` | Main.dc.html (+ 390px'te Mobile.dc.html) |
| `/ucuslar/amsterdam/istanbul` | Destination.dc.html (statik üretilir) |
| `/ara?from=Amsterdam&to=İzmir&date=2026-10-24&return=2026-10-31` | Results.dc.html |
| `/rezervasyon/ams-adb-2` | Booking.dc.html |
| `/rezervasyon/demo/onay` | Confirm.dc.html |

## Yapı

- `src/lib/flights.ts` — tek veri katmanı (şimdilik `src/data/mock/*` örnek verisi)
- `src/lib/currency.ts` + `src/components/CurrencyProvider.tsx` — para birimi (URL `?cur=EUR` → localStorage → çerez)
- `messages/tr/*.json` — tüm arayüz metinleri (next-intl)
- `src/components/characters`, `cities`, `payment` — SVG bileşenleri
- `tailwind.config.ts` — tasarım tokenları
