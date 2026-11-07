# Eksikler turu (07.11.2026)

## Yapılan
1. Mobil: dokunmatikte (`@media (pointer:coarse)`) görev kartı, küre sayacı ve ödül balonu sağdan 136px kaydırıldı (js/arayuz.js); duraklat (58px) ve DEV düğmesiyle üst üste binmez. test_mobil 53/53.
2. Süzülme yön hatası (GERÇEK BUG, kök neden): A/D "yan kayma" terimi hıza yazılıyor ve ertesi kare yön hesabına geri besleniyordu; yön kare başına birikip hız yönü kameradan ~70-90° sapıyordu (raporda "başlangıçta ters yöne ~75°" denen şey artefakt değil, bu). js/oyuncu.js: son yazılan hıza hâlâ eşitse saf yön (yan kaymasız) kullanılır, çarpışma vb. hızı değiştirdiyse yeniden eşitlenir. Ölçüm: 2 sn A'da yön değişimi 194° → 127° (kamera yaw'ı 120°); hız yönü kareler arası pürüzsüz, simetrik (D = -A).
3. Bank gözle doğrulandı: RAPOR/suzul_A.png (arkadan, sol kanat aşağı/sağ yukarı = sola yatış), suzul_D.png (sağa yatış). Pivot makul (gövde merkezi). Karakter küçük görünüyor, ayrıntı kırpınca seçiliyor.
4. WebGL bağlam kaybı (js/oyun.js): `webglcontextlost` -> preventDefault, oyun duraklar, `[ZIFIR] BAGLAM KAYBI` uyarısı, "Görüntü yeniden yükleniyor" mesajı, kayıpken render atlanır; `webglcontextrestored` -> oyun devam. Yeni test: test/test_baglam.py (WEBGL_lose_context ile kaybet/geri getir) geçti. Kararma değişikliklerine (ön ısıtma, 512 gölge) dokunulmadı.
5. Testler: test_oyun 23/23, test_devam geçti, test_pencere geçti, test_mobil 53/53, test_baglam geçti.

## Önerilen (yapılmadı)
- Ses eksikleri: `suzulBasla/suzulBit`, `halkaGecildi`, `kediKurtarildi`, `zincirBitti`, `bosAg` olaylarına ses bağlı değil (ses.js yalnız süzülmede rüzgâr tonunu değiştiriyor). Çocuk halkadan geçince/kediyi kurtarınca sessiz kalıyor olabilir; küçük "çiling" eklenmeli.
- Süzülmede karakter ekranda çok küçük; süzülürken kamerayı biraz yaklaştırmak okunabilirliği artırır.
- Dönüş hızı (60°/sn), bank (0.6 rad) sabit kodlu; çocukla elle denenip ayarlanmalı.
- Konsol/sonsuza düşme/düşman takılması/görev takılması için uzun oynatma yapılmadı (aşağıya bakın).

## Ne doğrulanmadı
- test_baglam ilk koşuda bir kez "hata listesi boş" kontrolünde kaldı (diğer ajanlarla CPU paylaşılırken); sonraki 3 koşuda hata listesi boş, neden bulunamadı (zamanlama kaynaklı olabilir).
- Gerçek GPU'da bağlam kaybı ve geri yükleme (yalnız SwiftShader'da WEBGL_lose_context ile denendi); geri gelince bazı materyal/render hedeflerinin görsel olarak doğru olup olmadığı bakılmadı, yalnız oyunun çökmediği ve zamanın aktığı ölçüldü.
- Mobil kart kayması gerçek telefonda/gerçek çözünürlükte gözle bakılmadı (CSS mantığı + test_mobil).
- Süzülme düzeltmesi gerçek fare/kol ile elle denenmedi; çarpışma (duvara değme) sırasındaki yeniden eşitleme yolu yalnız kodla düşünüldü.
- Görev takılması, düşman AI, haritadan çıkma, vurma efektleri için ayrı uzun oyun testi yapılmadı (SwiftShader'da tam çözünürlükte ~1 kare/sn).
