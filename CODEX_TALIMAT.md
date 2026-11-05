# CODEX GÖREVİ — ZİFİR: girdi.js + oyuncu.js (sallanma / hareket / kamera)

Önce `SOZLESME.md`'yi baştan sona oku. Sen YALNIZ `js/girdi.js` ve `js/oyuncu.js` yazarsın.
Başka dosyaya (oyun.js, index.html, diğer modüller) dokunma. Diğer modülleri aynı anda başka
ajanlar yazıyor; onlar yokken de kodun çökmemeli (`G.sehir?.ankrajBul`, yoksa düz zemin y=0 ve
test için görünmez sanal binalar: kendi içinde 20 sanal AABB kutu üretip ankraj/çarpışma için kullan,
ama SAHNEYE EKLEME; G.sehir gelince onu kullan).

Hedef: oyunun "hissi". Bir çocuk ilk denemede sallanabilmeli ve "vay" demeli.
- Sallanma (sol tık basılı): kamera yönü + 25° yukarı ışın; bulamazsa yardım konisi (±35°) içinde
  en yakın bina köşesi/üst kenarı. Halat: pozisyon tabanlı kısıt, yerçekimi −25, alt noktada
  ileri hız artışı (pompalama), W ile ileri itki. Bırak = momentum korunur + 4 m/s yukarı.
  Hızlı peşpeşe sallanma zinciri akıcı olsun. Halat uzunluğu 15–60 m. Yere 2 m'den yakınsa kısalt.
  Her karede `G.kahraman?.dokunac('sag', G.kahraman.elNoktasi('sag'), ankraj)`; bitince null.
- Zip (sağ tık): nişan noktasına 0.4 sn ease-out uçuş, varışta küçük zıplama; çatı kenarına
  hedeflenirse üstüne konar.
- Duvar: çarpışma normal'i yataysa ve (Shift veya hava hızı > 8) → 'duvar' durumu; WASD tırman
  (W yukarı), çatı kenarında otomatik çatıya çık, Space duvardan geriye/yukarı sek.
- Yerde: W yürü 7 m/s, Shift koş 14 m/s, Space zıpla 11 m/s, havada 2. zıplama, hava kontrolü.
- F yumruk: emit('yumruk', {konum, yon, guc: dev?3:1}); E kamçı: emit('kamci', ...) ve
  `G.dusman?.enYakin(konum, 25)` varsa ona dokunaç çiz (0.3 sn). Q: guc>=gucMax ise 12 sn Dev
  (`G.kahraman?.devOl(true)`, hız ×1.3, emit devBasla/devBit).
- `G.oyuncu.nisanVar` (bool) ve `G.oyuncu.nisanNokta` her kare güncellensin (arayüz nişanı için).
- Kamera: omuz üstü 3. şahıs, fare yörüngesi (dikey −60°..+75° kısıtlı), hız arttıkça FOV 70→88 ve
  mesafe 6→9 m, yumuşak lerp, binaya girmemek için ışın kısaltma, sallanmada hafif yatma (roll).
- `G.kahraman?.ayarla({durum, hiz, yerde, dev, dt})` her kare; `G.kahraman.grup` position'ını
  oyuncu konumuna (ayak tabanı) ve yönünü hız/kamera yönüne yumuşakça çevir.
- Başlangıç: `G.sehir?.rastgeleCati()` ya da (0, 60, 0) — yüksekten başla ki ilk an sallanılsın.
- `?test=1` iken: 6 sn boyunca otomatik demo — sol tık basılıymış gibi sallan, bırak, tekrar
  (girdi.js içinde test modu sahte girdi üretsin), konsola `[OYUNCU] sallanma N, max hız X` yaz.
- Olay adları SOZLESME §4 oyuncu.js listesindeki gibi.

Test: sunucu zaten 8765'te çalışıyor olabilir (`curl -s localhost:8765` dene; yoksa
`python3 -m http.server 8765 --bind 127.0.0.1 &`). Başsız Chrome komutu SOZLESME §2'de.
`[ZIFIR] HATA 0` görmelisin. Sandbox Chrome'u engellerse en az `node --check` yoksa
`python3 -c` ile sözdizimi kontrolü yapamazsın; o zaman bunu raporda yaz.
Bitince `RAPOR/oyuncu.md`: ne yapıldı / ne doğrulanmadı / sözleşme istekleri.
