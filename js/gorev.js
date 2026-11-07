// Görevler — Işık Küreleri, kediler, görev zinciri, hedef ışık sütunu. SOZLESME §4.
import * as THREE from 'three';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const rnd = (a, b) => a + Math.random() * (b - a);
const SIFIR = V();
const DUM = new THREE.Object3D();
const KURE_SAYI = 60;

export function kur(G) {
  const sahne = G.sahne;
  const sehir = () => G.sehir;
  const oyuncu = () => G.oyuncu?.konum ?? SIFIR;
  const msj = (m, s = 3.5) => G.arayuz?.mesaj?.(m, s);
  const zemin = (x, z) => sehir()?.zeminY?.(x, z) ?? 0;

  // ---------- gerçek harita yerleşimi (Basınevleri) ----------
  const veriH = () => G.harita?.veri || null;
  const gercek = () => !!(sehir()?.poligon && veriH());
  const pip = (h, x, z) => { let ic = false; for (let i = 0, j = h.length - 1; i < h.length; j = i++) { const a = h[i], b = h[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) ic = !ic; } return ic; };
  let _parklar = null, _yolAd = null;
  function parklar() {
    if (_parklar) return _parklar;
    _parklar = (veriH()?.alanlar || []).filter(a => a.tur === 'park' && a.halka?.length >= 3).map(a => {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, al = 0;
      for (let i = 0; i < a.halka.length; i++) { const p = a.halka[i], q = a.halka[(i + 1) % a.halka.length]; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); al += p[0] * q[1] - q[0] * p[1]; }
      return { ad: a.ad || '', halka: a.halka, x0, x1, z0, z1, alan: Math.abs(al) / 2 };
    }).sort((a, b) => b.alan - a.alan);
    return _parklar;
  }
  function yolAdlari() { // [{ad, tur, nokta}] — adı olan araç yolları
    if (_yolAd) return _yolAd;
    _yolAd = (veriH()?.yollar || []).filter(y => y.ad && y.arac_yolu && y.nokta?.length > 1);
    return _yolAd;
  }
  function enYakinYolAdi(x, z, maxD = 60) { // en yakın adlı yol
    let en = '', enD = maxD;
    for (const y of yolAdlari()) for (let i = 0; i + 1 < y.nokta.length; i++) {
      const [ax, az] = y.nokta[i], [bx, bz] = y.nokta[i + 1];
      const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      const u = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
      const d = Math.hypot(x - ax - dx * u, z - az - dz * u);
      if (d < enD) { enD = d; en = y.ad; }
    }
    return en;
  }
  function parkAdi(x, z) { for (const p of parklar()) if (p.ad && x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1 && pip(p.halka, x, z)) return p.ad; return ''; }
  const sokakAdi = (a) => a ? (/(Sokak|Cadde|Bulvar|Park)/.test(a) ? a : a + ' Sokak') : '';
  // v noktasının kuşağında (yatay r m) y-4'ten yüksek çatılı bir bina var mı (ağ tutunma yeri)
  function ankrajVar(x, y, z, r = 24, fark = 4) {
    const bs = sehir()?.binalar; if (!bs) return true;
    for (const b of bs) {
      if (b.y1 < y - fark) continue;
      if (Math.hypot(b.px - x, b.pz - z) - (b.pr || 0) - 6 > r) continue;
      if (b.minx - r > x || b.maxx + r < x || b.minz - r > z || b.maxz + r < z) continue;
      return true;
    }
    return false;
  }
  function kureGecerli(v, kayma = 0.6) {
    const s = sehir(); if (!s) return true;
    if (s.sinirIci && !s.sinirIci(v.x, v.z, 20)) return false;
    if (s.binaIcinde && s.binaIcinde(v.x, v.y, v.z, kayma) >= 0) return false;
    if (s.carpis) { const r = s.carpis(v, 1.2); if (r?.duzeltme && r.duzeltme.lengthSq() > 1e-4) return false; }
    return true;
  }
  // en uzak nokta örneklemesi: adaylardan yayılımı en geniş n tanesi
  function yay(adaylar, n, mevcut = []) {
    const secilen = [], ref = mevcut.slice();
    while (secilen.length < n && adaylar.length) {
      let bi = -1, bd = -1;
      for (let i = 0; i < adaylar.length; i++) {
        let md = 1e9; for (const r of ref) { const d = Math.hypot(r.x - adaylar[i].x, r.z - adaylar[i].z); if (d < md) md = d; }
        if (md > bd) { bd = md; bi = i; }
      }
      const c = adaylar.splice(bi, 1)[0]; secilen.push(c); ref.push(c);
    }
    return secilen;
  }
  function kurePlani(n) {
    const s = sehir(), sonuc = { park: [], cati: [], hava: [], adlar: [] };
    const nPark = Math.round(n * 0.36), nCati = Math.round(n * 0.4), nHava = n - nPark - nCati;
    const pk = parklar().filter(p => p.alan > 1500), topAlan = pk.reduce((a, p) => a + p.alan, 0) || 1;
    const aPark = [];
    for (let t = 0; t < 900 && aPark.length < nPark * 8 && pk.length; t++) {
      let r = Math.random() * topAlan, p = pk[0]; for (const q of pk) { r -= q.alan; if (r <= 0) { p = q; break; } }
      const x = rnd(p.x0, p.x1), z = rnd(p.z0, p.z1);
      if (!pip(p.halka, x, z) || s.binaIciMi(x, z, 3)) continue;
      const v = V(x, zemin(x, z) + rnd(1.6, 3), z);
      if (kureGecerli(v)) { v.park = p.ad; aPark.push(v); }
    }
    const aCati = [];
    const bs = s.binalar.filter(b => b.yuk >= 9);
    for (let t = 0; t < 900 && aCati.length < nCati * 8 && bs.length; t++) {
      const b = bs[(Math.random() * bs.length) | 0];
      const q = s.catiyaSigdir(b, rnd(b.minx, b.maxx), rnd(b.minz, b.maxz), 2);
      if (!q || s.binaIciMi(q.x, q.z, 0) !== b) continue;
      const v = V(q.x, b.y1 + rnd(1.6, 3), q.z);
      if (kureGecerli(v, 0.3)) aCati.push(v);
    }
    const aHava = [];
    for (let t = 0; t < 1500 && aHava.length < nHava * 8; t++) {
      const sk = s.sokakNoktasi(); const v = V(sk.x, zemin(sk.x, sk.z) + rnd(8, 13), sk.z);
      if (kureGecerli(v) && ankrajVar(v.x, v.y, v.z, 22, 2)) aHava.push(v);
    }
    const tum = [];
    sonuc.park = yay(aPark, nPark, tum); tum.push(...sonuc.park);
    sonuc.cati = yay(aCati, nCati, tum); tum.push(...sonuc.cati);
    sonuc.hava = yay(aHava, nHava, tum); tum.push(...sonuc.hava);
    const hepsi = [...sonuc.park, ...sonuc.cati, ...sonuc.hava];
    // eksik kalırsa (küçük harita) kalan adaylarla tamamla
    for (const a of [aPark, aCati, aHava]) while (hepsi.length < n && a.length) hepsi.push(a.pop());
    const adlar = new Set(); for (const v of sonuc.park) if (v.park) adlar.add(v.park);
    sonuc.adlar = [...adlar].slice(0, 2);
    sonuc.hepsi = hepsi; return sonuc;
  }
  function yolSurucu() {
    const ag = sehir()?.yolAgi; if (!ag) return null;
    const kenarMap = new Map(); for (const e of ag.kenarlar) { kenarMap.set(e.a + '_' + e.b, e); kenarMap.set(e.b + '_' + e.a, e); }
    return { ag, kenar: (a, b) => kenarMap.get(a + '_' + b) };
  }
  // kenar sırasıyla yol üstünde ilerle, her `adim` metrede nokta + yön ver
  function yolBoyuncaYuru(basla, hedefUzunluk, adim, yolAd) {
    const sg = yolSurucu(); if (!sg) return null;
    const D = sg.ag.dugumler, noktalar = [], ziyaret = new Set([basla]);
    let a = basla, onceki = -1, kalanAdim = 0, toplam = 0, dx = 0, dz = 0, ad = {};
    while (toplam < hedefUzunluk) {
      let en = -1, sk = -9;
      for (const k of D[a].komsu) {
        if (k === onceki || ziyaret.has(k)) continue;
        const ke = sg.kenar(a, k); if (!ke || ke.tur === 'service' || ke.tur === 'secondary_link') continue;
        const ex = D[k].x - D[a].x, ez = D[k].z - D[a].z, el = Math.hypot(ex, ez) || 1;
        const duz = toplam === 0 ? 0 : (dx * ex + dz * ez) / (Math.hypot(dx, dz) * el || 1);
        if (duz < 0.2 && toplam > 0) continue;
        const s2 = duz + (ke.tur === 'secondary' ? 0.5 : ke.tur === 'tertiary' ? 0.3 : 0) + Math.random() * 0.2;
        if (s2 > sk) { sk = s2; en = k; }
      }
      if (en < 0) break;
      const ke = sg.kenar(a, en), ex = D[en].x - D[a].x, ez = D[en].z - D[a].z, L = ke ? ke.L : Math.hypot(ex, ez);
      const ya = yolAd?.get(ke?.yol); if (ya) ad[ya] = (ad[ya] || 0) + L;
      let t = kalanAdim;
      while (t <= L) { noktalar.push({ x: D[a].x + ex * t / L, z: D[a].z + ez * t / L, fx: ex / L, fz: ez / L, gen: ke?.genislik || 8 }); t += adim; }
      kalanAdim = t - L; toplam += L; dx = ex; dz = ez; ziyaret.add(en); onceki = a; a = en;
    }
    return { noktalar, ad: Object.entries(ad).sort((p, q) => q[1] - p[1])[0]?.[0] || '' };
  }
  function halkaGecerli(x, y, z, fx, fz) {
    const s = sehir(); if (!s) return true;
    const R = 6.2, ux = -fz, uz = fx; // halka düzlemindeki yatay eksen
    if (y - R < zemin(x, z) + 2.5) return false;
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * 6.283, c = Math.cos(a) * R, sn = Math.sin(a) * R;
      const px = x + ux * c, py = y + sn, pz = z + uz * c;
      if (s.binaIcinde && s.binaIcinde(px, py, pz, 0) >= 0) return false;
      if (s.carpis) { const r = s.carpis(V(px, py, pz), 0.6); if (r?.duzeltme && r.duzeltme.lengthSq() > 1e-4) return false; }
    }
    if (s.binaIcinde && s.binaIcinde(x, y, z, 0) >= 0) return false;
    return ankrajVar(x, y, z, 24, 4);
  }
  function halkaPlani(n = 8) {
    const s = sehir(), sg = yolSurucu(); if (!sg) return null;
    const p = oyuncu(), D = sg.ag.dugumler, yolAd = new Map((veriH()?.yollar || []).map(y => [y.id, y.ad]));
    const adaylar = [];
    for (let i = 0; i < D.length; i++) {
      if (D[i].komsu.length < 1 || (s.sinirIci && !s.sinirIci(D[i].x, D[i].z, 80))) continue;
      const guzel = D[i].komsu.some(k => { const ke = sg.kenar(i, k); return ke && (ke.tur === 'secondary' || ke.tur === 'tertiary'); });
      const d = Math.hypot(D[i].x - p.x, D[i].z - p.z);
      adaylar.push({ i, o: d * (guzel ? 0.5 : 1) * rnd(0.8, 1.25) });
    }
    adaylar.sort((a, b) => a.o - b.o);
    let enIyi = null;
    for (const ad of adaylar.slice(0, 60)) {
      const yr = yolBoyuncaYuru(ad.i, 520, 44, yolAd); if (!yr || yr.noktalar.length < n) continue;
      const liste = [];
      let atlanan = 0;
      for (const q of yr.noktalar) {
        if (liste.length >= n) break;
        const zy = zemin(q.x, q.z); let tamam = null;
        for (const h of [15, 12, 18, 21]) { if (halkaGecerli(q.x, zy + h, q.z, q.fx, q.fz)) { tamam = V(q.x, zy + h, q.z); tamam.fx = q.fx; tamam.fz = q.fz; break; } }
        if (tamam) liste.push(tamam); else atlanan++;
        if (atlanan > 1) break;
      }
      if (liste.length >= n) { enIyi = { halkalar: liste, ad: yr.ad }; break; }
    }
    return enIyi;
  }
  // patron: en geniş açık alan (park/meydan), binalardan uzak
  function patronAlani() {
    const s = sehir(); let en = null;
    for (const pk of parklar().slice(0, 8)) {
      for (let x = pk.x0; x <= pk.x1; x += 5) for (let z = pk.z0; z <= pk.z1; z += 5) {
        if (!pip(pk.halka, x, z) || s.binaIciMi(x, z, 0.1)) continue;
        let r = 6; while (r < 60 && !s.binaIciMi(x, z, r + 4)) r += 4;
        if (!en || r > en.bosluk) en = { x, z, bosluk: r, ad: pk.ad };
      }
    }
    return en;
  }
  function kediPlani() {
    const s = sehir(), p = oyuncu(); const adaylar = [];
    for (const b of s.binalar) {
      if (b.yuk < 12 || b.yuk > 27 || b.alan < 120 || !b.kenar) continue;
      const d = Math.hypot(b.px - p.x, b.pz - p.z);
      if (d < 70 || d > 600) continue;
      for (const e of b.kenar) {
        const L = Math.hypot(e.bx - e.ax, e.bz - e.az); if (L < 7) continue;
        const x = (e.ax + e.bx) / 2 - e.nx * 1.3, z = (e.az + e.bz) / 2 - e.nz * 1.3;
        if (s.binaIciMi(x, z, 0) !== b) continue;
        if (s.sinirNokta(b, x, z).d < 1.0) continue;
        const yol = enYakinYolAdi(x, z, 40);
        adaylar.push({ b, x, z, nx: e.nx, nz: e.nz, yol, o: d * (yol ? 0.6 : 1) * rnd(0.8, 1.3) });
      }
    }
    adaylar.sort((a, b) => a.o - b.o);
    return adaylar[0] || null;
  }

  // ---------- kayıt ----------
  const kayit = { toplamKure: 0, puan: 0, zincir: 0, tur: 0 };
  try { Object.assign(kayit, JSON.parse(localStorage.getItem('zifir_kayit') || '{}')); } catch (e) { /* yok say */ }
  const kaydet = () => { try { localStorage.setItem('zifir_kayit', JSON.stringify(kayit)); } catch (e) { /* yok say */ } };

  // ---------- Işık Küreleri ----------
  const kPos = Array.from({ length: KURE_SAYI }, () => V());
  const kVar = new Array(KURE_SAYI).fill(false);
  const kFaz = Array.from({ length: KURE_SAYI }, () => rnd(0, 6.28));
  const kCekirdek = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.5, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), KURE_SAYI);
  const kHale = new THREE.InstancedMesh(new THREE.SphereGeometry(1.0, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), KURE_SAYI);
  for (const m of [kCekirdek, kHale]) { m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); sahne.add(m); }
  const kRenkler = [0x40fff0, 0xb070ff, 0xffd060].map(c => new THREE.Color(c));

  function kureNoktasi() {
    const s = sehir();
    for (let i = 0; i < 8; i++) {
      let v;
      if (s?.rastgeleCati) {
        v = s.rastgeleCati().clone();
        if (Math.random() < 0.35) v.set(v.x + rnd(-8, 8), zemin(v.x, v.z) + rnd(12, 45), v.z + rnd(-8, 8));
        else v.y += rnd(1.5, 4);
      } else {
        const x = rnd(-300, 300), z = rnd(-300, 300); v = V(x, rnd(2, 40), z);
      }
      if (s?.carpis) { const r = s.carpis(v, 1.2); if (r?.duzeltme && r.duzeltme.lengthSq() > 1e-4) continue; }
      return v;
    }
    return V(rnd(-100, 100), 20, rnd(-100, 100));
  }
  let kureAdlar = [];
  function kureleriYenile() {
    let pl = null;
    if (gercek()) { try { pl = kurePlani(KURE_SAYI); } catch (e) { console.warn('[GOREV] kure plani', e && e.message); } }
    if (pl) kureAdlar = pl.adlar;
    for (let i = 0; i < KURE_SAYI; i++) {
      if (pl?.hepsi[i]) kPos[i].copy(pl.hepsi[i]); else kPos[i].copy(kureNoktasi());
      kVar[i] = true;
      const c = kRenkler[i % 3].clone().multiplyScalar(2.2);
      kCekirdek.setColorAt(i, c); kHale.setColorAt(i, c);
    }
    kCekirdek.instanceColor.needsUpdate = true; kHale.instanceColor.needsUpdate = true;
  }
  kureleriYenile();
  let kuleKalan = KURE_SAYI;
  function kureleriCiz() {
    for (let i = 0; i < KURE_SAYI; i++) {
      if (!kVar[i]) { kCekirdek.setMatrixAt(i, DUM.matrix.makeScale(0, 0, 0)); kHale.setMatrixAt(i, DUM.matrix); continue; }
      const y = kPos[i].y + Math.sin(G.t * 2 + kFaz[i]) * 0.3;
      DUM.position.set(kPos[i].x, y, kPos[i].z); DUM.rotation.set(0, G.t * 1.8 + kFaz[i], 0.3);
      DUM.scale.setScalar(1); DUM.updateMatrix(); kCekirdek.setMatrixAt(i, DUM.matrix);
      DUM.rotation.set(0, 0, 0); DUM.scale.setScalar(1.15 + Math.sin(G.t * 3 + kFaz[i]) * 0.15); DUM.updateMatrix(); kHale.setMatrixAt(i, DUM.matrix);
    }
    kCekirdek.instanceMatrix.needsUpdate = true; kHale.instanceMatrix.needsUpdate = true;
  }

  // ---------- Kedi ----------
  const mKedi = new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.9 });
  const mKediKoyu = new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.9 });
  const mKediGoz = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x66ff99).multiplyScalar(1.6), toneMapped: false });
  const gKure = new THREE.SphereGeometry(1, 12, 9), gKoni = new THREE.ConeGeometry(1, 1, 4), gSil = new THREE.CylinderGeometry(1, 1, 1, 8);
  function kediYap() {
    const g = new THREE.Group(), ic = new THREE.Group(); g.add(ic);
    const ekle = (geo, mat, s, p, ebv = ic) => { const m = new THREE.Mesh(geo, mat); m.scale.set(...s); m.position.set(...p); ebv.add(m); return m; };
    ekle(gKure, mKedi, [0.35, 0.32, 0.5], [0, 0.32, 0]);
    ekle(gKure, mKedi, [0.24, 0.22, 0.22], [0, 0.72, 0.28]);
    for (const s of [-1, 1]) {
      ekle(gKoni, mKedi, [0.09, 0.2, 0.09], [s * 0.14, 0.95, 0.28]);
      ekle(gKure, mKediGoz, [0.05, 0.07, 0.03], [s * 0.09, 0.76, 0.48]);
      ekle(gKure, mKediKoyu, [0.07, 0.07, 0.14], [s * 0.16, 0.07, 0.28]);
    }
    const kuyruk = new THREE.Group(); kuyruk.position.set(0, 0.3, -0.45); ic.add(kuyruk);
    const k = ekle(gSil, mKediKoyu, [0.06, 0.4, 0.06], [0, 0.35, -0.1], kuyruk); k.rotation.x = -0.5;
    g.userData = { ic, kuyruk }; g.scale.setScalar(1.7); g.visible = false; sahne.add(g); return g;
  }
  const kedi = kediYap();
  const kediDurum = { var: false, konum: V(), kurtarildi: false, t: 0 };
  let kediYer = null; // {ad}
  function kediYerles() {
    const s = sehir(); let x, y, z, yaw = 0;
    kediYer = null;
    const kp = gercek() ? kediPlani() : null;
    if (kp) {
      x = kp.x; z = kp.z; y = kp.b.y1; yaw = Math.atan2(kp.nx, kp.nz); // aşağı sokağa bakar
      kediYer = { ad: sokakAdi(kp.yol) || kp.b.ad || '', bina: kp.b };
    } else {
      const b = s?.binalar?.length ? s.binalar.filter(q => q.h >= 14)[0 | (Math.random() * Math.max(1, s.binalar.filter(q => q.h >= 14).length))] : null;
      if (b) {
        const yan = Math.random() < 0.5; const sg = Math.random() < 0.5 ? -1 : 1;
        x = b.x + (yan ? sg * (b.gx / 2 - 1.1) : rnd(-b.gx / 3, b.gx / 3));
        z = b.z + (yan ? rnd(-b.gz / 3, b.gz / 3) : sg * (b.gz / 2 - 1.1));
        y = zemin(x, z); yaw = yan ? (sg > 0 ? Math.PI / 2 : -Math.PI / 2) : (sg > 0 ? 0 : Math.PI);
      } else { x = rnd(-60, 60); z = rnd(-60, 60); y = zemin(x, z); }
    }
    kediDurum.konum.set(x, y, z); kedi.position.set(x, y, z); kedi.rotation.y = yaw; kedi.scale.setScalar(1.7);
    kedi.visible = true; kediDurum.var = true; kediDurum.kurtarildi = false;
  }

  // ---------- Halkalar ----------
  const halkaGeo = new THREE.TorusGeometry(5, 0.35, 10, 36);
  const mHalkaAktif = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x40fff0).multiplyScalar(2.5), toneMapped: false, fog: false });
  const mHalkaBekle = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xb070ff).multiplyScalar(1.0), toneMapped: false, transparent: true, opacity: 0.55, fog: false });
  const halkalar = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(halkaGeo, mHalkaBekle); m.visible = false; sahne.add(m); return m; });

  // ---------- Işık sütunu (hedef işareti) ----------
  const sutunMat = new THREE.MeshBasicMaterial({ color: 0x40fff0, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false });
  const sutun = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 300, 16, 1, true), sutunMat);
  sutun.visible = false; sutun.frustumCulled = false; sahne.add(sutun);
  const sutunTaban = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.3, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, toneMapped: false, fog: false, depthWrite: false }));
  sutunTaban.rotation.x = -Math.PI / 2; sutunTaban.visible = false; sahne.add(sutunTaban);

  // ---------- Görev zinciri ----------
  const aktif = { ad: '', aciklama: '', ilerleme: 0, hedef: 1, isaret: null, ikon: '', idx: -1 };
  let yarisiVerildi = false;
  let gIdx = 0, gGec = null, sure = 0, kontrolSayac = 0;
  const sayac = { kure: 0, robot: 0 };
  let kamyonet = null, patron = null, halkaNo = 0, halkaSure = 0, halkaKonum = [];

  const enYakinKure = () => {
    const p = oyuncu(); let en = null, enD = 1e9;
    for (let i = 0; i < KURE_SAYI; i++) if (kVar[i]) { const d = kPos[i].distanceToSquared(p); if (d < enD) { enD = d; en = kPos[i]; } }
    return en;
  };
  const zorluk = () => kayit.tur;

  const GOREVLER = [
    {
      ad: 'Işık Kürelerini Topla', renk: 0x40fff0, ikon: 'ikon_kure',
      baslat() { sayac.kure = 0; aktif.hedef = 5 + 2 * zorluk(); aktif.aciklama = 'Çalınan ışık kürelerinden ' + aktif.hedef + ' tanesini topla: parklarda, çatılarda ve sokakların üstünde dağıldılar' + (kureAdlar.length ? ' (' + kureAdlar.join(', ') + ' dahil)' : '') + '.'; },
      guncelle() { aktif.ilerleme = sayac.kure; aktif.isaret = enYakinKure(); return sayac.kure >= aktif.hedef; },
    },
    {
      ad: 'Kediyi Kurtar', renk: 0xffd060, ikon: 'ikon_kedi',
      baslat() { kediYerles(); aktif.hedef = 1; aktif.aciklama = kediYer?.ad ? kediYer.ad + ' üstündeki bir apartmanın çatısında mahsur kalan kediyi bul!' : 'Çatıda mahsur kalan kediyi bul!'; aktif.isaret = kediDurum.konum; },
      guncelle() {
        aktif.ilerleme = kediDurum.kurtarildi ? 1 : 0;
        if (!kediDurum.kurtarildi && oyuncu().distanceTo(kediDurum.konum) < 2.8) {
          kediDurum.kurtarildi = true; kediDurum.t = 0; G.olay.emit('kediKurtarildi', {});
          msj('Zifir kediyi yere bıraktı. Miyav! Kedi çok mutlu.', 4);
        }
        if (kediDurum.kurtarildi) { kediDurum.t += 0.016; return kediDurum.t > 0.05; }
        return false;
      },
      temizle() { kediDurum.var = false; setTimeout(() => { kedi.visible = false; }, 600); },
    },
    {
      ad: 'Robot Çetesini Dağıt', renk: 0xff8a2a, ikon: 'ikon_patron',
      baslat() { sayac.robot = 0; aktif.hedef = 8 + 4 * zorluk(); aktif.aciklama = aktif.hedef + ' Pas Robotunu veya dronu yen! (F yumruk, E kamçı)'; if (G.dusman) G.dusman.dogmaCarpani = 2; },
      guncelle() {
        aktif.ilerleme = sayac.robot;
        const e = G.dusman?.enYakin?.(oyuncu(), 600); aktif.isaret = e && e.konum ? e.konum : null;
        return sayac.robot >= aktif.hedef;
      },
      temizle() { if (G.dusman) G.dusman.dogmaCarpani = 1; },
    },
    {
      ad: 'Halka Yarışı', renk: 0x40fff0, ikon: 'ikon_halka',
      baslat() { halkaKur(); aktif.hedef = 8; aktif.aciklama = halkaYol ? halkaYol + ' boyunca uzanan neon halkalardan sırayla geç!' : 'Havadaki neon halkalardan sırayla geç!'; },
      guncelle(dt) {
        const h = halkalar[halkaNo];
        halkaSure -= dt;
        if (halkaSure <= 0) { msj('Süre doldu, sorun değil! Halkalar yeniden başlıyor.', 3.5); halkaKur(); return false; }
        aktif.isaret = halkaKonum[halkaNo]; aktif.ilerleme = halkaNo;
        h.rotation.z += dt;
        if (oyuncu().distanceTo(halkaKonum[halkaNo]) < 6.5) {
          h.visible = false; halkaNo++; G.dusman?.kivilcim?.(halkaKonum[halkaNo - 1], 0x40fff0, 14, 9); G.olay.emit('halkaGecildi', { no: halkaNo });
          if (halkaNo >= 8) return true;
          halkalar[halkaNo].material = mHalkaAktif;
        }
        return false;
      },
      temizle() { for (const h of halkalar) h.visible = false; },
    },
    {
      ad: 'Kamyoneti Kovala', renk: 0xff5599, ikon: 'ikon_kamyonet',
      baslat() { aktif.hedef = 1; aktif.aciklama = 'Hırsız robot kamyoneti yakala ve yumrukla!'; kamyonet = G.dusman?.olustur?.('kamyonet') || null; sure = 240; if (kamyonet?.yolAd) aktif.aciklama = 'Hırsız robot kamyoneti ' + sokakAdi(kamyonet.yolAd) + ' üzerinde kaçıyor! Yakala ve yumrukla!'; },
      guncelle(dt) {
        if (!kamyonet) return true;
        aktif.ilerleme = kamyonet.canli ? 0 : 1; aktif.isaret = kamyonet.konum;
        sure -= dt;
        if (sure <= 0) { msj('Kamyonet kaçıyor, yeniden deneyelim!', 3); G.dusman.kaldir(kamyonet); kamyonet = G.dusman.olustur('kamyonet'); sure = 240; }
        return !kamyonet.canli;
      },
      temizle() { if (kamyonet?.canli) G.dusman?.kaldir?.(kamyonet); kamyonet = null; },
    },
    {
      ad: 'Patron: DEV PAS ROBOT', renk: 0xff3030, ikon: 'ikon_patron',
      baslat() {
        aktif.hedef = 100; aktif.aciklama = 'Dev Pas Robotun SIRTINDAKİ parlayan pile arkadan vur!';
        let v = null; const p = oyuncu();
        const pa = gercek() ? patronAlani() : null;
        if (pa) { v = V(pa.x, zemin(pa.x, pa.z), pa.z); if (pa.ad) aktif.aciklama = pa.ad + ' içinde Dev Pas Robotun SIRTINDAKİ parlayan pile arkadan vur!'; }
        else {
          v = sehir()?.rastgeleCati?.();
          for (let i = 0; i < 8 && v && Math.hypot(v.x - p.x, v.z - p.z) < 70; i++) v = sehir().rastgeleCati();
          if (!v) v = V(p.x + 60, 0, p.z);
        }
        patron = G.dusman?.dev?.(v.clone()) || null;
      },
      guncelle() {
        if (!patron) return true;
        aktif.ilerleme = Math.max(0, patron.canMax - patron.can); aktif.isaret = patron.konum;
        return !patron.canli;
      },
      temizle() { if (patron?.canli) G.dusman?.kaldir?.(patron); patron = null; },
    },
  ];

  let halkaYol = '';
  function halkaKur() {
    const p = oyuncu(), lim = (sehir()?.boyut || 400) * 0.85;
    halkaKonum = []; halkaYol = '';
    let yon = rnd(0, 6.28), hp = null;
    if (gercek()) { try { hp = halkaPlani(8); } catch (e) { console.warn('[GOREV] halka plani', e && e.message); } }
    if (hp) {
      halkaKonum = hp.halkalar; halkaYol = hp.ad;
      for (let i = 0; i < 8; i++) {
        const h = halkalar[i], q = halkaKonum[i];
        h.visible = true; h.material = i === 0 ? mHalkaAktif : mHalkaBekle; h.position.copy(q);
        h.lookAt(q.x + q.fx, q.y, q.z + q.fz); h.rotation.z = 0;
      }
      halkaNo = 0; halkaSure = 40 + 22 * 8 + 20 * zorluk();
      return;
    }
    let x = p.x, y = Math.max(p.y, 20) + 8, z = p.z;
    for (let i = 0; i < 8; i++) {
      for (let k = 0; k < 6; k++) {
        const nx = x + Math.cos(yon) * rnd(40, 60), nz = z + Math.sin(yon) * rnd(40, 60);
        if (sehir()?.sinirIci ? sehir().sinirIci(nx, nz, 60) : (Math.abs(nx) < lim && Math.abs(nz) < lim)) { x = nx; z = nz; break; }
        yon += 1.2;
      }
      y = Math.max(zemin(x, z) + 14, Math.min(90, y + rnd(-12, 18)));
      halkaKonum.push(V(x, y, z));
      yon += rnd(-0.6, 0.6);
    }
    for (let i = 0; i < 8; i++) {
      const h = halkalar[i]; h.visible = true; h.material = i === 0 ? mHalkaAktif : mHalkaBekle;
      h.position.copy(halkaKonum[i]);
      const hedef = halkaKonum[i + 1] || halkaKonum[i].clone().add(V(Math.cos(yon), 0, Math.sin(yon)));
      h.lookAt(hedef); h.rotation.z = 0;
    }
    halkaNo = 0; halkaSure = 40 + 22 * 8 + 20 * zorluk();
  }

  function baslat(i) {
    gIdx = i % GOREVLER.length; gGec = GOREVLER[gIdx];
    aktif.ad = gGec.ad; aktif.ilerleme = 0; aktif.isaret = null; aktif.ikon = gGec.ikon; aktif.idx = gIdx; yarisiVerildi = false;
    gGec.baslat();
    sutunMat.color.setHex(gGec.renk);
    G.olay.emit('gorevBasla', { ad: gGec.ad, idx: gIdx });
    msj('Yeni görev: ' + gGec.ad + ' — ' + aktif.aciklama, 5);
    if (G.test) console.log('[GOREV] aktif ' + aktif.ad);
  }
  function bitir() {
    const ad = gGec.ad; gGec.temizle?.();
    const odul = Math.round(100 * (1 + zorluk() * 0.5)) + (gIdx === 5 ? 300 : 0);
    G.gorev.puan += odul; kayit.puan = G.gorev.puan;
    G.oyuncu?.gucEkle?.(gIdx === 5 ? 60 : 25);
    G.efekt?.yavasCekim?.(0.4, 0.8);
    G.olay.emit('gorevBitti', { ad, odul, puan: G.gorev.puan, idx: gIdx });
    msj('Görev tamam: ' + ad + '  +' + odul + ' puan!', 4);
    let sonraki = gIdx + 1;
    if (sonraki >= GOREVLER.length) { sonraki = 0; kayit.tur++; }
    kayit.zincir = sonraki; kaydet();
    if (gIdx === GOREVLER.length - 1) G.olay.emit('zincirBitti', { tur: kayit.tur });
    baslat(sonraki);
  }

  // ---------- olaylar ----------
  G.olay.on('kureAlindi', () => { if (gGec === GOREVLER[0]) sayac.kure++; });
  G.olay.on('robotYenildi', v => {
    if (gGec === GOREVLER[2] && v && v.tur !== 'kamyonet' && !v.dev) sayac.robot++;
  });

  // ---------- EĞİTİM zinciri ----------
  const egitimSay = { salla: 0, dron: 0, zip: 0, dev: 0, konus: 0 };
  let egitim = -1, egitimDronlar = [], egitimY0 = 0, egitimBekle = 0;
  const catiBul = (min, max, hMin = 12) => {
    const bs = sehir()?.binalar; if (!bs?.length) return null;
    const p = oyuncu(); let en = null, enD = 1e9;
    for (const b of bs) {
      if (b.h < hMin) continue;
      const d = Math.hypot(b.x - p.x, b.z - p.z);
      if (d < min || d > max) continue;
      if (d < enD) { enD = d; en = b; }
    }
    return en ? V(en.x, en.h, en.z) : null;
  };
  const EGITIM = [
    { ad: 'Çatıya Çık', metin: 'Bir çatıya bak ve E ile çatıya çekil', tuslar: ['E'], hedef: 1,
      baslat() { egitimY0 = oyuncu().y; egitimSay.konus = 0; aktif.isaret = catiBul(15, 90, Math.max(18, egitimY0 + 10)); },
      guncelle() { const o = G.oyuncu; return egitimSay.konus > 0 || (o?.yerde && o.konum.y > Math.max(12, egitimY0 + 8)); } },
    { ad: 'Sallan', metin: 'Sağ tıkı basılı tut: salın · bırak: fırla (3 kez)', tuslar: ['Sağ tık (basılı)', 'bırak: fırla'], hedef: 3,
      baslat() { egitimSay.salla = 0; aktif.isaret = null; },
      guncelle() { aktif.ilerleme = Math.min(3, egitimSay.salla); return egitimSay.salla >= 3; } },
    { ad: 'Sapan', metin: 'Sağ tık basılıyken Space: çift ağla sapan gibi fırla', tuslar: ['Sağ tık', 'Space'], hedef: 1,
      baslat() { egitimSay.sapan = 0; aktif.isaret = null; },
      guncelle() { return egitimSay.sapan > 0; } },
    { ad: 'Dronları Vur', metin: 'Sol tıkla 3 dronu vur', tuslar: ['Sol tık'], hedef: 3,
      baslat() { egitimSay.dron = 0; egitimDronlar = []; },
      guncelle() {
        aktif.ilerleme = Math.min(3, egitimSay.dron);
        egitimDronlar = egitimDronlar.filter(d => d.canli);
        let kalan = 3 - egitimSay.dron - egitimDronlar.length;
        for (; kalan > 0 && G.dusman?.olustur; kalan--) { const d = G.dusman.olustur('dron'); if (d) egitimDronlar.push(d); }
        const e = G.dusman?.enYakin?.(oyuncu(), 400); aktif.isaret = e?.konum ?? null;
        return egitimSay.dron >= 3;
      } },
    { ad: 'Dev Zifir', metin: 'Q ile Dev Zifir ol', tuslar: ['Q'], hedef: 1,
      baslat() { egitimSay.dev = 0; aktif.isaret = null; const o = G.oyuncu; if (o && o.guc < (o.gucMax || 100)) o.gucEkle?.((o.gucMax || 100) - o.guc); },
      guncelle() { return egitimSay.dev > 0; } },
  ];
  function egitimAdim(i) {
    egitim = i; egitimBekle = 0; const a = EGITIM[i];
    aktif.ad = 'EĞİTİM ' + (i + 1) + '/' + EGITIM.length + ' · ' + a.ad; aktif.aciklama = a.metin;
    aktif.ilerleme = 0; aktif.hedef = a.hedef; aktif.isaret = null; aktif.ikon = 'ikon_egitim'; aktif.idx = -1; a.baslat();
    const ip = { adim: i + 1, toplam: EGITIM.length, baslik: a.ad, metin: a.metin, tuslar: a.tuslar };
    if (G.gorev) G.gorev.ipucu = ip;
    G.olay.emit('ipucu', ip);
  }
  function egitimBaslat() {
    gGec?.temizle?.(); gGec = null; kayit.egitimBitti = false; kaydet();
    for (const h of halkalar) h.visible = false;
    egitimAdim(0);
  }
  function egitimBitir() {
    egitim = -1; kayit.egitimBitti = true; G.gorev.puan += 200; kayit.puan = G.gorev.puan; kaydet();
    G.efekt?.yavasCekim?.(0.4, 0.8);
    G.gorev.ipucu = null;
    G.olay.emit('ipucuKapat', {});
    G.olay.emit('gorevBitti', { ad: 'EĞİTİM', odul: 200, puan: G.gorev.puan });
    baslat(kayit.zincir || 0);
  }
  G.olay.on('sallanBasla', () => { egitimSay.salla++; });
  G.olay.on('sapan', () => { egitimSay.sapan = (egitimSay.sapan || 0) + 1; });
  G.olay.on('zip', () => { egitimSay.zip++; });
  G.olay.on('konus', () => { egitimSay.konus++; });
  G.olay.on('devBasla', () => { egitimSay.dev++; });
  G.olay.on('robotYenildi', v => { if (egitim === 3 && v?.tur === 'dron') egitimSay.dron++; });

  G.gorev = { aktif, kaydet, get idx() { return gIdx; }, puan: kayit.puan || 0, toplamKure: kayit.toplamKure || 0, kayit, atla() { if (egitim >= 0) egitimAdim(egitim); else if (gGec) bitir(); },
    egitimiTekrarla() { egitimBaslat(); }, get egitimde() { return egitim >= 0; },
    // harita/mini harita/test: aktif görevin hedef noktaları
    hedefler() {
      const o = [];
      if (egitim >= 0) return o;
      if (gGec === GOREVLER[0]) { for (let i = 0; i < KURE_SAYI; i++) if (kVar[i]) o.push(kPos[i]); }
      else if (gGec === GOREVLER[1]) { if (kediDurum.var) o.push(kediDurum.konum); }
      else if (gGec === GOREVLER[3]) { for (let i = halkaNo; i < halkaKonum.length; i++) o.push(halkaKonum[i]); }
      else if (aktif.isaret) o.push(aktif.isaret);
      return o;
    },
    // test: yerleşim planı + doğrudan görev başlat
    plan: { kureler: () => kPos.filter((_, i) => kVar[i]), kedi: () => (kediDurum.var ? { konum: kediDurum.konum, ...kediYer } : null), halkalar: () => halkaKonum, patronAlani, halkaYol: () => halkaYol,
      yeniKure: kureleriYenile, yeniKedi: () => { kediYerles(); return { konum: kediDurum.konum, ...kediYer }; }, yeniHalka: () => { halkaKur(); return halkaKonum; }, parkAdi, enYakinYolAdi },
    testBaslat(i) { gGec?.temizle?.(); egitim = -1; baslat(i); } };
  const egitimIstek = !kayit.egitimBitti && (!G.test || new URLSearchParams(location.search).has('egitim'));
  if (egitimIstek) egitimAdim(0); else baslat(kayit.zincir || 0);
  kureleriCiz();

  function kureTopla(dt) {
    const p = oyuncu();
    for (let i = 0; i < KURE_SAYI; i++) {
      if (!kVar[i]) continue;
      const dx = kPos[i].x - p.x, dy = kPos[i].y - (p.y + 0.9), dz = kPos[i].z - p.z;
      if (dx * dx + dy * dy + dz * dz < 6.25) {
        kVar[i] = false; kuleKalan--;
        G.gorev.toplamKure++; kayit.toplamKure = G.gorev.toplamKure; G.gorev.puan += 10; kayit.puan = G.gorev.puan;
        G.dusman?.kivilcim?.(kPos[i], 0x40fff0, 10, 6);
        G.oyuncu?.gucEkle?.(2);
        G.olay.emit('kureAlindi', { konum: kPos[i].clone(), toplam: G.gorev.toplamKure });
        if (G.gorev.toplamKure % 10 === 0) msj('Harika! ' + G.gorev.toplamKure + ' Işık Küresi topladın.', 3);
        kaydet();
      }
    }
    if (kuleKalan <= 0) { kureleriYenile(); kuleKalan = KURE_SAYI; msj('Şehre yeni Işık Küreleri dağıldı!', 4); }
  }

  let logSayac = 0;
  kur.guncelle = function (G2, dt) {
    if (G2.durum !== 'oyun') return;
    kureTopla(dt); kureleriCiz();
    if (kediDurum.var && kedi.visible) {
      const u = kedi.userData; const t = G2.t;
      u.kuyruk.rotation.z = Math.sin(t * 2.5) * 0.5; u.ic.position.y = Math.sin(t * 1.6) * 0.02;
      if (kediDurum.kurtarildi) kedi.position.y += dt * 1.5, kedi.scale.multiplyScalar(Math.max(0.5, 1 - dt * 2));
      else kedi.scale.setScalar(1.7 + Math.sin(t * 2) * 0.05);
    }
    if (egitim >= 0) {
      if (egitimBekle > 0) egitimBekle -= dt;
      else if (EGITIM[egitim].guncelle()) {
        G2.olay.emit('ipucuTamam', { adim: egitim + 1 });
        G2.efekt?.flas?.('#2ef2e0', 0.2);
        egitimBekle = 1.4;
        const sn = egitim + 1;
        setTimeout(() => { if (egitim !== sn - 1) return; if (sn >= EGITIM.length) egitimBitir(); else egitimAdim(sn); }, 1400);
      }
    } else if (gGec) {
      if (gGec.guncelle(dt)) bitir();
      else if (!yarisiVerildi && aktif.hedef > 1 && aktif.ilerleme >= aktif.hedef * 0.5) { yarisiVerildi = true; G2.olay.emit('gorevYarisi', { ad: aktif.ad, idx: aktif.idx }); }
    }
    // ışık sütunu
    const is = aktif.isaret;
    if (is) {
      const d = oyuncu().distanceTo(is), r = Math.min(6, Math.max(1, d * 0.012));
      sutun.visible = true; sutun.position.set(is.x, is.y + 148, is.z); sutun.scale.set(r * 0.45, 1, r * 0.45);
      sutunMat.opacity = 0.11 + 0.04 * Math.sin(G2.t * 3);
      sutunTaban.visible = true; sutunTaban.position.set(is.x, is.y + 0.3, is.z); sutunTaban.scale.setScalar(r * (1 + 0.15 * Math.sin(G2.t * 4)));
    } else { sutun.visible = false; sutunTaban.visible = false; }
    if (G2.test) { logSayac -= dt; if (logSayac <= 0) { logSayac = 2; console.log('[GOREV] aktif ' + aktif.ad + ' ' + aktif.ilerleme + '/' + aktif.hedef); } }
  };
}

export function guncelle(G, dt) { kur.guncelle?.(G, dt); }
