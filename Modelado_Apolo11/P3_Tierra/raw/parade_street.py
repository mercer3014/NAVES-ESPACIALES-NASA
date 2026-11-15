# parade-street.glb : calle de Nueva York (desfile de confeti, 13 ago 1969), low-poly.
# Edificios en bloque con fachada tintada, publico en siluetas en las aceras, confeti con clip 'confetti-fall'
# (bucle perfecto: el volumen de confeti es periodico en altura), coche descapotable (parade-car), farolas.
# python3 parade_atlas.py && blender -b -P parade_street.py
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Matrix, Vector
import p3c_lib as L

NAME = 'parade-street'
HERE = os.path.dirname(os.path.abspath(__file__))
random.seed(813)
sc = L.reset()
FPS = 24; NF = 8*FPS
sc.render.fps = FPS; sc.frame_start = 0; sc.frame_end = NF
img = bpy.data.images.load(os.path.join(HERE, 'parade-facade.png')); img.pack()
STREET_W, SIDEWALK, LEN = 18.0, 5.0, 140.0     # calzada, acera, largo (eje Y; el desfile avanza hacia -Y)
root = L.empty(NAME, size=2)

tints = [(0.45, 0.22, 0.15), (0.38, 0.27, 0.20), (0.76, 0.70, 0.60), (0.50, 0.50, 0.52), (0.66, 0.55, 0.40), (0.30, 0.17, 0.12)]
facade = [L.mat('facade-%d' % i, c, rough=0.85, image=img) for i, c in enumerate(tints)]
M = dict(
    asphalt=L.mat('asphalt', (0.12, 0.12, 0.12), rough=0.9),
    walk=L.mat('sidewalk', (0.52, 0.50, 0.47), rough=0.9),
    curb=L.mat('curb', (0.62, 0.60, 0.56), rough=0.8),
    line=L.mat('road-line', (0.85, 0.80, 0.55), rough=0.7),
    roof=L.mat('roof-tar', (0.20, 0.19, 0.18), rough=0.9),
    crowd1=L.mat('crowd-dark', (0.13, 0.13, 0.15), rough=0.9),
    crowd2=L.mat('crowd-mid', (0.30, 0.26, 0.22), rough=0.9),
    crowd3=L.mat('crowd-light', (0.45, 0.42, 0.38), rough=0.9),
    pole=L.mat('lamp-green', (0.12, 0.20, 0.15), rough=0.6, metal=0.3),
    car=L.mat('car-black', (0.03, 0.03, 0.035), rough=0.25, metal=0.4),
    chrome=L.mat('chrome', (0.8, 0.8, 0.82), rough=0.2, metal=0.8),
    seat=L.mat('car-seat-red', (0.45, 0.06, 0.05), rough=0.6),
    flag=L.mat('flag-white', (0.85, 0.85, 0.85), rough=0.8),
)
MATS = facade + list(M.values()); I = {k: i+len(facade) for i, k in enumerate(M)}

# --- calle ---
bm = bmesh.new()
L.box(bm, (0, 0, -0.1), (STREET_W, LEN, 0.2), I['asphalt'])
for sx in (-1, 1):
    L.box(bm, (sx*(STREET_W/2+SIDEWALK/2), 0, 0.0), (SIDEWALK, LEN, 0.3), I['walk'])
    L.box(bm, (sx*(STREET_W/2+0.1), 0, 0.0), (0.2, LEN, 0.32), I['curb'])
for k in range(14):
    L.box(bm, (0, -LEN/2 + 5 + k*10, 0.005), (0.15, 4.0, 0.01), I['line'])
L.new_obj('street', bm, MATS, parent=root)

# --- edificios con UV de fachada en metros (tile 14 m) ---
def building(bm, cx, cy, w, d, h, mi, face_sign):
    vs = L.box(bm, (cx, cy, h/2), (w, d, h), mi)
    uvl = bm.loops.layers.uv.verify()
    faces = {f for v in vs for f in v.link_faces}
    for f in faces:
        n = f.normal
        for lp in f.loops:
            p = lp.vert.co
            if abs(n.z) > 0.5:
                lp[uvl].uv = (0.02, 0.02); f.material_index = I['roof']
            elif abs(n.x) > 0.5:
                lp[uvl].uv = (p.y/14.0, p.z/14.0)
            else:
                lp[uvl].uv = (p.x/14.0, p.z/14.0)
    # cornisa superior
    L.box(bm, (cx, cy, h+0.3), (w+0.4, d+0.4, 0.6), I['curb'])
bm = bmesh.new()
for sx in (-1, 1):
    y = -LEN/2
    while y < LEN/2 - 4:
        w = random.choice((14, 18, 22, 28))
        w = min(w, LEN/2 - y)
        h = random.choice((24, 31, 38, 45, 59, 73))
        d = 22
        x = sx*(STREET_W/2 + SIDEWALK + d/2)
        building(bm, x, y + w/2, d, w-0.6, h, random.randrange(len(facade)), sx)
        # remate escalonado en algunos
        if h > 40 and random.random() < 0.6:
            building(bm, x + sx*3, y + w/2, d-8, w-6, h+10, random.randrange(len(facade)), sx)
        y += w
L.new_obj('buildings', bm, MATS, parent=root)

# --- publico: fila delantera 3D (low-poly) + masa de siluetas detras (perfil de cabezas, una cara) ---
def person(bm, x, y, h, mi, arms_up, face):
    vs = []
    vs += L.box(bm, (0, 0, h*0.42), (0.42, 0.26, h*0.84), mi)                 # cuerpo con abrigo
    vs += L.box(bm, (0, 0, h*0.92), (0.17, 0.19, h*0.16), mi)                 # cabeza
    if arms_up:
        a = L.box(bm, (0, 0, 0), (0.08, 0.08, h*0.36), mi)
        s_ = random.choice((-1, 1))
        bmesh.ops.transform(bm, verts=a, matrix=Matrix.Translation((s_*0.26, 0, h*0.98)) @ Matrix.Rotation(s_*0.3, 4, 'Y'))
        vs += a
    bmesh.ops.transform(bm, verts=vs, matrix=Matrix.Translation((x, y, 0.15)) @ Matrix.Rotation(face + random.uniform(-0.4, 0.4), 4, 'Z'))
    # quita las caras inferiores (nunca se ven)
    for f in [f for f in {f for v in vs for f in v.link_faces} if f.normal.z < -0.9]:
        bm.faces.remove(f)

def crowd_mass(bm, x, side, mi_list):
    # perfil continuo de hombros/cabezas mirando a la calle (normal hacia -side en X)
    y = -LEN/2 + 1
    while y < LEN/2 - 1:
        h = random.uniform(1.55, 1.95); w = random.uniform(0.5, 0.7)
        xo = x + random.uniform(-0.3, 0.3)*side
        top = [(y, h*0.80), (y + w*0.33, h), (y + w*0.67, h), (y + w, h*0.80)]
        mi = random.choice(mi_list)
        for (y0, z0), (y1, z1) in zip(top[:-1], top[1:]):
            vs = [bm.verts.new((xo, y0, 0.15)), bm.verts.new((xo, y1, 0.15)), bm.verts.new((xo, y1, 0.15+z1)), bm.verts.new((xo, y0, 0.15+z0))]
            if side < 0: vs.reverse()
            f = bm.faces.new(vs); f.material_index = mi
        y += w*random.uniform(0.85, 1.0)
crowd = L.empty('crowd', (0, 0, 0), parent=root, size=1)
for side in (-1, 1):
    bm = bmesh.new()
    x = side*(STREET_W/2 + 0.6)
    y = -LEN/2 + 2
    while y < LEN/2 - 2:
        person(bm, x + random.uniform(-0.15, 0.15), y, random.uniform(1.5, 1.85),
               I[random.choice(('crowd1', 'crowd1', 'crowd2', 'crowd3'))], random.random() < 0.3,
               -math.pi/2 if side > 0 else math.pi/2)
        y += random.uniform(0.9, 1.4)
    crowd_mass(bm, side*(STREET_W/2 + 1.6), side, [I['crowd1'], I['crowd2'], I['crowd1']])
    crowd_mass(bm, side*(STREET_W/2 + 2.6), side, [I['crowd1'], I['crowd3']])
    L.new_obj('crowd-%s' % ('left' if side < 0 else 'right'), bm, MATS, parent=crowd)

# --- farolas y banderas ---
bm = bmesh.new()
for sx in (-1, 1):
    for k in range(7):
        y = -LEN/2 + 10 + k*20
        x = sx*(STREET_W/2 + 0.5)
        L.cyl(bm, (x, y, 3.5), 0.08, 0.06, 7.0, segs=6, mi=I['pole'])
        L.box(bm, (x - sx*0.8, y, 6.9), (1.6, 0.1, 0.1), I['pole'])
        L.box(bm, (x - sx*1.5, y, 6.75), (0.5, 0.25, 0.2), I['chrome'])
for sx in (-1, 1):
    for k in range(5):
        y = -LEN/2 + 20 + k*25
        x = sx*(STREET_W/2 + SIDEWALK)
        L.box(bm, (x - sx*1.2, y, 9.0), (2.4, 0.05, 0.05), I['pole'])
        L.box(bm, (x - sx*1.6, y, 8.3), (0.9, 0.02, 1.3), I['flag'])
L.new_obj('street-furniture', bm, MATS, parent=root)

# --- coche descapotable del desfile (nodo parade-car), frente hacia -Y ---
car = L.empty('parade-car', (0, 10, 0), parent=root, size=1)
bm = bmesh.new()
L.box(bm, (0, 0, 0.6), (2.0, 5.6, 0.55), I['car'])
L.box(bm, (0, -1.9, 0.95), (1.9, 1.7, 0.2), I['car'])                       # capo
L.box(bm, (0, 1.9, 0.92), (1.9, 1.6, 0.15), I['car'])                       # maletero
L.box(bm, (0, -0.9, 1.15), (1.8, 0.05, 0.4), I['chrome'])                   # parabrisas
L.box(bm, (0, -0.1, 0.95), (1.7, 0.6, 0.3), I['seat'])
L.box(bm, (0, 0.9, 1.05), (1.7, 0.7, 0.45), I['seat'])
L.box(bm, (0, 1.35, 1.3), (1.7, 0.2, 0.5), I['seat'])
L.box(bm, (0, -2.82, 0.5), (2.0, 0.1, 0.2), I['chrome']); L.box(bm, (0, 2.82, 0.5), (2.0, 0.1, 0.2), I['chrome'])
for sx in (-1, 1):
    for sy in (-1, 1):
        L.cyl(bm, (sx*0.92, sy*1.75, 0.38), 0.38, 0.38, 0.25, segs=10, mi=I['car'], axis='X')
        L.cyl(bm, (sx*1.05, sy*1.75, 0.38), 0.2, 0.2, 0.02, segs=8, mi=I['chrome'], axis='X')
L.new_obj('parade-car-mesh', bm, MATS, parent=car)
L.empty('npc-spot-car-1', (-0.45, 0.9, 1.25), parent=car, size=0.3)
L.empty('npc-spot-car-2', (0.0, 1.0, 1.25), parent=car, size=0.3)
L.empty('npc-spot-car-3', (0.45, 0.9, 1.25), parent=car, size=0.3)

# --- confeti: volumen periodico [H0, H0+2P] en Z; el clip lo baja P metros en 8 s -> bucle perfecto ---
H0, P = 3.0, 12.0
conf_cols = [L.mat('confetti-white', (0.95, 0.95, 0.93), rough=0.9), L.mat('confetti-paper', (0.90, 0.86, 0.70), rough=0.9),
             L.mat('confetti-blue', (0.45, 0.6, 0.9), rough=0.9)]
bm = bmesh.new()
pieces = []
for i in range(300):
    x = random.uniform(-STREET_W/2 - 3, STREET_W/2 + 3); y = random.uniform(-LEN/2, LEN/2); z = random.uniform(0, P)
    s = random.uniform(0.07, 0.16)
    rx, ry, rz = (random.uniform(0, math.pi) for _ in range(3))
    mi = 0 if random.random() < 0.6 else (1 if random.random() < 0.7 else 2)
    pieces.append((x, y, z, s, rx, ry, rz, mi))
for (x, y, z, s, rx, ry, rz, mi) in pieces:
    for k in range(2):  # dos copias desfasadas P -> periodico
        vs = [bm.verts.new(c) for c in ((-s, -s*0.6, 0), (s, -s*0.6, 0), (s, s*0.6, 0), (-s, s*0.6, 0))]
        f = bm.faces.new(vs); f.material_index = mi
        bmesh.ops.transform(bm, verts=vs, matrix=Matrix.Translation((x, y, H0 + z + k*P)) @ Matrix.Rotation(rx, 4, 'X') @ Matrix.Rotation(ry, 4, 'Y') @ Matrix.Rotation(rz, 4, 'Z'))
conf = L.empty('confetti', (0, 0, 0), parent=root, size=1)
co = L.new_obj('confetti-mesh', bm, conf_cols, parent=conf)
for m in conf_cols:
    m.use_backface_culling = False
co.data.materials  # noqa
conf.animation_data_create()
for f, z in ((0, 0.0), (NF, -P)):
    conf.location.z = z; conf.keyframe_insert('location', frame=f)
act = conf.animation_data.action; act.name = 'confetti-fall'
for fc in act.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
tr = conf.animation_data.nla_tracks.new(); tr.name = 'confetti-fall'; tr.strips.new('confetti-fall', 0, act)
conf.animation_data.action = None
# confeti en el suelo
bm = bmesh.new()
for i in range(200):
    x = random.uniform(-STREET_W/2, STREET_W/2); y = random.uniform(-LEN/2, LEN/2); s = random.uniform(0.07, 0.15)
    vs = [bm.verts.new(c) for c in ((-s, -s*0.6, 0.012), (s, -s*0.6, 0.012), (s, s*0.6, 0.012), (-s, s*0.6, 0.012))]
    f = bm.faces.new(vs); f.material_index = 0 if random.random() < 0.7 else 1
    bmesh.ops.rotate(bm, verts=vs, cent=(0, 0, 0), matrix=Matrix.Rotation(random.uniform(0, 6.28), 3, 'Z'))
    bmesh.ops.translate(bm, verts=vs, vec=(x, y, 0))
L.new_obj('confetti-ground', bm, conf_cols, parent=root)

print('TRIS', L.tris_count())
sc.frame_set(0)
L.save_blend(NAME)
L.export(NAME, animations=True, extra=dict(export_animation_mode='NLA_TRACKS', export_force_sampling=True))
sc.frame_set(60)
L.render_preview(NAME, cam_loc=(5.5, -38, 6.5), target=(-1.0, 10, 9.0), lens=24,
                 world=(0.62, 0.70, 0.80), world_strength=1.0, sun=(52, 0, 145), sun_strength=3.5)
