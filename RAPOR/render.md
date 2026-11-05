# RENDER raporu (js/oyun.js)
- G.efekt: sars (kamera render öncesi ofset+roll, render sonrası geri alınır), yavasCekim (G.zamanOlcek, G.gercekDt; modüllere ölçekli dt), vurusDuraklat (ölçek 0.02), hizBulanikligi (radyal bulanıklık + kenar hız çizgileri, dusuk'ta kapalı), flas.
- Zincir: Render -> GTAO (yalnız yuksek, yarım çöz.) -> Bloom (0.45/0.9, değişmedi) -> hız bulanıklığı (hız>0.02 iken) -> renk derecelendirme (lacivert gölge/sıcak ışık, kontrast+, doygunluk-, vinyet, gren) -> Output -> SMAA (orta/yuksek). renderer antialias kapalı.
- Giriş: oyuna geçişte 2 sn siyahtan açılma + hafif sıcak flaş (test modunda yok).
- Test: ?test=1 HATA 0; test_oyun.py 13/13; test'te pass=5/7 aktif, calls≈183. ?test=1&fx=1 efektleri tetikler.
- Doğrulanmadı: gerçek RX 550 FPS (yalnız swiftshader); GTAO görsel kalitesi; grade doğrusal HDR uzayında (tonemap öncesi) olduğundan ton değerleri gözle ayarlanmalı.
