# Sirtta "kapi" hatasi (js/kahraman.js)

## Kok neden (kanit)
- Sirttaki duz dikdortgen, hiz izi (Iz sinifi, 2 serit: y=0.95 ve 1.5) idi: kameraya donuk, ucu keskin, additive mor duz serit. Kamera onden/yandan bakinca karakterin arkasinda "kapi/plaka" gibi gorunuyor.
- Kanit: `?test=1&kahramankam=1&izole=1&durum=kos&an=1&aci=180` goruntusunde iki mor dikdortgen serit vardi; ayni sahnede izler gizlenince (gecici gizle=iz denemesi) seritler tamamen kayboldu, govde/dokunac/Yurek Tasi/GLB mesh'lerinde baska duz yuzey yok.
- Diger supheliler (gizli prosedurel parca, Yurek Tasi kopyasi, diken/damar, decal) elendi: gizleme sonrasi gorunum degismedi.

## Duzeltme
- Iz.guncelle: kamera hareket yonunun arkasinda degilse (nokta carpim > -0.15) iz soner (-0.55'te tam gorunur). Onden/yandan seritten eser kalmaz.
- Sirtta yalniz 4 dokunac + kucuk Yurek Tasi isiltisi kaldi.

## Ek is (sallan / sapan / ag)
- ayarla({el:'sol'|'sag'}): sallan pozu aynali; halat kolu ankraja, diger kol asagi-geri; govde halat tarafina yatar (piv.rotation.z); el degisiminde 0.15 sn gecis + kisa savrulma (yaw).
- Dokunac kanallari zaten ayri (sol, sag, kamci): ikisi ayni anda gorunur.
- Yeni 'sapan': kollar iki yana-one, dizler kirik, govde geride (0.35 sn), sonra firlatma: kollar geriye, ucus pozu.
- Ag: ince (r 0.06->0.032, Kara Canavar 2x), gergin (dalga genligi azaldi), atis 0.08 sn'de elden ankraja uzar. Test: `&durum=sallan&el=sol|sag`, `&durum=sapan`.

## Dogrulanmadi
- Gercek oyunda kamera/iz; yalniz SwiftShader goruntuleri. Arkadan bakista iz seritleri halen gorunur (bilerek). Sapan pozu tek acidan bakildi; el degisim gecisi hareket olarak izlenmedi.

## Duvar (grup duvara dik)
- duvar/duvarKos'ta grup yonu ezilmez (egik algisi kapali, yuvarlanma yok). duvarKos: Sprint_Loop (timeScale hiza gore) + hafif one egim. duvar: Crouch_Fwd_Loop (durunca Crouch_Idle_Loop) + kollar one uzanip donusumlu yuzeye yapisir. Eski Idle+ofset pozu kaldirildi. Ayrilinca durum Jump_Loop'a duser (0.17 sn gecis).
- Test: `&durum=duvar|duvarKos&yat=90` (grup 90 derece yatar). Goruntu alindi; yalniz tek acidan, hareketli gecis izlenmedi.

## Not (ana oturum ipucu)
- Aydinlatma goruntusunde kamera onunde catida beyaz kutu (sehir.js catı esyasi) var; kahramanla ilgili degil, sehir.js'te ayrica cozulecek.

## Dogrulama
- test_oyun.py 23/23 (flock ile). Git: yalniz js/kahraman.js + bu rapor.
