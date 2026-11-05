# AYDINLATMA (saat dilimleri)
- G.saatDilimi = gunduz | alacakaranlik (varsayilan) | gece; G.saatAyarla(ad) calisma aninda gecis (isik/sis/pozlama ~1 sn yumusak). Ayar: G.ayar.saat (zifir_ayar), test: ?saat=gunduz. Sky.js (Preetham) + PMREM, mod basina bir kez uretilip onbellekte; gece gokyuzu.jpg (backgroundIntensity 0.9).
- Okunurluk: bina rengi min parlaklik + carpan, cati kenari (parapet) ve ust kenar seridi acik, zemin aydinlatildi, grade vinyet/golge karartmasi azaltildi, pozlama 1.0/1.15/1.3 (x Parlaklik 0.7-1.6, oyun.js). Ayarlar panelinde "Saat" ve "Parlaklik" (duraklat menusunden de).
- Ek (arayuz.js): sabit nisan kaldirildi; dusman uzerinde donen kilit, nisanNokta'da turkuaz ag halkasi (ekran disinda cizilmez); kontroller guncellendi; 'sapan' -> "SAPAN!".
- Ekran goruntuleri (catidan sehre): /tmp/claude-1000/-home-enes/558ade4a-93bf-4a1a-a90e-ddd236323a90/scratchpad/isik/gunduz.png, /tmp/claude-1000/-home-enes/558ade4a-93bf-4a1a-a90e-ddd236323a90/scratchpad/isik/alacakaranlik.png, /tmp/claude-1000/-home-enes/558ade4a-93bf-4a1a-a90e-ddd236323a90/scratchpad/isik/gece.png
- Dogrulama: ?test=1 HATA 0; test_oyun.py 22/23 (tek KALDI: #8 performans bilgisi, swiftshader + agir makine yuku). 
- Dogrulanmadi: gercek GPU gorunumu/FPS, nisan kilit isaretinin oyun ici gorseli (ekran goruntusu alinmadi), gunduz/gece goruntuleri son sis ayarindan once alindi.
