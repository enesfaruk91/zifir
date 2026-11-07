#!/usr/bin/env python3
"""OSM ham verisi -> ZIFIR oyun haritasi (yalniz standart kutuphane).
Kullanim: python3 tools/osm_cevir.py [--yukseklik-onbellek DOSYA] [--yukseklik-yok]
Girdi : assets/harita/basinevleri_osm.json (Overpass 'out geom')
Cikti : assets/harita/basinevleri.json
Eksenler (Three.js, y yukari): x = DOGU, z = GUNEY (kuzey = -z), y = yukseklik. Birim metre.
Merkez: mahalle siniri sinir kutusunun ortasi. Cokgenler y-yukari bakarak SAAT YONUNDE
(x-z duzleminde, ustten bakista) normalize edilir.
"""
import json, math, sys, os, time, urllib.request, urllib.parse

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
GIRDI = os.path.join(KOK, 'assets/harita/basinevleri_osm.json')
CIKTI = os.path.join(KOK, 'assets/harita/basinevleri.json')
TAMPON = 80.0
ADIM = 30.0
SINIR_REL = 5525940

def arg(a):
    return a in sys.argv
def argv(a):
    return sys.argv[sys.argv.index(a) + 1] if a in sys.argv else None

els = json.load(open(GIRDI))['elements']
rel = next(e for e in els if e['type'] == 'relation' and e['id'] == SINIR_REL)
b = rel['bounds']
LAT0 = (b['minlat'] + b['maxlat']) / 2
LON0 = (b['minlon'] + b['maxlon']) / 2
MLAT = 111132.0
MLON = 111320.0 * math.cos(math.radians(LAT0))

def xz(p):
    return ((p['lon'] - LON0) * MLON, -(p['lat'] - LAT0) * MLAT)

def r2(v):
    return round(v, 2)

def alan2(pts):  # isaretli alan (x-z duzleminde, shoelace)
    s = 0
    for i in range(len(pts)):
        x1, z1 = pts[i]; x2, z2 = pts[(i + 1) % len(pts)]
        s += x1 * z2 - x2 * z1
    return s / 2

def saat(pts):
    # x=dogu, z=guney: ustten (kuzey yukari) bakista saat yonu = shoelace(x,z) POZITIF
    return pts if alan2(pts) > 0 else pts[::-1]

def ters(pts):
    return pts if alan2(pts) < 0 else pts[::-1]

def halka_kapat(pts):
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts = pts[:-1]
    return pts

def birlestir(parcalar):
    """Rol'e gore way parcalarini halkalara birlestir (uc eslestirme)."""
    parcalar = [list(p) for p in parcalar if len(p) >= 2]
    halkalar = []
    while parcalar:
        h = parcalar.pop(0)
        while h[0] != h[-1]:
            for i, p in enumerate(parcalar):
                if p[0] == h[-1]: h += p[1:]
                elif p[-1] == h[-1]: h += p[::-1][1:]
                elif p[-1] == h[0]: h = p[:-1] + h
                elif p[0] == h[0]: h = p[::-1][:-1] + h
                else: continue
                parcalar.pop(i); break
            else:
                break
        if h[0] == h[-1] and len(h) >= 4:
            halkalar.append(h)
    return halkalar

def geom_pts(g):
    return [(r2(xz(p)[0]), r2(xz(p)[1])) for p in g]

def poligonlar(e):
    """-> [(dis, [ic,...])] yerel metre."""
    if e['type'] == 'way':
        g = geom_pts(e['geometry'])
        if len(g) >= 4 and g[0] == g[-1]:
            return [(halka_kapat(g), [])]
        return []
    if e['type'] == 'relation':
        d = [[(p['lat'], p['lon']) for p in m['geometry']] for m in e.get('members', []) if m.get('role') == 'outer' and 'geometry' in m]
        i = [[(p['lat'], p['lon']) for p in m['geometry']] for m in e.get('members', []) if m.get('role') == 'inner' and 'geometry' in m]
        def dn(h):
            return halka_kapat([(r2((lo - LON0) * MLON), r2(-(la - LAT0) * MLAT)) for la, lo in h])
        D = [dn(h) for h in birlestir(d)]
        I = [dn(h) for h in birlestir(i)]
        out = []
        for dh in D:
            ic = [h for h in I if nokta_ici(h[0], dh)]
            out.append((dh, ic))
        return out
    return []

def nokta_ici(p, poly):
    x, z = p; c = False
    n = len(poly)
    for i in range(n):
        x1, z1 = poly[i]; x2, z2 = poly[(i + 1) % n]
        if (z1 > z) != (z2 > z) and x < (x2 - x1) * (z - z1) / (z2 - z1) + x1:
            c = not c
    return c

def seg_mesafe(p, a, b):
    ax, az = a; bx, bz = b; px, pz = p
    dx, dz = bx - ax, bz - az
    L = dx * dx + dz * dz
    t = 0 if L == 0 else max(0, min(1, ((px - ax) * dx + (pz - az) * dz) / L))
    return math.hypot(px - ax - t * dx, pz - az - t * dz)

# --- sinir
sinir_parca = [[(p['lat'], p['lon']) for p in m['geometry']] for m in rel['members'] if m.get('role') == 'outer' and 'geometry' in m]
sinir_halka = birlestir(sinir_parca)
sinir_halka.sort(key=lambda h: -len(h))
SINIR = saat(halka_kapat([(r2((lo - LON0) * MLON), r2(-(la - LAT0) * MLAT)) for la, lo in sinir_halka[0]]))

def sinira_mesafe(p):
    if nokta_ici(p, SINIR): return 0.0
    return min(seg_mesafe(p, SINIR[i], SINIR[(i + 1) % len(SINIR)]) for i in range(len(SINIR)))

def icinde(pts):
    """Sekil temsil noktasi (agirlik merkezi ort.) sinir+tampon icinde mi; ya da herhangi kose."""
    cx = sum(p[0] for p in pts) / len(pts); cz = sum(p[1] for p in pts) / len(pts)
    if sinira_mesafe((cx, cz)) <= TAMPON: return True
    return any(sinira_mesafe(p) <= TAMPON for p in pts[:: max(1, len(pts) // 6)])

def ortalama_merkez(pts):
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))

# --- yol turleri: (varsayilan genislik m, sinif)
YOL = {
    'motorway': 14, 'trunk': 14, 'primary': 12, 'secondary': 10, 'tertiary': 9,
    'unclassified': 7, 'residential': 7, 'living_street': 6, 'service': 4.5,
    'pedestrian': 4, 'footway': 2, 'path': 1.5, 'steps': 2, 'cycleway': 2.5, 'track': 3.5,
    'primary_link': 6, 'secondary_link': 6, 'tertiary_link': 6, 'trunk_link': 6, 'motorway_link': 6,
}
ARAC_DISI = {'footway', 'path', 'steps', 'cycleway', 'pedestrian'}
SERIT_GEN = 3.25

def sayi(v):
    try: return float(str(v).replace(',', '.').split()[0].rstrip('m'))
    except Exception: return None

def yol_genislik(t):
    w = sayi(t.get('width'))
    if w and 0.5 < w < 40: return w, False
    l = sayi(t.get('lanes'))
    if l and l >= 1: return round(l * SERIT_GEN + 0.5, 1) if t.get('highway') not in ARAC_DISI else YOL.get(t['highway'], 4), False
    return float(YOL.get(t.get('highway'), 5)), True

# --- bina
KONUT = {'apartments', 'residential', 'house', 'detached', 'terrace', 'semidetached_house', 'dormitory'}
def bina_yukseklik(t):
    h = sayi(t.get('height'))
    if h and 1 < h < 300: return round(h, 1), 'height', False
    l = sayi(t.get('building:levels'))
    if l and 0 < l < 80: return round(l * 3.0 + 0.5, 1), 'levels', False
    bt = t.get('building', 'yes')
    if bt in ('garage', 'garages', 'carport', 'shed', 'hut', 'roof', 'kiosk', 'service', 'container'): return 3.5, 'tahmin', True
    if bt in ('house', 'detached', 'semidetached_house', 'terrace'): return 8.0, 'tahmin', True
    if bt in ('mosque', 'church', 'chapel', 'religious'): return 12.0, 'tahmin', True
    if bt in ('school', 'kindergarten', 'hospital', 'public', 'civic', 'commercial', 'retail', 'industrial', 'university'): return 12.5, 'tahmin', True
    return 15.5, 'tahmin', True   # konut/yes: Basinevleri ortalamasi ~5 kat -> 5*3+0.5

def bina_tur(t):
    bt = t.get('building', 'yes')
    am = t.get('amenity')
    if am in ('school', 'kindergarten', 'college', 'university'): return 'okul'
    if am in ('place_of_worship',) or bt in ('mosque', 'church', 'chapel'): return 'ibadet'
    if am == 'hospital' or bt == 'hospital': return 'hastane'
    if t.get('shop') or bt in ('retail', 'commercial', 'supermarket', 'kiosk'): return 'ticari'
    if bt in KONUT: return 'konut'
    if bt in ('garage', 'garages', 'carport', 'shed', 'hut', 'roof', 'service', 'container'): return 'yardimci'
    if bt in ('industrial', 'warehouse'): return 'sanayi'
    return 'diger'

# --- alan turu
def alan_tur(t):
    la, lu, na, am = t.get('leisure'), t.get('landuse'), t.get('natural'), t.get('amenity')
    if la in ('park', 'garden'): return 'park'
    if la == 'playground': return 'oyun_alani'
    if la in ('pitch', 'sports_centre', 'stadium'): return 'spor_alani'
    if la in ('golf_course', 'dog_park'): return 'park'
    if lu in ('grass', 'meadow', 'village_green', 'recreation_ground', 'flowerbed'): return 'cimen'
    if lu in ('forest',) or na == 'wood': return 'orman'
    if na in ('scrub', 'grassland', 'heath'): return 'cimen'
    if na == 'water' or lu == 'reservoir' or t.get('water'): return 'su'
    if am == 'parking' or lu == 'parking': return 'otopark'
    if am == 'school' or am == 'kindergarten' or lu == 'education': return 'okul_arazisi'
    if am == 'marketplace': return 'pazar'
    if lu in ('residential',): return 'konut_arazisi'
    if lu in ('commercial', 'retail'): return 'ticari_arazi'
    if lu in ('cemetery',): return 'mezarlik'
    if lu in ('construction', 'brownfield', 'greenfield'): return 'bos_arazi'
    return None

binalar, yollar, alanlar, agaclar, duvarlar, noktalar = [], [], [], [], [], []
sayac = {'bina_ham': 0, 'bina_disarda': 0}
for e in els:
    t = e.get('tags', {})
    if e['id'] == SINIR_REL and e['type'] == 'relation': continue
    if 'building' in t and t['building'] != 'no':
        sayac['bina_ham'] += 1
        for dis, ic in poligonlar(e):
            if len(dis) < 3 or abs(alan2(dis)) < 4: continue
            if not icinde(dis): sayac['bina_disarda'] += 1; continue
            h, kaynak, tah = bina_yukseklik(t)
            o = {'id': e['id'], 'tur': bina_tur(t), 'halka': [list(p) for p in saat(dis)], 'yukseklik': h,
                 'yuk_kaynak': kaynak, 'alan': round(abs(alan2(dis)), 1)}
            if ic: o['ic_halkalar'] = [[list(p) for p in ters(h2)] for h2 in ic if len(h2) >= 3]
            if tah: o['tahmin'] = True
            if sayi(t.get('min_height')): o['taban'] = sayi(t.get('min_height'))
            if t.get('roof:shape'): o['cati'] = t['roof:shape']
            if t.get('name'): o['ad'] = t['name']
            binalar.append(o)
    elif 'highway' in t and e['type'] == 'way' and t['highway'] in YOL:
        pts = geom_pts(e['geometry'])
        if len(pts) < 2: continue
        if not any(sinira_mesafe(p) <= TAMPON for p in pts[:: max(1, len(pts) // 8)] + [pts[-1]]): continue
        w, tah = yol_genislik(t)
        o = {'id': e['id'], 'tur': t['highway'], 'nokta': [list(p) for p in pts], 'genislik': w,
             'arac_yolu': t['highway'] not in ARAC_DISI}
        if tah: o['tahmin'] = True
        if t.get('name'): o['ad'] = t['name']
        if t.get('oneway') in ('yes', '1', 'true'): o['tek_yon'] = True
        if t.get('lanes'): o['serit'] = sayi(t['lanes'])
        if t.get('bridge') or t.get('tunnel'): o['kopru_tunel'] = 'kopru' if t.get('bridge') else 'tunel'
        yollar.append(o)
    elif t.get('natural') == 'tree' and e['type'] == 'node':
        p = xz(e)
        if sinira_mesafe(p) <= TAMPON: agaclar.append([r2(p[0]), r2(p[1])])
    elif t.get('barrier') in ('wall', 'fence') and e['type'] == 'way':
        pts = geom_pts(e['geometry'])
        if any(sinira_mesafe(p) <= TAMPON for p in pts[:: max(1, len(pts) // 6)]):
            duvarlar.append({'tur': t['barrier'], 'nokta': [list(p) for p in pts]})
    elif 'waterway' in t and e['type'] == 'way':
        pts = geom_pts(e['geometry'])
        if any(sinira_mesafe(p) <= TAMPON for p in pts[:: max(1, len(pts) // 6)]):
            alanlar.append({'tur': 'dere', 'cizgi': [list(p) for p in pts], 'ad': t.get('name')})
    else:
        if e['type'] == 'node' and (t.get('amenity') or t.get('shop')):
            p = xz(e)
            if sinira_mesafe(p) <= TAMPON:
                noktalar.append({'tur': t.get('amenity') or t.get('shop'), 'x': r2(p[0]), 'z': r2(p[1]), 'ad': t.get('name')})
            continue
        tur = alan_tur(t)
        if not tur or e['type'] == 'node': continue
        for dis, ic in poligonlar(e):
            if len(dis) < 3 or not icinde(dis): continue
            o = {'id': e['id'], 'tur': tur, 'halka': [list(p) for p in saat(dis)]}
            if ic: o['ic_halkalar'] = [[list(p) for p in ters(h2)] for h2 in ic if len(h2) >= 3]
            if t.get('name'): o['ad'] = t['name']
            if 'building' in t: continue
            alanlar.append(o)

# --- yukseklik izgarasi
xs = [p[0] for p in SINIR]; zs = [p[1] for p in SINIR]
X0, X1 = min(xs) - TAMPON, max(xs) + TAMPON
Z0, Z1 = min(zs) - TAMPON, max(zs) + TAMPON
NX = int((X1 - X0) / ADIM) + 1; NZ = int((Z1 - Z0) / ADIM) + 1
yuks = {'durum': 'yok (duz)', 'kaynak': None}
degerler = None
if not arg('--yukseklik-yok'):
    onb = argv('--yukseklik-onbellek')
    ham = None
    if onb and os.path.exists(onb): ham = json.load(open(onb))
    else:
        loc = [(LAT0 - (Z0 + j * ADIM) / MLAT, LON0 + (X0 + i * ADIM) / MLON) for j in range(NZ) for i in range(NX)]
        ham = []
        try:
            for k in range(0, len(loc), 100):
                parca = loc[k:k + 100]
                q = '|'.join('%.6f,%.6f' % p for p in parca)
                for deneme in range(4):
                    try:
                        rq = urllib.request.Request('https://api.opentopodata.org/v1/srtm30m?locations=' + q, headers={'User-Agent': 'ZIFIR-oyun-harita/1.0'})
                        js = json.load(urllib.request.urlopen(rq, timeout=60)); break
                    except Exception as ex:
                        print('yeniden deneniyor', ex); time.sleep(3 * (deneme + 1))
                else: raise RuntimeError('yukseklik alinamadi')
                ham += [r['elevation'] for r in js['results']]
                time.sleep(1.2)
            if onb: json.dump(ham, open(onb, 'w'))
        except Exception as ex:
            print('YUKSEKLIK BASARISIZ:', ex); ham = None
    if ham and None not in ham:
        mn = min(ham)
        degerler = [round(v - mn, 1) for v in ham]
        yuks = {'durum': 'tamam', 'kaynak': 'SRTM 1 arcsec (30 m) via OpenTopoData srtm30m', 'en_dusuk_mutlak_m': mn, 'en_yuksek_mutlak_m': max(ham), 'fark_m': round(max(ham) - mn, 1)}
if degerler is None: degerler = [0.0] * (NX * NZ)

yol_uz = sum(sum(math.dist(y['nokta'][i], y['nokta'][i + 1]) for i in range(len(y['nokta']) - 1)) for y in yollar)
cikti = {
    'baslik': {
        'ad': 'Ankara / Kecioren / Basinevleri Mahallesi',
        'kaynak': 'OpenStreetMap katkida bulunanlar, ODbL 1.0 (https://www.openstreetmap.org/copyright); yukseklik: SRTM30m (NASA) via OpenTopoData',
        'osm_sinir_relation': SINIR_REL,
        'merkez': {'lat': LAT0, 'lon': LON0},
        'eksenler': 'x=dogu, y=yukari, z=guney (kuzey=-z), metre; cokgenler ustten bakista saat yonunde (ic halkalar ters)',
        'tampon_m': TAMPON,
        'kapsam_m': {'x_min': r2(X0), 'x_max': r2(X1), 'z_min': r2(Z0), 'z_max': r2(Z1), 'genislik': r2(X1 - X0), 'derinlik': r2(Z1 - Z0)},
        'sinir_kutusu_m': {'genislik': r2(max(xs) - min(xs)), 'derinlik': r2(max(zs) - min(zs))},
        'sayilar': {'bina': len(binalar), 'bina_tahmin': sum(1 for b in binalar if b.get('tahmin')), 'yol': len(yollar), 'yol_uzunluk_m': round(yol_uz),
                    'alan': len(alanlar), 'agac': len(agaclar), 'duvar': len(duvarlar), 'nokta': len(noktalar)},
        'yukseklik': yuks,
    },
    'sinir': [list(p) for p in SINIR],
    'binalar': binalar, 'yollar': yollar, 'alanlar': alanlar, 'agaclar': agaclar, 'duvarlar': duvarlar, 'noktalar': noktalar,
    'yukseklik_izgara': {'nx': NX, 'nz': NZ, 'adim': ADIM, 'x0': r2(X0), 'z0': r2(Z0),
                         'not': 'deger[j*nx+i] = (x0+i*adim, z0+j*adim) noktasinin yuksekligi, m, en dusuk noktaya gore', 'deger': degerler},
}
json.dump(cikti, open(CIKTI, 'w'), ensure_ascii=False, separators=(',', ':'))
print(json.dumps(cikti['baslik'], ensure_ascii=False, indent=1), sayac)
