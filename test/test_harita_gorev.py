#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Harita görev/düşman/araç doğrulaması (gerçek Basınevleri haritası).

Çalıştır: flock /tmp/zifir_test.lock python3 test/test_harita_gorev.py

Başsız Chrome'da oyun açılır; oyun mantığı (sehir/dusman/gorev modülleri) elle adımlanır
(sabit dt, GPU'dan bağımsız). Sayfa iki kez yüklenir: varsayılan ve ?egim=1.
Denetimler:
  - Görev noktaları bina içinde değil, sınır içinde, ulaşılabilir (küre/kedi/halka/patron).
  - Kamyonet yol grafiğinde kalır, bina içine girmez, ilerler.
  - Düşmanlar: takılma oranı, dronların bina içinden geçmesi.
  - Araçlar: kavşakta/arkada üst üste binme, kare başı sıçrama.
  - Eğim: zemin takibi (havada kalma/gömülme yok).
  - Görev zinciri 6 adım baştan sona (bot).
Sonuç RAPOR/harita_gorev_test.json içine de yazılır.
"""
import functools
import http.server
import json
import shutil
import subprocess
import sys
import tempfile
import threading
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_oyun import MiniWebSocket, CDP, bekle, bos_port  # noqa: E402

KOK = Path(__file__).resolve().parent.parent

HAZIR = "!!(window.G?.gorev && window.G?.dusman && window.G?.sehir?.poligon && window.G.t>.3)"

# ---------------------------------------------------------------- sayfa içi testler
PLAN_JS = r"""(async () => {
  const T = G.THREE, S = G.sehir, g = G.gorev, sonuc = [];
  const kontrol = (ad, ok, detay) => sonuc.push({ ad, ok: !!ok, detay });
  const zy = (x, z) => S.zeminY(x, z);
  const kp = S.kapsam;
  const ankrajVar = (x, y, z, r, fark) => S.binalar.some(b => b.y1 >= y - fark && x > b.minx - r && x < b.maxx + r && z > b.minz - r && z < b.maxz + r);
  const TUR = 4; // yeniden üretim sayısı: rastgelelik kapsansın
  let kurSay = 0, kureIc = 0, kureSinir = 0, kureUlas = 0, kureYuk = 0, hucre = new Set(), minUz = 1e9, turSay = { park: 0, cati: 0, hava: 0 };
  for (let t = 0; t < TUR; t++) {
    g.plan.yeniKure();
    const ks = g.plan.kureler(); hucre = new Set();
    kontrol('küre sayısı 60 (tur ' + t + ')', ks.length === 60, ks.length);
    for (const v of ks) {
      kurSay++;
      if (S.binaIcinde(v.x, v.y, v.z, 0) >= 0) kureIc++;
      if (v.x < kp.x0 + 15 || v.x > kp.x1 - 15 || v.z < kp.z0 + 15 || v.z > kp.z1 - 15) kureSinir++;
      const yuk = v.y - zy(v.x, v.z);
      if (yuk < 0.5 || yuk > 16) kureYuk++;
      // ulaşılabilir: yürünüp zıplanabilir (<=4 m) ya da ağ için çevrede yeterli yüksek bina
      if (!(yuk <= 4 || ankrajVar(v.x, v.y, v.z, 26, 3))) kureUlas++;
      hucre.add(Math.floor(v.x / 200) + ',' + Math.floor(v.z / 200));
    }
    for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) minUz = Math.min(minUz, Math.hypot(ks[i].x - ks[j].x, ks[i].z - ks[j].z));
  }
  kontrol('küreler bina içinde değil', kureIc === 0, { kureIc, kurSay });
  kontrol('küreler sınır içinde', kureSinir === 0, { kureSinir });
  kontrol('küre yüksekliği zemine göre 0.5-16 m', kureYuk === 0, { kureYuk });
  kontrol('küreler ulaşılabilir (yürü/zıpla ya da ağ ankrajı)', kureUlas === 0, { kureUlas });
  kontrol('küre yayılımı: >=6 farklı 200 m hücresi', hucre.size >= 6, { hucre: hucre.size });
  kontrol('küreler birbirine >=2 m', minUz >= 2, { minUz });
  g.plan.yeniKure();

  // kedi
  let kediOk = 0, kediIc = 0, kediKenar = 0, kediAd = 0, kediKonum = [];
  for (let t = 0; t < 12; t++) {
    const k = g.plan.yeniKedi(), v = k.konum; if (!k.bina) continue;
    const b = k.bina;
    kediKonum.push([Math.round(v.x), Math.round(v.z)]);
    if (Math.abs(v.y - b.y1) < 0.01 && S.binaIciMi(v.x, v.z, 0) === b) kediOk++;
    if (S.binaIcinde(v.x, v.y + 0.3, v.z, 0) >= 0) kediIc++;
    if (S.sinirNokta(b, v.x, v.z).d < 0.8) kediKenar++;
    if (k.ad) kediAd++;
  }
  kontrol('kedi bir çatının üstünde (poligon içi, y=çatı)', kediOk === 12, { kediOk });
  kontrol('kedi bina hacminin içinde değil', kediIc === 0, { kediIc });
  kontrol('kedi çatı kenarından >=0.8 m içeride', kediKenar === 0, { kediKenar });
  kontrol('kedi görev metni için sokak/bina adı bulunur (>=8/12)', kediAd >= 8, { kediAd });

  // halkalar
  let halkaTamam = 0, halkaYolAdlari = [], hSapma = 0, hIc = 0, hAra = 0, hAnk = 0, hYukPay = 0;
  for (let t = 0; t < 6; t++) {
    const hs = g.plan.yeniHalka(); if (hs.length !== 8) continue;
    halkaTamam++; halkaYolAdlari.push(g.plan.halkaYol());
    for (let i = 0; i < 8; i++) {
      const h = hs[i], R = 5.7, ux = -h.fz, uz = h.fx;
      for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283; if (S.binaIcinde(h.x + ux * Math.cos(a) * R, h.y + Math.sin(a) * R, h.z + uz * Math.cos(a) * R, 0) >= 0) hIc++; }
      if (!ankrajVar(h.x, h.y, h.z, 24, 4)) hAnk++;
      if (h.y - 5.7 < zy(h.x, h.z) + 2) hYukPay++;
      if (i < 7) {
        const n = hs[i + 1], d = Math.hypot(n.x - h.x, n.z - h.z);
        if (d < 15 || d > 80) hAra++;
        for (let q = 1; q < 12; q++) { const f = q / 12; if (S.binaIcinde(h.x + (n.x - h.x) * f, h.y + (n.y - h.y) * f, h.z + (n.z - h.z) * f, 0) >= 0) hSapma++; }
      }
    }
  }
  kontrol('halka rotası 8 halka üretir (6/6)', halkaTamam === 6, { halkaTamam, yollar: [...new Set(halkaYolAdlari)] });
  kontrol('halka çemberi bina içinden geçmez', hIc === 0, { hIc });
  kontrol('halkalar arası doğru bina içinden geçmez', hSapma === 0, { hSapma });
  kontrol('halkalar arası 15-80 m', hAra === 0, { hAra });
  kontrol('halkaya yakın ağ tutunma binası var', hAnk === 0, { hAnk });
  kontrol('halka zeminden yeterince yüksek', hYukPay === 0, { hYukPay });

  // patron alanı
  const pa = g.plan.patronAlani();
  const parkta = pa && g.plan.parkAdi(pa.x, pa.z);
  kontrol('patron alanı: bina içinde değil, geniş (>=25 m boşluk)', pa && !S.binaIciMi(pa.x, pa.z, pa.bosluk - 5) && pa.bosluk >= 25, pa);
  kontrol('patron alanı adlı bir park içinde', !!parkta, { parkta });
  return sonuc;
})()"""

# adım yardımcıları + kamyonet/düşman/araç/zincir
ADIM_JS = r"""(async () => {
  const D = await import('/js/dusman.js'), Gm = await import('/js/gorev.js'), Sh = await import('/js/sehir.js');
  window.__adim = (dt) => { const eski = G.durum; G.durum = 'oyun'; G.t += dt; Sh.guncelle(G, dt); D.guncelle(G, dt); Gm.guncelle(G, dt); G.durum = eski; };
  G.test = false; // ?test=1 otomatik yumruk botunu kapat (ölçümü bozar)
  return true;
})()"""

DUSMAN_JS = r"""(async () => {
  const S = G.sehir, dsm = G.dusman, p = G.oyuncu.konum, egim = !!S.egim, sonuc = [];
  const kontrol = (ad, ok, detay) => sonuc.push({ ad, ok: !!ok, detay });
  const DT = 1 / 30;
  const sok = () => S.rastgeleSokakNoktasi();
  const oyuncuYer = (v) => { p.set(v.x, S.zeminY(v.x, v.z), v.z); };
  // eski düşmanları temizle
  for (const e of dsm.liste) { e.canli = false; e.grup.visible = false; }
  G.durum = 'duraklat';
  const ol = { robotPenc: 0, robotTak: 0, dronKare: 0, dronIc: 0, robotIc: 0, havada: 0, gomulu: 0, kareR: 0, kareD: 0, dronYerAlti: 0, maxSap: 0 };
  async function kos(sn, nav) {
    const pos = new Map(); let sayac = 0;
    dsm.nav = nav;
    for (let k = 0; k < sn / DT; k++) {
      if (k % Math.round(25 / DT) === 0) { // oyuncu yeni bir sokak noktasına ışınlanır
        oyuncuYer(sok());
        for (const e of dsm.liste) if (e.canli && !e.dev) { e.canli = false; e.grup.visible = false; }
        dsm.dogmaCarpani = 6; dsm.robotHedef = 8; dsm.dronHedef = 6;
        // yakında (45-110 m) sokak noktalarına robot yerleştir
        for (let i = 0; i < 8; i++) { for (let d = 0; d < 20; d++) { const v = sok(), r = Math.hypot(v.x - p.x, v.z - p.z); if (r > 45 && r < 110) { dsm.olustur('robot', v); break; } } }
      }
      window.__adim(DT);
      for (const e of dsm.liste) {
        if (!e.canli) continue;
        if (e.tur === 'robot' && !e.dev) {
          ol.kareR++;
          if (!(e.olumT > 0) && e.sal < 0 && !(e.sersem > 0)) {
            if (S.binaIcinde(e.konum.x, e.konum.y + 0.8, e.konum.z, 0.3) >= 0) ol.robotIc++;
            if (!e.vitrin && e.vy === 0) {
              const gy = S.zeminY(e.konum.x, e.konum.z);
              if (e.konum.y - gy > 0.15) ol.havada++; if (gy - e.konum.y > 0.15) ol.gomulu++;
            }
          }
          if (k % 15 === 0) { // 0.5 sn'de bir izle
            const o = pos.get(e); const d = Math.hypot(p.x - e.konum.x, p.z - e.konum.z);
            if (o && o.hp === e.grup.uuid) { o.n++; if (o.n >= 14) { // 7 sn
                const git = Math.hypot(e.konum.x - o.x, e.konum.z - o.z);
                if (d > 8 && git < 1.5 && e.sersem <= 0) ol.robotTak++;
                ol.robotPenc++; o.x = e.konum.x; o.z = e.konum.z; o.n = 0; } }
            else pos.set(e, { x: e.konum.x, z: e.konum.z, n: 0, hp: e.grup.uuid });
          }
        } else if (e.tur === 'dron') {
          ol.kareD++;
          if (S.binaIcinde(e.konum.x, e.konum.y, e.konum.z, 0.2) >= 0) ol.dronIc++;
          if (e.konum.y < S.zeminY(e.konum.x, e.konum.z) + 0.3) ol.dronYerAlti++;
        }
      }
    }
  }
  await kos(150, true);
  const nav = { ...ol };
  kontrol('düşman: 7 sn pencerede takılan robot oranı <= %8 (egim=' + egim + ')', nav.robotPenc > 20 && nav.robotTak / nav.robotPenc <= 0.08, { pencere: nav.robotPenc, takilan: nav.robotTak });
  kontrol('düşman: robot bina hacmi içinde değil', nav.robotIc <= nav.kareR * 0.002, { robotIcKare: nav.robotIc, kareR: nav.kareR });
  kontrol('düşman: dron bina hacmi içinden geçmez', nav.dronIc === 0 && nav.kareD > 300, { dronIcKare: nav.dronIc, kareD: nav.kareD });
  kontrol('düşman: dron yere/çatıya gömülmez (y > zemin+0.3)', nav.dronYerAlti === 0, { dronYerAlti: nav.dronYerAlti });
  kontrol('düşman: robot havada kalmaz / gömülmez (egim=' + egim + ')', nav.havada <= nav.kareR * 0.004 && nav.gomulu <= nav.kareR * 0.004, { havada: nav.havada, gomulu: nav.gomulu, kareR: nav.kareR });
  // karşılaştırma: kaçınma/devriye kapalı (bilgi amaçlı)
  for (const k of Object.keys(ol)) ol[k] = 0;
  await kos(90, false);
  sonuc.push({ ad: 'bilgi: nav kapalı karşılaştırma', ok: true, detay: { pencere: ol.robotPenc, takilan: ol.robotTak, dronIc: ol.dronIc } });
  dsm.nav = true;

  // kamyonet: yol grafiğinde
  for (const e of dsm.liste) { e.canli = false; e.grup.visible = false; }
  const ag = S.yolAgi, Dn = ag.dugumler;
  const yolaUzak = (x, z) => { let en = 1e9; for (const k of ag.kenarlar) { const A = Dn[k.a], B = Dn[k.b]; const dx = B.x - A.x, dz = B.z - A.z, l2 = dx * dx + dz * dz || 1; const u = Math.max(0, Math.min(1, ((x - A.x) * dx + (z - A.z) * dz) / l2)); const d = Math.hypot(x - A.x - dx * u, z - A.z - dz * u) - k.genislik / 2; if (d < en) en = d; } return en; };
  const dugumSay = new Set(); let kSap = 0, kIc = 0, kYol = 0, kHav = 0, kGom = 0, yolSay = new Set(), km = 0, kare = 0, kmMin = 1e9;
  for (let tr = 0; tr < 5; tr++) {
    oyuncuYer(sok());
    const kam = dsm.olustur('kamyonet'); let ox = kam.konum.x, oz = kam.konum.z, kmT = 0;
    for (let k = 0; k < 60 / DT; k++) {
      window.__adim(DT); kam.sersem = 0;
      if (!kam.canli) break;
      kare++;
      kmT += Math.hypot(kam.konum.x - ox, kam.konum.z - oz); ox = kam.konum.x; oz = kam.konum.z;
      if (k % 3 === 0) {
        const u = yolaUzak(kam.konum.x, kam.konum.z); kSap = Math.max(kSap, u);
        if (u > 3.5) kYol++;
        if (S.binaIcinde(kam.konum.x, kam.konum.y + 0.8, kam.konum.z, 0.2) >= 0) kIc++;
        const gy = S.zeminY(kam.konum.x, kam.konum.z); if (kam.konum.y - gy > 0.2 && kam.vy === 0) kHav++; if (gy - kam.konum.y > 0.2) kGom++;
        if (kam.yolAd) yolSay.add(kam.yolAd); dugumSay.add(kam.nA);
      }
    }
    km += kmT; kmMin = Math.min(kmMin, kmT);
    kam.canli = false; kam.grup.visible = false;
  }
  kontrol('kamyonet: 5x60 sn yol grafiğinde kalır (kenardan >3.5 m uzak <=%1)', kYol <= kare / 3 * 0.01, { yolDisiOrnek: kYol, maxSapma: +kSap.toFixed(1), ornek: Math.round(kare / 3) });
  kontrol('kamyonet: bina içine girmez', kIc === 0, { kIc });
  kontrol('kamyonet: her koşuda ilerler (>=300 m / 60 sn) ve birçok kavşaktan geçer (>=6 düğüm)', kmMin >= 300 && dugumSay.size >= 6, { kmMin: Math.round(kmMin), kmToplam: Math.round(km), dugum: dugumSay.size, sokaklar: [...yolSay] });
  kontrol('kamyonet: zemini izler (egim=' + egim + ')', kHav === 0 && kGom === 0, { kHav, kGom });

  // araçlar
  const ar = S.araclar; const eski = ar.map(c => [c.x, c.z]); let sicrama = 0, ust = 0, ornek = 0, dur = 0, havaA = 0, maxSic = 0;
  for (let k = 0; k < 60 / DT; k++) {
    window.__adim(DT);
    ar.forEach((c, i) => {
      const o = eski[i], d = Math.hypot(c.x - o[0], c.z - o[1]); eski[i] = [c.x, c.z];
      if (k > 3) { maxSic = Math.max(maxSic, d); if (d > 12 * DT * 2.2 + 1.0) sicrama++; }
      if (egim) { const y = S.arazi(c.x, c.z); if (Math.abs(c.y - y) > 0.05) havaA++; }
    });
    if (k % 15 === 0) for (let i = 0; i < ar.length; i++) for (let j = i + 1; j < ar.length; j++) {
      const a = ar[i], b = ar[j]; const d = Math.hypot(a.x - b.x, a.z - b.z);
      if (d < 3.0) { const dot = Math.sin(a.yaw) * Math.sin(b.yaw) + Math.cos(a.yaw) * Math.cos(b.yaw); if (dot > -0.5) ust++; }
    }
    ornek++;
  }
  const hiz0 = ar.filter(c => c.vc < 0.3).length;
  kontrol('araç: kare başı sıçrama yok (dönüşte şerit atlama)', sicrama === 0, { sicrama, maxKareHareket: +maxSic.toFixed(2) });
  kontrol('araç: aynı/kesişen yönde 3 m içinde üst üste binme (örnek başına) <= 3', ust <= 3, { ust, durdurulan: hiz0, arac: ar.length });
  if (egim) kontrol('araç: eğimde y=arazi', havaA === 0, { havaA });
  return sonuc;
})()"""

ZINCIR_JS = r"""(async () => {
  const S = G.sehir, g = G.gorev, dsm = G.dusman, p = G.oyuncu.konum, sonuc = [];
  const kontrol = (ad, ok, detay) => sonuc.push({ ad, ok: !!ok, detay });
  const DT = 1 / 30;
  for (const e of dsm.liste) { e.canli = false; e.grup.visible = false; }
  const bekle = (n) => { for (let i = 0; i < n; i++) window.__adim(DT); };
  const yerlestir = (v, dy = 0) => { p.set(v.x, v.y + dy, v.z); };
  const adimlar = [];
  // 0 küreler
  g.testBaslat(0); const adlar = [];
  adlar.push(g.aktif.aciklama);
  let sayac = 0;
  for (let i = 0; i < 40 && g.idx === 0; i++) { const ks = g.plan.kureler(); const k = ks[0]; yerlestir(k, -0.9); bekle(2); sayac++; }
  adimlar.push(['küreler', g.idx === 1, sayac + ' küre']);
  // 1 kedi
  adlar.push(g.aktif.aciklama);
  const kd = g.plan.kedi(); yerlestir(kd.konum, 0); bekle(10);
  adimlar.push(['kedi', g.idx === 2, kd.ad]);
  // 2 robotlar
  adlar.push(g.aktif.aciklama);
  for (let i = 0; i < 40 && g.idx === 2; i++) { G.olay.emit('robotYenildi', { konum: p.clone(), tur: 'robot', dev: false }); bekle(2); }
  adimlar.push(['robotlar (olay)', g.idx === 3, '']);
  // 3 halkalar
  adlar.push(g.aktif.aciklama);
  const hs = g.plan.halkalar(); let hn = 0;
  for (let i = 0; i < 12 && g.idx === 3; i++) { const h = hs[Math.min(7, g.aktif.ilerleme)]; yerlestir(h, 0); bekle(2); hn++; }
  adimlar.push(['halkalar', g.idx === 4, hn + ' adım ' + g.plan.halkaYol()]);
  // 4 kamyonet
  adlar.push(g.aktif.aciklama);
  const kam = dsm.liste.find(e => e.tur === 'kamyonet' && e.canli);
  let vurus = 0;
  for (let i = 0; i < 80 && kam && kam.canli; i++) { const y = new G.THREE.Vector3(0, 0, 1); p.set(kam.konum.x, kam.konum.y, kam.konum.z - 1.5); G.olay.emit('yumruk', { konum: p.clone(), yon: y, guc: 1 }); vurus++; bekle(1); }
  bekle(5);
  adimlar.push(['kamyonet (gerçek yumruk olayı)', g.idx === 5, vurus + ' yumruk']);
  // 5 patron
  adlar.push(g.aktif.aciklama);
  const pt = dsm.liste.find(e => e.dev && e.canli);
  const pa = g.plan.patronAlani();
  const patronOk = pt && Math.hypot(pt.konum.x - pa.x, pt.konum.z - pa.z) < 1 && !S.binaIciMi(pt.konum.x, pt.konum.z, 20);
  if (pt) { pt.can = 0; dsm.kaldir(pt); } bekle(5);
  adimlar.push(['patron (açık alanda doğdu, yenildi olarak işaretlendi)', g.idx === 0 && patronOk, pa.ad]);
  for (const [ad, ok, d] of adimlar) kontrol('zincir: ' + ad, ok, d);
  kontrol('zincir: görev açıklamaları gerçek yer adı içerir (>=3)', adlar.filter(a => /(Sokak|Cadde|Park|Bulvar)/.test(a || '')).length >= 3, adlar);
  return sonuc;
})()"""

MINI_JS = r"""(async () => {
  const A = await import('/js/arayuz.js');
  G.durum = 'oyun'; A.guncelle(G, 1 / 60);
  const c = document.querySelector('#arayuz .mini canvas'); if (!c) return [{ ad: 'mini harita canvas', ok: false, detay: 'yok' }];
  const x = c.getContext('2d'), S = c.width;
  const veri = x.getImageData(0, 0, S, S).data; let renkli = 0, yesil = 0;
  for (let i = 0; i < veri.length; i += 16) { if (veri[i] + veri[i + 1] + veri[i + 2] > 150) renkli++; if (veri[i + 1] > veri[i] + 30 && veri[i + 1] > veri[i + 2]) yesil++; }
  G.durum = 'duraklat';
  return [{ ad: 'mini harita çizildi (bina/yol pikselleri)', ok: renkli > 200, detay: { renkli, yesil } }];
})()"""


def calistir():
    class Sessiz(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    sunucu = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Sessiz, directory=str(KOK)))
    threading.Thread(target=sunucu.serve_forever, daemon=True).start()
    port = bos_port()
    tum = []
    with tempfile.TemporaryDirectory(prefix="zifir-hg-") as profil:
        chrome = subprocess.Popen([shutil.which("google-chrome"), "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", f"--remote-debugging-port={port}", "--remote-allow-origins=*", f"--user-data-dir={profil}", "--window-size=1280,720", "--no-first-run", "--disable-dev-shm-usage", "--mute-audio", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        ws = None
        try:
            def hedef():
                with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list", timeout=2) as r:
                    return next((h for h in json.load(r) if h.get("type") == "page"), None)
            h = bekle(hedef, 25)
            if not h:
                raise RuntimeError("Chrome CDP açılamadı")
            ws = MiniWebSocket(h["webSocketDebuggerUrl"], timeout=900)
            c = CDP(ws)
            c.komut("Page.enable"); c.komut("Runtime.enable")
            for etiket, sorgu in (("varsayılan", ""), ("egim=1", "&egim=1")):
                c.komut("Page.navigate", {"url": f"http://127.0.0.1:{sunucu.server_port}/?test=1{sorgu}"})
                if not bekle(lambda: c.degerlendir(HAZIR), 120):
                    raise RuntimeError("Oyun yüklenemedi: " + etiket)
                c.degerlendir(ADIM_JS, promise=True)
                bolumler = [("plan", PLAN_JS), ("düşman/kamyonet/araç", DUSMAN_JS), ("zincir", ZINCIR_JS), ("mini harita", MINI_JS)]
                if sorgu:
                    bolumler = [("düşman/kamyonet/araç", DUSMAN_JS), ("zincir", ZINCIR_JS)]
                for ad, js in bolumler:
                    for s in c.degerlendir(js, promise=True) or []:
                        s["ad"] = f"[{etiket}] {s['ad']}"
                        tum.append(s)
                        print(("GEÇTİ " if s["ok"] else "KALDI ") + s["ad"] + " " + json.dumps(s.get("detay"), ensure_ascii=False)[:300])
                hata = c.degerlendir("JSON.stringify(window.__ZIFIR_HATALAR||[])")
                s = {"ad": f"[{etiket}] oyun hata listesi boş", "ok": hata == "[]", "detay": hata[:300]}
                tum.append(s); print(("GEÇTİ " if s["ok"] else "KALDI ") + s["ad"] + " " + str(s["detay"]))
        finally:
            if ws:
                ws.kapat()
            chrome.terminate()
            try:
                chrome.wait(timeout=8)
            except subprocess.TimeoutExpired:
                chrome.kill(); chrome.wait()
            sunucu.shutdown(); sunucu.server_close()
    return tum


def main():
    tum = calistir()
    (KOK / "RAPOR" / "harita_gorev_test.json").write_text(json.dumps(tum, ensure_ascii=False, indent=1) + "\n")
    gecen = sum(1 for s in tum if s["ok"])
    print(f"\n{gecen}/{len(tum)} geçti")
    return 0 if gecen == len(tum) else 1


if __name__ == "__main__":
    raise SystemExit(main())
