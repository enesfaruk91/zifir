# Entegrasyon raporu (oyuncu.js, dusman.js)

## Yapildi
1. ZIP (E): sure mesafeye gore max(0.25, mesafe/35) sn, ease-out kare (tepe ~70 m/s); varista hiz <=20 m/s (catiya konusta yatay ~6). Carpisma supurmesi ayni.
2. Mukemmel birakis: alt noktayi gecmis, hiz.y>0, ankraja gore ileri, hiz>=18 -> +%15 hiz, yavasCekim(0.6,0.25), olay; test modunda `[OYUNCU] mukemmelBirakis N` yazar.
3. Kara Canavar: hiz x1.25, ziplama x1.3, halat/ankraj menzili x1.3, hasar yariya; dusman.js: dev iken yumruk 6 m alan, hepsi havaya firlar (patron x2 hasar), bitirici 10 m sok halkasi + savurma + sars(0.6); dev baslayinca yakin dronlar 1 sn sersem. Guc: robot 15, dron 20, bitirici +10. (dusman.js'te bitirici hic algilanmiyordu: komboNo===3 ile duzeltildi.)
4. Patron pili: yerel z -0.58, y 1.6 (George bbox olcumune gore sirt), 0.62x0.8 birim (~2.2x2.8 m), nabizla renk/halo parlar; modelfoto=pa ile arkadan dogrulandi (gorunur turkuaz blok sirtta).
5. Ek is 1: kahraman duruyorken son yonu korur; saldiri/kamci/zip'te 0.5 sn hedefe hizli doner, ayarla'ya `bakis`; nisan konisi 12 derece.
6. Ek is 2: sol-sag sallanma (el degisimi, yan taraf ankrajlari, yedek zincir), `ayarla({el})`; cift ag SAPAN (sag tik basili + Space, yerde/<8 m/s; 0.35 sn gerilme, 35 m/s 35 derece firlatma, olay 'sapan'). Test logu: `[OYUNCU] sallan el=...`, `[OYUNCU] sapan N`.

## Dogrulanmadi
- test/test_oyun.py: bu oturumda baska ajanlarin eszamanli test kosulari nedeniyle 3 denemede de "oyun 45 sn'de hazir olmadi" (altyapi); gecis DOGRULANMADI. ?test=1 basliksiz Chrome'da Uncaught/SyntaxError yok.
- Sapan, sol-sag sallanma, bakis yonlendirmesi ve mukemmel birakisin demo/oyunda tetiklenmesi calistirilmadi (sadece kod).
- 'kombo','bitirici','kacis','konus','numara' olaylari test_oyun.py 14-16'da kapsanir; bu kosuda yeniden olculmedi.
- Kara Canavar sok halkasi gorsel olarak bakilmadi.
