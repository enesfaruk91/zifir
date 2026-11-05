// Ana döngü — SOZLESME.md §3. Modüller dinamik yüklenir; eksik olan atlanır.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';

const hatalar = (window.__ZIFIR_HATALAR = []);
addEventListener('error', e => hatalar.push(String(e.message)));
addEventListener('unhandledrejection', e => hatalar.push(String(e.reason)));

const test = new URLSearchParams(location.search).has('test');
const canvas = document.getElementById('sahne');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.debug.onShaderError = (gl, program, vs, fs) => {
  const log = (gl.getShaderInfoLog(vs) || '') + (gl.getShaderInfoLog(fs) || '') + (gl.getProgramInfoLog(program) || '');
  hatalar.push('SHADER: ' + log.slice(0, 300)); console.error('[ZIFIR] SHADER HATASI', log);
};

renderer.info.autoReset = false;
const sahne = new THREE.Scene();
sahne.background = new THREE.Color(0x0a0618);
const kamera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 2500);
kamera.position.set(0, 30, 40);

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }';
const bulanikPass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, guc: { value: 0 }, t: { value: 0 } },
  vertexShader: VERT,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float guc, t; varying vec2 vUv;
  float h(float n){ return fract(sin(n*91.345)*43758.5453); }
  void main(){
    vec2 d = vUv - 0.5; float r = length(d);
    float m = smoothstep(0.12, 0.75, r) * guc;
    vec3 c = texture2D(tDiffuse, vUv).rgb;
    if (m > 0.002) {
      c = vec3(0.0);
      for (int i = 0; i < 8; i++) { float k = float(i) / 7.0; c += texture2D(tDiffuse, 0.5 + d * (1.0 - m * 0.16 * k)).rgb; }
      c *= 0.125;
      float a = atan(d.y, d.x), cizgi = floor(a * 40.0 + floor(t * 18.0) * 7.0);
      float sk = step(0.86, h(cizgi)) * smoothstep(0.42, 0.7, r) * guc;
      c += vec3(0.55, 0.62, 0.8) * sk * 0.22;
    }
    gl_FragColor = vec4(c, 1.0);
  }`,
});
const gradePass = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, t: { value: 0 }, flas: { value: new THREE.Vector4(1, 1, 1, 0) }, kararma: { value: 0 }, grenGuc: { value: 0.025 } },
  vertexShader: VERT,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float t, kararma, grenGuc; uniform vec4 flas; varying vec2 vUv;
  void main(){
    vec3 c = texture2D(tDiffuse, vUv).rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, 0.97);
    c = (c - 0.18) * 1.02 + 0.18; c = max(c, 0.0);
    float golge = 1.0 - smoothstep(0.0, 0.35, l), isik = smoothstep(0.25, 1.2, l);
    c = mix(c, c * vec3(0.82, 0.92, 1.18), golge * 0.2);
    c = mix(c, c * vec3(1.1, 1.02, 0.88), isik * 0.3);
    vec2 d = vUv - 0.5;
    c *= 1.0 - smoothstep(0.35, 0.95, length(d * vec2(1.0, 0.9))) * 0.15;
    c += (fract(sin(dot(vUv * 1000.0 + fract(t) * 37.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * grenGuc;
    c = mix(c, flas.rgb * 1.5, flas.a);
    c *= 1.0 - kararma;
    gl_FragColor = vec4(c, 1.0);
  }`,
});
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(sahne, kamera);
composer.addPass(renderPass);
const gtao = new GTAOPass(sahne, kamera, innerWidth >> 1, innerHeight >> 1);
gtao.output = GTAOPass.OUTPUT.Default; gtao.enabled = false;
composer.addPass(gtao);
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.45, 0.45, 0.9);
composer.addPass(bloom);
composer.addPass(bulanikPass);
composer.addPass(gradePass);
composer.addPass(new OutputPass());
const smaa = new SMAAPass(innerWidth, innerHeight);
composer.addPass(smaa);

const dinleyiciler = {};
const G = (window.G = {
  THREE, sahne, kamera, renderer, composer, bloom,
  saat: new THREE.Clock(), t: 0, test,
  durum: test ? 'oyun' : 'menu',
  olay: {
    on(ad, fn) { (dinleyiciler[ad] ||= []).push(fn); },
    emit(ad, veri) { for (const fn of dinleyiciler[ad] || []) { try { fn(veri); } catch (e) { hatalar.push(ad + ': ' + e.message); console.error(e); } } },
  },
});

const E = { sarsS: 0, sarsKalan: 0, sarsSure: 1, olcekHedef: 1, yavasKalan: 0, durakKalan: 0, hiz: 0, hizHedef: 0, flasA: 0, flasSure: 0.3, kararma: 0, gt: 0 };
G.zamanOlcek = 1; G.gercekDt = 0;
G.efekt = {
  sars(siddet = 0.5, sure = 0.35) { E.sarsS = Math.max(E.sarsS * (E.sarsKalan / E.sarsSure), Math.min(1, siddet)); E.sarsSure = E.sarsKalan = Math.max(0.05, sure); },
  yavasCekim(oran = 0.4, sure = 0.8) { E.olcekHedef = Math.min(1, Math.max(0.2, oran)); E.yavasKalan = sure; },
  vurusDuraklat(sure = 0.05) { E.durakKalan = Math.max(E.durakKalan, sure); },
  hizBulanikligi(v = 0) { E.hizHedef = Math.min(1, Math.max(0, v)); },
  flas(renk = 0xff2020, sure = 0.25) { const c = new THREE.Color(renk); gradePass.uniforms.flas.value.set(c.r, c.g, c.b, 0.4); E.flasA = 0.4; E.flasSure = Math.max(0.05, sure); },
};
function efektGuncelle(gdt) {
  G.gercekDt = gdt; E.gt += gdt;
  if (E.durakKalan > 0) { E.durakKalan -= gdt; G.zamanOlcek = 0.02; }
  else if (E.yavasKalan > 0) { E.yavasKalan -= gdt; G.zamanOlcek = E.olcekHedef; }
  else G.zamanOlcek += (1 - G.zamanOlcek) * Math.min(1, gdt * 8);
  if (E.sarsKalan > 0) E.sarsKalan = Math.max(0, E.sarsKalan - gdt);
  E.hiz += (E.hizHedef - E.hiz) * Math.min(1, gdt * 8); E.hizHedef *= Math.exp(-gdt * 6);
  const u = gradePass.uniforms;
  if (E.flasA > 0) { E.flasA = Math.max(0, E.flasA - gdt * 0.5 / E.flasSure); u.flas.value.w = E.flasA; }
  if (G.durum === 'oyun' && !E.girdi) { E.girdi = true; if (!test) { E.kararma = 1; u.flas.value.set(1, 0.85, 0.6, 0.35); E.flasA = 0.35; E.flasSure = 2; } }
  if (E.kararma > 0) E.kararma = Math.max(0, E.kararma - gdt / 2);
  u.kararma.value = E.kararma * E.kararma; u.t.value = bulanikPass.uniforms.t.value = E.gt;
  bulanikPass.uniforms.guc.value = E.hiz;
  bulanikPass.enabled = G.kalite !== 'dusuk' && E.hiz > 0.02;
}
const _p = new THREE.Vector3(), _q = new THREE.Quaternion();
function sarsUygula() {
  const s = E.sarsKalan > 0 ? E.sarsS * (E.sarsKalan / E.sarsSure) : 0;
  if (s < 0.003) return false;
  const t = E.gt, g = s * s;
  const n = (f, o) => Math.sin(t * f + o) * 0.6 + Math.sin(t * f * 2.3 + o * 1.7) * 0.3 + Math.sin(t * f * 4.1 + o * 2.9) * 0.1;
  _p.copy(kamera.position); _q.copy(kamera.quaternion);
  kamera.translateX(n(23, 0) * 0.35 * g); kamera.translateY(n(27, 5) * 0.3 * g);
  kamera.rotateZ(n(19, 9) * 0.05 * g * 2);
  return true;
}

const KUR = ['girdi', 'sehir', 'kahraman', 'oyuncu', 'dusman', 'gorev', 'ses', 'arayuz'];
const GUNCELLE = ['girdi', 'oyuncu', 'kahraman', 'sehir', 'dusman', 'gorev', 'ses', 'arayuz'];
const moduller = {};
for (const ad of KUR) {
  try { moduller[ad] = await import(`./${ad}.js`); }
  catch (e) { if (!String(e.message).match(/Failed to fetch|404|Importing a module script failed/)) { hatalar.push(ad + ' yüklenemedi: ' + e.message); console.error(e); } }
}
for (const ad of KUR) {
  try { moduller[ad]?.kur?.(G); } catch (e) { hatalar.push(ad + '.kur: ' + e.message); console.error(e); }
}
console.log('[ZIFIR] yüklü modüller:', Object.keys(moduller).join(','));

// ---- kalite ayarı ----
const KADEME = ['dusuk', 'orta', 'yuksek'], AD = { dusuk: 'Düşük', orta: 'Orta', yuksek: 'Yüksek' };
function boyutla() {
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
  { const pr = renderer.getPixelRatio(); gtao.setSize(Math.ceil(innerWidth * pr / 2), Math.ceil(innerHeight * pr / 2)); }
  if (G.kalite === 'dusuk') { const pr = renderer.getPixelRatio(); bloom.setSize(Math.ceil(innerWidth * pr / 2), Math.ceil(innerHeight * pr / 2)); }
}
G.kaliteAd = AD;
G.kaliteAyarla = function (ad, kaydet = true) {
  if (!KADEME.includes(ad)) return;
  G.kalite = ad;
  if (kaydet) { try { localStorage.setItem('zifir_kalite', ad); } catch (e) {} }
  const pr = ad === 'dusuk' ? 0.75 : ad === 'orta' ? 1 : Math.min(devicePixelRatio, 1.5);
  renderer.setPixelRatio(pr);
  const golge = ad === 'dusuk' ? 0 : ad === 'orta' ? 1024 : 2048;
  renderer.shadowMap.enabled = golge > 0;
  sahne.traverse(o => {
    if (o.isLight && o.castShadow && o.shadow) {
      if (golge > 0 && o.shadow.mapSize.x !== golge) { o.shadow.mapSize.set(golge, golge); o.shadow.map?.dispose(); o.shadow.map = null; }
    }
  });
  { const an = ad === 'dusuk' ? 1 : Math.min(4, renderer.capabilities.getMaxAnisotropy()); const gor = new Set(); sahne.traverse(o => { if (o.material) for (const m of [].concat(o.material)) for (const k of ['map', 'emissiveMap', 'roughnessMap']) if (m[k] && !gor.has(m[k])) { gor.add(m[k]); m[k].anisotropy = an; } }); }
  sahne.traverse(o => { if (o.material) { for (const m of [].concat(o.material)) m.needsUpdate = true; } });
  gtao.enabled = ad === 'yuksek'; smaa.enabled = ad !== 'dusuk';
  gradePass.uniforms.grenGuc.value = ad === 'dusuk' ? 0 : 0.025;
  boyutla();
  G.olay.emit('kalite', ad);
};
let k0 = 'orta'; try { const v = localStorage.getItem('zifir_kalite'); if (KADEME.includes(v)) k0 = v; } catch (e) {}
G.kaliteAyarla(k0, false);
let fpsT = 0, fpsN = 0;

addEventListener('resize', () => { kamera.aspect = innerWidth / innerHeight; kamera.updateProjectionMatrix(); boyutla(); });

function kare() {
  const gdt = Math.min(G.saat.getDelta(), 0.05);
  renderer.toneMappingExposure = (G.pozTaban || 1.15) * (G.ayar?.parlaklik || 1);
  efektGuncelle(gdt);
  const dt = gdt * G.zamanOlcek;
  G.t += dt;
  for (const ad of GUNCELLE) {
    try { moduller[ad]?.guncelle?.(G, dt); }
    catch (e) { if (hatalar.length < 50) { hatalar.push(ad + '.guncelle: ' + e.message); console.error(e); } }
  }
  renderer.info.reset();
  const sarsildi = sarsUygula();
  composer.render();
  if (sarsildi) { kamera.position.copy(_p); kamera.quaternion.copy(_q); }
  if (G.durum === 'oyun' && !test) {
    fpsT += gdt; fpsN++;
    if (fpsT >= 3) {
      const fps = fpsN / fpsT; fpsT = 0; fpsN = 0;
      const i = KADEME.indexOf(G.kalite);
      if (fps < 40 && i > 0) { G.kaliteAyarla(KADEME[i - 1]); G.arayuz?.mesaj?.('Kalite: ' + AD[G.kalite], 3); }
    }
  } else { fpsT = 0; fpsN = 0; }
  requestAnimationFrame(kare);
}
requestAnimationFrame(kare);
if (test) setTimeout(() => console.log('[ZIFIR] pass=' + composer.passes.filter(p => p.enabled).length + '/' + composer.passes.length + ' calls=' + renderer.info.render.calls + ' tri=' + renderer.info.render.triangles), 3000);
if (test) setTimeout(() => console.log('[ZIFIR] HATA ' + hatalar.length + (hatalar.length ? ' :: ' + hatalar.join(' | ') : '')), 6000);
if (test && new URLSearchParams(location.search).has('fx')) setTimeout(() => { G.efekt.sars(0.8, 30); G.efekt.hizBulanikligi(1); G.efekt.flas(0xff3030, 30); setInterval(() => G.efekt.hizBulanikligi(1), 100); }, 1500);
