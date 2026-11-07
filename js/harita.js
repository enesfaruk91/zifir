// HARİTA ŞEHRİ — Ankara / Keçiören / Basınevleri (OpenStreetMap, ODbL). sehir.js bunu çağırır.
// Veri: assets/harita/basinevleri.json (+ kat_duzelt.json). Fizik: harita_fizik.js.
// Katmanlar: arazi/zemin, arazi kullanımı (park...), kaldırım, asfalt, yol çizgisi, binalar (birleşik), ağaç, lamba, trafik.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { haritaHazirla, rng, kimlikHash, KAT_M } from './harita_fizik.js';

const LOD_R = 150;
const EY = new THREE.Vector3(0, 1, 0);
const FOG_YOG = 0.0011;

// ---------- küçük geometri yardımcıları ----------
class Ag { // birleştirilebilir ham geometri
  constructor(renk = false, sd = false) { this.p = []; this.n = []; this.uv = []; this.c = renk ? [] : null; this.s = sd ? [] : null; this.i = []; }
  v(x, y, z, nx, ny, nz, u, v, c, s) {
    const k = this.p.length / 3;
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.uv.push(u, v);
    if (this.c) this.c.push(c[0], c[1], c[2]);
    if (this.s) this.s.push(s);
    return k;
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    if (this.c) g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    if (this.s) g.setAttribute('aSd', new THREE.Float32BufferAttribute(this.s, 1));
    const n = this.p.length / 3;
    g.setIndex(new THREE.BufferAttribute(n > 65000 ? new Uint32Array(this.i) : new Uint16Array(this.i), 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}
function halkaT(h) {
  const o = [];
  for (const p of h) { const q = o[o.length - 1]; if (!q || Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.02) o.push(p); }
  while (o.length > 1 && Math.hypot(o[0][0] - o[o.length - 1][0], o[0][1] - o[o.length - 1][1]) < 0.02) o.pop();
  return o;
}
// çokgen (delikli) -> üst bakan üçgenler; egim varsa kenar uzunluğu maxK'ya inene dek bölünür
function cokgenYuzey(ag, halka, delikler, yf, renk, uvOlcek, maxKenar) {
  const dis = halkaT(halka); if (dis.length < 3) return;
  const del = (delikler || []).map(halkaT).filter(h => h.length >= 3);
  const tum = [dis, ...del].flat();
  const kont = dis.map(p => new THREE.Vector2(p[0], p[1]));
  const holes = del.map(h => h.map(p => new THREE.Vector2(p[0], p[1])));
  let tri;
  try { tri = THREE.ShapeUtils.triangulateShape(kont, holes); } catch (e) { return; }
  let T = tri.map(t => t.map(i => tum[i]));
  if (maxKenar) { // 1->4 bölme
    for (let tur = 0; tur < 6; tur++) {
      const N = [];
      let bolundu = false;
      for (const [a, b, c] of T) {
        const L = Math.max(Math.hypot(a[0] - b[0], a[1] - b[1]), Math.hypot(b[0] - c[0], b[1] - c[1]), Math.hypot(c[0] - a[0], c[1] - a[1]));
        if (L <= maxKenar) { N.push([a, b, c]); continue; }
        bolundu = true;
        const ab = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], bc = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2], ca = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
        N.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]);
      }
      T = N; if (!bolundu) break;
    }
  }
  for (const [a, b, c] of T) {
    const cy = (b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1]);
    const t = cy >= 0 ? [a, b, c] : [a, c, b];
    const k0 = ag.p.length / 3;
    for (const p of t) ag.v(p[0], yf(p[0], p[1]), p[1], 0, 1, 0, p[0] * uvOlcek, p[1] * uvOlcek, renk, 0);
    ag.i.push(k0, k0 + 1, k0 + 2);
  }
}
// çizgi boyunca şerit (miter birleşimli). cizgi [[x,z]..], hw yarı genişlik
function seritYuzey(ag, cizgi, hw, yf, renk, uvOlcek, maxSeg, ofs = 0) {
  let P = [];
  for (let i = 0; i < cizgi.length; i++) {
    const a = cizgi[i];
    if (!i) { P.push(a); continue; }
    const b = cizgi[i - 1], L = Math.hypot(a[0] - b[0], a[1] - b[1]);
    if (maxSeg && L > maxSeg) { const n = Math.ceil(L / maxSeg); for (let k = 1; k < n; k++) P.push([b[0] + (a[0] - b[0]) * k / n, b[1] + (a[1] - b[1]) * k / n]); }
    P.push(a);
  }
  P = P.filter((p, i) => !i || Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]) > 0.05);
  if (P.length < 2) return;
  const Ln = [], Rn = [];
  for (let i = 0; i < P.length; i++) {
    const t = (j) => { const a = P[Math.max(0, j - 1)], b = P[Math.min(P.length - 1, j)]; const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };
    const t1 = i > 0 ? t(i) : t(1), t2 = i < P.length - 1 ? t(i + 1) : t(i);
    let nx = -(t1[1] + t2[1]), nz = t1[0] + t2[0]; // sol normal toplamı
    const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
    const d = Math.max(0.55, nx * -t1[1] + nz * t1[0]);
    const w = hw / d;
    const ox = nx * ofs / d, oz = nz * ofs / d;
    Ln.push([P[i][0] + nx * w + ox, P[i][1] + nz * w + oz]); Rn.push([P[i][0] - nx * w + ox, P[i][1] - nz * w + oz]);
  }
  let k0 = ag.p.length / 3;
  for (let i = 0; i < P.length; i++) {
    for (const q of [Ln[i], Rn[i]]) ag.v(q[0], yf(q[0], q[1]), q[1], 0, 1, 0, q[0] * uvOlcek, q[1] * uvOlcek, renk, 0);
  }
  for (let i = 0; i + 1 < P.length; i++) {
    const a = k0 + i * 2;
    // sol=a, sağ=a+1; yukarı bakan sarım
    ag.i.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
}
// çizgi boyunca kesik/sürekli ince çizgi (z-fight'sız: yüksek katman)
function cizgiYuzey(ag, cizgi, genislik, yf, renk, kesik, bosluk, ofs, kes0, kes1, nokta2) {
  // toplam uzunluk
  const U = [0];
  for (let i = 1; i < cizgi.length; i++) U.push(U[i - 1] + Math.hypot(cizgi[i][0] - cizgi[i - 1][0], cizgi[i][1] - cizgi[i - 1][1]));
  const top = U[U.length - 1];
  const at = (s) => {
    let i = 1; while (i < U.length - 1 && U[i] < s) i++;
    const a = cizgi[i - 1], b = cizgi[i], L = U[i] - U[i - 1] || 1, u = (s - U[i - 1]) / L;
    const dx = (b[0] - a[0]) / L, dz = (b[1] - a[1]) / L;
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, dx, dz];
  };
  const bas = kes0, son = top - kes1;
  if (son - bas < 2) return;
  for (let s = bas; s < son - 0.5;) {
    const e = Math.min(son, s + (kesik || (son - s)));
    // dilim: kısa adımlarla (arazi izlesin)
    const adim = 4, parca = [];
    for (let q = s; q < e + 0.001; q += adim) parca.push(Math.min(q, e));
    if (parca[parca.length - 1] < e - 0.01) parca.push(e);
    const pts = parca.map(q => { const r = at(q); return [r[0] - r[3] * ofs, r[1] + r[2] * ofs]; });
    if (pts.length >= 2) seritYuzey(ag, pts, genislik / 2, yf, renk, 0.1, 0);
    s = e + (kesik ? bosluk : 1e9);
  }
}

// ---------- ana kurulum ----------
export function haritaKur(G, veri, katDuz, ctx) {
  const { doku, modelYukle, Kume, kutuModel, silindirModel, GLSL_HASH, tl, aniso } = ctx;
  const qs = new URLSearchParams(location.search);
  const egim = qs.get('egim') === '1';
  const sahne = G.sahne;
  const test = G.test;
  const H = haritaHazirla(THREE, veri, katDuz, { egim });
  const Y = H.Y;
  const kp = H.kapsam;
  const MAXK = egim ? 8 : 0;

  // ---------- atmosfer (sehir.js ile aynı saat dilimleri) ----------
  const sisRenk = new THREE.Color(0x161c2a);
  sahne.fog = new THREE.FogExp2(sisRenk, FOG_YOG);
  const ayYon = new THREE.Vector3(0, 0.48, 0.877).normalize();
  let envGece = null;
  const zeminMatlar = [];
  const gokTex = tl.load('assets/gokyuzu.jpg', (t) => {
    const pmrem = new THREE.PMREMGenerator(G.renderer);
    envGece = pmrem.fromEquirectangular(t).texture; pmrem.dispose(); saatEnv();
  });
  gokTex.colorSpace = THREE.SRGBColorSpace; gokTex.mapping = THREE.EquirectangularReflectionMapping; gokTex.wrapS = THREE.RepeatWrapping;
  sahne.background = gokTex; sahne.backgroundIntensity = 0.9;

  const hemi = new THREE.HemisphereLight(0x6a7a9a, 0x1a2030, 1.1);
  sahne.add(hemi);
  const ay = new THREE.DirectionalLight(0xa8bcff, 1.5);
  ay.castShadow = true; ay.shadow.mapSize.set(2048, 2048);
  const SK = 75;
  Object.assign(ay.shadow.camera, { left: -SK, right: SK, top: SK, bottom: -SK, near: 1, far: 620 });
  ay.shadow.bias = -0.0004; ay.shadow.normalBias = 0.6;
  sahne.add(ay, ay.target);

  const IS = { acik: { value: 1.0 }, penc: { value: 1.0 }, zemin: 1.0 };

  // ---------- malzemeler ----------
  const tCephe = [1, 4, 3].map(n => ({ map: doku(`cephe_${n}.jpg`), em: doku(`cephe_${n}_isik.jpg`) }));
  function cepheMat(n) {
    const m = new THREE.MeshStandardMaterial({
      color: 0xffffff, vertexColors: true, roughness: 0.86, metalness: 0.0,
      map: tCephe[n].map, emissiveMap: tCephe[n].em, emissive: new THREE.Color(1, 1, 1), emissiveIntensity: 1,
    });
    m.onBeforeCompile = (s) => {
      s.uniforms.uAcik = IS.acik; s.uniforms.uPenc = IS.penc;
      s.vertexShader = s.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aSd; varying float vSd;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSd = aSd;');
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', `#include <common>
varying float vSd; uniform float uAcik, uPenc;
${GLSL_HASH}`)
        .replace('#include <map_fragment>', `
vec3 wallC = diffuseColor.rgb;
float lum = dot(texture2D(map, vMapUv).rgb, vec3(0.3, 0.59, 0.11));
float kk = clamp(pow(lum / 0.042, 1.25), 0.0, 1.3);
vec3 glass = vec3(0.05, 0.07, 0.1);
float wm = smoothstep(0.12, 0.5, kk);
diffuseColor.rgb = mix(glass, wallC * (0.8 + 0.3 * kk), wm) * uAcik;`)
        .replace('#include <emissivemap_fragment>', `
{
  float ew = dot(texture2D(emissiveMap, vMapUv).rgb, vec3(0.3, 0.59, 0.11));
  vec2 wc = floor(vMapUv * 8.0) + vSd * 31.0;
  float w1 = h21(wc), w2 = h21(wc + 7.7);
  vec3 wcol = mix(vec3(1.0, 0.58, 0.2), vec3(1.0, 0.82, 0.5), w2);
  if (w2 < 0.12) wcol = vec3(0.62, 0.78, 1.0);
  totalEmissiveRadiance = wcol * ew * step(0.42, w1) * 1.1 * uPenc;
}`);
    };
    return m;
  }
  const cepheMats = [cepheMat(0), cepheMat(1), cepheMat(2)];
  let catiMat = null;
  const cimenTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d');
    c.fillStyle = '#9a9a9a'; c.fillRect(0, 0, 256, 256);
    const r = rng(5);
    for (let i = 0; i < 5200; i++) { const g = 120 + r() * 120 | 0; c.fillStyle = `rgba(${g},${g},${g},${0.18 + r() * 0.3})`; const s = 1 + r() * 3; c.fillRect(r() * 256, r() * 256, s, s * (0.6 + r())); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t;
  })();
  catiMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, map: cimenTex, roughness: 0.9 });
  const zMat = (opt) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, ...opt }); zeminMatlar.push(m); return m; };
  const tAsf = doku('asfalt_islak.jpg'), tKal = doku('kaldirim.jpg');
  const matZemin = zMat({ vertexColors: true, map: cimenTex, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
  const matArazi = zMat({ vertexColors: true, map: cimenTex, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: 0 });
  const matKaldirim = zMat({ vertexColors: true, map: tKal, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const matAsfalt = zMat({ vertexColors: true, map: tAsf, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const matCizgi = zMat({ vertexColors: true, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  matAsfalt.userData.k = 0.62; matKaldirim.userData.k = 0.95; matZemin.userData.k = 1.0; matArazi.userData.k = 1.0; matCizgi.userData.k = 1.0;

  // ---------- zemin tabanı (kapsam kenarları ızgara çizgisi) ----------
  {
    const gen = (a, b, adim, dis) => { // a..b arası iç, dışa dis kadar
      const k = [];
      for (let v = a - dis; v < a - 1; v += Math.max(adim * 4, 60)) k.push(v);
      for (let v = a; v < b - 1; v += adim) k.push(v);
      k.push(b);
      for (let v = b + Math.max(adim * 4, 60); v <= b + dis + 1; v += Math.max(adim * 4, 60)) k.push(v);
      return k;
    };
    const adim = egim ? 8 : 120;
    const xs = gen(kp.x0, kp.x1, adim, 1300), zs = gen(kp.z0, kp.z1, adim, 1300); // dışarısı seyrek (gen)
    const ag = new Ag(true);
    const icRenk = [0.46, 0.45, 0.42], disRenk = [0.2, 0.22, 0.21];
    for (let j = 0; j < zs.length; j++) for (let i = 0; i < xs.length; i++) {
      const ic = xs[i] >= kp.x0 - 0.01 && xs[i] <= kp.x1 + 0.01 && zs[j] >= kp.z0 - 0.01 && zs[j] <= kp.z1 + 0.01;
      ag.v(xs[i], Y(xs[i], zs[j]) - 0.02, zs[j], 0, 1, 0, xs[i] / 8, zs[j] / 8, ic ? icRenk : disRenk, 0);
    }
    const nx = xs.length;
    for (let j = 0; j + 1 < zs.length; j++) for (let i = 0; i + 1 < nx; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      ag.i.push(a, c, b, b, c, d);
    }
    const m = new THREE.Mesh(ag.geo(), matZemin); m.receiveShadow = true; m.frustumCulled = false; sahne.add(m);
  }

  // ---------- arazi kullanımı ----------
  const ALAN_RENK = {
    park: [0.2, 0.38, 0.14], cimen: [0.28, 0.44, 0.17], orman: [0.12, 0.27, 0.1], spor_alani: [0.5, 0.3, 0.24],
    oyun_alani: [0.55, 0.45, 0.28], otopark: [0.36, 0.36, 0.38], okul_arazisi: [0.52, 0.5, 0.46], su: [0.1, 0.22, 0.38],
  };
  {
    const ag = new Ag(true);
    for (const a of veri.alanlar) {
      const r = ALAN_RENK[a.tur]; if (!r) continue;
      cokgenYuzey(ag, a.halka, a.ic_halkalar, (x, z) => Y(x, z) + (egim ? 0.06 : 0.03), r, 1 / 8, MAXK);
    }
    if (ag.i.length) { const m = new THREE.Mesh(ag.geo(), matArazi); m.receiveShadow = true; m.frustumCulled = false; sahne.add(m); }
  }

  // ---------- yollar ----------
  const YOL_STIL = { // [asfalt renk, kaldırım var?, kaldırım yarı ek]
    secondary: { kal: 2.4, ren: [0.33, 0.33, 0.36], cizgi: 'cift' },
    secondary_link: { kal: 1.6, ren: [0.33, 0.33, 0.36], cizgi: 'yok' },
    tertiary: { kal: 2.2, ren: [0.34, 0.34, 0.37], cizgi: 'kesik' },
    residential: { kal: 2.0, ren: [0.36, 0.36, 0.39], cizgi: 'kesik' },
    service: { kal: 0, ren: [0.4, 0.39, 0.41], cizgi: 'yok' },
    footway: { kal: 0, ren: [0.62, 0.6, 0.56], cizgi: 'yok' },
    steps: { kal: 0, ren: [0.5, 0.48, 0.45], cizgi: 'yok' },
  };
  const yolSeg = []; // yollara uzaklık sorguları için [x1,z1,x2,z2,hw]
  const kavsakSay = new Map();
  const anahtar = (x, z) => Math.round(x / 2) + ',' + Math.round(z / 2);
  for (const y of veri.yollar) {
    if (y.kopru_tunel === 'tunel') continue;
    const u = y.nokta;
    if (u.length < 2) continue;
    for (const p of [u[0], u[u.length - 1]]) { const k = anahtar(p[0], p[1]); kavsakSay.set(k, (kavsakSay.get(k) || 0) + 1); }
    for (let i = 1; i < u.length - 1; i++) { const k = anahtar(u[i][0], u[i][1]); kavsakSay.set(k, (kavsakSay.get(k) || 0) + 0.4); }
  }
  const kavsaklar = [];
  for (const [k, n] of kavsakSay) if (n >= 2) { const [a, b] = k.split(',').map(Number); kavsaklar.push([a * 2, b * 2]); }
  const yakinKavsak = (x, z, r) => { for (const q of kavsaklar) if (Math.abs(q[0] - x) < r && Math.abs(q[1] - z) < r && Math.hypot(q[0] - x, q[1] - z) < r) return true; return false; };
  {
    const agK = new Ag(true), agA = new Ag(true), agC = new Ag(true);
    const BEYAZ = [0.85, 0.85, 0.8], SARI = [0.8, 0.62, 0.12];
    for (const y of veri.yollar) {
      if (y.kopru_tunel === 'tunel') continue;
      const st = YOL_STIL[y.tur] || YOL_STIL.service;
      const hw = y.genislik / 2;
      for (let i = 0; i + 1 < y.nokta.length; i++) yolSeg.push([y.nokta[i][0], y.nokta[i][1], y.nokta[i + 1][0], y.nokta[i + 1][1], hw]);
      if (st.kal > 0) seritYuzey(agK, y.nokta, hw + st.kal, (x, z) => Y(x, z) + 0.05, [0.62, 0.61, 0.58], 1 / 5, MAXK);
      seritYuzey(agA, y.nokta, hw, (x, z) => Y(x, z) + 0.1, st.ren, 1 / 9, MAXK);
      if (y.arac_yolu && (st.cizgi === 'kesik' || st.cizgi === 'cift')) {
        const tr = hw + 3;
        // kavşak yakınında çizgi kesilir: yol dilimlerini kavşak mesafesine göre çiz
        const U = [0]; for (let i = 1; i < y.nokta.length; i++) U.push(U[i - 1] + Math.hypot(y.nokta[i][0] - y.nokta[i - 1][0], y.nokta[i][1] - y.nokta[i - 1][1]));
        const L = U[U.length - 1];
        if (L > 2 * tr + 6) {
          if (st.cizgi === 'kesik') cizgiYuzey(agC, y.nokta, 0.14, (x, z) => Y(x, z) + 0.16, BEYAZ, 3, 5, 0, tr, tr);
          else {
            cizgiYuzey(agC, y.nokta, 0.14, (x, z) => Y(x, z) + 0.16, SARI, 0, 0, 0.14, tr, tr);
            cizgiYuzey(agC, y.nokta, 0.14, (x, z) => Y(x, z) + 0.16, SARI, 0, 0, -0.14, tr, tr);
          }
          if (st.cizgi === 'cift' || hw > 4.2) { // kenar çizgileri
            cizgiYuzey(agC, y.nokta, 0.12, (x, z) => Y(x, z) + 0.16, BEYAZ, 0, 0, hw - 0.45, tr, tr);
            cizgiYuzey(agC, y.nokta, 0.12, (x, z) => Y(x, z) + 0.16, BEYAZ, 0, 0, -(hw - 0.45), tr, tr);
          }
        }
      }
    }
    for (const [ag, mat, gol] of [[agK, matKaldirim, true], [agA, matAsfalt, true], [agC, matCizgi, false]]) {
      if (!ag.i.length) continue;
      const m = new THREE.Mesh(ag.geo(), mat); m.receiveShadow = gol; m.frustumCulled = false; sahne.add(m);
    }
  }
  // yollara en kısa uzaklık (ağaç/lamba yerleşimi) — 32 m ızgara
  const YG = 32, ygOx = kp.x0 - 64, ygOz = kp.z0 - 64, ygNx = Math.ceil((kp.x1 - kp.x0 + 128) / YG) + 1, ygNz = Math.ceil((kp.z1 - kp.z0 + 128) / YG) + 1;
  const ygHucre = Array.from({ length: ygNx * ygNz }, () => []);
  for (const s of yolSeg) {
    const a = Math.floor((Math.min(s[0], s[2]) - ygOx - 12) / YG), b = Math.floor((Math.max(s[0], s[2]) - ygOx + 12) / YG);
    const c = Math.floor((Math.min(s[1], s[3]) - ygOz - 12) / YG), d = Math.floor((Math.max(s[1], s[3]) - ygOz + 12) / YG);
    for (let i = Math.max(0, a); i <= Math.min(ygNx - 1, b); i++) for (let j = Math.max(0, c); j <= Math.min(ygNz - 1, d); j++) ygHucre[j * ygNx + i].push(s);
  }
  // en kötü durum: (asfalt kenarına uzaklık) = merkez uzaklığı - yarı genişlik
  function yolBosluk(x, z) {
    const i = Math.floor((x - ygOx) / YG), j = Math.floor((z - ygOz) / YG);
    if (i < 0 || j < 0 || i >= ygNx || j >= ygNz) return 99;
    let en = 99;
    for (const s of ygHucre[j * ygNx + i]) {
      const dx = s[2] - s[0], dz = s[3] - s[1], l2 = dx * dx + dz * dz || 1;
      let t = ((x - s[0]) * dx + (z - s[1]) * dz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const d = Math.hypot(x - (s[0] + dx * t), z - (s[1] + dz * t)) - s[4];
      if (d < en) en = d;
    }
    return en;
  }

  // ---------- binalar: çokgen extrude, malzeme başına TEK birleşik geometri ----------
  const SIVA = [ // krem / bej / somon / açık sarı / kirli beyaz (Basınevleri tipik sıva)
    [0.86, 0.78, 0.6], [0.8, 0.7, 0.52], [0.86, 0.62, 0.5], [0.9, 0.72, 0.5], [0.82, 0.8, 0.74],
    [0.78, 0.55, 0.42], [0.88, 0.82, 0.66], [0.7, 0.66, 0.6],
  ];
  const CATI_R = [[1.0, 0.95, 0.9], [0.85, 0.85, 0.88], [1.0, 0.6, 0.46], [0.75, 0.78, 0.8], [0.95, 0.7, 0.55]];
  const wallAg = [new Ag(true, true), new Ag(true, true), new Ag(true, true)];
  const roofAg = new Ag(true, false);
  for (const b of H.binalar) {
    const u1 = kimlikHash(b.id, 1), u2 = kimlikHash(b.id, 2), u3 = kimlikHash(b.id, 3);
    let sr = SIVA[Math.floor(u1 * SIVA.length)];
    const ton = 0.92 + u2 * 0.16;
    const renk = [sr[0] * ton, sr[1] * ton, sr[2] * ton];
    const ag = wallAg[b.tur === 'ibadet' ? 0 : (u3 < 0.55 ? 0 : u3 < 0.9 ? 1 : 2)];
    if (b.tur === 'ibadet') { renk[0] = 0.85; renk[1] = 0.83; renk[2] = 0.78; }
    const ref = b.y1 - Math.max(1, Math.round(b.yuk / KAT_M)) * KAT_M;
    const sd = u2;
    for (const e of b.kenar) {
      const n = Math.max(1, Math.round(e.L / 3.4));
      const uA = Math.floor(kimlikHash(b.id, 11 + (e.ax * 7 + e.az * 13 | 0)) * 8) / 8;
      const u0 = uA, u1w = uA + n / 8;
      const v0 = (b.y0 - ref) / (KAT_M * 8), v1 = (b.y1 - ref) / (KAT_M * 8);
      const k0 = ag.p.length / 3;
      for (const [x, z, yy, uu, vv] of [[e.ax, e.az, b.y0, u0, v0], [e.bx, e.bz, b.y0, u1w, v0], [e.bx, e.bz, b.y1, u1w, v1], [e.ax, e.az, b.y1, u0, v1]])
        ag.v(x, yy, z, e.nx, 0, e.nz, uu, vv, renk, sd);
      // (-dz, 0, dx) yönü ile dış normal aynı mı (v0,v1,v2 sarımı)?
      const d = (-e.dz) * e.nx + e.dx * e.nz;
      if (d > 0) ag.i.push(k0, k0 + 1, k0 + 2, k0, k0 + 2, k0 + 3); else ag.i.push(k0, k0 + 2, k0 + 1, k0, k0 + 3, k0 + 2);
    }
    const cr = CATI_R[Math.floor(u1 * 97) % CATI_R.length];
    cokgenYuzey(roofAg, b.halka, b.halkalar.slice(1).map(h => { const o = []; for (let i = 0; i < h.length; i += 2) o.push([h[i], h[i + 1]]); return o; }), () => b.y1, cr, 1 / 6, 0);
  }
  const binaMeshler = [];
  wallAg.forEach((ag, i) => {
    if (!ag.i.length) return;
    const m = new THREE.Mesh(ag.geo(), cepheMats[i]); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
    sahne.add(m); binaMeshler.push(m);
  });
  { const m = new THREE.Mesh(roofAg.geo(), catiMat); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; sahne.add(m); binaMeshler.push(m); }

  // ---------- sınır sis perdesi (görünmez duvarın görsel karşılığı) ----------
  const perdeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    uniforms: { uRenk: { value: new THREE.Color(0x161c2a) } },
    vertexShader: 'varying float vY; void main(){ vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'varying float vY; uniform vec3 uRenk; void main(){ gl_FragColor = vec4(uRenk, pow(1.0 - vY, 1.4) * 0.95); }',
  });
  {
    const ag = new Ag(false);
    const Hp = 190;
    const duvar = (x1, z1, x2, z2) => {
      const k = ag.p.length / 3;
      ag.v(x1, -20, z1, 0, 1, 0, 0, 0); ag.v(x2, -20, z2, 0, 1, 0, 1, 0); ag.v(x2, Hp, z2, 0, 1, 0, 1, 1); ag.v(x1, Hp, z1, 0, 1, 0, 0, 1);
      ag.i.push(k, k + 1, k + 2, k, k + 2, k + 3);
    };
    duvar(kp.x0, kp.z0, kp.x1, kp.z0); duvar(kp.x1, kp.z0, kp.x1, kp.z1); duvar(kp.x1, kp.z1, kp.x0, kp.z1); duvar(kp.x0, kp.z1, kp.x0, kp.z0);
    const m = new THREE.Mesh(ag.geo(), perdeMat); m.frustumCulled = false; m.renderOrder = 5; sahne.add(m);
  }

  // ---------- GLB tabanlı süsler: ağaç, lamba, çatı eşyası, trafik (asenkron) ----------
  const grup = new THREE.Group(); grup.name = 'harita-pro'; sahne.add(grup);
  const mats = {
    govde: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.15, emissive: new THREE.Color(0x15171f) }),
    isik: new THREE.MeshBasicMaterial({ vertexColors: true }),
    boya: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0.45, emissive: new THREE.Color(0x0b0c12) }),
    cam: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.06, metalness: 0.95, emissive: new THREE.Color(0x05070c) }),
  };
  const kumeler = [];
  const durum = { ag: 0, lamba: 0, cati: 0, arac: 0 };
  const arac = [];
  let trafikGuncelle = () => {};
  const RP = rng(424242), rp = (a, b) => a + (b - a) * RP();

  // ağaç yerleşimi: parklarda serpiştirme + kaldırımlarda
  const agacNok = [];
  {
    const R = rng(777);
    const kor = (x, z, pay) => !H.binaIciMi(x, z, pay);
    for (const a of veri.alanlar) {
      const aralik = a.tur === 'orman' ? 6 : a.tur === 'park' ? 9 : a.tur === 'cimen' ? 16 : 0;
      if (!aralik) continue;
      let mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9;
      for (const p of a.halka) { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mnz = Math.min(mnz, p[1]); mxz = Math.max(mxz, p[1]); }
      const ps = { halkalar: [Float64Array.from(halkaT(a.halka).flat()), ...(a.ic_halkalar || []).map(h => Float64Array.from(halkaT(h).flat()))], minx: mnx, maxx: mxx, minz: mnz, maxz: mxz };
      const ic = (x, z) => { let c = false; for (const hk of ps.halkalar) { const n = hk.length / 2; for (let i = 0, j = n - 1; i < n; j = i++) { const xi = hk[i * 2], zi = hk[i * 2 + 1], xj = hk[j * 2], zj = hk[j * 2 + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } } return c; };
      for (let x = mnx; x < mxx; x += aralik) for (let z = mnz; z < mxz; z += aralik) {
        const px = x + (R() - 0.5) * aralik * 0.9, pz = z + (R() - 0.5) * aralik * 0.9;
        if (!ic(px, pz) || !kor(px, pz, 2.5) || yolBosluk(px, pz) < 2.5) continue;
        if (R() < 0.15) continue;
        agacNok.push([px, pz, 0.8 + R() * 0.9, R() * 6.28, 0]);
      }
    }
    const parkSay = agacNok.length;
    // kaldırım ağaçları
    for (const y of veri.yollar) {
      if (!y.arac_yolu || !['residential', 'tertiary', 'secondary'].includes(y.tur) || y.kopru_tunel) continue;
      const hw = y.genislik / 2, off = hw + (YOL_STIL[y.tur].kal * 0.6);
      for (let i = 0; i + 1 < y.nokta.length; i++) {
        const [x1, z1] = y.nokta[i], [x2, z2] = y.nokta[i + 1];
        const L = Math.hypot(x2 - x1, z2 - z1); if (L < 8) continue;
        const dx = (x2 - x1) / L, dz = (z2 - z1) / L;
        for (let s = 6 + R() * 8; s < L - 4; s += 18 + R() * 10) for (const sg of [-1, 1]) {
          if (R() < 0.5) continue;
          const px = x1 + dx * s - dz * off * sg, pz = z1 + dz * s + dx * off * sg;
          if (!kor(px, pz, 1.4) || yolBosluk(px, pz) < 1.0 || yakinKavsak(px, pz, hw + 9)) continue;
          if (!H.sinirIci(px, pz, 4)) continue;
          agacNok.push([px, pz, 0.75 + R() * 0.5, R() * 6.28, 1]);
        }
      }
    }
    durum.parkAgac = parkSay;
  }

  // lamba yerleşimi
  const lambaNok = [];
  {
    const R = rng(4242);
    for (const y of veri.yollar) {
      if (!y.arac_yolu || y.tur === 'service' || y.kopru_tunel) continue;
      const hw = y.genislik / 2;
      let ters = R() < 0.5;
      for (let i = 0; i + 1 < y.nokta.length; i++) {
        const [x1, z1] = y.nokta[i], [x2, z2] = y.nokta[i + 1];
        const L = Math.hypot(x2 - x1, z2 - z1); if (L < 6) continue;
        const dx = (x2 - x1) / L, dz = (z2 - z1) / L;
        for (let s = 5 + R() * 5; s < L - 3; s += 32) {
          ters = !ters;
          const sg = ters ? 1 : -1, off = hw + 0.9;
          const px = x1 + dx * s - dz * off * sg, pz = z1 + dz * s + dx * off * sg;
          if (H.binaIciMi(px, pz, 0.8) || yolBosluk(px, pz) < 0.4 || yakinKavsak(px, pz, hw + 5) || !H.sinirIci(px, pz, 3)) continue;
          lambaNok.push([px, pz, dz * sg, -dx * sg]); // baş yolun merkezine doğru
        }
      }
    }
  }
  const LH = 8.2;
  for (const l of lambaNok) H.inceEkle(l[0], Y(l[0], l[1]), l[1], 0.45, LH, 0.45);
  durum.lamba = lambaNok.length;

  (async () => {
    const hata = [];
    const yukle = async (u, o) => { try { return await modelYukle('assets/3d/' + u, o); } catch (e) { hata.push(u); return null; } };
    const aracAd = ['sedan', 'taxi', 'van', 'delivery', 'suv', 'hatchbackSports'];
    const aracO = { isikRe: /^light(Front|Back)/i, onRe: /^lightFront/i, isikGuc: 2.2, boy: 4.5, renk: 1, boyaRe: /^paint(?!White)/i, camRe: /^window/i, lastikRe: /^carTire/i };
    const [araclarM, lambaM, agacM, acM, tankM, antM] = await Promise.all([
      Promise.all(aracAd.map(a => yukle(`arac/${a}.glb`, { ...aracO, boyaBeyaz: a !== 'taxi', boy: a === 'delivery' ? 6.4 : a === 'van' ? 5.0 : a === 'suv' ? 4.8 : 4.4 }))),
      yukle('sehir/Streetlight_Single.glb', { isikRe: /^Light$/, isikGuc: 3, yuk: LH, merkezle: false }),
      yukle('arac/treeLarge.glb', { yuk: 4.8, renk: 0.85 }),
      yukle('cyberpunk/AC.glb', { yatay: 1.9, renk: 4 }),
      yukle('cyberpunk/Tank.glb', { yatay: 2.4, renk: 4 }),
      yukle('cyberpunk/Antenna_2.glb', { yuk: 5.5, renk: 4 }),
    ]);
    if (test && hata.length) console.warn('[HARITA] model yuklenemedi:', hata.join(','));
    // ağaçlar
    {
      const m = agacM || kutuModel([[0.4, 2.6, 0.4, 0, 1.3, 0, '#4a3322'], [2.8, 2.6, 2.8, 0, 3.7, 0, '#2f5a2a']]);
      const k = new Kume(grup, m, agacNok.length + 8, mats, true);
      const R = rng(31);
      for (const a of agacNok) {
        const g = 0.7 + R() * 0.3;
        k.ekle(a[0], Y(a[0], a[1]), a[1], a[3], a[2], [g * (0.7 + R() * 0.25), g * (0.95 + R() * 0.2), g * (0.65 + R() * 0.2)]);
      }
      kumeler.push(k); durum.ag = k.n;
    }
    // lambalar
    if (lambaM) {
      const k = new Kume(grup, lambaM, lambaNok.length + 4, mats);
      const ao = lambaM.isikOrt, phi = ao ? Math.atan2(ao.x, ao.z) : 0;
      for (const l of lambaNok) k.ekle(l[0], Y(l[0], l[1]), l[1], Math.atan2(l[2], l[3]) - phi, 1);
      kumeler.push(k);
    }
    // çatı eşyaları (dekor; çarpışma yok): klima, su deposu, anten
    {
      const R = rng(99);
      const kA = acM ? new Kume(grup, acM, 900, mats) : null, kT = tankM ? new Kume(grup, tankM, 500, mats) : null, kN = antM ? new Kume(grup, antM, 500, mats) : null;
      for (const b of H.binalar) {
        if (b.yuk < 9) continue;
        const n = b.alan > 500 ? 3 : b.alan > 200 ? 2 : 1;
        for (let q = 0; q < n; q++) {
          for (let d = 0; d < 12; d++) {
            const x = b.minx + R() * (b.maxx - b.minx), z = b.minz + R() * (b.maxz - b.minz);
            if (!H.binaIciMi(x, z, 0) || H.binaIciMi(x, z, 0) !== b) continue;
            if (H.sinirUzakB && H.sinirUzakB(b, x, z) < 2.2) continue;
            const t = R();
            if (t < 0.5 && kA) kA.ekle(x, b.y1, z, Math.floor(R() * 4) * Math.PI / 2, 0.9 + R() * 0.4);
            else if (t < 0.75 && kT && b.alan > 150) kT.ekle(x, b.y1, z, R() * 6, 0.9 + R() * 0.5);
            else if (kN) kN.ekle(x, b.y1, z, R() * 6, 0.8 + R() * 0.6);
            durum.cati++; break;
          }
        }
      }
      for (const k of [kA, kT, kN]) if (k && k.n) kumeler.push(k);
    }
    // trafik: OSM yol grafiğinde dolaşan araçlar
    const iyi = araclarM.map((m, i) => m ? i : -1).filter(i => i >= 0);
    const ag = H.yolAgi;
    if (iyi.length >= 3 && ag.dugumler.length) {
      const N = 70;
      const aracK = [];
      for (const i of iyi) aracK[i] = new Kume(grup, araclarM[i], N, mats);
      const aracRenk = [0x1a1c21, 0x1a1c21, 0xc4c8cf, 0xc4c8cf, 0xf1f1ee, 0xf1f1ee, 0x9a1c24, 0x142a5c, 0x2b6bd6, 0x1f6b3a, 0x5c1220, 0x6b6f76, 0xb8731f]
        .map(h => { const q = new THREE.Color(h); return [q.r * 1.3, q.g * 1.3, q.b * 1.3]; });
      const RC = rng(9191);
      const TAKSI = aracAd.indexOf('taxi'), BEYAZ = [1, 1, 1];
      const huzmeMat = new THREE.MeshBasicMaterial({ map: ctx.huzmeDokusu(), color: new THREE.Color(0.85, 0.75, 0.5), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
      const huzme = new THREE.InstancedMesh(new THREE.PlaneGeometry(3.6, 11).rotateX(-Math.PI / 2), huzmeMat, N);
      huzme.frustumCulled = false; huzme.renderOrder = 2; huzme.count = 0; grup.add(huzme);
      // araç başlangıçları: uzun yol kenarları
      const kenarlar = ag.kenarlar.filter(e => e.L > 8);
      for (let i = 0; i < N; i++) {
        const ke = kenarlar[Math.floor(RP() * kenarlar.length)];
        const ters = RP() < 0.5;
        const mdl = iyi[Math.floor(RP() * iyi.length)];
        const ym = araclarM[mdl].boyut || { x: 2, y: 1.5, z: 4.6 };
        const ya = ters ? ke.b : ke.a, yb = ters ? ke.a : ke.b;
        arac.push({ yaw: Math.atan2(ag.dugumler[yb].x - ag.dugumler[ya].x, ag.dugumler[yb].z - ag.dugumler[ya].z), a: ya, b: yb, t: RP() * ke.L, L: ke.L, gen: ke.genislik, v: rp(7, 12), model: mdl, renk: aracRenk[Math.floor(RC() * aracRenk.length)],
          hl: ym.z / 2, hw: ym.x / 2, hy: ym.y, x: 0, z: 0, y: 0, dx: 0, dz: 0, ox: 1e9, oz: 1e9, bx: 1, bz: 1 });
      }
      const D = ag.dugumler;
      const kenarBul = (a, b) => ag.kenarlar.find(e => (e.a === a && e.b === b) || (e.a === b && e.b === a));
      function sonraki(c) {
        const A = D[c.a], B = D[c.b];
        const dx = B.x - A.x, dz = B.z - A.z, l = Math.hypot(dx, dz) || 1;
        let en = null, sk = -9;
        for (const k of B.komsu) {
          if (k === c.a && B.komsu.length > 1) continue;
          const ex = D[k].x - B.x, ez = D[k].z - B.z, el = Math.hypot(ex, ez) || 1;
          const s = (dx * ex + dz * ez) / (l * el) + RP() * 1.3; // düz gitmeyi tercih et, biraz rastgele
          if (s > sk) { sk = s; en = k; }
        }
        if (en === null) en = c.a;
        const ke = kenarBul(c.b, en);
        c.a = c.b; c.b = en; c.t = 0; c.L = ke ? ke.L : Math.hypot(D[en].x - B.x, D[en].z - B.z); c.gen = ke ? ke.genislik : 7;
      }
      const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
      const R2 = LOD_R * LOD_R;
      trafikGuncelle = (dt, cam, op) => {
        const yakin = H.aracCarp.liste; yakin.length = 0;
        for (const k of aracK) if (k) k.sifirla();
        let hz = 0;
        for (const c of arac) {
          c.t += c.v * dt;
          if (c.t >= c.L) sonraki(c);
          const A = D[c.a], B = D[c.b], u = Math.min(1, c.t / (c.L || 1));
          const ex = B.x - A.x, ez = B.z - A.z, el = Math.hypot(ex, ez) || 1;
          const fx = ex / el, fz = ez / el;
          // yüzün yönü: yumuşak dönüş
          const hedef = Math.atan2(fx, fz);
          let df = hedef - c.yaw; df = Math.atan2(Math.sin(df), Math.cos(df));
          c.yaw += df * Math.min(1, dt * 4.5);
          const lat = Math.min(c.gen / 4, 2.2);
          const x = A.x + ex * u + fz * lat, z = A.z + ez * u - fx * lat; // sağ şerit
          c.dx = c.ox < 1e8 ? x - c.ox : 0; c.dz = c.ox < 1e8 ? z - c.oz : 0;
          if (Math.abs(c.dx) > 20 || Math.abs(c.dz) > 20) { c.dx = 0; c.dz = 0; }
          c.ox = x; c.oz = z; c.x = x; c.z = z; c.y = Y(x, z);
          if (op && Math.abs(x - op.x) < 30 && Math.abs(z - op.z) < 30) {
            const cy = Math.abs(Math.cos(c.yaw)), sy = Math.abs(Math.sin(c.yaw));
            c.bx = sy * c.hl + cy * c.hw; c.bz = cy * c.hl + sy * c.hw; yakin.push(c);
          }
          const cdx = x - cam.x, cdz = z - cam.z;
          if (cdx * cdx + cdz * cdz > R2) continue;
          _q.setFromAxisAngle(EY, c.yaw); _p.set(x, c.y, z); _m.compose(_p, _q, _s);
          aracK[c.model].yaz(_m, c.model === TAKSI ? BEYAZ : c.renk);
          if (hz < N) {
            _p.set(x + Math.sin(c.yaw) * 7.2, c.y + 0.06, z + Math.cos(c.yaw) * 7.2); _m.compose(_p, _q, _s); _m.toArray(huzme.instanceMatrix.array, hz * 16); hz++;
          }
        }
        for (const k of aracK) if (k) k.bitir();
        huzme.count = hz; huzme.instanceMatrix.needsUpdate = true;
      };
      durum.arac = arac.length;
    }
    if (test) console.log(`[HARITA] pro: ağaç ${durum.ag} (park ${durum.parkAgac}), lamba ${durum.lamba}, çatı eşyası ${durum.cati}, araç ${durum.arac}`);
  })().catch(e => console.warn('[HARITA] pro yuklenemedi:', e && e.message));

  // ---------- saat dilimi ----------
  const C = (h) => new THREE.Color(h);
  const SAAT = {
    gunduz: { sky: C(0xc4dcff), zem: C(0x9a9488), hemi: 1.7, dir: C(0xfff0d8), dirI: 3.0, yon: new THREE.Vector3(0.4, 0.62, 0.68), sis: C(0xbcd2ea), sisY: 0.0007, env: 0.8, bgI: 1, poz: 1.0, penc: 0.1, acik: 0.85, zemin: 1.0, tur: 3.5, ray: 1.2, mie: 0.004, mieG: 0.8 },
    alacakaranlik: { sky: C(0x9bb8e8), zem: C(0x8c7a6c), hemi: 2.0, dir: C(0xffb274), dirI: 2.7, yon: new THREE.Vector3(-0.35, 0.075, 0.92), sis: C(0xa5b3cc), sisY: 0.0011, env: 0.65, bgI: 1, poz: 1.15, penc: 0.45, acik: 0.95, zemin: 1.1, tur: 6, ray: 2.6, mie: 0.004, mieG: 0.9 },
    gece: { sky: C(0x8294bf), zem: C(0x303a56), hemi: 2.3, dir: C(0xa8bcff), dirI: 2.1, yon: new THREE.Vector3(0, 0.48, 0.877), sis: C(0x1f283c), sisY: 0.0020, env: 0.35, bgI: 0.9, poz: 1.3, penc: 1.0, acik: 1.0, zemin: 1.15, tur: 0, ray: 0, mie: 0, mieG: 0 },
  };
  for (const k in SAAT) SAAT[k].yon.normalize();
  const gok = new Sky(); gok.scale.setScalar(1800); gok.frustumCulled = false; gok.visible = false; gok.renderOrder = -11;
  sahne.add(gok);
  const envOnbellek = {};
  function skyEnv(ad) {
    if (envOnbellek[ad]) return envOnbellek[ad];
    const sc = new THREE.Scene(), sk = new Sky(); sk.scale.setScalar(100); sc.add(sk);
    const h = SAAT[ad], u = sk.material.uniforms;
    u.turbidity.value = h.tur; u.rayleigh.value = h.ray; u.mieCoefficient.value = h.mie; u.mieDirectionalG.value = h.mieG; u.sunPosition.value.copy(h.yon);
    const pm = new THREE.PMREMGenerator(G.renderer);
    const t = pm.fromScene(sc, 0, 0.1, 1000).texture; pm.dispose(); sk.geometry.dispose(); sk.material.dispose();
    return (envOnbellek[ad] = t);
  }
  const cur = { sky: C(0), zem: C(0), dir: C(0), sis: C(0), yon: new THREE.Vector3(), hemi: 0, dirI: 0, sisY: 0, env: 0, bgI: 1, poz: 1, penc: 1, acik: 1, zemin: 1, tur: 0, ray: 0, mie: 0, mieG: 0 };
  const SAYI = ['hemi', 'dirI', 'sisY', 'env', 'bgI', 'poz', 'penc', 'acik', 'zemin', 'tur', 'ray', 'mie', 'mieG'];
  function saatEnv() {
    const ad = G.saatDilimi, gece = ad === 'gece';
    const tex = gece ? envGece : skyEnv(ad);
    if (!tex) return;
    sahne.environment = tex;
  }
  function saatUygula(k) {
    const h = SAAT[G.saatDilimi];
    cur.sky.lerp(h.sky, k); cur.zem.lerp(h.zem, k); cur.dir.lerp(h.dir, k); cur.sis.lerp(h.sis, k); cur.yon.lerp(h.yon, k).normalize();
    for (const n of SAYI) cur[n] += (h[n] - cur[n]) * k;
    hemi.color.copy(cur.sky); hemi.groundColor.copy(cur.zem); hemi.intensity = cur.hemi;
    ay.color.copy(cur.dir); ay.intensity = cur.dirI; ayYon.copy(cur.yon);
    sahne.fog.color.copy(cur.sis); sahne.fog.density = cur.sisY;
    perdeMat.uniforms.uRenk.value.copy(cur.sis);
    sahne.environmentIntensity = cur.env; sahne.backgroundIntensity = cur.bgI;
    IS.acik.value = cur.acik; IS.penc.value = cur.penc;
    for (const m of zeminMatlar) m.color.setScalar(cur.zemin * (m.userData.k ?? 1));
    catiMat.color.setScalar(cur.acik * 0.8);
    G.pozTaban = cur.poz;
    const u = gok.material.uniforms;
    u.turbidity.value = cur.tur; u.rayleigh.value = cur.ray; u.mieCoefficient.value = cur.mie; u.mieDirectionalG.value = cur.mieG; u.sunPosition.value.copy(cur.yon);
  }
  let saatHazir = false;
  G.saatDilimi = 'alacakaranlik';
  G.saatAyarla = function (ad, aninda = false) {
    if (!SAAT[ad]) return;
    const onceki = G.saatDilimi; G.saatDilimi = ad;
    const gece = ad === 'gece';
    gok.visible = !gece; sahne.background = gece ? gokTex : null;
    saatEnv();
    if (aninda || !saatHazir) { saatHazir = true; saatUygula(1); }
    G.olay.emit('saat', ad);
    return onceki;
  };
  {
    let a0 = 'alacakaranlik';
    try { const v = JSON.parse(localStorage.getItem('zifir_ayar') || '{}').saat; if (SAAT[v]) a0 = v; } catch (e) {}
    const q0 = qs.get('saat'); if (SAAT[q0]) a0 = q0;
    G.saatAyarla(a0, true);
    G.olay.on('ayar', a => { if (a && SAAT[a.saat] && a.saat !== G.saatDilimi) G.saatAyarla(a.saat); });
  }

  // ---------- API ----------
  const sehirkam = qs.get('sehirkam');
  const dogusNoktasi = () => H.dogus.clone();
  G.sehir = {
    harita: 'basinevleri', poligon: true, kesin: true, egim: H.arazi.egim,
    boyut: Math.min(kp.x1, kp.z1) * 0.95, kapsam: kp,
    binalar: H.binalar, zeminY: H.zeminY, arazi: H.Y, carpis: H.carpis, tasiyici: H.tasiyici, ankrajBul: H.ankrajBul,
    rastgeleCati: H.rastgeleCati, sokakNoktasi: H.sokakNoktasi, rastgeleSokakNoktasi: H.sokakNoktasi, catiNoktalari: H.catiNoktalari,
    yollar: H.yollar, yolAgi: H.yolAgi, catiyaSigdir: H.catiyaSigdir, yakinBina: H.yakinBina, sinirNokta: H.sinirNokta, binaIciMi: H.binaIciMi, binaIcinde: H.binaIcinde,
    sinirIci: H.sinirIci, dogus: H.dogus, dogusNoktasi, gokyuzuRengi: SAAT.alacakaranlik.sky.clone(), kuleler: [], parklar: [],
    araclar: arac,
    // kat_duzelt.json için: oyuncuya (yoksa kameraya) en yakın bina
    binaBilgi(konum) {
      const k = konum || G.oyuncu?.konum || G.kamera.position;
      let en = null, enD = 1e9;
      for (const b of H.binalar) { const d = Math.hypot(b.px - k.x, b.pz - k.z) - b.pr; if (d < enD) { enD = d; en = b; } }
      const o = en && { id: en.id, ad: en.ad, kat: en.kat, yuksek_m: en.yuk, kaynak: en.kaynak, alan_m2: Math.round(en.alan), uzaklik_m: +enD.toFixed(1) };
      console.log('[HARITA] en yakin bina', JSON.stringify(o)); return o;
    },
  };

  // ---------- kare güncelle ----------
  const _ld = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _c = new THREE.Vector3();
  const son = { t: -9, x: 1e9, y: 0, z: 1e9 };
  kur_h.guncelle = (G2, dt) => {
    const t = G2.t;
    gok.position.copy(G2.kamera.position);
    if (G2.saatDilimi) saatUygula(1 - Math.exp(-G2.gercekDt * 3.5));
    // test kamerası (oyuncu modülü yokken)
    if (G2.test && sehirkam) {
      const kam = G2.kamera, d = H.dogus;
      if (sehirkam === '4') { kam.position.set(d.x, d.y + 2.2, d.z); kam.lookAt(d.x + 30, d.y + 3, d.z + 10); }
      else if (sehirkam === '3') { kam.position.set(0, 60, 40); kam.lookAt(0, 8, -80); }
      else if (sehirkam === '5') { // ana cadde seviyesi: en uzun 'secondary' yolun başlangıcından yol boyunca
        if (!kur_h.cadde) { let en = null, enL = 0; for (const y of veri.yollar) if (y.tur === 'secondary' && y.nokta.length > 3) { const L = Math.hypot(y.nokta[0][0] - y.nokta.at(-1)[0], y.nokta[0][1] - y.nokta.at(-1)[1]); if (L > enL) { enL = L; en = y; } } kur_h.cadde = en; }
        const y = kur_h.cadde, i = Math.floor(y.nokta.length / 3), a = y.nokta[i], b = y.nokta[i + 2];
        const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
        kam.position.set(a[0] - dx / l * 6 + dz / l * 2, Y(a[0], a[1]) + 2.4, a[1] - dz / l * 6 - dx / l * 2); kam.lookAt(a[0] + dx / l * 40, Y(a[0], a[1]) + 4, a[1] + dz / l * 40);
      }
      else { kam.position.set(0, 230, 330); kam.lookAt(0, 0, -20); }
    }
    const merkez = (G2.oyuncu && G2.oyuncu.konum) ? G2.oyuncu.konum : G2.kamera.position;
    _ld.copy(ayYon);
    _r.crossVectors(EY, _ld).normalize(); _u.crossVectors(_ld, _r).normalize();
    const tx = (2 * 75) / ay.shadow.mapSize.x;
    const a = Math.round(merkez.dot(_r) / tx) * tx, b = Math.round(merkez.dot(_u) / tx) * tx, c = merkez.dot(_ld);
    _c.set(0, 0, 0).addScaledVector(_r, a).addScaledVector(_u, b).addScaledVector(_ld, c);
    ay.target.position.copy(_c);
    ay.position.copy(_c).addScaledVector(_ld, 300);
    ay.target.updateMatrixWorld();
    const cam = G2.kamera.position;
    const hx = cam.x - son.x, hz2 = cam.z - son.z, hy = cam.y - son.y;
    if (G2.t - son.t > 0.35 || hx * hx + hz2 * hz2 + hy * hy > 36) {
      for (const k of kumeler) k.lod(cam.x, cam.y, cam.z, LOD_R);
      son.t = G2.t; son.x = cam.x; son.y = cam.y; son.z = cam.z;
    }
    trafikGuncelle(Math.min(dt, 0.05), cam, G2.oyuncu && G2.oyuncu.konum);
  };

  if (test) {
    const bn = H.binalar, tp = {};
    for (const b of bn) tp[b.kat] = (tp[b.kat] || 0) + 1;
    console.log(`[HARITA] kur tamam: bina ${bn.length}, yol ${veri.yollar.length}, alan ${veri.alanlar.length}, egim ${H.arazi.egim}, dogus ${H.dogus.x.toFixed(0)},${H.dogus.z.toFixed(0)} bosluk ${H.dogusBosluk.toFixed(0)} m (${H.dogusAd}), kat dagilimi ${JSON.stringify(tp)}, yol agi dugum ${H.yolAgi.dugumler.length}`);
  }
  return kur_h;
}
// sehir.js guncelle() bunu çağırır
export const kur_h = { guncelle: null };
