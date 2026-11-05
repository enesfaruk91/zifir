// Ana döngü — SOZLESME.md §3. Modüller dinamik yüklenir; eksik olan atlanır.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const hatalar = (window.__ZIFIR_HATALAR = []);
addEventListener('error', e => hatalar.push(String(e.message)));
addEventListener('unhandledrejection', e => hatalar.push(String(e.reason)));

const test = new URLSearchParams(location.search).has('test');
const canvas = document.getElementById('sahne');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.debug.onShaderError = (gl, program, vs, fs) => {
  const log = (gl.getShaderInfoLog(vs) || '') + (gl.getShaderInfoLog(fs) || '') + (gl.getProgramInfoLog(program) || '');
  hatalar.push('SHADER: ' + log.slice(0, 300)); console.error('[ZIFIR] SHADER HATASI', log);
};

const sahne = new THREE.Scene();
sahne.background = new THREE.Color(0x0a0618);
const kamera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 2500);
kamera.position.set(0, 30, 40);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(sahne, kamera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.45, 0.45, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());

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
  boyutla();
  G.olay.emit('kalite', ad);
};
let k0 = 'orta'; try { const v = localStorage.getItem('zifir_kalite'); if (KADEME.includes(v)) k0 = v; } catch (e) {}
G.kaliteAyarla(k0, false);
let fpsT = 0, fpsN = 0;

addEventListener('resize', () => { kamera.aspect = innerWidth / innerHeight; kamera.updateProjectionMatrix(); boyutla(); });

function kare() {
  const dt = Math.min(G.saat.getDelta(), 0.05);
  G.t += dt;
  for (const ad of GUNCELLE) {
    try { moduller[ad]?.guncelle?.(G, dt); }
    catch (e) { if (hatalar.length < 50) { hatalar.push(ad + '.guncelle: ' + e.message); console.error(e); } }
  }
  composer.render();
  if (G.durum === 'oyun' && !test) {
    fpsT += dt; fpsN++;
    if (fpsT >= 3) {
      const fps = fpsN / fpsT; fpsT = 0; fpsN = 0;
      const i = KADEME.indexOf(G.kalite);
      if (fps < 40 && i > 0) { G.kaliteAyarla(KADEME[i - 1]); G.arayuz?.mesaj?.('Kalite: ' + AD[G.kalite], 3); }
    }
  } else { fpsT = 0; fpsN = 0; }
  requestAnimationFrame(kare);
}
requestAnimationFrame(kare);
if (test) setTimeout(() => console.log('[ZIFIR] HATA ' + hatalar.length + (hatalar.length ? ' :: ' + hatalar.join(' | ') : '')), 6000);
