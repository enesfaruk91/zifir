// HARİTA CEPHE/ÇATI/BALKON — Basınevleri binalarının görünüşü (tümü prosedürel, telifsiz).
// harita.js çağırır. Fizik harita_fizik.js'te (kırma çatı yüksekliği b.kirma ile paylaşılır).
// Çarpışma YOK: balkon, tabela, çatı eşyası yalnız görsel.
import * as THREE from 'three';
import { rng, kimlikHash, KAT_M } from './harita_fizik.js';

const EY = new THREE.Vector3(0, 1, 0);
const HUCRE_M = 3.4; // bir pencere sütunu (m)

// ---------- doku üreticileri ----------
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function dikdortgen(u, v, x0, y0, x1, y1, aa = 0.008) { // yumuşak kenarlı dikdörtgen kapsaması
  return sstep(x0 - aa, x0 + aa, u) * (1 - sstep(x1 - aa, x1 + aa, u)) * sstep(y0 - aa, y0 + aa, v) * (1 - sstep(y1 - aa, y1 + aa, v));
}
const klp = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
// Bir hücre (3,4 m x 3 m): [cam, çerçeve, kabartma(0.5 nötr)]
const HUCRE = [
  // 0: çift kanatlı PVC + denizlik
  (u, v) => {
    const dis = dikdortgen(u, v, 0.2, 0.3, 0.8, 0.82), ic = dikdortgen(u, v, 0.24, 0.335, 0.76, 0.785), orta = dikdortgen(u, v, 0.485, 0.335, 0.515, 0.785);
    const f = klp(dis - ic + orta * ic), g = ic * (1 - orta);
    let r = 0.5 + 0.28 * dikdortgen(u, v, 0.15, 0.25, 0.85, 0.3) - 0.22 * dikdortgen(u, v, 0.15, 0.2, 0.85, 0.25);
    return [g, f, r];
  },
  // 1: geniş üçlü sürgülü + lento
  (u, v) => {
    const dis = dikdortgen(u, v, 0.1, 0.34, 0.9, 0.8), ic = dikdortgen(u, v, 0.135, 0.37, 0.865, 0.77);
    const m = dikdortgen(u, v, 0.37, 0.37, 0.395, 0.77) + dikdortgen(u, v, 0.605, 0.37, 0.63, 0.77);
    const f = klp(dis - ic + m * ic), g = ic * (1 - klp(m));
    let r = 0.5 + 0.2 * dikdortgen(u, v, 0.07, 0.8, 0.93, 0.85) + 0.25 * dikdortgen(u, v, 0.08, 0.3, 0.92, 0.34) - 0.2 * dikdortgen(u, v, 0.08, 0.25, 0.92, 0.3);
    return [g, f, r];
  },
  // 2: dik pencere, beton söveli, kanat ayrımı
  (u, v) => {
    const sov = dikdortgen(u, v, 0.2, 0.12, 0.8, 0.9), dis = dikdortgen(u, v, 0.27, 0.19, 0.73, 0.84), ic = dikdortgen(u, v, 0.305, 0.225, 0.695, 0.805);
    const m = dikdortgen(u, v, 0.305, 0.585, 0.695, 0.615);
    const f = klp(dis - ic + m * ic), g = ic * (1 - m);
    let r = 0.5 + 0.2 * (sov - dis) - 0.15 * dikdortgen(u, v, 0.2, 0.9, 0.8, 0.93);
    return [g, f, r];
  },
  // 3: ikiz küçük pencere (mutfak/banyo) + ortak denizlik
  (u, v) => {
    const a = (x0, x1) => { const d = dikdortgen(u, v, x0, 0.38, x1, 0.8), i = dikdortgen(u, v, x0 + 0.035, 0.41, x1 - 0.035, 0.77), m = dikdortgen(u, v, (x0 + x1) / 2 - 0.012, 0.41, (x0 + x1) / 2 + 0.012, 0.77); return [klp(d - i + m * i), i * (1 - m)]; };
    const A = a(0.1, 0.45), B = a(0.55, 0.9);
    let r = 0.5 + 0.28 * dikdortgen(u, v, 0.07, 0.33, 0.93, 0.375) - 0.2 * dikdortgen(u, v, 0.07, 0.28, 0.93, 0.33);
    return [klp(A[1] + B[1]), klp(A[0] + B[0]), r];
  },
];
function cepheDokusu(varyant, aniso) {
  const N = 512, C = N / 4;
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const c = cv.getContext('2d'), im = c.createImageData(N, N), d = im.data;
  const f = HUCRE[varyant];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = ((x % C) + 0.5) / C, v = 1 - ((y % C) + 0.5) / C;
    let [g, fr, r] = f(u, v);
    // kat bandı: hücre tabanında ince koyu çizgi + hemen üstünde açık şerit (döşeme kenarı)
    r += -0.3 * (1 - sstep(0.0, 0.05, v)) * 1 + 0.12 * sstep(0.04, 0.06, v) * (1 - sstep(0.1, 0.12, v));
    r = klp(r);
    const k = (y * N + x) * 4; d[k] = klp(g) * 255; d[k + 1] = klp(fr) * 255; d[k + 2] = r * 255; d[k + 3] = 255;
  }
  c.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; t.anisotropy = aniso; t.generateMipmaps = true;
  return t;
}
function kanvasDoku(w, h, ciz, srgb = true, aniso = 4, tekrar = true) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); ciz(c, w, h);
  const t = new THREE.CanvasTexture(cv);
  if (tekrar) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t;
}
// kilit taşı (kaldırım): 20x10 cm tuğla sırası, kayık dizilim, 3 ton
export function kilitTasiDokusu(aniso) {
  return kanvasDoku(512, 512, (c, w, h) => {
    const r = rng(11);
    c.fillStyle = '#4a4742'; c.fillRect(0, 0, w, h);
    const tonlar = [[150, 146, 138], [128, 124, 118], [158, 140, 124], [112, 112, 112], [140, 128, 120]];
    const bh = 21.3, bw = 42.6; // 2.4 m dilim = 24 sıra x 12 sütun
    for (let sy = 0; sy < 24; sy++) for (let sx = 0; sx < 13; sx++) {
      const t = tonlar[Math.floor(r() * tonlar.length)], k = 0.9 + r() * 0.2;
      c.fillStyle = `rgb(${t[0] * k | 0},${t[1] * k | 0},${t[2] * k | 0})`;
      const x = sx * bw + (sy % 2 ? -bw / 2 : 0), y = sy * bh;
      c.fillRect(x + 1.2, y + 1.2, bw - 2.4, bh - 2.4);
      if (x < 0) c.fillRect(x + w + 1.2, y + 1.2, bw - 2.4, bh - 2.4);
    }
  }, true, aniso);
}
// bordür taşı: tek yönlü, uzun açık gri bloklar
export function bordurDokusu(aniso) {
  return kanvasDoku(256, 64, (c, w, h) => {
    c.fillStyle = '#b9b6ae'; c.fillRect(0, 0, w, h);
    const r = rng(23);
    for (let i = 0; i < 700; i++) { const g = 140 + r() * 90 | 0; c.fillStyle = `rgba(${g},${g},${g - 6},0.25)`; c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
    c.fillStyle = '#6e6c66'; for (let x = 0; x < w; x += 64) c.fillRect(x, 0, 2, h); // blok derzi
  }, true, aniso);
}
// sıcak gri asfalt (mavi/mor yok): kum tanesi + çatlak + yama
export function asfaltDokusu(aniso) {
  return kanvasDoku(512, 512, (c, w, h) => {
    const r = rng(37);
    c.fillStyle = '#7a7873'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { const g = 100 + r() * 40 | 0; c.fillStyle = `rgba(${g + 6},${g + 2},${g - 6},0.16)`; c.fillRect(r() * w, r() * h, 30 + r() * 120, 20 + r() * 90); }
    for (let i = 0; i < 16000; i++) { const g = 70 + r() * 150 | 0; c.fillStyle = `rgba(${g + 6},${g + 2},${g - 4},${0.15 + r() * 0.35})`; const s = 1 + r() * 2; c.fillRect(r() * w, r() * h, s, s); }
    c.strokeStyle = 'rgba(40,38,35,0.55)'; c.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) { c.beginPath(); let x = r() * w, y = r() * h; c.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (r() - 0.5) * 50; y += (r() - 0.3) * 40; c.lineTo(x, y); } c.stroke(); }
  }, true, aniso);
}
// kiremit: eğim boyunca sıralar (v), sıralar yarım kayık
function kiremitDokusu(aniso) {
  return kanvasDoku(256, 256, (c, w, h) => {
    const r = rng(53);
    c.fillStyle = '#b8b8b8'; c.fillRect(0, 0, w, h);
    const sr = 8, sc = 5, rh = h / sr, rw = w / sc;
    for (let y = 0; y < sr; y++) for (let x = -1; x < sc; x++) {
      const k = 0.82 + r() * 0.2, g = 235 * k | 0;
      c.fillStyle = `rgb(${g},${g},${g})`;
      const ox = x * rw + (y % 2 ? rw / 2 : 0);
      c.fillRect(ox + 1, y * rh + 1, rw - 2, rh - 1.5);
      c.fillStyle = 'rgba(0,0,0,0.28)'; c.fillRect(ox + 1, y * rh + rh - 3.5, rw - 2, 2.5); // alt gölge
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(ox + 1, y * rh + 1, rw - 2, 2);
    }
  }, true, aniso);
}
function catiBetonDokusu(aniso) { // düz çatı: katran/beton, çimento lekesi
  return kanvasDoku(256, 256, (c, w, h) => {
    const r = rng(5);
    c.fillStyle = '#9d9d9b'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) { const g = 110 + r() * 110 | 0; c.fillStyle = `rgba(${g},${g},${g},${0.15 + r() * 0.25})`; const s = 1 + r() * 3; c.fillRect(r() * w, r() * h, s, s * (0.6 + r())); }
    c.strokeStyle = 'rgba(70,70,70,0.35)'; c.lineWidth = 1; // şap derzleri
    for (let x = 0; x < w; x += 128) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (let y = 0; y < h; y += 128) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  }, true, aniso);
}
// balkon: korkuluk çubukları (alfa) + katı texel (kutular için)
function korkulukDokusu() {
  return kanvasDoku(128, 64, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const bar = 64 / 14; // sol yarı: 2,8 m'de 14 çubuk
    c.fillStyle = '#2b2d30';
    for (let i = 0; i < 14; i++) c.fillRect(i * bar + bar * 0.35, 0, bar * 0.3, h);
    c.fillRect(0, 0, 64, 3); c.fillRect(0, h - 3, 64, 3);
    c.fillStyle = '#ffffff'; c.fillRect(96, 8, 28, 48); // katı alan
  }, true, 4, false);
}
// tabela atlası: 4x8 yuva (256x64). 31=beyaz, 30=çizgili tente
const TABELA = ['Bakkal', 'Fırın', 'Kırtasiye', 'Berber', 'Eczane', 'Kasap', 'Manav', 'Çiçekçi', 'Terzi', 'Kuaför', 'Çay Ocağı', 'Büfe', 'Tuhafiye', 'Kafe', 'Market', 'Pastane', 'Optik', 'Nalbur', 'Kuruyemiş', 'Lokanta', 'Oto Yedek', 'Saatçi', 'Dönerci', 'Gıda', 'Giyim', 'Mobilya', 'Temizlik', 'Cam Evi'];
function tabelaAtlasi(aniso) {
  const PAL = [['#1f5a3a', '#f4f1e6'], ['#8a1f26', '#fff6e0'], ['#173f7a', '#ffffff'], ['#e8c23a', '#2a2118'], ['#f2f0ea', '#1b3c66'], ['#3a2a22', '#f0d8a8'], ['#2c6d73', '#fdfcf7'], ['#d9d4c8', '#7a1d1d']];
  return kanvasDoku(1024, 512, (c, w, h) => {
    c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
    TABELA.forEach((ad, i) => {
      const x = (i % 4) * 256, y = Math.floor(i / 4) * 64, p = PAL[(i * 3 + 1) % PAL.length];
      c.fillStyle = p[0]; c.fillRect(x, y, 256, 64);
      c.strokeStyle = p[1]; c.lineWidth = 3; c.strokeRect(x + 4, y + 4, 248, 56);
      c.fillStyle = p[1]; c.textAlign = 'center'; c.textBaseline = 'middle';
      let fs = 40; c.font = `bold ${fs}px sans-serif`;
      while (c.measureText(ad).width > 220 && fs > 14) { fs -= 2; c.font = `bold ${fs}px sans-serif`; }
      c.fillText(ad, x + 128, y + 34);
    });
    // çizgili tente yuvası (30): dikey çizgiler
    for (let k = 0; k < 16; k++) { c.fillStyle = k % 2 ? '#ffffff' : '#a9a9a9'; c.fillRect(768 + k * 16, 448, 16, 64); }
    c.fillStyle = '#ffffff'; c.fillRect(768, 448 + 64 - 64, 0, 0); // (31 beyaz: arka plan zaten beyaz)
    c.fillStyle = '#ffffff'; c.fillRect(0 + 3 * 256, 7 * 64, 0, 0);
  }, true, aniso, false);
}

// ---------- geometri yardımcıları ----------
class Gm { // renkli/UV'li basit geometri biriktirici
  constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; this.i = []; this.pt = []; this.parca = 0; this.tum = true; }
  quad(a, b, c, d, n, uvs, rgb) { // a,b,c,d çevre sırasında, n yüzey normali
    const k = this.p.length / 3;
    [a, b, c, d].forEach((q, j) => { this.p.push(q[0], q[1], q[2]); this.n.push(n[0], n[1], n[2]); this.uv.push(uvs[j * 2], uvs[j * 2 + 1]); this.c.push(rgb[0], rgb[1], rgb[2]); this.pt.push(this.parca); });
    this.i.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  kutu(cx, cy, cz, sx, sy, sz, rgb, uv = KATI_UV) {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    const U = uv;
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], U, rgb);
    if (this.tum) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], U, rgb);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], U, rgb);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], U, rgb);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], U, rgb);
    if (this.tum) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], U, rgb);
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aPart', new THREE.Float32BufferAttribute(this.pt, 1));
    g.setIndex(this.i); g.computeBoundingSphere(); return g;
  }
}
const KATI_UV = [0.78, 0.2, 0.95, 0.2, 0.95, 0.8, 0.78, 0.8]; // korkuluk atlasındaki katı texel
// alfa-testli çubuk paneli (z=sabit düzlem veya x=sabit düzlem), genişlik w
function cubukPanel(g, tip, x0, z0, x1, z1, y0, y1, rgb) {
  const w = Math.hypot(x1 - x0, z1 - z0), ub = 0.5 * Math.min(1, w / 2.8);
  const nx = (z1 - z0) / w, nz = -(x1 - x0) / w;
  g.quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], [nx, 0, nz], [0, 0, ub, 0, ub, 1, 0, 1], rgb);
}
// Tek geometri, parça maskesi: bit0 döşeme(her zaman), 1 dolu parapet, 2 çubuk korkuluk, 3 cam kapama, 4 saksı, 5 çamaşır, 6 klima(sol), 7 klima(sağ)
function balkonGeo() { // yerel: +z dışarı, x eni, y=0 kat döşemesi üstü; derinlik 1.2 m
  const g = new Gm(), W = 2.7, D = 1.2;
  g.parca = 0;
  g.kutu(0, -0.075, D / 2, W, 0.15, D, [0.74, 0.73, 0.7]); // döşeme
  g.kutu(0, -0.2, D - 0.05, W + 0.04, 0.1, 0.1, [0.64, 0.63, 0.6]); // ön kenar kirişi
  g.tum = false; // geri kalan parçalar: alt ve duvara bakan arka yüz yok
  g.parca = 1; // dolu parapet
  g.kutu(0, 0.5, D - 0.07, W, 1.0, 0.13, [1, 1, 1]);
  g.kutu(-W / 2 + 0.065, 0.5, D / 2 - 0.04, 0.13, 1.0, D - 0.15, [1, 1, 1]);
  g.kutu(W / 2 - 0.065, 0.5, D / 2 - 0.04, 0.13, 1.0, D - 0.15, [1, 1, 1]);
  g.kutu(0, 1.03, D - 0.07, W + 0.06, 0.06, 0.2, [0.85, 0.84, 0.8]);
  g.parca = 2; // metal çubuk (alfa panel)
  cubukPanel(g, 'f', -W / 2, D - 0.06, W / 2, D - 0.06, 0.05, 1.0, [1, 1, 1]);
  cubukPanel(g, 'f', W / 2, D - 0.06, -W / 2, D - 0.06, 0.05, 1.0, [1, 1, 1]);
  cubukPanel(g, 's', -W / 2 + 0.03, 0.05, -W / 2 + 0.03, D - 0.06, 0.05, 1.0, [1, 1, 1]);
  cubukPanel(g, 's', W / 2 - 0.03, D - 0.06, W / 2 - 0.03, 0.05, 0.05, 1.0, [1, 1, 1]);
  const ck = [0.14, 0.15, 0.16];
  g.kutu(0, 1.03, D - 0.06, W, 0.05, 0.06, ck);
  g.kutu(-W / 2 + 0.03, 1.03, D / 2, 0.06, 0.05, D - 0.1, ck);
  g.kutu(W / 2 - 0.03, 1.03, D / 2, 0.06, 0.05, D - 0.1, ck);
  for (const x of [-W / 2 + 0.03, W / 2 - 0.03]) g.kutu(x, 0.5, D - 0.06, 0.05, 1.0, 0.05, ck);
  g.parca = 3; // camla kapatılmış
  const cam = [0.2, 0.3, 0.36], pr = [0.88, 0.88, 0.86];
  g.kutu(0, 0.45, D - 0.05, W, 0.9, 0.08, [1, 1, 1]);
  g.kutu(0, 1.7, D - 0.04, W - 0.04, 1.55, 0.03, cam);
  g.kutu(-W / 2 + 0.03, 1.7, D / 2, 0.03, 1.55, D - 0.1, cam);
  g.kutu(W / 2 - 0.03, 1.7, D / 2, 0.03, 1.55, D - 0.1, cam);
  g.kutu(0, 2.52, D / 2, W, 0.08, D, pr);
  for (const x of [-W / 2 + 0.03, -W / 6, W / 6, W / 2 - 0.03]) g.kutu(x, 1.7, D - 0.04, 0.05, 1.6, 0.06, pr);
  g.kutu(0, 0.93, D - 0.04, W, 0.05, 0.07, pr);
  g.parca = 4; // saksılar
  for (const x of [-0.8, -0.1, 0.65]) { g.kutu(x, 1.15, 1.05, 0.22, 0.2, 0.22, [0.62, 0.32, 0.2]); g.kutu(x, 1.34, 1.05, 0.3, 0.2, 0.3, [0.22, 0.45, 0.2]); }
  g.parca = 5; // çamaşır ipi
  g.kutu(0, 2.15, 1.08, 2.5, 0.02, 0.02, [0.6, 0.6, 0.6]);
  const R = [[0.8, 0.8, 0.82], [0.8, 0.3, 0.3], [0.3, 0.45, 0.75], [0.9, 0.85, 0.5], [0.4, 0.65, 0.4]];
  [-0.95, -0.4, 0.15, 0.7, 1.1].forEach((x, i) => { const h = 0.5 + (i % 3) * 0.12, w = 0.3 + (i % 2) * 0.12; g.kutu(x, 2.12 - h / 2, 1.08, w, h, 0.012, R[i]); });
  for (const [pi, sx] of [[6, -1.62], [7, 1.62]]) { // klima dış ünitesi: duvara asılı
    g.parca = pi;
    g.kutu(sx, 1.85, 0.17, 0.82, 0.58, 0.34, [0.9, 0.9, 0.88]); g.kutu(sx, 1.85, 0.35, 0.5, 0.44, 0.03, [0.2, 0.2, 0.22]); g.kutu(sx + 0.32, 2.03, 0.35, 0.12, 0.1, 0.03, [0.7, 0.7, 0.7]);
  }
  return g.geo();
}
// çatı eşyaları: 0 su deposu, 1 çanak anten, 2 güneş paneli, 3 asansör kulübesi
function catiGeo() {
  const g = new Gm();
  g.parca = 0; g.kutu(0, 0.35, 0, 1.5, 0.7, 1.5, [0.6, 0.6, 0.6]); for (let a = 0; a < 8; a++) { const x = Math.cos(a * Math.PI / 4) * 0.55, z = Math.sin(a * Math.PI / 4) * 0.55; g.kutu(x, 1.15, z, 0.5, 0.9, 0.5, [0.2, 0.32, 0.58]); } g.kutu(0, 1.7, 0, 1.55, 0.1, 1.55, [0.15, 0.25, 0.5]);
  g.parca = 1; g.kutu(0, 0.55, 0, 0.06, 1.1, 0.06, [0.5, 0.5, 0.52]); g.kutu(0, 1.2, 0.18, 1.05, 0.9, 0.06, [0.85, 0.86, 0.88]); g.kutu(0, 1.2, 0.0, 0.1, 0.1, 0.4, [0.3, 0.3, 0.3]);
  g.parca = 2; for (let i = 0; i < 3; i++) { g.kutu(0, 0.45 + i * 0.01, i * 1.4, 2.4, 0.06, 1.2, [0.12, 0.2, 0.42]); g.kutu(0, 0.2, i * 1.4 + 0.1, 0.08, 0.4, 0.08, [0.6, 0.6, 0.6]); }
  g.parca = 3; g.kutu(0, 1.25, 0, 2.6, 2.5, 2.6, [0.78, 0.76, 0.72]); g.kutu(0, 2.55, 0, 2.8, 0.14, 2.8, [0.55, 0.55, 0.55]); g.kutu(0, 0.9, 1.32, 0.9, 1.7, 0.05, [0.3, 0.32, 0.36]);
  return g.geo();
}

// LOD'lu örnek kümesi: tüm örnekler tutulur, kameraya yakın olanlar çizilir
class Kume {
  constructor(sahne, geo, mat, max) {
    this.max = max; this.n = 0;
    this.mat = new Float32Array(max * 16); this.p = new Float32Array(max * 3); this.col = new Float32Array(max * 3); this.msk = new Float32Array(max);
    geo.setAttribute('aMask', new THREE.InstancedBufferAttribute(new Float32Array(max), 1));
    this.im = new THREE.InstancedMesh(geo, mat, max); this.im.count = 0; this.im.frustumCulled = false;
    this.im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3).fill(1), 3);
    sahne.add(this.im);
  }
  ekle(x, y, z, yaw, s, rgb, mask = 1) {
    if (this.n >= this.max) return;
    const q = _q.setFromAxisAngle(EY, yaw);
    _m.compose(_p.set(x, y, z), q, _s.set(s, s, s)); this.msk[this.n] = mask; _m.toArray(this.mat, this.n * 16);
    this.p[this.n * 3] = x; this.p[this.n * 3 + 1] = y; this.p[this.n * 3 + 2] = z;
    this.col[this.n * 3] = rgb[0]; this.col[this.n * 3 + 1] = rgb[1]; this.col[this.n * 3 + 2] = rgb[2];
    this.n++;
  }
  lod(cx, cy, cz, R, ve = 255) {
    const R2 = R * R, im = this.im; let k = 0;
    if (R > 0) for (let i = 0; i < this.n; i++) {
      const dx = this.p[i * 3] - cx, dy = this.p[i * 3 + 1] - cy, dz = this.p[i * 3 + 2] - cz;
      if (dx * dx + dy * dy + dz * dz < R2) { im.instanceMatrix.array.set(this.mat.subarray(i * 16, i * 16 + 16), k * 16); im.instanceColor.array.set(this.col.subarray(i * 3, i * 3 + 3), k * 3); im.geometry.attributes.aMask.array[k] = this.msk[i] & ve; k++; }
    }
    im.count = k; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; im.geometry.attributes.aMask.needsUpdate = true;
  }
}
const _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _s = new THREE.Vector3();

// ---------- cephe malzemesi ----------
const GLSL_CEPHE_COMMON = `
varying vec3 vWc; varying vec3 vZc; varying vec4 vA; varying vec4 vB; uniform float uAcik, uPenc;
float gGl = 0.0;
float rectM(vec2 p, vec2 a, vec2 b){ vec2 s = smoothstep(a-0.008, a+0.008, p) * (1.0 - smoothstep(b-0.008, b+0.008, p)); return s.x*s.y; }
`;
function cepheMalzeme(tex, IS, GLSL_HASH) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.0, map: tex, emissive: new THREE.Color(0, 0, 0) });
  m.onBeforeCompile = (s) => {
    s.uniforms.uAcik = IS.acik; s.uniforms.uPenc = IS.penc;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aWc; attribute vec3 aZc; attribute vec4 aA; attribute vec4 aB; varying vec3 vWc; varying vec3 vZc; varying vec4 vA; varying vec4 vB;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWc = aWc; vZc = aZc; vA = aA; vB = aB;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>\n${GLSL_HASH}\n${GLSL_CEPHE_COMMON}`)
      .replace('#include <map_fragment>', `
vec2 uvt = vMapUv * 4.0;
float colG = floor(uvt.x + 0.001), flrA = floor(uvt.y + 0.001);
float flrG = floor(uvt.y - vA.y + 0.001);
vec2 fc = uvt - vec2(colG, flrA);
float sd = vA.x * 53.0;
vec2 cl = vec2(colG, flrA);
float h1 = h21(cl + sd), h2 = h21(cl * 1.37 + sd + 11.3), h3 = h21(cl * 0.73 + sd + 27.1), h4 = h21(cl * 2.11 + sd + 5.9), h5 = h21(cl * 1.91 + sd + 71.7);
vec4 tx = texture2D(map, vMapUv);
float gM = tx.r, fM = tx.g, rel = tx.b - 0.5;
bool zem = flrG < 0.5;
bool shop = zem && vA.z > 0.5;
float ci = colG - vB.z;
bool isDoor = zem && abs(ci - vB.w) < 0.5;
bool bal = vB.x > 0.5 && flrG > 0.5 && mod(ci - vB.y + 64.0, vB.x) < 0.5;
vec3 base = (zem ? vZc : vWc) * 0.56;
if (zem && vA.w > 0.5) { // taş kaplama
  vec2 sp = vec2(uvt.x * 5.6, uvt.y * 8.5); float row = floor(sp.y); sp.x += row * 0.5;
  float ln = max(step(fract(sp.x), 0.05), step(fract(sp.y), 0.08));
  base *= (0.88 + 0.24 * h21(floor(sp) + sd)) * (1.0 - 0.3 * ln); rel = 0.0;
}
base *= 0.9 + 0.2 * vn(vec2(uvt.x * 0.7, uvt.y * 0.3) + sd);
if (bal || shop) rel = 0.0;
base *= 1.0 + rel * 0.9;
float g = gM, f = fM;
vec3 frameC = h5 < 0.22 ? vec3(0.34, 0.22, 0.13) : vec3(0.9, 0.9, 0.87);
if (bal) {
  float o = rectM(fc, vec2(0.24, 0.04), vec2(0.76, 0.88)), i2 = rectM(fc, vec2(0.28, 0.07), vec2(0.72, 0.85)), mu = rectM(fc, vec2(0.488, 0.07), vec2(0.512, 0.85));
  g = i2 * (1.0 - mu); f = max(o - i2, 0.0) + mu * i2;
}
if (shop) {
  float o = rectM(fc, vec2(0.04, 0.05), vec2(0.96, 0.7)), i2 = rectM(fc, vec2(0.075, 0.08), vec2(0.925, 0.67)), mu = rectM(fc, vec2(0.495, 0.08), vec2(0.505, 0.67)) * step(h1, 0.5);
  g = i2 * (1.0 - mu); f = max(o - i2, 0.0) + mu * i2; frameC = vec3(0.24, 0.26, 0.29);
}
float doorM = 0.0, doorG = 0.0;
if (isDoor) {
  doorM = rectM(fc, vec2(0.18, 0.0), vec2(0.82, 0.8));
  doorG = rectM(fc, vec2(0.26, shop ? 0.04 : 0.4), vec2(0.74, shop ? 0.74 : 0.74));
  g *= 1.0 - doorM; f *= 1.0 - doorM;
}
float skyG = 0.25 + 0.55 * fc.y;
vec3 glassC = mix(vec3(0.05, 0.07, 0.1), vec3(0.22, 0.32, 0.42), skyG * 0.55);
bool blind = !zem && !bal && h1 < 0.17;
bool curt = !blind && !shop && h2 < 0.55;
vec3 cc = mix(vec3(0.86, 0.8, 0.7), 0.5 + 0.45 * vec3(fract(h3 * 17.1), fract(h3 * 31.7), fract(h3 * 5.3)), 0.45);
float fold = 0.88 + 0.12 * sin(fc.x * 38.0);
float cm = curt ? ((h5 > 0.45) ? 1.0 : step(0.16, abs(fc.x - 0.5))) : 0.0;
vec3 gcol = mix(glassC, cc * fold * 0.7, cm);
float bm = 0.0;
if (blind) {
  bm = step(0.85 - (0.35 + 0.65 * h3) * 0.6, fc.y);
  vec3 bc = mix(vec3(0.62, 0.6, 0.55), vec3(0.5, 0.4, 0.3), step(0.5, h4)) * (0.8 + 0.2 * step(0.5, fract(fc.y * 30.0)));
  gcol = mix(gcol, bc, bm);
}
vec3 warm = mix(vec3(1.0, 0.62, 0.28), vec3(1.0, 0.84, 0.55), h3);
if (h5 < 0.09) warm = vec3(0.55, 0.72, 1.0) * 0.8;
float litM = step(0.9 - 0.45 * uPenc, h4);
vec3 emis = mix(warm, warm * cc * 1.3, cm) * litM * (1.0 - bm * 0.9) * 0.75 * uPenc;
if (shop) { emis = vec3(1.0, 0.86, 0.62) * step(0.15, h4) * 0.95 * mix(0.3, 1.0, uPenc); gcol = mix(vec3(0.07, 0.08, 0.1), vec3(0.6, 0.45, 0.28), 0.25 * step(0.15, h4)); }
vec3 col = base;
col = mix(col, frameC, clamp(f, 0.0, 1.0));
col = mix(col, gcol, clamp(g, 0.0, 1.0));
if (isDoor) {
  vec3 doorC = shop ? vec3(0.24, 0.26, 0.29) : 0.12 + 0.22 * vec3(fract(vA.x * 7.0), fract(vA.x * 13.0), fract(vA.x * 29.0));
  col = mix(col, doorC, doorM);
  col = mix(col, shop ? vec3(0.18, 0.2, 0.22) : glassC, doorG * doorM);
  emis += (shop ? vec3(1.0, 0.8, 0.55) * 0.5 : vec3(0.0)) * doorG * doorM * uPenc;
}
gGl = clamp(g, 0.0, 1.0) * 0.9;
vec3 emisC = emis * clamp(g + doorG * doorM, 0.0, 1.0);
diffuseColor.rgb = col * uAcik;
`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.2, gGl);')
      .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance = emisC;');
  };
  return m;
}

function maskeli(m) {
  m.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aPart; attribute float aMask;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nif (floor(mod(aMask / exp2(aPart), 2.0)) < 0.5) transformed = vec3(1.0e6);');
  };
  return m;
}
// ---------- ana kurulum ----------
const PAL = [ // [renk, ağırlık]: düşük doygunluk, Ankara apartman sıvası
  [[0.84, 0.78, 0.64], 3], [[0.76, 0.68, 0.55], 2], [[0.83, 0.62, 0.52], 1.5], [[0.88, 0.8, 0.52], 1.5], [[0.88, 0.7, 0.56], 1.5],
  [[0.7, 0.7, 0.69], 2], [[0.66, 0.74, 0.62], 1], [[0.62, 0.34, 0.27], 1.2], [[0.82, 0.8, 0.76], 1.5],
];
const PAL_TOP = PAL.reduce((a, p) => a + p[1], 0);
function renkSec(u) { let t = u * PAL_TOP; for (const p of PAL) { t -= p[1]; if (t <= 0) return p[0]; } return PAL[0][0]; }
const TAS = [[0.58, 0.53, 0.46], [0.42, 0.42, 0.43], [0.5, 0.36, 0.3], [0.62, 0.58, 0.5]];
const KIREMIT = [[0.7, 0.34, 0.24], [0.62, 0.28, 0.2], [0.52, 0.3, 0.22], [0.45, 0.4, 0.38], [0.68, 0.38, 0.26]];
const CATI_D = [[0.62, 0.62, 0.6], [0.5, 0.52, 0.54], [0.58, 0.45, 0.4], [0.45, 0.47, 0.46]];

export function binalariKur(c) {
  const { sahne, H, IS, GLSL_HASH, aniso, anaSeg, G } = c;
  const dusuk = () => G.kalite === 'dusuk';
  const texs = [0, 1, 2, 3].map(i => cepheDokusu(i, aniso));
  const cepheMats = texs.map(t => cepheMalzeme(t, IS, GLSL_HASH));
  const tilTex = kiremitDokusu(aniso), catiTex = catiBetonDokusu(aniso);
  const kiremitMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, map: tilTex, roughness: 0.82 });
  const catiMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, map: catiTex, roughness: 0.92 });
  const catiMatlar = [kiremitMat, catiMat];
  const atlas = tabelaAtlasi(aniso);
  const tabelaMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, map: atlas, roughness: 0.6, side: THREE.DoubleSide, emissive: new THREE.Color(0x222018), emissiveMap: atlas });
  const korkulukTex = korkulukDokusu();
  const balkonMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, map: korkulukTex, alphaTest: 0.5, roughness: 0.85, side: THREE.DoubleSide });
  const detayMat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.7, side: THREE.DoubleSide });

  // duvar geometrisi (dört cephe varyantı için ayrı), çatı, tabela
  const mkW = () => ({ p: [], n: [], uv: [], wc: [], zc: [], a: [], b: [], i: [] });
  const W = [mkW(), mkW(), mkW(), mkW()];
  const tile = new Gm(), duz = new Gm(), tab = new Gm();
  const kBalkon = new Kume(sahne, balkonGeo(), maskeli(balkonMat), 30000), kCati = new Kume(sahne, catiGeo(), maskeli(detayMat), 1200);
  const sayi = { balkon: 0, camli: 0, klima: 0, saksi: 0, camasir: 0, dukkan: 0, kirma: 0, duzCati: 0 };

  const anaYolYakin = (x, z) => { // [uzaklık(asfalt kenarına), yönx, yönz]
    let en = 1e9, ex = 0, ez = 0;
    for (const s of anaSeg) {
      const dx = s[2] - s[0], dz = s[3] - s[1], l2 = dx * dx + dz * dz || 1;
      let t = ((x - s[0]) * dx + (z - s[1]) * dz) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = s[0] + dx * t - x, qz = s[1] + dz * t - z, d = Math.hypot(qx, qz) - s[4];
      if (d < en) { en = d; ex = qx; ez = qz; }
    }
    const l = Math.hypot(ex, ez) || 1; return [en, ex / l, ez / l];
  };

  for (const b of H.binalar) {
    const u1 = kimlikHash(b.id, 1), u2 = kimlikHash(b.id, 2), u3 = kimlikHash(b.id, 3), u4 = kimlikHash(b.id, 4), u5 = kimlikHash(b.id, 5);
    const ibadet = b.tur === 'ibadet';
    const ton = 0.94 + u2 * 0.12;
    let sr = renkSec(u1); if (ibadet) sr = [0.82, 0.8, 0.74];
    const renk = [sr[0] * ton, sr[1] * ton, sr[2] * ton];
    const W1 = W[Math.min(3, Math.floor(u3 * 4))];
    // zemin kat: taş kaplama (taş), koyu boya veya aynı renk
    let tasKind = 0, zr;
    if (u4 < 0.5) { tasKind = 1; zr = TAS[Math.floor(u5 * TAS.length)]; zr = [zr[0] * (0.92 + u2 * 0.16), zr[1] * (0.92 + u2 * 0.16), zr[2] * (0.92 + u2 * 0.16)]; }
    else if (u4 < 0.75) zr = [renk[0] * 0.72, renk[1] * 0.7, renk[2] * 0.68];
    else zr = [renk[0] * 0.95, renk[1] * 0.95, renk[2] * 0.95];
    const ref = b.y1 - Math.max(1, Math.round(b.yuk / KAT_M)) * KAT_M;
    const katSay = Math.max(1, Math.round(b.yuk / KAT_M));
    const konut = !ibadet && b.tur !== 'yardimci' && b.tur !== 'sanayi';
    const balkonlu = konut && katSay >= 3 && b.alan >= 110;
    const rs = u5 < 0.5 ? 0 : 1, hepsiCamli = kimlikHash(b.id, 8) < 0.09;
    const gf = (b.y0 - ref) / KAT_M;
    for (const e of b.kenar) {
      const n = Math.max(1, Math.round(e.L / HUCRE_M));
      const uA = Math.floor(kimlikHash(b.id, 11 + (e.ax * 7 + e.az * 13 | 0)) * 4) / 4; // sütun sınırına hizalı
      const col0 = uA * 4;
      const mx = (e.ax + e.bx) / 2, mz = (e.az + e.bz) / 2;
      // ana cadde cephesi: dükkân
      let dukkan = 0;
      if (konut && e.L >= 6 && b.yuk >= 6) {
        const [d, yx, yz] = anaYolYakin(mx, mz);
        if (d < 14 && yx * e.nx + yz * e.nz > 0.55) dukkan = 1;
      }
      const komsuVar = !!H.binaIciMi(mx + e.nx * 3.0, mz + e.nz * 3.0, 0);
      let per = 0, off = 0;
      if (balkonlu && e.L >= 6.5 && n >= 2 && !komsuVar) {
        per = u2 < 0.5 ? 2 : 3; per = Math.max(per, Math.ceil(n / 3)); off = Math.floor(kimlikHash(b.id, 31 + n) * per);
      }
      const kapi = (e.L >= 5 && kimlikHash(b.id, 41 + n) < 0.65) ? Math.floor(kimlikHash(b.id, 43 + n) * n) : -1;
      const v0 = (b.y0 - ref) / (KAT_M * 4), v1 = (b.y1 - ref) / (KAT_M * 4);
      const uu0 = uA, uu1 = uA + n / 4;
      const k0 = W1.p.length / 3;
      const aa = [kimlikHash(b.id, 6), gf, dukkan, tasKind], bb = [per, off, col0, kapi];
      for (const [x, z, yy, uu, vv] of [[e.ax, e.az, b.y0, uu0, v0], [e.bx, e.bz, b.y0, uu1, v0], [e.bx, e.bz, b.y1, uu1, v1], [e.ax, e.az, b.y1, uu0, v1]]) {
        W1.p.push(x, yy, z); W1.n.push(e.nx, 0, e.nz); W1.uv.push(uu, vv);
        W1.wc.push(renk[0], renk[1], renk[2]); W1.zc.push(zr[0], zr[1], zr[2]); W1.a.push(...aa); W1.b.push(...bb);
      }
      const d = (-e.dz) * e.nx + e.dx * e.nz;
      if (d > 0) W1.i.push(k0, k0 + 1, k0 + 2, k0, k0 + 2, k0 + 3); else W1.i.push(k0, k0 + 2, k0 + 1, k0, k0 + 3, k0 + 2);
      const hw = e.dx, hz = e.dz, cw = e.L / n;
      const yaw = Math.atan2(e.nx, e.nz);
      // ---- balkonlar ----
      if (per > 0) {
        for (let ci = 0; ci < n; ci++) {
          if (((ci - off) % per + per) % per !== 0) continue;
          const s = (ci + 0.5) * cw, px = e.ax + hw * s, pz = e.az + hz * s;
          for (let f = 1; f < katSay; f++) {
            const y = b.y0 + f * KAT_M;
            let tip = rs; if (hepsiCamli || kimlikHash(b.id, 100 + ci * 31 + f * 7) < 0.17) tip = 2;
            const tn = 0.92 + 0.12 * kimlikHash(b.id, 200 + ci + f * 13);
            const rgb = tip === 1 ? [tn, tn, tn] : [renk[0] * tn * 1.1 + 0.05, renk[1] * tn * 1.1 + 0.05, renk[2] * tn * 1.1 + 0.05];
            let mask = 1 | (tip === 0 ? 2 : tip === 1 ? 4 : 8);
            sayi.balkon++; if (tip === 2) sayi.camli++;
            const hd = kimlikHash(b.id, 300 + ci * 17 + f * 5);
            if (hd < 0.22) { mask |= (hd < 0.11 ? 128 : 64); sayi.klima++; }
            if (tip !== 2) {
              const h2 = kimlikHash(b.id, 400 + ci * 19 + f * 3);
              if (h2 < 0.2) { mask |= 16; sayi.saksi++; }
              else if (h2 > 0.88) { mask |= 32; sayi.camasir++; }
            }
            kBalkon.ekle(px, y, pz, yaw, 1, rgb, mask);
          }
        }
      }
      // ---- dükkân tabelaları/tenteleri ----
      if (dukkan) {
        const mod = 2; const sag = [e.nz, 0, -e.nx];
        for (let ci = 0; ci < n; ci += mod) {
          const w = Math.min(mod, n - ci) * cw, cs = (ci * cw + w / 2), cx0 = e.ax + hw * cs, cz0 = e.az + hz * cs;
          const slot = Math.floor(kimlikHash(b.id, 500 + ci * 11 + (e.ax | 0)) * TABELA.length);
          const sw = Math.min(w * 0.88, 5.6), y1 = b.y0 + 2.95, y0 = b.y0 + 2.32;
          const o = 0.07;
          const P = (dx, y, dz) => [cx0 + sag[0] * dx + e.nx * dz, y, cz0 + sag[2] * dx + e.nz * dz];
          const su0 = (slot % 4) * 0.25, sv1 = 1 - Math.floor(slot / 4) / 8, sv0 = sv1 - 1 / 8;
          tab.quad(P(-sw / 2, y0, o), P(sw / 2, y0, o), P(sw / 2, y1, o), P(-sw / 2, y1, o), [e.nx, 0, e.nz], [su0, sv0, su0 + 0.25, sv0, su0 + 0.25, sv1, su0, sv1], [1, 1, 1]);
          if (kimlikHash(b.id, 600 + ci * 7) < 0.6) { // tente
            const tr = [[0.75, 0.2, 0.18], [0.2, 0.45, 0.3], [0.2, 0.32, 0.6], [0.85, 0.5, 0.15], [0.5, 0.2, 0.4]][Math.floor(kimlikHash(b.id, 700 + ci) * 5)];
            const tw = w * 0.92;
            tab.quad(P(-tw / 2, b.y0 + 2.32, 0.05), P(tw / 2, b.y0 + 2.32, 0.05), P(tw / 2, b.y0 + 1.95, 1.0), P(-tw / 2, b.y0 + 1.95, 1.0), [e.nx * 0.5, 0.8, e.nz * 0.5], [0.75, 0.0, 1.0, 0.0, 1.0, 1 / 8, 0.75, 1 / 8].map((v, j) => j % 2 ? 0.0625 : v), tr);
          }
          sayi.dukkan++;
        }
      }
    }
    // ---- çatı ----
    const dis = b.halka;
    const delik = b.halkalar.slice(1).map(h => { const o = []; for (let i = 0; i < h.length; i += 2) o.push([h[i], h[i + 1]]); return o; });
    if (b.kirma) { kirmaCati(tile, b, dis, KIREMIT[Math.floor(u1 * 97) % KIREMIT.length]); sayi.kirma++; }
    else {
      const cr = CATI_D[Math.floor(u1 * 97) % CATI_D.length];
      duzCati(duz, dis, delik, b.y1, cr);
      if (!delik.length || true) parapet(duz, dis, b, [renk[0] * 0.95, renk[1] * 0.95, renk[2] * 0.95]);
      sayi.duzCati++;
      // çatı eşyaları
      if (b.yuk >= 9) {
        const R = rng(b.id * 7 + 3), nadet = b.alan > 500 ? 3 : b.alan > 200 ? 2 : 1;
        for (let q = 0; q < nadet; q++) for (let t = 0; t < 12; t++) {
          const x = b.minx + R() * (b.maxx - b.minx), z = b.minz + R() * (b.maxz - b.minz);
          if (H.binaIciMi(x, z, 0) !== b || H.sinirUzakB(b, x, z) < 2.6) continue;
          const tr = R();
          const yw = R() * 6.28;
          if (tr < 0.28) kCati.ekle(x, b.y1, z, yw, 0.85 + R() * 0.4, [1, 1, 1], 1);
          else if (tr < 0.62) kCati.ekle(x, b.y1, z, yw, 0.9 + R() * 0.4, [1, 1, 1], 2);
          else if (tr < 0.82 && b.alan > 180) kCati.ekle(x, b.y1, z, Math.floor(R() * 4) * Math.PI / 2, 1, [1, 1, 1], 4);
          else if (b.yuk >= 18 && b.alan > 150) kCati.ekle(x, b.y1, z, Math.floor(R() * 4) * Math.PI / 2, 1, [1, 1, 1], 8);
          else kCati.ekle(x, b.y1, z, yw, 1, [1, 1, 1], 2);
          break;
        }
      }
    }
  }

  const meshler = [];
  W.forEach((w, i) => {
    if (!w.i.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(w.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(w.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(w.uv, 2));
    g.setAttribute('aWc', new THREE.Float32BufferAttribute(w.wc, 3)); g.setAttribute('aZc', new THREE.Float32BufferAttribute(w.zc, 3));
    g.setAttribute('aA', new THREE.Float32BufferAttribute(w.a, 4)); g.setAttribute('aB', new THREE.Float32BufferAttribute(w.b, 4));
    g.setIndex(new THREE.BufferAttribute(w.p.length / 3 > 65000 ? new Uint32Array(w.i) : new Uint16Array(w.i), 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    const m = new THREE.Mesh(g, cepheMats[i]); m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; sahne.add(m); meshler.push(m);
  });
  for (const [gm, mat, golge] of [[tile, kiremitMat, true], [duz, catiMat, true], [tab, tabelaMat, false]]) {
    if (!gm.i.length) continue;
    const m = new THREE.Mesh(gm.geo(), mat); m.castShadow = golge; m.receiveShadow = true; m.frustumCulled = false; sahne.add(m); meshler.push(m);
  }
  // LOD: kalite ve kameraya göre
  const son = { k: '' };
  function lod(cx, cy, cz) {
    const d = dusuk();
    kBalkon.lod(cx, cy, cz, d ? 40 : 75, d ? 15 : 255);
    kCati.lod(cx, cy, cz, d ? 0 : 130);
  }
  return { meshler, catiMatlar, lod, sayi, cepheMats };
}

// düz çatı yüzeyi (delikli)
function duzCati(g, dis, delik, y, rgb) {
  let tri;
  const kont = dis.map(p => new THREE.Vector2(p[0], p[1])), holes = delik.map(h => h.map(p => new THREE.Vector2(p[0], p[1])));
  try { tri = THREE.ShapeUtils.triangulateShape(kont, holes); } catch (e) { return; }
  const tum = [dis, ...delik].flat();
  for (const t of tri) {
    const q = t.map(i => tum[i]);
    const cy = (q[1][1] - q[0][1]) * (q[2][0] - q[0][0]) - (q[1][0] - q[0][0]) * (q[2][1] - q[0][1]);
    const o = cy >= 0 ? q : [q[0], q[2], q[1]];
    const k = g.p.length / 3;
    for (const p of o) { g.p.push(p[0], y, p[1]); g.n.push(0, 1, 0); g.uv.push(p[0] / 6, p[1] / 6); g.c.push(rgb[0], rgb[1], rgb[2]); }
    g.i.push(k, k + 1, k + 2);
  }
}
// parapet: dış duvar uzantısı + üst + iç yüz (yalnız dış halka)
function parapet(g, dis, b, rgb) {
  const H = 0.55, T = 0.22, y = b.y1;
  const n = dis.length;
  // saat yönü: kenar normali b.kenar'dan gelir (aynı sıra)
  for (const e of b.kenar) {
    const ax = e.ax, az = e.az, bx = e.bx, bz = e.bz, nx = e.nx, nz = e.nz;
    const ix = -nx * T, iz = -nz * T;
    const dy = [rgb[0], rgb[1], rgb[2]], ust = [rgb[0] * 0.85, rgb[1] * 0.85, rgb[2] * 0.85];
    const quadY = (P, N, R) => { // sarım: normale göre otomatik
      const a = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], c = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]];
      const cr = [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
      const s = cr[0] * N[0] + cr[1] * N[1] + cr[2] * N[2];
      const Q = s >= 0 ? P : [P[0], P[3], P[2], P[1]];
      g.quad(Q[0], Q[1], Q[2], Q[3], N, [0, 0, 1, 0, 1, 0.1, 0, 0.1], R);
    };
    quadY([[ax, y, az], [bx, y, bz], [bx, y + H, bz], [ax, y + H, az]], [nx, 0, nz], dy);                           // dış yüz
    quadY([[ax + ix, y + H, az + iz], [bx + ix, y + H, bz + iz], [bx, y + H, bz], [ax, y + H, az]], [0, 1, 0], ust);  // üst
    quadY([[ax + ix, y, az + iz], [bx + ix, y, bz + iz], [bx + ix, y + H, bz + iz], [ax + ix, y + H, az + iz]], [-nx, 0, -nz], dy); // iç yüz
  }
}
// kırma (hipped) çatı: saçak taşması + sırt; dışbükey çokgen. b.kirma fizikten gelir.
function kirmaCati(g, b, dis, rgb) {
  const K = b.kirma, n = dis.length, y = b.y1;
  // merkez
  let cx = 0, cz = 0; for (const p of dis) { cx += p[0]; cz += p[1]; } cx /= n; cz /= n;
  // saçak: dışa 0.4 m (kenar dış normaline göre)
  const dn = []; // kenar i: dis[i] -> dis[i+1]
  for (let i = 0; i < n; i++) {
    const a = dis[i], c = dis[(i + 1) % n]; let dx = c[0] - a[0], dz = c[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    let nx = dz, nz = -dx; if (nx * (cx - (a[0] + c[0]) / 2) + nz * (cz - (a[1] + c[1]) / 2) > 0) { nx = -nx; nz = -nz; }
    dn.push([nx, nz, dx, dz]);
  }
  const OV = 0.4, E = [];
  for (let i = 0; i < n; i++) {
    const n1 = dn[(i + n - 1) % n], n2 = dn[i], k = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    const ox = (n1[0] + n2[0]) / Math.max(0.3, k) * OV, oz = (n1[1] + n2[1]) / Math.max(0.3, k) * OV;
    E.push([dis[i][0] + ox, dis[i][1] + oz]);
  }
  const ye = y - 0.15, yr = y + K.hr;
  const R1 = K.R1, R2 = K.R2, dxr = K.dx, dzr = K.dz;
  const yakin = (p) => ((p[0] - R1[0]) * dxr + (p[1] - R1[1]) * dzr) < ((R2[0] - p[0]) * dxr + (R2[1] - p[1]) * dzr) ? R1 : R2;
  const tri = (A, Bp, Cp, N, uv) => {
    const a = [Bp[0] - A[0], Bp[1] - A[1], Bp[2] - A[2]], c = [Cp[0] - A[0], Cp[1] - A[1], Cp[2] - A[2]];
    const cr = [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
    const up = cr[1] >= 0; const Q = up ? [A, Bp, Cp] : [A, Cp, Bp], U = up ? uv : [uv[0], uv[2], uv[1]];
    const k = g.p.length / 3, len = Math.hypot(cr[0], cr[1], cr[2]) || 1, nn = [cr[0] / len * (up ? 1 : -1), cr[1] / len * (up ? 1 : -1), cr[2] / len * (up ? 1 : -1)];
    Q.forEach((q, j) => { g.p.push(q[0], q[1], q[2]); g.n.push(nn[0], nn[1], nn[2]); g.uv.push(U[j][0], U[j][1]); g.c.push(rgb[0], rgb[1], rgb[2]); });
    g.i.push(k, k + 1, k + 2);
  };
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, A = E[i], B = E[j];
    const ra = yakin(dis[i]), rb = yakin(dis[j]);
    const [, , dx, dz] = dn[i];
    const uA = ((A[0] - E[0][0]) * dx + (A[1] - E[0][1]) * dz) / 2.2; // kenar boyunca
    const uB = uA + Math.hypot(B[0] - A[0], B[1] - A[1]) / 2.2;
    const sn = dn[i]; // eğim boyunca uzaklık (kenar çizgisinden)
    const vv = (p, yy) => Math.hypot((p[0] - A[0]) * sn[0] + (p[1] - A[1]) * sn[1], yy - ye) / 2.0;
    const Pa = [A[0], ye, A[1]], Pb = [B[0], ye, B[1]];
    const Ra = [ra[0], yr, ra[1]], Rb = [rb[0], yr, rb[1]];
    if (ra === rb) tri(Pa, Pb, Ra, null, [[uA, 0], [uB, 0], [(uA + uB) / 2, vv(ra, yr)]]);
    else { tri(Pa, Pb, Rb, null, [[uA, 0], [uB, 0], [uB, vv(rb, yr)]]); tri(Pa, Rb, Ra, null, [[uA, 0], [uB, vv(rb, yr)], [uA, vv(ra, yr)]]); }
  }
  // saçak alt yüzü (aşağıdan görünsün): düz kapak
  for (let i = 1; i + 1 < n; i++) {
    const A = [E[0][0], ye - 0.02, E[0][1]], Bp = [E[i][0], ye - 0.02, E[i][1]], Cp = [E[i + 1][0], ye - 0.02, E[i + 1][1]];
    const k = g.p.length / 3; // aşağı bakan
    const cy = (Bp[2] - A[2]) * (Cp[0] - A[0]) - (Bp[0] - A[0]) * (Cp[2] - A[2]);
    const Q = cy >= 0 ? [A, Bp, Cp] : [A, Cp, Bp];
    Q.forEach(q => { g.p.push(q[0], q[1], q[2]); g.n.push(0, -1, 0); g.uv.push(0, 0); g.c.push(rgb[0] * 0.5, rgb[1] * 0.5, rgb[2] * 0.5); });
    g.i.push(k, k + 2, k + 1);
  }
}
