# hotel-room-1967.glb : habitacion de hotel estilo Georgetown Inn (Washington DC, 1967).
# Cama doble, mesitas, telefono de disco (nodo phone), ventana con cortinas (nodo window), escritorio, sillon.
# blender -b -P hotel_room_1967.py
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Matrix, Vector
import p3c_lib as L

NAME = 'hotel-room-1967'
sc = L.reset()
RX, RY, H = 4.6, 5.6, 2.7
root = L.empty(NAME, size=1)
M = dict(
    wall=L.mat('wallpaper-olive', (0.55, 0.50, 0.33), rough=0.85),
    carpet=L.mat('carpet-rust', (0.36, 0.16, 0.08), rough=1.0),
    ceil=L.mat('ceiling-plaster', (0.85, 0.83, 0.78), rough=0.95),
    wood=L.mat('walnut', (0.25, 0.14, 0.07), rough=0.45),
    trim=L.mat('trim-white', (0.82, 0.80, 0.74), rough=0.5),
    spread=L.mat('bedspread-gold', (0.66, 0.48, 0.16), rough=0.9),
    sheet=L.mat('sheet-white', (0.88, 0.87, 0.82), rough=0.9),
    curtain=L.mat('curtain-green', (0.18, 0.30, 0.20), rough=0.95),
    sheer=L.mat('sheer-cream', (0.90, 0.88, 0.80, 1.0), rough=0.9),
    night=L.mat('window-dusk', (0.10, 0.14, 0.25), rough=0.2, emit=(0.18, 0.24, 0.45), emit_strength=1.2),
    brass=L.mat('brass', (0.75, 0.55, 0.22), rough=0.35, metal=0.7),
    shade=L.mat('lampshade', (0.92, 0.86, 0.70), rough=0.8, emit=(1.0, 0.85, 0.55), emit_strength=1.5),
    bake=L.mat('bakelite-black', (0.02, 0.02, 0.02), rough=0.25),
    uph=L.mat('armchair-teal', (0.10, 0.30, 0.32), rough=0.85),
    frame=L.mat('frame-gold', (0.70, 0.52, 0.20), rough=0.4, metal=0.6),
    art=L.mat('painting-landscape', (0.35, 0.42, 0.35), rough=0.8),
    door=L.mat('door-walnut', (0.30, 0.17, 0.09), rough=0.5),
    mirror=L.mat('mirror', (0.8, 0.82, 0.84), rough=0.05, metal=1.0),
)
MATS = list(M.values()); I = {k: i for i, k in enumerate(M)}
def mesh(name, bm, parent=root): return L.new_obj(name, bm, MATS, parent=parent)

# --- estructura ---
bm = bmesh.new(); t = 0.12
L.box(bm, (0, 0, -0.05), (RX, RY, 0.1), I['carpet'])
L.box(bm, (0, 0, H+0.05), (RX, RY, 0.1), I['ceil'])
WX0, WX1, WZ0, WZ1 = -1.0, 1.0, 0.75, 2.3   # hueco de ventana en la pared +Y
L.box(bm, (0, -RY/2-t/2, H/2), (RX, t, H), I['wall'])
for sx in (-1, 1): L.box(bm, (sx*(RX/2+t/2), 0, H/2), (t, RY, H), I['wall'])
L.box(bm, ((-RX/2+WX0)/2, RY/2+t/2, H/2), (WX0+RX/2, t, H), I['wall'])
L.box(bm, ((RX/2+WX1)/2, RY/2+t/2, H/2), (RX/2-WX1, t, H), I['wall'])
L.box(bm, (0, RY/2+t/2, WZ0/2), (WX1-WX0, t, WZ0), I['wall'])
L.box(bm, (0, RY/2+t/2, (WZ1+H)/2), (WX1-WX0, t, H-WZ1), I['wall'])
# zocalo y moldura de techo
for y, sx in ((RY/2-0.01, None), (-RY/2+0.01, None)):
    L.box(bm, (0, y, 0.06), (RX, 0.02, 0.12), I['trim']); L.box(bm, (0, y, H-0.04), (RX, 0.03, 0.08), I['trim'])
for sx in (-1, 1):
    L.box(bm, (sx*(RX/2-0.01), 0, 0.06), (0.02, RY, 0.12), I['trim']); L.box(bm, (sx*(RX/2-0.01), 0, H-0.04), (0.03, RY, 0.08), I['trim'])
# puerta de entrada
L.box(bm, (1.4, -RY/2+0.02, 1.03), (0.9, 0.04, 2.06), I['door'])
L.box(bm, (1.4, -RY/2+0.01, 2.1), (1.04, 0.03, 0.08), I['trim'])
L.cyl(bm, (1.02, -RY/2+0.06, 1.0), 0.03, 0.03, 0.05, segs=8, mi=I['brass'], axis='Y')
mesh('room-shell', bm)

# --- ventana (nodo window): marco de guillotina, vidrio de noche, cortinas ---
win = L.empty('window', (0, RY/2, WZ0), parent=root, size=0.3)
bm = bmesh.new()
L.box(bm, (0, 0.05, (WZ1-WZ0)/2), (WX1-WX0, 0.02, WZ1-WZ0), I['night'])
for z in (0, (WZ1-WZ0)/2, WZ1-WZ0):
    L.box(bm, (0, 0.0, z), (WX1-WX0+0.1, 0.12, 0.06), I['trim'])
for x in (WX0, 0, WX1):
    L.box(bm, (x, 0.0, (WZ1-WZ0)/2), (0.06, 0.12, WZ1-WZ0), I['trim'])
L.box(bm, (0, -0.1, -0.02), (WX1-WX0+0.3, 0.2, 0.04), I['trim'])       # alfeizar
# cortinas con pliegues (zigzag)
for sx in (-1, 1):
    verts_bottom, verts_top = [], []
    n = 10
    for i in range(n+1):
        x = sx*(1.0 + 0.55*i/n) - (0.0)
        y = -0.18 + (0.06 if i % 2 else 0.0)
        verts_bottom.append(bm.verts.new((x, y, -WZ0+0.02)))
        verts_top.append(bm.verts.new((x, y, H-WZ0-0.08)))
    for i in range(n):
        vs = [verts_bottom[i], verts_bottom[i+1], verts_top[i+1], verts_top[i]]
        if sx < 0: vs.reverse()
        f = bm.faces.new(vs); f.material_index = I['curtain']
L.cyl(bm, (0, -0.2, H-WZ0-0.06), 0.015, 0.015, 3.3, segs=6, mi=I['brass'], axis='X')
mesh('window-mesh', bm, win)

# --- cama doble (nodo bed) ---
bed = L.empty('bed', (-0.6, -0.4, 0), parent=root, size=0.5)
bm = bmesh.new()
BW, BL = 1.4, 2.0
L.box(bm, (0, 0, 0.18), (BW+0.06, BL+0.04, 0.26), I['wood'])
L.box(bm, (0, -0.02, 0.43), (BW, BL-0.04, 0.24), I['sheet'])
L.box(bm, (0, -0.15, 0.52), (BW+0.1, BL-0.25, 0.07), I['spread'])
L.box(bm, (0, -0.15, 0.30), (BW+0.12, BL-0.25, 0.42), I['spread'])        # faldon
for sx in (-1, 1):
    vs = L.box(bm, (sx*0.33, BL/2-0.28, 0.6), (0.6, 0.35, 0.14), I['sheet'])
L.box(bm, (0, BL/2+0.03, 0.62), (BW+0.2, 0.06, 1.24), I['wood'])           # cabecero
L.box(bm, (0, BL/2+0.0, 1.2), (BW+0.26, 0.1, 0.06), I['wood'])
mesh('bed-mesh', bm, bed)
bed.rotation_euler.z = 0  # cabecero contra la pared +Y? no: contra pared lateral
bed.location = (-RX/2+1.05, 0.2, 0); bed.rotation_euler.z = math.pi/2

# --- mesitas, lampara y telefono (nodo phone) ---
bm = bmesh.new()
for y in (0.2-1.0-0.35, 0.2+1.0+0.35)[:1] + (0.2+1.05,):
    pass
NS = [(-RX/2+0.28, 0.2-0.95), (-RX/2+0.28, 0.2+0.95)]
for (x, y) in NS:
    L.box(bm, (x, y, 0.28), (0.5, 0.45, 0.56), I['wood'])
    L.box(bm, (x+0.255, y, 0.36), (0.01, 0.38, 0.12), I['trim'])
# lampara de mesa en la mesita 2
lx, ly = NS[1]
L.cyl(bm, (lx, ly, 0.58), 0.08, 0.08, 0.04, segs=10, mi=I['brass'])
L.cyl(bm, (lx, ly, 0.75), 0.012, 0.012, 0.32, segs=6, mi=I['brass'])
L.cyl(bm, (lx, ly, 0.97), 0.1, 0.17, 0.24, segs=12, mi=I['shade'], cap=False)
mesh('nightstands', bm)
lamp = L.empty('lamp-light', (lx, ly, 0.95), parent=root, size=0.1)
ph = L.empty('phone', (NS[0][0], NS[0][1], 0.56), parent=root, size=0.1)
bm = bmesh.new()
def frustum(bm, z0, z1, w0, d0, w1, d1, mi):
    vb = [bm.verts.new((x*w0/2, y*d0/2, z0)) for x, y in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    vt = [bm.verts.new((x*w1/2, y*d1/2, z1)) for x, y in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    fs = [bm.faces.new(list(reversed(vb))), bm.faces.new(vt)] + [bm.faces.new((vb[i], vb[(i+1) % 4], vt[(i+1) % 4], vt[i])) for i in range(4)]
    for f in fs: f.material_index = mi
frustum(bm, 0, 0.09, 0.22, 0.23, 0.15, 0.13, I['bake'])
vs = L.cyl(bm, (0, 0, 0), 0.045, 0.045, 0.006, segs=12, mi=I['sheet'])
bmesh.ops.transform(bm, verts=vs, matrix=Matrix.Translation((0.0, -0.09, 0.055)) @ Matrix.Rotation(math.radians(50), 4, 'X'))
L.box(bm, (0, 0.03, 0.115), (0.15, 0.035, 0.025), I['bake'])
for sx in (-1, 1): L.cyl(bm, (sx*0.095, 0.03, 0.11), 0.026, 0.022, 0.035, segs=8, mi=I['bake'])
o = mesh('phone-mesh', bm, ph); ph.rotation_euler.z = math.pi/2

# --- escritorio, silla, espejo, sillon, cuadro, maleta ---
bm = bmesh.new()
dx, dy = RX/2-0.32, -0.6
L.box(bm, (dx, dy, 0.74), (0.55, 1.3, 0.04), I['wood'])
for sy in (-1, 1):
    L.box(bm, (dx, dy+sy*0.5, 0.36), (0.5, 0.3, 0.72), I['wood'])
L.box(bm, (RX/2-0.02, dy, 1.45), (0.03, 0.9, 0.8), I['frame'])
L.box(bm, (RX/2-0.04, dy, 1.45), (0.01, 0.8, 0.7), I['mirror'])
# silla del escritorio
cx, cy = dx-0.55, dy
L.box(bm, (cx, cy, 0.46), (0.44, 0.44, 0.06), I['uph'])
L.box(bm, (cx-0.2, cy, 0.75), (0.05, 0.42, 0.5), I['wood'])
for a in (-1, 1):
    for b in (-1, 1): L.box(bm, (cx+a*0.18, cy+b*0.18, 0.22), (0.04, 0.04, 0.44), I['wood'])
# sillon junto a la ventana
ax, ay = 1.4, RY/2-0.8
L.box(bm, (ax, ay, 0.25), (0.8, 0.8, 0.3), I['uph'])
L.box(bm, (ax, ay+0.33, 0.65), (0.8, 0.16, 0.6), I['uph'])
for sx in (-1, 1): L.box(bm, (ax+sx*0.36, ay, 0.5), (0.12, 0.8, 0.22), I['uph'])
for a in (-1, 1):
    for b in (-1, 1): L.cyl(bm, (ax+a*0.33, ay+b*0.33, 0.05), 0.025, 0.02, 0.1, segs=6, mi=I['wood'])
# cuadro sobre la cama
L.box(bm, (-RX/2+0.02, 0.2, 1.75), (0.03, 1.0, 0.65), I['frame'])
L.box(bm, (-RX/2+0.04, 0.2, 1.75), (0.01, 0.9, 0.55), I['art'])
# maleta en portamaletas
L.box(bm, (0.4, -RY/2+0.6, 0.25), (0.7, 0.45, 0.04), I['brass'])
for sx in (-1, 1): L.box(bm, (0.4+sx*0.3, -RY/2+0.6, 0.12), (0.03, 0.4, 0.24), I['brass'])
L.box(bm, (0.4, -RY/2+0.6, 0.38), (0.66, 0.4, 0.22), I['door'])
mesh('furniture', bm)

# luz de techo y puntos
bm = bmesh.new()
L.cyl(bm, (0, 0, H-0.06), 0.22, 0.16, 0.1, segs=12, mi=I['shade'])
mesh('ceiling-fixture', bm)
L.empty('light-ceiling', (0, 0, H-0.15), parent=root, size=0.2)
# spots: miran a +Z glTF (= -Y Blender) sin rotar; extras.pose
e = L.empty('npc-spot-bed', (-1.25, -0.40, 0), parent=root, size=0.3)     # sentado en el borde de la cama, mirando a la sala
e['pose'] = 'sit'; e['seat_height'] = 0.55
e = L.empty('npc-spot-window', (0.2, RY/2-0.7, 0), parent=root, size=0.3); e.rotation_euler.z = math.pi
e['pose'] = 'stand'; e['target'] = 'window'

print('TRIS', L.tris_count())
L.save_blend(NAME)
L.export(NAME, extras=True)
L.render_preview(NAME, cam_loc=(1.9, -2.6, 1.7), target=(-0.8, 0.9, 0.8), lens=18,
                 world=(0.1, 0.12, 0.2), world_strength=0.4, sun=None, samples=64,
                 extra_lights=[((0, 0, H-0.3), 80, 1.0), ((lx, ly, 1.0), 25, 0.3), ((0, RY/2-0.3, 1.5), 30, 1.5)])
