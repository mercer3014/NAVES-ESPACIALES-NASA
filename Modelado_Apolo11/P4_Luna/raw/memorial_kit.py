# memorial-kit.glb (Persona 4, P4-2a): objetos conmemorativos que el Apolo 11 dejo en la Luna (bolsa de recuerdos).
# Nodos: apollo1-patch (parche de tela ~10 cm, textura propia 512 px), medal-gagarin, medal-komarov (medallas sovieticas
# conmemorativas, ~3,5 cm), silicon-disc (disco de silicio con mensajes de buena voluntad, 3,8 cm), olive-branch (ramita de
# olivo dorada, ~0,1 m). Escala real; origen de cada nodo en su base (apoyado en el suelo). Referencias: ALSJ "Apollo 11
# Mementos" / NASA "Apollo 11 Goodwill Messages" (disco de 1,5 pulgadas = 3,8 cm), foto NASA del parche y la ramita.
import bpy, bmesh, math, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mathutils import Vector, Matrix
import p4lib as L

L.reset()
HERE = os.path.dirname(os.path.abspath(__file__))
img = bpy.data.images.load(os.path.join(HERE, 'apollo1-patch.png'))
PATCH = L.mat('apollo1-patch', (1, 1, 1), rough=0.9, image=img)
CLOTH = L.mat('tela-azul', (0.03, 0.06, 0.25), rough=0.95)
GOLD = L.mat('oro', (1.0, 0.77, 0.34), rough=0.25, metal=1.0)
BRONZE = L.mat('bronce', (0.80, 0.55, 0.36), rough=0.32, metal=1.0)
SILICON = L.mat('silicio', (0.10, 0.11, 0.14), rough=0.15, metal=0.7)
ALU = L.mat('aluminio', (0.78, 0.79, 0.80), rough=0.35, metal=1.0)

root = L.empty('memorial-kit', size=0.05)

def disc(bm, r, h, segs, z0=0.0, mi_top=0, mi_side=0, mi_bot=0, uv=False):
    bot = [bm.verts.new((r * math.cos(2 * math.pi * i / segs), r * math.sin(2 * math.pi * i / segs), z0)) for i in range(segs)]
    top = [bm.verts.new((v.co.x, v.co.y, z0 + h)) for v in bot]
    for i in range(segs):
        f = bm.faces.new((bot[i], bot[(i + 1) % segs], top[(i + 1) % segs], top[i])); f.material_index = mi_side
    fb = bm.faces.new(list(reversed(bot))); fb.material_index = mi_bot
    ft = bm.faces.new(top); ft.material_index = mi_top
    if uv:
        lay = bm.loops.layers.uv.verify()
        for lp in ft.loops:
            lp[lay].uv = (0.5 + lp.vert.co.x / (2 * r), 0.5 + lp.vert.co.y / (2 * r))
    return top, bot

def ring(bm, r0, r1, z0, h, segs, mi):
    """Aro elevado (borde de medalla)."""
    L_ = []
    for (rr, zz) in [(r0, z0), (r1, z0), (r1, z0 + h), (r0, z0 + h)]:
        L_.append([bm.verts.new((rr * math.cos(2 * math.pi * i / segs), rr * math.sin(2 * math.pi * i / segs), zz)) for i in range(segs)])
    for k in range(4):
        a, b = L_[k], L_[(k + 1) % 4]
        for i in range(segs):
            f = bm.faces.new((a[i], a[(i + 1) % segs], b[(i + 1) % segs], b[i])); f.material_index = mi

def star(bm, R, r, z0, h, mi, cx=0.0, cy=0.0, rot=90):
    pts = []
    for k in range(10):
        rr = R if k % 2 == 0 else r; a = math.radians(rot + 36 * k)
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    b = [bm.verts.new((x, y, z0)) for x, y in pts]; t = [bm.verts.new((x, y, z0 + h)) for x, y in pts]
    for i in range(10):
        f = bm.faces.new((b[i], b[(i + 1) % 10], t[(i + 1) % 10], t[i])); f.material_index = mi
    c = bm.verts.new((cx, cy, z0 + h * 1.6))
    for i in range(10):
        f = bm.faces.new((t[i], t[(i + 1) % 10], c)); f.material_index = mi

# ---------------- apollo1-patch: parche bordado de 10 cm, 3 mm
bm = bmesh.new(); disc(bm, 0.05, 0.003, 32, mi_top=0, mi_side=1, mi_bot=1, uv=True)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
p_e, p_o = L.pivot_mesh('apollo1-patch', bm, [PATCH, CLOTH], parent=root, loc=(0, 0, 0))

# ---------------- medallas (35 mm, 3 mm) con aro elevado, relieve y anilla
def medal(name, x, M, relief):
    bm = bmesh.new()
    disc(bm, 0.0175, 0.0024, 28)
    ring(bm, 0.0158, 0.0175, 0.0024, 0.0008, 28, 0)
    relief(bm)
    # anilla de suspension (en el borde +Y)
    L.torus(bm, (0, 0.0195, 0.0012), 0.0026, 0.0008, segs=10, tsegs=5, mi=0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return L.pivot_mesh(name, bm, [M], parent=root, loc=(x, 0, 0))
medal('medal-gagarin', 0.10, GOLD, lambda bm: star(bm, 0.0105, 0.0042, 0.0024, 0.0006, 0))
def komarov_relief(bm):  # orbita eliptica + estrella pequena
    ring(bm, 0.0095, 0.0108, 0.0024, 0.0006, 24, 0)
    star(bm, 0.0045, 0.0018, 0.0024, 0.0008, 0, cx=0.0, cy=0.0)
medal('medal-komarov', 0.15, BRONZE, komarov_relief)
# la orbita de Komarov como elipse: escalar el aro interior en X (vertices con 0.0094<r<0.0109)
ko = bpy.data.objects['medal-komarov-geo']
for v in ko.data.vertices:
    r = math.hypot(v.co.x, v.co.y)
    if 0.0094 < r < 0.0109 and v.co.z >= 0.0024 - 1e-6:
        v.co.x *= 1.0; v.co.y *= 0.55

# ---------------- silicon-disc (3,8 cm, 1,5 mm) sobre su base de aluminio
bm = bmesh.new(); disc(bm, 0.019, 0.0015, 36, mi_top=0, mi_side=0, mi_bot=1)
ring(bm, 0.019, 0.0205, 0.0, 0.0022, 36, 1)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
L.pivot_mesh('silicon-disc', bm, [SILICON, ALU], parent=root, loc=(0.21, 0, 0))

# ---------------- olive-branch (rama de olivo dorada ~0,10 m, tumbada en el suelo, origen en la base del tallo)
bm = bmesh.new()
N = 8; length = 0.098
path = [Vector((0.0 + length * i / N, 0.006 * math.sin(math.pi * i / N), 0.0016)) for i in range(N + 1)]
sides = 6; rads = [0.0014 - 0.0008 * i / N for i in range(N + 1)]
rings_ = []
for i, p in enumerate(path):
    t = (path[min(i + 1, N)] - path[max(i - 1, 0)]).normalized()
    n1 = Vector((0, 0, 1)); n2 = t.cross(n1)
    rings_.append([bm.verts.new(p + rads[i] * (math.cos(2 * math.pi * k / sides) * n1 + math.sin(2 * math.pi * k / sides) * n2)) for k in range(sides)])
for i in range(N):
    for k in range(sides):
        bm.faces.new((rings_[i][k], rings_[i][(k + 1) % sides], rings_[i + 1][(k + 1) % sides], rings_[i + 1][k]))
bm.faces.new(list(reversed(rings_[0]))); bm.faces.new(rings_[-1])
def leaf(base, ang, Ll, W, th=0.0007):
    d = Vector((math.cos(ang), math.sin(ang), 0)); s = Vector((-d.y, d.x, 0)); up = Vector((0, 0, 1))
    tip = base + d * Ll
    m1, m2 = base + d * Ll * 0.35, base + d * Ll * 0.7
    vs = [bm.verts.new(base + up * 0.0016), bm.verts.new(m1 + s * W + up * 0.0012), bm.verts.new(m2 + s * W * 0.75 + up * 0.0012),
          bm.verts.new(tip + up * 0.0012), bm.verts.new(m2 - s * W * 0.75 + up * 0.0012), bm.verts.new(m1 - s * W + up * 0.0012),
          bm.verts.new(m1 + up * (0.0012 + th)), bm.verts.new(m2 + up * (0.0012 + th)),           # nervio (arriba)
          bm.verts.new(m1 + up * (0.0012 - th)), bm.verts.new(m2 + up * (0.0012 - th))]           # abajo
    T = [(0, 1, 6), (1, 2, 7, 6), (2, 3, 7), (3, 4, 7), (4, 5, 6, 7), (5, 0, 6),
         (0, 8, 1), (1, 8, 9, 2), (2, 9, 3), (3, 9, 4), (4, 9, 8, 5), (5, 8, 0)]
    for q in T:
        bm.faces.new([vs[i] for i in q])
for i in range(1, N):
    p = path[i]; side = 1 if i % 2 else -1
    a = math.radians(55) * side
    leaf(p, a, 0.024 - 0.0012 * i, 0.0045)
    leaf(p + Vector((0.004, 0, 0)), -a * 0.9, 0.022 - 0.0012 * i, 0.0042)
leaf(path[-1], 0.0, 0.016, 0.0036)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
L.pivot_mesh('olive-branch', bm, [GOLD], parent=root, loc=(0.26, -0.01, 0))

for ob in bpy.context.scene.objects:
    if ob.type == 'MESH':
        bpy.context.view_layer.objects.active = ob; ob.select_set(True)
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40)); ob.select_set(False)
        if ob.name.startswith('medal-'):  # relieve (estrella/orbita) en sombreado plano para que se lea nitido
            me = ob.data
            for p in me.polygons:
                if all(me.vertices[i].co.z > 0.00245 for i in p.vertices) and math.hypot(*p.center[:2]) < 0.0155: p.use_smooth = False
        print('TRIS', ob.name, L.tris_count([ob]))
print('TRIS total', L.tris_count())
L.save_blend('memorial-kit')
L.export('memorial-kit')
L.lunar_preview('memorial-kit', cam_loc=(0.155, -0.50, 0.42), target=(0.155, 0.0, 0.0), lens=50, ground_size=1.5,
                fill=[((0.18, -0.2, 0.4), 6.0, 0.6)])
L.lunar_preview('memorial-kit-medallas', cam_loc=(0.125, -0.085, 0.085), target=(0.125, 0.0, 0.0), lens=50, ground_size=1.5,
                fill=[((0.12, -0.1, 0.3), 4.0, 0.4)])
print('DONE')
L.lunar_preview('memorial-kit-rama-disco', cam_loc=(0.27, -0.12, 0.13), target=(0.27, -0.005, 0.0), lens=50, ground_size=1.5,
                fill=[((0.27, -0.1, 0.3), 4.0, 0.4)])
