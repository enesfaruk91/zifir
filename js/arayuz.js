// Arayüz — AAA menü, ayarlar, HUD, pusula, mini harita, kombo, eğitim ipucu. SOZLESME §4 + §6.
const CSS = `
#arayuz{--mor:#9d4dff;--tur:#2ef2e0;--tur2:#7af9ee;--pembe:#ff5fd2;--cam:rgba(10,5,24,.62);font-family:system-ui,"Segoe UI",Ubuntu,"Noto Sans",sans-serif;font-weight:700;color:#fff}
#arayuz *{box-sizing:border-box}
#arayuz .gizli{display:none!important}
#arayuz button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
#arayuz canvas.hizc{position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity .25s}
#arayuz .vin{position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at center,transparent 45%,rgba(157,77,255,.55) 80%,rgba(80,10,160,.85) 100%);transition:opacity .5s}
#arayuz .vin.vur{opacity:1;transition:opacity .05s}
#arayuz kbd{display:inline-block;min-width:1.9em;text-align:center;padding:.16em .55em;border-radius:.4em;font:inherit;font-size:.9em;color:#fff;
 background:linear-gradient(#3b2670,#241447);border:1px solid #7b5cd6;border-bottom-width:3px;box-shadow:0 0 8px rgba(157,77,255,.35)}
#arayuz kbd.tur{border-color:var(--tur);box-shadow:0 0 10px rgba(46,242,224,.45)}
/* ---------- MENÜ ---------- */
#arayuz .mn{position:absolute;inset:0;overflow:hidden;pointer-events:auto;background:#05030a;animation:mnGir .7s ease-out}
@keyframes mnGir{from{opacity:0}to{opacity:1}}
#arayuz .mn-bg{position:absolute;inset:-5%;will-change:transform}
#arayuz .mn-img{position:absolute;inset:0;background:url(assets/menu_arka.jpg) center/cover no-repeat;animation:kenb 30s ease-in-out infinite alternate;will-change:transform}
@keyframes kenb{from{transform:scale(1.02) translate(0,0)}to{transform:scale(1.16) translate(-1.6%,-1.2%)}}
#arayuz .mn-golge{position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,1,12,.95) 0%,rgba(4,1,12,.78) 26%,rgba(4,1,12,.25) 52%,rgba(4,1,12,0) 72%),linear-gradient(0deg,rgba(4,1,12,.8),transparent 30%),radial-gradient(ellipse at 70% 40%,transparent 40%,rgba(2,0,8,.65))}
#arayuz .mn.dur .mn-bg{display:none}
#arayuz .mn.dur{background:rgba(4,1,12,.5);backdrop-filter:blur(8px) saturate(1.2);-webkit-backdrop-filter:blur(8px) saturate(1.2)}
#arayuz .mn.dur .mn-alt{display:none}
#arayuz .mn.dur .mn-golge{background:linear-gradient(90deg,rgba(4,1,12,.88) 0%,rgba(4,1,12,.55) 36%,rgba(4,1,12,.15) 70%)}
#arayuz .mn-sol{position:absolute;left:6vw;top:0;bottom:0;width:min(34vw,520px);display:flex;flex-direction:column;justify-content:center;gap:1.4vh}
#arayuz .mn-logo{width:min(34vw,60vh);height:auto;filter:drop-shadow(0 0 24px rgba(157,77,255,.6));animation:logoGir 1.3s cubic-bezier(.2,.9,.2,1) both,logoNefes 5s ease-in-out 1.3s infinite;transform-origin:0 50%}
@keyframes logoGir{0%{opacity:0;transform:scale(1.35) translateX(-4vw);filter:blur(14px) drop-shadow(0 0 60px #2ef2e0)}55%{opacity:1}100%{opacity:1;transform:none;filter:blur(0) drop-shadow(0 0 24px rgba(157,77,255,.6))}}
@keyframes logoNefes{50%{filter:drop-shadow(0 0 34px rgba(46,242,224,.55))}}
#arayuz .mn-baslik{font-size:min(5vh,4vw);letter-spacing:.34em;color:#fff;text-shadow:0 0 20px var(--mor)}
#arayuz .mn-alt{font-size:min(1.9vh,1.4vw);letter-spacing:.42em;color:#bba8e6;text-transform:uppercase;margin:-.4vh 0 3.2vh .3vw;animation:yukari .9s .55s both}
#arayuz .mn-liste{position:relative;display:flex;flex-direction:column;gap:.5vh;width:100%}
#arayuz .mn-cubuk{position:absolute;left:0;top:0;width:100%;height:6.4vh;border-left:4px solid var(--tur);background:linear-gradient(90deg,rgba(46,242,224,.28),rgba(157,77,255,.18) 55%,transparent);
 box-shadow:-6px 0 24px -4px rgba(46,242,224,.7);transition:transform .28s cubic-bezier(.2,.9,.25,1.1),height .2s;pointer-events:none}
#arayuz .oge{position:relative;display:block;text-align:left;height:6.4vh;line-height:6.4vh;padding:0 1.6vw;font-size:min(3.3vh,2.4vw);font-weight:900;letter-spacing:.22em;color:#a99bd0;
 transition:color .2s,transform .28s cubic-bezier(.2,.9,.25,1.1),text-shadow .2s;animation:ogeGir .6s cubic-bezier(.2,.9,.25,1) both}
@keyframes ogeGir{from{opacity:0;transform:translateX(-3vw)}}
#arayuz .oge.sec{color:#fff;transform:translateX(1.1vw);text-shadow:0 0 18px rgba(46,242,224,.85)}
@keyframes yukari{from{opacity:0;transform:translateY(12px)}}
#arayuz .mn-ipucu{position:absolute;left:6vw;bottom:3.4vh;display:flex;gap:1.6vw;align-items:center;font-size:min(1.7vh,1.2vw);color:#8c7fb3;letter-spacing:.12em;animation:yukari 1s 1.2s both}
#arayuz .mn-ipucu kbd{font-size:.9em}
#arayuz .mn-atif{position:absolute;left:6vw;bottom:1vh;font-size:min(1.25vh,.9vw);letter-spacing:.06em;color:#8c7fb3;opacity:.8}
#arayuz .mn-surum{position:absolute;right:3vw;bottom:3.4vh;font-size:min(1.6vh,1.1vw);letter-spacing:.3em;color:#6e6392}
/* panel */
#arayuz .panel{position:absolute;right:5vw;top:50%;width:min(46vw,680px);max-height:84vh;overflow:auto;transform:translateY(-50%);padding:2.4vh 1.8vw;border-radius:4px 22px 4px 22px;
 background:linear-gradient(160deg,rgba(24,10,52,.84),rgba(8,4,22,.86));border:1px solid rgba(157,77,255,.45);border-top:2px solid var(--tur);box-shadow:0 0 50px rgba(157,77,255,.18),0 20px 60px rgba(0,0,0,.6);
 backdrop-filter:blur(10px);animation:panelGir .35s cubic-bezier(.2,.9,.25,1) both;scrollbar-width:thin}
@keyframes panelGir{from{opacity:0;transform:translate(3vw,-50%)}}
#arayuz .panel h3{margin:0 0 1.6vh;font-size:min(2.6vh,1.9vw);letter-spacing:.34em;color:var(--tur2);text-shadow:0 0 14px rgba(46,242,224,.6);display:flex;align-items:center;gap:1vw}
#arayuz .panel h3::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(46,242,224,.6),transparent)}
#arayuz .sat{display:grid;grid-template-columns:1fr 44% 3.6em;align-items:center;gap:1vw;min-height:5.2vh;padding:.5vh 1vw;border-left:3px solid transparent;font-size:min(2.1vh,1.5vw);color:#cdbfee;cursor:pointer;transition:background .15s}
#arayuz .sat.sec{background:linear-gradient(90deg,rgba(157,77,255,.3),rgba(157,77,255,.04));border-left-color:var(--tur);color:#fff}
#arayuz .sat .deg{text-align:right;color:var(--tur2);font-variant-numeric:tabular-nums}
#arayuz .sat .sl{position:relative;height:.8vh;min-height:6px;border-radius:9px;background:rgba(255,255,255,.14);cursor:ew-resize}
#arayuz .sat .sl i{position:absolute;left:0;top:0;bottom:0;border-radius:9px;background:linear-gradient(90deg,var(--mor),var(--tur))}
#arayuz .sat .sl i::after{content:"";position:absolute;right:-7px;top:50%;width:14px;height:14px;margin-top:-7px;border-radius:50%;background:#fff;box-shadow:0 0 12px var(--tur)}
#arayuz .sat .tek{grid-column:2/4;text-align:right;color:var(--tur2);letter-spacing:.12em}
#arayuz .sat.dg{color:#e9defe;letter-spacing:.14em}
#arayuz .kontrol{display:grid;grid-template-columns:auto 1fr;gap:.9vh 1.6vw;align-items:center;font-size:min(2vh,1.45vw);color:#d9ccf5}
#arayuz .kontrol .kt{text-align:right;white-space:nowrap}
#arayuz .kontrol .kt kbd{margin-left:.25em}
#arayuz .kontrol .bol{grid-column:1/3;height:1px;background:linear-gradient(90deg,transparent,rgba(157,77,255,.5),transparent);margin:.4vh 0}
#arayuz .yapim{font-size:min(2vh,1.45vw);line-height:1.8;color:#d9ccf5;text-align:center}
#arayuz .yapim b{display:block;color:var(--tur2);letter-spacing:.3em;font-size:.82em;margin-top:1.4vh}
#arayuz .yapim span{display:block;font-size:1.25em;color:#fff}
#yukleniyor{position:fixed;inset:0;z-index:99999;background:#050110 url(assets/yukleniyor.jpg) center/cover no-repeat;transition:opacity .6s;display:flex;align-items:flex-end;justify-content:center;padding-bottom:6vh;font:700 min(3vh,22px) system-ui,sans-serif;letter-spacing:.3em;color:#d9c3ff;text-shadow:0 0 14px #9d4dff,0 2px 6px #000}
#yukleniyor.bitti{opacity:0;pointer-events:none}
/* ---------- HUD ---------- */
#arayuz .hud{position:absolute;inset:0;transition:opacity .4s}
/* pusula */
#arayuz .pusula{position:absolute;left:50%;top:1.8vh;transform:translateX(-50%);width:min(50vw,640px)}
#arayuz .pusula canvas{display:block;width:100%;height:auto}
#arayuz .pusula::before,#arayuz .pusula::after{content:"";position:absolute;left:8%;right:8%;height:1px;background:linear-gradient(90deg,transparent,rgba(190,170,255,.5),transparent)}
#arayuz .pusula::before{top:0}#arayuz .pusula::after{bottom:0}
/* mini harita */
#arayuz .mini{position:absolute;left:2vw;top:2.4vh;width:min(21vh,210px);height:min(21vh,210px);border-radius:50%;border:2px solid rgba(190,170,255,.55);box-shadow:0 0 0 4px rgba(10,5,24,.5),0 0 26px rgba(157,77,255,.35),0 6px 24px rgba(0,0,0,.5);overflow:hidden;background:rgba(8,4,20,.6)}
#arayuz .mini canvas{display:block;width:100%;height:100%}
/* sol alt: can + güç */
#arayuz .sol-alt{position:absolute;left:2.2vw;bottom:3.2vh;width:min(30vw,380px);display:flex;flex-direction:column;gap:1vh}
#arayuz .canK{display:flex;align-items:center;gap:.8vw}
#arayuz .damla{width:min(5vh,46px);height:min(5vh,46px);flex:none;filter:drop-shadow(0 0 8px rgba(157,77,255,.9))}
#arayuz .seg{flex:1;display:flex;gap:4px;height:min(2.8vh,24px)}
#arayuz .seg i{flex:1;transform:skewX(-18deg);background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.22);position:relative;overflow:hidden;transition:background .2s}
#arayuz .seg i.d{background:linear-gradient(180deg,#d98bff,#8a3dff);border-color:rgba(255,255,255,.55);box-shadow:0 0 10px rgba(157,77,255,.7)}
#arayuz .canK.az .seg i.d{background:linear-gradient(180deg,#ff9aa8,#ff3a6a);box-shadow:0 0 12px rgba(255,58,106,.8);animation:azy .6s ease-in-out infinite}
@keyframes azy{50%{filter:brightness(1.6)}}
#arayuz .gucK{position:relative;margin-left:calc(min(5vh,46px) + .8vw)}
#arayuz .gucK .gl{display:flex;justify-content:space-between;font-size:min(1.3vh,11px);letter-spacing:.3em;color:#a9e9e4;margin-bottom:.4vh}
#arayuz .gucK .gb{height:min(.9vh,8px);min-height:5px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);transform:skewX(-18deg);overflow:hidden}
#arayuz .gucK .gb i{display:block;height:100%;width:0;background:linear-gradient(90deg,#0aa7b8,#2ef2e0 70%,#b6fff7);transition:width .25s}
#arayuz .gucK .qy{opacity:0;color:var(--tur2);text-shadow:0 0 12px var(--tur)}
#arayuz .gucK.dolu .gb{box-shadow:0 0 20px rgba(46,242,224,.95);animation:yan .7s ease-in-out infinite}
#arayuz .gucK.dolu .qy{opacity:1;animation:yan .7s ease-in-out infinite}
@keyframes yan{0%,100%{filter:brightness(1)}50%{filter:brightness(1.8)}}
/* sağ üst */
#arayuz .gorev{position:absolute;right:2vw;top:2.4vh;width:min(26vw,320px);padding:1.2vh 1.1vw 1.3vh;background:linear-gradient(200deg,rgba(24,10,52,.72),rgba(8,4,22,.6));
 border-right:3px solid var(--tur);border-top:1px solid rgba(190,170,255,.35);clip-path:polygon(0 0,100% 0,100% 100%,6% 100%,0 88%)}
#arayuz .gorev .gb{font-size:min(1.25vh,10px);letter-spacing:.34em;color:var(--tur)}
#arayuz .gorev .ga{font-size:min(2.2vh,18px);margin:.3vh 0;letter-spacing:.04em}
#arayuz .gorev .gc{font-size:min(1.6vh,13px);font-weight:600;color:#cbbfe8;line-height:1.3}
#arayuz .gorev .gi{margin-top:.9vh;height:.5vh;min-height:4px;background:rgba(255,255,255,.14);overflow:hidden}
#arayuz .gorev .gi i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--mor),var(--tur));transition:width .4s}
#arayuz .gorev .gs{text-align:right;font-size:min(1.5vh,12px);margin-top:.3vh;color:var(--tur2)}
#arayuz .sayac{position:absolute;right:2vw;display:flex;gap:1.2vw;font-size:min(2.2vh,18px);letter-spacing:.1em}
#arayuz .sayac div{display:flex;align-items:center;gap:.5vw;padding:.4vh .9vw;background:var(--cam);border-bottom:2px solid rgba(255,200,90,.6)}
#arayuz .sayac div+div{border-color:rgba(46,242,224,.6)}
#arayuz .sayac b{display:inline-block;width:.9em;height:.9em;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#ffe08a 40%,#ff9d2e);box-shadow:0 0 12px #ffb83d}
#arayuz .sayac.sek div:first-child{animation:sek .4s}
@keyframes sek{40%{transform:scale(1.25)}}
/* nişan */
#arayuz .kilit{position:absolute;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;display:none;pointer-events:none;animation:kilitDon 2.4s linear infinite;
 --k:#ff6a3a;background:linear-gradient(var(--k),var(--k)) 0 0/12px 2px no-repeat,linear-gradient(var(--k),var(--k)) 0 0/2px 12px no-repeat,linear-gradient(var(--k),var(--k)) 100% 0/12px 2px no-repeat,linear-gradient(var(--k),var(--k)) 100% 0/2px 12px no-repeat,linear-gradient(var(--k),var(--k)) 0 100%/12px 2px no-repeat,linear-gradient(var(--k),var(--k)) 0 100%/2px 12px no-repeat,linear-gradient(var(--k),var(--k)) 100% 100%/12px 2px no-repeat,linear-gradient(var(--k),var(--k)) 100% 100%/2px 12px no-repeat;filter:drop-shadow(0 0 4px #ff3a1a)}
@keyframes kilitDon{to{rotate:360deg}}
#arayuz .agn{position:absolute;left:0;top:0;width:28px;height:28px;margin:-14px 0 0 -14px;display:none;pointer-events:none;border-radius:50%;border:1.5px solid var(--tur);box-shadow:0 0 10px var(--tur),0 0 4px var(--tur) inset;
 background:radial-gradient(circle,#fff 0 2px,transparent 2.5px),repeating-conic-gradient(from 0deg,transparent 0 40deg,rgba(80,255,240,.35) 40deg 45deg)}
#arayuz .vurus{position:absolute;left:50%;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;opacity:0;transition:opacity .25s;pointer-events:none}
#arayuz .vurus.ac{opacity:1;transition:none}
#arayuz .vurus.bit::before,#arayuz .vurus.bit::after{background:#ff5a3a}
#arayuz .vurus::before,#arayuz .vurus::after{content:"";position:absolute;left:50%;top:50%;width:30px;height:3px;margin:-1.5px -15px;background:#fff;box-shadow:0 0 6px #000;transform:rotate(45deg)}
#arayuz .vurus::after{transform:rotate(-45deg)}
/* hedef oku + hasar yönü */
#arayuz .ok{position:absolute;left:0;top:0;width:0;height:0;transition:opacity .2s;will-change:transform}
#arayuz .ok svg{position:absolute;left:-22px;top:-22px;width:44px;height:44px;filter:drop-shadow(0 0 8px var(--tur));animation:okn 1s ease-in-out infinite}
#arayuz .ok em{position:absolute;left:-40px;width:80px;top:22px;text-align:center;font-style:normal;font-size:14px;color:var(--tur2);text-shadow:0 0 6px #000,0 0 10px var(--tur)}
@keyframes okn{50%{transform:scale(1.18)}}
#arayuz .hy{position:absolute;left:50%;top:50%;width:0;height:0}
#arayuz .hy svg{position:absolute;left:-30px;top:-46px;width:60px;height:92px;opacity:.95;filter:drop-shadow(0 0 10px #ff2a55);transform-origin:50% 100%}
/* mesajlar */
#arayuz .mesajlar{position:absolute;left:50%;top:11vh;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:.8vh}
#arayuz .mesaj{padding:.9vh 1.6vw;font-size:min(2vh,17px);letter-spacing:.06em;background:linear-gradient(90deg,transparent,rgba(20,8,46,.82) 14%,rgba(20,8,46,.82) 86%,transparent);
 border-top:1px solid rgba(190,170,255,.35);border-bottom:1px solid rgba(190,170,255,.35);animation:mgir .4s cubic-bezier(.2,.9,.25,1)}
#arayuz .mesaj.cik{animation:mcik .4s ease-in forwards}
@keyframes mgir{from{opacity:0;transform:translateY(-14px)}}
@keyframes mcik{to{opacity:0;transform:translateY(-10px)}}
/* ödül yazıları */
#arayuz .odullar{position:absolute;left:50%;top:60vh;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:.4vh;pointer-events:none}
#arayuz .odul{font-size:min(3.4vh,28px);font-weight:900;letter-spacing:.3em;color:#fff;text-shadow:0 0 18px var(--tur),0 2px 4px #000;animation:odul 1.5s ease-out forwards;white-space:nowrap}
#arayuz .odul::before,#arayuz .odul::after{content:"";display:inline-block;width:3vw;height:2px;background:var(--tur);vertical-align:middle;margin:0 1vw;box-shadow:0 0 8px var(--tur)}
@keyframes odul{0%{opacity:0;transform:scale(1.5);letter-spacing:.6em}14%{opacity:1;transform:scale(1);letter-spacing:.3em}75%{opacity:1}100%{opacity:0;transform:translateY(-2.5vh)}}
/* kombo */
#arayuz .kombo{position:absolute;right:5vw;top:38vh;text-align:right;opacity:0;transition:opacity .35s;pointer-events:none}
#arayuz .kombo.ac{opacity:1}
#arayuz .kombo .kn{font-size:min(11vh,9vw);font-weight:1000;font-style:italic;line-height:1;text-shadow:0 0 28px var(--mor),0 4px 0 rgba(0,0,0,.5);background:linear-gradient(180deg,#fff,#c9a6ff 55%,#2ef2e0);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 12px rgba(157,77,255,.8))}
#arayuz .kombo .kn small{font-size:.38em;margin-right:.1em;color:var(--tur2);-webkit-text-fill-color:var(--tur2)}
#arayuz .kombo .kn.pop{animation:kpop .3s cubic-bezier(.2,1.6,.4,1)}
@keyframes kpop{from{transform:scale(1.55)}}
#arayuz .kombo .kt{font-size:min(3.4vh,28px);letter-spacing:.3em;font-weight:1000;color:#ffe08a;text-shadow:0 0 16px #ff9d2e;min-height:1.2em}
#arayuz .kombo .kc{margin-top:.6vh;height:4px;width:100%;background:rgba(255,255,255,.15);transform:skewX(-18deg)}
#arayuz .kombo .kc i{display:block;height:100%;width:100%;background:linear-gradient(90deg,var(--mor),var(--tur))}
/* görev bantları */
#arayuz .yeni{position:absolute;left:0;right:0;bottom:19vh;display:flex;flex-direction:column;align-items:center;pointer-events:none;opacity:0}
#arayuz .yeni small{font-size:min(1.7vh,14px);letter-spacing:.6em;color:var(--tur2);text-shadow:0 0 10px var(--tur)}
#arayuz .yeni h2{margin:.4vh 0 0;font-size:min(4.2vh,34px);letter-spacing:.14em;padding:.7vh 6vw;background:linear-gradient(90deg,transparent,rgba(24,10,52,.85) 18%,rgba(24,10,52,.85) 82%,transparent);border-top:1px solid rgba(46,242,224,.6);border-bottom:1px solid rgba(46,242,224,.6)}
#arayuz .yeni.goster{animation:yeni 3.4s cubic-bezier(.2,.9,.25,1) forwards}
@keyframes yeni{0%{opacity:0;transform:translateX(-12vw)}10%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0;transform:translateX(8vw)}}
#arayuz .tamam{position:absolute;left:0;right:0;top:30vh;height:32vh;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;opacity:0;
 background:linear-gradient(180deg,transparent,rgba(10,4,26,.88) 22%,rgba(10,4,26,.88) 78%,transparent);border-top:2px solid rgba(46,242,224,.0);overflow:hidden}
#arayuz .tamam::before,#arayuz .tamam::after{content:"";position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--tur),var(--mor),transparent);box-shadow:0 0 16px var(--tur)}
#arayuz .tamam::before{top:12%}#arayuz .tamam::after{bottom:12%}
#arayuz .tamam h1{margin:0;font-size:min(8.5vh,7vw);font-weight:1000;letter-spacing:.18em;background:linear-gradient(100deg,#c9a6ff,#2ef2e0 50%,#ffe08a);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 20px rgba(157,77,255,.9))}
#arayuz .tamam .ta{font-size:min(2.4vh,20px);letter-spacing:.3em;color:#dcd0f7;margin-top:.8vh}
#arayuz .tamam .tp{font-size:min(4.6vh,38px);color:#ffe08a;text-shadow:0 0 18px #ff9d2e;margin-top:1.2vh;letter-spacing:.1em;font-variant-numeric:tabular-nums}
#arayuz .tamam .tp small{font-size:.5em;color:#bba8e6;letter-spacing:.3em;margin-left:1.4vw;text-shadow:none}
#arayuz .tamam.goster{animation:tamam 4s cubic-bezier(.2,.9,.25,1) forwards}
@keyframes tamam{0%{opacity:0;transform:scaleY(.1)}8%{opacity:1;transform:scaleY(1)}86%{opacity:1}100%{opacity:0;transform:scaleY(.6)}}
/* eğitim ipucu */
#arayuz .ipucuK{position:absolute;left:50%;bottom:15vh;transform:translateX(-50%);min-width:min(40vw,520px);padding:1.4vh 2vw 1.6vh;text-align:center;
 background:linear-gradient(180deg,rgba(26,10,56,.88),rgba(8,4,22,.88));border:1px solid rgba(46,242,224,.5);border-top:3px solid var(--tur);box-shadow:0 0 30px rgba(46,242,224,.2),0 10px 30px rgba(0,0,0,.5);
 clip-path:polygon(3% 0,100% 0,100% 80%,97% 100%,0 100%,0 20%);animation:ipGir .5s cubic-bezier(.2,.9,.25,1)}
@keyframes ipGir{from{opacity:0;transform:translate(-50%,3vh)}}
#arayuz .ipucuK .ia{font-size:min(1.4vh,11px);letter-spacing:.4em;color:var(--tur)}
#arayuz .ipucuK .im{font-size:min(2.8vh,23px);margin:.7vh 0 1vh;letter-spacing:.04em}
#arayuz .ipucuK .it{display:flex;justify-content:center;gap:.8vw;font-size:min(2.6vh,22px)}
#arayuz .ipucuK .it span{font-size:.55em;align-self:center;color:#bba8e6}
#arayuz .ipucuK .id{display:flex;justify-content:center;gap:.5vw;margin-top:1.2vh}
#arayuz .ipucuK .id i{width:2.6vw;max-width:26px;height:4px;background:rgba(255,255,255,.2)}
#arayuz .ipucuK .id i.b{background:var(--tur);box-shadow:0 0 8px var(--tur)}
#arayuz .ipucuK .ik{position:absolute;right:1.2vw;top:1vh;font-size:min(1.8vh,15px);color:var(--tur2)}
#arayuz .ipucuK.tamam{border-top-color:#6dff9a;box-shadow:0 0 40px rgba(109,255,154,.5)}
#arayuz .ipucuK.tamam .im::after{content:" ✔";color:#6dff9a}
#arayuz .uc{position:absolute;font-size:min(3.6vh,30px);font-weight:1000;color:#ffe08a;text-shadow:0 0 12px #ff9d2e,0 2px 4px #000;pointer-events:none;animation:uc 1.3s ease-out forwards;transform:translate(-50%,-50%)}
@keyframes uc{0%{opacity:0;transform:translate(-50%,-30%) scale(.5)}15%{opacity:1;transform:translate(-50%,-80%) scale(1.3)}100%{opacity:0;transform:translate(-50%,-260%) scale(1)}}
#arayuz .toparla{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(30,10,70,.55),rgba(5,2,14,.92));
 font-size:min(6vh,5vw);letter-spacing:.14em;color:#d9c3ff;text-shadow:0 0 24px var(--mor);opacity:0;transition:opacity .5s;pointer-events:none}
#arayuz .toparla.ac{opacity:1}
#arayuz .devrozet{position:absolute;left:50%;bottom:3vh;transform:translateX(-50%);font-size:min(2.6vh,22px);letter-spacing:.3em;color:var(--tur2);text-shadow:0 0 16px var(--tur);animation:yan .6s infinite}

/* ---------- HİKÂYE ---------- */
#arayuz .nhalka{position:absolute;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:1.5px solid #fff;opacity:.6;display:none;pointer-events:none;box-shadow:0 0 3px rgba(0,0,0,.6)}
#arayuz .hcan{position:absolute;left:0;top:0;width:52px;height:5px;display:none;pointer-events:none;background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.7);border-radius:3px;overflow:hidden}
#arayuz .hcan i{display:block;height:100%;background:linear-gradient(90deg,#ff7a2a,#ffc24a)}
#arayuz .kart{position:fixed;inset:0;z-index:50;background:#000;overflow:hidden;opacity:0;transition:opacity .45s;pointer-events:none}
#arayuz .kart.ac{opacity:1}#arayuz .kart.cik{opacity:0}
#arayuz .kimg{position:absolute;inset:-4%;background:#10061f center/cover no-repeat;animation:kartkb 4.2s ease-out both}
@keyframes kartkb{from{transform:scale(1.02) translate(1.2%,.8%)}to{transform:scale(1.14) translate(-1.2%,-.8%)}}
#arayuz .kvin{position:absolute;inset:0;background:linear-gradient(0deg,rgba(4,1,12,.94) 0%,rgba(4,1,12,.75) 24%,rgba(4,1,12,0) 52%),radial-gradient(ellipse at center,transparent 55%,rgba(2,0,8,.7))}
#arayuz .kart::before,#arayuz .kart::after{content:"";position:absolute;left:0;right:0;height:7vh;background:#000;z-index:2}
#arayuz .kart::before{top:0}#arayuz .kart::after{bottom:0}
#arayuz .kalt{position:absolute;left:7vw;right:7vw;bottom:10vh;z-index:3;animation:yukari .8s .2s both}
#arayuz .kalt small{display:block;font-size:min(1.6vh,12px);letter-spacing:.5em;color:var(--tur)}
#arayuz .kalt h2{margin:.5vh 0 1vh;font-size:min(5.6vh,4.4vw);letter-spacing:.12em;text-shadow:0 0 22px var(--mor),0 3px 8px #000}
#arayuz .kalt p{margin:0;max-width:min(62vw,900px);font-size:min(2.7vh,2vw);line-height:1.45;font-weight:600;color:#efe6ff;text-shadow:0 2px 8px #000}
#arayuz .kalt em{display:block;margin-top:1.6vh;font-style:normal;font-size:min(1.5vh,12px);letter-spacing:.3em;color:#a99bd4;text-transform:uppercase;animation:nabiz 1.4s infinite}
@keyframes nabiz{50%{opacity:.35}}
#arayuz .diy{position:absolute;left:2.2vw;bottom:19vh;max-width:min(34vw,440px);display:flex;align-items:flex-end;gap:.8vw;pointer-events:none}
#arayuz .diy img{width:min(11vh,96px);height:min(11vh,96px);object-fit:cover;border-radius:50%;border:2px solid var(--tur);background:rgba(10,5,24,.8);box-shadow:0 0 16px rgba(46,242,224,.45);flex:none}
#arayuz .diy.pas img{border-color:#ff9d2e;box-shadow:0 0 16px rgba(255,157,46,.5)}
#arayuz .diy .db{position:relative;padding:1.1vh 1vw;background:rgba(14,7,34,.86);border:1px solid rgba(157,77,255,.6);border-radius:16px 16px 16px 3px;box-shadow:0 4px 18px rgba(0,0,0,.5)}
#arayuz .diy .db b{display:block;font-size:min(1.4vh,11px);letter-spacing:.3em;color:var(--tur)}
#arayuz .diy.pas .db b{color:#ffb454}
#arayuz .diy .db span{display:block;margin-top:.3vh;font-size:min(1.9vh,15px);line-height:1.35;font-weight:600;color:#fff}
#arayuz .diy.pop{animation:diyg .35s cubic-bezier(.2,1.4,.4,1)}
@keyframes diyg{from{opacity:0;transform:translateY(14px) scale(.92)}to{opacity:1;transform:none}}
#arayuz .bsn{position:fixed;right:2vw;top:2.4vh;z-index:40;display:flex;align-items:center;gap:1vw;padding:1vh 1.4vw 1vh 1vh;background:linear-gradient(200deg,rgba(60,26,120,.95),rgba(12,5,30,.95));border:1px solid var(--tur);border-radius:40px 8px 8px 40px;box-shadow:0 0 28px rgba(46,242,224,.5);transform:translateX(130%);pointer-events:none}
#arayuz .bsn.ac{animation:bsg 4s ease-in-out both}
@keyframes bsg{0%{transform:translateX(130%)}10%,86%{transform:none}100%{transform:translateX(130%)}}
#arayuz .bsn img{width:min(8vh,64px);height:min(8vh,64px)}
#arayuz .bsn .bs-ust{display:block;font-size:min(1.3vh,10px);letter-spacing:.3em;color:var(--tur)}
#arayuz .bsn b{display:block;font-size:min(2.6vh,20px);letter-spacing:.06em}
#arayuz .gik{position:absolute;right:.8vw;top:1vh;width:min(6vh,52px);height:min(6vh,52px);filter:drop-shadow(0 0 8px rgba(46,242,224,.5))}
#arayuz .gorev .ga{padding-right:min(6vh,52px)}
/* dokunmatik: duraklat (58px) ve DEV düğmesi sağ üstte; kartlar onların soluna */
@media (pointer:coarse){#arayuz .gorev,#arayuz .sayac,#arayuz .bsn{right:calc(max(12px,env(safe-area-inset-right)) + 136px)}#arayuz .gorev{width:min(30vw,300px)}}
#arayuz .bslist{display:grid;grid-template-columns:1fr 1fr;gap:1.2vh .8vw}
#arayuz .bsk{display:flex;gap:.8vw;align-items:center;padding:.8vh .6vw;background:rgba(40,20,90,.35);border:1px solid rgba(157,77,255,.4);border-radius:10px}
#arayuz .bsk img{width:min(8.5vh,70px);height:min(8.5vh,70px);flex:none}
#arayuz .bsk b{display:block;font-size:min(1.9vh,15px);letter-spacing:.04em}
#arayuz .bsk span{display:block;font-size:min(1.45vh,12px);font-weight:600;color:#cbbfe8;line-height:1.3;margin-top:.2vh}
#arayuz .bsk.kil{background:rgba(20,16,30,.4);border-color:rgba(120,120,140,.3)}
#arayuz .bsk.kil img{filter:grayscale(1) brightness(.55);opacity:.7}
#arayuz .bsk.kil b{color:#8c88a0}
#arayuz .bsk.kaz{border-color:var(--tur);box-shadow:0 0 14px rgba(46,242,224,.25)}
`;

const KONTROLLER = [
  ['<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>', 'Yürü'],
  ['<kbd class="tur">Fare</kbd>', 'Kamerayı döndür'],
  ['bol'],
  ['<kbd class="tur">Sol tık</kbd>', 'En yakın hedefe saldır · KOMBO yap'],
  ['<kbd class="tur">Sağ tık</kbd> basılı', 'Bakış yönüne ağ at ve salın · bırak: fırla'],
  ['<kbd class="tur">Sağ tık</kbd> + <kbd>Space</kbd>', 'Sapan'],
  ['<kbd>E</kbd>', 'Çatıya / hedefe çekil'],
  ['<kbd>F</kbd>', 'Dokunaç kamçısı'],
  ['<kbd>Fare tekerleği</kbd>', 'Hedef değiştir'],
  ['<kbd>Space</kbd>', 'Zıpla (havada 2. zıplama)'],
  ['<kbd>Shift</kbd>', 'Koş · duvara tırman · havada süzül (süzülürken A/D: dön)'],
  ['<kbd>C</kbd> / <kbd>Ctrl</kbd>', 'Dalış · klavye kilidi yoksa C kullan'],
  ['<kbd>Q</kbd>', 'DEV ZİFİR (güç dolunca)'],
  ['bol'],
  ['<kbd>Esc</kbd>', 'Duraklat'],
  ['<kbd>M</kbd>', 'Sesi aç / kapat'],
];
const DAMLA = `<svg class="damla" viewBox="0 0 48 48"><defs><clipPath id="dk"><rect id="dkr" x="0" y="0" width="48" height="48"/></clipPath>
<linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6ad8"/><stop offset="1" stop-color="#7c2dff"/></linearGradient></defs>
<path d="M24 3C24 3 8 20 8 31a16 16 0 0 0 32 0C40 20 24 3 24 3Z" fill="#150a30" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>
<path clip-path="url(#dk)" d="M24 3C24 3 8 20 8 31a16 16 0 0 0 32 0C40 20 24 3 24 3Z" fill="url(#dg)"/><ellipse cx="18" cy="28" rx="3" ry="5" fill="#fff" fill-opacity=".5" transform="rotate(20 18 28)"/></svg>`;
const OK = `<svg viewBox="0 0 52 52"><path d="M26 4 46 44 26 35 6 44Z" fill="#2ef2e0" fill-opacity=".85" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>`;
const HASAR_OK = `<svg viewBox="0 0 60 92"><defs><linearGradient id="hg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff2a55" stop-opacity="0"/><stop offset="1" stop-color="#ff2a55" stop-opacity=".95"/></linearGradient></defs><path d="M30 0 58 70Q30 58 2 70Z" fill="url(#hg)"/></svg>`;

const VARSAYILAN = { hassasiyet: 1, yTers: false, sesAna: 0.8, sesMuzik: 0.8, sesEfekt: 1, fov: 70, saat: 'alacakaranlik', parlaklik: 1 };
let G_, kok, e = {}, vurma = 0, vurus = 0, kilitliydi = false, kuyruk = [], mesajVar = false, toparliyor = false, sonKure = -1, sonPuan = -1;
let mx = 0, my = 0, pxk = 0, pyk = 0;
let secili = 0, panel = null, psecili = 0, menuTur = '', menuOge = [], satirlar = [], suruk = null;
const kombo = { sayi: 0, t: 0 };
const hasarlar = [];
const tamam = { t: -1, odul: 0, puan: 0 };
let tamamBitis = 0, ipucuAktif = false, miniT = 0, sonOdulAd = '', sonOdulT = 0;

function el(ad, sinif, html, ebeveyn) {
  const x = document.createElement(ad); if (sinif) x.className = sinif; if (html != null) x.innerHTML = html;
  (ebeveyn || kok).appendChild(x); return x;
}

// ---------- ayar ----------
function ayarYukle() {
  let k = {};
  try { k = JSON.parse(localStorage.getItem('zifir_ayar') || '{}') || {}; } catch (x) { /* yok say */ }
  const a = { ...VARSAYILAN };
  for (const n in VARSAYILAN) if (typeof k[n] === typeof VARSAYILAN[n] && (typeof k[n] !== 'number' || Number.isFinite(k[n]))) a[n] = k[n];
  return a;
}
function ayarUygula() {
  const a = G_.ayar;
  G_.ses?.seviye?.(a.sesAna, a.sesMuzik, a.sesEfekt);
  G_.olay.emit('ayar', a);
}
function ayarKaydet() {
  const a = G_.ayar, o = {}; for (const n in VARSAYILAN) o[n] = a[n];
  try { localStorage.setItem('zifir_ayar', JSON.stringify(o)); } catch (x) { /* yok say */ }
  ayarUygula();
}

// ---------- arayüz sesi ----------
let bctx = null;
function bip(f = 660, s = 0.06) {
  if (G_.ses?.arayuzSes) return;
  try {
    bctx ||= new (window.AudioContext || window.webkitAudioContext)();
    if (bctx.state === 'suspended') bctx.resume();
    const o = bctx.createOscillator(), g = bctx.createGain(), t = bctx.currentTime;
    o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + s);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06 * (G_.ayar.sesEfekt * G_.ayar.sesAna), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + s + 0.05);
    o.connect(g); g.connect(bctx.destination); o.start(t); o.stop(t + s + 0.08);
  } catch (x) { /* ses yoksa geç */ }
}
function secSes(onay) { G_.ses?.cal?.('arayuz_sec'); bip(onay ? 880 : 620); }

// ---------- menü ----------
const OGELER = {
  ana: [['OYNA', 'oyna'], ['AYARLAR', 'ayar'], ['KONTROLLER', 'kontrol'], ['BAŞARIMLAR', 'basarim'], ['YAPIMCILAR', 'yapim'], ['ÇIKIŞ', 'cikis']],
  dur: [['DEVAM', 'devam'], ['AYARLAR', 'ayar'], ['KONTROLLER', 'kontrol'], ['ANA MENÜ', 'ana'], ['ÇIKIŞ', 'cikis']],
};
function menuKur(tur) {
  menuTur = tur; panel = null; secili = 0;
  e.menu.classList.toggle('dur', tur === 'dur');
  e.liste.querySelectorAll('.oge').forEach(x => x.remove());
  menuOge = OGELER[tur].map(([ad, k], i) => {
    const b = el('button', 'oge', ad, e.liste); b.style.animationDelay = (0.45 + i * 0.09) + 's'; b.dataset.k = k;
    b.onmouseenter = () => { if (secili !== i || panel) { panel = null; panelCiz(); sec(i); } };
    b.onclick = () => etkinles(i);
    return b;
  });
  e.baslikM.classList.toggle('gizli', tur !== 'dur'); e.logo.classList.toggle('gizli', tur === 'dur');
  panelCiz(); sec(0, true);
}
function sec(i, sessiz) {
  const n = menuOge.length; i = (i + n) % n;
  if (i !== secili && !sessiz) secSes();
  secili = i;
  menuOge.forEach((b, k) => b.classList.toggle('sec', k === i && !panel));
  const b = menuOge[i];
  e.cubuk.style.height = b.offsetHeight + 'px'; e.cubuk.style.transform = `translateY(${b.offsetTop}px)`;
  e.cubuk.style.opacity = panel ? 0.35 : 1;
}
function etkinles(i) {
  const k = menuOge[i].dataset.k; secSes(true);
  if (k === 'oyna') oyunBaslat();
  else if (k === 'devam') devam();
  else if (k === 'cikis') oyundanCik();
  else if (k === 'ana') { G_.durum = 'menu'; menuKur('ana'); }
  else { panel = k; psecili = 0; panelCiz(); sec(i, true); }
}
function geri() {
  if (panel) { panel = null; panelCiz(); sec(secili, true); secSes(); return true; }
  return false;
}

const _nv = { v: null };
function ekranda(p) {
  const k = G_.kamera; if (!k || !p) return null;
  const v = (_nv.v ||= new G_.THREE.Vector3()).copy(p).project(k);
  if (!(v.z < 1) || Math.abs(v.x) > 0.96 || Math.abs(v.y) > 0.96) return null;
  return [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight, v.z];
}
let kilitP = null;
const halkaP = { x: 0, y: 0, ilk: true };
function nisanCiz(oyuncu, gdt = 0.016) {
  const aktif = oyuncu ? (oyuncu.nisanAktif ?? oyuncu.nisanVar) : false;
  const gos = !!aktif && G_.durum === 'oyun';
  let a = null;
  if (gos && oyuncu?.nisanHedef?.konum) { _nh = (_nh || new G_.THREE.Vector3()).copy(oyuncu.nisanHedef.konum); _nh.y += 1; a = ekranda(_nh); }
  const cx = innerWidth / 2, cy = innerHeight / 2;
  // halka: ortadan kilide kayar (≈0.12 sn)
  const hx = a ? a[0] : cx, hy = a ? a[1] : cy;
  if (halkaP.ilk) { halkaP.x = cx; halkaP.y = cy; halkaP.ilk = false; }
  const k = 1 - Math.exp(-gdt / 0.04);
  halkaP.x += (hx - halkaP.x) * k; halkaP.y += (hy - halkaP.y) * k;
  const yakin = a ? Math.hypot(hx - halkaP.x, hy - halkaP.y) < 6 : false;
  e.halka.style.display = gos ? 'block' : 'none';
  e.halka.style.transform = `translate(${halkaP.x}px,${halkaP.y}px)`;
  e.halka.style.opacity = a ? (yakin ? 0 : 0.6) : 0.6;
  const ka = a && yakin ? a : null;
  e.kilit.style.display = ka ? 'block' : 'none';
  if (ka) { e.kilit.style.left = ka[0] + 'px'; e.kilit.style.top = ka[1] + 'px'; kilitP = [ka[0], ka[1]]; }
  // can barı
  const hd = gos ? oyuncu.nisanHedef : null;
  const dl = hd && hd.canMax > 0 && hd.can != null && ka;
  e.hcan.style.display = dl ? 'block' : 'none';
  if (dl) {
    e.hcan.style.transform = `translate(${ka[0] - 26}px,${ka[1] - 40}px)`;
    e.hcan.firstChild.style.width = Math.max(0, Math.min(1, hd.can / hd.canMax)) * 100 + '%';
  }
  let b = null;
  if (gos && !a && !(G_.girdi?.basili?.('Fare2')) && oyuncu?.nisanNokta && !oyuncu.nisanHedef) b = ekranda(oyuncu.nisanNokta);
  e.agn.style.display = b ? 'block' : 'none';
  if (b) {
    const d = Math.max(1, G_.kamera.position.distanceTo(oyuncu.nisanNokta)), sc = Math.max(0.45, Math.min(1.3, 30 / d));
    e.agn.style.left = b[0] + 'px'; e.agn.style.top = b[1] + 'px'; e.agn.style.transform = 'scale(' + sc.toFixed(2) + ')';
  }
  const vp = ka || b || null;
  e.vurus.style.left = vp ? vp[0] + 'px' : '50%'; e.vurus.style.top = vp ? vp[1] + 'px' : '50%';
}
let _nh = null;

function satirTanim() {
  const a = G_.ayar;
  const sl = (ad, k, min, max, adim, f) => ({ t: 'sl', ad, k, min, max, adim, f });
  return [
    sl('Fare hassasiyeti', 'hassasiyet', 0.3, 2.5, 0.05, v => v.toFixed(2) + 'x'),
    { t: 'tg', ad: 'Y eksenini ters çevir', al: () => a.yTers ? 'AÇIK' : 'KAPALI', degis: () => { a.yTers = !a.yTers; } },
    sl('Ana ses', 'sesAna', 0, 1, 0.05, v => Math.round(v * 100) + '%'),
    sl('Müzik', 'sesMuzik', 0, 1, 0.05, v => Math.round(v * 100) + '%'),
    sl('Efekt sesi', 'sesEfekt', 0, 1, 0.05, v => Math.round(v * 100) + '%'),
    { t: 'tg', ad: 'Kalite', al: () => (G_.kaliteAd?.[G_.kalite] || 'Orta').toUpperCase(), degis: y => {
      const s = ['dusuk', 'orta', 'yuksek']; G_.kaliteAyarla?.(s[(s.indexOf(G_.kalite) + (y || 1) + 3) % 3]); } },
    { t: 'tg', ad: 'Saat', al: () => ({ gunduz: 'GÜNDÜZ', alacakaranlik: 'ALACAKARANLIK', gece: 'GECE' })[a.saat] || 'ALACAKARANLIK', degis: y => {
      const s = ['gunduz', 'alacakaranlik', 'gece']; a.saat = s[(Math.max(0, s.indexOf(a.saat)) + (y || 1) + 3) % 3]; G_.saatAyarla?.(a.saat); } },
    sl('Parlaklık', 'parlaklik', 0.7, 1.6, 0.05, v => Math.round(v * 100) + '%'),
    sl('Görüş alanı (FOV)', 'fov', 60, 100, 1, v => Math.round(v) + '°'),
    { t: 'dg', ad: 'EĞİTİMİ TEKRARLA', islem: () => { G_.gorev?.egitimiTekrarla?.(); if (G_.durum === 'duraklat') devam(); else oyunBaslat(); } },
    { t: 'dg', ad: 'GERİ', islem: () => geri() },
  ];
}
function panelCiz() {
  const p = e.panel;
  p.classList.toggle('gizli', !panel);
  e.ipucuM.classList.toggle('gizli', false);
  if (!panel) { satirlar = []; return; }
  p.style.animation = 'none'; void p.offsetWidth; p.style.animation = '';
  if (panel === 'ayar') {
    satirlar = satirTanim();
    p.innerHTML = '<h3>AYARLAR</h3>';
    satirlar.forEach((s, i) => {
      const r = el('div', 'sat ' + s.t, '', p); s.r = r;
      r.innerHTML = s.t === 'sl' ? `<span>${s.ad}</span><div class="sl"><i></i></div><span class="deg"></span>`
        : s.t === 'dg' ? `<span>${s.ad}</span>` : `<span>${s.ad}</span><span class="tek"></span>`;
      r.onmouseenter = () => { if (psecili !== i) { psecili = i; satirIsaret(); secSes(); } };
      if (s.t === 'sl') {
        const sl = r.querySelector('.sl');
        sl.onpointerdown = ev => { suruk = { s, sl }; sl.setPointerCapture?.(ev.pointerId); surukle(ev); ev.preventDefault(); };
        sl.onpointermove = ev => { if (suruk?.sl === sl) surukle(ev); };
        sl.onpointerup = () => { if (suruk) { suruk = null; ayarKaydet(); } };
      } else r.onclick = () => satirDegistir(i, 1);
    });
    satirGuncelle(); satirIsaret();
  } else if (panel === 'kontrol') {
    p.innerHTML = '<h3>KONTROLLER</h3><div class="kontrol">' + KONTROLLER.map(k => k[0] === 'bol' ? '<div class="bol"></div>' : `<div class="kt">${k[0]}</div><div>${k[1]}</div>`).join('') + '</div>';
  } else if (panel === 'basarim') {
    const k = kayitAl(), n = BASARIM.filter(b => k.basarim[b.id]).length;
    p.innerHTML = `<h3>BAŞARIMLAR · ${n}/${BASARIM.length}</h3><div class="bslist">` + BASARIM.map(b => {
      const kz = !!k.basarim[b.id];
      return `<div class="bsk ${kz ? 'kaz' : 'kil'}"><img src="assets/ui/rozet_${b.id}.png" alt="" onerror="this.style.visibility='hidden'"><div><b>${b.ad}</b><span>${kz ? 'Kazanıldı' : b.ac}</span></div></div>`;
    }).join('') + '</div>';
  } else if (panel === 'yapim') {
    p.innerHTML = `<h3>YAPIMCILAR</h3><div class="yapim"><span>ZİFİR</span>Gece Şehrinin Kara Kahramanı
     <b>OYUN FİKRİ VE TASARIM</b><span>Sen — oyuncu ve yönetmen</span>
     <b>KOD · GÖRSEL · SES</b><span>Claude (Anthropic) ile birlikte yazıldı</span>
     <b>3B MOTOR</b><span>Three.js</span>
     <b>ÖZEL TEŞEKKÜR</b><span>Gece şehrinin tüm kediler ve Işık Küreleri</span></div>`;
  }
}
function surukle(ev) {
  if (!suruk) return;
  const { s, sl } = suruk, r = sl.getBoundingClientRect();
  const f = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
  const v = Math.round((s.min + f * (s.max - s.min)) / s.adim) * s.adim;
  G_.ayar[s.k] = Math.max(s.min, Math.min(s.max, +v.toFixed(3))); satirGuncelle(); ayarUygulaHafif();
}
let uygT = 0;
function ayarUygulaHafif() { const n = performance.now(); if (n - uygT > 80) { uygT = n; G_.ses?.seviye?.(G_.ayar.sesAna, G_.ayar.sesMuzik, G_.ayar.sesEfekt); } }
function satirGuncelle() {
  for (const s of satirlar) {
    if (s.t === 'sl') {
      const v = G_.ayar[s.k];
      s.r.querySelector('i').style.width = ((v - s.min) / (s.max - s.min)) * 100 + '%';
      s.r.querySelector('.deg').textContent = s.f(v);
    } else if (s.t === 'tg') s.r.querySelector('.tek').textContent = s.al();
  }
}
function satirIsaret() { satirlar.forEach((s, i) => s.r.classList.toggle('sec', i === psecili)); }
function satirDegistir(i, y) {
  const s = satirlar[i]; if (!s) return;
  if (s.t === 'sl') { G_.ayar[s.k] = Math.max(s.min, Math.min(s.max, +(G_.ayar[s.k] + y * s.adim * (s.max - s.min > 50 ? 2 : 1)).toFixed(3))); }
  else if (s.t === 'tg') s.degis(y);
  else if (s.t === 'dg') { secSes(true); s.islem(); return; }
  satirGuncelle(); ayarKaydet(); secSes(true);
}

function tusMenu(ev) {
  const d = G_.durum;
  if (d !== 'menu' && d !== 'duraklat') return false;
  const k = ev.code;
  if (k === 'Escape') { if (geri()) return true; if (d === 'duraklat') { devam(); return true; } return true; }
  if (panel === 'ayar') {
    if (k === 'KeyW' || k === 'ArrowUp') { psecili = (psecili + satirlar.length - 1) % satirlar.length; satirIsaret(); secSes(); }
    else if (k === 'KeyS' || k === 'ArrowDown') { psecili = (psecili + 1) % satirlar.length; satirIsaret(); secSes(); }
    else if (k === 'KeyA' || k === 'ArrowLeft') satirDegistir(psecili, -1);
    else if (k === 'KeyD' || k === 'ArrowRight') satirDegistir(psecili, 1);
    else if (k === 'Enter' || k === 'Space') satirDegistir(psecili, 1);
    else if (k === 'Backspace') geri();
    else return false;
    return true;
  }
  if (k === 'KeyW' || k === 'ArrowUp') { panel = null; panelCiz(); sec(secili - 1); }
  else if (k === 'KeyS' || k === 'ArrowDown') { panel = null; panelCiz(); sec(secili + 1); }
  else if (k === 'Enter' || k === 'Space' || k === 'KeyD' || k === 'ArrowRight') { if (panel && k !== 'Enter') return true; panel ? geri() : etkinles(secili); }
  else if (k === 'Backspace' || k === 'KeyA' || k === 'ArrowLeft') geri();
  else return false;
  return true;
}


// ---------- HİKÂYE: ara sahne kartları, diyalog, başarımlar, önyükleme ----------
const GORSEL_YOL = ['hikaye/prof_pas.jpg', 'hikaye/gorev_kure.jpg', 'hikaye/gorev_kedi.jpg', 'hikaye/gorev_halka.jpg', 'hikaye/gorev_kamyonet.jpg', 'hikaye/gorev_patron.jpg',
  'hikaye/kara_canavar.jpg', 'hikaye/bitis.jpg', 'ui/ikon_egitim.png', 'ui/ikon_kure.png', 'ui/ikon_kedi.png', 'ui/ikon_halka.png', 'ui/ikon_kamyonet.png', 'ui/ikon_patron.png',
  'ui/zifir_portre.png', 'ui/prof_pas_portre.png', ...Array.from({ length: 8 }, (_, i) => 'ui/rozet_' + (i + 1) + '.png')];
const GORSEL = {};
function gorselOnyukle() {
  for (const y of GORSEL_YOL) {
    try { const im = new Image(); im.onerror = () => { im._yok = true; }; im.src = 'assets/' + y; GORSEL[y] = im; } catch (x) { /* yok say */ }
  }
}
const gorselVar = y => { const im = GORSEL[y]; return im && !im._yok && im.complete && im.naturalWidth > 0 ? im : null; };

const KART_GOREV = [
  { img: 'gorev_kure', t: 'ÇALINAN IŞIKLAR', m: 'Profesör Pas şehrin Işık Kürelerini kaptı! Çatılara saçılan parıltıları topla ki mahalle yeniden aydınlansın.' },
  { img: 'gorev_kedi', t: 'ÇATIDAKİ MİNİK', m: 'Minik bir kedi çatıda mahsur kaldı ve aşağı inmeye hiç niyeti yok. Zifir, nazikçe yanına git; ödülün bir mırıltı!' },
  { img: 'prof_pas', t: 'PAS ROBOTLARI GELİYOR', m: 'Vızvız dronlar ve Pas Robotları sokakları bastı! Cıvatalarını uçur, pilleri "bzzt" desin; kimsenin canı yanmaz.' },
  { img: 'gorev_halka', t: 'NEON HALKA YARIŞI', m: 'Gökdelenlerin arasında neon halkalar belirdi! Dokunaçla sallan, hepsinden sırayla geç, süre dolmadan yetiş.' },
  { img: 'gorev_kamyonet', t: 'KAÇAK KAMYONET', m: 'Hırsız robot kamyoneti ışıkları yüklenip kaçıyor! Gaza bas, peşine takıl ve durdur. Korna sesi bile onu kurtaramaz.' },
  { img: 'gorev_patron', t: 'DEV PAS ROBOT', m: 'Profesör Pas bu sefer dev robotunu yolladı! Ön tarafı çelik gibi sert ama SIRTINDAKİ parlak pil çok hassas. Arkadan vur!' },
];
const KART_PROF = { img: 'prof_pas', t: 'PROFESÖR PAS', m: '"Muhahaha! Şehrin bütün ışıkları artık benim! Beni kimse durduramaz... Ay, gözlüğüm buğulandı."', k: 'profGoruldu' };
const KART_CANAVAR = { img: 'kara_canavar', t: 'İPUCU: KARA CANAVAR', m: 'Güç barı dolunca Q: KARA CANAVAR! Dev gücünle patronun karşısına dikil.', k: 'karaGoruldu' };
const KART_BITIS = { img: 'bitis', t: 'ŞEHİR AYDINLIK!', m: 'Işıklar yandı, kedi mırlıyor, Profesör Pas gözlüğünü arıyor. Teşekkürler Zifir, yeni sabah yeni macera!' };

// replikler: [kim, metin] — pas = Profesör Pas, zf = Zifir
const DIYALOG = [
  { bas: [['pas', 'O ışıklar benim! Toplamaya bile üşenirsin.'], ['zf', 'Üşenmem, ben zaten ışık sever bir jöleyim.']],
    yari: [['pas', 'Bir dakika, o kürelerin hepsi sayılı!'], ['zf', 'Şimdi sayılı olanlar benim cebimde.']],
    son: [['pas', 'Hmpf! Yedek kürem var zaten...'], ['zf', 'Hepsi bir dahaki sefere de benim olsun.']] },
  { bas: [['pas', 'Kedi mi? Kedi bir şey bilmez ki.'], ['zf', 'Bildiği tek şey var: mama. Gel kedicik!']],
    yari: [['pas', 'Çatıdan inemesin diye yağladım!'], ['zf', 'Bu çok ayıp. Kedi kaymaz, ben tutarım.']],
    son: [['pas', 'Bu kediyi bana geri ver!'], ['zf', 'Üzgünüm, kedi kendi kararını verdi.']] },
  { bas: [['pas', 'Robotlarım, hücum! Zifir\'i ezin!'], ['zf', 'Ezmek mi? Ben sadece biraz sallanacağım.']],
    yari: [['pas', 'Yüzlerce robotum var, saymayı bile unuttum.'], ['zf', 'Sorun değil, ben sayarım: bir, iki...']],
    son: [['pas', 'Robotlarım! Paslanmışlar gibi duruyorlar!'], ['zf', 'Zaten paslıydılar, ben sadece yatırdım.']] },
  { bas: [['pas', 'Halkalardan geç? Ben bile geçemedim!'], ['zf', 'Ben dokunaçla geçerim. Sen merdivenle uğraş.']],
    yari: [['pas', 'Süre doluyor, doluyor, doluyor...'], ['zf', 'Doluyor ama ben daha hızlı sallanıyorum.']],
    son: [['pas', 'Halkalarım neden hep geçiliyor?!'], ['zf', 'Çünkü ortası boş, sevgili profesör.']] },
  { bas: [['pas', 'Kamyonetime yetişemezsin, tekerleri turbo!'], ['zf', 'Turbo mu? Benim de dokunaçlarım turbo.']],
    yari: [['pas', 'Gaza bas! Daha hızlı, kamyonet!'], ['zf', 'Kornana basma, komşular uyuyor.']],
    son: [['pas', 'Kamyonetim! Yedek lastiğim de gitti!'], ['zf', 'Merak etme, sana bir bisiklet bıraktım.']] },
  { bas: [['pas', 'Dev robotumu görünce korkarsın!'], ['zf', 'Hmm, evet. Biraz büyük. Ama sırtı açık!']],
    yari: [['pas', 'Pil sırtında değil! ...Şey, yani... yok öyle bir şey.'], ['zf', 'Çok teşekkürler, ipucu için.']],
    son: [['pas', 'Bu bitmedi Zifir! Bir dahaki sefer daha büyük!'], ['zf', 'Bir dahaki sefer ben de büyürüm.']] },
];
const BASARIM = [
  { id: 1, ad: 'İlk Sallanma', ac: 'Sağ tıkı basılı tutup ilk kez dokunaçla sallan.' },
  { id: 2, ad: 'Çatı Kralı', ac: 'Toplam 10 kez çatıya kon.' },
  { id: 3, ad: 'Kombo Ustası', ac: '10\'luk kombo yap.' },
  { id: 4, ad: 'Dron Avcısı', ac: 'Toplam 25 dron yen.' },
  { id: 5, ad: 'Kedi Dostu', ac: '3 kediyi kurtar.' },
  { id: 6, ad: 'Kara Canavar', ac: 'Q ile ilk kez Kara Canavar ol.' },
  { id: 7, ad: 'Mükemmel Bırakış', ac: '5 kez mükemmel bırakış yap.' },
  { id: 8, ad: 'Şehrin Kahramanı', ac: 'Patron Dev Pas Robotu yen.' },
];

const hik = { acik: false, kartAktif: false, kartT: 0, kartSure: 3.5, kartK: [], diyK: [], diyA: null, diyT: 0, diySon: -99, diyZ: 0, bsK: [], bsA: 0, yerel: { basarim: {}, say: {} } };
const kayitAl = () => {
  const k = G_.gorev?.kayit ?? hik.yerel;
  k.basarim ||= {}; k.say ||= {}; return k;
};
const kayitYaz = () => { try { G_.gorev?.kaydet?.(); } catch (x) { /* yok say */ } };
const basarimVarMi = id => !!kayitAl().basarim[id];

function kartAc(k) {
  const el0 = e.kart, im = el0.querySelector('.kimg');
  const yol = 'hikaye/' + k.img + '.jpg';
  im.style.backgroundImage = GORSEL[yol]?._yok ? 'none' : `url(assets/${yol})`;
  el0.querySelector('h2').textContent = k.t; el0.querySelector('p').textContent = k.m;
  im.style.animation = 'none'; void im.offsetWidth; im.style.animation = '';
  el0.classList.remove('gizli', 'cik'); void el0.offsetWidth; el0.classList.add('ac');
  hik.kartAktif = true; hik.kartT = 0;
  G_.ses?.cal?.('arayuz_sec');
}
function kartKapat() {
  if (!hik.kartAktif) return;
  hik.kartAktif = false; e.kart.classList.remove('ac'); e.kart.classList.add('cik');
  setTimeout(() => { if (!hik.kartAktif) e.kart.classList.add('gizli'); }, 500);
}
function kartKuyrukla(k) {
  if (!hik.acik) return;
  if (k.k) { const kk = kayitAl(); if (kk[k.k]) return; kk[k.k] = true; kayitYaz(); }
  hik.kartK.push(k);
}
function gorevKartlari(idx) {
  if (idx == null || idx < 0) return;
  if (idx === 0) kartKuyrukla(KART_PROF);
  if (idx === 5) kartKuyrukla(KART_CANAVAR);
  const k = KART_GOREV[idx]; if (k) kartKuyrukla(k);
}
function diyalogKuyrukla(idx, tur, gecikme) {
  if (!hik.acik || idx == null || idx < 0) return;
  const s = DIYALOG[idx]?.[tur]; if (!s) return;
  hik.diyK.push({ s, at: hik.diyZ + gecikme });
  while (hik.diyK.length > 2) hik.diyK.shift();
}
function diyalogGoster(s) {
  hik.diyA = s; hik.diyT = 0; hik.diySon = hik.diyZ;
  const d = e.diy; d.classList.remove('gizli'); diyalogSatir(0);
}
function diyalogSatir(i) {
  const [kim, m] = hik.diyA[i], d = e.diy, pas = kim === 'pas';
  d.classList.toggle('pas', pas);
  const g = gorselVar(pas ? 'ui/prof_pas_portre.png' : 'ui/zifir_portre.png');
  const im = d.querySelector('img'); im.style.display = g || !GORSEL[pas ? 'ui/prof_pas_portre.png' : 'ui/zifir_portre.png']?._yok ? '' : 'none';
  im.src = 'assets/ui/' + (pas ? 'prof_pas_portre.png' : 'zifir_portre.png');
  d.querySelector('b').textContent = pas ? 'PROF. PAS' : 'ZİFİR'; d.querySelector('span').textContent = m;
  d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop'); hik.diyI = i;
}
function hikayeGuncelle(gdt) {
  if (!hik.acik) return;
  const oyunda = G_.durum === 'oyun';
  if (hik.kartAktif) {
    if (oyunda) { hik.kartT += gdt; G_.efekt?.yavasCekim?.(0.2, 0.25); }
    if (hik.kartT >= hik.kartSure) kartKapat();
  } else if (hik.kartK.length && oyunda && performance.now() >= tamamBitis && !toparliyor) kartAc(hik.kartK.shift());
  // diyalog
  if (oyunda && !hik.kartAktif) hik.diyZ += gdt;
  if (hik.diyA) {
    if (oyunda && !hik.kartAktif) {
      hik.diyT += gdt;
      const i = Math.floor(hik.diyT / 3);
      if (i >= hik.diyA.length) { hik.diyA = null; e.diy.classList.add('gizli'); hik.diySon = hik.diyZ; }
      else if (i !== hik.diyI) diyalogSatir(i);
    }
  } else if (oyunda && !hik.kartAktif && !hik.kartK.length && hik.diyK.length && hik.diyK[0].at <= hik.diyZ && hik.diyZ - hik.diySon >= 20) diyalogGoster(hik.diyK.shift().s);
  // başarım bildirimi
  if (hik.bsA > 0) { hik.bsA -= gdt; if (hik.bsA <= 0) { e.bsn.classList.remove('ac'); } }
  else if (hik.bsK.length && !hik.bsBekle) {
    const b = hik.bsK.shift(); hik.bsA = 4;
    const n = e.bsn; n.querySelector('img').src = 'assets/ui/rozet_' + b.id + '.png';
    n.querySelector('b').textContent = b.ad; n.querySelector('span').textContent = 'BAŞARIM KAZANILDI';
    n.classList.remove('ac'); void n.offsetWidth; n.classList.add('ac');
    G_.ses?.cal?.('arayuz_onay');
  }
}
function basarimVer(id) {
  const k = kayitAl(); if (k.basarim[id]) return;
  k.basarim[id] = Date.now(); kayitYaz();
  if (hik.acik) hik.bsK.push(BASARIM.find(b => b.id === id));
}
function sayArtir(ad, hedef, id) {
  const k = kayitAl(); k.say[ad] = (k.say[ad] || 0) + 1;
  if (k.say[ad] >= hedef) basarimVer(id); else if (k.say[ad] % 5 === 0) kayitYaz();
}
function hikayeKur(G) {
  const u = new URLSearchParams(location.search);
  hik.acik = !G.test || u.has('hikaye');
  gorselOnyukle();
  e.kart = el('div', 'kart gizli', '<div class="kimg"></div><div class="kvin"></div><div class="kalt"><small>GÖREV</small><h2></h2><p></p><em>geçmek için herhangi bir tuş</em></div>', e.hud);
  e.diy = el('div', 'diy gizli', '<img alt=""><div class="db"><b></b><span></span></div>', e.hud);
  e.bsn = el('div', 'bsn', '<img alt=""><div><span class="bs-ust"></span><b></b></div>', e.hud);
  const gec = ev => { if (hik.kartAktif && hik.kartT > 0.5) { kartKapat(); if (ev.type === 'keydown') ev.stopPropagation(); } };
  addEventListener('keydown', gec, true); addEventListener('pointerdown', gec, true);
  const o = G.olay;
  o.on('gorevBasla', v => {
    const idx = v?.idx ?? G.gorev?.aktif?.idx; gorevKartlari(idx); diyalogKuyrukla(idx, 'bas', 8);
  });
  o.on('gorevYarisi', v => diyalogKuyrukla(v?.idx, 'yari', 0));
  o.on('gorevBitti', v => {
    diyalogKuyrukla(v?.idx, 'son', 3);
    if (v?.idx === 5) basarimVer(8);
  });
  o.on('zincirBitti', () => kartKuyrukla(KART_BITIS));
  o.on('sallanBasla', () => basarimVer(1));
  o.on('konus', () => sayArtir('konus', 10, 2));
  o.on('kombo', v => { if ((v?.sayi ?? 0) >= 10) basarimVer(3); });
  o.on('robotYenildi', v => { if (v?.tur === 'dron') sayArtir('dron', 25, 4); });
  o.on('kediKurtarildi', () => sayArtir('kedi', 3, 5));
  o.on('devBasla', () => basarimVer(6));
  o.on('mukemmelBirakis', () => sayArtir('mukemmel', 5, 7));
  if (hik.acik && u.has('diyaltest')) { hik.kartK.length = 0; hik.diyK.length = 0; setTimeout(() => { hik.kartK.length = 0; diyalogGoster(DIYALOG[0].bas); }, 1500); return; }
  // oyun zaten bir görevle açıldıysa (eğitim bitmiş): kartı yakala
  if (G.gorev && !G.gorev.egitimde && G.gorev.aktif?.idx >= 0) { gorevKartlari(G.gorev.aktif.idx); diyalogKuyrukla(G.gorev.aktif.idx, 'bas', 8); }
}

// ---------- genel ----------
function mesajGoster() {
  if (mesajVar || !kuyruk.length) return;
  const { metin, sure } = kuyruk.shift(); mesajVar = true;
  const m = el('div', 'mesaj', '', e.mesajlar); m.textContent = metin;
  setTimeout(() => { m.classList.add('cik'); setTimeout(() => { m.remove(); mesajVar = false; mesajGoster(); }, 380); }, sure * 1000);
}
function yeniGorev(ad) {
  const ust = e.yeni.firstChild, h = e.yeni.lastChild; ust.textContent = 'YENİ GÖREV'; h.textContent = ad;
  e.yeni.classList.remove('goster'); void e.yeni.offsetWidth; e.yeni.classList.add('goster');
}
function odulYaz(metin) {
  const n = performance.now();
  if (metin === sonOdulAd && n - sonOdulT < 700) return;
  sonOdulAd = metin; sonOdulT = n;
  while (e.odullar.children.length > 2) e.odullar.firstChild.remove();
  const o = el('div', 'odul', '', e.odullar); o.textContent = metin; setTimeout(() => o.remove(), 1550);
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
function oyundanCik() {
  G_.durum = 'menu';
  G_.girdi?.serbestBirak?.();
  G_.ses?.muzik?.(false);
  window.close();
  // Normal tarayıcı sekmesi kapatmaya izin vermezse görünür çıkış yolu sun.
  setTimeout(() => {
    menuKur('ana');
    G_.arayuz?.mesaj?.(navigator.maxTouchPoints > 0 ? 'Oyun durdu. Bu sekmeyi Chrome menüsünden kapatabilirsin.' : 'Pencereyi kapatmak için Alt + F4 tuşlarına bas.', 8);
    document.exitFullscreen?.()?.catch?.(() => {});
  }, 250);
}
function oyunBaslat() { G_.durum = 'oyun'; G_.girdi?.kilitle?.(); G_.ses?.muzik?.(true); }
function devam() { G_.durum = 'oyun'; G_.girdi?.kilitle?.(); }
function duraklat() { if (G_.durum === 'oyun') G_.durum = 'duraklat'; }

function ipucuGoster(v) {
  ipucuAktif = true; const k = e.ipucu; k.classList.remove('gizli', 'tamam');
  k.innerHTML = `<div class="ia">EĞİTİM ${v.adim}/${v.toplam}</div><div class="im"></div>
   <div class="it">${v.tuslar.map(t => /basılı|bırak/.test(t) ? `<span>${t}</span>` : `<kbd class="tur">${t}</kbd>`).join('')}</div>
   <div class="id">${Array.from({ length: v.toplam }, (_, i) => `<i class="${i < v.adim ? 'b' : ''}"></i>`).join('')}</div><div class="ik"></div>`;
  k.querySelector('.im').textContent = v.metin;
  k.style.animation = 'none'; void k.offsetWidth; k.style.animation = '';
}

export function kur(G) {
  G_ = G;
  G.ayar = { ...ayarYukle(), kaydet: ayarKaydet };
  kok = document.getElementById('arayuz');
  if (!kok) { kok = document.createElement('div'); kok.id = 'arayuz'; document.body.appendChild(kok); }
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  // ---- HUD ----
  e.hud = el('div', 'hud');
  e.hizc = el('canvas', 'hizc', null, e.hud);
  e.vin = el('div', 'vin', null, e.hud);
  e.kilit = el('div', 'kilit', null, e.hud);
  e.halka = el('div', 'nhalka', null, e.hud);
  e.hcan = el('div', 'hcan', '<i></i>', e.hud);
  e.agn = el('div', 'agn', null, e.hud);
  e.vurus = el('div', 'vurus', null, e.hud);
  e.hy = el('div', 'hy', '', e.hud);
  e.ok = el('div', 'ok gizli', OK + '<em></em>', e.hud);
  const pu = el('div', 'pusula', '<canvas width="900" height="64"></canvas>', e.hud);
  e.pc = pu.firstChild; e.pctx = e.pc.getContext('2d');
  const mi = el('div', 'mini', '<canvas width="240" height="240"></canvas>', e.hud);
  e.mc = mi.firstChild; e.mctx = e.mc.getContext('2d');
  const sa = el('div', 'sol-alt', '', e.hud);
  e.canK = el('div', 'canK', DAMLA + '<div class="seg">' + '<i></i>'.repeat(10) + '</div>', sa);
  e.guc = el('div', 'gucK', '<div class="gl"><span>GÜÇ</span><span class="qy">Q — DEV ZİFİR!</span></div><div class="gb"><i></i></div>', sa);
  e.segler = [...e.canK.querySelectorAll('.seg i')]; e.dkr = e.canK.querySelector('#dkr'); e.gucBar = e.guc.querySelector('.gb i');
  e.gorev = el('div', 'gorev gizli', '<div class="gb">GÖREV</div><div class="ga"></div><div class="gc"></div><div class="gi"><i></i></div><div class="gs"></div><img class="gik" alt="">', e.hud);
  e.sayac = el('div', 'sayac', '<div><b></b><span>0</span></div><div>★ <span>0</span></div>', e.hud);
  e.kombo = el('div', 'kombo', '<div class="kn"></div><div class="kt"></div><div class="kc"><i></i></div>', e.hud);
  e.mesajlar = el('div', 'mesajlar', '', e.hud);
  e.odullar = el('div', 'odullar', '', e.hud);
  e.yeni = el('div', 'yeni', '<small></small><h2></h2>', e.hud);
  e.tamam = el('div', 'tamam', '<h1>GÖREV TAMAMLANDI</h1><div class="ta"></div><div class="tp"><span>+0</span><small></small></div>', e.hud);
  e.ipucu = el('div', 'ipucuK gizli', '', e.hud);
  e.dev = el('div', 'devrozet gizli', 'DEV ZİFİR!', e.hud);
  e.toparla = el('div', 'toparla', '<span>Zifir toparlanıyor...</span>', e.hud);

  hikayeKur(G);

  // ---- yükleme perdesi ----
  const yp = document.createElement('div'); yp.id = 'yukleniyor'; yp.textContent = 'YÜKLENİYOR...';
  document.body.appendChild(yp);
  let ypK = false; const ypKapat = () => { if (ypK) return; ypK = true; yp.classList.add('bitti'); setTimeout(() => yp.remove(), 800); };
  G.THREE.DefaultLoadingManager.onLoad = ypKapat;
  setTimeout(ypKapat, 10000);

  // ---- menü ----
  e.menu = el('div', 'mn gizli');
  e.menu.innerHTML = `<div class="mn-bg"><div class="mn-img"></div></div><div class="mn-golge"></div>
   <div class="mn-sol"><img class="mn-logo" src="assets/logo.png" alt="ZİFİR"><div class="mn-baslik gizli">DURAKLADI</div>
   <div class="mn-alt">Gece Şehrinin Kara Kahramanı</div><div class="mn-liste"><div class="mn-cubuk"></div></div></div>
   <div class="panel gizli"></div>
   <div class="mn-ipucu"><span><kbd>W</kbd><kbd>S</kbd> gezin</span><span><kbd>Enter</kbd> seç</span><span><kbd>A</kbd><kbd>D</kbd> değiştir</span><span><kbd>Esc</kbd> geri</span></div>
   <div class="mn-atif">Harita verisi © OpenStreetMap katkıda bulunanlar (ODbL)</div>
   <div class="mn-surum">GECE ŞEHRİ · v1</div>`;
  e.bg = e.menu.querySelector('.mn-bg'); e.liste = e.menu.querySelector('.mn-liste'); e.cubuk = e.menu.querySelector('.mn-cubuk');
  e.panel = e.menu.querySelector('.panel'); e.logo = e.menu.querySelector('.mn-logo'); e.baslikM = e.menu.querySelector('.mn-baslik'); e.ipucuM = e.menu.querySelector('.mn-ipucu');
  menuKur('ana');
  addEventListener('mousemove', ev => { mx = ev.clientX / innerWidth * 2 - 1; my = ev.clientY / innerHeight * 2 - 1; });
  addEventListener('pointerup', () => { if (suruk) { suruk = null; ayarKaydet(); } });

  // ---- olaylar ----
  const o = G.olay;
  o.on('hasar', v => {
    e.vin.classList.add('vur'); vurma = 0.12;
    const k = v?.kaynakKonum || v?.kaynak;
    if (k && k.isVector3) {
      while (hasarlar.length > 4) hasarlar.shift().d.remove();
      hasarlar.push({ k: k.clone(), t: 1.6, d: el('div', '', HASAR_OK, e.hy) });
    }
  });
  o.on('yenildi', () => { toparliyor = true; e.toparla.classList.add('ac'); });
  o.on('dogdu', () => { toparliyor = false; e.toparla.classList.remove('ac'); });
  o.on('gorevBasla', v => { const ad = v?.ad || G.gorev?.aktif?.ad || ''; const bekle = Math.max(0, tamamBitis - performance.now()); setTimeout(() => yeniGorev(ad), bekle); });
  o.on('gorevBitti', v => {
    tamamBitis = performance.now() + 4000;
    e.tamam.querySelector('.ta').textContent = v?.ad || '';
    tamam.t = 0; tamam.odul = v?.odul ?? 0; tamam.puan = v?.puan ?? G.gorev?.puan ?? 0;
    e.tamam.classList.remove('goster'); void e.tamam.offsetWidth; e.tamam.classList.add('goster');
  });
  o.on('kureAlindi', () => { e.sayac.classList.remove('sek'); void e.sayac.offsetWidth; e.sayac.classList.add('sek'); ucus('+1 ✦', null); });
  o.on('isabet', () => { vurus = 0.15; e.vurus.classList.remove('bit'); e.vurus.classList.add('ac'); });
  o.on('bitirici', () => { vurus = 0.3; e.vurus.classList.add('ac', 'bit'); odulYaz('BİTİRİCİ!'); });
  o.on('robotYenildi', v => ucus('+' + (v?.puan ?? 10), v?.konum));
  o.on('devBasla', () => { e.dev.classList.remove('gizli'); G.arayuz.mesaj('DEV ZİFİR!', 2); });
  o.on('devBit', () => e.dev.classList.add('gizli'));
  o.on('kombo', v => {
    const n = v?.sayi ?? 0; kombo.sayi = n; kombo.t = 3;
    if (n < 2) return;
    const kn = e.kombo.querySelector('.kn'); kn.innerHTML = `<small>x</small>${n}`;
    kn.classList.remove('pop'); void kn.offsetWidth; kn.classList.add('pop');
    e.kombo.querySelector('.kt').textContent = n >= 8 ? 'ZİFİRİ!' : n >= 5 ? 'SÜPER!' : n >= 3 ? 'HARİKA!' : '';
    e.kombo.classList.add('ac');
  });
  o.on('konus', () => odulYaz('ÇATIYA KONDU'));
  o.on('mukemmelBirakis', () => odulYaz('MÜKEMMEL BIRAKIŞ!'));
  o.on('kacis', () => odulYaz('KAÇIŞ!'));
  o.on('sapan', () => odulYaz('SAPAN!'));
  o.on('halkaGecildi', () => odulYaz('HALKA!'));
  o.on('ipucu', ipucuGoster);
  o.on('ipucuTamam', () => { e.ipucu.classList.add('tamam'); secSes(true); });
  o.on('ipucuKapat', () => { ipucuAktif = false; e.ipucu.classList.add('gizli'); });
  o.on('kalite', () => satirGuncelle());

  // ---- pointer lock / klavye ----
  document.addEventListener('pointerlockchange', () => {
    const kilitli = !!document.pointerLockElement;
    if (kilitliydi && !kilitli && G.durum === 'oyun' && !G.test) duraklat();
    if (!kilitliydi && kilitli && G.durum === 'duraklat') G.durum = 'oyun';
    kilitliydi = kilitli;
  });
  addEventListener('keydown', ev => {
    if (G.test) return;
    if (ev.code === 'Escape' && !ev.repeat && G.durum === 'oyun') { duraklat(); return; }
    if (tusMenu(ev)) { ev.preventDefault(); ev.stopPropagation(); }
  }, true);
  addEventListener('blur', () => { if (G.durum === 'oyun' && !G.test) duraklat(); });

  // doğrulama kısayolu (yalnız ?test olmadan): #ayar #kontrol #yapim #dur
  if (!G.test) {
    const h = location.hash.slice(1);
    if (h === 'dur') { G.durum = 'duraklat'; menuKur('dur'); }
    if (['ayar', 'kontrol', 'basarim', 'yapim'].includes(h)) { panel = h; psecili = 1; panelCiz(); sec(OGELER.ana.findIndex(x => x[1] === h), true); }
  }
  ayarUygula();
  if (G.gorev?.ipucu) ipucuGoster(G.gorev.ipucu);

  G.arayuz = {
    mesaj(metin, sure = 3) { kuyruk.push({ metin: String(metin), sure }); mesajGoster(); },
    ayarAc() { duraklat(); },
  };
}

function bar(i, oran) { i.style.width = Math.max(0, Math.min(1, oran)) * 100 + '%'; }

// ---------- pusula ----------
const YONLER = [['K', 0], ['KD', 45], ['D', 90], ['GD', 135], ['G', 180], ['GB', 225], ['B', 270], ['KB', 315]];
function pusulaCiz(G, bearing, hedefBearing, hedefM) {
  const x = e.pctx, W = e.pc.width, H = e.pc.height, ppd = W / 130;
  x.clearRect(0, 0, W, H);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let d = Math.floor((bearing - 70) / 5) * 5; d <= bearing + 70; d += 5) {
    const px = W / 2 + (d - bearing) * ppd, dd = ((d % 360) + 360) % 360;
    const yon = YONLER.find(y => y[1] === dd);
    if (yon) {
      x.fillStyle = yon[0].length === 1 ? '#fff' : '#b9a8e6'; x.font = (yon[0].length === 1 ? '900 30px' : '700 20px') + ' system-ui,sans-serif';
      x.fillText(yon[0], px, 22);
    } else if (dd % 15 === 0) { x.fillStyle = 'rgba(200,185,240,.65)'; x.fillRect(px - 1, 16, 2, 14); }
    else { x.fillStyle = 'rgba(200,185,240,.35)'; x.fillRect(px - 0.5, 20, 1, 7); }
  }
  // kenarlarda sön
  x.globalCompositeOperation = 'destination-in';
  const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.2, '#000'); g.addColorStop(0.8, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
  // merkez imleç
  x.fillStyle = '#2ef2e0'; x.shadowColor = '#2ef2e0'; x.shadowBlur = 10;
  x.beginPath(); x.moveTo(W / 2 - 9, 40); x.lineTo(W / 2 + 9, 40); x.lineTo(W / 2, 53); x.fill();
  x.shadowBlur = 0; x.fillStyle = '#fff'; x.font = '700 18px system-ui,sans-serif';
  x.fillText(String(Math.round(((bearing % 360) + 360) % 360)).padStart(3, '0') + '°', W / 2, 60 - 4);
  // görev işareti
  if (hedefBearing != null) {
    let d = ((hedefBearing - bearing + 540) % 360) - 180;
    const kenar = Math.abs(d) > 58; d = Math.max(-58, Math.min(58, d));
    const px = W / 2 + d * ppd;
    x.save(); x.translate(px, 18); x.globalAlpha = kenar ? 0.55 : 1; x.shadowColor = '#2ef2e0'; x.shadowBlur = 12;
    x.fillStyle = '#2ef2e0'; x.beginPath(); x.moveTo(0, -11); x.lineTo(9, 0); x.lineTo(0, 11); x.lineTo(-9, 0); x.fill();
    x.shadowBlur = 0; x.fillStyle = '#fff'; x.font = '700 15px system-ui,sans-serif'; x.fillText(hedefM + ' m', 0, 34); x.restore();
  }
}

// ---------- mini harita ----------
const MR = 120; // dünya yarıçapı (m)
function miniCiz(G, px, pz, fx, fz, hedef) {
  const x = e.mctx, S = e.mc.width, c = S / 2, olc = c / MR;
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, S, S);
  x.fillStyle = 'rgba(10,6,26,.88)'; x.fillRect(0, 0, S, S);
  const rot = -Math.PI / 2 - Math.atan2(fz, fx);
  x.save(); x.translate(c, c); x.rotate(rot); x.scale(olc, olc); x.translate(-px, -pz);
  // parklar (gerçek harita alanları) + yollar (yol grafiği, gerçek genişlik)
  const al = G.harita?.veri?.alanlar;
  if (al) {
    x.fillStyle = 'rgba(40,150,95,.28)';
    for (const a of al) {
      if (a.tur !== 'park' && a.tur !== 'cimen' && a.tur !== 'orman') continue;
      const h = a.halka; if (!h || h.length < 3) continue;
      let yakin = false;
      for (let i = 0; i < h.length; i += 3) if (Math.abs(h[i][0] - px) < MR * 1.6 && Math.abs(h[i][1] - pz) < MR * 1.6) { yakin = true; break; }
      if (!yakin) continue;
      x.beginPath(); h.forEach((q, i) => (i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]))); x.closePath(); x.fill();
    }
  }
  const ag = G.sehir?.yolAgi;
  if (ag?.kenarlar) {
    const D = ag.dugumler, lim2 = MR * 1.5; x.lineCap = 'round';
    for (const pass of [0, 1]) {
      x.strokeStyle = pass ? 'rgba(210,200,245,.55)' : 'rgba(120,110,170,.4)';
      x.beginPath();
      for (const k of ag.kenarlar) {
        if (pass && !(k.tur === 'secondary' || k.tur === 'tertiary')) continue;
        const A = D[k.a], B = D[k.b];
        if (Math.abs(A.x - px) > lim2 && Math.abs(B.x - px) > lim2) continue;
        if (Math.abs(A.z - pz) > lim2 && Math.abs(B.z - pz) > lim2) continue;
        x.moveTo(A.x, A.z); x.lineTo(B.x, B.z);
      }
      x.lineWidth = pass ? 7 : 4.5; x.stroke();
    }
  }
  const bs = G.sehir?.binalar;
  if (bs) {
    const lim = MR * 1.5;
    for (const b of bs) {
      if (b.halka) { // gerçek harita: bina çokgeni
        if (px < b.minx - lim || px > b.maxx + lim || pz < b.minz - lim || pz > b.maxz + lim) continue;
        const k = Math.min(1, (b.yuk || b.h) / 60);
        x.fillStyle = `rgba(${90 + k * 110 | 0},${60 + k * 40 | 0},${170 + k * 60 | 0},${0.55 + k * 0.35})`;
        x.beginPath(); b.halka.forEach((q, i) => (i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]))); x.closePath(); x.fill();
        continue;
      }
      if (Math.abs(b.x - px) > lim + b.gx || Math.abs(b.z - pz) > lim + b.gz) continue;
      const k = Math.min(1, b.h / 120);
      x.fillStyle = `rgba(${90 + k * 110 | 0},${60 + k * 40 | 0},${170 + k * 60 | 0},${0.5 + k * 0.4})`;
      x.fillRect(b.x - b.gx / 2, b.z - b.gz / 2, b.gx, b.gz);
    }
  }
  // düşmanlar
  const dl = G.dusman?.liste;
  x.fillStyle = '#ff3b4e';
  if (dl) for (const d of dl) {
    if (!d.canli || !d.konum) continue;
    if (Math.hypot(d.konum.x - px, d.konum.z - pz) > MR) continue;
    x.beginPath(); x.arc(d.konum.x, d.konum.z, (d.dev ? 5 : 2.8) / olc * 1.3 * 0.5 + 1.5, 0, 6.283); x.fill();
  }
  // görev hedefleri (küreler, halkalar, kedi): altın noktalar
  const hl = G.gorev?.hedefler?.();
  if (hl?.length) {
    x.fillStyle = '#ffd060'; x.strokeStyle = 'rgba(10,5,28,.9)'; x.lineWidth = 1.2 / olc;
    for (const h of hl) {
      if (Math.abs(h.x - px) > MR || Math.abs(h.z - pz) > MR) continue;
      x.beginPath(); x.arc(h.x, h.z, 3.6, 0, 6.283); x.fill(); x.stroke();
    }
  }
  x.restore();
  // görev işareti
  if (hedef) {
    let dx = hedef.x - px, dz = hedef.z - pz;
    let sx = dx * Math.cos(rot) - dz * Math.sin(rot), sy = dx * Math.sin(rot) + dz * Math.cos(rot);
    const m = Math.hypot(sx, sy) * olc, kenar = c - 14;
    let ix = c + sx * olc, iy = c + sy * olc;
    if (m > kenar) { const k = kenar / m; ix = c + sx * olc * k; iy = c + sy * olc * k; }
    x.save(); x.translate(ix, iy); x.shadowColor = '#2ef2e0'; x.shadowBlur = 10; x.fillStyle = '#2ef2e0';
    const ik = gorselVar('ui/' + (G.gorev?.aktif?.ikon || '') + '.png');
    if (ik) {
      x.beginPath(); x.arc(0, 0, 13, 0, 6.283); x.fillStyle = 'rgba(10,5,28,.85)'; x.fill(); x.lineWidth = 2; x.strokeStyle = '#2ef2e0'; x.stroke();
      x.shadowBlur = 0; x.drawImage(ik, -10, -10, 20, 20);
    } else { x.beginPath(); x.moveTo(0, -9); x.lineTo(7, 0); x.lineTo(0, 9); x.lineTo(-7, 0); x.fill(); }
    x.restore();
  }
  // oyuncu: görüş konisi + ok
  x.save(); x.translate(c, c);
  const kg = x.createRadialGradient(0, 0, 0, 0, 0, c * 0.7); kg.addColorStop(0, 'rgba(46,242,224,.38)'); kg.addColorStop(1, 'rgba(46,242,224,0)');
  x.fillStyle = kg; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, c * 0.7, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55); x.fill();
  x.fillStyle = '#fff'; x.strokeStyle = '#2ef2e0'; x.lineWidth = 2; x.shadowColor = '#2ef2e0'; x.shadowBlur = 8;
  x.beginPath(); x.moveTo(0, -10); x.lineTo(8, 9); x.lineTo(0, 4); x.lineTo(-8, 9); x.closePath(); x.fill(); x.stroke(); x.restore();
  // kuzey işareti
  x.save(); x.translate(c, c); x.rotate(rot); x.translate(0, -(c - 14));
  x.rotate(-rot); x.fillStyle = '#ff9d2e'; x.font = '900 17px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('K', 0, 0); x.restore();
}

let _hedefV = null;
export function guncelle(G, dt) {
  if (!kok) return;
  const d = G.durum, oyuncu = G.oyuncu, gdt = G.gercekDt ?? dt;
  // menü türü + görünürlük
  const menuGor = d === 'menu' || d === 'duraklat';
  if (menuGor) {
    const tur = d === 'menu' ? 'ana' : 'dur';
    if (tur !== menuTur) menuKur(tur);
  }
  if (e.menu.classList.contains('gizli') === menuGor) e.menu.classList.toggle('gizli', !menuGor);
  e.hud.style.opacity = d === 'menu' ? 0 : 1;
  if (d === 'menu') {
    pxk += (mx - pxk) * Math.min(1, gdt * 3); pyk += (my - pyk) * Math.min(1, gdt * 3);
    e.bg.style.transform = `translate(${(-pxk * 1.6).toFixed(2)}%,${(-pyk * 1.1).toFixed(2)}%)`;
  }
  if (d === 'duraklat' && panel === 'ayar') satirGuncelle();

  // can / güç
  const can = oyuncu ? oyuncu.can / (oyuncu.canMax || 100) : 1;
  const guc = oyuncu ? oyuncu.guc / (oyuncu.gucMax || 100) : 1;
  const dolu = Math.ceil(Math.max(0, Math.min(1, can)) * 10 - 1e-6);
  e.segler.forEach((s, i) => { const a = i < dolu; if (s.classList.contains('d') !== a) s.classList.toggle('d', a); });
  e.dkr.setAttribute('y', 48 * (1 - Math.max(0, Math.min(1, can))));
  e.canK.classList.toggle('az', can < 0.3);
  bar(e.gucBar, guc); e.guc.classList.toggle('dolu', guc >= 0.999);
  if (vurma > 0) { vurma -= gdt; if (vurma <= 0) e.vin.classList.remove('vur'); }

  // nişan
  nisanCiz(oyuncu, gdt);
  hikayeGuncelle(gdt);
  if (vurus > 0) { vurus -= gdt; if (vurus <= 0) e.vurus.classList.remove('ac', 'bit'); }

  // görev kartı + sayaçlar
  const g = G.gorev?.aktif;
  e.gorev.classList.toggle('gizli', !g);
  if (g) {
    const [, ga, gc, gi, gs] = e.gorev.children;
    if (ga.textContent !== g.ad) ga.textContent = g.ad || '';
    if (gc.textContent !== g.aciklama) gc.textContent = g.aciklama || '';
    const h = g.hedef || 0;
    gi.classList.toggle('gizli', !h);
    gi.firstChild.style.width = h ? Math.min(100, (g.ilerleme / h) * 100) + '%' : '0';
    gs.textContent = h ? `${g.ilerleme ?? 0} / ${h}` : '';
    const gik = e.gorev.querySelector('.gik'), ik = g.ikon ? 'assets/ui/' + g.ikon + '.png' : '';
    if (gik.dataset.s !== ik) { gik.dataset.s = ik; if (ik) { gik.src = ik; gik.style.display = ''; } else gik.style.display = 'none'; }
    e.sayac.style.top = (e.gorev.offsetHeight + e.gorev.offsetTop + 10) + 'px';
  } else e.sayac.style.top = '2.4vh';
  const kn = G.gorev?.toplamKure ?? 0, pn = G.gorev?.puan ?? 0;
  if (kn !== sonKure) { sonKure = kn; e.sayac.firstChild.lastChild.textContent = kn; }
  if (pn !== sonPuan) { sonPuan = pn; e.sayac.lastChild.lastChild.textContent = pn; }
  if (ipucuAktif && g?.hedef > 1) e.ipucu.querySelector('.ik').textContent = `${Math.min(g.ilerleme, g.hedef)}/${g.hedef}`;
  else if (ipucuAktif) { const ik = e.ipucu.querySelector('.ik'); if (ik) ik.textContent = ''; }

  // kombo sönümü
  if (kombo.t > 0) {
    kombo.t -= gdt;
    e.kombo.querySelector('.kc i').style.width = Math.max(0, kombo.t / 3) * 100 + '%';
    if (kombo.t <= 0) { e.kombo.classList.remove('ac'); kombo.sayi = 0; }
  }

  // görev tamam sayacı
  if (tamam.t >= 0) {
    tamam.t += gdt;
    const k = Math.min(1, Math.max(0, (tamam.t - 0.5) / 1.4)), v = Math.round(tamam.odul * (1 - Math.pow(1 - k, 3)));
    const tp = e.tamam.querySelector('.tp');
    tp.firstChild.textContent = '+' + v + ' PUAN'; tp.lastChild.textContent = 'TOPLAM ' + (tamam.puan - tamam.odul + v);
    if (tamam.t > 4) tamam.t = -1;
  }

  const kam = G.kamera;
  if (kam && d !== 'menu') {
    // yön vektörü
    const fv = _fv ||= new G.THREE.Vector3(); kam.getWorldDirection(fv);
    let fx = fv.x, fz = fv.z; const l = Math.hypot(fx, fz) || 1; fx /= l; fz /= l;
    const bearing = Math.atan2(fx, -fz) * 180 / Math.PI;
    const hedef = g?.isaret, pk = oyuncu?.konum || kam.position;

    // hedef oku (ekranda yön)
    if (hedef && d === 'oyun') {
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
      const aci = ic ? 180 : Math.atan2(dy, dx) * 180 / Math.PI + 90;
      e.ok.classList.remove('gizli');
      e.ok.style.transform = `translate(${x}px,${y}px)`;
      e.ok.firstChild.style.transform = `rotate(${aci}deg)`;
      e.ok.lastChild.textContent = Math.round(hedef.distanceTo(pk)) + ' m';
    } else e.ok.classList.add('gizli');

    // pusula + mini harita
    const hb = hedef ? Math.atan2(hedef.x - pk.x, -(hedef.z - pk.z)) * 180 / Math.PI : null;
    pusulaCiz(G, bearing, hb, hedef ? Math.round(Math.hypot(hedef.x - pk.x, hedef.z - pk.z)) : 0);
    miniT -= gdt;
    if (miniT <= 0) { miniT = 0.1; miniCiz(G, pk.x, pk.z, fx, fz, hedef); }

    // hasar yönü
    if (hasarlar.length) {
      kam.getWorldDirection(fv);
      const R = Math.min(innerWidth, innerHeight) * 0.3;
      for (let i = hasarlar.length - 1; i >= 0; i--) {
        const h = hasarlar[i]; h.t -= gdt;
        if (h.t <= 0) { h.d.remove(); hasarlar.splice(i, 1); continue; }
        const dx = h.k.x - kam.position.x, dz = h.k.z - kam.position.z;
        // ekran sağı = (fz', -fx')
        const ileri = dx * fx + dz * fz, sag = dx * -fz + dz * fx;
        const a = Math.atan2(sag, ileri);
        h.d.style.transform = `translate(${Math.sin(a) * R}px,${-Math.cos(a) * R}px) rotate(${a}rad)`;
        h.d.style.opacity = Math.min(1, h.t / 0.6);
      }
    }
  }
  if (!G.efekt?.hizBulanikligi) hizCizgileri(G, gdt);
}
let _fv = null;

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
