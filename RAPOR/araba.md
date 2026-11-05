# ARABA (js/sehir.js) - renk + çarpışma

## Neden beyazdı
Kenney GLB'lerinde doku yok; renk malzeme baseColorFactor'ünde (paintRed/Blue/Green/Yellow/White, window, carTire, plastic, lightFront/Back). Yükleyici hepsini vertex rengine çevirirken x2 çarpıyordu (renk:2); boya rengi x2 + emissive + ACES ile pastel/beyaza kaçıyordu.

## Yapıldı
- Renk x1; parçalar malzemeye göre ayrıldı: boya (paint*, instanceColor ile araç başına renk), cam (koyu, roughness 0.06 metalness 0.95), lastik (siyah), plastik/gri, far (emissive). Taksi sarı kalır (boya vertex rengi sarı, instance beyaz); delivery paintWhite sabit.
- Palet: siyah, gümüş, beyaz, kırmızı, lacivert, mavi, yeşil, bordo, gri, bakır; araç başına rng(9191) ile sabit.
- Çarpışma: trafikGuncelle oyuncuya <30 m araçları kutu (eksen hizalı; araç yalnız x/z ekseninde gider) olarak listeler; carpis() bu kutularla küre-kutu çözer (yandan itme, üstte durma), zeminY() araç tavanını (yalnız tavan oyuncunun <4 m üstünde değilse) döndürür.
- G.sehir.tasiyici = {var, dx, dz}: son carpis() oyuncu araç tavanındaysa o karedeki araç yer değiştirmesi (oyuncu.js ileride kullanabilir; şimdilik kullanılmıyor).
- Oyuncu aracın 16 m önünde, şerit içindeyse araç yavaşlayıp durur.

## Doğrulanmadı
- RX 550 fps; araç başına ekstra mesh (boya+cam ayrı) çizim çağrısını artırır (model başı 4 mesh).
- tasiyici oyuncu.js tarafından henüz uygulanmıyor; araç hareket ederken üstteki oyuncu kayabilir.
- Araç kutusu yaklaşık (modelin bounding box'ı); ayna/tampon ince detayı yok.
