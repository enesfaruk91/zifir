# Arayüz + Ses raporu

## Yapıldı
- js/ses.js: prosedürel WebAudio (ana kazanç + sıkıştırıcı); ilk tık/tuşta başlar. Efektler: atış+yapışma, rüzgâr (hıza göre), zıpla, zip, yere, yumruk, kamçı, hasar, robot bzzt+tıkırtı, dron vızıltısı (yakınsa), küre çiling (zincirle yükselen perde), görev fanfarı, Dev gümbürtü, doğuş, yenilgi. Müzik: Am-F-C-G, 100 BPM synthwave (bas, arpej, pad, davul), kısık; muzik(acik). M tuşu kendi dinleyicisiyle. Ses uzaklığa göre kısılır (olay verisinde konum varsa).
- js/arayuz.js: CSS enjekte; menü (bulanık arka plan, jöle akışkan logo, OYNA, kontrol kartı), duraklat menüsü (Devam/Ses/Kontroller), can damlası+barı, güç barı ("Q — DEV ZİFİR!" yanıp söner), görev kartı, küre sayacı, nişan, hedef yön oku (+metre, kenara kenetli), hız çizgileri, mesaj kuyruğu G.arayuz.mesaj, hasar vinyeti, "Zifir toparlanıyor..." perdesi, görev başlık animasyonu, +puan uçuşu, Dev rozeti. ?test=1'de menü yok.
- Ek: menüde Enter/Space ile başlama; pencere odağı kaybında duraklat.

## Doğrulanmadı
- Sesin kendisi (başsız testte duyulmaz); AudioContext gerçek Chrome'da denenmedi, yalnız sözdizimi/yükleme hatasız.
- Hedef oku, görev kartı, hız çizgileri, mesaj balonları: gorev/oyuncu modülleri henüz yokken yalnız kod seviyesinde; görsel doğrulama yapılmadı. Menü ve boş HUD ekran görüntüsü alındı, iyi.
- Pointer-lock ile Esc/duraklat akışı gerçek tarayıcıda denenmedi.
- Testte `HATA 1` çıktı: "oyuncu.kur: gorunum is not defined" — oyuncu.js (başka ajan) kaynaklı, benimle ilgisiz.
- Menü arkasındaki sahne bulanıklığı: sahne henüz boş olduğundan görülemedi.

## Sözleşme istekleri
- gorev: olay verisinde `{ad}`; robotYenildi için `{konum, puan}` verilirse uçan puan konumda çıkar; kureAlindi sayacı G.gorev.toplamKure'den okunur.
- oyuncu: `nisanVar` her karede güncellensin; G.durum 'duraklat' iken oyuncu/dusman/gorev dönmeli (arayuz G.durum'u yönetir).
- girdi: Esc'i kendi tarafında yutmasın (arayuz keydown dinler); duraklat iken canvas tıklaması kilitlenirse arayuz oyuna döner.
- G.ses.sessizMi alanı ek olarak var.
