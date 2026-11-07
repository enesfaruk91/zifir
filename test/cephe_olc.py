#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cephe ölçümü: gerçek GPU, görünür Chrome. Üç kamerada ekran görüntüsü + çizim çağrısı/üçgen + sabit kamerada FPS.
Kullanım: flock /tmp/zifir_test.lock python3 test/cephe_olc.py <önek> [kalite] [saat]
  önek: RAPOR/cephe  -> RAPOR/cephe_1.png (sokak) _2 (çatı) _3 (kuşbakışı)"""
import base64, importlib.util, json, shutil, subprocess, sys, tempfile, time
from pathlib import Path
KOK = Path(__file__).resolve().parent.parent
sp = importlib.util.spec_from_file_location("t", KOK / "test" / "test_oyun.py"); T = importlib.util.module_from_spec(sp); sp.loader.exec_module(T)
SAYAC = r"""
(() => { const r = G.renderer, c = G.composer; r.info.autoReset = false; window.__S = { kare: 0, calls: 0, tri: 0, t0: performance.now(), maxCalls: 0 };
  const eski = c.render.bind(c);
  c.render = function (...a) { r.info.reset(); eski(...a); const S = window.__S; S.kare++; S.calls += r.info.render.calls; S.tri += r.info.render.triangles; S.maxCalls = Math.max(S.maxCalls, r.info.render.calls); };
})()"""
def main():
    onek = sys.argv[1]; kalite = sys.argv[2] if len(sys.argv) > 2 else "orta"; saat = sys.argv[3] if len(sys.argv) > 3 else ""
    port = T.bos_port(); T.CDP_PORT = port
    prof = tempfile.mkdtemp(prefix="zifir-ceph-")
    chrome = shutil.which("google-chrome") or shutil.which("google-chrome-stable")
    ch = subprocess.Popen([chrome, "--window-size=960,540", "--window-position=50,50", f"--remote-debugging-port={port}", "--remote-allow-origins=*", f"--user-data-dir={prof}",
        "--no-first-run", *(["--disable-gpu-vsync", "--disable-frame-rate-limit"] if __import__("os").environ.get("UNCAP") else []), "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--mute-audio", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    sonuc = {}
    try:
        T.bekle(lambda: T.http_json("/json/version"), 25, 0.3)
        hedef = T.bekle(lambda: next((h for h in T.http_json("/json/list") if h.get("type") == "page"), None), 15, 0.3)
        cdp = T.CDP(T.MiniWebSocket(hedef["webSocketDebuggerUrl"]))
        cdp.komut("Page.enable"); cdp.komut("Runtime.enable")
        for i, kam in enumerate(["5", "6", "2", "7"], 1):
            cdp.komut("Page.navigate", {"url": f"http://127.0.0.1:{T.PORT}/?test=1&sehirkam={kam}" + (f"&saat={saat}" if saat else "")})
            time.sleep(1.5)
            T.bekle(lambda: cdp.degerlendir("!!(window.G && G.t > 0.15 && G.sehir && G.oyuncu)"), 60, 0.3)
            cdp.degerlendir(f"G.kaliteAyarla('{kalite}', false)")
            time.sleep(5)
            cdp.degerlendir(SAYAC); time.sleep(6)
            s = cdp.degerlendir("(() => { const S = window.__S; return { fps: S.kare / ((performance.now() - S.t0) / 1000), calls: S.calls / S.kare, maxCalls: S.maxCalls, tri: S.tri / S.kare, kare: S.kare, hata: (window.__ZIFIR_HATALAR || []).length }; })()")
            if kam == "5": print("MESH:", cdp.degerlendir("(() => { let m = 0, g = 0, im = 0; G.sahne.traverse(o => { if (o.isMesh && o.visible && (!o.isInstancedMesh || o.count > 0)) { m++; if (o.castShadow) g++; if (o.isInstancedMesh) im++; } }); return JSON.stringify({gorunen: m, golgeli: g, instanced: im, sehir: G.sehir.cephe}); })()"))
            r = cdp.komut("Page.captureScreenshot", {"format": "png"})
            Path(KOK / f"{onek}_{i}.png").write_bytes(base64.b64decode(r["data"]))
            sonuc[f"kam{kam}"] = s
        print(json.dumps(sonuc, indent=1))
    finally:
        ch.terminate(); shutil.rmtree(prof, ignore_errors=True)
main()
