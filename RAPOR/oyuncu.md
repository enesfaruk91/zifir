# Oyuncu ve girdi — tamamlandı

## Ne yapıldı
- İki Codex ajanı js/girdi.js ve js/oyuncu.js dosyalarını hazırladı; ana ajan entegrasyonu denetledi. Diğer oyun modülleri değiştirilmedi.
- Klavye/fare, pointer lock, tek karelik basma/bırakma, hızlı dokunuş, odak/duraklatma temizliği ve oyun kolu eşlemesi.
- Yürüme 7 m/s, koşma 14 m/s, çift zıplama, hava kontrolü; 120 Hz fizik alt adımları.
- 15–60 m halat kısıtı, yardım konisi, pompalama, bırakışta momentum ve +4 m/s yukarı itki; şehir yokken sahneye eklenmeyen 20 sanal AABB.
- 0.4 sn zip, güzergâhta engel taraması, çatıya çıkış, duvar tırmanma ve duvardan sekme.
- Yumruk/kamçı, 12 sn Dev, hasar ve 2 sn sonra yeniden doğma; olay API'leri ve nişan bilgisi.
- Omuz kamerası, fare yörüngesi, FOV 70–88, hızla takip mesafesi, kamera çarpışması ve sallanma yatışı.
- ?test=1 için altı saniyede üç basılı/bırakılmış girdi döngüsü; oyuncu sallanma/hız günlüğü.

## Doğrulandı
- Chrome'da gerçek ES modülleriyle 31/31 mekanik kontrol geçti. Yürüme/koşma hızları, çift zıplama sınırı, duraklatma, Dev süresi, saldırılar, yeniden doğma, sallanma/bırakış, zip süresi/ara engel, duvar/çatı, kahraman/dokunaç bağlantısı, nişan ve girdi kenarları sınandı.
- Sanal ortamda altı saniyelik sabit zaman adımlı demo: `[OYUNCU] sallanma 2, max hız 57.1`.
- Gerçek şehir API'siyle ayrıca altı saniyelik fizik simülasyonu geçti: iki sallanma, maksimum 48.0 m/s; konumlar sonlu kaldı.
- Sekiz modül birlikte yüklendi; `[ZIFIR] HATA 0`, window.__ZIFIR_HATALAR boş. Son tam koşuda shader derleme hatası görülmedi. Önceki koşuda görülen sehir.js sayı biçimi hataları diğer modül güncellenince giderilmişti; o dosyaya tarafımızdan müdahale edilmedi.
- Ekran görüntüsü: /tmp/zifir-kontrol/oyun-tam.png. Tam oyun günlüğü: /tmp/zifir-kontrol/sonuc.log. Son mekanik günlüğü: /tmp/zifir-kontrol/son-mekanik.log. Test araçları /tmp/zifir-kontrol içinde, proje dışında tutuldu.

## Ne doğrulanmadı
- Fiziksel oyun kolu, gerçek fareyle uzun oyun oturumu ve kullanıcı tarafından hareket hissi değerlendirmesi yapılmadı.
- Yazılımsal GPU ile başsız render yavaş olduğundan 60 fps hedefi doğrulanmadı. Altı saniyelik fizik testleri renderdan bağımsız 1/60 sn adımlarla yapıldı; normal tam oyun ekran görüntüsü alındığında simülasyon yalnızca 0.25 sn ilerlemişti.
- Node kurulu değil; sözdizimi ve çalıştırma Chrome'un gerçek modül yükleyicisiyle doğrulandı.
- Son tam koşuda sigmaRadians örnek sayısı/parlama uyarıları var; çalışma hatası değil, görsel inceleme için ilgili modül sahibine not.

## SÖZLEŞME İSTEĞİ
- Zorunlu API değişikliği yok. Ana hata sayacı shader derleme hatalarını yakalamıyor; oyun.js sahibi ileride renderer.debug.onShaderError üzerinden bu hataları da sayaca ekleyebilir.
- Başlangıçta aynı dosyalara dış yazıcı müdahalesi gözlendi; teslim edilen girdi/oyuncu sürümlerinin sahipliği Codex'te tutulmalı.
