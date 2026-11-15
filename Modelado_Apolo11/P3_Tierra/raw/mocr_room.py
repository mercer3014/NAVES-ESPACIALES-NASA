"""mocr-room.glb  - Mission Operations Control Room 2 (Houston, julio 1969).
Uso: ~/bin/blender -b -P mocr_room.py -- [--render] [--no-export]
Blender Z-arriba, frente de la sala (pantallas) hacia -Y. Origen: suelo de la fila 1 (trinchera), centro de la sala.
Sala 20 x 15 m, techo a 5 m. 4 filas escalonadas (+0.4 m cada una)."""
import bpy, sys, os, math, random
from mathutils import Vector, Matrix
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from p3common import *

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.dirname(HERE)
ATL = os.path.join(HERE, 'tex', 'mocr-atlas.png')
random.seed(11)
sc = reset()

W, D, H = 20.0, 15.0, 5.0
XL, XR, YF, YB = -W/2, W/2, -D/2, D/2
ROWS = [  # (y, z, bahias)
    (-3.0, 0.0, 10),
    (-0.7, 0.4, 12),
    (1.6, 0.8, 12),
    (3.9, 1.2, 10),
]
BAY = 1.05

# ---------------- materiales ----------------
M = dict(
    body=mat('console-body', (0.54, 0.60, 0.56), 0.55, 0.15),
    dark=mat('console-dark', (0.16, 0.18, 0.20), 0.5, 0.2),
    desk=mat('console-desk', (0.70, 0.68, 0.60), 0.35, 0.0),
    crt=mat('crt-screen', (0.02, 0.05, 0.03), 0.15, 0.0, tex=ATL, tex_emit=True, tex_base=True, emit_strength=1.6),
    crt_guido=mat('crt-screen-guido', (0.02, 0.05, 0.03), 0.15, 0.0, tex=ATL, tex_emit=True, emit_strength=1.6),
    bezel=mat('crt-bezel', (0.05, 0.05, 0.06), 0.4, 0.1),
    keys=mat('console-keys', (0.3, 0.3, 0.3), 0.45, 0.1, tex=ATL, tex_emit=True, emit_strength=0.35),
    vinyl=mat('chair-vinyl', (0.10, 0.11, 0.14), 0.55, 0.0),
    chrome=mat('chair-chrome', (0.75, 0.75, 0.77), 0.25, 1.0),
    plastic=mat('headset-plastic', (0.03, 0.03, 0.035), 0.4, 0.0),
    carpet=mat('floor-carpet', (0.22, 0.26, 0.30), 0.95, 0.0),
    riser=mat('riser-fascia', (0.28, 0.27, 0.25), 0.7, 0.0),
    wall=mat('wall-panel', (0.60, 0.56, 0.49), 0.9, 0.0),
    pilaster=mat('wall-pilaster', (0.34, 0.27, 0.20), 0.6, 0.0),
    front=mat('wall-front', (0.06, 0.07, 0.08), 0.8, 0.0),
    ceil=mat('ceiling', (0.16, 0.16, 0.17), 0.9, 0.0),
    lamp=mat('ceiling-lamp', (1.0, 0.97, 0.9), 0.5, 0.0, emit=(1.0, 0.95, 0.85), emit_strength=2.0),
    scr=mat('wall-screen', (0.02, 0.03, 0.04), 0.3, 0.0, tex=ATL, tex_emit=True, emit_strength=1.4),
    frame=mat('screen-frame', (0.10, 0.10, 0.11), 0.5, 0.3),
    chalk=mat('chalkboard', (0.2, 0.25, 0.2), 0.9, 0.0, tex=ATL),
    wood=mat('wood-trim', (0.40, 0.27, 0.15), 0.55, 0.0),
    glass=mat('viewing-glass', (0.04, 0.06, 0.07), 0.05, 0.0),
    door=mat('door', (0.46, 0.42, 0.36), 0.6, 0.0),
    paper=mat('paper', (0.92, 0.91, 0.86), 0.8, 0.0),
    ash=mat('ashtray-glass', (0.55, 0.62, 0.62), 0.1, 0.0),
    cup=mat('cup', (0.90, 0.89, 0.85), 0.4, 0.0),
)
UV_MAP = uvrect(0, 0, 512, 192)
UV_CHALK = uvrect(0, 192, 512, 320)
UV_DATA_A = uvrect(0, 320, 256, 448)
UV_DATA_B = uvrect(256, 320, 512, 448)
UV_CRT = [uvrect(2, 450, 94, 510), uvrect(98, 450, 190, 510)]
UV_KEYS = [uvrect(194, 450, 352, 510), uvrect(352, 450, 510, 510)]

root = empty('mocr-room', size=1.0)

# ---------------- consola (bahia) ----------------
def console_mesh(name, crt_mat):
    b = MB(); hx = BAY / 2
    sk = ('-x', '+x')
    b.box((-hx, -0.45, 0), (hx, 0.10, 0.08), M['dark'], skip=sk + ('-z',))            # zocalo
    b.box((-hx, -0.45, 0.08), (hx, 0.10, 0.72), M['body'], skip=sk + ('-z',))          # cuerpo
    b.box((-hx, -0.45, 0.72), (hx, 0.42, 0.755), M['desk'], skip=sk)                   # escritorio
    # panel inclinado de teclas
    b.face([(-hx+0.02, 0.13, 0.755), (hx-0.02, 0.13, 0.755), (hx-0.02, -0.05, 0.86), (-hx+0.02, -0.05, 0.86)], M['keys'], outward=(0, 1, 1.7), uv=UV_KEYS[0])
    # carcasa superior (perfil pentagonal)
    prof = [(-0.45, 0.755), (-0.05, 0.755), (-0.05, 0.86), (-0.17, 1.45), (-0.45, 1.45)]
    b.prism_x(prof, -hx, hx, M['body'], caps=False)
    b.box((-hx, -0.47, 1.45), (hx, -0.15, 1.49), M['dark'], skip=sk)                  # remate superior
    # dos CRT sobre la cara inclinada
    A = Vector((0, -0.05, 0.86)); B = Vector((0, -0.17, 1.45))
    dv = (B - A).normalized(); n = Vector((0, 0.6, 0.12)).normalized()
    for i, xc in enumerate((-0.25, 0.25)):
        for (w, h, off, m, uv) in ((0.42, 0.34, 0.003, M['bezel'], None), (0.34, 0.26, 0.006, crt_mat, UV_CRT[i])):
            mid = A + dv * 0.36 + n * off
            pts = []
            for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
                p = mid + dv * (sy * h / 2) + n * 0
                pts.append((xc + sx * w / 2, p.y, p.z))
            # orden p0 abajo-izq ... visto desde el operador (+Y): izquierda = -X? el operador mira -Y -> su izquierda es +X
            pts = [pts[1], pts[0], pts[3], pts[2]]
            b.face(pts, m, outward=n, uv=uv)
    return b.build(name)

def endcap_mesh(name):
    b = MB()
    b.box((-0.035, -0.48, 0), (0.035, 0.44, 0.77), M['dark'], skip=('-z',))
    b.prism_x([(-0.48, 0.77), (-0.05, 0.77), (-0.05, 0.86), (-0.17, 1.50), (-0.48, 1.50)], -0.035, 0.035, M['dark'])
    return b.build(name)

def chair_mesh(name):
    b = MB()
    for a in (math.radians(45), math.radians(-45)):
        R = Matrix.Rotation(a, 4, 'Z')
        b.box((-0.32, -0.025, 0.03), (0.32, 0.025, 0.07), M['chrome'], M=R)
    b.box((-0.025, -0.025, 0.07), (0.025, 0.025, 0.42), M['chrome'], skip=('-z', '+z'))
    b.box((-0.25, -0.24, 0.42), (0.25, 0.24, 0.50), M['vinyl'], skip=('-z',))
    T = Matrix.Translation((0, 0.25, 0.55)) @ Matrix.Rotation(math.radians(-10), 4, 'X')
    b.box((-0.23, -0.03, 0.0), (0.23, 0.03, 0.42), M['vinyl'], M=T)
    b.box((-0.02, 0.18, 0.45), (0.02, 0.24, 0.62), M['chrome'], skip=('-z', '+z'))
    for sx in (-1, 1):
        b.box((sx*0.27 - 0.02, -0.02, 0.48), (sx*0.27 + 0.02, 0.02, 0.64), M['chrome'], skip=('-z', '+z'))
        b.box((sx*0.27 - 0.035, -0.17, 0.64), (sx*0.27 + 0.035, 0.15, 0.68), M['vinyl'])
    return b.build(name)

def headset_mesh(name):
    b = MB()
    for sx in (-1, 1):
        b.box((sx*0.09 - 0.035, -0.035, 0), (sx*0.09 + 0.035, 0.035, 0.03), M['plastic'], skip=('-z',))
    # diadema en arco (3 tramos)
    pts = [(-0.09, 0.0), (-0.07, 0.09), (0.07, 0.09), (0.09, 0.0)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        L = math.hypot(x1 - x0, y1 - y0); a = math.atan2(y1 - y0, x1 - x0)
        Mt = Matrix.Translation(((x0 + x1) / 2, (y0 + y1) / 2, 0)) @ Matrix.Rotation(a, 4, 'Z')
        b.box((-L/2, -0.008, 0.005), (L/2, 0.008, 0.015), M['plastic'], M=Mt, skip=('-z', '-x', '+x'))
    Mt = Matrix.Translation((0.09, -0.07, 0.0)) @ Matrix.Rotation(math.radians(-70), 4, 'Z')
    b.box((-0.08, -0.004, 0.01), (0.08, 0.004, 0.018), M['plastic'], M=Mt, skip=('-z',))
    return b.build(name)

console_me = console_mesh('console-bay', M['crt'])
endcap_me = endcap_mesh('console-endcap')
chair_me = chair_mesh('swivel-chair')
headset_me = headset_mesh('headset')

SPECIAL = {(0, 5): 'console-fido', (0, 7): 'console-guido', (1, 9): 'console-capcom', (2, 5): 'console-flight'}
NPC = {'npc-spot-bales': (0, 7), 'npc-spot-garman': (0, 8), 'npc-spot-duke': (1, 9), 'npc-spot-kranz': (2, 5)}
POS_LABEL = [
    ['booster', 'booster', 'booster', 'retro', 'retro', 'fido', 'fido', 'guido', 'guido', 'guido'],
    ['control', 'control', 'telmu', 'telmu', 'gnc', 'gnc', 'eecom', 'eecom', 'surgeon', 'capcom', 'capcom', 'capcom'],
    ['inco', 'inco', 'o-and-p', 'o-and-p', 'afd', 'flight', 'flight', 'fao', 'fao', 'network', 'network', 'network'],
    ['pao', 'pao', 'mission-director', 'mission-director', 'dfo', 'dfo', 'dod', 'dod', 'staff', 'staff'],
]
rows = []; bay_world = {}
for r, (ry, rz, nb) in enumerate(ROWS):
    row = empty(f'console-row-{r+1}', parent=root, loc=(0, ry, rz), size=0.5)
    rows.append(row)
    x0 = nb * BAY / 2 - BAY / 2   # bahia 0 a la izquierda del operador (= +X)
    for i in range(nb):
        x = x0 - i * BAY
        key = (r, i)
        if key in SPECIAL:
            me = console_mesh(SPECIAL[key] + '-mesh', M['crt_guido'] if SPECIAL[key] == 'console-guido' else M['crt'])
            o = obj(SPECIAL[key], me, parent=row, loc=(x, 0, 0))
            o['position'] = POS_LABEL[r][i].upper()
        else:
            o = obj(f'console-r{r+1}-{i+1:02d}-{POS_LABEL[r][i]}', console_me, parent=row, loc=(x, 0, 0))
        bay_world[key] = Vector((x, ry, rz))
        yaw = math.radians(random.uniform(-25, 25))
        obj(f'chair-r{r+1}-{i+1:02d}', chair_me, parent=row, loc=(x + random.uniform(-0.08, 0.08), 0.95 + random.uniform(-0.1, 0.12), 0), rot_z=yaw)
        if random.random() < 0.85:
            obj(f'headset-r{r+1}-{i+1:02d}', headset_me, parent=row, loc=(x + random.uniform(-0.3, 0.3), 0.27, 0.755), rot_z=math.radians(random.uniform(-40, 40)))
    for side in (1, -1):
        obj(f'console-endcap-r{r+1}-{"l" if side > 0 else "r"}', endcap_me, parent=row, loc=(side * (nb * BAY / 2 + 0.035), 0, 0))

SEAT_H = 0.48   # cojin de la silla: 0,42-0,50 m (se hunde ~2 cm)
for name, key in NPC.items():
    p = bay_world[key]
    empty(name, parent=root, loc=(p.x, p.y + 0.85, p.z), size=0.4, props={'pose': 'sit', 'seat_height': SEAT_H, 'faces': '-Y blender / +Z glTF (hacia las pantallas)'})

# ---------------- controladores de relleno (instanciables con controller-extra.glb) ----------------
# 16 consolas ocupadas ademas de las 4 de los NPC: la silla se acerca a la consola y casi recta, y el spot va sobre el asiento.
EXTRA_BAYS = [(0, 1), (0, 3), (0, 5), (0, 9),
              (1, 1), (1, 3), (1, 5), (1, 7), (1, 8), (1, 10),
              (2, 1), (2, 3), (2, 8), (2, 10),
              (3, 3), (3, 5)]
VARIANTS = 'abcbacabcacbabca'
rx = random.Random(1969)
for k, (r, i) in enumerate(EXTRA_BAYS):
    ry, rz, nb = ROWS[r]; x = bay_world[(r, i)].x
    yaw = math.radians(rx.uniform(-7, 7))
    ch = bpy.data.objects[f'chair-r{r+1}-{i+1:02d}']
    ch.location = (x, 0.95, 0); ch.rotation_euler = (0, 0, yaw)
    f = Vector((math.sin(yaw), -math.cos(yaw), 0))
    pos = Vector((x, ry + 0.95, rz)) + f * 0.10
    empty(f'npc-spot-extra-{k+1}', parent=root, loc=tuple(pos), rot_z=yaw, size=0.4,
          props={'pose': 'sit', 'seat_height': SEAT_H, 'npc': 'controller-extra', 'variant': VARIANTS[k],
                 'position': POS_LABEL[r][i].upper(),
                 'faces': '-Y blender / +Z glTF (hacia las pantallas)'})

# ---------------- sala (cascaron) ----------------
b = MB()
yfront = [ry - 0.95 for ry, _, _ in ROWS]
# suelo de la trinchera
b.face([(XL, YF, 0), (XR, YF, 0), (XR, yfront[1], 0), (XL, yfront[1], 0)], M['carpet'], outward=(0, 0, 1))
for k in range(1, 4):
    z0, z1 = ROWS[k-1][1], ROWS[k][1]
    yend = yfront[k+1] if k < 3 else YB
    b.face([(XL, yfront[k], z0), (XR, yfront[k], z0), (XR, yfront[k], z1), (XL, yfront[k], z1)], M['riser'], outward=(0, -1, 0))
    b.face([(XL, yfront[k], z1), (XR, yfront[k], z1), (XR, yend, z1), (XL, yend, z1)], M['carpet'], outward=(0, 0, 1))
    # baranda/borde de madera
    b.box((XL, yfront[k] - 0.02, z1), (XR, yfront[k] + 0.06, z1 + 0.03), M['wood'], skip=('-z', '-x', '+x'))
# paredes laterales (perfil escalonado -> se suben desde la cota mas baja)
for x, nx in ((XL, 1), (XR, -1)):
    b.face([(x, YF, 0), (x, YB, 0), (x, YB, H), (x, YF, H)], M['wall'], outward=(nx, 0, 0))
    for yy in [YF + 1.5 + 2.5 * i for i in range(6)]:
        b.box((x - 0.06 if nx > 0 else x - 0.06, yy - 0.12, 0), (x + 0.06, yy + 0.12, H), M['pilaster'], skip=('-z', '+z', '-x' if nx > 0 else '+x'))
    b.box((min(x, x + nx*0.03), YF, 0), (max(x, x + nx*0.03), YB, 0.12), M['pilaster'], skip=('-z', '+z', '-x' if nx > 0 else '+x', '-y', '+y'))
# pared frontal y trasera
b.face([(XL, YF, 0), (XR, YF, 0), (XR, YF, H), (XL, YF, H)], M['front'], outward=(0, 1, 0))
zb = ROWS[3][1]
b.face([(XL, YB, zb), (XR, YB, zb), (XR, YB, 2.35), (XL, YB, 2.35)], M['wall'], outward=(0, -1, 0))
b.face([(XL, YB, 4.25), (XR, YB, 4.25), (XR, YB, H), (XL, YB, H)], M['wall'], outward=(0, -1, 0))
b.face([(XL, YB + 0.05, 2.35), (XR, YB + 0.05, 2.35), (XR, YB + 0.05, 4.25), (XL, YB + 0.05, 4.25)], M['glass'], outward=(0, -1, 0))
b.box((XL, YB - 0.25, 2.25), (XR, YB, 2.35), M['wood'], skip=('-x', '+x'))
for xm in [XL + 2.5 * i for i in range(1, 8)]:
    b.box((xm - 0.05, YB - 0.06, 2.35), (xm + 0.05, YB, 4.25), M['frame'], skip=('+y', '-z', '+z'))
# techo con luminarias
b.face([(XL, YF, H), (XR, YF, H), (XR, YB, H), (XL, YB, H)], M['ceil'], outward=(0, 0, -1))
lamps = []
for ly in (-4.5, -1.5, 1.5, 4.5):
    for lx in (-6.0, -2.0, 2.0, 6.0):
        b.face([(lx - 1.2, ly - 0.3, H - 0.01), (lx + 1.2, ly - 0.3, H - 0.01), (lx + 1.2, ly + 0.3, H - 0.01), (lx - 1.2, ly + 0.3, H - 0.01)], M['lamp'], outward=(0, 0, -1))
        lamps.append((lx, ly))
# faldon sobre las pantallas
b.box((XL, YF, 4.75), (XR, YF + 0.6, H), M['ceil'], skip=('-y', '+z', '-x', '+x'))
shell = obj('room-shell', b.build('room-shell'), parent=root)

# ---------------- pantallas de pared ----------------
ws = empty('wall-screens', parent=root, loc=(0, YF, 0), size=0.6)
def screen(name, cx, z0, w, h, uv):
    s = MB()
    s.box((-w/2 - 0.12, 0, z0 - 0.12), (w/2 + 0.12, 0.10, z0 + h + 0.12), M['frame'], skip=('-y',))
    s.face([(-w/2, 0.105, z0), (w/2, 0.105, z0), (w/2, 0.105, z0 + h), (-w/2, 0.105, z0 + h)], M['scr'], outward=(0, 1, 0), uv=uv)
    return obj(name, s.build(name), parent=ws, loc=(cx, 0, 0))
# las pantallas se ven desde +Y: izquierda del espectador = +X -> invertir u
def flipu(uv):
    return (uv[2], uv[1], uv[0], uv[3])
screen('screen-map', 0.0, 1.75, 7.2, 2.7, flipu(UV_MAP))
screen('screen-data-left', 6.2, 2.3, 3.2, 1.6, flipu(UV_DATA_A))
screen('screen-data-right', -6.2, 2.3, 3.2, 1.6, flipu(UV_DATA_B))
# franja de relojes GET/GMT
s = MB()
s.box((-3.0, 0, 4.55), (3.0, 0.12, 4.72), M['frame'], skip=('-y',))
for i in range(6):
    x = -2.6 + i * 1.04
    s.face([(x + 0.38, 0.125, 4.58), (x - 0.38, 0.125, 4.58), (x - 0.38, 0.125, 4.69), (x + 0.38, 0.125, 4.69)], M['keys'], outward=(0, 1, 0), uv=UV_KEYS[1])
obj('mission-clocks', s.build('mission-clocks'), parent=ws)

# ---------------- pizarra ----------------
cb = MB(); w, h = 3.2, 0.8
cb.box((-0.04, -w/2 - 0.06, -0.06), (0.0, w/2 + 0.06, h + 0.06), M['wood'], skip=('+x',))
cb.face([(-0.045, w/2, 0), (-0.045, -w/2, 0), (-0.045, -w/2, h), (-0.045, w/2, h)], M['chalk'], outward=(-1, 0, 0), uv=UV_CHALK)
cb.box((-0.12, -w/2, -0.06), (-0.04, w/2, -0.03), M['wood'], skip=('+x',))
chalk = obj('chalkboard', cb.build('chalkboard'), parent=root, loc=(XR, -5.3, 1.25))

# ---------------- puerta principal ----------------
dm = MB(); dw, dh = 1.0, 2.15
dm.box((0, -0.03, 0), (dw, 0.03, dh), M['door'])
dm.box((0.1, 0.03, 1.0), (0.85, 0.07, 1.05), M['chrome'], skip=('-y',))
dm.face([(0.3, 0.031, 1.4), (0.7, 0.031, 1.4), (0.7, 0.031, 1.9), (0.3, 0.031, 1.9)], M['glass'], outward=(0, 1, 0))
door = obj('door-main', dm.build('door-main'), parent=root, loc=(XL + 0.04, 6.9, ROWS[3][1]), rot_z=math.radians(-90))
door['hinge'] = 'origen en la bisagra; rotar en Y (glTF) para abrir'
fr = MB(); zd = ROWS[3][1]
for y0_, y1_ in ((6.92, 7.02), (5.78, 5.88)):
    fr.box((XL, y0_, zd), (XL + 0.08, y1_, zd + dh + 0.08), M['frame'], skip=('-x', '-z'))
fr.box((XL, 5.78, zd + dh), (XL + 0.08, 7.02, zd + dh + 0.1), M['frame'], skip=('-x',))
obj('door-frame', fr.build('door-frame'), parent=root)

# ---------------- objetos sobre consolas ----------------
cl = MB()
for key, p in bay_world.items():
    if random.random() < 0.55:   # papeles
        a = random.uniform(-0.5, 0.5); cx = p.x + random.uniform(-0.35, 0.35); cy = p.y + 0.27
        R = Matrix.Translation((cx, cy, p.z + 0.757)) @ Matrix.Rotation(a, 4, 'Z')
        pts = [R @ Vector(v) for v in ((-0.105, -0.14, 0), (0.105, -0.14, 0), (0.105, 0.14, 0), (-0.105, 0.14, 0))]
        cl.face(pts, M['paper'], outward=(0, 0, 1))
    if random.random() < 0.28:   # ceniceros
        cx = p.x + random.choice((-0.42, 0.42)); cy = p.y + 0.3
        cl.cyl(cx, cy, p.z + 0.755, p.z + 0.785, 0.07, 8, M['ash'], top=True, r1=0.075)
    if random.random() < 0.22:   # tazas de cafe
        cx = p.x + random.uniform(-0.4, 0.4); cy = p.y + 0.12
        cl.cyl(cx, cy, p.z + 0.755, p.z + 0.85, 0.04, 6, M['cup'], top=True)
# carpeta y libreta en GUIDO (hoja de alarmas)
p = bay_world[(0, 6)]
R = Matrix.Translation((p.x - 0.2, p.y + 0.22, p.z + 0.758)) @ Matrix.Rotation(0.2, 4, 'Z')
cl.box((-0.15, -0.11, 0), (0.15, 0.11, 0.012), M['paper'], M=R, skip=('-z',))
obj('desk-clutter', cl.build('desk-clutter'), parent=root)

# ---------------- empties de luz (las pone el codigo) ----------------
for i, (lx, ly) in enumerate(lamps):
    empty(f'light-ceiling-{i+1:02d}', parent=root, loc=(lx, ly, H - 0.05), size=0.3,
          props={'light': 'rect-area', 'width': 2.4, 'height': 0.6, 'color': '#fff2d9', 'intensity': 6.0})
empty('light-screens-glow', parent=root, loc=(0, YF + 1.5, 3.0), size=0.5,
      props={'light': 'point', 'color': '#9fd8c8', 'intensity': 4.0, 'distance': 14.0})

# ---------------- metricas ----------------
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
print('TRIS', tri_count(meshes))

blend_dir = os.path.join(OUT, 'blend'); os.makedirs(blend_dir, exist_ok=True)
raw_glb = os.path.join(HERE, 'mocr-room.raw.glb')
if '--no-export' not in args:
    export_glb(raw_glb)

# ---------------- render ----------------
if '--render' in args:
    setup_render(sc, samples=int(os.environ.get('SAMPLES', 96)))
    world = bpy.data.worlds.new('w'); sc.world = world
    world.use_nodes = True; world.node_tree.nodes['Background'].inputs[0].default_value = (0.02, 0.022, 0.025, 1)
    world.node_tree.nodes['Background'].inputs[1].default_value = 1.0
    ls = []
    for (lx, ly) in lamps:
        ls.append(area_light(f'L{lx}{ly}', (lx, ly, H - 0.03), 2.4, 260, (1.0, 0.94, 0.84), size_y=0.6))
    prev = os.path.join(OUT, 'previews'); os.makedirs(prev, exist_ok=True)
    cam = look_at_cam('cam-interior', (8.6, 2.9, 2.75), (-2.5, -6.2, 1.5), lens=20)
    sc.camera = cam
    sc.render.filepath = os.path.join(prev, 'mocr-room.png')
    bpy.ops.render.render(write_still=True)
    # vista general en corte (sin techo)
    cam2 = look_at_cam('cam-overview', (14.0, 15.0, 15.0), (0.0, -0.5, 0.5), lens=24)
    sc.camera = cam2
    sc.render.filepath = os.path.join(prev, 'mocr-room-overview.png')
    # corte: copia del cascaron sin techo ni paredes cercanas (solo para el render)
    import bmesh
    bm = bmesh.new(); bm.from_mesh(shell.data)
    ceil_idx = [shell.data.materials.find('ceiling'), shell.data.materials.find('ceiling-lamp')]
    kill = [f for f in bm.faces if f.material_index in ceil_idx and f.calc_center_median().z > H - 0.3]
    # tambien paredes laterales/trasera que tapan la vista desde +X+Y
    wall_idx = [shell.data.materials.find('wall-panel'), shell.data.materials.find('wall-pilaster'), shell.data.materials.find('viewing-glass'), shell.data.materials.find('wood-trim'), shell.data.materials.find('screen-frame')]
    kill += [f for f in bm.faces if f.material_index in wall_idx and (f.calc_center_median().x > XR - 0.2 or f.calc_center_median().y > YB - 0.4)]
    bmesh.ops.delete(bm, geom=list(set(kill)), context='FACES')
    shell_cut = bpy.data.meshes.new('shell-cut'); bm.to_mesh(shell_cut); bm.free()
    for m_ in shell.data.materials: shell_cut.materials.append(m_)
    orig = shell.data; shell.data = shell_cut
    chalk.hide_render = True
    for l in ls: l.data.energy *= 0.6
    sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 0.45; so = bpy.data.objects.new('sun', sun); sc.collection.objects.link(so)
    so.rotation_euler = (math.radians(35), 0, math.radians(140))
    bpy.ops.render.render(write_still=True)
    shell.data = orig; chalk.hide_render = False
    bpy.data.objects.remove(so)

if '--no-export' not in args:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(blend_dir, 'mocr-room-v01.blend'), compress=True)
print('DONE')
