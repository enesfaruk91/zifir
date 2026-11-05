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
# Birden çok ajan aynı anda koşabildiği için port sabit değil; main() içinde
# socket.bind(("127.0.0.1", 0)) ile boş bir port seçilir.
CDP_PORT = 0
OYUN_URL = f"http://127.0.0.1:{PORT}/?test=1"
EGITIM_URL = f"http://127.0.0.1:{PORT}/?test=1&egitim=1"
RAPOR = KOK / "RAPOR" / "test_bot.md"

MODULLER = ["girdi", "sehir", "kahraman", "oyuncu", "dusman", "gorev", "ses", "arayuz"]
HATA_DESENI = re.compile(r"uncaught|shader|webglprogram|is not defined", re.I)


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


def bos_port() -> int:
    """İşletim sisteminin boş bir TCP portu vermesini sağlar (bind 0)."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(("127.0.0.1", 0))
        return int(s.getsockname()[1])


def js_gt_bekle(kosul: str, gt_sure: float, wall_cap: float = 90.0) -> str:
    """Oyun saati G.t'ye göre bekler; gt_sure aşılırsa tamam=False döner.

    Duvar saati yalnız güvenlik sınırıdır (takılı kalan sayfa testi kilitlemesin).
    """
    return ("""new Promise(resolve => {
      const G = window.G || {};
      const g0 = (typeof G.t === 'number') ? G.t : 0;
      const w0 = performance.now();
      const kontrol = () => { try { return !!(__KOSUL__); } catch (e) { return false; } };
      const bitir = (neden) => resolve({
        tamam: kontrol(), neden,
        gecenOyun: ((window.G && window.G.t) || 0) - g0,
        gecenDuvar: (performance.now() - w0) / 1000
      });
      if (kontrol()) { bitir('kosul'); return; }
      const id = setInterval(() => {
        if (kontrol()) { clearInterval(id); bitir('kosul'); return; }
        const g = ((window.G && window.G.t) || 0) - g0;
        if (g >= __GT__) { clearInterval(id); bitir('oyun-suresi'); return; }
        if (performance.now() - w0 >= __WALL__) { clearInterval(id); bitir('duvar-suresi'); }
      }, 50);
    })"""
            .replace("__KOSUL__", kosul)
            .replace("__GT__", repr(float(gt_sure)))
            .replace("__WALL__", repr(float(wall_cap * 1000.0))))


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
    # Örnekleme oyunun G.t saatine göre (10 oyun-sn); duvar saati yalnız 180 sn güvenlik sınırı.
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
        if (G.t - g0 >= 10 || performance.now() - w0 > 180000) {
          clearInterval(id);
          const gecen = G.t - g0;
          resolve({
            ornek, sallan, nan, dusuk, binaIci,
            tamam: gecen >= 10,
            neden: gecen >= 10 ? 'oyun-suresi' : 'duvar-suresi',
            sallanmaYeni: (G.oyuncu.sallanSayisi || 0) - ilkSallanma, sallanmaToplam: G.oyuncu.sallanSayisi || 0,
            minY: Number.isFinite(minY) ? minY : null,
            maxY: Number.isFinite(maxY) ? maxY : null,
            gecenSure: gecen,
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
    # (d) SOZLESME: sağ tık basılı = yüksek ankrajla sallanma, E = çatıya zip; nişan yüksek hedefi gösterir.
    return "(async () => {" + JS_ORTAK + """
      G.girdi = sahteGirdi;
      const uzun = bin.filter(b => b.h > 40 && b.h < 100 && Math.hypot(b.x, b.z) < 250);
      const sonuc = { deneme: 6, sallanGordu: 0, yuksekAnkraj: 0, zipGordu: 0, catida: 0,
                      nisanVar: 0, enGec: 0, ayrinti: [], durumlar: {}, ankrajKare: 0 };
      let n = 0, kk = 0, atlanan = 0;
      while (n < sonuc.deneme && kk < 60) {
        const b = uzun[(kk * 7) % uzun.length], d = [[1, 0], [-1, 0], [0, 1], [0, -1]][n % 4]; kk++;
        const bx = b.x + d[0] * (b.gx / 2 + 15), bz = b.z + d[1] * (b.gz / 2 + 15);
        const yaw = Math.atan2(d[0], d[1]) + (n % 3 - 1) * 0.3;
        // A) yerden sağ tık: yüksek ankraj ve 'sallan' durumu
        G.oyuncu.isinla(new T.Vector3(bx, 0, bz));
        G.oyuncu.yaw = yaw; G.oyuncu.pitch = 0.15;
        let sallan = false, yuksek = false, nisan = false;
        for (let i = 0; i < 90; i++) {
          tuslar.clear(); yeni = new Set(); sahteGirdi.eksen.x = 0; sahteGirdi.eksen.y = 0; sahteGirdi.fareDX = 0;
          tuslar.add('Fare2'); if (i === 0) yeni.add('Fare2');
          O.guncelle(G, 1 / 60);
          const p = G.oyuncu;
          sonuc.durumlar[p.durum] = (sonuc.durumlar[p.durum] || 0) + 1;
          if (p.ankraj) sonuc.ankrajKare++;
          if (p.durum === 'sallan') sallan = true;
          if (p.ankraj && p.ankraj.y >= p.konum.y + 10) yuksek = true;
          if (i < 10 && p.nisanVar && p.nisanNokta && p.nisanNokta.y >= p.konum.y + 5.99) nisan = true;
        }
        // B) Görünen önizlemeyi seç; aynı konum/bakıştan hemen sonraki karede E.
        // A'dan önce seçilen pitch'i yeniden kullanmak, fizik ve kamera ilerlediği
        // için başka cephe/gökyüzü hedefiyle zip başlatabiliyordu.
        let secilenNisan = null;
        for (const pit of [0.4, 0.3, 0.5, 0.2, 0.6, 0.7]) {
          G.oyuncu.isinla(new T.Vector3(bx, b.h - 10, bz)); G.oyuncu.yaw = yaw; G.oyuncu.pitch = pit;
          tuslar.clear(); yeni = new Set(); sahteGirdi.eksen.x = 0; sahteGirdi.eksen.y = 0; sahteGirdi.fareDX = 0;
          O.guncelle(G, 1 / 60);
          const nn = G.oyuncu.nisanNokta;
          if (G.oyuncu.nisanVar && nn && nn.y >= b.h - 5.5 && nn.y <= b.h + 1.5 && nn.x > b.x - b.gx / 2 - 0.1 && nn.x < b.x + b.gx / 2 + 0.1 && nn.z > b.z - b.gz / 2 - 0.1 && nn.z < b.z + b.gz / 2 + 0.1) { secilenNisan = nn.clone(); break; }
        }
        if (!secilenNisan) { atlanan++; continue; }
        n++; sonuc.atlanan = atlanan;
        let zip = false, indi = -1;
        let maxY = -Infinity, zipKare = 0, sonY = 0, sonDurum = null;
        for (let i = 0; i < 480; i++) {
          tuslar.clear(); yeni = new Set(); sahteGirdi.eksen.x = 0; sahteGirdi.eksen.y = 0; sahteGirdi.fareDX = 0;
          if (i === 0) { tuslar.add('KeyE'); yeni.add('KeyE'); }
          O.guncelle(G, 1 / 60);
          const p = G.oyuncu;
          if (p.durum === 'zip') { zip = true; zipKare++; }
          if (p.konum.y > maxY) maxY = p.konum.y;
          sonY = p.konum.y; sonDurum = p.durum;
          if (p.yerde && p.konum.y > b.h - 1.5) { indi = i; break; }
        }
        if (sallan) sonuc.sallanGordu++;
        if (yuksek) sonuc.yuksekAnkraj++;
        if (zip) sonuc.zipGordu++;
        if (nisan) sonuc.nisanVar++;
        if (indi >= 0) { sonuc.catida++; sonuc.enGec = Math.max(sonuc.enGec, indi / 60); }
        sonuc.ayrinti.push([+b.h.toFixed(0), sallan, yuksek, zip, indi,
                            +(Number.isFinite(maxY) ? maxY : 0).toFixed(1), +sonY.toFixed(1), sonDurum, zipKare, secilenNisan.toArray()]);
      }
      G.girdi = eskiGirdi; return sonuc;
    })()"""


def js_test_his() -> str:
    # (e) kombo: sahte yakın düşman, 4 vuruş -> bitirici; (f) duvarda koşu; (g) mükemmel bırakış
    return "(async () => {" + JS_ORTAK + """
      G.girdi = sahteGirdi;
      const sonuc = { kombo: [], bitirici: 0, komboNo: [], duvar: 0, duvarDeneme: 0, duvarGordu: 0, konus: 0, muk: 0, mukDeneme: 0, sallan: 0, kacis: 0, ayrinti: [] };
      const olaylar = [];
      const dinle = (ad, fn) => { if (G.olay.off) {} G.olay.on(ad, fn); };
      let sayac = null;
      dinle('kombo', e => sayac && sayac.kombo.push(e.sayi));
      dinle('bitirici', () => sayac && sayac.bitirici++);
      dinle('yumruk', e => sayac && sayac.komboNo.push(e.komboNo));
      dinle('konus', () => sayac && sayac.konus++);
      dinle('mukemmelBirakis', () => sayac && sayac.muk++);
      dinle('kacis', () => sayac && sayac.kacis++);
      sayac = sonuc;
      // e) kombo
      G.oyuncu.isinla(new T.Vector3(0, 0, 0)); const zy = G.sehir.zeminY ? G.sehir.zeminY(0, 0) : 0;
      G.oyuncu.isinla(new T.Vector3(0, zy + 0.1, 0));
      for (let i = 0; i < 20; i++) O.guncelle(G, 1 / 60);
      const eskiD = G.dusman, p0 = G.oyuncu.konum;
      const sahteD = { konum: new T.Vector3(p0.x + 1.5, p0.y, p0.z - 1.0), canli: true, can: 99 };
      G.dusman = { liste: [sahteD], enYakin: () => sahteD, mermiler: [] };
      sonuc.kombo.length = 0; sonuc.komboNo.length = 0; sonuc.bitirici = 0;
      for (let i = 0; i < 90; i++) {
        tuslar.clear(); yeni = new Set(); sahteGirdi.eksen.x = 0; sahteGirdi.eksen.y = 0; sahteGirdi.fareDX = 0;
        if (i % 18 === 1) { tuslar.add('Fare0'); yeni.add('Fare0'); }
        O.guncelle(G, 1 / 60);
      }
      // kaçış: robot vuruşu 0.2 sn içinde, Space
      const robot = { konum: new T.Vector3(G.oyuncu.konum.x + 2, G.oyuncu.konum.y, G.oyuncu.konum.z), canli: true, sal: 0.2, tur: 'robot' };
      G.dusman = { liste: [robot], enYakin: () => null, mermiler: [] };
      tuslar.clear(); yeni = new Set(); O.guncelle(G, 1 / 60);
      const tehlike = G.oyuncu.tehlike;
      tuslar.add('Space'); yeni.add('Space'); O.guncelle(G, 1 / 60);
      sonuc.tehlike = tehlike;
      G.dusman = eskiD;
      // f) duvarda koşu
      const uzun = bin.filter(b => b.h > 18 && b.h < 70 && Math.hypot(b.x, b.z) < 250);
      for (let n = 0; n < 6; n++) {
        const b = uzun[(n * 5 + 1) % uzun.length], d = [[1, 0], [-1, 0], [0, 1], [0, -1]][n % 4];
        const bx = b.x + d[0] * (b.gx / 2 + 8), bz = b.z + d[1] * (b.gz / 2 + 8);
        if (icinde({ x: bx, y: 0, z: bz }) >= 0) continue;
        sonuc.duvarDeneme++;
        G.oyuncu.isinla(new T.Vector3(bx, 0, bz));
        G.oyuncu.yaw = Math.atan2(d[0], d[1]); G.oyuncu.pitch = 0.1;
        let gordu = false, cikti = false, enHiz = 0;
        for (let i = 0; i < 480; i++) {
          tuslar.clear(); yeni = new Set(); sahteGirdi.eksen.x = 0; sahteGirdi.eksen.y = 1; sahteGirdi.fareDX = 0;
          tuslar.add('KeyW'); tuslar.add('ShiftLeft');
          O.guncelle(G, 1 / 60);
          const p = G.oyuncu;
          if (p.durum === 'duvar') { gordu = true; enHiz = Math.max(enHiz, p.hiz.y); }
          if (n === 0 && i % 8 === 0 && i < 100) sonuc.iz = (sonuc.iz || []).concat([[i, p.durum, +p.konum.y.toFixed(1), +p.hiz.y.toFixed(1), +p.konum.x.toFixed(1), +p.konum.z.toFixed(1)]]);
          if (gordu && p.yerde && p.konum.y > b.h - 1.5) { cikti = true; break; }
        }
        if (gordu) sonuc.duvarGordu++; if (cikti) sonuc.duvar++;
        sonuc.ayrinti.push([+b.h.toFixed(0), gordu, cikti, +enHiz.toFixed(1)]);
      }
      // g) mükemmel bırakış: havada sağ tık basılı, tepe noktasında bırak
      const yuksek = bin.filter(b => b.h > 50 && Math.hypot(b.x, b.z) < 200);
      for (let n = 0; n < 8; n++) {
        const b = yuksek[(n * 3) % yuksek.length];
        sonuc.mukDeneme++;
        G.oyuncu.isinla(new T.Vector3(b.x - b.gx / 2 - 30, 38, b.z + (n - 4) * 3));
        G.oyuncu.yaw = -Math.PI / 2; G.oyuncu.pitch = 0.1; G.oyuncu.hiz.set(14, 3, 0);
        let birakildi = false;
        for (let i = 0; i < 420 && !birakildi; i++) {
          tuslar.clear(); yeni = new Set(); sahteGirdi.eksen.x = 0; sahteGirdi.eksen.y = 1; sahteGirdi.fareDX = 0;
          tuslar.add('KeyW');
          const p = G.oyuncu, a = p.ankraj;
          let birak = false;
          if (a) {
            const ip = p.konum.clone().sub(a).normalize(), hy = Math.hypot(p.hiz.x, p.hiz.z) || 1;
            if ((ip.x * p.hiz.x + ip.z * p.hiz.z) / hy > 0.3 && p.hiz.y > 2 && ip.y > -0.7 && ip.y < -0.2 && p.hiz.length() > 15) birak = true;
          }
          if (birak) birakildi = true; else { tuslar.add('Fare2'); if (i === 3) yeni.add('Fare2'); }
          if (a) { sonuc.sallan++; if (p.durum === 'sallan') sonuc.maxSw = Math.max(sonuc.maxSw || 0, p.hiz.length()); }
          if (n === 0 && i % 15 === 0 && i < 300) sonuc.iz2 = (sonuc.iz2 || []).concat([[i, p.durum, +p.konum.y.toFixed(1), +p.hiz.length().toFixed(1), !!a]]);
          O.guncelle(G, 1 / 60);
        }
      }
      sayac = null; G.girdi = eskiGirdi; return sonuc;
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


def js_test6() -> str:
    # Görünür kürelerin en yakın 12'sine sırayla ışınlanır; en fazla 3 oyun-sn.
    return """new Promise(resolve => {
      const G = window.G, T = G.THREE;
      let mesh = null;
      G.sahne.traverse(o => {
        if (!mesh && o && o.isInstancedMesh && o.count === 60 && o.geometry && o.geometry.type === 'OctahedronGeometry') mesh = o;
      });
      const r = { hata: null, bulundu: !!mesh, onceKure: G.gorev.toplamKure,
                  onceProg: G.gorev.aktif ? G.gorev.aktif.ilerleme : null,
                  noktaSayisi: 0, deneme: 0, tamam: false, neden: null,
                  gecenOyun: 0, gecenDuvar: 0, durum: G.oyuncu.durum,
                  konum: { x: G.oyuncu.konum.x, y: G.oyuncu.konum.y, z: G.oyuncu.konum.z } };
      if (!mesh) { r.hata = 'Işık Küresi InstancedMesh bulunamadı'; resolve(r); return; }
      const m = new T.Matrix4(), p = new T.Vector3(), sc = new T.Vector3();
      const noktalar = [];
      for (let i = 0; i < mesh.count; i++) {
        mesh.getMatrixAt(i, m); p.setFromMatrixPosition(m); sc.setFromMatrixScale(m);
        if (sc.x > 0.01 && sc.y > 0.01) noktalar.push(p.clone());
      }
      r.noktaSayisi = noktalar.length;
      if (!noktalar.length) { r.hata = 'görünür küre örneği yok'; resolve(r); return; }
      const pk = G.oyuncu.konum;
      noktalar.sort((a, b) => a.distanceToSquared(pk) - b.distanceToSquared(pk));
      const aday = noktalar.slice(0, 12);
      const g0 = G.t, w0 = performance.now();
      let idx = 0, sonDene = -1, bitti = false;
      const kontrol = () => (G.gorev.toplamKure > r.onceKure) ||
        (G.gorev.aktif && r.onceProg !== null && (G.gorev.aktif.ilerleme || 0) > r.onceProg);
      const bitir = (neden) => {
        if (bitti) return; bitti = true; clearInterval(id);
        r.neden = neden; r.tamam = kontrol();
        r.gecenOyun = G.t - g0; r.gecenDuvar = (performance.now() - w0) / 1000;
        r.deneme = idx; r.durum = G.oyuncu.durum;
        r.konum = { x: G.oyuncu.konum.x, y: G.oyuncu.konum.y, z: G.oyuncu.konum.z };
        r.sonKure = G.gorev.toplamKure;
        r.sonProg = G.gorev.aktif ? G.gorev.aktif.ilerleme : null;
        r.aktifAd = G.gorev.aktif ? G.gorev.aktif.ad : null;
        resolve(r);
      };
      const dene = () => {
        if (idx >= aday.length) return false;
        G.oyuncu.isinla(aday[idx++]); sonDene = G.t; return true;
      };
      dene();
      const id = setInterval(() => {
        if (kontrol()) return bitir('toplandi');
        if (G.t - g0 >= 3.0) return bitir('oyun-suresi');
        if (performance.now() - w0 >= 30000) return bitir('duvar-suresi');
        if (G.t - sonDene >= 0.25) { if (!dene()) return bitir('aday-bitti'); }
      }, 50);
    })"""



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


def js_test7_bekle() -> str:
    return js_gt_bekle(
        "((window.__TEST_OLAY || []).some(e => e && e.ad === 'yenildi') && G.oyuncu && "
        "G.oyuncu.can >= G.oyuncu.canMax - 1e-6 && Number.isFinite(G.oyuncu.konum.y) && G.oyuncu.konum.y > -5)",
        4.0, 30.0,
    )



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
    # Eşzamanlı ajanlar SwiftShader CPU'sunu paylaştığı için çok küçük tampon ve
    # yalnız temel RenderPass kullanılır; renderer.info yine gerçek çizim sayılarını verir.
    return """(() => {
      const G = window.G;
      G.renderer.setPixelRatio(0.5);
      G.renderer.setSize(160, 90, false);
      G.composer.setSize(160, 90);
      if (G.bloom) G.bloom.enabled = false;
      G.renderer.shadowMap.enabled = false;
      if (Array.isArray(G.composer.passes)) {
        G.composer.passes.forEach((p, i) => { try { p.enabled = (i === 0); } catch (e) {} });
      }
      G.kamera.aspect = 160 / 90;
      G.kamera.updateProjectionMatrix();
      return {
        tampon: { genislik: G.renderer.domElement.width, yukseklik: G.renderer.domElement.height },
        bloom: G.bloom ? G.bloom.enabled : null, golge: G.renderer.shadowMap.enabled,
        etkinPass: Array.isArray(G.composer.passes) ? G.composer.passes.filter(p => p.enabled).length : null,
        toplamPass: Array.isArray(G.composer.passes) ? G.composer.passes.length : null
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


def js_konsol_durum() -> str:
    return """(() => ({
      testKonsol: Array.isArray(window.__TEST_KONSOL) ? window.__TEST_KONSOL.slice(-500) : [],
      zifirHatalar: Array.isArray(window.__ZIFIR_HATALAR) ? window.__ZIFIR_HATALAR.slice() : []
    }))()"""


def js_ses() -> str:
    return """(() => {
      const G = window.G, s = G && G.ses;
      const r = { var: !!s, yuklendi: !!(s && s.yuklendi), calisti: false, calHata: null };
      if (!s) return r;
      try {
        if (typeof s.cal === 'function') { s.cal('arayuz_sec'); r.calisti = true; }
        else r.calHata = "G.ses.cal fonksiyonu yok";
      } catch (e) { r.calHata = String((e && e.message) || e); }
      return r;
    })()"""


def js_arayuz() -> str:
    return """(() => {
      const G = window.G, a = G && G.ayar;
      const r = { var: !!a, alanlar: {}, once: G ? G.kalite : null, ara: null, son: null,
                  kaliteHata: null, geriHata: null };
      if (!a) return r;
      for (const k of ['hassasiyet', 'yTers', 'fov']) r.alanlar[k] = (k in a);
      try {
        G.kaliteAyarla('dusuk'); r.ara = G.kalite;
        G.kaliteAyarla('orta'); r.son = G.kalite;
      } catch (e) { r.kaliteHata = String((e && e.message) || e); }
      try { if (r.once) G.kaliteAyarla(r.once, false); } catch (e) { r.geriHata = String((e && e.message) || e); }
      return r;
    })()"""


def js_efekt() -> str:
    return """new Promise(resolve => {
      const G = window.G, e = G && G.efekt;
      const r = { var: !!e, fonks: {}, hatalar: [], minZamanOlcek: null, ornek: 0,
                  once: G ? G.zamanOlcek : null, gecenOyun: 0, gecenDuvar: 0, neden: null };
      if (!e) { resolve(r); return; }
      for (const ad of ['sars', 'yavasCekim', 'vurusDuraklat', 'hizBulanikligi', 'flas'])
        r.fonks[ad] = typeof e[ad] === 'function';
      const dene = (ad, ...a) => { try { e[ad](...a); } catch (err) { r.hatalar.push(ad + ': ' + String((err && err.message) || err)); } };
      try { G.zamanOlcek = 1; } catch (err) { /* yok say */ }
      dene('sars', 0.2, 0.2);
      dene('yavasCekim', 0.5, 0.8);
      const g0 = G.t, w0 = performance.now();
      let min = Infinity, n = 0, bitti = false;
      const bitir = (neden) => {
        if (bitti) return;
        bitti = true;
        r.minZamanOlcek = Number.isFinite(min) ? min : null;
        r.ornek = n; r.neden = neden;
        r.gecenOyun = ((window.G && window.G.t) || 0) - g0;
        r.gecenDuvar = (performance.now() - w0) / 1000;
        // Kalan efekt fonksiyonlarını da çağır (hata varsa listeye eklenir).
        dene('vurusDuraklat', 0.05);
        dene('hizBulanikligi', 0.5);
        dene('flas', 0xff3030, 0.2);
        resolve(r);
      };
      function adim() {
        if (bitti) return;
        const z = G.zamanOlcek;
        if (typeof z === 'number' && z < min) min = z;
        n++;
        if (G.t - g0 >= 0.8) return bitir('oyun-suresi');
        if (performance.now() - w0 > 30000) return bitir('duvar-suresi');
        requestAnimationFrame(adim);
      }
      requestAnimationFrame(adim);
    })"""


def js_kahraman() -> str:
    return """(() => {
      const G = window.G, k = G && G.kahraman;
      if (!k || !k.grup) return { var: false, skinned: 0, isimler: [], cocuk: 0 };
      let skinned = 0; const isimler = [];
      k.grup.traverse(o => { if (o && o.isSkinnedMesh) { skinned++; if (isimler.length < 3) isimler.push(o.name || '?'); } });
      return { var: true, skinned, isimler, cocuk: k.grup.children.length };
    })()"""


def js_dusman() -> str:
    return """(() => {
      const G = window.G, D = G && G.dusman;
      const r = { var: !!D, listeDizi: !!(D && Array.isArray(D.liste)), robot: 0, dron: 0,
                  mermilerVar: false, mermilerDizi: false, oyuncuMermileriDizi: false };
      if (!r.listeDizi) return r;
      for (const e of D.liste) {
        if (!e || !e.canli) continue;
        if (e.tur === 'robot') r.robot++;
        else if (e.tur === 'dron') r.dron++;
      }
      r.mermilerVar = ('mermiler' in D);
      r.mermilerDizi = Array.isArray(D.mermiler);
      r.oyuncuMermileriDizi = Array.isArray(D.oyuncuMermileri);
      return r;
    })()"""


def js_egitim() -> str:
    return """(() => {
      const G = window.G, g = G && G.gorev;
      const a = g && g.aktif && g.aktif.ad;
      const ad = (typeof a === 'string') ? a : null;
      return {
        var: !!g, ad, egitimde: !!(g && g.egitimde),
        adim: !!(ad && ad.indexOf('EĞİTİM') === 0),
        ipucu: g && g.ipucu ? (g.ipucu.baslik || null) : null
      };
    })()"""


def js_perf() -> str:
    # Oyun saati G.t üzerinden 5 saniye; her karede renderer.info.render değerleri.
    return """new Promise(resolve => {
      const G = window.G || {}, info = G.renderer && G.renderer.info;
      const g0 = (typeof G.t === 'number') ? G.t : 0;
      const w0 = performance.now();
      const GT = 5.0, WALL = 180000;
      let n = 0, calls = 0, tri = 0, minC = Infinity, maxC = -Infinity, bitti = false;
      const bitir = (neden) => {
        if (bitti) return;
        bitti = true;
        clearTimeout(guard);
        const g = ((window.G && window.G.t) || 0) - g0;
        resolve({
          tamam: neden === 'oyun-suresi' && n > 0, neden,
          ornek: n, ortalamaCagri: n ? calls / n : null, ortalamaUcgen: n ? tri / n : null,
          minCagri: Number.isFinite(minC) ? minC : null, maxCagri: Number.isFinite(maxC) ? maxC : null,
          gecenOyun: g, gecenDuvar: (performance.now() - w0) / 1000,
          renderKapali: !!G.__TEST_RENDER_KAPALI, infoVar: !!info
        });
      };
      const guard = setTimeout(() => bitir('duvar-suresi'), WALL + 500);
      function adim() {
        if (bitti) return;
        const r = info && info.render;
        if (r) { const c = +r.calls || 0, t = +r.triangles || 0; calls += c; tri += t; n++; if (c < minC) minC = c; if (c > maxC) maxC = c; }
        const g = ((window.G && window.G.t) || 0) - g0;
        if (g >= GT) return bitir('oyun-suresi');
        if (performance.now() - w0 >= WALL) return bitir('duvar-suresi');
        requestAnimationFrame(adim);
      }
      requestAnimationFrame(adim);
    })"""


# G.t tabanlı bekleme koşulları (JS ifadeleri)
KOSUL_SKINNED = """(() => {
  const g = window.G && window.G.kahraman && window.G.kahraman.grup;
  if (!g) return false;
  let n = 0; g.traverse(o => { if (o && o.isSkinnedMesh) n++; });
  return n > 0;
})()"""

KOSUL_DUSMAN = """(() => {
  const D = window.G && window.G.dusman;
  if (!D || !Array.isArray(D.liste)) return false;
  let robot = 0, dron = 0;
  for (const e of D.liste) { if (!e || !e.canli) continue; if (e.tur === 'robot') robot++; else if (e.tur === 'dron') dron++; }
  return robot >= 1 && dron >= 1;
})()"""

KOSUL_EGITIM = """(() => {
  const G = window.G, g = G && G.gorev;
  const a = g && g.aktif && g.aktif.ad;
  return typeof a === 'string' && a.indexOf('EĞİTİM') === 0 && !!g.egitimde;
})()"""



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

    global CDP_PORT

    sunucu = None
    sunucu_bizim = False
    chrome = None
    chrome_log = None
    chrome_log_yolu: Path | None = None
    profil = None
    ws = None
    sonuclar: list[dict] = []

    def ekle(ad: str, gecti: bool, detay: str, modul: str) -> None:
        no = len(sonuclar) + 1
        sonuclar.append({"no": no, "ad": ad, "gecti": bool(gecti), "detay": detay, "modul": modul})
        print(f"{no}. {'GEÇTİ' if gecti else 'KALDI'} — {ad}: {detay}")

    try:
        if not sunucu_hazir():
            print(f"[bilgi] {PORT} portunda ZİFİR sunucusu yok; başlatılıyor…")
            sunucu = subprocess.Popen(
                [sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
                cwd=str(KOK), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
            sunucu_bizim = True
            if not bekle(sunucu_hazir, 10):
                raise RuntimeError(f"http://127.0.0.1:{PORT} başlatılamadı")
        else:
            print(f"[bilgi] {PORT} portundaki mevcut ZİFİR sunucusu kullanılıyor")

        # Eşzamanlı ajanlar 9333 gibi sabit bir portta çakışmasın: boş port seç.
        for _ in range(20):
            CDP_PORT = bos_port()
            if not port_acik(CDP_PORT):
                break
        print(f"[bilgi] Chrome DevTools portu: {CDP_PORT} (otomatik seçildi)")

        profil = tempfile.mkdtemp(prefix="zifir-test-chrome-")
        chrome_log_yolu = Path(profil) / "chrome.log"
        chrome_log = open(chrome_log_yolu, "wb")
        chrome_args = [
            chrome_yolu,
            "--headless=new",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
            f"--remote-debugging-port={CDP_PORT}",
            "--remote-allow-origins=*",
            f"--user-data-dir={profil}",
            "--window-size=640,360",
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

        # swiftshader + eşzamanlı Chrome yükü altında ağır çizim oyun saatini 0.05 sn/frame
        # sınırına takıyor. Oyun kodunu değiştirmeden yalnız çizim yükünü azaltıyoruz;
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
        ekle("8 modül yüklü ve hata listesi boş", gecti1, detay1, "oyun.js + tüm modüller")

        # 2 + 3 — 10 sn konum gözlemi ve sallanma örneklemesi
        print("[bilgi] 10 sn konum/sallanma gözlemi…")
        gozlem = cdp.degerlendir(js_gozlem(), promise=True)
        minY = gozlem.get("minY")
        maxY = gozlem.get("maxY")
        nan = gozlem.get("nan", 0)
        dusuk = gozlem.get("dusuk", 0)
        gecti2 = bool(gozlem.get("tamam")) and nan == 0 and minY is not None and minY > -5
        detay2 = (f"{gozlem.get('ornek', 0)} örnek / {gozlem.get('gecenSure', 0):.1f} oyun-sn "
                  f"({gozlem.get('neden')}); NaN={nan}; y min={minY if minY is not None else 'yok'}, "
                  f"max={maxY if maxY is not None else 'yok'}; y<=-5 örnek={dusuk}")
        if gozlem.get("yeniHatalar"):
            detay2 += f"; yeni hatalar={gozlem['yeniHatalar'][:2]}"
        ekle("10 sn boyunca konum NaN değil ve y > -5", gecti2, detay2, "oyuncu.js")
        bina_ici_demo = gozlem.get("binaIci", 0)

        sallan = gozlem.get("sallan", 0)
        toplam_sallanma = gozlem.get("sallanmaToplam", 0)
        gecti3 = sallan > 0 or toplam_sallanma > 0
        detay3 = (f"'sallan'/'cek' durumu {sallan}/{gozlem.get('ornek', 0)} örnekte görüldü (G.t'ye göre "
                  f"{gozlem.get('gecenSure', 0):.1f} oyun-sn); oyuncu toplam sallanma sayacı={toplam_sallanma}")
        ekle("Test demosunda sallanma en az bir kez gerçekleşti", gecti3, detay3,
             "girdi.js (test demosu) + oyuncu.js (sallanma)")

        # 4 — kahraman GLB / SkinnedMesh (en fazla 15 oyun-sn)
        print("[bilgi] GLB SkinnedMesh bekleniyor (en fazla 15 oyun-sn)…")
        kh_bekle = cdp.degerlendir(js_gt_bekle(KOSUL_SKINNED, 15.0, 120.0), promise=True) or {}
        kh = cdp.degerlendir(js_kahraman()) or {}
        gecti_kh = bool(kh_bekle.get("tamam") and kh.get("skinned", 0) > 0)
        if not kh.get("var"):
            detay_kh = "G.kahraman / G.kahraman.grup yok"
        else:
            detay_kh = (f"SkinnedMesh={kh.get('skinned', 0)} ({kh.get('isimler')}), grup çocuk={kh.get('cocuk')}; "
                        f"bekleme {kh_bekle.get('gecenOyun', 0):.1f} oyun-sn ({kh_bekle.get('neden')}), "
                        f"duvar {kh_bekle.get('gecenDuvar', 0):.1f} sn")
        ekle("G.kahraman.grup içinde GLB SkinnedMesh yüklendi (≤15 oyun-sn)", gecti_kh, detay_kh, "kahraman.js")

        # 5 — düşman listesinde en az 1 dron + 1 robot, mermiler dizi
        print("[bilgi] Düşman dron/robot bekleniyor (en fazla 30 oyun-sn)…")
        ds_bekle = cdp.degerlendir(js_gt_bekle(KOSUL_DUSMAN, 30.0, 120.0), promise=True) or {}
        ds = cdp.degerlendir(js_dusman()) or {}
        gecti_ds = bool(ds_bekle.get("tamam") and ds.get("robot", 0) >= 1 and ds.get("dron", 0) >= 1
                        and (not ds.get("mermilerVar") or ds.get("mermilerDizi")))
        detay_ds = (f"robot={ds.get('robot', 0)}, dron={ds.get('dron', 0)}, liste dizi={ds.get('listeDizi')}; "
                    f"G.dusman.mermiler var={ds.get('mermilerVar')} dizi={ds.get('mermilerDizi')}, "
                    f"oyuncuMermileri dizi={ds.get('oyuncuMermileriDizi')}; "
                    f"bekleme {ds_bekle.get('gecenOyun', 0):.1f} oyun-sn ({ds_bekle.get('neden')})")
        ekle("G.dusman.liste içinde en az 1 dron ve 1 robot var; mermiler dizi", gecti_ds, detay_ds, "dusman.js")

        # 6 — ses: G.ses tanımlı ve 'arayuz_sec' hatasız çalıyor
        ses = cdp.degerlendir(js_ses()) or {}
        gecti_ses = bool(ses.get("var") and ses.get("calisti") and not ses.get("calHata"))
        detay_ses = (f"G.ses={'var' if ses.get('var') else 'YOK'}, yuklendi={ses.get('yuklendi')}, "
                     f"'arayuz_sec' çağrısı={'hata yok' if ses.get('calisti') and not ses.get('calHata') else ('HATA: ' + str(ses.get('calHata')))}")
        ekle("Ses: G.ses.yuklendi / G.ses tanımlı ve 'arayuz_sec' hatasız çalıyor", gecti_ses, detay_ses, "ses.js")

        # 7 — arayüz ayarları ve kalite geçişi
        ay = cdp.degerlendir(js_arayuz()) or {}
        alanlar = ay.get("alanlar", {}) if isinstance(ay.get("alanlar"), dict) else {}
        gecti_ay = bool(ay.get("var") and all(alanlar.get(k) for k in ("hassasiyet", "yTers", "fov"))
                        and not ay.get("kaliteHata") and ay.get("ara") == "dusuk" and ay.get("son") == "orta")
        detay_ay = (f"G.ayar={'var' if ay.get('var') else 'YOK'}, alanlar={alanlar}; "
                    f"kalite {ay.get('once')}→dusuk→orta (ara={ay.get('ara')}, son={ay.get('son')}); "
                    f"hata={ay.get('kaliteHata')}")
        ekle("Arayüz: G.ayar (hassasiyet/yTers/fov) ve kalite 'dusuk'→'orta' hatasız", gecti_ay, detay_ay, "arayuz.js + oyun.js")
        # Test bütçesi: kalite denemesi çizim ayarlarını büyütmüş olabilir; tekrar küçült.
        cdp.degerlendir(js_hizlandir())

        # 8 — 5 oyun-sn performans bilgisi (renderer.info)
        print("[bilgi] 5 oyun-sn performans bilgisi toplanıyor…")
        perf = cdp.degerlendir(js_perf(), promise=True) or {}
        gecti_perf = bool(perf.get("tamam") and isinstance(perf.get("ortalamaCagri"), (int, float)))
        detay_perf = (f"ortalama {perf.get('ortalamaCagri')} çizim çağrısı/kare, "
                      f"{perf.get('ortalamaUcgen')} üçgen/kare; {perf.get('ornek')} kare, "
                      f"{perf.get('gecenOyun', 0):.1f} oyun-sn ({perf.get('neden')}), "
                      f"duvar {perf.get('gecenDuvar', 0):.1f} sn; render kapalı={perf.get('renderKapali')} (bilgi)")
        ekle("Performans bilgisi: 5 oyun-sn ortalama renderer.info çizim çağrısı/üçgen", gecti_perf, detay_perf,
             "oyun.js render döngüsü")

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

        # 9 — kare süresi (bilgi)
        ort = t8_tam.get("ortalama")
        fps = t8_tam.get("fps")
        gecti8 = isinstance(ort, (int, float))
        detay8 = (f"ortalama {ort:.2f} ms/kare (~{fps:.1f} fps), "
                  f"{t8_tam.get('kare')} kare / {t8_tam.get('sure', 0):.0f} ms; composer 160x90, "
                  f"çizim tamponu 80x45, yalnız RenderPass (bloom/gölge kapalı) — swiftshader yazılım render, bilgi amaçlı. "
                  f"Mantık testleri: {hiz_olcum.get('fps', 0):.1f} fps"
                  f"{' (render kapalı)' if render_kapali else ''}.")
        ekle("Ortalama kare süresi ölçüldü (yalnız bilgi)", gecti8, detay8, "oyun.js render döngüsü")

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
        ekle("ankrajBul yukarı-ileri ışında nokta buluyor; carpis iç noktayı dışarı itiyor",
             gecti4, detay4, "sehir.js")

        # 5 — yumruk olayı (düşman hazır olana kadar G.t tabanlı bekleme)
        cdp.degerlendir(js_gt_bekle(KOSUL_DUSMAN, 10.0, 60.0), promise=True)
        t5 = cdp.degerlendir(js_test5())
        if isinstance(t5, dict) and t5.get("hata"):
            gecti5 = False
            detay5 = t5["hata"]
        else:
            gecti5 = bool(t5.get("canDustu") or t5.get("sayiAzaldi") or t5.get("sonrakiCanli") is False)
            detay5 = (f"{t5.get('tur')} can {t5.get('oncekiCan')}→{t5.get('sonrakiCan')}, "
                      f"canlı {t5.get('oncekiCanli')}→{t5.get('sonrakiCanli')}, "
                      f"aktif {t5.get('oncekiAktif')}→{t5.get('sonrakiAktif')}")
        ekle("yumruk olayı robot canını düşürüyor / robot sayısını azaltıyor", gecti5, detay5, "dusman.js")

        # 6 — küreye ışınlanma (en fazla 3 oyun-sn, birden çok görünür küre denenir)
        t6 = cdp.degerlendir(js_test6(), promise=True) or {}
        if t6.get("hata"):
            gecti6 = False
            detay6 = t6["hata"]
        else:
            gecti6 = bool(t6.get("tamam"))
            detay6 = (f"küre {t6.get('onceKure')}→{t6.get('sonKure')}, görev ilerlemesi "
                      f"{t6.get('onceProg')}→{t6.get('sonProg')} ({t6.get('aktifAd')}); "
                      f"{t6.get('deneme')}/{t6.get('noktaSayisi')} görünür küre denendi, "
                      f"bekleme {t6.get('gecenOyun', 0):.1f} oyun-sn ({t6.get('neden')}); "
                      f"durum={t6.get('durum')}, konum={t6.get('konum')}")
        ekle("isinla(küre konumu) görev/küre sayısını artırıyor", gecti6, detay6,
             "gorev.js + oyuncu.js.isinla")

        # 7 — yenilme ve yeniden doğuş (G.t tabanlı, en fazla 4 oyun-sn)
        cdp.degerlendir(js_test7_kur())
        b7 = {}
        deneme_sayisi = 0
        for _ in range(3):
            deneme_sayisi += 1
            cdp.degerlendir("(() => { window.G.oyuncu.hasarAl(1000); return true; })()")
            b7 = cdp.degerlendir(js_test7_bekle(), promise=True) or {}
            if b7.get("tamam"):
                break
        son_durum7 = cdp.degerlendir(js_test7_durum()) or {}
        yenildi = any(e.get("ad") == "yenildi" for e in son_durum7.get("olaylar", []))
        tam_can = (son_durum7.get("can", 0) >= son_durum7.get("canMax", 100) - 1e-6 and
                   bool(son_durum7.get("gecerli")))
        gecti7 = bool(b7.get("tamam") and yenildi and tam_can)
        detay7 = (f"'yenildi'={'alındı' if yenildi else 'YOK'} ({deneme_sayisi} hasarAl(1000) çağrısı); "
                  f"bekleme {b7.get('gecenOyun', 0):.1f} oyun-sn ({b7.get('neden')}), "
                  f"duvar {b7.get('gecenDuvar', 0):.1f} sn; can={son_durum7.get('can')}/"
                  f"{son_durum7.get('canMax')}, durum={son_durum7.get('durum')}, "
                  f"konum={son_durum7.get('konum')}, geçerli={son_durum7.get('gecerli')}")
        ekle("hasarAl(1000) sonrası 4 oyun-sn içinde can dolu ve konum geçerli", gecti7, detay7, "oyuncu.js")

        # 10 — koşarak bina çarpışması (a)
        t10 = cdp.degerlendir(js_test_kosu(), promise=True) or {}
        gecti10 = t10.get("deneme", 0) >= 30 and t10.get("ihlal", 1) == 0
        detay10 = (f"{t10.get('deneme')} bina × 2 sn yerden 15 m/s koşu = {t10.get('ornek')} örnek; "
                   f"bina içinde ayak/bel/baş noktası={t10.get('ihlal')}" + (f" ilk={t10.get('ilk')}" if t10.get("ilk") else ""))
        ekle("30 binaya yerden 15 m/s koşuda oyuncu hiçbir bina kutusunun içine girmiyor", gecti10, detay10, "oyuncu.js + sehir.js")

        # 11 — sallanma/zip çarpışması (b)
        t11 = cdp.degerlendir(js_test_sallanma_carpisma(), promise=True) or {}
        gecti11 = t11.get("ihlal", 1) == 0 and bina_ici_demo == 0 and t11.get("sallan", 0) > 0
        detay11 = (f"{t11.get('deneme')} çatı denemesi × 10 sn (sallan+zıpla+E) = {t11.get('ornek')} örnek; "
                   f"bina içi={t11.get('ihlal')}, sallan/cek örneği={t11.get('sallan')}, max hız={t11.get('maxHiz', 0):.0f}; "
                   f"canlı demo 10 oyun-sn bina içi örnek={bina_ici_demo}" + (f" ilk={t11.get('ilk')}" if t11.get("ilk") else ""))
        ekle("Sallanma demosunda 10 sn boyunca bina içinde değil (simülasyon + canlı demo)", gecti11, detay11, "oyuncu.js + sehir.js")

        # 12 — görsel matris / fizik kutusu uyuşması (c)
        t12 = cdp.degerlendir(js_test_gorsel_kutu(), promise=True) or {}
        gecti12 = t12.get("kutuEslesmeyen", 1) == 0 and t12.get("carpisiz", 1) == 0 and t12.get("instance", 0) > 0
        detay12 = (f"görsel instance={t12.get('instance')}, binalar[].kutu={t12.get('bina')}; kutusu eşleşmeyen={t12.get('kutuEslesmeyen')}, "
                   f"fizik katı olmayan görsel nokta={t12.get('carpisiz')}" + (f" ornek={t12.get('ornek') or t12.get('carpisizOrnek')}" if (t12.get("ornek") or t12.get("carpisizOrnek")) else ""))
        ekle("Görsel bina instance matrisleri fizik kutularıyla uyuşuyor", gecti12, detay12, "sehir.js")

        # 13 — sağ tık yerden sallanma + E ile yüksek çatıya zip
        t13 = cdp.degerlendir(js_test_cekis(), promise=True) or {}
        gecti13 = (t13.get("sallanGordu", 0) == t13.get("deneme", -1)
                   and t13.get("yuksekAnkraj", 0) == t13.get("deneme", -1)
                   and t13.get("zipGordu", 0) == t13.get("deneme", -1)
                   and t13.get("catida", 0) == t13.get("deneme", -1)
                   and t13.get("nisanVar", 0) == t13.get("deneme", -1))
        detay13 = (f"{t13.get('deneme')} yerden denemede sallanma={t13.get('sallanGordu')}, "
                   f"yüksek ankraj={t13.get('yuksekAnkraj')}, zip={t13.get('zipGordu')}, "
                   f"çatıya inen={t13.get('catida')}, nişan yüksek hedefte={t13.get('nisanVar')}, "
                   f"en geç iniş={t13.get('enGec', 0):.1f} sn; durumlar={t13.get('durumlar')}, "
                   f"ankrajlı kare={t13.get('ankrajKare')}, çatı hedefi olmadığı için atlanan bina={t13.get('atlanan', 0)}; [bina_h, sallan, yüksekAnkraj, zip, iniş_kare, maxY, sonY, sonDurum, zipKare, secilenNisan]={t13.get('ayrinti')}")
        ekle("Yerden sağ tık yüksek ankrajla sallanma başlatıyor; E yüksek çatıya çekiyor ve nişan yüksek hedefi gösteriyor",
             gecti13, detay13, "oyuncu.js + sehir.js")

        # 14-16 — his: kombo, duvarda koşu, mükemmel bırakış
        t14 = cdp.degerlendir(js_test_his(), promise=True) or {}
        gecti14 = t14.get("bitirici", 0) >= 1 and t14.get("komboNo", [])[:4] == [0, 1, 2, 3] and 4 in t14.get("kombo", [])
        ekle("Sol tık yakında 4 vuruşluk kombo: yumruk komboNo 0-3 ve 'bitirici' olayı", gecti14,
             f"komboNo={t14.get('komboNo')}, kombo sayacı={t14.get('kombo')}, bitirici={t14.get('bitirici')}; kaçış tehlike bayrağı={t14.get('tehlike')}, 'kacis' olayı={t14.get('kacis')}", "oyuncu.js")
        gecti15 = t14.get("duvarGordu", 0) >= 1 and t14.get("duvar", 0) >= max(1, t14.get("duvarDeneme", 1) * 2 // 3)
        ekle("Shift ile duvara koşunca duvarda koşu ve çatıya çıkış ('konus')", gecti15,
             f"{t14.get('duvarDeneme')} denemede duvar durumu={t14.get('duvarGordu')}, çatıya çıkan={t14.get('duvar')}, 'konus' olayı={t14.get('konus')}; [bina_h, duvar, çatı, max dikey hız]={t14.get('ayrinti')}", "oyuncu.js")
        gecti16 = t14.get("sallan", 0) > 0  # mükemmel bırakış sayısı zamanlamaya duyarlı: bilgi olarak raporlanır
        ekle("Havada sağ tık ileri-yukarı ankrajla klasik salınım başlatıyor (mükemmel bırakış sayısı bilgi)", gecti16,
             f"{t14.get('mukDeneme')} denemede mükemmel bırakış={t14.get('muk')}, salınım kare sayısı={t14.get('sallan')}, salınım max hız={t14.get('maxSw')} (zamanlamaya duyarlı)", "oyuncu.js")

        # 21 — efekt API'si (yavasCekim sırasında G.zamanOlcek < 1)
        print("[bilgi] Efekt API'si deneniyor…")
        ef = cdp.degerlendir(js_efekt(), promise=True) or {}
        fonks = ef.get("fonks", {}) if isinstance(ef.get("fonks"), dict) else {}
        ef_hatalar = list(ef.get("hatalar", []))
        gecti_ef = bool(ef.get("var") and
                        all(fonks.get(k) for k in ("sars", "yavasCekim", "vurusDuraklat", "hizBulanikligi", "flas")) and
                        not ef_hatalar and isinstance(ef.get("minZamanOlcek"), (int, float)) and
                        ef.get("minZamanOlcek") < 1)
        detay_ef = (f"fonksiyonlar={fonks}; çağrı hataları={ef_hatalar or 'yok'}; "
                    f"yavasCekim sırasında en düşük G.zamanOlcek={ef.get('minZamanOlcek')} "
                    f"({ef.get('ornek')} örnek, {ef.get('gecenOyun', 0):.1f} oyun-sn, {ef.get('neden')})")
        ekle("Efekt: G.efekt.sars/yavasCekim/vurusDuraklat/hizBulanikligi/flas hatasız; yavasCekim'de G.zamanOlcek<1",
             gecti_ef, detay_ef, "oyun.js (G.efekt)")

        # 22 — eğitim modu: ?test=1&egitim=1
        # Ana sayfanın konsol kayıtlarını gezinmeden önce sakla (enjeksiyon yeni belgede sıfırlanır).
        konsol_once = cdp.degerlendir(js_konsol_durum()) or {}
        print("[bilgi] Eğitim sayfası açılıyor (?test=1&egitim=1)…")
        egitim_hata = None
        egitim_bekle = {}
        egitim = {}
        try:
            # Eğitim sayfası testte düşük kalitede açılsın (yalnız localStorage, oyun kodu değil).
            cdp.degerlendir("(() => { try { localStorage.setItem('zifir_kalite', 'dusuk'); } catch (e) {} return true; })()")
            cdp.komut("Page.navigate", {"url": EGITIM_URL})
            egitim_hazir = bekle(
                lambda: cdp.degerlendir(
                    "(() => { const G = window.G; return !!(G && G.t > 0.15 && G.oyuncu && G.oyuncu.konum); })()"
                ),
                45, 0.2,
            )
            if not egitim_hazir:
                egitim_hata = "eğitim sayfası 45 sn içinde hazır olmadı"
            else:
                cdp.degerlendir(js_hizlandir())
                egitim_bekle = cdp.degerlendir(js_gt_bekle(KOSUL_EGITIM, 10.0, 120.0), promise=True) or {}
                egitim = cdp.degerlendir(js_egitim()) or {}
        except Exception as e:
            egitim_hata = f"eğitim sayfası açılamadı: {e}"
        gecti_eg = bool(not egitim_hata and egitim_bekle.get("tamam") and
                        egitim.get("adim") and egitim.get("egitimde"))
        if egitim_hata:
            detay_eg = egitim_hata
        else:
            detay_eg = (f"G.gorev.egitimde={egitim.get('egitimde')}, aktif.ad={egitim.get('ad')!r}, "
                        f"ipucu={egitim.get('ipucu')!r}; bekleme {egitim_bekle.get('gecenOyun', 0):.1f} oyun-sn "
                        f"({egitim_bekle.get('neden')})")
        ekle("Eğitim: ?test=1&egitim=1 ile G.gorev.aktif.ad eğitim adımı oluyor", gecti_eg, detay_eg, "gorev.js")

        # 23 — konsol hataları (tüm koşu: ana sayfa + eğitim sayfası + CDP + Chrome stderr)
        son = cdp.degerlendir(js_son_konsol(), promise=True) or {}
        satirlar: list[str] = []
        satirlar += ["ana-zifir: " + str(x) for x in konsol_once.get("zifirHatalar", [])]
        satirlar += ["ana-sayfa: " + str(x) for x in konsol_once.get("testKonsol", [])]
        satirlar += ["egitim-zifir: " + str(x) for x in son.get("zifirHatalar", [])]
        satirlar += ["egitim-sayfa: " + str(x) for x in son.get("testKonsol", [])]
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
            if chrome_log:
                chrome_log.flush()
            if chrome_log_yolu and chrome_log_yolu.exists():
                with open(chrome_log_yolu, "r", encoding="utf-8", errors="replace") as f:
                    for satir in f:
                        temiz = satir.strip().replace("\n", " ")
                        if HATA_DESENI.search(temiz) and temiz not in eslesen:
                            eslesen.append(temiz)
        except Exception:
            pass
        gecti9 = not eslesen
        detay9 = ("tüm koşuda 'Uncaught' / 'SHADER' / 'is not defined' satırı yok "
                  "(ana sayfa + eğitim sayfası + CDP + Chrome stderr)") if gecti9 else \
                 f"{len(eslesen)} eşleşen hata satırı: " + " | ".join(eslesen[:3])
        modul9 = "shader ise sehir/kahraman/arayuz/oyun; 'is not defined' ise satırdaki modül"
        for ad in MODULLER:
            if any(ad in x for x in eslesen):
                modul9 = f"{ad}.js (satırda modül adı geçiyor)"
                break
        ekle("Konsolda Uncaught / SHADER / is not defined hatası yok (tüm koşu)", gecti9, detay9, modul9)

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
        if chrome_log:
            try:
                chrome_log.close()
            except Exception:
                pass
        if profil:
            shutil.rmtree(profil, ignore_errors=True)
        if sunucu_bizim and sunucu:
            try:
                sunucu.terminate()
                sunucu.wait(timeout=5)
            except Exception:
                try:
                    sunucu.kill()
                except Exception:
                    pass

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
    cizgiler.append(f"- URL: `{OYUN_URL}` (ana) ve `{EGITIM_URL}` (eğitim)")
    cizgiler.append(f"- Chrome DevTools portu: `{CDP_PORT}` (socket bind 0 ile otomatik seçildi)")
    cizgiler.append("- Ortam: başsız Chrome (`--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader`), her koşuda ayrı geçici `--user-data-dir`")
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
            m = s.get("modul", "")
            if "kahraman" in m:
                ip = "GLB/GLTFLoader yolu, ağ isteği veya `SkinnedMesh` oluşturma; `js/kahraman.js`."
            elif "ses" in m:
                ip = "`G.ses.cal` / ses dosyası yükleme ve `G.ses.yuklendi`; `js/ses.js`."
            elif "arayuz" in m:
                ip = "`G.ayar` varsayılanları veya `G.kaliteAyarla`; `js/arayuz.js` + `js/oyun.js`."
            elif "gorev" in m:
                ip = "Eğitim zinciri (`EGITIM` / `egitimAdim`) veya küre toplama; `js/gorev.js`."
            elif "dusman" in m:
                ip = "Dron/robot doğma listesi, yumruk hasarı veya mermi havuzu; `js/dusman.js`."
            elif "sehir" in m:
                ip = "Işın/AABB verisi veya çarpışma düzeltmesi; `js/sehir.js`."
            elif "oyuncu" in m:
                ip = "Fizik/çarpışma, `hasarAl` yeniden doğuşu, çekiş/duvar koşusu veya ışınlama; `js/oyuncu.js`."
            elif "oyun" in m:
                ip = "Render döngüsü, `G.efekt`, `G.zamanOlcek` veya `renderer.info`; `js/oyun.js`."
            else:
                ip = "Ayrıntı çıktısına ve ilgili modül dosyasına bakın."
            cizgiler.append(f"  - Olası neden: {ip}")
        cizgiler.append("")
    cizgiler.append("## Notlar")
    cizgiler.append("")
    cizgiler.append("- 23 kontrolün tamamı GEÇTİ/KALDI + ayrıntı olarak raporlanır; oyun kodu değiştirilmedi.")
    cizgiler.append("- Chrome DevTools portu her koşuda `socket.bind(('127.0.0.1', 0))` ile boş porttan seçilir; `--user-data-dir` her koşuda `tempfile.mkdtemp` ile oluşturulur ve `try/finally` içinde Chrome ile birlikte kapatılıp silinir. Böylece eşzamanlı ajanlar 9333 portunda çakışmaz.")
    cizgiler.append("- Zamanlamaya duyarlı beklemeler oyun saati `G.t` üzerinden yapılır (kahraman GLB ≤15, düşman ≤30, küre ≤3, yeniden doğuş ≤4, efekt ≤1, eğitim ≤10 oyun-sn). Oyun saati üst sınırı aşarsa ilgili kontrol KALDI olur; duvar saati yalnız güvenlik sınırıdır.")
    cizgiler.append("- Kare süresi kontrolü 80x45 çizim tamponunda (composer 160x90), yalnız temel RenderPass ve gölge kapalı ölçülür; swiftshader yazılım render'ı gerçek GPU performansını yansıtmaz. 5 oyun-sn performans bilgisi `renderer.info.render.calls/triangles` kare ortalamasıdır.")
    cizgiler.append("- swiftshader + eşzamanlı ajan yükü altında (geliştirme sırasında 0.2-0.8 fps ölçüldü; oyun saati dt=0.05 sınırıyla ilerler) yalnız çizim yükü azaltıldı: 640x360 pencere, composer 160x90 / 80x45 tampon, yalnız RenderPass, bloom ve gölge kapalı; gerekirse render çağrısı durduruldu. Fizik ve görev mantığı aynı `guncelle` döngüsüyle çalıştı.")
    cizgiler.append("- Çekiş kontrolü güncel bakış sözleşmesini kullanır: nişan oyuncunun en az 6 m üstünde olmalıdır; çatı son 5,5 m cephesinde gerçekten görülen önizleme seçilir ve konum/bakış yeniden kurulmadan hemen sonraki kare E basılır. Altı ayrı örnekte gerçek çatıya iniş şartı korunur; seçilen nişan koordinatları ayrıntıya yazılır.")
    cizgiler.append("- Test demosu `girdi.js` içinde `?test=1` sırasında ilk 6 saniye çalışır.")
    cizgiler.append("- Eğitim kontrolü ana sayfa kontrollerinden sonra `?test=1&egitim=1` adresine gezinir; ana sayfanın konsol kayıtları gezinmeden önce saklanır ve eğitim sayfasınınkilerle birleştirilir.")
    cizgiler.append("- Konsol taraması tüm koşu boyunca sayfa `console.error/warn`, `window.__ZIFIR_HATALAR`, CDP istisnaları ve Chrome stderr üzerinden 'Uncaught' / 'SHADER' / 'is not defined' için yapıldı.")
    cizgiler.append("- Oyun kodu düzeltilmedi; yalnız sorunlu modül ve ayrıntı raporlandı.")

    RAPOR.parent.mkdir(parents=True, exist_ok=True)
    RAPOR.write_text("\n".join(cizgiler) + "\n", encoding="utf-8")
    print(f"[bilgi] Rapor yazıldı: {RAPOR}")
    if fatal:
        return 3
    return 0 if kalan == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
