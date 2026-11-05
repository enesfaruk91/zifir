# dusman.js + gorev.js raporu

## Yapıldı
- dusman.js: Pas Robotu (yalpalar, yumruk sallar hasar 5), Vızvız dron (çevresinde döner, yavaş turuncu top hasar 8), hırsız kamyonet (G.sehir.yollar boyunca, yumrukla durur), DEV PAS ROBOT (G.dusman.dev(konum); yalnız sırttan vurulunca hasar, yoksa "Sırtındaki pili vur" mesajı).
- 'yumruk' (3 m koni; Dev: 6 m alan), 'kamci' (en yakını çeker + sersemletir). Yenilince InstancedMesh cıvata/yay + kıvılcım, emit('robotYenildi',{konum,tur,dev}), gucEkle(15; patron 50).
- Üst sınır 25 aktif; 40-120 m doğma; 200 m ötesi geri dönüşüm. API: liste, enYakin, olustur(tur,konum), dev(konum), kaldir(e), kivilcim, robotHedef/dronHedef/dogmaCarpani.
- gorev.js: 6 görevlik sonsuz zincir (zorluk 'tur' artar), 60 Işık Küresi (InstancedMesh+hale), kedi, 8 neon halka (süre dolarsa yeniden), ışık sütunu (aktif.isaret), kayıt 'zifir_kayit' (toplamKure, puan, zincir, tur).
- Eksik modüle dayanıklı: G.sehir yoksa düz zemin/rastgele noktalar, yedek hemisfer ışık.

## Doğrulanan
- ?test=1: HATA 0, [DUSMAN] aktif 7, [GOREV] aktif ..., test yumruğuyla robot yenildi.
- Ekran görüntüsü: küreler, HUD oku ve sütun görünüyor; robot/kamyonet/dron ayrı sahnede incelendi (sevimli, okunur).

## Doğrulanmadı
- Gerçek şehirle (sehir.js henüz yoktu): carpis/zeminY/yollar/rastgeleCati etkileşimi, çatıda kedi konumu, robotların duvara takılması.
- Halka, kamyonet, patron görevlerinin baştan sona oynanışı; dron topu isabeti; kamçı çekişi; Dev Zifir menzili gerçek oyuncuyla.
- Performans (25 düşman x ~8 mesh çizim çağrısı); gerçek kahramanla ışık/görünürlük.
- Küre konumları her açılışta yeniden rastgele; yalnız sayı/puan kalıcı.

## Sözleşme istekleri
- ses.js: 'robotYenildi' olayında "bzzt" çalsın (dusman.js ses çağırmıyor); 'kureAlindi' "çiling", 'halkaGecildi' {no} yeni olay.
- sehir.js: carpis(konum, r) boş/yoksa null dönebilir; zeminY hızlı olmalı (robot başına her kare çağrılır).
- oyuncu.js: 'yumruk' olayındaki konum, oyuncunun gövde civarı olmalı; hasarAl(miktar, kaynakKonum) bekleniyor.
- arayuz.js: aktif.ilerleme/hedef patronda can (0-100) olarak gelir; isaret Vector3 yerinde güncellenir.
