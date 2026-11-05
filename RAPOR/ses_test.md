# Süzülme sesi ve DEVAM regresyonları

- `YARIM_IS.patch` incelendi; içinde `ses.js` yaması yok. Mevcut rüzgâr döngüsüne süzülmede düşük hızda da duyulan hava katkısı, dalışta hızla artan daha açık filtre eklendi. Mevcut `setTargetAtTime` geçişi ani ses sıçramasını engeller; duraklatma/menü çarpanları korunur.
- `test/test_devam.py` mevcut CDP istemcisini kullanır; kendine ait geçici Chrome profili, dinamik HTTP ve CDP portları açar ve kapatır. Gerçek modelin üç pozundaki dönüşümler/geometri tamponları, uçuş fiziği, zıt hızlarda ağ hedefi, önizleme/ankraj eşitliği, gökyüzü ağı, Ctrl+W ilk/tekrar preventDefault ve ana menü Çıkış çağrısını denetler.
- Yerel kontrol: Python derleme başarılı. `node` kurulu olmadığı için bağımsız JavaScript sözdizimi kontrolü çalışmadı; modül yükleme entegre Chrome testinde denetlenecek. Entegre başsız test ana ajan tarafından çalıştırılacak.
- Sınır: sentetik klavye olayı tarayıcının işletim sistemi kısayolunu fiziksel olarak sınamaz. Çıkış kontrolü `window.close` çağrısını yakalar; gerçek uygulama penceresinin kapanması ayrıca doğrulanmalıdır. Sesin işitsel dengesi dinlenerek doğrulanmadı.
