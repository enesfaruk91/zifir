# Jöle kanat ve dalış pozu — 05.11.2026

- YARIM_IS.patch içinden yalnız kahraman.js bölümü incelenip alındı; kaydedilmiş patch korundu.
- Gerçek GLB modelinde `suzul` ve `dalis` eşlendi. Süzülmede yüzüstü açık kol/bacak; dalışta baş aşağı, kollar gövdede düz bacak pozu uygulanıyor.
- Kemiklerin dünya konumlarını izleyen 135 köşeli üç parçalı jöle zar, 0.25 sn açılış/0.20 sn kapanış, kapanış damlaları ve dalış hız çizgileri eklendi. Geometri her kare yeniden oluşturulmuyor.
- Denetimde çift dev ölçeği kaldırıldı; zar büyümeyi kemiklerden alıyor. Önceki takla süzülme/dalışta söndürülüyor, dev duruş ofseti uçuş pozuna eklenmiyor. Sağ ayak kemik kontrolü eklendi; geçici debug log/bayrakları kaldırıldı.
- GLB yüklenene kadar veya yüklenemezse prosedürel model de süzülme/dalış pozu ve basit dinamik zar gösteriyor.
- Test sürücüsünde iki yeni durum var. GLB zar: `zifir-jole-kanat`; dalış izi: `zifir-dalis-izi`; yedek: `zifir-jole-kanat-yedek`.

Doğrulama: `flock /tmp/zifir_test.lock python3 /tmp/zifir_jole_check.py` ile ayrı Chrome/CDP testi geçti (izinli host çalıştırması). `git diff --check` temiz.
- Süzül: hata listesi `[]`, zar görünür, dalış izi gizli, tüm konumlar sonlu. Zar boyutu yaklaşık 2.29 × 0.32 × 1.32 m.
- Dalış: hata listesi `[]`, zar gizli, dalış izi görünür, tüm konumlar sonlu.
- Ekran görüntüleri görsel incelendi: `/tmp/zifir-jole-suzul.png`, `/tmp/zifir-jole-dalis.png`. Süzülmede açık kanat, dalışta baş aşağı ince gövde/uzun mor iz görünüyor.
- Bu testte ortaya çıkan eski `kahramankam` hatası düzeltildi: `fog=null` şehir güncellemesinde `.color` hatası çıkarıyordu; kahraman test kamerası artık uzakta başlayan Fog nesnesi kullanıyor.
- Ortak oyun kabul testleri ana ajan tarafından yürütülüyor. GLB yüklenemeyen durum için eklenen yedeğin kodu incelendi; bu ayrı görsel koşu gerçek GLB modelini doğruladı. RX 550 üzerindeki gerçek FPS bu testte ölçülmedi.

Sözleşme isteği yok; yalnız js/kahraman.js ve bu rapor değiştirildi.

## Dev Zifir düzeltmesi (kullanıcının büyüyünce bozulma bildirimi)

Bulunan nedenler ve değişiklikler:
- Kemik aksesuarları yalnız dönme/öteleme alıyordu; gövde kalınlaşınca göz, taş ve dikenler deriyle ayrışabiliyordu. Artık `güncel kemik × ters bağ matrisi` tamamıyla izleniyor; ölçek ve shear da dahil, quaternion ayrıştırma kaybı yok.
- Dev için her üst/alt kol ve el kemiğine ek ölçek vermek zincir boyunca çarpılıyordu. Dev büyümesi artık tek gövde kökünde uniform; normal modelin kemik oranları sabit.
- Göz Y ölçeği GLB taban ölçüsünü unutuyordu; taban Y korunuyor, devde sınırlı büyüme uygulanıyor.
- Yayın sayısal taşma olasılığı yerine sınırlı, monoton üstel ölçek geçişi kullanılıyor.
- Sırt dokunaçlarının ek dev uzunluğu 2.5 kat yerine 1.3 kat. Kök zaten iki kat büyüdüğünden önce normalin beş katına çıkıp gövdeyi kaplıyordu. Ek kalınlık ve hareket de azaltıldı.

Gerçek GLB testi: `/tmp/zifir_dev_check.py` ile normal → dev → dev süzül → dev dalış → normal dalış → normal dönüş (her aşama 180 × 1/60 sn). Tüm aşamalarda `errors=[]`, 2 skinned mesh, bütün dünya matrisleri/zar/iz konumları sonlu.
- Normal gövde kutusu: 1.014 × 1.797 × 0.784 m.
- Dev ayakta: yaklaşık 2.88–2.96 × 3.82 × 2.25 m (dev kol duruşu genişliği de değiştirir).
- Normal dönüş: 1.014 × 1.797 × 0.784 m; ilk normal ölçüsüne geri döndü.
- Dev büyüme ölçeği 1.11 → 2.00; dalış/süzülme squash etkisi ayrı kalıyor.
- Dev süzülmede zar açık/iz kapalı, dev dalışta zar kapalı/iz açık, normal ayakta dönüşte ikisi de kapalı.

Son dokunaç ayarından sonra `/tmp/zifir_dev_final.py` ile dört aşamalı tekrar da geçti. Görsel incelenen son PNG'ler: `/tmp/zifir-dev-final.png`, `/tmp/zifir-dev-suzul-final.png`, `/tmp/zifir-dev-dalis-final.png`, `/tmp/zifir-normal-return-final.png`. Ortak test kilidi bırakıldı. Bu kontroller gerçek GPU FPS ya da tüm ekran kararması nedenini ölçmez; ana ajan oyun/render tarafını denetliyor. Dev tasarımındaki omuz/kol dikenleri korunuyor.
