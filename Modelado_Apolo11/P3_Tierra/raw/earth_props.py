# earth-props.glb : objetos de la Tierra con nodos separados, escala real, origen en la base.
# toy-saturn-v (stage-1..3 + spacecraft), mission-patch, signed-envelopes, framed-photo, notebook,
# alarm-sheet, chalkboard, rotary-phone, ashtray. Textura unica: earth-props-atlas.png (earth_props_atlas.py).
# python3 earth_props_atlas.py && blender -b -P earth_props.py
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix
import p3c_lib as L

NAME = 'earth-props'
HERE = os.path.dirname(os.path.abspath(__file__))
random.seed(7)
sc = L.reset()
img = bpy.data.images.load(os.path.join(HERE, 'earth-props-atlas.png'))
img.pack()
M = dict(
    atlas=L.mat('props-atlas', (1, 1, 1), rough=0.75, image=img),
    white=L.mat('paint-white', (0.86, 0.86, 0.84), rough=0.5),
    black=L.mat('paint-black', (0.03, 0.03, 0.03), rough=0.45),
    silver=L.mat('metal-silver', (0.75, 0.75, 0.76), rough=0.35, metal=0.6),
    gold=L.mat('thread-gold', (0.85, 0.62, 0.20), rough=0.6),
    paper=L.mat('paper', (0.88, 0.86, 0.80), rough=0.9),
    wood=L.mat('wood-dark', (0.30, 0.18, 0.09), rough=0.55),
    woodl=L.mat('wood-light', (0.55, 0.38, 0.22), rough=0.6),
    slate=L.mat('slate-green', (0.15, 0.23, 0.18), rough=0.9),
    redb=L.mat('book-red', (0.35, 0.08, 0.08), rough=0.6),
    bake=L.mat('bakelite-black', (0.02, 0.02, 0.02), rough=0.25),
    amber=L.mat('glass-amber', (0.55, 0.28, 0.05), rough=0.08),
    red=L.mat('paint-red', (0.6, 0.08, 0.05), rough=0.5),
    gray=L.mat('paint-gray', (0.4, 0.4, 0.42), rough=0.5),
    chalk=L.mat('chalk', (0.92, 0.92, 0.88), rough=0.95),
)
MATS = list(M.values()); I = {k: i for i, k in enumerate(M)}
def R(x, y, w, h):  # region del atlas (pixeles PIL, origen arriba-izq) -> uv rect
    return (x/512, 1-(y+h)/512, (x+w)/512, 1-y/512)

root = L.empty(NAME, size=0.5)
def node(name, loc):
    return L.empty(name, loc, parent=root, size=0.1)
def mesh(name, bm, parent):
    return L.new_obj(name, bm, MATS, parent=parent)

def lathe(bm, prof, segs, matfn, cap_bottom=True, cap_top=True):
    rings = []
    for z, r in prof:
        rings.append([bm.verts.new((r*math.cos(2*math.pi*i/segs), r*math.sin(2*math.pi*i/segs), z)) for i in range(segs)])
    for k in range(len(prof)-1):
        zm = (prof[k][0]+prof[k+1][0])/2
        for i in range(segs):
            a, b = rings[k][i], rings[k][(i+1) % segs]
            c, d = rings[k+1][(i+1) % segs], rings[k+1][i]
            f = bm.faces.new((a, b, c, d)); f.material_index = matfn(zm, (i+0.5)/segs)
    if cap_bottom and prof[0][1] > 1e-6:
        f = bm.faces.new(list(reversed(rings[0]))); f.material_index = matfn(prof[0][0], 0)
    if cap_top and prof[-1][1] > 1e-6:
        f = bm.faces.new(rings[-1]); f.material_index = matfn(prof[-1][0], 0)
    return [v for r in rings for v in r]

# =============== toy-saturn-v (0,4 m) ===============
S = 0.4/110.6
toy = node('toy-saturn-v', (-0.82, -0.35, 0))
def quad(u):  # patron de roll: cuadrantes alternos
    return int(u*4) % 2
def m_s1(z, u):
    zz = z/S
    if zz < 14: return I['black'] if quad(u) else I['white']
    if zz > 37: return I['black'] if not quad(u) else I['white']
    return I['white']
st1 = L.empty('stage-1', (0, 0, 0), parent=toy, size=0.03)
bm = bmesh.new()
lathe(bm, [(4*S, 5.05*S), (14*S, 5.05*S), (37*S, 5.05*S), (42*S, 5.05*S)], 16, m_s1)
for k, (x, y) in enumerate([(0, 0), (2.6, 0), (-2.6, 0), (0, 2.6), (0, -2.6)]):
    L.cyl(bm, (x*S, y*S, 2.2*S), 1.8*S, 0.8*S, 4.4*S, segs=8, mi=I['gray'])
for k in range(4):
    a = math.pi/4 + k*math.pi/2
    vs = L.box(bm, (0, 0, 0), (1, 1, 1), I['black'])
    bmesh.ops.transform(bm, verts=vs, matrix=Matrix.Rotation(a, 4, 'Z') @ Matrix.Translation((6.3*S, 0, 6.5*S)) @ Matrix.Diagonal((3.0*S, 0.5*S, 9*S, 1)))
mesh('stage-1-mesh', bm, st1)
st2 = L.empty('stage-2', (0, 0, 42*S), parent=toy, size=0.03)
bm = bmesh.new()
lathe(bm, [(0, 5.05*S), (5*S, 5.05*S), (24.9*S, 5.05*S)], 16, lambda z, u: I['gray'] if z < 5*S else I['white'])
L.cyl(bm, (0, 0, -1.2*S), 1.6*S, 0.6*S, 2.4*S, segs=8, mi=I['gray'])
mesh('stage-2-mesh', bm, st2)
st3 = L.empty('stage-3', (0, 0, 66.9*S), parent=toy, size=0.03)
bm = bmesh.new()
lathe(bm, [(0, 5.05*S), (4.1*S, 3.3*S), (10*S, 3.3*S), (17.7*S, 3.3*S), (18.6*S, 3.3*S)], 16,
      lambda z, u: I['white'] if z < 4.1*S else (I['black'] if (z < 10*S and quad(u)) else (I['gray'] if z > 17.7*S else I['white'])))
L.cyl(bm, (0, 0, -1.0*S), 1.3*S, 0.5*S, 2.0*S, segs=8, mi=I['gray'])
mesh('stage-3-mesh', bm, st3)
sp = L.empty('spacecraft', (0, 0, 85.5*S), parent=toy, size=0.03)
bm = bmesh.new()
lathe(bm, [(0, 3.3*S), (8.5*S, 1.95*S), (12.5*S, 1.95*S), (16.0*S, 0.45*S)], 16,
      lambda z, u: I['white'] if z < 8.5*S else I['silver'])
lathe(bm, [(16.0*S, 0.35*S), (20*S, 0.35*S), (23.5*S, 0.25*S), (25.1*S, 0.0)], 6, lambda z, u: I['red'] if z > 20*S else I['white'])
mesh('spacecraft-mesh', bm, sp)

# =============== mission-patch (10 cm, bordado) ===============
pn = node('mission-patch', (-0.62, -0.35, 0))
bm = bmesh.new()
uvl = bm.loops.layers.uv.verify()
segs, r, t = 32, 0.05, 0.003
bot = [bm.verts.new((r*math.cos(2*math.pi*i/segs), r*math.sin(2*math.pi*i/segs), 0)) for i in range(segs)]
top = [bm.verts.new((v.co.x, v.co.y, t)) for v in bot]
for i in range(segs):
    f = bm.faces.new((bot[i], bot[(i+1) % segs], top[(i+1) % segs], top[i])); f.material_index = I['gold']
f = bm.faces.new(list(reversed(bot))); f.material_index = I['gold']
f = bm.faces.new(top); f.material_index = I['atlas']
u0, v0, u1, v1 = R(0, 256, 256, 256)
for lp in f.loops:
    lp[uvl].uv = (u0 + (lp.vert.co.x/r*0.5+0.5)*(u1-u0), v0 + (lp.vert.co.y/r*0.5+0.5)*(v1-v0))
mesh('mission-patch-mesh', bm, pn)

# =============== signed-envelopes (pila de 4 sobres conmemorativos) ===============
en = node('signed-envelopes', (-0.40, -0.35, 0))
bm = bmesh.new(); uvl = bm.loops.layers.uv.verify()
W, D, T = 0.241, 0.105, 0.0016
for k in range(4):
    a = random.uniform(-0.25, 0.25); ox, oy = random.uniform(-0.01, 0.01), random.uniform(-0.01, 0.01)
    z = k*T
    vs = L.box(bm, (0, 0, z+T/2), (W, D, T*0.9), I['paper'])
    f = L.quad_uv(bm, [(-W/2, -D/2, z+T), (W/2, -D/2, z+T), (W/2, D/2, z+T), (-W/2, D/2, z+T)], R(384, 384, 128, 56), I['atlas'], uvl)
    vs = vs + list(f.verts)
    bmesh.ops.transform(bm, verts=vs, matrix=Matrix.Translation((ox, oy, 0)) @ Matrix.Rotation(a, 4, 'Z'))
mesh('signed-envelopes-mesh', bm, en)

# =============== framed-photo (marco de mesa 20x25 cm) ===============
fp = node('framed-photo', (-0.12, -0.35, 0))
bm = bmesh.new(); uvl = bm.loops.layers.uv.verify()
FW, FH, FD, B = 0.20, 0.25, 0.015, 0.022
vs = []
vs += L.box(bm, (0, 0, B/2), (FW, FD, B), I['woodl'])
vs += L.box(bm, (0, 0, FH-B/2), (FW, FD, B), I['woodl'])
vs += L.box(bm, (-FW/2+B/2, 0, FH/2), (B, FD, FH-2*B), I['woodl'])
vs += L.box(bm, (FW/2-B/2, 0, FH/2), (B, FD, FH-2*B), I['woodl'])
vs += L.box(bm, (0, 0.004, FH/2), (FW-2*B, 0.004, FH-2*B), I['paper'])
iw, ih = FW-2*B, FH-2*B
f = L.quad_uv(bm, [(-iw/2, -0.0005, B), (iw/2, -0.0005, B), (iw/2, -0.0005, FH-B), (-iw/2, -0.0005, FH-B)], R(384+12, 256, 104, 128), I['atlas'], uvl)
vs += list(f.verts)
bmesh.ops.transform(bm, verts=vs, matrix=Matrix.Translation((0, 0, 0.003)) @ Matrix.Rotation(math.radians(-10), 4, 'X'))
vs2 = L.box(bm, (0, 0, 0), (0.04, 0.006, 0.165), I['woodl'])   # pata trasera
bmesh.ops.transform(bm, verts=vs2, matrix=Matrix.Translation((0, 0.072, 0.077)) @ Matrix.Rotation(math.radians(22), 4, 'X'))
mesh('framed-photo-mesh', bm, fp)

# =============== notebook (libreta de direcciones) ===============
nb = node('notebook', (0.12, -0.35, 0))
bm = bmesh.new(); uvl = bm.loops.layers.uv.verify()
NW, ND, NT = 0.15, 0.106, 0.018
L.box(bm, (0.003, 0, NT/2), (NW-0.006, ND-0.006, NT-0.004), I['paper'])
L.box(bm, (0, 0, 0.001), (NW, ND, 0.002), I['redb'])
L.box(bm, (0, 0, NT-0.001), (NW, ND, 0.002), I['redb'])
L.box(bm, (-NW/2+0.002, 0, NT/2), (0.004, ND, NT), I['redb'])
L.quad_uv(bm, [(-NW/2, -ND/2, NT+0.0003), (NW/2, -ND/2, NT+0.0003), (NW/2, ND/2, NT+0.0003), (-NW/2, ND/2, NT+0.0003)], R(256, 421, 128, 91), I['atlas'], uvl)
mesh('notebook-mesh', bm, nb)

# =============== alarm-sheet (hoja de Garman, carta 21,6 x 27,9 cm) ===============
al = node('alarm-sheet', (0.34, -0.35, 0))
bm = bmesh.new(); uvl = bm.loops.layers.uv.verify()
AW, AH = 0.216, 0.279
# hoja con leve curvatura: 3 tiras
for k in range(3):
    y0, y1 = -AH/2 + k*AH/3, -AH/2 + (k+1)*AH/3
    z0 = [0.0, 0.003, 0.0, 0.006][k]; z1 = [0.003, 0.0, 0.006, 0.0][k]
    vr = 165/3
    L.quad_uv(bm, [(-AW/2, y0, z0+0.0005), (AW/2, y0, z0+0.0005), (AW/2, y1, z1+0.0005), (-AW/2, y1, z1+0.0005)],
              R(256, 256 + (2-k)*vr, 128, vr), I['atlas'], uvl)
    f = bm.faces.new([bm.verts.new(c) for c in [(-AW/2, y1, z1+0.0002), (AW/2, y1, z1+0.0002), (AW/2, y0, z0+0.0002), (-AW/2, y0, z0+0.0002)]])
    f.material_index = I['paper']
mesh('alarm-sheet-mesh', bm, al)

# =============== chalkboard (pizarra rodante 1,8 x 0,9 m, "TOUGH AND COMPETENT") ===============
cb = node('chalkboard', (0, 0.6, 0))
bm = bmesh.new(); uvl = bm.loops.layers.uv.verify()
BW, BH, Z0 = 1.8, 0.9, 0.85
L.box(bm, (0, 0, Z0+BH/2), (BW, 0.03, BH), I['slate'])
L.quad_uv(bm, [(-BW/2, -0.0155, Z0), (BW/2, -0.0155, Z0), (BW/2, -0.0155, Z0+BH), (-BW/2, -0.0155, Z0+BH)], R(0, 0, 512, 256), I['atlas'], uvl)
fr = 0.05
L.box(bm, (0, 0, Z0-fr/2), (BW+2*fr, 0.05, fr), I['wood'])
L.box(bm, (0, 0, Z0+BH+fr/2), (BW+2*fr, 0.05, fr), I['wood'])
for sx in (-1, 1):
    L.box(bm, (sx*(BW/2+fr/2), 0, Z0+BH/2), (fr, 0.05, BH), I['wood'])
    # patas del soporte rodante
    L.box(bm, (sx*(BW/2+fr+0.02), 0, (Z0+BH+0.1)/2), (0.04, 0.04, Z0+BH+0.1), I['silver'])
    L.box(bm, (sx*(BW/2+fr+0.02), 0, 0.08), (0.05, 0.6, 0.04), I['silver'])
    for sy in (-1, 1):
        L.cyl(bm, (sx*(BW/2+fr+0.02), sy*0.27, 0.03), 0.03, 0.03, 0.025, segs=8, mi=I['black'], axis='X')
L.box(bm, (0, -0.06, Z0-fr+0.01), (BW, 0.08, 0.02), I['wood'])         # bandeja de tiza
L.box(bm, (-0.4, -0.06, Z0-fr+0.03), (0.07, 0.01, 0.01), I['chalk'])
L.box(bm, (0.5, -0.06, Z0-fr+0.035), (0.13, 0.05, 0.03), I['woodl'])   # borrador
mesh('chalkboard-mesh', bm, cb)

# =============== rotary-phone (telefono de mesa de disco, anos 60) ===============
rp = node('rotary-phone', (0.58, -0.35, 0))
bm = bmesh.new()
def frustum(bm, z0, z1, w0, d0, w1, d1, mi, yoff1=0.0):
    vb = [bm.verts.new((x*w0/2, y*d0/2, z0)) for x, y in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    vt = [bm.verts.new((x*w1/2, y*d1/2+yoff1, z1)) for x, y in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    fs = [bm.faces.new(list(reversed(vb))), bm.faces.new(vt)]
    for i in range(4):
        fs.append(bm.faces.new((vb[i], vb[(i+1) % 4], vt[(i+1) % 4], vt[i])))
    for f in fs: f.material_index = mi
    return vb + vt
frustum(bm, 0.0, 0.012, 0.22, 0.23, 0.22, 0.23, I['bake'])
frustum(bm, 0.012, 0.095, 0.22, 0.23, 0.16, 0.13, I['bake'], yoff1=0.02)
# disco en la cara frontal inclinada
dial_c = Vector((0, -0.088, 0.058)); tilt = math.radians(52)
vs = L.cyl(bm, (0, 0, 0), 0.047, 0.047, 0.006, segs=16, mi=I['white'])
vs2 = L.cyl(bm, (0, 0, 0.004), 0.02, 0.02, 0.004, segs=10, mi=I['paper'])
holes = []
for k in range(10):
    a = math.radians(60 + k*28)
    holes += L.cyl(bm, (0.034*math.cos(a), 0.034*math.sin(a), 0.0035), 0.0065, 0.0065, 0.002, segs=6, mi=I['bake'])
bmesh.ops.transform(bm, verts=vs+vs2+holes, matrix=Matrix.Translation(dial_c) @ Matrix.Rotation(tilt, 4, 'X'))
# horquilla y auricular
for sx in (-1, 1):
    L.box(bm, (sx*0.06, 0.03, 0.105), (0.03, 0.05, 0.03), I['bake'])
hz = 0.125
L.box(bm, (0, 0.03, hz), (0.15, 0.035, 0.025), I['bake'])
for sx in (-1, 1):
    L.cyl(bm, (sx*0.095, 0.03, hz-0.005), 0.026, 0.022, 0.035, segs=10, mi=I['bake'])
# cordon
for k in range(5):
    L.cyl(bm, (-0.115 - k*0.012, 0.06 + k*0.004, 0.02 + 0.016*math.sin(k)), 0.008, 0.008, 0.012, segs=6, mi=I['bake'], axis='X')
mesh('rotary-phone-mesh', bm, rp)

# =============== ashtray (cenicero de vidrio ambar, 12 cm) ===============
at = node('ashtray', (0.80, -0.35, 0))
bm = bmesh.new()
lathe(bm, [(0.0, 0.0), (0.0, 0.055), (0.004, 0.06), (0.028, 0.06), (0.03, 0.056), (0.03, 0.046), (0.012, 0.038), (0.010, 0.0)], 16,
      lambda z, u: I['amber'], cap_bottom=False, cap_top=False)
for k in range(3):
    a = k*2*math.pi/3
    L.box(bm, (0.052*math.cos(a), 0.052*math.sin(a), 0.029), (0.022, 0.012, 0.006), I['black'], rot_z=a)
L.cyl(bm, (0.01, -0.012, 0.013), 0.0045, 0.0045, 0.05, segs=6, mi=I['paper'], axis='X')   # colilla
mesh('ashtray-mesh', bm, at)

# ---------- informe de tris por prop ----------
bpy.context.view_layer.update()
for nm in ['toy-saturn-v', 'mission-patch', 'signed-envelopes', 'framed-photo', 'notebook', 'alarm-sheet', 'chalkboard', 'rotary-phone', 'ashtray']:
    ob = bpy.data.objects[nm]
    kids = [c for c in ob.children_recursive if c.type == 'MESH']
    pts = [c.matrix_world @ Vector(b) for c in kids for b in c.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    d = mx - mn
    print('PROP %-17s tris=%4d  size=%.3f x %.3f x %.3f m' % (nm, L.tris_count(kids), d.x, d.y, d.z))
print('TRIS', L.tris_count())
L.save_blend(NAME)
L.export(NAME)

# ---------- preview: props sobre una mesa (mesa y fondo solo para el render) ----------
bm = bmesh.new(); L.box(bm, (0, -0.35, 0.36), (2.3, 0.6, 0.04), 0)
L.new_obj('preview-table', bm, [M['woodl']])
bm = bmesh.new(); L.box(bm, (0, 0, -0.01), (6, 6, 0.02), 0)
L.new_obj('preview-floor', bm, [L.mat('preview-floor', (0.35, 0.33, 0.3), rough=0.8)])
for nm in ['toy-saturn-v', 'mission-patch', 'signed-envelopes', 'framed-photo', 'notebook', 'alarm-sheet', 'rotary-phone', 'ashtray']:
    bpy.data.objects[nm].location.z = 0.38
L.render_preview(NAME, cam_loc=(0.0, -1.75, 1.15), target=(0.0, -0.15, 0.7), lens=27,
                 world=(0.55, 0.55, 0.55), world_strength=0.6, sun=(50, 0, 25), sun_strength=3.0,
                 extra_lights=[((0.8, -1.4, 1.6), 60, 1.2)])
