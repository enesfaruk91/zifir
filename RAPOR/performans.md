# Çizim çözünürlüğü ve siyah kare düzeltmesi

## Bulgu ve değişiklik

`EffectComposer` ilk oluşturulurken piksel oranını 1 olarak alıyordu. Kalite değişince yalnız renderer oranı değişiyordu. Düşük kalite `.75` oranına rağmen sahne ve postprocess zinciri tam çözünürlükte çizilip daha küçük canvas'a aktarılıyordu. Composer artık renderer ile aynı piksel oranını kullanır: bu hedeflerde piksel yükü %43,75 azalır. Bloom, mevcut düşük kalite yarım çözünürlük ayarını korur.

Canvas boyutu yazılınca mevcut görüntü temizlenir. Önceden resize olayı bunu RAF dışında, otomatik kalite düşürme ise çizilen karenin sonunda yapıyordu. Boyutlandırma artık sonraki karenin başına kuyruğa alınır ve hemen ardından oyun çizilir. Aynı boyut/kalite istekleri canvas'ı tekrar boyutlandırmaz. Bu, kaynak kodda bulunan bir siyah kare yolunu kaldırır; kullanıcının gördüğü bütün kararmaların tek sebebi olduğu kanıtlanmış değildir.

Kalite değişiminde bütün materyalleri her seferinde yeniden derleme isteği kaldırıldı; yalnız gölge açılıp kapanırken benzersiz materyal başına bir kere istenir. FPS üzerinden kalite düşürme, fizik için 50ms'ye sınırlanan süre yerine gerçek geçen süreyi kullanır.

## Gerçek çizim ile ölçüm

Geçici `/tmp/zifir_render_perf.py`, değişiklik öncesi `oyun.js` ve sonrasını ayrı temiz Chrome profillerinde çalıştırdı. 640×480 pencere, görünür içerik 640×393; düşük kalite; başlangıç 30 RAF ısınma ve ardından 60 RAF aralığı. Sahne ve composer çizimi açık kaldı. Aktif geçişler her iki koşuda aynı: RenderPass, UnrealBloomPass, grade ShaderPass, OutputPass. Sahne `duraklat` durumunda tutuldu.

| Ölçü | Önce | Sonra |
|---|---:|---:|
| Canvas | 480×294 | 480×294 |
| Composer hedefi (API) | 640×393 | 480×294,75 |
| Ortalama RAF aralığı | 763,86 ms | 244,99 ms |
| Ortanca | 733,3 ms | 250 ms |
| %95 dilimi | 1250 ms | 266,6 ms |
| Oyun hata listesi | 0 | 0 |

Composer API kesirli hedef boyutunu saklar; WebGL/canvas boyutu tamsayıya dönüşür. Tekrarlanan aynı boyutlu resize olayı sonrası renderer.setSize çağrı sayısı **0** olarak yakalandı. `git diff --check` temiz.

Bu ölçüm **başsız SwiftShader CPU çizimidir**, RX550 ölçümü değildir. Tek koşunun süre farkı eşzamanlı makine yükü ve shader ısınmasından da etkilenebilir; RX550 için aynı FPS kazanımı iddia edilmez. Çözünürlük ve tekrar resize sayıları doğrudan doğrulanmıştır. Ham ölçüm `/tmp/zifir-render-perf.json` içinde.

## Açık doğrulama

Gerçek RX550 üzerinde uzun oynanış, tam ekran geçişi ve gözlenen kararmaların tekrarlanması ana ajan tarafından ayrıca kontrol edilmelidir. Bu ajan ortak test süitini çalıştırmadı; yalnız `js/oyun.js` ve bu raporu değiştirdi.
