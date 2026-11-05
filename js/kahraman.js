// Zifir — prosedürel jöle kahraman (SOZLESME §4). Ön yüz +Z, sol el +X.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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
function jeleMat(uni, envMap, diken = false) {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0x030307, roughness: 0.1, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.04,
    iridescence: 0.1, iridescenceIOR: 1.35, iridescenceThicknessRange: [120, 420],
    envMap, envMapIntensity: 0.75, emissive: 0x0a0216,
  });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uT; uniform float uAmp; uniform float uSis; uniform float uSpk; varying vec3 vOP;' + (diken ? '\nattribute vec3 aB;' : ''))
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vOP = position;
        float w = sin(position.y*8.0+uT*1.7+position.x*5.0)*0.5 + sin(position.z*10.0-uT*2.3+position.y*5.0)*0.5;
        transformed += normal * w * uAmp;
        float sb = sin(position.y*5.0+position.x*7.0-uT*9.0)*0.5 + sin(position.z*9.0+position.y*11.0+uT*13.0)*0.5;
        transformed += normal * uSis * (0.08 + 0.04*sb);` + (diken ? `
        transformed = aB + (transformed - aB) * uSpk;` : ''));
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uT; uniform float uDev; uniform float uFlash; uniform float uYay; uniform float uPuls; uniform float uYm; uniform float uYh; varying vec3 vOP;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float ak = sin(vOP.y*6.5 + sin(vOP.x*8.0+vOP.z*6.0+uT*0.7)*1.7 - uT*1.1);
        float damar = 1.0 - smoothstep(0.0, 0.09, abs(ak));
        totalEmissiveRadiance += mix(vec3(0.30,0.07,0.65), vec3(0.0,1.1,1.0), uDev)*damar*(0.07+2.2*uDev) + vec3(0.9,0.35,1.2)*uFlash;
        float fr = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 3.0);
        totalEmissiveRadiance += mix(vec3(0.22,0.07,0.55), vec3(0.0,0.5,0.55), uDev) * fr * 0.3;
        if (uYay > 0.001) {
          float rev = 1.0;
          if (uYh > 0.0) { float ny = (vOP.y - uYm) / uYh; float dd = abs(ny - 0.7) * 1.3 + (sin(vOP.x*9.0+vOP.z*7.0+vOP.y*5.0)*0.5+0.5)*0.25; rev = 1.0 - smoothstep(uYay - 0.2, uYay, dd); }
          float a2 = sin(vOP.x*11.0 + sin(vOP.y*7.0+vOP.z*9.0-uT*0.6)*1.6);
          float a3 = sin(vOP.z*10.0 + sin(vOP.y*5.0+vOP.x*8.0+uT*0.5)*1.4);
          float net = max(1.0 - smoothstep(0.0, 0.07, abs(a2)), 1.0 - smoothstep(0.0, 0.06, abs(a3)));
          vec3 vc = mix(vec3(0.55,0.12,1.2), vec3(0.0,1.2,1.1), 0.5+0.5*sin(vOP.y*6.0+uT*1.3));
          totalEmissiveRadiance += vc * net * rev * (0.8 + 1.6*uPuls);
        }`);
  };
  m.customProgramCacheKey = () => 'zifirjele2' + (diken ? 'd' : '');
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
      if (dev) col.set([0.05 * f, 0.45 * f, 0.45 * f, 0.05 * f, 0.45 * f, 0.45 * f], i * 6);
      else col.set([0.75 * f, 0.18 * f, 1.0 * f, 0.75 * f, 0.18 * f, 1.0 * f], i * 6);
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.attributes.color.needsUpdate = true;
  }
}

// ---------- yumuşak jöle dikeni (eğri, sivri uçlu; aB = taban noktası, büyüme için) ----------
function dikenGeo(taban, yon, bukul, boy, r, seg = 7, rad = 6) {
  const y = yon.clone().normalize(), ref = Math.abs(y.y) > 0.9 ? new V3(1, 0, 0) : new V3(0, 1, 0);
  const a = new V3().crossVectors(y, ref).normalize(), b = new V3().crossVectors(y, a).normalize();
  const pos = [], idx = [], bs = [];
  for (let i = 0; i <= seg; i++) {
    const u = i / seg, p = taban.clone().addScaledVector(y, boy * u).addScaledVector(bukul, boy * 0.4 * u * u);
    const rr = i === seg ? 0.0004 : r * Math.pow(1 - u, 0.85) * (1 + 0.25 * Math.sin(u * 3));
    for (let j = 0; j < rad; j++) {
      const an = j / rad * Math.PI * 2;
      pos.push(p.x + (a.x * Math.cos(an) + b.x * Math.sin(an)) * rr, p.y + (a.y * Math.cos(an) + b.y * Math.sin(an)) * rr, p.z + (a.z * Math.cos(an) + b.z * Math.sin(an)) * rr);
      bs.push(taban.x, taban.y, taban.z);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < rad; j++) {
    const q = i * rad + j, q2 = i * rad + (j + 1) % rad, w = (i + 1) * rad + j, w2 = (i + 1) * rad + (j + 1) % rad;
    idx.push(q, q2, w, q2, w2, w);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aB', new THREE.Float32BufferAttribute(bs, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
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
  let gc = null; // gerçek model (GLB) hazır olunca dolar
  const uni = { uT: { value: 0 }, uAmp: { value: 0.008 }, uDev: { value: 0 }, uFlash: { value: 0 }, uSis: { value: 0 }, uYay: { value: 0 }, uPuls: { value: 0 }, uYm: { value: 0 }, uYh: { value: 0 }, uSpk: { value: 1 } };
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
  let damlaUc = null;
  const kafa = new THREE.Group(); kafa.position.set(0, 0.74, 0.05); kafa.scale.setScalar(1.18); spine.add(kafa);
  mesh(kure(0.18), kafa, 0, 0.1, 0.01, 1.0, 1.02, 0.97);
  mesh(kure(0.11), kafa, 0, 0.0, 0.05, 1.0, 0.7, 0.9);        // çene yumuşaklığı
  // damla baş: üstte geriye kıvrılan sivri uç
  {
    const tp = new THREE.SplineCurve([[0.001, 0.0], [0.075, 0.03], [0.07, 0.1], [0.045, 0.19], [0.02, 0.28], [0.001, 0.34]].map(a => new THREE.Vector2(a[0], a[1]))).getPoints(24).map(q => new THREE.Vector2(Math.max(0.0008, q.x), q.y));
    const uc = mesh(new THREE.LatheGeometry(tp, 20), kafa, 0, 0.2, -0.015, 1, 1, 1);
    uc.rotation.x = -0.5; damlaUc = uc;
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
  const gozHaleTex = () => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  };
  const gozler = [1, -1].map(s => {
    const piv = new THREE.Group(); piv.position.set(s * 0.1, 0.09, 0.14); piv.rotation.y = s * 0.5; kafa.add(piv);
    const g = new THREE.Mesh(gozGeo, gozMat); g.scale.set(0.245, 0.245, 0.245); g.rotation.z = -s * 0.06; piv.add(g);
    const hl = new THREE.Sprite(new THREE.SpriteMaterial({ map: gozHaleTex(), color: 0x9a40ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
    hl.scale.setScalar(1.0); hl.position.z = -0.01; piv.add(hl); piv.userData.hale = hl;
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
    const dm = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat); m.visible = false; m.frustumCulled = false; spine.add(m); return m; });
    sirt.push({ tp, x: d[0], y: d[1], yan: d[2], boy: d[3], faz: i * 1.7, dm, lag: new V3(), pts: Array.from({ length: SEGS + 1 }, () => new V3()) });
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
    const hm = new THREE.HemisphereLight(0x9a80ff, 0x201030, 1.6); G.sahne.add(hm);
    const gunes = new THREE.DirectionalLight(0xffe8d0, 4); gunes.position.set(3, 5, 4); G.sahne.add(gunes);
    const rim = new THREE.PointLight(0x20f0e0, 18, 12); rim.position.set(-3, 2.5, -2); G.sahne.add(rim);
    const amb = new THREE.AmbientLight(0xb8a8ff, 1.2); G.sahne.add(amb);
    sahneEk.push(hm, gunes, rim, amb);
    const zem = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshStandardMaterial({ color: 0x120a22, roughness: 0.5, metalness: 0.3 }));
    zem.rotation.x = -Math.PI / 2; zem.position.y = -0.002; G.sahne.add(zem);
    const gh = new THREE.GridHelper(60, 60, 0x4a2a8a, 0x241046); G.sahne.add(gh);
    sahneEk.push(zem, gh);
  }

  // ---------- dev: dünya efektleri (iz decal'i, düşen damlalar) ----------
  const dunya = new THREE.Group(); dunya.name = 'zifirDunya'; G.sahne.add(dunya);
  const izTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 31);
    gr.addColorStop(0, 'rgba(3,1,8,0.96)'); gr.addColorStop(0.66, 'rgba(6,2,14,0.9)'); gr.addColorStop(0.86, 'rgba(110,40,190,0.55)'); gr.addColorStop(1, 'rgba(110,40,190,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  })();
  const izGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const izPool = Array.from({ length: 20 }, () => {
    const m = new THREE.Mesh(izGeo, new THREE.MeshBasicMaterial({ map: izTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.visible = false; m.userData.t = 9; dunya.add(m); return m;
  });
  function izBirak(x, y, z, yaw, sx, sz) {
    const m = izPool[izi++ % izPool.length];
    m.position.set(x, y + 0.04, z); m.rotation.set(0, yaw, 0); m.userData.t = 0; m.userData.sx = sx; m.userData.sz = sz; m.visible = true;
  }
  const damlaGeo = new THREE.SphereGeometry(1, 10, 8);
  const damlaH = Array.from({ length: 14 }, () => { const m = new THREE.Mesh(damlaGeo, mat); m.visible = false; m.userData.v = new V3(); dunya.add(m); return m; });
  function damlaSaç() {
    const p = grup.position;
    damlaH.forEach((m, i) => {
      const a = i / damlaH.length * Math.PI * 2 + Math.random();
      m.position.set(p.x + Math.cos(a) * 0.6 * devS, p.y + 0.4 + Math.random() * 2.6 * devS * 0.6, p.z + Math.sin(a) * 0.6 * devS);
      m.userData.v.set(Math.cos(a) * (1 + Math.random() * 1.5), 1 + Math.random() * 2, Math.sin(a) * (1 + Math.random() * 1.5));
      m.scale.setScalar(0.07 + Math.random() * 0.08); m.visible = true;
    });
  }
  function dunyaGuncelle(dt) {
    for (const m of izPool) {
      if (!m.visible) continue;
      const u = m.userData; u.t += dt;
      if (u.t >= 2) { m.visible = false; continue; }
      m.material.opacity = 1 - u.t / 2; const k = 1 + 0.15 * u.t; m.scale.set(u.sx * k, 1, u.sz * k);
    }
    const gy = grup.position.y;
    for (const m of damlaH) {
      if (!m.visible) continue;
      const v = m.userData.v; v.y -= 16 * dt; m.position.addScaledVector(v, dt);
      if (m.position.y < gy + 0.05) { m.visible = false; izBirak(m.position.x, gy, m.position.z, Math.random() * 6, 0.35, 0.35); }
    }
  }

  // ---------- durum ----------
  const KEYS = ['hy', 'kp', 'kr', 'ky', 'sx', 'sy', 'sz', 'bx', 'by'];
  for (let i = 0; i < 2; i++) KEYS.push('ax' + i, 'az' + i, 'ay' + i, 'ae' + i, 'lx' + i, 'lz' + i, 'lk' + i);
  const cur = {}, hd = {}; for (const k of KEYS) cur[k] = hd[k] = 0;
  const son = { durum: 'dur', hiz: new V3(), yerde: true, dev: false };
  let ct = 0, stepAcc = 0, stepSide = 1, izi = 0, dDevS = 2.0, slamBekle = false;
  let bitFlas = 0, durumT = 0, sayac = 0, ph = 0, devS = 1, devV = 0, devK = 0, pud = 0, hs = 0, sp = 0;
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
      k.tp.guncelle(k.pts, 0.095 * (1 + 0.4 * devK), 0.045 * (1 + 0.4 * devK), 0.3);
    }
  }

  function sirtGuncelle(t) {
    t = t || 0;
    const stream = yumus(2, 18, sp), enerji = 1 + 1.1 * devK, tz = t * (1 + 1.1 * devK);
    for (const d of sirt) {
      const s = Math.sign(d.yan), ls = d.pts;
      let dir = new V3(s * 0.45, 0.75, -0.55).normalize().lerp(new V3(s * 0.15, 0.25, -1), stream * 0.8).normalize();
      const l = d.boy * (1 + 1.5 * devK) / SEGS;
      ls[0].set(d.x, d.y, -0.15);
      const curl = (0.1 + 0.12 * Math.sin(tz * 1.7 + d.faz)) * (1 - 0.65 * stream) * enerji;
      for (let i = 1; i <= SEGS; i++) {
        const a1 = curl + 0.05 * Math.sin(tz * 2.3 + d.faz + i * 0.45) * enerji + devK * 0.1 * Math.sin(tz * 4.2 - i * 0.6 + d.faz);
        const a2 = (0.16 * Math.sin(tz * 1.3 + d.faz * 2 + i * 0.35) + s * 0.04) * enerji + devK * 0.18 * Math.sin(tz * 3.1 - i * 0.5 + d.faz * 2);
        dir.applyAxisAngle(AX, a1).applyAxisAngle(AY, a2 * 0.5).normalize();
        ls[i].copy(ls[i - 1]).addScaledVector(dir, l);
      }
      d.tp.guncelle(ls, 0.085 * (1 + 0.7 * devK), 0.012 + 0.03 * devK, 1);
      const par = d.tp.mesh.parent;
      for (let j = 0; j < 2; j++) {
        const m = d.dm[j];
        if (m.parent !== par && par) par.add(m);
        m.visible = devK > 0.05;
        if (!m.visible) continue;
        if (j === 0) { m.position.copy(ls[SEGS]).addScaledVector(dir, 0.05 * devK); m.scale.setScalar((0.045 + 0.012 * Math.sin(t * 9 + d.faz)) * devK + 0.001); }
        else { d.lag.lerp(ls[SEGS], 0.12); d.lag.addScaledVector(dir, 0.003); m.position.copy(d.lag).addScaledVector(dir, -0.07); m.scale.setScalar(0.03 * devK + 0.001); }
      }
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
  function elNoktasi(taraf) { if (gc) return gc.el(taraf); return yumruk[taraf === 'sag' ? 1 : 0].getWorldPosition(new V3()); }
  function devOl(a) {
    a = !!a; if (a === son.dev) return;
    son.dev = a;
    if (a) { bitFlas = 1; if (!izole) { G.efekt?.sars?.(0.5, 0.6); G.efekt?.flas?.('#5b2a86', 0.3); G.efekt?.yavasCekim?.(0.5, 0.5); } }
    else damlaSaç();
  }

  G.kahraman = { grup, ayarla, dokunac, elNoktasi, devOl };

  // ---------- GERÇEK MODEL: assets/3d/zifir_ual.glb (CC0, DEF-* kemikler) ----------
  // Yüklenene / hata verene kadar prosedürel model görünür. Hata = prosedürel kalır.
  const YOL = 'assets/3d/zifir_ual.glb';
  const KALIN = { spine002: [1.2, 1, 1.12], spine003: [1.18, 1, 1.1], upper_arm: [1.32, 1, 1.32], forearm: [1.25, 1, 1.25], thigh: [1.25, 1, 1.25], shin: [1.12, 1, 1.12], hand: [1.22, 1.22, 1.22], f_: [1.25, 1.25, 1.25], thumb: [1.25, 1.25, 1.25] };
  const DEVKAL = { spine002: [1.2, 1, 1.15], spine003: [1.3, 1, 1.22], shoulder: [1.2, 1.2, 1.2], upper_arm: [1.3, 1.05, 1.3], forearm: [1.35, 1.05, 1.35], hand: [1.35, 1.35, 1.35], thigh: [1.08, 1, 1.08], shin: [1.1, 1, 1.1] };
  const ALT = /(hips|thigh|shin|foot|toe|^root)/i;
  const dikW = [];

  function gercekKur(gltf) {
    const gm = gltf.scene, kok = new THREE.Group(), piv = new THREE.Group();
    kok.add(gm); piv.add(kok);
    const meshes = [], B = {}, bonelar = [];
    gm.traverse(o => { if (o.isBone) { B[o.name.replace(/[.:]/g, '')] = o; bonelar.push(o); } if (o.isSkinnedMesh) meshes.push(o); });
    const kb = (ad) => B['DEF-' + ad];
    for (const n of ['hips', 'spine001', 'spine002', 'spine003', 'head', 'upper_armL', 'upper_armR', 'forearmL', 'forearmR', 'handL', 'handR', 'thighL', 'thighR', 'shinL', 'shinR', 'footL', 'toeL']) if (!kb(n)) throw new Error('kemik yok: ' + n);
    if (!meshes.length || !gltf.animations?.length) throw new Error('mesh/animasyon yok');

    const olc = () => { kok.updateMatrixWorld(true); const b = new THREE.Box3(); for (const m of meshes) { m.skeleton.update(); m.computeBoundingBox(); b.union(m.boundingBox.clone().applyMatrix4(m.matrixWorld)); } return b; };
    const bw = (b, v = new V3()) => v.setFromMatrixPosition(b.matrixWorld);
    kok.updateMatrixWorld(true);
    if (bw(kb('toeL')).z < bw(kb('footL')).z - 0.01) gm.rotation.y = Math.PI;
    let bb0 = olc();
    const sk = 1.82 / (bb0.max.y - bb0.min.y);
    gm.scale.setScalar(sk); bb0 = olc();
    const minY = bb0.min.y;

    const koseler = (adlar) => {
      const set = new Set(adlar.map(a => kb(a))), out = [], v = new V3();
      for (const m of meshes) {
        const bn = m.skeleton.bones, gg = m.geometry, si = gg.attributes.skinIndex, sw = gg.attributes.skinWeight;
        for (let i = 0; i < si.count; i++) {
          let mk = 0, mw = -1; for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > mw) { mw = w; mk = k; } }
          if (set.has(bn[si.getComponent(i, mk)])) { m.getVertexPosition(i, v); out.push(v.clone().applyMatrix4(m.matrixWorld)); }
        }
      }
      return out;
    };
    const basK = koseler(['head']);
    const bas = new THREE.Box3().setFromPoints(basK);
    const govdeK = koseler(['spine001', 'spine002', 'spine003']);
    const omuzY = (bw(kb('upper_armL')).y + bw(kb('upper_armR')).y) / 2;
    const yc = omuzY - 0.12;
    let zOn = -9, zArka = 9, gen = 0;
    for (const p of govdeK) {
      if (Math.abs(p.x) < 0.04 && Math.abs(p.y - yc) < 0.06) { zOn = Math.max(zOn, p.z); zArka = Math.min(zArka, p.z); }
      if (Math.abs(p.y - yc) < 0.08) gen = Math.max(gen, Math.abs(p.x));
    }
    if (zOn < -8 || zArka > 8 || !(bas.max.y > bas.min.y)) throw new Error('gövde/baş ölçülemedi');
    console.info('[ZIFIR] kahraman ölçü', JSON.stringify({ sk, minY, bas: [bas.min.toArray(), bas.max.toArray()], omuzY, zOn, zArka, gen }));

    // ---- kemik bağlı aksesuarlar ----
    const eks = [];
    const ekle = (kemik, sarmal) => {
      const m = new THREE.Matrix4().copy(kok.matrixWorld).invert().multiply(kemik.matrixWorld);
      const p = new V3(), q = new THREE.Quaternion(), s = new V3(); m.decompose(p, q, s);
      kok.add(sarmal);
      eks.push({ kemik, sarmal, rp: p, rqi: q.clone().invert() });
    };
    {
      const H = bas.max.y - bas.min.y, W = bas.max.x - bas.min.x, D = bas.max.z - bas.min.z;
      const cx = (bas.max.x + bas.min.x) / 2, cy = (bas.max.y + bas.min.y) / 2, cz = (bas.max.z + bas.min.z) / 2;
      const sc = H / 0.36;
      const kafaE = new THREE.Group(); kafaE.scale.setScalar(sc);
      kafaE.position.set(cx, cy - 0.1 * sc, cz - 0.0 * sc);
      kafaE.add(damlaUc);
      const w = new THREE.Group(); w.add(kafaE);
      const gs = 0.5 * H / 0.28;
      gozler.forEach((piv, i) => {
        const sg = i ? -1 : 1, x = sg * 0.3 * W, y = cy + 0.02 * H;
        let zy = -9; for (const q of basK) if (Math.abs(q.x - x) < 0.025 && Math.abs(q.y - y) < 0.03 && q.z > zy) zy = q.z;
        if (zy < -8) zy = cz + (D / 2) * Math.sqrt(Math.max(0.05, 1 - Math.pow(x / (W / 2), 2) - Math.pow((y - cy) / (H / 2), 2)));
        piv.position.set(x, y, zy + 0.012); piv.scale.setScalar(gs); piv.userData.bx = gs; piv.rotation.y = sg * 0.18; w.add(piv);
      });
      ekle(kb('head'), w);
    }
    {
      const k = Math.min(1.1, Math.max(0.6, gen / 0.31));
      const tasG = new THREE.Group(); tasG.position.set(0, yc, zOn); tasG.scale.setScalar(k);
      tas.position.set(0, 0, 0.05); yuva.position.set(0, 0, 0.03); hale.position.set(0, 0, 0.075);
      tasG.add(tas, yuva, hale);
      const arkaG = new THREE.Group(); arkaG.position.set(0, yc, zArka); arkaG.scale.setScalar(k);
      tas2.position.set(0, 0, -0.012); hale2.position.set(0, 0, -0.03); arkaG.add(tas2, hale2);
      const w = new THREE.Group(); w.add(tasG, arkaG);
      ekle(kb('spine003'), w);
    }
    {
      const sG = new THREE.Group(); sG.position.set(0, omuzY - 0.54, zArka + 0.12); sG.scale.setScalar(0.85);
      for (const d of sirt) sG.add(d.tp.mesh);
      const w = new THREE.Group(); w.add(sG);
      ekle(kb('spine002'), w);
    }

    // ---- jöle dikenleri (omuz + kol), kemiğe bağlı, tek birleşik mesh / kemik ----
    {
      const kl = (b) => kok.worldToLocal(bw(b, new V3()));
      const spkMat = jeleMat(uni, envMap, true);
      const bagla = (kemik, geos) => {
        const m = new THREE.Mesh(mergeGeometries(geos), spkMat); m.frustumCulled = false; m.castShadow = false;
        const w = new THREE.Group(); w.add(m); w.visible = false; ekle(kemik, w); dikW.push(w);
      };
      const sagSol = [['L', 1], ['R', -1]];
      const ust = [], on_ = [], omz = [];
      for (const [a] of sagSol) {
        const P0 = kl(kb('upper_arm' + a)), P1 = kl(kb('forearm' + a)), P2 = kl(kb('hand' + a));
        const sg = Math.sign(P0.x) || 1, uo = new V3(sg, 0, 0);
        const eg = (P, Q, u, off, yon, bukul, boy, r) => dikenGeo(P.clone().lerp(Q, u).addScaledVector(uo, off), yon, bukul, boy, r);
        omz.push(
          eg(P0, P1, 0.0, 0.06, new V3(sg * 0.55, 0.85, -0.25), new V3(sg * 0.4, 0.3, -0.6), 0.34, 0.05),
          eg(P0, P1, 0.0, 0.08, new V3(sg * 0.9, 0.45, -0.3), new V3(sg * 0.3, 0.4, -0.7), 0.28, 0.045),
          eg(P0, P1, 0.0, 0.04, new V3(sg * 0.25, 0.9, -0.55), new V3(0, 0.4, -0.8), 0.24, 0.04));
        ust.push(
          eg(P0, P1, 0.35, 0.07, new V3(sg * 0.8, 0.35, -0.5), new V3(sg * 0.2, 0.3, -0.8), 0.26, 0.04),
          eg(P0, P1, 0.7, 0.07, new V3(sg * 0.75, 0.2, -0.6), new V3(sg * 0.2, 0.3, -0.8), 0.22, 0.036));
        on_.push(
          eg(P1, P2, 0.2, 0.06, new V3(sg * 0.6, 0.25, -0.75), new V3(sg * 0.1, 0.3, -0.9), 0.32, 0.04),
          eg(P1, P2, 0.5, 0.06, new V3(sg * 0.6, 0.2, -0.78), new V3(sg * 0.1, 0.3, -0.9), 0.28, 0.036),
          eg(P1, P2, 0.78, 0.05, new V3(sg * 0.55, 0.15, -0.8), new V3(sg * 0.1, 0.3, -0.9), 0.2, 0.03));
        bagla(kb('upper_arm' + a), ust.splice(0)); bagla(kb('forearm' + a), on_.splice(0));
      }
      bagla(kb('spine003'), omz);
    }

    const ex0 = bw(kb('handL')).x > bw(kb('handR')).x;
    const mk = (a, b) => ({ ust: kb('upper_arm' + a), on: kb('forearm' + a), el: kb('hand' + a), uyluk: kb('thigh' + a), baldir: kb('shin' + a) });
    const K = { sol: mk(ex0 ? 'L' : 'R'), sag: mk(ex0 ? 'R' : 'L') };
    const elK = { sol: new V3(), sag: new V3() };

    const sm = jeleMat(uni, envMap); sm.customProgramCacheKey = () => 'zifirjele2s';
    { // maske için gövde yüksekliği (bağ pozu geometri uzayı)
      let y0 = 1e9, y1 = -1e9;
      for (const m of meshes) { m.geometry.computeBoundingBox(); y0 = Math.min(y0, m.geometry.boundingBox.min.y); y1 = Math.max(y1, m.geometry.boundingBox.max.y); }
      const uniS = Object.assign({}, uni, { uYm: { value: y0 }, uYh: { value: Math.max(0.01, y1 - y0) } });
      sm.onBeforeCompile = ((eski) => (sh) => { eski(sh); sh.uniforms.uYm = uniS.uYm; sh.uniforms.uYh = uniS.uYh; })(sm.onBeforeCompile);
    }
    for (const m of meshes) { m.material = sm; m.castShadow = true; m.frustumCulled = false; }

    const mixer = new THREE.AnimationMixer(gm);
    const klip = {}; for (const c of gltf.animations) klip[c.name] = c;
    const onbellek = {};
    const aksiyon = (ad, kn) => {
      const key = ad + '|' + kn; if (onbellek[key]) return onbellek[key];
      const c = klip[ad] || klip.Idle_Loop;
      const tr = c.tracks.filter(t => { const bn = t.name.split('.')[0]; return kn === 'a' ? ALT.test(bn) : !ALT.test(bn); });
      return (onbellek[key] = mixer.clipAction(new THREE.AnimationClip(ad + kn, c.duration, tr)));
    };
    const sure = (ad) => (klip[ad] || klip.Idle_Loop).duration;
    const kanal = { a: { ad: null, act: null, tazele: false }, u: { ad: null, act: null, tazele: false } };
    const gec = (kn, ad, ts, tek, fade) => {
      const k = kanal[kn], yeni = aksiyon(ad, kn);
      if (k.ad === ad && !k.tazele) { k.act.timeScale = ts; return; }
      const diger = kanal[kn === 'a' ? 'u' : 'a'];
      yeni.enabled = true; yeni.reset(); yeni.timeScale = ts; yeni.weight = 1;
      yeni.setLoop(tek ? THREE.LoopOnce : THREE.LoopRepeat, tek ? 1 : Infinity); yeni.clampWhenFinished = !!tek;
      if (!tek && diger.ad === ad && diger.act) yeni.time = diger.act.time;
      if (k.act && k.act !== yeni) yeni.crossFadeFrom(k.act, fade, false); else yeni.fadeIn(fade);
      yeni.play(); k.ad = ad; k.act = yeni; k.tazele = false;
    };

    const g = { d: 'dur', dt: 0, tek: null, tekT: 0, inis: 0, yuvarlan: -1, flip: 0, flipT: 0, pivX: 0, kokZ: 0, kokY: 0, kick: -1, komboSifir: null, kombo: 0, slam: -1, slamHit: false };
    function tekBaslat(ad, ts, kes, kapsam) {
      g.tek = { ad, ts, kes, kapsam: kapsam || (hs > 2.5 || !son.yerde ? 'ust' : 'tam') }; g.tekT = 0;
      kanal.a.tazele = kanal.u.tazele = true;
    }
    function kombo(v) {
      let n = v?.komboNo;
      if (!Number.isFinite(n)) n = (g.say = ((g.say ?? -1) + 1) % 4) + 1;
      else { if (g.komboSifir === null) g.komboSifir = (n === 0); if (g.komboSifir) n += 1; }
      g.kombo = n;
      if (n === 1) tekBaslat('Punch_Jab', 1.7, 0.42);
      else if (n === 2) tekBaslat('Punch_Cross', 1.7, 0.45);
      else if (n === 3) { tekBaslat('Punch_Cross', 1.5, 0.5); g.kick = 0; }
      else { tekBaslat('Spell_Simple_Shoot', 1.3, 0.7); bitFlas = 1; }
    }
    const on = (ad, fn) => G.olay?.on?.(ad, fn);
    on('yumruk', kombo);
    on('bitirici', () => { bitFlas = 1; if (son.dev) { g.slam = 0; g.slamHit = false; } if (g.kombo !== 4) tekBaslat('Spell_Simple_Shoot', 1.3, 0.7); });
    on('hasar', () => { if (g.d !== 'hasar') tekBaslat('Hit_Chest', 1.4, 0.45); });
    on('yere', (v) => { if (son.dev && devK > 0.6) { G.efekt?.sars?.(0.3, 0.3); const p = grup.position; izBirak(p.x, p.y, p.z, 0, 2.6, 2.6); } g.inis = 0.32; if (Math.abs(v?.hiz ?? 0) > 13 && hs > 5) g.yuvarlan = 3; });
    on('kacis', () => { g.yuvarlan = 3; });
    on('mukemmelBirakis', () => { g.flip = 0.0001; g.flipT = 0.75; });
    on('konus', () => { if (!g.tek) tekBaslat('Jump_Land', 1.1, 0.5, 'tam'); });

    const ESLE = { dur: 'dur', yuru: 'yuru', kos: 'kos', zipla: 'zipla', dus: 'dus', sallan: 'sallan', cek: 'sallan', duvar: 'duvar', duvarKos: 'duvar', zip: 'zip', yumruk: 'yumruk', kamci: 'kamci', hasar: 'hasar', dogus: 'dogus', numara: 'dus', kacis: 'dus', konus: 'dur' };
    const esle = (ad) => {
      if (ESLE[ad]) return ESLE[ad];
      const l = String(ad).toLowerCase();
      for (const [a, v] of [['duvar', 'duvar'], ['kos', 'kos'], ['yur', 'yuru'], ['sal', 'sallan'], ['cek', 'sallan'], ['zip', 'zip'], ['yum', 'yumruk'], ['kam', 'kamci'], ['has', 'hasar'], ['dog', 'dogus'], ['dus', 'dus']]) if (l.includes(a)) return v;
      return 'dur';
    };

    const qe = new THREE.Quaternion(), eu = new THREE.Euler(), _p = new V3(), _s = new V3(), _q = new THREE.Quaternion(), qd = new THREE.Quaternion(), qu = new THREE.Quaternion(), qp = new THREE.Quaternion(), qI = new THREE.Quaternion();
    const d1 = new V3(), d2 = new V3(), wp = new V3(), wc = new V3(), hed = new V3();
    const ek = (kemik, x, y, z) => { eu.set(x, y, z); qe.setFromEuler(eu); kemik.quaternion.multiply(qe); kemik.updateMatrixWorld(true); };
    function yonelt(ust, alt, hedef, w) {
      bw(ust, wp); bw(alt, wc);
      d1.subVectors(wc, wp).normalize(); d2.subVectors(hedef, wp);
      if (d2.lengthSq() < 1e-6) return; d2.normalize();
      qd.setFromUnitVectors(d1, d2); if (w < 1) { qI.identity().slerp(qd, w); qd.copy(qI); }
      ust.matrixWorld.decompose(_p, qu, _s); qu.premultiply(qd);
      ust.parent.matrixWorld.decompose(_p, qp, _s); qp.invert();
      ust.quaternion.copy(qp.multiply(qu)); ust.updateMatrixWorld(true);
    }
    const kolUzat = (t, hedef, w) => { yonelt(t.ust, t.on, hedef, w); yonelt(t.on, t.el, hedef, w); };

    const ABD = +(QS.get('abd') ?? 0.3), PUN = +(QS.get('pun') ?? 0.5);
    const qk = new THREE.Quaternion(), vv = new V3(), omuzP = new V3(), invK = new THREE.Matrix4(), mm = new THREE.Matrix4();
    const fwd = new V3(), upV = new V3(), yanSol = new V3(), dirV = new V3(), tmpH = new V3();

    let izAcc = 0;
    function guncelle(dt, t) {
      if (!izole) return adim(dt, t);
      const an = parseFloat(QS.get('an')) || 3;   // test: ilk karede an sn ileri sar, sonra dondur
      while (izAcc < an) { adim(0.04, t); izAcc += 0.04; }
      adim(0, t);
    }
    function adim(dt, t) {
      grup.updateMatrixWorld(true);
      const d = esle(son.durum);
      const girdi = d !== g.d; if (girdi) { g.d = d; g.dt = 0; }
      g.dt += dt;
      const havada = !son.yerde;
      const egik = vv.set(0, 1, 0).applyQuaternion(grup.quaternion).y < 0.9;
      if (egik) g.yuvarlan = -1;
      if (g.yuvarlan > 0) { g.yuvarlan -= 1; if (g.yuvarlan <= 0) { g.yuvarlan = -2; tekBaslat('Roll', 1.5, 0.55, 'tam'); } }
      if (g.inis > 0) g.inis -= dt;
      if (g.flipT > 0) { g.flip += dt / 0.75; if (g.flip >= 1) { g.flip = 0; g.flipT = 0; } }

      if (girdi) {
        if (d === 'yumruk' && !(g.tek && /Punch|Spell/.test(g.tek.ad))) kombo(QS.has('kombo') ? { komboNo: +QS.get('kombo') } : null);
        if (d === 'kamci') tekBaslat('Spell_Simple_Shoot', 1.8, 0.45);
        if (d === 'hasar' && !(g.tek && g.tek.ad === 'Hit_Chest')) tekBaslat('Hit_Chest', 1.4, 0.45);
      }
      if (izole && d === 'yumruk' && g.dt > 1.0 && !g.tek) { g.dt = 0; kombo({ komboNo: (g.say = ((g.say ?? -1) + 1) % 4) + 1 }); }
      if (g.tek) { g.tekT += dt; if (g.tekT > g.tek.kes) g.tek = null; }
      if (g.kick >= 0) { g.kick += dt; if (g.kick > 0.55) g.kick = -1; }

      let lo = 'Idle_Loop', loTs = 1, tekr = false;
      switch (d) {
        case 'yuru': lo = hs < 3.4 ? 'Walk_Loop' : 'Jog_Fwd_Loop'; loTs = hs < 3.4 ? kisitla(hs / 1.5, 0.7, 1.9) : kisitla(hs / 4.4, 0.85, 1.5); break;
        case 'kos': lo = hs < 7.5 ? 'Jog_Fwd_Loop' : 'Sprint_Loop'; loTs = hs < 7.5 ? kisitla(hs / 4.4, 0.85, 1.7) : kisitla(hs / 8, 0.85, 1.6); break;
        case 'zipla': if (g.dt < sure('Jump_Start') * 0.85 && havada) { lo = 'Jump_Start'; tekr = true; } else lo = 'Jump_Loop'; break;
        case 'dus': case 'sallan': case 'zip': lo = 'Jump_Loop'; break;
        case 'duvar': lo = 'Idle_Loop'; loTs = 0.6; break;
        case 'yumruk': case 'kamci': case 'hasar': if (hs > 0.8) { lo = hs < 7.5 ? 'Jog_Fwd_Loop' : 'Sprint_Loop'; loTs = kisitla(hs / 5, 0.8, 1.5); } break;
      }
      if (devK > 0.01 && (d === 'yuru' || d === 'kos')) loTs *= 1 - 0.4 * devK;
      if (egik) { lo = 'Jump_Loop'; loTs = 1; tekr = false; }
      else if (g.inis > 0 && d === 'dur' && !g.tek) { lo = 'Jump_Land'; tekr = true; loTs = 1.3; }
      let uA = lo, uTs = loTs, aA = lo, aTs = loTs, aTek = tekr, uTek = tekr;
      if (g.tek) {
        uA = g.tek.ad; uTs = g.tek.ts; uTek = true;
        if (g.tek.kapsam === 'tam' && !havada) { aA = g.tek.ad; aTs = g.tek.ts; aTek = true; }
      }
      const fade = g.tek ? 0.1 : 0.17;
      gec('a', aA, aTs, aTek, fade);
      gec('u', uA, uTs, uTek, fade);
      mixer.update(dt);

      for (const bn of bonelar) {
        const ad = bn.name.replace('DEF-', '').replace(/[LR]$/, '');
        const kk = KALIN[ad] || (ad.startsWith('f_') ? KALIN.f_ : ad.startsWith('thumb') ? KALIN.thumb : null);
        const dk = devK > 0.001 ? DEVKAL[ad] : null;
        if (kk || dk) {
          const a0 = kk || [1, 1, 1];
          bn.scale.set(a0[0] * (dk ? 1 + (dk[0] - 1) * devK : 1), a0[1] * (dk ? 1 + (dk[1] - 1) * devK : 1), a0[2] * (dk ? 1 + (dk[2] - 1) * devK : 1));
        }
      }
      gm.updateMatrixWorld(true);

      kok.getWorldQuaternion(qk);
      const solT = K.sol, sagT = K.sag;
      fwd.set(0, 0, 1).applyQuaternion(qk); upV.set(0, 1, 0).applyQuaternion(qk); yanSol.set(1, 0, 0).applyQuaternion(qk);
      const e = Math.atan2(son.hiz.y, Math.max(0.5, hs));
      let pivH = 0, kokZh = 0;
      if (devK > 0.01) { ek(solT.ust, 0, 0, ABD * devK); ek(sagT.ust, 0, 0, -ABD * devK); }
      if (egik) {
        for (const T of [solT, sagT]) { ek(T.uyluk, -1.35, 0, 0); ek(T.baldir, 1.8, 0, 0); }
      } else if (d === 'sallan') {
        pivH = kisitla(0.55 - 0.5 * e, 0.1, 1.0);
        const r = ten.sag.aktif ? 'sag' : (ten.sol.aktif ? 'sol' : 'sag');
        const o = r === 'sag' ? 'sol' : 'sag';
        const hedefP = ten[r].aktif ? ten[r].bit : tmpH.copy(bw(K[r].ust, omuzP)).addScaledVector(upV, 3).addScaledVector(fwd, 1.5);
        kolUzat(K[r], hedefP, 1);
        hed.copy(bw(K[o].ust, omuzP)).addScaledVector(fwd, -0.9).addScaledVector(upV, -0.5).addScaledVector(yanSol, (o === 'sol' ? 1 : -1) * 0.7);
        kolUzat(K[o], hed, 0.75);
        const sw = Math.sin(t * 3);
        ek(solT.uyluk, -0.5 - 0.08 * sw, 0, 0); ek(solT.baldir, 1.0, 0, 0);
        ek(sagT.uyluk, -0.15, 0, 0); ek(sagT.baldir, 1.5 + 0.1 * sw, 0, 0);
      } else if (d === 'zip') {
        if (sp > 1) dirV.copy(son.hiz).normalize(); else dirV.copy(fwd);
        pivH = kisitla(Math.PI / 2 - e, 0.2, 1.6);
        for (const T of [solT, sagT]) { hed.copy(bw(T.ust, omuzP)).addScaledVector(dirV, 4); kolUzat(T, hed, 1); ek(T.uyluk, 0.25, 0, 0); ek(T.baldir, 0.3, 0, 0); }
      } else if (d === 'dus') {
        pivH = 0.12;
        const fl = Math.sin(t * 13) * 0.12;
        for (const T of [solT, sagT]) {
          const s = T === solT ? 1 : -1;
          hed.copy(bw(T.ust, omuzP)).addScaledVector(yanSol, s * 3).addScaledVector(upV, 0.9 + fl).addScaledVector(fwd, -0.25);
          kolUzat(T, hed, 0.85);
        }
        ek(solT.uyluk, -0.2, 0, 0.1); ek(sagT.uyluk, 0.2, 0, -0.1);
      } else if (d === 'duvar') {
        // dört uzuvlu tırmanış: gövde duvara eğik, kollar dönüşümlü yukarı uzanır, dizler dönüşümlü kalkar
        pivH = 0.22; kokZh = 0.1;
        const hizli = son.durum === 'duvarKos' ? 1.5 : 1, ac = sp > 0.4 ? 1 : 0.15;
        for (let i = 0; i < 2; i++) {
          const T = i ? sagT : solT, f = ph * hizli + i * Math.PI, sn = Math.sin(f), yk = (0.5 + 0.5 * sn) * ac;
          hed.copy(bw(T.ust, omuzP)).addScaledVector(upV, 0.35 + 0.65 * yk).addScaledVector(fwd, 0.55).addScaledVector(yanSol, (i ? -1 : 1) * 0.12);
          kolUzat(T, hed, 1);
          const bk = (0.5 - 0.5 * sn) * ac;
          ek(T.uyluk, -0.35 - 1.0 * bk, (i ? -1 : 1) * 0.15 * bk, 0); ek(T.baldir, 0.5 + 1.0 * bk, 0, 0);
        }
      } else if (d === 'kamci' && ten.kamci.aktif) {
        kolUzat(solT, ten.kamci.bit, 0.9);
      }
      if (devK > 0.2 && g.tek && /Punch|Spell/.test(g.tek.ad)) {
        const k = Math.sin(kisitla(g.tekT / g.tek.kes, 0, 1) * Math.PI) * devK;
        ek(solT.ust, 0, PUN * k, 0); ek(sagT.ust, 0, -PUN * k, 0);
      }
      if (g.slam >= 0 && devK > 0.5 && !havada) {
        g.slam += dt; const p = g.slam / 1.0;
        const yk = yumus(0, 0.4, p) * (1 - yumus(0.42, 0.5, p)), vr = yumus(0.42, 0.5, p) * (1 - yumus(0.8, 1, p));
        for (const T of [solT, sagT]) {
          hed.copy(bw(T.ust, omuzP)).addScaledVector(upV, -1 + 3.5 * yk - 1.2 * vr).addScaledVector(fwd, 0.3 - 0.8 * yk + 1.2 * vr).addScaledVector(yanSol, (T === solT ? 1 : -1) * 0.6);
          kolUzat(T, hed, 1);
        }
        pivH = Math.max(pivH, 0.5 * vr) - 0.15 * yk;
        if (!g.slamHit && p > 0.46) {
          g.slamHit = true; G.efekt?.sars?.(0.55, 0.4); G.efekt?.vurusDuraklat?.(0.06);
          const gp = grup.getWorldPosition(new V3()), fz = fwd;
          izBirak(gp.x + fz.x * 1.9 * devS * 0.5, gp.y, gp.z + fz.z * 1.9 * devS * 0.5, 0, 3.2, 3.2);
        }
        if (p > 1) g.slam = -1;
      }
      if (devK > 0.01 && !egik && d !== 'sallan' && d !== 'zip' && d !== 'duvar') pivH += 0.16 * devK;
      if (g.kick >= 0 && !havada) {
        const k = Math.sin(kisitla(g.kick / 0.5, 0, 1) * Math.PI);
        ek(sagT.uyluk, -1.6 * k, 0, 0); ek(sagT.baldir, 0.5 * k, 0, 0);
      }
      const yum = 1 - Math.exp(-dt * 10);
      g.pivX += (pivH - g.pivX) * yum; g.kokZ += (kokZh - g.kokZ) * yum;
      let fa = 0; if (g.flip > 0) { const f = g.flip; fa = (f < 0.5 ? 2 * f * f : 1 - 2 * (1 - f) * (1 - f)) * Math.PI * 2; }
      piv.rotation.x = g.pivX + fa;
      kok.position.z = g.kokZ;
      piv.updateMatrixWorld(true);

      invK.copy(kok.matrixWorld).invert();
      for (const a of eks) {
        mm.multiplyMatrices(invK, a.kemik.matrixWorld).decompose(_p, _q, _s);
        _q.multiply(a.rqi);
        a.sarmal.quaternion.copy(_q);
        a.sarmal.position.copy(a.rp).applyQuaternion(_q).negate().add(_p);
      }
      for (const ad of ['sol', 'sag']) {
        const T = K[ad];
        mm.multiplyMatrices(invK, T.el.matrixWorld); _p.setFromMatrixPosition(mm);
        mm.multiplyMatrices(invK, T.on.matrixWorld); wc.setFromMatrixPosition(mm);
        elK[ad].copy(_p).addScaledVector(d2.subVectors(_p, wc).normalize(), 0.09);
      }
    }

    piv.position.y = 0.95;
    kok.position.y = -0.95 - minY;
    govde.add(piv);
    kalca.visible = false;
    gc = { hazir: true, guncelle, el: (taraf) => kok.localToWorld(elK[taraf === 'sag' ? 'sag' : 'sol'].clone()) };
    console.info('[ZIFIR] kahraman GLB hazır');
  }

  try {
    new GLTFLoader().load(YOL, (gltf) => {
      try { gercekKur(gltf); } catch (e) { console.warn('[ZIFIR] kahraman GLB kurulamadı, prosedürel:', e); gc = null; }
    }, undefined, (e) => console.warn('[ZIFIR] kahraman GLB yüklenemedi, prosedürel:', e));
  } catch (e) { console.warn('[ZIFIR] GLTFLoader hata:', e); }

  // ---------- test sürücüsü ----------
  const SIRA = ['dur', 'yuru', 'kos', 'zipla', 'dus', 'sallan', 'duvar', 'zip', 'yumruk', 'kamci', 'hasar', 'dogus'];
  const HIZ = { dur: [0, 0], yuru: [5, 0], kos: [15, 0], zipla: [3, 7], dus: [3, -14], sallan: [17, 3], duvar: [0, 3], zip: [26, 0], yumruk: [0, 0], kamci: [0, 0], hasar: [0, 0], dogus: [0, 0] };
  function testSur(dt) {
    const sabit = QS.get('durum');
    const idx = sabit ? SIRA.indexOf(sabit) : Math.floor(G.t) % SIRA.length;
    if (izole) { G.durum = 'duraklat'; const ar = document.getElementById('arayuz'); if (ar) ar.style.display = 'none'; }
    if (izole) { const benim = new Set([grup, ten.sol.tp.mesh, ten.sag.tp.mesh, ten.kamci.tp.mesh, izler[0].mesh, izler[1].mesh, ...Object.values(ten).map(k => k.sic.g), dunya, ...sahneEk]); for (const c of G.sahne.children) if (!benim.has(c)) c.visible = false; }
    if (idx !== testIdx) { testIdx = idx; grup.position.set(0, 0, 0); for (const z of izler) z.temizle(); if (QS.has('dev') && !son.dev) devOl(true); }
    const d = SIRA[Math.max(0, idx)], h = HIZ[d];
    ayarla({ durum: d, hiz: tmpV.set(0, h[1], h[0]), yerde: d === 'dur' || d === 'yuru' || d === 'kos' || d === 'yumruk' || d === 'kamci' || d === 'hasar' || d === 'dogus' });
    if (QS.has('slam') && !testSur.s) { testSur.s = 1; G.olay?.emit?.('bitirici', {}); }
    if (QS.has('dev')) { son.dev = true; ct = Math.max(ct, 0.999); }
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
    gozMat.emissiveIntensity = 0.45 + 1.0 * devK;
    gozler.forEach((g, i) => {
      const bx = g.userData.bx ?? 1, sg = i ? -1 : 1;
      g.scale.set(bx * (1 + 0.55 * devK), bl * (1 + 1.0 * devK), g.scale.z);
      g.rotation.z = -sg * 0.32 * devK;
      const h = g.userData.hale; if (h) { h.material.opacity = 0.7 * devK; h.scale.setScalar(1.5 + 0.25 * Math.sin(t * 3 + i)); }
    });

    // dev yayı
    const hedefS = son.dev ? dDevS : 1;
    devV += ((hedefS - devS) * 90 - devV * 9) * dt; devS += devV * dt;
    devK += ((son.dev ? 1 : 0) - devK) * (1 - Math.exp(-dt * (son.dev ? 3 : 6)));
    ct = kisitla(ct + (son.dev ? dt / 0.8 : -dt / 0.6), 0, 1);
    if (QS.has('ctsabit')) ct = +QS.get('ctsabit');
    const donP = Math.sin(Math.PI * ct);
    uni.uSis.value = donP * (son.dev ? 1 : -0.5); uni.uYay.value = ct * 1.7; uni.uSpk.value = yumus(0.25, 1, ct);
    for (const w of dikW) w.visible = ct > 0.02;
    // dev adımı: yer sarsıntısı + kara iz
    if (son.dev && devK > 0.5 && son.yerde && hs > 1 && (d === 'yuru' || d === 'kos')) {
      stepAcc += dt * hs;
      if (stepAcc > 2.3) {
        stepAcc = 0; stepSide = -stepSide;
        G.efekt?.sars?.(0.12, 0.15);
        const p = grup.position, yw = new THREE.Euler().setFromQuaternion(grup.quaternion, 'YXZ').y;
        izBirak(p.x + Math.cos(yw) * 0.55 * stepSide, p.y, p.z - Math.sin(yw) * 0.55 * stepSide, yw, 0.9, 1.5);
      }
    } else stepAcc = Math.min(stepAcc, 2.0);
    dunyaGuncelle(dt);

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
    uni.uT.value = t; uni.uDev.value = devK; uni.uAmp.value = 0.008 + 0.006 * yumus(0, 15, sp) + 0.007 * devK; uni.uPuls.value = 0;

    // Yürek Taşı
    const hz = 1.3 + 0.9 * devK, p = (t * hz) % 1;
    const bt = Math.exp(-Math.pow((p - 0.1) / 0.06, 2)) + 0.6 * Math.exp(-Math.pow((p - 0.3) / 0.07, 2));
    const renkK = 0.5 + 0.5 * Math.sin(t * 0.8 + bt * 0.5);
    tasMat.emissive.setRGB(0.65 + (0.05 - 0.65) * renkK, 0.2 + (0.95 - 0.2) * renkK, 1.0 + (0.9 - 1.0) * renkK);
    bitFlas *= Math.exp(-dt * 2.5);
    uni.uPuls.value = bt;
    tasMat.emissiveIntensity = 0.45 + 0.4 * bt + 0.6 * devK + 2.2 * bitFlas + 3 * donP;
    tas.scale.set(1 + 0.22 * bt, 1.15 + 0.22 * bt, 0.9 + 0.1 * bt).multiplyScalar(1 + 0.3 * devK);
    hale.material.color.copy(tasMat.emissive); hale.material.opacity = 0.16 + 0.2 * bt; hale.scale.setScalar(0.42 + 0.14 * bt + 0.2 * devK + 0.5 * bitFlas + 0.9 * donP); hale2.scale.copy(hale.scale); hale2.material.color.copy(hale.material.color); hale2.material.opacity = hale.material.opacity; tas2.scale.copy(tas.scale); tas2.scale.multiplyScalar(0.8);

    if (gc) gc.guncelle(dt, t);
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
      const c = tmpV.copy(grup.position); c.y += (parseFloat(QS.get('bak')) || 1.0) * (son.dev && !QS.has('bak') ? 1.9 : 1);
      const ox = 2.1, oz = 3.2;
      G.kamera.position.set(c.x + (ox * Math.cos(aci) + oz * Math.sin(aci)) * mes / 3.93, c.y + 0.9 * mes / 3.93, c.z + (oz * Math.cos(aci) - ox * Math.sin(aci)) * mes / 3.93);
      G.kamera.lookAt(c);
    }
  };
}

export function guncelle(G, dt) { G.__kahramanGuncelle?.(dt); }
