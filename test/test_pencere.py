"""Gerçek Chrome app çıkışı ve tam ekran klavye kilidi kabul testi."""
import sys, functools, http.server, threading, tempfile, subprocess, urllib.request, json, time, base64
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from test_oyun import MiniWebSocket,CDP,bekle,bos_port
root=Path(__file__).resolve().parent.parent
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
port=bos_port()
with tempfile.TemporaryDirectory(prefix='zifir-window-') as profile:
 with open('/tmp/zifir-window.log','wb') as log:
  chrome=subprocess.Popen(['google-chrome','--headless=new','--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-scripts-to-close-windows','--no-first-run',f'--user-data-dir={profile}',f'--remote-debugging-port={port}','--remote-allow-origins=*','--window-size=1280,720',f'--app=http://127.0.0.1:{server.server_port}/'],stdout=log,stderr=log)
  def targets():
   try:
    with urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list',timeout=2) as f:return json.load(f)
   except:return []
  try:
   h=bekle(lambda:next((t for t in targets() if t['type']=='page'),None),25)
   ws=MiniWebSocket(h['webSocketDebuggerUrl']); c=CDP(ws)
   assert bekle(lambda:c.degerlendir('!!window.G?.arayuz && !!window.G?.girdi'),60)
   time.sleep(2)
   shot=c.komut('Page.captureScreenshot',{'format':'png'})
   (root/'RAPOR/menu_cikis.png').write_bytes(base64.b64decode(shot['data']))
   assert c.degerlendir("!!document.querySelector('[data-k=cikis]')")
   try:c.komut('Browser.setPermission',{'permission':{'name':'keyboard-lock'},'setting':'granted'})
   except Exception as e:print('permission',str(e),flush=True)
   c.degerlendir("document.querySelector('[data-k=oyna]').click()")
   state=bekle(lambda:c.degerlendir("G.girdi.klavyeKilitli && {fullscreen:!!document.fullscreenElement,keyboard:G.girdi.klavyeKilitli,pointer:!!document.pointerLockElement}"),15)
   print('KILIT',state,flush=True)
   assert state, 'Tam ekran klavye kilidi etkinleşmedi'
   for key in ['KeyC', 'ControlLeft', 'ControlRight']:
    assert c.degerlendir("""(async () => {
      const key=%s;
      dispatchEvent(new KeyboardEvent('keydown',{code:key,bubbles:true,cancelable:true}));
      await new Promise(requestAnimationFrame);
      const down=G.girdi.basili(key);
      dispatchEvent(new KeyboardEvent('keyup',{code:key,bubbles:true}));
      await new Promise(requestAnimationFrame);
      return down && !G.girdi.basili(key);
    })()""" % json.dumps(key),promise=True), key+' giriş akışı başarısız'
   print('C_VE_CTRL_GIRIS',True,flush=True)
   c.degerlendir("G.durum='menu'; G.girdi.serbestBirak()")
   time.sleep(.5)
   assert c.degerlendir("!G.girdi.klavyeKilitli && !document.pointerLockElement")
   assert c.degerlendir("!!document.querySelector('[data-k=cikis]')")
   ws.gonder(json.dumps({'id':999,'method':'Runtime.evaluate','params':{'expression':"document.querySelector('[data-k=cikis]').click()",'userGesture':True}}))
   closed=bekle(lambda:chrome.poll() is not None or not any(t.get('id')==h['id'] for t in targets()),10)
   print('GERCEK_CIKIS',closed,flush=True)
   assert closed
  finally:
   if chrome.poll() is None:chrome.terminate()
   try: chrome.wait(timeout=10)
   except subprocess.TimeoutExpired: chrome.kill(); chrome.wait()
   server.shutdown(); server.server_close()
