# Çarpışma düzeltmesi + yukarı ağ çekişi

## Kök neden (kanıtıyla)
Tek bir "kesin" neden bulunamadı; eski kodda şehir binalarına yerden koşu ve sallanmada tünelleme TEKRARLANAMADI
(eski kodla 30 bina x 2 sn koşu ve 12 x 10 sn sallanma, 60 m/s'ye kadar: 0 ihlal). Şüphe (1) ve (2) çürüdü:
- oyuncu.js `carpis` duzeltme'yi doğru uyguluyordu; görsel instance matrisleri = `binalar[].kutu` (657 instance, 0 uyuşmayan).
Kanıtlanan gerçek boşluklar:
1. **Uzak silüet halkası (300 bina, yarıçap 470-1150 m) hiç collider'sızdı** (sehir.js "çarpışma yok"); 657 görsel bina instance'ının 338'i collider'sız. Şehir dışına sallanınca içinden geçilir. Izgara da yalnız +-512 m'ydi.
2. Tek küre (bel, r=0.55): ayak ve baş çatı kenarında içeri giriyordu. dt=0.05 + E/Shift karışık denemede 3 örnekte ayak çatı seviyesinin altında, kenardan 0.45 m içeride bulundu.
3. Duvar modu (`duvarHareket`) ve zip sonrası kapsül düzeltmesi yoktu; duvar boyunca kayarken köşede komşu binaya girebilirdi.
4. Kamera ışını vardı ama kamera küresi (yakın düzlem) kontrolü yoktu.

## Ne değişti
- sehir.js: uzak binalara collider; ızgara 80x80 hücre (G0=-1280).
- oyuncu.js: 3 küreli kapsül (ayak/bel/baş, r=0.45, boy 1.9; dev x1.6), duzeltme uygulanır, yatay normal yönünde hız sıfırlanır; hareket <=0.3 m adımlarla süpürülür (tünelleme yok); duvar modu ve zip sonrası da kapsül düzeltmesi; kamera küresi (r=0.35) düzeltmesi.
  Süpürme ayrı `ankrajBul` ışınıyla değil, adımlı küre testiyle yapıldı (lamba direkleri tur=1 katı değil, ışın onları duvar sayardı).
- Sağ tık yüksek çekiş: hedef = bakılan duvarın çatı kenarı, yoksa +-40° konide en iyi kenar (en az 10 m yukarı, görüş hattı kontrollü, 95 m). Basılı: halat kısalır, radyal hız 25 m/s'ye ivmelenir, yan hız korunur, yerçekimi x0.35. 3 m kala / çatı seviyesinde çatıya kondurma (zip animasyonu + küçük zıplama). Bırakınca eski momentumlu fırlama. Aynı basışta tekrar çekmez (yeniden basış gerekir). Durum adı 'cek' (kahraman animasyonuna 'sallan' olarak iletilir). nisanVar/nisanNokta yüksek hedefi gösterir. E (zip) aynı.
- Test: test_oyun.py madde 10-13 eklendi; madde 3 G.t'ye ve oyuncu `sallanSayisi` sayacına dayalı (zamanlamadan bağımsız).

## Doğrulama
test_oyun.py 13/13 GEÇTİ, `?test=1` HATA 0 (madde 1, 9).

## Ne doğrulanmadı
- Gerçek GPU / gerçek fare ile elle oynanış (yalnız başsız, sahte girdi).
- Kulelerin üst kat/anten parçaları, köprü kirişi ve araç/ağaç/park kutuları için ayrı test yok (kule collider'ları var, kule testte yalnız rastgele çatılarda dolaylı).
- Kullanıcının gördüğü "içinden geçme" tam hangi durumdu bilinmiyor; uzak halka ve kenar/ayak boşluğu en olası ikisi. Yine görürse konum+durum bilgisi gerekir.
- Çekişin hissi (hız 25 m/s, 3 m eşik) ayarı; yer->çatı 3-4 sn sürdü (45-78 m bina).
- Kamera küresi lerp ile titreme yapar mı, elle bakılmadı.
