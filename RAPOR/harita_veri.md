# Basınevleri harita verisi (1. aşama)

## Kaynak
- OpenStreetMap, Overpass API (overpass-api.de; kumi.systems boş yanıt verdi). Veri zamanı: 2026-11-07. ODbL 1.0. Lisans: assets/LISANS.md.
- Sınır: relation 5525940 "Basınevleri Mahallesi" (admin_level 8, Keçiören/Ankara). Sınır VAR; kutu yedeği kullanılmadı.
- Yükseklik: OpenTopoData srtm30m (SRTM 1", 30 m), 30 m ızgara, 100'lük istekler. Çalıştı.

## Sorgular
- Ham: `[bbox:39.9640,32.8483,39.9790,32.8597]` içinde nwr building/highway/landuse/leisure/natural/amenity/shop/waterway + barrier=wall|fence, `out geom tags`; sınır ve multipolygon ilişkiler ayrı sorguyla (`out body geom`; global bbox ilişki üyelerini kırpıyor). Ankara Çayı ilişkisi (45 üye, çok büyük) çıkarıldı; yerel way parçaları zaten var.
- Dönüştürücü, sınır + 80 m tampon içinde kalanları süzer (bbox ham veri sınırdan daha geniştir).

## Dosyalar
- assets/harita/basinevleri_osm.json (ham, ~0.55 MB), assets/harita/basinevleri.json (~189 KB), tools/osm_cevir.py, tools/harita_onizle.py, RAPOR/basinevleri_onizleme.png.
- Yeniden üretim: `python3 tools/osm_cevir.py` (yükseklik için ağ), `python3 tools/harita_onizle.py` (Pillow).

## Koordinat sistemi (sehir.js'e işlerken)
- Merkez lat 39.97154545, lon 32.8539945 (sınır kutusu ortası) = (0,0).
- x = DOĞU, y = yukarı, z = GÜNEY (kuzey = -z). Three.js sağ-el sistemiyle uyumlu; eksen çevirme gerekmez.
- Çokgenler ustten bakışta (kuzey yukarı) SAAT YÖNÜNDE (x-z shoelace > 0); ic_halkalar ters yönde.
- Yükseklik y: izgaradaki değer en düşük noktaya (mutlak 846 m) göre. Binalar kendi taban y'sinden yükselir; `taban` (min_height) varsa o kadar yukarıdan.
- ÖNEMLİ: sehir.js mevcut düzeni P-ızgarası (kavşak aralığı P) tabanlı; bu gerçek harita onunla uyuşmaz, ızgara/collider/lamba/trafik yerleşimleri bu veriden yeniden üretilmeli.

## Şema (basinevleri.json)
- baslik: ad, kaynak, osm_sinir_relation, merkez{lat,lon}, eksenler, tampon_m, kapsam_m{x_min,x_max,z_min,z_max,genislik,derinlik}, sinir_kutusu_m, sayilar{...}, yukseklik{durum,kaynak,en_dusuk_mutlak_m,en_yuksek_mutlak_m,fark_m}
- sinir: [[x,z],...]
- binalar[]: id, tur(konut|ibadet|okul|hastane|ticari|yardimci|sanayi|diger), halka[[x,z]], ic_halkalar[][] (isteğe bağlı), yukseklik(m), yuk_kaynak(height|levels|tahmin), tahmin:true (yalnız tahminlerde), alan(m2), taban?, cati?, ad?
- yollar[]: id, tur, nokta[[x,z]], genislik(m), arac_yolu(bool), tahmin:true (genişlik tahmini), tek_yon?, serit?, ad?, kopru_tunel?
- alanlar[]: id, tur(park|cimen|orman|oyun_alani|spor_alani|su|otopark|okul_arazisi|konut_arazisi|...), halka, ic_halkalar?, ad? ; dere: tur "dere" + cizgi
- agaclar: [[x,z]] ; duvarlar[]: tur, nokta ; noktalar[]: tur(amenity/shop), x, z, ad
- yukseklik_izgara: nx, nz, adim(30), x0, z0, deger[j*nx+i] (x=x0+i*adim, z=z0+j*adim); çift doğrusal örnekleme önerilir.
- Genişlik varsayılanları (m): secondary 10, tertiary 9, residential 7, service 4.5, footway 2, steps 2; width/lanes varsa lanes*3.25+0.5.

## Sayılar
- Kapsam (sınır+80 m): 951 x 1643 m. Sınır kutusu 791 x 1483 m; sınır alanı ~0.71 km2.
- Bina 693 (ham 988, 295 tampon dışı). Taban alanı toplamı ~267 000 m2. Yükseklik min/ort/maks: 3.5 / 15.8 / 85 m.
- Yükseklik kaynağı: height 1, building:levels 10, TAHMİN 682 (%98.4).
- Tür: diger 655 (OSM'de building=yes), konut 31, ibadet 6, yardımcı 1. Okul/hastane/ticari binası ayrışmadı.
- Yol 174 (37.2 km): residential 86, secondary 23, service 23, secondary_link 17, footway 15, tertiary 6, steps 4. Genişliğin tamamı tahmin (hiçbirinde width/lanes yok).
- Alan 38 (park 17, çimen 7, okul arazisi 3, spor 3, konut arazisi 4, orman 2, otopark 1, su 1). Ağaç 0, duvar 1, nokta (amenity/shop düğümü) 7.
- Yükseklik: SRTM fark 102 m (846-948 m), ızgara 32x55.

## OSM'de eksik / sorunlu
- Bina yükseklikleri neredeyse hiç yok: 682/693 tahmin. Tahmin: konut/yes 15.5 m (5 kat), müstakil 8, ibadet 12, yardımcı 3.5. Gerçek Basınevleri'nde 3-8 kat karışık; "birebir" yükseklik bu veriyle MÜMKÜN DEĞİL.
- Bina türü neredeyse hepsi `yes`; okul/hastane/dükkân bina çokgenine bağlanmamış.
- Ağaç düğümü yok (natural=tree 0). Oyunda ağaçlar park çokgenlerine rastgele serpilmeli.
- Yol genişlik/şerit bilgisi yok; yol genişlikleri türden tahmin.
- Dışkapı Yerleşkesi (üniversite) ve çevre bina tamamlığı doğrulanmadı.
- Boş görünen yerler (sol-ortada bina bulunmayan alan) gerçekten boş mu yoksa OSM eksiği mi bilinmiyor.

## Ne doğrulanmadı
- Gerçek dünyayla birebir uyum: yalnız OSM'ye güvenildi; uydu görüntüsü/sokak görüntüsüyle karşılaştırılmadı.
- SRTM bina/ağaç tepesini de ölçer (DSM, 30 m), gerçek zemin eğiminden sapabilir; ızgara 30 m kaba, dar sokak eğimleri yakalanmaz. Mutlak doğruluk ~±5-16 m.
- Köprü/tünel/katmanlı yollar (layer) ayrıca işlenmedi; yollar y=zemin varsayar. Çok kavşaklı bölgelerde (güney-doğu) üst geçit çakışması olabilir.
- Dönüştürücüde çokgen kendi kendini kesme / çakışan binalar denetlenmedi. Ön izleme gözle bakıldı, sayısal topoloji testi yapılmadı.
- Oyunda performans: 693 bina + 174 yol sehir.js'te denenmedi.
- js/ dosyalarına dokunulmadı; oyun testi çalıştırılmadı.
