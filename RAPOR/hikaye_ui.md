# HİKÂYE UI raporu (js/arayuz.js, js/gorev.js)

## Yapıldı
- Ara sahne kartları (3.5 sn, Ken Burns, alt bantta başlık+hikâye, tuş/tık ile geçilir, oyun %20 hıza yavaşlar): görev başı (eğitim hariç), ilk zincirde prof_pas.jpg tanıtımı (bir kez, `profGoruldu`), patrondan önce kara_canavar.jpg ipucu (bir kez), zincir bitince bitis.jpg. Robot Çetesi görevi için ayrı görsel yok: prof_pas.jpg kullanıldı.
- Diyalog balonu (sol alt, portre, satır başı 3 sn): görev başı (+8 sn) / yarısı (`gorevYarisi`, hedef>1 görevlerde) / sonu; en az 20 sn aralık, kuyruk en çok 2.
- Başarımlar rozet_1..8: kayıt `zifir_kayit.basarim` + `say` (gorev.js'in kayit nesnesi, `G.gorev.kaydet`); sağ üst kayan bildirim + `arayuz_onay` sesi; ana menüde BAŞARIMLAR paneli (kazanılan renkli, diğer gri + nasıl kazanılır).
- HUD görev kartında ikon (eğitimde ikon_egitim), mini haritada hedef ikonu. Tüm görseller Image ile önyüklenir, eksikse çökmez.
- gorev.js yeni olaylar: `gorevBasla{idx}`, `gorevYarisi`, `gorevBitti{idx}`, `zincirBitti`, `kediKurtarildi`; `aktif.ikon/idx`.
- Test modunda kartlar/diyalog/bildirim KAPALI; `?test=1&hikaye=1` ile açılır.
- EK İŞ nişan: ince beyaz halka (nisanAktif ?? nisanVar), hedefe 0.12 sn lerp ile kayıp kilit köşelerine dönüşür, hedef üstü can barı, kontrollere "Fare tekerleği: hedef değiştir", ankraj halkası yalnız sağ tık basılı değil ve kilit yokken.

## Doğrulanmadı
- Gerçek oyunda kart/diyalog akışı elle oynanmadı; nişan kayması/can barı görsel olarak görülmedi (oyuncu.js `nisanAktif` alanı henüz yoksa `nisanVar` kullanılır). Başarım koşullarının her biri oyunda tek tek tetiklenmedi.
