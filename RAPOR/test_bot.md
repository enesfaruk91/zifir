# ZİFİR Otomatik Test Raporu

- Tarih: 2026-11-05 13:38:47
- URL: `http://127.0.0.1:8765/?test=1`
- Ortam: başsız Chrome (`--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader`)
- Chrome: `/usr/bin/google-chrome`
- Süre: 33.4 sn
- Çalıştırma: otomatik yeniden deneme sarmalayıcısı içinde (yalnız altyapı hatasında tekrar)
- Betik: `test/test_oyun.py` (oyun kodu değiştirilmedi)

## Sonuçlar

1. **GEÇTİ** — 8 modül yüklü ve hata listesi boş
   - Ayrıntı: 8/8 modül yüklü
   - İlgili modül: oyun.js + tüm modüller
2. **GEÇTİ** — 10 sn boyunca konum NaN değil ve y > -5
   - Ayrıntı: 44 örnek / 10.0 sn; NaN=0; y min=15.89363956451416, max=15.89363956451416; y<=-5 örnek=0
   - İlgili modül: oyuncu.js
3. **GEÇTİ** — Test demosunda sallanma en az bir kez gerçekleşti
   - Ayrıntı: 'sallan' durumu 44/44 örnekte görüldü (100 ms aralık)
   - İlgili modül: girdi.js (test demosu) + oyuncu.js (sallanma)
4. **GEÇTİ** — ankrajBul yukarı-ileri ışında nokta buluyor; carpis iç noktayı dışarı itiyor
   - Ayrıntı: ankraj=bulundu (1 bina denemesi); carpis itme=9.050 m, dışarı=True, normal={'x': -1, 'y': 0, 'z': 0}, duvar=True
   - İlgili modül: sehir.js
5. **GEÇTİ** — yumruk olayı robot canını düşürüyor / robot sayısını azaltıyor
   - Ayrıntı: robot can 40→15, canlı True→True, aktif 2→2
   - İlgili modül: dusman.js
6. **GEÇTİ** — isinla(küre konumu) görev/küre sayısını artırıyor
   - Ayrıntı: küre 0→1, görev ilerlemesi 0→1 (Işık Kürelerini Topla); konum={'x': 193.3607911627452, 'y': 62.07876028329899, 'z': 256.8986511230469}
   - İlgili modül: gorev.js + oyuncu.js.isinla
7. **GEÇTİ** — hasarAl(1000) sonrası 4 sn içinde can dolu ve konum geçerli
   - Ayrıntı: 'yenildi' alındı (1 çağrı); 2.4 sn sonra can=100/100, konum={'x': -17.60929794215672, 'y': 64.13556987706765, 'z': -269.6031604472582}, geçerli=True
   - İlgili modül: oyuncu.js
8. **GEÇTİ** — Ortalama kare süresi ölçüldü (yalnız bilgi)
   - Ayrıntı: ortalama 438.87 ms/kare (~2.3 fps), 9 kare / 3950 ms; composer 480x270, çizim tamponu 240x135, bloom/gölge kapalı — swiftshader yazılım render, bilgi amaçlı. Mantık testleri: 15.6 fps (render kapalı).
   - İlgili modül: oyun.js render döngüsü
9. **GEÇTİ** — Konsolda Uncaught / THREE.WebGLProgram / shader hatası yok
   - Ayrıntı: konsolda 'Uncaught' / 'THREE.WebGLProgram' / 'shader' satırı yok
   - İlgili modül: shader ise sehir/kahraman/arayuz; Uncaught ise ilgili modül

## Özet

**TOPLAM 9/9**

## Notlar

- Test 8 (kare süresi) 240x135 çizim tamponunda (composer 480x270), bloom ve gölge kapalı olarak ölçülür; swiftshader yazılım render'ı gerçek GPU performansını yansıtmaz.
- swiftshader 1280x720'de çok yavaş kaldığından (geliştirme sırasında 0.2-0.8 fps ölçüldü; oyun saati dt=0.05 sınırıyla ilerler) yalnız çizim yükü azaltıldı: composer 480x270 / 240x135 tampon, bloom ve gölge kapalı; gerekirse render çağrısı durduruldu. Oyun kodu/dosyaları değiştirilmedi, fizik ve görev mantığı aynı `guncelle` döngüsüyle çalıştı.
- Test demosu `girdi.js` içinde `?test=1` sırasında ilk 6 saniye çalışır.
- Konsol taraması sayfa `console.error/warn`, `window.__ZIFIR_HATALAR`, CDP istisnaları ve Chrome stderr üzerinden yapıldı.
- Oyun kodu düzeltilmedi; raporlama yapıldı.
