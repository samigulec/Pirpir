# Nasıl başlarım?

1. Bu klasörü (`rotala`) bilgisayarında istediğin bir yere çıkar, örneğin `Belgeler/rotala`.
2. Bilgisayarına Node.js'in güncel LTS sürümünü kur (nodejs.org). Kurulu mu diye terminalde `node -v` yazarak bakabilirsin.
3. Claude Code'u bu klasörde aç. Claude Code, `CLAUDE.md` dosyasını kendiliğinden okur; projenin bütün kuralları orada.
4. İlk mesaj olarak aşağıdaki metni yapıştır.

---

## İlk mesaj (kopyala-yapıştır)

```
Bu klasördeki CLAUDE.md dosyasını ve design/ klasöründeki tüm .dc.html dosyalarını oku.
Sonra Next.js (App Router) + TypeScript + Tailwind ile projeyi kur ve arayüzü tasarıma birebir uygun şekilde kodla.

Sırayla ilerle ve her adımın sonunda bana göster:
1. Proje kurulumu, Tailwind tokenları, Fredoka + Nunito fontları, para birimi altyapısı.
2. assets/ içindeki SVG'leri React bileşenlerine çevir.
3. Ana sayfa (Main.dc.html) — masaüstü ve 390px telefon görünümü.
4. Rota sayfası (Destination.dc.html).
5. Sonuçlar (Results.dc.html).
6. Rezervasyon (Booking.dc.html).
7. Onay (Confirm.dc.html).

Her sayfadan sonra geliştirme sunucusunu çalıştır, tasarım dosyasıyla yan yana karşılaştır ve farkları düzelt.
Tüm etkileşimler (CLAUDE.md'deki liste) çalışsın. Veriler şimdilik örnek veri olsun.
Her büyük adımdan sonra git commit at.
```

---

## Sonraki adımlar için örnek mesajlar

- "Duffel API'sini bağla, arama sonuçları gerçek veri göstersin. Önce test (sandbox) modunda."
- "Mollie ödemesini test modunda ekle: kart, iDEAL, Apple Pay, Google Pay."
- "Supabase ile giriş yap ve Biletlerim sayfasını yap."
- "Antalya ve İzmir için de rota sayfası üret."

## Klasörde neler var?

- `CLAUDE.md` — Claude Code için proje kuralları (renkler, sayfalar, etkileşimler, yol haritası)
- `design/` — onaylanmış tasarım dosyaları (tarayıcıda açılmazlar; Claude Code bunları referans olarak okur)
- `assets/characters/` — 7 karakter (+ Pırpır'ın sevinen hali), SVG
- `assets/cities/` — 6 şehir çizimi + büyük İstanbul görseli, SVG
- `assets/payment/` — 4 özgün ödeme simgesi, SVG
