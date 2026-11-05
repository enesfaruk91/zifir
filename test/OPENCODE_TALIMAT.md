# OPENCODE GÖREVİ — ZİFİR otomatik test botu (YALNIZ test/ klasörü)

Önce ../SOZLESME.md oku. js/ ve index.html'e DOKUNMA (yalnız okuyabilirsin). Yalnız `test/` içine yaz.

Yaz: `test/test_oyun.py` — python3 betiği; başsız Chrome'u (google-chrome --headless=new
--use-angle=swiftshader --enable-unsafe-swiftshader --remote-debugging-port=9333) başlatır,
localhost:8765'teki oyunu `?test=1` ile açar (sunucu yoksa `python3 -m http.server 8765
--bind 127.0.0.1` başlatır), Chrome DevTools Protocol üzerinden (websocket; `websocket-client`
yoksa python stdlib ile minimal websocket istemcisi yaz, pip kurma) `Runtime.evaluate` ile
window.G'yi sorgular ve şu kontrolleri yapar, her biri GEÇTİ/KALDI yazar, sonda "TOPLAM g/k":
1. 8 modül yüklü (G.girdi..G.arayuz tanımlı), window.__ZIFIR_HATALAR boş.
2. G.oyuncu.konum 10 sn boyunca hiç NaN değil, y > -5 (şehirden düşmüyor).
3. Sallanma: test demosu sırasında G.oyuncu.durum en az bir kez 'sallan' oldu (100 ms'de bir örnekle).
4. G.sehir.ankrajBul yukarı-ileri ışınla en az bir nokta buluyor; G.sehir.carpis bina içine
   konan noktayı dışarı itiyor.
5. G.olay.emit('yumruk', {konum: robot konumu, yon, guc:3}) → robot sayısı azalıyor ya da can düşüyor.
6. G.oyuncu.isinla(küre konumu) → G.gorev ilerlemesi/küre sayısı artıyor.
7. G.oyuncu.hasarAl(1000) → 'yenildi' sonra 4 sn içinde can dolu ve konum geçerli (yeniden doğuş).
8. Ortalama kare süresi (requestAnimationFrame ile 3 sn ölç) — yalnız bilgi, swiftshader yavaştır.
9. Konsolda "Uncaught", "THREE.WebGLProgram", "shader" hata satırı yok.
Sonra betiği çalıştır, çıktıyı `RAPOR/test_bot.md`ye yaz (KALDI olanlar için olası neden, hangi
modül). Oyun kodunu DÜZELTME; yalnız raporla.
