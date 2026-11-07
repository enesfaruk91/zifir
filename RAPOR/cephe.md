# Cephe / balkon / çatı / dükkân / kaldırım (3. aşama görsel)
Dosyalar: js/harita_cephe.js (yeni), js/harita.js (bina bölümü yerine çağrı, yol dokuları, sehirkam 6/7), js/harita_fizik.js (yalnız kırma çatı), test/cephe_olc.py (ölçüm), test/test_oyun.py (#16 işaretçisi aSd -> aWc; kontrol aynı, zayıflatılmadı).
## Yapılanlar
1. Renk: 9 tonluk düşük doygunluklu palet (krem, bej, somon, açık sarı, şeftali, gri, soluk yeşil, tuğla kırmızısı, kirli beyaz), osm id hash. Zemin kat: %50 taş kaplama (4 ton), %25 koyu boya, %25 aynı.
2. Cephe: prosedürel 4 pencere varyantı (çift kanat PVC+denizlik, geniş sürgülü+lento, dik pencere+beton söve, ikiz küçük pencere), kat bandı, hücre başına hash: perde, panjur (kısmen inik), ışıklı/TV mavisi, kahverengi/beyaz PVC, lekeli sıva, cam yansıması. Dünya ölçekli UV (kat 3 m, sütun ~3,4 m). Tek shader, 4 malzeme.
3. Balkon: tek InstancedMesh, parça maskesi (dolu parapet / çubuk korkuluk / camla kapalı + saksı, çamaşır ipi, klima). 24 325 balkon, 6 416 camlı. Shader aynı kuralla balkon kapısını çizer. Çarpışma YOK. LOD 75 m (düşük kalite 40 m, detaylar kapalı).
4. Çatı: 445 bina kırma (hipped, saçak taşmalı, kiremit dokusu), 248 düz çatı + parapet + su deposu/anten/güneş paneli/asansör kulübesi (1 InstancedMesh). Fizik: b.kirma (hr, k); zeminY/carpis/ışın/yakinBina çatı yüzeyini izler (h = min(hr, k*kenar uzaklığı), düz seviyenin üstünde). Kırma çatılı binalar rastgeleCati/catiNoktalari'ndan çıkarıldı (kedi/küre/doğuş çatı içine gömülmesin).
5. Dükkân: primary/secondary/tertiary kenarındaki cephelerde (515 modül) zemin kat vitrin (shader) + tabela atlası (28 jenerik Türkçe ad) + çizgili tente, tek mesh.
6. Kaldırım: kilit taşı dokusu + açık bordür şeridi (aynı mesh); asfalt: sıcak gri prosedürel doku (mavi/mor değil).
7. GLB çatı eşyaları (klima/depo/anten) kaldırıldı, yerine prosedürel.
## Ölçüm (gerçek RX 550, görünür Chrome, orta, 960x540, test/cephe_olc.py; çizim çağrısı toplam, gölge+bloom dahil)
| kamera | önce çağrı / üçgen | sonra çağrı / üçgen |
| sokak (sehirkam=5) | 129 / 227k | 136 / 503k->339k* |
| çatı (6) | 153 / 330k | 163 / 404k |
| kuşbakışı (2) | 176 / 152k | 166 / 180k |
(*kare sayımı gölge dahil; üçgen sayısı maskelenen balkon parçalarını da sayar, gerçek raster daha az.) Çağrı farkı koşular arası gürültü (trafik) içinde: +7/+10/-10; hedef +30 aşılmadı. FPS: vsync'li 59,6 (önce 59,6); vsync kapalı 120-138 FPS (yalnız sonra ölçüldü). test_kararma 60 sn --gercek: 3568 kare = 59,3 FPS, kararma 0, kamera bina içi 0.
Ekranlar: RAPOR/cephe_1 (sokak), _2 (çatı), _3 (kuşbakışı), _4 (yakın cephe); önce: cephe_once_1..3.
## Testler
test_oyun 23/23, test_mobil 53/53, test_devam geçti (hata listesi boş).
## Ne doğrulanmadı
- Kırma çatı üstünde gerçek oyuncu duruşu/iniş (zeminY/carpis formülü kodlandı; yalnız mevcut testler geçti, kırma çatıya özel bot testi yok). Yüzey eğiminde dikey itme hafif zıplama yapabilir.
- "Önce" çizim çağrısı eski kodun kendisinden değil, değişiklik öncesi koşudan; çağrı sayısı koşular arası ±20 oynuyor.
- Düşük kalite, gece/gündüz saatleri, tam ekran 1080p, yüksek kalite ölçülmedi; gece pencere ışığı gözle bakılmadı (alacakaranlık görüldü).
- Yakın cephede güneş alan yüzler hâlâ soluk/pastel; gerçek Ankara apartman sıvasına göre fotoğrafla kıyas yok (fotoğraf kullanılmadı).
- Balkon sayısı yüksek (24k): bazı cephelerde gerçekçilikten fazla olabilir; yan komşu kontrolü yalnız 3 m.
- Kenar kombinasyonları (L biçimli çokgenler) için kırma çatı dışbükeylik filtresi var ama gözle taranmadı.
