# Salınım (sarkaç) + duvar duruşu + nişan kilidi — js/oyuncu.js

Sağ tık: salın; E: çatıya çekil.

## Ne değişti
- Sağ tık HER ZAMAN sarkaç: 'cek' (çekiş/makara) kaldırıldı (cekBasla/cekBitir silindi). Yerden: otomatik sıçrama (9 m/s dikey + 6 m/s ileri) + anında halat.
- Ankraj (salinimHedefBul): hız yönü (yatay hız >=5, yoksa kamera ileri) boyunca 18-35 m ileri, 15-30 m yukarı (sert alt sınır 12), sıradaki el tarafında 20-50°; puan = ileri mesafe + yükseklik + yan açı uyumu. Sıra: sıradaki el, diğer el, tam ileri (sıkı sonra gevşek pencere), en son geniş koni. Hiç yoksa 'bosAg' olayı + elin havaya boş ağ atışı. Ankraj bina yüzünün 1.8 m dışına konur (dip noktada duvara çarpmasın).
- Halat ilk uzunlukta sabit; yalnız alçalırken yere 3 m'den yakınsa 20 m/s hızla kısalır. Yerçekimi -25, esnemesiz konum kısıtı.
- W + aşağı inerken teğet ivme +8 m/s²; hız tavanı 55; ankrajın önünde (ileri açı >70°) OTOMATİK BIRAK + 4 m/s yukarı itki (sonra yeni basış gerekir). Sallanırken duvara yapışma kapalı (salınım kesilmesin).
- E (zip) yalnız ankrajBul hedefine; çatı kenarıysa konuş (mevcut).
- Duvar: kahraman grubu duvara dik (yerel yukarı = duvar normali, ileri = hareket yönü, W = dünya yukarı), ayak duvar yüzeyi+0.05, 0.15 sn'de slerp, çıkışta 0.2 sn'de dikeye dönüş. kahraman.ayarla({durum:'duvar'|'duvarKos', duvarNormal, hiz}); p.durum 'duvar' kalır (test 19).
- Nişan: NDC'de merkeze 0.45 içindeki en iyi puan (NDC mesafe + 0.004*m), 90 m; yapışkan kilit (0.6'ya kadar tutar, başkası %40 daha iyiyse değişir), fare tekerleği sıradaki hedefe geçer, G.oyuncu.nisanAktif (90 m içinde canlı düşman). Sol tık kilitli hedefe 'atis' {hedef, yon}.

## Doğrulama
`?test=1&salinimtest=1` senaryosu (oyuncu.js içinde): 6 bas-bırak, `[SALINIM] el=.. ankrajIleri=.. ankrajYukari=.. ipUzunluk=.. altNoktaYer=.. maxHiz=..` logu. Koşu: ankrajYukari 15-22 (>=12), ankrajIleri 23-33 (>=15), ip sabit (yalnız yerden başlayan 2 salınımda yer kısıtı kısalttı), bina içi örnek 0, maxHiz 30-50. Sokak başlangıç noktası bulunamadı (bas=yok, rastgele doğuş kullanıldı).
## Ne doğrulanmadı
- El sırası: o senaryoda sol,sol,sol,sag,sol çıktı; diğer tarafta uygun bina yoksa aynı el kullanılır (bilerek). Gerçek şehirde elle denenmedi.
- Çatıdayken (çevresi alçak) sağ tık çoğu zaman 'bosAg': 12 m yukarıda bina şart.
- test_oyun.py madde 15 (sallan+Space+E 10 sn bina içi) bu oturumda 12-21 ihlalle kalıyor (son tam koşu 21/23: yalnız 15 ve 17 kaldı); ihlaller hep zip (E) durumunda; sehir.js ve test dosyası başkaları tarafından değişiyor, kök neden doğrulanmadı.
- Madde 17 ('cek' bekliyor) artık E ile olmalı, test güncellenecek.
- Nişan kilidi, tekerlek ve duvar dik duruşu görsel/elle denenmedi.
