"""Sade dokunmatik kumanda testi (CDP touch emulation). Çalıştır: flock /tmp/zifir_test.lock python3 test/test_mobil.py"""
import sys, functools, http.server, threading, tempfile, subprocess, urllib.request, json, time, base64
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_oyun import MiniWebSocket, CDP, bekle, bos_port
root = Path(__file__).resolve().parent.parent
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(root)))
threading.Thread(target=server.serve_forever, daemon=True).start()
port = bos_port(); sonuc = []
def kontrol(ad, ok, detay=''):
    sonuc.append(bool(ok)); print(('OK  ' if ok else 'HATA'), ad, detay, flush=True)
with tempfile.TemporaryDirectory(prefix='zifir-mobil-') as profile:
    chrome = subprocess.Popen(['google-chrome', '--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-first-run', f'--user-data-dir={profile}', f'--remote-debugging-port={port}', '--remote-allow-origins=*', 'about:blank'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    def targets():
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list', timeout=2) as f: return json.load(f)
        except Exception: return []
    try:
        h = bekle(lambda: next((t for t in targets() if t['type'] == 'page'), None), 25)
        c = CDP(MiniWebSocket(h['webSocketDebuggerUrl']))
        for (w, hh, ad) in [(844, 390, 'mobil_sade'), (740, 360, 'mobil_sade_740')]:
            c.komut('Emulation.setDeviceMetricsOverride', {'width': w, 'height': hh, 'deviceScaleFactor': 2, 'mobile': True, 'screenOrientation': {'type': 'landscapePrimary', 'angle': 90}})
            c.komut('Emulation.setTouchEmulationEnabled', {'enabled': True, 'maxTouchPoints': 5})
            c.komut('Page.navigate', {'url': f'http://127.0.0.1:{server.server_port}/?yatay=1'})
            assert bekle(lambda: c.degerlendir('!!window.G?.arayuz && !!window.G?.girdi'), 90)
            kontrol(f'{w}x{hh} dokunmatik algılandı', c.degerlendir("!!document.querySelector('.zifir-dokun')"))
            time.sleep(1)
            c.degerlendir("document.querySelector('[data-k=oyna]').click()")
            assert bekle(lambda: c.degerlendir("G.durum==='oyun'"), 30)
            time.sleep(3)
            def rect(sel):
                return c.degerlendir(f"(()=>{{const r=document.querySelector('{sel}').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,r.width,r.height]}})()")
            def dokun(tip, pts):
                c.komut('Input.dispatchTouchEvent', {'type': tip, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in enumerate(pts)]})
            butonlar = c.degerlendir("[...document.querySelectorAll('.zifir-dokun button')].filter(b=>!b.hidden).map(b=>b.getAttribute('aria-label'))")
            kontrol('görünür düğme <= 5 (4 + duraklat)', len(butonlar) <= 5, str(butonlar))
            for s in ['.zifir-ag', '.zifir-zipla', '.zifir-saldir', '.zifir-ozel', '.zifir-durak']:
                r = rect(s); kontrol(f'{s} boyut >= 48 ve ekran içinde', min(r[2], r[3]) >= 48 and r[0] + r[2]/2 <= w and r[1] + r[3]/2 <= hh, str([round(v) for v in r]))
            kontrol('kontroller kutusu oyunda gizli', c.degerlendir("document.querySelector('.zifir-kol').hidden"))
            if ad == 'mobil_sade':
                shot = c.komut('Page.captureScreenshot', {'format': 'png'}); (root / f'RAPOR/{ad}.png').write_bytes(base64.b64decode(shot['data']))
            # Hareket: sol yarıda sürükle -> eksen
            dokun('touchStart', [(120, 250)]); dokun('touchMove', [(120, 210)]); time.sleep(.3)
            e = c.degerlendir('({...G.girdi.eksen})'); kontrol('yüzen çubuk: yukarı sürükle -> eksen.y>0.5', e['y'] > .5, str(e))
            p0 = c.degerlendir('[G.oyuncu.konum.x,G.oyuncu.konum.z]'); p1 = bekle(lambda: (lambda q: q if abs(p0[0]-q[0]) + abs(p0[1]-q[1]) > .5 else None)(c.degerlendir('[G.oyuncu.konum.x,G.oyuncu.konum.z]')), 12) or p0
            kontrol('oyuncu hareket etti', p1 != p0, f'{p0}->{p1}')
            dokun('touchEnd', []); time.sleep(.2)
            kontrol('bırakınca eksen 0', bekle(lambda: c.degerlendir('G.girdi.eksen.y') == 0, 5))
            # Bakış: sağ boş alanda sürükle
            ref = c.degerlendir('G.kamera ? G.kamera.rotation.y : 0')
            b = []
            c.degerlendir('window.__yaw=()=>{const v=new G.THREE.Vector3();G.kamera.getWorldDirection(v);return Math.atan2(v.x,v.z)};window.__y0=window.__yaw()')
            dokun('touchStart', [(500, 150)])
            for i in range(1, 12): dokun('touchMove', [(500 + i*12, 150)]); time.sleep(.03)
            dokun('touchEnd', []); time.sleep(.3)
            bak = c.degerlendir('Math.abs(window.__yaw()-window.__y0)'); kontrol('sağ yarı sürükle -> kamera döndü', bak > .05, str(bak))
            y1 = c.degerlendir('window.__yaw()'); time.sleep(.4); kontrol('bırakınca kamera durur', abs(c.degerlendir('window.__yaw()')-y1) < .01)
            # Düğmeler -> tuşlar
            for sel, kod in [('.zifir-ag', 'Fare2'), ('.zifir-zipla', 'Space'), ('.zifir-saldir', 'Fare0')]:
                r = rect(sel); dokun('touchStart', [(r[0], r[1])])
                kontrol(f'{sel} -> {kod} basılı', bekle(lambda: c.degerlendir(f"G.girdi.basili('{kod}')"), 5))
                dokun('touchEnd', [])
                kontrol(f'{sel} bırakınca {kod} yok', bekle(lambda: not c.degerlendir(f"G.girdi.basili('{kod}')"), 5))
            # Özel düğme bağlam: yerde KAMÇI, havada DALIŞ
            c.degerlendir("G.oyuncu.durum='yuru'"); time.sleep(.15)
            kontrol('ÖZEL yerde etiket', c.degerlendir("document.querySelector('.zifir-ozel span').textContent") in ('KAMÇI', 'ÇEKİL', 'DALIŞ'), c.degerlendir("document.querySelector('.zifir-ozel span').textContent"))
            # Aynı anda iki parmak: hareket + bakış + ağ
            r = rect('.zifir-ag'); dokun('touchStart', [(120, 250), (500, 150), (r[0], r[1])]); dokun('touchMove', [(160, 250), (540, 150), (r[0], r[1])]); time.sleep(.3)
            m = c.degerlendir("({e:G.girdi.eksen.x,ag:G.girdi.basili('Fare2')})"); kontrol('3 parmak birlikte (hareket+bakış+ağ)', m['e'] > .5 and m['ag'], str(m))
            dokun('touchEnd', []); time.sleep(.2)
                        # Dev düğmesi güç doluyken
            c.degerlendir("G.oyuncu.guc=G.oyuncu.gucMax"); time.sleep(.3)
            kontrol('DEV güç dolunca görünür', bekle(lambda: c.degerlendir("!document.querySelector('.zifir-dev').hidden"), 6))
            c.degerlendir("G.oyuncu.guc=0"); time.sleep(.3)
            kontrol('DEV güç yokken gizli', bekle(lambda: c.degerlendir("document.querySelector('.zifir-dev').hidden"), 6))
            # Oto süzül: havada ZIPLA basılı tut
            c.degerlendir("G.oyuncu.konum.y+=60;G.oyuncu.hiz.set(0,-2,0);G.oyuncu.yerde=false"); time.sleep(.3)
            r = rect('.zifir-zipla'); dokun('touchStart', [(r[0], r[1])])
            kontrol('havada ZIPLA basılı -> süzül (Shift)', bekle(lambda: c.degerlendir("G.girdi.basili('ShiftLeft')"), 6), c.degerlendir("G.oyuncu.durum"))
            dokun('touchEnd', [])
            kontrol('bırakınca Shift yok', bekle(lambda: not c.degerlendir("G.girdi.basili('ShiftLeft')"), 5))
            # Duraklat
            r = rect('.zifir-durak'); dokun('touchStart', [(r[0], r[1])]); dokun('touchEnd', []); time.sleep(.6)
            kontrol('duraklat çalışır', c.degerlendir("G.durum")!='oyun', c.degerlendir("G.durum"))
            if ad == 'mobil_sade':
                kontrol('duraklatta kontrol kutusu görünür', not c.degerlendir("document.querySelector('.zifir-kol').hidden"))
    finally:
        if chrome.poll() is None: chrome.terminate()
        try: chrome.wait(timeout=10)
        except subprocess.TimeoutExpired: chrome.kill(); chrome.wait()
        server.shutdown(); server.server_close()
print(f'SONUC {sum(sonuc)}/{len(sonuc)}'); sys.exit(0 if all(sonuc) else 1)
