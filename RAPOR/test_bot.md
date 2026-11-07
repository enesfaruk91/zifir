# ZİFİR Otomatik Test Raporu

- Tarih: 2026-11-07 14:20:53
- URL: `http://127.0.0.1:8765/?test=1` (ana) ve `http://127.0.0.1:8765/?test=1&egitim=1` (eğitim)
- Chrome DevTools portu: `44663` (socket bind 0 ile otomatik seçildi)
- Ortam: başsız Chrome (`--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader`), her koşuda ayrı geçici `--user-data-dir`
- Chrome: `/usr/bin/google-chrome`
- Süre: 90.3 sn
- Çalıştırma: otomatik yeniden deneme sarmalayıcısı içinde (yalnız altyapı hatasında tekrar)
- Betik: `test/test_oyun.py` (oyun kodu değiştirilmedi)

## Sonuçlar

1. **GEÇTİ** — 8 modül yüklü ve hata listesi boş
   - Ayrıntı: 8/8 modül yüklü
   - İlgili modül: oyun.js + tüm modüller
2. **GEÇTİ** — 10 sn boyunca konum NaN değil ve y > -5
   - Ayrıntı: 545 örnek / 10.0 oyun-sn (oyun-suresi); NaN=0; y min=0, max=76.14242961619377; y<=-5 örnek=0
   - İlgili modül: oyuncu.js
3. **GEÇTİ** — Test demosunda sallanma en az bir kez gerçekleşti
   - Ayrıntı: 'sallan'/'cek' durumu 196/545 örnekte görüldü (G.t'ye göre 10.0 oyun-sn); oyuncu toplam sallanma sayacı=3
   - İlgili modül: girdi.js (test demosu) + oyuncu.js (sallanma)
4. **GEÇTİ** — G.kahraman.grup içinde GLB SkinnedMesh yüklendi (≤15 oyun-sn)
   - Ayrıntı: SkinnedMesh=2 (['Mannequin_1', 'Mannequin_2']), grup çocuk=2; bekleme 0.0 oyun-sn (kosul), duvar 0.0 sn
   - İlgili modül: kahraman.js
5. **GEÇTİ** — G.dusman.liste içinde en az 1 dron ve 1 robot var; mermiler dizi
   - Ayrıntı: robot=2, dron=3, liste dizi=True; G.dusman.mermiler var=True dizi=True, oyuncuMermileri dizi=True; bekleme 0.0 oyun-sn (kosul)
   - İlgili modül: dusman.js
6. **GEÇTİ** — Ses: G.ses.yuklendi / G.ses tanımlı ve 'arayuz_sec' hatasız çalıyor
   - Ayrıntı: G.ses=var, yuklendi=False, 'arayuz_sec' çağrısı=hata yok
   - İlgili modül: ses.js
7. **GEÇTİ** — Arayüz: G.ayar (hassasiyet/yTers/fov) ve kalite 'dusuk'→'orta' hatasız
   - Ayrıntı: G.ayar=var, alanlar={'hassasiyet': True, 'yTers': True, 'fov': True}; kalite orta→dusuk→orta (ara=dusuk, son=orta); hata=None
   - İlgili modül: arayuz.js + oyun.js
8. **GEÇTİ** — Performans bilgisi: 5 oyun-sn ortalama renderer.info çizim çağrısı/üçgen
   - Ayrıntı: ortalama 98 çizim çağrısı/kare, 338464.98039215687 üçgen/kare; 102 kare, 5.0 oyun-sn (oyun-suresi), duvar 12.6 sn; render kapalı=False (bilgi)
   - İlgili modül: oyun.js render döngüsü
9. **GEÇTİ** — Ortalama kare süresi ölçüldü (yalnız bilgi)
   - Ayrıntı: ortalama 115.43 ms/kare (~8.7 fps), 27 kare / 3117 ms; composer 160x90, çizim tamponu 80x45, yalnız RenderPass (bloom/gölge kapalı) — swiftshader yazılım render, bilgi amaçlı. Mantık testleri: 49.3 fps (render kapalı).
   - İlgili modül: oyun.js render döngüsü
10. **GEÇTİ** — ankrajBul yukarı-ileri ışında nokta buluyor; carpis iç noktayı dışarı itiyor
   - Ayrıntı: ankraj=bulundu (1 bina denemesi); carpis itme=9.050 m, dışarı=True, normal={'x': -1, 'y': 0, 'z': 0}, duvar=True
   - İlgili modül: sehir.js
11. **GEÇTİ** — yumruk olayı robot canını düşürüyor / robot sayısını azaltıyor
   - Ayrıntı: robot can 40→15, canlı True→True, aktif 6→6
   - İlgili modül: dusman.js
12. **GEÇTİ** — isinla(küre konumu) görev/küre sayısını artırıyor
   - Ayrıntı: küre 0→1, görev ilerlemesi 0→1 (Işık Kürelerini Topla); 1/60 görünür küre denendi, bekleme 0.1 oyun-sn (toplandi); durum=dus, konum={'x': -138.9274139404297, 'y': 51.5970445541992, 'z': 311.06805419921875}
   - İlgili modül: gorev.js + oyuncu.js.isinla
13. **GEÇTİ** — hasarAl(1000) sonrası 4 oyun-sn içinde can dolu ve konum geçerli
   - Ayrıntı: 'yenildi'=alındı (1 hasarAl(1000) çağrısı); bekleme 2.0 oyun-sn (kosul), duvar 2.1 sn; can=100/100, durum=dogus, konum={'x': -255.01488697963683, 'y': 32.1569103579542, 'z': -314.97663666221064}, geçerli=True
   - İlgili modül: oyuncu.js
14. **GEÇTİ** — 30 binaya yerden 15 m/s koşuda oyuncu hiçbir bina kutusunun içine girmiyor
   - Ayrıntı: 30 bina × 2 sn yerden 15 m/s koşu = 3600 örnek; bina içinde ayak/bel/baş noktası=0
   - İlgili modül: oyuncu.js + sehir.js
15. **GEÇTİ** — Sallanma demosunda 10 sn boyunca bina içinde değil (simülasyon + canlı demo)
   - Ayrıntı: 6 çatı denemesi × 10 sn (sallan+zıpla+E) = 3600 örnek; bina içi=0, sallan/cek örneği=1936, max hız=70; canlı demo 10 oyun-sn bina içi örnek=0
   - İlgili modül: oyuncu.js + sehir.js
16. **GEÇTİ** — Görsel bina instance matrisleri fizik kutularıyla uyuşuyor
   - Ayrıntı: görsel instance=657, binalar[].kutu=311; kutusu eşleşmeyen=0, fizik katı olmayan görsel nokta=0
   - İlgili modül: sehir.js
17. **GEÇTİ** — Yerden sağ tık yüksek ankrajla sallanma başlatıyor; E yüksek çatıya çekiyor ve nişan yüksek hedefi gösteriyor
   - Ayrıntı: 6 yerden denemede sallanma=6, yüksek ankraj=6, zip=6, çatıya inen=6, nişan yüksek hedefte=6, en geç iniş=0.9 sn; durumlar={'sallan': 720}, ankrajlı kare=720, çatı hedefi olmadığı için atlanan bina=2; [bina_h, sallan, yüksekAnkraj, zip, iniş_kare, maxY, sonY, sonDurum, zipKare, secilenNisan]=[[66, True, True, True, 52, 66.8, 66.5, 'yuru', 32, [-202.98068772904577, 62.47881003027317, -84.4756833525521]], [78, True, True, True, 52, 78.2, 77.9, 'yuru', 32, [-104.00500683183782, 73.86998715972226, 29.15]], [45, True, True, True, 53, 45, 44.7, 'yuru', 33, [23.896864182370958, 44.353516227306415, -180.5]], [45, True, True, True, 52, 45.2, 44.9, 'yuru', 32, [29.524122345388992, 40.86328626027496, 237.5]], [51, True, True, True, 52, 51.6, 51.2, 'yuru', 32, [103.55000305175781, 50.40913413723216, -132.29379836686985]], [66, True, True, True, 52, 66.4, 66, 'yuru', 32, [181.08740808814764, 62.01569854477595, 30.766059781252277]]]
   - İlgili modül: oyuncu.js + sehir.js
18. **GEÇTİ** — Sol tık yakında 4 vuruşluk kombo: yumruk komboNo 0-3 ve 'bitirici' olayı
   - Ayrıntı: komboNo=[0, 1, 2, 3], kombo sayacı=[1, 2, 3, 4], bitirici=1; kaçış tehlike bayrağı=True, 'kacis' olayı=1
   - İlgili modül: oyuncu.js
19. **GEÇTİ** — Shift ile duvara koşunca duvarda koşu ve çatıya çıkış ('konus')
   - Ayrıntı: 5 denemede duvar durumu=5, çatıya çıkan=5, 'konus' olayı=5; [bina_h, duvar, çatı, max dikey hız]=[[41, True, True, 14], [39, True, True, 14], [56, True, True, 14], [52, True, True, 14], [45, True, True, 14]]
   - İlgili modül: oyuncu.js
20. **GEÇTİ** — Havada sağ tık ileri-yukarı ankrajla klasik salınım başlatıyor (mükemmel bırakış sayısı bilgi)
   - Ayrıntı: 8 denemede mükemmel bırakış=1, salınım kare sayısı=3072, salınım max hız=38.013715065490466 (zamanlamaya duyarlı)
   - İlgili modül: oyuncu.js
21. **GEÇTİ** — Efekt: G.efekt.sars/yavasCekim/vurusDuraklat/hizBulanikligi/flas hatasız; yavasCekim'de G.zamanOlcek<1
   - Ayrıntı: fonksiyonlar={'sars': True, 'yavasCekim': True, 'vurusDuraklat': True, 'hizBulanikligi': True, 'flas': True}; çağrı hataları=yok; yavasCekim sırasında en düşük G.zamanOlcek=0.02 (59 örnek, 0.8 oyun-sn, oyun-suresi)
   - İlgili modül: oyun.js (G.efekt)
22. **GEÇTİ** — Eğitim: ?test=1&egitim=1 ile G.gorev.aktif.ad eğitim adımı oluyor
   - Ayrıntı: G.gorev.egitimde=True, aktif.ad='EĞİTİM 1/5 · Çatıya Çık', ipucu='Çatıya Çık'; bekleme 0.0 oyun-sn (kosul)
   - İlgili modül: gorev.js
23. **GEÇTİ** — Konsolda Uncaught / SHADER / is not defined hatası yok (tüm koşu)
   - Ayrıntı: tüm koşuda 'Uncaught' / 'SHADER' / 'is not defined' satırı yok (ana sayfa + eğitim sayfası + CDP + Chrome stderr)
   - İlgili modül: shader ise sehir/kahraman/arayuz/oyun; 'is not defined' ise satırdaki modül

## Özet

**TOPLAM 23/23**

## Notlar

- 23 kontrolün tamamı GEÇTİ/KALDI + ayrıntı olarak raporlanır; oyun kodu değiştirilmedi.
- Chrome DevTools portu her koşuda `socket.bind(('127.0.0.1', 0))` ile boş porttan seçilir; `--user-data-dir` her koşuda `tempfile.mkdtemp` ile oluşturulur ve `try/finally` içinde Chrome ile birlikte kapatılıp silinir. Böylece eşzamanlı ajanlar 9333 portunda çakışmaz.
- Zamanlamaya duyarlı beklemeler oyun saati `G.t` üzerinden yapılır (kahraman GLB ≤15, düşman ≤30, küre ≤3, yeniden doğuş ≤4, efekt ≤1, eğitim ≤10 oyun-sn). Oyun saati üst sınırı aşarsa ilgili kontrol KALDI olur; duvar saati yalnız güvenlik sınırıdır.
- Kare süresi kontrolü 80x45 çizim tamponunda (composer 160x90), yalnız temel RenderPass ve gölge kapalı ölçülür; swiftshader yazılım render'ı gerçek GPU performansını yansıtmaz. 5 oyun-sn performans bilgisi `renderer.info.render.calls/triangles` kare ortalamasıdır.
- swiftshader + eşzamanlı ajan yükü altında (geliştirme sırasında 0.2-0.8 fps ölçüldü; oyun saati dt=0.05 sınırıyla ilerler) yalnız çizim yükü azaltıldı: 640x360 pencere, composer 160x90 / 80x45 tampon, yalnız RenderPass, bloom ve gölge kapalı; gerekirse render çağrısı durduruldu. Fizik ve görev mantığı aynı `guncelle` döngüsüyle çalıştı.
- Çekiş kontrolü güncel bakış sözleşmesini kullanır: nişan oyuncunun en az 6 m üstünde olmalıdır; çatı son 5,5 m cephesinde gerçekten görülen önizleme seçilir ve konum/bakış yeniden kurulmadan hemen sonraki kare E basılır. Altı ayrı örnekte gerçek çatıya iniş şartı korunur; seçilen nişan koordinatları ayrıntıya yazılır.
- Test demosu `girdi.js` içinde `?test=1` sırasında ilk 6 saniye çalışır.
- Eğitim kontrolü ana sayfa kontrollerinden sonra `?test=1&egitim=1` adresine gezinir; ana sayfanın konsol kayıtları gezinmeden önce saklanır ve eğitim sayfasınınkilerle birleştirilir.
- Konsol taraması tüm koşu boyunca sayfa `console.error/warn`, `window.__ZIFIR_HATALAR`, CDP istisnaları ve Chrome stderr üzerinden 'Uncaught' / 'SHADER' / 'is not defined' için yapıldı.
- Oyun kodu düzeltilmedi; yalnız sorunlu modül ve ayrıntı raporlandı.
