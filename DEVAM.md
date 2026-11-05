# ZİFİR — DEVAM (05.11.2026 akşam, Claude kullanım limiti doldu)
Son test edilmiş kayıt: 9bc0957 (test_oyun.py 23/23). Oyun: ./oyna.sh veya masaüstü ZİFİR simgesi.
YARIDA KALAN (sırayla yap):
1. AĞ BAKILAN YERE GİTSİN (js/oyuncu.js) — kullanıcı: "ağ rastgele yere gidiyor". Brif: önizleme ankrajı = kamera merkez ışını (≥6 m yukarı ise tam o nokta), değilse bakış yönüne 25° koni içinde en yakın yüksek bina noktası, yoksa gökyüzü ağı; sağ tık = önizleme noktası (G.oyuncu.nisanNokta, ekrandaki turkuaz halka); el = ankrajın olduğu taraf. Hız yönü/el sırasına göre seçim KALDIRILACAK.
2. JÖLE KANAT + DALIŞ POZU (js/kahraman.js; fizik oyuncu.js'te HAZIR: durum 'suzul'/'dalis'). Yarım kahraman.js değişikliği YARIM_IS.patch içinde (test edilmedi; uygulamadan önce incele). Ayrıca girdi.js tam ekran+navigator.keyboard.lock (Ctrl+W pencereyi kapatmasın), arayüz kontroller metni (Shift süzül, Ctrl/C dalış), ses (süzülme rüzgârı).
3. Codex görselleri assets/hikaye, assets/ui oyunda bağlı ama git'e eklenmedi: `git add assets/ CODEX_GORSEL2.md RAPOR/gorsel2.md`.
Kurallar: SOZLESME.md; paralel ajanda yalnız kendi dosyası, `git add -A`/stash/pkill YASAK, test `flock /tmp/zifir_test.lock python3 test/test_oyun.py`.
