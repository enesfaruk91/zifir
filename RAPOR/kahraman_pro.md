# KAHRAMAN PRO raporu (js/kahraman.js)

## Yapıldı
- `assets/3d/zifir_ual.glb` (Quaternius UAL, CC0) asenkron yüklenir; hazır olunca prosedürel gövde gizlenir, hata/eksik kemikte prosedürel kalır (console.warn, çökmez). API aynı: `G.kahraman={grup,ayarla,dokunac,elNoktasi,devOl}`.
- Boy 1.82 m gövde + damla uç ≈ 1.9 m, ayak tabanı y=0 (bbox'tan ölçeklenir). Yön ve sol/sağ el kemikten otomatik bulunur.
- Jöle malzeme skinning'li kopya (aynı dalga/damar shader). Kemik ölçekleriyle kalınlaştırma: gövde/kol/bacak/el/parmak (her kare).
- Aksesuarlar kemiğe bağlı: baş=damla uç + büyük beyaz damla gözler (köşe verisinden yüzeye oturtulur), göğüs=Yürek Taşı (+arkada küçük), omurga=4 sırt dokunacı.
- İki kanallı AnimationMixer (alt/üst gövde ayrı klip): koşarken yumruk, bacaklar koşmaya devam eder. crossFade 0.10-0.17 sn. dur=Idle, yuru=Walk/Jog, kos=Jog/Sprint (timeScale hıza göre), zipla=Jump_Start→Jump_Loop, dus=Jump_Loop+kollar açık, iniş=Jump_Land, hasar=Hit_Chest, kombo 1/2=Punch_Jab/Cross, 3=Punch_Cross üst + prosedürel bacak tekmesi, 4=Spell_Simple_Shoot + Yürek Taşı parlaması ('bitirici' de).
- sallan/cek: Jump_Loop + halat kolu ankraja yönelme (IK-benzeri), diğer kol geriye, bacaklar toplu, gövde hız yönüne eğik. zip: kollar hız yönüne, süperman eğimi. duvar/duvarKos: Crouch_Fwd denendi, işe yaramadı (ayakta çömelme; yatırınca sırtüstü) → Idle tabanı + dönüşümlü kol/diz kemik ofsetleri. mukemmelBirakis: kök altı pivotta 0.75 sn ön takla. oyuncu.js grubu yatırırsa (takla/kacis) kendi dönüşümü ezmem: bacak toplama pozu; Roll klibi yalnız grup dik kalırsa.
- Olaylar: yumruk, bitirici, hasar, yere, kacis, mukemmelBirakis, konus. Bilinmeyen durum (cek, duvarKos, numara, kacis, konus...) alias/alt dize ile eşlenir, olmazsa Idle.
- elNoktasi: el kemiği dünya konumu (kök uzayında saklanır, güncel grup matrisiyle çevrilir).
- Test: `?test=1&kahramankam=1&izole=1&durum=<ad>&an=<sn>&mes=&bak=&aci=&kombo=1..4` (izole: ilk karede `an` sn ileri sarar ve dondurur; oyunu duraklatıp arayüzü gizler).
- Doğrulama: `?test=1` HATA 0; test_oyun.py 14/16 (KALAN 15 ve 16 HİS'in yeni oyuncu.js testleri: duvardan çatıya çıkış, mükemmel bırakış; kahramanla ilgisiz). Görüntüler alındı: idle, sprint, jab, tekme, bitirici, sallan (ön/yan), zip, dus, duvar, yakın baş/göz/Yürek Taşı. Telif taraması temiz.

## Doğrulanmadı / zayıf
- Yalnız SwiftShader görüntüsü (bloom gözleri/taşı beyazlatıyor). 60 fps ölçülmedi (tek SkinnedMesh ~13.7k üçgen + 4 tüp, gölge atar).
- Duvar pozu gerçek binada; hasar/dogus/Jump_Land/Roll/konus/numara oyun içinde görsel doğrulanmadı. Duvar ofset/eğim tahmini, duvar bacak hareketi doğrulanmadı.
- Ayak kayması (timeScale yaklaşık). 7 m arkadan görünüm tam test edilmedi (6 m alındı; silüet ince kalabilir).
- komboNo oyuncu.js'te 0 tabanlı geliyor; kod ilk 0'ı görürse +1 kaydırır, 1 tabanlıya geçilirse de çalışır.
- Mankenin başı dar: gözler küçük dik damla (V biçimli göz oluşmasın diye dik ve ayrık).

## Sözleşme istekleri
- Yok.

## Özet
1. Zifir artık GLB iskeletli, 46 animasyonlu gerçek model; yüklenemezse prosedürel.
2. Alt/üst gövde ayrı kanal: koşarken yumruk, halat kolu ankraja IK'lı.
3. Damla uç, damla gözler, Yürek Taşı, 4 sırt dokunacı kemiğe bağlı.
4. API/olay uyumu aynı; HATA 0, testler 14/16 (kalan 2 HİS'in).
5. Eksik: gerçek GPU görüntüsü, duvar/iniş/roll oyun içi görsel doğrulama.
