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
    komboNo: -1, zincir: 0, komboSayi: 0, komboReset: 0, vurusGecikme: null, lunge: null, dovus: 0,
    kacisSure: 0, kacisBekle: 0, tehlikeSure: 0, tehdit: null, yonQ: new T.Quaternion(), q2: new T.Quaternion(), q3: new T.Quaternion(),
    bakisOfs: v(), ofsT: v(), eksenX: v(1, 0, 0), eksenZ: v(0, 0, 1), anlik: v()
  };
  const p = G.oyuncu = {
    konum: v(), hiz: v(), yerde: false, durum: 'dus', can: 100, canMax: 100,
    guc: 0, gucMax: 100, dev: false, nisanVar: false, nisanNokta: null, nisanHedef: null,
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
  const dogrudan = isin(G, s, bas, yon, 60);
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
// Salınım ankrajı: hız/bakış yönünde 20-35 m ileride, 15-30 m yukarıda en uygun çatı noktası.
function salinimHedefBul(G, s) {
  const p = G.oyuncu, bas = p.konum.clone().add(s.v(0, 1.3, 0));
  const yon = s.v(p.hiz.x, 0, p.hiz.z);
  if (yon.length() < 4) yon.copy(s.ileri); else yon.normalize().multiplyScalar(0.5).addScaledVector(s.ileri, 0.5).normalize();
  const T = bas.clone().addScaledVector(yon, 27); T.y = bas.y + 22;
  let en = 1e9, secim = null;
  for (const b of binalar(G, s)) {
    const k = kutu(b, s); if (!k) continue;
    const yy = k.max.y;
    if (yy < bas.y + 7 || yy > bas.y + 55) continue;
    const dx = Math.max(k.min.x - bas.x, 0, bas.x - k.max.x), dz = Math.max(k.min.z - bas.z, 0, bas.z - k.max.z);
    if (dx * dx + dz * dz > 55 * 55) continue;
    const cx = sinirla(T.x, k.min.x, k.max.x), cz = sinirla(T.z, k.min.z, k.max.z);
    const px = sinirla(bas.x, k.min.x, k.max.x), pz = sinirla(bas.z, k.min.z, k.max.z);
    const adaylar = [[k.min.x, k.min.z], [k.max.x, k.min.z], [k.min.x, k.max.z], [k.max.x, k.max.z],
      [cx, k.min.z], [cx, k.max.z], [k.min.x, cz], [k.max.x, cz], [px, k.min.z], [px, k.max.z], [k.min.x, pz], [k.max.x, pz]];
    for (const [x, z] of adaylar) {
      const fx = x - bas.x, fy = yy - bas.y, fz = z - bas.z, d = Math.hypot(fx, fy, fz);
      const ileri = fx * yon.x + fz * yon.z;
      if (d < 12 || d > 60 || ileri < 8 || fy < 6 || ileri / Math.hypot(fx, fz) < 0.55) continue;
      const skor = Math.hypot(x - T.x, yy - T.y, z - T.z);
      if (skor >= en) continue;
      const yo = s.v(fx / d, fy / d, fz / d), e = isin(G, s, bas, yo, d - 0.3);
      if (e && bas.distanceTo(e.nokta) < d - 1.5) continue;
      en = skor; secim = { nokta: s.v(x, yy, z), normal: s.v(0, 1, 0) };
    }
  }
  return secim;
}
function halatSinirla(G, s) {
  const p = G.oyuncu, z = zemin(G, s, p.konum, p.konum.y);
  s.halat = Math.min(s.halat, Math.max(10, s.ankraj.y - z - 4));
}
function sallanBasla(G, s, hedef) {
  const p = G.oyuncu;
  s.ankraj = hedef.nokta.clone();
  s.halat = sinirla(p.konum.distanceTo(s.ankraj), 10, 60);
  halatSinirla(G, s); elSec(s);
  s.duvar = null; s.sallanma++;
  if (p.yerde) { p.hiz.y = Math.max(p.hiz.y, 8); p.yerde = false; }
  const ileriHiz = p.hiz.dot(s.ileri);
  if (ileriHiz < 7) p.hiz.addScaledVector(s.ileri, 7 - ileriHiz);
  olay(G, 'sallanBasla');
}
function sallanBit(G, s, firlat) {
  const cekti = !!s.cek;
  s.cek = null;
  if (!s.ankraj) return;
  const p = G.oyuncu;
  // Tepe/ileri noktada bırakış: ankrajın ilerisinde, yükselirken, hızlı.
  let muk = false;
  if (firlat && !cekti && s.swingT > 0.6) {
    const ip = p.konum.clone().sub(s.ankraj), d = ip.length() || 1; ip.divideScalar(d);
    const hy = Math.hypot(p.hiz.x, p.hiz.z) || 1;
    const onde = (ip.x * p.hiz.x + ip.z * p.hiz.z) / hy;
    muk = onde > 0.25 && p.hiz.y > 1.5 && ip.y < -0.05 && ip.y > -0.85 && p.hiz.length() > 13;
  }
  s.ankraj = null;
  if (firlat) p.hiz.y += 4;
  if (muk) {
    p.hiz.multiplyScalar(1.12); p.hiz.y += 2.5;
    if (p.hiz.length() > 62) p.hiz.setLength(62);
    G.efekt?.yavasCekim?.(0.6, 0.25);
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
  sallanBit(G, s, false); s.duvar = null;
  s.zip = { bas: p.konum.clone(), son, sure: 0, once: p.konum.clone(), yuksel: !!bina && son.y >= bina.k.max.y };
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
function cekBasla(G, s, hedef) {
  const p = G.oyuncu;
  elSec(s); olay(G, 'cek');
  s.ankraj = hedef.nokta.clone();
  s.halat = sinirla(p.konum.distanceTo(s.ankraj), 3, 100);
  s.duvar = null; s.sallanma++;
  s.cek = { ust: hedef.ust, k: hedef.k, sure: 0, nokta: hedef.nokta.clone() };
  const ip = p.konum.clone().sub(s.ankraj).normalize();
  s.cekHiz = Math.max(4, -p.hiz.dot(ip));
  if (p.yerde) { p.hiz.y = Math.max(p.hiz.y, 6); p.yerde = false; }
  olay(G, 'sallanBasla');
}
// Çekiş sonu: çatı seviyesine yakınsa çatıya kondur, değilse momentumla fırla.
function cekBitir(G, s, kondur) {
  const p = G.oyuncu, c = s.cek;
  const nokta = c.nokta, k = c.k;
  sallanBit(G, s, false);
  if (kondur && k && p.konum.y + 4.5 >= c.ust) {
    const son = nokta.clone();
    const ix = (k.min.x + k.max.x) / 2 - nokta.x, iz = (k.min.z + k.max.z) / 2 - nokta.z, il = Math.hypot(ix, iz) || 1;
    son.x += ix / il * 1.8; son.z += iz / il * 1.8;
    son.x = sinirla(son.x, k.min.x + 1, k.max.x - 1); son.z = sinirla(son.z, k.min.z + 1, k.max.z - 1);
    son.y = k.max.y + 0.05;
    s.zip = { bas: p.konum.clone(), son, sure: 0, once: p.konum.clone(), cati: true, firlat: true, yuksel: true };
    s.zipBekle = 0.3; s.fareKilit = true; p.yerde = false; s.tekrar = 0.3;
    olay(G, 'zip'); olay(G, 'konus'); G.efekt?.sars?.(0.2, 0.25);
  } else { p.hiz.y += 4; s.fareKilit = true; }
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
    if (duvarIzin && !s.cek && s.duvarBekle <= 0 && (kos || (!p.yerde && havaHizi > 8))) {
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
  const carp = p.dev ? 1.3 : 1;
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
    p.hiz.y = 11; p.yerde = false; s.ziplamaTampon = 0; s.sonZemin = 0;
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
    const itki = s.ileri.clone().multiplyScalar(alt * 10 * carp).addScaledVector(s.istek, 11 * carp);
    itki.addScaledVector(ip, -itki.dot(ip));
    p.hiz.addScaledVector(itki, dt);
    s.swingT += dt;
    if (!s.cek && alt > 0.35) {
      // Alt noktada hız kazancı: teğet (hız) yönünde ek ivme.
      const sp = p.hiz.length();
      if (sp > 4 && sp < 52) p.hiz.addScaledVector(p.hiz, (alt * 0.55 * dt) );
    }
    if (s.cek) {
      // Makara: halat kısalır, radyal hız ~25 m/s'ye kadar ivmelenir; yan (sarkaç) hız korunur.
      s.cek.sure += dt;
      s.cekHiz = Math.min(25, s.cekHiz + 30 * dt);
      const radyal = p.hiz.dot(ip), istenen = -s.cekHiz;
      if (radyal > istenen) p.hiz.addScaledVector(ip, Math.max(istenen - radyal, -70 * dt));
      s.halat = Math.max(1.5, Math.min(s.halat, p.konum.distanceTo(s.ankraj)) - s.cekHiz * dt);
    } else {
      const z = zemin(G, s, p.konum, p.konum.y);
      if (p.konum.y - z < 5) s.halat = Math.max(8, s.halat - 14 * dt);
    }
  } else {
    p.hiz.addScaledVector(s.istek, 20 * carp * dt);
    const yatay = Math.hypot(p.hiz.x, p.hiz.z);
    // Hava kontrolü ivme verir, sallanmadan gelen momentumu kesmez.
    if (yatay > 42 * carp) { const oran = (yatay - (yatay - 42 * carp) * yumusak(2, dt)) / yatay; p.hiz.x *= oran; p.hiz.z *= oran; }
  }
  p.hiz.y -= 25 * dt * (s.cek ? 0.35 : 1);
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
function kahraman(G, s, dt) {
  const p = G.oyuncu, k = G.kahraman;
  if (!k) return;
  if (k.grup) {
    k.grup.position.copy(p.konum);
    const yon = s.duvar ? s.duvar.normal.clone().negate() : s.v(p.hiz.x, 0, p.hiz.z);
    if (yon.lengthSq() < 0.5) yon.copy(s.ileri);
    const aci = Math.atan2(yon.x, yon.z);
    s.q.setFromAxisAngle(s.yukari, aci);
    s.yonQ.slerp(s.q, yumusak(12, dt || 1));
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
  k.ayarla?.({ durum: p.durum === 'cek' ? 'sallan' : p.durum, hiz: p.hiz, yerde: p.yerde, dev: p.dev, dt });
  const dig = s.elAd === 'sag' ? 'sol' : 'sag';
  if (s.ankraj) k.dokunac?.(s.elAd, k.elNoktasi?.(s.elAd) || p.konum.clone().add(s.v(0, 1.4, 0)), s.ankraj);
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
  let en = null, enD = 1e9, enN = null;
  const cos = Math.cos(6 * RAD), fark = s.v();
  for (const d of G.dusman?.liste || []) {
    if (!d.canli || !sonlu(d.konum)) continue;
    fark.copy(d.konum); fark.y += d.dev ? 3 : 1;
    const mesafe = fark.distanceTo(bas);
    if (mesafe > 120 || mesafe < 0.5 || fark.clone().sub(bas).dot(dir) / mesafe < cos) continue;
    const pd = fark.distanceTo(G.oyuncu.konum);
    if (pd < enD) { enD = pd; en = d; enN = fark.clone(); }
  }
  return { hedef: en, nokta: enN, uzak: bas.clone().addScaledVector(dir, 60), dir };
}

export function guncelle(G, dt) {
  if (G.durum !== 'oyun') return;
  const s = durumlar.get(G), p = G.oyuncu;
  if (!s || !p || !Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, 0.05);
  const g = G.girdi, basili = kod => !!g?.basili?.(kod), yeni = kod => !!g?.yeniBasildi?.(kod);
  s.zaman += dt;
  for (const ad of ['tekrar', 'duvarBekle', 'zipBekle', 'hasarSure', 'dogusSure', 'saldiriSure', 'yumrukBekle', 'atisBekle', 'kamciBekle', 'kamciSure', 'ziplamaTampon', 'sonZemin', 'zincir', 'komboReset', 'dovus', 'kacisSure', 'kacisBekle', 'trickBekle', 'yuvarlan', 'takla']) s[ad] = Math.max(0, s[ad] - dt);
  if (!s.komboReset) s.komboSayi = 0;
  const hass = Number.isFinite(G.ayar?.hassasiyet) && G.ayar.hassasiyet > 0 ? G.ayar.hassasiyet : 1;
  const ters = (G.ayar?.yTers || G.ayar?.tersY) ? -1 : 1;
  s.yaw -= (g?.fareDX || 0) * 0.0023 * hass;
  s.pitch = sinirla(s.pitch - (g?.fareDY || 0) * 0.0021 * hass * ters, -60 * RAD, 75 * RAD);
  s.ileri.set(-Math.sin(s.yaw), 0, -Math.cos(s.yaw)); s.sag.set(Math.cos(s.yaw), 0, -Math.sin(s.yaw));
  const hedef = ankrajBul(G, s);
  const yh = (s.cek || s.zip || s.olmeSure > 0) ? null : yuksekHedefBul(G, s);
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
    p.hiz.multiplyScalar(1.3); G.kahraman?.devOl?.(true); olay(G, 'devBasla');
  }
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
      s.saldiri = 'yumruk';
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
    olay(G, 'kamci', { konum: p.konum.clone(), yon: s.ileri.clone() });
  }
  if (yeni('Space')) {
    if (s.tehdit && !s.kacisBekle && !s.zip) kacis(G, s);
    else s.ziplamaTampon = 0.12;
  }
  if (!basili('Fare2')) sallanBit(G, s, true);
  if (yeni('KeyE') && hedef && !s.zipBekle) zipBasla(G, s, hedef);
  if (!basili('Fare2')) s.fareKilit = false;
  if (basili('Fare2') && !s.ankraj && !s.zip && !s.tekrar && !s.fareKilit) {
    const hizli = !p.yerde || Math.hypot(p.hiz.x, p.hiz.z) > 9;
    const sw = hizli ? salinimHedefBul(G, s) : null;
    if (sw) sallanBasla(G, s, sw);
    else if (yh) cekBasla(G, s, yh);
    else if (hedef) sallanBasla(G, s, hedef);
    s.tekrar = 0.1;
  }
  if (s.zip) {
    const z = s.zip; z.sure += dt; const t = Math.min(1, z.sure / 0.4);
    const e = 1 - Math.pow(1 - t, 3);
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
      else if (z.firlat) { p.hiz.copy(s.ileri).multiplyScalar(4); p.hiz.y = 4; }
      else { p.hiz.copy(s.ileri).multiplyScalar(z.cati ? 2 : 5); p.hiz.y = z.cati ? 2 : 4; }
      s.zip = null; s.ziplamalar = 1; s.duvarBekle = 0.15;
    }
  } else {
    const adim = Math.ceil(dt / (1 / 120));
    for (let i = 0; i < adim; i++) { fizik(G, s, dt / adim); if (s.zip) break; }
  }
  if (s.cek && s.ankraj) {
    const d = p.konum.distanceTo(s.ankraj);
    if (d <= 3 || p.konum.y + 1 >= s.cek.ust) cekBitir(G, s, true);
    else if (s.cek.sure > 4) cekBitir(G, s, false);
  }
  if (!sonlu(p.konum) || !sonlu(p.hiz)) p.isinla(s.v(0, 60, 0));
  p.durum = s.dogusSure ? 'dogus' : s.hasarSure > 0.4 ? 'hasar' : (s.saldiriSure && !s.ankraj) ? s.saldiri : s.zip ? 'zip' : s.duvar ? 'duvar' : s.cek ? 'cek' : s.ankraj ? 'sallan' : p.yerde ? (Math.hypot(p.hiz.x, p.hiz.z) < 0.3 ? 'dur' : (basili('ShiftLeft') || basili('ShiftRight')) ? 'kos' : 'yuru') : p.hiz.y > 0 ? 'zipla' : 'dus';
  s.maxHiz = Math.max(s.maxHiz, p.hiz.length());
  const sonHedef = s.cek ? { nokta: s.ankraj } : (yh || ankrajBul(G, s));
  p.nisanVar = !!sonHedef; p.nisanNokta = sonHedef ? sonHedef.nokta.clone() : null;
  kamera(G, s, dt); kahraman(G, s, dt);
  G.efekt?.hizBulanikligi?.(sinirla(p.hiz.length() / 60, 0, 1));
  if (G.test && !s.rapor && s.zaman >= 6) {
    s.rapor = true;
    console.log(`[OYUNCU] sallanma ${s.sallanma}, max hız ${s.maxHiz.toFixed(1)}`);
  }
}
