#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ZİFİR otomatik test botu.

Başsız Chrome + Chrome DevTools Protocol (websocket) ile oyunu ?test=1 modunda
açar, window.G üzerinden sözleşmedeki 9 kontrolü yapar ve sonucu
RAPOR/test_bot.md dosyasına yazar.

Kullanım:  python3 test/test_oyun.py

Not: Oyun kodu DEĞİŞTİRİLMEZ. Yalnız test/ ve RAPOR/test_bot.md yazılır.
websocket-client kurulmasın diye minimal websocket istemcisi stdlib ile yazıldı.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import shutil
import socket
import struct
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
PORT = 8765
CDP_PORT = 9333
OYUN_URL = f"http://127.0.0.1:{PORT}/?test=1"
RAPOR = KOK / "RAPOR" / "test_bot.md"
CHROME_LOG = Path("/tmp/zifir_test_chrome.log")

MODULLER = ["girdi", "sehir", "kahraman", "oyuncu", "dusman", "gorev", "ses", "arayuz"]
HATA_DESENI = re.compile(r"uncaught|THREE\.WebGLProgram|shader", re.I)


# ---------------------------------------------------------------------------
# Minimal websocket istemcisi (RFC 6455, yalnız metin çerçeveleri)
# ---------------------------------------------------------------------------
class WebSocketHatasi(RuntimeError):
    pass


class MiniWebSocket:
    def __init__(self, url: str, timeout: float = 180.0):
        if not url.startswith("ws://"):
            raise WebSocketHatasi(f"Desteklenmeyen websocket adresi: {url}")
        kalan = url[5:]
        hostport, _, self.yol = kalan.partition("/")
        self.yol = "/" + self.yol
        host, _, port = hostport.partition(":")
        port = int(port or 80)
        self.sock = socket.create_connection((host, port), timeout=10)
        self.sock.settimeout(timeout)
        self.buf = b""

        anahtar = base64.b64encode(os.urandom(16)).decode("ascii")
        istek = (
            f"GET {self.yol} HTTP/1.1\r\n"
            f"Host: {host}:{port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {anahtar}\r\n"
            "Sec-WebSocket-Version: 13\r\n"
            "\r\n"
        )
        self.sock.sendall(istek.encode("ascii"))
        yanit = b""
        while b"\r\n\r\n" not in yanit:
            parca = self.sock.recv(4096)
            if not parca:
                raise WebSocketHatasi("Websocket el sıkışması yarıda kesildi")
            yanit += parca
        basliklar, _, kalan_veri = yanit.partition(b"\r\n\r\n")
        self.buf = kalan_veri
        satirlar = basliklar.decode("latin-1").split("\r\n")
        if " 101 " not in satirlar[0] + " ":
            raise WebSocketHatasi(f"Websocket reddedildi: {satirlar[0]}")
        beklenen = base64.b64encode(
            hashlib.sha1((anahtar + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode("ascii")).digest()
        ).decode("ascii")
        for satir in satirlar[1:]:
            ad, _, deger = satir.partition(":")
            if ad.strip().lower() == "sec-websocket-accept" and deger.strip() != beklenen:
                raise WebSocketHatasi("Sec-WebSocket-Accept doğrulanamadı")

    # -- düşük seviye ------------------------------------------------------
    def _tam_oku(self, n: int) -> bytes:
        while len(self.buf) < n:
            parca = self.sock.recv(max(4096, n - len(self.buf)))
            if not parca:
                raise WebSocketHatasi("Websocket bağlantısı kapandı")
            self.buf += parca
        veri, self.buf = self.buf[:n], self.buf[n:]
        return veri

    def _cerceve_gonder(self, veri: bytes, opcode: int = 0x1) -> None:
        bas = bytearray([0x80 | opcode])
        n = len(veri)
        if n < 126:
            bas.append(0x80 | n)
        elif n < 65536:
            bas.append(0x80 | 126)
            bas += struct.pack("!H", n)
        else:
            bas.append(0x80 | 127)
            bas += struct.pack("!Q", n)
        maske = os.urandom(4)
        bas += maske
        bas += bytes(b ^ maske[i % 4] for i, b in enumerate(veri))
        self.sock.sendall(bytes(bas))

    def gonder(self, metin: str) -> None:
        self._cerceve_gonder(metin.encode("utf-8"), 0x1)

    def mesaj_al(self) -> str:
        parcalar = b""
        ilk_opcode = None
        while True:
            b1, b2 = self._tam_oku(2)
            fin = bool(b1 & 0x80)
            opcode = b1 & 0x0F
            maskeli = bool(b2 & 0x80)
            uzunluk = b2 & 0x7F
            if uzunluk == 126:
                uzunluk = struct.unpack("!H", self._tam_oku(2))[0]
            elif uzunluk == 127:
                uzunluk = struct.unpack("!Q", self._tam_oku(8))[0]
            maske = self._tam_oku(4) if maskeli else None
            veri = self._tam_oku(uzunluk)
            if maske:
                veri = bytes(b ^ maske[i % 4] for i, b in enumerate(veri))
            if opcode == 0x8:
                raise WebSocketHatasi("Websocket sunucusu kapandı")
            if opcode == 0x9:
                self._cerceve_gonder(veri, 0xA)
                continue
            if opcode == 0xA:
                continue
            if opcode in (0x1, 0x2):
                parcalar = veri
                ilk_opcode = opcode
            elif opcode == 0x0:
                parcalar += veri
            if fin:
                if ilk_opcode == 0x2:
                    raise WebSocketHatasi("Beklenmeyen ikili websocket mesajı")
                return parcalar.decode("utf-8", "replace")

    def kapat(self) -> None:
        try:
            self._cerceve_gonder(b"", 0x8)
        except Exception:
            pass
        try:
            self.sock.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# CDP istemcisi
# ---------------------------------------------------------------------------
class CDP:
    def __init__(self, ws: MiniWebSocket):
        self.ws = ws
        self.sira = 0
        self.olaylar: list[dict] = []

    def komut(self, method: str, params: dict | None = None) -> dict:
        self.sira += 1
        kimlik = self.sira
        self.ws.gonder(json.dumps({"id": kimlik, "method": method, "params": params or {}}))
        while True:
            metin = self.ws.mesaj_al()
            try:
                mesaj = json.loads(metin)
            except json.JSONDecodeError:
                continue
            if mesaj.get("id") == kimlik:
                if "error" in mesaj:
                    raise RuntimeError(f"CDP {method}: {mesaj['error']}")
                return mesaj.get("result", {})
            self.olaylar.append(mesaj)

    def degerlendir(self, ifade: str, promise: bool = False) -> object:
        sonuc = self.komut("Runtime.evaluate", {
            "expression": ifade,
            "returnByValue": True,
            "awaitPromise": promise,
            "userGesture": True,
            "timeout": 60000,
        })
        if "exceptionDetails" in sonuc:
            ayrinti = sonuc["exceptionDetails"]
            raise RuntimeError("Sayfa değerlendirme hatası: " + json.dumps(ayrinti, ensure_ascii=False)[:500])
        return sonuc.get("result", {}).get("value")


def bekle(kosul, sure: float = 30.0, adim: float = 0.2):
    bitis = time.time() + sure
    son = None
    while time.time() < bitis:
        try:
            son = kosul()
            if son:
                return son
        except Exception:
            pass
        time.sleep(adim)
    return son


def http_json(yol: str) -> dict:
    with urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}{yol}", timeout=3) as y:
        return json.load(y)


def port_acik(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.4)
        return s.connect_ex(("127.0.0.1", port)) == 0


def sunucu_hazir() -> bool:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/index.html", timeout=1.5) as y:
            govde = y.read(4096)
        return b"js/oyun.js" in govde
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Kontroller
# ---------------------------------------------------------------------------
def js_test1() -> str:
    return """(() => {
      const G = window.G || {};
      const adlar = ['girdi','sehir','kahraman','oyuncu','dusman','gorev','ses','arayuz'];
      const eksik = adlar.filter(a => !G[a]);
      const hatalar = Array.isArray(window.__ZIFIR_HATALAR) ? window.__ZIFIR_HATALAR.slice() : [];
      return { eksik, hatalar, modulSayisi: adlar.length - eksik.length };
    })()"""


def js_gozlem() -> str:
    # Örnekleme oyunun G.t saatine göre (10 oyun-sn); duvar saati yalnız 120 sn güvenlik sınırı.
    return """new Promise(resolve => {
      const G = window.G, w0 = performance.now(), g0 = G.t;
      let ornek = 0, sallan = 0, nan = 0, minY = Infinity, maxY = -Infinity, dusuk = 0, binaIci = 0;
      const ilkHata = (window.__ZIFIR_HATALAR || []).length;
      const ilkSallanma = G.oyuncu.sallanSayisi || 0;
      const kutular = (G.sehir && G.sehir.binalar || []).map(b => b.kutu);
      const id = setInterval(() => {
        const p = G.oyuncu, k = p && p.konum;
        ornek++;
        if (!k || !Number.isFinite(k.x) || !Number.isFinite(k.y) || !Number.isFinite(k.z)) nan++;
        else {
          if (k.y < minY) minY = k.y;
          if (k.y > maxY) maxY = k.y;
          if (k.y <= -5) dusuk++;
          for (const kb of kutular) {
            if (k.x > kb.min.x && k.x < kb.max.x && k.z > kb.min.z && k.z < kb.max.z &&
                [0.05, 0.95, 1.8].some(d => k.y + d > kb.min.y && k.y + d < kb.max.y)) { binaIci++; break; }
          }
        }
        if (p && (p.durum === 'sallan' || p.durum === 'cek')) sallan++;
        if (G.t - g0 >= 10 || performance.now() - w0 > 120000) {
          clearInterval(id);
          resolve({
            ornek, sallan, nan, dusuk, binaIci,
            sallanmaYeni: (G.oyuncu.sallanSayisi || 0) - ilkSallanma, sallanmaToplam: G.oyuncu.sallanSayisi || 0,
            minY: Number.isFinite(minY) ? minY : null,
            maxY: Number.isFinite(maxY) ? maxY : null,
            gecenSure: G.t - g0,
            yeniHatalar: (window.__ZIFIR_HATALAR || []).slice(ilkHata, ilkHata + 5)
          });
        }
      }, 50);
    })"""


JS_ORTAK = """
const O = await import('/js/oyuncu.js');
const T = G.THREE, bin = G.sehir.binalar;
const KUTULAR = bin.map(b => b.kutu);
function icinde(p) {
  for (let i = 0; i < KUTULAR.length; i++) { const k = KUTULAR[i];
    if (p.x > k.min.x && p.x < k.max.x && p.z > k.min.z && p.z < k.max.z &&
        [0.05, 0.95, 1.8].some(d => p.y + d > k.min.y && p.y + d < k.max.y)) return i; }
  return -1;
}
const rnd = (() => { let s = 20240611; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; })();
const tuslar = new Set(); let yeni = new Set();
const eskiGirdi = G.girdi;
const sahteGirdi = { basili: k => tuslar.has(k), yeniBasildi: k => yeni.has(k), birakildi: () => false,
                     fareDX: 0, fareDY: 0, eksen: { x: 0, y: 0 } };
"""


def js_test_kosu() -> str:
    # (a) 30 rastgele binaya yerden 15 m/s koşu, 2 sn
    return "(async () => {" + JS_ORTAK + """
      G.girdi = sahteGirdi;
      const aday = bin.filter(b => b.h > 15);
      const r = { deneme: 0, ornek: 0, ihlal: 0, ilk: null };
      for (let guvenlik = 0; r.deneme < 30 && guvenlik < 400; guvenlik++) {
        const b = aday[Math.floor(rnd() * aday.length)];
        const d = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(rnd() * 4)];
        const bx = b.x + d[0] * (b.gx / 2 + 12), bz = b.z + d[1] * (b.gz / 2 + 12);
        if (icinde({ x: bx, y: 0, z: bz }) >= 0 || icinde({ x: bx + d[0] * 1.5, y: 0, z: bz + d[1] * 1.5 }) >= 0) continue;
        r.deneme++;
        G.oyuncu.isinla(new T.Vector3(bx, 0, bz));
        G.oyuncu.yaw = Math.atan2(d[0], d[1]);
        for (let i = 0; i < 120; i++) {
          tuslar.clear(); tuslar.add('KeyW'); tuslar.add('ShiftLeft'); sahteGirdi.eksen.y = 1;
          if (i === 0) { G.oyuncu.hiz.x = -d[0] * 15; G.oyuncu.hiz.z = -d[1] * 15; }
          O.guncelle(G, 1 / 60); r.ornek++;
          const h = icinde(G.oyuncu.konum);
          if (h >= 0) { r.ihlal++; if (!r.ilk) r.ilk = { b: h, p: G.oyuncu.konum.toArray() }; }
        }
      }
      G.girdi = eskiGirdi; return r;
    })()"""


def js_test_sallanma_carpisma() -> str:
    # (b) çatılardan başlayıp 10 sn sallanma/zıplama/zip(E): bina içinde olma sayısı
    return "(async () => {" + JS_ORTAK + """
      G.girdi = sahteGirdi;
      const r = { deneme: 6, ornek: 0, ihlal: 0, ilk: null, sallan: 0, maxHiz: 0 };
      for (let n = 0; n < r.deneme; n++) {
        G.oyuncu.isinla(G.sehir.rastgeleCati());
        G.oyuncu.yaw = rnd() * 6.28; G.oyuncu.pitch = 0.1 + rnd() * 0.4;
        for (let i = 0; i < 600; i++) {
          tuslar.clear(); tuslar.add('KeyW'); if (i % 100 < 70) tuslar.add('Fare2'); if (i % 250 < 120) tuslar.add('ShiftLeft');
          sahteGirdi.eksen.y = 1; sahteGirdi.eksen.x = Math.sin(i * 0.05) * 0.7;
          sahteGirdi.fareDX = (i % 60 === 0) ? (rnd() - 0.5) * 300 : 0;
          yeni = new Set(); if (i % 100 === 0) yeni.add('Fare2'); if (i % 173 === 0) yeni.add('Space'); if (i % 90 === 45) yeni.add('KeyE');
          O.guncelle(G, i % 2 ? 1 / 60 : 0.05); r.ornek++;
          const p = G.oyuncu; if (p.durum === 'sallan' || p.durum === 'cek') r.sallan++;
          r.maxHiz = Math.max(r.maxHiz, p.hiz.length());
          const h = icinde(p.konum);
          if (h >= 0) { r.ihlal++; if (!r.ilk) r.ilk = { n, i, b: h, p: p.konum.toArray(), durum: p.durum }; }
        }
      }
      G.girdi = eskiGirdi; return r;
    })()"""


def js_test_gorsel_kutu() -> str:
    # (c) görsel InstancedMesh matrisleri ile fizik kutuları (binalar[i].kutu + carpis) uyuşuyor mu
    return "(async () => {" + JS_ORTAK + """
      const m = new T.Matrix4(), c = new T.Vector3(), sc = new T.Vector3(), q = new T.Quaternion();
      const inst = [];
      G.sahne.traverse(o => {
        if (!o.isInstancedMesh || !o.geometry.attributes.aSeed) return;
        for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); m.decompose(c, q, sc); inst.push([c.x, c.y, c.z, sc.x, sc.y, sc.z]); }
      });
      const r = { instance: inst.length, bina: bin.length, kutuEslesmeyen: 0, ornek: null, carpisiz: 0, carpisizOrnek: null };
      for (const b of bin) {
        const k = b.kutu, w = k.max.x - k.min.x, d = k.max.z - k.min.z, h = k.max.y - k.min.y;
        const bulundu = inst.some(a => Math.abs(a[0] - (k.min.x + k.max.x) / 2) < 0.02 && Math.abs(a[2] - (k.min.z + k.max.z) / 2) < 0.02 &&
          Math.abs(a[3] - w) < 0.02 && Math.abs(a[5] - d) < 0.02 && Math.abs(a[1] - k.min.y) < 0.02 && Math.abs(a[4] - h) < 0.02);
        if (!bulundu) { r.kutuEslesmeyen++; if (!r.ornek) r.ornek = [k.min.toArray(), k.max.toArray()]; }
      }
      // her görsel kutunun içi ve köşeleri fizik tarafında da katı mı (carpis)
      for (const a of inst) {
        const kontrol = [[a[0], a[1] + a[4] / 2, a[2]]];
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) kontrol.push([a[0] + sx * (a[3] / 2 - 0.3), a[1] + a[4] - 0.3, a[2] + sz * (a[5] / 2 - 0.3)]);
        for (const [x, y, z] of kontrol) {
          const h = G.sehir.carpis(new T.Vector3(x, y, z), 0.1);
          if (!h || !h.normal) { r.carpisiz++; if (!r.carpisizOrnek) r.carpisizOrnek = [x, y, z]; }
        }
      }
      return r;
    })()"""


def js_test_cekis() -> str:
    # (d) sağ tık basılı → yerden yüksek çatıya çekiliyor, nişan göstergesi yüksek hedefi gösteriyor
    return "(async () => {" + JS_ORTAK + """
      G.girdi = sahteGirdi;
      const uzun = bin.filter(b => b.h > 40 && b.h < 100 && Math.hypot(b.x, b.z) < 250);
      const sonuc = { deneme: 6, catida: 0, cekGordu: 0, nisanVar: 0, enGec: 0, ayrinti: [], zincir: null };
      for (let n = 0; n < sonuc.deneme; n++) {
        const b = uzun[(n * 7) % uzun.length], d = [[1, 0], [-1, 0], [0, 1], [0, -1]][n % 4];
        const bx = b.x + d[0] * (b.gx / 2 + 15), bz = b.z + d[1] * (b.gz / 2 + 15);
        G.oyuncu.isinla(new T.Vector3(bx, 0, bz));
        G.oyuncu.yaw = Math.atan2(d[0], d[1]) + (n % 3 - 1) * 0.3; G.oyuncu.pitch = 0.15;
        let cek = false, nisan = false, indi = -1;
        for (let i = 0; i < 480; i++) {
          tuslar.clear(); yeni = new Set(); sahteGirdi.eksen.x = 0; sahteGirdi.eksen.y = 0; sahteGirdi.fareDX = 0;
          if (i >= 10 && i < 400) { tuslar.add('Fare2'); if (i === 10) yeni.add('Fare2'); }
          O.guncelle(G, 1 / 60);
          const p = G.oyuncu;
          if (i < 10 && p.nisanVar && p.nisanNokta && p.nisanNokta.y >= 10) nisan = true;
          if (p.durum === 'cek') cek = true;
          if (indi < 0 && p.yerde && p.konum.y > b.h - 1.5) indi = i;
        }
        if (cek) sonuc.cekGordu++; if (nisan) sonuc.nisanVar++;
        if (indi >= 0) { sonuc.catida++; sonuc.enGec = Math.max(sonuc.enGec, indi / 60); }
        sonuc.ayrinti.push([+b.h.toFixed(0), indi]);
      }
      G.girdi = eskiGirdi; return sonuc;
    })()"""


def js_test4() -> str:
    return """(() => {
      const G = window.G, S = G.sehir, T = G.THREE;
      if (!S || !S.ankrajBul || !S.carpis) return { hata: 'sehir.ankrajBul / carpis yok' };
      const binalar = (S.binalar || []).filter(b => b && b.kutu && b.h > 20);
      if (!binalar.length) return { hata: 'uygun bina yok' };
      let bulundu = null, deneme = 0;
      for (const b of binalar) {
        if (deneme >= 40 || bulundu) break;
        deneme++;
        const bas = new T.Vector3(b.kutu.min.x - 12, Math.min(b.h * 0.5, b.h - 2), (b.kutu.min.z + b.kutu.max.z) / 2);
        const yon = new T.Vector3(1, 0.3, 0).normalize();
        const r = S.ankrajBul(bas, yon, 60);
        if (r && r.nokta && Number.isFinite(r.nokta.x) && Number.isFinite(r.nokta.y) && Number.isFinite(r.nokta.z)) {
          bulundu = {
            nokta: { x: r.nokta.x, y: r.nokta.y, z: r.nokta.z },
            normal: r.normal ? { x: r.normal.x, y: r.normal.y, z: r.normal.z } : null,
            baslangic: { x: bas.x, y: bas.y, z: bas.z }
          };
        }
      }
      const b = binalar[0], r = 0.5;
      const ic = new T.Vector3(
        (b.kutu.min.x + b.kutu.max.x) / 2,
        (b.kutu.min.y + b.kutu.max.y) / 2,
        (b.kutu.min.z + b.kutu.max.z) / 2
      );
      const hit = S.carpis(ic.clone(), r);
      const duz = hit && hit.duzeltme ? hit.duzeltme : null;
      const son = ic.clone();
      if (duz) son.add(duz);
      const icerde = son.x > b.kutu.min.x + 1e-4 && son.x < b.kutu.max.x - 1e-4 &&
                     son.y > b.kutu.min.y + 1e-4 && son.y < b.kutu.max.y - 1e-4 &&
                     son.z > b.kutu.min.z + 1e-4 && son.z < b.kutu.max.z - 1e-4;
      return {
        ankraj: { bulundu: !!bulundu, deneme, ...(bulundu || {}) },
        carpis: {
          duzeltme: duz ? duz.length() : 0,
          disari: !icerde,
          duvar: !!(hit && hit.duvar),
          normal: hit && hit.normal ? { x: hit.normal.x, y: hit.normal.y, z: hit.normal.z } : null,
          ic: { x: ic.x, y: ic.y, z: ic.z },
          son: { x: son.x, y: son.y, z: son.z }
        }
      };
    })()"""


def js_test5() -> str:
    return """(() => {
      const G = window.G, D = G.dusman;
      if (!D || !Array.isArray(D.liste)) return { hata: 'dusman.liste yok' };
      const adaylar = D.liste.filter(e => e && e.canli && (e.tur === 'robot' || e.tur === 'dron') && !e.dev && !e.vitrin);
      if (!adaylar.length) {
        return { hata: 'canlı robot/dron yok', toplamCanli: D.liste.filter(e => e && e.canli).length };
      }
      const e = adaylar[0];
      const oncekiCan = e.can, oncekiCanli = e.canli, oncekiAktif = adaylar.length;
      const konum = e.konum.clone();
      // Vuruş yönü robotun merkezine doğru (konum ayak seviyesinde, merkez yukarıda).
      const yon = new G.THREE.Vector3(0, 1, 0);
      G.olay.emit('yumruk', { konum, yon, guc: 3 });
      const sonrakiAktif = D.liste.filter(x => x && x.canli && (x.tur === 'robot' || x.tur === 'dron') && !x.dev && !x.vitrin).length;
      return {
        tur: e.tur, oncekiCan, sonrakiCan: e.can, oncekiCanli, sonrakiCanli: e.canli,
        oncekiAktif, sonrakiAktif,
        canDustu: e.can < oncekiCan - 1e-6,
        sayiAzaldi: sonrakiAktif < oncekiAktif
      };
    })()"""


def js_test6_bul() -> str:
    return """(() => {
      const G = window.G;
      let mesh = null;
      G.sahne.traverse(o => {
        if (!mesh && o && o.isInstancedMesh && o.count === 60 && o.geometry && o.geometry.type === 'OctahedronGeometry') mesh = o;
      });
      if (!mesh) return { hata: 'Işık Küresi InstancedMesh bulunamadı' };
      const m = new G.THREE.Matrix4(), p = new G.THREE.Vector3(), sc = new G.THREE.Vector3();
      let nokta = null;
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, m);
        p.setFromMatrixPosition(m);
        sc.setFromMatrixScale(m);
        if (sc.x > 0.01 && sc.y > 0.01) { nokta = p.clone(); break; }
      }
      if (!nokta) return { hata: 'görünür küre örneği yok' };
      const onceKure = G.gorev.toplamKure;
      const onceProg = G.gorev.aktif ? G.gorev.aktif.ilerleme : null;
      G.oyuncu.isinla(nokta);
      return {
        nokta: { x: nokta.x, y: nokta.y, z: nokta.z },
        onceKure, onceProg,
        konum: { x: G.oyuncu.konum.x, y: G.oyuncu.konum.y, z: G.oyuncu.konum.z }
      };
    })()"""


def js_test6_sonuc() -> str:
    return """(() => {
      const G = window.G;
      return {
        sonraKure: G.gorev.toplamKure,
        sonraProg: G.gorev.aktif ? G.gorev.aktif.ilerleme : null,
        aktifAd: G.gorev.aktif ? G.gorev.aktif.ad : null,
        konum: { x: G.oyuncu.konum.x, y: G.oyuncu.konum.y, z: G.oyuncu.konum.z },
        can: G.oyuncu.can
      };
    })()"""


def js_test7_kur() -> str:
    return """(() => {
      const G = window.G;
      window.__TEST_OLAY = [];
      if (!window.__TEST_OLAY_BAG) {
        window.__TEST_OLAY_BAG = true;
        G.olay.on('yenildi', () => window.__TEST_OLAY.push({ ad: 'yenildi', t: G.t }));
        G.olay.on('dogdu', () => window.__TEST_OLAY.push({ ad: 'dogdu', t: G.t }));
      }
      return { can: G.oyuncu.can, canMax: G.oyuncu.canMax, durum: G.oyuncu.durum };
    })()"""


def js_test7_durum() -> str:
    return """(() => {
      const G = window.G, p = G.oyuncu, k = p.konum;
      return {
        can: p.can, canMax: p.canMax, durum: p.durum,
        gecerli: Number.isFinite(k.x) && Number.isFinite(k.y) && Number.isFinite(k.z) && k.y > -5,
        konum: { x: k.x, y: k.y, z: k.z },
        olaylar: (window.__TEST_OLAY || []).slice()
      };
    })()"""


def js_kare(sure_ms: int = 3000) -> str:
    return ("""new Promise(resolve => {
      let kare = 0, ilk = 0, son = 0, toplam = 0;
      function adim(t) {
        if (!ilk) ilk = t;
        else { toplam += t - son; kare++; }
        son = t;
        if (t - ilk < __SURE__) requestAnimationFrame(adim);
        else resolve({
          kare,
          sure: ilk ? son - ilk : 0,
          ortalama: kare ? toplam / kare : null,
          fps: (kare && son > ilk) ? kare * 1000 / (son - ilk) : null
        });
      }
      requestAnimationFrame(adim);
    })""").replace("__SURE__", str(int(sure_ms)))


def js_hizlandir() -> str:
    # Oyun kodunu değiştirmeden yalnız çizim yükünü azalt (mantık aynı kalır).
    return """(() => {
      const G = window.G;
      G.renderer.setPixelRatio(0.5);
      G.renderer.setSize(480, 270, false);
      G.composer.setSize(480, 270);
      if (G.bloom) G.bloom.enabled = false;
      G.renderer.shadowMap.enabled = false;
      G.kamera.aspect = 480 / 270;
      G.kamera.updateProjectionMatrix();
      return {
        tampon: { genislik: G.renderer.domElement.width, yukseklik: G.renderer.domElement.height },
        bloom: G.bloom ? G.bloom.enabled : null, golge: G.renderer.shadowMap.enabled
      };
    })()"""


def js_render_kapat() -> str:
    # Son çare: ağır yazılım render'ı durdur; rAF ve oyun mantığı aynen çalışmaya devam eder.
    return """(() => {
      const G = window.G;
      if (!G.__TEST_RENDER_KAPALI) {
        G.__TEST_RENDER_KAPALI = true;
        G.composer.render = function () { /* başsız testte çizim yükü kapatıldı */ };
      }
      return true;
    })()"""


def js_son_konsol() -> str:
    return """new Promise(resolve => {
      setTimeout(() => {
        resolve({
          testKonsol: Array.isArray(window.__TEST_KONSOL) ? window.__TEST_KONSOL.slice(-300) : [],
          zifirHatalar: Array.isArray(window.__ZIFIR_HATALAR) ? window.__ZIFIR_HATALAR.slice() : []
        });
      }, 1200);
    })"""


ENJEKTE_KONSOL = r"""
window.__TEST_KONSOL = [];
(function () {
  const eski = {};
  ['error', 'warn'].forEach(ad => {
    eski[ad] = console[ad];
    console[ad] = function (...args) {
      try {
        const metin = args.map(a => {
          if (typeof a === 'string') return a;
          if (a && a.message) return String(a.message);
          try { return JSON.stringify(a); } catch (e) { return String(a); }
        }).join(' ');
        window.__TEST_KONSOL.push(ad + ': ' + metin);
        if (window.__TEST_KONSOL.length > 1000) window.__TEST_KONSOL.shift();
      } catch (e) { /* yok say */ }
      return eski[ad].apply(console, args);
    };
  });
  window.addEventListener('error', e => {
    try { window.__TEST_KONSOL.push('Uncaught: ' + (e.message || (e.error && e.error.message) || 'hata')); } catch (err) {}
  });
  window.addEventListener('unhandledrejection', e => {
    try { window.__TEST_KONSOL.push('Uncaught: ' + ((e.reason && e.reason.message) || e.reason || 'reddedildi')); } catch (err) {}
  });
})();
"""


# ---------------------------------------------------------------------------
# Ana akış
# ---------------------------------------------------------------------------
def main() -> int:
    # Chrome/SwiftShader bağlantısı nadiren kopabiliyor. Yalnız ALTYAPI hatasında
    # (çıkış kodu 3) en fazla 3 kez yeniden dene; gerçek KALDI sonuçlarını tekrarlama.
    if os.environ.get("ZIFIR_TEST_ALT") != "1":
        for deneme in range(1, 4):
            print(f"[bilgi] Test denemesi {deneme}/3", flush=True)
            ortam = dict(os.environ)
            ortam["ZIFIR_TEST_ALT"] = "1"
            sonuc = subprocess.run([sys.executable, str(Path(__file__).resolve())], env=ortam)
            if sonuc.returncode == 0:
                return 0
            if sonuc.returncode != 3:
                return sonuc.returncode
            if deneme < 3:
                print("[bilgi] Altyapı hatası (Chrome/CDP koptu); yeniden deneniyor…")
                time.sleep(1)
        return 3

    basla = time.time()
    fatal = False
    chrome_yolu = shutil.which("google-chrome") or shutil.which("google-chrome-stable")
    if not chrome_yolu:
        print("KALDI: google-chrome bulunamadı")
        return 2

    sunucu_bizim = False
    chrome = None
    profil = None
    ws = None
    sonuclar: list[dict] = []

    def ekle(no: int, ad: str, gecti: bool, detay: str, modul: str) -> None:
        sonuclar.append({"no": no, "ad": ad, "gecti": bool(gecti), "detay": detay, "modul": modul})
        print(f"{no}. {'GEÇTİ' if gecti else 'KALDI'} — {ad}: {detay}")

    try:
        if not sunucu_hazir():
            print(f"[bilgi] {PORT} portunda ZİFİR sunucusu yok; başlatılıyor…")
            subprocess.Popen(
                [sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
                cwd=str(KOK), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
            sunucu_bizim = True
            if not bekle(sunucu_hazir, 10):
                raise RuntimeError(f"http://127.0.0.1:{PORT} başlatılamadı")
        else:
            print(f"[bilgi] {PORT} portundaki mevcut ZİFİR sunucusu kullanılıyor")

        if port_acik(CDP_PORT):
            raise RuntimeError(f"{CDP_PORT} portu dolu; eski bir Chrome kapanmamış olabilir")

        profil = tempfile.mkdtemp(prefix="zifir-test-chrome-")
        chrome_log = open(CHROME_LOG, "wb")
        chrome_args = [
            chrome_yolu,
            "--headless=new",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
            f"--remote-debugging-port={CDP_PORT}",
            "--remote-allow-origins=*",
            f"--user-data-dir={profil}",
            "--window-size=1280,720",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-background-timer-throttling",
            "--disable-renderer-backgrounding",
            "--disable-backgrounding-occluded-windows",
            "--disable-hang-monitor",
            "--disable-gpu-watchdog",
            "--disable-dev-shm-usage",
            "--mute-audio",
            "--enable-logging=stderr",
            "--v=0",
            "about:blank",
        ]
        chrome = subprocess.Popen(chrome_args, stdout=chrome_log, stderr=chrome_log)

        surum = bekle(lambda: http_json("/json/version"), 25, 0.3)
        if not surum:
            raise RuntimeError("Chrome DevTools portu açılmadı")
        print(f"[bilgi] Chrome: {surum.get('Browser', '?')}")

        hedef = None
        for _ in range(50):
            try:
                for h in http_json("/json/list"):
                    if h.get("type") == "page":
                        hedef = h
                        break
            except Exception:
                pass
            if hedef:
                break
            time.sleep(0.2)
        if not hedef:
            raise RuntimeError("Chrome'da page hedefi bulunamadı")

        ws = MiniWebSocket(hedef["webSocketDebuggerUrl"])
        cdp = CDP(ws)
        cdp.komut("Page.enable")
        cdp.komut("Runtime.enable")
        cdp.komut("Log.enable")
        cdp.komut("Page.addScriptToEvaluateOnNewDocument", {"source": ENJEKTE_KONSOL})
        cdp.komut("Page.navigate", {"url": OYUN_URL})

        hazir = bekle(
            lambda: cdp.degerlendir(
                "(() => { const G = window.G; return !!(G && G.t > 0.15 && G.oyuncu && G.oyuncu.konum); })()"
            ),
            45, 0.2,
        )
        if not hazir:
            raise RuntimeError("Oyun 45 saniye içinde hazır olmadı (G/oyuncu yok)")

        # swiftshader 1280x720 + bloom ile 0.2-0.8 fps'e düşüyor; bu hem oyun saatini
        # dt=0.05 sınırıyla yavaşlatıyor hem de uzun süreli ağır çizimde bağlantıyı
        # koparabiliyor. Oyun kodunu değiştirmeden yalnız çizim yükünü azaltıyoruz;
        # fizik/görev mantığı aynı guncelle döngüsünde kalıyor.
        hiz = cdp.degerlendir(js_hizlandir()) or {}
        print(f"[bilgi] Çizim yükü azaltıldı; tampon={hiz.get('tampon')}")

        # 1 — modüller ve hata listesi
        t1 = cdp.degerlendir(js_test1())
        eksik = t1.get("eksik", [])
        hatalar = t1.get("hatalar", [])
        gecti1 = not eksik and not hatalar
        detay1 = f"{t1.get('modulSayisi', 0)}/8 modül yüklü"
        if eksik:
            detay1 += f"; eksik: {', '.join(eksik)}"
        if hatalar:
            detay1 += f"; __ZIFIR_HATALAR={hatalar[:3]}"
        ekle(1, "8 modül yüklü ve hata listesi boş", gecti1, detay1, "oyun.js + tüm modüller")

        # 2 + 3 — 10 sn konum gözlemi ve sallanma örneklemesi
        print("[bilgi] 10 sn konum/sallanma gözlemi…")
        gozlem = cdp.degerlendir(js_gozlem(), promise=True)
        minY = gozlem.get("minY")
        maxY = gozlem.get("maxY")
        nan = gozlem.get("nan", 0)
        dusuk = gozlem.get("dusuk", 0)
        gecti2 = nan == 0 and minY is not None and minY > -5
        detay2 = (f"{gozlem.get('ornek', 0)} örnek / {gozlem.get('gecenSure', 0):.1f} sn; "
                  f"NaN={nan}; y min={minY if minY is not None else 'yok'}, max={maxY if maxY is not None else 'yok'}"
                  f"; y<=-5 örnek={dusuk}")
        if gozlem.get("yeniHatalar"):
            detay2 += f"; yeni hatalar={gozlem['yeniHatalar'][:2]}"
        ekle(2, "10 sn boyunca konum NaN değil ve y > -5", gecti2, detay2, "oyuncu.js")
        bina_ici_demo = gozlem.get("binaIci", 0)

        sallan = gozlem.get("sallan", 0)
        toplam_sallanma = gozlem.get("sallanmaToplam", 0)
        gecti3 = sallan > 0 or toplam_sallanma > 0
        detay3 = (f"'sallan'/'cek' durumu {sallan}/{gozlem.get('ornek', 0)} örnekte görüldü (G.t'ye göre "
                  f"{gozlem.get('gecenSure', 0):.1f} oyun-sn); oyuncu toplam sallanma sayacı={toplam_sallanma}")
        ekle(3, "Test demosunda sallanma en az bir kez gerçekleşti", gecti3, detay3,
             "girdi.js (test demosu) + oyuncu.js (sallanma)")

        # 8 (bilgi) — çizim yükü azaltılmış halde 3 sn kare süresi; demo gözleminden
        # sonra ölçülür ki demo saati erkenden tükenmesin.
        print("[bilgi] Kare süresi ölçülüyor (3 sn)…")
        t8_tam = cdp.degerlendir(js_kare(3000), promise=True) or {}
        render_kapali = False
        if (t8_tam.get("fps") or 0) < 20:
            cdp.degerlendir(js_render_kapat())
            render_kapali = True
        hiz_olcum = cdp.degerlendir(js_kare(1200), promise=True) or {}
        print(f"[bilgi] Test hızı: {hiz_olcum.get('fps', 0):.1f} fps"
              f"{' (render kapatıldı)' if render_kapali else ''}")

        # 4 — ankraj ve çarpışma
        t4 = cdp.degerlendir(js_test4())
        ankraj = t4.get("ankraj", {}) if isinstance(t4, dict) else {}
        carpis = t4.get("carpis", {}) if isinstance(t4, dict) else {}
        gecti4a = bool(ankraj.get("bulundu"))
        gecti4b = (carpis.get("duzeltme", 0) > 0.1 and carpis.get("disari") is True and
                   carpis.get("normal") is not None)
        gecti4 = gecti4a and gecti4b
        detay4 = (f"ankraj={'bulundu' if gecti4a else 'YOK'} ({ankraj.get('deneme', 0)} bina denemesi); "
                  f"carpis itme={carpis.get('duzeltme', 0):.3f} m, dışarı={carpis.get('disari')}, "
                  f"normal={carpis.get('normal')}, duvar={carpis.get('duvar')}")
        if t4.get("hata"):
            detay4 = t4["hata"]
        ekle(4, "ankrajBul yukarı-ileri ışında nokta buluyor; carpis iç noktayı dışarı itiyor",
             gecti4, detay4, "sehir.js")

        # 5 — yumruk olayı
        bekle(lambda: cdp.degerlendir(
            "(() => { const D = window.G && window.G.dusman; return !!(D && D.liste && D.liste.some(e => e && e.canli && (e.tur === 'robot' || e.tur === 'dron') && !e.dev)); })()"
        ), 12, 0.3)
        t5 = cdp.degerlendir(js_test5())
        if isinstance(t5, dict) and t5.get("hata"):
            gecti5 = False
            detay5 = t5["hata"]
        else:
            gecti5 = bool(t5.get("canDustu") or t5.get("sayiAzaldi") or t5.get("sonrakiCanli") is False)
            detay5 = (f"{t5.get('tur')} can {t5.get('oncekiCan')}→{t5.get('sonrakiCan')}, "
                      f"canlı {t5.get('oncekiCanli')}→{t5.get('sonrakiCanli')}, "
                      f"aktif {t5.get('oncekiAktif')}→{t5.get('sonrakiAktif')}")
        ekle(5, "yumruk olayı robot canını düşürüyor / robot sayısını azaltıyor", gecti5, detay5, "dusman.js")

        # 6 — küreye ışınlanma
        t6 = cdp.degerlendir(js_test6_bul())
        if not isinstance(t6, dict) or t6.get("hata"):
            gecti6 = False
            detay6 = t6.get("hata", "küre bulunamadı") if isinstance(t6, dict) else "küre bulunamadı"
        else:
            time.sleep(1.2)
            t6s = cdp.degerlendir(js_test6_sonuc())
            once_k = t6.get("onceKure")
            once_p = t6.get("onceProg")
            son_k = t6s.get("sonraKure")
            son_p = t6s.get("sonraProg")
            gecti6 = (isinstance(son_k, (int, float)) and isinstance(once_k, (int, float)) and son_k > once_k) or \
                     (isinstance(son_p, (int, float)) and isinstance(once_p, (int, float)) and son_p > once_p)
            detay6 = (f"küre {once_k}→{son_k}, görev ilerlemesi {once_p}→{son_p} "
                      f"({t6s.get('aktifAd')}); konum={t6s.get('konum')}")
        ekle(6, "isinla(küre konumu) görev/küre sayısını artırıyor", gecti6, detay6,
             "gorev.js + oyuncu.js.isinla")

        # 7 — yenilme ve yeniden doğuş
        t7 = cdp.degerlendir(js_test7_kur())
        yenildi_zamani = None
        deneme_sayisi = 0
        durum7 = t7
        for _ in range(3):
            deneme_sayisi += 1
            cdp.degerlendir("(() => { window.G.oyuncu.hasarAl(1000); return true; })()")
            for _ in range(10):
                time.sleep(0.1)
                durum7 = cdp.degerlendir(js_test7_durum())
                if any(e.get("ad") == "yenildi" for e in durum7.get("olaylar", [])):
                    yenildi_zamani = time.time()
                    break
            if yenildi_zamani:
                break
        tam_can = False
        son_durum7 = durum7
        if yenildi_zamani:
            while time.time() - yenildi_zamani <= 4.0:
                son_durum7 = cdp.degerlendir(js_test7_durum())
                if (son_durum7.get("can", 0) >= son_durum7.get("canMax", 100) - 1e-6 and
                        son_durum7.get("gecerli")):
                    tam_can = True
                    break
                time.sleep(0.1)
        gecti7 = bool(yenildi_zamani and tam_can)
        if yenildi_zamani:
            gecen = time.time() - yenildi_zamani
            detay7 = (f"'yenildi' alındı ({deneme_sayisi} çağrı); {gecen:.1f} sn sonra can="
                      f"{son_durum7.get('can')}/{son_durum7.get('canMax')}, konum={son_durum7.get('konum')}, "
                      f"geçerli={son_durum7.get('gecerli')}")
        else:
            detay7 = (f"'yenildi' olayı gelmedi ({deneme_sayisi} hasarAl(1000) çağrısı); "
                      f"durum={durum7.get('durum')}, can={durum7.get('can')}/{durum7.get('canMax')}")
        ekle(7, "hasarAl(1000) sonrası 4 sn içinde can dolu ve konum geçerli", gecti7, detay7, "oyuncu.js")

        # 8 — kare süresi (bilgi)
        ort = t8_tam.get("ortalama")
        fps = t8_tam.get("fps")
        gecti8 = isinstance(ort, (int, float))
        detay8 = (f"ortalama {ort:.2f} ms/kare (~{fps:.1f} fps), "
                  f"{t8_tam.get('kare')} kare / {t8_tam.get('sure', 0):.0f} ms; composer 480x270, "
                  f"çizim tamponu 240x135, bloom/gölge kapalı — swiftshader yazılım render, bilgi amaçlı. "
                  f"Mantık testleri: {hiz_olcum.get('fps', 0):.1f} fps"
                  f"{' (render kapalı)' if render_kapali else ''}.")
        ekle(8, "Ortalama kare süresi ölçüldü (yalnız bilgi)", gecti8, detay8, "oyun.js render döngüsü")

        # 10 — koşarak bina çarpışması (a)
        t10 = cdp.degerlendir(js_test_kosu(), promise=True) or {}
        gecti10 = t10.get("deneme", 0) >= 30 and t10.get("ihlal", 1) == 0
        detay10 = (f"{t10.get('deneme')} bina × 2 sn yerden 15 m/s koşu = {t10.get('ornek')} örnek; "
                   f"bina içinde ayak/bel/baş noktası={t10.get('ihlal')}" + (f" ilk={t10.get('ilk')}" if t10.get("ilk") else ""))
        ekle(10, "30 binaya yerden 15 m/s koşuda oyuncu hiçbir bina kutusunun içine girmiyor", gecti10, detay10, "oyuncu.js + sehir.js")

        # 11 — sallanma/zip çarpışması (b)
        t11 = cdp.degerlendir(js_test_sallanma_carpisma(), promise=True) or {}
        gecti11 = t11.get("ihlal", 1) == 0 and bina_ici_demo == 0 and t11.get("sallan", 0) > 0
        detay11 = (f"{t11.get('deneme')} çatı denemesi × 10 sn (sallan+zıpla+E) = {t11.get('ornek')} örnek; "
                   f"bina içi={t11.get('ihlal')}, sallan/cek örneği={t11.get('sallan')}, max hız={t11.get('maxHiz', 0):.0f}; "
                   f"canlı demo 10 oyun-sn bina içi örnek={bina_ici_demo}" + (f" ilk={t11.get('ilk')}" if t11.get("ilk") else ""))
        ekle(11, "Sallanma demosunda 10 sn boyunca bina içinde değil (simülasyon + canlı demo)", gecti11, detay11, "oyuncu.js + sehir.js")

        # 12 — görsel matris / fizik kutusu uyuşması (c)
        t12 = cdp.degerlendir(js_test_gorsel_kutu(), promise=True) or {}
        gecti12 = t12.get("kutuEslesmeyen", 1) == 0 and t12.get("carpisiz", 1) == 0 and t12.get("instance", 0) > 0
        detay12 = (f"görsel instance={t12.get('instance')}, binalar[].kutu={t12.get('bina')}; kutusu eşleşmeyen={t12.get('kutuEslesmeyen')}, "
                   f"fizik katı olmayan görsel nokta={t12.get('carpisiz')}" + (f" ornek={t12.get('ornek') or t12.get('carpisizOrnek')}" if (t12.get("ornek") or t12.get("carpisizOrnek")) else ""))
        ekle(12, "Görsel bina instance matrisleri fizik kutularıyla uyuşuyor", gecti12, detay12, "sehir.js")

        # 13 — sağ tık yukarı çekiş
        t13 = cdp.degerlendir(js_test_cekis(), promise=True) or {}
        gecti13 = (t13.get("catida", 0) == t13.get("deneme", -1) and t13.get("cekGordu", 0) == t13.get("deneme", -1)
                   and t13.get("nisanVar", 0) == t13.get("deneme", -1))
        detay13 = (f"{t13.get('deneme')} yerden denemede çatıya inen={t13.get('catida')}, 'cek' durumu görülen={t13.get('cekGordu')}, "
                   f"nişan yüksek hedefte={t13.get('nisanVar')}, en geç iniş={t13.get('enGec', 0):.1f} sn; [bina_h, iniş_kare]={t13.get('ayrinti')}")
        ekle(13, "Sağ tık basılı yerden yüksek çatıya çekiyor ve nişan yüksek hedefi gösteriyor", gecti13, detay13, "oyuncu.js")

        # 9 — konsol hataları
        son = cdp.degerlendir(js_son_konsol(), promise=True)
        satirlar: list[str] = []
        satirlar += ["zifir: " + str(x) for x in son.get("zifirHatalar", [])]
        satirlar += ["sayfa: " + str(x) for x in son.get("testKonsol", [])]
        for olay in cdp.olaylar:
            ad = olay.get("method")
            p = olay.get("params", {})
            if ad == "Runtime.consoleAPICalled":
                parcalar = []
                for a in p.get("args", []):
                    if "value" in a:
                        parcalar.append(str(a["value"]))
                    elif a.get("description"):
                        parcalar.append(str(a["description"]))
                    elif a.get("unserializableValue"):
                        parcalar.append(str(a["unserializableValue"]))
                satirlar.append("cdp: " + " ".join(parcalar))
            elif ad == "Runtime.exceptionThrown":
                ayr = p.get("exceptionDetails", {})
                metin = str(ayr.get("text", ""))
                ex = ayr.get("exception", {})
                if ex.get("description"):
                    metin += " " + str(ex["description"])
                satirlar.append("cdp-istisna: " + metin)
            elif ad == "Log.entryAdded":
                e = p.get("entry", {})
                satirlar.append("cdp-log: " + str(e.get("text", "")))
        eslesen = []
        for satir in satirlar:
            temiz = satir.replace("\n", " ")
            if HATA_DESENI.search(temiz) and temiz not in eslesen:
                eslesen.append(temiz)
        # Chrome stderr'de sayfa hataları da görünür; yalnız desene uyanları ekle.
        try:
            chrome_log.flush()
            with open(CHROME_LOG, "r", encoding="utf-8", errors="replace") as f:
                for satir in f:
                    temiz = satir.strip().replace("\n", " ")
                    if HATA_DESENI.search(temiz) and temiz not in eslesen:
                        eslesen.append(temiz)
        except Exception:
            pass
        gecti9 = not eslesen
        detay9 = "konsolda 'Uncaught' / 'THREE.WebGLProgram' / 'shader' satırı yok" if gecti9 else \
                 f"{len(eslesen)} eşleşen hata satırı: " + " | ".join(eslesen[:3])
        ekle(9, "Konsolda Uncaught / THREE.WebGLProgram / shader hatası yok", gecti9, detay9,
             "shader ise sehir/kahraman/arayuz; Uncaught ise ilgili modül")

    except Exception as hata:
        fatal = True
        print(f"\n[ÖLÜMCÜL] {hata}")
        sonuclar.append({"no": 0, "ad": "Test altyapısı", "gecti": False,
                         "detay": f"Test çalıştırılamadı: {hata}", "modul": "test/test_oyun.py"})
    finally:
        try:
            if ws:
                ws.kapat()
        except Exception:
            pass
        if chrome:
            try:
                chrome.terminate()
                chrome.wait(timeout=8)
            except Exception:
                try:
                    chrome.kill()
                except Exception:
                    pass
        if profil:
            shutil.rmtree(profil, ignore_errors=True)

    # ---- rapor ----
    toplam = len(sonuclar)
    gecen = sum(1 for s in sonuclar if s["gecti"])
    kalan = toplam - gecen
    print("")
    print(f"TOPLAM {gecen}/{toplam}")

    cizgiler = []
    cizgiler.append("# ZİFİR Otomatik Test Raporu")
    cizgiler.append("")
    cizgiler.append(f"- Tarih: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    cizgiler.append(f"- URL: `{OYUN_URL}`")
    cizgiler.append("- Ortam: başsız Chrome (`--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader`)")
    cizgiler.append(f"- Chrome: `{shutil.which('google-chrome') or '?'}`")
    cizgiler.append(f"- Süre: {time.time() - basla:.1f} sn")
    if os.environ.get("ZIFIR_TEST_ALT") == "1":
        cizgiler.append("- Çalıştırma: otomatik yeniden deneme sarmalayıcısı içinde (yalnız altyapı hatasında tekrar)")
    cizgiler.append("- Betik: `test/test_oyun.py` (oyun kodu değiştirilmedi)")
    cizgiler.append("")
    cizgiler.append("## Sonuçlar")
    cizgiler.append("")
    for s in sonuclar:
        if s["no"] == 0:
            cizgiler.append(f"- **KALDI** — {s['ad']}: {s['detay']}")
            continue
        etiket = "GEÇTİ" if s["gecti"] else "KALDI"
        cizgiler.append(f"{s['no']}. **{etiket}** — {s['ad']}")
        cizgiler.append(f"   - Ayrıntı: {s['detay']}")
        cizgiler.append(f"   - İlgili modül: {s['modul']}")
    cizgiler.append("")
    cizgiler.append("## Özet")
    cizgiler.append("")
    cizgiler.append(f"**TOPLAM {gecen}/{toplam}**")
    cizgiler.append("")
    if kalan:
        cizgiler.append("## KALDI olanlar — olası nedenler")
        cizgiler.append("")
        for s in sonuclar:
            if s["gecti"] or s["no"] == 0:
                continue
            cizgiler.append(f"- **{s['no']}. {s['ad']}** ({s['modul']}): {s['detay']}")
            tahminler = {
                1: "Modül dosyası yüklenemedi veya kur() içinde istisna oluştu; `window.__ZIFIR_HATALAR` içeriğine bakın.",
                2: "Oyuncu fiziği NaN üretti ya da zeminin altına düştü; `oyuncu.js` fizik/çarpışma veya `sehir.js` zeminY.",
                3: "Test demosu `girdi.js` içinde 6 sn sürüyor; sayfa geç açıldıysa veya ankraj bulunamadıysa sallanma görülmez.",
                4: "`sehir.js` ışın/AABB verisi boş ya da çarpışma düzeltmesi uygulanmıyor.",
                5: "`dusman.js` yumruk dinleyicisi hasar uygulamıyor; olay verisi (konum/yon) veya canlı düşman yok.",
                6: "`gorev.js` küre toplama yarıçapı ya da `oyuncu.js.isinla` konumu güncellemiyor.",
                7: "`oyuncu.js.hasarAl` koruma koşulu (hasarSure/olmeSure) nedeniyle çağrıyı yutuyor ya da yeniden doğuş zamanlayıcısı çalışmıyor.",
                8: "requestAnimationFrame hiç çalışmıyor olabilir; render döngüsüne bakın.",
                9: "Shader derleme hatası veya yakalanmamış istisna; ayrıntı satırındaki modül dosyasına bakın.",
            }
            cizgiler.append(f"  - Olası neden: {tahminler.get(s['no'], 'Ayrıntı çıktısına bakın.')}")
        cizgiler.append("")
    cizgiler.append("## Notlar")
    cizgiler.append("")
    cizgiler.append("- Test 8 (kare süresi) 240x135 çizim tamponunda (composer 480x270), bloom ve gölge kapalı olarak ölçülür; swiftshader yazılım render'ı gerçek GPU performansını yansıtmaz.")
    cizgiler.append("- swiftshader 1280x720'de çok yavaş kaldığından (geliştirme sırasında 0.2-0.8 fps ölçüldü; oyun saati dt=0.05 sınırıyla ilerler) yalnız çizim yükü azaltıldı: composer 480x270 / 240x135 tampon, bloom ve gölge kapalı; gerekirse render çağrısı durduruldu. Oyun kodu/dosyaları değiştirilmedi, fizik ve görev mantığı aynı `guncelle` döngüsüyle çalıştı.")
    cizgiler.append("- Test demosu `girdi.js` içinde `?test=1` sırasında ilk 6 saniye çalışır.")
    cizgiler.append("- Konsol taraması sayfa `console.error/warn`, `window.__ZIFIR_HATALAR`, CDP istisnaları ve Chrome stderr üzerinden yapıldı.")
    cizgiler.append("- Oyun kodu düzeltilmedi; raporlama yapıldı.")

    RAPOR.parent.mkdir(parents=True, exist_ok=True)
    RAPOR.write_text("\n".join(cizgiler) + "\n", encoding="utf-8")
    print(f"[bilgi] Rapor yazıldı: {RAPOR}")
    if fatal:
        return 3
    return 0 if kalan == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
