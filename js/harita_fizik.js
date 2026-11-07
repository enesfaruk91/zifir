// HARİTA FİZİĞİ — gerçek (OSM) bina çokgenleri: veri hazırlama, çarpışma, ışın, zemin, yardımcılar.
// Three.js'e bağımlı değil (yalnız Vector3/Box3 için T verilir); Node ile de sınanabilir.
// Koordinat: x doğu, z güney, y yukarı, metre.

export function rng(tohum) {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// bina kimliğinden kararlı [0,1) sayı
export function kimlikHash(id, tuz = 0) {
  let h = (Math.imul((id | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(tuz + 1, 0xc2b2ae35)) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12; h = Math.imul(h, 0x297a2d39) >>> 0; h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

export const KAT_M = 3.0; // bir katın yüksekliği

// Tahmin edilen katlar: kimliğe göre kararlı 3-7 dağılımı, taban alanı büyükse daha yüksek.
export function katTahmin(id, alan, tur) {
  if (tur === 'ibadet') return 4;
  if (tur === 'yardimci') return 1;
  const u = kimlikHash(id, 7);
  if (alan < 110) return 2 + Math.floor(u * 3);               // küçük müstakil: 2-4
  const a = Math.max(0, Math.min(1, (Math.log(alan) - Math.log(110)) / (Math.log(1300) - Math.log(110))));
  const skor = Math.max(0, Math.min(0.9999, 0.8 * u + 0.3 * a - 0.07));
  return 3 + Math.floor(skor * 5); // 3..7
}

// ---------- arazi ----------
// SRTM ham hâlde gürültülü (bina/ağaç tepeleri de ölçülmüş): Gauss bulanıklığı (sigma m) + en düşük noktaya göre.
export function araziKur(veri, egim, sigma = 75) {
  const iz = veri.yukseklik_izgara;
  if (!egim || !iz) return { y: () => 0, egim: false, ham: null, aralik: 0 };
  const { nx, nz, adim, x0, z0 } = iz;
  const ham = Float64Array.from(iz.deger, v => (Number.isFinite(v) ? v : 0));
  const s = sigma / adim, yar = Math.ceil(s * 3);
  const w = []; for (let k = -yar; k <= yar; k++) w.push(Math.exp(-(k * k) / (2 * s * s)));
  const gecis = (kaynak, yatay) => {
    const o = new Float64Array(nx * nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      let t = 0, ws = 0;
      for (let k = -yar; k <= yar; k++) {
        const a = yatay ? i + k : i, b = yatay ? j : j + k;
        if (a < 0 || b < 0 || a >= nx || b >= nz) continue;
        const ww = w[k + yar]; t += kaynak[b * nx + a] * ww; ws += ww;
      }
      o[j * nx + i] = t / ws;
    }
    return o;
  };
  const bul = gecis(gecis(ham, true), false);
  let mn = Infinity; for (const v of bul) if (v < mn) mn = v;
  for (let i = 0; i < bul.length; i++) bul[i] -= mn;
  const y = (x, z) => {
    let fx = (x - x0) / adim, fz = (z - z0) / adim;
    fx = Math.max(0, Math.min(nx - 1.0001, fx)); fz = Math.max(0, Math.min(nz - 1.0001, fz));
    const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j;
    const a = bul[j * nx + i], b = bul[j * nx + i + 1], c = bul[(j + 1) * nx + i], d = bul[(j + 1) * nx + i + 1];
    return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
  };
  let mx = 0; for (const v of bul) if (v > mx) mx = v;
  return { y, egim: true, ham: bul, aralik: mx };
}

// ---------- çokgen yardımcıları ----------
function halkaTemizle(h) {
  const o = [];
  for (const p of h) {
    const q = o[o.length - 1];
    if (!q || Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.02) o.push(p);
  }
  while (o.length > 1 && Math.hypot(o[0][0] - o[o.length - 1][0], o[0][1] - o[o.length - 1][1]) < 0.02) o.pop();
  return o;
}
function alanIsaret(h) { let a = 0; for (let i = 0; i < h.length; i++) { const p = h[i], q = h[(i + 1) % h.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; }

function kenarlar(b) {
  const E = [];
  for (const hk of b.halkalar) {
    const n = hk.length / 2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const ax = hk[i * 2], az = hk[i * 2 + 1], bx = hk[j * 2], bz = hk[j * 2 + 1];
      const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
      if (L < 1e-6) continue;
      E.push({ ax, az, bx, bz, dx: dx / L, dz: dz / L, L, nx: dz / L, nz: -dx / L });
    }
  }
  return E;
}
function icerde(b, x, z) { // çift-tek kuralı (delikler dahil)
  if (x < b.minx || x > b.maxx || z < b.minz || z > b.maxz) return false;
  let c = false;
  for (const hk of b.halkalar) {
    const n = hk.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = hk[i * 2], zi = hk[i * 2 + 1], xj = hk[j * 2], zj = hk[j * 2 + 1];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
    }
  }
  return c;
}
// en yakın sınır noktası: out = [cx, cz, d, kenarNx, kenarNz]
function enYakinSinir(b, x, z, out) {
  let best = Infinity, bx = 0, bz = 0, kn = 0, kz = 0;
  for (const e of b.kenar) {
    let t = (x - e.ax) * e.dx + (z - e.az) * e.dz;
    t = t < 0 ? 0 : t > e.L ? e.L : t;
    const cx = e.ax + e.dx * t, cz = e.az + e.dz * t;
    const d2 = (x - cx) * (x - cx) + (z - cz) * (z - cz);
    if (d2 < best) { best = d2; bx = cx; bz = cz; kn = e.nx; kz = e.nz; }
  }
  out[0] = bx; out[1] = bz; out[2] = Math.sqrt(best); out[3] = kn; out[4] = kz;
  return out;
}
function sinirUzak(b, x, z) {
  let best = Infinity;
  for (const e of b.kenar) {
    let t = (x - e.ax) * e.dx + (z - e.az) * e.dz;
    t = t < 0 ? 0 : t > e.L ? e.L : t;
    const cx = e.ax + e.dx * t, cz = e.az + e.dz * t;
    const d2 = (x - cx) * (x - cx) + (z - cz) * (z - cz);
    if (d2 < best) best = d2;
  }
  return Math.sqrt(best);
}
// erişilemezlik kutbu (çokgenin içinde sınıra en uzak nokta)
function kutup(b) {
  const w = b.maxx - b.minx, h = b.maxz - b.minz;
  let adim = Math.max(0.4, Math.min(w, h) / 10), bx = (b.minx + b.maxx) / 2, bz = (b.minz + b.maxz) / 2, bd = -1;
  if (icerde(b, bx, bz)) bd = sinirUzak(b, bx, bz);
  for (let tur = 0; tur < 4; tur++) {
    const x0 = tur === 0 ? b.minx : bx - adim * 5, x1 = tur === 0 ? b.maxx : bx + adim * 5;
    const z0 = tur === 0 ? b.minz : bz - adim * 5, z1 = tur === 0 ? b.maxz : bz + adim * 5;
    for (let x = x0; x <= x1; x += adim) for (let z = z0; z <= z1; z += adim) {
      if (!icerde(b, x, z)) continue;
      const d = sinirUzak(b, x, z);
      if (d > bd) { bd = d; bx = x; bz = z; }
    }
    adim /= 3.5;
  }
  b.px = bx; b.pz = bz; b.pr = Math.max(0, bd);
}

// Kırma (hipped) çatı: yalnız basit dışbükey (<=6 köşe), delik yok, 3-8 katlı konutlar. Sırt çizgisi uzun kenar yönünde.
// Yükseklik (düz çatı seviyesinin ÜSTÜNDE): h(x,z) = min(hr, k * en yakın kenara uzaklık). Düz çatı seviyesi (b.y1) taban kalır.
function kirmaHesapla(b) {
  const P = b.halka, n = P.length;
  if (b.halkalar.length > 1 || n < 3 || n > 6 || b.tur === 'ibadet' || b.tur === 'yardimci' || b.tur === 'sanayi') return null;
  if (b.yuk < 9 || b.yuk > 24 || b.alan < 70 || b.alan > 1200) return null;
  if (kimlikHash(b.id, 21) > 0.68) return null;
  let isaret = 0;
  for (let i = 0; i < n; i++) {
    const a = P[i], c = P[(i + 1) % n], d = P[(i + 2) % n];
    const cr = (c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0]);
    if (Math.abs(cr) < 1e-6) continue;
    if (isaret && Math.sign(cr) !== isaret) return null; // dışbükey değil
    isaret = Math.sign(cr);
  }
  let en = null;
  for (const e of b.kenar) if (!en || e.L > en.L) en = e;
  const dx = en.dx, dz = en.dz, px = -dz, pz = dx;
  let s0 = 1e9, s1 = -1e9, t0 = 1e9, t1 = -1e9;
  for (const p of P) { const s = p[0] * dx + p[1] * dz, t = p[0] * px + p[1] * pz; if (s < s0) s0 = s; if (s > s1) s1 = s; if (t < t0) t0 = t; if (t > t1) t1 = t; }
  const hs = (t1 - t0) / 2, hl = (s1 - s0) / 2;
  if (hs < 2.4 || hl < hs) return null;
  const hr = Math.max(1.1, Math.min(3.2, hs * 0.5));
  const cs = (s0 + s1) / 2, ct = (t0 + t1) / 2, rl = Math.max(0, hl - hs);
  const pt = (s) => [dx * s + px * ct, dz * s + pz * ct];
  return { hr, k: hr / hs, hs, dx, dz, R1: pt(cs - rl), R2: pt(cs + rl) };
}

// =====================================================================
export function haritaHazirla(T, veri, katDuzelt, secenek = {}) {
  const egim = !!secenek.egim;
  const arazi = araziKur(veri, egim);
  const Y = arazi.y;
  const kd = katDuzelt || {};

  // ---------- binalar ----------
  const binalar = [];
  for (const o of veri.binalar) {
    const dis = halkaTemizle(o.halka);
    if (dis.length < 3) continue;
    const halkalar = [Float64Array.from(dis.flat())];
    for (const ih of (o.ic_halkalar || [])) { const t = halkaTemizle(ih); if (t.length >= 3) halkalar.push(Float64Array.from(t.flat())); }
    let minx = Infinity, maxx = -Infinity, minz = Infinity, maxz = -Infinity;
    for (const p of dis) { if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0]; if (p[1] < minz) minz = p[1]; if (p[1] > maxz) maxz = p[1]; }
    const alan = o.alan || Math.abs(alanIsaret(dis));
    // kat/yükseklik: düzeltme dosyası > OSM (height/levels) > tahmin
    let kat, h, kaynak;
    const duz = kd[String(o.id)];
    if (Number.isFinite(duz) && duz >= 1) { kat = Math.round(duz); h = kat * KAT_M; kaynak = 'duzeltme'; }
    else if (!o.tahmin || o.yuk_kaynak !== 'tahmin') { h = o.yukseklik; kat = Math.max(1, Math.round(h / KAT_M)); kaynak = o.yuk_kaynak || 'osm'; }
    else if (o.tur === 'ibadet' || o.tur === 'yardimci') { h = o.yukseklik; kat = Math.max(1, Math.round(h / KAT_M)); kaynak = 'tahmin'; }
    else { kat = katTahmin(o.id, alan, o.tur); h = kat * KAT_M; kaynak = 'tahmin'; }
    // arazi: taban en düşük zemin noktasına uzar (eğimde bina havada kalmaz)
    let tmin = Infinity, tmax = -Infinity;
    const ornek = (x, z) => { const t = Y(x, z); if (t < tmin) tmin = t; if (t > tmax) tmax = t; };
    for (const p of dis) ornek(p[0], p[1]);
    ornek((minx + maxx) / 2, (minz + maxz) / 2);
    if (!isFinite(tmin)) { tmin = 0; tmax = 0; }
    const y0 = egim ? tmin - 0.6 : 0;
    const y1 = (egim ? tmax : 0) + h;
    const b = {
      id: o.id, tur: o.tur, ad: o.ad, halkalar, halka: dis, alan, kat, kaynak, h: y1, yuk: h, y0, y1,
      zemin: tmin, zeminMax: tmax, minx, maxx, minz, maxz,
    };
    b.kenar = kenarlar(b);
    for (const e of b.kenar) { // dış normal doğrula
      const mx = (e.ax + e.bx) / 2, mz = (e.az + e.bz) / 2;
      if (icerde(b, mx + e.nx * 0.05, mz + e.nz * 0.05)) { e.nx = -e.nx; e.nz = -e.nz; }
    }
    kutup(b);
    b.kirma = secenek.kirma === false ? null : kirmaHesapla(b);
    b.x = b.px; b.z = b.pz;
    const yar = Math.max(0.5, b.pr * 0.7);
    b.gx = b.gz = yar * 2; // eski kod (b.x ± gx/2) çatının İÇİNDE kalsın
    b.kutu = new T.Box3(new T.Vector3(minx, y0, minz), new T.Vector3(maxx, y1, maxz));
    b.catiNokta = new T.Vector3(b.px, y1, b.pz);
    binalar.push(b);
  }

  // ---------- 2B ızgara ----------
  const kp = veri.baslik.kapsam_m;
  const CS = 32;
  const GX0 = Math.floor((kp.x_min - 96) / CS) * CS, GZ0 = Math.floor((kp.z_min - 96) / CS) * CS;
  const GNX = Math.ceil((kp.x_max + 96 - GX0) / CS) + 1, GNZ = Math.ceil((kp.z_max + 96 - GZ0) / CS) + 1;
  const hucre = Array.from({ length: GNX * GNZ }, () => []);
  const ince = [];
  const inceHucre = Array.from({ length: GNX * GNZ }, () => []);
  const cx = (x) => Math.max(0, Math.min(GNX - 1, Math.floor((x - GX0) / CS)));
  const cz = (z) => Math.max(0, Math.min(GNZ - 1, Math.floor((z - GZ0) / CS)));
  binalar.forEach((b, i) => {
    b.i = i;
    for (let a = cx(b.minx); a <= cx(b.maxx); a++) for (let c = cz(b.minz); c <= cz(b.maxz); c++) hucre[c * GNX + a].push(i);
  });
  const damga = new Uint32Array(binalar.length);
  let damgaNo = 0, damgaI = new Uint32Array(0);
  function inceEkle(x, y0, z, gx, h, gz) { // lamba direği gibi: yalnız ışın (ankraj)
    const k = ince.length; ince.push([x - gx / 2, y0, z - gz / 2, x + gx / 2, y0 + h, z + gz / 2]);
    inceHucre[cz(z) * GNX + cx(x)].push(k);
    damgaI = new Uint32Array(ince.length);
  }

  const aracCarp = { liste: [] };
  const tasiyici = { dx: 0, dz: 0, var: false };
  const X0 = kp.x_min, X1 = kp.x_max, Z0 = kp.z_min, Z1 = kp.z_max;

  // ---------- zemin ----------
  // kırma çatının düz çatı seviyesi üstündeki yüksekliği (nokta çokgenin içinde varsayılır)
  function catiH(b, x, z) {
    const K = b.kirma; if (!K) return 0;
    const h = K.k * sinirUzak(b, x, z);
    return h < K.hr ? h : K.hr;
  }
  function binaUst(x, z) {
    const l = hucre[cz(z) * GNX + cx(x)];
    let y = -Infinity;
    for (let k = 0; k < l.length; k++) {
      const b = binalar[l[k]];
      if (b.y1 + (b.kirma ? b.kirma.hr : 0) > y && icerde(b, x, z)) { const t = b.y1 + (b.kirma ? catiH(b, x, z) : 0); if (t > y) y = t; }
    }
    return y;
  }
  function zeminY(x, z) { // en üst yürünebilir yüzey: arazi, bina çatısı veya araç
    let y = Y(x, z);
    const bu = binaUst(x, z); if (bu > y) y = bu;
    const al = aracCarp.liste;
    for (let k = 0; k < al.length; k++) {
      const a = al[k];
      if (Math.abs(x - a.x) <= a.bx && Math.abs(z - a.z) <= a.bz && a.y + a.hy > y && a.hy + a.y < y + 4) y = a.y + a.hy;
    }
    return y;
  }
  const binaIciMi = (x, z, pay = 0) => {
    const l = hucre[cz(z) * GNX + cx(x)];
    for (let k = 0; k < l.length; k++) {
      const b = binalar[l[k]];
      if (x < b.minx - pay || x > b.maxx + pay || z < b.minz - pay || z > b.maxz + pay) continue;
      if (icerde(b, x, z)) return b;
      if (pay > 0 && sinirUzak(b, x, z) < pay) return b;
    }
    return null;
  };

  // test/yardım: (x,y,z) bir binanın katı hacminin içinde mi (kenardan tol uzak)? bina indeksi veya -1
  function binaIcinde(x, y, z, tol = 0) {
    const l = hucre[cz(z) * GNX + cx(x)];
    for (let k = 0; k < l.length; k++) {
      const b = binalar[l[k]];
      if (y <= b.y0 + tol || y >= b.y1 - tol) continue;
      if (icerde(b, x, z) && (!tol || sinirUzak(b, x, z) > tol)) return b.i;
    }
    return -1;
  }

  // ---------- küre çarpışması ----------
  const _s = [0, 0, 0, 0, 0];
  function carpis(konum, r) {
    let px = konum.x, py = konum.y, pz = konum.z;
    let nx = 0, ny = 0, nz = 0, vurdu = false, duvar = false;
    const r2 = r * r;
    damgaNo++;
    const ekle = (ex, ey, ez) => { nx += ex; ny += ey; nz += ez; vurdu = true; if (Math.abs(ey) < 0.7) duvar = true; };
    for (let a = cx(px - r); a <= cx(px + r); a++) for (let c = cz(pz - r); c <= cz(pz + r); c++) {
      const l = hucre[c * GNX + a];
      for (let k = 0; k < l.length; k++) {
        const i = l[k];
        if (damga[i] === damgaNo) continue;
        damga[i] = damgaNo;
        const b = binalar[i];
        if (px < b.minx - r || px > b.maxx + r || pz < b.minz - r || pz > b.maxz + r) continue;
        if (py + r < b.y0 || py - r > b.y1 + (b.kirma ? b.kirma.hr : 0)) continue;
        const ic = icerde(b, px, pz);
        const ty = b.kirma && ic ? b.y1 + catiH(b, px, pz) : b.y1; // kırma çatı yüzeyi
        if (py - r > ty) continue;
        const cy = py < b.y0 ? b.y0 : (py > ty ? ty : py);
        const dy = py - cy;
        if (ic) {
          const d2 = dy * dy;
          if (d2 >= r2) continue;
          if (d2 > 1e-12) { // merkez taban içinde ama prizmanın altında/üstünde: dikey it
            const d = Math.abs(dy), s = Math.sign(dy);
            py += s * (r - d); ekle(0, s, 0); continue;
          }
          enYakinSinir(b, px, pz, _s); // merkez prizmanın içinde: en yakın yüzden it
          const yat = _s[2], yuk = ty - py, alt = py - b.y0;
          if (yuk <= alt && yuk <= yat) { py = ty + r; ekle(0, 1, 0); }
          else if (alt <= yat) { py = b.y0 - r; ekle(0, -1, 0); }
          else {
            let ux = _s[0] - px, uz = _s[1] - pz; const L = Math.hypot(ux, uz);
            if (L > 1e-9) { ux /= L; uz /= L; } else { ux = _s[3]; uz = _s[4]; }
            px = _s[0] + ux * r; pz = _s[1] + uz * r; ekle(ux, 0, uz);
          }
        } else {
          enYakinSinir(b, px, pz, _s);
          const dx = px - _s[0], dz = pz - _s[1];
          const d2 = dx * dx + dz * dz + dy * dy;
          if (d2 >= r2) continue;
          const d = Math.sqrt(d2), f = (r - d) / d;
          px += dx * f; py += dy * f; pz += dz * f;
          ekle(dx / d, dy / d, dz / d);
        }
      }
    }
    // araçlar (eksen hizalı kutu)
    tasiyici.var = false; tasiyici.dx = 0; tasiyici.dz = 0;
    {
      const al = aracCarp.liste;
      for (let k = 0; k < al.length; k++) {
        const a = al[k];
        if (Math.abs(px - a.x) > a.bx + r || Math.abs(pz - a.z) > a.bz + r || py > a.y + a.hy + r || py < a.y - r) continue;
        const x0 = a.x - a.bx, x1 = a.x + a.bx, z0 = a.z - a.bz, z1 = a.z + a.bz, y0 = a.y, y1 = a.y + a.hy;
        const qx = px < x0 ? x0 : (px > x1 ? x1 : px), qy = py < y0 ? y0 : (py > y1 ? y1 : py), qz = pz < z0 ? z0 : (pz > z1 ? z1 : pz);
        const dx = px - qx, dy = py - qy, dz = pz - qz, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < r2 && d2 > 1e-12) { const d = Math.sqrt(d2), f = (r - d) / d; px += dx * f; py += dy * f; pz += dz * f; ekle(dx / d, dy / d, dz / d); }
        if (py >= a.y + a.hy + r - 0.05 && Math.abs(px - a.x) <= a.bx && Math.abs(pz - a.z) <= a.bz) { tasiyici.var = true; tasiyici.dx = a.dx; tasiyici.dz = a.dz; }
      }
    }
    // görünmez sınır duvarı (haritanın kenarı)
    if (px < X0 + r) { px = X0 + r; ekle(1, 0, 0); }
    else if (px > X1 - r) { px = X1 - r; ekle(-1, 0, 0); }
    if (pz < Z0 + r) { pz = Z0 + r; ekle(0, 0, 1); }
    else if (pz > Z1 - r) { pz = Z1 - r; ekle(0, 0, -1); }
    const duzeltme = new T.Vector3(px - konum.x, py - konum.y, pz - konum.z);
    let normal = null;
    if (vurdu) {
      normal = new T.Vector3(nx, ny, nz);
      if (normal.lengthSq() < 1e-9) normal.set(0, 1, 0); else normal.normalize();
    }
    return { duzeltme, normal, duvar };
  }

  // ---------- ışın ----------
  const _hit = { t: 0, nx: 0, ny: 0, nz: 0 };
  const _ph = { t: 0, nx: 0, ny: 0, nz: 0 };
  function prizmaIsin(b, ox, oy, oz, dx, dy, dz, best) {
    let bt = best, ok = false;
    if (dy < 0) { // üst yüz (yalnız yukarıdan)
      if (b.kirma) { // kırma çatı yüzeyi: giriş yüksekliğinden düz seviyeye adım adım
        const ta = (b.y1 + b.kirma.hr - oy) / dy, tb = (b.y1 - oy) / dy;
        let tp = ta > 1e-4 ? ta : 1e-4;
        if (tb > tp) {
          const dt = (tb - tp) / 10;
          for (let q = 0; q <= 10; q++, tp += dt) {
            if (tp >= bt) break;
            const x = ox + dx * tp, z = oz + dz * tp;
            if (icerde(b, x, z) && oy + dy * tp <= b.y1 + catiH(b, x, z)) { bt = tp; ok = true; _ph.nx = 0; _ph.ny = 1; _ph.nz = 0; break; }
          }
        }
      } else {
        const t = (b.y1 - oy) / dy;
        if (t > 1e-4 && t < bt && icerde(b, ox + dx * t, oz + dz * t)) { bt = t; ok = true; _ph.nx = 0; _ph.ny = 1; _ph.nz = 0; }
      }
    }
    const E = b.kenar;
    for (let k = 0; k < E.length; k++) { // duvarlar (yalnız dışarıdan giren)
      const e = E[k];
      const den = dx * e.nx + dz * e.nz;
      if (den >= -1e-9) continue;
      const t = ((e.ax - ox) * e.nx + (e.az - oz) * e.nz) / den;
      if (t <= 1e-4 || t >= bt) continue;
      const y = oy + dy * t;
      if (y < b.y0 || y > b.y1) continue;
      const s = (ox + dx * t - e.ax) * e.dx + (oz + dz * t - e.az) * e.dz;
      if (s < -1e-6 || s > e.L + 1e-6) continue;
      bt = t; ok = true; _ph.nx = e.nx; _ph.ny = 0; _ph.nz = e.nz;
    }
    if (ok) _ph.t = bt;
    return ok;
  }
  function isinBul(ox, oy, oz, dx, dy, dz, maxT) {
    let best = maxT, bi = -1, bnx = 0, bny = 0, bnz = 0;
    damgaNo++;
    let gx = Math.floor((ox - GX0) / CS), gz = Math.floor((oz - GZ0) / CS);
    const sx = dx > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1, inf = Infinity;
    let tmx = dx !== 0 ? ((dx > 0 ? (gx + 1) : gx) * CS + GX0 - ox) / dx : inf;
    let tmz = dz !== 0 ? ((dz > 0 ? (gz + 1) : gz) * CS + GZ0 - oz) / dz : inf;
    const tdx = dx !== 0 ? CS / Math.abs(dx) : inf, tdz = dz !== 0 ? CS / Math.abs(dz) : inf;
    for (let adim = 0; adim < 160; adim++) {
      if (gx >= 0 && gx < GNX && gz >= 0 && gz < GNZ) {
        const l = hucre[gz * GNX + gx];
        for (let k = 0; k < l.length; k++) {
          const i = l[k];
          if (damga[i] === damgaNo) continue;
          damga[i] = damgaNo;
          if (prizmaIsin(binalar[i], ox, oy, oz, dx, dy, dz, best)) { best = _ph.t; bi = i; bnx = _ph.nx; bny = _ph.ny; bnz = _ph.nz; }
        }
        const li = inceHucre[gz * GNX + gx];
        for (let k = 0; k < li.length; k++) {
          const i = li[k];
          if (damgaI[i] === damgaNo) continue;
          damgaI[i] = damgaNo;
          const B = ince[i];
          let tmin = -inf, tmax = inf, ax = 0, sg = 0, gec = true;
          for (let q = 0; q < 3; q++) {
            const o = q === 0 ? ox : q === 1 ? oy : oz, d = q === 0 ? dx : q === 1 ? dy : dz;
            if (d !== 0) {
              let t1 = (B[q] - o) / d, t2 = (B[q + 3] - o) / d, s = -1;
              if (t1 > t2) { const w = t1; t1 = t2; t2 = w; s = 1; }
              if (t1 > tmin) { tmin = t1; ax = q; sg = s; }
              if (t2 < tmax) tmax = t2;
            } else if (o < B[q] || o > B[q + 3]) { gec = false; break; }
          }
          if (gec && tmin <= tmax && tmin > 1e-4 && tmin < best) {
            best = tmin; bi = 1e6 + i; bnx = ax === 0 ? sg : 0; bny = ax === 1 ? sg : 0; bnz = ax === 2 ? sg : 0;
          }
        }
      }
      const tn = Math.min(tmx, tmz);
      if (best <= tn || tn > maxT) break;
      if (tmx < tmz) { gx += sx; tmx += tdx; } else { gz += sz; tmz += tdz; }
    }
    if (arazi.egim && dy < 0) { // eğimli zemine ışın
      const adimT = 4;
      let onceki = oy - Y(ox, oz);
      for (let t = adimT; t < Math.min(best, maxT) + adimT; t += adimT) {
        const f = oy + dy * t - Y(ox + dx * t, oz + dz * t);
        if (f <= 0 && onceki > 0) {
          let a = t - adimT, c = t;
          for (let q = 0; q < 8; q++) { const m = (a + c) / 2; if (oy + dy * m - Y(ox + dx * m, oz + dz * m) <= 0) c = m; else a = m; }
          if (c > 1e-3 && c < best) { best = c; bi = -2; bnx = 0; bny = 1; bnz = 0; }
          break;
        }
        onceki = f;
      }
    }
    if (bi === -1) return null;
    _hit.t = best; _hit.nx = bnx; _hit.ny = bny; _hit.nz = bnz;
    return _hit;
  }
  function ankrajBul(bas, yon, maxMesafe) {
    let dx = yon.x, dy = yon.y, dz = yon.z;
    const L = Math.hypot(dx, dy, dz);
    if (L < 1e-9) return null;
    dx /= L; dy /= L; dz /= L;
    const h = isinBul(bas.x, bas.y, bas.z, dx, dy, dz, maxMesafe);
    if (!h) return null;
    return { nokta: new T.Vector3(bas.x + dx * h.t, bas.y + dy * h.t, bas.z + dz * h.t), normal: new T.Vector3(h.nx, h.ny, h.nz) };
  }

  // ---------- çatı yardımcıları ----------
  // (x,z)'yi b'nin çatısının içine, kenardan en az `pay` uzağa taşır
  function catiyaSigdir(b, x, z, pay = 1) {
    if (icerde(b, x, z) && sinirUzak(b, x, z) >= pay) return { x, z };
    enYakinSinir(b, x, z, _s);
    const bx = _s[0], bz = _s[1];
    let nx = _s[3], nz = _s[4]; // dış normal
    for (let k = 0; k < 2; k++) {
      const tx = bx - nx * (pay + 0.05), tz = bz - nz * (pay + 0.05);
      if (icerde(b, tx, tz) && sinirUzak(b, tx, tz) >= pay * 0.8) return { x: tx, z: tz };
      nx = -nx; nz = -nz;
    }
    return { x: b.px, z: b.pz };
  }
  // pos'a yatayda `pay` içinde olan, çatısı pos.y-3'ten yüksek en yüksek bina
  function yakinBina(pos, pay = 1.8) {
    let en = null;
    for (let a = cx(pos.x - pay); a <= cx(pos.x + pay); a++) for (let c = cz(pos.z - pay); c <= cz(pos.z + pay); c++) {
      const l = hucre[c * GNX + a];
      for (let k = 0; k < l.length; k++) {
        const b = binalar[l[k]];
        if (pos.y > b.y1 + 3 + (b.kirma ? b.kirma.hr : 0)) continue;
        if (pos.x < b.minx - pay || pos.x > b.maxx + pay || pos.z < b.minz - pay || pos.z > b.maxz + pay) continue;
        if (en && b.y1 <= en.y1) continue;
        if (icerde(b, pos.x, pos.z) || sinirUzak(b, pos.x, pos.z) <= pay) en = b;
      }
    }
    return en;
  }

  // b'nin sınırındaki en yakın nokta + dış normali (ağ/ankraj adayları için)
  function sinirNokta(b, x, z) {
    enYakinSinir(b, x, z, _s);
    return { x: _s[0], z: _s[1], nx: _s[3], nz: _s[4], d: _s[2] };
  }

  // ---------- rastgele noktalar ----------
  function rastgeleCatiB(b, rnd = Math.random) {
    for (let d = 0; d < 20; d++) {
      const x = b.minx + rnd() * (b.maxx - b.minx), z = b.minz + rnd() * (b.maxz - b.minz);
      if (icerde(b, x, z) && sinirUzak(b, x, z) >= 1.5) return new T.Vector3(x, b.y1, z);
    }
    return new T.Vector3(b.px, b.y1, b.pz);
  }
  const catiBinalari = binalar.filter(b => b.yuk >= 9 && !b.kirma);
  function rastgeleCati() {
    const l = catiBinalari.length ? catiBinalari : binalar;
    return rastgeleCatiB(l[Math.floor(Math.random() * l.length)]);
  }
  function catiNoktalari(minH = 12) { return binalar.filter(b => b.yuk >= minH && !b.kirma).map(b => b.catiNokta.clone()); }

  // ---------- yollar: segmentler + graf (yalnız araç yolları) ----------
  const aracYollari = veri.yollar.filter(y => y.arac_yolu && y.kopru_tunel !== 'tunel');
  const yollar = [];
  const dugumMap = new Map(), dugumler = [];
  function dugum(x, z) {
    const k = Math.round(x * 2) + ',' + Math.round(z * 2);
    let i = dugumMap.get(k);
    if (i === undefined) { i = dugumler.length; dugumMap.set(k, i); dugumler.push({ x, z, komsu: [] }); }
    return i;
  }
  const kenarListe = [];
  let toplamUzunluk = 0;
  for (const y of aracYollari) {
    for (let i = 0; i + 1 < y.nokta.length; i++) {
      const [x1, z1] = y.nokta[i], [x2, z2] = y.nokta[i + 1];
      const L = Math.hypot(x2 - x1, z2 - z1); if (L < 0.5) continue;
      yollar.push({ x1, z1, x2, z2 });
      const a = dugum(x1, z1), b = dugum(x2, z2);
      if (a === b) continue;
      kenarListe.push({ a, b, L, genislik: y.genislik, tur: y.tur, yol: y.id });
      if (!dugumler[a].komsu.includes(b)) dugumler[a].komsu.push(b);
      if (!dugumler[b].komsu.includes(a)) dugumler[b].komsu.push(a);
      toplamUzunluk += L;
    }
  }
  const yolAgi = { dugumler, kenarlar: kenarListe, uzunluk: toplamUzunluk };
  function sokakNoktasi() {
    if (!kenarListe.length) return new T.Vector3(0, 0, 0);
    for (let d = 0; d < 30; d++) {
      let r = Math.random() * toplamUzunluk, ke = kenarListe[0];
      for (const k of kenarListe) { r -= k.L; if (r <= 0) { ke = k; break; } }
      const A = dugumler[ke.a], B = dugumler[ke.b], u = Math.random();
      const x = A.x + (B.x - A.x) * u + (Math.random() - 0.5) * 2, z = A.z + (B.z - A.z) * u + (Math.random() - 0.5) * 2;
      if (binaIciMi(x, z, 1.5)) continue;
      return new T.Vector3(x, Y(x, z), z);
    }
    return new T.Vector3(0, Y(0, 0), 0);
  }

  // ---------- doğuş: mahalle içindeki en büyük parkın en açık noktası ----------
  function acikYerBul() {
    const alanOf = (h) => { let a = 0; for (let i = 0; i < h.length; i++) { const p = h[i], q = h[(i + 1) % h.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };
    const parklar = (veri.alanlar || []).filter(a => a.tur === 'park').sort((a, b) => alanOf(b.halka) - alanOf(a.halka));
    const enBuyuk = parklar[0];
    const yakinBina = (x, z) => {
      let d = 60;
      for (let a = cx(x - 60); a <= cx(x + 60); a++) for (let c = cz(z - 60); c <= cz(z + 60); c++) {
        const l = hucre[c * GNX + a];
        for (let k = 0; k < l.length; k++) { const u = sinirUzak(binalar[l[k]], x, z); if (u < d) d = u; }
      }
      return d;
    };
    let en = null, enD = -1;
    if (enBuyuk) {
      const h = enBuyuk.halka, ps = { halkalar: [Float64Array.from(h.flat())], minx: Math.min(...h.map(p => p[0])), maxx: Math.max(...h.map(p => p[0])), minz: Math.min(...h.map(p => p[1])), maxz: Math.max(...h.map(p => p[1])) };
      ps.kenar = kenarlar(ps);
      for (let x = ps.minx; x <= ps.maxx; x += 3) for (let z = ps.minz; z <= ps.maxz; z += 3) {
        if (!icerde(ps, x, z) || binaIciMi(x, z, 0.1)) continue;
        const d = Math.min(yakinBina(x, z), sinirUzak(ps, x, z) + 8);
        if (d > enD) { enD = d; en = [x, z]; }
      }
    }
    if (!en) for (const d of dugumler) if (d.komsu.length >= 3 && !binaIciMi(d.x, d.z, 3)) { en = [d.x, d.z]; enD = 0; break; }
    return en ? { x: en[0], z: en[1], bosluk: enD, ad: enBuyuk && enBuyuk.ad } : { x: 0, z: 0, bosluk: 0 };
  }
  const dogusYeri = acikYerBul();
  const dogus = new T.Vector3(dogusYeri.x, Y(dogusYeri.x, dogusYeri.z), dogusYeri.z);
  const sinirIci = (x, z, pay = 0) => x > X0 + pay && x < X1 - pay && z > Z0 + pay && z < Z1 - pay;

  return {
    binalar, arazi, Y, aracCarp, tasiyici, inceEkle, binaIciMi, binaIcinde, sinirUzakB: sinirUzak,
    zeminY, carpis, ankrajBul, rastgeleCati, rastgeleCatiB, catiNoktalari, sokakNoktasi,
    yollar, yolAgi, catiyaSigdir, yakinBina, sinirNokta, dogus, dogusBosluk: dogusYeri.bosluk, dogusAd: dogusYeri.ad, sinirIci,
    kapsam: { x0: X0, x1: X1, z0: Z0, z1: Z1 }, aracYollari,
  };
}
