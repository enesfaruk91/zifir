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
  function kureleriYenile() {
    for (let i = 0; i < KURE_SAYI; i++) {
      kPos[i].copy(kureNoktasi()); kVar[i] = true;
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
  function kediYerles() {
    const s = sehir(); let x, y, z, yaw = 0;
    const b = s?.binalar?.length ? s.binalar.filter(q => q.h >= 14)[0 | (Math.random() * Math.max(1, s.binalar.filter(q => q.h >= 14).length))] : null;
    if (b) {
      const yan = Math.random() < 0.5; const sg = Math.random() < 0.5 ? -1 : 1;
      x = b.x + (yan ? sg * (b.gx / 2 - 1.1) : rnd(-b.gx / 3, b.gx / 3));
      z = b.z + (yan ? rnd(-b.gz / 3, b.gz / 3) : sg * (b.gz / 2 - 1.1));
      y = zemin(x, z); yaw = yan ? (sg > 0 ? Math.PI / 2 : -Math.PI / 2) : (sg > 0 ? 0 : Math.PI);
    } else { x = rnd(-60, 60); z = rnd(-60, 60); y = zemin(x, z); }
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
  const aktif = { ad: '', aciklama: '', ilerleme: 0, hedef: 1, isaret: null };
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
      ad: 'Işık Kürelerini Topla', renk: 0x40fff0,
      baslat() { sayac.kure = 0; aktif.hedef = 5 + 2 * zorluk(); aktif.aciklama = 'Çalınan ışık kürelerinden ' + aktif.hedef + ' tanesini topla.'; },
      guncelle() { aktif.ilerleme = sayac.kure; aktif.isaret = enYakinKure(); return sayac.kure >= aktif.hedef; },
    },
    {
      ad: 'Kediyi Kurtar', renk: 0xffd060,
      baslat() { kediYerles(); aktif.hedef = 1; aktif.aciklama = 'Çatıda mahsur kalan kediyi bul!'; aktif.isaret = kediDurum.konum; },
      guncelle() {
        aktif.ilerleme = kediDurum.kurtarildi ? 1 : 0;
        if (!kediDurum.kurtarildi && oyuncu().distanceTo(kediDurum.konum) < 2.8) {
          kediDurum.kurtarildi = true; kediDurum.t = 0;
          msj('Zifir kediyi yere bıraktı. Miyav! Kedi çok mutlu.', 4);
        }
        if (kediDurum.kurtarildi) { kediDurum.t += 0.016; return kediDurum.t > 0.05; }
        return false;
      },
      temizle() { kediDurum.var = false; setTimeout(() => { kedi.visible = false; }, 600); },
    },
    {
      ad: 'Robot Çetesini Dağıt', renk: 0xff8a2a,
      baslat() { sayac.robot = 0; aktif.hedef = 8 + 4 * zorluk(); aktif.aciklama = aktif.hedef + ' Pas Robotunu veya dronu yen! (F yumruk, E kamçı)'; if (G.dusman) G.dusman.dogmaCarpani = 2; },
      guncelle() {
        aktif.ilerleme = sayac.robot;
        const e = G.dusman?.enYakin?.(oyuncu(), 600); aktif.isaret = e && e.konum ? e.konum : null;
        return sayac.robot >= aktif.hedef;
      },
      temizle() { if (G.dusman) G.dusman.dogmaCarpani = 1; },
    },
    {
      ad: 'Halka Yarışı', renk: 0x40fff0,
      baslat() { halkaKur(); aktif.hedef = 8; aktif.aciklama = 'Havadaki neon halkalardan sırayla geç!'; },
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
      ad: 'Kamyoneti Kovala', renk: 0xff5599,
      baslat() { aktif.hedef = 1; aktif.aciklama = 'Hırsız robot kamyoneti yakala ve yumrukla!'; kamyonet = G.dusman?.olustur?.('kamyonet') || null; sure = 240; },
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
      ad: 'Patron: DEV PAS ROBOT', renk: 0xff3030,
      baslat() {
        aktif.hedef = 100; aktif.aciklama = 'Dev Pas Robotun SIRTINDAKİ parlayan pile arkadan vur!';
        let v = sehir()?.rastgeleCati?.();
        const p = oyuncu();
        for (let i = 0; i < 8 && v && Math.hypot(v.x - p.x, v.z - p.z) < 70; i++) v = sehir().rastgeleCati();
        if (!v) v = V(p.x + 60, 0, p.z);
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

  function halkaKur() {
    const p = oyuncu(), lim = (sehir()?.boyut || 400) * 0.85;
    let x = p.x, y = Math.max(p.y, 20) + 8, z = p.z;
    halkaKonum = [];
    let yon = rnd(0, 6.28);
    for (let i = 0; i < 8; i++) {
      for (let k = 0; k < 6; k++) {
        const nx = x + Math.cos(yon) * rnd(40, 60), nz = z + Math.sin(yon) * rnd(40, 60);
        if (Math.abs(nx) < lim && Math.abs(nz) < lim) { x = nx; z = nz; break; }
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
    aktif.ad = gGec.ad; aktif.ilerleme = 0; aktif.isaret = null;
    gGec.baslat();
    sutunMat.color.setHex(gGec.renk);
    G.olay.emit('gorevBasla', { ad: gGec.ad });
    msj('Yeni görev: ' + gGec.ad + ' — ' + aktif.aciklama, 5);
    if (G.test) console.log('[GOREV] aktif ' + aktif.ad);
  }
  function bitir() {
    const ad = gGec.ad; gGec.temizle?.();
    const odul = Math.round(100 * (1 + zorluk() * 0.5)) + (gIdx === 5 ? 300 : 0);
    G.gorev.puan += odul; kayit.puan = G.gorev.puan;
    G.oyuncu?.gucEkle?.(gIdx === 5 ? 60 : 25);
    G.olay.emit('gorevBitti', { ad });
    msj('Görev tamam: ' + ad + '  +' + odul + ' puan!', 4);
    let sonraki = gIdx + 1;
    if (sonraki >= GOREVLER.length) { sonraki = 0; kayit.tur++; }
    kayit.zincir = sonraki; kaydet();
    baslat(sonraki);
  }

  // ---------- olaylar ----------
  G.olay.on('kureAlindi', () => { if (gGec === GOREVLER[0]) sayac.kure++; });
  G.olay.on('robotYenildi', v => {
    if (gGec === GOREVLER[2] && v && v.tur !== 'kamyonet' && !v.dev) sayac.robot++;
  });

  G.gorev = { aktif, puan: kayit.puan || 0, toplamKure: kayit.toplamKure || 0, kayit, atla() { if (gGec) bitir(); } };
  baslat(kayit.zincir || 0);
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
    if (gGec) { if (gGec.guncelle(dt)) bitir(); }
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
