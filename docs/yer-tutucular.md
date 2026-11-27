# Hukuki ve Destek Yer Tutucuları Listesi

Bu liste koddaki köşeli parantezli tüm hukuki/destek yer tutucularını dosya ve satır numaralarıyla toplar. Yer tutuculara bilerek dokunulmamıştır; gerçek şirket, adres, iletişim ve hukuk bilgileri netleşince kullanıcı tarafından doldurulacaktır.

## Özet Tablo

| Yer tutucu | Ne yazılmalı? | Nerede görünür? | Öncelik |
| --- | --- | --- | --- |
| `[ŞİRKET ADI]` | Yasal şirket / işletme unvanı (KvK kaydı) | Gizlilik & Koşullar (7 dil) | **Yüksek** (herkese açık) |
| `[ADRES]` | Kayıtlı işletme / yazışma adresi | Gizlilik & Koşullar (7 dil) | **Yüksek** (herkese açık) |
| `[İLETİŞİM E-POSTASI]` | Resmî destek / KVKK-GDPR başvuru e-postası | Gizlilik & Koşullar (7 dil) | **Yüksek** (herkese açık) |
| `[SAKLAMA SÜRESİ]` | Hesap / alarm / kayıt saklama süresi (ör. hesap silinene kadar) | Gizlilik (7 dil) | **Yüksek** (herkese açık) |
| `[ORTAKLIK ÇEREZ DETAYLARI]` | Travelpayouts / Aviasales / `tpwgt.com` çerez süre ve kapsam özeti | Gizlilik (7 dil) | **Yüksek** (herkese açık) |
| `[UYGULANACAK HUKUK]` | Geçerli hukuk ve yetkili mahkeme (ör. Hollanda hukuku) | Koşullar (7 dil) | **Yüksek** (herkese açık) |
| `[DESTEK TELEFONU]` | Destek telefonu (ortaklık modunda e-posta yeterliyse metin sadeleştirilebilir) | Koşullar (7 dil) + satış modu ekranları | **Orta** (`terms.ts` herkese açık) |
| `[İPTAL KOŞULLARI]` | Satış modu (Duffel) iptal kuralı özeti | Koşullar (7 dil) + satış modu SSS/rezervasyon | **Orta** (`terms.ts` herkese açık) |
| `[DESTEK SAATLERİ]` | Satış modu destek çalışma saatleri | Yalnızca satış modu onay ekranı (`confirm.json`) | **Düşük** (ortaklık modunda kapalı) |
| `[PNR]` | Teknik yedek metin (`booking.pnr` yoksa gösterilir) | Yalnızca satış modu onay/hesap/PDF | **Bilgi** (doldurulması gerekmez) |

---

## Dosya ve Satır Listesi

### 1. Gizlilik Politikası — `src/content/legal/privacy.ts` (7 dil, herkese açık)

| Dil | Satırlar | Yer tutucular |
| --- | --- | --- |
| `tr` | 11, 53, 60, 69 | L11: `[ŞİRKET ADI]`, `[ADRES]`, `[İLETİŞİM E-POSTASI]` · L53: `[SAKLAMA SÜRESİ]` · L60: `[ORTAKLIK ÇEREZ DETAYLARI]` · L69: `[İLETİŞİM E-POSTASI]` |
| `en` | 81, 123, 130, 139 | L81: `[ŞİRKET ADI]`, `[ADRES]`, `[İLETİŞİM E-POSTASI]` · L123: `[SAKLAMA SÜRESİ]` · L130: `[ORTAKLIK ÇEREZ DETAYLARI]` · L139: `[İLETİŞİM E-POSTASI]` |
| `nl` | 151, 193, 200, 209 | L151: `[ŞİRKET ADI]`, `[ADRES]`, `[İLETİŞİM E-POSTASI]` · L193: `[SAKLAMA SÜRESİ]` · L200: `[ORTAKLIK ÇEREZ DETAYLARI]` · L209: `[İLETİŞİM E-POSTASI]` |
| `de` | 221, 263, 270, 279 | L221: `[ŞİRKET ADI]`, `[ADRES]`, `[İLETİŞİM E-POSTASI]` · L263: `[SAKLAMA SÜRESİ]` · L270: `[ORTAKLIK ÇEREZ DETAYLARI]` · L279: `[İLETİŞİM E-POSTASI]` |
| `fr` | 295, 296, 345, 354, 363 | L295: `[ŞİRKET ADI]`, `[ADRES]` · L296: `[İLETİŞİM E-POSTASI]` · L345: `[SAKLAMA SÜRESİ]` · L354: `[ORTAKLIK ÇEREZ DETAYLARI]` · L363: `[İLETİŞİM E-POSTASI]` |
| `es` | 385, 386, 435, 444, 453 | L385: `[ŞİRKET ADI]`, `[ADRES]` · L386: `[İLETİŞİM E-POSTASI]` · L435: `[SAKLAMA SÜRESİ]` · L444: `[ORTAKLIK ÇEREZ DETAYLARI]` · L453: `[İLETİŞİM E-POSTASI]` |
| `it` | 475, 476, 525, 534, 543 | L475: `[ŞİRKET ADI]`, `[ADRES]` · L476: `[İLETİŞİM E-POSTASI]` · L525: `[SAKLAMA SÜRESİ]` · L534: `[ORTAKLIK ÇEREZ DETAYLARI]` · L543: `[İLETİŞİM E-POSTASI]` |

### 2. Kullanım Koşulları — `src/content/legal/terms.ts` (7 dil, herkese açık)

| Dil | Satırlar | Yer tutucular |
| --- | --- | --- |
| `tr` | 11, 13, 15, 17, 18 | L11: `[ŞİRKET ADI]`, `[ADRES]` · L13: `[İPTAL KOŞULLARI]` · L15: `[İLETİŞİM E-POSTASI]` · L17: `[UYGULANACAK HUKUK]` · L18: `[İLETİŞİM E-POSTASI]`, `[DESTEK TELEFONU]` |
| `en` | 26, 28, 30, 32, 33 | L26: `[ŞİRKET ADI]`, `[ADRES]` · L28: `[İPTAL KOŞULLARI]` · L30: `[İLETİŞİM E-POSTASI]` · L32: `[UYGULANACAK HUKUK]` · L33: `[İLETİŞİM E-POSTASI]`, `[DESTEK TELEFONU]` |
| `nl` | 41, 43, 45, 47, 48 | L41: `[ŞİRKET ADI]`, `[ADRES]` · L43: `[İPTAL KOŞULLARI]` · L45: `[İLETİŞİM E-POSTASI]` · L47: `[UYGULANACAK HUKUK]` · L48: `[İLETİŞİM E-POSTASI]`, `[DESTEK TELEFONU]` |
| `de` | 56, 58, 60, 62, 63 | L56: `[ŞİRKET ADI]`, `[ADRES]` · L58: `[İPTAL KOŞULLARI]` · L60: `[İLETİŞİM E-POSTASI]` · L62: `[UYGULANACAK HUKUK]` · L63: `[İLETİŞİM E-POSTASI]`, `[DESTEK TELEFONU]` |
| `fr` | 75, 91, 107, 122, 129 | L75: `[ŞİRKET ADI]`, `[ADRES]` · L91: `[İPTAL KOŞULLARI]` · L107: `[İLETİŞİM E-POSTASI]` · L122: `[UYGULANACAK HUKUK]` · L129: `[İLETİŞİM E-POSTASI]`, `[DESTEK TELEFONU]` |
| `es` | 143, 159, 175, 190, 197 | L143: `[ŞİRKET ADI]`, `[ADRES]` · L159: `[İPTAL KOŞULLARI]` · L175: `[İLETİŞİM E-POSTASI]` · L190: `[UYGULANACAK HUKUK]` · L197: `[İLETİŞİM E-POSTASI]`, `[DESTEK TELEFONU]` |
| `it` | 211, 227, 243, 258, 265 | L211: `[ŞİRKET ADI]`, `[ADRES]` · L227: `[İPTAL KOŞULLARI]` · L243: `[İLETİŞİM E-POSTASI]` · L258: `[UYGULANACAK HUKUK]` · L265: `[İLETİŞİM E-POSTASI]`, `[DESTEK TELEFONU]` |

### 3. Çeviri Dosyaları — `messages/{tr,en,nl,de,fr,es,it}/*.json` (Satış modu metinleri)

Ortaklık modunda (`NEXT_PUBLIC_SALES_MODE=affiliate`, varsayılan) ana sayfa SSS'si `cancelAff` anahtarını kullanır; bu dosyalardaki yer tutucular yalnızca satış modu (`booking`) açıldığında veya eski rezervasyon sayfalarında görünür.

| Dosya | Satır | Yer tutucular |
| --- | ---: | --- |
| `messages/tr/home.json` | 264 | `[İPTAL KOŞULLARI]` |
| `messages/en/home.json` | 265 | `[İPTAL KOŞULLARI]` |
| `messages/nl/home.json` | 265 | `[İPTAL KOŞULLARI]` |
| `messages/de/home.json` | 265 | `[İPTAL KOŞULLARI]` |
| `messages/fr/home.json` | 265 | `[İPTAL KOŞULLARI]` |
| `messages/es/home.json` | 265 | `[İPTAL KOŞULLARI]` |
| `messages/it/home.json` | 265 | `[İPTAL KOŞULLARI]` |
| `messages/{tr,en,nl,de,fr,es,it}/account.json` | 29 | `[DESTEK TELEFONU]` |
| `messages/{tr,en,nl,de,fr,es,it}/booking.json` | 139 | `[İPTAL KOŞULLARI]`, `[DESTEK TELEFONU]` |
| `messages/{tr,en,nl,de,fr,es,it}/confirm.json` | 113 | `[DESTEK TELEFONU]`, `[DESTEK SAATLERİ]` |

### 4. Teknik Yedek Metinler (Doldurulması Gerekmez)

Aşağıdaki üç satır yalnızca veritabanında `booking.pnr` alanı boşsa yedek olarak gösterilen teknik metindir:

- `src/app/[locale]/rezervasyon/[teklifId]/onay/page.tsx:120` — `[PNR]`
- `src/components/account/TripCard.tsx:125` — `[PNR]`
- `src/lib/pdf/plan-data.ts:101` — `[PNR]`
