// Dokunmatik kumanda fiziksel girdiye dokunmadan aynı karede birleştirilir.
export function kurMobil(G) {
  const dokunmatik = matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0;
  const tuslar = new Set(), yeni = new Set(), birak = new Set(), sahip = new Map();
  const eksen = { x: 0, y: 0 }, bakis = { x: 0, y: 0 };
  const dinleyiciler = [], sifirla = [];
  const stil = document.createElement('style');
  stil.textContent = `
  .zifir-dokun{position:fixed;inset:0;z-index:80;pointer-events:none;touch-action:none;user-select:none;-webkit-user-select:none}
  .zifir-dokun[hidden]{display:none}.zifir-cubuk{position:absolute;bottom:max(22px,env(safe-area-inset-bottom));width:112px;height:112px;border:2px solid #66ead088;border-radius:50%;background:#12152b77;pointer-events:auto;touch-action:none;display:grid;place-items:center;color:#fff9;font:12px system-ui}
  .zifir-cubuk.sol{left:max(18px,env(safe-area-inset-left))}.zifir-cubuk.sag{right:174px}.zifir-cubuk i{position:absolute;width:42px;height:42px;border-radius:50%;background:#7de5d477;pointer-events:none}
  .zifir-tuslar{position:absolute;right:max(10px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(3,48px);gap:6px}
  .zifir-dokun button{pointer-events:auto;touch-action:none;color:white;border:1px solid #69e6d488;border-radius:14px;min-height:45px;background:#182442c9;font:600 11px system-ui;padding:4px}
  .zifir-dokun button[data-basili]{background:#506889}.zifir-dokun .zifir-durak{position:absolute;right:12px;top:max(12px,env(safe-area-inset-top));width:58px}
  .zifir-kol{position:fixed;left:50%;top:max(7px,env(safe-area-inset-top));transform:translateX(-50%);z-index:81;color:#dcfff7;background:#11192ccc;border-radius:9px;padding:5px 10px;font:11px system-ui;max-width:65vw;text-align:center;pointer-events:auto}
  .zifir-kol[hidden]{display:none}.zifir-kol summary{cursor:pointer}.zifir-kol p{max-width:380px;line-height:1.6;margin:8px 0}
  @media(max-width:600px){.zifir-cubuk{width:90px;height:90px}.zifir-cubuk.sag{right:155px;bottom:148px}.zifir-tuslar{grid-template-columns:repeat(3,43px)}.zifir-cubuk.sol{left:12px}.zifir-kol{max-width:58vw}}
  @media(max-height:450px){.zifir-cubuk{width:90px;height:90px}.zifir-cubuk.sag{bottom:20px;right:170px}}
  `;
  document.head.append(stil);
  const katman = document.createElement('div');katman.className='zifir-dokun';katman.hidden=true;
  katman.innerHTML='<div class="zifir-cubuk sol" aria-label="Hareket çubuğu">HAREKET<i></i></div><div class="zifir-cubuk sag" aria-label="Bakış çubuğu">BAKIŞ<i></i></div><div class="zifir-tuslar"></div><button class="zifir-durak" aria-label="Duraklat">Ⅱ</button>';
  document.body.append(katman);
  const bilgi=document.createElement('details');bilgi.className='zifir-kol';bilgi.hidden=true;
  bilgi.innerHTML='<summary></summary><p>Sol çubuk: hareket · Sağ çubuk: bakış<br>×: zıpla · ○: çekil · □: kamçı · △: Dev<br>L2: ağı tut · R2: saldırı · L1: koş / süzül · R1: dalış<br>Options: duraklat / devam · Share: ses<br>Menü: yön tuşları gezin · × seç · ○ geri<br>Dokunmatik: sol daire hareket, sağ daire bakış. Ağ ve süzülme düğmelerini basılı tut.</p>';
  document.body.append(bilgi);

  function dinle(h,a,f,o){h.addEventListener(a,f,o);dinleyiciler.push([h,a,f,o]);}
  function kodGuncelle(k){const varmi=[...sahip.values()].some(v=>v===k);if(varmi&&!tuslar.has(k)){tuslar.add(k);yeni.add(k);}else if(!varmi&&tuslar.delete(k))birak.add(k);}
  function dugme(el,k){
    dinle(el,'pointerdown',e=>{if(G.durum!=='oyun')return;e.preventDefault();e.stopPropagation();sahip.set(e.pointerId,k);el.setPointerCapture(e.pointerId);el.dataset.basili='';kodGuncelle(k);});
    const bitir=e=>{if(sahip.get(e.pointerId)!==k)return;e.preventDefault();sahip.delete(e.pointerId);kodGuncelle(k);if(!tuslar.has(k))delete el.dataset.basili;};
    for(const a of ['pointerup','pointercancel','lostpointercapture'])dinle(el,a,bitir);
  }
  for(const [ad,k]of [['Zıpla','Space'],['Ağ','Fare2'],['Saldır','Fare0'],['Çekil','KeyE'],['Süzül','ShiftLeft'],['Dalış','KeyC'],['Dev','KeyQ'],['Kamçı','KeyF']]){const b=document.createElement('button');b.textContent=ad;b.setAttribute('aria-label',ad);katman.querySelector('.zifir-tuslar').append(b);dugme(b,k);}
  dugme(katman.querySelector('.zifir-durak'),'Escape');
  for(const [sec,hedef]of [['.sol',eksen],['.sag',bakis]]){
    const el=katman.querySelector(sec),top=el.querySelector('i');let id=null;
    function hareket(e){if(id!==e.pointerId)return;e.preventDefault();const r=el.getBoundingClientRect(),yaricap=r.width*.36;let x=(e.clientX-r.left-r.width/2)/yaricap,y=(e.clientY-r.top-r.height/2)/yaricap;const d=Math.max(1,Math.hypot(x,y));x/=d;y/=d;hedef.x=x;hedef.y=sec==='.sol'?-y:y;top.style.transform=`translate(${x*yaricap}px,${y*yaricap}px)`;}
    dinle(el,'pointerdown',e=>{if(id!==null||G.durum!=='oyun')return;id=e.pointerId;sahip.set(id,sec);el.setPointerCapture(id);hareket(e);});
    dinle(el,'pointermove',hareket);
    sifirla.push(()=>{const eski=id;id=null;hedef.x=hedef.y=0;top.style.transform='';if(eski!==null&&el.hasPointerCapture?.(eski))el.releasePointerCapture(eski);});
    const bitir=e=>{if(e.pointerId!==id)return;sahip.delete(id);id=null;hedef.x=hedef.y=0;top.style.transform='';};
    for(const a of ['pointerup','pointercancel','lostpointercapture'])dinle(el,a,bitir);
  }
  function temizle(){sahip.clear();for(const k of tuslar)birak.add(k);tuslar.clear();yeni.clear();eksen.x=eksen.y=bakis.x=bakis.y=0;for(const el of katman.querySelectorAll('[data-basili]'))delete el.dataset.basili;for(const el of katman.querySelectorAll('i'))el.style.transform='';for(const fn of sifirla)fn(); }
  dinle(window,'blur',temizle);dinle(document,'visibilitychange',()=>{if(document.hidden)temizle();});
  dinle(window,'touchmove',e=>{if(dokunmatik&&G.durum==='oyun')e.preventDefault();},{passive:false});
  let once=false,eskiTouch='';
  return {dokunmatik,tuslar,yeni,birak,eksen,bakis,temizle,
    guncelle(kol){const oyun=G.durum==='oyun';katman.hidden=!(dokunmatik&&oyun);if(once&&!oyun)temizle();if(dokunmatik&&oyun&&!once){eskiTouch=document.documentElement.style.touchAction;document.documentElement.style.touchAction='none';}if(dokunmatik&&once&&!oyun)document.documentElement.style.touchAction=eskiTouch;once=oyun;bilgi.hidden=!kol&&!dokunmatik;bilgi.querySelector('summary').textContent=kol?'🎮 Oyun kolu bağlı · kontroller':'Dokunmatik kontroller';},
    kapat(){temizle();if(dokunmatik&&once)document.documentElement.style.touchAction=eskiTouch;for(const [h,a,f,o]of dinleyiciler)h.removeEventListener(a,f,o);katman.remove();bilgi.remove();stil.remove();}
  };
}
