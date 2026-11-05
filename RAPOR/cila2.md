# Cila 2 — görsel varlık entegrasyonu
- sehir.js: 4 cephe (cephe_N + _isik emissive 1.05), 4 InstancedMesh grubu; UV bina boyuna göre (8x8 pencere ≈ 27x24 m), çatı cati.jpg; yol asfalt_islak + roughnessMap, zemin envMap=gökyüzü PMREM (metalness 0.3); kaldırım kaldirim.jpg.
- Gökyüzü gokyuzu.jpg (background + environment 0.25); prosedürel kubbe/ay gizlendi, ay ışığı yönü görseldeki aya hizalandı (0,0.48,0.877). Tek ay.
- Neon: 8 neon_N.png, kalıp başına 1 mesh (alphaTest, renk 2.1 -> bloom); eski atlas tabelaların yerine.
- Anisotropy: en çok 4, 'dusuk' kalitede 1 (oyun.js kaliteAyarla'da güncellenir). Mipmap açık.
- arayuz.js: menu_arka.jpg + sol degrade, logo.png, yukleniyor.jpg perdesi (DefaultLoadingManager.onLoad, 10 sn yedek).
- kahraman.js: damla baş ucu (geriye eğik), büyütülmüş gözler, kalp biçimli düz gölgeli Yürek Taşı.
- Doğrulama: ?test=1 HATA 0; test botu 9/9 (bir koşuda 3. test zamanlama nedeniyle düştü, tekrarda geçti); menü ve oyun içi ekran görüntüsü incelendi.
- Doğrulanmadı: gerçek GPU'da (RX 550) fps/bellek; Zifir modelinin yakın çekim görünümü; ıslak yol yansıması swiftshader'da zayıf görünüyor; sallanma testi flaky.
