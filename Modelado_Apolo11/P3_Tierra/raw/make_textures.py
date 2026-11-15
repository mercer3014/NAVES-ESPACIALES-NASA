"""Genera los atlas 512x512 de mocr-room y armstrong-house (todo procedural / dominio publico).
Uso: python3 make_textures.py   -> raw/tex/mocr-atlas.png, raw/tex/house-atlas.png
Mapa del mundo: Natural Earth 110m land (dominio publico)."""
import json, math, os, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, 'tex')
MONO = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
MONOB = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf'
SERIF = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
random.seed(1969)

def font(p, s):
    return ImageFont.truetype(p, s)

# ---------------- MOCR ----------------
def mocr():
    S = 1024  # se dibuja a 1024 y se reduce a 512 (antialias)
    im = Image.new('RGB', (S, S), (0, 0, 0))
    d = ImageDraw.Draw(im)
    k = S / 512
    # 1) mapa del mundo con trayectoria: y 0..192
    mw, mh = S, int(192 * k)
    d.rectangle([0, 0, mw, mh], fill=(8, 26, 38))
    for lon in range(-180, 181, 30):
        x = (lon + 180) / 360 * mw
        d.line([x, 0, x, mh], fill=(22, 60, 78), width=2)
    for lat in range(-60, 61, 30):
        y = (90 - lat) / 180 * mh
        d.line([0, y, mw, y], fill=(22, 60, 78), width=2)
    land = json.load(open(os.path.join(TEX, 'ne_110m_land.geojson')))
    def proj(lon, lat):
        return ((lon + 180) / 360 * mw, (90 - lat) / 180 * mh)
    for f in land['features']:
        g = f['geometry']
        polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
        for poly in polys:
            ring = [proj(*p) for p in poly[0]]
            if len(ring) > 2:
                d.polygon(ring, fill=(40, 96, 84), outline=(120, 200, 170))
    # trayectoria (ground track sinusoidal, 3 orbitas, inclinacion 32.5)
    for orbit in range(3):
        pts = []
        for i in range(0, 361, 2):
            lon = -80 + i - orbit * 22.5
            lat = 32.5 * math.sin(math.radians(i))
            lon = (lon + 180) % 360 - 180
            pts.append(proj(lon, lat))
        seg = [pts[0]]
        for a, b in zip(pts, pts[1:]):
            if abs(a[0] - b[0]) > mw / 2:
                d.line(seg, fill=(255, 214, 90), width=4); seg = [b]
            else:
                seg.append(b)
        d.line(seg, fill=(255, 214, 90), width=4)
    # estaciones de seguimiento (MSFN)
    for lon, lat in [(-80.6, 28.5), (-15.6, 27.8), (149.0, -35.4), (-4.2, 40.4), (-116.9, 35.4), (-157.9, 21.4), (-71.0, -33.2)]:
        x, y = proj(lon, lat)
        d.rectangle([x - 5, y - 5, x + 5, y + 5], outline=(255, 255, 255), width=2)
    x, y = proj(-40, 25)
    d.ellipse([x - 9, y - 9, x + 9, y + 9], fill=(255, 80, 60))
    fm = font(MONOB, 22)
    d.text((14, 8), 'APOLLO 11   GET 102:33:05   REV 13', font=fm, fill=(230, 240, 220))
    d.text((14, mh - 34), 'MSFN STATIONS', font=font(MONO, 18), fill=(170, 210, 200))
    # 2) pizarra: y 192..320
    y0, y1 = int(192 * k), int(320 * k)
    d.rectangle([0, y0, S, y1], fill=(30, 40, 34))
    for _ in range(900):  # manchas de tiza borrada
        x = random.randint(0, S); y = random.randint(y0, y1); r = random.randint(4, 40)
        c = random.randint(36, 52)
        d.ellipse([x - r, y - r // 3, x + r, y + r // 3], fill=(c, c + 8, c + 2))
    im_b = im.crop((0, y0, S, y1)).filter(ImageFilter.GaussianBlur(6))
    im.paste(im_b, (0, y0))
    d = ImageDraw.Draw(im)
    txt = 'TOUGH AND COMPETENT'
    fs_ = 90
    while d.textlength(txt, font=font(SERIF, fs_)) > S * 0.9:
        fs_ -= 2
    ft = font(SERIF, fs_)
    tw = d.textlength(txt, font=ft)
    tx = (S - tw) / 2
    for dx, dy in [(0, 0), (1, 1), (-1, 0)]:
        d.text((tx + dx, y0 + 40 + dy), txt, font=ft, fill=(222, 222, 210))
    d.line([tx, y0 + 140, tx + tw, y0 + 136], fill=(210, 210, 200), width=5)
    d.text((40, y1 - 52), '- G.K.  1967', font=font(SERIF, 30), fill=(190, 190, 182))
    d.text((S - 420, y1 - 52), 'GO / NO GO  PDI', font=font(SERIF, 30), fill=(170, 175, 165))
    # 3) pantallas de datos A y B: y 320..448
    y0, y1 = int(320 * k), int(448 * k)
    def data_screen(x0, x1, lines, title):
        d.rectangle([x0, y0, x1, y1], fill=(6, 18, 14))
        d.text((x0 + 14, y0 + 8), title, font=font(MONOB, 22), fill=(200, 255, 210))
        fy = font(MONO, 19)
        for i, ln in enumerate(lines):
            d.text((x0 + 14, y0 + 42 + i * 24), ln, font=fy, fill=(120, 235, 150))
    data_screen(0, S // 2 - 2, ['GET     102:33:05', 'ALT     33500 FT', 'H-DOT   -105 FPS', 'V-HOR   4820 FPS', 'FUEL    LM 8.2 %', 'RANGE   112 NM', 'DELTA-H +2900 FT', 'GUIDO   GO', 'PGNS    P63'], 'LM DESCENT  PDI+05:12')
    # B: grafica de descenso altitud vs rango
    x0, x1 = S // 2 + 2, S
    d.rectangle([x0, y0, x1, y1], fill=(6, 18, 14))
    d.text((x0 + 14, y0 + 8), 'ALT / RANGE   TRANQUILITY', font=font(MONOB, 22), fill=(200, 255, 210))
    gx0, gy0, gx1, gy1 = x0 + 40, y0 + 46, x1 - 20, y1 - 24
    d.line([gx0, gy0, gx0, gy1, gx1, gy1], fill=(120, 235, 150), width=2)
    for i in range(1, 6):
        yy = gy0 + (gy1 - gy0) * i / 6
        d.line([gx0, yy, gx1, yy], fill=(30, 80, 50), width=1)
    pts = [(gx0 + (gx1 - gx0) * t, gy0 + (gy1 - gy0) * (1 - (1 - t) ** 1.8)) for t in [i / 40 for i in range(41)]]
    d.line(pts, fill=(255, 220, 110), width=4)
    d.ellipse([pts[26][0] - 7, pts[26][1] - 7, pts[26][0] + 7, pts[26][1] + 7], fill=(255, 90, 70))
    # 4) CRT de consola (2 variantes 96x64 en 512): y 448..512, x 0..96 y 96..192
    y0, y1 = int(448 * k), S
    for v, (xa, xb) in enumerate([(0, int(96 * k)), (int(96 * k), int(192 * k))]):
        d.rectangle([xa, y0, xb, y1], fill=(8, 30, 16))
        fy = font(MONO, 13)
        for i in range(8):
            txt = ''.join(random.choice('0123456789  +-') for _ in range(14)) if v == 0 else random.choice(['R1 +00125', 'R2 -00340', 'R3 +12207', 'V16 N68', 'PROG 63', 'COMP ACTY', 'TGO 03:12', 'CMD GO'])
            d.text((xa + 8, y0 + 6 + i * 15), txt, font=fy, fill=(110, 255, 140))
        for yy in range(y0, y1, 3):  # scanlines
            d.line([xa, yy, xb, yy], fill=(4, 16, 8), width=1)
    # 5) panel de botones: x 192..512, y 448..512
    xa = int(192 * k)
    d.rectangle([xa, y0, S, y1], fill=(46, 52, 54))
    cols = [(235, 235, 220), (240, 190, 70), (110, 220, 120), (225, 70, 60), (235, 235, 220), (235, 235, 220)]
    for r in range(4):
        for c in range(26):
            x = xa + 10 + c * 24; y = y0 + 8 + r * 30
            col = random.choice(cols) if random.random() < 0.55 else (70, 76, 80)
            d.rectangle([x, y, x + 16, y + 20], fill=col)
    im = im.resize((512, 512), Image.LANCZOS)
    im.save(os.path.join(TEX, 'mocr-atlas.png'))

# ---------------- CASA ----------------
def house():
    S = 1024; k = 2
    im = Image.new('RGB', (S, S), (0, 0, 0))
    d = ImageDraw.Draw(im)
    # 1) TV blanco y negro: transmision de la Luna (x 0..256, y 0..192)
    w, h = 256 * k, 192 * k
    for y in range(h):
        g = int(30 + 40 * (y / h))
        d.line([0, y, w, y], fill=(g, g, g))
    hy = int(h * 0.58)
    d.rectangle([0, hy, w, h], fill=(150, 150, 150))
    for _ in range(140):
        x = random.randint(0, w); y = random.randint(hy, h); r = random.randint(2, 9)
        c = random.randint(110, 200)
        d.ellipse([x - r, y - r // 2, x + r, y + r // 2], fill=(c, c, c))
    # modulo lunar (silueta)
    cx = int(w * 0.62)
    d.polygon([(cx - 60, hy - 30), (cx + 60, hy - 30), (cx + 50, hy - 90), (cx - 50, hy - 90)], fill=(205, 205, 205))
    d.rectangle([cx - 40, hy - 130, cx + 40, hy - 90], fill=(170, 170, 170))
    for sx in (-1, 1):
        d.line([cx + sx * 55, hy - 40, cx + sx * 95, hy + 18], fill=(225, 225, 225), width=7)
    # astronauta en la escalera
    ax = cx - 120
    d.ellipse([ax - 14, hy - 92, ax + 14, hy - 64], fill=(250, 250, 250))
    d.rectangle([ax - 18, hy - 66, ax + 18, hy - 20], fill=(235, 235, 235))
    d.rectangle([ax - 16, hy - 20, ax - 4, hy + 10], fill=(225, 225, 225))
    d.rectangle([ax + 4, hy - 20, ax + 16, hy + 10], fill=(225, 225, 225))
    for _ in range(9000):
        x = random.randint(0, w - 1); y = random.randint(0, h - 1)
        c = random.randint(0, 255)
        d.point((x, y), fill=(c, c, c))
    for y in range(0, h, 4):
        d.line([0, y, w, y], fill=(16, 16, 16))
    d.text((14, h - 34), 'LIVE FROM THE MOON', font=font(MONOB, 24), fill=(240, 240, 240))
    # 2) vista por la ventana (x 256..512, y 0..256): cielo nocturno texano, arboles, casa vecina
    x0, x1, y1 = 256 * k, 512 * k, 256 * k
    for y in range(y1):
        t = y / y1
        d.line([x0, y, x1, y], fill=(int(20 + 40 * t), int(30 + 50 * t), int(70 + 60 * t)))
    d.ellipse([x0 + 330, 60, x0 + 380, 110], fill=(245, 240, 215))  # Luna
    d.rectangle([x0, int(y1 * 0.75), x1, y1], fill=(36, 58, 30))
    d.polygon([(x0 + 40, int(y1 * .76)), (x0 + 120, int(y1 * .52)), (x0 + 200, int(y1 * .76))], fill=(70, 60, 58))
    d.rectangle([x0 + 60, int(y1 * .62), x0 + 180, int(y1 * .77)], fill=(150, 130, 110))
    d.rectangle([x0 + 100, int(y1 * .66), x0 + 130, int(y1 * .71)], fill=(250, 210, 120))
    for tx in (x0 + 260, x0 + 420, x0 + 480):
        d.rectangle([tx - 6, int(y1 * .6), tx + 6, int(y1 * .78)], fill=(40, 30, 20))
        d.ellipse([tx - 50, int(y1 * .38), tx + 50, int(y1 * .66)], fill=(26, 52, 28))
    # 3) alfombra (x 0..256, y 256..512): motivo geometrico 60s naranja/marron
    x0, y0, x1, y1 = 0, 256 * k, 256 * k, 512 * k
    d.rectangle([x0, y0, x1, y1], fill=(150, 84, 36))
    d.rectangle([x0 + 20, y0 + 20, x1 - 20, y1 - 20], outline=(226, 170, 90), width=10)
    d.rectangle([x0 + 48, y0 + 48, x1 - 48, y1 - 48], outline=(96, 52, 24), width=8)
    for i in range(4):
        for j in range(4):
            cx = x0 + 96 + i * 108; cy = y0 + 96 + j * 108
            d.ellipse([cx - 34, cy - 34, cx + 34, cy + 34], outline=(232, 182, 96), width=8)
            d.ellipse([cx - 12, cy - 12, cx + 12, cy + 12], fill=(110, 60, 26))
    # 4) veta de madera (x 256..512, y 256..512)
    x0, x1 = 256 * k, 512 * k
    for y in range(y0, y1):
        t = math.sin(y * 0.09 + math.sin(y * 0.013) * 5)
        c = int(118 + 22 * t)
        d.line([x0, y, x1, y], fill=(c, int(c * 0.66), int(c * 0.38)))
    for _ in range(60):
        y = random.randint(y0, y1); c = random.randint(70, 95)
        d.line([x0, y, x1, y + random.randint(-6, 6)], fill=(c, int(c * .62), int(c * .35)), width=2)
    # 5) foto enmarcada familia / calendario julio 1969 (x 0..256, y 192..256) -> calendario
    x0, y0, x1, y1 = 0, 192 * k, 256 * k, 256 * k
    d.rectangle([x0, y0, x1, y1], fill=(240, 236, 222))
    d.text((x0 + 16, y0 + 8), 'JULY 1969', font=font(SERIF, 30), fill=(150, 30, 30))
    fs = font(MONO, 14)
    for i in range(31):
        r, c = divmod(i + 2, 7)
        d.text((x0 + 230 + c * 38, y0 + 10 + r * 20), str(i + 1), font=fs, fill=(200, 30, 30) if i + 1 == 20 else (40, 40, 40))
    im = im.resize((512, 512), Image.LANCZOS)
    im.save(os.path.join(TEX, 'house-atlas.png'))

if __name__ == '__main__':
    os.makedirs(TEX, exist_ok=True)
    mocr(); house()
    print('ok')
