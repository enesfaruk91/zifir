# CODEX GÖREVİ 2 — ZİFİR görsel varlık üretimi (YALNIZ GÖRSEL, KOD YOK)

Önce `SOZLESME.md` §1'i oku (telif yasakları KESİN: hiçbir mevcut karakter, logo, marka, örümcek
amblemi, bilinen şehir silueti yok; tamamen özgün). Bu görevde **hiçbir .js/.html dosyasına
dokunma** (başka ajanlar yazıyor). Yalnız `assets/` klasörüne dosya yaz.

Image generation aracınla aşağıdakileri üret, `assets/` altına kaydet, gerekirse python3 + PIL ile
boyutlandır/dönüştür (JPEG kalite 88; saydamlık gerekenler PNG). Hedef PC zayıf ekran kartlı
(Radeon RX 550): doku boyutlarını sınırla (en çok 2048, çoğu 1024), toplam assets ≤ 40 MB.

1. `cephe_1..4.jpg` (1024x1024, kusursuz döşenebilir/tileable): gece gökdelen cepheleri — beton,
   cam giydirme, tuğla apartman, fütüristik panel; her biri için aynı ızgarada
   `cephe_N_isik.jpg` (siyah zemin üstünde yalnız yanan pencereler, sıcak sarı/soğuk mavi karışık;
   emissive harita). Pencere ızgarası 8x8 olsun ki kod tekrarlayabilsin.
2. `cati.jpg` (1024, tileable): çatı zemini (katran/çakıl, havalandırma izleri).
3. `asfalt_islak.jpg` + `asfalt_islak_parlak.jpg` (1024, tileable): yağmurdan ıslak asfalt, şerit
   çizgisi YOK; ikincisi roughness için gri ton haritası (su birikintileri koyu = parlak).
4. `kaldirim.jpg` (1024, tileable).
5. `gokyuzu.jpg` (2048x1024, equirectangular panorama): gece, mor-lacivert bulutlar, büyük ay,
   yıldızlar, ufukta uzak hayalî neon şehir ışıkları siluetinin parıltısı (gerçek şehir değil).
6. `neon_1..8.png` (512x256, saydam arka plan): özgün Türkçe neon tabelalar — "ÇAY 24",
   "ROBOTAMİR", "KUMRU", "SİMİT", "GECE MARKET", "LUNAPARK", "PAS YOK!", "ZİFİR" (sonuncusu
   kahramanın mor-turkuaz damla-göz amblemi ile). Parlak neon tüp görünümü.
7. `menu_arka.jpg` (1920x1080): ana menü afişi — Zifir: parlak simsiyah canlı jöle kahraman,
   atletik ama sevimli-havalı, büyük beyaz DAMLA biçimli gözler, göğsünde mor-turkuaz parlayan
   "Yürek Taşı", sırtından kıvrılan 4 kara dokunaç; neon gece şehrinde bir binadan diğerine kara
   dokunaçla sallanıyor. YASAK: dil, sivri diş sırası, salya, örümcek amblemi, kırmızı-mavi renk,
   bilinen herhangi bir karaktere benzeyen kafa/göz biçimi. Sol üçte birlik alan logo için sade
   bırakılsın.
8. `yukleniyor.jpg` (1280x720): Zifir bir çatı kenarında çömelmiş, şehri izliyor, ay arkada.
9. `zifir_ref.png` (1024, saydam): Zifir ön/yan karakter referansı (3D modelciler için).
10. `robot_ref.png`: Profesör Pas'ın sevimli Pas Robotu (paslı turuncu, tek büyük göz) referansı.
11. `logo.png` (1024x512, saydam): "ZİFİR" oyun logosu — akışkan kara jöle harfler, mor-turkuaz
    kenar parıltısı, harflerden damlayan jöle.

Bitince `assets/LISTE.md`: dosya adı, boyut, ne olduğu, tileable mi; ve `RAPOR/gorsel.md`
(ne yapıldı / ne doğrulanmadı). Görselleri kendin bir kez açıp kontrol et: tileable dokularda
dikiş izi varsa PIL ile kenar harmanlama (offset + blend) uygula. Soru sorma.
