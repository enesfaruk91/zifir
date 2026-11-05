// Fiziksel, oyun kolu ve demo girdileri tek karelik ortak API'de birleşir.
const durumlar = new WeakMap();
const KONTROLLER = new Set(['Escape', 'KeyM']);
const OYUN_TUSLARI = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
  'Space', 'ShiftLeft', 'ShiftRight', 'KeyF', 'KeyE', 'KeyQ', 'Escape', 'KeyM',
]);
const DUGMELER = [
  [0, 'Space'], [1, 'KeyE'], [2, 'KeyF'], [3, 'KeyQ'], [4, 'ShiftLeft'],
  [6, 'Fare0'], [7, 'Fare2'], [8, 'KeyM'], [9, 'Escape'], [10, 'ShiftLeft'],
];

function cubuk(x = 0, y = 0) {
  const uzunluk = Math.hypot(x, y);
  if (!Number.isFinite(uzunluk) || uzunluk < 0.18) return { x: 0, y: 0 };
  const oran = Math.min(1, (uzunluk - 0.18) / 0.82) / uzunluk;
  return { x: x * oran, y: y * oran };
}

export function kur(G) {
  durumlar.get(G)?.kapat();
  const canvas = G.renderer?.domElement || document.getElementById('sahne');
  const fiziksel = new Set();
  const bekleyenBas = new Set();
  const bekleyenBirak = new Set();
  const dinleyiciler = [];
  const s = {
    fiziksel, bekleyenBas, bekleyenBirak,
    basili: new Set(), yeni: new Set(), birak: new Set(),
    dx: 0, dy: 0, demoSure: 0, oncekiDurum: G.durum, kolNotrBekle: false,
    kapat() { for (const [hedef, ad, fn] of dinleyiciler) hedef.removeEventListener(ad, fn); },
  };
  durumlar.set(G, s);

  function dinle(hedef, ad, fn) {
    if (!hedef?.addEventListener) return;
    hedef.addEventListener(ad, fn);
    dinleyiciler.push([hedef, ad, fn]);
  }
  function bas(kod) {
    if (fiziksel.has(kod)) return;
    fiziksel.add(kod);
    bekleyenBas.add(kod);
  }
  function birak(kod) {
    if (fiziksel.delete(kod)) bekleyenBirak.add(kod);
  }
  function temizle() {
    for (const kod of fiziksel) bekleyenBirak.add(kod);
    fiziksel.clear();
    bekleyenBas.clear();
    s.dx = s.dy = 0;
    s.kolNotrBekle = true;
  }
  s.temizle = temizle;
  G.girdi = {
    basili: kod => s.basili.has(kod),
    yeniBasildi: kod => s.yeni.has(kod),
    birakildi: kod => s.birak.has(kod),
    fareDX: 0, fareDY: 0, eksen: { x: 0, y: 0 },
    kilitle() {
      if (!canvas?.requestPointerLock || document.pointerLockElement === canvas) return;
      try {
        const istek = canvas.requestPointerLock();
        istek?.catch?.(() => {});
      } catch { /* İzin verilmezse bir sonraki kullanıcı tıklaması yeniden dener. */ }
    },
  };
  dinle(window, 'keydown', e => {
    if (!OYUN_TUSLARI.has(e.code) || e.repeat) return;
    const hedef = e.target;
    if (hedef?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(hedef?.tagName || '')) return;
    if (G.durum !== 'oyun' && !KONTROLLER.has(e.code)) return;
    if (e.code !== 'Escape') e.preventDefault();
    bas(e.code);
  });
  dinle(window, 'keyup', e => birak(e.code));
  dinle(window, 'mousedown', e => {
    if (G.durum !== 'oyun' || (e.button !== 0 && e.button !== 2)) return;
    if (e.target !== canvas && document.pointerLockElement !== canvas) return;
    e.preventDefault();
    bas('Fare' + e.button);
    G.girdi.kilitle();
  });
  dinle(window, 'mouseup', e => birak('Fare' + e.button));
  dinle(window, 'mousemove', e => {
    if (G.durum !== 'oyun' || document.pointerLockElement !== canvas) return;
    s.dx += Number.isFinite(e.movementX) ? e.movementX : 0;
    s.dy += Number.isFinite(e.movementY) ? e.movementY : 0;
  });
  dinle(canvas, 'click', () => { if (G.durum === 'oyun') G.girdi.kilitle(); });
  dinle(canvas, 'contextmenu', e => e.preventDefault());
  dinle(window, 'blur', temizle);
  dinle(document, 'visibilitychange', () => { if (document.hidden) temizle(); });
  dinle(document, 'pointerlockchange', () => {
    if (document.pointerLockElement !== canvas) temizle();
  });
}

export function guncelle(G, dt) {
  const s = durumlar.get(G);
  if (!s || !G.girdi) return;
  const api = G.girdi;
  const oyun = G.durum === 'oyun';
  const adim = Math.min(0.05, Math.max(0, Number.isFinite(dt) ? dt : 0));
  if (s.oncekiDurum === 'oyun' && !oyun) s.temizle();
  s.oncekiDurum = G.durum;

  const simdi = new Set(s.fiziksel);
  let kolX = 0, kolY = 0, bakX = 0, bakY = 0;
  let kol = null;
  try { kol = Array.from(navigator.getGamepads?.() || []).find(p => p?.connected); } catch { /* Kol yok. */ }
  if (kol) {
    const sol = cubuk(kol.axes[0], kol.axes[1]);
    const sag = cubuk(kol.axes[2], kol.axes[3]);
    const hareketBasili = DUGMELER.some(([i, kod]) => !KONTROLLER.has(kod) && kol.buttons[i]?.pressed);
    if (!hareketBasili && !sol.x && !sol.y && !sag.x && !sag.y) s.kolNotrBekle = false;
    for (const [i, kod] of DUGMELER) {
      if (kol.buttons[i]?.pressed && (KONTROLLER.has(kod) || (oyun && !s.kolNotrBekle))) simdi.add(kod);
    }
    if (oyun && !s.kolNotrBekle) {
      kolX = sol.x; kolY = -sol.y;
      bakX = sag.x * adim * 650; bakY = sag.y * adim * 650;
    }
  }
  const demo = Boolean(G.test && oyun && s.demoSure < 6);
  if (demo) {
    const t = s.demoSure;
    simdi.add('KeyW');
    // İlk salınımda yan sokağa bak; sonraki tutunma aynı duvarda kalmasın.
    const donus = Math.max(0, Math.min(t + adim, 1.6) - Math.max(t, 1.1));
    bakX -= donus * (Math.PI / 2) / (0.0023 * 0.5);
    if (t < 1.65 || (t >= 2.05 && t < 3.8) || (t >= 4.2 && t < 5.8)) simdi.add('Fare0');
    else simdi.delete('Fare0');
    s.demoSure = Math.min(6, t + adim);
  }
  if (!oyun) for (const kod of simdi) if (!KONTROLLER.has(kod)) simdi.delete(kod);

  s.yeni.clear();
  s.birak.clear();
  for (const kod of simdi) if (!s.basili.has(kod)) s.yeni.add(kod);
  for (const kod of s.basili) if (!simdi.has(kod)) s.birak.add(kod);
  // İki kare arasında tamamlanan kısa bir dokunuş da kaybolmasın.
  for (const kod of s.bekleyenBas) {
    if ((oyun || KONTROLLER.has(kod)) && !s.basili.has(kod)) s.yeni.add(kod);
  }
  for (const kod of s.bekleyenBirak) if (!simdi.has(kod)) s.birak.add(kod);
  s.basili = simdi;
  s.bekleyenBas.clear();
  s.bekleyenBirak.clear();
  api.fareDX = oyun ? s.dx + bakX : 0;
  api.fareDY = oyun ? s.dy + bakY : 0;
  s.dx = s.dy = 0;

  const tus = (...kodlar) => kodlar.some(kod => simdi.has(kod)) ? 1 : 0;
  let x = tus('KeyD', 'ArrowRight') - tus('KeyA', 'ArrowLeft') + kolX;
  let y = tus('KeyW', 'ArrowUp') - tus('KeyS', 'ArrowDown') + kolY;
  const boy = Math.hypot(x, y);
  if (boy > 1) { x /= boy; y /= boy; }
  api.eksen.x = oyun ? x : 0;
  api.eksen.y = oyun ? y : 0;
}
