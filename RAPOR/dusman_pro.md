# dusman_pro.md (DÜŞMAN ajanı, js/dusman.js)

## Yapıldı
- Asenkron GLTFLoader + SkeletonUtils.clone; yüklenene/başarısız olana dek prosedürel görünüm (model gelince prosedürel parçalar gizlenir, çizim/mantık aynı kalır).
- Pas Robotu: RobotExpressive.glb, malzemeler paslı turuncu/kahve (parlak emissive yok). Idle/Walking/Running, saldırı Punch, hasar No, yenilme Death (1 sn) sonra cıvata-yay parçalanması.
- Vızvız dron: cyberpunk/Enemy_Flying.glb (Idle döngü, ateşte Attack); göz kırmızı, şarj yanıp sönmesi göz malzemesinin emissive'ine taşındı; vurulunca dönerek düşme aynen.
- Patron: mech/George.glb (3.5x grup ölçeği, ~10 m), sırtta parlayan pil zayıf noktası (nabız atar), Walk/Punch/HitRecieve/Death (1.9 sn). Yere vurma: genişleyen şok dalgası halkası (15 m/s, 18 m'ye kadar); oyuncu yerdeyse (ayak < halka+1.2 m) hasar 8, zıplayan kaçar.
- Kamyonet: arac/delivery.glb, paslı turuncu, tekerlekler dönüyor.
- Tepki: isabette 0.08 sn beyaz emissive parlaması + geri itme; 'yumruk' olayında komboNo itmeyi artırır, 'bitirici' hasarı x1.5 yapar ve (patron hariç) robotu havaya fırlatır (vy 13).
- Animasyon seyreltme: mixer >45 m her 2, >80 m her 4 karede; ölü robotlar yenilme süresince fizik (itme/yerçekimi) almaya devam eder.
- API: G.dusman.mermiler = dron mermileri [{konum, hiz, aktif}] (kaçış için; konum canlı Vector3). Oyuncu jöle mermileri G.dusman.oyuncuMermileri. G.dusman.modeller (hata ayıklama).
- Olaylar ('isabet', 'robotYenildi', gucEkle) ve hasar/jöle isabeti/görev akışı değişmedi.
- Test yardımcısı: ?test=1&modelfoto=1|d|p|pa|k (robot/dron/patron ön/patron arka/kamyonet yakın görüntü, kahramanı gizler).

## Doğrulanan
- ?test=1: __ZIFIR_HATALAR boş, konsolda uyarı yok (yalnız sigmaRadians), 7/7 düşman modelli.
- python3 test/test_oyun.py: 15/16; kalan KALDI #16 (mukemmelBirakis) oyuncu.js/HİS konusu, dusman.js ile ilgisiz. #5 yumruk ve #9 konsol geçti.
- Ekran görüntüsü: robot, dron, patron (önden/arkadan), kamyonet modelleri görüldü; yumruk kombo/bitirici ile robot yenilme animasyonuna geçti (olumT 1.0, canli false).

## Doğrulanmadı
- Patronun sırt pilinin görünürlüğü/konumu (z=-0.95 tahmini; arkadan çekimde bina engelledi) ve patron renk tonu (doku yeşilimsi, tint ile kahverengiye çekildi).
- Şok dalgası hasarı gerçek oyuncuyla (zıplayınca kaçış) ve Punch klibinin etki anı ile hasar zamanı örtüşmesi.
- Gerçek GPU'da performans (swiftshader'da George yüklemesi ~30-40 sn sürdü; gerçekte hızlı). 25 canlı düşmanda çizim çağrısı ölçülmedi (SkinnedMesh başına 2-8 çağrı).
- Kamyonet tekerlek yönü, robot gözü "küçük sarı" eklenmedi (modelin yüzü kullanıldı).
- Dron Enemy_Flying kıvrık kolları/halkası pervane gibi değil, "böcek-robot" görünümlü.
