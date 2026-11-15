# o2-hose.glb (Persona 4, P4-2b, No Canon): manguera de oxigeno de ~2 m con 6 huesos en cadena (hose-0..hose-5).
# Malla corrugada de 8 lados, conectores azules anodizados (estilo conectores del traje A7L) en ambos extremos.
# Pesos: cada vertice mezcla como mucho 2 huesos vecinos (lineal), normalizados. Clip 'flex' (2 s, bucle): ondeo lateral.
# Eje: la manguera nace en el origen (conector de hose-0) y avanza hacia -Y en Blender (= +Z en glTF), apoyada en el suelo.
import bpy, bmesh, math, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mathutils import Vector, Matrix, Quaternion
import p4lib as L

L.reset()
LEN, NB, R0, R1, SIDES, RINGS = 2.0, 6, 0.0165, 0.0145, 8, 45
HOSE = L.mat('manguera', (0.55, 0.60, 0.66), rough=0.6)
CON = L.mat('conector-azul', (0.06, 0.22, 0.62), rough=0.3, metal=0.9)
ALU = L.mat('aluminio', (0.78, 0.79, 0.80), rough=0.32, metal=1.0)
ZC = 0.025  # eje a esta altura: los conectores (r=2,5 cm) tocan el suelo

# ---------- armadura
arm_data = bpy.data.armatures.new('o2-hose-armature')
arm = bpy.data.objects.new('o2-hose', arm_data); bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
seg = LEN / NB; prev = None
for i in range(NB):
    b = arm_data.edit_bones.new(f'hose-{i}')
    b.head = (0, -i * seg, ZC); b.tail = (0, -(i + 1) * seg, ZC); b.roll = 0.0
    if prev: b.parent = prev; b.use_connect = True
    prev = b
bpy.ops.object.mode_set(mode='OBJECT')

# ---------- malla
bm = bmesh.new()
rings = []; svals = []
y0, y1 = -0.045, -(LEN - 0.045)  # tramo flexible entre conectores
for k in range(RINGS):
    s = k / (RINGS - 1); y = y0 + (y1 - y0) * s; r = R0 if k % 2 == 0 else R1
    rings.append([bm.verts.new((r * math.cos(2 * math.pi * j / SIDES + math.pi / SIDES), y, ZC + r * math.sin(2 * math.pi * j / SIDES + math.pi / SIDES))) for j in range(SIDES)])
for k in range(RINGS - 1):
    for j in range(SIDES):
        f = bm.faces.new((rings[k][j], rings[k + 1][j], rings[k + 1][(j + 1) % SIDES], rings[k][(j + 1) % SIDES])); f.material_index = 0
def connector(yc, direction):
    # cuerpo + anillo de bloqueo + boquilla (eje Y); direction=+1 hacia el origen
    L.cyl(bm, (0, yc, ZC), 0.021, 0.021, 0.05, segs=10, mi=1, axis='Y')
    L.cyl(bm, (0, yc + direction * 0.012, ZC), 0.025, 0.025, 0.012, segs=10, mi=2, axis='Y')
    L.cyl(bm, (0, yc + direction * 0.036, ZC), 0.013, 0.015, 0.022, segs=10, mi=2, axis='Y')
connector(-0.025, +1)
connector(-(LEN - 0.025), -1)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
me = bpy.data.meshes.new('o2-hose-geo'); bm.to_mesh(me); bm.free()
for m in (HOSE, CON, ALU): me.materials.append(m)
for p in me.polygons: p.use_smooth = True
ob = bpy.data.objects.new('o2-hose-geo', me); bpy.context.scene.collection.objects.link(ob)
ob.parent = arm
mod = ob.modifiers.new('arm', 'ARMATURE'); mod.object = arm
groups = [ob.vertex_groups.new(name=f'hose-{i}') for i in range(NB)]
for v in me.vertices:
    s = min(max(-v.co.y / seg - 0.5, 0.0), NB - 1.0)   # coordenada en "centros de hueso"
    i0 = int(math.floor(s)); t = s - i0
    if i0 >= NB - 1: groups[NB - 1].add([v.index], 1.0, 'REPLACE'); continue
    if t < 1e-4: groups[i0].add([v.index], 1.0, 'REPLACE'); continue
    groups[i0].add([v.index], 1.0 - t, 'REPLACE'); groups[i0 + 1].add([v.index], t, 'REPLACE')
print('TRIS', L.tris_count([ob]))

# ---------- clip 'flex' (ondeo lateral horneado, 2 s @ 30 fps, bucle exacto)
sc = bpy.context.scene; sc.render.fps = 30; sc.frame_start = 0; sc.frame_end = 60
act = bpy.data.actions.new('flex'); arm.animation_data_create(); arm.animation_data.action = act
for pb in arm.pose.bones: pb.rotation_mode = 'QUATERNION'
for f in range(0, 61, 3):
    t = f / 60.0
    for i, pb in enumerate(arm.pose.bones):
        a = math.radians(9.0 + 2.0 * i) * math.sin(2 * math.pi * t - 0.9 * i) * (0.5 if i == 0 else 1.0)
        lift = math.radians(3.0) * max(0.0, math.sin(2 * math.pi * t - 0.9 * i + 1.2)) * (1 if i > 0 else 0)
        q = Quaternion((0, 0, 1), a) @ Quaternion((1, 0, 0), lift)   # Z local = vertical (bone a lo largo de -Y, roll 0)
        pb.rotation_quaternion = q
        pb.keyframe_insert('rotation_quaternion', frame=f)
for fc in act.fcurves:
    for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'
sc.frame_set(0)
# NLA: dejar la accion como pista para el exportador y la pose de reposo como reposo
track = arm.animation_data.nla_tracks.new(); track.name = 'flex'; track.strips.new('flex', 0, act)
arm.animation_data.action = None
for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0)

L.save_blend('o2-hose')
L.export('o2-hose', animations=True, extra=dict(export_skins=True, export_def_bones=True, export_all_influences=False,
         export_animation_mode='ACTIONS', export_force_sampling=True, export_frame_range=False, export_anim_slide_to_zero=True))
# vistas: reposo y un fotograma del ondeo
L.lunar_preview('o2-hose', cam_loc=(2.3, -1.0, 1.7), target=(0, -1.0, 0.0), lens=44, ground_size=10)
arm.animation_data.action = act; sc.frame_set(20)
L.lunar_preview('o2-hose-flex', cam_loc=(2.3, -1.0, 1.7), target=(0, -1.0, 0.0), lens=44, ground_size=10)
print('DONE')
arm.animation_data.action = None; sc.frame_set(0)
for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0)
L.lunar_preview('o2-hose-conector', cam_loc=(0.22, 0.16, 0.14), target=(0, -0.04, ZC), lens=50, ground_size=10,
                fill=[((0.3, 0.3, 0.4), 6.0, 0.5)])
