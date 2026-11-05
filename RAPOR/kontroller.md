# PS4 ve Android kontrolleri

`js/girdi.js` ve yeni `js/mobil.js`: standart DualShock/Gamepad API eşlemesi; sol çubuk hareket, sağ çubuk bakış, × Space, ○ E, □ F, △ Q, L2 ağ, R2 saldırı, L1 süzül/koş, R1 C dalış, Options Escape, Share ses. Bağlantı kopunca tuşlar bırakılır; pause sonrası nötr konuma dönme koruması sürer. Kısa HUD bağlantı bilgisi ve açılabilir kontrol açıklaması var.

Coarse touch telefonda iki bağımsız sanal çubuk + zıpla/ağ/saldırı/çekil/süzül/dalış/dev/kamçı/duraklat. Pointer capture, ayrı pointer sahipliği, cancel/lostcapture/blur/menu temizliği. Oyun sırasında scroll/zoom engellenir; menüde normale döner. Masaüstünde touch katmanı gizlidir. Desktop pointerlock ve Ctrl+W keyboard lock korunur; mobilde pointerlock/keyboard lock istenmez.

Telefon yatay kullanım: kullanıcı Oyna/Devam dokunuşunda destek varsa fullscreen ardından orientation.lock('landscape') istenir. Desteksiz tarayıcıda sessiz düşer. Portrede kontroller gizlenir, oyun duraklatılır, 'Telefonu yatay çevir' mesajı görünür; menü düğmeleri erişilebilirdir. Landscape safe-area ve kısa ekran CSS düzeni var.

Başsız Chrome sentetik Gamepad+PointerEvent testleri: mobil 11/11, desktop 5/5 HATA 0 (eşleme, iki çubuk, bağlantı ayrılması, iki parmak hareket/ağ, pointercancel, blur ve yeniden kullanım, menüde gizleme). `/tmp/zifir_kontroller.html` harness; gerçek PS4 donanımı ve Android telefonda fiziksel deneme yapılmadı. Fullscreen/orientation browser izin ve desteğine bağlıdır. Ortak oyun suite entegrasyon ajanında.

Menü entegrasyonu: Kol D-pad → ArrowUp/Down/Left/Right, × → Enter, ○ → Escape. Options oyun ve menüde Escape. Yalnız yeni fiziksel basımda DOM keydown/keyup gönderilir; basılı tutunca her kare tekrarlanmaz. Dokunmatik duraklat düğmesi de aynı DOM Escape yoluna bağlandı; arayüzün doğrudan klavye dinleyicisiyle uyumludur.
