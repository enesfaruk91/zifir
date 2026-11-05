# ZİFİR devam işleri — inceleme kaydı

Üç ajan: ağ/hedef (`oyuncu.js`), kahraman/kanat (`kahraman.js`), ses ve regresyon (`ses.js`, `test_devam.py`). Ana ajan: giriş, menü, başlatıcı, birleştirme ve kabul testleri.

## Değişen davranış
- Ağ kamera merkez ışınındaki yüksek yüzeye gider; 25° bina yardımı ve gökyüzü yedeği vardır. Sağ tık gösterilen önizlemeyi kullanır; hız veya sıradaki el hedef seçmez.
- Shift havada süzülür, C/Ctrl dalar. Giriş sisteminde eksik olan C ve iki Ctrl eklendi. Süzülmede kemiklere bağlı jöle zar, dalışta kapalı kanat ve mor hız izi; durumlara göre rüzgâr sesi.
- E, çatıdan son 6 m içindeki yüzeye hedeflenince çatıya güvenli yükselir. Önceki 3 m destek, yeni yüzey nişanındaki 4 m alt hedef için yetersizdi.
- Başlatıcıdaki Chrome oyun profili script ile kapatmaya izin verir. Ana menü ve duraklatmada ÇIKIŞ pencereyi kapatır; normal sekmede engellenirse Alt+F4 mesajı ve tam ekrandan çıkış vardır.
- Oyna/devam: JavaScript tam ekranı + KeyW klavye kilidi. Pause/çıkış: klavye/fare serbest. İlk ve tekrarlanan keydown için preventDefault. Chrome klavye kilidi iznine bağlıdır; izin yoksa dalış C ile yapılır.

## Doğrulama
- `test/test_devam.py`: 15/15; gerçek GLB zar/iz görünürlüğü, tüm sahnede sonlu dönüşüm ve geometri, uçuş fiziği, bakış/hedef/el/koni, Ctrl+W olayları, çıkış çağrısı, hata listesi boş.
- Gerçek Chrome app kabulü (`test/test_pencere.py`): tam ekran ve keyboard=true, menüye dönünce kilit serbest, ÇIKIŞ ile gerçek hedef/pencere kapandı. Headless ortamda pointer=false; fiziksel masaüstü fare kilidi/oynanış hissi bu testin kapsamında değil.
- Kahraman görselleri incelendi: `jole_suzul.png`, `jole_dalis.png`; ana menü `menu_cikis.png`.
- İlk ortak test 22/23: eski çatı nişanı önkoşulu yeni tam yüzey hedefini dışlıyordu. Test aynı bina sınırlarını ve gerçek çatıya iniş denetimini koruyarak son 6 m cephe hedefini kabul eder. Son ortak test sonucu `test_bot.md` içinde.
- `bash -n oyna.sh`, Python derleme ve `git diff --check` temiz.

## Sınırlar ve kaynak
- RX 550 gerçek FPS ve elde oynanış ölçülmedi; başsız SwiftShader performansı donanım ölçümü değildir.
- Chrome klavye kilidi için JavaScript tam ekranı ve izin gerekir: https://developer.chrome.com/docs/capabilities/web-apis/keyboard-lock . İzin vermeyen ortamda Ctrl+W için mutlak garanti yoktur; C güvenli dalış tuşudur.
- `YARIM_IS.patch` korundu. DEVAM'da eski “git'e eklenmedi” diye anılan hikâye/UI görselleri zaten takipteydi; tekrar ekleme gerekmedi.
- Yayın kodu `b259a89` kaydında; stash yapılmadı.

## Son kapsam
- Dev: tam kemik bağ matrisi, uniform kök büyümesi ve orantılı dokunaç; 6+4 faz GLB testi geçti.
- Performans: composer PR eşitlendi, düşükte gereksiz piksel yükü %43.75 azaltıldı; resize çizim başında, tekrarlanan aynı ölçü no-op. Donanım FPS iddiası yok.
- PS4 eşlemeleri ve Android Chrome yatay iki çubuk/dokunmatik aksiyonlar eklendi; mobil11/11, desktop5/5, 740×360 yatay11/11 sentetik testler geçti.
- Son tam oyun suite **23/23, HATA0**; çatı çekişi6/6 ve gerçek çatı inişi6/6. C ve iki Ctrl bas/bırak giriş akışı ve gerçek Chrome pencere çıkışı da geçti.
- GitHub Pages yayını: https://enesfaruk91.github.io/zifir/ ; kaynak https://github.com/enesfaruk91/zifir .

Canlı yayın doğrulandı: HTTP200, 8modül + gerçek GLB,740×360 yatay dokunmatik kumanda görünür, hata0. Ayrıntılar yayin.md.
