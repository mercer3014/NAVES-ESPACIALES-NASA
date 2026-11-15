"""armstrong-house.glb - sala + comedor + cocina de la casa de los Armstrong en El Lago, Texas (julio 1969).
Uso: ~/bin/blender -b -P armstrong_house.py -- [--render] [--no-export]
Blender Z-arriba, frente hacia -Y. Origen: suelo, centro de la planta. Interior 9 x 6.5 m, techo 2.5 m.
20 de julio de 1969: TV con la transmision lunar, squawk box de la NASA junto al sofa.
Ventanas con dos fondos exteriores bajo 'window-backdrop': 'window-day' (aterrizaje 15:17 CDT, tarde soleada) y
'window-night' (primer paso 21:56 CDT, noche con luna). El codigo muestra uno y oculta el otro (si no hace nada se ve el dia,
que esta delante). Luces: 'light-sun-window' (variant=day) y 'light-moon-window' (variant=night)."""
import bpy, sys, os, math, random
from mathutils import Vector, Matrix
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from p3common import *

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.dirname(HERE)
ATL = os.path.join(HERE, 'tex', 'house-atlas.png')
random.seed(20)
sc = reset()
XL, XR, YF, YB, H = -4.5, 4.5, -3.25, 3.25, 2.5
XK = 0.6   # limite sala | comedor-cocina

M = dict(
    paint=mat('wall-paint', (0.86, 0.80, 0.66), 0.9),
    panel=mat('wood-paneling', (0.6, 0.4, 0.22), 0.6, tex=ATL),
    floorw=mat('floor-wood', (0.6, 0.4, 0.22), 0.5, tex=ATL),
    lino=mat('floor-linoleum', (0.86, 0.81, 0.64), 0.45),
    lino2=mat('floor-linoleum-dark', (0.56, 0.36, 0.16), 0.45),
    ceil=mat('ceiling', (0.92, 0.91, 0.88), 0.95),
    trim=mat('wood-trim', (0.36, 0.22, 0.12), 0.5),
    olive=mat('sofa-olive', (0.40, 0.40, 0.19), 0.85),
    orange=mat('chair-orange', (0.66, 0.34, 0.13), 0.8),
    teak=mat('wood-teak', (0.48, 0.28, 0.13), 0.45),
    dark=mat('wood-dark', (0.26, 0.16, 0.09), 0.5),
    cab=mat('kitchen-cabinet', (0.55, 0.37, 0.19), 0.55),
    counter=mat('counter-formica', (0.82, 0.64, 0.26), 0.35),
    appl=mat('appliance-avocado', (0.55, 0.57, 0.30), 0.3, 0.1),
    chrome=mat('chrome', (0.78, 0.78, 0.8), 0.2, 1.0),
    black=mat('black-plastic', (0.03, 0.03, 0.03), 0.4),
    phone=mat('phone-beige', (0.86, 0.81, 0.68), 0.35),
    squawk=mat('squawk-metal', (0.44, 0.47, 0.45), 0.45, 0.4),
    grille=mat('squawk-grille', (0.07, 0.07, 0.07), 0.7, 0.3),
    card=mat('cardboard', (0.66, 0.50, 0.31), 0.9),
    tape=mat('packing-tape', (0.75, 0.62, 0.40), 0.4),
    shade=mat('lamp-shade', (0.93, 0.86, 0.68), 0.8, emit=(1.0, 0.82, 0.55), emit_strength=1.2),
    bulb=mat('lamp-bulb', (1, 0.9, 0.7), 0.5, emit=(1.0, 0.85, 0.6), emit_strength=6.0),
    tv=mat('tv-screen', (0.05, 0.05, 0.05), 0.2, tex=ATL, tex_emit=True, emit_strength=1.6),
    view=mat('window-view', (0.1, 0.1, 0.2), 0.9, tex=ATL, tex_emit=True, emit_strength=0.9),
    curtain=mat('curtain', (0.70, 0.44, 0.20), 0.9),
    rug=mat('rug', (0.6, 0.35, 0.15), 0.95, tex=ATL),
    cal=mat('calendar', (0.9, 0.9, 0.85), 0.8, tex=ATL),
    paper=mat('paper', (0.92, 0.91, 0.86), 0.8),
    glass=mat('ashtray-glass', (0.55, 0.62, 0.62), 0.1),
    door=mat('door-wood', (0.52, 0.33, 0.16), 0.5),
    brass=mat('brass', (0.80, 0.62, 0.30), 0.3, 1.0),
    photo=mat('photo-frame', (0.2, 0.2, 0.2), 0.4),
)
UV_TV = uvrect(4, 4, 252, 186)
UV_VIEW = uvrect(256, 0, 512, 256)
UV_RUG = uvrect(0, 256, 256, 512)
UV_WOOD = uvrect(260, 260, 508, 508)
UV_CAL = uvrect(0, 192, 256, 256)

root = empty('armstrong-house', size=1.0)

def face_uv_rot(b, pts, m, outward, uv):
    """cara con la imagen girada 90 grados (veta vertical)."""
    pts = [pts[1], pts[2], pts[3], pts[0]]
    b.face(pts, m, outward=outward, uv=uv)

# ---------------- cascaron ----------------
def wall(b, axis, c, a0, a1, holes, m, inward, uvm=None, z0=0.0, z1=H):
    """Pared plana (axis='x': plano x=c recorriendo y; axis='y': plano y=c recorriendo x) con huecos (h0,h1,hz0,hz1)."""
    def P(a, z):
        return (c, a, z) if axis == 'x' else (a, c, z)
    def rect(a, b_, za, zb):
        if b_ - a < 1e-4 or zb - za < 1e-4:
            return
        pts = [P(a, za), P(b_, za), P(b_, zb), P(a, zb)]
        if uvm is not None:
            face_uv_rot(b, pts, m, inward, uvm)
        else:
            b.face(pts, m, outward=inward)
    holes = sorted(holes)
    cur = a0
    for h0, h1, hz0, hz1 in holes:
        rect(cur, h0, z0, z1)
        rect(h0, h1, z0, hz0)
        rect(h0, h1, hz1, z1)
        cur = h1
    rect(cur, a1, z0, z1)

def reveal(b, axis, c, h0, h1, z0, z1, depth, m, inward_sign):
    """Mochetas (grosor del muro) de un hueco, hacia fuera."""
    d = -inward_sign * depth
    def P(a, z, off=0.0):
        return (c + off, a, z) if axis == 'x' else (a, c + off, z)
    n = (1, 0, 0) if axis == 'x' else (0, 1, 0)
    b.face([P(h0, z0), P(h0, z1), P(h0, z1, d), P(h0, z0, d)], m, outward=(0, 1, 0) if axis == 'x' else (1, 0, 0))
    b.face([P(h1, z0), P(h1, z1), P(h1, z1, d), P(h1, z0, d)], m, outward=(0, -1, 0) if axis == 'x' else (-1, 0, 0))
    b.face([P(h0, z1), P(h1, z1), P(h1, z1, d), P(h0, z1, d)], m, outward=(0, 0, -1))
    if z0 > 0.01:
        b.face([P(h0, z0), P(h1, z0), P(h1, z0, d), P(h0, z0, d)], m, outward=(0, 0, 1))

b = MB()
# suelos
b.face([(XL, YF, 0), (XK, YF, 0), (XK, YB, 0), (XL, YB, 0)], M['floorw'], outward=(0, 0, 1), uv=UV_WOOD)
TILE = 0.325
nx_, ny_ = round((XR - XK) / TILE), round((YB - YF) / TILE)
tw_, th_ = (XR - XK) / nx_, (YB - YF) / ny_
for i in range(nx_):
    for j in range(ny_):
        xa, ya = XK + i * tw_, YF + j * th_
        b.face([(xa, ya, 0), (xa + tw_, ya, 0), (xa + tw_, ya + th_, 0), (xa, ya + th_, 0)], M['lino'] if (i + j) % 2 == 0 else M['lino2'], outward=(0, 0, 1))
b.face([(XL, YF, H), (XR, YF, H), (XR, YB, H), (XL, YB, H)], M['ceil'], outward=(0, 0, -1))
# viga/dintel que separa sala y cocina
b.box((XK - 0.1, YF, H - 0.25), (XK + 0.1, YB, H), M['ceil'], skip=('+z', '-y', '+y'))
WIN_L = (-3.3, -0.7, 0.75, 2.15)   # ventanal de la sala (pared trasera)
WIN_K = (2.75, 3.85, 1.15, 1.95)   # ventana de la cocina (pared trasera)
DOOR_F = (-2.25, -1.3, 0.0, 2.05)  # puerta de entrada (pared -X), en coordenada Y
DOOR_H = (1.0, 1.85, 0.0, 2.05)    # puerta al pasillo (pared frontal)
# pared trasera (+Y): paneles de madera en la sala, pintura en cocina
wall(b, 'y', YB, XL, XK, [WIN_L], M['panel'], (0, -1, 0), UV_WOOD)
wall(b, 'y', YB, XK, XR, [WIN_K], M['paint'], (0, -1, 0))
# pared frontal (-Y)
wall(b, 'y', YF, XL, XK, [], M['panel'], (0, 1, 0), UV_WOOD)
wall(b, 'y', YF, XK, XR, [DOOR_H], M['paint'], (0, 1, 0))
# laterales
wall(b, 'x', XL, YF, YB, [DOOR_F], M['panel'], (1, 0, 0), UV_WOOD)
wall(b, 'x', XR, YF, YB, [], M['paint'], (-1, 0, 0))
for (axis, c, h, sign) in (('y', YB, WIN_L, -1), ('y', YB, WIN_K, -1), ('x', XL, DOOR_F, 1), ('y', YF, DOOR_H, 1)):
    reveal(b, axis, c, h[0], h[1], h[2], h[3], 0.14, M['trim'], sign)
# rodapie
for (mn, mx) in (((XL, YB - 0.015, 0), (XR, YB, 0.1)), ((XL, YF, 0), (XR, YF + 0.015, 0.1)), ((XL, YF, 0), (XL + 0.015, YB, 0.1)), ((XR - 0.015, YF, 0), (XR, YB, 0.1))):
    b.box(mn, mx, M['trim'], skip=('-z', '+z'))
# marcos de ventana (parteluces) y alfeizar
x0, x1, z0, z1 = WIN_L
for xm in (x0 + (x1 - x0) / 3, x0 + 2 * (x1 - x0) / 3):
    b.box((xm - 0.03, YB + 0.02, z0), (xm + 0.03, YB + 0.08, z1), M['trim'], skip=('+y', '-z', '+z'))
b.box((x0 - 0.08, YB - 0.06, z0 - 0.04), (x1 + 0.08, YB, z0), M['trim'], skip=('+y',))
x0, x1, z0, z1 = WIN_K
b.box(((x0 + x1) / 2 - 0.03, YB + 0.02, z0), ((x0 + x1) / 2 + 0.03, YB + 0.08, z1), M['trim'], skip=('+y', '-z', '+z'))
# cortinas
for xc in (WIN_L[0] - 0.12, WIN_L[1] + 0.12):
    for k in range(3):
        xx = xc - 0.18 + k * 0.12
        b.box((xx - 0.05, YB - 0.16 + (k % 2) * 0.04, 0.05), (xx + 0.05, YB - 0.08 + (k % 2) * 0.04, 2.3), M['curtain'], skip=('-z',))
b.box((WIN_L[0] - 0.45, YB - 0.12, 2.3), (WIN_L[1] + 0.45, YB - 0.02, 2.36), M['trim'])
shell = obj('room-shell', b.build('room-shell'), parent=root)
# fondos exteriores detras de las ventanas: 'window-backdrop' (se conserva el nombre) agrupa la variante de noche y la de dia
wb = empty('window-backdrop', parent=root, size=0.5, props={'variants': 'window-day,window-night', 'default': 'window-day',
           'note': 'aterrizaje 15:17 CDT = window-day; caminata 21:56 CDT = window-night; mostrar solo uno'})
bv = MB()
bv.face([(-4.4, YB + 1.6, -0.6), (0.4, YB + 1.6, -0.6), (0.4, YB + 1.6, 3.4), (-4.4, YB + 1.6, 3.4)], M['view'], outward=(0, -1, 0), uv=(UV_VIEW[2], UV_VIEW[1], UV_VIEW[0], UV_VIEW[3]))
bv.face([(1.9, YB + 1.2, 0.3), (4.7, YB + 1.2, 0.3), (4.7, YB + 1.2, 2.9), (1.9, YB + 1.2, 2.9)], M['view'], outward=(0, -1, 0), uv=(UV_VIEW[2], UV_VIEW[1], UV_VIEW[0], UV_VIEW[3]))
obj('window-night', bv.build('window-night'), parent=wb)
# dia: tarde soleada de julio en El Lago (cielo, arboleda, casa vecina, cesped y arbustos). Colores planos emisivos (sin textura nueva)
DAY = dict(sky_hi=mat('day-sky', (0.56, 0.75, 0.92), 0.9, emit=(0.56, 0.75, 0.92), emit_strength=1.0),
           sky_lo=mat('day-sky-haze', (0.80, 0.88, 0.94), 0.9, emit=(0.80, 0.88, 0.94), emit_strength=1.0),
           trees=mat('day-trees', (0.25, 0.37, 0.20), 0.9, emit=(0.25, 0.37, 0.20), emit_strength=0.75),
           trees2=mat('day-trees-near', (0.31, 0.45, 0.22), 0.9, emit=(0.31, 0.45, 0.22), emit_strength=0.8),
           lawn=mat('day-lawn', (0.44, 0.60, 0.27), 0.9, emit=(0.44, 0.60, 0.27), emit_strength=0.7),
           house=mat('day-house', (0.90, 0.87, 0.80), 0.9, emit=(0.90, 0.87, 0.80), emit_strength=0.8),
           roof=mat('day-roof', (0.42, 0.30, 0.24), 0.9, emit=(0.42, 0.30, 0.24), emit_strength=0.7),
           dark=mat('day-window-dark', (0.18, 0.22, 0.26), 0.9, emit=(0.18, 0.22, 0.26), emit_strength=0.6))
bd = MB()
def day_view(x0, x1, yb, zt):
    """capas planas mirando a la sala (-Y): cielo (2 bandas), arboleda con copas, cesped horizontal"""
    bd.face([(x0, yb, 1.55), (x1, yb, 1.55), (x1, yb, zt), (x0, yb, zt)], DAY['sky_hi'], outward=(0, -1, 0))
    bd.face([(x0, yb, -0.6), (x1, yb, -0.6), (x1, yb, 1.55), (x0, yb, 1.55)], DAY['sky_lo'], outward=(0, -1, 0))
    n = max(6, int((x1 - x0) / 0.35)); rnd = random.Random(7 + int(x0 * 10))
    for i in range(n):   # copas de arboles (siluetas) a dos profundidades
        xa = x0 + (x1 - x0) * i / n; xb = x0 + (x1 - x0) * (i + 1) / n; h = 1.25 + rnd.uniform(0.0, 0.55)
        bd.face([(xa, yb - 0.04, -0.6), (xb, yb - 0.04, -0.6), (xb, yb - 0.04, h - 0.1), ((xa + xb) / 2, yb - 0.04, h), (xa, yb - 0.04, h - 0.1)], DAY['trees'], outward=(0, -1, 0))
    for i in range(n // 2):
        xa = x0 + (x1 - x0) * (2 * i + 0.4) / n; xb = xa + (x1 - x0) * 1.3 / n; h = 0.95 + rnd.uniform(0.0, 0.35)
        bd.face([(xa, yb - 0.08, -0.6), (xb, yb - 0.08, -0.6), (xb, yb - 0.08, h - 0.12), ((xa + xb) / 2, yb - 0.08, h), (xa, yb - 0.08, h - 0.12)], DAY['trees2'], outward=(0, -1, 0))
    bd.face([(x0, YB + 0.15, -0.03), (x1, YB + 0.15, -0.03), (x1, yb - 0.1, -0.03), (x0, yb - 0.1, -0.03)], DAY['lawn'], outward=(0, 0, 1))
day_view(-4.4, 0.4, YB + 1.5, 3.4)
day_view(1.9, 4.7, YB + 1.1, 2.9)
# casa vecina (rancho de una planta) entre los arboles, visible por el ventanal
yh = YB + 1.36
bd.face([(-2.9, yh, -0.6), (-1.1, yh, -0.6), (-1.1, yh, 1.05), (-2.9, yh, 1.05)], DAY['house'], outward=(0, -1, 0))
bd.face([(-3.05, yh - 0.01, 1.05), (-0.95, yh - 0.01, 1.05), (-2.0, yh - 0.01, 1.45)], DAY['roof'], outward=(0, -1, 0))
for xw in (-2.6, -1.75):
    bd.face([(xw, yh - 0.012, 0.35), (xw + 0.45, yh - 0.012, 0.35), (xw + 0.45, yh - 0.012, 0.75), (xw, yh - 0.012, 0.75)], DAY['dark'], outward=(0, -1, 0))
wd = empty('window-day', parent=wb, size=0.3)
obj('window-day-view', bd.build('window-day-view'), parent=wd)
# arbustos junto a la fachada (volumen, se ven en diagonal)
sh_ = MB()
for (x, r) in ((-3.0, 0.42), (-1.05, 0.38), (3.3, 0.32)):
    c = Vector((x, YB + 0.55, 0.15))
    import bmesh as _bm
    bm_ = _bm.new(); _bm.ops.create_icosphere(bm_, subdivisions=1, radius=r, matrix=Matrix.Translation(c) @ Matrix.Diagonal((1.25, 0.8, 0.85, 1)))
    for f in bm_.faces: sh_.face([v.co.copy() for v in f.verts], DAY['trees2'], center=c)
    bm_.free()
obj('window-day-shrubs', sh_.build('window-day-shrubs'), parent=wd)

# ---------------- puertas (origen en la bisagra) ----------------
def door_mesh(name, w=0.9, h=2.03):
    d = MB()
    d.box((0, -0.022, 0), (w, 0.022, h), M['door'])
    for zz in (0.35, 1.15):
        for side in (-1, 1):
            d.box((0.12, side * 0.022 - (0.006 if side < 0 else 0), zz), (w - 0.12, side * 0.022 + (0.006 if side > 0 else 0), zz + 0.6), M['trim'], skip=('-y',) if side > 0 else ('+y',))
    d.cyl(w - 0.08, -0.05, 0.98, 1.0, 0.03, 6, M['brass'], M=Matrix.Translation((0, 0, 0)))
    return d.build(name)
dF = obj('door-front', door_mesh('door-front'), parent=root, loc=(XL + 0.05, DOOR_F[0] + 0.02, 0), rot_z=math.radians(90))
dF['hinge'] = 'origen en la bisagra'
dH = obj('door-hall', door_mesh('door-hall', w=0.82), parent=root, loc=(DOOR_H[0] + 0.02, YF + 0.05, 0), rot_z=0.0)
dH['hinge'] = 'origen en la bisagra'

# ---------------- muebles ----------------
def legs(bb, pts, z1, r, m, z0=0.0):
    for (x, y) in pts:
        bb.cyl(x, y, z0, z1, r, 6, m, top=False, r1=r * 0.6)

def sofa_mesh():
    s = MB(); L, Dp = 2.2, 0.85
    s.box((-L/2, -Dp/2, 0.14), (L/2, Dp/2, 0.34), M['olive'])
    for i in range(3):
        x0 = -L/2 + 0.12 + i * (L - 0.24) / 3
        s.box((x0 + 0.01, -Dp/2 + 0.02, 0.34), (x0 + (L - 0.24) / 3 - 0.01, Dp/2 - 0.18, 0.46), M['olive'], skip=('-z',))
    T = Matrix.Translation((0, Dp/2 - 0.1, 0.34)) @ Matrix.Rotation(math.radians(12), 4, 'X')
    s.box((-L/2 + 0.12, -0.09, 0), (L/2 - 0.12, 0.09, 0.48), M['olive'], M=T)
    for sx in (-1, 1):
        s.box((sx * L/2 - (0.12 if sx > 0 else 0), -Dp/2, 0.34), (sx * L/2 + (0.12 if sx < 0 else 0), Dp/2, 0.6), M['olive'], skip=('-z',))
    legs(s, [(-L/2 + 0.08, -Dp/2 + 0.08), (L/2 - 0.08, -Dp/2 + 0.08), (-L/2 + 0.08, Dp/2 - 0.08), (L/2 - 0.08, Dp/2 - 0.08)], 0.14, 0.025, M['teak'])
    return s.build('sofa')

def armchair_mesh():
    s = MB(); L, Dp = 0.85, 0.85
    s.box((-L/2, -Dp/2, 0.16), (L/2, Dp/2, 0.42), M['orange'])
    T = Matrix.Translation((0, Dp/2 - 0.1, 0.42)) @ Matrix.Rotation(math.radians(14), 4, 'X')
    s.box((-L/2 + 0.08, -0.09, 0), (L/2 - 0.08, 0.09, 0.55), M['orange'], M=T)
    for sx in (-1, 1):
        s.box((sx * L/2 - (0.09 if sx > 0 else 0), -Dp/2 + 0.05, 0.42), (sx * L/2 + (0.09 if sx < 0 else 0), Dp/2, 0.62), M['orange'], skip=('-z',))
    legs(s, [(-0.33, -0.33), (0.33, -0.33), (-0.33, 0.33), (0.33, 0.33)], 0.16, 0.025, M['teak'])
    return s.build('armchair')

def table_mesh(name, L, Dp, h, top=0.04, m=None):
    t = MB(); m = m or M['teak']
    t.box((-L/2, -Dp/2, h - top), (L/2, Dp/2, h), m)
    t.box((-L/2 + 0.06, -Dp/2 + 0.06, h - top - 0.08), (L/2 - 0.06, Dp/2 - 0.06, h - top), m, skip=('+z',))
    legs(t, [(-L/2 + 0.08, -Dp/2 + 0.08), (L/2 - 0.08, -Dp/2 + 0.08), (-L/2 + 0.08, Dp/2 - 0.08), (L/2 - 0.08, Dp/2 - 0.08)], h - top - 0.08, 0.028 if h > 0.6 else 0.022, m)
    return t.build(name)

def dining_chair_mesh():
    c = MB()
    c.box((-0.22, -0.22, 0.42), (0.22, 0.22, 0.47), M['orange'])
    legs(c, [(-0.18, -0.18), (0.18, -0.18), (-0.18, 0.18), (0.18, 0.18)], 0.42, 0.02, M['teak'])
    for sx in (-0.18, 0.18):
        c.box((sx - 0.02, 0.17, 0.47), (sx + 0.02, 0.21, 0.88), M['teak'], skip=('-z',))
    c.box((-0.2, 0.16, 0.66), (0.2, 0.21, 0.86), M['teak'])
    return c.build('dining-chair')

def tv_mesh():
    t = MB()
    # mueble consola de madera con patas (TV de tubo de 1969), pantalla mira a +Y
    t.box((-0.55, -0.25, 0.18), (0.55, 0.25, 0.86), M['dark'])
    legs(t, [(-0.48, -0.18), (0.48, -0.18), (-0.48, 0.18), (0.48, 0.18)], 0.18, 0.022, M['dark'])
    t.box((-0.40, 0.25, 0.30), (0.22, 0.27, 0.80), M['black'], skip=('-y',))                  # bisel
    t.box((0.26, 0.25, 0.30), (0.50, 0.265, 0.80), M['grille'], skip=('-y',))                 # altavoz
    for zz in (0.70, 0.60):
        t.cyl(0.38, 0.27, 0, 0.03, 0.028, 8, M['chrome'], M=Matrix.Translation((0, 0, zz)) @ Matrix.Rotation(-math.pi / 2, 4, 'X') @ Matrix.Translation((-0.38, -0.27, 0)) @ Matrix.Translation((0.38, 0.0, 0)))
    # pantalla ligeramente abombada: 2 quads
    t.face([(0.18, 0.272, 0.34), (-0.36, 0.272, 0.34), (-0.36, 0.272, 0.76), (0.18, 0.272, 0.76)], M['tv'], outward=(0, 1, 0), uv=UV_TV)
    # antena de conejo
    for a in (-0.5, 0.5):
        R = Matrix.Translation((-0.1, 0, 0.86)) @ Matrix.Rotation(a, 4, 'Y')
        t.box((-0.006, -0.006, 0.02), (0.006, 0.006, 0.55), M['chrome'], M=R, skip=('-z',))
    t.cyl(-0.1, 0, 0.86, 0.9, 0.06, 8, M['black'])
    return t.build('tv-set')

def squawk_mesh():
    s = MB()
    s.box((-0.16, -0.10, 0), (0.16, 0.10, 0.2), M['squawk'])               # caja metalica, frente a -Y
    s.face([(-0.13, -0.101, 0.04), (0.06, -0.101, 0.04), (0.06, -0.101, 0.17), (-0.13, -0.101, 0.17)], M['grille'], outward=(0, -1, 0))
    s.box((0.09, -0.12, 0.11), (0.14, -0.10, 0.16), M['black'], skip=('+y',))   # volumen
    s.box((0.09, -0.12, 0.05), (0.14, -0.10, 0.08), M['chrome'], skip=('+y',))  # interruptor
    s.box((-0.14, -0.08, 0.2), (0.14, 0.08, 0.215), M['grille'], skip=('-z',))
    return s.build('squawk-box')

def phone_mesh():
    p = MB()
    p.prism_x([(-0.11, 0), (0.11, 0), (0.08, 0.09), (-0.07, 0.10)], -0.11, 0.11, M['black'])
    p.cyl(0, -0.03, 0.0, 0.012, 0.055, 10, M['phone'], M=Matrix.Translation((0, 0, 0.075)) @ Matrix.Rotation(math.radians(-25), 4, 'X') @ Matrix.Translation((0, 0.03, 0)))
    # auricular
    p.box((-0.11, 0.02, 0.10), (0.11, 0.06, 0.125), M['black'])
    for sx in (-1, 1):
        p.box((sx * 0.1 - 0.025, 0.0, 0.085), (sx * 0.1 + 0.025, 0.08, 0.13), M['black'])
    return p.build('rotary-phone')

def lamp_mesh():
    l = MB()
    l.cyl(0, 0, 0, 0.03, 0.17, 10, M['brass'])
    l.cyl(0, 0, 0.03, 1.32, 0.012, 6, M['brass'], top=False)
    l.cyl(0, 0, 1.15, 1.47, 0.24, 12, M['shade'], top=False, bottom=False, r1=0.16)
    l.cyl(0, 0, 1.2, 1.26, 0.035, 6, M['bulb'])
    return l.build('floor-lamp')

def box_mesh(name, sx, sy, sz):
    c = MB()
    c.box((-sx/2, -sy/2, 0), (sx/2, sy/2, sz), M['card'], skip=('-z',))
    c.box((-sx/2 - 0.002, -0.025, sz), (sx/2 + 0.002, 0.025, sz + 0.002), M['tape'], skip=('-z',))
    return c.build(name)

def kitchen_mesh():
    k = MB()
    # bajo-mesada pared +X (y -1.5..2.65) y pared trasera (x 2.3..4.5)
    runs = [((XR - 0.62, -1.55, 0), (XR, YB - 0.62, 0.86)), ((2.3, YB - 0.62, 0), (XR, YB, 0.86))]
    for mn, mx in runs:
        k.box((mn[0] + (0.06 if mn[0] < 2.5 and mx[0] - mn[0] < 1 else 0), mn[1], 0.1), mx, M['cab'], skip=('-z',))
        k.box((mn[0] + 0.05, mn[1] + 0.05 if mx[1] - mn[1] > 1 else mn[1] + 0.05, 0), (mx[0], mx[1], 0.1), M['dark'], skip=('-z', '+z'))
        k.box((mn[0] - 0.03, mn[1] - 0.03, 0.86), (mx[0], mx[1], 0.9), M['counter'])
    # frentes de puertas (lineas) pared +X
    for y0 in [-1.45 + i * 0.52 for i in range(8)]:
        if y0 + 0.48 > YB - 0.62: break
        k.box((XR - 0.635, y0, 0.16), (XR - 0.62, y0 + 0.48, 0.8), M['teak'], skip=('+x',))
    for x0 in [2.4 + i * 0.52 for i in range(4)]:
        if x0 + 0.48 > XR - 0.62: break
        k.box((x0, YB - 0.635, 0.16), (x0 + 0.48, YB - 0.62, 0.8), M['teak'], skip=('+y',))
    # muebles altos
    k.box((XR - 0.35, -1.55, 1.45), (XR, YB - 0.35, 2.2), M['cab'])
    k.box((2.3, YB - 0.35, 1.95), (XR - 0.35, YB, 2.2), M['cab'])
    # fregadero bajo la ventana
    k.box((2.95, YB - 0.52, 0.9), (3.65, YB - 0.12, 0.905), M['chrome'], skip=('-z',))
    k.box((3.0, YB - 0.48, 0.905), (3.6, YB - 0.16, 0.91), M['grille'], skip=('-z',))
    k.cyl(3.3, YB - 0.08, 0.9, 1.15, 0.015, 6, M['chrome'])
    k.box((3.29, YB - 0.3, 1.13), (3.31, YB - 0.08, 1.15), M['chrome'])
    # cocina/horno (avocado)
    y0 = 0.05
    k.box((XR - 0.64, y0, 0.0), (XR, y0 + 0.76, 0.91), M['appl'])
    k.box((XR - 0.645, y0 + 0.08, 0.15), (XR - 0.64, y0 + 0.68, 0.65), M['black'], skip=('+x',))
    for (yy, xx) in ((y0 + 0.2, XR - 0.45), (y0 + 0.56, XR - 0.45), (y0 + 0.2, XR - 0.2), (y0 + 0.56, XR - 0.2)):
        k.cyl(xx, yy, 0.91, 0.92, 0.09, 8, M['black'])
    k.box((XR - 0.1, y0, 0.91), (XR, y0 + 0.76, 1.12), M['appl'])
    # nevera redondeada de los 60 (avocado)
    fx, fy = XR - 0.38, -2.35
    k.box((fx - 0.36, fy - 0.38, 0.0), (fx + 0.36, fy + 0.38, 1.45), M['appl'])
    k.prism_x([(-0.38, 0), (0.38, 0), (0.38, 0.12), (0.3, 0.2), (-0.3, 0.2), (-0.38, 0.12)], -0.36, 0.36, M['appl'], M=Matrix.Translation((fx, fy, 1.45)) @ Matrix.Rotation(-math.pi / 2, 4, 'Z') @ Matrix.Translation((0, 0, 0)))
    k.box((fx - 0.37, fy - 0.3, 1.0), (fx - 0.36, fy + 0.3, 1.01), M['black'], skip=('+x',))
    k.box((fx - 0.42, fy + 0.25, 1.1), (fx - 0.36, fy + 0.29, 1.5), M['chrome'], skip=('+x',))
    # calendario julio 1969
    k.face([(XR - 0.005, -0.9, 1.25), (XR - 0.005, -0.3, 1.25), (XR - 0.005, -0.3, 1.40), (XR - 0.005, -0.9, 1.40)], M['cal'], outward=(-1, 0, 0), uv=(UV_CAL[2], UV_CAL[1], UV_CAL[0], UV_CAL[3]))
    return k.build('kitchen')

# instancia de los muebles
sofa = obj('sofa', sofa_mesh(), parent=root, loc=(-2.0, 2.68, 0), rot_z=0.0)  # auditoria: frente (-Y) hacia la TV; con pi miraba a la ventana
arm = obj('armchair', armchair_mesh(), parent=root, loc=(-3.75, 0.1, 0), rot_z=math.radians(115))
obj('coffee-table', table_mesh('coffee-table', 1.2, 0.55, 0.42), parent=root, loc=(-2.0, 1.15, 0))
obj('end-table', table_mesh('end-table', 0.5, 0.5, 0.58, m=M['teak']), parent=root, loc=(-0.55, 2.75, 0))
obj('end-table-2', table_mesh('end-table', 0.5, 0.5, 0.58, m=M['teak']), parent=root, loc=(-4.15, -2.85, 0))
dining = obj('dining-table', table_mesh('dining-table', 1.6, 0.9, 0.75), parent=root, loc=(2.0, 0.35, 0))
chair_me = dining_chair_mesh()
chairs = [((2.0 - 0.45, 0.35 - 0.62), 0), ((2.0 + 0.45, 0.35 - 0.62), 0), ((2.0 - 0.45, 0.35 + 0.62), math.pi), ((2.0 + 0.45, 0.35 + 0.62), math.pi), ((2.0 - 1.05, 0.35), -math.pi / 2), ((2.0 + 1.05, 0.35), math.pi / 2)]
for i, ((x, y), a) in enumerate(chairs):
    obj(f'dining-chair-{i+1}', chair_me, parent=root, loc=(x + random.uniform(-0.04, 0.04), y, 0), rot_z=a + math.radians(random.uniform(-6, 6)))
tv = obj('tv-set', tv_mesh(), parent=root, loc=(-2.0, YF + 0.3, 0))
tv['note'] = 'pantalla = material tv-screen (emisivo, cambiar emissiveMap para otra imagen)'
sq = obj('squawk-box', squawk_mesh(), parent=root, loc=(-0.55, 2.7, 0.58), rot_z=math.radians(160))
sq['note'] = 'altavoz NASA (squawk box) para escuchar el circuito aire-tierra'
obj('rotary-phone', phone_mesh(), parent=root, loc=(-4.15, -2.85, 0.58), rot_z=math.radians(-60))
obj('floor-lamp', lamp_mesh(), parent=root, loc=(-3.55, 2.85, 0))
obj('kitchen', kitchen_mesh(), parent=root)
# alfombra
r = MB(); r.face([(-1.5, -1.0, 0.006), (1.5, -1.0, 0.006), (1.5, 1.0, 0.006), (-1.5, 1.0, 0.006)], M['rug'], outward=(0, 0, 1), uv=UV_RUG)
obj('rug', r.build('rug'), parent=root, loc=(-2.0, 1.1, 0))
# cajas de mudanza
bx = empty('moving-boxes', parent=root, loc=(0.45, -2.6, 0), size=0.3)
bA = box_mesh('moving-box-a', 0.6, 0.45, 0.45); bB = box_mesh('moving-box-b', 0.45, 0.35, 0.35)
obj('moving-box-1', bA, parent=bx, loc=(0, 0, 0), rot_z=0.1)
obj('moving-box-2', bA, parent=bx, loc=(0.05, 0.02, 0.452), rot_z=-0.15)
obj('moving-box-3', bB, parent=bx, loc=(0.0, 0.62, 0), rot_z=0.5)
obj('moving-box-4', bB, parent=bx, loc=(-0.6, 0.15, 0), rot_z=-0.3)
# estanteria con libros (pared frontal)
bs = MB(); bw, bd, bh = 0.8, 0.32, 1.8
bs.box((-bw/2, -bd/2, 0), (-bw/2 + 0.02, bd/2, bh), M['teak'], skip=('-z',))
bs.box((bw/2 - 0.02, -bd/2, 0), (bw/2, bd/2, bh), M['teak'], skip=('-z',))
bs.face([(-bw/2, -bd/2 + 0.01, 0), (bw/2, -bd/2 + 0.01, 0), (bw/2, -bd/2 + 0.01, bh), (-bw/2, -bd/2 + 0.01, bh)], M['dark'], outward=(0, 1, 0))
book_cols = [M['orange'], M['olive'], M['dark'], M['paper'], M['curtain'], M['photo']]
for k in range(5):
    z = 0.06 + k * 0.42
    bs.box((-bw/2 + 0.02, -bd/2, z - 0.02), (bw/2 - 0.02, bd/2, z), M['teak'], skip=('-z',) if k else ())
    if k < 4:
        x = -bw/2 + 0.03
        while x < bw/2 - 0.08:
            w_ = random.uniform(0.03, 0.06); h_ = random.uniform(0.22, 0.32)
            if random.random() < 0.85:
                bs.box((x, -bd/2 + 0.04, z), (x + w_ - 0.004, bd/2 - 0.04, z + h_), random.choice(book_cols), skip=('-z', '-y'))
            x += w_
obj('bookshelf', bs.build('bookshelf'), parent=root, loc=(-1.05, YF + 0.17, 0), rot_z=math.pi)
# plafon de la sala
pf = MB(); pf.cyl(0, 0, H - 0.09, H, 0.22, 12, M['shade'], top=False, bottom=True, r1=0.24)
obj('ceiling-light-living', pf.build('ceiling-light'), parent=root, loc=(-2.0, 0.6, 0))
obj('ceiling-light-kitchen', bpy.data.meshes['ceiling-light'], parent=root, loc=(3.5, 1.2, 0))
# pequenos objetos
cl = MB()
for (yc, zc, w_, h_) in ((0.3, 1.45, 0.5, 0.38), (1.1, 1.55, 0.35, 0.45)):   # cuadros pared -X
    cl.box((XL, yc - w_/2, zc - h_/2), (XL + 0.025, yc + w_/2, zc + h_/2), M['photo'], skip=('-x',))
    cl.face([(XL + 0.026, yc + w_/2 - 0.04, zc - h_/2 + 0.04), (XL + 0.026, yc - w_/2 + 0.04, zc - h_/2 + 0.04), (XL + 0.026, yc - w_/2 + 0.04, zc + h_/2 - 0.04), (XL + 0.026, yc + w_/2 - 0.04, zc + h_/2 - 0.04)], M['paper'], outward=(1, 0, 0))
cl.cyl(-2.25, 1.2, 0.42, 0.45, 0.08, 8, M['glass'], r1=0.09)      # cenicero
for (x, y, a) in ((-1.8, 1.05, 0.3), (-1.65, 1.2, -0.2)):         # revistas
    R = Matrix.Translation((x, y, 0.421)) @ Matrix.Rotation(a, 4, 'Z')
    cl.box((-0.11, -0.15, 0), (0.11, 0.15, 0.008), M['paper'], M=R, skip=('-z',))
for (x, y) in ((1.55, 0.2), (2.45, 0.5)):                          # platos
    cl.cyl(x, y, 0.75, 0.758, 0.12, 10, M['paper'])
# foto enmarcada sobre el TV y cuadro
cl.box((-2.15, YF + 0.0, 1.45), (-1.85, YF + 0.02, 1.7), M['photo'], skip=('-y',))
cl.face([(-1.875, YF + 0.021, 1.48), (-2.125, YF + 0.021, 1.48), (-2.125, YF + 0.021, 1.67), (-1.875, YF + 0.021, 1.67)], M['paper'], outward=(0, 1, 0))
obj('clutter', cl.build('clutter'), parent=root)

# ---------------- empties NPC (miran hacia su objetivo; frente = -Y blender / +Z glTF) ----------------
def face_to(p, t):
    dx, dy = t[0] - p[0], t[1] - p[1]
    return math.atan2(dx, -dy)
spots = {
    'npc-spot-jan': ((-0.95, 2.15, 0), (-0.55, 2.7), 'stand'),        # de pie junto al squawk box
    'npc-spot-rick': ((-1.6, 2.45, 0.0), (-2.0, YF), 'sit-sofa', {'seat_height': 0.46, 'target': 'tv-set'}),  # auditoria: adelantado (antes 2.6, pies dentro del sofa); seat_height 0.46 en el glb       # sentado en el sofa mirando la TV
    'npc-spot-mark': ((-2.2, 0.15, 0.006), (-2.0, YF), 'sit-floor'),   # sentado en la alfombra frente a la TV
    'npc-spot-neil': ((2.0 - 1.05, 0.35, 0), (2.0, 0.35), 'sit-chair'), # cabecera del comedor (escena previa)
}
for n, (p, t, pose, *more) in spots.items():
    empty(n, parent=root, loc=p, rot_z=face_to(p, t), size=0.4, props=dict({'pose': pose}, **(more[0] if more else {})))

# ---------------- luces (empties para el codigo) ----------------
for n, p, props in (
    ('light-living', (-2.0, 0.0, H - 0.05), {'light': 'point', 'color': '#ffd9a8', 'intensity': 3.0, 'distance': 8.0}),
    ('light-dining', (2.0, 0.35, 1.7), {'light': 'point', 'color': '#ffd59a', 'intensity': 3.0, 'distance': 6.0}),
    ('light-kitchen', (3.6, 1.2, H - 0.05), {'light': 'point', 'color': '#fff1d6', 'intensity': 2.5, 'distance': 6.0}),
    ('light-floor-lamp', (-3.55, 2.85, 1.25), {'light': 'point', 'color': '#ffc98a', 'intensity': 2.0, 'distance': 5.0}),
    ('light-tv-glow', (-2.0, YF + 0.9, 0.6), {'light': 'point', 'color': '#c8d4ff', 'intensity': 1.5, 'distance': 4.0}),
    ('light-moon-window', (-2.0, YB + 1.0, 2.0), {'light': 'directional', 'color': '#9fb4ff', 'intensity': 0.3, 'target': 'interior', 'variant': 'night'}),
    ('light-sun-window', (-2.0, YB + 1.2, 2.8), {'light': 'directional', 'color': '#fff0d6', 'intensity': 2.2, 'target': 'interior', 'variant': 'day'}),
):
    empty(n, parent=root, loc=p, size=0.25, props=props)
# lampara de techo del comedor (pantalla colgante)
pl = MB()
pl.cyl(0, 0, 1.75, 1.95, 0.28, 12, M['shade'], top=True, bottom=False, r1=0.1)
pl.cyl(0, 0, 1.95, H, 0.006, 4, M['brass'], top=False)
obj('pendant-lamp', pl.build('pendant-lamp'), parent=root, loc=(2.0, 0.35, 0))

meshes = [o for o in bpy.data.objects if o.type == 'MESH']
print('TRIS', tri_count(meshes))
blend_dir = os.path.join(OUT, 'blend'); os.makedirs(blend_dir, exist_ok=True)
raw_glb = os.path.join(HERE, 'armstrong-house.raw.glb')
if '--no-export' not in args:
    export_glb(raw_glb)

if '--render' in args:
    setup_render(sc, samples=int(os.environ.get('SAMPLES', 96)))
    world = bpy.data.worlds.new('w'); sc.world = world
    world.use_nodes = True; world.node_tree.nodes['Background'].inputs[0].default_value = (0.01, 0.012, 0.02, 1)
    L = []
    L.append(point_light('Lliving', (-2.0, 0.6, H - 0.15), 120, (1.0, 0.82, 0.6), 0.2))
    L.append(point_light('Ldining', (2.0, 0.35, 1.72), 60, (1.0, 0.8, 0.55), 0.1))
    L.append(point_light('Lkitchen', (3.5, 1.2, H - 0.15), 80, (1.0, 0.92, 0.8), 0.2))
    L.append(point_light('Llamp', (-3.55, 2.85, 1.3), 45, (1.0, 0.78, 0.5), 0.08))
    L.append(area_light('Ltv', (-2.0, YF + 0.35, 0.55), 0.5, 8, (0.8, 0.85, 1.0), rot=(math.radians(-90), 0, 0)))
    prev = os.path.join(OUT, 'previews'); os.makedirs(prev, exist_ok=True)
    cam = look_at_cam('cam-interior', (3.55, -1.6, 1.65), (-2.8, 1.5, 0.7), lens=17)
    sc.camera = cam
    sc.render.filepath = os.path.join(prev, 'armstrong-house.png')
    bpy.ops.render.render(write_still=True)
    import bmesh
    bm = bmesh.new(); bm.from_mesh(shell.data)
    kill = [f for f in bm.faces if f.calc_center_median().z > H - 0.3 and f.normal.z < -0.5]
    kill += [f for f in bm.faces if f.calc_center_median().y < YF + 0.2 or f.calc_center_median().x > XR - 0.2]
    kill += [f for f in bm.faces if f.calc_center_median().z > H - 0.3 and abs(f.calc_center_median().x - XK) < 0.15]
    bmesh.ops.delete(bm, geom=list(set(kill)), context='FACES')
    cut = bpy.data.meshes.new('shell-cut'); bm.to_mesh(cut); bm.free()
    for m_ in shell.data.materials: cut.materials.append(m_)
    orig = shell.data; shell.data = cut
    hide = [o for o in bpy.data.objects if o.name in ('door-hall',) or o.name.startswith('ceiling-light')]
    for o in hide: o.hide_render = True
    sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 0.6; so = bpy.data.objects.new('sun', sun); sc.collection.objects.link(so)
    so.rotation_euler = (math.radians(40), 0, math.radians(-30))
    cam2 = look_at_cam('cam-overview', (6.5, -9.5, 10.0), (0.0, 0.3, 0.3), lens=24)
    sc.camera = cam2
    sc.render.filepath = os.path.join(prev, 'armstrong-house-overview.png')
    bpy.ops.render.render(write_still=True)
    shell.data = orig
    for o in hide: o.hide_render = False
    bpy.data.objects.remove(so)

if '--no-export' not in args:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(blend_dir, 'armstrong-house-v01.blend'), compress=True)
print('DONE')
