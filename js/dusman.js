// Düşmanlar — Pas Robotları, Vızvız dronlar, hırsız kamyonet, DEV PAS ROBOT. SOZLESME §4.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

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
  const mGoz = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe2a8, emissiveIntensity: 0.2, roughness: 0.3 });
  const mBebek = new THREE.MeshBasicMaterial({ color: 0x1a0f20 });
  const mPil = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x66ffcc).multiplyScalar(1.1), toneMapped: false });
  const mTurunc = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff8a2a).multiplyScalar(0.85) });
  const mDron = new THREE.MeshStandardMaterial({ color: 0xa8481a, roughness: 0.75, metalness: 0.5 });
  const mDronKol = new THREE.MeshStandardMaterial({ color: 0x2a2624, roughness: 0.7, metalness: 0.6 });
  const mDronYan = new THREE.MeshBasicMaterial({ color: 0x55dd77 });
  const mDronYan2 = new THREE.MeshBasicMaterial({ color: 0xdd5544 });
  const gDisk = new THREE.CylinderGeometry(1, 1, 0.02, 20);
  const mDronGoz = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x3ff0e0).multiplyScalar(2), toneMapped: false });
  const mPerve = new THREE.MeshBasicMaterial({ color: 0x9a9a9a, transparent: true, opacity: 0.16, depthWrite: false });
  const mPerveKanat = new THREE.MeshBasicMaterial({ color: 0x1c1c1c, transparent: true, opacity: 0.6, depthWrite: false });
  const mKam = new THREE.MeshStandardMaterial({ color: 0x6c2e7a, roughness: 0.6, metalness: 0.4 });
  const mKabin = new THREE.MeshStandardMaterial({ color: 0xe0742a, roughness: 0.6, metalness: 0.3 });
  const mTeker = new THREE.MeshStandardMaterial({ color: 0x15101a, roughness: 0.9 });

  function parca(geo, mat, sx, sy, sz, x, y, z, ebeveyn) {
    const m = new THREE.Mesh(geo, mat);
    m.scale.set(sx, sy, sz); m.position.set(x, y, z);
    ebeveyn.add(m); return m;
  }

  // ---------- CC0 animasyonlu modeller (asenkron; yüklenene dek prosedürel görünüm) ----------
  const KAYNAK = {
    robot: { yol: 'assets/3d/RobotExpressive.glb', boy: 2.4, hiza: 'alt', ileri: 0 },
    dev: { yol: 'assets/3d/mech/George.glb', boy: 3.0, hiza: 'alt', ileri: 0 },
    dron: { yol: 'assets/3d/cyberpunk/Enemy_Flying.glb', boy: 1.5, hiza: 'orta', ileri: 0 },
    kamyonet: { yol: 'assets/3d/arac/delivery.glb', boy: 1.4 * 1.45, hiza: 'alt', ileri: Math.PI },
  };
  const ANIM = {
    robot: { dur: 'Idle', yuru: 'Walking', kos: 'Running', sal: 'Punch', hasar: 'No', ol: 'Death' },
    dev: { dur: 'Idle', yuru: 'Walk', kos: 'Run', sal: 'Punch', hasar: 'HitRecieve_1', ol: 'Death' },
    dron: { dur: 'Idle', yuru: 'Walk', sal: 'Attack' },
  };
  const modeller = {};   // ad -> {sahne, anims, olcek, yOfs}
  const yukleyici = new GLTFLoader();
  function modelAdi(e) { return e.tur === 'robot' ? (e.dev ? 'dev' : 'robot') : e.tur; }
  function boyaMat(ad, m) {
    const ad2 = (m.name || '').toLowerCase();
    let n;
    if (m.isMeshBasicMaterial || m.isMeshStandardMaterial || m.isMeshPhongMaterial || m.isMeshLambertMaterial) {
      n = new THREE.MeshStandardMaterial({ map: m.map || null, color: m.color ? m.color.clone() : new THREE.Color(0xffffff), roughness: 0.78, metalness: 0.35,
        transparent: m.transparent, opacity: m.opacity, side: m.side });
    } else n = m.clone();
    n.name = m.name; let goz = false;
    if (ad === 'robot') {                      // Profesör Pas: paslı turuncu / kahve
      if (ad2 === 'main') n.color.set(0xb4521a);
      else if (ad2 === 'grey') n.color.set(0x6a4a38);
      else if (ad2 === 'black') n.color.set(0x1c1410);
      n.roughness = 0.85; n.metalness = 0.45;
    } else if (ad === 'dev') {
      if (n.map) n.color.setRGB(2.4, 1.1, 0.45);   // dokuyu pasa doğru boya
      n.roughness = 0.85; n.metalness = 0.4;
    } else if (ad === 'dron') {
      if (ad2 === 'main' || ad2 === 'material.001') n.color.set(0xa8481a);
      else if (ad2 === 'main2' || ad2 === 'material.002') n.color.set(0x4a3a30);
      else if (ad2 === 'material') { goz = true; n.color.set(0xb01408); n.emissive = new THREE.Color(0x601008); n.emissiveIntensity = 1; }
      n.roughness = 0.7; n.metalness = 0.5;
    } else if (ad === 'kamyonet') {
      if (ad2 === 'paintgreen') n.color.set(0xc4561a);
      else if (ad2 === 'paintwhite') n.color.set(0x7a3512);
      else if (ad2 === 'lightfront') { n.emissive = new THREE.Color(0xffd890); n.emissiveIntensity = 0.5; }
      else if (ad2 === 'lightback') { n.emissive = new THREE.Color(0xff3010); n.emissiveIntensity = 0.5; }
      n.roughness = 0.7; n.metalness = 0.35;
    }
    return { n, goz };
  }
  function modelTak(e) {
    const ad = modelAdi(e), k = modeller[ad];
    if (!k || e.model) return;
    try {
      const m = SkeletonUtils.clone(k.sahne);
      const w = new THREE.Group(), ic = new THREE.Group();
      m.scale.setScalar(k.olcek); m.position.y = k.yOfs; m.rotation.y = KAYNAK[ad].ileri;
      ic.add(m); w.add(ic);
      e.mats = [];
      m.traverse(o => {
        if (!o.isMesh) return;
        o.castShadow = false; o.receiveShadow = false;
        const kaynakMat = Array.isArray(o.material) ? o.material : [o.material];
        const yeni = kaynakMat.map(mm => {
          const r = boyaMat(ad, mm);
          e.mats.push({ mat: r.n, goz: r.goz, em: r.n.emissive ? r.n.emissive.clone() : new THREE.Color(0), emI: r.n.emissiveIntensity });
          if (r.goz) e.gozMat = r.n;
          return r.n;
        });
        o.material = Array.isArray(o.material) ? yeni : yeni[0];
      });
      if (k.anims.length) {
        e.mixer = new THREE.AnimationMixer(m); e.act = {}; e.clip = {};
        for (const [rol, ad3] of Object.entries(ANIM[ad] || {})) {
          const c = k.anims.find(a => a.name === ad3 || a.name.endsWith('|' + ad3));
          if (c) { e.act[rol] = e.mixer.clipAction(c); e.clip[rol] = c.duration; }
        }
        e.cur = null;
      }
      if (e.tur === 'kamyonet') {
        e.tek = ['wheel_backLeft', 'wheel_backRight', 'wheel_frontLeft', 'wheel_frontRight'].map(n => m.getObjectByName(n)).filter(Boolean);
      }
      if (e.dev) {                                // sırttaki parlayan pil (zayıf nokta) — gövde kemiğine bağlı
        const pil = new THREE.Mesh(gKutu, mPil); pil.scale.set(1.0, 1.4, 0.3);
        w.add(pil); pil.position.set(0, k.boy * 0.6, -0.95);
        e.pilBaz = pil.scale.clone();
        e.pil.visible = false; e.pil = pil; pil.visible = true; e.pil.userData.gercek = true;
      }
      e.proc = e.grup.children.slice(); for (const c of e.proc) c.visible = false;
      e.grup.add(w); e.w = w; e.model = m; e.mdt = 0;
      if (e.mixer) { e.cur = null; oyna(e, 'dur', false, 1, 0); }
    } catch (err) { console.warn('[DUSMAN] model takılamadı', ad, err); }
  }
  function modelYukle(ad) {
    const kay = KAYNAK[ad];
    yukleyici.load(kay.yol, gltf => {
      try {
        const s = gltf.scene; s.updateMatrixWorld(true);
        const kutu = new THREE.Box3().setFromObject(s, true);
        const yuk = kutu.max.y - kutu.min.y || 1, olcek = kay.boy / yuk;
        const yOfs = kay.hiza === 'orta' ? -(kutu.max.y + kutu.min.y) / 2 * olcek : -kutu.min.y * olcek;
        modeller[ad] = { sahne: s, anims: gltf.animations || [], olcek, yOfs };
        for (const e of liste) if (modelAdi(e) === ad) modelTak(e);
      } catch (err) { console.warn('[DUSMAN] model işlenemedi', ad, err); }
    }, undefined, err => console.warn('[DUSMAN] model yüklenemedi (prosedürel kalır)', ad, err));
  }
  function oyna(e, rol, tek = false, ts = 1, fade = 0.18) {
    const a = e.act?.[rol]; if (!a) return;
    if (!tek && e.cur === a) { a.timeScale = ts; return; }
    a.reset(); a.timeScale = ts; a.enabled = true;
    if (tek) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; e.tekT = (e.clip[rol] || 1) / Math.max(0.05, ts); }
    else { a.setLoop(THREE.LoopRepeat, Infinity); a.clampWhenFinished = false; e.tekT = 0; }
    if (e.cur && e.cur !== a && fade > 0) { a.fadeIn(fade); e.cur.fadeOut(fade); } else if (e.cur && e.cur !== a) e.cur.stop();
    a.play(); e.cur = a;
  }
  // isabet beyaz parlaması
  function parlat(e, acik) {
    if (!e.mats) return;
    for (const q of e.mats) {
      if (!q.mat.emissive) continue;
      if (acik) { q.mat.emissive.setRGB(1, 1, 1); q.mat.emissiveIntensity = 0.9; }
      else { q.mat.emissive.copy(q.em); q.mat.emissiveIntensity = q.emI; }
    }
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

  // ---------- dron enerji mermisi: küçük, yavaş, kısa kuyruklu ----------
  const topGeo = new THREE.SphereGeometry(0.2, 10, 8);
  const kuyrukGeo = new THREE.ConeGeometry(0.17, 1.1, 8); kuyrukGeo.rotateX(-Math.PI / 2); kuyrukGeo.translate(0, 0, -0.55);
  const topMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff9a3c).multiplyScalar(1.3), toneMapped: false, fog: false });
  const kuyrukMat = new THREE.MeshBasicMaterial({ color: 0xff6a1a, transparent: true, opacity: 0.45, depthWrite: false });
  const toplar = [];
  for (let i = 0; i < 12; i++) {
    const m = new THREE.Group(); m.add(new THREE.Mesh(topGeo, topMat)); m.add(new THREE.Mesh(kuyrukGeo, kuyrukMat)); m.visible = false; sahne.add(m);
    toplar.push({ m, konum: m.position, aktif: false, hiz: V(), omur: 0 });
  }
  function topAt(kaynak, hedef) {
    const t = toplar.find(x => !x.aktif); if (!t) return;
    t.aktif = true; t.omur = 9; t.m.visible = true; t.m.position.copy(kaynak);
    t.hiz.copy(hedef).sub(kaynak).normalize().multiplyScalar(9);
    t.m.lookAt(TMP.copy(kaynak).add(t.hiz));
  }
  function toplariGuncelle(dt, p) {
    for (const t of toplar) {
      if (!t.aktif) continue;
      t.omur -= dt; t.m.position.addScaledVector(t.hiz, dt);
      TMP.copy(p).y += 1;
      let son = t.omur <= 0;
      if (!son && t.m.position.distanceTo(TMP) < 1.2) { G.oyuncu?.hasarAl?.(5, t.m.position); son = true; }
      if (!son && G.sehir?.carpis) { const r = G.sehir.carpis(t.m.position, 0.25); if (r && (r.duvar || r.normal)) son = true; }
      if (son) { kivilcim(t.m.position, 0xffa040, 6, 4); t.aktif = false; t.m.visible = false; }
    }
  }

  // ---------- jöle mermisi (oyuncu 'atis') ----------
  const jGeo = new THREE.SphereGeometry(0.25, 14, 10);
  const jMat = new THREE.MeshPhysicalMaterial({ color: 0x030205, roughness: 0.15, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, emissive: 0x2a0a50, emissiveIntensity: 0.35, sheen: 1, sheenColor: new THREE.Color(0x9a50ff) });
  const jIzGeo = new THREE.ConeGeometry(0.2, 1.6, 8); jIzGeo.rotateX(-Math.PI / 2); jIzGeo.translate(0, 0, -0.8);
  const jIzMat = new THREE.MeshBasicMaterial({ color: 0x8a3cff, transparent: true, opacity: 0.4, depthWrite: false });
  const mermiler = [];
  for (let i = 0; i < 40; i++) {
    const m = new THREE.Group(); m.add(new THREE.Mesh(jGeo, jMat)); m.add(new THREE.Mesh(jIzGeo, jIzMat)); m.visible = false; sahne.add(m);
    mermiler.push({ m, aktif: false, hiz: V(), omur: 0, guc: 1, hedef: null, bas: V() });
  }
  const hJole = havuz(new THREE.SphereGeometry(0.1, 7, 6), new THREE.MeshStandardMaterial({ color: 0x07030c, roughness: 0.2, metalness: 0.3, emissive: 0x3a1070, emissiveIntensity: 0.5 }), 120, 14);
  function jole(konum, n = 8, hizi = 5) {
    for (let j = 0; j < n; j++) {
      KV.set(rnd(-1, 1), rnd(-0.2, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(0.4, 1) * hizi);
      ekle(hJole, konum.x, konum.y, konum.z, KV.x, KV.y + 1.5, KV.z, rnd(0.35, 0.7), rnd(0.5, 1.2), -1000);
    }
  }
  // duvar lekeleri
  const lekeGeo = new THREE.CircleGeometry(0.35, 14);
  const lekeler = [];
  for (let i = 0; i < 30; i++) {
    const m = new THREE.Mesh(lekeGeo, new THREE.MeshBasicMaterial({ color: 0x0a0410, transparent: true, opacity: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide }));
    m.visible = false; sahne.add(m); lekeler.push({ m, omur: 0 }); 
  }
  let lekeNo = 0;
  function lekeBirak(nokta, normal) {
    const l = lekeler[lekeNo]; lekeNo = (lekeNo + 1) % lekeler.length;
    l.omur = 3; l.m.visible = true; l.m.material.opacity = 0.9;
    l.m.position.copy(nokta).addScaledVector(normal, 0.03);
    l.m.lookAt(TMP.copy(nokta).add(normal)); l.m.scale.setScalar(rnd(0.8, 1.3));
  }
  let isabetSay = 0, dronYenilenSay = 0;
  function mermiAt(v) {
    if (!v || !v.baslangic || !v.yon) return;
    const t = mermiler.find(x => !x.aktif); if (!t) return;
    t.aktif = true; t.omur = 2.2; t.guc = v.guc || 1; t.hedef = v.hedef || null;
    t.hiz.copy(v.yon).normalize().multiplyScalar(90);
    t.bas.copy(v.baslangic);
    t.m.position.copy(v.baslangic); t.m.visible = true; t.m.lookAt(TMP.copy(v.baslangic).add(t.hiz));
  }
  function mermiIsabet(t, e, nokta) {
    isabetSay++; if (G.test) console.log('[DUSMAN] mermi isabet ' + isabetSay + ', dron yenildi ' + dronYenilenSay);
    jole(nokta, 10, 6);
    G.olay.emit('isabet', { konum: nokta.clone(), tur: e.tur });
    const yon = TMP2.copy(t.hiz).normalize().clone();
    if (e.dev) {
      const ileri = TMP3.set(Math.sin(e.yaw), 0, Math.cos(e.yaw));
      TMP.copy(t.bas).sub(e.konum).setY(0).normalize();
      if (ileri.dot(TMP) < -0.2) { vur(e, 15 * t.guc, yon); e.sersem = 0.6; }
      else if (G.t - sonUyari > 4) { sonUyari = G.t; msj('Sırtındaki parlayan pili vur! Arkasına geç!', 3); }
      return;
    }
    const dmg = e.tur === 'dron' ? 35 : e.tur === 'kamyonet' ? 10 : 20;
    vur(e, dmg * t.guc, yon);
  }
  function mermileriGuncelle(dt) {
    for (const l of lekeler) if (l.omur > 0) { l.omur -= dt; l.m.material.opacity = Math.min(0.9, l.omur * 1.2); if (l.omur <= 0) l.m.visible = false; }
    for (const t of mermiler) {
      if (!t.aktif) continue;
      t.omur -= dt;
      // hafif güdüm
      if (t.hedef && t.hedef.canli) {
        merkez(t.hedef, TMP).sub(t.m.position).normalize();
        TMP2.copy(t.hiz).normalize();
        const ac = Math.acos(Math.max(-1, Math.min(1, TMP.dot(TMP2))));
        if (ac > 1e-3) { const k = Math.min(1, 2.2 * dt / ac); TMP2.lerp(TMP, k).normalize(); t.hiz.copy(TMP2).multiplyScalar(90); }
      }
      const adim = 90 * dt;
      KV.copy(t.m.position);
      let son = t.omur <= 0, isabetE = null;
      // düşman: segment-küre
      TMP2.copy(t.hiz).normalize();
      let enT = adim;
      for (const e of liste) {
        if (!e.canli) continue;
        merkez(e, TMP).sub(KV);
        const pr = TMP.dot(TMP2), c = Math.max(0, Math.min(adim, pr));
        const yk = TMP3.copy(TMP2).multiplyScalar(c).sub(TMP).length();
        if (yk < e.yr + 0.25 && c <= enT) { enT = c; isabetE = e; }
      }
      // bina / zemin
      let duvar = null, dN = null, dT = adim + 1;
      const sh = G.sehir;
      if (sh?.ankrajBul) {
        const r = sh.ankrajBul(KV, TMP2, adim + 0.3);
        if (r) { dT = r.nokta.distanceTo(KV); duvar = r.nokta.clone(); dN = r.normal.clone(); }
      }
      const yeni = KV.clone().addScaledVector(TMP2, adim);
      if (!duvar && sh?.zeminY && yeni.y < sh.zeminY(yeni.x, yeni.z) + 0.1) { duvar = yeni.clone(); duvar.y = sh.zeminY(yeni.x, yeni.z); dN = V(0, 1, 0); dT = adim; }
      if (isabetE && enT <= dT) {
        const nok = KV.clone().addScaledVector(TMP2, enT);
        mermiIsabet(t, isabetE, nok); son = true;
      } else if (duvar) {
        jole(duvar, 6, 4); lekeBirak(duvar, dN); son = true;
      } else t.m.position.copy(yeni);
      if (!son) t.m.lookAt(TMP.copy(t.m.position).add(t.hiz));
      if (son) { t.aktif = false; t.m.visible = false; }
    }
  }
  G.olay.on('atis', mermiAt);

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
    parca(gKure, mDron, 0.5, 0.2, 0.5, 0, 0, 0, ic);                 // gövde
    parca(gKutu, mDronKol, 0.5, 0.06, 0.5, 0, 0.17, 0, ic);          // üst kapak
    const perve = [];
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2, kx = Math.sin(a), kz = Math.cos(a);
      const kol = parca(gKutu, mDronKol, 0.09, 0.07, 1.0, kx * 0.55, 0.02, kz * 0.55, ic); kol.rotation.y = a;
      parca(gSil, mDronKol, 0.12, 0.2, 0.12, kx * 1.05, 0.08, kz * 1.05, ic);
      const pg = new THREE.Group(); pg.position.set(kx * 1.05, 0.2, kz * 1.05); ic.add(pg);
      parca(gDisk, mPerve, 0.5, 1, 0.5, 0, 0, 0, pg);
      parca(gKutu, mPerveKanat, 1.15, 0.015, 0.09, 0, 0.01, 0, pg);
      perve.push(pg);
    }
    parca(gKure, mDronKol, 0.16, 0.16, 0.16, 0, -0.2, 0.08, ic);     // kamera yuvası
    const gozMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2a14).multiplyScalar(2), toneMapped: false });
    const goz = parca(gKure, gozMat, 0.07, 0.07, 0.07, 0, -0.27, 0.13, ic);
    parca(gKure, mDronYan, 0.04, 0.04, 0.04, 0.5, 0.0, 0.0, ic);
    parca(gKure, mDronYan2, 0.04, 0.04, 0.04, -0.5, 0.0, 0.0, ic);
    return { g, ic, perve, goz, gozMat };
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
    else if (tur === 'dron') { m = dronYap(); e.oy = 0; e.yr = 0.9; Object.assign(e, { ic: m.ic, perve: m.perve, goz: m.goz, gozMat: m.gozMat }); e.olcek = 1; }
    else { m = kamyonetYap(); e.oy = 1.2; e.yr = 1.8; Object.assign(e, { ic: m.ic, tek: m.tek }); e.olcek = 1; }
    e.grup = m.g; m.g.visible = false; sahne.add(m.g);
    e.id = liste.length; e.flash = 0; e.olumT = 0;
    liste.push(e); modelTak(e); return e;
  }
  function aktifSay(tur) { let n = 0; for (const e of liste) if (e.canli && (!tur || e.tur === tur) && !e.dev) n++; return n; }
  function toplamAktif() { let n = 0; for (const e of liste) if (e.canli) n++; return n; }

  function etkinlestir(e, konum) {
    e.konum.copy(konum); e.canli = true; e.grup.visible = true;
    e.sersem = 0; e.cekil = 0; e.vy = 0; e.sal = -1; e.vurus = 0; e.pop = 0; e.itme.set(0, 0, 0); e.bekle = rnd(0.8, 2);
    e.olumT = 0; e.flash = 0; parlat(e, false); e.hava = false;
    if (e.mixer) { e.mixer.stopAllAction(); e.cur = null; oyna(e, 'dur', false, 1, 0); }
    if (e.tur === 'robot') { e.canMax = e.dev ? 100 : 40; e.hizMax = e.dev ? 3 : rnd(3.2, 4.2); }
    else if (e.tur === 'dron') { e.canMax = 40; e.hizMax = 8; e.yar = rnd(8, 15); e.dusuyor = false; e.grup.rotation.set(0, 0, 0); }
    else { e.canMax = 75; e.hizMax = 13; }
    e.can = e.canMax; e.grup.position.copy(e.konum);
    return e;
  }
  function al(tur) {
    let e = liste.find(x => !x.canli && !x.dusuyor && !(x.olumT > 0) && x.tur === tur && !x.dev);
    return e || olusturVarlik(tur, false);
  }

  function dogmaNoktasi(tur) {
    const p = oyuncuKonum(), s = G.sehir;
    for (let i = 0; i < 8; i++) {
      let v = null;
      if (tur === 'dron') break;
      if (s) v = tur === 'dron' ? s.rastgeleCati?.() : (Math.random() < 0.7 ? s.sokakNoktasi?.() : s.rastgeleCati?.());
      if (!v) break;
      const d = Math.hypot(v.x - p.x, v.z - p.z);
      if (d >= 40 && d <= 120) return v.clone();
    }
    const a = rnd(0, 6.283), r = tur === 'dron' ? rnd(25, 50) : rnd(45, 100);
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
    if (tur === 'dron') { v.y = Math.max(v.y, zemin(v.x, v.z)) + rnd(8, 16); }
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
    e.canli = false;
    if (e.tur === 'dron') { e.dusuyor = true; e.vy = 2; e.dvx = rnd(-2, 2); e.dvz = rnd(-2, 2); e.dron = true; dronYenilenSay++; }
    else if (e.act?.ol) {                       // yenilme animasyonu, sonra cıvata-yay parçalanması
      e.olumT = e.dev ? 1.9 : 1.0; e.sal = -1;
      const ts = Math.max(0.4, e.clip.ol / e.olumT); oyna(e, 'ol', true, ts, 0.08);
      e.w.rotation.z = 0;
    } else {
      e.grup.visible = false;
      merkez(e, TMP3);
      patlat(TMP3, e.dev ? 3.5 : e.tur === 'kamyonet' ? 2 : 1, e.konum.y);
    }
    G.olay.emit('robotYenildi', { konum: e.konum.clone(), tur: e.tur, dev: e.dev });
    G.oyuncu?.gucEkle?.(e.dev ? 50 : 15);
  }
  function dusenleriGuncelle(dt) {
    for (const e of liste) {
      if (e.olumT > 0) {                        // animasyonlu yenilme
        e.olumT -= dt; e.mixer?.update(dt);
        if (e.itme.lengthSq() > 0.01) { e.konum.x += e.itme.x * dt; e.konum.z += e.itme.z * dt; e.itme.multiplyScalar(Math.max(0, 1 - 4 * dt)); }
        const gy = zemin(e.konum.x, e.konum.z);
        if (e.konum.y > gy + 0.01 || e.vy > 0) { e.vy -= 25 * dt; e.konum.y += e.vy * dt; if (e.konum.y <= gy) { e.konum.y = gy; e.vy = 0; } } else e.konum.y = gy;
        e.grup.position.copy(e.konum);
        if (e.flash > 0) { e.flash -= dt; if (e.flash <= 0) parlat(e, false); }
        if (e.olumT <= 0) { e.grup.visible = false; merkez(e, TMP3); patlat(TMP3, e.dev ? 3.5 : 1, e.konum.y); }
        continue;
      }
      if (!e.dusuyor) continue;
      e.vy -= 22 * dt; e.konum.y += e.vy * dt; e.konum.x += e.dvx * dt; e.konum.z += e.dvz * dt;
      e.yaw += 9 * dt; e.grup.rotation.set(0.5 * Math.sin(G.t * 7), e.yaw, 0.9);
      e.grup.position.copy(e.konum);
      for (let i = 0; i < 4; i++) e.perve[i].rotation.y += 0.2;
      if (Math.random() < 0.5) kivilcim(e.konum, 0xff9040, 1, 3);
      const gy = zemin(e.konum.x, e.konum.z);
      if (e.konum.y <= gy + 0.3) {
        e.dusuyor = false; e.grup.visible = false; e.grup.rotation.set(0, 0, 0);
        TMP3.set(e.konum.x, gy + 0.3, e.konum.z); patlat(TMP3, 1.4, gy);
      }
    }
  }
  function vur(e, miktar, yon, itmeK = 6, havaya = false) {
    e.can -= miktar; e.pop = 0.25;
    if (!e.dev) e.itme.addScaledVector(yon, e.tur === 'kamyonet' ? 0 : itmeK);
    if (havaya && !e.dev && e.tur === 'robot') { e.vy = 13; e.konum.y += 0.05; e.itme.multiplyScalar(1.3); }
    if (e.mats) { e.flash = 0.08; parlat(e, true); }
    if (e.act?.hasar && e.can > 0 && e.sal < 0) oyna(e, 'hasar', true, e.dev ? 1.6 : 2.6, 0.05);
    if (e.tur === 'kamyonet') e.sersem = 1.5;
    kivilcim(merkez(e, TMP3), 0xffd060, 5, 5);
    if (e.can <= 0) yen(e);
  }

  G.olay.on('devBasla', () => { devAcik = true; });
  G.olay.on('devBit', () => { devAcik = false; });
  G.olay.on('yumruk', v => {
    if (!v || !v.konum || !v.yon) return;
    const yon = TMP2.copy(v.yon).normalize().clone();
    const menz = devAcik ? 6 : 3, bit = !!v.bitirici, kombo = Math.max(1, v.komboNo | 0 || 1);
    const dmg = (devAcik ? 50 : 25) * (bit ? 1.5 : 1), itK = 5 + kombo * 1.5 + (bit ? 4 : 0);
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
        if (ileri.dot(TMP2) < -0.2) { vur(e, (devAcik ? 40 : 20) * (bit ? 1.5 : 1), TMP); e.sersem = 1.0; }
        else if (G.t - sonUyari > 4) { sonUyari = G.t; msj('Sırtındaki parlayan pili vur! Arkasına geç!', 3); }
      } else vur(e, dmg, TMP, itK, bit);
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
  const yuruyorMu = (e, d, dev) => d > (dev ? 7 : 2.4);
  // patron yere vurma: şok dalgası (zıplayarak kaçılır, hasar düşük)
  const sokHalka = [];
  const sokGeo = new THREE.RingGeometry(0.93, 1, 48); sokGeo.rotateX(-Math.PI / 2);
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(sokGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff9a3c).multiplyScalar(1.4), transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    m.visible = false; sahne.add(m); sokHalka.push({ m, aktif: false, r: 0, x: 0, y: 0, z: 0, vurdu: false });
  }
  function sokDalgasi(e) {
    const h = sokHalka.find(x => !x.aktif) || sokHalka[0];
    h.aktif = true; h.r = 1; h.vurdu = false; h.x = e.konum.x + Math.sin(e.yaw) * 4; h.z = e.konum.z + Math.cos(e.yaw) * 4; h.y = e.konum.y;
    h.m.visible = true;
    TMP.set(h.x, h.y + 0.3, h.z); kivilcim(TMP, 0xffc070, 14, 7);
  }
  function sokGuncelle(dt) {
    const p = oyuncuKonum();
    for (const h of sokHalka) {
      if (!h.aktif) continue;
      const eski = h.r; h.r += 15 * dt;
      h.m.position.set(h.x, h.y + 0.15, h.z); h.m.scale.setScalar(h.r); h.m.material.opacity = Math.max(0, 0.85 * (1 - h.r / 18));
      const dd = Math.hypot(p.x - h.x, p.z - h.z);
      if (!h.vurdu && dd >= eski - 0.7 && dd <= h.r + 0.7 && p.y - h.y < 1.2) { h.vurdu = true; TMP.set(h.x, h.y, h.z); G.oyuncu?.hasarAl?.(8, TMP); }
      if (h.r > 18) { h.aktif = false; h.m.visible = false; }
    }
  }
  function robotGuncelle(e, dt, p, dx, dz, d) {
    const dev = e.dev;
    if (e.sersem > 0) { e.sersem -= dt; e.sal = -1; }
    else if (e.cekil <= 0) {
      const hy = Math.atan2(dx, dz);
      const don = (dev ? 0.7 : 3) * dt, f = aciFark(e.yaw, hy);
      e.yaw += Math.max(-don, Math.min(don, f));
      const dur = dev ? 7 : 2.4;
      let yuruyor = false;
      if (d > dur && e.sal < 0) { yuruyor = true; const h = e.hizMax; e.konum.x += Math.sin(e.yaw) * h * dt; e.konum.z += Math.cos(e.yaw) * h * dt; e.faz += dt * h * 2.6; }
      e.bekle -= dt;
      const menz = dev ? 9 : 3.2;
      if (e.sal < 0 && e.bekle <= 0 && d < menz) { e.sal = dev ? 1.1 : 0.55; e.salSure = e.sal; if (e.act?.sal) oyna(e, 'sal', true, Math.max(0.6, (e.clip.sal || 1) / (e.salSure + 0.15)), 0.1); yuruyor = false; }
      if (e.sal >= 0) {
        e.sal -= dt;
        if (e.sal < 0) {
          e.vurus = 0.3; e.bekle = dev ? 3 : 1.8;
          if (dev) sokDalgasi(e); else if (d < menz + 0.8 && Math.abs(p.y - e.konum.y) < 5) G.oyuncu?.hasarAl?.(5, e.konum);
          kivilcim(TMP.set(e.konum.x + Math.sin(e.yaw) * 1.2 * e.olcek, e.konum.y + 0.4, e.konum.z + Math.cos(e.yaw) * 1.2 * e.olcek), 0xffc070, dev ? 12 : 4, 4);
        }
      }
    } else {
      e.cekil -= dt;
      TMP.set(p.x - e.konum.x, 0, p.z - e.konum.z);
      if (TMP.length() > 2) { TMP.normalize(); e.konum.addScaledVector(TMP, 35 * dt); }
    }
    // animasyon seçimi (modelli)
    if (e.mixer && e.sal < 0 && !(e.tekT > 0)) {
      if (e.sersem > 0 || e.cekil > 0) oyna(e, 'dur', false, 1, 0.12);
      else if (yuruyorMu(e, d, dev)) oyna(e, e.hizMax > 3.9 && !dev ? 'kos' : 'yuru', false, dev ? 0.8 : (e.hizMax > 3.9 ? 1.0 : 1.25), 0.2);
      else oyna(e, 'dur', false, 1, 0.2);
    }
    if (e.w) e.w.rotation.z = e.sersem > 0 ? Math.sin(G.t * 25) * 0.08 : 0;
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
    if (e.pil.visible) { const b = e.pilBaz || { x: 0.5, y: 0.7, z: 0.15 }; e.pil.scale.set(b.x, b.y * (1 + 0.12 * Math.sin(G.t * 6)), b.z); }
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
      const hyy = Math.max(p.y + 4.5, gy + 6) + Math.sin(G.t * 1.3 + e.faz) * 1.2;
      TMP.set(hx - e.konum.x, hyy - e.konum.y, hz - e.konum.z);
      const l = TMP.length();
      if (l > 0.5) e.konum.addScaledVector(TMP, Math.min(e.hizMax, l * 0.8) * dt / l);
      e.yaw += aciFark(e.yaw, Math.atan2(p.x - e.konum.x, p.z - e.konum.z)) * Math.min(1, dt * 3);
      e.bekle -= dt;
      const d3 = e.konum.distanceTo(p);
      let par = 1;
      if (e.bekle < 2.5 && d3 < 60) par = 1 + 0.6 * (Math.sin(G.t * (8 + (2.5 - e.bekle) * 6)) > 0 ? 1 : 0.2);
      e.goz.scale.setScalar(0.07 * par);
      if (e.model) { e.gozMat.color.setRGB(0.7 * par, 0.04, 0.03); if (e.flash <= 0) e.gozMat.emissive.setRGB(0.5 * par * par, 0.03, 0.02); }
      else e.gozMat.color.setRGB(2 * par * 0.7, 0.12, 0.08);
      if (e.bekle <= 0) {
        e.bekle = rnd(4.5, 6.5);
        if (d3 < 60) { topAt(TMP.set(e.konum.x, e.konum.y - 0.3, e.konum.z), TMP2.copy(p).setY(p.y + 1)); if (e.act?.sal) oyna(e, 'sal', true, 1.6, 0.1); }
      }
    }
    e.faz += dt * 40;
    for (let i = 0; i < 4; i++) e.perve[i].rotation.y = e.faz * (i & 1 ? 1 : -1);
    e.ic.rotation.z = Math.sin(G.t * 2 + e.ang) * 0.08 + (e.sersem > 0 ? Math.sin(G.t * 30) * 0.2 : 0);
    e.ic.rotation.x = Math.sin(G.t * 1.7 + e.faz) * 0.06; e.ic.position.y = Math.sin(G.t * 2.4 + e.ang) * 0.12;
    if (e.w) { e.w.rotation.x = e.ic.rotation.x; e.w.rotation.z = e.ic.rotation.z; e.w.position.y = e.ic.position.y; if (e.mixer && !(e.tekT > 0)) oyna(e, 'dur', false, 1.4, 0.2); }
    if (G.sehir?.carpis) {
      const r = G.sehir.carpis(e.konum, 1.0);
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
    // animasyon güncelleme: uzaktakiler seyrek
    if (e.mixer) {
      e.mdt += dt; if (e.tekT > 0) e.tekT -= dt;
      const sk = d > 80 ? 4 : d > 45 ? 2 : 1;
      if (((kare + e.id) % sk) === 0) { e.mixer.update(e.mdt); e.mdt = 0; }
    }
    if (e.flash > 0) { e.flash -= dt; if (e.flash <= 0) parlat(e, false); }
    // çok uzaktakini geri dönüştür (patron ve kamyonet hariç)
    if (!e.dev && e.tur !== 'kamyonet' && d > (e.tur === 'dron' ? 90 : 130)) { e.canli = false; g.visible = false; }
  }

  let kare = 0;
  let dogmaSayac = 0, logSayac = 0, testSayac = 0, testKuruldu = false;
  G.dusman = {
    liste,
    modeller,
    mermiler: toplar,                 // düşman mermileri [{konum, hiz, aktif}] (kaçış için)
    oyuncuMermileri: mermiler,
    robotHedef: 4, dronHedef: 3, dogmaCarpani: 1,
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
    if (new URLSearchParams(location.search).has('modelfoto')) { // geçici: robot/dron/patron/kamyonet yakın görüntü
      const q = new URLSearchParams(location.search).get('modelfoto');
      const r = dogur('robot', [6, 6]); r.vitrin = true; const d = dogur('dron', [6, 6]); d.vitrin = true; d.yar = 5;
      const dv = G.dusman.dev(V(0, 0, 0)); const kam = G.dusman.olustur('kamyonet', V(0, 0, 0)); kam.vitrin = true;
      G.dusman.foto = { r, d, dv, kam, q };
    }
    if (new URLSearchParams(location.search).has('dronfoto')) { // geçici: yakın görüntü
      const e = dogur('dron', [6, 6]); e.vitrin = true; e.yar = 5; G.dusman.dronFoto = e;
    }
  }

  G.olay.on('robotYenildi', v => { if (G.test && v.tur !== 'kamyonet') console.log('[DUSMAN] robot yenildi:', v.tur); });

  for (const ad of Object.keys(KAYNAK)) modelYukle(ad);

  if (!G.sehir) sahne.add(new THREE.HemisphereLight(0xb0a0ff, 0x402010, 1.6)); // şehir yoksa yedek ışık

  const _guncelle = function (G2, dt) {
    if (G2.durum !== 'oyun') return;
    if (G2.test && !testKuruldu) testKurulum();
    // doğma
    dogmaSayac -= dt;
    if (dogmaSayac <= 0) {
      dogmaSayac = 0.6 / G.dusman.dogmaCarpani;
      if (toplamAktif() < MAX_AKTIF) {
        G.dusman.dronHedef = Math.min(6, 3 + Math.floor(G2.t / 60));
        G.dusman.robotHedef = Math.min(8, 4 + Math.floor(G2.t / 60));
        if (aktifSay('dron') < G.dusman.dronHedef) dogur('dron');
        else if (aktifSay('robot') < G.dusman.robotHedef) dogur('robot');
      }
    }
    kare++;
    for (const e of liste) if (e.canli) varlikGuncelle(e, dt);
    sokGuncelle(dt);
    toplariGuncelle(dt, oyuncuKonum());
    havuzGuncelle(hCivata, dt); havuzGuncelle(hYay, dt); havuzGuncelle(hKivilcim, dt); havuzGuncelle(hJole, dt);
    mermileriGuncelle(dt); dusenleriGuncelle(dt);
    if (G.dusman.foto) {
      const F = G.dusman.foto, k = G2.kamera; k.getWorldDirection(TMP2); TMP2.y = 0; TMP2.normalize();
      const yan = TMP3.set(-TMP2.z, 0, TMP2.x), yaw = Math.atan2(-TMP2.x, -TMP2.z), p0 = k.position;
      const yerle = (e, ileri, sag, yuk, y2) => { e.canli = true; e.grup.visible = true; e.can = 999; e.konum.set(p0.x + TMP2.x * ileri + yan.x * sag, y2 ?? (p0.y - 1.6 + (yuk || 0) + 6), p0.z + TMP2.z * ileri + yan.z * sag); e.grup.position.copy(e.konum); e.yaw = yaw + (e.tur === 'kamyonet' ? 0.6 : 0); e.grup.rotation.y = e.yaw; e.sersem = 0; };
      const q = F.q;
      if (G.kahraman?.grup) G.kahraman.grup.visible = false;
      if (!F.isik) { F.isik = new THREE.PointLight(0xfff0e0, 14, 40, 1.5); sahne.add(F.isik); }
      F.isik.position.set(p0.x + TMP2.x * 1.5 + yan.x * 2, p0.y + 2, p0.z + TMP2.z * 1.5 + yan.z * 2);
      if (q === 'p' || q === 'pa') { F.isik.intensity = 60; F.isik.distance = 120; F.isik.position.set(p0.x + TMP2.x * 12, p0.y + 8, p0.z + TMP2.z * 12); }
      if (q === '1' || q === 'r') { yerle(F.r, 4.5, 0, 0, p0.y - 2.2); F.d.canli = false; F.d.grup.visible = false; F.dv.canli = false; F.dv.grup.visible = false; F.kam.canli = false; F.kam.grup.visible = false; }
      else if (q === 'd') { yerle(F.d, 4, 0, 0, p0.y - 0.3); F.r.canli = false; F.r.grup.visible = false; F.dv.canli = false; F.dv.grup.visible = false; F.kam.canli = false; F.kam.grup.visible = false; }
      else if (q === 'p') { yerle(F.dv, 18, 0, 0, p0.y - 2.3); F.r.canli = false; F.r.grup.visible = false; F.d.canli = false; F.d.grup.visible = false; F.kam.canli = false; F.kam.grup.visible = false; }
      else if (q === 'pa') { yerle(F.dv, 18, 0, 0, p0.y - 2.3); F.dv.yaw = yaw + Math.PI; F.dv.grup.rotation.y = F.dv.yaw; F.r.canli = false; F.r.grup.visible = false; F.d.canli = false; F.d.grup.visible = false; F.kam.canli = false; F.kam.grup.visible = false; }
      else if (q === 'k') { yerle(F.kam, 10, 0); F.r.canli = false; F.r.grup.visible = false; F.d.canli = false; F.d.grup.visible = false; F.dv.canli = false; F.dv.grup.visible = false; }
    }
    if (G.dusman.dronFoto) { const f = G.dusman.dronFoto, k = G2.kamera; f.canli = true; f.grup.visible = true; k.getWorldDirection(TMP); f.konum.copy(k.position).addScaledVector(TMP, 3.2); f.konum.y -= 0.5; f.grup.position.copy(f.konum); f.can = 999; f.yaw = Math.atan2(TMP.x, TMP.z); f.grup.rotation.y = f.yaw + 2.6; f.grup.rotation.x = 0.35; }

    if (G2.test) {
      logSayac -= dt; testSayac -= dt;
      if (logSayac <= 0) { logSayac = 2; console.log('[DUSMAN] aktif ' + toplamAktif() + ' | mermi isabet ' + isabetSay + ', dron yenildi ' + dronYenilenSay); }
      if (!G2.__atisT) G2.__atisT = 0;
      G2.__atisT -= dt;
      if (G2.__atisT <= 0) {
        G2.__atisT = 0.6;
        const pk = oyuncuKonum(); let dr = null, dd = 1e9;
        if (G.dusman.dronFoto) dd = -1;
        for (const e of liste) { if (!e.canli || e.tur !== 'dron') continue; const q = e.konum.distanceTo(pk); if (q < dd) { dd = q; dr = e; } }
        if (dr && dd !== -1) {
          const bas = V(pk.x, pk.y + 1.3, pk.z), yon = dr.konum.clone().sub(bas).normalize();
          G.olay.emit('atis', { baslangic: bas, yon, guc: 1, hedef: dr }); console.log('[DUSMAN] atis dr=' + dd.toFixed(1) + ' aktifMermi=' + mermiler.filter(x => x.aktif).length);
        }
      }
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
