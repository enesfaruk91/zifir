# ZİFİR — Gece Şehrinin Kara Kahramanı · MODÜL SÖZLEŞMESİ

Bu dosya tek gerçek kaynaktır. Her ajan YALNIZ kendi dosyalarına yazar. Başka modülün dosyasına
dokunmak gerekirse dokunma; ihtiyacını raporunda "SÖZLEŞME İSTEĞİ" diye yaz.

## 1. Oyun özeti (telif: TAMAMEN ÖZGÜN)
- Oyuncu **Zifir**: uzaydan düşen, canlı, parlak simsiyah bir "jöle" kahraman. Vücudundan
  **kara iplik/dokunaç** fırlatıp binalara yapışır, sarkaç gibi sallanır, duvarlara tırmanır.
  (Ağ atıp sallanan şehir kahramanı TÜRÜNDE bir oyun; ama hiçbir mevcut karakter/oyun kopyalanmaz.)
- YASAK (telif): Venom, Spider-Man, Marvel, Sony adları; örümcek amblemi; uzun dil, sivri diş
  sırası, salya; kırmızı-mavi kostüm; bilinen şehir/karakter/logo/müzik. Kodda, yorumda, metinde
  bu adlar GEÇMEZ.
- Zifir'in özgün imzası: göğsünde **mor-turkuaz parlayan çekirdek** ("Yürek Taşı"), büyük beyaz
  hafif parlayan **damla biçimli gözler** (sevimli-havalı, korkutucu değil), yürürken akan/titreşen
  yüzey, sırtından sallanan 4 kısa dokunaç.
- Düşman: **Profesör Pas**'ın sevimli-sakar **Pas Robotları** ve **Vızvız dronları** şehrin ışık
  kürelerini çalıyor. Yenilen robot kan/şiddet olmadan cıvata-yay saçıp "bzzt" diye söner.
- Görevler: çalınan **Işık Kürelerini** topla, çatıda mahsur **kedileri** kurtar, kaçan
  **hırsız robot kamyonetini** durdur, **yarış halkalarından** geç. Çocuk dostu; ölüm yok —
  canı biten Zifir en yakın çatıda "jöle olarak toplanıp" yeniden belirir.
- Ton: gece, neon mor/turkuaz/turuncu şehir, sis, bloom parıltısı. Yalnız Linux PC, Chrome,
  klavye+fare (oyun kolu varsa bonus). Dil: Türkçe arayüz.

## 2. Teknik çerçeve
- Three.js r170 ES modül: `vendor/three.module.js`, eklentiler `vendor/jsm/...`
  (importmap: `"three"` ve `"three/addons/"` → `index.html` içinde tanımlı).
- Çalıştırma: `./oyna.sh` (python3 http.server 8765 + Chrome --app). file:// ÇALIŞMAZ.
- Test: `./oyna.sh --test` gibi bir bayrak yok; başsız test:
  `python3 -m http.server 8765 -d ~/Masaüstü/ZIFIR &` sonra
  `google-chrome --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --window-size=1280,720 --virtual-time-budget=8000 --screenshot=/tmp/z.png --enable-logging=stderr --v=0 "http://localhost:8765/?test=1"`
  `?test=1` → menü atlanır, oyun doğrudan başlar, `window.__ZIFIR_HATALAR` dizisi doldurulur.
  Konsol hatalarını `--enable-logging=stderr` çıktısında "Uncaught" / "ERROR" ile ara.
- Harici ağ/CDN YOK. Görsel ve ses tamamen prosedürel (kod ile üretilmiş). Dosya resmi yok.
- Performans hedefi: orta PC'de 60 fps. InstancedMesh, birleşik geometri, gölge yalnız 1 güneş/ay ışığı.

## 3. Ortak nesne `G` (oyun.js oluşturur)
```js
G = {
  THREE, sahne, kamera, renderer, composer,   // composer: EffectComposer (bloom dahil)
  saat, t,              // t: toplam saniye
  test,                 // ?test=1 ise true
  durum: 'menu'|'oyun'|'duraklat',
  olay: { on(ad, fn), emit(ad, veri) },   // basit olay yolu
  // modüller kendini buraya koyar:
  girdi, sehir, kahraman, oyuncu, dusman, gorev, ses, arayuz
}
```
Her modül şunu export eder:
```js
export function kur(G) {}          // bir kez; G.<ad> = { ...api } atar
export function guncelle(G, dt) {} // her kare (dt saniye, en çok 0.05)
```
Sıra (oyun.js): kur → girdi, sehir, kahraman, oyuncu, dusman, gorev, ses, arayuz.
guncelle → girdi, oyuncu, kahraman, sehir, dusman, gorev, ses, arayuz, sonra render.
`G.durum !== 'oyun'` iken oyuncu/dusman/gorev guncelle'si erken dönsün (arayuz, ses, sehir dönebilir).
Bir modül eksikse oyun.js onu atlar; **her modül diğerlerinin yokluğunda çökmemeli**
(`G.sehir?.carpis` gibi isteğe bağlı çağrı, yoksa düz zemin y=0 varsay).

Koordinat: y yukarı, 1 birim = 1 metre. Zifir boyu ≈ 1.9 m. Şehir merkezi (0,0,0).

## 4. Modül API'leri

### girdi.js  (sahip: HAREKET ajanı)
```js
G.girdi = {
  basili(kod),        // KeyboardEvent.code, ör 'KeyW','Space','ShiftLeft'; 'Fare0' sol tık, 'Fare2' sağ tık
  yeniBasildi(kod),   // bu karede basıldı mı (bir kare true)
  birakildi(kod),
  fareDX, fareDY,     // bu karedeki fare hareketi (pointer lock)
  eksen: {x, y},      // WASD/oyun kolu sol çubuk, -1..1 (y ileri +)
  kilitle()           // pointer lock iste (canvas tıklamasında otomatik)
}
```
Tuşlar: WASD yürü · Fare bak · Space zıpla (havada 2. zıplama) · **Sol tık BASILI = dokunaçla
sallan, bırak = fırla** · **Sağ tık = çekil (zip: hedef noktaya hızla uç)** · Shift = koş/duvara
tırman · F = jöle yumruğu · E = dokunaç kamçısı (yakındaki robotu çek) · Q = **DEV ZİFİR**
(güç barı dolunca 12 sn büyür, güçlenir) · Esc = duraklat · M = ses aç/kapa.

### sehir.js  (sahip: ŞEHİR ajanı)
```js
G.sehir = {
  boyut,                      // şehir yarı genişliği (≈ 400 m; 800x800 alan)
  binalar: [ {x, z, gx, gz, h, kutu: THREE.Box3} ],  // gx,gz: taban genişlik; kutu dünya AABB
  zeminY(x, z),               // o noktadaki en üst yürünebilir yüzey yüksekliği (çatı veya 0)
  carpis(konum: Vector3, yaricap) -> { duzeltme: Vector3, normal: Vector3|null, duvar: bool },
                              // kapsül/küre vs bina AABB; konumu dışarı iter
  ankrajBul(baslangic: Vector3, yon: Vector3, maxMesafe) -> { nokta: Vector3, normal: Vector3 } | null,
                              // dokunaç için ışın: bina yüzü, sokak lambası, köprü; yoksa null
  rastgeleCati() -> Vector3,  // bir çatı üstü nokta (görev/kedi/doğma için)
  sokakNoktasi() -> Vector3,  // yol üstü rastgele nokta
  yollar: [ {x1,z1,x2,z2} ],  // araç/robot rotası için
  gokyuzuRengi                // THREE.Color (arayuz/ses kullanmaz, sis için)
}
```
Görünüm: gece, ızgara sokaklar, 150–300 bina (InstancedMesh + pencere ışıkları shader/doku ile;
neon tabelalar ÖZGÜN uydurma yazılar, örn "ÇAY 24", "ROBOTAMİR", "KUMRU"), farklı yükseklik
(10–160 m), birkaç dev kule, su kanalı + köprü, park, sokak lambaları, yolda giden basit araç
ışıkları (InstancedMesh), yıldızlı gök + ay, sis (FogExp2), çatılarda su tankı/anten/klima detayı.
Işık: hemisphere + ay ışığı (gölgeli, oyuncuyu takip eden gölge kamerası) + neon emissive (bloom yapsın).

### kahraman.js  (sahip: KAHRAMAN ajanı)
```js
G.kahraman = {
  grup: THREE.Group,           // sahneye eklenmiş; oyuncu.js bunun position/quaternion'ını yönetir
  ayarla({ durum, hiz: Vector3, yerde, dev, dt }),
     // durum: 'dur'|'yuru'|'kos'|'zipla'|'dus'|'sallan'|'duvar'|'zip'|'yumruk'|'kamci'|'hasar'|'dogus'
  dokunac(ad, baslangicDunya: Vector3|null, bitisDunya: Vector3|null),
     // ad 'sol'|'sag'|'kamci'; null = gizle. Kalın, hafif dalgalı, parlak kara tüp (TubeGeometry
     // her kare yeniden değil: sabit segmentli eğri, noktaları güncelle) + ucunda yapışma sıçraması
  elNoktasi(taraf) -> Vector3, // 'sol'|'sag' el dünya konumu (dokunaç buradan çıkar)
  devOl(acik: bool)            // Dev Zifir: 1.6x büyür, turkuaz damarlar parlar
}
```
Görünüm: Prosedürel, eklemli (gövde, baş, kollar, bacaklar ayrı mesh), MeshPhysicalMaterial
siyah, clearcoat 1, düşük roughness, hafif mor iridescence; yüzeyde vertex shader ile yavaş
akan dalgalanma; büyük beyaz damla gözler (emissive hafif); göğüste Yürek Taşı (emissive mor-turkuaz,
nabız atar); sırtta 4 dokunaç sürekli kıvrılır. Animasyonlar prosedürel (sin tabanlı yürüme,
sallanmada süper kahraman pozu, düşerken kollar açık, duvarda dört ayak tırmanma).
Hareket izi: hızlıyken arkasında kısa mor parıltılı iz (trail).

### oyuncu.js  (sahip: HAREKET ajanı) — OYUNUN KALBİ, "his" burada
```js
G.oyuncu = {
  konum: Vector3, hiz: Vector3, yerde, durum,  // durum yukarıdaki listeden
  can, canMax: 100, guc, gucMax: 100,          // guc: robot yendikçe dolar → Q Dev Zifir
  hasarAl(miktar, kaynakKonum), gucEkle(m), isinla(Vector3)
}
```
- Kamera da burada: üçüncü şahıs, omuz üstü, fareyle yörünge; hız arttıkça FOV 70→88 ve kamera
  geri çekilir; binaya girmesin (G.sehir.ankrajBul ile kamera çarpışması); yumuşak takip.
- Sallanma: sol tık basılınca kamera yönünde + hafif yukarı ışın → G.sehir.ankrajBul (yoksa
  "otomatik yardım": bakılan yön çevresinde koni içinde en yakın uygun bina köşesini bul — çocuk
  için sallanma HER ZAMAN kolay tutmalı). Halat kısıtı (pozisyon tabanlı, Verlet benzeri), yerçekimi
  −25, alt noktada hız artışı, bırakınca momentum + küçük yukarı itki. Yere çok yakınsa halat kısalır.
- Duvar: binaya çarpınca Shift basılıysa (veya havada hız ile çarpınca otomatik) duvara yapış,
  WASD ile tırman, çatı kenarında otomatik çık, Space ile duvardan sekip zıpla.
- Zip (sağ tık): hedef noktaya 0.4 sn'de uçar, varınca hafif zıplama.
- Düşme hasarı YOK. Can 0 → `G.olay.emit('yenildi')`, 2 sn sonra rastgeleCati'de 'dogus'.
- Olaylar: emit('sallanBasla'), ('sallanBit'), ('zipla'), ('zip'), ('yere'), ('yumruk', {konum, yon, guc}),
  ('kamci', {konum, yon}), ('devBasla'), ('devBit'), ('hasar', {miktar}), ('yenildi'), ('dogdu').

### dusman.js + gorev.js  (sahip: OYUN-DÜNYASI ajanı)
```js
G.dusman = { liste: [ {konum, can, tur:'robot'|'dron'|'kamyonet', canli} ], enYakin(konum, r) }
G.gorev  = { aktif: {ad, aciklama, ilerleme, hedef, isaret: Vector3|null}, puan, toplamKure }
```
- dusman: Pas Robotları (paslı turuncu, tek büyük göz, sevimli), Vızvız dronlar (pervaneli,
  çatı arası uçar, yumuşak enerji topu atar), hırsız kamyonet (yollarda gider). 'yumruk'/'kamci'
  olayına göre hasar; yenilince parça saçılması (InstancedMesh fizik parçacıkları), emit('robotYenildi').
  Aynı anda en çok ~25 aktif düşman; oyuncuya yakın yerlerde doğar.
- gorev: zincir halinde sonsuz görev (Küre topla 5 → Kedi kurtar → Robot çetesini dağıt → Halka
  yarışı → Kamyonet kovala → Patron: DEV PAS ROBOT çatıda, zayıf noktası sırtındaki pil).
  Dünyada parlayan hedef işareti (ışık sütunu), ödül: puan + güç. emit('gorevBasla'|'gorevBitti', {ad}).
  Işık Küreleri: şehirde 60 tane, toplanan sayısı kalıcı (localStorage 'zifir_kayit', try/catch).

### ses.js + arayuz.js  (sahip: ARAYÜZ-SES ajanı)
```js
G.ses = { cal(ad, {konum, siddet}), muzik(acik), sessiz(bool) }
G.arayuz = { mesaj(metin, sure), }
```
- ses: WebAudio prosedürel: dokunaç "şlap", rüzgâr (hızla artan gürültü), yumruk "pof",
  robot "bzzt", küre "çiling", görev fanfarı, Dev Zifir gümbürtü; basit sentezlenmiş gece-synthwave
  arka plan müziği (döngü, kısık). Olayları G.olay.on ile dinler. Kullanıcı tıklamadan AudioContext başlatma.
- arayuz: DOM katmanı (index.html'de `#arayuz` div). Menü: büyük "ZİFİR" logosu (CSS, parlak
  mor-turkuaz), "OYNA" düğmesi, kontrol kartı (simgeli kısa). HUD: can barı (jöle damlası), güç barı
  (dolunca "Q — DEV ZİFİR!" yanıp söner), görev kartı sağ üst, hedef yön oku ekranda (isaret'e),
  küre sayacı, nişan noktası (ankraj bulunursa turkuaz parlar → G.oyuncu.nisanVar okunur),
  mesaj balonları, duraklat menüsü. Font: sistem fontu, kalın; Türkçe karakterler.
  Menü OYNA → `G.durum='oyun'`, `G.girdi.kilitle()`, `G.ses.muzik(true)`.

## 5. Kurallar
- Kod içinde Türkçe adlandırma tercih edilir (zorunlu değil). Yorum kısa.
- Kişisel bilgi (çocuk adı dışında yaş vb.) hiçbir dosyaya yazılmaz.
- Her ajan bitirince başsız testle `HATA 0` doğrular, bir ekran görüntüsü alır, raporunu
  `RAPOR/<modul>.md`ye (ne yapıldı / ne doğrulanmadı / sözleşme istekleri) yazar.
- Yedek/kopya dosya bırakma (`*.bak`, `*_eski.js` yok). Geçici dosyalar /tmp'de.
