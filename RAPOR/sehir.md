# ŞEHİR raporu (js/sehir.js)

## Yapıldı
- SOZLESME §4 sehir.js API'si eksiksiz: boyut(400), binalar, zeminY, carpis, ankrajBul, rastgeleCati, sokakNoktasi, yollar, gokyuzuRengi. Ek: `kuleler` (tepe konumları), `parklar`, `kanal {z, yari}`.
- 311 bina (+ üst katlar), 5 dev kule (stepli, iğne, kırmızı yanıp sönen ikaz), 15x15 ızgara sokak (aralık 57 m, yol yarı genişliği 7 m, kaldırım 2.5 m), kanal (z≈199.5, 30 m geniş, ay-neon yansımalı su shader'ı), her yolda köprü, 3 köprüde neon "kapı" (direk+kiriş+kablo; ankraj olabilir), 3 park (ağaç, neon halka heykel, ateşböcekleri), ~936 sokak lambası (direkler ankraj), 150 araç (farlar, stop lambaları, yer huzmesi), uzak silüet halkası (300 bina), yıldızlı gök kubbesi + büyük ay (shader), FogExp2, hemisphere + gölgeli ay ışığı.
- Pencereler: MeshStandardMaterial + onBeforeCompile (örnek başına boyut/tohum; rastgele yanık pencere, emissive, kenar neon şeridi, sokak seviyesi yansıma).
- Tabelalar: 32 uydurma yazı tek atlas CanvasTexture, tek birleşik geometri (561 quad; duvar, dikey, çatı panosu iki yüzlü).
- Zemin: shader ile prosedürel asfalt, orta çizgi, yaya geçidi, kaldırım, park çimi, rıhtım, ıslak yol neon yansıması.
- Fizik: tüm collider'lar (bina, üst kat, kule, köprü direği/kirişi, lamba direği, heykel kaidesi) 32 m'lik 2B ızgarada; ankrajBul 2B DDA + ışın-AABB (damga ile tekrar yok); carpis küre-AABB, içeri düşmeyi de çözer.
- Gölge kamerası: her kare oyuncu.konum (yoksa kamera) çevresinde ±75 m, texel'e snap.
- Ölçüm (başsız swiftshader): `[SEHIR] bina 311, cizim cagrisi 63-144` (gölge geçişi dahil, bakışa göre), ~165k üçgen. Self-test (`?test=1&sehirtest=1`): ankraj/çarpışma/zeminY doğru sonuç verdi. `[ZIFIR] HATA 0`.
- Test kamerası: `?test=1&sehirkam=1|2|3` (yukarıdan / sokak / köprü) oyuncu varken de kamerayı ezer; yalnız test için.

## Doğrulanmadı
- Gerçek GPU'da 60 fps ölçülmedi (yalnız swiftshader). 1280x720'de çizim çağrısı düşük, ama ızgara+ışın maliyeti gerçek oyun içi yükte ölçülmedi.
- Pencere parıltısı bloom'a (oyun.js bloom 0.9/0.5/0.82) bağlı; yakın duvarlarda hafif sisleme var, pozlamayı oyun.js belirliyor.
- Oyuncu entegrasyonu: `carpis` konum'u KÜRE MERKEZİ sayar (konum'u değiştirmez, `duzeltme` döner). Zemin (y=0) çarpışması carpis'te YOK; zeminY kullanılmalı.
- Kanal su altı değil: yürünebilir yüzey zeminY=0 (suyun üstü y=0.03, kahraman suyun üstünde "kayar"); bilerek, takılma olmasın diye.
- Ağaçlar/korkuluk ankraj değil, collider'sız. Çatı süsleri (klima, tank) collider'sız; zeminY çatı yüksekliğini verir.
- Araçlar kavşakta birbirini kesiyor (çarpışma yok); kamyonet gibi gerçek araçlar `yollar`'ı kullanmalı: sağ şerit z-yolunda x=k*57-3.2 (+z giden), +3.2 (−z giden).

## Sözleşme istekleri
- Yok. (İstek: dusman/gorev/oyuncu `G.sehir.zeminY` ve `ankrajBul` dönen nesneleri saklamasın; her çağrıda yeni Vector3 üretilir.)
- Not: `kahraman.js` o anda söz dizimi hatası veriyordu (başka ajan): "Unexpected token '...'" (bir test turunda görüldü, sonra düzeldi).
