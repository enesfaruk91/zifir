# OPENCODE GÖREVİ 2 — test botunu sağlamlaştır (YALNIZ test/ klasörü)
SOZLESME.md'yi (özellikle §6) ve RAPOR/test_bot.md'yi oku. js/, assets/, index.html'e DOKUNMA. Yalnız test/ altına yaz. Git komutu kullanma.
Sorunlar: (1) Birden çok ajan aynı anda test koşunca Chrome DevTools portu 9333 çakışıyor → boş bir portu otomatik seç (socket ile bind 0) ve her koşuda ayrı --user-data-dir (tempfile) kullan; bitince Chrome'u ve geçici klasörü kesin kapat/sil (try/finally). (2) Bazı maddeler zamanlamaya duyarlı → beklemeleri oyun saati G.t'ye göre yap (gerçek saniyeye göre değil), en fazla süreyi aşınca KALDI.
Yeni maddeler ekle (mevcutları bozma; her biri GEÇTİ/KALDI + ayrıntı):
- Ses: `G.ses.yuklendi` veya en azından G.ses tanımlı ve 'arayuz_sec' çalınca hata yok.
- Arayüz: G.ayar var (hassasiyet, yTers, fov alanları), G.kaliteAyarla('dusuk') sonra 'orta' hata vermiyor.
- Efekt: G.efekt.sars/yavasCekim/vurusDuraklat/hizBulanikligi/flas fonksiyon ve çağrılınca hata yok; yavasCekim sırasında G.zamanOlcek < 1.
- Eğitim: `?test=1&egitim=1` ile açınca G.gorev.aktif adı eğitim adımı.
- Kahraman: G.kahraman.grup içinde SkinnedMesh var (GLB yüklendi) — 15 sn içinde.
- Düşman: G.dusman.liste'de en az 1 dron ve 1 robot; G.dusman.mermiler dizi (varsa).
- Performans bilgisi: 5 sn ortalama renderer.info.render.calls ve üçgen sayısı (yalnız bilgi).
- Konsol: tüm koşu boyunca "Uncaught", "SHADER", "is not defined" yok.
Betiği `python3 test/test_oyun.py` ile koştur, raporu RAPOR/test_bot.md'ye yaz. Oyun kodunda hata bulursan DÜZELTME, raporda hangi modül olduğunu yaz.
