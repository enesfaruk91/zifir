# Süzülme / dalış A-D yönlendirme

Değişiklik (js/oyuncu.js, js/arayuz.js yardım satırı; kahraman.js'e dokunulmadı):
- Süzülme: A/D (klavye, kol sol çubuk X, mobil sol çubuk: hepsi girdi.js `eksen.x`) kamera yönünü (yaw) 60°/sn döndürür; fare yaw'ına eklenir. Hız yönü kamerayı 90°/sn ile izler (eski kod yönü kameraya geri çekip A/D'yi eziyordu). Ek yan kayma 4 m/s. W: hedef hız 28, dikey -5 (burun aşağı); S: hız 14, dikey -1.5; nötr 22 / -3.
- Dalış (C): A/D hız yönünü ve kamerayı 25°/sn döndürür.
- Görsel: karakter bank/roll (süzülmede 0.6 rad, dalışta 0.35 rad, yumuşak), kamera hafif roll (bank*-0.25). Bank karakter grubunda uygulanır (kahraman() içinde, gövde merkezi etrafında).
- Yardım metni: "havada süzül (süzülürken A/D: dön)".
- Test: `?test=1&suzultest=1` senaryosuna sagA (A basılı süzül 2 sn), solD (D 2 sn), dalisA (C+A 1.5 sn) eklendi; `[SUZUL] YON ...` ve `iz` logları.

Ölçüm (başsız Chrome, log): A 2 sn: yaw +118.6°, hız yönü kümülatif +192° (ilk ~75° başlangıçtaki ters yöne dönüş artefaktı); D 2 sn: yaw -1.4° (A'nın tersi, 120° geri), yön -270°; dalış+A 1.5 sn: yön +36.7° (A ile aynı işaret), yaw +36°. Süzülmede 0.5 sn aralıklı izde yön 30°/0.5 sn = 60°/sn sürekli. bank A'da -0.60, D'de +0.60.
test_oyun.py 23/23, test_devam.py geçti (HATA yok).

Ne doğrulanmadı:
- Bank yönünün/pivotunun gözle kontrolü (ekran görüntüsü alınmadı; işaret mantıkla seçildi, kanat zarı ile uyumu görülmedi).
- Gerçek fare + A/D birlikte, gerçek kol ve mobil çubukla elle deneme yapılmadı (aynı eksen yolu olduğu için çalışması beklenir).
- Dönüş hızı/his (60°/sn) oyun hissi olarak ayarlanmadı; sayılar sabit kodlu.
- test_devam.py ilk koşuda geçti; dalış yönü işaret düzeltmesinden sonra yeniden koşulmadı (yalnız test_oyun yeniden koşuldu).
- Dalışta bank sırasında kanat/iz efektinin hizası bakılmadı.
