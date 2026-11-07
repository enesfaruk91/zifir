#!/usr/bin/env python3
"""basinevleri.json -> kusbakisi PNG (Pillow) + istatistik. Kullanim: python3 tools/harita_onizle.py"""
import json, os, collections
from PIL import Image, ImageDraw
KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
H = json.load(open(os.path.join(KOK, 'assets/harita/basinevleri.json')))
k = H['baslik']['kapsam_m']
S = 1.4  # px/m (kuzey yukari: z kucuk = ust)
W, Ht = int((k['x_max'] - k['x_min']) * S), int((k['z_max'] - k['z_min']) * S)
img = Image.new('RGB', (W, Ht), (28, 30, 34)); d = ImageDraw.Draw(img)
P = lambda p: ((p[0] - k['x_min']) * S, (p[1] - k['z_min']) * S)
# yukseklik (soluk kahverengi tonu)
g = H['yukseklik_izgara']; mx = max(g['deger']) or 1
for j in range(g['nz']):
    for i in range(g['nx']):
        v = g['deger'][j * g['nx'] + i] / mx
        x, y = P((g['x0'] + i * g['adim'] - g['adim'] / 2, g['z0'] + j * g['adim'] - g['adim'] / 2))
        d.rectangle([x, y, x + g['adim'] * S, y + g['adim'] * S], fill=(int(30 + 40 * v), int(32 + 28 * v), 34))
ren = {'park': (40, 120, 50), 'cimen': (50, 110, 55), 'orman': (25, 90, 40), 'oyun_alani': (60, 150, 70), 'spor_alani': (70, 140, 90), 'su': (40, 80, 160)}
for a in H['alanlar']:
    if 'halka' in a and a['tur'] in ren: d.polygon([P(p) for p in a['halka']], fill=ren[a['tur']])
    elif 'cizgi' in a: d.line([P(p) for p in a['cizgi']], fill=(60, 110, 200), width=3)
for y in H['yollar']:
    d.line([P(p) for p in y['nokta']], fill=(255, 255, 255) if y['arac_yolu'] else (150, 150, 150), width=max(1, int(y['genislik'] * S)))
for b in H['binalar']:
    v = min(1, b['yukseklik'] / 40); c = int(70 + 170 * v)
    d.polygon([P(p) for p in b['halka']], fill=(c, c, c), outline=(255, 190, 90) if b.get('tahmin') else None)
for p in H['agaclar']:
    x, y = P(p); d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(20, 160, 40))
d.line([P(p) for p in H['sinir'] + [H['sinir'][0]]], fill=(255, 30, 30), width=3)
out = os.path.join(KOK, 'RAPOR/basinevleri_onizleme.png'); img.save(out)
B = H['binalar']; n = len(B)
print('PNG', out, img.size)
print('bina', n, 'height/levels dolu', sum(1 for b in B if not b.get('tahmin')), 'tahmin', n - sum(1 for b in B if not b.get('tahmin')))
print('kaynak', dict(collections.Counter(b['yuk_kaynak'] for b in B)))
print('tur', dict(collections.Counter(b['tur'] for b in B)))
print('yukseklik min/ort/maks', min(b['yukseklik'] for b in B), round(sum(b['yukseklik'] for b in B) / n, 1), max(b['yukseklik'] for b in B))
print('taban alani toplam m2', round(sum(b['alan'] for b in B)), 'ic halkali', sum(1 for b in B if 'ic_halkalar' in b))
print('yol', len(H['yollar']), 'uzunluk m', H['baslik']['sayilar']['yol_uzunluk_m'], dict(collections.Counter(y['tur'] for y in H['yollar'])))
print('yol genislik tahmin', sum(1 for y in H['yollar'] if y.get('tahmin')))
print('alan', dict(collections.Counter(a['tur'] for a in H['alanlar'])))
