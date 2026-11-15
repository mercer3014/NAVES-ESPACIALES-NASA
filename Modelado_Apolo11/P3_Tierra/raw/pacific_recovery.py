# pacific-recovery.glb : oceano 200x200 m low-poly con clip 'waves' (shape keys),
# balsa de rescate 1969 (life-raft), tres boyas (buoy-1..3) y empty cm-spot.
# blender -b -P pacific_recovery.py
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix, Euler
import p3c_lib as L

NAME = 'pacific-recovery'
random.seed(1969)
sc = L.reset()
FPS = 24; T = 6.0; NF = int(FPS*T)   # 144 frames, loop perfecto
sc.render.fps = FPS; sc.frame_start = 0; sc.frame_end = NF
W = 2*math.pi/T
# (longitud de onda m, amplitud m, direccion grados, fase)
WAVES = [(42.0, 0.70, 10, 0.0), (26.0, 0.40, 65, 1.3), (63.0, 0.55, -35, 2.1), (15.0, 0.22, 120, 0.4), (11.0, 0.12, -80, 2.7)]
def SC(x, y):
    s = c = 0.0
    for lam, a, d, ph in WAVES:
        k = 2*math.pi/lam; dr = math.radians(d)
        arg = k*(x*math.cos(dr) + y*math.sin(dr)) + ph
        s += a*math.sin(arg); c += a*math.cos(arg)
    return s, c
def height(x, y, t):
    s, c = SC(x, y)
    return s*math.cos(W*t) - c*math.sin(W*t)

root = L.empty(NAME, size=1)

# ---------- oceano ----------
N = 40; SIZE = 200.0
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=N, y_segments=N, size=SIZE/2)
step = SIZE/N
for v in bm.verts:
    if abs(abs(v.co.x)-SIZE/2) > 1e-3: v.co.x += random.uniform(-0.3, 0.3)*step
    if abs(abs(v.co.y)-SIZE/2) > 1e-3: v.co.y += random.uniform(-0.3, 0.3)*step
# triangula en diagonal alterna para look low-poly
bmesh.ops.triangulate(bm, faces=bm.faces[:], quad_method='ALTERNATE')
sea = L.mat('sea-pacific', (0.105, 0.17, 0.215), rough=0.28, metal=0.0)
ocean = L.new_obj('ocean', bm, [sea], parent=root)
ocean.data.polygons.foreach_set('use_smooth', [False]*len(ocean.data.polygons))
basis = ocean.shape_key_add(name='Basis')
names = [('wave-s-pos', 1, 0), ('wave-s-neg', -1, 0), ('wave-c-pos', 0, 1), ('wave-c-neg', 0, -1)]
keys = []
for nm, fs, fc in names:
    k = ocean.shape_key_add(name=nm, from_mix=False)
    k.slider_min = 0; k.slider_max = 1
    for i, v in enumerate(ocean.data.vertices):
        s, c = SC(v.co.x, v.co.y)
        k.data[i].co = (v.co.x, v.co.y, fs*s + fc*c)
    keys.append(k)
# h = S cos(wt) - C sin(wt)
def weights(t):
    cs, sn = math.cos(W*t), math.sin(W*t)
    return [max(cs, 0), max(-cs, 0), max(-sn, 0), max(sn, 0)]
skd = ocean.data.shape_keys
skd.animation_data_create()
for f in range(0, NF+1):
    w = weights(f/FPS)
    for k, wv in zip(keys, w):
        k.value = wv; k.keyframe_insert('value', frame=f)
act = skd.animation_data.action; act.name = 'waves-ocean'
for fc in act.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
tr = skd.animation_data.nla_tracks.new(); tr.name = 'waves'
tr.strips.new('waves', 0, act); skd.animation_data.action = None

# ---------- balsa de rescate (Apollo recovery raft, 1969) ----------
orange = L.mat('raft-orange', (0.78, 0.25, 0.05), rough=0.55)
gray = L.mat('raft-gray', (0.36, 0.37, 0.36), rough=0.8)
rope = L.mat('raft-rope', (0.75, 0.72, 0.6), rough=0.9)
RAFT_POS = (5.2, -1.6)
raft = L.empty('life-raft', (RAFT_POS[0], RAFT_POS[1], 0), parent=root, size=1.5)
bm = bmesh.new()
L.torus(bm, (0, 0, 0.18), 1.15, 0.24, segs=20, tsegs=8, mi=0, scale=(1.0, 0.68, 1.0))
L.torus(bm, (0, 0, 0.52), 1.15, 0.20, segs=20, tsegs=6, mi=0, scale=(1.0, 0.68, 1.0))
# piso gris (disco ovalado)
fl = L.cyl(bm, (0, 0, 0.06), 1.12, 1.12, 0.06, segs=20, mi=1)
bmesh.ops.scale(bm, vec=(1.0, 0.68, 1.0), verts=fl)
# parches/asas grises y cuerda perimetral
for i in range(8):
    a = 2*math.pi*(i+0.5)/8
    x, y = 1.36*math.cos(a), 1.36*0.70*math.sin(a)
    L.box(bm, (x, y, 0.36), (0.12, 0.12, 0.10), mi=1, rot_z=a)
L.torus(bm, (0, 0, 0.36), 1.38, 0.018, segs=24, tsegs=3, mi=2, scale=(1.0, 0.70, 1.0))
# remo apoyado
L.box(bm, (0.2, 0.1, 0.12), (1.5, 0.05, 0.03), mi=1, rot_z=0.4)
L.box(bm, (0.9, 0.38, 0.12), (0.3, 0.14, 0.02), mi=1, rot_z=0.4)
L.new_obj('life-raft-mesh', bm, [orange, gray, rope], parent=raft, smooth=True)

# ---------- 3 boyas de flotacion alrededor del punto del CM ----------
white = L.mat('buoy-white', (0.85, 0.85, 0.82), rough=0.5)
buoys = []
for i in range(3):
    a = math.radians(90 + i*120)
    p = (2.7*math.cos(a), 2.7*math.sin(a))
    b = L.empty('buoy-%d' % (i+1), (p[0], p[1], 0), parent=root, size=0.6)
    bm = bmesh.new()
    L.sphere(bm, (0, 0, 0.32), 0.55, segs=12, rings=8, mi=0, scale=(1, 1, 0.9))
    L.torus(bm, (0, 0, 0.32), 0.55, 0.05, segs=12, tsegs=4, mi=1)
    L.cyl(bm, (0, 0, 0.86), 0.06, 0.04, 0.14, segs=6, mi=1)
    L.new_obj('buoy-%d-mesh' % (i+1), bm, [white, orange], parent=b, smooth=True)
    buoys.append(b)

cm = L.empty('cm-spot', (0, 0, 0), parent=root, size=2.0)

# ---------- balanceo de balsa y boyas en el mismo clip 'waves' ----------
def bob(ob, amp_rot=1.0):
    x0, y0 = ob.location.x, ob.location.y
    ob.animation_data_create()
    for f in range(0, NF+1, 3):
        t = f/FPS
        h = height(x0, y0, t); e = 1.0
        dx = (height(x0+e, y0, t) - height(x0-e, y0, t))/(2*e)
        dy = (height(x0, y0+e, t) - height(x0, y0-e, t))/(2*e)
        ob.location.z = h
        ob.rotation_euler = (math.atan(dy)*amp_rot, -math.atan(dx)*amp_rot, ob.rotation_euler.z)
        ob.keyframe_insert('location', frame=f); ob.keyframe_insert('rotation_euler', frame=f)
    a = ob.animation_data.action; a.name = 'waves-' + ob.name
    t = ob.animation_data.nla_tracks.new(); t.name = 'waves'
    t.strips.new('waves', 0, a); ob.animation_data.action = None
raft.rotation_euler.z = math.radians(25)
bob(raft, 0.8)
for b in buoys: bob(b, 1.0)

print('TRIS', L.tris_count())
sc.frame_set(0)
L.save_blend(NAME)
L.export(NAME, animations=True, extra=dict(export_animation_mode='NLA_TRACKS', export_force_sampling=True,
         export_def_bones=False, export_optimize_animation_size=True))
sc.frame_set(40)
# marcador del CM solo para el preview (no se exporta)
bm = bmesh.new()
L.cyl(bm, (0, 0, 1.0), 1.95, 0.4, 2.6, segs=24, mi=0)
ph = L.new_obj('preview-cm', bm, [L.mat('preview-cm', (0.55, 0.5, 0.42), rough=0.4, metal=0.6)], smooth=True)
L.render_preview(NAME, cam_loc=(12, -10, 3.2), target=(2.0, 0.5, 0.2), lens=30,
                 world=(0.42, 0.48, 0.55), world_strength=0.7, sun=(68, 0, 120), sun_strength=4.0)
