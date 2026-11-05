// Ses — gerçek CC0 kayıtlar (Kenney, OGA; assets/LISANS.md) + yedek prosedürel sentez. SOZLESME §4, §6.3.
let ctx = null, ana = null, sik = null, muzikKaz = null, sfxKaz = null, ambKaz = null, muzikLP = null;
let gurultu = null, dron = null;
let sessizMi = false, muzikAcik = true;
let G_ = null, kureZincir = 0, kureSon = -10;
const TAMPON = {};            // ad -> AudioBuffer
const DOSYA = {};             // ad -> yol
const durum = { yuklendi: false, toplam: 0, ok: 0, hata: [], muzik: {} };
const SEV = { ana: 1, muzik: 1, efekt: 1 };
const MAX_SES = 16, TEKRAR_MS = 50;
let aktifSes = 0; const sonCalma = {};

const KOK = 'assets/ses/';
const liste = (klasor, adlar) => adlar.forEach(a => { DOSYA[a] = KOK + klasor + '/' + a + '.ogg'; });
const dizi = (ad, n = 5) => Array.from({ length: n }, (_, i) => ad + '_00' + i);
liste('impact', [...dizi('impactPunch_medium'), ...dizi('impactPunch_heavy'), ...dizi('impactSoft_medium'), ...dizi('impactSoft_heavy'),
  ...dizi('impactMetal_heavy'), ...dizi('impactMetal_medium'), ...dizi('impactPlate_medium'), ...dizi('impactPlate_light'), ...dizi('impactGeneric_light'), ...dizi('footstep_concrete')]);
liste('arayuz', ['select_001', 'select_002', 'select_003', 'confirmation_001', 'confirmation_002', 'back_001', 'back_002', 'error_001', 'tick_001', 'toggle_001']);
liste('ortam', ['ruzgar', 'sehir_sokak']);
const MUZIK = { menu: 'lights_at_night', oyun: 'cyberpunk_beauty', chase: 'chase' };

const sec = (dz) => dz[Math.floor(Math.random() * dz.length)];
const rastPerde = (p = 0.08) => 1 + (Math.random() * 2 - 1) * p;

async function yukle() {
  const tum = Object.keys(DOSYA);
  durum.toplam = tum.length + Object.keys(MUZIK).length;
  await Promise.all(tum.map(async ad => {
    try {
      const r = await fetch(DOSYA[ad]);
      if (r.status !== 200) throw new Error('HTTP ' + r.status);
      const ab = await r.arrayBuffer();
      TAMPON[ad] = await ctx.decodeAudioData(ab);
      durum.ok++;
    } catch (e) { durum.hata.push(ad + ': ' + (e?.message || e)); }
  }));
  // müzik: akış (HTMLAudio) — bellek için decode edilmez, üstveri okunur
  await Promise.all(Object.keys(MUZIK).map(k => new Promise(res => {
    const yol = KOK + 'muzik/' + MUZIK[k] + '.ogg';
    fetch(yol, { method: 'HEAD' }).then(r => {
      if (r.status !== 200) { durum.hata.push(MUZIK[k] + ': HTTP ' + r.status); return res(); }
      const el = new Audio(); el.preload = 'auto'; el.loop = true; el.src = yol; el.crossOrigin = 'anonymous';
      setTimeout(() => { if (!durum.muzik[k]) { durum.hata.push(MUZIK[k] + ': metadata zaman aşımı'); res(); } }, 8000);
      const bitti = () => { durum.ok++; res(); };
      el.addEventListener('loadedmetadata', () => { durum.muzik[k] = { el, sure: el.duration, g: null, hedef: 0 }; bitti(); }, { once: true });
      el.addEventListener('error', () => { durum.hata.push(MUZIK[k] + ': decode hatası'); res(); }, { once: true });
    }).catch(e => { durum.hata.push(MUZIK[k] + ': ' + e.message); res(); });
  })));
  durum.yuklendi = true;
  muzikHazirla(); ortamKur();
  console.log('[SES] yüklendi ' + durum.ok + '/' + durum.toplam + ' (200 + decode)' + (durum.hata.length ? ' HATA: ' + durum.hata.join(' | ') : ' hata yok'));
}

function baslat() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  sik = ctx.createDynamicsCompressor();
  sik.threshold.value = -16; sik.knee.value = 14; sik.ratio.value = 5; sik.attack.value = 0.004; sik.release.value = 0.2;
  ana = ctx.createGain(); ana.gain.value = sessizMi ? 0 : 0.8;
  ana.connect(sik); sik.connect(ctx.destination);
  sfxKaz = ctx.createGain(); sfxKaz.connect(ana);
  ambKaz = ctx.createGain(); ambKaz.connect(ana);
  muzikLP = ctx.createBiquadFilter(); muzikLP.type = 'lowpass'; muzikLP.frequency.value = 20000;
  muzikKaz = ctx.createGain(); muzikLP.connect(muzikKaz); muzikKaz.connect(ana);
  const n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  let b0 = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; b0 = 0.97 * b0 + 0.03 * w; d[i] = w * 0.5 + b0 * 3; }
  gurultu = b;
  dronKur();
  yukle();
}

// ---- gerçek kayıt çalma ----
// o: {vol, perde, degisim, lp, hp, gec, hedef, ad(tekrar anahtarı)}
function kayit(adlar, o = {}) {
  const ad = Array.isArray(adlar) ? sec(adlar) : adlar;
  const buf = TAMPON[ad]; if (!buf || !ctx) return false;
  const nowMs = performance.now(), anahtar = o.anahtar || ad;
  if (nowMs - (sonCalma[anahtar] || -1e9) < TEKRAR_MS) return true;
  if (aktifSes >= MAX_SES) return true;
  sonCalma[anahtar] = nowMs; aktifSes++;
  const t = ctx.currentTime + (o.gec || 0);
  const s = ctx.createBufferSource(); s.buffer = buf;
  s.playbackRate.value = (o.perde || 1) * rastPerde(o.degisim ?? 0.05);
  let son = s;
  if (o.hp) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = o.hp; son.connect(f); son = f; }
  if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; son.connect(f); son = f; }
  const g = ctx.createGain(); g.gain.value = o.vol ?? 1; son.connect(g); g.connect(o.hedef || sfxKaz);
  s.onended = () => { aktifSes--; };
  s.start(t);
  return true;
}
const slap = (k, hafif = 1) => kayit(['impactSoft_medium_000', 'impactSoft_medium_001', 'impactSoft_medium_002', 'impactSoft_medium_003', 'impactSoft_medium_004'],
  { vol: 0.9 * k, perde: 1.35 * hafif, degisim: 0.08, lp: 2600, anahtar: 'slap' });
const SENT_KOMBO = ['impactPunch_medium_000', 'impactPunch_medium_001', 'impactPunch_medium_002', 'impactPunch_medium_003'];

// ---- yardımcılar (yedek sentez) ----
function dronKur() {
  const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 95;
  const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 97.5;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520;
  const g = ctx.createGain(); g.gain.value = 0;
  o.connect(f); o2.connect(f); f.connect(g); g.connect(sfxKaz); o.start(); o2.start();
  dron = { g, o, o2 };
}

// ---- yardımcılar ----
function zarf(g, t, a, tepe, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(tepe, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}
function ton(tip, f0, f1, sure, tepe = 0.3, gec = 0, hedef = sfxKaz, atak = 0.005) {
  const t = ctx.currentTime + gec;
  const o = ctx.createOscillator(); o.type = tip;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + sure);
  const g = ctx.createGain(); zarf(g, t, atak, tepe, sure);
  o.connect(g); g.connect(hedef); o.start(t); o.stop(t + sure + atak + 0.05);
  return o;
}
function sesGur(sure, tip, f0, f1, q, tepe, gec = 0, hedef = sfxKaz, atak = 0.005) {
  const t = ctx.currentTime + gec;
  const s = ctx.createBufferSource(); s.buffer = gurultu; s.loopStart = Math.random(); s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = tip; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + sure);
  const g = ctx.createGain(); zarf(g, t, atak, tepe, sure);
  s.connect(f); f.connect(g); g.connect(hedef); s.start(t, Math.random()); s.stop(t + sure + atak + 0.05);
}
function mesafeKat(a) {
  if (!a || !a.konum || !G_?.kamera) return 1;
  const d = a.konum.distanceTo(G_.kamera.position);
  return Math.max(0.12, Math.min(1, 1 / (1 + d / 25)));
}

// ---- efektler ----
const SES = {
  atis(k) { sesGur(0.18, 'bandpass', 500, 2600, 3, 0.35 * k); ton('sine', 260, 700, 0.12, 0.12 * k); ton('triangle', 700, 340, 0.1, 0.1 * k, 0.1); },
  atisJole(k) { ton('sine', 520, 180, 0.07, 0.16 * k); ton('triangle', 300, 520, 0.05, 0.07 * k, 0.03); },
  isabet(k) { ton('sine', 150, 60, 0.12, 0.5 * k); sesGur(0.04, 'lowpass', 1400, 300, 1, 0.25 * k); },
  yapisma(k) { ton('sine', 210, 60, 0.12, 0.45 * k); sesGur(0.07, 'lowpass', 1800, 300, 1, 0.3 * k); ton('sine', 520, 380, 0.08, 0.1 * k, 0.03); },
  zipla(k) { ton('sine', 240, 520, 0.16, 0.22 * k); sesGur(0.1, 'highpass', 800, 2400, 0.7, 0.07 * k); },
  zip(k) { sesGur(0.4, 'bandpass', 400, 3500, 2, 0.4 * k); ton('sawtooth', 180, 900, 0.3, 0.07 * k); },
  yere(k) { ton('sine', 120, 38, 0.22, 0.6 * k); sesGur(0.12, 'lowpass', 900, 150, 0.8, 0.35 * k); },
  yumruk(k) { ton('sine', 190, 55, 0.14, 0.6 * k); sesGur(0.06, 'lowpass', 1500, 300, 1, 0.3 * k); ton('triangle', 420, 160, 0.06, 0.12 * k); },
  kamci(k) { sesGur(0.28, 'bandpass', 3800, 600, 2.5, 0.35 * k); ton('sawtooth', 1100, 220, 0.2, 0.06 * k); },
  hasar(k) { ton('sawtooth', 300, 90, 0.3, 0.3 * k); ton('square', 150, 60, 0.28, 0.12 * k); sesGur(0.18, 'lowpass', 1200, 200, 1, 0.25 * k); },
  robot(k) {
    ton('sawtooth', 520, 80, 0.4, 0.22 * k); ton('square', 61, 40, 0.35, 0.14 * k);
    sesGur(0.25, 'bandpass', 2500, 700, 6, 0.18 * k);
    for (let i = 0; i < 6; i++) ton('square', 1800 + Math.random() * 2600, 900, 0.025, 0.07 * k, 0.12 + i * 0.07 + Math.random() * 0.03);
  },
  kure(k) {
    const zaman = G_ ? G_.t : 0;
    kureZincir = zaman - kureSon < 1.6 ? Math.min(kureZincir + 1, 9) : 0; kureSon = zaman;
    const nota = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21][kureZincir];
    const f = 880 * Math.pow(2, nota / 12);
    ton('sine', f, f, 0.5, 0.22 * k); ton('triangle', f * 2, f * 2, 0.35, 0.08 * k); ton('sine', f * 1.5, f * 1.5, 0.4, 0.09 * k, 0.07);
  },
  fanfar(k) {
    [[0, 0], [0.11, 4], [0.22, 7], [0.36, 12], [0.5, 16]].forEach(([gec, n], i, a) => {
      const f = 392 * Math.pow(2, n / 12), son = i === a.length - 1;
      ton('sawtooth', f, f, son ? 0.8 : 0.2, 0.09 * k, gec); ton('triangle', f * 2, f * 2, son ? 0.8 : 0.2, 0.1 * k, gec);
    });
  },
  gorevBit(k) { SES.fanfar(k); ton('sine', 1568, 1568, 0.9, 0.12 * k, 0.55); },
  devBasla(k) { ton('sine', 90, 28, 1.4, 0.8 * k, 0, sfxKaz, 0.05); ton('sawtooth', 55, 40, 1.4, 0.2 * k); sesGur(1.2, 'lowpass', 600, 80, 1, 0.4 * k, 0, sfxKaz, 0.1); ton('sine', 300, 900, 0.9, 0.08 * k, 0.2); },
  devBit(k) { ton('sine', 200, 40, 0.7, 0.45 * k); sesGur(0.6, 'lowpass', 900, 100, 1, 0.2 * k); },
  dogdu(k) { ton('sine', 200, 640, 0.35, 0.3 * k); ton('triangle', 400, 1280, 0.3, 0.1 * k, 0.08); },
  yenildi(k) { ton('sine', 440, 80, 0.8, 0.3 * k); ton('triangle', 330, 60, 0.9, 0.12 * k); },
  sallanBit(k) { sesGur(0.2, 'bandpass', 1200, 400, 1.5, 0.12 * k); },
  tik(k) { ton('sine', 900, 1200, 0.06, 0.12 * k); },
};


// ---- gerçek kayıtlı sürümler: kayıt yoksa yukarıdaki sentez çalışır ----
const SENTEZ = { ...SES };
const gercek = (ad, f) => { SES[ad] = (k, a) => { if (!f(k, a || {})) SENTEZ[ad]?.(k, a); }; };
const ON = (n) => dizi(n);
gercek('atis', k => { slap(k, 1.0); sesGur(0.18, 'bandpass', 500, 2600, 3, 0.18 * k); return TAMPON.impactSoft_medium_000 != null; });
gercek('atisJole', k => { slap(0.8 * k, 1.25); return TAMPON.impactSoft_medium_000 != null; });
gercek('yapisma', k => kayit(ON('impactSoft_heavy'), { vol: 0.9 * k, perde: 1.15, degisim: 0.08, lp: 3000, anahtar: 'yapisma' }));
gercek('isabet', k => kayit(ON('impactSoft_medium'), { vol: 0.9 * k, perde: 1.1, degisim: 0.08, lp: 3800, anahtar: 'isabet' }) && kayit(ON('impactPlate_light'), { vol: 0.35 * k, perde: 1.1, anahtar: 'isabet2' }));
gercek('yere', k => kayit(ON('impactSoft_heavy'), { vol: 0.9 * k, perde: 0.75, degisim: 0.06, anahtar: 'yere' }) && kayit(ON('footstep_concrete'), { vol: 0.5 * k, perde: 0.8, anahtar: 'yere2' }));
gercek('konus', k => kayit(ON('footstep_concrete'), { vol: 0.8 * k, perde: 0.9, anahtar: 'konus' }));
gercek('robot', k => kayit(ON('impactMetal_heavy'), { vol: 0.95 * k, perde: 0.85, degisim: 0.1, anahtar: 'robot' }) &&
  (kayit(ON('impactMetal_medium'), { vol: 0.6 * k, gec: 0.06, perde: 1.1, degisim: 0.15, anahtar: 'robot2' }), kayit(ON('impactPlate_medium'), { vol: 0.5 * k, gec: 0.14, perde: 0.9, degisim: 0.15, anahtar: 'robot3' }), SENTEZ.robot(k * 0.5), true));
gercek('arayuz_sec', k => kayit(['select_001', 'select_002', 'select_003'], { vol: 0.8, perde: 1, degisim: 0.03, anahtar: 'ui_sec' }));
gercek('arayuz_onay', k => kayit(['confirmation_001', 'confirmation_002'], { vol: 0.9, degisim: 0.02, anahtar: 'ui_onay' }));
gercek('arayuz_geri', k => kayit(['back_001', 'back_002'], { vol: 0.8, degisim: 0.02, anahtar: 'ui_geri' }));
SENTEZ.arayuz_sec = () => ton('sine', 900, 1200, 0.06, 0.1); SENTEZ.arayuz_onay = () => { ton('sine', 660, 660, 0.1, 0.12); ton('sine', 990, 990, 0.14, 0.12, 0.08); }; SENTEZ.arayuz_geri = () => ton('sine', 500, 300, 0.1, 0.1);
SES.arayuz_hata = () => kayit(['error_001'], { vol: 0.7, anahtar: 'ui_hata' });

// yumruk: komboNo'ya göre farklı kayıt; 3 = bitirici (ağır + alçak bas)
SES.yumruk = (k, a) => {
  const no = Math.max(0, Math.min(3, a?.komboNo ?? 0));
  const ok = no >= 3
    ? kayit(ON('impactPunch_heavy'), { vol: 1.0 * k, perde: 0.8, degisim: 0.04, anahtar: 'yumruk' })
    : kayit(['impactPunch_medium_00' + no], { vol: (0.75 + no * 0.08) * k, perde: 1 + no * 0.06, degisim: 0.04, anahtar: 'yumruk' });
  if (!ok) return SENTEZ.yumruk(k);
  if (no >= 3) bas(k);
};
function bas(k) { ton('sine', 90, 32, 0.45, 0.7 * k, 0, sfxKaz, 0.004); sesGur(0.25, 'lowpass', 600, 80, 1, 0.25 * k); }
SES.bitirici = (k) => { kayit(ON('impactPunch_heavy'), { vol: 1.0 * k, perde: 0.7, degisim: 0.03, anahtar: 'bitirici' }); bas(k * 1.1); if (TAMPON.impactMetal_heavy_000) kayit(ON('impactMetal_heavy'), { vol: 0.4 * k, perde: 0.7, gec: 0.03, anahtar: 'bitirici2' }); };
SES.vuus = (k) => { sesGur(0.6, 'bandpass', 300, 3200, 1.5, 0.3 * k, 0, sfxKaz, 0.15); ton('sine', 160, 70, 0.5, 0.15 * k); };
SES.kaciste = (k) => { sesGur(0.35, 'bandpass', 4200, 500, 2, 0.3 * k); ton('sine', 300, 800, 0.25, 0.1 * k); };
SES.kombo = (k, a) => {
  const sayi = a?.sayi ?? 0;
  const nota = sayi >= 20 ? [0, 4, 7, 12, 16] : sayi >= 10 ? [0, 4, 7, 12] : [0, 4, 7];
  nota.forEach((n, i) => { const f = 659 * Math.pow(2, n / 12); ton('triangle', f, f, 0.22, 0.14 * k, i * 0.06); ton('sine', f * 2, f * 2, 0.18, 0.06 * k, i * 0.06); });
};
SES.cek = (k) => { slap(0.8 * k, 1.1); SENTEZ.zip(0.5 * k); };
SES.numara = (k) => SENTEZ.tik(k);


// ---- ortam: rüzgâr + şehir sokak döngüleri ----
let ruzgar = null, sehir = null;
function dongu(ad, hedef) {
  const buf = TAMPON[ad]; if (!buf) return null;
  const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
  const g = ctx.createGain(); g.gain.value = 0;
  let son = s, f = null;
  if (hedef === 'lp') { f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; s.connect(f); son = f; }
  son.connect(g); g.connect(ambKaz); s.start(0, Math.random() * Math.max(1, buf.duration - 1));
  return { g, f };
}
function ortamKur() {
  ruzgar = dongu('ruzgar', 'lp'); sehir = dongu('sehir_sokak', null);
}

// ---- müzik: üç parça, akış, gain ile çapraz geçiş ----
let gecerli = 'menu', sakinSayac = 0, chaseModu = false, lpBitis = 0;
// Oyun birden çok sekmede/pencerede açıksa yalnız en son başlayan müzik çalar.
let baskaSekmeCaliyor = false;
const sekmeKimlik = Math.random().toString(36).slice(2);
let muzikKanal = null;
try {
  muzikKanal = new BroadcastChannel('zifir_muzik');
  muzikKanal.onmessage = e => { if (e.data?.basladi && e.data.kimlik !== sekmeKimlik) baskaSekmeCaliyor = true; };
} catch (e) { /* eski tarayıcı */ }
function muzikSahiplen() { baskaSekmeCaliyor = false; try { muzikKanal?.postMessage({ basladi: true, kimlik: sekmeKimlik }); } catch (e) {} }
addEventListener('pointerdown', muzikSahiplen); addEventListener('keydown', muzikSahiplen);
function muzikHazirla() {
  for (const k of Object.keys(durum.muzik)) {
    const m = durum.muzik[k];
    try { const src = ctx.createMediaElementSource(m.el); m.g = ctx.createGain(); m.g.gain.value = 0; src.connect(m.g); m.g.connect(muzikLP); } catch (e) { m.g = null; }
  }
}
function muzikGuncelle(G, dt) {
  const t = ctx.currentTime;
  const calabilir = ctx.state === 'running' && muzikAcik && !document.hidden && !baskaSekmeCaliyor;
  // hedef parça
  let hedef = 'menu';
  if (G.durum === 'oyun' || G.durum === 'duraklat') hedef = chaseModu ? 'chase' : 'oyun';
  if (G.durum === 'duraklat') hedef = gecerli === 'menu' ? 'oyun' : gecerli;
  gecerli = hedef;
  const duraklat = G.durum === 'duraklat' ? 0.4 : 1;
  for (const k of Object.keys(durum.muzik)) {
    const m = durum.muzik[k]; if (!m.g) continue;
    const ac = k === hedef && calabilir;
    // 2 sn çapraz geçiş: gain'i dt ile doğrusal kaydır
    m.hedef = ac ? 1 : 0;
    m.seviye = m.seviye ?? 0;
    // TEK PARÇA: hedef olmayan parça ANINDA susar (üst üste binme yok); hedef 1 sn'de girer
    if (!ac) m.seviye = 0; else m.seviye = Math.min(1, m.seviye + dt / 1.0);
    // döngü dikişi: sonda ve başta 1.5 sn fade (chase kırpılmış)
    let dikis = 1;
    if (k === 'chase' && m.sure > 5) { const c = m.el.currentTime; dikis = Math.max(0, Math.min(1, c / 1.5, (m.sure - c) / 1.5)); dikis = dikis * dikis * (3 - 2 * dikis); }
    m.g.gain.value = m.seviye * m.seviye * dikis * 0.3 * duraklat;
    if (m.seviye > 0.001 && m.el.paused && calabilir) m.el.play().catch(() => { });
    else if (m.seviye <= 0.001 && !m.el.paused) m.el.pause();
  }
  // vuuş lowpass: 0.6 sn
  if (lpBitis > t) muzikLP.frequency.setTargetAtTime(20000, lpBitis - 0.45, 0.15);
}
function muzikVuus() {
  if (!ctx || !muzikLP) return;
  const t = ctx.currentTime;
  muzikLP.frequency.cancelScheduledValues(t);
  muzikLP.frequency.setValueAtTime(muzikLP.frequency.value, t);
  muzikLP.frequency.linearRampToValueAtTime(450, t + 0.08);
  muzikLP.frequency.setTargetAtTime(20000, t + 0.6, 0.25);
  lpBitis = 0;
}


export function kur(G) {
  G_ = G;
  const ilk = () => { baslat(); };
  addEventListener('pointerdown', ilk, true); addEventListener('keydown', ilk, true);
  addEventListener('keydown', e => { if (e.code === 'KeyM' && !e.repeat) G.ses.sessiz(!sessizMi); });

  const bagla = (olay, ses, kar) => G.olay.on(olay, v => G.ses.cal(ses, { konum: v?.konum, siddet: kar, komboNo: v?.komboNo, sayi: v?.sayi }));
  const o = G.olay;
  o.on('sallanBasla', () => { G.ses.cal('atis'); setTimeout(() => G.ses.cal('yapisma'), 120); });
  bagla('sallanBit', 'sallanBit', 1);
  bagla('zipla', 'zipla', 1); bagla('zip', 'zip', 1); bagla('yere', 'yere', 1);
  bagla('yumruk', 'yumruk', 1); bagla('kamci', 'kamci', 1);
  bagla('devBasla', 'devBasla', 1); bagla('devBit', 'devBit', 1);
  bagla('hasar', 'hasar', 1); bagla('yenildi', 'yenildi', 1); bagla('dogdu', 'dogdu', 1);
  bagla('robotYenildi', 'robot', 1); bagla('kureAlindi', 'kure', 1);
  bagla('gorevBasla', 'fanfar', 0.7); bagla('gorevBitti', 'gorevBit', 1);
  bagla('bitirici', 'bitirici', 1); bagla('cek', 'cek', 1); bagla('konus', 'konus', 1); bagla('numara', 'numara', 1);
  o.on('kombo', v => { if ([5, 10, 20].includes(v?.sayi)) G.ses.cal('kombo', { sayi: v.sayi }); });
  const vuus = () => { G.ses.cal('vuus'); muzikVuus(); };
  o.on('mukemmelBirakis', vuus);
  o.on('kacis', () => { G.ses.cal('kaciste'); muzikVuus(); });

  let jole = 0;
  o.on('atis', () => { if (jole >= 3) return; jole++; G.ses.cal('atisJole', { siddet: 0.8 }); setTimeout(() => jole--, 90); });
  bagla('isabet', 'isabet', 1);

  G.ses = {
    cal(ad, a = {}) {
      if (!ctx || sessizMi || ctx.state !== 'running') return;
      const f = SES[ad]; if (!f) return;
      try { f((a.siddet ?? 1) * mesafeKat(a), a); } catch (e) { /* ses hatası oyunu durdurmasın */ }
    },
    muzik(acik) { muzikAcik = !!acik; },
    sessiz(b) {
      sessizMi = !!b;
      if (ana) ana.gain.setTargetAtTime(sessizMi ? 0 : 0.8 * SEV.ana, ctx.currentTime, 0.05);
      G.arayuz?.mesaj?.(sessizMi ? 'Ses kapalı (M)' : 'Ses açık (M)', 1.5);
    },
    seviye(a, m, e) { SEV.ana = a ?? 1; SEV.muzik = m ?? 1; SEV.efekt = e ?? 1; },
    get sessizMi() { return sessizMi; },
    arayuzSes: true,
    get yuklendi() { return durum.yuklendi; },
    get durumu() { return durum; },
  };
}

export function guncelle(G, dt) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const ay = G.ayar;
  const sa = ay?.sesAna ?? SEV.ana, sm = ay?.sesMuzik ?? SEV.muzik, se = ay?.sesEfekt ?? SEV.efekt;
  if (ana) ana.gain.setTargetAtTime(sessizMi ? 0 : 0.8 * sa, t, 0.05);
  sfxKaz.gain.value = 0.9 * se; ambKaz.gain.value = se;
  muzikKaz.gain.value = sm;
  const oyunda = G.durum === 'oyun';
  const gercekDt = G.gercekDt ?? dt;
  // dinamik müzik: >=3 yakın düşman veya patron
  if (oyunda) {
    let n = 0;
    if (G.dusman?.liste && G.oyuncu?.konum) for (const d of G.dusman.liste) if (d.canli && d.konum && d.konum.distanceTo(G.oyuncu.konum) < 45) n++;
    const patron = /Patron/i.test(G.gorev?.aktif?.ad || '');
    if (patron) { chaseModu = true; sakinSayac = 0; } // kovalamaca müziği yalnız patron savaşında (düşman sayısına göre gidip gelme üst üste binmeye yol açıyordu)
    else if (chaseModu) { sakinSayac += gercekDt; if (sakinSayac > 6) chaseModu = false; }
  } else { chaseModu = false; sakinSayac = 0; }
  if (durum.yuklendi) muzikGuncelle(G, gercekDt);
  // rüzgâr (kayıt) hıza göre; yükseklik: şehir ambiyansı azalır
  const hiz = oyunda && G.oyuncu?.hiz ? G.oyuncu.hiz.length() : 0;
  const k = Math.min(1, Math.max(0, (hiz - 6) / 40));
  const duraklat = G.durum === 'duraklat' ? 0.4 : 1;
  const y = G.oyuncu?.konum?.y ?? 0;
  if (ruzgar) {
    const yuk = Math.min(1, Math.max(0, y / 120));
    // Kanat açıkken düşük hızda da hava duyulur; dalışta ses hızla birlikte açılır.
    const suzul = oyunda && G.oyuncu?.durum === 'suzul';
    const dalis = oyunda && G.oyuncu?.durum === 'dalis';
    const hava = suzul ? 0.18 : dalis ? 0.12 * k : 0;
    ruzgar.g.gain.setTargetAtTime((0.08 + k * k * 0.9 + yuk * 0.25 + hava) * duraklat * (oyunda || G.durum === 'duraklat' ? 1 : 0.2), t, 0.2);
    ruzgar.f.frequency.setTargetAtTime(350 + k * 7000 + (suzul ? 900 : dalis ? 1800 * k : 0), t, 0.2);
  }
  if (sehir) {
    const az = 1 - Math.min(1, Math.max(0, (y - 5) / 130));
    sehir.g.gain.setTargetAtTime((0.12 + 0.55 * az) * duraklat, t, 0.4);
  }
  // dron vızıltısı: en yakın canlı dron
  let yak = 1e9;
  if (oyunda && G.dusman?.liste && G.oyuncu?.konum) {
    for (const d of G.dusman.liste) if (d.canli && d.tur === 'dron' && d.konum) yak = Math.min(yak, d.konum.distanceTo(G.oyuncu.konum));
  }
  const dk = yak < 45 ? (1 - yak / 45) : 0;
  dron.g.gain.setTargetAtTime(dk * dk * 0.09, t, 0.2);
  dron.o.frequency.setTargetAtTime(90 + dk * 25 + Math.sin(G.t * 7) * 3, t, 0.1);
}
