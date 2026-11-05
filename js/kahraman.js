// Zifir — prosedürel jöle kahraman (SOZLESME §4). Ön yüz +Z, sol el +X.
import * as THREE from 'three';

const V3 = THREE.Vector3;
const kisitla = (x, a, b) => Math.min(b, Math.max(a, x));
const yumus = (a, b, x) => { const t = kisitla((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const HIP = 0.88;
const QS = new URLSearchParams(location.search);

// ---------- yansıma ortamı (kendi malzemem için, sahneye dokunmaz) ----------
function envKur(renderer) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(24, 24, 24), new THREE.MeshBasicMaterial({ color: 0x1c0e40, side: THREE.BackSide })));
  const panel = (w, h, renk, k, x, y, z) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(Math.min(w, h) / 2, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(renk).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  };
  panel(14, 6, 0xb890ff, 2.2, -9, 3, 6);
  panel(6, 14, 0xc8f0ff, 2.2, 10, 1, 3);
  panel(16, 6, 0xffffff, 3, 0, 10, -1);
  panel(7, 3, 0xb070ff, 2, 3, 2, -10);
  panel(14, 3, 0x6a28c8, 2.5, 0, -10, 2);
  panel(4, 6, 0xffffff, 2.5, -7, 1, -6);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.09);
  pm.dispose();
  return rt.texture;
}

// ---------- jöle malzeme: akan dalga + damar çizgileri ----------
function jeleMat(uni, envMap) {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0x030307, roughness: 0.1, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.04,
    iridescence: 0.1, iridescenceIOR: 1.35, iridescenceThicknessRange: [120, 420],
    envMap, envMapIntensity: 0.75, emissive: 0x0a0216,
  });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uT; uniform float uAmp; varying vec3 vOP;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vOP = position;
        float w = sin(position.y*8.0+uT*1.7+position.x*5.0)*0.5 + sin(position.z*10.0-uT*2.3+position.y*5.0)*0.5;
        transformed += normal * w * uAmp;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uT; uniform float uDev; uniform float uFlash; varying vec3 vOP;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float ak = sin(vOP.y*6.5 + sin(vOP.x*8.0+vOP.z*6.0+uT*0.7)*1.7 - uT*1.1);
        float damar = 1.0 - smoothstep(0.0, 0.09, abs(ak));
        totalEmissiveRadiance += mix(vec3(0.30,0.07,0.65), vec3(0.0,1.1,1.0), uDev)*damar*(0.07+2.2*uDev) + vec3(0.9,0.35,1.2)*uFlash;
        float fr = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 3.0);
        totalEmissiveRadiance += mix(vec3(0.22,0.07,0.55), vec3(0.0,0.5,0.55), uDev) * fr * 0.3;`);
  };
  m.customProgramCacheKey = () => 'zifirjele1';
  return m;
}

// ---------- sabit segmentli tüp (konum özniteliği güncellenir) ----------
class Tup {
  constructor(n, R, mat) {
    this.n = n; this.R = R;
    this.pos = new Float32Array(n * R * 3);
    const g = this.geo = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    const idx = [];
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < R; j++) {
      const a = i * R + j, b = i * R + (j + 1) % R, c = (i + 1) * R + j, d = (i + 1) * R + (j + 1) % R;
      idx.push(a, b, c, b, d, c);
    }
    g.setIndex(idx);
    this.cs = Array.from({ length: R }, (_, j) => [Math.cos(j / R * Math.PI * 2), Math.sin(j / R * Math.PI * 2)]);
    this.mesh = new THREE.Mesh(g, mat); this.mesh.frustumCulled = false;
    this.t = new V3(); this.nn = new V3(); this.bb = new V3(); this.tmp = new V3();
  }
  guncelle(pts, r0, r1, uc) {
    const { n, R, pos, t, nn, bb, tmp, cs } = this;
    for (let i = 0; i < n; i++) {
      t.copy(pts[Math.min(i + 1, n - 1)]).sub(pts[Math.max(i - 1, 0)]);
      if (t.lengthSq() < 1e-10) t.set(0, 1, 0);
      t.normalize();
      if (i === 0) { nn.set(0, 1, 0); if (Math.abs(t.y) > 0.9) nn.set(1, 0, 0); }
      nn.sub(tmp.copy(t).multiplyScalar(nn.dot(t)));
      if (nn.lengthSq() < 1e-8) nn.set(1, 0, 0).sub(tmp.copy(t).multiplyScalar(t.x));
      nn.normalize();
      bb.crossVectors(t, nn);
      const u = i / (n - 1);
      let r = r0 + (r1 - r0) * u;
      if (i === n - 1) r *= uc;
      const p = pts[i];
      for (let j = 0; j < R; j++) {
        const c = cs[j][0] * r, s = cs[j][1] * r, o = (i * R + j) * 3;
        pos[o] = p.x + nn.x * c + bb.x * s; pos[o + 1] = p.y + nn.y * c + bb.y * s; pos[o + 2] = p.z + nn.z * c + bb.z * s;
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.computeVertexNormals();
  }
}

// ---------- hız izi (parıltılı şerit) ----------
class Iz {
  constructor(yOff, sahne) {
    this.y = yOff; this.N = 30; this.pts = [];
    const N = this.N, g = new THREE.BufferGeometry();
    this.pos = new Float32Array(N * 6); this.col = new Float32Array(N * 6);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    const idx = [];
    for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    this.mesh.frustumCulled = false; this.mesh.visible = false; sahne.add(this.mesh);
    this.d = new V3(); this.v = new V3(); this.sd = new V3();
  }
  temizle() { this.pts.length = 0; this.mesh.visible = false; }
  guncelle(t, konum, k, dev, kamPos, genis) {
    const pts = this.pts, N = this.N, life = dev ? 0.6 : 0.42;
    const son = pts[pts.length - 1];
    if (son && Math.hypot(son.x - konum.x, son.y - (konum.y + this.y), son.z - konum.z) > 6) pts.length = 0;
    const l = pts[pts.length - 1];
    if (k > 0.03 && (!l || Math.hypot(l.x - konum.x, l.y - (konum.y + this.y), l.z - konum.z) > 0.07)) pts.push({ x: konum.x, y: konum.y + this.y, z: konum.z, t });
    while (pts.length && (t - pts[0].t > life || pts.length > N)) pts.shift();
    const m = pts.length;
    if (m < 2) { this.mesh.visible = false; return; }
    this.mesh.visible = true;
    const { pos, col, d, v, sd } = this;
    for (let i = 0; i < N; i++) {
      const s = Math.max(m - 1 - i, 0), p = pts[s];
      const age = i < m ? kisitla((t - p.t) / life, 0, 1) : 1;
      const q = pts[Math.min(s + 1, m - 1)], q0 = pts[Math.max(s - 1, 0)];
      d.set(q.x - q0.x, q.y - q0.y, q.z - q0.z);
      if (d.lengthSq() < 1e-8) d.set(0, 0, 1);
      v.set(p.x - kamPos.x, p.y - kamPos.y, p.z - kamPos.z);
      sd.crossVectors(d, v);
      if (sd.lengthSq() < 1e-10) sd.set(0, 1, 0);
      sd.normalize().multiplyScalar(genis * (1 - age) * (0.35 + 0.65 * k));
      const f = Math.pow(1 - age, 1.8) * k * 0.8;
      pos.set([p.x + sd.x, p.y + sd.y, p.z + sd.z, p.x - sd.x, p.y - sd.y, p.z - sd.z], i * 6);
      if (dev) col.set([0.1 * f, 0.9 * f, 0.9 * f, 0.1 * f, 0.9 * f, 0.9 * f], i * 6);
      else col.set([0.75 * f, 0.18 * f, 1.0 * f, 0.75 * f, 0.18 * f, 1.0 * f], i * 6);
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.color.needsUpdate = true;
  }
}

// ---------- yapışma sıçraması ----------
class Sicrama {
  constructor(sahne, mat) {
    this.g = new THREE.Group(); this.g.visible = false; sahne.add(this.g);
    this.blob = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), mat);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 28), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.7, 0.3, 1.0).multiplyScalar(2), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    this.g.add(this.blob, this.ring);
    this.dam = [];
    for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat); m.userData.v = new V3(); this.g.add(m); this.dam.push(m); }
    this.t = 9;
  }
  baslat(nokta, yon) {
    this.t = 0; this.g.visible = true;
    const q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 0, 1), yon.clone().negate());
    for (const m of [this.blob, this.ring]) { m.position.copy(nokta); m.quaternion.copy(q); }
    for (const m of this.dam) {
      m.position.copy(nokta);
      m.userData.v.set((Math.random() - 0.5) * 2.4, Math.random() * 2.2 + 0.5, (Math.random() - 0.5) * 2.4).addScaledVector(yon, -1.6);
    }
  }
  guncelle(dt) {
    if (this.t > 0.7) { this.g.visible = false; return; }
    this.t += dt; const t = this.t, sf = 1 - yumus(0.3, 0.7, t), k = yumus(0, 0.12, t);
    this.blob.scale.set(0.22 * k * sf + 0.001, 0.22 * k * sf + 0.001, 0.07 * sf + 0.001);
    this.ring.scale.setScalar(0.1 + t * 1.8);
    this.ring.material.opacity = kisitla(1 - t / 0.45, 0, 1);
    for (const m of this.dam) { const v = m.userData.v; v.y -= 9 * dt; m.position.addScaledVector(v, dt); m.scale.setScalar(sf + 0.001); }
  }
}

export function kur(G) {
  const kam = QS.has('kahramankam');
  const uni = { uT: { value: 0 }, uAmp: { value: 0.008 }, uDev: { value: 0 }, uFlash: { value: 0 } };
  const envMap = envKur(G.renderer);
  const mat = jeleMat(uni, envMap);

  const grup = new THREE.Group(); grup.name = 'zifir'; G.sahne.add(grup);
  const govde = new THREE.Group(); grup.add(govde);
  const kalca = new THREE.Group(); kalca.position.y = HIP; govde.add(kalca);

  const mesh = (geo, ebeveyn, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; ebeveyn.add(m); return m;
  };
  const uzuv = (r0, r1, L0) => {
    const p = [], N = 8, L = L0 + 0.8 * (r0 + r1), ust = 0.8 * r0;
    for (let i = 0; i <= N; i++) { const a = Math.PI - i / N * Math.PI / 2; p.push(new THREE.Vector2(Math.max(0.001, r1 * Math.sin(a)), -(L - r1) + r1 * Math.cos(a))); }
    for (let i = 1; i < 8; i++) { const u = 1 - i / 8; p.push(new THREE.Vector2(r0 + (r1 - r0) * u, -r0 - (L - r0 - r1) * u)); }
    for (let i = 0; i <= N; i++) { const a = Math.PI / 2 - i / N * Math.PI / 2; p.push(new THREE.Vector2(Math.max(0.001, r0 * Math.sin(a)), -r0 + r0 * Math.cos(a))); }
    const g = new THREE.LatheGeometry(p, 28); g.translate(0, ust, 0); return g;
  };
  const kure = (r) => new THREE.SphereGeometry(r, 24, 16);

  // pelvis
  mesh(kure(0.19), kalca, 0, -0.03, 0, 1.0, 0.72, 0.8);

  // omurga + gövde (V biçimli, jöle gibi yumuşak)
  const spine = new THREE.Group(); spine.position.y = 0.04; kalca.add(spine);
  const prof = [[0.001, -0.07], [0.14, -0.05], [0.2, 0.05], [0.2, 0.2], [0.23, 0.32], [0.31, 0.45], [0.37, 0.54], [0.33, 0.62], [0.17, 0.68], [0.001, 0.7]];
  const pts2 = new THREE.SplineCurve(prof.map(p => new THREE.Vector2(p[0], p[1]))).getPoints(48).map(p => new THREE.Vector2(Math.max(0.0008, p.x), p.y));
  mesh(new THREE.LatheGeometry(pts2, 40), spine, 0, 0, 0, 1.28, 1, 0.8);
  mesh(kure(0.125), spine, 0.19, 0.47, 0.13, 1.15, 0.95, 0.7);   // göğüs kasları
  mesh(kure(0.125), spine, -0.19, 0.47, 0.13, 1.15, 0.95, 0.7);
  mesh(kure(0.14), spine, 0, 0.62, -0.07, 2.1, 0.75, 0.8);    // trapez
  mesh(new THREE.CapsuleGeometry(0.075, 0.1, 6, 14), spine, 0, 0.72, 0);

  // baş
  const kafa = new THREE.Group(); kafa.position.set(0, 0.74, 0.05); kafa.scale.setScalar(1.18); spine.add(kafa);
  mesh(kure(0.18), kafa, 0, 0.1, 0.01, 1.0, 1.02, 0.97);
  mesh(kure(0.11), kafa, 0, 0.0, 0.05, 1.0, 0.7, 0.9);        // çene yumuşaklığı
  // damla baş: üstte geriye kıvrılan sivri uç
  {
    const tp = new THREE.SplineCurve([[0.001, 0.0], [0.075, 0.03], [0.07, 0.1], [0.045, 0.19], [0.02, 0.28], [0.001, 0.34]].map(a => new THREE.Vector2(a[0], a[1]))).getPoints(24).map(q => new THREE.Vector2(Math.max(0.0008, q.x), q.y));
    const uc = mesh(new THREE.LatheGeometry(tp, 20), kafa, 0, 0.2, -0.015, 1, 1, 1);
    uc.rotation.x = -0.5;
  }
  // damla gözler (ucu hafif içe yatık: dost bakış)
  const sh = new THREE.Shape();
  sh.moveTo(0, 0.5);
  sh.bezierCurveTo(0.08, 0.28, 0.32, 0.0, 0.32, -0.18);
  sh.bezierCurveTo(0.32, -0.36, 0.17, -0.45, 0, -0.45);
  sh.bezierCurveTo(-0.17, -0.45, -0.32, -0.36, -0.32, -0.18);
  sh.bezierCurveTo(-0.32, 0.0, -0.08, 0.28, 0, 0.5);
  const gozGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 5, curveSegments: 24 });
  gozGeo.center();
  const gozMat = new THREE.MeshStandardMaterial({ color: 0xeae6ff, emissive: 0xd8d0ff, emissiveIntensity: 0.45, roughness: 0.35 });
  const gozler = [1, -1].map(s => {
    const piv = new THREE.Group(); piv.position.set(s * 0.1, 0.09, 0.14); piv.rotation.y = s * 0.5; kafa.add(piv);
    const g = new THREE.Mesh(gozGeo, gozMat); g.scale.set(0.245, 0.245, 0.245); g.rotation.z = -s * 0.06; piv.add(g);
    return piv;
  });

  // Yürek Taşı
  const tasMat = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xa040ff, emissiveIntensity: 1.5, roughness: 0.2, metalness: 0.2 });
  const kalp = new THREE.Shape();
  kalp.moveTo(0, -0.5); kalp.bezierCurveTo(-0.15, -0.35, -0.55, -0.1, -0.55, 0.2); kalp.bezierCurveTo(-0.55, 0.45, -0.2, 0.55, 0, 0.3);
  kalp.bezierCurveTo(0.2, 0.55, 0.55, 0.45, 0.55, 0.2); kalp.bezierCurveTo(0.55, -0.1, 0.15, -0.35, 0, -0.5);
  const kalpG = new THREE.ExtrudeGeometry(kalp, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.06, bevelSegments: 2, curveSegments: 6 });
  kalpG.center(); kalpG.scale(0.2, 0.2, 0.2);
  tasMat.flatShading = true;
  const tas = new THREE.Mesh(kalpG, tasMat); tas.scale.set(1, 1.0, 0.7); tas.position.set(0, 0.42, 0.2); spine.add(tas);
  const yuva = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.022, 12, 32), mat); yuva.position.set(0, 0.42, 0.185); spine.add(yuva);
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const cx = cv.getContext('2d'); const gr = cx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = gr; cx.fillRect(0, 0, 64, 64);
  const hale = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), color: 0xa040ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  hale.scale.setScalar(0.45); hale.position.set(0, 0.42, 0.2); spine.add(hale);

  const tas2 = new THREE.Mesh(tas.geometry, tasMat); tas2.position.set(0, 0.42, -0.2); spine.add(tas2);
  const hale2 = new THREE.Sprite(hale.material.clone()); hale2.position.set(0, 0.42, -0.22); spine.add(hale2);
  if (QS.get('gizle') === 'hale') hale.visible = false;
  if (QS.get('gizle') === 'tas') tas.visible = false;
  // kollar
  const omuz = [], dirsek = [], yumruk = [];
  [1, -1].forEach((s, i) => {
    const o = new THREE.Group(); o.position.set(s * 0.54, 0.52, 0); spine.add(o); omuz.push(o);
    mesh(kure(0.17), o, 0, 0, 0, 1, 1.05, 1);
    mesh(uzuv(0.16, 0.12, 0.31), o);
    const d = new THREE.Group(); d.position.y = -0.31; o.add(d); dirsek.push(d);
    mesh(kure(0.115), d);
    mesh(uzuv(0.12, 0.105, 0.3), d);
    const y = new THREE.Group(); y.position.y = -0.31; d.add(y); yumruk.push(y);
    mesh(kure(0.155), y, 0, -0.02, 0);
  });

  // bacaklar
  const kalcaE = [], diz = [], ayak = [];
  [1, -1].forEach((s, i) => {
    const b = new THREE.Group(); b.position.set(s * 0.16, -0.02, 0); kalca.add(b); kalcaE.push(b);
    mesh(kure(0.175), b);
    mesh(uzuv(0.175, 0.135, 0.42), b);
    const d = new THREE.Group(); d.position.y = -0.42; b.add(d); diz.push(d);
    mesh(kure(0.13), d);
    mesh(uzuv(0.135, 0.1, 0.4), d);
    const a = new THREE.Group(); a.position.y = -0.4; d.add(a); ayak.push(a);
    mesh(kure(1), a, 0, 0.01, 0.06, 0.11, 0.065, 0.19);
  });

  // sırt dokunaçları (4 adet, sürekli kıvrılır)
  const sirt = [];
  const SEGS = 16;
  [[0.14, 0.52, 1.0, 0.95], [-0.14, 0.52, -1.0, 0.95], [0.24, 0.36, 1.6, 0.78], [-0.24, 0.36, -1.6, 0.78]].forEach((d, i) => {
    const tp = new Tup(SEGS + 1, 8, mat); spine.add(tp.mesh);
    sirt.push({ tp, x: d[0], y: d[1], yan: d[2], boy: d[3], faz: i * 1.7, pts: Array.from({ length: SEGS + 1 }, () => new V3()) });
  });

  // doğuş birikintisi
  const birikinti = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 10), mat); birikinti.scale.set(0.001, 0.035, 0.001); birikinti.position.y = 0.0; birikinti.visible = false; grup.add(birikinti);

  // oyun dokunaçları (dünya uzayı)
  const DS = 20;
  const ten = {};
  for (const ad of ['sol', 'sag', 'kamci']) {
    const tp = new Tup(DS + 1, 10, mat); tp.mesh.visible = false; G.sahne.add(tp.mesh);
    ten[ad] = { tp, aktif: false, bas: new V3(), bit: new V3(), ilerleme: 0, ata: 0, atandi: false, sic: new Sicrama(G.sahne, mat), pts: Array.from({ length: DS + 1 }, () => new V3()) };
  }
  const izler = [new Iz(0.95, G.sahne), new Iz(1.5, G.sahne)];

  // test ışığı / zemin (yalnız kahramankam)
  const sahneEk = [];
  if (kam) {
    G.sahne.fog = null; G.sahne.background = new THREE.Color(0x0c0818);
    const hm = new THREE.HemisphereLight(0x9a80ff, 0x201030, 0.6); G.sahne.add(hm);
    const gunes = new THREE.DirectionalLight(0xffe8d0, 1.6); gunes.position.set(3, 5, 4); G.sahne.add(gunes);
    const rim = new THREE.PointLight(0x20f0e0, 18, 12); rim.position.set(-3, 2.5, -2); G.sahne.add(rim);
    sahneEk.push(hm, gunes, rim);
    const zem = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshStandardMaterial({ color: 0x120a22, roughness: 0.5, metalness: 0.3 }));
    zem.rotation.x = -Math.PI / 2; zem.position.y = -0.002; G.sahne.add(zem);
    const gh = new THREE.GridHelper(60, 60, 0x4a2a8a, 0x241046); G.sahne.add(gh);
    sahneEk.push(zem, gh);
  }

  // ---------- durum ----------
  const KEYS = ['hy', 'kp', 'kr', 'ky', 'sx', 'sy', 'sz', 'bx', 'by'];
  for (let i = 0; i < 2; i++) KEYS.push('ax' + i, 'az' + i, 'ay' + i, 'ae' + i, 'lx' + i, 'lz' + i, 'lk' + i);
  const cur = {}, hd = {}; for (const k of KEYS) cur[k] = hd[k] = 0;
  const son = { durum: 'dur', hiz: new V3(), yerde: true, dev: false };
  let durumT = 0, sayac = 0, ph = 0, devS = 1, devV = 0, devK = 0, pud = 0, hs = 0, sp = 0;
  const gecici = { ax: 0, az: 0 }; const qw = new THREE.Quaternion(), dv = new V3(), sw = new V3();

  function kolHedef(i, nokta) {
    omuz[i].getWorldPosition(sw); dv.copy(nokta).sub(sw).normalize();
    spine.getWorldQuaternion(qw).invert(); dv.applyQuaternion(qw);
    gecici.az = Math.asin(kisitla(dv.x, -1, 1));
    let ax = Math.atan2(-dv.z, -dv.y); if (ax > 1.7) ax -= Math.PI * 2;
    gecici.ax = ax;
  }

  function poz(d, t, T, vy) {
    for (const k of KEYS) hd[k] = 0;
    for (let i = 0; i < 2; i++) { const s = i ? -1 : 1; hd['ae' + i] = -0.2; hd['az' + i] = s * 0.1; hd['lz' + i] = s * 0.07; hd['lk' + i] = 0.06; }
    switch (d) {
      case 'dur': {
        const b = Math.sin(t * 1.9);
        hd.sx = 0.03 + 0.02 * b; hd.bx = 0.02 - 0.02 * b; hd.by = Math.sin(t * 0.45) * 0.25; hd.hy = -0.012 + 0.008 * b; hd.kr = 0.02 * Math.sin(t * 0.7);
        for (let i = 0; i < 2; i++) { const s = i ? -1 : 1; hd['ax' + i] = 0.05 * Math.sin(t * 1.9 + i); hd['az' + i] = s * (0.14 + 0.03 * b); hd['ae' + i] = -0.3; hd['lx' + i] = -0.04; hd['lk' + i] = 0.1; hd['lz' + i] = s * 0.09; }
        break;
      }
      case 'yuru': case 'kos': {
        const r = d === 'kos';
        const A = r ? 1.05 : 0.62, K = r ? 1.7 : 0.75, AR = r ? 1.0 : 0.5;
        hd.hy = (r ? -0.06 : -0.025) + (r ? 0.07 : 0.03) * Math.cos(2 * ph);
        hd.sx = r ? 0.38 : 0.1; hd.sy = (r ? 0.28 : 0.14) * Math.sin(ph); hd.kr = 0.03 * Math.sin(ph); hd.bx = -hd.sx * 0.8;
        for (let i = 0; i < 2; i++) {
          const s = i ? -1 : 1, f = ph + i * Math.PI, sn = Math.sin(f);
          hd['lx' + i] = -A * sn; hd['lk' + i] = 0.12 + K * Math.max(0, Math.cos(f)); hd['lz' + i] = s * 0.05;
          hd['ax' + i] = AR * sn; hd['az' + i] = s * (r ? 0.12 : 0.1);
          hd['ae' + i] = r ? -1.3 - 0.3 * sn : -0.35 - 0.25 * Math.max(0, -sn);
        }
        break;
      }
      case 'zipla': {
        const yuk = yumus(-3, 3, vy);
        hd.sx = 0.1; hd.bx = -0.1; hd.hy = 0.0;
        hd.lx0 = -0.9 * yuk - 0.3 * (1 - yuk); hd.lk0 = 1.3 * yuk + 0.5 * (1 - yuk); hd.lx1 = -0.2; hd.lk1 = 0.5 * yuk + 0.3;
        for (let i = 0; i < 2; i++) { const s = i ? -1 : 1; hd['ax' + i] = -2.2 * yuk - 0.4 * (1 - yuk); hd['az' + i] = s * (0.35 + 0.7 * (1 - yuk)); hd['ae' + i] = -0.2; hd['lz' + i] = s * 0.1; }
        break;
      }
      case 'dus': {
        const fl = Math.sin(t * 14) * 0.08;
        hd.sx = 0.25; hd.bx = -0.3; hd.hy = 0.0; hd.kr = 0.05 * Math.sin(t * 5);
        hd.lx0 = -0.35; hd.lx1 = 0.15; hd.lk0 = 0.35; hd.lk1 = 0.55;
        for (let i = 0; i < 2; i++) { const s = i ? -1 : 1; hd['az' + i] = s * (1.35 + fl); hd['ax' + i] = -0.3; hd['ae' + i] = -0.2 - fl; hd['lz' + i] = s * 0.22; }
        break;
      }
      case 'sallan': {
        const r = ten.sag.aktif ? 1 : (ten.sol.aktif ? 0 : 1), o = 1 - r, sr = r ? -1 : 1;
        const hedef = (ten.sag.aktif ? ten.sag : ten.sol.aktif ? ten.sol : null);
        const nk = hedef ? hedef.bit : null;
        sw.set(0, 0, 0); omuz[r].getWorldPosition(sw);
        const nokta = nk || new V3(sw.x, sw.y + 1, sw.z + 0.7).applyMatrix4(new THREE.Matrix4());
        kolHedef(r, nokta);
        hd.kp = 0.55; hd.sx = 0.18; hd.bx = -0.5; hd.kr = sr * -0.12; hd.sy = sr * 0.15; hd.hy = -0.02;
        hd['ax' + r] = gecici.ax; hd['az' + r] = gecici.az; hd['ae' + r] = -0.12;
        hd['ax' + o] = 0.8 + 0.1 * Math.sin(t * 4); hd['az' + o] = -sr * 0.5; hd['ae' + o] = -0.55;
        hd.lx0 = 0.25 + 0.08 * Math.sin(t * 3); hd.lk0 = 0.3; hd.lx1 = -0.3; hd.lk1 = 1.0 + 0.1 * Math.sin(t * 3 + 1);
        hd.lz0 = 0.12; hd.lz1 = -0.12;
        break;
      }
      case 'duvar': {
        hd.kp = 0.12; hd.sx = 0.1; hd.hy = -0.1; hd.bx = -0.7; hd.sy = 0.12 * Math.sin(ph); hd.kr = 0.05 * Math.sin(ph);
        for (let i = 0; i < 2; i++) {
          const s = i ? -1 : 1, f = ph + i * Math.PI, sn = Math.sin(f);
          hd['ax' + i] = -2.35 + 0.5 * sn; hd['az' + i] = s * (0.3 + 0.12 * sn); hd['ae' + i] = -0.45 - 0.4 * Math.max(0, -sn);
          hd['lx' + i] = -1.0 - 0.45 * sn; hd['lk' + i] = 1.35 - 0.3 * sn; hd['lz' + i] = s * 0.5;
        }
        break;
      }
      case 'zip': {
        hd.kp = 1.25; hd.sx = 0.1; hd.bx = -1.2; hd.hy = 0.0;
        for (let i = 0; i < 2; i++) { const s = i ? -1 : 1; hd['ax' + i] = -2.95; hd['az' + i] = s * 0.12; hd['ae' + i] = -0.05; hd['lx' + i] = 0.05 + i * 0.1; hd['lk' + i] = 0.12 + i * 0.1; hd['lz' + i] = s * 0.05; }
        break;
      }
      case 'yumruk': case 'kamci': {
        const kc = d === 'kamci', pr = kc ? 1 : (sayac % 2), po = 1 - pr, s = pr ? -1 : 1;
        const ext = yumus(0.1, 0.2, T) * (1 - yumus(0.45, 0.7, T)), cock = yumus(0, 0.11, T) * (1 - ext);
        if (kc) {
          hd['ax' + pr] = -2.7 * cock - 1.5 * ext; hd['az' + pr] = s * (0.5 * cock + 0.1 * ext); hd['ae' + pr] = -0.4 * cock;
          hd.sy = s * (0.3 * cock - 0.4 * ext); hd.sx = 0.1 * ext;
        } else {
          hd['ax' + pr] = 0.3 * cock - 1.6 * ext; hd['ae' + pr] = -2.0 * cock; hd['az' + pr] = s * 0.1;
          hd.sy = s * (0.35 * cock - 0.45 * ext); hd.sx = 0.12 * ext;
        }
        hd['ax' + po] = -0.7; hd['ae' + po] = -1.9; hd['az' + po] = -s * 0.2;
        hd.hy = -0.07; hd.bx = 0.0;
        hd.lx0 = -0.4; hd.lk0 = 0.55; hd.lx1 = 0.3; hd.lk1 = 0.4; hd.lz0 = 0.15; hd.lz1 = -0.15;
        break;
      }
      case 'hasar': {
        const k = Math.exp(-T * 4);
        hd.sx = -0.35 * k; hd.bx = 0.2 * k; hd.hy = -0.06 * k; hd.sz = 0.15 * Math.sin(T * 30) * k;
        for (let i = 0; i < 2; i++) { const s = i ? -1 : 1; hd['az' + i] = s * (0.9 * k + 0.1); hd['ax' + i] = -0.3 * k; hd['ae' + i] = -0.6 * k - 0.2; hd['lk' + i] = 0.4 * k + 0.06; }
        break;
      }
      case 'dogus': {
        const u = kisitla(T / 1.5, 0, 1), k = 1 - u;
        hd.bx = -0.2 * k; hd.sx = -0.1 * k; hd.hy = 0;
        for (let i = 0; i < 2; i++) { const s = i ? -1 : 1; hd['az' + i] = s * (0.1 + 0.5 * k); hd['ax' + i] = -1.0 * k; hd['lk' + i] = 0.06 + 0.4 * k * (i ? 1 : 0.5); }
        break;
      }
    }
  }

  const tmpV = new V3(), tmpP = new V3(), tmpQ = new V3(), yukari = new V3(0, 1, 0), tmpW = new V3(), kamPos = new V3();
  const ek = new THREE.Euler();
  let testIdx = -1, tbas = 0;

  function dokunacGuncelle(dt, t) {
    for (const ad in ten) {
      const k = ten[ad], sic = k.sic;
      sic.guncelle(dt);
      if (!k.aktif) { k.tp.mesh.visible = false; continue; }
      k.tp.mesh.visible = true;
      k.ilerleme = Math.min(1, k.ilerleme + dt / 0.11);
      if (k.ilerleme >= 1 && !k.atandi) {
        k.atandi = true; k.ata = 0;
        tmpV.copy(k.bit).sub(k.bas); if (tmpV.lengthSq() > 1e-6) tmpV.normalize(); else tmpV.set(0, 1, 0);
        sic.baslat(k.bit, tmpV);
      }
      if (k.atandi) k.ata += dt;
      const e = 1 - Math.pow(1 - k.ilerleme, 3);
      tmpP.copy(k.bit).sub(k.bas); const L = tmpP.length() * e;
      if (tmpP.lengthSq() < 1e-8) tmpP.set(0, 1, 0);
      const dir = tmpV.copy(tmpP).normalize();
      tmpQ.crossVectors(dir, yukari); if (tmpQ.lengthSq() < 1e-4) tmpQ.set(1, 0, 0); tmpQ.normalize();
      tmpW.crossVectors(dir, tmpQ);
      const amp = Math.min(0.2, 0.025 + L * 0.004) + (k.atandi ? 0.28 * Math.exp(-k.ata * 4.5) : 0) + (k.atandi ? 0 : 0.12 * (1 - e));
      for (let i = 0; i <= DS; i++) {
        const u = i / DS, env = Math.sin(u * Math.PI), ph2 = u * 9 - t * 16;
        k.pts[i].copy(k.bas).addScaledVector(dir, L * u)
          .addScaledVector(tmpQ, Math.sin(ph2) * amp * env).addScaledVector(tmpW, Math.cos(ph2 * 0.8) * amp * 0.6 * env);
      }
      k.tp.guncelle(k.pts, 0.095, 0.045, 0.3);
    }
  }

  function sirtGuncelle(t) {
    const stream = yumus(2, 18, sp), enerji = 1 + 0.6 * devK;
    for (const d of sirt) {
      const s = Math.sign(d.yan), ls = d.pts;
      const dir = new V3(s * 0.45, 0.75, -0.55).normalize().lerp(new V3(s * 0.15, 0.25, -1), stream * 0.8).normalize();
      const l = d.boy * (1 + 0.4 * devK) / SEGS;
      ls[0].set(d.x, d.y, -0.15);
      const curl = (0.1 + 0.12 * Math.sin(t * 1.7 + d.faz)) * (1 - 0.65 * stream) * enerji;
      for (let i = 1; i <= SEGS; i++) {
        const a1 = curl + 0.05 * Math.sin(t * 2.3 + d.faz + i * 0.45) * enerji;
        const a2 = (0.16 * Math.sin(t * 1.3 + d.faz * 2 + i * 0.35) + s * 0.04) * enerji;
        dir.applyAxisAngle(AX, a1).applyAxisAngle(AY, a2 * 0.5).normalize();
        ls[i].copy(ls[i - 1]).addScaledVector(dir, l);
      }
      d.tp.guncelle(ls, 0.085, 0.012, 1);
    }
  }
  const AX = new V3(1, 0, 0), AY = new V3(0, 1, 0);

  // ---------- API ----------
  const izole = kam && QS.has('izole'); let ic = false;
  function ayarla(p) {
    if (!p || (izole && !ic)) return;
    if (p.durum && p.durum !== son.durum) { son.durum = p.durum; durumT = 0; sayac++; }
    if (p.hiz) son.hiz.copy(p.hiz);
    if (p.yerde !== undefined) son.yerde = !!p.yerde;
    if (typeof p.dev === 'boolean' && p.dev !== son.dev) devOl(p.dev);
  }
  function dokunac(ad, bas, bit) {
    const k = ten[ad]; if (!k || (izole && !ic)) return;
    if (!bas || !bit) { k.aktif = false; return; }
    if (!k.aktif) { k.aktif = true; k.ilerleme = 0; k.atandi = false; }
    else if (k.bit.distanceToSquared(bit) > 6) { k.ilerleme = 0.4; k.atandi = false; }
    k.bas.copy(bas); k.bit.copy(bit);
  }
  function elNoktasi(taraf) { return yumruk[taraf === 'sag' ? 1 : 0].getWorldPosition(new V3()); }
  function devOl(a) { son.dev = !!a; }

  G.kahraman = { grup, ayarla, dokunac, elNoktasi, devOl };

  // ---------- test sürücüsü ----------
  const SIRA = ['dur', 'yuru', 'kos', 'zipla', 'dus', 'sallan', 'duvar', 'zip', 'yumruk', 'kamci', 'hasar', 'dogus'];
  const HIZ = { dur: [0, 0], yuru: [5, 0], kos: [15, 0], zipla: [3, 7], dus: [3, -14], sallan: [17, 3], duvar: [0, 3], zip: [26, 0], yumruk: [0, 0], kamci: [0, 0], hasar: [0, 0], dogus: [0, 0] };
  function testSur(dt) {
    const sabit = QS.get('durum');
    const idx = sabit ? SIRA.indexOf(sabit) : Math.floor(G.t) % SIRA.length;
    if (izole) { const benim = new Set([grup, ten.sol.tp.mesh, ten.sag.tp.mesh, ten.kamci.tp.mesh, izler[0].mesh, izler[1].mesh, ...Object.values(ten).map(k => k.sic.g), ...sahneEk]); for (const c of G.sahne.children) if (!benim.has(c)) c.visible = false; }
    if (idx !== testIdx) { testIdx = idx; grup.position.set(0, 0, 0); for (const z of izler) z.temizle(); if (QS.has('dev') && !son.dev) devOl(true); }
    const d = SIRA[Math.max(0, idx)], h = HIZ[d];
    ayarla({ durum: d, hiz: tmpV.set(0, h[1], h[0]), yerde: d === 'dur' || d === 'yuru' || d === 'kos' });
    if (QS.has('dev')) son.dev = true;
    if (izole) { grup.position.x = 0; grup.position.y = 0; grup.quaternion.identity(); }
    grup.position.z += h[0] * dt;
    if (d === 'duvar') grup.position.y += 0;
    // her zaman bir dokunaç göster
    const el = elNoktasi('sag');
    if (!QS.has('tensiz')) dokunac('sag', el, new V3(grup.position.x + 2.2, 5.5, grup.position.z + 3));
    if (d === 'kamci') dokunac('kamci', elNoktasi('sag'), new V3(grup.position.x - 0.4, 1.2, grup.position.z + 4)); else dokunac('kamci', null, null);
    if (d === 'zip' || d === 'yumruk') dokunac('sol', elNoktasi('sol'), new V3(grup.position.x - 1.5, 1.4, grup.position.z + 3.5)); else dokunac('sol', null, null);
  }

  G.__kahramanGuncelle = (dt) => {
    const t = G.t;
    if (izole || (G.test && !G.oyuncu)) { ic = true; testSur(dt); ic = false; }
    durumT += dt;
    hs = Math.hypot(son.hiz.x, son.hiz.z); sp = son.hiz.length();
    const d = son.durum, vy = son.hiz.y;

    // faz
    if (d === 'yuru') ph += dt * Math.min(12, 6 + hs * 0.5);
    else if (d === 'kos') ph += dt * Math.min(17, 10 + hs * 0.35);
    else if (d === 'duvar') ph += dt * (sp > 0.3 ? Math.min(9, 2 + sp * 0.9) : 0.5);
    else ph += dt * 0.5;

    poz(d, t, durumT, vy);
    const hiz = (d === 'yumruk' || d === 'kamci') ? 30 : (d === 'hasar' ? 24 : 12);
    const a = 1 - Math.exp(-dt * hiz);
    for (const k of KEYS) cur[k] += (hd[k] - cur[k]) * a;

    kalca.position.y = HIP + cur.hy; kalca.rotation.set(cur.kp, cur.ky, cur.kr);
    spine.rotation.set(cur.sx, cur.sy, cur.sz); kafa.rotation.set(cur.bx, cur.by, 0);
    for (let i = 0; i < 2; i++) {
      omuz[i].rotation.set(cur['ax' + i], cur['ay' + i], cur['az' + i]); dirsek[i].rotation.x = cur['ae' + i];
      kalcaE[i].rotation.set(cur['lx' + i], 0, cur['lz' + i]); diz[i].rotation.x = cur['lk' + i];
      ayak[i].rotation.x = -(cur.kp + cur['lx' + i] + cur['lk' + i]) * 0.75;
    }
    // yumruk büyütme (jöle yumruk)
    const ext = (d === 'yumruk' || d === 'kamci') ? yumus(0.1, 0.2, durumT) * (1 - yumus(0.45, 0.7, durumT)) : 0;
    const pr = d === 'kamci' ? 1 : (sayac % 2);
    yumruk[0].scale.setScalar(1 + (pr === 0 ? 0.6 * ext : 0)); yumruk[1].scale.setScalar(1 + (pr === 1 ? 0.6 * ext : 0));

    // göz kırpma
    const tb = (t + 1.3) % 3.7, bl = tb < 0.14 ? 1 - Math.sin(tb / 0.14 * Math.PI) * 0.92 : 1;
    gozler.forEach(g => g.scale.y = bl);

    // dev yayı
    const hedefS = son.dev ? 1.6 : 1;
    devV += ((hedefS - devS) * 90 - devV * 9) * dt; devS += devV * dt;
    devK += ((son.dev ? 1 : 0) - devK) * (1 - Math.exp(-dt * 3));

    // squash/stretch + doğuş
    const st = kisitla(vy * 0.006, -0.08, 0.12);
    let sxz = 1 - st * 0.5, sy = 1 + st;
    let hedefPud = 0;
    if (d === 'dogus') {
      const u = kisitla(durumT / 1.5, 0, 1);
      const y = Math.max(0.02, (1 - Math.pow(1 - u, 3)) * (1 + 0.08 * Math.sin(u * 10) * (1 - u)));
      sy *= y; sxz *= 1 + (1 - y) * 1.1;
      hedefPud = durumT < 1.5 ? 1 - u * 0.8 : 0;
    }
    pud += (hedefPud - pud) * (1 - Math.exp(-dt * 10));
    birikinti.visible = pud > 0.01; birikinti.scale.set(0.95 * pud + 0.001, 0.035, 0.95 * pud + 0.001);
    govde.scale.set(devS * sxz, devS * sy, devS * sxz);
    // hasar sarsılması
    if (d === 'hasar') { const k = Math.exp(-durumT * 5); govde.position.x = Math.sin(durumT * 70) * 0.05 * k; uni.uFlash.value = Math.exp(-durumT * 6) * 0.3; }
    else { govde.position.x = 0; uni.uFlash.value *= 0.9; }

    // yüzey akışı
    uni.uT.value = t; uni.uDev.value = devK; uni.uAmp.value = 0.008 + 0.006 * yumus(0, 15, sp) + 0.004 * devK;

    // Yürek Taşı
    const hz = 1.3 + 0.9 * devK, p = (t * hz) % 1;
    const bt = Math.exp(-Math.pow((p - 0.1) / 0.06, 2)) + 0.6 * Math.exp(-Math.pow((p - 0.3) / 0.07, 2));
    const renkK = 0.5 + 0.5 * Math.sin(t * 0.8 + bt * 0.5);
    tasMat.emissive.setRGB(0.65 + (0.05 - 0.65) * renkK, 0.2 + (0.95 - 0.2) * renkK, 1.0 + (0.9 - 1.0) * renkK);
    tasMat.emissiveIntensity = 0.45 + 0.4 * bt + 0.35 * devK;
    tas.scale.set(1 + 0.22 * bt, 1.15 + 0.22 * bt, 0.9 + 0.1 * bt).multiplyScalar(1 + 0.3 * devK);
    hale.material.color.copy(tasMat.emissive); hale.material.opacity = 0.16 + 0.2 * bt; hale.scale.setScalar(0.42 + 0.14 * bt + 0.16 * devK); hale2.scale.copy(hale.scale); hale2.material.color.copy(hale.material.color); hale2.material.opacity = hale.material.opacity; tas2.scale.copy(tas.scale); tas2.scale.multiplyScalar(0.8);

    sirtGuncelle(t);
    dokunacGuncelle(dt, t);

    // iz
    grup.getWorldPosition(tmpW);
    const k = Math.max(yumus(9, 18, sp), son.dev ? yumus(4, 10, sp) : 0);
    kamPos.copy(G.kamera.position);
    izler[0].guncelle(t, tmpW, k, son.dev, kamPos, 0.1 * (1 + 0.5 * devK));
    izler[1].guncelle(t, tmpW, k, son.dev, kamPos, 0.06 * (1 + 0.5 * devK));

    // yakın bakış kamerası (yalnız test)
    if (kam) {
      const aci = (parseFloat(QS.get('aci')) || 0) * Math.PI / 180, mes = parseFloat(QS.get('mes')) || 4;
      const c = tmpV.copy(grup.position); c.y += (parseFloat(QS.get('bak')) || 1.0) * (son.dev && !QS.has('bak') ? 1.4 : 1);
      const ox = 2.1, oz = 3.2;
      G.kamera.position.set(c.x + (ox * Math.cos(aci) + oz * Math.sin(aci)) * mes / 3.93, c.y + 0.9 * mes / 3.93, c.z + (oz * Math.cos(aci) - ox * Math.sin(aci)) * mes / 3.93);
      G.kamera.lookAt(c);
    }
  };
}

export function guncelle(G, dt) { G.__kahramanGuncelle?.(dt); }
