# Harita üzerinde görev / düşman / araç (3. aşama)

Dosyalar: js/gorev.js, js/dusman.js, js/arayuz.js (mini harita), js/harita.js (yalnız `trafikGuncelle` araç hareketi), test/test_harita_gorev.py (yeni).

## Yapılanlar
1. Görev yerleşimi (`G.harita.veri` + `G.sehir` API, gerçek OSM adları):
   - Işık küreleri (60): %36 parklarda (alan >1500 m² park çokgenleri, binadan >=3 m açıklıkta), %40 çatılarda (çatı kenarından >=2 m içeride), %24 sokak üstünde havada (zemin+8..13 m, 22 m içinde >=2 m yüksek bina = ağ tutunma yeri). En uzak nokta örneklemesiyle haritaya yayılır (240 küre örneğinde 30 farklı 200 m hücre; en yakın iki küre arası >=43 m). Hepsi bina hacminin dışında, sınırdan >=20 m içeride, `carpis` temiz. Görev metni park adlarını söyler ("Mareşal Fevzi Çakmak Parkı, Tuncay Altıntaş Parkı dahil").
   - Kedi: 12-27 m yüksekliğinde, >=120 m² bir binanın çatısında, sokağa bakan uzun kenarın ortasında, kenardan 1,3 m içeride (balkon/çatı kenarı hizası); oyuncudan 70-600 m, adlı yola yakın bina tercih edilir. Metin: "Dizgi Sokak üstündeki bir apartmanın çatısında...".
   - Halkalar: yol grafiğinde (`yolAgi`) ana cadde (secondary/tertiary) öncelikli, düz giden bir rota boyunca 44 m aralıkla 8 halka, sokaktan 12-21 m yukarıda, halka düzlemi gidiş yönüne dik. Her halka için: 16 noktalı çember bina içinden geçmez, zeminden >=2,5 m, 24 m içinde ağ atılabilecek yüksek bina. Uygun yer yoksa halka atlanır/rota değişir. Metin: "Atış Caddesi boyunca uzanan neon halkalardan sırayla geç!". (Eski prosedürel şehir için eski rastgele kod yedekte.)
   - Kamyonet: artık `yolAgi` düğümleri üzerinde (aşağıda), metin yol adını söyler.
   - Patron: adlı parkların içinde binalardan en uzak nokta (tarama 5 m ızgara): Mehmet Ali Altun Parkı, bina boşluğu 62 m. Metin park adını söyler.
2. Düşmanlar (js/dusman.js):
   - Robot devriyesi: oyuncu >70 m uzaktaysa ve robot vurulmadıysa `rastgeleSokakNoktasi` noktaları arasında 0,55 hızla dolaşır; yakınlaşınca/vurulunca (8 sn) kovalar.
   - Duvar kayması: `carpis` itme normalinden teğet yön seçilir (0,5 sn, kararsızsa önceki yön korunur). Bina içine girme: 150 sn koşuda 0 kare.
   - Dron: doğuş çatı noktalarında (`rastgeleCati`), oyuncu >75 m uzaktaysa çatısı üstünde devriye; yükseklik, gidiş yönünde 3/7/12 m ve 4 m çevre örneklerinin en yükseğine göre ayarlanır (bina/çatıdan geçmez).
   - Robot ve kamyonet `carpis` ile çokgen binalardan itilir (kamyonet eskiden bina görmüyordu).
3. Kamyonet (js/dusman.js): `G.sehir.yolAgi` düğümlerinde gider; kavşakta düz + ana yol + oyuncudan uzaklaşma tercihi, sağ şerit, harita sınırı dışına çıkan komşu elenir (egim=1 testinde yolun harita dışına taşan kısmında duvara yapıştığı görüldü, düzeltildi). Dönüşte yaw 2,4 rad/sn, hız düşer. Başlangıç oyuncudan ~90 m.
4. Araçlar (js/harita.js, yalnız trafikGuncelle): (a) öndeki araç mesafe kuralı: aynı yönde 12 m içinde öndeki araca göre hedef hız (8 m'de serbest, 2,5 m'de dur); (b) kesişen yönde yol hakkı küçük numaralı araçta (kilitlenme yok), karşı şerit yok sayılır; (c) 5 sn bekleyen araç 2,5 sn zorla geçer; (d) konum sağ şeritte hedefe yumuşak yaklaşır (dönüşte şerit atlaması yok); (e) egim=1'de burun eğimi (pitch) araziyi izler.
5. Eğim (?egim=1): robot/kamyonet `zeminY`'yi izler (kamyonet burun eğimi eklendi), araç y=arazi. Varsayılan hâlâ kapalı.
6. Mini harita (js/arayuz.js): park/çimen/orman dolgusu, yol grafiği (ana yollar daha açık), bina çokgenleri, kırmızı düşman noktaları, altın görev hedef noktaları (`G.gorev.hedefler()`: kalan küreler, kalan halkalar, kedi, kamyonet/patron/en yakın düşman), kenar oku. Kuzey "K" harfi 90 derece kayıktı (yön kuzey yerine doğuya bakıyordu), düzeltildi. Bina çokgenleri ve yönlendirme (oyuncunun baktığı yön yukarı) kodu doğru bulundu.

## Ölçümler (test/test_harita_gorev.py, 64/64; varsayılan + ?egim=1, GPU'dan bağımsız adımlanan oyun mantığı, dt=1/30)
- Kürelerde bina içi 0/240, sınır dışı 0, ulaşılamaz 0; kedi 12/12 çatıda, kenara >=0,8 m, bina hacmi dışında; halka 6/6 rota, çember bina içi 0, halkalar arası doğru bina içi 0.
- Takılan robot (7 sn pencerede <1,5 m ilerleyen, oyuncu >8 m): yeni 0/80 (varsayılan), 0/98 (egim); devriye+kayma kapalıyken 2/80 ve 2/57 (kapalı koşuda aynı kodun itme yolu açıktı; ayrım küçük, istatistik zayıf).
- Dron bina hacmi içinde: 0 / 14008 ve 0 / 16983 kare. Robot bina içi 0/17631.
- Kamyonet 5x60 sn: yoldan >3,5 m uzak örnek <=%1, bina içi 0, her koşuda >=300 m, >=6 kavşak; havada/gömülü 0 (iki modda).
- Araç: kare başı sıçrama 0 (en büyük 1,22 m/kare), 3 m içinde aynı/kesişen yönde üst üste binme: 1 örnek (60 sn, 70 araç).
- Zincir botu (6 görev baştan sona, ?test=1 koşulunda kısayollarla): küreler (teleport+toplama), kedi, robotlar (robotYenildi olayı), halkalar (sırayla teleport), kamyonet (gerçek 'yumruk' olayıyla 3 vuruşta), patron (açık alanda doğdu, yenildi işaretlendi) hepsi takılmadan geçti; iki modda da hata listesi boş.
- Mini harita canvas'ı çizildi (piksel sayımı), ekran görüntüsü RAPOR/harita_gorev_mini.png.

## Eğim için öneri
Düşman, kamyonet, araç ve oyuncu eğimde yeri izliyor; havada kalma/gömülme ölçülmedi. Test paketi egim=1'de de geçtiği için **varsayılan açılabilir** (açılmadı). Önce gerçek GPU'da FPS ve elle oynanış bakılmalı.

## Ne doğrulanmadı
- Elle oynanış yok: halkalar arası gerçek ağ sallanışıyla ulaşılabilirlik, kürelerin gerçek sallanmayla erişimi, kedi çatısına çıkış zorluğu ölçülmedi; "ulaşılabilir" tanımı vekil kural (yürünüp zıplanır <=4 m ya da çevrede yeterli yüksek bina).
- Zincirde robot ve patron adımları olay/işaretle geçildi (gerçek dövüş değil); kamyonet yakalanması yumruk olayıyla sentetik.
- Kamyonet kovalamacasında oyuncunun hızıyla yakalanabilirliği sınanmadı (kamyonet 13-16 m/s).
- Araç-araç çakışması "3 m içinde" ölçütüyle, tek koşuda; trafik ışığı yok; oyuncu ile araç çarpışması yok (eski durum).
- Takılma oranı karşılaştırması istatistiksel olarak zayıf; L biçimli/avlulu binalarda özel senaryo yok.
- Mini harita yalnız piksel sayımı + görüntü; görsel beğeni/okunurluk (küçük pencere, mobil) bakılmadı. İsim ekleri Türkçe ek uyumu gözetmeden "X üstündeki", "X boyunca" kalıplarıyla yazıldı.
- OSM adı olmayan yerlerde (adsız kedi binası) metin yalın kalır.
- Gerçek GPU FPS etkisi (kurePlani yenilemede ~20 ms, kediPlani ~100 ms tek seferlik takılma) ölçülmedi.

## Diğer testler (flock ile)
test_oyun 22/23, test_devam geçti, test_mobil 53/53, test_baglam geçti, test_harita_gorev 64/64.
test_oyun KALDI #16 ("görsel bina instance matrisleri fizik kutularıyla uyuşuyor"): görsel geometride `aSd` özniteliği bulunamadı (instance=0); `js/harita.js` satır 29'da `aSd` yalnız `if (this.s)` ile ekleniyor, yani cephe/malzeme işini yapan diğer ajanın değişikliği. Benim dokunduğum yer yalnız `trafikGuncelle`; bu kırılma bana ait değil ama doğrulanmadı (değişikliği geri alıp denemedim, git yasaktı). Görsel ajan testi ya da `aSd` ekleme koşulunu düzeltmeli.
