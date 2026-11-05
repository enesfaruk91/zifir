# Ses PRO raporu

## Yapıldı
- js/ses.js: gerçek CC0 kayıtlar (fetch + decodeAudioData, ön yükleme; yüklenmeyen için eski sentez yedek). API aynı: G.ses = {cal, muzik, sessiz, seviye, yuklendi, arayuzSes}.
- Kenney Impact: yumruk (komboNo 0-2 ayrı impactPunch_medium, 3 = ağır + alçak bas), 'bitirici', isabet, robot parçalanma (metal+plate), iniş ('yere'), 'konus'; jöle atışı/yapışma/'cek' impactSoft + perde ±%8 + lowpass ("şlap").
- Arayüz: arayuz_sec / arayuz_onay / arayuz_geri / arayuz_hata (Interface Sounds); G.ses.arayuzSes = true.
- Ortam: ruzgar.ogg döngü (hız -> ses + lowpass), sehir_sokak.ogg döngü (yükseldikçe azalır).
- Müzik (akış, HTMLAudio + gain): menü lights_at_night, oyun cyberpunk_beauty, >=3 yakın (45 m) düşman veya "Patron" görevinde chase.ogg'a 2 sn çapraz geçiş, 6 sn sakinlikte geri. chase döngü dikişi: baş/sonda 1.5 sn fade.
- 'mukemmelBirakis'/'kacis': kısa "vuuş" + müzikte 0.6 sn lowpass. 'kombo' 5/10/20: yükselen nota. 'numara': tık.
- Düzey: G.ayar.sesAna/sesMuzik/sesEfekt her karede (yoksa G.ses.seviye değeri, yoksa 1). En çok 16 eşzamanlı kayıt, aynı ses 50 ms içinde tekrar yok.

## Doğrulama
- İzole sayfada gerçek (gerçek zamanlı) başsız Chrome: 65/65 dosya 200 + decode/üstveri (62 SFX/ortam decode, 3 müzik loadedmetadata), hata yok, yuklendi=true.
- test_oyun.py: 12/16; 'Uncaught/shader' kontrolü (madde 9) GEÇTİ. KALDI olanlar (7, 15, 16) hareket/oyuncu kaynaklı (can sıfırlama, duvardan çatıya çıkış, mükemmel bırakış), ses ile ilgisiz.

## Doğrulanmadı
- Gerçekte duyulan karışım/denge (başsız); düzey sayıları (0.45 müzik, vb.) kulakla ayarlanmadı.
- Müzik akışı (el.play) başsız ortamda çalma denenmedi, yalnız metadata; dikiş fade'i duyulmadı.
- Müzik "decode" edilmedi (bellek için akış); Safari/MediaElementSource CORS davranışı denenmedi.
- Tam oyunda ?test=1 konsolunda "[SES] yüklendi" satırı: ctx kullanıcı hareketi olmadan açılmaz, o yüzden testte yüklenmeyebilir (çökmez).
- 'kombo' ve 'konus' kayıt eşlemesi tahmin; 'yere' siddeti düşme hızına bağlanmadı.
