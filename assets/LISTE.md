# ZİFİR — Görsel varlık listesi

26 görsel · 7,119,916 bayt (7.12 MB; 6.79 MiB). JPEG kalite 88; saydam dosyalar RGBA PNG. En büyük kenar 2048 px.

| Dosya | Piksel boyutu | Dosya boyutu | İçerik | Tileable mı? |
|---|---:|---:|---|---|
| [cephe_1.jpg](cephe_1.jpg) | 1024×1024 | 224.0 KiB | Beton gece cephesi; 8×8 pencere | Evet, X/Y |
| [cephe_1_isik.jpg](cephe_1_isik.jpg) | 1024×1024 | 74.7 KiB | cephe_1.jpg ile hizalı, siyah zeminli sıcak sarı/soğuk mavi emissive haritası | Evet, X/Y |
| [cephe_2.jpg](cephe_2.jpg) | 1024×1024 | 176.6 KiB | Cam giydirme gece cephesi; 8×8 pencere | Evet, X/Y |
| [cephe_2_isik.jpg](cephe_2_isik.jpg) | 1024×1024 | 44.3 KiB | cephe_2.jpg ile hizalı, siyah zeminli sıcak sarı/soğuk mavi emissive haritası | Evet, X/Y |
| [cephe_3.jpg](cephe_3.jpg) | 1024×1024 | 285.8 KiB | Tuğla apartman cephesi; 8×8 pencere | Evet, X/Y |
| [cephe_3_isik.jpg](cephe_3_isik.jpg) | 1024×1024 | 70.9 KiB | cephe_3.jpg ile hizalı, siyah zeminli sıcak sarı/soğuk mavi emissive haritası | Evet, X/Y |
| [cephe_4.jpg](cephe_4.jpg) | 1024×1024 | 147.4 KiB | Fütüristik panel cephesi; 8×8 pencere | Evet, X/Y |
| [cephe_4_isik.jpg](cephe_4_isik.jpg) | 1024×1024 | 51.5 KiB | cephe_4.jpg ile hizalı, siyah zeminli sıcak sarı/soğuk mavi emissive haritası | Evet, X/Y |
| [cati.jpg](cati.jpg) | 1024×1024 | 383.2 KiB | Katran/çakıl çatı zemini; havalandırma tabanı izleri | Evet, X/Y |
| [asfalt_islak.jpg](asfalt_islak.jpg) | 1024×1024 | 422.9 KiB | Şerit çizgisiz, su birikintili ıslak asfalt | Evet, X/Y |
| [asfalt_islak_parlak.jpg](asfalt_islak_parlak.jpg) | 1024×1024 | 422.8 KiB | Gri ton roughness haritası; koyu su alanları daha parlak | Evet, X/Y |
| [kaldirim.jpg](kaldirim.jpg) | 1024×1024 | 266.9 KiB | Derzli beton kaldırım taşları | Evet, X/Y |
| [gokyuzu.jpg](gokyuzu.jpg) | 2048×1024 | 215.7 KiB | Mor-lacivert gece, ay, yıldızlar ve uzak hayalî neon şehir; 2:1 equirectangular | Yalnız X; 360° panorama |
| [menu_arka.jpg](menu_arka.jpg) | 1920×1080 | 419.4 KiB | Dokunaçla sallanan Zifir; sol üçte birlik bölüm logo alanı | Hayır |
| [yukleniyor.jpg](yukleniyor.jpg) | 1280×720 | 304.4 KiB | Çatı kenarında çömelip şehri izleyen Zifir; arkada ay | Hayır |
| [zifir_ref.png](zifir_ref.png) | 1024×1024 | 752.3 KiB | Zifir ön/yan modelleme referansı; saydam | Hayır |
| [robot_ref.png](robot_ref.png) | 1024×1024 | 1232.5 KiB | Paslı turuncu, tek gözlü sevimli Pas Robotu ön/yan referansı; saydam | Hayır |
| [logo.png](logo.png) | 1024×512 | 408.6 KiB | ZİFİR; kara jöle harfler, damlalar ve mor-turkuaz kenar ışığı; saydam | Hayır |
| [neon_1.png](neon_1.png) | 512×256 | 154.3 KiB | Saydam neon tüp tabela: ÇAY 24 | Hayır |
| [neon_2.png](neon_2.png) | 512×256 | 118.4 KiB | Saydam neon tüp tabela: ROBOTAMİR | Hayır |
| [neon_3.png](neon_3.png) | 512×256 | 120.4 KiB | Saydam neon tüp tabela: KUMRU | Hayır |
| [neon_4.png](neon_4.png) | 512×256 | 145.9 KiB | Saydam neon tüp tabela: SİMİT | Hayır |
| [neon_5.png](neon_5.png) | 512×256 | 104.5 KiB | Saydam neon tüp tabela: GECE MARKET | Hayır |
| [neon_6.png](neon_6.png) | 512×256 | 113.1 KiB | Saydam neon tüp tabela: LUNAPARK | Hayır |
| [neon_7.png](neon_7.png) | 512×256 | 145.0 KiB | Saydam neon tüp tabela: PAS YOK! | Hayır |
| [neon_8.png](neon_8.png) | 512×256 | 147.5 KiB | Saydam neon tüp tabela: ZİFİR; mor-turkuaz damla-göz amblemi | Hayır |

## Kullanım notları

Cephelerin her biri 8 sütun × 8 satır içerir. İlgili renk ve `_isik` haritasında aynı UV, tekrar sayısı ve offset kullanılmalıdır. Işık haritaları yalnız pencere camlarını aydınlatır.

Roughness haritası renk dokusu değildir: koyu değerler düşük pürüzlülük/yüksek parlaklık, açık değerler daha pürüzlü yüzeydir. Gökyüzü yalnız yatayda sarılır. PNG dosyalarında gerçek alfa kanalı vardır.

Üretim yöntemi, kontroller, sınırlar ve tam prompt seti: [görsel raporu](../RAPOR/gorsel.md).
