# Kararma / "pır pır" incelemesi

## Sonuç (dürüst)
Başsız Chrome'da (SwiftShader) KARARMA YAKALANAMADI. Kök neden kanıtlanmış değil. Ölçümle iki gerçek kusur bulundu ve düzeltildi.

## Ölçüm yöntemi
`test/test_kararma.py` (kalıcı): composer.render sonrası her karede ekran piksellerinden ortalama parlaklık okunur; ayrıca pozlama, ışık sayısı, renderer.info.programs, sis yoğunluğu, tuval boyutu, dt, kamera bina içinde mi kaydedilir. Gerçek tuş girişi (W, Space, fare tıklaması) + efekt/hasar/flaş tetikleme, 40-60 sn. Kararma = parlaklık son 24 karenin medyanının %60'ının altına düşmesi.

## Elenen nedenler (ölçüldü)
- Pozlama: tüm koşuda sabit 1.150 (saat dilimi geçişi yok). Parlaklık ayarı karede yeniden uygulanmıyor (aynı değer atanıyor, ucuz).
- Işık sayısı: sabit 2; PointLight yalnız foto modunda (`G.dusman.foto`) eklenir. Normal oyunda yeniden derleme tetiklemez.
- Kamera bina içinde: 0 kare. Boyut/composer: koşu boyunca sabit, her karede resize yok.
- Hasar vinyeti/flaş/bulanıklık: yalnız olaya bağlı; parlaklıkta ani düşüş yok. Giriş kararması (`E.kararma`) tek seferlik 2 sn.
- Ani karanlık kare sayısı: 0 (her koşuda).

## Bulunan ve düzeltilen
1. **Oyun sırasında shader derleme**: oyun başladıktan sonra karede 1-6 olay, toplam ~7 yeni program derleniyordu (ilk kare 31 program; bulanıklık geçişi, havuz nesneleri vb. ilk kullanımda). RX550/Mesa'da her derleme ekran donması/titremesi olabilir. Düzeltme `js/oyun.js`: kurulumdan sonra gizli nesneler geçici görünür yapılıp `renderer.compile`, bulanıklık geçişi bir kez zorla çizilerek ön ısıtma. Sonuç: başlangıç program sayısı 83 -> 88-90 (ısıtma çalışıyor) ama oyun içi yeni derleme tamamen kalkmadı: GLB ile asenkron yüklenen malzemeler (`Grey` physical) ve ilk görünen basic malzeme sonradan oluştuğu için yakalanamıyor (koşu başına 1-6 olay, önceden ~4).
2. **Gölge kaydırma ızgarası uyumsuzluğu** (`js/sehir.js`): gölge kamerası texel ızgarasına `2048` ile yuvarlanıyordu, ama varsayılan kalite "orta" gölge haritası 1024. Izgara texel'in yarısı olduğu için oyuncu hareket ederken gölge kenarları titrer (shimmer). Artık `ay.shadow.mapSize.x` kullanılıyor. Bu kararma değil, gölge titremesi.

## Önce / sonra
- Önce: oyun içi yeni program olayı 4 (frame 2, 6, 59 ... 83->90); kararma 0.
- Sonra: başlangıç 88-90, oyun içi olay 1-6 (koşuya göre değişiyor, asenkron GLB kaynaklı); kararma 0.
Not: kararma ölçülmediği için "kararma kalktı" kanıtı VERİLEMEZ.

## Ne doğrulanmadı
- Gerçek RX 550 + Mesa + Chrome'da hiç çalıştırılmadı; SwiftShader'da görülmeyen sürücü/GPU kaynaklı kararma (GPU bellek baskısı, bağlam kaybı, Chrome tam ekran/kompozit hatası) elenemedi.
- Gölge titremesi düzeltmesi görsel olarak ölçülmedi (kod mantığı).
- Kullanıcının oyunu hangi kalite kademesinde ve hangi anda gördüğü bilinmiyor. Non-test modda otomatik kalite düşürme (fps<40) yeniden boyutlandırma + tüm malzeme `needsUpdate` ile yeniden derleme yapar; RX550'de düşük FPS'te bu bir kez tuval temizleyip uzun donma/kararma verebilir (kodda var, ölçülmedi).
- Öneri (başka ajanın dosyaları): oyuncu.js'te kamera çarpışması/near-plane denetlenmedi (bina içi 0 kare, ama sadece bot yolunda).
- Kullanıcıdan istenecek: kalite kademesi, kararmanın sallanırken/yürürken/menüde olduğu, Chrome'da `chrome://gpu` ve tam ekranda mı olduğu.

---
# EK: gerçek GPU ölçümü (görünür Chrome, bu makine)
Komut: `DISPLAY=:0 flock /tmp/zifir_test.lock python3 test/test_kararma.py 60 --gercek [--nan] [--kalite]`
GPU kanıtı: `UNMASKED_RENDERER_WEBGL` = `ANGLE (AMD, AMD Radeon RX 550 / 550 Series (radeonsi polarIs12 ACO), OpenGL 4.6)`. Ayrı profil, pencere iş bitince kapandı, sunucuya dokunulmadı.

- **Ani kararma: yok.** 70 sn / 2486 kare ve 45 sn / 781 kare: sabit pozlama 1.150, 2 ışık, tam siyah kare 0, büyük parlaklık düşüşü 0. (Kalite testinde 4 ardışık karede 0.76 -> 0.45 düşüş var; havada düşerken sahne içeriği, pozlama/ışık sabit, tek seferlik.)
- **NaN/Inf (HalfFloat):** RenderPass ve bloom çıkışı her karede GPU'dan okundu: NaN/Inf piksel = 0 (781 kare). Kodda şüpheli shader (normalize(0), pow(negatif), sqrt(negatif)) yok: gökyüzü/jöle/kahraman shader'larında pow tabanları clamp/abs, sqrt max(0,..) ile korunuyor. Bu yüzden bloom öncesi NaN koruma geçişi EKLENMEDİ (kanıt yok, RX550'de tam ekran geçiş maliyeti var).
- **Oyun içi program derleme (gerçek GPU):** koşu başına 1-2 yeni program (ilk GLB 'physical' malzemesi, ilk 'basic'); ön ısıtma sonrası da kalıyor, tek karelik takılma.
- **fps<40 otomatik kalite düşüşü (yeni bulgu, gerçek kusur):** yüksek -> orta kesintisiz; ORTA -> DÜŞÜK geçişi karede **1100 ms donma** yapıyordu (gölge kapatılınca 21 program yeniden derleniyor, tuval boyutu da değişiyor). Siyah kare sayısı 0 (kareler çizilmediği için ekran son görüntüde donuyor; kullanıcı bunu "titreme/kararma" diye algılamış olabilir).
  Düzeltme (`js/oyun.js`): düşük kalitede gölgeyi kapatmak yerine 512'lik haritaya indir; yeniden derleme yok. Sonra: geçiş 1100 ms -> 57 ms (44 ms yüksek->orta), en uzun kare aralığı 183 ms.
- Doğrulanmadı: kullanıcının gerçekte gördüğü kararma bu makinede hiç yeniden üretilemedi; tam ekran (F11/oyna.sh `--start-fullscreen`) ve Chrome `--app` modunda ölçülmedi; headed koşularda CDP hedefi arada bir kapandı (Inspector.detached, ilk denemelerde 4 kez, sebebi bulunamadı; sonraki koşular tamamlandı).
