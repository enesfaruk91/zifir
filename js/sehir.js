// ŞEHİR — gece neon şehri, çarpışma/ankraj fiziği (SOZLESME.md §4)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const P = 57;            // sokak aralığı (m)
const KN = 7;            // yollar k = -7..7
const EXT = KN * P;      // 399
const YOL_YARI = 7;      // asfalt yarı genişliği
const KALDIRIM = 2.5;
const KANAL_J = 3;       // kanal satırı (hücre indeksi)
const KANAL_Z = (KANAL_J + 0.5) * P;
const KANAL_YARI = 15;
const F = (n) => (Number.isInteger(n) ? n.toFixed(1) : String(n));
const KOPRU_YARI = KANAL_YARI + 3;

// ---------- yardımcılar ----------
function rng(tohum) {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(20240611);
const rr = (a, b) => a + (b - a) * R();
const sec = (dizi) => dizi[Math.floor(R() * dizi.length)];

// ---------- çarpışma ızgarası ----------
const CS = 32, G0 = -1280, GN = 80; // 2560 m: uzak silüet halkası da çarpışır
const C = [];          // düz: minx,miny,minz,maxx,maxy,maxz
const CT = [];         // 0 bina, 1 ince (lamba; yalnız ankraj), 2 havadaki (kiriş; zeminY'ye girmez)
let CB = null, CTT = null, hucre = null, damga = null, damgaNo = 0;

function colEkle(x, y0, z, gx, h, gz, tur = 0) {
  C.push(x - gx / 2, y0, z - gz / 2, x + gx / 2, y0 + h, z + gz / 2);
  CT.push(tur);
}
function izgaraKur() {
  CB = new Float32Array(C); CTT = new Uint8Array(CT);
  hucre = Array.from({ length: GN * GN }, () => []);
  const n = CT.length;
  damga = new Uint32Array(n);
  const ci = (v) => Math.max(0, Math.min(GN - 1, Math.floor((v - G0) / CS)));
  for (let i = 0; i < n; i++) {
    const o = i * 6;
    for (let a = ci(CB[o]); a <= ci(CB[o + 3]); a++)
      for (let b = ci(CB[o + 2]); b <= ci(CB[o + 5]); b++) hucre[b * GN + a].push(i);
  }
}
const gi = (v) => Math.floor((v - G0) / CS);

// ışın - AABB; en yakın giriş
const _sonuc = { t: 0, i: -1, ax: 0, sg: 0 };
function isinBul(ox, oy, oz, dx, dy, dz, maxT) {
  let best = maxT, bi = -1, bax = 0, bsg = 0;
  damgaNo++;
  let gx = gi(ox), gz = gi(oz);
  const sx = dx > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
  const inf = Infinity;
  let tmx = dx !== 0 ? ((dx > 0 ? (gx + 1) : gx) * CS + G0 - ox) / dx : inf;
  let tmz = dz !== 0 ? ((dz > 0 ? (gz + 1) : gz) * CS + G0 - oz) / dz : inf;
  const tdx = dx !== 0 ? CS / Math.abs(dx) : inf;
  const tdz = dz !== 0 ? CS / Math.abs(dz) : inf;
  for (let adim = 0; adim < 128; adim++) {
    if (gx >= 0 && gx < GN && gz >= 0 && gz < GN) {
      const liste = hucre[gz * GN + gx];
      for (let k = 0; k < liste.length; k++) {
        const i = liste[k];
        if (damga[i] === damgaNo) continue;
        damga[i] = damgaNo;
        const o = i * 6;
        let tmin = -inf, tmax = inf, ax = 0, sg = 0;
        // x
        if (dx !== 0) {
          let t1 = (CB[o] - ox) / dx, t2 = (CB[o + 3] - ox) / dx, s = -1;
          if (t1 > t2) { const q = t1; t1 = t2; t2 = q; s = 1; }
          if (t1 > tmin) { tmin = t1; ax = 0; sg = s; }
          if (t2 < tmax) tmax = t2;
        } else if (ox < CB[o] || ox > CB[o + 3]) continue;
        if (dy !== 0) {
          let t1 = (CB[o + 1] - oy) / dy, t2 = (CB[o + 4] - oy) / dy, s = -1;
          if (t1 > t2) { const q = t1; t1 = t2; t2 = q; s = 1; }
          if (t1 > tmin) { tmin = t1; ax = 1; sg = s; }
          if (t2 < tmax) tmax = t2;
        } else if (oy < CB[o + 1] || oy > CB[o + 4]) continue;
        if (dz !== 0) {
          let t1 = (CB[o + 2] - oz) / dz, t2 = (CB[o + 5] - oz) / dz, s = -1;
          if (t1 > t2) { const q = t1; t1 = t2; t2 = q; s = 1; }
          if (t1 > tmin) { tmin = t1; ax = 2; sg = s; }
          if (t2 < tmax) tmax = t2;
        } else if (oz < CB[o + 2] || oz > CB[o + 5]) continue;
        if (tmin <= tmax && tmin > 1e-4 && tmin < best) { best = tmin; bi = i; bax = ax; bsg = sg; }
      }
    }
    const tn = Math.min(tmx, tmz);
    if (best <= tn || tn > maxT) break;
    if (tmx < tmz) { gx += sx; tmx += tdx; } else { gz += sz; tmz += tdz; }
  }
  _sonuc.t = best; _sonuc.i = bi; _sonuc.ax = bax; _sonuc.sg = bsg;
  return bi >= 0;
}

// ---------- doku üreticileri ----------
const NEON = ['#22f0ff', '#ff3fd8', '#ff9a2e', '#9dff4a', '#a070ff', '#ff5a8a', '#ffe14a'];
const YAZILAR = ['ÇAY 24', 'ROBOTAMİR', 'KUMRU', 'SİMİT', 'GECE MARKET', 'PİLAV EVİ', 'NEON BERBER', 'DONDURMA',
  'ZIPZIP KARGO', 'BALKON KAFE', 'CİVATA PAZARI', 'YILDIZ ECZA', 'AY SİNEMA', 'KEDİ OTEL', 'BAKLAVA 7/24',
  'OYUN SALONU', 'JÖLE BAR', 'PİL ŞARJ', 'HOPLA HOTEL', 'LOKANTA ÖZ', 'KİTAP KULÜBÜ', 'TAMİRHANE', 'ÇORBACI', 'IŞIK DÜKKÂNI',
  'BİSİKLET', 'MİNİ MARKET', 'LEZZET 24', 'BALONCU', 'PATİ KAFE', 'SU ŞEHRİ', 'KÖPRÜ HAN', 'GÖKYÜZÜ'];
const HUCRE_W = 512, HUCRE_H = 128, ATLAS_W = 2048, ATLAS_H = 1024;

function tabelaAtlasi() {
  const cv = document.createElement('canvas');
  cv.width = ATLAS_W; cv.height = ATLAS_H;
  const c = cv.getContext('2d');
  c.clearRect(0, 0, ATLAS_W, ATLAS_H);
  const kol = ATLAS_W / HUCRE_W;
  YAZILAR.forEach((yazi, i) => {
    const x0 = (i % kol) * HUCRE_W, y0 = Math.floor(i / kol) * HUCRE_H;
    const renk = NEON[i % NEON.length];
    c.save();
    c.translate(x0, y0);
    // koyu panel
    c.fillStyle = 'rgba(6,3,14,0.9)';
    c.beginPath(); c.roundRect(10, 10, HUCRE_W - 20, HUCRE_H - 20, 18); c.fill();
    // neon çerçeve
    c.shadowColor = renk; c.shadowBlur = 16;
    c.strokeStyle = renk; c.lineWidth = 5;
    c.beginPath(); c.roundRect(14, 14, HUCRE_W - 28, HUCRE_H - 28, 14); c.stroke();
    // yazı
    let px = 74;
    c.font = `bold ${px}px "DejaVu Sans", "Liberation Sans", Arial, sans-serif`;
    const maxW = HUCRE_W - 80;
    const w = c.measureText(yazi).width;
    if (w > maxW) { px = Math.floor(px * maxW / w); c.font = `bold ${px}px "DejaVu Sans", "Liberation Sans", Arial, sans-serif`; }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowBlur = 22; c.fillStyle = renk;
    c.fillText(yazi, HUCRE_W / 2, HUCRE_H / 2 + 3);
    c.shadowBlur = 6; c.fillStyle = '#ffffff';
    c.globalAlpha = 0.75;
    c.fillText(yazi, HUCRE_W / 2, HUCRE_H / 2 + 3);
    c.restore();
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function isikDokusu() { // radyal yumuşak leke
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function huzmeDokusu() { // far huzmesi: uzunlukta sönen
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 128); // üst = araçtan uzak
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,1)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 128);
  const g2 = c.createLinearGradient(0, 0, 64, 0);
  g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(0.5, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,0,1)');
  c.globalCompositeOperation = 'destination-out'; c.fillStyle = g2; c.fillRect(0, 0, 64, 128);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- doku yükleme ----------
const _tl = new THREE.TextureLoader();
let _aniso = 4;
function doku(ad, srgb = true, tekrar = true) {
  const t = _tl.load('assets/' + ad);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (tekrar) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = _aniso;
  return t;
}

// ---------- shader parçaları ----------
const GLSL_HASH = `
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
`;

function binaMalzemesi(n, catiTex) {
  const m = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.72, metalness: 0.15,
    map: doku(`cephe_${n}.jpg`), emissiveMap: doku(`cephe_${n}_isik.jpg`),
    emissive: new THREE.Color(1, 1, 1), emissiveIntensity: 1.05,
  });
  m.onBeforeCompile = (s) => {
    s.uniforms.uCati = { value: catiTex };
    s.vertexShader = s.vertexShader
      .replace('#include <common>', `#include <common>
attribute vec4 aSeed; flat varying vec3 vFN; varying vec3 vLP; flat varying vec3 vSz; flat varying vec4 vSd;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vFN = normal; vLP = position; vSd = aSeed;
vSz = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));`);
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
flat varying vec3 vFN; varying vec3 vLP; flat varying vec3 vSz; flat varying vec4 vSd;
uniform sampler2D uCati;
${GLSL_HASH}
vec3 trimCol(float i){ return i<1.5 ? vec3(0.1,0.9,1.0) : (i<2.5 ? vec3(1.0,0.2,0.8) : vec3(1.0,0.55,0.12)); }`)
      .replace('#include <map_fragment>', `
vec3 an = abs(vFN);
bool ustYuz = an.y > 0.5;
bool xf = an.x > 0.5;
float W = xf ? vSz.z : vSz.x;
float H = vSz.y;
float u = (xf ? vLP.z * vSz.z : vLP.x * vSz.x) + W * 0.5;
float v = vLP.y * H;
// 8x8 pencere: 3.4 m yatay, 3 m kat yuksekligi
float ru = max(1.0, floor(W / 27.2 + 0.5));
float rv = max(1.0, floor(H / 24.0 + 0.5));
vec2 cuv = vec2(u / W * ru + fract(vSd.z * 7.0), v / H * rv);
if (xf && vFN.x < 0.0) cuv.x = 1.0 - cuv.x + 1.0;
if (!xf && vFN.z < 0.0) cuv.x = 1.0 - cuv.x + 1.0;
if (ustYuz) {
  vec2 cu = vec2(vLP.x * vSz.x, vLP.z * vSz.z) / 12.0 + vSd.z * 10.0;
  diffuseColor *= texture2D(uCati, cu);
} else {
  diffuseColor *= texture2D(map, cuv);
}`)
      .replace('#include <emissivemap_fragment>', `
if (!ustYuz) {
  vec3 ew = texture2D(emissiveMap, cuv).rgb;
  float wl = dot(ew, vec3(0.3, 0.59, 0.11));
  vec2 wc = floor(cuv * 8.0) + vSd.z * 31.0;
  float w1 = h21(wc), w2 = h21(wc + 7.7);
  wl *= step(0.14, w1);
  vec3 wcol = w2 < 0.14 ? vec3(0.62, 0.78, 1.0) : mix(vec3(1.0, 0.58, 0.2), vec3(1.0, 0.82, 0.5), w2);
  totalEmissiveRadiance = wcol * wl * 1.15;
  if (false) {
    float tr = 0.0;
    if (v > H - 0.55) tr = 1.0;
    float edge = min(u, W - u);
    if (edge < 0.22 && v > 1.5) tr = 1.0;
    if (tr > 0.0) { diffuseColor.rgb = vec3(0.02); totalEmissiveRadiance = trimCol(vSd.w) * 1.7; }
  }
} else { totalEmissiveRadiance = vec3(0.0); }`);
  };
  return m;
}

function zeminMalzemesi(parklar, envTex) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.3, envMap: envTex, envMapIntensity: 1.3 });
  const tAsf = doku('asfalt_islak.jpg'), tAsfR = doku('asfalt_islak_parlak.jpg', false), tKal = doku('kaldirim.jpg');
  const park = parklar.map(p => new THREE.Vector4(p.x, p.z, P / 2 - KALDIRIM - YOL_YARI, 0));
  while (park.length < 4) park.push(new THREE.Vector4(1e5, 1e5, 1, 0));
  m.onBeforeCompile = (s) => {
    s.uniforms.uParks = { value: park }; s.uniforms.uAsf = { value: tAsf }; s.uniforms.uAsfR = { value: tAsfR }; s.uniforms.uKal = { value: tKal };
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWP; uniform vec4 uParks[4]; uniform sampler2D uAsf, uAsfR, uKal;
${GLSL_HASH}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  vec2 p = vWP.xz;
  const float PP = ${F(P)};
  float dx = abs(mod(p.x + PP * 0.5, PP) - PP * 0.5);
  float dz = abs(mod(p.y + PP * 0.5, PP) - PP * 0.5);
  bool inCity = abs(p.x) < ${F(EXT + 7)} && abs(p.y) < ${F(EXT + 7)};
  float rYol = ${F(YOL_YARI)}, rKald = ${F(YOL_YARI + KALDIRIM)};
  bool roadX = inCity && dx < rYol, roadZ = inCity && dz < rYol;
  vec3 col; float rough = 0.6; vec3 em = vec3(0.0);
  vec3 tA = texture2D(uAsf, p / 9.0).rgb; float tAR = texture2D(uAsfR, p / 9.0).r; vec3 tK = texture2D(uKal, p / 5.0).rgb;
  float grain = h21(floor(p * 2.5));
  float nz = vn(p * 0.35);
  if (!inCity) {
    col = vec3(0.012, 0.014, 0.025) + nz * 0.01; rough = 0.9;
  } else if (roadX || roadZ) {
    col = tA;
    rough = 0.06 + 0.85 * tAR;
    bool kav = roadX && roadZ;
    // orta çizgi (kesik sarı)
    if (!kav) {
      if (roadX && dx < 0.12 && dz > 9.0 && mod(p.y, 6.0) < 3.0) col = vec3(0.5, 0.38, 0.05);
      if (roadZ && dz < 0.12 && dx > 9.0 && mod(p.x, 6.0) < 3.0) col = vec3(0.5, 0.38, 0.05);
      if (roadX && abs(dx - 6.5) < 0.1) col = vec3(0.35);
      if (roadZ && abs(dz - 6.5) < 0.1) col = vec3(0.35);
    }
    // yaya geçidi
    if (roadX && !roadZ && dz > 7.4 && dz < 10.2 && step(0.5, fract(p.x * 0.7)) > 0.5) col = vec3(0.3);
    if (roadZ && !roadX && dx > 7.4 && dx < 10.2 && step(0.5, fract(p.y * 0.7)) > 0.5) col = vec3(0.3);
    // ıslak yol: kenarlardan taşan neon yansıması
    float edgeD = roadX ? (rYol - dx) : (rYol - dz);
    float seg = roadX ? floor(p.y / 11.0) : floor(p.x / 11.0);
    float hs = h21(vec2(seg, roadX ? floor(p.x / PP + 0.5) : floor(p.y / PP + 0.5) + 31.0));
    vec3 nc = hs < 0.33 ? vec3(0.1, 0.85, 1.0) : (hs < 0.66 ? vec3(1.0, 0.25, 0.85) : vec3(1.0, 0.55, 0.15));
    em += nc * 0.11 * smoothstep(5.0, 0.0, edgeD) * (0.4 + 0.6 * vn(p * 0.5));
  } else if (dx < rKald || dz < rKald) {
    col = tK; rough = 0.6;
    if (abs(dx - rYol) < 0.12 || abs(dz - rYol) < 0.12) col = vec3(0.11, 0.1, 0.13);
  } else {
    col = vec3(0.035, 0.038, 0.05) + nz * 0.015; rough = 0.8;
    // park?
    for (int i = 0; i < 4; i++) {
      vec4 pk = uParks[i];
      if (abs(p.x - pk.x) < pk.z && abs(p.y - pk.y) < pk.z) {
        col = vec3(0.012, 0.055, 0.03) + nz * 0.03 + vn(p * 1.3) * 0.015; rough = 0.95;
        vec2 q = p - pk.xy; // yollar: artı biçiminde patika
        if (abs(q.x) < 1.6 || abs(q.y) < 1.6 || abs(length(q) - 9.0) < 1.0) col = vec3(0.07, 0.06, 0.09);
      }
    }
    // kanal rıhtımı
    if (abs(p.y - ${F(KANAL_Z)}) < PP * 0.5) { col = vec3(0.075, 0.07, 0.1) + grain * 0.01; rough = 0.45; }
  }
  // kanal kıyısı neon çizgisi
  float kd = abs(abs(p.y - ${F(KANAL_Z)}) - ${F(KANAL_YARI)});
  if (inCity && kd < 0.22) em += vec3(0.1, 0.9, 1.0) * 1.6;
  diffuseColor.rgb = col;
  roughnessFactor = rough;
  totalEmissiveRadiance += em;
}`)
      // roughnessFactor emissivemap'ten önce okunur; yeniden hesaplamak için sonradan eşitle
      ;
  };
  return m;
}

const _bc = new THREE.Color();
// ---------- ana kur ----------
export function kur(G) {
  const test = G.test;
  _aniso = G.kalite === 'dusuk' ? 1 : Math.min(4, G.renderer.capabilities.getMaxAnisotropy());
  const qs = new URLSearchParams(location.search);
  const sehirkam = qs.get('sehirkam');
  const sahne = G.sahne;

  // atmosfer
  const sisRenk = new THREE.Color(0x161c2a);
  const ufukRenk = new THREE.Color(0x2a3040);
  sahne.fog = new THREE.FogExp2(sisRenk, 0.0022);
  sahne.background = sisRenk.clone();
  // gokyuzu.jpg: ay u=0.75,v=0.34 -> yon (0, 0.48, 0.877)
  const ayYon = new THREE.Vector3(0, 0.48, 0.877).normalize();
  let zeminMat = null;
  const gokTex = _tl.load('assets/gokyuzu.jpg', (t) => {
    const pmrem = new THREE.PMREMGenerator(G.renderer);
    const envTex = pmrem.fromEquirectangular(t).texture; pmrem.dispose();
    sahne.environment = envTex; sahne.environmentIntensity = 0.2;
    if (zeminMat) { zeminMat.envMap = envTex; zeminMat.needsUpdate = true; }
  });
  gokTex.colorSpace = THREE.SRGBColorSpace;
  gokTex.mapping = THREE.EquirectangularReflectionMapping; gokTex.wrapS = THREE.RepeatWrapping;
  sahne.background = gokTex; sahne.backgroundIntensity = 0.55; sahne.backgroundBlurriness = 0;
  const catiTex = doku('cati.jpg');

  const hemi = new THREE.HemisphereLight(0x6a7a9a, 0x1a2030, 1.1);
  sahne.add(hemi);
  const ay = new THREE.DirectionalLight(0xa8bcff, 1.5);
  ay.castShadow = true;
  ay.shadow.mapSize.set(2048, 2048);
  const SK = 75;
  Object.assign(ay.shadow.camera, { left: -SK, right: SK, top: SK, bottom: -SK, near: 1, far: 520 });
  ay.shadow.bias = -0.0004; ay.shadow.normalBias = 0.6;
  sahne.add(ay, ay.target);

  // ---- gök kubbesi ----
  const kubbe = new THREE.Mesh(
    new THREE.SphereGeometry(1800, 32, 20),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uHor: { value: ufukRenk }, uTop: { value: new THREE.Color(0x05080f) }, uAy: { value: ayYon }, uT: { value: 0 } },
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }',
      fragmentShader: `varying vec3 vD; uniform vec3 uHor, uTop, uAy; uniform float uT;
${GLSL_HASH}
float h31(vec3 p){ p=fract(p*vec3(.1031,.1030,.0973)); p+=dot(p,p.yxz+33.33); return fract((p.x+p.y)*p.z); }
void main(){
  vec3 d = normalize(vD);
  float e = clamp(d.y, 0.0, 1.0);
  vec3 col = mix(uHor, uTop, pow(e, 0.5));
  // nebula
  float nb = vn(d.xz / (d.y + 0.35) * 2.2 + 3.0) * vn(d.xz / (d.y + 0.35) * 5.0);
  col += vec3(0.16, 0.05, 0.22) * nb * smoothstep(0.05, 0.5, e) * 0.9;
  // yıldızlar
  vec3 q = d * 150.0; vec3 c = floor(q); vec3 fq = fract(q) - 0.5;
  float r = h31(c);
  if (r > 0.965) {
    vec3 j = (vec3(h31(c + 1.7), h31(c + 2.9), h31(c + 4.1)) - 0.5) * 0.6;
    float dist = length(fq - j);
    float tw = 0.7 + 0.3 * sin(uT * (1.5 + r * 4.0) + r * 60.0);
    float st = smoothstep(0.13, 0.0, dist) * tw * (r > 0.992 ? 4.0 : 1.5);
    col += vec3(0.85, 0.9, 1.0) * st * smoothstep(0.02, 0.25, d.y);
  }
  // ay
  float m = dot(d, uAy);
  float rad = 0.042;
  float cr = cos(rad);
  vec3 a = normalize(cross(vec3(0.0,1.0,0.0), uAy)); vec3 b = cross(uAy, a);
  vec2 uv = vec2(dot(d, a), dot(d, b)) / rad;
  float L = length(uv);
  if (m > 0.0 && L < 1.0) {
    float k = 0.82 + 0.18 * vn(uv * 3.5 + 11.0) - 0.22 * smoothstep(0.55, 0.62, vn(uv * 1.7 + 4.0)) * 0.7;
    float cra = smoothstep(0.35, 0.3, abs(vn(uv * 9.0) - 0.5));
    k -= cra * 0.07;
    float sh = 0.75 + 0.25 * dot(normalize(vec3(uv, sqrt(max(0.0, 1.0 - L * L)))), normalize(vec3(-0.4, 0.5, 0.8)));
    vec3 mc = vec3(1.0, 0.96, 0.84) * k * sh * 0.95;
    col = mix(col, mc, smoothstep(1.0, 0.97, L));
  }
  float halo = pow(max(m, 0.0), 120.0) * 0.18 + pow(max(m, 0.0), 12.0) * 0.07;
  col += vec3(0.55, 0.62, 1.0) * halo;
  gl_FragColor = vec4(col, 1.0);
}`,
    }),
  );
  kubbe.renderOrder = -10; kubbe.frustumCulled = false;
  kubbe.visible = false; // gorsel gokyuzu + gorseldeki ay kullanilir (tek ay)
  sahne.add(kubbe);

  // ---- şehir planı ----
  const parkHucreleri = [[-3, -1], [2, 1], [-1, 5]];
  const kuleHucreleri = [[0, 0], [-4, -3], [3, -3], [-4, 4], [4, 5]];
  const parklar = parkHucreleri.map(([i, j]) => ({ x: (i + 0.5) * P, z: (j + 0.5) * P }));
  const parcalar = [];     // bina parçaları (instance)
  const binalar = [];
  const kuleler = [];
  const yuzler = [];       // tabela için açık yüzler {x,z,gx,gz,h,nx,nz}
  const cati = [];         // çatı süsü için {x,z,gx,gz,h}
  const MURAL = ['#1a1a33', '#241638', '#14213a', '#1d1030', '#102a3a', '#2a1630', '#18182e'];

  function parca(x, y0, z, gx, h, gz, renk, olas, trim, tohum) {
    parcalar.push({ x, y0, z, gx, h, gz, renk, olas, trim, tohum: tohum ?? R() });
  }
  function duvarRengi(k = 1) {
    const c = new THREE.Color(sec(MURAL));
    c.offsetHSL(rr(-0.03, 0.03), 0, rr(-0.02, 0.05)); c.multiplyScalar(k); return c;
  }
  function binaEkle(x, z, gx, gz, h, acik) {
    const trim = h > 55 && R() < 0.5 ? 1 + Math.floor(R() * 3) : 0;
    parca(x, 0, z, gx, h, gz, duvarRengi(), rr(0.1, 0.42), trim);
    colEkle(x, 0, z, gx, h, gz, 0);
    const kutu = new THREE.Box3(new THREE.Vector3(x - gx / 2, 0, z - gz / 2), new THREE.Vector3(x + gx / 2, h, z + gz / 2));
    const b = { x, z, gx, gz, h, kutu, tier: false };
    // üst kat
    if (h > 38 && gx > 24 && R() < 0.4) {
      const th = rr(8, 22), tg = Math.min(gx, gz) * 0.55;
      parca(x, h, z, tg, th, tg, duvarRengi(1.2), rr(0.12, 0.4), trim);
      colEkle(x, h, z, tg, th, tg, 0);
      b.tier = true; b.ust = h + th;
    }
    binalar.push(b); cati.push(b);
    for (const f of acik) yuzler.push({ x, z, gx, gz, h, nx: f[0], nz: f[1] });
  }
  function kuleEkle(x, z, ii) {
    const g = 32, h1 = rr(120, 150);
    const trim = 1 + (ii % 3);
    parca(x, 0, z, g, h1, g, duvarRengi(1.3), 0.3, trim);
    colEkle(x, 0, z, g, h1, g, 0);
    const h2 = rr(30, 45), g2 = 21;
    parca(x, h1, z, g2, h2, g2, duvarRengi(1.5), 0.3, trim);
    colEkle(x, h1, z, g2, h2, g2, 0);
    const h3 = rr(22, 32), g3 = 11;
    parca(x, h1 + h2, z, g3, h3, g3, duvarRengi(1.7), 0.35, trim);
    colEkle(x, h1 + h2, z, g3, h3, g3, 0);
    const top = h1 + h2 + h3, hs = rr(30, 40);
    parca(x, top, z, 1.4, hs, 1.4, new THREE.Color(0x151525), 0, trim);
    colEkle(x, top, z, 1.4, hs, 1.4, 0);
    const kutu = new THREE.Box3(new THREE.Vector3(x - g / 2, 0, z - g / 2), new THREE.Vector3(x + g / 2, h1, z + g / 2));
    binalar.push({ x, z, gx: g, gz: g, h: h1, kutu, tier: true, ust: top + hs });
    kuleler.push({ x, z, tepe: top + hs, konum: new THREE.Vector3(x, top + hs, z) });
    kuleBeacon.push([x, top + hs + 0.8, z, 1.6]);
    // 4 köşe tabelası
    yuzler.push({ x, z, gx: g, gz: g, h: 40, nx: 1, nz: 0 }, { x, z, gx: g, gz: g, h: 40, nx: 0, nz: 1 },
      { x, z, gx: g, gz: g, h: 40, nx: -1, nz: 0 }, { x, z, gx: g, gz: g, h: 40, nx: 0, nz: -1 });
  }

  const kuleBeacon = [];
  const yarim = P / 2 - YOL_YARI - KALDIRIM; // 19
  for (let ki = -KN; ki < KN; ki++) {
    for (let kj = -KN; kj < KN; kj++) {
      if (kj === KANAL_J) continue;
      const cx = (ki + 0.5) * P, cz = (kj + 0.5) * P;
      if (parkHucreleri.some(([i, j]) => i === ki && j === kj)) continue;
      const ki2 = kuleHucreleri.findIndex(([i, j]) => i === ki && j === kj);
      if (ki2 >= 0) { kuleEkle(cx, cz, ki2); continue; }
      const r = Math.hypot(cx, cz);
      const hmax = THREE.MathUtils.lerp(120, 22, Math.min(1, r / 460));
      const hb = () => Math.min(160, 10 + (hmax - 10) * Math.pow(R(), 1.35) + (R() < 0.06 ? rr(20, 50) : 0));
      const tip = R();
      if (tip < 0.5) { // tek büyük bina
        const gx = rr(32, 38), gz = rr(32, 38);
        binaEkle(cx, cz, gx, gz, hb(), [[1, 0], [-1, 0], [0, 1], [0, -1]]);
      } else if (tip < 0.85) { // ikiye bölünmüş
        const bol = 0.5 + rr(-0.12, 0.12);
        if (R() < 0.5) {
          const w1 = 2 * yarim * bol - 1, w2 = 2 * yarim * (1 - bol) - 1;
          binaEkle(cx - yarim + w1 / 2, cz, w1, rr(34, 38), hb(), [[-1, 0], [0, 1], [0, -1]]);
          binaEkle(cx + yarim - w2 / 2, cz, w2, rr(34, 38), hb(), [[1, 0], [0, 1], [0, -1]]);
        } else {
          const w1 = 2 * yarim * bol - 1, w2 = 2 * yarim * (1 - bol) - 1;
          binaEkle(cx, cz - yarim + w1 / 2, rr(34, 38), w1, hb(), [[1, 0], [-1, 0], [0, -1]]);
          binaEkle(cx, cz + yarim - w2 / 2, rr(34, 38), w2, hb(), [[1, 0], [-1, 0], [0, 1]]);
        }
      } else { // dörtlü
        const s = yarim - 1;
        for (const a of [-1, 1]) for (const b of [-1, 1]) {
          binaEkle(cx + a * (yarim / 2), cz + b * (yarim / 2), s * 0.95, s * 0.95, hb(),
            [[a, 0], [0, b]]);
        }
      }
    }
  }

  // köprü kapıları (ankraj için kule/kiriş)
  const kopruKapi = [-5, 0, 5];
  const kablolar = [];
  for (const k of kopruKapi) {
    const bx = k * P;
    for (const sz of [-1, 1]) {
      const pz = KANAL_Z + sz * (KANAL_YARI + 1.2);
      for (const sx of [-1, 1]) {
        const px = bx + sx * 9.4;
        parca(px, -0.5, pz, 2.2, 31, 2.2, new THREE.Color(0x120d22), 0, 1 + ((k + 5) % 3));
        colEkle(px, -0.5, pz, 2.2, 31, 2.2, 0);
        // kablolar
        for (let q = 1; q <= 5; q++) {
          kablolar.push(px, 30, pz, bx + sx * 8.4, 0.9, pz - sz * q * 2.4);
        }
      }
      parca(bx, 28.6, pz, 21, 1.8, 2, new THREE.Color(0x120d22), 0, 1 + ((k + 6) % 3));
      colEkle(bx, 28.6, pz, 21, 1.8, 2, 2);
    }
  }

  // uzak silüet halkası (artık çarpışır)
  const uzak = [];
  for (let i = 0; i < 300; i++) {
    const a = R() * Math.PI * 2, rd = rr(470, 1150);
    const h = rr(40, 230) * (0.7 + rd / 1500);
    const u = { x: Math.cos(a) * rd, z: Math.sin(a) * rd, gx: rr(26, 70), gz: rr(26, 70), h, renk: duvarRengi(1.1), olas: rr(0.1, 0.35), trim: R() < 0.2 ? 1 + Math.floor(R() * 3) : 0, tohum: R() };
    uzak.push(u);
    colEkle(u.x, 0, u.z, u.gx, u.h, u.gz, 0); // uzak binalar da katı
  }

  izgaraKurSonra();
  function izgaraKurSonra() { /* lamba/köprü ince colliderları eklendikten sonra çağrılır */ }

  // ---- bina InstancedMesh ----
  const binaMats = [1, 2, 3, 4].map(n => binaMalzemesi(n, catiTex));
  const kutuGeo = new THREE.BoxGeometry(1, 1, 1); kutuGeo.translate(0, 0.5, 0);
  function binaMesh(tum, golge) {
    for (let n = 0; n < 4; n++) {
      const liste = tum.filter(p => Math.floor((p.tohum * 4) % 4) === n);
      if (liste.length) binaMesh1(liste, golge, binaMats[n]);
    }
  }
  function binaMesh1(liste, golge, binaMat) {
    const geo = kutuGeo.clone();
    const sd = new Float32Array(liste.length * 4);
    const m = new THREE.InstancedMesh(geo, binaMat, liste.length);
    const mat4 = new THREE.Matrix4();
    liste.forEach((p, i) => {
      const y0 = p.y0 ?? 0;
      mat4.makeScale(p.gx, p.h, p.gz); mat4.setPosition(p.x, y0, p.z);
      m.setMatrixAt(i, mat4); m.setColorAt(i, _bc.set(0xffffff).lerp(p.renk, 0.18));
      sd[i * 4] = p.olas; sd[i * 4 + 1] = 0; sd[i * 4 + 2] = p.tohum; sd[i * 4 + 3] = p.trim;
    });
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sd, 4));
    m.castShadow = golge; m.receiveShadow = golge;
    m.frustumCulled = false;
    sahne.add(m);
    return m;
  }
  binaMesh(parcalar, true);
  binaMesh(uzak, false);

  // ---- zemin, su ----
  const zemin = new THREE.Mesh(new THREE.PlaneGeometry(2800, 2800), (zeminMat = zeminMalzemesi(parklar, null)));
  zemin.rotation.x = -Math.PI / 2; zemin.receiveShadow = true;
  sahne.add(zemin);

  const suMat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uT: { value: 0 } }]),
    vertexShader: `varying vec3 vWP;
#include <fog_pars_vertex>
void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vWP = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
    fragmentShader: `varying vec3 vWP; uniform float uT;
${GLSL_HASH}
#include <fog_pars_fragment>
void main(){
  vec2 p = vWP.xz;
  float edge = ${F(KANAL_YARI)} - abs(p.y - ${F(KANAL_Z)});
  vec3 col = vec3(0.01, 0.025, 0.06);
  float ripple = sin(p.x * 0.9 + uT * 1.3 + vn(p * 0.4) * 6.0) * 0.5 + 0.5;
  // kıyıdaki binaların neon yansıması: x boyunca bantlar, z'de uzayan
  float band = floor(p.x / 7.0);
  float hs = h21(vec2(band, 3.0));
  vec3 nc = hs < 0.25 ? vec3(0.1, 0.9, 1.0) : (hs < 0.5 ? vec3(1.0, 0.25, 0.85) : (hs < 0.75 ? vec3(1.0, 0.6, 0.2) : vec3(0.6, 0.4, 1.0)));
  float str = smoothstep(0.35, 1.0, h21(vec2(band, 9.0)));
  float shimmer = 0.5 + 0.5 * sin(p.y * 2.3 + p.x * 0.5 + uT * 2.0 + band);
  col += nc * str * shimmer * 0.55 * smoothstep(0.0, 6.0, edge) * (0.5 + 0.5 * ripple);
  // ay yansıması
  float mo = smoothstep(2.5, 0.0, abs(p.x - 150.0 + sin(p.y * 0.7 + uT) * 2.0)) * 0.0;
  col += vec3(0.04, 0.07, 0.12) * ripple;
  col += vec3(0.1, 0.8, 1.0) * smoothstep(1.2, 0.0, edge) * 0.8;
  gl_FragColor = vec4(col, 1.0);
#include <fog_fragment>
}`,
  });
  const su = new THREE.Mesh(new THREE.PlaneGeometry(2 * EXT + 100, KANAL_YARI * 2), suMat);
  su.rotation.x = -Math.PI / 2; su.position.set(0, 0.03, KANAL_Z);
  sahne.add(su);

  // köprü güvertesi + korkuluk
  const gMat = new THREE.MeshStandardMaterial({ color: 0x1a1626, roughness: 0.5, metalness: 0.4 });
  const kopruG = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), gMat, 2 * KN + 1);
  const rayMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 1.2, 1.6) });
  const rayG = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), rayMat, (2 * KN + 1) * 2);
  const m4 = new THREE.Matrix4();
  for (let k = -KN, i = 0; k <= KN; k++, i++) {
    m4.makeScale(17, 1.2, KOPRU_YARI * 2 + 2); m4.setPosition(k * P, -0.5, KANAL_Z); kopruG.setMatrixAt(i, m4);
    for (const s of [-1, 1]) {
      m4.makeScale(0.25, 0.25, KOPRU_YARI * 2 + 2); m4.setPosition(k * P + s * 8.2, 1.15, KANAL_Z); rayG.setMatrixAt(i * 2 + (s > 0 ? 1 : 0), m4);
    }
  }
  kopruG.receiveShadow = true;
  sahne.add(kopruG, rayG);
  if (kablolar.length) {
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(kablolar, 3));
    sahne.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: new THREE.Color(0.2, 1.6, 2.0) })));
  }

  // ---- sokak lambaları ----
  const lambalar = [];
  const LH = 8.2;
  function lambaEkle(x, z, yx, yz, y0 = 0) { lambalar.push({ x, z, yx, yz, y0 }); }
  for (let k = -KN; k <= KN; k++) {
    for (let s = -EXT + 12, i = 0; s <= EXT - 12; s += 28.5, i++) {
      const yakin = Math.abs(((s % P) + P * 1.5) % P - P / 2); // yola uzaklık, kavşak dışı
      const kavsakta = Math.abs(((s + P / 2) % P + P) % P - P / 2) < 11;
      if (kavsakta) continue;
      const sd = (i % 2) ? 1 : -1;
      // z yolu: x = k*P, boylam s=z
      if (!(Math.abs(s - KANAL_Z) < KOPRU_YARI + 2)) lambaEkle(k * P + sd * (YOL_YARI + 1.3), s, -sd, 0);
      // x yolu: z = k*P, boylam s=x
      lambaEkle(s, k * P + sd * (YOL_YARI + 1.3), 0, -sd);
      void yakin;
    }
  }
  // kanal kıyısı ve köprü lambaları
  for (let s = -EXT + 10; s <= EXT - 10; s += 24) {
    for (const sg of [-1, 1]) lambaEkle(s, KANAL_Z + sg * (KANAL_YARI + 1.4), 0, -sg);
  }
  for (let k = -KN; k <= KN; k++) for (const sx of [-1, 1]) for (const sz of [-1, 1])
    lambaEkle(k * P + sx * 8.2, KANAL_Z + sz * 9, -sx, 0, 0.1);

  const dayMat = new THREE.MeshStandardMaterial({ color: 0x23202e, roughness: 0.5, metalness: 0.6 });
  const direk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.16, LH, 6).translate(0, LH / 2, 0), dayMat, lambalar.length);
  const basMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 1.8, 0.7) });
  const bas = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 0.18, 0.5), basMat, lambalar.length);
  const havuzMat = new THREE.MeshBasicMaterial({ map: isikDokusu(), color: new THREE.Color(1.0, 0.62, 0.28), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false });
  const havuz = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), havuzMat, lambalar.length);
  const yp = new THREE.Vector3(), qq = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1);
  lambalar.forEach((l, i) => {
    m4.makeTranslation(l.x, l.y0, l.z); direk.setMatrixAt(i, m4);
    const yaw = Math.atan2(l.yx, l.yz);
    qq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw + Math.PI / 2);
    yp.set(l.x + l.yx * 0.7, l.y0 + LH, l.z + l.yz * 0.7); sc.set(1, 1, 1);
    m4.compose(yp, qq, sc); bas.setMatrixAt(i, m4);
    yp.set(l.x + l.yx * 2.6, l.y0 + 0.08, l.z + l.yz * 2.6); sc.set(17, 1, 17);
    m4.compose(yp, new THREE.Quaternion(), sc); havuz.setMatrixAt(i, m4);
    colEkle(l.x, l.y0, l.z, 0.45, LH, 0.45, 1);
  });
  havuz.renderOrder = 2;
  sahne.add(direk, bas, havuz);

  // ---- parklar: ağaçlar + neon heykel ----
  const agaclar = [];
  for (const pk of parklar) {
    for (let i = 0; i < 20; i++) {
      const a = R() * Math.PI * 2, rd = rr(5, 16);
      const x = pk.x + Math.cos(a) * rd + rr(-6, 6), z = pk.z + Math.sin(a) * rd + rr(-6, 6);
      if (Math.abs(x - pk.x) > 17.5 || Math.abs(z - pk.z) > 17.5) continue;
      if (Math.abs(x - pk.x) < 2.6 || Math.abs(z - pk.z) < 2.6) continue;
      agaclar.push({ x, z, s: rr(0.8, 1.5) });
    }
  }
  const govde = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.34, 3.2, 6).translate(0, 1.6, 0), new THREE.MeshStandardMaterial({ color: 0x2a1b25, roughness: 0.9 }), agaclar.length);
  const tepe = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, flatShading: true }), agaclar.length);
  agaclar.forEach((a, i) => {
    m4.makeScale(a.s, a.s, a.s); m4.setPosition(a.x, 0, a.z); govde.setMatrixAt(i, m4);
    m4.makeScale(a.s * 2.4, a.s * 2.1, a.s * 2.4); m4.setPosition(a.x, 3.9 * a.s, a.z); tepe.setMatrixAt(i, m4);
    tepe.setColorAt(i, new THREE.Color().setHSL(rr(0.35, 0.72), 0.5, rr(0.07, 0.15)));
  });
  tepe.castShadow = true; govde.castShadow = true;
  sahne.add(govde, tepe);
  const heykelMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 1.7, 2.0) });
  const heykelMat2 = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 0.4, 1.6) });
  for (const pk of parklar) {
    const t1 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.22, 8, 36), heykelMat); t1.position.set(pk.x, 4.2, pk.z); t1.rotation.y = R() * 3;
    const t2 = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.16, 8, 28), heykelMat2); t2.position.copy(t1.position); t2.rotation.set(Math.PI / 2, 0, 0);
    const tab = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 1.2, 12), dayMat); tab.position.set(pk.x, 0.6, pk.z);
    sahne.add(t1, t2, tab);
    colEkle(pk.x, 0, pk.z, 2.4, 1.2, 2.4, 0);
  }
  // ateşböcekleri
  const fb = [];
  for (const pk of parklar) for (let i = 0; i < 70; i++) fb.push(pk.x + rr(-18, 18), rr(0.8, 7), pk.z + rr(-18, 18));
  const fbGeo = new THREE.BufferGeometry(); fbGeo.setAttribute('position', new THREE.Float32BufferAttribute(fb, 3));
  const atesBocek = new THREE.Points(fbGeo, new THREE.PointsMaterial({ color: new THREE.Color(1.8, 2.2, 0.6), size: 0.45, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  atesBocek.frustumCulled = false;
  sahne.add(atesBocek);

  // ---- çatı detayları ----
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x3b3748, roughness: 0.6, metalness: 0.5 });
  const kutuG1 = new THREE.BoxGeometry(1, 1, 1);
  const tankG = (() => {
    const g = [];
    g.push(new THREE.CylinderGeometry(1.5, 1.5, 2.6, 10).translate(0, 3.5, 0));
    g.push(new THREE.ConeGeometry(1.6, 0.9, 10).translate(0, 5.25, 0));
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.push(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 5).translate(x, 1.1, z));
    return mergeGeometries(g.map(x => x.toNonIndexed()));
  })();
  const antG = (() => {
    const g = [];
    g.push(new THREE.CylinderGeometry(0.06, 0.1, 8, 5).translate(0, 4, 0));
    g.push(new THREE.BoxGeometry(2.2, 0.08, 0.08).translate(0, 6.4, 0));
    g.push(new THREE.BoxGeometry(1.4, 0.08, 0.08).translate(0, 5.2, 0));
    g.push(new THREE.BoxGeometry(0.08, 0.08, 1.6).translate(0, 7.2, 0));
    return mergeGeometries(g.map(x => x.toNonIndexed()));
  })();
  const parcaL = [], tankL = [], antL = [], beaconL = [];
  const MK = (x, y, z, sx, sy, sz, yaw = 0) => ({ x, y, z, sx, sy, sz, yaw });
  for (const b of cati) {
    if (b.h < 10) continue;
    const ax = b.gx / 2 - 2.4, az = b.gz / 2 - 2.4;
    const köşe = () => [(R() < 0.5 ? -1 : 1) * ax * rr(0.55, 1), (R() < 0.5 ? -1 : 1) * az * rr(0.55, 1)];
    const nAC = Math.floor(rr(1, 4));
    for (let i = 0; i < nAC; i++) { const [dx, dz] = köşe(); parcaL.push(MK(b.x + dx, b.h + 0.5, b.z + dz, 2.2, 1.0, 1.4, R() < 0.5 ? 0 : Math.PI / 2)); }
    if (R() < 0.4 && b.gx > 14) { const [dx, dz] = köşe(); tankL.push(MK(b.x + dx, b.h, b.z + dz, 1, 1, 1)); }
    if (R() < 0.45) {
      const [dx, dz] = köşe(); const s = rr(0.8, 1.6);
      antL.push(MK(b.x + dx, b.h, b.z + dz, s, s, s, R() * 3));
      if (b.h > 40) beaconL.push([b.x + dx, b.h + 8 * s + 0.3, b.z + dz, 0.45]);
    }
    if (b.h > 90 && !b.tier) beaconL.push([b.x, b.h + 0.6, b.z, 0.7]);
  }
  const sw = new THREE.Quaternion(), ey = new THREE.Vector3(0, 1, 0);
  function doldur(mesh, liste) {
    liste.forEach((o, i) => {
      sw.setFromAxisAngle(ey, o.yaw); yp.set(o.x, o.y, o.z); sc.set(o.sx, o.sy, o.sz);
      m4.compose(yp, sw, sc); mesh.setMatrixAt(i, m4);
    });
    mesh.frustumCulled = false; sahne.add(mesh);
  }
  doldur(new THREE.InstancedMesh(tankG, metalMat, tankL.length), tankL);
  doldur(new THREE.InstancedMesh(antG, metalMat, antL.length), antL);

  // tabela panoları (çatı üstü) — parcaL'a değil ayrı kutularla
  const ikazGeo = new THREE.IcosahedronGeometry(0.5, 1);
  const ikazMatA = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.1, 0.1) });
  const ikazMatB = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.1, 0.1) });
  const tumBeacon = beaconL.concat(kuleBeacon);
  const grupA = tumBeacon.filter((_, i) => i % 2 === 0), grupB = tumBeacon.filter((_, i) => i % 2 === 1);
  for (const [liste, mat] of [[grupA, ikazMatA], [grupB, ikazMatB]]) {
    const im = new THREE.InstancedMesh(ikazGeo, mat, liste.length);
    liste.forEach((o, i) => { m4.makeScale(o[3], o[3], o[3]); m4.setPosition(o[0], o[1], o[2]); im.setMatrixAt(i, m4); });
    im.frustumCulled = false; sahne.add(im);
  }

  // ---- neon tabelalar (tek geometri, atlas) ----
  const NB = Array.from({ length: 8 }, () => ({ pos: [], uv: [], idx: [] }));
  function quad(cx, cy, cz, nx, nz, w, h, hucre) {
    const B = NB[hucre % 8], tpos = B.pos;
    const rx = nz, rz = -nx; // sağ vektör = cross(up, n) = (nz,0,-nx)
    const hw = w / 2, hh = h / 2;
    const k = tpos.length / 3;
    const bl = [cx - rx * hw, cy - hh, cz - rz * hw], br = [cx + rx * hw, cy - hh, cz + rz * hw];
    const tr = [cx + rx * hw, cy + hh, cz + rz * hw], tl = [cx - rx * hw, cy + hh, cz - rz * hw];
    tpos.push(...bl, ...br, ...tr, ...tl);
    B.uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    B.idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  const sinir = yuzler.filter(y => y.h > 9);
  let tabelaSay = 0;
  for (const y of sinir) {
    if (R() > 0.18) continue;
    const yatay = y.nx !== 0 ? y.gz : y.gx;
    const ys = Math.min(y.h - 4, 4 + R() * 5);
    const hucre = Math.floor(R() * 8);
    const dikey = R() < 0.25 && y.h > 24 && false;
    const lat = rr(-yatay / 2 + 6, yatay / 2 - 6) * (dikey ? 0 : 1) + (dikey ? (R() < 0.5 ? -1 : 1) * (yatay / 2 - 1.6) : 0);
    const off = (y.nx !== 0 ? y.gx : y.gz) / 2 + 0.14;
    const cx = y.x + y.nx * off + (y.nx === 0 ? lat : 0);
    const cz = y.z + y.nz * off + (y.nz === 0 ? lat : 0);
    if (dikey) quad(cx, Math.min(y.h - 6, ys + 6), cz, y.nx, y.nz, 2.6, 10.4, hucre, true);
    else { const w = rr(6, Math.min(12, yatay - 3)); quad(cx, ys, cz, y.nx, y.nz, w, w / 2, hucre, false); }
    tabelaSay++;
  }
  // çatı panoları (iki yüzlü)
  const panoAdaylari = cati.filter(b => b.h > 28 && b.gx >= 18 && !b.tier);
  for (let i = 0; i < 0 && panoAdaylari.length; i++) {
    const b = panoAdaylari.splice(Math.floor(R() * panoAdaylari.length), 1)[0];
    const hucre = Math.floor(R() * 8);
    const eksenZ = R() < 0.5; const w = Math.min(15, b.gx * 0.7), h = w / 2;
    const nx = eksenZ ? 0 : 1, nz = eksenZ ? 1 : 0;
    const cy = b.h + 3.4 + h / 2;
    const ox = nx * (b.gx / 2 - 3.2) * (R() < 0.5 ? -1 : 1), oz = nz * (b.gz / 2 - 3.2) * (R() < 0.5 ? -1 : 1);
    quad(b.x + ox + nx * 0.1, cy, b.z + oz + nz * 0.1, nx, nz, w, h, hucre, false);
    quad(b.x + ox - nx * 0.1, cy, b.z + oz - nz * 0.1, -nx, -nz, w, h, hucre, false);
    for (const s of [-0.38, 0.38]) {
      const tx = nz * s * w, tz = -nx * s * w;
      parcaL.push(MK(b.x + ox + tx, b.h + 1.7, b.z + oz + tz, 0.35, 3.4, 0.35));
    }
    tabelaSay += 2;
  }
  doldur(new THREE.InstancedMesh(kutuG1, metalMat, parcaL.length), parcaL);

  NB.forEach((B, i) => {
    if (!B.pos.length) return;
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
    tg.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
    tg.setIndex(B.idx);
    const tabelaMat = new THREE.MeshBasicMaterial({ map: doku(`neon_${i + 1}.png`, true, false), color: new THREE.Color(1.0, 1.0, 1.0), transparent: true, alphaTest: 0.02, depthWrite: false, side: THREE.FrontSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const tabela = new THREE.Mesh(tg, tabelaMat);
    tabela.frustumCulled = false; tabela.renderOrder = 3;
    sahne.add(tabela);
  });

  // ---- trafik ----
  const N_ARAC = 150;
  const araclar = [];
  for (let i = 0; i < N_ARAC; i++) {
    araclar.push({
      eksen: R() < 0.5 ? 0 : 1, k: Math.floor(rr(-KN, KN + 1)), dir: R() < 0.5 ? 1 : -1,
      s: rr(-EXT, EXT), v: rr(9, 20), boy: rr(0.95, 1.5),
    });
  }
  const aracMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.6 });
  const govdeA = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 1.1, 4.4).translate(0, 0.85, 0), aracMat, N_ARAC);
  const kabinA = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.6, 2.2).translate(0, 1.7, -0.2), new THREE.MeshStandardMaterial({ color: 0x07070d, roughness: 0.1, metalness: 0.8 }), N_ARAC);
  const farA = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.22, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffff }), N_ARAC * 4);
  const huzmeA = new THREE.InstancedMesh(new THREE.PlaneGeometry(4.4, 14).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: huzmeDokusu(), color: new THREE.Color(0.85, 0.75, 0.5), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }), N_ARAC);
  huzmeA.renderOrder = 2;
  const cc = new THREE.Color();
  for (let i = 0; i < N_ARAC; i++) {
    govdeA.setColorAt(i, cc.setHSL(R(), rr(0.2, 0.7), rr(0.05, 0.2)));
    for (let j = 0; j < 4; j++) farA.setColorAt(i * 4 + j, j < 2 ? cc.setRGB(5, 4.2, 3) : cc.setRGB(3.2, 0.15, 0.15));
  }
  for (const m of [govdeA, kabinA, farA, huzmeA]) { m.frustumCulled = false; sahne.add(m); }
  govdeA.castShadow = false;

  function aracGuncelle(dt) {
    for (let i = 0; i < N_ARAC; i++) {
      const a = araclar[i];
      a.s += a.v * a.dir * dt;
      if (a.s > EXT) a.s = -EXT; else if (a.s < -EXT) a.s = EXT;
      let x, z, yaw;
      if (a.eksen === 0) { z = a.s; x = a.k * P - a.dir * 3.2; yaw = a.dir > 0 ? 0 : Math.PI; }
      else { x = a.s; z = a.k * P + a.dir * 3.2; yaw = a.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
      const c = Math.cos(yaw), sn = Math.sin(yaw);
      const e = m4.elements;
      const y = (a.eksen === 0 && Math.abs(z - KANAL_Z) < KOPRU_YARI) ? 0.1 : 0.0;
      const yaz = (mesh, idx, lx, ly, lz, s1 = 1, s2 = 1, s3 = 1) => {
        e[0] = c * s1; e[1] = 0; e[2] = -sn * s1; e[3] = 0;
        e[4] = 0; e[5] = s2; e[6] = 0; e[7] = 0;
        e[8] = sn * s3; e[9] = 0; e[10] = c * s3; e[11] = 0;
        e[12] = x + lx * c + lz * sn; e[13] = y + ly; e[14] = z - lx * sn + lz * c; e[15] = 1;
        mesh.setMatrixAt(idx, m4);
      };
      const bz = a.boy;
      yaz(govdeA, i, 0, 0, 0, 1, 1, bz); yaz(kabinA, i, 0, 0, 0, 1, 1, bz);
      const zf = 2.2 * bz, zb = -2.2 * bz;
      yaz(farA, i * 4, -0.65, 0.85, zf); yaz(farA, i * 4 + 1, 0.65, 0.85, zf);
      yaz(farA, i * 4 + 2, -0.65, 0.95, zb); yaz(farA, i * 4 + 3, 0.65, 0.95, zb);
      yaz(huzmeA, i, 0, 0.06, zf + 7);
    }
    govdeA.instanceMatrix.needsUpdate = true; kabinA.instanceMatrix.needsUpdate = true;
    farA.instanceMatrix.needsUpdate = true; huzmeA.instanceMatrix.needsUpdate = true;
  }
  aracGuncelle(0);

  // ---- izgarayı kur, API ----
  izgaraKur();

  const yollar = [];
  for (let k = -KN; k <= KN; k++) {
    yollar.push({ x1: k * P, z1: -EXT, x2: k * P, z2: EXT });
    yollar.push({ x1: -EXT, z1: k * P, x2: EXT, z2: k * P });
  }

  function zeminY(x, z) {
    const cx = gi(x), cz = gi(z);
    if (cx < 0 || cz < 0 || cx >= GN || cz >= GN) return 0;
    const l = hucre[cz * GN + cx];
    let y = 0;
    for (let k = 0; k < l.length; k++) {
      const i = l[k]; if (CTT[i] !== 0) continue;
      const o = i * 6;
      if (x >= CB[o] && x <= CB[o + 3] && z >= CB[o + 2] && z <= CB[o + 5] && CB[o + 4] > y) y = CB[o + 4];
    }
    return y;
  }

  function carpis(konum, r) {
    let px = konum.x, py = konum.y, pz = konum.z;
    let nx = 0, ny = 0, nz = 0, vurdu = false, duvar = false;
    const x0 = Math.max(0, gi(px - r)), x1 = Math.min(GN - 1, gi(px + r));
    const z0 = Math.max(0, gi(pz - r)), z1 = Math.min(GN - 1, gi(pz + r));
    damgaNo++;
    const r2 = r * r;
    for (let a = x0; a <= x1; a++) for (let b = z0; b <= z1; b++) {
      const l = hucre[b * GN + a];
      for (let k = 0; k < l.length; k++) {
        const i = l[k];
        if (CTT[i] === 1 || damga[i] === damgaNo) continue;
        damga[i] = damgaNo;
        const o = i * 6;
        const cx = px < CB[o] ? CB[o] : (px > CB[o + 3] ? CB[o + 3] : px);
        const cy = py < CB[o + 1] ? CB[o + 1] : (py > CB[o + 4] ? CB[o + 4] : py);
        const cz = pz < CB[o + 2] ? CB[o + 2] : (pz > CB[o + 5] ? CB[o + 5] : pz);
        const dx = px - cx, dy = py - cy, dz = pz - cz;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 >= r2) continue;
        let ex, ey, ez;
        if (d2 > 1e-12) {
          const d = Math.sqrt(d2), f = (r - d) / d;
          ex = dx / d; ey = dy / d; ez = dz / d;
          px += dx * f; py += dy * f; pz += dz * f;
        } else { // merkez kutunun içinde: en yakın yüzden it
          const m = [px - CB[o], CB[o + 3] - px, py - CB[o + 1], CB[o + 4] - py, pz - CB[o + 2], CB[o + 5] - pz];
          let bi = 0; for (let q = 1; q < 6; q++) if (m[q] < m[bi]) bi = q;
          ex = ey = ez = 0;
          switch (bi) {
            case 0: ex = -1; px = CB[o] - r; break;
            case 1: ex = 1; px = CB[o + 3] + r; break;
            case 2: ey = -1; py = CB[o + 1] - r; break;
            case 3: ey = 1; py = CB[o + 4] + r; break;
            case 4: ez = -1; pz = CB[o + 2] - r; break;
            default: ez = 1; pz = CB[o + 5] + r;
          }
        }
        nx += ex; ny += ey; nz += ez; vurdu = true;
        if (Math.abs(ey) < 0.7) duvar = true;
      }
    }
    const duzeltme = new THREE.Vector3(px - konum.x, py - konum.y, pz - konum.z);
    let normal = null;
    if (vurdu) {
      normal = new THREE.Vector3(nx, ny, nz);
      if (normal.lengthSq() < 1e-9) normal.set(0, 1, 0); else normal.normalize();
    }
    return { duzeltme, normal, duvar };
  }

  function ankrajBul(bas, yon, maxMesafe) {
    let dx = yon.x, dy = yon.y, dz = yon.z;
    const L = Math.hypot(dx, dy, dz);
    if (L < 1e-9) return null;
    dx /= L; dy /= L; dz /= L;
    if (!isinBul(bas.x, bas.y, bas.z, dx, dy, dz, maxMesafe)) return null;
    const t = _sonuc.t;
    const n = new THREE.Vector3();
    if (_sonuc.ax === 0) n.x = _sonuc.sg; else if (_sonuc.ax === 1) n.y = _sonuc.sg; else n.z = _sonuc.sg;
    return { nokta: new THREE.Vector3(bas.x + dx * t, bas.y + dy * t, bas.z + dz * t), normal: n };
  }

  function rastgeleCati() {
    for (let d = 0; d < 40; d++) {
      const b = binalar[Math.floor(Math.random() * binalar.length)];
      if (b.h < 12) continue;
      const x = b.x + (Math.random() - 0.5) * b.gx * 0.44;
      const z = b.z + (Math.random() - 0.5) * b.gz * 0.44;
      if (Math.abs(zeminY(x, z) - b.h) < 0.01) return new THREE.Vector3(x, b.h, z);
    }
    return new THREE.Vector3(0, 0, 0);
  }

  function sokakNoktasi() {
    const k = Math.floor(Math.random() * (2 * KN + 1)) - KN;
    const s = (Math.random() * 2 - 1) * (EXT - 15);
    const l = (Math.random() * 2 - 1) * 4;
    if (Math.random() < 0.5) return new THREE.Vector3(k * P + l, Math.abs(s - KANAL_Z) < KOPRU_YARI ? 0.1 : 0, s);
    return new THREE.Vector3(s, 0, k * P + l);
  }

  G.sehir = {
    boyut: 400, binalar, zeminY, carpis, ankrajBul, rastgeleCati, sokakNoktasi, yollar,
    gokyuzuRengi: ufukRenk.clone(), kuleler, parklar,
    kanal: { z: KANAL_Z, yari: KANAL_YARI },
  };

  // dahili durum
  kur._d = { ay, kubbe, suMat, atesBocek, ikazMatA, ikazMatB, aracGuncelle, sehirkam, ayYon, sayac: 0, bina: binalar.length, tabelaSay };
  if (qs.get('sehirtest')) {
    const b0 = binalar.find(b => b.h > 40);
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const a = ankrajBul(V(b0.x - b0.gx / 2 - 15, b0.h / 2, b0.z), V(1, 0, 0), 50);
    const t0 = performance.now(); let hit = 0;
    for (let i = 0; i < 2000; i++) if (ankrajBul(V(Math.random() * 600 - 300, 30, Math.random() * 600 - 300), V(Math.random() - 0.5, 0.2, Math.random() - 0.5), 120)) hit++;
    const dt = performance.now() - t0;
    const c = carpis(V(b0.x - b0.gx / 2 - 0.2, b0.h / 2, b0.z), 0.5);
    const c2 = carpis(V(b0.x, b0.h + 0.4, b0.z + 0.0), 0.5);
    console.log('[SEHIR-TEST] ankraj', JSON.stringify(a && { n: a.normal, x: a.nokta.x - (b0.x - b0.gx / 2) }), 'ray2000 ms', dt.toFixed(1), 'hit', hit,
      '| carpis duvar', c.duvar, JSON.stringify(c.duzeltme), JSON.stringify(c.normal), '| ustu', JSON.stringify(c2.normal),
      '| zeminY', zeminY(b0.x, b0.z), zeminY(0, 0), '| cati', JSON.stringify(rastgeleCati()), '| sokak', JSON.stringify(sokakNoktasi()));
  }
  // PRO: GLB tabanlı trafik/sokak eşyası/çatı detayı (asenkron; yüklenmezse mevcut görünüm kalır)
  proKur(G, {
    sahne, lambalar, LH, direk, bas, cati, binalar, d: kur._d,
    eskiArac: [govdeA, kabinA, farA, huzmeA], isikDokusu: huzmeDokusu,
  }).catch(e => console.warn('[SEHIR] pro yuklenemedi:', e && e.message));
  if (test) console.log(`[SEHIR] kur tamam: bina ${binalar.length}, parca ${parcalar.length}, tabela ${tabelaSay}, lamba ${lambalar.length}, collider ${CT.length}`);
}

// ---------- kare güncelle ----------
const _ld = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _c = new THREE.Vector3();
const _yukari = new THREE.Vector3(0, 1, 0);
export function guncelle(G, dt) {
  const d = kur._d; if (!d) return;
  const t = G.t;
  d.kubbe.material.uniforms.uT.value = t;
  d.kubbe.position.copy(G.kamera.position);
  d.suMat.uniforms.uT.value = t;
  d.atesBocek.position.y = Math.sin(t * 0.7) * 0.4;
  // yanıp sönen ikaz ışıkları
  const kA = Math.sin(t * 3.6) > 0.55 ? 3.4 : 0.25, kB = Math.sin(t * 3.6 + 2.6) > 0.55 ? 3.4 : 0.25;
  d.ikazMatA.color.setRGB(kA, kA * 0.04, kA * 0.04); d.ikazMatB.color.setRGB(kB, kB * 0.04, kB * 0.04);
  if (d.eskiArac !== false) d.aracGuncelle(Math.min(dt, 0.05));

  // test kamerası (oyuncu modülü yokken)
  if (G.test && d.sehirkam) {
    const kam = G.kamera;
    if (d.sehirkam === '2') { kam.position.set(0, 7, 150); kam.lookAt(0, 22, -100); }
    else if (d.sehirkam === '3') { kam.position.set(-40, 9, 175); kam.lookAt(20, 20, 190); }
    else if (d.sehirkam === '4') { kam.position.set(-50, 2.2, -120); kam.lookAt(-52, 3.0, -75); }
    else if (d.sehirkam === '6' && d.pro && d.pro.arac[0]) { const a0 = d.pro.arac[0]; kam.position.set((a0.x || 0) + 7, 2.6, (a0.z || 0) - 10); kam.lookAt(a0.x || 0, 1, a0.z || 0); }
    else if (d.sehirkam === '5' && d.catiKam) { kam.position.copy(d.catiKam.p); kam.lookAt(d.catiKam.h); }
    else { kam.position.set(0, 130, 330); kam.lookAt(0, 30, 0); }
  }

  // ay ışığı + gölge kamerası takibi
  const merkez = (G.oyuncu && G.oyuncu.konum) ? G.oyuncu.konum : G.kamera.position;
  _ld.copy(d.ayYon);
  _r.crossVectors(_yukari, _ld).normalize(); _u.crossVectors(_ld, _r).normalize();
  const tx = (2 * 75) / 2048;
  const a = Math.round(merkez.dot(_r) / tx) * tx, b = Math.round(merkez.dot(_u) / tx) * tx, c = merkez.dot(_ld);
  _c.set(0, 0, 0).addScaledVector(_r, a).addScaledVector(_u, b).addScaledVector(_ld, c);
  d.ay.target.position.copy(_c);
  d.ay.position.copy(_c).addScaledVector(_ld, 260);
  d.ay.target.updateMatrixWorld();

  if (d.pro) d.pro.guncelle(G, dt);

  // test günlüğü
  if (G.test && d.sayac >= 0) {
    d.sayac++;
    if (d.sayac === 6) {
      const r = G.renderer;
      r.info.reset();
      r.render(G.sahne, G.kamera);
      console.log(`[SEHIR] bina ${d.bina}, cizim cagrisi ${r.info.render.calls}, ucgen ${r.info.render.triangles}`);
      d.sayac = -1;
    }
  }
}

// =====================================================================
// PRO: CC0 GLB modelleriyle sokak hayatı (trafik, sokak eşyası, çatı detayı)
// Fizik/çarpışma ızgarasına DOKUNMAZ; yalnız görsel. Yükleme asenkron.
// =====================================================================
const _gl = new GLTFLoader();
const LOD_R = 150;
const _pm = new THREE.Matrix4(), _pq = new THREE.Quaternion(), _pp = new THREE.Vector3(), _ps = new THREE.Vector3();
const _EY = new THREE.Vector3(0, 1, 0);

// GLB'yi tek (vertexColors) geometriye indir: {govde, isik, ...}
async function modelYukle(url, o = {}) {
  const gltf = await _gl.loadAsync(url);
  gltf.scene.updateMatrixWorld(true);
  const gv = [], ig = [];
  let onS = 0, onN = 0, ix = 0, iz = 0, iN = 0;
  gltf.scene.traverse(m => {
    if (!m.isMesh || !m.geometry.attributes.position) return;
    let g = m.geometry.clone(); g.applyMatrix4(m.matrixWorld);
    if (g.index) g = g.toNonIndexed();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    const mat = Array.isArray(m.material) ? m.material[0] : m.material;
    const ad = mat.name || '';
    if (/^shadow/i.test(ad)) return;
    const isik = !!(o.isikRe && o.isikRe.test(ad));
    const k = isik ? (o.isikGuc ?? 2) * (/front/i.test(ad) ? 1.6 : 1) : (o.renk ?? 2);
    const n = g.attributes.position.count, col = new Float32Array(n * 3), c = mat.color || new THREE.Color(1, 1, 1);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pa = g.attributes.position;
    if (o.onRe && o.onRe.test(ad)) for (let i = 0; i < n; i++) { onS += pa.getZ(i); onN++; }
    if (isik) for (let i = 0; i < n; i++) { ix += pa.getX(i); iz += pa.getZ(i); iN++; }
    (isik ? ig : gv).push(g);
  });
  if (!gv.length && !ig.length) throw new Error('bos model ' + url);
  const G1 = gv.length ? mergeGeometries(gv) : null, I1 = ig.length ? mergeGeometries(ig) : null;
  const bb = new THREE.Box3();
  for (const g of [G1, I1]) if (g) { g.computeBoundingBox(); bb.union(g.boundingBox); }
  const sz = bb.getSize(new THREE.Vector3()), mid = bb.getCenter(new THREE.Vector3());
  let s = o.olcek ?? 1;
  if (o.yuk) s = o.yuk / Math.max(sz.y, 1e-4);
  else if (o.boy) s = o.boy / Math.max(sz.z, 1e-4);
  else if (o.yatay) s = o.yatay / Math.max(sz.x, sz.z, 1e-4);
  const cx = o.merkezle === false ? 0 : mid.x, cz = o.merkezle === false ? 0 : mid.z;
  const flip = o.onRe && onN && (onS / onN - mid.z) < 0;
  for (const g of [G1, I1]) if (g) {
    g.translate(-cx, -bb.min.y, -cz); g.scale(s, s, s);
    if (flip) g.rotateY(Math.PI);
  }
  return { govde: G1, isik: I1, boyut: sz.clone().multiplyScalar(s), isikOrt: iN ? { x: ix / iN * s, z: iz / iN * s } : null };
}

// Procedürel küçük model: parçalar [w,h,d, x,y,z, renk, isik?]
function kutuModel(parcalar) {
  const gv = [], ig = [];
  for (const [w, h, d, x, y, z, renk, isik] of parcalar) {
    const g = new THREE.BoxGeometry(w, h, d).translate(x, y, z).toNonIndexed();
    g.deleteAttribute('uv');
    const c = new THREE.Color(renk), n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    (isik ? ig : gv).push(g);
  }
  return { govde: gv.length ? mergeGeometries(gv) : null, isik: ig.length ? mergeGeometries(ig) : null };
}
function silindirModel(r, h, renk, kapak) {
  const g = new THREE.CylinderGeometry(r, r * 0.85, h, 10).translate(0, h / 2, 0).toNonIndexed(); g.deleteAttribute('uv');
  const g2 = new THREE.CylinderGeometry(r * 1.08, r * 1.08, 0.07, 10).translate(0, h + 0.03, 0).toNonIndexed(); g2.deleteAttribute('uv');
  for (const [gg, rk] of [[g, renk], [g2, kapak]]) {
    const c = new THREE.Color(rk), n = gg.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    gg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  return { govde: mergeGeometries([g, g2]), isik: null };
}

// Model başına (gövde + ışık) InstancedMesh'ler. Statik kümede LOD uzaklığa göre sayı kısılır.
class Kume {
  constructor(grup, m, max, mats, renkli = false) {
    this.max = max; this.n = 0; this.sayi = 0;
    this.mat = new Float32Array(max * 16); this.p = new Float32Array(max * 3);
    this.col = renkli ? new Float32Array(max * 3) : null;
    this.meshler = [];
    for (const [g, mt] of [[m.govde, mats.govde], [m.isik, mats.isik]]) {
      if (!g) continue;
      const im = new THREE.InstancedMesh(g, mt, max);
      im.frustumCulled = false; im.count = 0; im.castShadow = false; im.receiveShadow = false;
      if (renkli) im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3).fill(1), 3);
      grup.add(im); this.meshler.push(im);
    }
    this.uzak = null;
  }
  ekle(x, y, z, yaw, s, rgb) {
    if (this.n >= this.max) return;
    _pq.setFromAxisAngle(_EY, yaw); _pp.set(x, y, z); _ps.set(s, s, s);
    _pm.compose(_pp, _pq, _ps); _pm.toArray(this.mat, this.n * 16);
    this.p[this.n * 3] = x; this.p[this.n * 3 + 1] = y; this.p[this.n * 3 + 2] = z;
    if (this.col && rgb) { this.col[this.n * 3] = rgb[0]; this.col[this.n * 3 + 1] = rgb[1]; this.col[this.n * 3 + 2] = rgb[2]; }
    this.n++;
  }
  lod(cx, cy, cz, R) {
    const R2 = R * R; let k = 0, u = 0;
    const uz = this.uzak;
    if (uz) for (const q of uz) q.say = 0;
    for (let i = 0; i < this.n; i++) {
      const dx = this.p[i * 3] - cx, dy = this.p[i * 3 + 1] - cy, dz = this.p[i * 3 + 2] - cz;
      if (dx * dx + dy * dy + dz * dz < R2) {
        for (const im of this.meshler) im.instanceMatrix.array.set(this.mat.subarray(i * 16, i * 16 + 16), k * 16);
        if (this.col) for (const im of this.meshler) im.instanceColor.array.set(this.col.subarray(i * 3, i * 3 + 3), k * 3);
        k++;
      } else if (uz) {
        for (const q of uz) { q.mesh.instanceMatrix.array.set(q.orig.subarray(i * 16, i * 16 + 16), q.say * 16); q.say++; }
      }
    }
    for (const im of this.meshler) { im.count = k; im.instanceMatrix.needsUpdate = true; if (this.col) im.instanceColor.needsUpdate = true; }
    if (uz) for (const q of uz) { q.mesh.count = q.say; q.mesh.instanceMatrix.needsUpdate = true; }
    this.gorunen = k;
  }
  // araçlar için: her kare baştan yaz
  sifirla() { this.sayi = 0; }
  yaz(m4) {
    if (this.sayi >= this.max) return;
    for (const im of this.meshler) m4.toArray(im.instanceMatrix.array, this.sayi * 16);
    this.sayi++;
  }
  bitir() { for (const im of this.meshler) { im.count = this.sayi; im.instanceMatrix.needsUpdate = true; } }
}

async function proKur(G, c) {
  const { sahne, lambalar, LH, direk, bas, cati, binalar, d } = c;
  const test = G.test;
  const RP = rng(424242), rp = (a, b) => a + (b - a) * RP();
  const grup = new THREE.Group(); grup.name = 'pro'; sahne.add(grup);
  const mats = {
    govde: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.15, emissive: new THREE.Color(0x15171f) }),
    isik: new THREE.MeshBasicMaterial({ vertexColors: true }),
  };
  const hata = [];
  const yukle = async (url, o) => { try { return await modelYukle('assets/3d/' + url, o); } catch (e) { hata.push(url); return null; } };

  // ---------- modeller (paralel) ----------
  const aracAd = ['sedan', 'taxi', 'van', 'delivery', 'suv', 'hatchbackSports'];
  const aracO = { isikRe: /^light(Front|Back)/i, onRe: /^lightFront/i, isikGuc: 2.2, boy: 4.5 };
  const catiO = { olcek: 1 };
  const [araclarM, lambaM, trafikM, agacM, bariyerM, ...catiM] = await Promise.all([
    Promise.all(aracAd.map(a => yukle(`arac/${a}.glb`, { ...aracO, boy: a === 'delivery' ? 6.4 : a === 'van' ? 5.0 : a === 'suv' ? 4.8 : 4.4 }))),
    yukle('sehir/Streetlight_Single.glb', { isikRe: /^Light$/, isikGuc: 3, yuk: LH, merkezle: false }),
    yukle('sehir/TrafficLight.glb', { isikRe: /^(Red|Green|Yellow)/, onRe: /^(Red|Green|Yellow)/, isikGuc: 1.1, yuk: 5.2 }),
    yukle('arac/treeLarge.glb', { yuk: 4.8, renk: 1.4 }),
    yukle('arac/barrierRed.glb', { yatay: 1.8, renk: 2 }),
    yukle('cyberpunk/AC.glb', { yatay: 1.9, renk: 4 }),
    yukle('cyberpunk/AC_Stacked.glb', { yatay: 1.9, renk: 4 }),
    yukle('cyberpunk/Antenna_2.glb', { yuk: 5.5, renk: 4 }),
    yukle('cyberpunk/Pipe_1.glb', { yatay: 3.2, renk: 4 }),
    yukle('cyberpunk/Fence.glb', { yatay: 2.6, renk: 4 }),
    yukle('cyberpunk/Tank.glb', { yatay: 2.4, renk: 4 }),
  ]);
  if (test && hata.length) console.warn('[SEHIR] pro model yuklenemedi:', hata.join(','));
  if (test) console.log('[SEHIR] pro boyutlar', JSON.stringify({ lamba: lambaM && lambaM.boyut, trafik: trafikM && trafikM.boyut, agac: agacM && agacM.boyut, bariyer: bariyerM && bariyerM.boyut, lambaIsik: lambaM && lambaM.isikOrt, cati: catiM.map(m => m && m.boyut.toArray().map(v => +v.toFixed(2))) }));

  const kumeler = [];
  let esyaSay = 0;

  // ---------- sokak lambaları ----------
  if (lambaM) {
    const k = new Kume(grup, lambaM, lambalar.length, mats);
    const ao = lambaM.isikOrt;
    const phi = ao ? Math.atan2(ao.x, ao.z) : 0;
    lambalar.forEach(l => k.ekle(l.x, l.y0, l.z, Math.atan2(l.yx, l.yz) - phi, 1));
    k.uzak = [direk, bas].map(mesh => ({ mesh, orig: mesh.instanceMatrix.array.slice(), say: 0 }));
    kumeler.push(k); esyaSay += k.n;
  }

  // ---------- sokak eşyası (kaldırım) ----------
  const bankM = kutuModel([
    [1.7, 0.07, 0.5, 0, 0.5, 0, '#6b4a2f'], [1.7, 0.45, 0.06, 0, 0.82, -0.22, '#6b4a2f'],
    [0.08, 0.5, 0.45, -0.75, 0.25, 0, '#2a2d38'], [0.08, 0.5, 0.45, 0.75, 0.25, 0, '#2a2d38'],
  ]);
  const copM = silindirModel(0.28, 0.95, '#2c4a3a', '#1c1f26');
  const durakM = kutuModel([
    [3.4, 0.12, 1.5, 0, 2.55, 0, '#2a2d38'], [0.1, 2.5, 0.1, -1.6, 1.25, -0.6, '#2a2d38'], [0.1, 2.5, 0.1, 1.6, 1.25, -0.6, '#2a2d38'],
    [3.2, 1.5, 0.05, 0, 1.4, -0.68, '#8fb4c4'], [1.6, 0.06, 0.45, 0, 0.5, -0.3, '#6b4a2f'],
    [1.5, 0.9, 0.06, 0.75, 1.5, -0.64, '#fff1d0', true],
  ]);
  const bankK = new Kume(grup, bankM, 160, mats), copK = new Kume(grup, copM, 200, mats), durakK = new Kume(grup, durakM, 24, mats);
  const agacK = agacM ? new Kume(grup, agacM, 420, mats, true) : null;
  const bariK = bariyerM ? new Kume(grup, bariyerM, 160, mats) : null;
  const trafK = trafikM ? new Kume(grup, trafikM, 520, mats) : null;
  const kavsakDisi = (s) => Math.abs((((s + P / 2) % P) + P) % P - P / 2) > 13;
  const SD = YOL_YARI + 2.0;
  const yeler = [];
  for (let eksen = 0; eksen < 2; eksen++) for (let k = -KN; k <= KN; k++) {
    for (let s = -EXT + 12 + 14.25, i = 0; s < EXT - 14; s += 28.5, i++) {
      if (!kavsakDisi(s)) continue;
      if (eksen === 0 && Math.abs(s - KANAL_Z) < KOPRU_YARI + 6) continue;
      for (const sd of [-1, 1]) {
        let x, z, tx, tz;
        if (eksen === 0) { x = k * P + sd * SD; z = s; tx = -sd; tz = 0; } else { x = s; z = k * P + sd * SD; tx = 0; tz = -sd; }
        const r = RP(), yaw = Math.atan2(tx, tz);
        if (r < 0.5 && agacK) {
          const sc = rp(0.8, 1.2);
          agacK.ekle(x + (eksen === 0 ? sd * 0.4 : 0), 0, z + (eksen === 1 ? sd * 0.4 : 0), RP() * 6.28, sc, [rp(0.8, 1.15), rp(0.85, 1.1), rp(0.8, 1.1)]);
        } else if (r < 0.62) bankK.ekle(x, 0, z, yaw, 1);
        else if (r < 0.77) copK.ekle(x, 0, z, 0, 1);
        else if (r < 0.81 && durakK.n < 24) durakK.ekle(x + (eksen === 0 ? sd * 0.2 : 0), 0, z + (eksen === 1 ? sd * 0.2 : 0), yaw, 1);
        else if (r < 0.87 && bariK) {
          for (let j = -1; j <= 1; j++) {
            const ox = eksen === 0 ? 0 : j * 1.9, oz = eksen === 0 ? j * 1.9 : 0;
            bariK.ekle(x - (eksen === 0 ? sd * 0.3 : 0) + ox, 0, z - (eksen === 1 ? sd * 0.3 : 0) + oz, yaw, 1);
          }
        }
        yeler.push(0);
      }
    }
  }
  // trafik ışıkları: kavşak köşeleri (çapraz iki köşe)
  if (trafK) {
    for (let a = -KN; a <= KN; a++) for (let b = -KN; b <= KN; b++) {
      for (const sg of [1, -1]) {
        const x = a * P + sg * (YOL_YARI + 1.6), z = b * P + sg * (YOL_YARI + 1.6);
        trafK.ekle(x, 0, z, Math.atan2(-sg, -sg) + (((a + b) & 1) ? Math.PI / 2 : 0), 1);
      }
    }
  }
  for (const k of [bankK, copK, durakK, agacK, bariK, trafK]) if (k && k.n) { kumeler.push(k); esyaSay += k.n; }

  // ---------- çatı detayları (dekor, collider yok) ----------
  const catiK = catiM.map((m, i) => m ? new Kume(grup, m, 700, mats) : null);
  let ornekCati = null;
  const [kAC, kACS, kAnt, kBoru, kCit, kTank] = catiK;
  const catiBoyut = (m) => (m ? m.boyut : null);
  for (const b of cati) {
    if (b.h < 12) continue;
    const tg = b.tier ? Math.min(b.gx, b.gz) * 0.55 : 0;
    const ax = b.gx / 2 - 1.8, az = b.gz / 2 - 1.8;
    const bos = (x, z) => !b.tier || Math.abs(x) > tg / 2 + 1.6 || Math.abs(z) > tg / 2 + 1.6;
    const nokta = () => { for (let t = 0; t < 8; t++) { const x = rp(-ax, ax), z = rp(-az, az); if (bos(x, z)) return [x, z]; } return null; };
    const n = 1 + Math.floor(RP() * 3);
    for (let i = 0; i < n; i++) {
      const p = nokta(); if (!p) continue;
      const r = RP(), yaw = Math.floor(RP() * 4) * Math.PI / 2 + rp(-0.15, 0.15);
      if (!ornekCati && !b.tier && b.h > 30 && b.h < 90 && Math.abs(b.x) < 250 && Math.abs(b.z) < 150 && r < 0.74) ornekCati = { b, x: b.x + p[0], z: b.z + p[1] };
      if (r < 0.28 && kAC) kAC.ekle(b.x + p[0], b.h, b.z + p[1], yaw, rp(0.9, 1.3));
      else if (r < 0.46 && kACS) kACS.ekle(b.x + p[0], b.h, b.z + p[1], yaw, rp(0.9, 1.3));
      else if (r < 0.62 && kAnt) kAnt.ekle(b.x + p[0], b.h, b.z + p[1], yaw, rp(0.8, 1.4));
      else if (r < 0.74 && kBoru) kBoru.ekle(b.x + p[0], b.h, b.z + p[1], yaw, rp(1, 1.6));
      else if (r < 0.88 && kTank && b.gx > 10) kTank.ekle(b.x + p[0], b.h, b.z + p[1], yaw, rp(1, 1.5));
      else if (kCit) { // çatı kenarı çiti: iki üç parça
        const kx = RP() < 0.5, sg = RP() < 0.5 ? 1 : -1, ln = 2.6, m2 = 2 + Math.floor(RP() * 3);
        const a0 = rp(-0.5, 0.5) * (kx ? ax : az);
        for (let j = 0; j < m2; j++) {
          const o = a0 + j * ln, lim = kx ? ax : az; if (Math.abs(o) > lim) break;
          kCit.ekle(b.x + (kx ? o : sg * (b.gx / 2 - 0.5)), b.h, b.z + (kx ? sg * (b.gz / 2 - 0.5) : o), kx ? 0 : Math.PI / 2, 1);
        }
      }
    }
  }
  for (const k of catiK) if (k && k.n) { kumeler.push(k); esyaSay += k.n; }

  // ---------- trafik ----------
  const N_ARAC = 120;
  const aracK = [];
  const huzmeMat = new THREE.MeshBasicMaterial({ map: c.isikDokusu(), color: new THREE.Color(0.85, 0.75, 0.5), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
  const huzme = new THREE.InstancedMesh(new THREE.PlaneGeometry(3.6, 11).rotateX(-Math.PI / 2), huzmeMat, N_ARAC);
  huzme.frustumCulled = false; huzme.renderOrder = 2; huzme.count = 0; grup.add(huzme);
  const iyiArac = araclarM.map((m, i) => m ? i : -1).filter(i => i >= 0);
  const arac = [];
  if (iyiArac.length >= 3) {
    for (const i of iyiArac) aracK[i] = new Kume(grup, araclarM[i], N_ARAC, mats);
    // 60 şerit, şerit başına iki araç; seyahat hızı şeride özgü
    const seritler = [];
    for (let e = 0; e < 2; e++) for (let k = -KN; k <= KN; k++) for (const dir of [1, -1]) seritler.push({ e, k, dir, v: rp(9, 15) });
    for (let i = seritler.length - 1; i > 0; i--) { const j = Math.floor(RP() * (i + 1)); [seritler[i], seritler[j]] = [seritler[j], seritler[i]]; }
    for (let i = 0; i < N_ARAC; i++) {
      const sr = seritler[i % seritler.length];
      const s0 = (i < seritler.length) ? rp(-EXT, EXT * 0.1) : rp(EXT * 0.2, EXT);
      arac.push({ sr, s: s0, v: sr.v * rp(0.95, 1.05), vc: sr.v, model: iyiArac[Math.floor(RP() * iyiArac.length)], boy: 4.6 });
    }
    for (const a of arac) a.sr.liste = (a.sr.liste || []).concat(a);
    // eski kutu araçları kapat
    for (const m of c.eskiArac) m.visible = false;
    d.eskiArac = false;
  }
  const aracYaz = new THREE.Matrix4();
  function trafikGuncelle(dt, cam, t) {
    if (!arac.length) return;
    const faz = t % 16;
    const yesil = [faz < 7, faz >= 8 && faz < 15];
    for (const k of aracK) if (k) k.sifirla();
    let hz = 0;
    const R2 = LOD_R * LOD_R;
    for (const a of arac) {
      const { e, k, dir } = a.sr;
      // hedef hız: kavşakta kırmızıya yavaşla/dur, öndeki araçla mesafe
      let vt = a.v;
      const mer = dir > 0 ? Math.ceil((a.s + 0.01) / P) * P : Math.floor((a.s - 0.01) / P) * P;
      const dd = (mer - a.s) * dir;
      if (Math.abs(mer) <= EXT && dd > 9.5 && dd < 32 && !yesil[e]) vt = Math.min(vt, a.v * Math.max(0, Math.min(1, (dd - 10.5) / 18)));
      for (const o of a.sr.liste) {
        if (o === a) continue;
        const g = (o.s - a.s) * dir;
        if (g > 0 && g < 20) vt = Math.min(vt, a.v * Math.max(0, Math.min(1, (g - 7.5) / 9)));
      }
      a.vc += (vt - a.vc) * Math.min(1, dt * 2.5);
      a.s += a.vc * dir * dt;
      if (a.s > EXT) a.s = -EXT; else if (a.s < -EXT) a.s = EXT;
      let x, z, yaw;
      if (e === 0) { z = a.s; x = k * P - dir * 3.2; yaw = dir > 0 ? 0 : Math.PI; }
      else { x = a.s; z = k * P + dir * 3.2; yaw = dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
      a.x = x; a.z = z;
      const dx = x - cam.x, dz = z - cam.z;
      if (dx * dx + dz * dz > R2) continue;
      const y = (e === 0 && Math.abs(z - KANAL_Z) < KOPRU_YARI) ? 0.1 : 0;
      _pq.setFromAxisAngle(_EY, yaw); _pp.set(x, y, z); _ps.set(1, 1, 1);
      aracYaz.compose(_pp, _pq, _ps);
      aracK[a.model].yaz(aracYaz);
      if (hz < N_ARAC) {
        const ca = Math.cos(yaw), sa = Math.sin(yaw);
        _pp.set(x + sa * 7.2, y + 0.06, z + ca * 7.2);
        aracYaz.compose(_pp, _pq, _ps); aracYaz.toArray(huzme.instanceMatrix.array, hz * 16); hz++;
      }
    }
    for (const k of aracK) if (k) k.bitir();
    huzme.count = hz; huzme.instanceMatrix.needsUpdate = true;
  }

  // ---------- LOD + güncelle ----------
  const son = { t: -9, x: 1e9, y: 0, z: 1e9 };
  const pro = {
    kumeler, grup, arac, esya: esyaSay, bazOlc: 0,
    guncelle(G2, dt) {
      const cam = G2.kamera.position;
      const hx = cam.x - son.x, hz2 = cam.z - son.z, hy = cam.y - son.y;
      if (G2.t - son.t > 0.35 || hx * hx + hz2 * hz2 + hy * hy > 36) {
        for (const k of kumeler) k.lod(cam.x, cam.y, cam.z, LOD_R);
        son.t = G2.t; son.x = cam.x; son.y = cam.y; son.z = cam.z;
      }
      trafikGuncelle(Math.min(dt, 0.05), cam, G2.t);
    },
  };
  d.pro = pro;
  // test kamerası: çatı
  if (ornekCati) {
    const { b, x, z } = ornekCati;
    const gx = Math.max(b.x - b.gx / 2 + 1.5, Math.min(b.x + b.gx / 2 - 1.5, x + 7)), gz = Math.max(b.z - b.gz / 2 + 1.5, Math.min(b.z + b.gz / 2 - 1.5, z + 7));
    d.catiKam = { p: new THREE.Vector3(gx, b.h + 3.2, gz), h: new THREE.Vector3(x, b.h + 0.8, z) };
  }

  if (test) {
    console.log('[SEHIR] pro cati', JSON.stringify(catiK.map(k => k && k.n)), JSON.stringify(ornekCati && { x: ornekCati.x, z: ornekCati.z, h: ornekCati.b.h }));
    let say = 0;
    const olc = () => {
      if (++say < 8) { requestAnimationFrame(olc); return; }
      const r = G.renderer;
      const olcCagri = (acik) => {
        grup.visible = acik; for (const m of c.eskiArac) m.visible = !acik;
        r.info.reset(); r.render(G.sahne, G.kamera); return r.info.render.calls;
      };
      const C = olcCagri(true), B = olcCagri(false);
      grup.visible = true; for (const m of c.eskiArac) m.visible = !arac.length;
      let gor = 0; for (const k of kumeler) gor += k.gorunen || 0;
      console.log(`[SEHIR] pro: arac ${arac.length}, esya ${esyaSay} (gorunen ${gor}), cizim cagrisi ${C} (pro kapali ${B}, +${C - B})`);
    };
    requestAnimationFrame(olc);
  }
}
