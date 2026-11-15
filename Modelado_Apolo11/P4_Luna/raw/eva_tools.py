# eva-tools.glb (Persona 4, P4-1b): herramientas de la EVA del Apolo 11 que faltan en easep-props.glb.
# Nodos (pivote = punto de agarre, malla en '<nodo>-geo'): geo-hammer, core-tube-1, core-tube-2, hasselblad, lec-pulley.
# Referencias (fotos publicas NASA): martillo geologico (AS11-40-5873 / S69-31877), tubos de nucleo con su broca y tapa
# (AS11-40-5964 / S69-38749), Hasselblad 500EL Data Camera plateada con Biogon 60 mm y cargador 70 mm (S69-38846),
# LEC: cinta plana con gancho y polea fijada junto a la escotilla (AS11-40-5868, ALSJ "LEC").
# blender -b -P eva_tools.py   (Z arriba en Blender; frente -Y => +Z glTF; metros)
import bpy, bmesh, math, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mathutils import Vector, Matrix
import p4lib as L

L.reset()
ALU = L.mat('aluminio', (0.78, 0.79, 0.80), rough=0.32, metal=1.0)
STEEL = L.mat('acero', (0.42, 0.43, 0.45), rough=0.38, metal=1.0)
GRIP = L.mat('grip-negro', (0.035, 0.035, 0.04), rough=0.7)
SILVER = L.mat('hasselblad-plata', (0.80, 0.80, 0.78), rough=0.28, metal=0.85)
BLACK = L.mat('negro-mate', (0.02, 0.02, 0.022), rough=0.55)
GLASS = L.mat('lente', (0.02, 0.03, 0.05), rough=0.05, metal=0.3)
STRAP = L.mat('cinta-beta', (0.86, 0.85, 0.80), rough=0.85)
BLUE = L.mat('anodizado-azul', (0.08, 0.20, 0.55), rough=0.35, metal=0.8)
RED = L.mat('anodizado-rojo', (0.55, 0.07, 0.06), rough=0.35, metal=0.8)

root = L.empty('eva-tools', size=0.1)
SP = 0.32  # separacion para la vista previa (el juego reubica cada pivote en la mano)

def ring_profile(bm, prof, segs, mi_list, axis_down=False):
    """Superficie de revolucion alrededor de Z. prof = [(z, r), ...] de abajo arriba; tapas en extremos con r>0."""
    rings = []
    for (z, r) in prof:
        rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / segs), r * math.sin(2 * math.pi * i / segs), z)) for i in range(segs)])
    for k in range(len(rings) - 1):
        a, b = rings[k], rings[k + 1]
        for i in range(segs):
            f = bm.faces.new((a[i], a[(i + 1) % segs], b[(i + 1) % segs], b[i])); f.material_index = mi_list[k]
    f = bm.faces.new(list(reversed(rings[0]))); f.material_index = mi_list[0]
    f = bm.faces.new(rings[-1]); f.material_index = mi_list[-1]
    return rings

# ---------------- geo-hammer (~0,40 m). Agarre a 0,10 m del extremo del mango; mango a lo largo de Z.
bm = bmesh.new()
ring_profile(bm, [(-0.105, 0.012), (-0.10, 0.0165), (0.045, 0.0165), (0.05, 0.012), (0.27, 0.0105), (0.278, 0.0105)], 12,
             [1, 1, 1, 0, 0, 0])
# cabeza de acero: cara de golpe cilindrica (+X) y pico/cincel (-X), centro en z=0.285
hz = 0.287
c = L.cyl(bm, (0.035, 0, hz), 0.016, 0.016, 0.07, segs=12, mi=2, axis='X')
L.cyl(bm, (0.072, 0, hz), 0.0175, 0.0175, 0.006, segs=12, mi=2, axis='X')  # cara de golpe biselada
# cuerpo central (ojo del mango)
L.box(bm, (0.0, 0, hz), (0.03, 0.026, 0.034), mi=2)
# pico: prisma que se estrecha a un filo
pv = [(-0.015, -0.012, hz - 0.015), (-0.015, 0.012, hz - 0.015), (-0.015, 0.012, hz + 0.015), (-0.015, -0.012, hz + 0.015),
      (-0.11, -0.0025, hz - 0.004), (-0.11, 0.0025, hz - 0.004), (-0.11, 0.0025, hz + 0.003), (-0.11, -0.0025, hz + 0.003)]
v = [bm.verts.new(p) for p in pv]
for q in [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]:
    f = bm.faces.new([v[i] for i in q]); f.material_index = 2
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
hammer, hg = L.pivot_mesh('geo-hammer', bm, [ALU, GRIP, STEEL], parent=root, loc=(0, 0, 0.105))

# ---------------- core-tube-1/2 (tubo de muestreo de nucleo, 0,35 m + broca; agarre = cabeza roscada superior)
def core_tube(name, x, cap_mat):
    bm = bmesh.new()
    prof = [(-0.375, 0.0118), (-0.36, 0.0142), (-0.345, 0.0142), (-0.34, 0.0128),  # broca
            (-0.02, 0.0128), (-0.015, 0.0150), (0.0, 0.0150),                     # cuerpo + collar
            (0.0, 0.0115), (0.035, 0.0115), (0.04, 0.009)]                        # cabeza roscada / tapa
    mats = [1, 1, 1, 0, 0, 0, 2, 2, 2, 2]
    ring_profile(bm, prof, 14, mats)
    # pasador de la tapa (para el mango extensor)
    L.cyl(bm, (0, 0, 0.022), 0.003, 0.003, 0.032, segs=6, mi=1, axis='X')
    return L.pivot_mesh(name, bm, [ALU, STEEL, cap_mat], parent=root, loc=(x, 0, 0.375))
ct1 = core_tube('core-tube-1', SP, BLUE)
ct2 = core_tube('core-tube-2', SP + 0.06, RED)

# ---------------- hasselblad (Hasselblad 500EL Data Camera, ~0,21 m de lente a respaldo; agarre = empunadura con gatillo)
bm = bmesh.new()
def bbox(center, size, mi, bev=0.0):
    vs = L.box(bm, center, size, mi=mi)
    if bev > 0:
        es = list({e for vv in vs for e in vv.link_edges})
        r = bmesh.ops.bevel(bm, geom=es, offset=bev, segments=1, affect='EDGES', profile=0.5)
        for f in r['faces']: f.material_index = mi
# cuerpo (centro de la camara en (0,0,0.075) relativo al agarre); frente = -Y
bbox((0, 0, 0.075), (0.090, 0.088, 0.088), 0, bev=0.006)             # cuerpo
bbox((0, 0.004, 0.017), (0.090, 0.080, 0.030), 0, bev=0.004)        # motor EL (debajo)
bbox((0, 0.074, 0.073), (0.092, 0.060, 0.092), 0, bev=0.005)        # cargador 70 mm (detras, +Y)
bbox((0, 0.1055, 0.073), (0.070, 0.004, 0.060), 1)                  # tapa trasera del cargador
bbox((0.050, 0.074, 0.105), (0.010, 0.030, 0.012), 1)               # perilla de avance
# lente Biogon 60 mm con anillos (eje Y, hacia -Y)
for (y0, y1, r, mi) in [(-0.044, -0.060, 0.040, 0), (-0.060, -0.086, 0.034, 1), (-0.086, -0.100, 0.037, 0), (-0.100, -0.104, 0.031, 1)]:
    L.cyl(bm, (0, (y0 + y1) / 2, 0.075), r, r, abs(y1 - y0), segs=16, mi=mi, axis='Y')
L.cyl(bm, (0, -0.1045, 0.075), 0.026, 0.026, 0.002, segs=16, mi=2, axis='Y')  # vidrio
# empunadura con gatillo bajo el cuerpo: el origen (agarre) queda en su centro
bbox((0, 0.010, -0.040), (0.030, 0.034, 0.085), 1, bev=0.006)
bbox((0, -0.012, -0.004), (0.010, 0.010, 0.012), 0)                 # gatillo
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
hb, hbg = L.pivot_mesh('hasselblad', bm, [SILVER, BLACK, GLASS], parent=root, loc=(2 * SP + 0.05, 0, 0.083))

# ---------------- lec-pulley (polea de la LEC con su cinta; agarre/anclaje = gancho superior)
bm = bmesh.new()
# gancho superior (aro) en el origen
L.torus(bm, (0, 0, 0.0), 0.016, 0.0035, segs=12, tsegs=6, mi=1, scale=(1, 1, 1))
for vv in bm.verts:  # aro vertical en el plano XZ
    vv.co = Vector((vv.co.x, vv.co.z, vv.co.y))
# placas laterales de la polea
for sy in (-0.016, 0.016):
    L.box(bm, (0, sy, -0.06), (0.06, 0.004, 0.10), mi=1)
L.box(bm, (0, 0, -0.016), (0.022, 0.036, 0.012), mi=1)  # puente bajo el gancho
# rueda (eje Y) y eje
L.cyl(bm, (0, 0, -0.07), 0.034, 0.034, 0.026, segs=16, mi=0, axis='Y')
L.cyl(bm, (0, 0, -0.07), 0.006, 0.006, 0.044, segs=8, mi=2, axis='Y')
# cinta: medio arco sobre la rueda + dos tramos rectos que cuelgan 0,55 m
w, t, R, cz = 0.022, 0.002, 0.036, -0.07
segs = 8
prev = None
pts = [(R * math.cos(math.pi * i / segs), cz + R * math.sin(math.pi * i / segs)) for i in range(segs + 1)]
pts = [(R, cz - 0.55)] + pts + [(-R, cz - 0.55)]
def strip(p0, p1):
    (x0, z0), (x1, z1) = p0, p1
    nx, nz = -(z1 - z0), (x1 - x0); n = math.hypot(nx, nz); nx, nz = nx / n * t, nz / n * t
    for yy in (-w / 2, w / 2):
        pass
    vs = [bm.verts.new((x0, -w / 2, z0)), bm.verts.new((x1, -w / 2, z1)), bm.verts.new((x1, w / 2, z1)), bm.verts.new((x0, w / 2, z0)),
          bm.verts.new((x0 + nx, -w / 2, z0 + nz)), bm.verts.new((x1 + nx, -w / 2, z1 + nz)), bm.verts.new((x1 + nx, w / 2, z1 + nz)), bm.verts.new((x0 + nx, w / 2, z0 + nz))]
    for q in [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (3, 2, 6, 7)]:
        f = bm.faces.new([vs[i] for i in q]); f.material_index = 3
for i in range(len(pts) - 1):
    strip(pts[i], pts[i + 1])
# hebillas en los extremos de la cinta
for sx in (R + 0.001, -R - 0.001):
    L.box(bm, (sx, 0, cz - 0.55), (0.008, 0.03, 0.02), mi=1)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
lec, lecg = L.pivot_mesh('lec-pulley', bm, [ALU, STEEL, GRIP, STRAP], parent=root, loc=(3 * SP + 0.12, 0, 0.66))

# smooth en piezas cilindricas (auto smooth por angulo)
for ob in (hg, ct1[1], ct2[1], hbg, lecg):
    for p in ob.data.polygons: p.use_smooth = True
    mod = ob.modifiers.new('ws', 'WEIGHTED_NORMAL') if False else None
    try:
        bpy.context.view_layer.objects.active = ob
        ob.select_set(True)
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
        ob.select_set(False)
    except Exception as e:
        print('smooth by angle', e)

for n, o in [('geo-hammer', hg), ('core-tube-1', ct1[1]), ('core-tube-2', ct2[1]), ('hasselblad', hbg), ('lec-pulley', lecg)]:
    print('TRIS', n, L.tris_count([o]))
print('TRIS total', L.tris_count())

L.save_blend('eva-tools')
L.export('eva-tools')
# vistas previas: conjunto y primer plano de la Hasselblad
L.lunar_preview('eva-tools', cam_loc=(0.62, -1.55, 0.62), target=(0.55, 0, 0.28), lens=45, ground_size=5)
L.lunar_preview('eva-tools-hasselblad', cam_loc=(0.98, -0.42, 0.25), target=(2 * SP + 0.05, 0, 0.14), lens=60, ground_size=5)
print('DONE')
