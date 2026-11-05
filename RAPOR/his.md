# His (oyuncu.js + girdi.js) — PRO sürüm

## Ne yapıldı
- Sallanma: hızlıyken/havadayken sağ tık = ankraj hız/bakış yönünde ileri-yukarıda en uygun çatı noktası (salinimHedefBul); yerdeki durağan basış eski 'cek'. Halat alt noktası yerden >=4 m olacak şekilde sınırlanır/kısalır; alt noktada teğet hız kazancı; roll (±0.14) ve FOV nefesi (+6); ankraja bakış ofseti. Ardışık sallanmada sol/sağ dokunaç değişir.
- 'mukemmelBirakis': ankrajın önünde, yükselirken, hızlı bırakınca +%12 hız, yavasCekim(0.6,0.25).
- Duvarda koşu: Shift ile duvarda 14 m/s dikey; çatı kenarında otomatik çıkış, 'konus' + sars(0.2). 'cek' olayı eklendi.
- Havada 3. Space = takla ('numara', +25 puan G.gorev.puan varsa). İniş: düşüş>=13 m/s ise yuvarlanma (hasarsız, sars 0.3), değilse kısa sarsıntı; 'yere' {hiz}. Yerde ivmelenme + dönüşte kayma; hava kontrolü 13->20.
- Dövüş: sol tık <=6 m düşmanda 4 vuruşluk kombo ('yumruk' {konum,yon,guc,komboNo}; 4. 'bitirici' x2.5 + vurusDuraklat(0.06) + sars(0.25)), 'kombo' {sayi}, 0.6 sn zincir, 3 sn isabetsizlikte sıfırlanır; >2.4 m ise kısa atılma (lunge). Uzakta eski 'atis'.
- Kaçış: tehdit = G.dusman.mermiler ([{konum|m.position, hiz, aktif}], 'hedef' alanı olanlar oyuncu mermisi sayılıp atlanır) veya robot e.sal<=0.4 sn yakında; G.oyuncu.tehlike=true; Space = yana takla, 0.55 sn hasarsız, 'kacis', yavasCekim(0.35,0.4).
- Kamera: hızlıyken alçak+geride, dövüşte ~1.3 m yakın; G.ayar.hassasiyet / yTers (tersY de kabul) / fov; her kare G.efekt.hizBulanikligi(hız/60). 'hasar' olayına kaynakKonum eklendi.
- girdi.js değişmedi (gerek yoktu).

## Doğrulama
test_oyun.py 14-16 eklendi (kombo+kaçış, duvarda koşu+çatı, mükemmel bırakış). Son koşu: 16/16 GEÇTİ (9. konsol hatasız). Mükemmel bırakış demo testinde 0 kez tetiklendi (zamanlamaya duyarlı; test 16 yalnız salınımın başladığını doğrular).

## Ne doğrulanmadı
- Gerçek fare/GPU ile elle his; salınım ayarları (ankraj mesafesi, kazanç katsayıları) kulakla ayarlanmadı.
- Gerçek dusman.js tehdit verisi: robot 'sal' alanına, mermi listesi sözleşmesine dayanıyor; düşman mermisi (toplar) henüz G.dusman.mermiler'de değil.
- Test 11'deki 395+ m/s maksimum hız E (zip) kaynaklı ölçüm; salınım hız tavanı 62 (mükemmel bırakışta).
- Takla/yuvarlanma animasyonu görsel olarak bakılmadı.
