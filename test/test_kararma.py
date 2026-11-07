#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Kararma/titreme ölçümü: her karede ekran parlaklığı + pozlama + ışık/program sayısı.
Kullanım: flock /tmp/zifir_test.lock python3 test/test_kararma.py [saniye] [url-eki]
Çıkış 0 = ani kararma yok."""
import importlib.util, json, shutil, subprocess, sys, tempfile, time
from pathlib import Path
KOK = Path(__file__).resolve().parent.parent
sp = importlib.util.spec_from_file_location("t", KOK / "test" / "test_oyun.py"); T = importlib.util.module_from_spec(sp); sp.loader.exec_module(T)

PROBE = r"""
(() => {
  const G = window.G, gl = G.renderer.getContext(), c = G.composer, K = (window.__K = []);
  const dbg = gl.getExtension('WEBGL_debug_renderer_info'); window.__GPU = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '?'; window.__NAN = { render: 0, bloom: 0, kare: 0 };
  const nanSay = () => { const rt = c.readBuffer, w = rt.width, h = rt.height; const b = new Uint16Array(w * h * 4);
    try { G.renderer.readRenderTargetPixels(rt, 0, 0, w, h, b); } catch (e) { return -1; }
    let n = 0; for (let i = 0; i < b.length; i++) if ((b[i] & 0x7c00) === 0x7c00) n++; return n; };
  if (window.__NANIZLE) c.passes.forEach((p, i) => { if (i > 2) return; const r = p.render.bind(p); p.render = function (...a) { r(...a); const n = nanSay(); if (n > 0) window.__NAN[i === 0 ? 'render' : 'bloom'] += n; }; });
  const eski = c.render.bind(c); let px = null; const KB = (G.sehir && G.sehir.binalar || []).map(b => b.kutu); let oncekiProg = new Set();
  c.render = function (...a) {
    eski(...a);
    const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
    if (!px || px.length !== w * h * 4) px = new Uint8Array(w * h * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let s = 0, n = 0; for (let i = 0; i < px.length; i += 4 * 37) { s += px[i] * .2126 + px[i + 1] * .7152 + px[i + 2] * .0722; n++; }
    let L = 0; G.sahne.traverse(o => { if (o.isLight && o.visible) L++; });
    K.push({ t: performance.now(), l: s / n / 255, exp: G.renderer.toneMappingExposure, L, prog: G.renderer.info.programs.length,
      fog: G.sahne.fog && G.sahne.fog.density, w, h, gdt: G.gercekDt, kal: G.kalite, dur: G.oyuncu && G.oyuncu.durum,
      kam: G.kamera.position.y, ic: (G.sehir && G.sehir.kesin) ? (G.sehir.binaIcinde(G.kamera.position.x, G.kamera.position.y, G.kamera.position.z, 0.02) >= 0 ? 1 : 0) : KB.some(k => G.kamera.position.x > k.min.x && G.kamera.position.x < k.max.x && G.kamera.position.z > k.min.z && G.kamera.position.z < k.max.z && G.kamera.position.y > k.min.y && G.kamera.position.y < k.max.y) ? 1 : 0,
      yeni: (() => { const ad = G.renderer.info.programs.map(p => p.name + '#' + p.id); const y = ad.filter(a => !oncekiProg.has(a)); oncekiProg = new Set(ad); return y.length > 3 && K.length > 0 ? y.length + 'ilk' : y.join(',') + (y.length ? '@' + G.renderer.info.programs.filter(p => y.includes(p.name + '#' + p.id)).map(p => p.cacheKey.replace(/\s+/g,'').slice(0, 400)).join('|') : ''); })() });
  };
})()
"""
OZET = r"""
(() => { const K = window.__K, out = []; const w = 24;
  for (let i = w; i < K.length; i++) { const m = K.slice(i - w, i).map(k => k.l).sort((a, b) => a - b)[w >> 1];
    if (m > 0.02 && K[i].l < m * 0.6) out.push([i, +K[i].l.toFixed(2), +m.toFixed(2), K[i].dur, K[i].kal]); }
  const uniq = f => [...new Set(K.map(f))];
  return { kare: K.length, karanlik: out.slice(0, 40), nKaranlik: out.length, exp: uniq(k => k.exp.toFixed(3)), L: uniq(k => k.L), prog: uniq(k => k.prog),
    boyut: uniq(k => k.w + 'x' + k.h), kal: uniq(k => k.kal), sure: (K[K.length - 1].t - K[0].t) / 1000,
    progIdx: K.map((k, i) => i && K[i].prog !== K[i - 1].prog ? [i, K[i - 1].prog, K[i].prog, K[i].dur, K[i].w, K[i].h] : null).filter(Boolean), kamBinaIci: K.filter(k => k.ic).length, yeniProg: K.map((k, i) => k.yeni && i ? i + ':' + k.yeni : null).filter(Boolean).slice(0, 12), siyah: K.filter(k => k.l < 0.05).length, kaliteGecis: K.map((k, i) => i && k.kal !== K[i - 1].kal ? [i, K[i - 1].kal, k.kal, Math.round(k.t - K[i - 1].t) + 'ms'] : null).filter(Boolean), arMax: Math.round(Math.max(...K.map((k, i) => i ? k.t - K[i - 1].t : 0))), gdtMax: Math.max(...K.map(k => k.gdt)), lMin: Math.min(...K.map(k => k.l)), lMax: Math.max(...K.map(k => k.l)) }; })()
"""
sys.argv0 = list(sys.argv)
def main():
    gercek = "--gercek" in sys.argv; nan = "--nan" in sys.argv; kd = "--kalite" in sys.argv; sys.argv = [a for a in sys.argv if not a.startswith("--")]
    sure = float(sys.argv[1]) if len(sys.argv) > 1 else 40
    ek = sys.argv[2] if len(sys.argv) > 2 else ""
    port = T.bos_port(); T.CDP_PORT = port
    prof = tempfile.mkdtemp(prefix="zifir-kar-")
    chrome = shutil.which("google-chrome") or shutil.which("google-chrome-stable")
    bayrak = ["--window-size=960,540", "--window-position=50,50"] if gercek else ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--window-size=320,180"]
    ch = subprocess.Popen([chrome, *bayrak, f"--remote-debugging-port={port}", "--remote-allow-origins=*", f"--user-data-dir={prof}",
        "--no-first-run", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--mute-audio", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=open("/tmp/claude-1000/-home-enes/b5c20b3c-b1c6-4258-8c74-bf9ccc657ac7/scratchpad/chrome_err.txt", "wb"))
    try:
        T.bekle(lambda: T.http_json("/json/version"), 25, 0.3)
        hedef = T.bekle(lambda: next((h for h in T.http_json("/json/list") if h.get("type") == "page"), None), 15, 0.3)
        cdp = T.CDP(T.MiniWebSocket(hedef["webSocketDebuggerUrl"]))
        cdp.komut("Page.enable"); cdp.komut("Runtime.enable"); cdp.komut("Log.enable")
        cdp.komut("Page.navigate", {"url": f"http://127.0.0.1:{T.PORT}/?{'' if kd else 'test=1'}{ek}"})
        T.bekle(lambda: cdp.degerlendir("!!(window.G && G.t > 0.15 && G.oyuncu && G.oyuncu.konum)"), 60, 0.3)
        if "nokalite" in sys.argv:  # test dışı oyun gibi: otomatik kalite düşürme açık kalsın (bilgi amaçlı)
            pass
        if kd: cdp.degerlendir("G.durum='oyun'; G.kaliteAyarla('yuksek', false)")
        cdp.degerlendir("window.__NANIZLE=" + ("true" if nan else "false"))
        cdp.degerlendir(PROBE)
        print("GPU:", cdp.degerlendir("window.__GPU"))
        def tus(tip, kod, key, vk):
            cdp.degerlendir(f"window.dispatchEvent(new KeyboardEvent('{'keyup' if tip == 'keyUp' else 'keydown'}', {{code: '{kod}', key: '{key.strip() or 'Space'}', bubbles: true}}))")
        t0 = time.time(); i = 0
        tus("rawKeyDown", "KeyW", "w", 87)
        while time.time() - t0 < sure:
            i += 1
            if '--ayikla' in sys.argv0: print(i, cdp.degerlendir('G.durum+" "+document.visibilityState+" "+G.oyuncu.durum'), flush=True)
            if i % 5 == 0: tus("rawKeyDown", "Space", " ", 32); time.sleep(.05); tus("keyUp", "Space", " ", 32)
            if i % 7 == 0: cdp.degerlendir("window.dispatchEvent(new MouseEvent('mousedown',{button:2,bubbles:true}))"); time.sleep(.3); cdp.degerlendir("window.dispatchEvent(new MouseEvent('mouseup',{button:2,bubbles:true}))")
            if i % 9 == 0: cdp.degerlendir("G.efekt.sars(.6,.4);G.efekt.flas('#ff2020',.25);G.efekt.yavasCekim(.4,.5);G.efekt.vurusDuraklat(.06)")
            if i % 11 == 0: cdp.degerlendir("G.olay.emit('hasar',{})")
            time.sleep(.2)
        tus("keyUp", "KeyW", "w", 87)
        r = cdp.degerlendir(OZET)
        r['nan'] = cdp.degerlendir('window.__NAN'); print(json.dumps(r, indent=1, ensure_ascii=False)[:6000])
        return 1 if r["nKaranlik"] else 0
    except Exception as e:
        print('HATA', e, 'chrome_poll=', ch.poll(), [o.get('method') for o in cdp.olaylar[-6:]], [str(o['params'].get('args'))[:150] for o in cdp.olaylar[-6:-1]]); raise
    finally:
        ch.terminate()
        shutil.rmtree(prof, ignore_errors=True)
sys.exit(main())
