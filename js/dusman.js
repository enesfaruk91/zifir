// Düşmanlar — Pas Robotları, Vızvız dronlar, hırsız kamyonet, DEV PAS ROBOT. SOZLESME §4.
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const rnd = (a, b) => a + Math.random() * (b - a);
const KV = V(), TMP = V(), TMP2 = V(), TMP3 = V();
const SIFIR = V();
const ZMAT = new THREE.Matrix4().makeScale(0, 0, 0);
const DUM = new THREE.Object3D();
const RENK = new THREE.Color();
const MAX_AKTIF = 25;

function aciFark(a, b) { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }

export function kur(G) {
  const sahne = G.sahne;

  // ---------- paylaşımlı geometri / malzeme ----------
  const gKutu = new THREE.BoxGeometry(1, 1, 1);
  const gKure = new THREE.SphereGeometry(1, 14, 10);
  const gSil = new THREE.CylinderGeometry(1, 1, 1, 10);
  const mPas = new THREE.MeshStandardMaterial({ color: 0xc4561a, roughness: 0.75, metalness: 0.45 });
  const mPasKoyu = new THREE.MeshStandardMaterial({ color: 0x7a3512, roughness: 0.8, metalness: 0.5 });
  const mGoz = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe2a8, emissiveIntensity: 0.9, roughness: 0.3 });
  const mBebek = new THREE.MeshBasicMaterial({ color: 0x1a0f20 });
  const mPil = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x66ffcc).multiplyScalar(2.2), toneMapped: false });
  const mTurunc = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff8a2a).multiplyScalar(2), toneMapped: false });
  const mDron = new THREE.MeshStandardMaterial({ color: 0x5d4a78, roughness: 0.4, metalness: 0.6 });
  const mDronKol = new THREE.MeshStandardMaterial({ color: 0x2c2238, roughness: 0.6, metalness: 0.5 });
  const mDronGoz = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3ff0e0).multiplyScalar(2), toneMapped: false });
  const mPerve = new THREE.MeshBasicMaterial({ color: 0xcfc6e8, transparent: true, opacity: 0.55 });
  const mKam = new THREE.MeshStandardMaterial({ color: 0x6c2e7a, roughness: 0.6, metalness: 0.4 });
  const mKabin = new THREE.MeshStandardMaterial({ color: 0xe0742a, roughness: 0.6, metalness: 0.3 });
  const mTeker = new THREE.MeshStandardMaterial({ color: 0x15101a, roughness: 0.9 });

  function parca(geo, mat, sx, sy, sz, x, y, z, ebeveyn) {
    const m = new THREE.Mesh(geo, mat);
    m.scale.set(sx, sy, sz); m.position.set(x, y, z);
    ebeveyn.add(m); return m;
  }

  // ---------- parçacık havuzları (InstancedMesh) ----------
  function havuz(geo, mat, n, yercekim) {
    const mesh = new THREE.InstancedMesh(geo, mat, n);
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < n; i++) mesh.setMatrixAt(i, ZMAT);
    sahne.add(mesh);
    return { mesh, n, i: 0, yer: yercekim, p: new Float32Array(n * 3), v: new Float32Array(n * 3), r: new Float32Array(n * 3),
      s: new Float32Array(n * 3), omur: new Float32Array(n), ol: new Float32Array(n), zy: new Float32Array(n) };
  }
  function ekle(h, x, y, z, vx, vy, vz, omur, olcek, zy, renk) {
    const i = h.i; h.i = (i + 1) % h.n; const k = i * 3;
    h.p[k] = x; h.p[k + 1] = y; h.p[k + 2] = z; h.v[k] = vx; h.v[k + 1] = vy; h.v[k + 2] = vz;
    h.r[k] = rnd(0, 6); h.r[k + 1] = rnd(0, 6); h.r[k + 2] = rnd(0, 6);
    h.s[k] = rnd(-12, 12); h.s[k + 1] = rnd(-12, 12); h.s[k + 2] = rnd(-12, 12);
    h.omur[i] = omur; h.ol[i] = olcek; h.zy[i] = zy;
    if (renk !== undefined) { h.mesh.setColorAt(i, renk); h.mesh.instanceColor.needsUpdate = true; }
  }
  function havuzGuncelle(h, dt) {
    let degisti = false;
    for (let i = 0; i < h.n; i++) {
      let o = h.omur[i]; if (o === 0) continue;
      degisti = true; o -= dt;
      if (o <= 0) { h.omur[i] = 0; h.mesh.setMatrixAt(i, ZMAT); continue; }
      h.omur[i] = o; const k = i * 3;
      h.v[k + 1] -= h.yer * dt;
      h.p[k] += h.v[k] * dt; h.p[k + 1] += h.v[k + 1] * dt; h.p[k + 2] += h.v[k + 2] * dt;
      if (h.p[k + 1] < h.zy[i] + 0.05 && h.v[k + 1] < 0) {
        h.p[k + 1] = h.zy[i] + 0.05; h.v[k + 1] *= -0.45; h.v[k] *= 0.7; h.v[k + 2] *= 0.7;
      }
      h.r[k] += h.s[k] * dt; h.r[k + 1] += h.s[k + 1] * dt; h.r[k + 2] += h.s[k + 2] * dt;
      DUM.position.set(h.p[k], h.p[k + 1], h.p[k + 2]);
      DUM.rotation.set(h.r[k], h.r[k + 1], h.r[k + 2]);
      DUM.scale.setScalar(h.ol[i] * Math.min(1, o * 3));
      DUM.updateMatrix(); h.mesh.setMatrixAt(i, DUM.matrix);
    }
    if (degisti) h.mesh.instanceMatrix.needsUpdate = true;
  }
  const hCivata = havuz(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.7, roughness: 0.4 }), 160, 18);
  const hYay = havuz(new THREE.TorusGeometry(0.1, 0.028, 5, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.7, roughness: 0.4 }), 96, 18);
  const hKivilcim = havuz(new THREE.SphereGeometry(0.09, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), 160, 0);
  const civataRenk = [0xb86a2e, 0x9aa0a8, 0xd8d8e0, 0xc4561a].map(c => new THREE.Color(c));

  function kivilcim(konum, renk = 0x7ff6ff, n = 8, hizi = 7) {
    for (let j = 0; j < n; j++) {
      RENK.set(renk).multiplyScalar(2.2);
      KV.set(rnd(-1, 1), rnd(-0.3, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(0.4, 1) * hizi);
      ekle(hKivilcim, konum.x, konum.y, konum.z, KV.x, KV.y, KV.z, rnd(0.25, 0.55), rnd(0.7, 1.4), -1000, RENK);
    }
  }
  function patlat(m, olcek, zy) {
    const nC = Math.round(9 * olcek), nY = Math.round(5 * olcek);
    for (let j = 0; j < nC; j++) {
      TMP.set(rnd(-1, 1), rnd(0.2, 1.4), rnd(-1, 1)).normalize().multiplyScalar(rnd(3, 8) * Math.sqrt(olcek));
      ekle(hCivata, m.x, m.y, m.z, TMP.x, TMP.y + 3, TMP.z, rnd(1.6, 2.8), olcek > 2 ? 2 : 1, zy, civataRenk[j & 3]);
    }
    for (let j = 0; j < nY; j++) {
      TMP.set(rnd(-1, 1), rnd(0.2, 1.4), rnd(-1, 1)).normalize().multiplyScalar(rnd(3, 7) * Math.sqrt(olcek));
      ekle(hYay, m.x, m.y, m.z, TMP.x, TMP.y + 3, TMP.z, rnd(1.6, 2.8), olcek > 2 ? 2 : 1, zy, civataRenk[(j + 1) & 3]);
    }
    kivilcim(m, 0x7ff6ff, 8 + Math.round(4 * olcek), 8);
    kivilcim(m, 0xffd060, 5, 5);
  }

  // ---------- enerji topları (dron) ----------
  const topGeo = new THREE.SphereGeometry(0.45, 12, 10);
  const topMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff9a3c).multiplyScalar(2.4), toneMapped: false, fog: false });
  const toplar = [];
  for (let i = 0; i < 12; i++) {
    const m = new THREE.Mesh(topGeo, topMat); m.visible = false; sahne.add(m);
    toplar.push({ m, aktif: false, hiz: V(), omur: 0 });
  }
  function topAt(kaynak, hedef) {
    const t = toplar.find(x => !x.aktif); if (!t) return;
    t.aktif = true; t.omur = 7; t.m.visible = true; t.m.position.copy(kaynak);
    t.hiz.copy(hedef).sub(kaynak).normalize().multiplyScalar(12);
  }
  function toplariGuncelle(dt, p) {
    for (const t of toplar) {
      if (!t.aktif) continue;
      t.omur -= dt; t.m.position.addScaledVector(t.hiz, dt);
      t.m.scale.setScalar(1 + 0.18 * Math.sin(G.t * 9));
      TMP.copy(p).y += 1;
      let son = t.omur <= 0;
      if (!son && t.m.position.distanceTo(TMP) < 1.4) { G.oyuncu?.hasarAl?.(8, t.m.position); son = true; }
      if (!son && G.sehir?.carpis) { const r = G.sehir.carpis(t.m.position, 0.4); if (r && (r.duvar || r.normal)) son = true; }
      if (son) { kivilcim(t.m.position, 0xffa040, 7, 5); t.aktif = false; t.m.visible = false; }
    }
  }

  // ---------- yardımcılar ----------
  const liste = [];
  const zemin = (x, z) => G.sehir?.zeminY?.(x, z) ?? 0;
  const oyuncuKonum = () => G.oyuncu?.konum ?? SIFIR;
  function merkez(e, out) { return out.set(e.konum.x, e.konum.y + e.oy, e.konum.z); }
  function msj(m, s = 3) { G.arayuz?.mesaj?.(m, s); }

  // ---------- model üreticiler ----------
  function robotYap(dev) {
    const g = new THREE.Group(), ic = new THREE.Group(); g.add(ic);
    parca(gKutu, mPas, 1.0, 1.0, 0.7, 0, 1.25, 0, ic);
    parca(gKutu, mPasKoyu, 0.85, 0.5, 0.65, 0, 2.0, 0, ic);
    const goz = parca(gKure, mGoz, 0.3, 0.3, 0.3, 0, 2.02, 0.3, ic);
    parca(gKure, mBebek, 0.13, 0.13, 0.1, 0, 2.02, 0.57, ic);
    parca(gSil, mPasKoyu, 0.04, 0.35, 0.04, 0.2, 2.45, 0, ic);
    parca(gKure, mTurunc, 0.09, 0.09, 0.09, 0.2, 2.65, 0, ic);
    const kol = [-1, 1].map(s => {
      const p = new THREE.Group(); p.position.set(s * 0.65, 1.65, 0); ic.add(p);
      parca(gKutu, mPas, 0.25, 0.8, 0.25, 0, -0.4, 0, p); parca(gKutu, mPasKoyu, 0.36, 0.36, 0.36, 0, -0.88, 0, p); return p;
    });
    const bac = [-1, 1].map(s => {
      const p = new THREE.Group(); p.position.set(s * 0.25, 0.75, 0); g.add(p);
      parca(gKutu, mPas, 0.3, 0.75, 0.35, 0, -0.37, 0, p); parca(gKutu, mPasKoyu, 0.34, 0.12, 0.5, 0, -0.72, 0.07, p); return p;
    });
    const pil = parca(gKutu, mPil, 0.5, 0.7, 0.15, 0, 1.35, -0.42, ic); pil.visible = !!dev;
    if (dev) g.scale.setScalar(3.5);
    return { g, ic, kol, bac, pil, goz };
  }
  function dronYap() {
    const g = new THREE.Group(), ic = new THREE.Group(); g.add(ic);
    parca(gKure, mDron, 0.55, 0.38, 0.55, 0, 0, 0, ic);
    const goz = parca(gKure, mDronGoz, 0.22, 0.22, 0.12, 0, 0.02, 0.5, ic);
    parca(gKutu, mDronKol, 1.7, 0.06, 0.12, 0, 0.22, 0, ic);
    const perve = [-1, 1].map(s => {
      parca(gSil, mDronKol, 0.05, 0.12, 0.05, s * 0.85, 0.28, 0, ic);
      return parca(gKutu, mPerve, 0.8, 0.02, 0.1, s * 0.85, 0.36, 0, ic);
    });
    return { g, ic, perve, goz };
  }
  function kamyonetYap() {
    const g = new THREE.Group(), ic = new THREE.Group(); g.add(ic);
    parca(gKutu, mKam, 2.2, 1.0, 4.2, 0, 0.95, 0, ic);
    parca(gKutu, mKam, 2.2, 1.2, 2.6, 0, 1.9, -0.8, ic);
    parca(gKutu, mKabin, 2.0, 1.0, 1.4, 0, 1.85, 1.35, ic);
    for (const s of [-1, 1]) {
      parca(gKure, mGoz, 0.3, 0.3, 0.2, s * 0.5, 2.05, 2.08, ic);
      parca(gKure, mBebek, 0.13, 0.13, 0.1, s * 0.5, 2.05, 2.25, ic);
    }
    const tek = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const t = parca(gSil, mTeker, 0.5, 0.35, 0.5, sx * 1.15, 0.5, sz * 1.4, ic); t.rotation.z = Math.PI / 2; tek.push(t);
    }
    return { g, ic, tek };
  }

  // ---------- varlık üretimi ----------
  function olusturVarlik(tur, dev) {
    const e = { tur, dev: !!dev, canli: false, konum: V(), can: 1, canMax: 1, yaw: rnd(0, 6.28), faz: rnd(0, 6), sersem: 0, cekil: 0,
      itme: V(), vy: 0, sal: -1, bekle: rnd(0.5, 1.5), vurus: 0, pop: 0, oy: 1.2, yr: 0.7, hizMax: 3.6, vitrin: false, ang: rnd(0, 6.28) };
    let m;
    if (tur === 'robot') { m = robotYap(dev); e.oy = dev ? 4.2 : 1.2; e.yr = dev ? 2.4 : 0.7; Object.assign(e, { ic: m.ic, kol: m.kol, bac: m.bac, pil: m.pil, goz: m.goz }); e.olcek = dev ? 3.5 : 1; }
    else if (tur === 'dron') { m = dronYap(); e.oy = 0; e.yr = 0.8; Object.assign(e, { ic: m.ic, perve: m.perve, goz: m.goz }); e.olcek = 1; }
    else { m = kamyonetYap(); e.oy = 1.2; e.yr = 1.8; Object.assign(e, { ic: m.ic, tek: m.tek }); e.olcek = 1; }
    e.grup = m.g; m.g.visible = false; sahne.add(m.g);
    liste.push(e); return e;
  }
  function aktifSay(tur) { let n = 0; for (const e of liste) if (e.canli && (!tur || e.tur === tur) && !e.dev) n++; return n; }
  function toplamAktif() { let n = 0; for (const e of liste) if (e.canli) n++; return n; }

  function etkinlestir(e, konum) {
    e.konum.copy(konum); e.canli = true; e.grup.visible = true;
    e.sersem = 0; e.cekil = 0; e.vy = 0; e.sal = -1; e.vurus = 0; e.pop = 0; e.itme.set(0, 0, 0); e.bekle = rnd(0.8, 2);
    if (e.tur === 'robot') { e.canMax = e.dev ? 100 : 40; e.hizMax = e.dev ? 3 : rnd(3.2, 4.2); }
    else if (e.tur === 'dron') { e.canMax = 20; e.hizMax = 9; e.yar = rnd(20, 30); }
    else { e.canMax = 75; e.hizMax = 13; }
    e.can = e.canMax; e.grup.position.copy(e.konum);
    return e;
  }
  function al(tur) {
    let e = liste.find(x => !x.canli && x.tur === tur && !x.dev);
    return e || olusturVarlik(tur, false);
  }

  function dogmaNoktasi(tur) {
    const p = oyuncuKonum(), s = G.sehir;
    for (let i = 0; i < 8; i++) {
      let v = null;
      if (s) v = tur === 'dron' ? s.rastgeleCati?.() : (Math.random() < 0.7 ? s.sokakNoktasi?.() : s.rastgeleCati?.());
      if (!v) break;
      const d = Math.hypot(v.x - p.x, v.z - p.z);
      if (d >= 40 && d <= 120) return v.clone();
    }
    const a = rnd(0, 6.283), r = rnd(45, 115);
    const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
    return V(x, zemin(x, z), z);
  }
  function dogur(tur, yakin) {
    const e = al(tur);
    let v;
    if (yakin) {
      const p = oyuncuKonum(), a = rnd(0, 6.283), r = rnd(yakin[0], yakin[1]);
      const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r; v = V(x, zemin(x, z), z);
    } else v = dogmaNoktasi(tur);
    if (tur === 'dron') { v.y = Math.max(v.y, zemin(v.x, v.z)) + rnd(10, 28); }
    etkinlestir(e, v); e.yaw = rnd(0, 6.28); e.vitrin = !!yakin;
    return e;
  }

  // kamyonet: yol boyunca
  function yolSec(e, konumHedefi) {
    let yollar = G.sehir?.yollar;
    if (!yollar || !yollar.length) {
      yollar = [{ x1: -80, z1: -80, x2: 80, z2: -80 }, { x1: 80, z1: -80, x2: 80, z2: 80 }, { x1: 80, z1: 80, x2: -80, z2: 80 }, { x1: -80, z1: 80, x2: -80, z2: -80 }];
    }
    e.yollar = yollar;
    const p = konumHedefi || oyuncuKonum();
    let en = null, enFark = 1e9, u = 0.5;
    for (let i = 0; i < 12; i++) {
      const r = yollar[(Math.random() * yollar.length) | 0], uu = Math.random();
      const x = r.x1 + (r.x2 - r.x1) * uu, z = r.z1 + (r.z2 - r.z1) * uu;
      const f = Math.abs(Math.hypot(x - p.x, z - p.z) - 85);
      if (f < enFark) { enFark = f; en = r; u = uu; }
    }
    e.road = en;
    e.konum.set(en.x1 + (en.x2 - en.x1) * u, 0, en.z1 + (en.z2 - en.z1) * u);
    e.konum.y = zemin(e.konum.x, e.konum.z);
    if (Math.random() < 0.5) e.hdf = V(en.x2, 0, en.z2); else e.hdf = V(en.x1, 0, en.z1);
    e.yaw = Math.atan2(e.hdf.x - e.konum.x, e.hdf.z - e.konum.z);
  }
  function kamSonraki(e) {
    const bx = e.hdf.x, bz = e.hdf.z, adaylar = [];
    for (const r of e.yollar) {
      if (r === e.road) continue;
      if (Math.hypot(r.x1 - bx, r.z1 - bz) < 12) adaylar.push([r, r.x2, r.z2]);
      else if (Math.hypot(r.x2 - bx, r.z2 - bz) < 12) adaylar.push([r, r.x1, r.z1]);
    }
    if (adaylar.length) { const a = adaylar[(Math.random() * adaylar.length) | 0]; e.road = a[0]; e.hdf.set(a[1], 0, a[2]); }
    else { const r = e.road; const geri = Math.hypot(r.x1 - bx, r.z1 - bz) > Math.hypot(r.x2 - bx, r.z2 - bz); e.hdf.set(geri ? r.x1 : r.x2, 0, geri ? r.z1 : r.z2); }
  }

  // ---------- hasar ----------
  let devAcik = false, sonUyari = -10;
  function yen(e) {
    e.canli = false; e.grup.visible = false;
    merkez(e, TMP3);
    patlat(TMP3, e.dev ? 3.5 : e.tur === 'kamyonet' ? 2 : 1, e.konum.y);
    G.olay.emit('robotYenildi', { konum: e.konum.clone(), tur: e.tur, dev: e.dev });
    G.oyuncu?.gucEkle?.(e.dev ? 50 : 15);
  }
  function vur(e, miktar, yon) {
    e.can -= miktar; e.pop = 0.25;
    if (!e.dev) e.itme.addScaledVector(yon, e.tur === 'kamyonet' ? 0 : 6);
    if (e.tur === 'kamyonet') e.sersem = 1.5;
    kivilcim(merkez(e, TMP3), 0xffd060, 5, 5);
    if (e.can <= 0) yen(e);
  }

  G.olay.on('devBasla', () => { devAcik = true; });
  G.olay.on('devBit', () => { devAcik = false; });
  G.olay.on('yumruk', v => {
    if (!v || !v.konum || !v.yon) return;
    const yon = TMP2.copy(v.yon).normalize().clone();
    const menz = devAcik ? 6 : 3, dmg = devAcik ? 50 : 25;
    for (const e of liste) {
      if (!e.canli) continue;
      merkez(e, TMP).sub(v.konum);
      // oyuncu ayak konumu: yatay mesafe + robot gövde yüksekliği aralığı
      const hd = Math.hypot(TMP.x, TMP.z), yy = v.konum.y - e.konum.y, yuk = e.oy * 2 + 0.6;
      const dikeyIci = yy > -1.5 && yy < yuk + 1.5;
      const d = TMP.length();
      const yakin = d <= 1.8 + e.yr || (hd <= 1.8 + e.yr && dikeyIci);
      if (!yakin) {
        if (d > menz + e.yr) continue;
        if (!devAcik && TMP.dot(yon) / (d || 1) < 0.2) continue;
      }
      if (d < 1e-3) TMP.set(yon.x, 0.2, yon.z); else if (hd < 0.5 || d < 1) TMP.set(TMP.x || yon.x, 0.2, TMP.z || yon.z);
      TMP.normalize();
      if (e.dev) {
        const ileri = TMP3.set(Math.sin(e.yaw), 0, Math.cos(e.yaw));
        TMP2.copy(v.konum).sub(e.konum).setY(0).normalize();
        if (ileri.dot(TMP2) < -0.2) { vur(e, devAcik ? 40 : 20, TMP); e.sersem = 1.0; }
        else if (G.t - sonUyari > 4) { sonUyari = G.t; msj('Sırtındaki parlayan pili vur! Arkasına geç!', 3); }
      } else vur(e, dmg, TMP);
    }
  });
  G.olay.on('kamci', v => {
    if (!v || !v.konum || !v.yon) return;
    const yon = v.yon.clone().normalize(); let en = null, enD = 30;
    for (const e of liste) {
      if (!e.canli || e.dev || e.tur === 'kamyonet') continue;
      const d = merkez(e, TMP).sub(v.konum).length();
      if (d < enD && TMP.dot(yon) / (d || 1) > 0.6) { enD = d; en = e; }
    }
    if (en) { en.cekil = 0.7; en.sersem = 2.5; en.sal = -1; kivilcim(merkez(en, TMP), 0xb070ff, 6, 4); }
  });

  // ---------- güncelleme ----------
  function robotGuncelle(e, dt, p, dx, dz, d) {
    const dev = e.dev;
    if (e.sersem > 0) { e.sersem -= dt; e.sal = -1; }
    else if (e.cekil <= 0) {
      const hy = Math.atan2(dx, dz);
      const don = (dev ? 0.7 : 3) * dt, f = aciFark(e.yaw, hy);
      e.yaw += Math.max(-don, Math.min(don, f));
      const dur = dev ? 7 : 2.4;
      if (d > dur && e.sal < 0) { const h = e.hizMax; e.konum.x += Math.sin(e.yaw) * h * dt; e.konum.z += Math.cos(e.yaw) * h * dt; e.faz += dt * h * 2.6; }
      e.bekle -= dt;
      const menz = dev ? 9 : 3.2;
      if (e.sal < 0 && e.bekle <= 0 && d < menz) { e.sal = dev ? 1.1 : 0.55; e.salSure = e.sal; }
      if (e.sal >= 0) {
        e.sal -= dt;
        if (e.sal < 0) {
          e.vurus = 0.3; e.bekle = dev ? 3 : 1.8;
          if (d < menz + 0.8 && Math.abs(p.y - e.konum.y) < 5) G.oyuncu?.hasarAl?.(dev ? 15 : 5, e.konum);
          kivilcim(TMP.set(e.konum.x + Math.sin(e.yaw) * 1.2 * e.olcek, e.konum.y + 0.4, e.konum.z + Math.cos(e.yaw) * 1.2 * e.olcek), 0xffc070, dev ? 12 : 4, 4);
        }
      }
    } else {
      e.cekil -= dt;
      TMP.set(p.x - e.konum.x, 0, p.z - e.konum.z);
      if (TMP.length() > 2) { TMP.normalize(); e.konum.addScaledVector(TMP, 35 * dt); }
    }
    // yalpalama + kol/bacak
    const fz = Math.sin(e.faz);
    e.bac[0].rotation.x = fz * 0.6; e.bac[1].rotation.x = -fz * 0.6;
    e.ic.rotation.z = Math.sin(e.faz * 0.5) * 0.12 + (e.sersem > 0 ? Math.sin(G.t * 25) * 0.1 : 0);
    e.ic.position.y = Math.abs(fz) * 0.07;
    let ka;
    if (e.sal >= 0) ka = -2.6 * (1 - e.sal / e.salSure);
    else if (e.vurus > 0) { e.vurus -= dt; ka = -2.6 + 3.3 * (1 - e.vurus / 0.3); }
    else ka = null;
    if (ka !== null) { e.kol[0].rotation.x = ka; e.kol[1].rotation.x = ka; }
    else { e.kol[0].rotation.x = -fz * 0.5; e.kol[1].rotation.x = fz * 0.5; }
    if (e.pil.visible) e.pil.scale.set(0.5, 0.7 * (1 + 0.12 * Math.sin(G.t * 6)), 0.15);
  }

  function dronGuncelle(e, dt, p) {
    if (e.sersem > 0) { e.sersem -= dt; }
    if (e.cekil > 0) {
      e.cekil -= dt;
      TMP.set(p.x - e.konum.x, p.y + 1 - e.konum.y, p.z - e.konum.z);
      if (TMP.length() > 2) { TMP.normalize(); e.konum.addScaledVector(TMP, 35 * dt); }
    } else if (e.sersem <= 0) {
      e.ang += dt * 0.25;
      const gy = zemin(e.konum.x, e.konum.z);
      const hx = p.x + Math.cos(e.ang) * e.yar, hz = p.z + Math.sin(e.ang) * e.yar;
      const hyy = Math.max(p.y + 7, gy + 8) + Math.sin(G.t * 1.3 + e.faz) * 1.5;
      TMP.set(hx - e.konum.x, hyy - e.konum.y, hz - e.konum.z);
      const l = TMP.length();
      if (l > 0.5) e.konum.addScaledVector(TMP, Math.min(e.hizMax, l * 0.8) * dt / l);
      e.yaw += aciFark(e.yaw, Math.atan2(p.x - e.konum.x, p.z - e.konum.z)) * Math.min(1, dt * 3);
      e.bekle -= dt;
      const d3 = e.konum.distanceTo(p);
      e.goz.scale.setScalar(1);
      if (e.bekle < 0.7 && d3 < 70) e.goz.scale.setScalar(1 + (0.7 - e.bekle) * 1.2);
      if (e.bekle <= 0) {
        e.bekle = rnd(3.5, 5);
        if (d3 < 70) topAt(merkez(e, TMP), TMP2.copy(p).setY(p.y + 1));
      }
    }
    e.faz += dt * 40;
    for (let i = 0; i < 2; i++) e.perve[i].rotation.y = e.faz * (i ? 1 : -1);
    e.ic.rotation.z = Math.sin(G.t * 2 + e.ang) * 0.1 + (e.sersem > 0 ? Math.sin(G.t * 30) * 0.2 : 0);
    if (G.sehir?.carpis) {
      const r = G.sehir.carpis(e.konum, 1.4);
      if (r?.duzeltme) e.konum.add(r.duzeltme);
    }
  }

  function kamGuncelle(e, dt, p, d) {
    if (!e.hdf) yolSec(e);
    if (e.sersem > 0) { e.sersem -= dt; e.ic.rotation.z = Math.sin(G.t * 30) * 0.03; return; }
    e.ic.rotation.z = 0;
    const hy = Math.atan2(e.hdf.x - e.konum.x, e.hdf.z - e.konum.z), f = aciFark(e.yaw, hy);
    e.yaw += Math.max(-2 * dt, Math.min(2 * dt, f));
    let h = e.hizMax * (Math.abs(f) > 0.7 ? 0.45 : 1);
    if (d < 25) h *= 1.25;
    e.konum.x += Math.sin(e.yaw) * h * dt; e.konum.z += Math.cos(e.yaw) * h * dt;
    for (const t of e.tek) t.rotation.x += h * dt * 2;
    if (Math.hypot(e.hdf.x - e.konum.x, e.hdf.z - e.konum.z) < 7) kamSonraki(e);
  }

  function varlikGuncelle(e, dt) {
    const p = oyuncuKonum();
    const dx = p.x - e.konum.x, dz = p.z - e.konum.z, d = Math.hypot(dx, dz);
    const eskiX = e.konum.x, eskiZ = e.konum.z;
    if (e.tur === 'robot') robotGuncelle(e, dt, p, dx, dz, d);
    else if (e.tur === 'dron') dronGuncelle(e, dt, p);
    else kamGuncelle(e, dt, p, d);
    // itme (darbe geri tepmesi)
    if (e.itme.lengthSq() > 0.01) { e.konum.x += e.itme.x * dt; e.konum.z += e.itme.z * dt; e.itme.multiplyScalar(Math.max(0, 1 - 6 * dt)); }
    if (e.tur !== 'dron') {
      if (e.tur === 'robot' && G.sehir?.carpis) {
        TMP.set(e.konum.x, e.konum.y + 1, e.konum.z);
        const r = G.sehir.carpis(TMP, e.yr + 0.1);
        if (r?.duzeltme) { e.konum.x += r.duzeltme.x; e.konum.z += r.duzeltme.z; }
      }
      const gy = zemin(e.konum.x, e.konum.z);
      if (gy - e.konum.y > 1.2 && e.tur === 'robot') { e.konum.x = eskiX; e.konum.z = eskiZ; }
      else if (e.konum.y > gy + 0.01) { e.vy -= 25 * dt; e.konum.y += e.vy * dt; if (e.konum.y <= gy) { e.konum.y = gy; e.vy = 0; } }
      else { e.konum.y = gy; e.vy = 0; }
    }
    // görünüm
    const g = e.grup; g.position.copy(e.konum); g.rotation.y = e.yaw;
    let sy = e.olcek, sxz = e.olcek;
    if (e.pop > 0) { e.pop -= dt; const k = Math.max(0, e.pop) * 4; sy *= 1 - 0.25 * k; sxz *= 1 + 0.15 * k; }
    g.scale.set(sxz, sy, sxz);
    // çok uzaktakini geri dönüştür (patron ve kamyonet hariç)
    if (!e.dev && e.tur !== 'kamyonet' && d > 200) { e.canli = false; g.visible = false; }
  }

  let dogmaSayac = 0, logSayac = 0, testSayac = 0, testKuruldu = false;
  G.dusman = {
    liste,
    robotHedef: 10, dronHedef: 6, dogmaCarpani: 1,
    enYakin(konum, r = Infinity) {
      let en = null, enD = r;
      for (const e of liste) {
        if (!e.canli) continue;
        const d = merkez(e, TMP).distanceTo(konum);
        if (d < enD) { enD = d; en = e; }
      }
      return en;
    },
    olustur(tur, konum) {
      if (tur === 'kamyonet') {
        const e = al('kamyonet'); etkinlestir(e, konum || SIFIR); yolSec(e, konum); e.vitrin = true; return e;
      }
      const e = dogur(tur, konum ? null : [40, 100]);
      if (konum) { e.konum.copy(konum); }
      return e;
    },
    dev(konum) {
      let e = liste.find(x => x.dev) || olusturVarlik('robot', true);
      etkinlestir(e, konum); e.yaw = 0; e.olcek = 3.5; return e;
    },
    kaldir(e) { if (e) { e.canli = false; e.grup.visible = false; } },
    kivilcim,
  };

  function testKurulum() {
    testKuruldu = true;
    const a = [0.4, 2.2, 4.1];
    for (let i = 0; i < 3; i++) {
      const e = dogur('robot', [12, 22]); e.vitrin = true; e.yaw = a[i];
    }
    for (let i = 0; i < 2; i++) { const e = dogur('dron', [15, 25]); e.vitrin = true; const p = oyuncuKonum(); e.konum.y = Math.max(e.konum.y, p.y + 5); }
    const k = G.dusman.olustur('kamyonet', V(30, 0, 30)); k.vitrin = true;
  }

  G.olay.on('robotYenildi', v => { if (G.test && v.tur !== 'kamyonet') console.log('[DUSMAN] robot yenildi:', v.tur); });

  if (!G.sehir) sahne.add(new THREE.HemisphereLight(0xb0a0ff, 0x402010, 1.6)); // şehir yoksa yedek ışık

  const _guncelle = function (G2, dt) {
    if (G2.durum !== 'oyun') return;
    if (G2.test && !testKuruldu) testKurulum();
    // doğma
    dogmaSayac -= dt;
    if (dogmaSayac <= 0) {
      dogmaSayac = 0.6 / G.dusman.dogmaCarpani;
      if (toplamAktif() < MAX_AKTIF) {
        if (aktifSay('robot') < G.dusman.robotHedef) dogur('robot');
        else if (aktifSay('dron') < G.dusman.dronHedef) dogur('dron');
      }
    }
    for (const e of liste) if (e.canli) varlikGuncelle(e, dt);
    toplariGuncelle(dt, oyuncuKonum());
    havuzGuncelle(hCivata, dt); havuzGuncelle(hYay, dt); havuzGuncelle(hKivilcim, dt);

    if (G2.test) {
      logSayac -= dt; testSayac -= dt;
      if (logSayac <= 0) { logSayac = 2; console.log('[DUSMAN] aktif ' + toplamAktif()); }
      if (testSayac <= 0) {
        testSayac = 2;
        const p = oyuncuKonum(); let hedef = null, hd = 1e9;
        for (const e of liste) {
          if (!e.canli || e.tur !== 'robot' || e.dev || e.vitrin) continue;
          const d = e.konum.distanceTo(p); if (d < hd) { hd = d; hedef = e; }
        }
        if (hedef) {
          const yon = TMP2.copy(hedef.konum).sub(p).setY(0).normalize().clone();
          const kon = hedef.konum.clone().addScaledVector(yon, -1.5);
          G.olay.emit('yumruk', { konum: kon, yon, guc: 1 });
          G.olay.emit('yumruk', { konum: kon, yon, guc: 1 });
        }
      }
    }
  };
  kur.guncelle = _guncelle;
}

export function guncelle(G, dt) { kur.guncelle?.(G, dt); }
