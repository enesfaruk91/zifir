# ARAYÜZ PRO raporu (js/arayuz.js, js/gorev.js)

## Yapıldı
- Ana menü: menu_arka.jpg Ken Burns + fare paralaksı, logo.png giriş animasyonu, OYNA/AYARLAR/KONTROLLER/YAPIMCILAR, W/S/Enter/A/D/Esc + fare, kayan vurgu çubuğu, seçim sesi.
- Ayarlar: hassasiyet, Y ters, ana/müzik/efekt ses, kalite, FOV, Eğitimi tekrarla. `G.ayar` (localStorage `zifir_ayar`) arayuz.kur içinde oluşturulur.
- Duraklat: aynı tasarım dili (Devam, Ayarlar, Kontroller, Ana Menü). Kontroller güncel tuşlarla.
- HUD: segmentli can, güç (Dev hazır parlaması), pusula (K/D/G/B + görev işareti), mini harita (0.1 sn, dönen, bina/düşman/görev), kombo (HARİKA/SÜPER/ZİFİRİ, 3 sn), isabet/bitirici işareti, hasar yönü oku, ödül yazıları (konus, mukemmelBirakis, kacis, halkaGecildi, bitirici), YENİ GÖREV bandı, GÖREV TAMAMLANDI tam ekran bant + puan sayacı.
- gorev.js: 5 adımlı EĞİTİM zinciri (kayıt `egitimBitti`), ipucu kartı (`ipucu`/`ipucuTamam`/`ipucuKapat` olayları, `G.gorev.ipucu`), `G.gorev.egitimiTekrarla()`, `gorevBitti {ad, odul, puan}`, `G.efekt?.yavasCekim(0.4,0.8)`.
- ?test=1 iken eğitim ATLANIR (test_oyun.py küre görevine bağlı); açmak için `?test=1&egitim=1`.

## SÖZLEŞME İSTEKLERİ (oyuncu.js / ses.js okumalı)
- oyuncu.js: `G.ayar.hassasiyet` (fare çarpanı, 0.3-2.5), `G.ayar.yTers` (bool, pitch yönü), `G.ayar.fov` (taban FOV, varsayılan 70; şimdi 70+18*oran sabit). Şu an HİÇBİRİ okunmuyor, ayar kaydediliyor ama etkisiz.
- ses.js: `G.ses.seviye(ana, muzik, efekt)` (0..1) çağrılıyor, yoksa atlanır. Menü sesi için `SES.arayuz_sec` ekleyin ve `G.ses.arayuzSes = true` yapın (yoksa arayüz kendi küçük bip sesini çalar).
- oyuncu.js: `hasar` olayına `{kaynakKonum: Vector3}` eklenirse yön oku çıkar. `kombo {sayi}` olayını emit etmeli.
- oyun.js: `G.gercekDt` ve `G.efekt.hizBulanikligi` varsa kullanılır (hız çizgilerim o zaman kapanır).

## Doğrulama
- ?test=1 HATA 0 (arayuz+gorev ile); sonradan sehir.js'ten gelen "proKur is not defined" başka ajanın yarım işi.
- test_oyun.py: 14/16; KALAN 15 (duvar çatıya çıkış) ve 16 (mükemmel bırakış) oyuncu.js alanı.
- Ekran görüntüleri bakıldı: menü, ayarlar, kontroller, duraklat, HUD, kombo/hasar/tamam bandı.

## Doğrulanmadı
- Gerçek fare/klavye menü gezinmesi (yalnız başsız görüntü), sürükle-slider, ses bipi, pointer lock sonrası Esc-devam, eğitim adımlarının tam oynanışı (adım geçişleri kodla yazıldı, oyunda koşulmadı), yavaş çekim etkisi, 'Ana Menü'den OYNA ile geri dönüş.
