#!/usr/bin/env python3
"""DEVAM regresyonları. Çalıştır: flock /tmp/zifir_test.lock python3 test/test_devam.py"""
import base64
import functools
import http.server
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import threading
import urllib.request

from test_oyun import MiniWebSocket, CDP, bekle, bos_port, js_hizlandir

KOK = Path(__file__).resolve().parent.parent

TESTLER = r"""(async () => {
  const T = window.G.THREE;
  const M = await import('/js/oyuncu.js');
  const sonuc = [];
  const kontrol = (ad, ok, detay) => sonuc.push({ad, ok: !!ok, detay});
  function dunya() {
    const tus = new Set();
    const G = { THREE:T, durum:'oyun', t:0, kamera:new T.PerspectiveCamera(70,16/9,.1,2000),
      olay:{emit(){}}, girdi:{basili:k=>tus.has(k), yeniBasildi:()=>false, eksen:{x:0,y:0}},
      sehir:{binalar:[], zeminY:()=>0, carpis:()=>null, ankrajBul:()=>null, rastgeleCati:()=>new T.Vector3(0,60,0)} };
    M.kur(G); return {G,tus};
  }
  // Gerçek kamera merkez ışını üzerinde bir yüzey noktası üret; iki zıt hızda da
  // önizleme ve tıklama aynı noktayı ve aynı ışın yönünü kullanmalı.
  for (const vx of [-25,25]) {
    const {G,tus}=dunya();
    const yon=new T.Vector3(.25,.5,-1).normalize();
    G.kamera.getWorldDirection=out=>out.copy(yon);
    let sonIsin=null;
    G.sehir.ankrajBul=(bas,dir,mes)=> {
      if(mes<=40) return null;
      const nokta=bas.clone().addScaledVector(dir,35);
      sonIsin={bas:bas.clone(),yon:dir.clone(),nokta:nokta.clone()};
      return {nokta,normal:new T.Vector3(0,0,1)};
    };
    G.oyuncu.hiz.set(vx,0,0);
    M.guncelle(G,1/60);
    const once=G.oyuncu.nisanNokta?.clone(), isin=sonIsin;
    const merkez=once && once.clone().sub(isin.bas).normalize().distanceTo(yon)<1e-6;
    tus.add('Fare2'); M.guncelle(G,1/60);
    kontrol('Merkez ışını ve sağ tık, hız '+vx,merkez && once?.distanceTo(isin.nokta)<1e-6 && G.oyuncu.ankraj?.distanceTo(once)<1e-6,{oniz:once?.toArray(),ankraj:G.oyuncu.ankraj?.toArray(),yon:isin.yon.toArray()});
  }
  // El sırası yerine ankrajın tarafı belirleyici: iki ayrı bakışta da doğru el.
  for(const yan of [-1,1]) {
    const {G,tus}=dunya(); let el=null;
    G.kahraman={ayarla:a=>{el=a.el;},dokunac(){}};
    const yon=new T.Vector3(yan*.5,.5,-1).normalize();
    G.kamera.getWorldDirection=out=>out.copy(yon);
    G.sehir.ankrajBul=(bas,dir,mes)=>mes>40?{nokta:bas.clone().addScaledVector(dir,35),normal:new T.Vector3(0,0,1)}:null;
    M.guncelle(G,1/60); tus.add('Fare2'); M.guncelle(G,1/60);
    kontrol('Ankraj tarafına göre el '+yan,el===(yan<0?'sol':'sag'),{el,ankraj:G.oyuncu.ankraj?.toArray()});
  }
  // Koni dışındaki yakın bina seçilmemeli; içerideki uygun bina hedeflenmeli.
  {
    const {G}=dunya(); G.kamera.getWorldDirection=out=>out.set(0,0,-1);
    M.guncelle(G,1/60);
    const c=G.kamera.position.clone();
    const bina=(x,z)=>({kutu:new T.Box3(new T.Vector3(c.x+x-1,0,c.z+z-1),new T.Vector3(c.x+x+1,100,c.z+z+1))});
    const uygun=bina(8,-35), dis=bina(25,-16);
    G.sehir.binalar=[dis,uygun]; M.guncelle(G,1/60);
    const n=G.oyuncu.nisanNokta, d=n?.clone().sub(G.kamera.position).normalize();
    kontrol('25 derece koni uygun binayı seçer', n && uygun.kutu.containsPoint(n) && d.dot(new T.Vector3(0,0,-1))>=Math.cos(25*Math.PI/180)-.001,{nokta:n?.toArray(),aci:d?Math.acos(d.dot(new T.Vector3(0,0,-1)))*180/Math.PI:null});
  }
  // Bina bulunmasa da gökyüzü hedefi önizlenir ve aynı noktaya bağlanır.
  {
    const {G,tus}=dunya(); M.guncelle(G,1/60);
    const once=G.oyuncu.nisanNokta?.clone(); tus.add('Fare2'); M.guncelle(G,1/60);
    kontrol('Gökyüzü önizlemesi = ankraj', once && G.oyuncu.ankraj?.distanceTo(once)<1e-6, {oniz:once?.toArray(),ankraj:G.oyuncu.ankraj?.toArray()});
  }
  // İki uçuş hali gerçekten fiziğe girer ve bütün konumlar sonlu kalır.
  for (const [tusAdi,durum] of [['ShiftLeft','suzul'],['KeyC','dalis']]) {
    const {G,tus}=dunya(); G.oyuncu.hiz.set(12,-12,0); tus.add(tusAdi);
    for(let i=0;i<15;i++) M.guncelle(G,1/60);
    kontrol('Uçuş fiziği '+durum,G.oyuncu.durum===durum && [...G.oyuncu.konum.toArray(),...G.oyuncu.hiz.toArray()].every(Number.isFinite),{durum:G.oyuncu.durum,hiz:G.oyuncu.hiz.toArray()});
  }
  // Gerçek yüklenmiş kahramanın kanat/dalış geçişleri ve geometri tamponları.
  const G=window.G, K=await import('/js/kahraman.js');
  G.durum='duraklat';
  for(const durum of ['suzul','dalis','dur']) {
    for(let i=0;i<35;i++) { G.kahraman.ayarla({durum,hiz:new T.Vector3(12,-12,0),yerde:durum==='dur',dev:false,dt:1/60}); K.guncelle(G,1/60); }
    let bozuk=0, gorunen=0;
    G.sahne.traverse(o=>{
      if(![...o.position.toArray(),...o.quaternion.toArray(),...o.scale.toArray()].every(Number.isFinite)) bozuk++;
      if(o.visible && o.isMesh) gorunen++;
      const a=o.geometry?.attributes?.position?.array;
      if(a && !a.every(Number.isFinite)) bozuk++;
    });
    const zar=G.sahne.getObjectByName('zifir-jole-kanat'), iz=G.sahne.getObjectByName('zifir-dalis-izi');
    const poz=durum==='suzul' ? zar?.visible : durum==='dalis' ? !zar?.visible && iz?.visible : !zar?.visible && !iz?.visible;
    kontrol('Gerçek model sonlu ve doğru görünürlük '+durum,bozuk===0 && gorunen>0 && poz,{bozuk,gorunen,zar:zar?.visible,iz:iz?.visible});
  }
  G.durum='oyun';
  for(const repeat of [false,true]) {
    const e=new KeyboardEvent('keydown',{code:'KeyW',key:'w',ctrlKey:true,repeat,bubbles:true,cancelable:true});
    window.dispatchEvent(e);
    kontrol('Ctrl+W preventDefault repeat='+repeat,e.defaultPrevented,{defaultPrevented:e.defaultPrevented});
  }
  window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',bubbles:true}));
  G.durum='menu';
  const A=await import('/js/arayuz.js'); A.guncelle(G,1/60);
  const cikis=document.querySelector('button[data-k="cikis"]');
  let kapat=0; const gercekClose=window.close;
  try { window.close=()=>{kapat++}; cikis?.click(); }
  finally { window.close=gercekClose; }
  kontrol('Ana menü Çıkış kapatmayı çağırır',!!cikis && kapat===1,{buton:cikis?.textContent,kapat});
  kontrol('Oyun hata listesi boş',!(window.__ZIFIR_HATALAR?.length),window.__ZIFIR_HATALAR);
  return sonuc;
})()"""


def main():
    class Sessiz(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*args): pass
    sunucu=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Sessiz,directory=str(KOK)))
    threading.Thread(target=sunucu.serve_forever,daemon=True).start()
    port=bos_port()
    with tempfile.TemporaryDirectory(prefix='zifir-devam-') as profil:
        with open(Path(profil)/'chrome.log','wb') as log:
            chrome=subprocess.Popen([shutil.which('google-chrome'),'--headless=new','--use-angle=swiftshader','--enable-unsafe-swiftshader',f'--remote-debugging-port={port}','--remote-allow-origins=*',f'--user-data-dir={profil}','--window-size=1280,720','--no-first-run','--disable-dev-shm-usage','--mute-audio','about:blank'],stdout=log,stderr=log)
            ws=None
            try:
                def hedef():
                    with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list',timeout=2) as r:
                        return next((h for h in json.load(r) if h.get('type')=='page'),None)
                h=bekle(hedef,25)
                if not h: raise RuntimeError('Chrome CDP açılamadı')
                ws=MiniWebSocket(h['webSocketDebuggerUrl']); c=CDP(ws)
                c.komut('Page.enable'); c.komut('Runtime.enable')
                c.komut('Page.navigate',{'url':f'http://127.0.0.1:{sunucu.server_port}/?test=1'})
                if not bekle(lambda:c.degerlendir('!!(window.G?.kahraman && window.G?.oyuncu && window.G.t>.2 && window.G.sahne.getObjectByName("zifir-jole-kanat"))'),60): raise RuntimeError('Oyun yüklenemedi')
                c.degerlendir(js_hizlandir())
                sonuc=c.degerlendir(TESTLER,promise=True)
                for s in sonuc: print(('GEÇTİ' if s['ok'] else 'KALDI')+' '+s['ad']+' '+json.dumps(s.get('detay'),ensure_ascii=False))
                Path(KOK/'RAPOR'/'devam_test.json').write_text(json.dumps(sonuc,ensure_ascii=False,indent=2)+'\n')
                shot=c.komut('Page.captureScreenshot',{'format':'png'})
                (KOK/'RAPOR'/'devam_test.png').write_bytes(base64.b64decode(shot['data']))
                return 0 if all(s['ok'] for s in sonuc) else 1
            finally:
                if ws: ws.kapat()
                chrome.terminate()
                try: chrome.wait(timeout=8)
                except subprocess.TimeoutExpired: chrome.kill(); chrome.wait()
                sunucu.shutdown(); sunucu.server_close()

if __name__=='__main__': raise SystemExit(main())
