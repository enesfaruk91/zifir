# Ağın bakış yönüne gitmesi — 05.11.2026

`js/oyuncu.js` tamamlandı:
- Kamera `getWorldDirection` merkez ışını kullanılır; kamera ofseti/roll dahil. Oyuncunun ayak konumundan en az 6 m yüksek ve menzil içindeki doğrudan bina isabeti aynen tutulur.
- Doğrudan yüksek isabet yoksa kamera bakışının 25° konisinde görünür yüksek bina yüzü adayları arasından oyuncuya en yakını seçilir; yoksa bakış yönünde gökyüzü ankrajı üretilir.
- Önizleme kamera güncellendikten sonra hesaplanır ve saklanır; sağ tık bir önceki gösterilen önizlemeyi aynen kullanır. Işınlanma önizlemeyi geçersiz kılar.
- Tek ağ hedefinde hareket hızı/el sırası seçimi kaldırıldı. El, kahramanın dönüşüne göre ankraj tarafıdır. Modelde yerel sağ kol eksi X olduğundan bu eksen kullanılır.
- Eski `salinimSec` kaldırıldı. `SEV`/`salinimHedefBul` yalnız Space+sağ tık çift ağ sapanı tarafından kullanıldığı için tutuldu; onun da yönü bakış yönüdür.
- E ile zip gökyüzü hedefine gitmez. Süzülme/dalış fiziğine dokunulmadı.

Doğrulama: `/tmp/zifir_nisan.html` gerçek Three.js modülü ve oyuncu.js içe aktarmasıyla başsız Chrome'da 9/9, HATA 0: doğrudan merkez ışınının tam noktası, yanal hızdan bağımsızlık, 25° yüksek bina yardımı, arkadaki binanın reddi, sol/sağ el, model yerel ekseni, 180° dönen modelde sağ el, sağ tık ankrajının gösterilen önizlemeyle tam eşitliği. Görüntü: `/tmp/zifir-nisan-test.png`. `git diff --check` temiz.

Tam oyun ortak suite ve görsel oyun kontrolünü entegrasyon ajanı yapıyor. Konideki bina yüzleri sınırlı aday örnekleriyle taranır; sürekli yüzey optimizasyonu yapılmaz. Donanım performansı elde oynanarak doğrulanmadı. Sözleşme isteği yok.

Entegrasyon sonrası çekiş düzeltmesi: Yeni yüzey hedefi çatıdan 4 m aşağıda kalabildiği için `zipBasla` çatı kenarı desteği 3 m'den 6 m'ye genişletildi. Çatıya yakın cephe noktasına E basmak yine güvenli yükselme yolu ile çatıya taşır. Ek başsız davranış testi geçti (10/10, HATA 0). Eski ortak testin `abs(nn.y-b.h)<1.5` önkoşulu yüzey nişanı tasarımıyla uyumsuz: çatıdan 6 m altına kadar yüzey ankrajını kabul etmesi gerekir; X/Z aynı bina denetimi korunmalı.
