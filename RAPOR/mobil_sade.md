# Mobil kumanda sadeleştirme

Dosyalar: js/mobil.js (yeniden yazıldı), test/test_mobil.py (yeni). girdi.js / oyuncu.js vb. değişmedi; girdi API'si (tuslar/yeni/birak/eksen/bakis/guncelle/temizle/kapat) aynı.

## Önce / sonra
| | Önce | Sonra |
|---|---|---|
| Ekranda sürekli görünen kontrol | 2 çubuk + 8 düğme + duraklat = 11 | 4 büyük düğme + duraklat = 5 (DEV yalnız güç doluyken, 6.) |
| Üst "kontroller" kutusu | Oyun sırasında hep | Yalnız duraklat menüsünde |
| Bakış | Ayrı sağ çubuk | Sağ yarıda boş alanı sürükle |
| Hareket | Sabit çubuk | Sol yarıda dokunulan yerde beliren yüzen çubuk (sol altta silik ipucu halkası) |

## Eşleme
| Düğme (boyut) | Dokunma | Tuş kodu | Not |
|---|---|---|---|
| AĞ (98px, en büyük, sağ alt) | basılı tut | Fare2 | sallan |
| ZIPLA (74px) | bas | Space | Havada düşerken >0.22 sn basılı tut = süzül (yalnız mobil: sanal ShiftLeft) |
| SALDIR (74px) | bas | Fare0 | |
| ÖZEL (68px) | bas | duruma göre | sallan/duvar: ÇEKİL=KeyE; havada (zipla/dus/suzul/dalis): DALIŞ=KeyC; diğer (yerde): KAMÇI=KeyF. Basılıyken etiket sabit. |
| DEV (56px, üstte, duraklatın yanında) | bas | KeyQ | Yalnız p.guc>=gucMax ve dev değilken görünür, sarı yanıp söner |
| Duraklat (58px, sağ üst) | bas | Escape | |
| Sol yarı (%42) | sürükle | eksen | yarıçap 52px, ölü bölge %8 |
| Sağ yarı (%58, düğme dışı) | sürükle | bakis | parmağın karedeki yer değiştirmesi / dt / 420 -> bakış hızı (girdi.js hız birimi korunur) |

Düğmeler 64-98px (küçük ekranda --u ölçeği 0.88/0.8 ile ~52-86px), yarı saydam, SVG ikon + küçük etiket, safe-area inset kullanır. Süzülme için PC eşlemesi değişmedi (Shift).

## Test
test/test_mobil.py (CDP dokunma öykünmesi, mobile+touch, 844x390 ve 740x360): düğme sayısı, boyut/ekran içi, kutu gizli, yüzen çubuk -> eksen -> oyuncu konumu, sağ sürükle -> kamera yönü döner/durur, AĞ/ZIPLA/SALDIR -> Fare2/Space/Fare0, 3 eşzamanlı parmak, ÖZEL etiketi, DEV görünürlüğü, oto-süzül, duraklat + kontrol kutusu. Ekran görüntüsü: RAPOR/mobil_sade.png.
Çalıştır: flock /tmp/zifir_test.lock python3 test/test_mobil.py

## Ne doğrulanmadı
- Gerçek Android telefonda denenmedi (başparmak erişimi, düğme yerleşimi, hassasiyet, 120 Hz); yalnız Chrome headless dokunma öykünmesi.
- Bakış hassasiyeti (bdx/dt/420) tahmini ayar; gerçek parmakta çok hızlı/yavaş olabilir. Yazılım render düşük FPS'te test edildi.
- Oto-süzül eşiği (0.22 sn) ve ÖZEL'in havada Dalış'a dönmesi oyun hissi olarak denenmedi; Dalış yalnız yerden >6 birim yükseklikte çalışır (oyuncu.js).
- Duraklat düğmesi, oyunun kendi görev kartı HUD'unun sağ üst köşesiyle üst üste biniyor (ekran görüntüsünde görülür); arayuz.js bu ajanın dosyası değil.
- Ağ düğmesi basılıyken parmak kayarsa bakış alınmaz (kendi parmağı); bakış için ikinci parmak gerekir. Sallanırken AĞ+bakış aynı başparmakla yapılamaz (sağ başparmak AĞ'da).
- Dev düğmesinin gerçek güç dolumunda yanıp sönmesi yalnız guc elle atanarak denendi.
- Önceki mobil testleri (iframe ile yatay döndürme sarmalayıcısı, ?yatay=1 olmadan) bu testte kullanılmadı.
