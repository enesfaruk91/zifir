# ZİFİR Otomatik Test Raporu

- Tarih: 2026-11-05 14:28:29
- URL: `http://127.0.0.1:8765/?test=1`
- Ortam: başsız Chrome (`--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader`)
- Chrome: `/usr/bin/google-chrome`
- Süre: 73.2 sn
- Çalıştırma: otomatik yeniden deneme sarmalayıcısı içinde (yalnız altyapı hatasında tekrar)
- Betik: `test/test_oyun.py` (oyun kodu değiştirilmedi)

## Sonuçlar

1. **GEÇTİ** — 8 modül yüklü ve hata listesi boş
   - Ayrıntı: 8/8 modül yüklü
   - İlgili modül: oyun.js + tüm modüller
2. **GEÇTİ** — 10 sn boyunca konum NaN değil ve y > -5
   - Ayrıntı: 883 örnek / 10.0 sn; NaN=0; y min=0, max=31.30842022675739; y<=-5 örnek=0
   - İlgili modül: oyuncu.js
3. **GEÇTİ** — Test demosunda sallanma en az bir kez gerçekleşti
   - Ayrıntı: 'sallan'/'cek' durumu 285/883 örnekte görüldü (G.t'ye göre 10.0 oyun-sn); oyuncu toplam sallanma sayacı=3
   - İlgili modül: girdi.js (test demosu) + oyuncu.js (sallanma)
4. **GEÇTİ** — ankrajBul yukarı-ileri ışında nokta buluyor; carpis iç noktayı dışarı itiyor
   - Ayrıntı: ankraj=bulundu (1 bina denemesi); carpis itme=9.050 m, dışarı=True, normal={'x': -1, 'y': 0, 'z': 0}, duvar=True
   - İlgili modül: sehir.js
5. **GEÇTİ** — yumruk olayı robot canını düşürüyor / robot sayısını azaltıyor
   - Ayrıntı: dron can 40→15, canlı True→True, aktif 3→3
   - İlgili modül: dusman.js
6. **GEÇTİ** — isinla(küre konumu) görev/küre sayısını artırıyor
   - Ayrıntı: küre 0→1, görev ilerlemesi 0→1 (Işık Kürelerini Topla); konum={'x': -197.44264221191406, 'y': 21.78092432978166, 'z': -362.8052062988281}
   - İlgili modül: gorev.js + oyuncu.js.isinla
7. **GEÇTİ** — hasarAl(1000) sonrası 4 sn içinde can dolu ve konum geçerli
   - Ayrıntı: 'yenildi' alındı (1 çağrı); 2.2 sn sonra can=100/100, konum={'x': -83.38129824939112, 'y': 31.671116473725252, 'z': -298.6212861392149}, geçerli=True
   - İlgili modül: oyuncu.js
8. **GEÇTİ** — Ortalama kare süresi ölçüldü (yalnız bilgi)
   - Ayrıntı: ortalama 213.33 ms/kare (~4.7 fps), 15 kare / 3200 ms; composer 480x270, çizim tamponu 240x135, bloom/gölge kapalı — swiftshader yazılım render, bilgi amaçlı. Mantık testleri: 21.4 fps (render kapalı).
   - İlgili modül: oyun.js render döngüsü
10. **GEÇTİ** — 30 binaya yerden 15 m/s koşuda oyuncu hiçbir bina kutusunun içine girmiyor
   - Ayrıntı: 30 bina × 2 sn yerden 15 m/s koşu = 3600 örnek; bina içinde ayak/bel/baş noktası=0
   - İlgili modül: oyuncu.js + sehir.js
11. **GEÇTİ** — Sallanma demosunda 10 sn boyunca bina içinde değil (simülasyon + canlı demo)
   - Ayrıntı: 6 çatı denemesi × 10 sn (sallan+zıpla+E) = 3600 örnek; bina içi=0, sallan/cek örneği=709, max hız=472; canlı demo 10 oyun-sn bina içi örnek=0
   - İlgili modül: oyuncu.js + sehir.js
12. **GEÇTİ** — Görsel bina instance matrisleri fizik kutularıyla uyuşuyor
   - Ayrıntı: görsel instance=657, binalar[].kutu=311; kutusu eşleşmeyen=0, fizik katı olmayan görsel nokta=0
   - İlgili modül: sehir.js
13. **GEÇTİ** — Sağ tık basılı yerden yüksek çatıya çekiyor ve nişan yüksek hedefi gösteriyor
   - Ayrıntı: 6 yerden denemede çatıya inen=6, 'cek' durumu görülen=6, nişan yüksek hedefte=6, en geç iniş=4.0 sn; [bina_h, iniş_kare]=[[66, 218], [62, 218], [78, 243], [45, 174], [45, 178], [51, 190]]
   - İlgili modül: oyuncu.js
9. **GEÇTİ** — Konsolda Uncaught / THREE.WebGLProgram / shader hatası yok
   - Ayrıntı: konsolda 'Uncaught' / 'THREE.WebGLProgram' / 'shader' satırı yok
   - İlgili modül: shader ise sehir/kahraman/arayuz; Uncaught ise ilgili modül

## Özet

**TOPLAM 13/13**

## Notlar

- Test 8 (kare süresi) 240x135 çizim tamponunda (composer 480x270), bloom ve gölge kapalı olarak ölçülür; swiftshader yazılım render'ı gerçek GPU performansını yansıtmaz.
- swiftshader 1280x720'de çok yavaş kaldığından (geliştirme sırasında 0.2-0.8 fps ölçüldü; oyun saati dt=0.05 sınırıyla ilerler) yalnız çizim yükü azaltıldı: composer 480x270 / 240x135 tampon, bloom ve gölge kapalı; gerekirse render çağrısı durduruldu. Oyun kodu/dosyaları değiştirilmedi, fizik ve görev mantığı aynı `guncelle` döngüsüyle çalıştı.
- Test demosu `girdi.js` içinde `?test=1` sırasında ilk 6 saniye çalışır.
- Konsol taraması sayfa `console.error/warn`, `window.__ZIFIR_HATALAR`, CDP istisnaları ve Chrome stderr üzerinden yapıldı.
- Oyun kodu düzeltilmedi; raporlama yapıldı.
