# Generador reproducible de civiles (Persona 3). Uso:
#   blender -b -P p3_people.py -- <personaje> [--no-export]
# personajes: civil-base kranz bales duke garman jan rick mark
import bpy, bmesh, sys, math, os
from mathutils import Vector, Matrix, Euler, Quaternion

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['civil-base']
NAME = argv[0]
FPS = 30
P = 'mixamorig:'

# ---------------------------------------------------------------- perfiles
# Coordenadas base: hombre adulto 1,80 m, Z arriba, mirando a -Y, izquierda del personaje = +X
BASE = dict(H=1.80, head=0.23, legs=0.98, wf=1.0, hs=1.0, arm=1.0, girth=1.0, female=False)
PROFILES = {
  'civil-base': dict(),
  'kranz': dict(girth=1.04, jaw=1.12, face=1.03),
  'bales': dict(girth=0.96, jaw=1.05, face=1.04, nose=0.92),
  'duke': dict(girth=0.98, jaw=0.98, face=0.97, nose=1.08),
  'garman': dict(girth=0.95, jaw=0.94, face=0.96),
  'jan': dict(H=1.65, head=0.215, legs=0.905, wf=0.86, hs=0.93, arm=0.9, girth=0.92, female=True, jaw=0.86, nose=0.82, face=0.97),
  'rick': dict(H=1.50, head=0.212, legs=0.79, wf=0.76, hs=0.92, arm=0.82, girth=0.88, jaw=0.9, nose=0.85),
  'mark': dict(H=1.15, head=0.198, legs=0.57, wf=0.60, hs=0.86, arm=0.62, girth=0.95, jaw=0.88, nose=0.75, face=1.04),
}
PR = dict(BASE); PR.update(PROFILES[NAME])

# mapeo de coordenadas adultas -> perfil
A_LEGS, A_CHIN, A_H = 0.98, 1.57, 1.80
def mz(z):
    torso = PR['H'] - PR['head'] - PR['legs']
    if z <= A_LEGS: return z * PR['legs'] / A_LEGS
    if z <= A_CHIN: return PR['legs'] + (z - A_LEGS) * torso / (A_CHIN - A_LEGS)
    return PR['H'] - PR['head'] + (z - A_CHIN) * PR['head'] / (A_H - A_CHIN)
def vfac(z):
    torso = PR['H'] - PR['head'] - PR['legs']
    if z <= A_LEGS: return PR['legs'] / A_LEGS
    if z <= A_CHIN: return torso / (A_CHIN - A_LEGS)
    return PR['head'] / (A_H - A_CHIN)
SH_X, SH_Z = 0.17, 1.45
def M(p, kind):
    x, y, z = p
    if kind == 'head':
        hc = Vector((0, 0, A_CHIN)); d = (Vector(p) - hc) * PR['hs']
        return Vector((d.x, d.y, mz(A_CHIN) + d.z * (PR['head'] / (A_H - A_CHIN)) / PR['hs'] * PR['hs'] if False else mz(A_CHIN) + d.z))
    if kind == 'arm':
        s = 1 if x >= 0 else -1
        sx = SH_X * PR['wf'] * (0.93 if PR['female'] else 1.0)
        return Vector((s * (sx + (abs(x) - SH_X) * PR['arm']), y * PR['wf'], mz(SH_Z) + (z - SH_Z) * PR['wf']))
    return Vector((x * PR['wf'], y * PR['wf'], mz(z)))
def MR(r, kind, z=1.0):
    if kind == 'head': return r * PR['hs']
    if kind == 'arm': return r * PR['wf'] * PR['girth'] * (0.92 if PR['female'] else 1) * max(0.85, PR['arm'] / max(PR['wf'], 1e-3) * 0.9 if PR['wf'] < 0.9 else 1)
    return r * PR['wf'] * PR['girth']

VEST = dict(bot=1.0, arm_z=1.30, arm_x=0.13, side_x=0.178, v0=0.02, vz=1.20, vs=0.42)
# ---------------------------------------------------------------- utilidades
def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; sc.render.fps = FPS
def mat(name, rgb, rough=0.7, metal=0.0, emis=None):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    m.diffuse_color = (*rgb, 1); m.use_backface_culling = False
    return m
def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)
def obj_from_bm(bm, name):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob); return ob
def ell(bm, c, r, rot=(0, 0, 0), seg=16, ring=10):
    m = Matrix.Translation(Vector(c)) @ Euler([math.radians(a) for a in rot]).to_matrix().to_4x4() @ Matrix.Diagonal((*r, 1))
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=1.0, matrix=m)
def cone(bm, p0, r0, p1, r1, seg=16):
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0; L = d.length
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    m = Matrix.Translation((p0 + p1) / 2) @ q.to_matrix().to_4x4()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r0, radius2=r1, depth=L, matrix=m)
    ell(bm, p0, (r0, r0, r0), seg=seg, ring=8); ell(bm, p1, (r1, r1, r1), seg=seg, ring=8)
def tube(bm, p0, r0, p1, r1, seg=6, caps=True):
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    m = Matrix.Translation((p0 + p1) / 2) @ q.to_matrix().to_4x4()
    bmesh.ops.create_cone(bm, cap_ends=caps, segments=seg, radius1=r0, radius2=r1, depth=d.length, matrix=m)
def apply_mods(ob):
    bpy.context.view_layer.objects.active = ob
    for m in list(ob.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)

# ---------------------------------------------------------------- esqueleto (coords adultas)
BONES = [  # nombre, padre, cabeza, tipo
 ('Hips', None, (0, 0.0, 0.98), 'body'),
 ('Spine', 'Hips', (0, 0.0, 1.08), 'body'),
 ('Spine1', 'Spine', (0, 0.0, 1.20), 'body'),
 ('Spine2', 'Spine1', (0, 0.0, 1.32), 'body'),
 ('Neck', 'Spine2', (0, 0.01, 1.50), 'body'),
 ('Head', 'Neck', (0, 0.005, 1.60), 'head'),
 ('HeadTop_End', 'Head', (0, 0.005, 1.80), 'head'),
 ('LeftShoulder', 'Spine2', (0.045, -0.005, 1.43), 'body'),
 ('LeftArm', 'LeftShoulder', (0.17, 0.0, 1.45), 'arm'),
 ('LeftForeArm', 'LeftArm', (0.46, 0.0, 1.45), 'arm'),
 ('LeftHand', 'LeftForeArm', (0.715, 0.0, 1.45), 'arm'),
 ('LeftUpLeg', 'Hips', (0.09, 0.0, 0.93), 'body'),
 ('LeftLeg', 'LeftUpLeg', (0.095, 0.0, 0.505), 'body'),
 ('LeftFoot', 'LeftLeg', (0.10, 0.025, 0.085), 'body'),
 ('LeftToeBase', 'LeftFoot', (0.105, -0.095, 0.022), 'body'),
 ('LeftToe_End', 'LeftToeBase', (0.105, -0.175, 0.022), 'body'),
]
for b in list(BONES):
    if b[0].startswith('Left'):
        BONES.append((b[0].replace('Left', 'Right'), b[1].replace('Left', 'Right') if b[1] else None, (-b[2][0], b[2][1], b[2][2]), b[3]))
HAND_END = (0.90, 0.0, 1.45)

def bone_head(n):
    for b in BONES:
        if b[0] == n: return M(b[2], b[3])

def build_armature():
    arm = bpy.data.armatures.new('civil-rig'); ob = bpy.data.objects.new('Armature', arm)
    bpy.context.collection.objects.link(ob); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT')
    eb = {}
    child = {}
    for n, par, h, k in BONES:
        if par: child.setdefault(par, []).append(n)
    for n, par, h, k in BONES:
        e = arm.edit_bones.new(P + n); e.head = M(h, k); eb[n] = e
    for n, par, h, k in BONES:
        e = eb[n]
        kids = [c for c in child.get(n, []) if not ('Shoulder' in c or 'UpLeg' in c) or n not in ('Spine2', 'Hips')]
        if n == 'Spine2': kids = ['Neck']
        if n == 'Hips': kids = ['Spine']
        if kids: e.tail = eb[kids[0]].head
        elif n.endswith('Hand'):
            s = 1 if 'Left' in n else -1; e.tail = M((s * HAND_END[0], 0, HAND_END[2]), 'arm')
        elif n == 'HeadTop_End': e.tail = e.head + Vector((0, 0, 0.06 * PR['hs']))
        else: e.tail = e.head + Vector((0, -0.05 * PR['wf'], 0))
        if (e.tail - e.head).length < 1e-4: e.tail = e.head + Vector((0, 0, 0.05))
        if par: e.parent = eb[par]; e.use_connect = False
        e.roll = 0
    # rolls estables: brazos con Z hacia arriba
    for n, e in eb.items():
        if 'Arm' in n or 'Hand' in n or 'Shoulder' in n: e.align_roll(Vector((0, 0, 1)))
        else: e.align_roll(Vector((0, -1, 0)) if abs((e.tail - e.head).normalized().z) > 0.7 else Vector((0, 0, 1)))
    bpy.ops.object.mode_set(mode='OBJECT')
    for b in arm.bones: b.use_deform = True
    return ob

# ---------------------------------------------------------------- cuerpo
def body_blobs(bm):
    F = PR['female']; g = PR['girth']
    def E(c, r, rot=(0, 0, 0), kind='body', seg=16, ring=10):
        rr = tuple(MR(v, kind) for v in r)
        ell(bm, M(c, kind), rr, rot, seg, ring)
    def C(p0, r0, p1, r1, kind='body'):
        cone(bm, M(p0, kind), MR(r0, kind), M(p1, kind), MR(r1, kind))
    J = PR.get('jaw', 1.0); NZ = PR.get('nose', 1.0); FW = PR.get('face', 1.0)
    # cabeza: craneo, cara, mandibula, nariz, orejas, cejas
    E((0, 0.012, 1.695), (0.077, 0.098, 0.105), kind='head', seg=24, ring=16)
    E((0, -0.032, 1.648), (0.069 * FW, 0.062, 0.072), kind='head', seg=20, ring=12)        # cara media
    E((0, -0.036, 1.603), (0.056 * J, 0.052, 0.036), (12, 0, 0), kind='head', seg=16, ring=10)  # mandibula/menton
    E((0, -0.05, 1.59), (0.026, 0.022, 0.018), kind='head')                         # punta del menton
    for s in (1, -1):
        E((s * 0.05, -0.05, 1.655), (0.024, 0.03, 0.03), kind='head')               # mejillas / pomulos
        E((s * 0.05 * J, -0.02, 1.612), (0.022 * J, 0.045, 0.028), (0, 0, s * 15), kind='head')  # angulo mandibula
        E((s * 0.079, 0.014, 1.663), (0.014, 0.025, 0.034), (0, 0, s * -14), kind='head')  # orejas
    E((0, -0.083, 1.716), (0.062, 0.016, 0.018), kind='head')                        # arco superciliar
    E((0, -0.101 - 0.004 * (NZ - 1), 1.655), (0.0115 * NZ, 0.017 * NZ, 0.028 * NZ), (-18, 0, 0), kind='head')           # nariz
    E((0, -0.093, 1.688), (0.0095, 0.012, 0.024), (-10, 0, 0), kind='head')           # puente nasal
    E((0, -0.099, 1.64), (0.0145, 0.011, 0.01), kind='head')                        # aletas nariz
    E((0, -0.08, 1.612), (0.024, 0.01, 0.008), kind='head')                        # labios
    # cuello y trapecio
    C((0, 0.008, 1.46), 0.062 * (0.86 if F else 1), (0, 0.016, 1.61), 0.056 * (0.86 if F else 1))
    for s in (1, -1):
        E((s * 0.09, 0.015, 1.465), (0.08, 0.05, 0.03), (0, s * 18, 0))
    # torso
    sw = 0.88 if F else 1.0
    E((0, 0.005, 1.36), (0.165 * sw, 0.105, 0.11))                     # pecho alto / hombros
    E((0, 0.0, 1.27), (0.15 * sw, 0.11, 0.13))                         # torax
    if F:
        for s in (1, -1): E((s * 0.052, -0.07, 1.30), (0.055, 0.045, 0.05))
        E((0, 0.0, 1.13), (0.115, 0.085, 0.12))                         # cintura estrecha
        E((0, 0.01, 0.98), (0.165, 0.105, 0.11))                        # cadera ancha
        for s in (1, -1): E((s * 0.075, 0.045, 0.93), (0.085, 0.07, 0.09))
    else:
        for s in (1, -1): E((s * 0.06, -0.05, 1.31), (0.07, 0.05, 0.06))   # pectorales
        E((0, -0.005, 1.14), (0.135, 0.095, 0.13))                      # abdomen
        E((0, 0.005, 0.99), (0.15, 0.1, 0.1))                           # pelvis
        for s in (1, -1): E((s * 0.07, 0.045, 0.93), (0.078, 0.065, 0.085))   # gluteos
    for s in (1, -1):
        # deltoides y brazo
        E((s * 0.185, 0.0, 1.435), (0.065, 0.06, 0.06), kind='arm')
        C((s * 0.2, 0, 1.445), 0.05, (s * 0.46, 0, 1.45), 0.038, kind='arm')
        E((s * 0.31, 0.005, 1.442), (0.11, 0.047, 0.05), kind='arm')    # biceps/triceps
        C((s * 0.46, 0, 1.45), 0.038, (s * 0.71, 0, 1.45), 0.026, kind='arm')
        E((s * 0.53, 0, 1.452), (0.09, 0.042, 0.038), kind='arm')       # antebrazo
        E((s * 0.785, -0.004, 1.448), (0.06, 0.042, 0.017), kind='arm')  # palma
        E((s * 0.855, -0.002, 1.446), (0.04, 0.038, 0.013), kind='arm')  # dedos juntos
        C((s * 0.74, -0.035, 1.444), 0.012, (s * 0.80, -0.065, 1.44), 0.009, kind='arm')  # pulgar
        # piernas
        C((s * 0.09, 0.0, 0.92), 0.092, (s * 0.095, 0.0, 0.52), 0.056)
        E((s * 0.093, -0.002, 0.77), (0.084, 0.088, 0.17))               # muslo
        E((s * 0.095, -0.012, 0.51), (0.05, 0.05, 0.055))               # rodilla
        C((s * 0.095, 0.0, 0.5), 0.054, (s * 0.10, 0.02, 0.1), 0.04)
        E((s * 0.097, 0.016, 0.36), (0.057, 0.06, 0.12))               # gemelo
        E((s * 0.10, -0.03, 0.045), (0.045, 0.125, 0.045), (4, 0, 0))     # pie/zapato
        E((s * 0.10, 0.02, 0.07), (0.04, 0.05, 0.05))                   # talon

def make_body():
    bm = bmesh.new(); body_blobs(bm)
    ob = obj_from_bm(bm, 'body')
    rm = ob.modifiers.new('rm', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = 0.0065 * min(1, PR['wf'] + 0.15)
    sm = ob.modifiers.new('sm', 'CORRECTIVE_SMOOTH'); sm.factor = 0.7; sm.iterations = 14; sm.use_only_smooth = True
    apply_mods(ob)
    lp = ob.modifiers.new('lp', 'LAPLACIANSMOOTH'); lp.lambda_factor = 0.8; lp.iterations = 6; apply_mods(ob)
    # suavizado extra en la cara (quita pliegues entre volumenes)
    vg = ob.vertex_groups.new(name='face-smooth'); z0 = mz(1.54)
    for v in ob.data.vertices:
        if v.co.z > z0: vg.add([v.index], min(1.0, (v.co.z - z0) / 0.05), 'REPLACE')
    cs = ob.modifiers.new('cs', 'CORRECTIVE_SMOOTH'); cs.factor = 0.8; cs.iterations = 20; cs.use_only_smooth = True; cs.vertex_group = 'face-smooth'
    apply_mods(ob); ob.vertex_groups.remove(ob.vertex_groups['face-smooth'])
    return ob

def limit_tris(ob, target):
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    if tris > target:
        d = ob.modifiers.new('dec', 'DECIMATE'); d.ratio = target / tris; d.use_symmetry = True; d.symmetry_axis = 'X'; apply_mods(ob)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True); bpy.ops.object.shade_smooth(); ob.select_set(False)

def decimate(ob, target):
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    d = ob.modifiers.new('dec', 'DECIMATE'); d.ratio = min(1.0, target / max(1, tris)); d.use_symmetry = True; d.symmetry_axis = 'X'
    apply_mods(ob)
    bm = bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.to_mesh(ob.data); bm.free()
    bpy.context.view_layer.objects.active = ob; ob.select_set(True)
    bpy.ops.object.shade_smooth()
    return ob

# ---------------------------------------------------------------- materiales por region
def seg_t(p, a, b):
    ab = b - a; t = max(0, min(1, (p - a).dot(ab) / ab.length_squared)); return t, (a + ab * t - p).length

def region(p, outfit):
    """devuelve nombre de material para un punto del cuerpo (en reposo)"""
    H = bone_head
    x = abs(p.x); s = 'Left' if p.x >= 0 else 'Right'
    sh = H(s + 'Arm'); el = H(s + 'ForeArm'); wr = H(s + 'Hand')
    sleeve = outfit.get('sleeve', 0.5)  # fraccion del brazo cubierta (0 sin manga, 1 hasta muñeca)
    neck_z = mz(1.47) + outfit.get('collar_off', 0.0)
    if x > abs(sh.x) * 1.02 and p.z > mz(1.2):
        t = (x - abs(sh.x)) / (abs(wr.x) - abs(sh.x))
        if t < sleeve: return outfit['top']
        return 'skin'
    if p.z > mz(1.535) or (p.z > neck_z and math.hypot(p.x, p.y - 0.008) < 0.066 * PR['wf'] * PR['girth']): return 'skin'
    if p.z > outfit.get('waist', mz(0.99)): return outfit['top']
    if p.z > mz(outfit.get('shoes', 0.115)):
        if p.z < mz(outfit.get('hem', 0.0)): return outfit.get('legs', 'skin')
        return outfit['bottom']
    return 'shoes'

def cut_planes(ob, outfit):
    sh = abs(bone_head('LeftArm').x); wr = abs(bone_head('LeftHand').x); w = PR['wf']
    ARM = lambda c: c.z > mz(1.25) and abs(c.x) > sh * 0.9
    TOR = lambda c: abs(c.x) < 0.22 * w
    LEG = lambda c: c.z < mz(0.9)
    planes = []
    sl = outfit.get('sleeve', 0.5)
    xs = sh + (wr - sh) * min(sl, 1.0)
    if sl > 0: planes += [((xs, 0, 0), (1, 0, 0), ARM), ((-xs, 0, 0), (1, 0, 0), ARM)]
    planes.append(((0, 0, mz(1.47) + outfit.get('collar_off', 0.0)), (0, 0, 1), TOR))
    if outfit.get('waist', -1) > 0: planes.append(((0, 0, outfit['waist']), (0, 0, 1), TOR))
    planes.append(((0, 0, mz(outfit.get('shoes', 0.115))), (0, 0, 1), LEG))
    if outfit.get('hem'): planes.append(((0, 0, mz(outfit['hem'])), (0, 0, 1), LEG))
    if False and outfit.get('vest'):
        VT = lambda c: abs(c.x) < 0.22 * w and mz(VEST['bot']) - 0.03 < c.z < mz(1.48)
        planes += [((0, 0, mz(VEST['bot'])), (0, 0, 1), VT), ((0, 0, mz(VEST['arm_z'])), (0, 0, 1), VT),
                   ((VEST['arm_x'] * w, 0, 0), (1, 0, 0), VT), ((-VEST['arm_x'] * w, 0, 0), (1, 0, 0), VT),
                   ((VEST['side_x'] * w, 0, 0), (1, 0, 0), VT), ((-VEST['side_x'] * w, 0, 0), (1, 0, 0), VT),
                   ((VEST['v0'], 0, mz(VEST['vz'])), (1, 0, -VEST['vs']), VT), ((-VEST['v0'], 0, mz(VEST['vz'])), (-1, 0, -VEST['vs']), VT)]
    bm = bmesh.new(); bm.from_mesh(ob.data)
    for co, no, flt in planes:
        fs = [f for f in bm.faces if flt(f.calc_center_median())]
        es = list({e for f in fs for e in f.edges}); vs = list({v for f in fs for v in f.verts})
        bmesh.ops.bisect_plane(bm, geom=vs + es + fs, plane_co=co, plane_no=no, dist=0.0005)
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    bm.to_mesh(ob.data); bm.free()

def assign_regions(ob, outfit, mats):
    cut_planes(ob, outfit)
    me = ob.data; names = list(mats.keys())
    for m in mats.values(): me.materials.append(m)
    for poly in me.polygons:
        c = poly.center; poly.material_index = names.index(region(c, outfit))

# ---------------------------------------------------------------- accesorios
def shell_from_body(body, name, keep, offset, mat_):
    """copia caras del cuerpo que cumplan keep(centro) y las desplaza por la normal"""
    bm = bmesh.new(); bm.from_mesh(body.data)
    bm.normal_update()
    dele = [f for f in bm.faces if not keep(f.calc_center_median())]
    bmesh.ops.delete(bm, geom=dele, context='FACES')
    for v in bm.verts: v.co += v.normal * offset
    ob = obj_from_bm(bm, name); ob.data.materials.clear(); ob.data.materials.append(mat_)
    for p in ob.data.polygons: p.material_index = 0
    return ob

def band(hi, name, keep, off, mat_, target):
    ob = shell_from_body(hi, name, keep, off, mat_); limit_tris(ob, target); return ob

def hair(body, style, mat_):
    hs = PR['hs']; cz = mz(A_CHIN)
    # linea del pelo suave: altura (en m de cabeza adulta sobre el menton) segun el angulo alrededor de la cabeza
    LINES = {'crew': [(0, 0.176), (0.55, 0.168), (0.95, 0.14), (1.25, 0.125), (1.75, 0.125), (2.3, 0.06), (3.2, 0.05)],
             'short': [(0, 0.172), (0.5, 0.165), (0.95, 0.135), (1.25, 0.118), (1.75, 0.118), (2.3, 0.055), (3.2, 0.045)],
             'boy': [(0, 0.162), (0.5, 0.158), (0.95, 0.13), (1.25, 0.115), (1.75, 0.115), (2.3, 0.05), (3.2, 0.04)],
             'bob': [(0, 0.158), (0.45, 0.15), (0.75, 0.10), (1.0, 0.035), (3.2, 0.03)]}[style]
    def hl(a):
        a = abs(a)
        for (a0, h0), (a1, h1) in zip(LINES, LINES[1:]):
            if a <= a1:
                t = (a - a0) / (a1 - a0); t = t * t * (3 - 2 * t); return h0 + (h1 - h0) * t
        return LINES[-1][1]
    def keep(c):
        a = math.atan2(c.x, -(c.y - 0.012 * hs))
        if style == 'bob' and c.y < -0.035 * hs and c.z < cz + 0.15 * hs: return False
        return c.z > cz + hl(a) * hs
    base = {'crew': 0.003, 'short': 0.004, 'boy': 0.005, 'bob': 0.012}[style] * hs
    topx = {'crew': 0.010, 'short': 0.010, 'boy': 0.012, 'bob': 0.016}[style] * hs
    bm = bmesh.new(); bm.from_mesh(body.data); bm.normal_update()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if not keep(f.calc_center_median())], context='FACES')
    for v in bm.verts:  # suaviza la linea del pelo: lleva el borde a la curva
        if v.is_boundary:
            a = math.atan2(v.co.x, -(v.co.y - 0.012 * hs))
            if not (style == 'bob' and v.co.y < -0.03 * hs and v.co.z < cz + 0.152 * hs): v.co.z = cz + hl(a) * hs
    for v in bm.verts:
        k = max(0.0, min(1.0, (v.co.z - (cz + 0.11 * hs)) / (0.07 * hs)))
        front = max(0.0, min(1.0, (-v.co.y) / (0.08 * hs))) if style in ('short', 'boy') else 0
        a = math.atan2(v.co.x, -(v.co.y - 0.012 * hs)); dz = v.co.z - (cz + hl(a) * hs)
        taper = 0.3 + 0.7 * max(0.0, min(1.0, dz / (0.02 * hs))) if style != 'bob' else 1.0
        v.co += v.normal * (base + topx * k * (1 + 0.5 * front)) * taper
        if style == 'short' and v.co.x > 0.0: v.co.z += 0.003 * hs * k   # raya al lado izquierdo
    ob = obj_from_bm(bm, 'hair'); ob.data.materials.clear(); ob.data.materials.append(mat_)
    for p in ob.data.polygons: p.material_index = 0
    if style == 'crew':  # flat-top de Kranz: techo plano por encima del craneo
        top = max(v.co.z for v in ob.data.vertices); flat = top - 0.008 * hs
        for v in ob.data.vertices:
            if v.co.z > flat - 0.03 * hs: v.co.z = max(v.co.z, flat - (flat - v.co.z) * 0.35) if v.co.z < flat else flat
    if style == 'bob':
        for v in ob.data.vertices:
            d = v.co - Vector((0, 0.01 * hs, cz + 0.10 * hs)); f = max(0, min(1, (v.co.z - cz) / (0.12 * hs)))
            v.co += Vector((d.x, d.y * 0.6, 0)).normalized() * 0.018 * hs * (0.4 + 0.6 * math.sin(f * math.pi))
    limit_tris(ob, {'bob': 520, 'crew': 260}.get(style, 320))
    return ob

def head_feature_parts(bm, eyes_mat_idx=None):
    pass

def face_details(mats, hair_mat):
    """ojos, cejas: mallas pequeñas"""
    bm = bmesh.new(); hs = PR['hs']
    def H(p): return M(p, 'head')
    for s in (1, -1):
        ell(bm, H((s * 0.031, -0.0835, 1.69)), (0.0105 * hs, 0.004 * hs, 0.006 * hs), seg=8, ring=5)
    eyes_w = obj_from_bm(bm, 'eyes-w'); eyes_w.data.materials.append(mats['eye-white'])
    bm = bmesh.new()
    for s in (1, -1):
        ell(bm, H((s * 0.031, -0.0872, 1.69)), (0.0048 * hs, 0.0018 * hs, 0.0048 * hs), seg=6, ring=4)
    iris = obj_from_bm(bm, 'iris'); iris.data.materials.append(mats['iris'])
    bm = bmesh.new()
    for s in (1, -1):
        ell(bm, H((s * 0.034, -0.096, 1.708)), (0.019 * hs, 0.005 * hs, (0.0026 if PR['female'] or NAME == 'mark' else 0.0042) * hs), (0, s * (8 if PR['female'] else 4), 0), seg=6, ring=3)
    brows = obj_from_bm(bm, 'brows'); brows.data.materials.append(hair_mat)
    bm = bmesh.new()
    ell(bm, H((0, -0.087, 1.611)), (0.019 * hs, 0.004 * hs, 0.0035 * hs), seg=10, ring=4)
    lips = obj_from_bm(bm, 'lips'); lips.data.materials.append(mats['lips'])
    sw = lips.modifiers.new('sw', 'SHRINKWRAP'); sw.target = bpy.data.objects['body']; sw.wrap_method = 'PROJECT'; sw.use_project_y = True
    sw.use_negative_direction = True; sw.use_positive_direction = True; sw.offset = 0.0012; apply_mods(lips)
    return [eyes_w, iris, brows, lips]

def glasses(mat_, heavy=True):
    """lentes de pasta: aros rectangulares redondeados + puente + patillas"""
    hs = PR['hs']; H = lambda p: M(p, 'head'); bm = bmesh.new()
    t = (0.0038 if heavy else 0.0024) * hs; n = 12
    for s in (1, -1):
        c = H((s * 0.033, -0.106, 1.689)); rx, rz = 0.021 * hs, (0.0155 if heavy else 0.014) * hs
        pts = []
        for i in range(n):
            a = 2 * math.pi * i / n; ca, sa = math.cos(a), math.sin(a)
            # superelipse (rectangular redondeada), borde superior mas grueso en los de pasta
            x = rx * math.copysign(abs(ca) ** 0.6, ca); z = rz * math.copysign(abs(sa) ** 0.6, sa)
            pts.append(c + Vector((x, 0.004 * hs * (abs(x) / rx) ** 2 * (1 if s else 1), z)))
        for i in range(n):
            a, b2 = pts[i], pts[(i + 1) % n]
            th = t * (1.5 if heavy and (a.z + b2.z) / 2 > c.z + rz * 0.4 else 1.0)
            tube(bm, a, th, b2, th, seg=4)
    tube(bm, H((0.013, -0.108, 1.693)), t * 0.8, H((-0.013, -0.108, 1.693)), t * 0.8, seg=4)
    for s in (1, -1):
        tube(bm, H((s * 0.054, -0.104, 1.694)), t * 0.7, H((s * 0.079, 0.0, 1.692)), t * 0.7, seg=4)
        tube(bm, H((s * 0.079, 0.0, 1.692)), t * 0.7, H((s * 0.08, 0.026, 1.668)), t * 0.7, seg=4)
    g = obj_from_bm(bm, 'glasses'); g.data.materials.append(mat_); return g

def headset(mat_, mat2, boom=True):
    """auriculares MOCR 1969: diadema fina, un auricular a la derecha, almohadilla a la izquierda y microfono de brazo"""
    hs = PR['hs']; H = lambda p: M(p, 'head'); bm = bmesh.new()
    pts = []
    for i in range(11):
        a = math.radians(-90 + 180 * i / 10)
        pts.append(H((0.093 * math.sin(a), 0.012, 1.665 + 0.148 * math.cos(a))))
    for a, b in zip(pts, pts[1:]): tube(bm, a, 0.0042 * hs, b, 0.0042 * hs, seg=4, caps=False)
    ob = obj_from_bm(bm, 'headband'); ob.data.materials.append(mat_)
    bm = bmesh.new()
    tube(bm, H((-0.085, 0.012, 1.663)), 0.029 * hs, H((-0.103, 0.012, 1.663)), 0.025 * hs, seg=12)   # auricular derecho
    tube(bm, H((0.086, 0.012, 1.663)), 0.016 * hs, H((0.1, 0.012, 1.663)), 0.014 * hs, seg=8)       # almohadilla izquierda
    if boom:
        tube(bm, H((-0.1, 0.0, 1.655)), 0.0028 * hs, H((-0.075, -0.088, 1.615)), 0.0028 * hs, seg=4)
        tube(bm, H((-0.075, -0.088, 1.615)), 0.0028 * hs, H((-0.03, -0.112, 1.611)), 0.0028 * hs, seg=4)
        ell(bm, H((-0.025, -0.113, 1.611)), (0.009 * hs, 0.008 * hs, 0.008 * hs), seg=8, ring=4)
    o2 = obj_from_bm(bm, 'earpiece'); o2.data.materials.append(mat2)
    return [ob, o2]

def tie(body, mat_, z_top, z_bot, w=0.022):
    """corbata fina: tira sobre el pecho proyectada sobre el cuerpo"""
    bm = bmesh.new(); n = 7
    vs = []
    for i in range(n + 1):
        t = i / n; z = mz(z_top) + (mz(z_bot) - mz(z_top)) * t
        ww = (w * 0.55 + w * 0.6 * t) * PR['wf']
        if i == n: ww *= 0.15
        vs.append((bm.verts.new((-ww, -0.3, z)), bm.verts.new((ww, -0.3, z))))
    for a, b in zip(vs, vs[1:]): bm.faces.new((a[0], a[1], b[1], b[0]))
    knot = bmesh.ops.create_cube(bm, size=1, matrix=Matrix.Translation((0, -0.3, mz(z_top) + 0.008)) @ Matrix.Diagonal((0.018 * PR['wf'], 0.01, 0.018, 1)))
    ob = obj_from_bm(bm, 'tie'); ob.data.materials.append(mat_)
    sw = ob.modifiers.new('sw', 'SHRINKWRAP'); sw.target = body; sw.wrap_method = 'PROJECT'; sw.use_project_y = True
    sw.use_negative_direction = True; sw.use_positive_direction = True; sw.offset = 0.007
    apply_mods(ob); return ob

def collar(mat_, open_v=False):
    bm = bmesh.new(); r0 = 0.066 * PR['wf'] * PR['girth']; z = mz(1.475); n = 14
    top, bot = [], []
    for i in range(n + 1):
        a = math.radians(-150 + 300 * i / n)  # abierto por delante
        x, y = math.sin(a) * r0, math.cos(a) * r0 * 0.95 + 0.008
        bot.append(bm.verts.new((x * 1.05, y * 1.05, z - 0.008)))
        top.append(bm.verts.new((x * 1.0, y * 1.0, z + 0.03 * (0.55 if abs(a) > 2.4 else 1.0))))
    for i in range(n): bm.faces.new((bot[i], bot[i + 1], top[i + 1], top[i]))
    # puntas del cuello sobre el pecho
    for s in (1, -1):
        a = bm.verts.new((s * 0.012, -r0 * 0.98, z - 0.035)); b = bm.verts.new((s * r0 * 0.55, -r0 * 0.88, z - 0.02))
        c = bm.verts.new((s * r0 * 0.45, -r0 * 0.9, z + 0.012))
        bm.faces.new((a, b, c) if s > 0 else (c, b, a))
    ob = obj_from_bm(bm, 'collar'); ob.data.materials.append(mat_); return ob

def ring(mat_, center_fn, radius, axis, name, h=0.012, seg=12):
    pass

def skirt(hi, mat_, z_waist, z_hem, flare=0.05):
    """falda acampanada (linea A) que sigue el contorno de la cadera y se abre hacia el dobladillo"""
    n = 20; rows = 7; zw, zh = mz(z_waist), mz(z_hem)
    vs = [v.co for v in hi.data.vertices if abs(v.co.x) < 0.24 * PR['wf']]
    def ext(z):
        sl = [c for c in vs if abs(c.z - z) < 0.012]
        if not sl: return 0.1, 0.08, 0.0
        cy = (max(c.y for c in sl) + min(c.y for c in sl)) / 2
        return max(abs(c.x) for c in sl), (max(c.y for c in sl) - min(c.y for c in sl)) / 2, cy
    bm = bmesh.new(); rings = []; rx0 = ry0 = 0
    for j in range(rows + 1):
        t = j / rows; z = zw + (zh - zw) * t
        rx, ry, cy = ext(z) if z > mz(0.82) else (0, 0, 0.01)
        rx = max(rx + 0.008, rx0 + (0.012 if j else 0) + flare * PR['wf'] * t * 0.35); ry = max(ry + 0.008, ry0 + (0.01 if j else 0) + flare * PR['wf'] * t * 0.25)
        rx0, ry0 = rx, ry
        rings.append([bm.verts.new((math.sin(2 * math.pi * i / n) * rx, math.cos(2 * math.pi * i / n) * ry + (cy if j < 3 else 0.012), z)) for i in range(n)])
    for a, b in zip(rings, rings[1:]):
        for i in range(n): bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    ob = obj_from_bm(bm, 'skirt'); ob.data.materials.append(mat_)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True); bpy.ops.object.shade_smooth(); ob.select_set(False)
    return ob

# ---------------------------------------------------------------- rig y pesos
def bind(body, rig, others):
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True); rig.select_set(True); bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    head_only = {'hair', 'eyes-w', 'iris', 'brows', 'glasses', 'headband', 'earpiece'}
    for o in others:
        o.parent = rig
        mod = o.modifiers.new('arm', 'ARMATURE'); mod.object = rig
        if o.name.split('.')[0] in head_only:
            vg = o.vertex_groups.new(name=P + 'Head'); vg.add(range(len(o.data.vertices)), 1.0, 'REPLACE')
        else:
            for vgb in body.vertex_groups: o.vertex_groups.new(name=vgb.name)
            dt = o.modifiers.new('dt', 'DATA_TRANSFER'); dt.object = body; dt.use_vert_data = True
            dt.data_types_verts = {'VGROUP_WEIGHTS'}; dt.vert_mapping = 'POLYINTERP_NEAREST'
            dt.layers_vgroup_select_src = 'ALL'; dt.layers_vgroup_select_dst = 'NAME'
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.modifier_move_to_index(modifier='dt', index=0)
            bpy.ops.object.modifier_apply(modifier='dt')
        if o.name.startswith('skirt'): skirt_weights(o)
    print('[P3] partes:', ', '.join(f"{o.name}={sum(len(p.vertices) - 2 for p in o.data.polygons)}" for o in [body] + others))
    # unir todo en una malla
    bpy.ops.object.select_all(action='DESELECT')
    for o in [body] + others: o.select_set(True)
    bpy.context.view_layer.objects.active = body; bpy.ops.object.join()
    body = bpy.context.object
    # limpiar: <=4 pesos, normalizados
    bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
    bpy.ops.object.vertex_group_clean(group_select_mode='ALL', limit=0.01)
    bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
    bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    mods = [m for m in body.modifiers if m.type == 'ARMATURE']
    for m in mods[1:]: body.modifiers.remove(m)
    return body

def skirt_weights(o):
    """falda: mezcla de cadera y muslos para que no se rompa al caminar"""
    for vg in list(o.vertex_groups): o.vertex_groups.remove(vg)
    hips = o.vertex_groups.new(name=P + 'Hips'); L = o.vertex_groups.new(name=P + 'LeftUpLeg'); R = o.vertex_groups.new(name=P + 'RightUpLeg')
    zt = max(v.co.z for v in o.data.vertices); zb = min(v.co.z for v in o.data.vertices)
    for v in o.data.vertices:
        t = (zt - v.co.z) / (zt - zb)  # 0 cintura, 1 dobladillo
        side = max(-1, min(1, v.co.x / (0.08 * PR['wf'])))
        leg = 0.8 * t
        hips.add([v.index], 1 - leg, 'REPLACE')
        L.add([v.index], leg * (0.5 + 0.5 * side), 'REPLACE'); R.add([v.index], leg * (0.5 - 0.5 * side), 'REPLACE')

# ---------------------------------------------------------------- animacion
REST = {}
def key_pose(rig, action, frame, rots, hips=(0, 0, 0)):
    """rots: {hueso: (rx, ry, rz[, orden])} en grados, ejes del armature (X izq. personaje, -Y frente, Z arriba)"""
    for pb in rig.pose.bones:
        n = pb.name[len(P):]
        r = rots.get(n, (0, 0, 0))
        order = r[3] if len(r) > 3 else 'YZX'
        R = Euler([math.radians(a) for a in r[:3]], order).to_matrix()
        B = pb.bone.matrix_local.to_3x3()
        q = (B.inverted() @ R @ B).to_quaternion()
        pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = q
        pb.keyframe_insert('rotation_quaternion', frame=frame, group=pb.name)
        if n == 'Hips':
            s = PR['H'] / 1.8
            pb.location = B.inverted() @ (Vector(hips) * s)
            pb.keyframe_insert('location', frame=frame, group=pb.name)

def new_action(rig, name):
    act = bpy.data.actions.new(name); act.use_fake_user = True
    rig.animation_data_create(); rig.animation_data.action = act; return act

def lerp(a, b, t): return a + (b - a) * t
def smooth(t): return t * t * (3 - 2 * t)
def bump(x, c, w):
    d = (x - c + math.pi) % (2 * math.pi) - math.pi
    return math.exp(-(d / w) ** 2)

ABD = 14 if PR['female'] else 0
def arms_down(L=78, fwd=4, elbow=12, sh=12):
    """brazos relajados: L grados de bajada total (hombro+brazo)"""
    L -= ABD
    return {'LeftShoulder': (0, sh, 0), 'RightShoulder': (0, -sh, 0),
            'LeftArm': (-fwd, L - sh, 0), 'RightArm': (-fwd, -(L - sh), 0),
            'LeftForeArm': (0, 0, -elbow), 'RightForeArm': (0, 0, elbow),
            'LeftHand': (0, 0, -4), 'RightHand': (0, 0, 4)}

def anim_idle(rig):
    new_action(rig, 'idle'); N = 120
    for f in range(N + 1):
        ph = 2 * math.pi * f / N
        b = math.sin(ph)           # respiracion (4 s)
        sway = math.sin(ph) * 0.6  # balanceo
        r = arms_down(78 - 1.5 * b, 4 + 1.0 * b, 12 + 2 * b)
        r.update({'Spine': (-1 * b * 0.5, 0, sway * 0.8), 'Spine1': (-1.2 * b, 0, 0), 'Spine2': (-1.2 * b, 0, 0),
                  'Neck': (1.5 * b, 0, 0), 'Head': (1.0 * math.sin(ph * 2) * 0.6, 0, 3 * math.sin(ph + 1)),
                  'Hips': (0, 0, -sway * 1.2),
                  'LeftUpLeg': (0, 0, -1.5 * sway), 'RightUpLeg': (0, 0, -1.5 * sway),
                  'LeftLeg': (2, 0, 0), 'RightLeg': (3 + 2 * sway, 0, 0), 'LeftFoot': (-2, 0, 0), 'RightFoot': (-3 - 2 * sway, 0, 0)})
        key_pose(rig, None, f + 1, r, hips=(0.008 * sway, 0, -0.003 - 0.002 * abs(sway)))

def anim_walk(rig):
    new_action(rig, 'walk'); N = 32  # ciclo de 1,07 s, en el sitio
    for f in range(N + 1):
        ph = 2 * math.pi * f / N
        r = {}
        for side, off in (('Left', 0.0), ('Right', math.pi)):
            p = ph + off
            hip = 22 * math.cos(p) + 3                                       # flexion de cadera (+ adelante)
            knee = 6 + 14 * bump(p, 0.35, 0.35) + 58 * bump(p, 4.3, 0.75)   # carga + balanceo
            ank = -8 * math.cos(p) + 18 * bump(p, 3.4, 0.45) - 12 * bump(p, 0.15, 0.3)  # dorsi(-)/planti(+)
            toe = 25 * bump(p, 3.3, 0.35)
            r[side + 'UpLeg'] = (-hip, 0, 0)
            r[side + 'Leg'] = (knee, 0, 0)
            r[side + 'Foot'] = (-(-ank) * 1.0 - 0, 0, 0)
            r[side + 'ToeBase'] = (-toe, 0, 0)
        s = math.sin(ph); c = math.cos(ph)
        armL = -18 * c; armR = 18 * c   # brazo contrario a la pierna
        r.update(arms_down(80, 0, 0))
        r['LeftArm'] = (-armL, 68 - ABD, 0); r['RightArm'] = (-armR, -(68 - ABD), 0)
        r['LeftForeArm'] = (0, 0, -(14 + 10 * max(0, armL / 18))); r['RightForeArm'] = (0, 0, 14 + 10 * max(0, armR / 18))
        r['Hips'] = (0, 0, 6 * c)
        r['Spine'] = (-2, 0, -3 * c); r['Spine1'] = (-1, 0, -3 * c); r['Spine2'] = (0, 0, -2 * c)
        r['Neck'] = (2, 0, 2 * c); r['Head'] = (1, 0, 2 * c)
        key_pose(rig, None, f + 1, r, hips=(0.018 * s, 0, -0.022 - 0.016 * math.cos(2 * ph)))

def anim_sit(rig):
    new_action(rig, 'sit'); N = 120
    for f in range(N + 1):
        ph = 2 * math.pi * f / N; b = math.sin(ph)
        r = arms_down(74, 32, 58, 10)
        r.update({'LeftHand': (0, 0, 0), 'RightHand': (0, 0, 0)})
        r.update({'LeftUpLeg': (-88, 0, 4), 'RightUpLeg': (-88, 0, -4), 'LeftLeg': (86, 0, 0), 'RightLeg': (86, 0, 0),
                  'LeftFoot': (2, 0, 0), 'RightFoot': (2, 0, 0),
                  'Spine': (4 - 0.6 * b, 0, 0), 'Spine1': (-1.2 * b, 0, 0), 'Spine2': (2 - 1.2 * b, 0, 0),
                  'Neck': (-3 + 1.5 * b, 0, 0), 'Head': (-2, 0, 4 * math.sin(ph + 0.5))})
        key_pose(rig, None, f + 1, r, hips=(0, 0.06, -0.425))

def anim_talk(rig):
    new_action(rig, 'talk'); N = 96
    for f in range(N + 1):
        t = f / N; ph = 2 * math.pi * t
        g1 = 0.5 - 0.5 * math.cos(ph)          # gesto principal (sube y baja)
        g2 = math.sin(ph * 3)                   # enfasis
        r = arms_down(76, 4, 12)
        r['RightArm'] = (-(8 + 18 * g1), -(66 - 10 * g1), 0)
        r['RightForeArm'] = (0, 8 * g1, 14 + 66 * g1 + 8 * g2 * g1, 'YZX')
        r['RightHand'] = (0, 0, 5 + 10 * g2 * g1)
        g3 = 0.5 - 0.5 * math.cos(ph * 2 + 1.0)
        r['LeftArm'] = (-(5 + 10 * g3), 64 - 6 * g3, 0)
        r['LeftForeArm'] = (0, 0, -(14 + 40 * g3))
        r.update({'Spine2': (-1 * g2, 0, -3 * g1), 'Neck': (0, 0, 2 * g1),
                  'Head': (4 * math.sin(ph * 4) * 0.7, 0, -5 * g1 + 3 * math.sin(ph * 2)),
                  'Spine': (0, 0, 1.5 * math.sin(ph))})
        key_pose(rig, None, f + 1, r, hips=(0.004 * math.sin(ph), 0, -0.003))

def anim_point(rig):
    new_action(rig, 'point'); N = 60
    for f in range(N + 1):
        t = f / N
        k = smooth(min(1, t / 0.3)) if t < 0.75 else smooth(max(0, (1 - t) / 0.25))
        r = arms_down(78, 4, 12)
        # brazo derecho al frente, un poco abajo
        r['RightShoulder'] = (0, -12 * (1 - k), 6 * k)
        r['RightArm'] = (-k * 4, -(66 * (1 - k)) + k * 8, k * 78)
        r['RightForeArm'] = (0, 0, 12 * (1 - k) + 4 * k)
        r['RightHand'] = (0, 4 * k, 4 * (1 - k))
        r['Spine2'] = (0, 0, 6 * k); r['Head'] = (-3 * k, 0, 4 * k); r['Neck'] = (0, 0, 3 * k)
        key_pose(rig, None, f + 1, r, hips=(0, 0, -0.003))

def anim_wave(rig):
    new_action(rig, 'wave'); N = 60
    for f in range(N + 1):
        t = f / N; ph = 2 * math.pi * t * 2
        k = smooth(min(1, t / 0.2)) if t < 0.8 else smooth(max(0, (1 - t) / 0.2))
        r = arms_down(78, 4, 12)
        w = math.sin(ph) * k
        r['RightShoulder'] = (0, -12 * (1 - k) + 4 * k, 0)
        r['RightArm'] = (-10 * k, -(66 * (1 - k)) - 4 * k, 14 * k)
        r['RightForeArm'] = (-90 * k, 0, 12 * (1 - k) + (-(8) + 110 * k), 'XZY') if False else (-80 * k, 100 * k + 28 * w, 12 * (1 - k), 'XYZ')
        r['RightHand'] = (0, 12 * w, 0)
        r['Head'] = (0, 0, -6 * k); r['Spine2'] = (0, 0, -2 * k)
        key_pose(rig, None, f + 1, r, hips=(0, 0, -0.003))

# ---------------------------------------------------------------- vestuario por personaje
SKIN_L, SKIN_M = srgb('#d9a98a'), srgb('#c99575')
OUTFITS = {
  'civil-base': dict(top='shirt', bottom='pants', sleeve=0.48, hair='short', colors=dict(shirt='#cfd6dd', pants='#3b3f47', hair='#4a3426'), collar=True),
  'kranz': dict(top='shirt', bottom='pants', sleeve=1.0, hair='crew', colors=dict(shirt='#f7f7f5', pants='#2f3136', hair='#8f7a58', tie='#1c1d22', vest='#e2dccd'), tie=True, vest=True, collar=True, hair_top=0.022),
  'bales': dict(top='shirt', bottom='pants', sleeve=0.45, hair='short', colors=dict(shirt='#f1f1ee', pants='#34373e', hair='#2b211b', tie='#2a2f3e'), tie=True, glasses='heavy', headset=True, collar=True),
  'duke': dict(top='shirt', bottom='pants', sleeve=0.45, hair='short', colors=dict(shirt='#e9ecee', pants='#3c3a36', hair='#2a211c', tie='#3c3328'), tie=True, headset=True, collar=True),
  'garman': dict(top='shirt', bottom='pants', sleeve=0.45, hair='short', colors=dict(shirt='#d9e2ea', pants='#4a4740', hair='#3a2a20'), glasses='light', collar=True, tie=True, colors_tie='#5a4a3a'),
  'jan': dict(top='dress', bottom='skin', legs='skin', sleeve=0.18, hair='bob', colors=dict(dress='#9db8c9', hair='#4d3626'), skirt=True, waist_z=1.0),
  'rick': dict(top='tshirt', bottom='shorts', legs='skin', hem=0.62, sleeve=0.42, hair='boy', colors=dict(tshirt='#c74a3a', shorts='#5a6b7d', hair='#7a5a3a')),
  'mark': dict(top='tshirt', bottom='shorts', legs='skin', hem=0.66, sleeve=0.42, hair='boy', colors=dict(tshirt='#e7d9a8', shorts='#3f5a7a', hair='#c9a46a')),
}

def build():
    clean()
    o = OUTFITS[NAME]; C = o['colors']
    mats = {'skin': mat('skin', SKIN_L if NAME not in ('mark', 'rick') else srgb('#e2b394'), 0.55),
            'shoes': mat('shoes', srgb({'rick': '#ece8e0', 'mark': '#6a4a32', 'jan': '#2e2b36'}.get(NAME, '#1d1a18')), 0.45)}
    for k in ('shirt', 'pants', 'dress', 'tshirt', 'shorts'):
        if k in C: mats[k] = mat(k, srgb(C[k]), 0.8)
    if o['bottom'] == 'skin': pass
    hair_m = mat('hair', srgb(C['hair']), 0.75)
    extra = {'eye-white': mat('eye-white', srgb('#ece6dc'), 0.3), 'iris': mat('iris', srgb('#2a2018'), 0.3), 'lips': mat('lips', srgb('#b0544e' if PR['female'] else '#b5786a'), 0.45)}
    rig = build_armature()
    body = make_body()
    hi = body.copy(); hi.data = body.data.copy(); hi.name = 'body-hi'; bpy.context.collection.objects.link(hi)
    decimate(body, {'mark': 1900, 'rick': 2100}.get(NAME, 2300))
    outfit = dict(o)
    outfit['waist'] = mz(o.get('waist_z', 1.035))
    if 'hem' in o: outfit['hem'] = o['hem']
    if NAME == 'jan': outfit['bottom'] = 'skin'; outfit['waist'] = mz(0.55)  # bajo la falda el cuerpo va del color del vestido
    if o.get('legs'): outfit['legs'] = o['legs']
    order = {k: v for k, v in mats.items()}
    assign_regions(body, outfit, order)
    others = []
    others.append(hair(hi, o['hair'], hair_m))
    others += face_details(extra, hair_m)
    if o.get('collar'): others.append(collar(mats['shirt']))
    # bandas: cinturon, puños de manga, bajos del pantalon
    sh = abs(bone_head('LeftArm').x); wr = abs(bone_head('LeftHand').x); sl = o.get('sleeve', 0.5)
    xs = sh + (wr - sh) * min(sl, 1.0)
    if o['top'] in mats and 0 < sl:
        others.append(band(hi, 'cuff', lambda c: c.z > mz(1.2) and xs - 0.022 * PR['wf'] < abs(c.x) < xs, 0.0045, mats[o['top']], 70))
    if NAME not in ('jan',):
        wz = outfit['waist']
        if o['bottom'] == 'pants':
            others.append(band(hi, 'belt', lambda c: abs(c.z - wz - 0.012) < 0.016 and abs(c.x) < 0.2, 0.0055, mat('belt', srgb('#2a1d15'), 0.5), 90))
            bm = bmesh.new(); ell(bm, (0, -0.13 * PR['wf'] * PR['girth'], wz + 0.012), (0.018, 0.006, 0.014), seg=8, ring=4)
            bk = obj_from_bm(bm, 'buckle'); bk.data.materials.append(mat('buckle', srgb('#b8a77a'), 0.3, 1.0))
            sw = bk.modifiers.new('sw', 'SHRINKWRAP'); sw.target = body; sw.wrap_method = 'PROJECT'; sw.use_project_y = True
            sw.use_negative_direction = True; sw.use_positive_direction = True; sw.offset = 0.009; apply_mods(bk); others.append(bk)
            az = mz(0.115)
            others.append(band(hi, 'pant-hem', lambda c: az < c.z < az + 0.035, 0.005, mats['pants'], 70))
        else:
            others.append(band(hi, 'waistband', lambda c: abs(c.z - wz - 0.01) < 0.014 and abs(c.x) < 0.2, 0.004, mats[o['bottom']], 80))
            hz = mz(o['hem'])
            others.append(band(hi, 'shorts-hem', lambda c: hz < c.z < hz + 0.025, 0.004, mats[o['bottom']], 80))
    if o.get('tie'):
        tm = mat('tie', srgb(C.get('tie', o.get('colors_tie', '#333333'))), 0.6)
        others.append(tie(body, tm, 1.455, 1.05 if not o.get('vest') else 1.08, 0.02))
    if o.get('vest'):
        vm = mat('vest', srgb(C['vest']), 0.85)
        def kv(c):
            if c.z < mz(VEST['bot']) or c.z > mz(1.47): return False
            if abs(c.x) > VEST['side_x'] * PR['wf']: return False
            if abs(c.x) > VEST['arm_x'] * PR['wf'] and c.z > mz(VEST['arm_z']): return False     # sisas
            if c.y < 0 and abs(c.x) < VEST['v0'] + (c.z - mz(VEST['vz'])) * VEST['vs']: return False  # escote en V
            return True
        v = shell_from_body(hi, 'vest', kv, 0.009, vm); limit_tris(v, 420); others.append(v)
        bm = bmesh.new()
        for i in range(4):
            z = mz(1.2 - i * 0.045)
            ell(bm, (0, -0.135, z), (0.006, 0.004, 0.006), seg=5, ring=3)
        bt = obj_from_bm(bm, 'buttons'); bt.data.materials.append(mat('button', srgb('#d8d4c8'), 0.4))
        sw = bt.modifiers.new('sw', 'SHRINKWRAP'); sw.target = v; sw.wrap_method = 'PROJECT'; sw.use_project_y = True
        sw.use_negative_direction = True; sw.use_positive_direction = True; sw.offset = 0.002; apply_mods(bt)
        others.append(bt)
    if o.get('glasses'): others.append(glasses(mat('glasses', srgb('#121212'), 0.35), o['glasses'] == 'heavy'))
    if o.get('headset'): others += headset(mat('headset', srgb('#2b2b2b'), 0.5), mat('headset-ear', srgb('#3a3a3a'), 0.4))
    if o.get('skirt'):
        others.append(skirt(hi, mats['dress'], 1.06, 0.47, 0.02))
    bpy.data.objects.remove(hi, do_unlink=True)
    body = bind(body, rig, others)
    body.name = NAME; body.data.name = NAME
    rig.name = 'Armature'
    for a in (anim_idle, anim_walk, anim_sit, anim_talk, anim_point, anim_wave): a(rig)
    # NLA: dejar acciones como pistas para exportar todas
    rig.animation_data.action = None
    for act in bpy.data.actions:
        tr = rig.animation_data.nla_tracks.new(); tr.name = act.name; st = tr.strips.new(act.name, int(act.frame_range[0]), act); tr.mute = True
    return body, rig

def export(body, rig):
    os.makedirs(f'{ROOT}/blend', exist_ok=True); os.makedirs(f'{ROOT}/raw/people/out', exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=f'{ROOT}/blend/{NAME}-v01.blend')
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True); rig.select_set(True)
    bpy.ops.export_scene.gltf(filepath=f'{ROOT}/raw/people/out/{NAME}-raw.glb', export_format='GLB', use_selection=True,
        export_yup=True, export_apply=False, export_animations=True, export_animation_mode='ACTIONS',
        export_force_sampling=True, export_skins=True, export_all_influences=False, export_def_bones=False,
        export_anim_single_armature=True, export_reset_pose_bones=True, export_morph=False,
        export_nla_strips=True, export_optimize_animation_size=False)

if __name__ == '__main__':
    body, rig = build()
    tris = sum(len(p.vertices) - 2 for p in body.data.polygons)
    print(f'[P3] {NAME} tris={tris} H={max(v.co.z for v in body.data.vertices):.3f}')
    if '--no-export' not in argv: export(body, rig)
