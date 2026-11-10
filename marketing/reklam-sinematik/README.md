# Sinematik reklam videosu

Karanlık zeminde parlayan ışıklı, 24.8 saniyelik dikey (9:16, 1080×1920) tanıtım videosu. Hazır video: [`pirpir-sinematik.mp4`](pirpir-sinematik.mp4)

## Sahneler

| Süre | Sahne |
|---|---|
| 0.0 – 3.6 sn | Altın ışık çizgileri birleşir, "pirpir" logosu parlayarak çıkar |
| 3.6 – 7.4 sn | Telefonda arama: "Nereye" alanına "İstanbul" yazılır, "Bilet bul" |
| 7.4 – 10.2 sn | Uçuş kartları telefondan havaya çıkar, İstanbul kartı öne gelir |
| 10.2 – 12.9 sn | Bilet kartı (AMS → IST, €176): "Bilet al" ve "Biletin hazır" |
| 12.9 – 16.4 sn | 3D harita: Amsterdam'dan İstanbul'a altın rota, rotada Pırpır; uçuş takip kartı |
| 16.4 – 18.7 sn | Sarı biniş kartı (Pırpır'ın gülümsemesi) |
| 18.7 – 21.0 sn | "Nereye istersen." ve "Yaz, bas, uç." |
| 21.0 – 24.8 sn | Pırpır uçarak gelir: logo, "Pırpır bulur, sen uçarsın.", flypirpir.nl |

Fiyatlar ve uçuş süreleri sitedeki örnek veriden alınmıştır. Yayınlamadan önce güncel değerlerle değiştir.

## Dosyalar

- `ad.html`: bütün animasyon. `setT(saniye)` sayfayı o anki kareye getirir. Karakterler `../../assets/characters/` klasöründen gelir.
- `render.mjs`: sayfayı Chrome ile kare kare çeker, ffmpeg ile videoya çevirir.
- `sound.py`: müziği ve ses efektlerini üretir (`score.wav`).
- `fonts/`: Fredoka, Nunito ve Türkçe harfler için Baloo 2 (hepsi SIL Open Font License).

## Yeniden üretmek

Gerekenler: Node 18+, Google Chrome, ffmpeg, Python 3 + numpy.

```bash
cd marketing/reklam-sinematik
npm install
# İstediğin anların karelerini görmek için (stills/ klasörüne yazar):
node render.mjs --stills 1.6,8.4,14.5,22.5
# Tam video (sessiz):
node render.mjs silent.mp4 30 0 24.8
# Ses ve birleştirme:
python3 sound.py
ffmpeg -i silent.mp4 -i score.wav -c:v copy -c:a aac -b:a 256k -shortest pirpir-sinematik.mp4
```

Chrome başka bir yerdeyse: `CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node render.mjs ...`
