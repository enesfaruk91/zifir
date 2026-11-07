// Dokunmatik kumanda: yüzen hareket çubuğu + sağ yarıda sürükleyerek bakış + 4 büyük düğme.
// Fiziksel girdiye dokunmadan girdi.js'in kullandığı API (tuslar/yeni/birak/eksen/bakis) aynen korunur.
const IKON = {
  ag: '<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="7"/>',
  zipla: '<path d="M6 11l6-6 6 6M6 18l6-6 6 6"/>',
  saldir: '<path d="M12 2l2.4 6.2L21 7l-4 5 4 5-6.6-1.2L12 22l-2.4-6.2L3 17l4-5-4-5 6.6 1.2z"/>',
  dalis: '<path d="M12 3v14M6 12l6 7 6-7"/>',
  cekil: '<path d="M3 12h14M12 6l6 6-6 6"/><circle cx="20" cy="12" r="1.4"/>',
  kamci: '<path d="M3 17c4-10 7 6 11-4s5-3 7-6"/>',
  dev: '<path d="M12 21V8M6 13l6-8 6 8M8 21h8"/>',
  durak: '<path d="M8 5v14M16 5v14"/>',
};
const OZEL = { // oyuncu.js p.durum -> [ad, ikon, tuş kodu]
  sallan: ['ÇEKİL', 'cekil', 'KeyE'], duvar: ['ÇEKİL', 'cekil', 'KeyE'],
  zipla: ['DALIŞ', 'dalis', 'KeyC'], dus: ['DALIŞ', 'dalis', 'KeyC'], suzul: ['DALIŞ', 'dalis', 'KeyC'], dalis: ['DALIŞ', 'dalis', 'KeyC'],
};
const OZEL_VARSAYILAN = ['KAMÇI', 'kamci', 'KeyF'];
const HAVA = new Set(['zipla', 'dus', 'suzul']);
const svg = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IKON[k]}</svg>`;

export function kurMobil(G) {
  const dokunmatik = matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0;
  const tuslar = new Set(), yeni = new Set(), birak = new Set(), sahip = new Map(), oto = new Set();
  const eksen = { x: 0, y: 0 }, bakis = { x: 0, y: 0 };
  const dinleyiciler = [], sifirla = [];
  const stil = document.createElement('style');
  stil.textContent = `
  .zifir-dokun{--u:1;position:fixed;inset:0;z-index:80;pointer-events:none;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
  .zifir-dokun[hidden]{display:none}
  .zifir-bolge{position:absolute;top:0;bottom:0;pointer-events:auto;touch-action:none}
  .zifir-bolge.sol{left:0;width:42%}.zifir-bolge.sag{right:0;width:58%}
  .zifir-taban{position:absolute;width:112px;height:112px;margin:-56px 0 0 -56px;border:2px solid #66ead077;border-radius:50%;background:#12152b44;pointer-events:none;opacity:.0;transition:opacity .12s}
  .zifir-taban.acik{opacity:1}.zifir-taban i{position:absolute;left:50%;top:50%;width:50px;height:50px;margin:-25px 0 0 -25px;border-radius:50%;background:#7de5d499}
  .zifir-ipucu{position:absolute;left:max(36px,env(safe-area-inset-left));bottom:max(30px,env(safe-area-inset-bottom));width:84px;height:84px;border:2px dashed #66ead044;border-radius:50%;pointer-events:none;color:#ffffff55;font:600 10px system-ui;display:grid;place-items:center;transition:opacity .2s}
  .zifir-ipucu.gizli{opacity:0}
  .zifir-dokun button{position:absolute;pointer-events:auto;touch-action:none;color:#fff;border:2px solid #69e6d4aa;border-radius:50%;background:#182442a6;font:700 10px system-ui;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;-webkit-tap-highlight-color:transparent;width:calc(var(--b)*var(--u));height:calc(var(--b)*var(--u))}
  .zifir-dokun button svg{width:44%;height:44%}
  .zifir-dokun button[data-basili]{background:#4f7f93d9;border-color:#c8fff4}
  .zifir-dokun button[hidden]{display:none}
  .zifir-ag{--b:98px;right:calc(max(22px,env(safe-area-inset-right)));bottom:calc(max(20px,env(safe-area-inset-bottom)));border-color:#b48cffcc!important;background:#2a1f56aa!important}
  .zifir-zipla{--b:74px;right:calc(max(22px,env(safe-area-inset-right)) + calc(112px*var(--u)));bottom:calc(max(20px,env(safe-area-inset-bottom)))}
  .zifir-saldir{--b:74px;right:calc(max(22px,env(safe-area-inset-right)) + 12px*var(--u));bottom:calc(max(20px,env(safe-area-inset-bottom)) + 112px*var(--u))}
  .zifir-ozel{--b:68px;right:calc(max(22px,env(safe-area-inset-right)) + 96px*var(--u));bottom:calc(max(20px,env(safe-area-inset-bottom)) + 92px*var(--u))}
  .zifir-dev{--b:56px;right:calc(max(12px,env(safe-area-inset-right)) + 66px*var(--u));top:max(10px,env(safe-area-inset-top));border-color:#ffd166!important;animation:zifirDev 1s infinite alternate}
  @keyframes zifirDev{to{box-shadow:0 0 14px #ffd166}}
  .zifir-durak{--b:58px;right:max(12px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));border-radius:14px!important}
  .zifir-dokun button.zifir-durak svg{width:50%;height:50%}
  .zifir-kol{position:fixed;left:50%;top:max(7px,env(safe-area-inset-top));transform:translateX(-50%);z-index:81;color:#dcfff7;background:#11192ccc;border-radius:9px;padding:5px 10px;font:11px system-ui;max-width:60vw;text-align:center;pointer-events:auto}
  .zifir-kol[hidden]{display:none}.zifir-kol summary{cursor:pointer}.zifir-kol p{max-width:380px;line-height:1.5;margin:6px 0}
  @media(max-height:420px){.zifir-dokun{--u:.88}}
  @media(max-height:340px){.zifir-dokun{--u:.8}}
  `;
  document.head.append(stil);
  const katman = document.createElement('div'); katman.className = 'zifir-dokun'; katman.hidden = true;
  const dg = (sinif, ad, ik) => `<button class="${sinif}" aria-label="${ad}">${svg(ik)}<span>${ad}</span></button>`;
  katman.innerHTML = '<div class="zifir-ipucu" aria-hidden="true">HAREKET</div><div class="zifir-bolge sol" aria-label="Hareket"></div><div class="zifir-bolge sag" aria-label="Bakış"></div>'
    + '<div class="zifir-taban"><i></i></div>'
    + dg('zifir-ag', 'AĞ', 'ag') + dg('zifir-zipla', 'ZIPLA', 'zipla') + dg('zifir-saldir', 'SALDIR', 'saldir') + dg('zifir-ozel', OZEL_VARSAYILAN[0], OZEL_VARSAYILAN[1])
    + dg('zifir-dev', 'DEV', 'dev').replace('<button', '<button hidden') + `<button class="zifir-durak" aria-label="Duraklat">${svg('durak')}</button>`;
  document.body.append(katman);
  const bilgi = document.createElement('details'); bilgi.className = 'zifir-kol'; bilgi.hidden = true;
  bilgi.innerHTML = '<summary></summary><p>Sol yarı: dokunduğun yerde hareket çubuğu · Sağ yarı: sürükle = bakış<br>AĞ: basılı tut = sallan · ZIPLA: zıpla, havada düşerken basılı tut = süzül<br>SALDIR: vur · ÖZEL: yerde kamçı, havada dalış, sallanırken çekil<br>DEV: güç dolunca üstte belirir · Ⅱ: duraklat<br>Oyun kolu: × zıpla · ○ çekil · □ kamçı · △ Dev · L2 ağ · R2 saldırı · L1 süzül · R1 dalış</p>';
  document.body.append(bilgi);

  function dinle(h, a, f, o) { h.addEventListener(a, f, o); dinleyiciler.push([h, a, f, o]); }
  function kodGuncelle(k) {
    const varmi = oto.has(k) || [...sahip.values()].some(v => v === k);
    if (varmi && !tuslar.has(k)) { tuslar.add(k); yeni.add(k); } else if (!varmi && tuslar.delete(k)) birak.add(k);
  }
  const ozelEl = katman.querySelector('.zifir-ozel'), devEl = katman.querySelector('.zifir-dev'), ziplaEl = katman.querySelector('.zifir-zipla');
  let ozel = OZEL_VARSAYILAN, ziplaBasT = 0;
  function dugme(el, kod) {
    const tut = new Set();
    // kod bir işlevse basıldığı anda çözülür (bağlama duyarlı düğme).
    dinle(el, 'pointerdown', e => {
      if (G.durum !== 'oyun') return;
      e.preventDefault(); e.stopPropagation();
      const k = typeof kod === 'function' ? kod() : kod;
      sahip.set(e.pointerId, k); tut.add(e.pointerId); el.setPointerCapture(e.pointerId); el.dataset.basili = ''; kodGuncelle(k);
      if (el === ziplaEl) ziplaBasT = performance.now();
    });
    const bitir = e => {
      if (!sahip.has(e.pointerId) || !tut.has(e.pointerId)) return;
      e.preventDefault(); const k = sahip.get(e.pointerId); sahip.delete(e.pointerId); tut.delete(e.pointerId); kodGuncelle(k);
      if (!tut.size) delete el.dataset.basili;
      if (el === ziplaEl) ziplaBasT = 0;
    };
    for (const a of ['pointerup', 'pointercancel', 'lostpointercapture']) dinle(el, a, bitir);
  }
  dugme(katman.querySelector('.zifir-ag'), 'Fare2');
  dugme(ziplaEl, 'Space');
  dugme(katman.querySelector('.zifir-saldir'), 'Fare0');
  dugme(ozelEl, () => ozel[2]);
  dugme(devEl, 'KeyQ');
  dugme(katman.querySelector('.zifir-durak'), 'Escape');

  // Yüzen çubuk (sol) ve bakış sürüklemesi (sağ).
  const taban = katman.querySelector('.zifir-taban'), top = taban.querySelector('i'), ipucu = katman.querySelector('.zifir-ipucu');
  const YAR = 52;
  let solId = null, sx = 0, sy = 0, bakId = null, bx = 0, by = 0, bdx = 0, bdy = 0, sonT = performance.now();
  const solEl = katman.querySelector('.zifir-bolge.sol'), sagEl = katman.querySelector('.zifir-bolge.sag');
  function solHareket(e) {
    if (solId !== e.pointerId) return; e.preventDefault();
    let x = (e.clientX - sx) / YAR, y = (e.clientY - sy) / YAR; const d = Math.hypot(x, y);
    if (d > 1) { x /= d; y /= d; }
    eksen.x = Math.abs(x) < .08 ? 0 : x; eksen.y = Math.abs(y) < .08 ? 0 : -y;
    top.style.transform = `translate(${x * YAR}px,${y * YAR}px)`;
  }
  function solBitir(e) { if (e.pointerId !== solId) return; solId = null; eksen.x = eksen.y = 0; top.style.transform = ''; taban.classList.remove('acik'); }
  dinle(solEl, 'pointerdown', e => {
    if (solId !== null || G.durum !== 'oyun') return; e.preventDefault();
    solId = e.pointerId; sx = e.clientX; sy = e.clientY; solEl.setPointerCapture(solId);
    taban.style.left = sx + 'px'; taban.style.top = sy + 'px'; taban.classList.add('acik'); top.style.transform = '';
  });
  dinle(solEl, 'pointermove', solHareket);
  for (const a of ['pointerup', 'pointercancel', 'lostpointercapture']) dinle(solEl, a, solBitir);
  dinle(sagEl, 'pointerdown', e => { if (bakId !== null || G.durum !== 'oyun') return; e.preventDefault(); bakId = e.pointerId; bx = e.clientX; by = e.clientY; sagEl.setPointerCapture(bakId); });
  dinle(sagEl, 'pointermove', e => { if (bakId !== e.pointerId) return; e.preventDefault(); bdx += e.clientX - bx; bdy += e.clientY - by; bx = e.clientX; by = e.clientY; });
  function bakBitir(e) { if (e.pointerId !== bakId) return; bakId = null; bdx = bdy = 0; bakis.x = bakis.y = 0; }
  for (const a of ['pointerup', 'pointercancel', 'lostpointercapture']) dinle(sagEl, a, bakBitir);
  sifirla.push(() => {
    for (const [el, id] of [[solEl, solId], [sagEl, bakId]]) if (id !== null && el.hasPointerCapture?.(id)) el.releasePointerCapture(id);
    solId = bakId = null; bdx = bdy = 0; top.style.transform = ''; taban.classList.remove('acik'); ziplaBasT = 0; oto.clear();
  });

  function temizle() {
    sahip.clear(); oto.clear(); for (const k of tuslar) birak.add(k); tuslar.clear(); yeni.clear();
    eksen.x = eksen.y = bakis.x = bakis.y = 0;
    for (const el of katman.querySelectorAll('[data-basili]')) delete el.dataset.basili;
    for (const fn of sifirla) fn();
  }
  dinle(window, 'blur', temizle); dinle(document, 'visibilitychange', () => { if (document.hidden) temizle(); });
  dinle(window, 'touchmove', e => { if (dokunmatik && G.durum === 'oyun') e.preventDefault(); }, { passive: false });
  dinle(window, 'contextmenu', e => { if (dokunmatik) e.preventDefault(); });
  let once = false, eskiTouch = '', ozelAd = '', devGor = false;
  return {
    dokunmatik, tuslar, yeni, birak, eksen, bakis, temizle,
    guncelle(kol) {
      const oyun = G.durum === 'oyun', simdi = performance.now(), dt = Math.min(0.05, Math.max(0.004, (simdi - sonT) / 1000)); sonT = simdi;
      katman.hidden = !(dokunmatik && oyun);
      if (once && !oyun) temizle();
      if (dokunmatik && oyun && !once) { eskiTouch = document.documentElement.style.touchAction; document.documentElement.style.touchAction = 'none'; }
      if (dokunmatik && once && !oyun) document.documentElement.style.touchAction = eskiTouch;
      once = oyun;
      // Kontrol kutusu yalnız duraklat menüsünde.
      bilgi.hidden = !(dokunmatik && G.durum === 'duraklat');
      bilgi.querySelector('summary').textContent = kol ? 'Oyun kolu bağlı · kontroller' : 'Dokunmatik kontroller';
      if (!(dokunmatik && oyun)) return;
      const p = G.oyuncu, d = p?.durum;
      // Bakış: parmağın bu karedeki yer değiştirmesi -> çubuk hızı (eski bakış çubuğuyla aynı birim).
      bakis.x = Math.max(-3, Math.min(3, bdx / dt / 420)); bakis.y = Math.max(-3, Math.min(3, bdy / dt / 420)); bdx = bdy = 0;
      // Bağlama duyarlı ÖZEL düğme (basılıyken etiket sabit kalır).
      if (!ozelEl.hasAttribute('data-basili')) {
        ozel = OZEL[d] || OZEL_VARSAYILAN;
        if (ozel[0] !== ozelAd) { ozelAd = ozel[0]; ozelEl.innerHTML = svg(ozel[1]) + `<span>${ozel[0]}</span>`; ozelEl.setAttribute('aria-label', ozel[0]); }
      }
      // Dev düğmesi yalnız güç doluyken.
      const dev = !!p && !p.dev && p.guc >= p.gucMax;
      if (dev !== devGor) { devGor = dev; devEl.hidden = !dev; if (!dev && devEl.hasAttribute('data-basili')) { for (const [id, k] of sahip) if (k === 'KeyQ') sahip.delete(id); kodGuncelle('KeyQ'); delete devEl.dataset.basili; } }
      // Otomatik süzülme: havada ZIPLA'yı 0.22 sn'den uzun tut (düşerken ya da süzülürken).
      const suz = ziplaBasT > 0 && simdi - ziplaBasT > 220 && p && !p.yerde && (HAVA.has(d) && (d !== 'zipla' || p.hiz?.y < 0.5));
      if (suz !== oto.has('ShiftLeft')) { suz ? oto.add('ShiftLeft') : oto.delete('ShiftLeft'); kodGuncelle('ShiftLeft'); }
      ipucu.classList.toggle('gizli', solId !== null);
    },
    kapat() { temizle(); if (dokunmatik && once) document.documentElement.style.touchAction = eskiTouch; for (const [h, a, f, o] of dinleyiciler) h.removeEventListener(a, f, o); katman.remove(); bilgi.remove(); stil.remove(); }
  };
}
