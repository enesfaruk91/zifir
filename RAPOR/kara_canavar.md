# KARA CANAVAR raporu (js/kahraman.js, devOl)

## Yapıldı
- Dönüşüm (~0.8 sn): jöle malzemede vertex shader şişme/kaynama dalgası (`uSis`), Yürek Taşı + hale parlaması, gövdeye yayılan mor-turkuaz damar ağı (`uYay`, göğüsten dışa maske, nabızla parlar). devOl(true): `G.efekt?.sars(0.5,0.6)`, `flas('#5b2a86',0.3)`, `yavasCekim(0.5,0.5)`. Bitişte (devOl(false)) 0.6 sn'de geri çekilme (negatif şişme, damarlar söner, dikenler küçülür) + 14 jöle damlası düşer, zeminde iz bırakır.
- Form: ölçek 2.0x (yaylı); omuz/üst gövde/kol/yumruk kemikleri ek ölçekli (V siluet), kollar hafif açık, gövde öne eğik. Sırt dokunaçları 2.5x uzun, kalın, hızlı kırbaç; uçlarında 2 küçük jöle damlası (biri geride süzülür). Omuz/üst kol/ön kol için 8 yumuşak eğri jöle dikeni: kemik başına tek birleşik mesh (3 draw call), kemiğe bağlı, shader ile büyür. Gözler büyür, daralır, yukarı çekik ayrık iki damla + mor hale.
- Hareket: yürüme/koşu timeScale %40 düşük; her dev adımında `sars(0.12,0.15)` + kara jöle iz decal'i (20 havuz, 2 sn söner). Yumruklarda ek kol rotasyonu; 'bitirici'de iki kol kaldır-yere vur (sars + büyük iz). Dev iniş: sars + iz.
- Test bayrakları: `&ctsabit=0..1` (dönüşüm karesi dondur), `&slam=1`, `&abd=`/`&pun=` (kol açıları).
- Performans: ek geometri ~3 mesh + 20 düz decal + 14 damla; dikenler küçük (~50 üçgen).

## Doğrulama
- `?test=1` HATA 0; test_oyun.py 16/16 geçti. Ekran görüntüleri (SwiftShader): ön yakın, 3/4, arkadan ~7 m (koşu), dönüşüm ortası (ctsabit=0.45), bitirici kolları kalkık. Telif: uzun dil/sivri diş sırası/salya/örümcek amblemi/V göz yok; gözler ayrık damla.

## Doğrulanmadı / zayıf
- Gerçek GPU/60 fps ölçülmedi. Kol abduksiyon/yumruk eksenleri (ABD 0.3, PUN 0.5) yalnız statik karede bakıldı; yürürken dikenler/ayak kayması görsel doğrulanmadı.
- Yere vurma anındaki iz ve düşen damlalar (devOl(false)) oyun içinde gözle görülmedi; izole testte `efekt` çağrıları kapalı (duraklatılmış oyunda flaş takılıyor).
- Bloom/SwiftShader'da kemik saydam kareler ve parlak noktalar abartılı; zemin izi koyu zeminde zor seçilebilir.
- Şişme normalleri yeniden hesaplanmıyor (aydınlatma yaklaşık).

## Özet
1. Q ile 0.8 sn dönüşüm: şişme, damar ağı, Yürek Taşı parlaması, sarsıntı/flaş/yavaş çekim.
2. 2.0x iri-kaslı, öne eğik form; 4 uzun kırbaç dokunaç + damlalar; omuz/kol jöle dikenleri; keskin ayrık gözler.
3. Ağır adımlar (sars + kara iz), geniş yumruk, bitirici'de iki kol yere vurma.
4. Bitişte 0.6 sn geri çekilme + düşen damlalar; HATA 0.
