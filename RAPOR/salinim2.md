# Salınım 2 + ZIP bina içi + süzülme/dalış (js/oyuncu.js, test/test_oyun.py 3 ve 17)

## Ne değişti
- Gökyüzü ağı: tüm ankraj kademeleri başarısızsa 'bosAg' yerine sanal ankraj (hız/kamera yönünde 25 m ileri, 22 m yukarı, el tarafına 8 m yana; bina kutusu içindeyse çatı+2 m'ye yükseltilir). Salınım aynen çalışır (sabit ip, yer kısıtı); oyuncu.y>140 de çalışır (yükseklik kısıtı yok).
- El sırası: sallanBasla artık her salınımda elSec ile KESİN değiştirir (çapraz ağ olabilir). `salinimtest=1` koşusu: sol, sag (iki salınım; yazılım render yavaş olduğundan 110 sn'de yalnız 2 salınım tamamlandı).
- ZIP bina içi: yakinBina örtüşen kutularda en yüksek çatıyı seçer (savunma amaçlı).
- Süzül (Shift, havada, zeminden >2 m, dikey hız<0.5): dikey hız 0.3 sn'de -3'e kenetlenir, yatay hız hedefi 22, kamera yönüne 70°/sn dönüş + A/D yatış, dalıştan sonra süzülüşte dikey hızın %60'ı ileriye (tavan 45). Olaylar suzulBasla/suzulBit. Dalış (Ctrl/C): yerçekimi x2.5, dikey tavan -70, yatay %20/sn azalır (havada W ivmesi kapalı), olaylar dalisBasla/dalisBit; zeminden 6 m kala dalış biter ve iniş yuvarlanmalı (hasarsız). Durum adları 'suzul'/'dalis' (kahraman.ayarla'ya p.durum olarak gider). Kamera: süzülmede 1.5 m geri + 0.6 yukarı, dalışta -15° bakış ve FOV +8, hizBulanikligi 1.
- Test: madde 17 = E ile çatıya çekilme (çatı kenarının 10 m altından, bakışı çatı kenarını hedefleyen açıda; hedefi olmayan bina atlanır, sayısı detayda). Madde 3 (sağ tık sallan) değişmedi; gökyüzü ağıyla geçiyor.

## Kanıt
- test_oyun.py: 23/23 GEÇTİ (madde 15 ve 17 dahil; son tam koşu bu raporun sonundaki satıra bakın).
- `?test=1&suzultest=1`: süzül 3 sn dikey hız -3.00; dalış min -70.0 (1.5 sn), yatay 21.8->15.6; tekrar süzülde yatay 45 (atak).

## Ne doğrulanmadı
- Madde 15 (zip sırasında bina içi): önceki koşuda 10-12 ihlal (zip, y=29.9 / bir koşuda y=48.3 kutu tepesi 50.2 altında) görüldü, sonraki 4 tam koşu + ~160 ek deneme ve 311 kutu için örtüşme taraması (örtüşen farklı yükseklik 0) ile TEKRARLANMADI. Kök neden KANITLANMADI; ihlal b.kutu'nun yalnız ana gövdeyi kapsayıp üst kat/kule ve çatı eşyalarının gerçek collider'ının farklı olmasından da olabilir (test tanımı kaba). yakinBina düzeltmesi bu nedene yönelik kanıtsız bir savunma. Aralıklı (flaky) olabilir.
- Süzülme/dalış hissi, kamera ve kahraman pozu elle/görsel denenmedi (kahraman 'suzul'/'dalis' pozu yok). Çatıdan Shift tutulu koşu sırasında sıçrayınca süzülme devreye girer: test 15 senaryosunu etkileyebilir.
- Sanal ankrajın görsel ağ çizimi (dokunac) elle bakılmadı.
