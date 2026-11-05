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


## Görsel paketi 2 — 2026-11-05

24 yeni görsel: 8 ara sahne, 6 görev ikonu, 8 metinsiz başarım rozeti, 2 portre. **4,119,128 bayt (4.12 MB; 3.93 MiB)**; 15 MB sınırının altında. İlk paketle birlikte 50 görsel, 11,239,044 bayt (11.24 MB).

Ara sahneler 1280×720 RGB JPEG, kalite 88. İkonlar ve rozetler 256×256, portreler 512×512 RGBA PNG; arka planlar gerçek saydam. Hiçbiri tileable değildir.

| Dosya | Piksel boyutu | Dosya boyutu | İçerik |
|---|---:|---:|---|
| [prof_pas.jpg](hikaye/prof_pas.jpg) | 1280×720 | 339,630 bayt | Profesör Pas; paslı turuncu önlük, dev pirinç gözlük, mekanik kol ve arkasında Pas Robotları. |
| [gorev_kure.jpg](hikaye/gorev_kure.jpg) | 1280×720 | 295,335 bayt | Şehirden dronlarla kaçırılan parlak ışık küreleri; çatıda Zifir. |
| [gorev_kedi.jpg](hikaye/gorev_kedi.jpg) | 1280×720 | 252,346 bayt | Çatı kenarındaki sevimli kediye elini uzatan Zifir; kedinin ağzı kapalı. |
| [gorev_halka.jpg](hikaye/gorev_halka.jpg) | 1280×720 | 271,658 bayt | Gökdelenler arasındaki neon yarış halkalarından dokunaçla sallanarak geçen Zifir. |
| [gorev_kamyonet.jpg](hikaye/gorev_kamyonet.jpg) | 1280×720 | 285,143 bayt | Işık kürelerini kaçıran paslı kamyonetin dokunaçla peşinden giden Zifir. |
| [gorev_patron.jpg](hikaye/gorev_patron.jpg) | 1280×720 | 313,542 bayt | Çatıda dev Pas Robotu; sırtındaki parlak turkuaz pil açıkça görünür. |
| [kara_canavar.jpg](hikaye/kara_canavar.jpg) | 1280×720 | 298,591 bayt | İri Kara Canavar; öne eğik, organik omuz dikenleri, dört uzun dokunaç, ayrık damla gözler, mor-turkuaz damarlar, yağmurlu çatı. |
| [bitis.jpg](hikaye/bitis.jpg) | 1280×720 | 230,784 bayt | Şafakta çatıda oturan Zifir ve kurtarılan kedi; solan şehir ışıkları. |
| [ikon_kure.png](ui/ikon_kure.png) | 256×256 | 51,423 bayt | Işık küresi görev ikonu. |
| [ikon_kedi.png](ui/ikon_kedi.png) | 256×256 | 80,298 bayt | Kedi kurtarma görev ikonu. |
| [ikon_halka.png](ui/ikon_halka.png) | 256×256 | 46,282 bayt | Neon halka yarışı görev ikonu. |
| [ikon_kamyonet.png](ui/ikon_kamyonet.png) | 256×256 | 72,860 bayt | Paslı hırsız kamyonet görev ikonu. |
| [ikon_patron.png](ui/ikon_patron.png) | 256×256 | 91,222 bayt | Tek gözlü Pas Robotu patron görev ikonu. |
| [ikon_egitim.png](ui/ikon_egitim.png) | 256×256 | 61,192 bayt | Açık kitap ve hareket oku; eğitim ikonu. |
| [rozet_1.png](ui/rozet_1.png) | 256×256 | 82,473 bayt | İlk Sallanma — sallanan jöle kahraman ve hareket yayı; metinsiz madalya. |
| [rozet_2.png](ui/rozet_2.png) | 256×256 | 83,036 bayt | Çatı Kralı — çatılar ve altın taç; metinsiz madalya. |
| [rozet_3.png](ui/rozet_3.png) | 256×256 | 97,701 bayt | Kombo Ustası — jöle yumruk ve üç yıldız; metinsiz madalya. |
| [rozet_4.png](ui/rozet_4.png) | 256×256 | 85,195 bayt | Dron Avcısı — tek gözlü pervaneli dron; metinsiz madalya. |
| [rozet_5.png](ui/rozet_5.png) | 256×256 | 88,023 bayt | Kedi Dostu — kedi ve turkuaz kalp; metinsiz madalya. |
| [rozet_6.png](ui/rozet_6.png) | 256×256 | 106,149 bayt | Kara Canavar — güçlü jöle kahraman ve dört dokunaç; metinsiz madalya. |
| [rozet_7.png](ui/rozet_7.png) | 256×256 | 88,708 bayt | Mükemmel Bırakış — açık jöle el, hareket yayı ve altın yıldız; metinsiz madalya. |
| [rozet_8.png](ui/rozet_8.png) | 256×256 | 102,301 bayt | Şehrin Kahramanı — şehir üzerinde mor-turkuaz Yürek Taşı; metinsiz madalya. |
| [zifir_portre.png](ui/zifir_portre.png) | 512×512 | 250,377 bayt | Zifir HUD/diyalog portresi; parlak kara jöle, ayrık damla gözler ve Yürek Taşı. |
| [prof_pas_portre.png](ui/prof_pas_portre.png) | 512×512 | 444,859 bayt | Profesör Pas HUD/diyalog portresi; sahnedeki karakterle aynı yüz ve kostüm. |

Her son dosya açılarak görsel denetimden geçirildi; boyutlar, biçimler, JPEG kalite tabloları ve PNG alfa kanalları doğrulandı. Üretim yöntemi, kontroller ve tam istem seti: [görsel paketi 2 raporu](../RAPOR/gorsel2.md).
