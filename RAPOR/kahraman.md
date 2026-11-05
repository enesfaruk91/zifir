# KAHRAMAN raporu (js/kahraman.js)

## Yapıldı
- API SOZLESME §4: `G.kahraman = {grup, ayarla, dokunac, elNoktasi, devOl}`. Ön yüz +Z, 'sol' el = +X. Ayak tabanı grup içinde y=0.
- Prosedürel eklemli model: pelvis/gövde (lathe V-biçim)/baş/kollar/bacaklar, MeshPhysicalMaterial siyah, clearcoat 1, düşük roughness, çok hafif iridescence (0.1), kendi PMREM yansıma ortamı (sahneye dokunmaz). onBeforeCompile: yavaş akan yüzey dalgası + ince damar çizgileri (Dev'de turkuaz parlar) + çok hafif mor rim.
- Damla gözler (ExtrudeGeometry, beyaz hafif emissive, göz kırpma), göğüste Yürek Taşı (çift atımlı nabız, mor<->turkuaz, halka yuva + halo sprite) ve sırtta küçük bir yansıması (arkadan da seçilsin diye), sırtta 4 kalın kıvrılan dokunaç (sabit segmentli tüp, konum özniteliği güncellenir).
- Animasyonlar: dur, yuru, kos, zipla, dus (kollar açık), sallan (süper kahraman pozu, bir kol dokunaç ucuna nişan alır), duvar (dört ayak), zip, yumruk (sağ/sol dönüşümlü, yumruk büyür), kamci, hasar (sarsıntı + hafif parlama), dogus (birikintiden yükselme).
- `dokunac(ad,bas,bit)`: 'sol'|'sag'|'kamci', kalın dalgalı tüp, ~0.11 sn'de uzar, uçta yapışma sıçraması (blob+halka+damlalar), null = gizle.
- `devOl(true)`: yaylı 1.6x büyüme, damarlar turkuaz, kalp hızlanır. Hızlıyken 2 şeritli mor iz (Dev'de turkuaz).
- Test: `?test=1&kahramankam=1` kamerayı 4 m'ye alır + test ışığı/zemin. Ek parametreler: `izole=1` (diğer modülleri gizler, kahramanı kendi sürücüsüyle sırayla oynatır), `durum=<ad>`, `aci=`, `mes=`, `bak=`, `dev=1`, `tensiz=1`. oyuncu yoksa ?test=1 iken de animasyonlar 1 sn arayla döner.
- `[ZIFIR] HATA 0` (birleşik oyunda dahil) doğrulandı.

## Doğrulanmadı / zayıf
- Yalnız SwiftShader ekran görüntüsü; gerçek GPU'da görünüm/bloom farkı olabilir. 60 fps ölçülmedi.
- Ayak yere kayması (yürüme adım eşlemesi yaklaşık). 'duvar' pozu, grup'un yalnız Y ekseninde döndüğü ve yüzün duvara baktığı varsayımına dayanır.
- Gözler ve Yürek Taşı bloom'da biraz beyazlaşıyor; uzaktan seçiliyor ama kesin damla biçimi yakından okunuyor. Gerçek 7 m arka kamera görüntüsü alınmadı (arkadan yalnız sırt taşı + dokunaçlar görünür).
- 'hasar' parlaması, dogus birikintisi geometrisi basit.
- Kod içinde test için `gizle=` hata ayıklama parametresi kalmış (zararsız).

## Sözleşme istekleri
- oyuncu.js: grup.position = ayak tabanı, yalnız yaw döndürsün (pitch/roll vermesin; eğimi kahraman kendi yapar).
- ayarla'ya `hiz` her karede verilsin (iz, yürüme hızı, squash buna bağlı).
