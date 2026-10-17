# Yapılacaklar

Bekleyen işler ve neden beklediği. Bir madde bitince buradan silinir.

## Alan adı + e-posta (Resend) — sıradaki büyük adım

Alan adı bağlanınca:

- [ ] Alan adını Vercel'e bağla, `NEXT_PUBLIC_SITE_URL`'i güncelle (Supabase ve Google OAuth adreslerini de).
- [ ] Resend hesabı, alan adı doğrulaması (SPF/DKIM), `RESEND_API_KEY` Vercel'e.
- [ ] Bilet onay e-postası. **Şu an onay sayfası "E-biletini … adresine gönderdik" diyor ama e-posta gitmiyor**;
      e-posta bağlanana kadar bu cümle doğru değil (`messages/*/confirm.json` → `sent`).
- [ ] Supabase giriş e-postalarını Resend SMTP üzerinden gönder (varsayılan Supabase e-postası saatte birkaç taneyle sınırlı).
- [ ] Fiyat alarmı formu (ana sayfa) ve Valiz'in "hatırlat" anahtarı gerçekten e-posta göndersin.

## Canlıya geçiş

- [ ] Duffel hesabını canlıya al; THY, Pegasus, KLM, Transavia, Corendon, SunExpress canlıda satılıyor mu sor.
- [ ] Mollie: kart, iDEAL, Apple Pay, Google Pay. Canlıda ödeme, sonra öde (ayırma) ve iptal iadesi bunu bekliyor.
      Mollie bağlanınca ödeme logoları Mollie'nin Methods API'sinden alınsın (`assets/payment/brands/README.md`).
- [ ] Sabit örnek kurlar (`src/lib/currency.ts`; TRY, EUR, USD, GBP) yerine canlı kur (ör. ECB günlük kurları).
      Bunu yaparken rezervasyonda ödenen tutar ve para birimi de saklansın; yoksa kur değiştikçe eski biletlerin
      tutarı farklı görünür.
- [ ] Hukuk metinlerindeki yer tutucular: [ŞİRKET ADI], [ADRES], [İLETİŞİM E-POSTASI], [SAKLAMA SÜRESİ], [UYGULANACAK HUKUK].

## Diğer

- [ ] Facebook ve Apple ile giriş: Meta uygulaması ve Apple Developer üyeliği (yıllık 99 $) gerekiyor; sonra Supabase + `NEXT_PUBLIC_AUTH_PROVIDERS`.
- [ ] Seyahat sigortası: lisanslı bir ortak (ör. Cover Genius / XCover) ile anlaşma; Hollanda (AFM) ve IDD yükümlülükleri sorulacak.
- [ ] Rezervasyondan sonra koltuk ekleme (Duffel'ın sipariş sonrası koltuk desteği doğrulanınca).
