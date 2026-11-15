# lrl-room.glb : sala de visitas del Lunar Receiving Laboratory (cuarentena, Houston 1969).
# Lado astronautas (y>0) y lado familia (y<0) separados por un vidrio grande (quarantine-glass).
# blender -b -P lrl_room.py
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
import p3c_lib as L

NAME = 'lrl-room'
sc = L.reset()
RX, RY, H = 8.0, 8.0, 2.8          # sala 8 x 8 m, techo 2,8 m
GW, GZ0, GZ1 = 4.4, 0.95, 2.25     # vidrio 4,4 m de ancho, de 0,95 a 2,25 m
root = L.empty(NAME, size=1)

M = dict(
    wall_in=L.mat('wall-cream', (0.78, 0.76, 0.66), rough=0.85),
    wall_out=L.mat('wall-green', (0.50, 0.62, 0.55), rough=0.85),
    floor_in=L.mat('floor-vinyl-beige', (0.62, 0.58, 0.50), rough=0.6),
    floor_out=L.mat('floor-vinyl-gray', (0.45, 0.46, 0.45), rough=0.6),
    ceil=L.mat('ceiling-tile', (0.86, 0.86, 0.83), rough=0.95),
    alu=L.mat('aluminum-frame', (0.70, 0.71, 0.72), rough=0.4, metal=0.6),
    wood=L.mat('wood-formica', (0.45, 0.30, 0.18), rough=0.5),
    steel=L.mat('steel-dark', (0.20, 0.21, 0.22), rough=0.45, metal=0.5),
    black=L.mat('phone-black', (0.03, 0.03, 0.03), rough=0.35),
    vinyl=L.mat('chair-vinyl-orange', (0.62, 0.30, 0.10), rough=0.55),
    light=L.mat('fluorescent', (0.95, 0.97, 1.0), rough=0.4, emit=(0.92, 0.96, 1.0), emit_strength=2.5),
    door=L.mat('door-gray', (0.52, 0.54, 0.55), rough=0.6, metal=0.2),
    sign=L.mat('sign-red', (0.55, 0.06, 0.05), rough=0.5),
    wain_in=L.mat('wainscot-tan', (0.52, 0.45, 0.34), rough=0.7),
    wain_out=L.mat('wainscot-green', (0.26, 0.38, 0.33), rough=0.7),
    tile_dark=L.mat('floor-tile-dark', (0.30, 0.28, 0.25), rough=0.55),
    cork=L.mat('cork-board', (0.55, 0.38, 0.22), rough=0.95),
    paper=L.mat('paper-white', (0.85, 0.84, 0.80), rough=0.9),
    plant=L.mat('plant-green', (0.12, 0.30, 0.10), rough=0.8),
    pot=L.mat('pot-brown', (0.35, 0.20, 0.12), rough=0.7),
)
MATS = list(M.values()); IDX = {k: i for i, k in enumerate(M)}

# ---------- estructura (paredes, piso, techo) ----------
bm = bmesh.new()
t = 0.12
L.box(bm, (0, RY/4, -0.05), (RX, RY/2, 0.1), IDX['floor_in'])
L.box(bm, (0, -RY/4, -0.05), (RX, RY/2, 0.1), IDX['floor_out'])
L.box(bm, (0, 0, H+0.05), (RX, RY, 0.1), IDX['ceil'])
L.box(bm, (0, RY/2+t/2, H/2), (RX, t, H), IDX['wall_in'])
L.box(bm, (0, -RY/2-t/2, H/2), (RX, t, H), IDX['wall_out'])
for sx in (-1, 1):
    L.box(bm, (sx*(RX/2+t/2), RY/4, H/2), (t, RY/2, H), IDX['wall_in'])
    L.box(bm, (sx*(RX/2+t/2), -RY/4, H/2), (t, RY/2, H), IDX['wall_out'])
# zocalo
for y, k in ((RY/2-0.01, 'steel'), (-RY/2+0.01, 'steel')):
    L.box(bm, (0, y, 0.05), (RX, 0.02, 0.1), IDX[k])
# tabique divisorio con hueco para el vidrio
side = (RX-GW)/2
for sx in (-1, 1):
    L.box(bm, (sx*(GW/2+side/2), 0, H/2), (side, 0.2, H), IDX['wall_out'])
L.box(bm, (0, 0, GZ0/2), (GW, 0.2, GZ0), IDX['wall_out'])
L.box(bm, (0, 0, (GZ1+H)/2), (GW, 0.2, H-GZ1), IDX['wall_out'])
# repisa de formica bajo el vidrio a ambos lados
L.box(bm, (0, -0.25, GZ0-0.02), (GW, 0.32, 0.04), IDX['wood'])
L.box(bm, (0, 0.25, GZ0-0.02), (GW, 0.32, 0.04), IDX['wood'])
# marco de aluminio
for z in (GZ0, GZ1):
    L.box(bm, (0, 0, z), (GW+0.08, 0.24, 0.06), IDX['alu'])
for x in (-GW/2, -GW/6, GW/6, GW/2):
    L.box(bm, (x, 0, (GZ0+GZ1)/2), (0.06, 0.24, GZ1-GZ0), IDX['alu'])
# rejilla del techo (perfiles T)
for i in range(1, 8):
    x = -RX/2 + i*RX/8
    L.box(bm, (x, 0, H-0.01), (0.03, RY, 0.02), IDX['alu'])
for i in range(1, 8):
    y = -RY/2 + i*RY/8
    L.box(bm, (0, y, H-0.01), (RX, 0.03, 0.02), IDX['alu'])
# puertas (una por lado) y letrero
L.box(bm, (-RX/2+1.2, RY/2-0.005, 1.05), (1.0, 0.04, 2.1), IDX['door'])
L.box(bm, (-RX/2+1.55, RY/2-0.04, 1.0), (0.12, 0.04, 0.04), IDX['alu'])
L.box(bm, (RX/2-1.2, -RY/2+0.005, 1.05), (1.0, 0.04, 2.1), IDX['door'])
L.box(bm, (RX/2-1.55, -RY/2+0.04, 1.0), (0.12, 0.04, 0.04), IDX['alu'])
L.box(bm, (-RX/2+1.2, RY/2-0.02, 2.3), (0.7, 0.03, 0.18), IDX['sign'])
# zocalo alto / friso de dos tonos (estilo institucional 1969)
for sx in (-1, 1):
    L.box(bm, (sx*(RX/2-0.005), RY/4, 0.55), (0.02, RY/2, 1.1), IDX['wain_in'])
    L.box(bm, (sx*(RX/2-0.005), -RY/4, 0.55), (0.02, RY/2, 1.1), IDX['wain_out'])
L.box(bm, (0, RY/2-0.005, 0.55), (RX, 0.02, 1.1), IDX['wain_in'])
L.box(bm, (0, -RY/2+0.005, 0.55), (RX, 0.02, 1.1), IDX['wain_out'])
for sx in (-1, 1):
    for sy in (-1, 1):
        L.box(bm, (sx*(GW/2+side/2), sy*0.105, 0.55), (side, 0.02, 1.1), IDX['wain_out' if sy < 0 else 'wain_in'])
    L.box(bm, (0, sx*0.105, GZ0/2), (GW, 0.02, GZ0), IDX['wain_out' if sx < 0 else 'wain_in'])
# baldosas vinilicas alternas (solo cara superior)
uvl = bm.loops.layers.uv.verify()
TS = 0.6
nx = int(RX/TS)
for i in range(nx+1):
    for j in range(int(RY/TS)+1):
        if (i+j) % 2: continue
        x0 = -RX/2 + i*TS; y0 = -RY/2 + j*TS
        x1 = min(x0+TS, RX/2); y1 = min(y0+TS, RY/2)
        if x0 >= RX/2 or y0 >= RY/2 or (y0 < 0 < y1): continue
        L.quad_uv(bm, [(x0, y0, 0.002), (x1, y0, 0.002), (x1, y1, 0.002), (x0, y1, 0.002)], (0, 0, 1, 1), IDX['tile_dark'], uvl)
# tablero de corcho con avisos (lado familia) y rejilla de ventilacion
L.box(bm, (-RX/2+0.02, -2.2, 1.55), (0.03, 1.2, 0.8), IDX['cork'])
for k, (yy, zz) in enumerate([(-2.5, 1.7), (-2.1, 1.45), (-1.85, 1.75), (-2.45, 1.38)]):
    L.box(bm, (-RX/2+0.04, yy, zz), (0.01, 0.21, 0.28), IDX['paper'])
L.box(bm, (RX/2-0.02, 2.6, 2.45), (0.03, 0.8, 0.3), IDX['steel'])
for k in range(5):
    L.box(bm, (RX/2-0.04, 2.6, 2.33+k*0.06), (0.01, 0.76, 0.02), IDX['alu'])
# fuente de agua (lado familia)
L.box(bm, (RX/2-0.2, -2.0, 0.85), (0.35, 0.4, 0.25), IDX['alu'])
L.box(bm, (RX/2-0.06, -2.0, 0.45), (0.1, 0.25, 0.6), IDX['steel'])
L.new_obj('room-shell', bm, MATS, parent=root)

# planta en maceta y perchero (lado familia)
bm = bmesh.new()
L.cyl(bm, (-RX/2+0.45, -RY/2+0.45, 0.2), 0.17, 0.22, 0.4, segs=10, mi=IDX['pot'])
for k, (dx, dy, h) in enumerate([(0, 0, 0.9), (0.12, 0.05, 0.75), (-0.1, 0.08, 0.7), (0.03, -0.12, 0.8)]):
    L.cyl(bm, (-RX/2+0.45+dx, -RY/2+0.45+dy, 0.4+h/2), 0.16, 0.0, h, segs=5, mi=IDX['plant'])
L.cyl(bm, (-RX/2+0.4, -1.0, 0.9), 0.02, 0.02, 1.8, segs=6, mi=IDX['steel'])
L.cyl(bm, (-RX/2+0.4, -1.0, 0.02), 0.25, 0.25, 0.04, segs=10, mi=IDX['steel'])
for a in range(4):
    import math as _m
    L.box(bm, (-RX/2+0.4+0.1*_m.cos(a*_m.pi/2), -1.0+0.1*_m.sin(a*_m.pi/2), 1.72), (0.2, 0.02, 0.02), IDX['steel'], rot_z=a*_m.pi/2)
L.new_obj('decor', bm, MATS, parent=root)

# ---------- vidrio de cuarentena ----------
glass = L.mat('quarantine-glass', (0.80, 0.90, 0.92, 1.0), rough=0.05, alpha=0.18)
bm = bmesh.new()
L.box(bm, (0, 0, (GZ0+GZ1)/2), (GW, 0.025, GZ1-GZ0), 0)
L.new_obj('quarantine-glass', bm, [glass], parent=root)

# ---------- telefonos de pared (uno por lado) ----------
PHONE_X = GW/2 + 0.25   # en el tabique, junto al borde del vidrio
def wall_phone(name, y, facing):
    e = L.empty(name, (PHONE_X, y, 1.20), parent=root, size=0.15)   # 1,20 m: alcanzable sentado
    bm = bmesh.new()
    d = facing  # -1 cara hacia -Y, +1 hacia +Y
    L.box(bm, (0, d*0.04, 0), (0.20, 0.08, 0.30), IDX['black'])          # caja
    L.box(bm, (0, d*0.10, 0.02), (0.06, 0.05, 0.24), IDX['black'])       # auricular
    L.box(bm, (0, d*0.105, 0.13), (0.09, 0.06, 0.05), IDX['black'])
    L.box(bm, (0, d*0.105, -0.09), (0.09, 0.06, 0.05), IDX['black'])
    L.cyl(bm, (0, d*0.081, -0.07), 0.05, 0.05, 0.004, segs=12, mi=IDX['alu'], axis='Y')  # dial
    # cordon en espiral simplificado
    for i in range(6):
        L.cyl(bm, (-0.07, d*0.10, -0.08 - i*0.035), 0.018, 0.018, 0.02, segs=6, mi=IDX['black'])
    ob = L.new_obj(name + '-mesh', bm, MATS, parent=e)
    return e
wall_phone('phone-inside', 0.10, +1)
wall_phone('phone-outside', -0.10, -1)

# ---------- mobiliario ----------
SEAT_H = 0.45
# silla: respaldo en +Y local -> con rot 0 quien se sienta mira a -Y (Blender) = +Z glTF
def chair(bm, x, y, rot):
    import mathutils
    vs = []
    vs += L.box(bm, (0, 0, SEAT_H-0.03), (0.46, 0.44, 0.06), IDX['vinyl'])   # cara superior del asiento = SEAT_H
    vs += L.box(bm, (0, 0.20, 0.75), (0.46, 0.05, 0.40), IDX['vinyl'])
    for lx in (-0.2, 0.2):
        for ly in (-0.18, 0.18):
            vs += L.box(bm, (lx, ly, 0.21), (0.03, 0.03, 0.42), IDX['alu'])
    bmesh.ops.transform(bm, verts=vs, matrix=mathutils.Matrix.Translation((x, y, 0)) @ mathutils.Matrix.Rotation(rot, 4, 'Z'))

def table(bm, x, y, w, d):
    L.box(bm, (x, y, 0.73), (w, d, 0.04), IDX['wood'])
    for lx in (-1, 1):
        for ly in (-1, 1):
            L.box(bm, (x+lx*(w/2-0.06), y+ly*(d/2-0.06), 0.36), (0.04, 0.04, 0.72), IDX['steel'])

bm = bmesh.new()
table(bm, 1.9, 2.6, 1.6, 0.8)                  # mesa lado astronautas
chair(bm, 1.5, 3.25, 0.0); chair(bm, 2.3, 3.25, 0.0); chair(bm, 1.9, 1.95, math.pi)
L.new_obj('table', bm, MATS, parent=root)
bm = bmesh.new()
CHAIR_X = (-1.2, -0.3, 0.9, 2.15)              # la de 2,15 queda frente a cada telefono
CHAIR_Y = 0.75
for x in CHAIR_X:
    chair(bm, x, CHAIR_Y, 0.0)                 # lado astronautas: mira al vidrio (-Y Blender)
    chair(bm, x, -CHAIR_Y, math.pi)            # lado familia: mira al vidrio (+Y Blender)
table(bm, -2.8, -2.6, 1.2, 0.6)                # mesita de espera lado familia
L.new_obj('chairs', bm, MATS, parent=root)

# reloj de pared y extras
bm = bmesh.new()
L.cyl(bm, (-2.6, -0.11, 2.15), 0.17, 0.17, 0.04, segs=16, mi=IDX['door'], axis='Y')
L.cyl(bm, (-2.6, -0.135, 2.15), 0.14, 0.14, 0.01, segs=16, mi=IDX['ceil'], axis='Y')
L.box(bm, (-2.6, -0.142, 2.19), (0.01, 0.005, 0.09), IDX['black'])
L.box(bm, (-2.57, -0.142, 2.15), (0.07, 0.005, 0.01), IDX['black'])
L.new_obj('wall-clock', bm, MATS, parent=root)

# ---------- luminarias fluorescentes ----------
bm = bmesh.new()
lights = []
for i, (x, y) in enumerate([(-2.0, 2.0), (2.0, 2.0), (-2.0, -2.0), (2.0, -2.0), (0, 3.4), (0, -3.4)]):
    L.box(bm, (x, y, H-0.035), (1.22, 0.30, 0.05), IDX['alu'])
    L.box(bm, (x, y, H-0.065), (1.15, 0.24, 0.01), IDX['light'])
    lights.append(L.empty('light-%d' % (i+1), (x, y, H-0.1), parent=root, size=0.3))
L.new_obj('fluorescent-fixtures', bm, MATS, parent=root)

# ---------- puntos de NPC (frente -Y; la familia mira +Y) ----------
# Convencion: el spot mira a +Z del glTF (= -Y Blender) sin rotar; origen en el suelo.
# 'sit': origen en el suelo justo bajo el centro del asiento (cara superior a SEAT_H), mirando al vidrio.
def spot(name, x, y, rot, pose, **kw):
    e = L.empty(name, (x, y, 0), parent=root, size=0.4)
    e.rotation_euler.z = rot
    e['pose'] = pose
    for k, v in kw.items(): e[k] = v
    return e
spot('npc-spot-neil', 2.15, CHAIR_Y, 0.0, 'sit', seat_height=SEAT_H, target='quarantine-glass', phone='phone-inside')
spot('npc-spot-jan', 2.15, -CHAIR_Y, math.pi, 'sit', seat_height=SEAT_H, target='quarantine-glass', phone='phone-outside')
spot('npc-spot-rick', 1.60, -1.30, math.pi, 'stand', target='quarantine-glass')   # detras, entre sillas 0,9 y 2,15
spot('npc-spot-mark', 1.52, -0.66, math.pi, 'stand', target='quarantine-glass')   # pegado al vidrio, hueco entre sillas

print('TRIS', L.tris_count())
L.save_blend(NAME)
L.export(NAME, extras=True)
# preview: luces de area en cada luminaria + camara desde el rincon de la familia
xl = [((e.location.x, e.location.y, H-0.15), 35, 1.0) for e in lights]
L.render_preview(NAME, cam_loc=(3.3, -3.7, 1.75), target=(-0.6, 1.0, 1.1), lens=17,
                 world=(0.2, 0.2, 0.2), world_strength=0.3, sun=None, extra_lights=xl, samples=64)
