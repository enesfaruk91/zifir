# ZİFİR — durum (05.11.2026)

Önceki yarım işler tamamlandı. Ağ bakış yönüne ve gösterilen önizlemeye gider; jöle kanat/dalış, C/Ctrl girişi, izinli tam ekran klavye kilidi ve ana menü/duraklatma ÇIKIŞ eklendi. YARIM_IS.patch korundu.

Ek düzeltmeler: Dev modelinde kemik/aksesuar ölçek bozulması ve büyüme geçişi; composer çözünürlüğü, gereksiz resize temizlemesi ve FPS süre ölçümü. PS4 standart kontrol eşlemesi ve Android Chrome için yatay dokunmatik kumanda eklendi. OYNA dokunuşunda tam ekran/yön kilidi istenir; dik tutulan telefonda da oyun kendi görüntüsünü yataya çevirir.

Tam oyun kabulü: 23/23, HATA 0. Yeni regresyonlar ve son yayın bilgisi RAPOR/entegrasyon.md içinde. İnceleme: RAPOR/ag_nisan.md, jole_poz.md, performans.md, kontroller.md, test_bot.md.

Yerel: ./oyna.sh. Web hedefi: https://enesfaruk91.github.io/zifir/ . Yayın .github/workflows/pages.yml ile master push'ta yapılır.

Doğrulama komutları (sırayla, ortak kilitle):
- flock /tmp/zifir_test.lock python3 test/test_oyun.py
- flock /tmp/zifir_test.lock python3 test/test_devam.py
- flock /tmp/zifir_test.lock python3 test/test_pencere.py

Gerçek PS4/Android cihazı ve RX550 FPS elde ölçülmedi. Ctrl+W koruması Chrome tam ekran/klavye iznine bağlı; C her zaman dalış seçeneğidir.
