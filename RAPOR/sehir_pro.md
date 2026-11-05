# ŞEHİR PRO (js/sehir.js)

## Yapıldı
- Trafik: Kenney sedan, taksi, van (kamyonet), delivery, suv, hatchbackSports (özgün renkler; polis/ambulans yok). 120 araç, model başına 2 InstancedMesh (vertex-color gövde + küçük emissive far/stop), + 1 far huzmesi. Şerit başına hız, öndeki araçla mesafe, kavşakta 16 sn döngülü kırmızı/yeşil (kırmızıda yavaşla-dur). Eski kutu araçlar GLB yüklenince gizlenir/güncellenmez (yüklenmezse kalır).
- Lamba: Quaternius Streetlight_Single, aynı 936 konum (ankraj/collider aynı). 150 m dışında eski direk+baş glow'u kalır.
- Sokak eşyası (kaldırım, kavşak dışı): ağaç (Kenney treeLarge), bank, çöp kutusu, otobüs durağı (procedürel kutu modeller), bariyer (Kenney barrierRed, 3'lü), trafik ışığı (Quaternius TrafficLight, kavşak köşeleri).
- Çatı: cyberpunk AC, AC_Stacked, Antenna_2, Pipe_1, Fence, Tank, 530+ adet, çatı üst katının dışına serpiştirilmiş. Collider YOK.
- LOD: tüm statik kümeler 150 m (3B) dışında instance count'tan çıkar (0.35 sn'de bir / kamera 6 m kayınca); araçlar 150 m dışında yazılmaz.
- Test günlüğü: `[SEHIR] pro: arac 120, esya 2824 (gorunen ~220-285), cizim cagrisi 85 (pro kapali 60, +25)`. Test kameraları: `?sehirkam=4` sokak, `=5` çatı, `=6` araç yanı.
- Fizik/çarpışma/ızgara, bina gövdeleri, API'ler değişmedi (RNG akışı ayrı, `rng(424242)`; mevcut yerleşim aynı).

## Doğrulama
- `?test=1` HATA 0. test_oyun.py: 1-14 ve 9 GEÇTİ (10-13 çarpışma/görsel kutu dahil). 15 (duvardan çatıya çıkış) ve 16 (mükemmel bırakış) KALDI: başka ajanın (oyuncu.js) yeni maddeleri, sehir.js ile ilgisi görülmedi (duvar/salınım zamanlaması).
- Ekran görüntüleri sokak (sehirkam=4), çatı (5), araç (6) alındı, modeller doğru yönde/ölçekte.

## Doğrulanmadı
- Gerçek GPU (RX 550) fps; yalnız swiftshader çizim çağrısı ölçüldü (+25, sınır +40).
- Ağaç/bank/çöp/durak/bariyer çarpışmasız (dekor): oyuncu içinden geçer.
- Model yükleme süresi (~40 MB'a yakın GLB paralel); gecikirse eski görünüm geçici kalır.
- Işık/yeşil trafik ışığı modeli sabit renkli; araç kuralıyla görsel eşleşmez. Otobüs modeli pakette yok (otobüs eklenmedi).
- Araç çarpışma/sollama yok; çapraz şerit araçları kavşakta sinyal dışı dönüşte kesişmez (dönüş yok).
