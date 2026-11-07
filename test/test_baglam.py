#!/usr/bin/env python3
"""WebGL bağlam kaybı. Çalıştır: flock /tmp/zifir_test.lock python3 test/test_baglam.py"""
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

def main():
    class Sessiz(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*args): pass
    sunucu=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Sessiz,directory=str(KOK)))
    threading.Thread(target=sunucu.serve_forever,daemon=True).start()
    port=bos_port()
    with tempfile.TemporaryDirectory(prefix='zifir-baglam-') as profil:
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
                ok=True
                def kontrol(ad,v):
                    nonlocal ok; ok=ok and bool(v); print(('GEÇTİ' if v else 'KALDI')+' '+ad)
                c.degerlendir("(()=>{window.__ext=G.renderer.getContext().getExtension('WEBGL_lose_context');window.__t0=G.t;return !!window.__ext})()")
                kontrol('WEBGL_lose_context var',c.degerlendir('!!window.__ext'))
                c.degerlendir("window.__ext.loseContext()")
                kontrol('Kayıpta oyun duraklar',bekle(lambda:c.degerlendir("G.durum==='duraklat'"),10))
                kontrol('Kayıpta çökme yok',c.degerlendir("(window.__ZIFIR_HATALAR||[]).length===0"))
                c.degerlendir("window.__ext.restoreContext()")
                kontrol('Geri gelince oyun devam eder',bekle(lambda:c.degerlendir("G.durum==='oyun'"),15))
                t1=c.degerlendir("G.t")
                kontrol('Zaman akıyor',bekle(lambda:c.degerlendir("G.t")>t1+0.1,30))
                kontrol('Hata listesi boş',c.degerlendir("(window.__ZIFIR_HATALAR||[]).length===0"))
                print('HATALAR',c.degerlendir('JSON.stringify(window.__ZIFIR_HATALAR)'))
                return 0 if ok else 1
            finally:
                if ws: ws.kapat()
                chrome.terminate()
                try: chrome.wait(timeout=8)
                except subprocess.TimeoutExpired: chrome.kill(); chrome.wait()
                sunucu.shutdown(); sunucu.server_close()

if __name__=='__main__': raise SystemExit(main())
