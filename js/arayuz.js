// Arayüz — DOM HUD, menü, duraklat. SOZLESME §4. CSS burada enjekte edilir.
const CSS = `
#arayuz{--mor:#9d4dff;--tur:#2ef2e0;--tur2:#7af9ee;--pembe:#ff5fd2;font-family:system-ui,"Segoe UI",Ubuntu,"Noto Sans",sans-serif;font-weight:700;color:#fff}
#arayuz *{box-sizing:border-box}
#arayuz .gizli{display:none!important}
#arayuz canvas.hizc{position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity .25s}
#arayuz .vin{position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at center,transparent 45%,rgba(157,77,255,.55) 80%,rgba(80,10,160,.85) 100%);transition:opacity .5s}
#arayuz .vin.vur{opacity:1;transition:opacity .05s}
/* menü */
#arayuz .perde{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2.2vh;
 background:radial-gradient(ellipse at 50% 40%,rgba(30,10,60,.35),rgba(5,2,14,.78));backdrop-filter:blur(9px) saturate(1.3);-webkit-backdrop-filter:blur(9px) saturate(1.3);
 pointer-events:auto;animation:perdeGir .6s ease-out}
@keyframes perdeGir{from{opacity:0}to{opacity:1}}
#arayuz .logo{display:flex;font-size:min(20vw,17vh);font-weight:1000;letter-spacing:.02em;line-height:1;margin-top:-2vh;
 filter:drop-shadow(0 0 18px rgba(157,77,255,.8)) drop-shadow(0 0 48px rgba(46,242,224,.45))}
#arayuz .logo span{display:inline-block;background:linear-gradient(120deg,#8a3dff 0%,#c46bff 28%,#2ef2e0 62%,#8a3dff 100%);background-size:300% 100%;
 -webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:2px rgba(255,255,255,.12);
 animation:akis 5s linear infinite,jole 2.6s ease-in-out infinite;transform-origin:50% 100%;padding:.14em .015em 0}
#arayuz .logo span:nth-child(2){animation-delay:0s,.18s}#arayuz .logo span:nth-child(3){animation-delay:0s,.36s}
#arayuz .logo span:nth-child(4){animation-delay:0s,.54s}#arayuz .logo span:nth-child(5){animation-delay:0s,.72s}
@keyframes akis{to{background-position:300% 0}}
@keyframes jole{0%,100%{transform:scale(1,1)}30%{transform:scale(1.07,.92)}60%{transform:scale(.95,1.07)}}
#arayuz .alt{font-size:min(3.2vw,3.2vh);letter-spacing:.38em;text-transform:uppercase;color:#d8c8ff;text-shadow:0 0 14px rgba(157,77,255,.9);margin-top:-1vh}
#arayuz .oyna{pointer-events:auto;cursor:pointer;border:0;font:inherit;font-weight:1000;font-size:min(5vw,5vh);letter-spacing:.2em;color:#06020f;padding:.45em 1.9em;border-radius:999px;
 background:linear-gradient(135deg,var(--tur2),var(--tur) 45%,#9d7bff);box-shadow:0 0 0 3px rgba(255,255,255,.18),0 0 36px rgba(46,242,224,.65),0 10px 30px rgba(0,0,0,.5);
 transition:transform .15s,box-shadow .15s;animation:nabiz 2s ease-in-out infinite}
#arayuz .oyna:hover{transform:scale(1.08,.95) rotate(-1deg);box-shadow:0 0 0 3px #fff,0 0 60px rgba(46,242,224,.95),0 10px 30px rgba(0,0,0,.5)}
#arayuz .oyna:active{transform:scale(.94,1.05)}
#arayuz .oyna.ikinci{font-size:min(2.6vw,2.6vh);padding:.5em 1.6em;background:rgba(255,255,255,.1);color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.25);animation:none;letter-spacing:.12em}
#arayuz .oyna.ikinci:hover{background:rgba(157,77,255,.4)}
@keyframes nabiz{0%,100%{filter:brightness(1)}50%{filter:brightness(1.15)}}
#arayuz .kart{pointer-events:auto;display:grid;grid-template-columns:repeat(3,auto);gap:.7vh 2.6vw;padding:1.6vh 2.4vw;border-radius:20px;
 background:rgba(18,8,40,.62);border:1px solid rgba(157,77,255,.4);box-shadow:0 0 30px rgba(157,77,255,.2) inset,0 8px 30px rgba(0,0,0,.4);font-size:min(1.9vw,2.1vh)}
#arayuz .kart div{display:flex;align-items:center;gap:.6em;white-space:nowrap;color:#e6dcff}
#arayuz kbd{display:inline-block;min-width:1.9em;text-align:center;padding:.18em .5em;border-radius:.45em;font:inherit;font-size:.92em;color:#fff;
 background:linear-gradient(#3b2670,#241447);border:1px solid #7b5cd6;border-bottom-width:3px;box-shadow:0 0 8px rgba(157,77,255,.4)}
#arayuz kbd.tur{border-color:var(--tur);box-shadow:0 0 10px rgba(46,242,224,.5)}
#arayuz .ipucu{font-size:min(1.6vw,1.8vh);color:#a99bd0;font-weight:600}
#arayuz .dugmeler{display:flex;flex-direction:column;align-items:center;gap:1.6vh}
#arayuz .perde.menuA{align-items:flex-start;padding-left:6vw;background:linear-gradient(90deg,rgba(4,1,12,.94) 0%,rgba(4,1,12,.8) 28%,rgba(4,1,12,.25) 55%,rgba(4,1,12,0) 75%),url(assets/menu_arka.jpg) center/cover no-repeat;backdrop-filter:none;-webkit-backdrop-filter:none;gap:1.6vh}
#arayuz .perde.menuA .logoR{width:min(40vw,70vh);height:auto;filter:drop-shadow(0 0 22px rgba(157,77,255,.6))}
#arayuz .perde.menuA .kart{grid-template-columns:repeat(2,auto);font-size:min(1.5vw,1.9vh)}
#yukleniyor{position:fixed;inset:0;z-index:99999;background:#050110 url(assets/yukleniyor.jpg) center/cover no-repeat;transition:opacity .6s;display:flex;align-items:flex-end;justify-content:center;padding-bottom:6vh;font:700 min(3vh,22px) system-ui,sans-serif;letter-spacing:.3em;color:#d9c3ff;text-shadow:0 0 14px #9d4dff,0 2px 6px #000}
#yukleniyor.bitti{opacity:0;pointer-events:none}
/* HUD */
#arayuz .hud{position:absolute;inset:0;transition:opacity .4s}
#arayuz .sol-alt{position:absolute;left:2.2vw;bottom:3vh;display:flex;flex-direction:column;gap:1.1vh;width:min(32vw,380px)}
#arayuz .bar{position:relative;height:3.4vh;min-height:22px;border-radius:999px 999px 999px 999px/60% 60% 60% 60%;background:rgba(10,4,24,.7);
 border:2px solid rgba(255,255,255,.22);box-shadow:0 0 16px rgba(0,0,0,.5) inset,0 4px 14px rgba(0,0,0,.4);overflow:hidden}
#arayuz .bar i{position:absolute;left:0;top:0;bottom:0;width:100%;border-radius:inherit;transition:width .25s cubic-bezier(.3,1.6,.5,1);transform-origin:left}
#arayuz .bar i::after{content:"";position:absolute;left:6%;right:6%;top:14%;height:28%;border-radius:99px;background:linear-gradient(90deg,rgba(255,255,255,.55),rgba(255,255,255,.05))}
#arayuz .can i{background:linear-gradient(90deg,#7c2dff,#c14bff 60%,#ff6ad8)}
#arayuz .guc i{background:linear-gradient(90deg,#0aa7b8,#2ef2e0 70%,#b6fff7)}
#arayuz .canK{display:flex;align-items:center;gap:.8vw;animation:sallan 3.2s ease-in-out infinite;transform-origin:0 100%}
#arayuz .canK .bar{flex:1;animation:jolebar 2.4s ease-in-out infinite;transform-origin:left center}
#arayuz .canK.az .bar{border-color:#ff5f9a;animation:jolebar .6s ease-in-out infinite}
@keyframes sallan{0%,100%{transform:rotate(-.8deg)}50%{transform:rotate(.8deg)}}
@keyframes jolebar{0%,100%{transform:scale(1,1)}50%{transform:scale(1.02,.92)}}
#arayuz .damla{width:min(5vh,48px);height:min(5vh,48px);flex:none;filter:drop-shadow(0 0 8px rgba(157,77,255,.9))}
#arayuz .gucK{position:relative}
#arayuz .gucK .qyazi{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:min(2.1vh,16px);letter-spacing:.14em;color:#06020f;text-shadow:none;opacity:0}
#arayuz .gucK.dolu .bar{box-shadow:0 0 28px rgba(46,242,224,.9);animation:yan .7s ease-in-out infinite}
#arayuz .gucK.dolu .qyazi{opacity:1}
@keyframes yan{0%,100%{filter:brightness(1)}50%{filter:brightness(1.7)}}
#arayuz .etiket{font-size:min(1.5vh,12px);letter-spacing:.2em;color:#cdbbff;margin:0 0 -.5vh 5.5vh;text-shadow:0 1px 4px #000}
#arayuz .gorev{position:absolute;right:2vw;top:3vh;width:min(30vw,340px);padding:1.4vh 1.2vw;border-radius:18px;background:linear-gradient(160deg,rgba(40,16,86,.78),rgba(10,6,30,.78));
 border:1px solid rgba(46,242,224,.45);box-shadow:0 0 24px rgba(46,242,224,.18),0 8px 24px rgba(0,0,0,.45);backdrop-filter:blur(6px);transition:transform .4s,opacity .4s}
#arayuz .gorev .gb{font-size:min(1.4vh,11px);letter-spacing:.3em;color:var(--tur)}
#arayuz .gorev .ga{font-size:min(2.5vh,21px);margin:.4vh 0;text-shadow:0 0 12px rgba(157,77,255,.8)}
#arayuz .gorev .gc{font-size:min(1.8vh,14px);font-weight:600;color:#d8ccf5;line-height:1.3}
#arayuz .gorev .gi{margin-top:1vh;height:.9vh;min-height:6px;border-radius:9px;background:rgba(255,255,255,.12);overflow:hidden}
#arayuz .gorev .gi i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--mor),var(--tur));border-radius:9px;transition:width .4s}
#arayuz .gorev .gs{text-align:right;font-size:min(1.6vh,13px);margin-top:.4vh;color:var(--tur2)}
#arayuz .kure{position:absolute;right:2vw;top:calc(3vh + 1px);margin-top:var(--kureTop,150px);display:flex;align-items:center;gap:.6vw;font-size:min(3vh,26px);
 padding:.5vh 1.1vw;border-radius:999px;background:rgba(10,4,24,.62);border:1px solid rgba(255,200,90,.5);text-shadow:0 0 10px rgba(255,200,90,.8)}
#arayuz .kure b{display:inline-block;width:1.1em;height:1.1em;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#ffe08a 40%,#ff9d2e);box-shadow:0 0 14px #ffb83d}
#arayuz .kure.sek{animation:sek .4s}
@keyframes sek{40%{transform:scale(1.25)}}
#arayuz .nisan{position:absolute;left:50%;top:50%;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:rgba(255,255,255,.4);box-shadow:0 0 4px rgba(0,0,0,.6);transition:all .12s}
#arayuz .nisan.var{width:26px;height:26px;margin:-13px 0 0 -13px;background:transparent;border:3px solid var(--tur);box-shadow:0 0 16px var(--tur),0 0 6px var(--tur) inset}
#arayuz .nisan.kilit{width:34px;height:34px;margin:-17px 0 0 -17px;background:transparent;border:3px solid #ff6a3a;box-shadow:0 0 16px #ff6a3a,0 0 6px #ff6a3a inset}
#arayuz .nisan.kilit::after{content:"";position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:#ffb08a}
#arayuz .vurus{position:absolute;left:50%;top:50%;width:30px;height:30px;margin:-15px 0 0 -15px;opacity:0;transition:opacity .25s;pointer-events:none}
#arayuz .vurus.ac{opacity:1;transition:none}
#arayuz .vurus::before,#arayuz .vurus::after{content:"";position:absolute;left:50%;top:50%;width:26px;height:3px;margin:-1.5px -13px;background:#fff;box-shadow:0 0 6px #000;transform:rotate(45deg)}
#arayuz .vurus::after{transform:rotate(-45deg)}
#arayuz .nisan.var::after{content:"";position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:var(--tur2)}
#arayuz .ok{position:absolute;left:0;top:0;width:0;height:0;transition:opacity .2s;will-change:transform}
#arayuz .ok svg{position:absolute;left:-26px;top:-26px;width:52px;height:52px;filter:drop-shadow(0 0 8px var(--tur));animation:okn 1s ease-in-out infinite}
#arayuz .ok em{position:absolute;left:-40px;width:80px;top:24px;text-align:center;font-style:normal;font-size:15px;color:var(--tur2);text-shadow:0 0 6px #000,0 0 10px var(--tur)}
@keyframes okn{50%{transform:scale(1.18)}}
/* mesajlar */
#arayuz .mesajlar{position:absolute;left:50%;top:14vh;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:1vh}
#arayuz .mesaj{padding:1.1vh 1.8vw;border-radius:22px 22px 22px 6px;font-size:min(2.4vh,20px);background:linear-gradient(135deg,rgba(60,20,130,.9),rgba(20,60,90,.88));
 border:1px solid rgba(255,255,255,.3);box-shadow:0 0 22px rgba(157,77,255,.55),0 6px 18px rgba(0,0,0,.4);animation:mgir .45s cubic-bezier(.3,1.7,.5,1)}
#arayuz .mesaj.cik{animation:mcik .4s ease-in forwards}
@keyframes mgir{from{opacity:0;transform:translateY(-24px) scale(.6,1.3)}}
@keyframes mcik{to{opacity:0;transform:translateY(-16px) scale(.9)}}
#arayuz .baslik{position:absolute;left:0;right:0;top:30vh;text-align:center;pointer-events:none;opacity:0}
#arayuz .baslik small{display:block;font-size:min(2.2vh,18px);letter-spacing:.5em;color:var(--tur2);text-shadow:0 0 12px var(--tur)}
#arayuz .baslik h2{margin:.5vh 0 0;font-size:min(9vh,7vw);font-weight:1000;letter-spacing:.06em;background:linear-gradient(100deg,#b57bff,#2ef2e0,#ffd36b);-webkit-background-clip:text;background-clip:text;color:transparent;
 filter:drop-shadow(0 0 18px rgba(157,77,255,.9))}
#arayuz .baslik.goster{animation:bsl 2.8s ease-out forwards}
@keyframes bsl{0%{opacity:0;transform:scale(1.8)}12%{opacity:1;transform:scale(.94,1.06)}20%{transform:scale(1)}78%{opacity:1}100%{opacity:0;transform:scale(1.04) translateY(-3vh)}}
#arayuz .uc{position:absolute;font-size:min(4vh,32px);font-weight:1000;color:#ffe08a;text-shadow:0 0 12px #ff9d2e,0 2px 4px #000;pointer-events:none;animation:uc 1.3s ease-out forwards;transform:translate(-50%,-50%)}
@keyframes uc{0%{opacity:0;transform:translate(-50%,-30%) scale(.5)}15%{opacity:1;transform:translate(-50%,-80%) scale(1.3)}100%{opacity:0;transform:translate(-50%,-260%) scale(1)}}
#arayuz .toparla{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(30,10,70,.55),rgba(5,2,14,.92));
 font-size:min(6vh,5vw);letter-spacing:.14em;color:#d9c3ff;text-shadow:0 0 24px var(--mor);opacity:0;transition:opacity .5s;pointer-events:none}
#arayuz .toparla.ac{opacity:1}
#arayuz .toparla span{animation:jole 1.6s ease-in-out infinite;display:inline-block}
#arayuz .devrozet{position:absolute;left:50%;bottom:3vh;transform:translateX(-50%);font-size:min(2.6vh,22px);letter-spacing:.3em;color:var(--tur2);text-shadow:0 0 16px var(--tur);animation:yan .6s infinite}
`;

let vurus = 0;
const TUSLAR = [
  ['<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>', 'Yürü'],
  ['<kbd class="tur">Fare</kbd>', 'Etrafa bak'],
  ['<kbd class="tur">Sol tık</kbd>', 'Vur / jöle at (basılı: seri)'],
  ['<kbd class="tur">Sağ tık</kbd> BASILI', 'Dokunaçla sallan, bırak: fırla'],
  ['<kbd>Space</kbd>', 'Zıpla (havada 2.)'],
  ['<kbd>Shift</kbd>', 'Koş / tırman'],
  ['<kbd>E</kbd>', 'Çekil (zip)'],
  ['<kbd>F</kbd>', 'Dokunaç kamçısı'],
  ['<kbd>Q</kbd>', 'DEV ZİFİR'],
  ['<kbd>M</kbd> <kbd>Esc</kbd>', 'Ses · Duraklat'],
];
const DAMLA = `<svg class="damla" viewBox="0 0 48 48"><defs><clipPath id="dk"><rect id="dkr" x="0" y="0" width="48" height="48"/></clipPath>
<linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6ad8"/><stop offset="1" stop-color="#7c2dff"/></linearGradient></defs>
<path d="M24 3C24 3 8 20 8 31a16 16 0 0 0 32 0C40 20 24 3 24 3Z" fill="#150a30" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>
<path clip-path="url(#dk)" d="M24 3C24 3 8 20 8 31a16 16 0 0 0 32 0C40 20 24 3 24 3Z" fill="url(#dg)"/><ellipse cx="18" cy="28" rx="3" ry="5" fill="#fff" fill-opacity=".5" transform="rotate(20 18 28)"/></svg>`;
const OK = `<svg viewBox="0 0 52 52"><path d="M26 4 46 44 26 35 6 44Z" fill="#2ef2e0" fill-opacity=".85" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>`;

let G_, kok, e = {}, vurma = 0, kilitliydi = false, kuyruk = [], mesajVar = false, gorevAd = '', toparliyor = false, sonKure = -1;
const gecici = new Map();

function el(ad, sinif, html, ebeveyn) {
  const x = document.createElement(ad); if (sinif) x.className = sinif; if (html != null) x.innerHTML = html;
  (ebeveyn || kok).appendChild(x); return x;
}

function mesajGoster() {
  if (mesajVar || !kuyruk.length) return;
  const { metin, sure } = kuyruk.shift(); mesajVar = true;
  const m = el('div', 'mesaj', '', e.mesajlar); m.textContent = metin;
  setTimeout(() => { m.classList.add('cik'); setTimeout(() => { m.remove(); mesajVar = false; mesajGoster(); }, 380); }, sure * 1000);
}
function baslikGoster(ust, ad) {
  e.baslik.innerHTML = `<small></small><h2></h2>`;
  e.baslik.firstChild.textContent = ust; e.baslik.lastChild.textContent = ad;
  e.baslik.classList.remove('goster'); void e.baslik.offsetWidth; e.baslik.classList.add('goster');
}
function ekranaCevir(v) {
  const p = v.clone().project(G_.kamera);
  return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight, arka: p.z > 1 };
}
function ucus(metin, konum) {
  let x = innerWidth / 2, y = innerHeight * 0.42;
  if (konum && G_.kamera) { const s = ekranaCevir(konum); if (!s.arka) { x = s.x; y = s.y; } }
  const u = el('div', 'uc', '', e.hud); u.textContent = metin; u.style.left = x + 'px'; u.style.top = y + 'px';
  setTimeout(() => u.remove(), 1400);
}
function oyunBaslat() {
  G_.durum = 'oyun'; G_.girdi?.kilitle?.(); G_.ses?.muzik?.(true);
}
function devam() { G_.durum = 'oyun'; G_.girdi?.kilitle?.(); }
function duraklat() { if (G_.durum === 'oyun') G_.durum = 'duraklat'; }

export function kur(G) {
  G_ = G;
  kok = document.getElementById('arayuz');
  if (!kok) { kok = document.createElement('div'); kok.id = 'arayuz'; document.body.appendChild(kok); }
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  // HUD
  e.hud = el('div', 'hud');
  e.hizc = el('canvas', 'hizc', null, e.hud);
  e.vin = el('div', 'vin', null, e.hud);
  e.nisan = el('div', 'nisan', null, e.hud);
  e.vurus = el('div', 'vurus', null, e.hud);
  e.ok = el('div', 'ok gizli', OK + '<em></em>', e.hud);
  const sa = el('div', 'sol-alt', '', e.hud);
  e.canK = el('div', 'canK', DAMLA + '<div class="bar can" style="flex:1"><i></i></div>', sa);
  e.guc = el('div', 'gucK', '<div class="bar guc"><i></i></div><div class="qyazi">Q — DEV ZİFİR!</div>', sa);
  e.canBar = e.canK.querySelector('i'); e.dkr = e.canK.querySelector('#dkr'); e.gucBar = e.guc.querySelector('i');
  e.gorev = el('div', 'gorev gizli', '<div class="gb">GÖREV</div><div class="ga"></div><div class="gc"></div><div class="gi"><i></i></div><div class="gs"></div>', e.hud);
  e.kure = el('div', 'kure', '<b></b><span>0</span>', e.hud);
  e.mesajlar = el('div', 'mesajlar', '', e.hud);
  e.baslik = el('div', 'baslik', '', e.hud);
  e.dev = el('div', 'devrozet gizli', 'DEV ZİFİR!', e.hud);
  e.toparla = el('div', 'toparla', '<span>Zifir toparlanıyor...</span>', e.hud);

  // Yükleme perdesi
  const yp = document.createElement('div'); yp.id = 'yukleniyor'; yp.textContent = 'YÜKLENİYOR...';
  document.body.appendChild(yp);
  let ypK = false; const ypKapat = () => { if (ypK) return; ypK = true; yp.classList.add('bitti'); setTimeout(() => yp.remove(), 800); };
  G.THREE.DefaultLoadingManager.onLoad = ypKapat;
  setTimeout(ypKapat, 10000);

  // Menü
  e.menu = el('div', 'perde menuA gizli');
  e.menu.innerHTML = `<img class="logoR" src="assets/logo.png" alt="ZİFİR">
   <div class="alt">Gece Şehrinin Kara Kahramanı</div>
   <button class="oyna tik">OYNA</button>
   <div class="kart">${TUSLAR.map(t => `<div>${t[0]}<span>${t[1]}</span></div>`).join('')}</div>
   <div class="ipucu">Sallanmak için bir binaya bak ve sol tuşu basılı tut!</div>`;
  e.menu.querySelector('.oyna').onclick = oyunBaslat;

  // Duraklat
  e.dur = el('div', 'perde gizli');
  e.dur.innerHTML = `<div class="alt" style="font-size:min(6vh,5vw);letter-spacing:.3em;color:#fff">DURAKLADI</div>
   <div class="dugmeler"><button class="oyna tik" data-a="devam">DEVAM</button>
   <button class="oyna ikinci tik" data-a="ses">Ses: açık</button>
   <button class="oyna ikinci tik" data-a="kalite">Kalite: Orta</button>
   <button class="oyna ikinci tik" data-a="kontrol">Kontroller</button></div>
   <div class="kart gizli">${TUSLAR.map(t => `<div>${t[0]}<span>${t[1]}</span></div>`).join('')}</div>`;
  const sesD = e.dur.querySelector('[data-a=ses]'), kart = e.dur.querySelector('.kart');
  e.sesD = sesD;
  e.dur.querySelector('[data-a=devam]').onclick = devam;
  sesD.onclick = () => { G.ses?.sessiz?.(!G.ses.sessizMi); };
  const kalD = e.dur.querySelector('[data-a=kalite]');
  const kalYaz = () => { kalD.textContent = 'Kalite: ' + (G.kaliteAd?.[G.kalite] || 'Orta'); };
  kalYaz(); G.olay.on('kalite', kalYaz);
  kalD.onclick = () => { const s = ['dusuk', 'orta', 'yuksek']; G.kaliteAyarla?.(s[(s.indexOf(G.kalite) + 1) % 3]); };
  e.dur.querySelector('[data-a=kontrol]').onclick = () => kart.classList.toggle('gizli');

  // Olaylar
  const o = G.olay;
  o.on('hasar', () => { e.vin.classList.add('vur'); vurma = 0.12; });
  o.on('yenildi', () => { toparliyor = true; e.toparla.classList.add('ac'); });
  o.on('dogdu', () => { toparliyor = false; e.toparla.classList.remove('ac'); });
  o.on('gorevBasla', v => baslikGoster('YENİ GÖREV', v?.ad || G.gorev?.aktif?.ad || ''));
  o.on('gorevBitti', v => baslikGoster('GÖREV TAMAM!', v?.ad || ''));
  o.on('kureAlindi', () => { e.kure.classList.remove('sek'); void e.kure.offsetWidth; e.kure.classList.add('sek'); ucus('+1 ✦', null); });
  o.on('isabet', () => { vurus = 0.15; e.vurus.classList.add('ac'); });
  o.on('robotYenildi', v => ucus('+' + (v?.puan ?? 10), v?.konum));
  o.on('devBasla', () => { e.dev.classList.remove('gizli'); G.arayuz.mesaj('DEV ZİFİR!', 2); });
  o.on('devBit', () => e.dev.classList.add('gizli'));

  // Pointer lock / Esc
  document.addEventListener('pointerlockchange', () => {
    const kilitli = !!document.pointerLockElement;
    if (kilitliydi && !kilitli && G.durum === 'oyun' && !G.test) duraklat();
    if (!kilitliydi && kilitli && G.durum === 'duraklat') G.durum = 'oyun';
    kilitliydi = kilitli;
  });
  addEventListener('keydown', ev => {
    if (ev.code === 'Escape' && !ev.repeat) { if (G.durum === 'duraklat') devam(); else if (G.durum === 'oyun' && !G.test) duraklat(); }
    if ((ev.code === 'Enter' || ev.code === 'Space') && G.durum === 'menu' && !G.test) { ev.preventDefault(); oyunBaslat(); }
  });
  addEventListener('blur', () => { if (G.durum === 'oyun' && !G.test) duraklat(); });

  G.arayuz = {
    mesaj(metin, sure = 3) { kuyruk.push({ metin: String(metin), sure }); mesajGoster(); },
  };
}

function bar(i, oran) { i.style.width = Math.max(0, Math.min(1, oran)) * 100 + '%'; }

export function guncelle(G, dt) {
  if (!kok) return;
  const d = G.durum, oyuncu = G.oyuncu;
  e.menu.classList.toggle('gizli', d !== 'menu');
  e.dur.classList.toggle('gizli', d !== 'duraklat');
  e.hud.style.opacity = d === 'menu' ? 0 : 1;
  if (e.sesD) e.sesD.textContent = 'Ses: ' + (G.ses?.sessizMi ? 'kapalı' : 'açık');

  // can / güç
  const can = oyuncu ? oyuncu.can / (oyuncu.canMax || 100) : 1;
  const guc = oyuncu ? oyuncu.guc / (oyuncu.gucMax || 100) : 1;
  bar(e.canBar, can); e.dkr.setAttribute('y', 48 * (1 - Math.max(0, Math.min(1, can))));
  e.canK.classList.toggle('az', can < 0.3);
  bar(e.gucBar, guc); e.guc.classList.toggle('dolu', guc >= 0.999);

  // vinyet
  if (vurma > 0) { vurma -= dt; if (vurma <= 0) e.vin.classList.remove('vur'); }

  // nişan
  e.nisan.classList.toggle('kilit', !!oyuncu?.nisanHedef);
  e.nisan.classList.toggle('var', !oyuncu?.nisanHedef && !!oyuncu?.nisanVar);
  if (vurus > 0) { vurus -= dt; if (vurus <= 0) e.vurus.classList.remove('ac'); }

  // görev
  const g = G.gorev?.aktif;
  e.gorev.classList.toggle('gizli', !g);
  if (g) {
    const [, ga, gc, gi, gs] = e.gorev.children;
    if (ga.textContent !== g.ad) ga.textContent = g.ad || '';
    if (gc.textContent !== g.aciklama) gc.textContent = g.aciklama || '';
    const h = g.hedef || 0;
    gi.parentNode.children[3].classList.toggle('gizli', !h);
    gi.firstChild.style.width = h ? Math.min(100, (g.ilerleme / h) * 100) + '%' : '0';
    gs.textContent = h ? `${g.ilerleme ?? 0} / ${h}` : '';
    e.kure.style.setProperty('--kureTop', e.gorev.offsetHeight + 12 + 'px');
  }
  const kn = G.gorev?.toplamKure ?? 0;
  if (kn !== sonKure) { sonKure = kn; e.kure.lastChild.textContent = kn; }

  // hedef oku
  const hedef = g?.isaret;
  if (hedef && G.kamera && d === 'oyun') {
    const s = ekranaCevir(hedef), W = innerWidth, H = innerHeight, cx = W / 2, cy = H / 2;
    let x = s.x, y = s.y;
    if (s.arka) { x = W - x; y = H - y; }
    let dx = x - cx, dy = y - cy;
    const ic = !s.arka && x > 60 && x < W - 60 && y > 60 && y < H - 60;
    if (!ic) {
      const k = Math.min((W / 2 - 60) / Math.abs(dx || 1e-6), (H / 2 - 60) / Math.abs(dy || 1e-6));
      x = cx + dx * k; y = cy + dy * k;
      if (s.arka && Math.abs(dx) < 1 && Math.abs(dy) < 1) { x = cx; y = H - 60; dx = 0; dy = 1; }
    }
    const aci = ic ? 180 : Math.atan2(dy, dx) * 180 / Math.PI + 90; // ok yukarı bakar
    e.ok.classList.remove('gizli');
    e.ok.style.transform = `translate(${x}px,${y}px)`;
    e.ok.firstChild.style.transform = `rotate(${aci}deg)`;
    const m = oyuncu?.konum ? Math.round(hedef.distanceTo(oyuncu.konum)) : Math.round(hedef.distanceTo(G.kamera.position));
    e.ok.lastChild.textContent = m + ' m';
  } else e.ok.classList.add('gizli');

  hizCizgileri(G, dt);
}

let hizK = 0;
function hizCizgileri(G, dt) {
  const c = e.hizc, v = G.oyuncu?.hiz;
  const hiz = v && G.durum === 'oyun' ? v.length() : 0;
  const hedefK = Math.max(0, Math.min(1, (hiz - 22) / 30));
  hizK += (hedefK - hizK) * Math.min(1, dt * 6);
  c.style.opacity = hizK > 0.02 ? 1 : 0;
  if (hizK <= 0.02) return;
  if (c.width !== innerWidth >> 1 || c.height !== innerHeight >> 1) { c.width = innerWidth >> 1; c.height = innerHeight >> 1; }
  const x = c.getContext('2d'), W = c.width, H = c.height;
  x.clearRect(0, 0, W, H);
  const n = Math.floor(10 + hizK * 36);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r0 = 0.55 + Math.random() * 0.25, r1 = r0 + 0.08 + hizK * 0.3 * Math.random();
    const px = Math.cos(a) * W / 2, py = Math.sin(a) * H / 2;
    x.strokeStyle = `rgba(${Math.random() < 0.5 ? '190,150,255' : '140,255,245'},${(0.15 + 0.35 * Math.random()) * hizK})`;
    x.lineWidth = 1 + Math.random() * 1.5;
    x.beginPath(); x.moveTo(W / 2 + px * r0 * 1.6, H / 2 + py * r0 * 1.6); x.lineTo(W / 2 + px * r1 * 1.6, H / 2 + py * r1 * 1.6); x.stroke();
  }
}
