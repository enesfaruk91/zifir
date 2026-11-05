// Hareket, dokunaç fiziği ve omuz kamerası. Konum ayak tabanıdır.
const durumlar = new WeakMap();
const RAD = Math.PI / 180;
const sinirla = (v, a, b) => Math.max(a, Math.min(b, v));
const yumusak = (k, dt) => 1 - Math.exp(-k * dt);

export function kur(G) {
  const T = G.THREE;
  const v = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
  const sanal = [];
  for (let i = 0; i < 20; i++) {
    // Açık koridor: ilk sallanışın önüne görünmez bir duvar koyma.
    const sira = Math.floor(i / 2);
    const x = (i % 2 ? -1 : 1) * 25;
    const z = (sira < 5 ? -(sira + 1) : sira - 4) * 36;
    const gx = 13 + (i % 3) * 3, gz = 14 + (i % 2) * 4;
    const h = 83 + (i % 5) * 9;
    sanal.push({ x, z, gx, gz, h, kutu: new T.Box3(v(x - gx / 2, 0, z - gz / 2), v(x + gx / 2, h, z + gz / 2)) });
  }
  const s = {
    T, v, sanal, yaw: 0, pitch: 8 * RAD, roll: 0,
    ileri: v(0, 0, -1), sag: v(1, 0, 0), bakis: v(), istek: v(),
    ankraj: null, cek: null, cekHiz: 0, fareKilit: false, halat: 0, tekrar: 0, duvar: null, duvarBekle: 0,
    zip: null, zipBekle: 0, ziplamalar: 1, ziplamaTampon: 0, sonZemin: 0,
    devSure: 0, hasarSure: 0, dogusSure: 0, olmeSure: 0,
    saldiriSure: 0, saldiri: null, yumrukBekle: 0, atisBekle: 0, atisSayi: 0, atisEl: 0, kamciBekle: 0,
    kamciSure: 0, kamciHedef: null, zaman: 0, sallanma: 0, maxHiz: 0, rapor: false,
    kameraHazir: false, kameraHedef: v(), kameraKonum: v(),
    ray: new T.Ray(), rayNokta: v(), q: new T.Quaternion(), yukari: v(0, 1, 0),
    // His: el değişimi, salınım, takla, kombo, kaçış
    el: 0, elAd: 'sag', swingT: 0, nefes: 0, takla: 0, taklaSure: 0.7, taklaEks: 'x', taklaYon: 1, trickBekle: 0, yuvarlan: 0,
    sapan: null, yonZorla: 0, yonHedef: null, sonYon: null, komboNo: -1, zincir: 0, komboSayi: 0, komboReset: 0, vurusGecikme: null, lunge: null, dovus: 0,
    kacisSure: 0, kacisBekle: 0, tehlikeSure: 0, tehdit: null, yonQ: new T.Quaternion(), q2: new T.Quaternion(), q3: new T.Quaternion(),
    bakisOfs: v(), ofsT: v(), eksenX: v(1, 0, 0), eksenZ: v(0, 0, 1), anlik: v()
  };
  const p = G.oyuncu = {
    konum: v(), hiz: v(), yerde: false, durum: 'dus', can: 100, canMax: 100,
    guc: 0, gucMax: 100, dev: false, nisanVar: false, nisanNokta: null, nisanHedef: null, nisanAktif: false,
    get yaw() { return s.yaw; }, set yaw(d) { if (Number.isFinite(d)) s.yaw = d; },
    get pitch() { return s.pitch; }, set pitch(d) { if (Number.isFinite(d)) s.pitch = d; },
    get ankraj() { return s.ankraj; },
    tehlike: false,
    get komboSayi() { return s.komboSayi; },
    get sallanSayisi() { return s.sallanma; },
    hasarAl(miktar, kaynakKonum) {
      if (s.kacisSure > 0) return;
      if (G.durum !== 'oyun' || s.olmeSure > 0 || s.hasarSure > 0 || !Number.isFinite(miktar) || miktar <= 0) return;
      const hasar = miktar * (p.dev ? 0.5 : 1);
      p.can = Math.max(0, p.can - hasar);
      s.hasarSure = 0.65;
      olay(G, 'hasar', { miktar: hasar, kaynakKonum: kaynakKonum && sonlu(kaynakKonum) ? kaynakKonum.clone() : null });
      if (kaynakKonum && sonlu(kaynakKonum)) {
        const itme = p.konum.clone().sub(kaynakKonum); itme.y = 0;
        if (itme.lengthSq() > 0.001) p.hiz.addScaledVector(itme.normalize(), 5);
        p.hiz.y = Math.max(p.hiz.y, 3);
      }
      if (!p.can) {
        sallanBit(G, s, false); s.zip = null; s.duvar = null;
        s.olmeSure = 2; p.hiz.set(0, 0, 0); p.durum = 'dogus';
        if (p.dev) devBit(G, s);
        olay(G, 'yenildi');
      }
    },
    gucEkle(m) { if (Number.isFinite(m)) p.guc = sinirla(p.guc + m, 0, p.gucMax); },
    isinla(nokta) {
      if (!sonlu(nokta)) return;
      sallanBit(G, s, false); s.zip = null; s.duvar = null;
      p.konum.copy(nokta); p.hiz.set(0, 0, 0); p.yerde = false;
      s.ziplamalar = 1; s.kameraHazir = false;
      s.sonZemin = 0; s.ziplamaTampon = 0; s.kamciSure = 0; s.kamciHedef = null;
      G.kahraman?.dokunac?.('kamci', null, null);
    }
  };
  durumlar.set(G, s);
  s.wheel = 0;
  if (typeof window !== 'undefined') window.addEventListener('wheel', e => { if (durumlar.get(G) === s && e.deltaY) s.wheel = Math.sign(e.deltaY); }, { passive: true });
  const dogma = G.sehir?.rastgeleCati?.();
  p.konum.copy(sonlu(dogma) ? dogma : v(0, 60, 0));
  kamera(G, s, 1 / 60);
  kahraman(G, s, 0);
}

function sonlu(v) { return v && Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z); }
function olay(G, ad, veri) { G.olay?.emit?.(ad, veri); }
function binalar(G, s) { return G.sehir ? (G.sehir.binalar || []) : s.sanal; }
function kutu(b, s) {
  if (b.kutu?.min && b.kutu?.max) return b.kutu;
  if (![b.x, b.z, b.gx, b.gz, b.h].every(Number.isFinite)) return null;
  return new s.T.Box3(s.v(b.x - b.gx / 2, 0, b.z - b.gz / 2), s.v(b.x + b.gx / 2, b.h, b.z + b.gz / 2));
}
function normalBul(k, n, s) {
  const yuzler = [
    [Math.abs(n.x - k.min.x), -1, 0, 0], [Math.abs(n.x - k.max.x), 1, 0, 0],
    [Math.abs(n.y - k.min.y), 0, -1, 0], [Math.abs(n.y - k.max.y), 0, 1, 0],
    [Math.abs(n.z - k.min.z), 0, 0, -1], [Math.abs(n.z - k.max.z), 0, 0, 1]
  ];
  yuzler.sort((a, b) => a[0] - b[0]);
  return s.v(...yuzler[0].slice(1));
}
function isin(G, s, bas, yon, mesafe) {
  if (G.sehir?.ankrajBul) {
    const sonuc = G.sehir.ankrajBul(bas, yon, mesafe);
    return sonuc && sonlu(sonuc.nokta) ? { nokta: sonuc.nokta.clone(), normal: sonuc.normal?.clone?.() || s.v(0, 1, 0) } : null;
  }
  s.ray.set(bas, yon);
  let en = mesafe, sonuc = null;
  for (const b of binalar(G, s)) {
    const k = kutu(b, s);
    if (!k || !s.ray.intersectBox(k, s.rayNokta)) continue;
    const d = bas.distanceTo(s.rayNokta);
    if (d > 0.05 && d <= en) {
      en = d; sonuc = { nokta: s.rayNokta.clone(), normal: normalBul(k, s.rayNokta, s), bina: b };
    }
  }
  return sonuc;
}
function ankrajBul(G, s) {
  const p = G.oyuncu;
  const bas = p.konum.clone().add(s.v(0, 1.3, 0));
  const aci = sinirla(s.pitch + 25 * RAD, -30 * RAD, 85 * RAD);
  const yon = s.v(-Math.sin(s.yaw) * Math.cos(aci), Math.sin(aci), -Math.cos(s.yaw) * Math.cos(aci));
  const dogrudan = isin(G, s, bas, yon, 60 * (p.dev ? 1.3 : 1));
  if (dogrudan && dogrudan.nokta.y > p.konum.y + 1.5 && dogrudan.nokta.distanceTo(bas) >= 8) return dogrudan;
  let en = 60, secim = null;
  const cos = Math.cos(35 * RAD);
  for (const b of binalar(G, s)) {
    const k = kutu(b, s); if (!k) continue;
    const dx = Math.max(k.min.x - bas.x, 0, bas.x - k.max.x);
    const dz = Math.max(k.min.z - bas.z, 0, bas.z - k.max.z);
    if (dx * dx + dz * dz > en * en || k.max.y < p.konum.y + 2 || k.max.y > bas.y + en) continue;
    const xs = [k.min.x, k.max.x], zs = [k.min.z, k.max.z];
    const adaylar = [];
    for (const x of xs) for (const z of zs) adaylar.push(s.v(x, k.max.y, z));
    const x = sinirla(bas.x, k.min.x, k.max.x), z = sinirla(bas.z, k.min.z, k.max.z);
    adaylar.push(s.v(x, k.max.y, k.min.z), s.v(x, k.max.y, k.max.z), s.v(k.min.x, k.max.y, z), s.v(k.max.x, k.max.y, z));
    for (const nokta of adaylar) {
      const fark = nokta.clone().sub(bas), d = fark.length();
      if (d < 8 || d > en || nokta.y < p.konum.y + 2 || fark.dot(yon) / d < cos) continue;
      const engel = isin(G, s, bas, fark.divideScalar(d), d - 0.3);
      if (engel && bas.distanceTo(engel.nokta) < d - 1) continue;
      en = d; secim = { nokta, normal: s.v(0, 1, 0), bina: b };
    }
  }
  return secim;
}
function elSec(s) { s.el ^= 1; s.elAd = s.el ? 'sol' : 'sag'; s.swingT = 0; }
// Salınım ankrajı: hareket yönü boyunca 18-35 m ileride, 15-30 m yukarıda, sıradaki elin yanında.
// taraf: -1 sol, +1 sağ (yan açı 20-50°), 0 tam ileri; sev: 0 sıkı, 1 gevşek, 2 geniş koni.
const SEV = [
  { f: [18, 35], u: [15, 30], a: [20, 50], a0: 15 },
  { f: [15, 42], u: [12, 35], a: [10, 65], a0: 25 },
  { f: [15, 45], u: [12, 40], a: [0, 80], a0: 80 }
];
function salinimYon(G, s) {
  const p = G.oyuncu, yon = s.v(p.hiz.x, 0, p.hiz.z);
  if (yon.length() >= 5) yon.normalize(); else yon.copy(s.ileri);
  return yon;
}
function salinimHedefBul(G, s, taraf = 0, sev = 0) {
  const p = G.oyuncu, bas = p.konum.clone().add(s.v(0, 1.3, 0)), yon = salinimYon(G, s);
  const sg = s.v(-yon.z, 0, yon.x), S = SEV[sev], menzil = 60 * (p.dev ? 1.3 : 1);
  const adaylar = [];
  for (const b of binalar(G, s)) {
    const k = kutu(b, s); if (!k) continue;
    if (k.max.y < bas.y + S.u[0]) continue;
    const dx = Math.max(k.min.x - bas.x, 0, bas.x - k.max.x), dz = Math.max(k.min.z - bas.z, 0, bas.z - k.max.z);
    if (dx * dx + dz * dz > 50 * 50) continue;
    const cx = (k.min.x + k.max.x) / 2, cz = (k.min.z + k.max.z) / 2;
    const xs = [], zs = [];
    const noktalar = [[k.min.x, k.min.z], [k.max.x, k.min.z], [k.min.x, k.max.z], [k.max.x, k.max.z]];
    for (const f of [20, 26, 32]) for (const aa of (taraf ? [taraf * 35 * RAD] : [0])) {
      const tx = bas.x + (yon.x * Math.cos(aa) + sg.x * Math.sin(aa)) * f, tz = bas.z + (yon.z * Math.cos(aa) + sg.z * Math.sin(aa)) * f;
      noktalar.push([sinirla(tx, k.min.x, k.max.x), sinirla(tz, k.min.z, k.max.z)]);
      noktalar.push([sinirla(tx, k.min.x, k.max.x), tz < cz ? k.min.z : k.max.z], [tx < cx ? k.min.x : k.max.x, sinirla(tz, k.min.z, k.max.z)]);
    }
    for (const [x, z] of noktalar) {
      const ox0 = x <= k.min.x + 1e-6 ? -1 : x >= k.max.x - 1e-6 ? 1 : 0, oz0 = z <= k.min.z + 1e-6 ? -1 : z >= k.max.z - 1e-6 ? 1 : 0;
      if (!ox0 && !oz0) continue;
      const ol = Math.hypot(ox0, oz0), ax = x + ox0 / ol * 1.8, az = z + oz0 / ol * 1.8;
      const fx = ax - bas.x, fz = az - bas.z, f = fx * yon.x + fz * yon.z, yan = fx * sg.x + fz * sg.z;
      if (f < S.f[0] || f > S.f[1]) continue;
      const ang = Math.atan2(Math.abs(yan), f) / RAD;
      if (taraf) { if (yan * taraf <= 0 || ang < S.a[0] || ang > S.a[1]) continue; }
      else if (ang > S.a0) continue;
      for (const uh of [15, 22, 28]) {
        const ay = Math.min(bas.y + uh, k.max.y), u = ay - bas.y;
        if (u < S.u[0] || u > S.u[1]) continue;
        if (Math.hypot(fx, fz, u) > menzil) continue;
        const skor = Math.abs(f - 26) / 8 + Math.abs(u - 22) / 7 + (taraf ? Math.abs(ang - 35) / 15 : ang / 15);
        adaylar.push({ skor, x: ax, y: ay, z: az, f, u });
      }
    }
  }
  adaylar.sort((a, b) => a.skor - b.skor);
  for (let i = 0; i < Math.min(14, adaylar.length); i++) {
    const a = adaylar[i], fx = a.x - bas.x, fy = a.y - bas.y, fz = a.z - bas.z, d = Math.hypot(fx, fy, fz);
    const e = isin(G, s, bas, s.v(fx / d, fy / d, fz / d), d - 0.3);
    if (e && bas.distanceTo(e.nokta) < d - 1.5) continue;
    return { nokta: s.v(a.x, a.y, a.z), normal: s.v(0, 1, 0), taraf, yon: yon.clone() };
  }
  return null;
}
// Sıradaki el, diğer el, tam ileri; sıkıdan gevşeğe, en sonda geniş koni.
function salinimSec(G, s) {
  const tr = (s.el ^ 1) ? -1 : 1;
  for (const sev of [0, 1]) for (const t of [tr, -tr, 0]) { const h = salinimHedefBul(G, s, t, sev); if (h) return h; }
  return salinimHedefBul(G, s, 0, 2);
}
function sallanBasla(G, s, hedef) {
  const p = G.oyuncu;
  s.ankraj = hedef.nokta.clone();
  s.halat = Math.max(8, p.konum.clone().add(s.v(0, 1.3, 0)).distanceTo(s.ankraj));
  s.sYon = (hedef.yon || s.ileri).clone();
  if (hedef.taraf) { s.el = hedef.taraf < 0 ? 1 : 0; s.elAd = s.el ? 'sol' : 'sag'; s.swingT = 0; } else elSec(s);
  s.duvar = null; s.sallanma++;
  const yerdeydi = p.yerde;
  if (yerdeydi) { p.hiz.y = Math.max(p.hiz.y, 9); p.hiz.x += s.sYon.x * 6; p.hiz.z += s.sYon.z * 6; p.yerde = false; s.ziplamalar = 1; }
  else { const ih = p.hiz.dot(s.sYon); if (ih < 7) p.hiz.addScaledVector(s.sYon, 7 - ih); }
  s.sal = { el: s.elAd, ileri: hedef.nokta.clone().sub(p.konum).dot(s.sYon), yukari: hedef.nokta.y - p.konum.y - 1.3, ip0: s.halat, ipMin: s.halat, ipMax: s.halat, altYer: 1e9, maxHiz: 0, yer: yerdeydi };
  olay(G, 'sallanBasla');
}
// Çift ağ sapanı: iki yandaki binaya aynı anda ağ, 0.35 sn gerilme, sonra ileri-yukarı fırlatma.
function sapanBasla(G, s) {
  const p = G.oyuncu;
  const sol = salinimHedefBul(G, s, -1), sag = salinimHedefBul(G, s, 1);
  if (!sol || !sag) return false;
  sallanBit(G, s, false); s.cek = null; s.duvar = null;
  s.sapan = { sol: sol.nokta.clone(), sag: sag.nokta.clone(), sure: 0, yon: s.ileri.clone() };
  const m = sol.nokta.clone().add(sag.nokta).multiplyScalar(0.5).sub(p.konum); m.y = 0;
  if (m.lengthSq() > 1) s.sapan.yon.copy(m.normalize());
  p.hiz.set(0, 0, 0); bakHedef(s, p.konum.clone().add(s.sapan.yon));
  s.fareKilit = false;
  return true;
}
function sapanGuncelle(G, s, dt) {
  const p = G.oyuncu, sp = s.sapan; sp.sure += dt;
  p.hiz.set(0, 0, 0);
  p.konum.addScaledVector(sp.yon, -2.5 * dt);          // geriye gerilme
  s.yonZorla = 0.5; s.yonHedef = p.konum.clone().add(sp.yon);
  kapsulDuzelt(G, s);
  if (sp.sure < 0.35) return;
  const a = 35 * RAD;
  p.hiz.copy(sp.yon).multiplyScalar(35 * Math.cos(a)); p.hiz.y = 35 * Math.sin(a);
  p.yerde = false; s.ziplamalar = 1; s.sonZemin = 0; s.sapan = null; s.swingT = 0;
  s.sapanSayi = (s.sapanSayi || 0) + 1;
  if (G.test) console.log(`[OYUNCU] sapan ${s.sapanSayi}`);
  olay(G, 'sapan');
  G.efekt?.sars?.(0.3, 0.3); G.efekt?.yavasCekim?.(0.7, 0.2);
}
function salRapor(G, s) {
  const r = s.sal, p = G.oyuncu;
  r.ipMin = Math.min(r.ipMin, s.halat); r.ipMax = Math.max(r.ipMax, s.halat);
  r.altYer = Math.min(r.altYer, p.konum.y - zemin(G, s, p.konum, p.konum.y));
  r.maxHiz = Math.max(r.maxHiz, p.hiz.length());
}
function sallanBit(G, s, firlat) {
  const cekti = false;
  s.cek = null;
  if (!s.ankraj) return;
  if (s.sal) {
    const r = s.sal; s.sal = null;
    s.salSon = r;
    if (G.test) console.log(`[SALINIM] el=${r.el} ankrajIleri=${r.ileri.toFixed(1)}m ankrajYukari=${r.yukari.toFixed(1)}m ipUzunluk=${r.ip0.toFixed(2)} (min ${r.ipMin.toFixed(2)} max ${r.ipMax.toFixed(2)}) altNoktaYer=${r.altYer.toFixed(1)}m maxHiz=${r.maxHiz.toFixed(1)} sure=${s.swingT.toFixed(1)} son=${s.otoBirak ? 'oto' : firlat ? 'birak' : 'diger'}${r.yer ? ' yerden' : ''}`);
  }
  const p = G.oyuncu;
  // Tepe/ileri noktada bırakış: ankrajın ilerisinde, yükselirken, hızlı.
  let muk = false;
  if (firlat && !cekti && s.swingT > 0.4) {
    // Cömert pencere: alt noktayı geçmiş, yukarı-ileri giderken ve hızlıyken.
    const ip = p.konum.clone().sub(s.ankraj), d = ip.length() || 1; ip.divideScalar(d);
    const onde = ip.x * p.hiz.x + ip.z * p.hiz.z;
    muk = onde > 0 && p.hiz.y > 0 && p.hiz.length() >= 18;
  }
  s.ankraj = null;
  if (firlat) p.hiz.y += 4;
  if (muk) {
    p.hiz.multiplyScalar(1.15); p.hiz.y += 2.5;
    if (p.hiz.length() > 62) p.hiz.setLength(62);
    G.efekt?.yavasCekim?.(0.6, 0.25);
    s.mukSayi = (s.mukSayi || 0) + 1;
    if (G.test) console.log(`[OYUNCU] mukemmelBirakis ${s.mukSayi}`);
    olay(G, 'mukemmelBirakis', { hiz: p.hiz.length() });
  }
  G.kahraman?.dokunac?.('sag', null, null);
  G.kahraman?.dokunac?.('sol', null, null);
  olay(G, 'sallanBit');
}
function devBit(G, s) {
  s.devSure = 0; G.oyuncu.dev = false;
  G.kahraman?.devOl?.(false); olay(G, 'devBit');
}
function yakinBina(G, s, pos, pay = 1.8) {
  for (const b of binalar(G, s)) {
    const k = kutu(b, s); if (!k) continue;
    if (pos.x >= k.min.x - pay && pos.x <= k.max.x + pay && pos.z >= k.min.z - pay && pos.z <= k.max.z + pay && pos.y <= k.max.y + 3) return { b, k };
  }
  return null;
}
// Süre mesafeye göre: ease-out kare: tepe hız ~2x ortalama (~70 m/s), en az 0.25 sn.
function zipSure(m) { return Math.max(0.25, m / 35); }
function zipBasla(G, s, hedef) {
  const p = G.oyuncu, son = hedef.nokta.clone();
  const n = hedef.normal || s.v(0, 1, 0);
  const bina = yakinBina(G, s, son, 0.5);
  if (bina && son.y >= bina.k.max.y - 3) {
    son.x = sinirla(son.x, bina.k.min.x + 1, bina.k.max.x - 1);
    son.z = sinirla(son.z, bina.k.min.z + 1, bina.k.max.z - 1);
    son.y = bina.k.max.y + 0.05;
  } else if (n.y > 0.5) son.y += 0.05;
  else { son.addScaledVector(n, 0.85); son.y -= 0.9; }
  sallanBit(G, s, false); s.duvar = null; bakHedef(s, son);
  s.zip = { bas: p.konum.clone(), son, sure: 0, once: p.konum.clone(), yuksel: !!bina && son.y >= bina.k.max.y, toplam: zipSure(p.konum.distanceTo(son)) };
  s.zipBekle = 0.5; p.yerde = false;
  olay(G, 'zip');
}
function zipIlerle(G, s, aday) {
  const p = G.oyuncu, yol = aday.clone().sub(p.konum), mesafe = yol.length();
  if (mesafe < 0.00001) return false;
  yol.divideScalar(mesafe);
  let izin = mesafe;
  // Kapsülü AABB üzerinde genişleterek hızlı zip sırasında tünellemeyi önle.
  for (const b of binalar(G, s)) {
    const k = kutu(b, s); if (!k) continue;
    const genis = k.clone();
    genis.min.x -= 0.45; genis.max.x += 0.45;
    genis.min.z -= 0.45; genis.max.z += 0.45;
    genis.min.y -= 1.8;
    if (genis.containsPoint(p.konum)) continue;
    s.ray.set(p.konum, yol);
    if (s.ray.intersectBox(genis, s.rayNokta)) izin = Math.min(izin, Math.max(0, p.konum.distanceTo(s.rayNokta) - 0.04));
  }
  // Şehir ışını AABB dışındaki köprü, lamba ve benzeri yüzeyleri de kapsar.
  if (G.sehir?.ankrajBul) {
    for (const ofset of [[0, 0.05, 0], [0, 0.95, 0], [0, 1.8, 0], [0.45, 0.95, 0], [-0.45, 0.95, 0], [0, 0.95, 0.45], [0, 0.95, -0.45]]) {
      const bas = p.konum.clone().add(s.v(...ofset));
      const hit = isin(G, s, bas, yol, mesafe);
      if (hit) izin = Math.min(izin, Math.max(0, bas.distanceTo(hit.nokta) - 0.05));
    }
  }
  p.konum.addScaledVector(yol, izin);
  return izin < mesafe - 0.0001;
}
// Zifir dikey kapsül: ayak, bel, baş küreleri. Konum ayak tabanıdır (dev: x1.6).
function kapsulOlcu(p) { const sc = p.dev ? 1.6 : 1, r = 0.45 * sc, h = 1.9 * sc; return { r, h, ofs: [r, h / 2, h - r] }; }
// Kapsülü şehir collider'larından çıkarır; yatay duvar normallerini toplayıp döndürür.
const _kn = { x: 0, z: 0, yukari: false, asagi: false, vurdu: false };
function kapsulDuzelt(G, s) {
  _kn.x = 0; _kn.z = 0; _kn.yukari = false; _kn.asagi = false; _kn.vurdu = false;
  const sh = G.sehir; if (!sh?.carpis) return _kn;
  const p = G.oyuncu, { r, ofs } = kapsulOlcu(p), m = s.m1 || (s.m1 = s.v());
  for (let tur = 0; tur < 3; tur++) {
    let degisti = false;
    for (const o of ofs) {
      m.copy(p.konum); m.y += o;
      const hit = sh.carpis(m, r);
      if (!hit || !hit.normal || !sonlu(hit.duzeltme) || hit.duzeltme.lengthSq() < 1e-10) continue;
      p.konum.add(hit.duzeltme); degisti = true; _kn.vurdu = true;
      const n = hit.normal;
      if (Math.abs(n.y) < 0.7) { _kn.x += n.x; _kn.z += n.z; }
      else if (n.y >= 0.7) _kn.yukari = true; else _kn.asagi = true;
    }
    if (!degisti) break;
  }
  return _kn;
}
// ---- Yüksek ağ hedefi: bakılan binanın çatı kenarı, yoksa ±40° konide en uygun yüksek kenar ----
function yuksekHedefBul(G, s) {
  const p = G.oyuncu, bas = p.konum.clone().add(s.v(0, 1.3, 0));
  const cp = Math.cos(s.pitch);
  const bx = -Math.sin(s.yaw) * cp, by = Math.sin(s.pitch), bz = -Math.cos(s.yaw) * cp;
  const minY = p.konum.y + 10, MAXD = 95;
  const bak = s.v(bx, by, bz);
  // 1) doğrudan bakılan duvarın çatı kenarı
  const h = isin(G, s, bas, bak, MAXD);
  if (h && Math.abs(h.normal.y) < 0.5) {
    const yb = yakinBina(G, s, h.nokta, 0.5);
    if (yb && yb.k.max.y >= minY) {
      const k = yb.k, nokta = s.v(sinirla(h.nokta.x, k.min.x, k.max.x), k.max.y, sinirla(h.nokta.z, k.min.z, k.max.z));
      return { nokta, normal: s.v(0, 1, 0), k, ust: k.max.y };
    }
  }
  // 2) koni araması
  const cos = Math.cos(40 * RAD), adaylar = [];
  for (const b of binalar(G, s)) {
    const k = kutu(b, s); if (!k || k.max.y < minY) continue;
    const dx = Math.max(k.min.x - bas.x, 0, bas.x - k.max.x), dz = Math.max(k.min.z - bas.z, 0, bas.z - k.max.z);
    if (dx * dx + dz * dz > MAXD * MAXD) continue;
    const y = k.max.y, cx = sinirla(bas.x, k.min.x, k.max.x), cz = sinirla(bas.z, k.min.z, k.max.z);
    const mx = (k.min.x + k.max.x) / 2, mz = (k.min.z + k.max.z) / 2;
    const pts = [[k.min.x, k.min.z], [k.max.x, k.min.z], [k.min.x, k.max.z], [k.max.x, k.max.z],
      [mx, k.min.z], [mx, k.max.z], [k.min.x, mz], [k.max.x, mz], [cx, k.min.z], [cx, k.max.z], [k.min.x, cz], [k.max.x, cz]];
    for (const [x, z] of pts) {
      const fx = x - bas.x, fy = y - bas.y, fz = z - bas.z, d = Math.hypot(fx, fy, fz);
      if (d < 6 || d > MAXD) continue;
      const c = (fx * bx + fy * by + fz * bz) / d; if (c < cos) continue;
      adaylar.push({ skor: Math.acos(Math.min(1, c)) / RAD + d * 0.12, x, y, z, d, k });
    }
  }
  adaylar.sort((a, b) => a.skor - b.skor);
  for (let i = 0; i < Math.min(8, adaylar.length); i++) {
    const a = adaylar[i], yon = s.v(a.x - bas.x, a.y - bas.y, a.z - bas.z).divideScalar(a.d);
    const e = isin(G, s, bas, yon, a.d);
    if (e && bas.distanceTo(e.nokta) < a.d - 2.5) continue;
    return { nokta: s.v(a.x, a.y, a.z), normal: s.v(0, 1, 0), k: a.k, ust: a.k.max.y };
  }
  return null;
}
function zemin(G, s, pos, onceY) {
  let y = 0;
  const ust = G.sehir?.zeminY?.(pos.x, pos.z);
  if (Number.isFinite(ust) && onceY >= ust - 0.3) y = Math.max(y, ust);
  for (const b of binalar(G, s)) {
    const k = kutu(b, s); if (!k) continue;
    if (pos.x > k.min.x - 0.15 && pos.x < k.max.x + 0.15 && pos.z > k.min.z - 0.15 && pos.z < k.max.z + 0.15 && onceY >= k.max.y - 0.3) y = Math.max(y, k.max.y);
  }
  return y;
}
// Yüksekten iniş: hızlıysa yuvarlanır (hasarsız), değilse kısa sarsıntı.
function inis(G, s, dusus) {
  const p = G.oyuncu;
  olay(G, 'yere', { hiz: dusus });
  if (s.takla > 0 && s.taklaEks === 'z') return;
  if (dusus >= 13) {
    const yatay = Math.hypot(p.hiz.x, p.hiz.z), g = G.girdi;
    if (yatay > 5 || Math.abs(g?.eksen?.x || 0) + Math.abs(g?.eksen?.y || 0) > 0.1) {
      s.takla = s.taklaSure = 0.5; s.taklaEks = 'x'; s.taklaYon = 1; s.yuvarlan = 0.5;
      if (yatay < 9) { p.hiz.x += s.ileri.x * (9 - yatay); p.hiz.z += s.ileri.z * (9 - yatay); }
      G.efekt?.sars?.(0.3, 0.3);
    } else {
      p.hiz.x *= 0.4; p.hiz.z *= 0.4; G.efekt?.sars?.(Math.min(0.3, dusus / 90), 0.25);
    }
  }
}
function carpis(G, s, once, dt, duvarIzin = true) {
  const p = G.oyuncu, r = 0.55;
  const z = zemin(G, s, p.konum, once.y);
  const havadaydi = !p.yerde;
  p.yerde = p.hiz.y <= 0 && p.konum.y <= z + 0.02 && once.y >= z - 0.3;
  if (p.yerde) {
    const dusus = Math.max(0, -p.hiz.y);
    p.konum.y = z; p.hiz.y = 0; s.ziplamalar = 0; s.sonZemin = 0.12;
    if (havadaydi) inis(G, s, dusus);
  }
  let n = null;
  if (G.sehir?.carpis) {
    // Süpürme: önceki konumdan yeni konuma <=0.3 m adımlarla kapsül çarpışması (tünelleme yok).
    const bitis = p.konum.clone(), yol = bitis.clone().sub(once), uz = yol.length();
    const say = sinirla(Math.ceil(uz / 0.3), 1, 80);
    p.konum.copy(once); yol.divideScalar(say);
    let nx = 0, nz = 0, yukari = false, asagi = false;
    for (let i = 0; i < say; i++) {
      p.konum.add(yol);
      const kn = kapsulDuzelt(G, s);
      nx += kn.x; nz += kn.z; yukari ||= kn.yukari; asagi ||= kn.asagi;
    }
    if (yukari && p.hiz.y < 0) p.hiz.y = 0;
    if (asagi && p.hiz.y > 0) p.hiz.y = 0;
    if (nx * nx + nz * nz > 1e-6) n = s.v(nx, 0, nz).normalize();
  } else {
    for (const b of binalar(G, s)) {
      const k = kutu(b, s); if (!k || p.konum.y >= k.max.y - 0.01 || p.konum.y + 1.8 <= k.min.y) continue;
      if (p.konum.x > k.min.x - r && p.konum.x < k.max.x + r && p.konum.z > k.min.z - r && p.konum.z < k.max.z + r) {
        const faces = [
          [Math.abs(p.konum.x - (k.min.x - r)), 'x', k.min.x - r, s.v(-1, 0, 0)],
          [Math.abs(p.konum.x - (k.max.x + r)), 'x', k.max.x + r, s.v(1, 0, 0)],
          [Math.abs(p.konum.z - (k.min.z - r)), 'z', k.min.z - r, s.v(0, 0, -1)],
          [Math.abs(p.konum.z - (k.max.z + r)), 'z', k.max.z + r, s.v(0, 0, 1)]
        ];
        faces.sort((a, b) => a[0] - b[0]);
        p.konum[faces[0][1]] = faces[0][2]; n = faces[0][3];
      }
    }
  }
  if (n) {
    const havaHizi = p.hiz.length();
    const iceri = p.hiz.dot(n);
    if (iceri < 0) p.hiz.addScaledVector(n, -iceri);
    const kos = G.girdi?.basili?.('ShiftLeft') || G.girdi?.basili?.('ShiftRight');
    if (duvarIzin && !s.ankraj && s.duvarBekle <= 0 && (kos || (!p.yerde && havaHizi > 8))) {
      sallanBit(G, s, false);
      s.duvar = { normal: n, bina: yakinBina(G, s, p.konum) };
      s.tekrar = 0.2;
      p.yerde = false; p.hiz.set(0, 0, 0); s.ziplamalar = 0;
    }
  }
  // Şehir dışından düşüldüğünde de güvenli düz zemin vardır.
  if (p.konum.y < 0) { p.konum.y = 0; p.hiz.y = Math.max(0, p.hiz.y); p.yerde = true; s.ziplamalar = 0; }
}
function duvarHareket(G, s, dt, x, y, ziplama) {
  const p = G.oyuncu, d = s.duvar, n = d.normal;
  if (ziplama) {
    p.hiz.copy(n).multiplyScalar(9); p.hiz.y = 11;
    s.duvar = null; s.duvarBekle = 0.35; s.ziplamalar = 1; s.ziplamaTampon = 0;
    olay(G, 'zipla'); return;
  }
  const yan = s.v(n.z, 0, -n.x);
  if (yan.dot(s.sag) < 0) yan.negate();
  p.hiz.copy(yan).multiplyScalar(x * 5 * (p.dev ? 1.3 : 1));
  const kos = G.girdi?.basili?.('ShiftLeft') || G.girdi?.basili?.('ShiftRight');
  p.hiz.y = kos ? 14 * (p.dev ? 1.3 : 1) : y * 6 * (p.dev ? 1.3 : 1);
  d.kos = !!kos;
  p.konum.addScaledVector(p.hiz, dt);
  kapsulDuzelt(G, s);
  const bina = d.bina || yakinBina(G, s, p.konum);
  if (bina) {
    const k = bina.k;
    if ((y > 0 || kos) && p.konum.y + 1.8 >= k.max.y) {
      const son = p.konum.clone().addScaledVector(n, -1.4);
      son.x = sinirla(son.x, k.min.x + 0.8, k.max.x - 0.8);
      son.z = sinirla(son.z, k.min.z + 0.8, k.max.z - 0.8);
      son.y = k.max.y + 0.04;
      s.zip = { bas: p.konum.clone(), son, sure: 0, once: p.konum.clone(), cati: true, yuksel: true };
      s.duvar = null; olay(G, 'konus'); G.efekt?.sars?.(0.2, 0.25); return;
    }
    if (p.konum.x < k.min.x - 1 || p.konum.x > k.max.x + 1 || p.konum.z < k.min.z - 1 || p.konum.z > k.max.z + 1) {
      s.duvar = null; s.duvarBekle = 0.15;
    }
  } else {
    const hit = isin(G, s, p.konum.clone().add(s.v(0, 1, 0)), n.clone().negate(), 1.5);
    if (!hit) s.duvar = null;
  }
  if (p.konum.y <= 0) { p.konum.y = 0; s.duvar = null; p.yerde = true; }
}
function fizik(G, s, dt) {
  const p = G.oyuncu, g = G.girdi;
  const carp = p.dev ? 1.25 : 1;
  const kos = g?.basili?.('ShiftLeft') || g?.basili?.('ShiftRight');
  const x = sinirla(g?.eksen?.x || 0, -1, 1), y = sinirla(g?.eksen?.y || 0, -1, 1);
  const zipla = s.ziplamaTampon > 0;
  if (s.duvar) { duvarHareket(G, s, dt, x, y, zipla); return; }
  if (zipla && !p.yerde && !s.sonZemin && s.ziplamalar >= 2 && !s.ankraj && !s.trickBekle && p.konum.y - zemin(G, s, p.konum, p.konum.y) > 2.5) {
    // Havada takla / numara.
    s.takla = s.taklaSure = 0.7; s.taklaEks = 'x'; s.taklaYon = 1; s.trickBekle = 0.8; s.ziplamaTampon = 0;
    p.hiz.y = Math.max(p.hiz.y, 6);
    olay(G, 'numara', { puan: 25 });
    if (G.gorev && Number.isFinite(G.gorev.puan)) G.gorev.puan += 25;
  } else if (zipla && (p.yerde || s.sonZemin > 0 || s.ziplamalar < 2)) {
    sallanBit(G, s, false);
    s.ziplamalar = (p.yerde || s.sonZemin > 0) ? 1 : s.ziplamalar + 1;
    p.hiz.y = 11 * (p.dev ? 1.3 : 1); p.yerde = false; s.ziplamaTampon = 0; s.sonZemin = 0;
    olay(G, 'zipla');
  }
  s.istek.copy(s.ileri).multiplyScalar(y).addScaledVector(s.sag, x);
  if (s.istek.lengthSq() > 1) s.istek.normalize();
  if (p.yerde && !s.ankraj) {
    if (s.lunge?.kalan > 0 || s.kacisSure > 0.25) { /* atılma/kaçış hızını koru */ }
    else {
      const hiz = (kos ? 14 : 7) * carp, istek = s.istek.lengthSq() > 0.01;
      // İvmelenme yumuşak, dönüşte kayma: ters yönde sönüm düşük; bırakınca hızlı durur (yuvarlanırken yavaş).
      const yatay = Math.hypot(p.hiz.x, p.hiz.z);
      const hizalama = istek && yatay > 1 ? (p.hiz.x * s.istek.x + p.hiz.z * s.istek.z) / (yatay * s.istek.length()) : 1;
      const kk = s.yuvarlan > 0 ? (istek ? 5 : 2.5) : istek ? (hizalama < 0.3 ? 6 : 10) : 13;
      const k = yumusak(kk, dt);
      p.hiz.x += (s.istek.x * hiz - p.hiz.x) * k;
      p.hiz.z += (s.istek.z * hiz - p.hiz.z) * k;
    }
  } else if (s.ankraj) {
    const ip = p.konum.clone().sub(s.ankraj).normalize();
    const alt = Math.pow(Math.max(0, -ip.y), 4);
    const itki = s.istek.clone().multiplyScalar(6 * carp);
    itki.addScaledVector(ip, -itki.dot(ip));
    p.hiz.addScaledVector(itki, dt);
    s.swingT += dt;
    // Aşağı inerken W: teğet yönde ek ivme.
    if (y > 0 && p.hiz.y < 0) {
      const te = p.hiz.clone().addScaledVector(ip, -p.hiz.dot(ip));
      if (te.lengthSq() > 1) p.hiz.addScaledVector(te.normalize(), 8 * dt);
    }
    if (p.hiz.length() > 55) p.hiz.setLength(55);
    // Halat sabit; yalnız alt nokta yere 3 m'den yakın olacaksa kısalır.
    const z = zemin(G, s, p.konum, p.konum.y);
    if (p.konum.y - z < 3 && p.hiz.y < 0 && s.halat > 6) s.halat = Math.max(6, s.halat - 20 * dt);
  } else {
    p.hiz.addScaledVector(s.istek, 20 * carp * dt);
    const yatay = Math.hypot(p.hiz.x, p.hiz.z);
    // Hava kontrolü ivme verir, sallanmadan gelen momentumu kesmez.
    if (yatay > 42 * carp) { const oran = (yatay - (yatay - 42 * carp) * yumusak(2, dt)) / yatay; p.hiz.x *= oran; p.hiz.z *= oran; }
  }
  p.hiz.y -= 25 * dt;
  const once = p.konum.clone();
  p.konum.addScaledVector(p.hiz, dt);
  if (s.ankraj) {
    const ip = p.konum.clone().sub(s.ankraj), uzaklik = ip.length();
    if (uzaklik > s.halat) {
      ip.divideScalar(uzaklik);
      p.konum.copy(s.ankraj).addScaledVector(ip, s.halat);
      const disari = p.hiz.dot(ip);
      if (disari > 0) p.hiz.addScaledVector(ip, -disari);
    }
    if (s.sYon && s.swingT > 0.3) {
      const d = p.konum.clone().sub(s.ankraj), on = d.x * s.sYon.x + d.z * s.sYon.z;
      if (on > 0 && Math.atan2(on, -d.y) > 70 * RAD) s.otoBirak = true;
    }
  }
  carpis(G, s, once, dt);
}
function kamera(G, s, dt) {
  const p = G.oyuncu, c = G.kamera; if (!c) return;
  const oran = sinirla(p.hiz.length() / 38, 0, 1);
  let uzaklik = 6 + 4 * oran - (s.dovus > 0 ? 1.3 : 0);
  s.dovusK = (s.dovusK || 0) + ((s.dovus > 0 ? 1 : 0) - (s.dovusK || 0)) * yumusak(3, dt);
  uzaklik = 6 + 4 * oran - 1.3 * s.dovusK;
  s.bakis.set(-Math.sin(s.yaw) * Math.cos(s.pitch), Math.sin(s.pitch), -Math.cos(s.yaw) * Math.cos(s.pitch));
  const hedef = p.konum.clone().add(s.v(0, (p.dev ? 2.35 : 1.65) - 0.45 * oran, 0));
  if (!s.kameraHazir) s.kameraHedef.copy(hedef);
  else s.kameraHedef.lerp(hedef, yumusak(14, dt));
  const ideal = s.kameraHedef.clone().addScaledVector(s.bakis, -uzaklik).addScaledVector(s.sag, 0.65);
  const yol = ideal.clone().sub(s.kameraHedef), uzunluk = yol.length(); yol.normalize();
  const hit = isin(G, s, s.kameraHedef, yol, uzunluk + 0.25);
  if (hit) ideal.copy(s.kameraHedef).addScaledVector(yol, Math.max(0.2, s.kameraHedef.distanceTo(hit.nokta) - 0.4));
  if (!s.kameraHazir) { s.kameraKonum.copy(ideal); s.kameraHazir = true; }
  else s.kameraKonum.lerp(ideal, yumusak(11, dt));
  // Lerp yolu da duvarı kesebilir: son konuma ikinci bir ışın sınırı uygula.
  const sonYol = s.kameraKonum.clone().sub(s.kameraHedef), sonUzaklik = sonYol.length();
  if (sonUzaklik > 0.01) {
    sonYol.divideScalar(sonUzaklik);
    const engel = isin(G, s, s.kameraHedef, sonYol, sonUzaklik + 0.2);
    if (engel) s.kameraKonum.copy(s.kameraHedef).addScaledVector(sonYol, Math.max(0.15, s.kameraHedef.distanceTo(engel.nokta) - 0.35));
  }
  // Kamera küresi (r=0.35) bina içine girmesin.
  if (G.sehir?.carpis) {
    for (let i = 0; i < 2; i++) {
      const kh = G.sehir.carpis(s.kameraKonum, 0.35);
      if (!kh || !kh.normal || !sonlu(kh.duzeltme) || kh.duzeltme.lengthSq() < 1e-10) break;
      s.kameraKonum.add(kh.duzeltme);
    }
  }
  s.kameraKonum.y = Math.max(0.25, s.kameraKonum.y);
  c.position.copy(s.kameraKonum);
  c.up.set(0, 1, 0);
  // Sallanmada ankraja doğru hafif bakış ofseti.
  if (s.ankraj) s.ofsT.copy(s.ankraj).sub(p.konum).normalize().multiplyScalar(2.2); else s.ofsT.set(0, 0, 0);
  s.bakisOfs.lerp(s.ofsT, yumusak(2.5, dt));
  c.lookAt(s.kameraHedef.clone().addScaledVector(s.bakis, 8).add(s.bakisOfs));
  const istenenRoll = s.ankraj ? sinirla(-p.hiz.dot(s.sag) * 0.006, -0.14, 0.14) : 0;
  s.roll += (istenenRoll - s.roll) * yumusak(5, dt);
  c.rotateZ(s.roll);
  const alt = s.ankraj ? Math.pow(Math.max(0, -s.anlik.copy(p.konum).sub(s.ankraj).normalize().y), 3) : 0;
  s.nefes += (alt - s.nefes) * yumusak(3, dt);
  const baz = Number.isFinite(G.ayar?.fov) && G.ayar.fov >= 40 && G.ayar.fov <= 110 ? G.ayar.fov : 70;
  const fov = c.fov + (baz + 18 * oran + 6 * s.nefes - c.fov) * yumusak(4, dt);
  if (Math.abs(c.fov - fov) > 0.001) { c.fov = fov; c.updateProjectionMatrix(); }
}
// Karakteri 0.5 sn dünya noktasına baktır (atış/kombo/kamçı/zip).
function bakHedef(s, nokta) { if (sonlu(nokta)) { s.yonHedef = nokta.clone(); s.yonZorla = 0.5; } }
function kahraman(G, s, dt) {
  const p = G.oyuncu, k = G.kahraman;
  if (!k) return;
  if (k.grup) {
    k.grup.position.copy(p.konum);
    const dv = s.duvar;
    s.duvarG = (s.duvarG || 0) + ((dv ? 1 : 0) - (s.duvarG || 0)) * yumusak(dv ? 15 : 12, dt || 1);
    // Duruyorsa son yönü koru (kamerayla dönmez); hızlıysa hareket yönüne; saldırı/zip anında hedefe hızlı dön.
    const yon = s.duvar ? s.duvar.normal.clone().negate() : s.v(p.hiz.x, 0, p.hiz.z);
    let hizK = 12;
    if (s.yonZorla > 0 && s.yonHedef && !s.duvar) {
      yon.set(s.yonHedef.x - p.konum.x, 0, s.yonHedef.z - p.konum.z); hizK = 40;
    }
    if (yon.lengthSq() < 0.5) { if (s.sonYon) yon.copy(s.sonYon); else yon.copy(s.ileri); }
    else yon.normalize();
    if (!s.sonYon) s.sonYon = yon.clone(); else s.sonYon.copy(yon);
    const aci = Math.atan2(yon.x, yon.z);
    s.q.setFromAxisAngle(s.yukari, aci);
    if (dv) {
      // Duvarda dik duruş: yerel yukarı = duvar normali, yerel ileri = hareket yönü; ayak duvar yüzeyinde.
      const n = dv.normal, kb = dv.bina?.k;
      const yan = s.v(n.z, 0, -n.x); if (yan.dot(s.sag) < 0) yan.negate();
      const ex = G.girdi?.eksen?.x || 0, ey = G.girdi?.eksen?.y || 0;
      const yonu = s.v(0, 1, 0).multiplyScalar(dv.kos ? 1 : (Math.abs(ey) > 0.1 ? Math.sign(ey) : 0.3)).addScaledVector(yan, ex);
      if (yonu.lengthSq() < 0.01) yonu.set(0, 1, 0); yonu.normalize();
      const Z = yonu.addScaledVector(n, -yonu.dot(n)).normalize(), Y = n.clone(), X = s.v().crossVectors(Y, Z).normalize();
      s.mat = s.mat || new s.T.Matrix4();
      s.mat.makeBasis(X, Y, Z);
      s.qd = s.qd || new s.T.Quaternion();
      s.qd.setFromRotationMatrix(s.mat);
      s.yonQ.slerp(s.qd, yumusak(15, dt || 1));
      let mx = p.konum.x, mz = p.konum.z;
      if (kb) {
        if (Math.abs(n.x) > Math.abs(n.z)) mx = (n.x > 0 ? kb.max.x : kb.min.x) + n.x * 0.05;
        else mz = (n.z > 0 ? kb.max.z : kb.min.z) + n.z * 0.05;
      } else { mx -= n.x * 0.4; mz -= n.z * 0.4; }
      k.grup.position.x += (mx - k.grup.position.x) * s.duvarG;
      k.grup.position.z += (mz - k.grup.position.z) * s.duvarG;
    } else s.yonQ.slerp(s.q, yumusak(s.duvarG > 0.02 ? 15 : hizK, dt || 1));
    k.grup.quaternion.copy(s.yonQ);
    if (s.takla > 0) {
      // Takla/yuvarlanma/kaçış dönüşü gövde merkezi etrafında.
      const ilerleme = 1 - s.takla / s.taklaSure, ang = ilerleme * Math.PI * 2 * s.taklaYon;
      s.q2.setFromAxisAngle(s.taklaEks === 'z' ? s.eksenZ : s.eksenX, ang);
      k.grup.quaternion.multiply(s.q2);
      const dev = s.anlik.set(0, 0.95, 0).applyQuaternion(k.grup.quaternion);
      k.grup.position.x += -dev.x; k.grup.position.y += 0.95 - dev.y; k.grup.position.z += -dev.z;
    }
    k.grup.updateMatrixWorld?.(true);
  }
  k.ayarla?.({ durum: s.duvar ? (s.duvar.kos ? 'duvarKos' : 'duvar') : p.durum === 'sapan' ? 'dur' : p.durum, duvarNormal: s.duvar ? s.duvar.normal : null, el: s.elAd, hiz: p.hiz, yerde: p.yerde, dev: p.dev, dt, bakis: s.yonZorla > 0 ? s.yonHedef : null });
  const dig = s.elAd === 'sag' ? 'sol' : 'sag';
  if (s.sapan) {
    k.dokunac?.('sol', k.elNoktasi?.('sol') || p.konum.clone().add(s.v(0, 1.4, 0)), s.sapan.sol);
    k.dokunac?.('sag', k.elNoktasi?.('sag') || p.konum.clone().add(s.v(0, 1.4, 0)), s.sapan.sag);
    k.dokunac?.('kamci', null, null); return;
  }
  if (s.ankraj) k.dokunac?.(s.elAd, k.elNoktasi?.(s.elAd) || p.konum.clone().add(s.v(0, 1.4, 0)), s.ankraj);
  else if (s.bosAgSure > 0 && s.bosAgYon) k.dokunac?.(s.elAd, k.elNoktasi?.(s.elAd) || p.konum.clone().add(s.v(0, 1.4, 0)), p.konum.clone().addScaledVector(s.bosAgYon, 14).add(s.v(0, 12, 0)));
  else k.dokunac?.(s.elAd, null, null);
  k.dokunac?.(dig, null, null);
  if (s.kamciSure > 0 && s.kamciHedef) {
    const nokta = s.kamciHedef.konum || s.kamciHedef;
    if (sonlu(nokta)) k.dokunac?.('kamci', k.elNoktasi?.('sol') || p.konum.clone().add(s.v(0, 1.3, 0)), nokta);
  } else k.dokunac?.('kamci', null, null);
}

// ---- Dövüş: 4 vuruşluk kombo, atılma, tehdit ve kaçış ----
function yakinVurus(G, s, hedef, guc) {
  const p = G.oyuncu;
  bakHedef(s, hedef.konum);
  const dx = hedef.konum.x - p.konum.x, dz = hedef.konum.z - p.konum.z, d = Math.hypot(dx, dz);
  const yon = d < 0.1 ? s.ileri.clone() : s.v(dx / d, 0, dz / d);
  s.komboNo = s.zincir > 0 ? (s.komboNo + 1) % 4 : 0;
  const no = s.komboNo;
  s.zincir = 0.6 + (no === 3 ? 0 : 0); s.komboReset = 3; s.dovus = 2;
  s.komboSayi++;
  s.atisBekle = no === 3 ? 0.4 : 0.26; s.saldiriSure = 0.28; s.saldiri = 'yumruk';
  const veri = { yon, guc: guc * (no === 3 ? 2.5 : 1), komboNo: no, hedefKonum: hedef.konum.clone() };
  if (d > 2.4) {
    s.lunge = { yon: yon.clone(), kalan: 0.12, hiz: Math.min(34, Math.max(6, (d - 1.7) / 0.12)) };
    s.vurusGecikme = { sure: 0.12, ...veri };
  } else {
    p.hiz.x += yon.x * 3; p.hiz.z += yon.z * 3;
    vurusVer(G, s, veri);
  }
}
function vurusVer(G, s, v) {
  const p = G.oyuncu;
  olay(G, 'yumruk', { konum: p.konum.clone(), yon: v.yon, guc: v.guc, komboNo: v.komboNo });
  olay(G, 'kombo', { sayi: s.komboSayi });
  if (v.komboNo === 3) {
    olay(G, 'bitirici', { konum: v.hedefKonum });
    p.gucEkle(10);
    G.efekt?.vurusDuraklat?.(0.06); G.efekt?.sars?.(0.25, 0.25);
  }
}
// Oyuncuya 0.4 sn içinde çarpacak mermi/robot vuruşu.
function tehditGuncelle(G, s, dt) {
  const p = G.oyuncu, h = s.v(p.konum.x, p.konum.y + 1, p.konum.z);
  let bul = null;
  const d = G.dusman;
  if (d?.mermiler) for (const m of d.mermiler) {
    if (!m || m.aktif === false || 'hedef' in m) continue;
    const kon = m.konum || m.m?.position, hz = m.hiz;
    if (!sonlu(kon) || !sonlu(hz)) continue;
    const v2 = hz.lengthSq(); if (v2 < 1) continue;
    const rx = h.x - kon.x, ry = h.y - kon.y, rz = h.z - kon.z;
    const tt = (rx * hz.x + ry * hz.y + rz * hz.z) / v2;
    if (tt < 0 || tt > 0.4) continue;
    const ex = rx - hz.x * tt, ey = ry - hz.y * tt, ez = rz - hz.z * tt;
    if (ex * ex + ey * ey + ez * ez < 1.6 * 1.6) { bul = { sure: tt, kaynak: s.v(kon.x, kon.y, kon.z) }; break; }
  }
  if (!bul && d?.liste) for (const e of d.liste) {
    if (!e.canli || !sonlu(e.konum) || typeof e.sal !== 'number' || e.sal < 0 || e.sal > 0.4) continue;
    const dx = h.x - e.konum.x, dz = h.z - e.konum.z;
    if (dx * dx + dz * dz < 5.2 * 5.2 && Math.abs(h.y - e.konum.y) < 5) { bul = { sure: e.sal, kaynak: e.konum.clone() }; break; }
  }
  s.tehdit = bul;
  if (bul) s.tehlikeSure = 0.25;
  p.tehlike = s.tehlikeSure > 0;
}
function kacis(G, s) {
  const p = G.oyuncu, k = s.tehdit.kaynak;
  const gel = s.v(p.konum.x - k.x, 0, p.konum.z - k.z);
  if (gel.lengthSq() < 0.01) gel.copy(s.ileri).negate(); else gel.normalize();
  const yan = s.v(-gel.z, 0, gel.x);
  const x = G.girdi?.eksen?.x || 0;
  if (Math.abs(x) > 0.2 ? yan.dot(s.sag) * x < 0 : yan.dot(s.sag) < 0) yan.negate();
  p.hiz.x = yan.x * 17; p.hiz.z = yan.z * 17; p.hiz.y = Math.max(p.hiz.y, p.yerde ? 3 : 0.5);
  p.yerde = false;
  s.kacisSure = 0.55; s.kacisBekle = 0.9; s.tehdit = null;
  s.takla = s.taklaSure = 0.5; s.taklaEks = 'z'; s.taklaYon = yan.dot(s.sag) >= 0 ? -1 : 1;
  olay(G, 'kacis');
  G.efekt?.yavasCekim?.(0.35, 0.4);
}

function nisanBul(G, s) {
  const c = G.kamera, bas = c ? c.position : s.kameraKonum;
  const dir = s.kameraHedef.clone().addScaledVector(s.bakis, 8).sub(bas).normalize();
  const uzak = bas.clone().addScaledVector(dir, 120);
  const aday = [], ndc = s.v(); let nv = false;
  if (c) { c.updateMatrixWorld?.(); c.updateProjectionMatrix?.(); }
  for (const d of G.dusman?.liste || []) {
    if (!d.canli || !sonlu(d.konum)) continue;
    const nk = d.konum.clone(); nk.y += d.dev ? 3 : 1;
    const mesafe = nk.distanceTo(G.oyuncu.konum);
    if (mesafe <= 90) nv = true;
    if (mesafe > 90 || nk.clone().sub(bas).dot(dir) <= 0) continue;
    let sk = 0;
    if (c) { ndc.copy(nk).project(c); sk = Math.hypot(ndc.x, ndc.y); if (!Number.isFinite(sk)) continue; }
    aday.push({ d, nk, sk, puan: sk + 0.004 * mesafe });
  }
  G.oyuncu.nisanAktif = nv;
  aday.sort((a, b) => a.puan - b.puan);
  const kabul = aday.filter(a => a.sk <= 0.45);
  let sec = null;
  const mevcut = s.kilit && aday.find(a => a.d === s.kilit);
  if (s.wheel) {
    const liste = (kabul.length ? kabul : aday).slice().sort((a, b) => a.sk - b.sk);
    if (liste.length) { const i = liste.findIndex(a => a.d === s.kilit); sec = liste[(i + (s.wheel > 0 ? 1 : liste.length - 1)) % liste.length]; s.kilitKilit = 3; }
    s.wheel = 0;
  }
  if (!sec) {
    if (mevcut && mevcut.sk <= 0.6) {
      sec = mevcut;
      if (!(s.kilitKilit > 0) && kabul[0] && kabul[0].d !== mevcut.d && kabul[0].puan < mevcut.puan * 0.6) sec = kabul[0];
    } else sec = kabul[0] || null;
  }
  s.kilit = sec ? sec.d : null;
  return { hedef: sec ? sec.d : null, nokta: sec ? sec.nk : null, uzak, dir };
}

function guncelleIc(G, dt) {
  if (G.durum !== 'oyun') return;
  const s = durumlar.get(G), p = G.oyuncu;
  if (!s || !p || !Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, 0.05);
  const g = G.girdi, basili = kod => !!g?.basili?.(kod), yeni = kod => !!g?.yeniBasildi?.(kod);
  s.zaman += dt;
  for (const ad of ['tekrar', 'duvarBekle', 'zipBekle', 'hasarSure', 'dogusSure', 'saldiriSure', 'yumrukBekle', 'atisBekle', 'kamciBekle', 'kamciSure', 'ziplamaTampon', 'sonZemin', 'zincir', 'komboReset', 'dovus', 'kacisSure', 'kacisBekle', 'trickBekle', 'yuvarlan', 'takla', 'yonZorla', 'bosAgSure']) s[ad] = Math.max(0, s[ad] - dt);
  if (!s.komboReset) s.komboSayi = 0;
  const hass = Number.isFinite(G.ayar?.hassasiyet) && G.ayar.hassasiyet > 0 ? G.ayar.hassasiyet : 1;
  const ters = (G.ayar?.yTers || G.ayar?.tersY) ? -1 : 1;
  s.yaw -= (g?.fareDX || 0) * 0.0023 * hass;
  s.pitch = sinirla(s.pitch - (g?.fareDY || 0) * 0.0021 * hass * ters, -60 * RAD, 75 * RAD);
  s.ileri.set(-Math.sin(s.yaw), 0, -Math.cos(s.yaw)); s.sag.set(Math.cos(s.yaw), 0, -Math.sin(s.yaw));
  const hedef = ankrajBul(G, s);
  p.nisanVar = false; p.nisanNokta = null; p.nisanHedef = null;
  if (s.olmeSure > 0) {
    s.olmeSure = Math.max(0, s.olmeSure - dt);
    if (!s.olmeSure) {
      const dogma = G.sehir?.rastgeleCati?.();
      p.isinla(sonlu(dogma) ? dogma : s.v(0, 60, 0));
      p.can = p.canMax; s.dogusSure = 0.8; s.hasarSure = 1.2;
      olay(G, 'dogdu');
    }
    p.durum = 'dogus'; kamera(G, s, dt); kahraman(G, s, dt); return;
  }
  if (p.dev) { s.devSure = Math.max(0, s.devSure - dt); if (!s.devSure) devBit(G, s); }
  if (yeni('KeyQ') && !p.dev && p.guc >= p.gucMax) {
    p.guc = 0; p.dev = true; s.devSure = 12;
    p.hiz.multiplyScalar(1.25); G.kahraman?.devOl?.(true); olay(G, 'devBasla');
  }
  if (s.kilitKilit > 0) s.kilitKilit -= dt;
  const nisanlar = nisanBul(G, s);
  p.nisanHedef = nisanlar.hedef;
  if ((basili('Fare0') || yeni('Fare0')) && !s.atisBekle && !s.duvar && !s.zip) {
    const guc = p.dev ? 3 : 1, yakin = G.dusman?.enYakin?.(p.konum, 6) || null;
    s.atisEl ^= 1;
    if (yakin) yakinVurus(G, s, yakin, guc);
    else {
      s.atisBekle = 0.18; s.saldiriSure = 0.2;
      const el = G.kahraman?.elNoktasi?.(s.atisEl ? 'sag' : 'sol') || p.konum.clone().add(s.v(0, 1.3, 0));
      const nokta = nisanlar.hedef ? nisanlar.nokta : nisanlar.uzak;
      const yon = nokta.clone().sub(el);
      if (yon.lengthSq() < 0.01) yon.copy(s.bakis); else yon.normalize();
      s.saldiri = 'yumruk'; bakHedef(s, nokta);
      s.atisSayi++;
      olay(G, 'atis', { baslangic: el.clone(), yon, guc, hedef: nisanlar.hedef });
      if (G.test) console.log(`[OYUNCU] atis ${s.atisSayi}`);
    }
  }
  if (s.vurusGecikme && (s.vurusGecikme.sure -= dt) <= 0) { const v = s.vurusGecikme; s.vurusGecikme = null; vurusVer(G, s, v); }
  if (s.lunge) { if ((s.lunge.kalan -= dt) <= 0) s.lunge = null; else if (!s.duvar && !s.zip) { p.hiz.x = s.lunge.yon.x * s.lunge.hiz; p.hiz.z = s.lunge.yon.z * s.lunge.hiz; } }
  tehditGuncelle(G, s, dt);
  if (yeni('KeyF') && !s.kamciBekle) {
    s.kamciBekle = 0.5; s.saldiriSure = 0.3; s.saldiri = 'kamci';
    s.kamciHedef = G.dusman?.enYakin?.(p.konum, 25) || null; s.kamciSure = 0.3;
    bakHedef(s, s.kamciHedef?.konum || p.konum.clone().addScaledVector(s.ileri, 10));
    olay(G, 'kamci', { konum: p.konum.clone(), yon: s.ileri.clone() });
  }
  if (yeni('Space') && basili('Fare2') && !s.sapan && !s.zip && !s.duvar && (p.yerde || p.hiz.length() < 8) && sapanBasla(G, s)) { s.ziplamaTampon = 0; }
  else if (yeni('Space')) {
    if (s.tehdit && !s.kacisBekle && !s.zip) kacis(G, s);
    else s.ziplamaTampon = 0.12;
  }
  if (!basili('Fare2')) sallanBit(G, s, true);
  if (yeni('KeyE') && !s.zipBekle && !s.zip) { if (hedef) zipBasla(G, s, hedef); }
  if (!basili('Fare2')) s.fareKilit = false;
  if (basili('Fare2') && !s.ankraj && !s.zip && !s.sapan && !s.tekrar && !s.fareKilit) {
    const sw = salinimSec(G, s);
    if (sw) sallanBasla(G, s, sw);
    else {
      s.bosAgSure = 0.3; s.bosAgYon = salinimYon(G, s);
      olay(G, 'bosAg'); if (G.test) console.log('[SALINIM] bosAg');
      s.fareKilit = true;
    }
    s.tekrar = 0.1;
  }
  if (s.sapan) sapanGuncelle(G, s, dt);
  else if (s.zip) {
    const z = s.zip; z.sure += dt; const t = Math.min(1, z.sure / (z.toplam || 0.4));
    const e = 1 - (1 - t) * (1 - t);
    z.once.copy(p.konum);
    const aday = z.bas.clone().lerp(z.son, e);
    if (z.yuksel) {
      // Önce kenarın üstüne yüksel, sonra içeri geç; çatı yüzünü kesme.
      const yatay = sinirla((e - 0.6) / 0.4, 0, 1);
      aday.x = z.bas.x + (z.son.x - z.bas.x) * yatay;
      aday.z = z.bas.z + (z.son.z - z.bas.z) * yatay;
      aday.y = z.bas.y + (z.son.y - z.bas.y) * Math.min(1, e / 0.55);
    }
    const engel = zipIlerle(G, s, aday);
    kapsulDuzelt(G, s);
    p.hiz.copy(p.konum).sub(z.once).divideScalar(dt);
    if (engel || t >= 1) {
      if (engel) p.hiz.set(0, 2, 0);
      else if (z.firlat) { p.hiz.copy(s.ileri).multiplyScalar(6); p.hiz.y = 4; }
      else { p.hiz.copy(s.ileri).multiplyScalar(z.cati ? 6 : 8); p.hiz.y = z.cati ? 2 : 4; }
      if (p.hiz.length() > 20) p.hiz.setLength(20);
      s.zip = null; s.ziplamalar = 1; s.duvarBekle = 0.15;
    }
  } else {
  const tsy = G.sehir?.tasiyici;
  if (p.yerde && tsy?.var && Number.isFinite(tsy.dx) && Number.isFinite(tsy.dz)) { p.konum.x += tsy.dx; p.konum.z += tsy.dz; }
    const adim = Math.ceil(dt / (1 / 120));
    for (let i = 0; i < adim; i++) { fizik(G, s, dt / adim); if (s.zip) break; }
  }
  if (s.otoBirak) { sallanBit(G, s, true); s.otoBirak = false; s.fareKilit = true; }
  if (s.ankraj && s.sal) salRapor(G, s);
  if (!sonlu(p.konum) || !sonlu(p.hiz)) p.isinla(s.v(0, 60, 0));
  p.durum = s.dogusSure ? 'dogus' : s.hasarSure > 0.4 ? 'hasar' : (s.saldiriSure && !s.ankraj) ? s.saldiri : s.sapan ? 'sapan' : s.zip ? 'zip' : s.duvar ? 'duvar' : s.ankraj ? 'sallan' : p.yerde ? (Math.hypot(p.hiz.x, p.hiz.z) < 0.3 ? 'dur' : (basili('ShiftLeft') || basili('ShiftRight')) ? 'kos' : 'yuru') : p.hiz.y > 0 ? 'zipla' : 'dus';
  s.maxHiz = Math.max(s.maxHiz, p.hiz.length());
  const sonHedef = ankrajBul(G, s);
  p.nisanVar = !!sonHedef; p.nisanNokta = sonHedef ? sonHedef.nokta.clone() : null;
  kamera(G, s, dt); kahraman(G, s, dt);
  G.efekt?.hizBulanikligi?.(sinirla(p.hiz.length() / 60, 0, 1));
  if (G.test && !s.rapor && s.zaman >= 6) {
    s.rapor = true;
    console.log(`[OYUNCU] sallanma ${s.sallanma}, max hız ${s.maxHiz.toFixed(1)}`);
  }
}

// ---- ?test=1&salinimtest=1: sokakta koşarken 6 kez bas-bırak salınım senaryosu ----
function salTestKur(G, s) {
  const bl = binalar(G, s), sh = G.sehir;
  const bos = (x, y, z) => !(sh?.carpis ? sh.carpis(s.v(x, y, z), 1.0) : null);
  const aday = bl.map(b => ({ b, k: kutu(b, s) })).filter(a => a.k && a.k.max.y > 45).sort((a, b) => Math.hypot(a.k.min.x, a.k.min.z) - Math.hypot(b.k.min.x, b.k.min.z));
  let bas = null;
  for (const { k } of aday) {
    for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const x = (k.min.x + k.max.x) / 2 + dx * ((k.max.x - k.min.x) / 2 + 8), z = (k.min.z + k.max.z) / 2 + dz * ((k.max.z - k.min.z) / 2 + 8);
      let ok = true; for (let d = 0; d <= 40; d += 4) if (!bos(x, 3, z - d)) { ok = false; break; }
      if (ok) { bas = s.v(x, 0, z); break; }
    }
    if (bas) break;
  }
  const tus = new Set(), yeni = new Set();
  const girdi = { basili: k => tus.has(k), yeniBasildi: k => yeni.has(k), eksen: { x: 0, y: 0 }, fareDX: 0, fareDY: 0, tus, yeni };
  G.oyuncu.isinla(bas || s.v(0, 60, 0)); G.oyuncu.yerde = true;
  s.yaw = 0; s.pitch = 0.1;
  s.salTest = { girdi, f: 0, faz: 'kos', n: 0, bekle: 0, tut: 0, ihlal: 0, eller: [], bas };
  console.log(`[SALINIM] senaryo basladi bas=${bas ? bas.x.toFixed(0) + ',' + bas.z.toFixed(0) : 'yok'}`);
}
function salTestAdim(G, s) {
  const T = s.salTest, p = G.oyuncu; T.f++;
  T.girdi.yeni.clear();
  const kutular = binalar(G, s);
  for (const b of kutular) {
    const k = kutu(b, s); if (!k) continue;
    if (p.konum.x > k.min.x + 0.3 && p.konum.x < k.max.x - 0.3 && p.konum.z > k.min.z + 0.3 && p.konum.z < k.max.z - 0.3 && p.konum.y + 1 > k.min.y + 0.3 && p.konum.y + 1 < k.max.y - 0.3) { T.ihlal++; break; }
  }
  if (T.faz === 'kos') {
    T.girdi.eksen.y = 1; T.girdi.tus.add('KeyW'); T.girdi.tus.add('ShiftLeft');
    if (T.f > 90) { T.faz = 'bas'; }
  } else if (T.faz === 'bas') {
    if (T.n >= 6) { T.faz = 'bitti'; console.log(`[SALINIM] OZET salinim=${T.n} binaIhlal=${T.ihlal} eller=${s.salEller.join(',')} sallanSayisi=${s.sallanma}`); return; }
    T.girdi.tus.add('Fare2'); T.girdi.yeni.add('Fare2'); T.faz = 'tut'; T.tut = 0; T.onceki = s.sallanma;
  } else if (T.faz === 'tut') {
    T.tut += 1 / 60; T.girdi.tus.add('Fare2');
    if (s.sallanma > T.onceki && !s.salEllerYazildi) { }
    if (!s.ankraj && (T.tut > 0.2 || s.fareKilit) || T.tut > 4) { T.girdi.tus.delete('Fare2'); T.faz = 'ara'; T.bekle = 0.35; T.n++; }
  } else if (T.faz === 'ara') {
    T.girdi.tus.delete('Fare2'); T.bekle -= 1 / 60;
    if (T.bekle <= 0) T.faz = 'bas';
  }
  if (T.faz !== 'kos') { T.girdi.eksen.y = 1; T.girdi.tus.add('KeyW'); }
}
export function guncelle(G, dt) {
  const s = durumlar.get(G);
  if (s && G.test && G.durum === 'oyun' && s.salTest !== null) {
    if (s.salTest === undefined) {
      if (new URLSearchParams(location.search).has('salinimtest')) { s.salEller = []; salTestKur(G, s); } else s.salTest = null;
    }
    if (s.salTest) {
      const eski = G.girdi; G.girdi = s.salTest.girdi;
      const once = s.sallanma;
      try { salTestAdim(G, s); guncelleIc(G, Math.min(dt, 1 / 30)); } finally { G.girdi = eski; }
      if (s.sallanma > once) s.salEller.push(s.elAd);
      return;
    }
  }
  guncelleIc(G, dt);
}
