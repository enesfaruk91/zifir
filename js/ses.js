// Ses — tamamen prosedürel WebAudio. Dosya yok. SOZLESME §4.
let ctx = null, ana = null, sik = null, muzikKaz = null, sfxKaz = null;
let gurultu = null, ruzgar = null, dron = null;
let sessizMi = false, muzikIstek = false, muzikCaliyor = false;
let G_ = null, kureZincir = 0, kureSon = -10;

function baslat() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  sik = ctx.createDynamicsCompressor();
  sik.threshold.value = -16; sik.knee.value = 14; sik.ratio.value = 5; sik.attack.value = 0.004; sik.release.value = 0.2;
  ana = ctx.createGain(); ana.gain.value = sessizMi ? 0 : 0.8;
  ana.connect(sik); sik.connect(ctx.destination);
  sfxKaz = ctx.createGain(); sfxKaz.gain.value = 0.9; sfxKaz.connect(ana);
  muzikKaz = ctx.createGain(); muzikKaz.gain.value = 0.16; muzikKaz.connect(ana);
  // beyaz/pembe gürültü tamponu
  const n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
  let b0 = 0; for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; b0 = 0.97 * b0 + 0.03 * w; d[i] = w * 0.5 + b0 * 3; }
  gurultu = b;
  ruzgarKur(); dronKur();
  if (muzikIstek) muzikBaslat();
}

function ruzgarKur() {
  const s = ctx.createBufferSource(); s.buffer = gurultu; s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 300; f.Q.value = 0.7;
  const g = ctx.createGain(); g.gain.value = 0;
  s.connect(f); f.connect(g); g.connect(sfxKaz); s.start();
  ruzgar = { f, g };
}
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

// ---- müzik: gece synthwave, Am F C G, 100 BPM ----
const BPM = 100, ADIM = 60 / BPM / 4;
const AKOR = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const KOK = [33, 29, 36, 31];
let sonraki = 0, adim = 0, zamanlayici = null;
const mf = n => 440 * Math.pow(2, (n - 69) / 12);

function mNota(tip, f, t, sure, tepe, kes, atak = 0.01) {
  const o = ctx.createOscillator(); o.type = tip; o.frequency.value = f;
  const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = kes;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(tepe, t + atak); g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
  o.connect(fl); fl.connect(g); g.connect(muzikKaz); o.start(t); o.stop(t + sure + 0.05);
}
function mGur(t, sure, tip, f, tepe) {
  const s = ctx.createBufferSource(); s.buffer = gurultu;
  const fl = ctx.createBiquadFilter(); fl.type = tip; fl.frequency.value = f;
  const g = ctx.createGain(); g.gain.setValueAtTime(tepe, t); g.gain.exponentialRampToValueAtTime(0.0001, t + sure);
  s.connect(fl); fl.connect(g); g.connect(muzikKaz); s.start(t, Math.random()); s.stop(t + sure + 0.05);
}
function adimCal(i, t) {
  const bar = Math.floor(i / 16) % 4, a = i % 16, akor = AKOR[bar];
  // bas: sekizlik, sinkoplu
  if (a % 2 === 0) mNota('sawtooth', mf(KOK[bar] + (a === 6 || a === 14 ? 12 : 0)), t, ADIM * 1.7, 0.55, 380);
  // arpej: onaltılık, hafif gecikme hissi
  const n = akor[[0, 1, 2, 1][a % 4]] + 12 + (a % 8 >= 4 ? 12 : 0);
  mNota('square', mf(n), t, ADIM * 1.4, 0.13, 1600, 0.004);
  if (a % 4 === 0) akor.forEach(x => mNota('sawtooth', mf(x), t, ADIM * 3.8, 0.05, 700, 0.15)); // pad
  // davul
  if (a % 4 === 0) { const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); g.connect(muzikKaz); o.start(t); o.stop(t + 0.25); }
  if (a === 4 || a === 12) { mGur(t, 0.16, 'bandpass', 1800, 0.35); mNota('triangle', 190, t, 0.1, 0.2, 800); }
  if (a % 2 === 1) mGur(t, 0.04, 'highpass', 7000, 0.12);
  // melodi: iki barda bir hafif zil
  if (a === 0 && bar % 2 === 0) mNota('sine', mf(akor[2] + 24), t, ADIM * 7, 0.12, 4000, 0.02);
}
function zamanla() {
  if (!ctx || !muzikCaliyor) return;
  while (sonraki < ctx.currentTime + 0.25) { adimCal(adim, sonraki); sonraki += ADIM; adim++; }
}
function muzikBaslat() {
  if (muzikCaliyor || !ctx) return;
  muzikCaliyor = true; sonraki = ctx.currentTime + 0.08; adim = 0;
  muzikKaz.gain.cancelScheduledValues(ctx.currentTime);
  muzikKaz.gain.setTargetAtTime(0.16, ctx.currentTime, 0.5);
  zamanlayici = setInterval(zamanla, 80);
}
function muzikDur() {
  muzikCaliyor = false; clearInterval(zamanlayici); zamanlayici = null;
}

export function kur(G) {
  G_ = G;
  const ilk = () => { baslat(); };
  addEventListener('pointerdown', ilk, true); addEventListener('keydown', ilk, true);
  addEventListener('keydown', e => { if (e.code === 'KeyM' && !e.repeat) G.ses.sessiz(!sessizMi); });

  const bagla = (olay, ses, kar) => G.olay.on(olay, v => G.ses.cal(ses, { konum: v?.konum, siddet: kar }));
  const o = G.olay;
  o.on('sallanBasla', () => { G.ses.cal('atis'); setTimeout(() => G.ses.cal('yapisma'), 120); });
  bagla('sallanBit', 'sallanBit', 1);
  bagla('zipla', 'zipla', 1); bagla('zip', 'zip', 1); bagla('yere', 'yere', 1);
  bagla('yumruk', 'yumruk', 1); bagla('kamci', 'kamci', 1);
  bagla('devBasla', 'devBasla', 1); bagla('devBit', 'devBit', 1);
  bagla('hasar', 'hasar', 1); bagla('yenildi', 'yenildi', 1); bagla('dogdu', 'dogdu', 1);
  bagla('robotYenildi', 'robot', 1); bagla('kureAlindi', 'kure', 1);
  bagla('gorevBasla', 'fanfar', 0.7); bagla('gorevBitti', 'gorevBit', 1);

  G.ses = {
    cal(ad, a = {}) {
      if (!ctx || sessizMi || ctx.state !== 'running') return;
      const f = SES[ad]; if (!f) return;
      try { f((a.siddet ?? 1) * mesafeKat(a)); } catch (e) { /* ses hatası oyunu durdurmasın */ }
    },
    muzik(acik) {
      muzikIstek = !!acik;
      if (!ctx) return;
      if (acik) muzikBaslat(); else muzikDur();
    },
    sessiz(b) {
      sessizMi = !!b;
      if (ana) ana.gain.setTargetAtTime(sessizMi ? 0 : 0.8, ctx.currentTime, 0.05);
      G.arayuz?.mesaj?.(sessizMi ? 'Ses kapalı (M)' : 'Ses açık (M)', 1.5);
    },
    get sessizMi() { return sessizMi; },
  };
}

export function guncelle(G, dt) {
  if (!ctx || !ruzgar) return;
  const t = ctx.currentTime;
  const oyunda = G.durum === 'oyun';
  const hiz = oyunda && G.oyuncu?.hiz ? G.oyuncu.hiz.length() : 0;
  const k = Math.min(1, Math.max(0, (hiz - 6) / 40));
  ruzgar.g.gain.setTargetAtTime(k * k * 0.5, t, 0.15);
  ruzgar.f.frequency.setTargetAtTime(250 + k * 2400, t, 0.15);
  // dron vızıltısı: en yakın canlı dron
  let yak = 1e9;
  if (oyunda && G.dusman?.liste && G.oyuncu?.konum) {
    for (const d of G.dusman.liste) if (d.canli && d.tur === 'dron' && d.konum) yak = Math.min(yak, d.konum.distanceTo(G.oyuncu.konum));
  }
  const dk = yak < 45 ? (1 - yak / 45) : 0;
  dron.g.gain.setTargetAtTime(dk * dk * 0.09, t, 0.2);
  dron.o.frequency.setTargetAtTime(90 + dk * 25 + Math.sin(G.t * 7) * 3, t, 0.1);
  // duraklatınca müzik kısılsın
  muzikKaz.gain.setTargetAtTime(G.durum === 'duraklat' ? 0.06 : 0.16, t, 0.2);
}
