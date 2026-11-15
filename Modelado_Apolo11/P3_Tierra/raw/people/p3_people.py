# Generador reproducible de civiles (Persona 3). Uso:
#   blender -b -P p3_people.py -- <personaje> [--no-export]
# personajes: civil-base kranz bales duke garman jan rick mark
import bpy, bmesh, sys, math, os, json
from mathutils import Vector, Matrix, Euler, Quaternion

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['civil-base-p3']
NAME = argv[0]
if NAME == 'civil-base': NAME = 'civil-base-p3'   # renombrado para no chocar con el civil-base de Persona 1
EXTRA = NAME == 'controller-extra'               # controlador de relleno ligero (<=2k tris) para el MOCR
FPS = 30
P = 'mixamorig:'

# ---------------------------------------------------------------- perfiles
# Coordenadas base: hombre adulto 1,80 m, Z arriba, mirando a -Y, izquierda del personaje = +X
BASE = dict(H=1.80, head=0.24, legs=0.98, wf=1.0, hs=1.06, arm=1.0, girth=1.0, female=False, shoulder=1.0)
PROFILES = {
  'civil-base-p3': dict(),
  'controller-extra': dict(girth=1.0, jaw=1.04, face=1.02, shoulder=1.0),
  # Kranz: cara cuadrada, cuello ancho, complexion robusta
  'kranz': dict(girth=1.06, jaw=1.18, face=1.06, cheek=1.0, chin=1.15, shoulder=1.04, neck=1.08),
  # Bales: 26 años, delgado, cara estrecha
  'bales': dict(girth=0.92, jaw=0.94, face=0.95, nose=0.95, shoulder=0.98, neck=0.95),
  # Duke: cara alargada
  'duke': dict(girth=0.98, jaw=0.98, face=0.94, nose=1.1, flen=1.06, chin=1.1, shoulder=1.0),
  # Garman: 24 años, cara redonda
  'garman': dict(girth=0.97, jaw=0.95, face=1.08, cheek=1.35, chin=0.85, nose=0.9, flen=0.97, shoulder=0.97),
  'jan': dict(H=1.65, head=0.222, legs=0.90, wf=0.86, hs=0.98, arm=0.9, girth=0.92, female=True, jaw=0.86, nose=0.82, face=0.97, neck=0.86),
  'rick': dict(H=1.50, head=0.215, legs=0.79, wf=0.76, hs=0.97, arm=0.82, girth=0.88, jaw=0.9, nose=0.85, cheek=1.1),
  'mark': dict(H=1.15, head=0.20, legs=0.565, wf=0.60, hs=0.92, arm=0.62, girth=0.95, jaw=0.88, nose=0.75, face=1.06, cheek=1.3, chin=0.8),
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
        hv = PR['head'] / (A_H - A_CHIN)
        d = Vector(p) - Vector((0, 0, A_CHIN))
        return Vector((d.x * PR['hs'], d.y * PR['hs'], mz(A_CHIN) + d.z * hv))
    if kind == 'arm':
        s = 1 if x >= 0 else -1
        sx = SH_X * PR['wf'] * (0.93 if PR['female'] else PR['shoulder'])
        return Vector((s * (sx + (abs(x) - SH_X) * PR['arm']), y * PR['wf'], mz(SH_Z) + (z - SH_Z) * PR['wf']))
    return Vector((x * PR['wf'], y * PR['wf'], mz(z)))

def MR(r, kind, z=1.0):
    if kind == 'head': return r * PR['hs']
    # brazos: mismo factor que las posiciones a lo largo del brazo, asi la mano siempre solapa con la muñeca
    if kind == 'arm': return r * PR['arm'] * PR['girth'] * (0.92 if PR['female'] else 1.0)
    return r * PR['wf'] * PR['girth']

VEST = dict(bot=1.0, arm_z=1.30, arm_x=0.13, side_x=0.178, v0=0.02, vz=1.20, vs=0.42)

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
    J = PR.get('jaw', 1.0); NZ = PR.get('nose', 1.0); FW = PR.get('face', 1.0); CK = PR.get('cheek', 1.0); CH = PR.get('chin', 1.0)
    FL = PR.get('flen', 1.0); NK = PR.get('neck', 1.0)
    def HZ(z): return 1.57 + (z - 1.57) * FL if z < 1.69 else z    # alarga la cara (Duke) sin tocar el craneo
    # cabeza: craneo, cara, mandibula, nariz, orejas, cejas
    E((0, 0.012, 1.697), (0.078, 0.099, 0.104), kind='head', seg=24, ring=16)
    E((0, -0.03, HZ(1.648)), (0.071 * FW, 0.064, 0.074 * FL), kind='head', seg=20, ring=12)        # cara media
    E((0, -0.032, HZ(1.604)), (0.06 * J, 0.056, 0.038), (12, 0, 0), kind='head', seg=16, ring=10)  # mandibula
    E((0, -0.052, HZ(1.588)), (0.03 * CH * (0.9 + 0.1 * J), 0.024, 0.02), kind='head')                  # menton
    for s in (1, -1):
        E((s * 0.05 * FW, -0.05, HZ(1.656)), (0.026 * CK, 0.03, 0.03 * CK), kind='head')        # pomulos / mofletes
        E((s * 0.054 * J, -0.012, HZ(1.612)), (0.024 * J, 0.048, 0.03), (0, 0, s * 15), kind='head')  # angulo mandibula
    E((0, -0.084, 1.716), (0.064, 0.016, 0.018), kind='head')                        # arco superciliar
    E((0, -0.102 - 0.004 * (NZ - 1), HZ(1.655)), (0.012 * NZ, 0.017 * NZ, 0.029 * NZ), (-18, 0, 0), kind='head')   # nariz
    E((0, -0.093, 1.688), (0.0095, 0.012, 0.024), (-10, 0, 0), kind='head')           # puente nasal
    E((0, -0.1, HZ(1.64)), (0.0155 * NZ, 0.011, 0.01), kind='head')                  # aletas nariz
    E((0, -0.081, HZ(1.612)), (0.025, 0.011, 0.009), kind='head')                    # labios
    # cuello (mas corto y ancho) y trapecio alto
    C((0, 0.006, 1.45), 0.068 * NK * (0.86 if F else 1), (0, 0.014, 1.60), 0.06 * NK * (0.86 if F else 1))
    for s in (1, -1):
        E((s * 0.095, 0.018, 1.47), (0.088 * PR['shoulder'], 0.056, 0.042), (0, s * 20, 0))
    # torso
    sw = 0.88 if F else PR['shoulder']
    E((0, 0.005, 1.36), (0.165 * sw, 0.105, 0.11))                     # pecho alto / hombros
    E((0, 0.0, 1.27), (0.141 * sw, 0.112, 0.13))                       # torax (dorsales algo mas estrechos bajo la axila)
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
        E((s * 0.19, 0.0, 1.437), (0.07, 0.064, 0.066), kind='arm')
        C((s * 0.2, 0, 1.445), 0.047, (s * 0.46, 0, 1.45), 0.037, kind='arm')
        E((s * 0.31, 0.005, 1.442), (0.11, 0.047, 0.043), kind='arm')    # biceps/triceps (mas estrecho de lado: el brazo baja pegado al torso)
        C((s * 0.46, 0, 1.45), 0.039, (s * 0.725, 0, 1.448), 0.029, kind='arm')
        E((s * 0.53, 0, 1.452), (0.09, 0.043, 0.039), kind='arm')       # antebrazo
        E((s * 0.715, 0, 1.448), (0.03, 0.032, 0.022), kind='arm')      # muñeca
        # mano tipo manopla: palma unida a la muñeca, dedos juntos y pulgar
        E((s * 0.775, -0.002, 1.447), (0.06, 0.042, 0.019), kind='arm')  # palma
        E((s * 0.85, 0.0, 1.444), (0.045, 0.039, 0.0135), (0, s * -8, 0), kind='arm')  # dedos juntos
        E((s * 0.888, 0.0, 1.439), (0.016, 0.036, 0.011), (0, s * -14, 0), kind='arm')  # puntas
        C((s * 0.735, -0.03, 1.446), 0.0135, (s * 0.778, -0.056, 1.441), 0.011, kind='arm')  # base del pulgar
        C((s * 0.778, -0.056, 1.441), 0.011, (s * 0.812, -0.064, 1.436), 0.0095, kind='arm')  # pulgar
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
    sm = ob.modifiers.new('sm', 'CORRECTIVE_SMOOTH'); sm.factor = 0.75; sm.iterations = 26; sm.use_only_smooth = True
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

def decimate(ob, target, head_bias=0.0):
    """decimado simetrico al objetivo de triangulos; head_bias>0 reserva mas densidad para la cara (z > menton)"""
    tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
    d = ob.modifiers.new('dec', 'DECIMATE'); d.ratio = min(1.0, target / max(1, tris)); d.use_symmetry = True; d.symmetry_axis = 'X'
    if head_bias > 0:
        vg = ob.vertex_groups.new(name='dec-w'); z0 = mz(1.50); z1 = mz(1.56)
        for v in ob.data.vertices:   # peso 1 = se decima libremente; la cara (peso bajo) conserva detalle
            t = max(0.0, min(1.0, (v.co.z - z0) / (z1 - z0)))
            vg.add([v.index], 1.0 - (1.0 - head_bias) * t if v.co.y < 0.03 else 1.0 - 0.5 * (1.0 - head_bias) * t, 'REPLACE')
        d.vertex_group = 'dec-w'; d.vertex_group_factor = 1.0
        dg = bpy.context.evaluated_depsgraph_get()
        lo, hi = 0.0, 1.0
        for _ in range(14):   # biseccion del ratio para llegar al objetivo con el grupo activo
            d.ratio = (lo + hi) / 2; dg.update()
            n = sum(len(p.vertices) - 2 for p in ob.evaluated_get(dg).data.polygons)
            if n > target: hi = d.ratio
            else: lo = d.ratio
        d.ratio = lo
    apply_mods(ob)
    if 'dec-w' in ob.vertex_groups: ob.vertex_groups.remove(ob.vertex_groups['dec-w'])
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
    if p.z > mz(1.54) or (p.z > neck_z and math.hypot(p.x, p.y - 0.008) < 0.073 * PR['wf'] * PR.get('neck', 1.0) * (0.86 if PR['female'] else 1.0)): return 'skin'
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

def bvh_of(ob):
    from mathutils.bvhtree import BVHTree
    bm = bmesh.new(); bm.from_mesh(ob.data); bm.transform(ob.matrix_world)
    t = BVHTree.FromBMesh(bm); bm.free(); return t

def push_out(ob, target, min_off):
    """garantiza que ningun vertice de la ropa quede dentro o pegado al cuerpo (evita z-fighting y atravesados)"""
    t = bvh_of(target)
    for v in ob.data.vertices:
        loc, n, idx, d = t.find_nearest(v.co)
        if loc is None: continue
        if (v.co - loc).dot(n) < min_off: v.co = loc + n * min_off

def shell_cut(src, name, planes, keep, offset, mat_, region=None):
    """capa de ropa: copia de la superficie del cuerpo low-poly, cortada con planos (bordes rectos) y desplazada"""
    bm = bmesh.new(); bm.from_mesh(src.data)
    if region:
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if not region(f.calc_center_median())], context='FACES')
    for co, no in planes:
        g = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=g, plane_co=co, plane_no=no, dist=0.0002)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if not keep(f.calc_center_median())], context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bm.normal_update()
    nrm = {}
    for v in bm.verts:   # normal suavizada (promedio de vecinos) para que la capa no se abra en esquinas
        n = Vector(v.normal)
        for e in v.link_edges: n += e.other_vert(v).normal * 0.5
        nrm[v] = n.normalized()
    for v in bm.verts: v.co += nrm[v] * offset
    ob = obj_from_bm(bm, name); ob.data.materials.clear(); ob.data.materials.append(mat_)
    for p in ob.data.polygons: p.material_index = 0
    push_out(ob, src, offset * 0.8)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True); bpy.ops.object.shade_smooth(); ob.select_set(False)
    return ob

def hair(hi, style, mat_):
    """pelo como casquete limpio: esfera regular proyectada sobre el craneo + grosor por zona, borde ajustado a la linea del pelo"""
    hs = PR['hs']; hv = PR['head'] / (A_H - A_CHIN); cz = mz(A_CHIN)
    LINES = {'crew': [(0, 0.178), (0.55, 0.17), (0.95, 0.145), (1.25, 0.132), (1.85, 0.132), (2.4, 0.07), (3.2, 0.055)],
             'short': [(0, 0.174), (0.5, 0.167), (0.95, 0.14), (1.25, 0.13), (1.85, 0.13), (2.4, 0.06), (3.2, 0.048)],
             'side': [(0, 0.172), (0.5, 0.166), (0.95, 0.14), (1.25, 0.13), (1.85, 0.13), (2.4, 0.06), (3.2, 0.048)],
             'boy': [(0, 0.165), (0.5, 0.16), (0.95, 0.135), (1.25, 0.127), (1.85, 0.127), (2.4, 0.055), (3.2, 0.045)],
             'bob': [(0, 0.162), (0.4, 0.155), (0.7, 0.12), (0.95, 0.05), (1.3, 0.03), (3.2, 0.028)]}[style]
    def hl(a):
        a = abs(a)
        for (a0, h0), (a1, h1) in zip(LINES, LINES[1:]):
            if a <= a1:
                t = (a - a0) / (a1 - a0); t = t * t * (3 - 2 * t); return h0 + (h1 - h0) * t
        return LINES[-1][1]
    C0 = M((0, 0.012, 1.69), 'head')
    def ang(p): return math.atan2(p.x, -(p.y - C0.y))
    def th(p, n):
        k = max(0.0, min(1.0, (p.z - (cz + 0.115 * hv)) / (0.07 * hv)))
        dz = p.z - (cz + hl(ang(p)) * hv); taper = 0.35 + 0.65 * max(0.0, min(1.0, dz / (0.018 * hv)))
        if style == 'crew': return (0.003 + 0.04 * k) * hs * taper
        if style == 'boy': return (0.004 + 0.011 * k) * hs * taper
        if style == 'short': return (0.004 + 0.012 * k + 0.004 * max(0, -n.y) * k) * hs * taper
        if style == 'side':   # raya a la izquierda del personaje (+X), volumen peinado hacia su derecha y tupe delantero
            part = 0.032 * hs; side = max(0.0, min(1.0, (part - p.x) / (0.06 * hs)))
            groove = 0.35 if abs(p.x - part) < 0.007 * hs and n.z > 0.2 else 1.0
            return (0.004 + (0.004 + 0.02 * side) * k * groove + 0.01 * max(0, -n.y) * k * side) * hs * taper
        if style == 'bob':
            low = max(0.0, min(1.0, ((cz + 0.11 * hv) - p.z) / (0.08 * hv)))
            return (0.013 + 0.012 * k + 0.012 * low) * hs
    t = bvh_of(hi)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16 if EXTRA else 28, v_segments=10 if EXTRA else 18, radius=1.0,
                              matrix=Matrix.Translation(C0) @ Matrix.Diagonal((0.15 * hs, 0.17 * hs, 0.16 * hv, 1)))
    def project(v, origin):
        d = (v.co - origin)
        if d.length < 1e-6: return False
        hit = t.ray_cast(origin, d.normalized(), 1.0)
        if hit[0] is None: return False
        v.co = hit[0] + hit[1] * th(hit[0], hit[1]); return True
    for v in bm.verts: project(v, C0)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().z < cz + hl(ang(f.calc_center_median())) * hv - 0.004], context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    for v in bm.verts:    # borde: se lleva exactamente a la linea del pelo y se reproyecta en horizontal
        if v.is_boundary:
            zh = cz + hl(ang(v.co)) * hv; v.co.z = zh; project(v, Vector((C0.x, C0.y, zh)))
    if style == 'crew':  # flat-top de Kranz: techo plano
        flat = max(v.co.z for v in hi.data.vertices) + 0.013 * hv
        for v in bm.verts:
            if v.co.z > flat: v.co.z = flat
    if style == 'bob':   # puntas hacia dentro a la altura de la mandibula
        for v in bm.verts:
            if v.is_boundary and v.co.z < cz + 0.06 * hv:
                d = Vector((v.co.x - C0.x, v.co.y - C0.y, 0)); v.co -= d.normalized() * 0.006 * hs
    ob = obj_from_bm(bm, 'hair'); ob.data.materials.append(mat_)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True); bpy.ops.object.shade_smooth(); ob.select_set(False)
    return ob

def head_feature_parts(bm, eyes_mat_idx=None):
    pass

def face_details(mats, hair_mat):
    """cara legible en primer plano: ojos (blanco, iris, pupila, linea de pestanas), cejas con forma, nariz, boca y orejas.
    Todo se coloca proyectando sobre la superficie real de la cara (rayos sobre el cuerpo ya decimado)."""
    F = FACE[NAME]; hs = PR['hs']; body = bpy.data.objects['body']; T = bvh_of(body)
    FL = PR.get('flen', 1.0); NZ = PR.get('nose', 1.0)
    def HZ(z): return 1.57 + (z - 1.57) * FL if z < 1.69 else z
    def H(p): return M(p, 'head')
    def front(x, z, out=0.0):
        q = H((x, 0, z)); hit = T.ray_cast(Vector((q.x, -0.6, q.z)), Vector((0, 1, 0)), 1.0)
        y = hit[0].y if hit[0] is not None else H((x, -0.09, z)).y
        return Vector((q.x, y - out * hs, q.z))
    lp = EXTRA
    parts = []
    def piece(bm, name, m):
        o = obj_from_bm(bm, name); o.data.materials.append(m)
        bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.shade_smooth(); o.select_set(False)
        parts.append(o); return o
    def chain(bm, pts, r0, r1, seg=4, joints=False):
        n = len(pts) - 1
        for i in range(n):
            ra = r0 + (r1 - r0) * i / n; rb = r0 + (r1 - r0) * (i + 1) / n
            tube(bm, pts[i], ra, pts[i + 1], rb, seg=seg, caps=(i == 0 or i == n - 1))
            if joints and 0 < i: ell(bm, pts[i], (ra, ra, ra), seg=seg, ring=3)
    # ---- ojos
    ex, ez = 0.031, 1.690; rx, ry, rz = 0.0135 * hs, 0.0045 * hs, 0.0068 * hs
    bw, bi, bp, bl = bmesh.new(), bmesh.new(), bmesh.new(), bmesh.new()
    for s_ in (1, -1):
        c = front(s_ * ex, ez, -0.0016); yaw = math.radians(s_ * 14)
        Rz = Matrix.Rotation(yaw, 3, 'Z')
        ell(bw, c, (rx, ry, rz), (0, 0, s_ * 14), seg=6 if lp else 10, ring=4 if lp else 6)
        ell(bi, c + Rz @ Vector((0, -ry * 0.78, -0.0003)), (0.0062 * hs, 0.0016 * hs, 0.0062 * hs), (0, 0, s_ * 14), seg=6 if lp else 10, ring=3 if lp else 4)
        if not lp: ell(bp, c + Rz @ Vector((0, -ry * 0.98, -0.0003)), (0.0029 * hs, 0.0009 * hs, 0.0029 * hs), (0, 0, s_ * 14), seg=8, ring=3)
        # linea del parpado superior / pestanas: arco que tapa el tercio superior del ojo (mirada natural, no de punto)
        pts = []
        nl = 3 if lp else 5
        for i in range(nl + 1):
            t = -1 + 2 * i / nl
            lx = t * rx * 1.08; lz = rz * 0.62 * math.sqrt(max(0.0, 1 - (t * 0.93) ** 2)) + 0.0008 * hs
            pts.append(c + Rz @ Vector((lx, -ry * 0.55 - 0.0006, lz)))
        lt = 0.0013 * hs * F.get('lash', 1.0)
        chain(bl, pts if s_ > 0 else pts[::-1], lt * 0.8, lt * 1.35, seg=4)
    piece(bw, 'eyes-w', mats['eye-white']); piece(bi, 'iris', mats['iris'])
    if not lp: piece(bp, 'pupils', mats['pupil'])
    else: bp.free()
    piece(bl, 'lids', mats['lash'])
    # ---- cejas: forma por personaje (grosor, arco, inclinacion), apoyadas en la frente
    bm = bmesh.new(); bt = F.get('brow_t', 1.0); arch = F.get('brow_arch', 0.5); tilt = F.get('brow_tilt', 0); low = F.get('brow_low', 0.0)
    if PR['female'] or NAME == 'mark': bt *= 0.85
    for s_ in (1, -1):
        pts = []
        for i in range(5):
            t = i / 4; x = 0.013 + 0.044 * t
            z = 1.709 - low + arch * 0.0045 * math.sin(math.pi * min(1.0, t * 1.15)) + math.tan(math.radians(tilt)) * (t - 0.5) * 0.044 - 0.003 * t * t
            pts.append(front(s_ * x, z, 0.0022))
        chain(bm, pts, 0.0032 * bt * hs, 0.0017 * bt * hs, seg=3 if lp else 4, joints=not lp)
    piece(bm, 'brows', hair_mat)
    # ---- nariz: volumen propio (puente, punta, aletas) para que se lea de frente y de perfil
    yf = (front(0.024, 1.662).y + front(-0.024, 1.662).y) / 2
    def NP(x, dy, z): q = H((x * NZ, 0, HZ(z))); return (q.x, yf + dy * NZ * hs, q.z)
    bm = bmesh.new()
    pts = [NP(0, 0.004, 1.695), NP(0.006, 0.002, 1.692), NP(-0.006, 0.002, 1.692),
           NP(0.007, -0.006, 1.672), NP(-0.007, -0.006, 1.672), NP(0, -0.009, 1.674),
           NP(0, -0.025, 1.645), NP(0.008, -0.019, 1.646), NP(-0.008, -0.019, 1.646),
           NP(0.016, -0.007, 1.638), NP(-0.016, -0.007, 1.638), NP(0.012, -0.012, 1.632), NP(-0.012, -0.012, 1.632),
           NP(0, -0.015, 1.630), NP(0, 0.003, 1.632), NP(0.013, 0.004, 1.655), NP(-0.013, 0.004, 1.655)]
    vs = [bm.verts.new(v) for v in pts]
    bmesh.ops.convex_hull(bm, input=vs)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    nose = piece(bm, 'nose', mats['skin'])
    # ---- boca: linea oscura curvada + labio inferior + labio superior fino
    mw = F.get('mouth', 1.0); sm = F.get('smile', 0)
    bm = bmesh.new(); pts = []
    for i in range(6):
        t = -1 + 2 * i / 5
        pts.append(front(t * 0.021 * mw, HZ(1.612) + (0.0012 + 0.0016 * sm) * t * t * 1.0 - 0.0004, -0.0004))
    chain(bm, pts, 0.0017 * hs, 0.0017 * hs, seg=4)
    piece(bm, 'mouth', mats['mouth'])
    bm = bmesh.new()
    ell(bm, front(0, HZ(1.6055), -0.0008), (0.0155 * mw * hs, 0.0035 * hs, 0.0042 * hs), seg=10, ring=4)
    if not lp: ell(bm, front(0, HZ(1.6165), -0.0008), (0.018 * mw * hs, 0.0028 * hs, 0.0024 * hs), seg=10, ring=4)
    lips = piece(bm, 'lips', mats['lips'])
    sw = lips.modifiers.new('sw', 'SHRINKWRAP'); sw.target = body; sw.wrap_method = 'PROJECT'; sw.use_project_y = True
    sw.use_negative_direction = True; sw.use_positive_direction = True; sw.offset = 0.0012; apply_mods(lips)
    # ---- orejas (siempre al final: la melena de Jan las quita con pop())
    bm = bmesh.new()
    for s_ in (1, -1):
        ell(bm, H((s_ * 0.08, 0.014, 1.66)), (0.011 * hs, 0.019 * hs, 0.03 * hs), (6, 0, s_ * -22), seg=6 if lp else 8, ring=4 if lp else 5)
        if not lp: ell(bm, H((s_ * 0.087, 0.018, 1.662)), (0.0045 * hs, 0.015 * hs, 0.025 * hs), (6, 0, s_ * -28), seg=6, ring=4)
    piece(bm, 'ears', mats['skin'])
    return parts

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
    tube(bm, H((-0.085, 0.012, 1.663)), 0.029 * hs, H((-0.103, 0.012, 1.663)), 0.025 * hs, seg=8 if EXTRA else 12)   # auricular derecho
    tube(bm, H((0.086, 0.012, 1.663)), 0.016 * hs, H((0.1, 0.012, 1.663)), 0.014 * hs, seg=6 if EXTRA else 8)       # almohadilla izquierda
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
    sw.use_negative_direction = True; sw.use_positive_direction = True; sw.offset = 0.01
    apply_mods(ob); return ob

def collar(mat_, hi, body):
    """cuello de camisa: banda que abraza el cuello (medida con rayos sobre el cuerpo) + dos puntas sobre el pecho"""
    t = bvh_of(body); zc = mz(1.485); cy = 0.01 * PR['wf']
    rmax = 0.088 * PR['wf'] * PR.get('neck', 1.0) * (0.86 if PR['female'] else 1.0)
    def ring_pt(a, z, off):
        d = Vector((math.sin(a), -math.cos(a), 0)); o = Vector((0, cy, z))
        hit = t.ray_cast(o, d, 0.3)
        r = min((hit[0] - o).length, rmax) if hit[0] is not None else rmax
        return o + d * (r + off)
    bm = bmesh.new(); n = 20; gap = math.radians(24); top, bot = [], []
    for i in range(n + 1):
        a = -math.pi + gap + (2 * math.pi - 2 * gap) * i / n     # a=+-pi delante, 0 detras
        front = max(0.0, math.cos(a + math.pi))  # 1 delante
        zb = zc - 0.013 - 0.014 * front; zt = zc + 0.03 - 0.016 * front
        bot.append(bm.verts.new(ring_pt(a, zb, 0.007))); top.append(bm.verts.new(ring_pt(a, zt, 0.005)))
    for i in range(n): bm.faces.new((bot[i], bot[i + 1], top[i + 1], top[i]))
    for s_, end in ((1, n), (-1, 0)):   # puntas del cuello sobre el pecho
        b = bot[end]; t_ = top[end]
        tip = bm.verts.new(b.co + Vector((s_ * 0.026, -0.004, -0.038)))
        mid = bm.verts.new(b.co + Vector((s_ * 0.032 * PR['wf'], 0.0, -0.022)))
        bm.faces.new((t_, b, tip, mid) if s_ < 0 else (mid, tip, b, t_))
    ob = obj_from_bm(bm, 'collar'); ob.data.materials.append(mat_)
    push_out(ob, body, 0.004)
    bpy.context.view_layer.objects.active = ob; ob.select_set(True); bpy.ops.object.shade_smooth(); ob.select_set(False)
    return ob

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
    head_only = {'hair', 'eyes-w', 'iris', 'pupils', 'lids', 'brows', 'nose', 'mouth', 'lips', 'glasses', 'headband', 'earpiece'}
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
def key_pose(rig, action, frame, rots, hips=(0, 0, 0), absolute=False):
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
            s = 1.0 if absolute else PR['H'] / 1.8
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
def arms_down(L=78, fwd=4, elbow=12, sh=20):
    L -= 4  # brazos algo separados del cuerpo: menos pliegue en el hombro
    """brazos relajados: L grados de bajada total (hombro+brazo); se usa en sit / sit-floor"""
    L -= ABD
    return {'LeftShoulder': (0, sh, 0), 'RightShoulder': (0, -sh, 0),
            'LeftArm': (-fwd, L - sh, 0), 'RightArm': (-fwd, -(L - sh), 0),
            'LeftForeArm': (0, 0, -elbow), 'RightForeArm': (0, 0, elbow),
            'LeftHand': (0, 0, -4), 'RightHand': (0, 0, 4)}

def set_pose(rig, rots, hips=(0, 0, 0)):
    """como key_pose pero sin insertar claves (para pruebas de colision); hips en metros reales"""
    for pb in rig.pose.bones:
        n = pb.name[len(P):]; r = rots.get(n, (0, 0, 0)); order = r[3] if len(r) > 3 else 'YZX'
        R = Euler([math.radians(x) for x in r[:3]], order).to_matrix(); B = pb.bone.matrix_local.to_3x3()
        pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (B.inverted() @ R @ B).to_quaternion()
        pb.location = B.inverted() @ Vector(hips) if n == 'Hips' else Vector((0, 0, 0))

# brazos de reposo: bajada total L (grados desde la T-pose). build() busca el L mas pegado al cuerpo sin atravesar torso/chaleco/muslos
IDLE = dict(L=84.0, fwd=6.0, elbow=15.0, sh=14.0)
WALK_DL = -3.0   # brazos un poco mas abiertos al caminar; con idle cerrado (L<85) se abre algo mas para no rozar el chaleco
def idle_arms(b=0.0, dL=0.0):
    L = IDLE['L'] + dL - 1.2 * b; sh = IDLE['sh']; f = IDLE['fwd'] + 1.0 * b; e = IDLE['elbow'] + 2 * b
    return {'LeftShoulder': (0, sh, 0), 'RightShoulder': (0, -sh, 0),
            'LeftArm': (-f, L - sh, 0), 'RightArm': (-f, -(L - sh), 0),
            'LeftForeArm': (0, 0, -e), 'RightForeArm': (0, 0, e),
            'LeftHand': (0, 0, -6), 'RightHand': (0, 0, 6)}

def idle_pose(ph):
    """pose de reposo en la fase ph (respiracion de 4 s). Devuelve (rots, hips adultos). ph=0 es la pose de inicio/fin de talk/point/wave"""
    b = math.sin(ph); sway = math.sin(ph) * 0.6
    r = idle_arms(b)
    r.update({'Spine': (-1 * b * 0.5, 0, sway * 0.8), 'Spine1': (-1.2 * b, 0, 0), 'Spine2': (-1.2 * b, 0, 0),
              'Neck': (1.5 * b, 0, 0), 'Head': (1.0 * math.sin(ph * 2) * 0.6, 0, 3 * math.sin(ph + 1)),
              'Hips': (0, 0, -sway * 1.2),
              'LeftUpLeg': (0, 0, -1.5 * sway), 'RightUpLeg': (0, 0, -1.5 * sway),
              'LeftLeg': (2, 0, 0), 'RightLeg': (3 + 2 * sway, 0, 0), 'LeftFoot': (-2, 0, 0), 'RightFoot': (-3 - 2 * sway, 0, 0)})
    return r, (0.008 * sway, 0, -0.003 - 0.002 * abs(sway))

def anim_idle(rig):
    new_action(rig, 'idle'); N = 120
    for f in range(N + 1):
        r, h = idle_pose(2 * math.pi * f / N)
        key_pose(rig, None, f, r, hips=h)

WALK = {}
def anim_walk(rig, body=None):
    """ciclo de marcha con pie plantado: la raiz avanza a velocidad constante v (m/s, +Z glTF) y el pie de apoyo
    queda quieto en el mundo (contacto de talon -> pie plano -> despegue sobre la base de los dedos).
    Piernas resueltas con IK numerica sobre el esqueleto real; el clip sigue siendo 'en el sitio' (sin root motion)."""
    new_action(rig, 'walk')
    sc_ = PR['legs'] / 0.98                       # escala por largo de pierna (adulto = 1)
    N = int(round(34 * math.sqrt(sc_))); T = N / FPS
    L = 1.16 * sc_; v = L / T; D = 0.60; Ts = D * T
    rb = {bb.name[len(P):]: bb.head_local.copy() for bb in rig.data.bones}
    def E(r): return Euler([math.radians(x) for x in r[:3]], r[3] if len(r) > 3 else 'YZX').to_matrix()
    def Rx(d): return Matrix.Rotation(math.radians(d), 3, 'X')
    Fa, J, Te = rb['LeftFoot'], rb['LeftToeBase'], rb['LeftToe_End']
    low = [vv.co for vv in body.data.vertices if vv.co.x > 0.02 and vv.co.z < 0.03 * sc_] if body else []
    heel_y = (max(c.y for c in low) - 0.012 * sc_) if low else Fa.y + 0.04 * sc_
    Hh = Vector((Fa.x, heel_y, 0.0)); dA = Fa - Hh; dJ = J - Hh; dT = Te - Hh
    PHI0, THOFF = 12.0, 36.0; a_, c_ = 0.10, 0.52
    def stance(tau):
        u = tau / Ts
        if u < a_:
            th = -PHI0 * (1 - smooth(u / a_)); return Rx(th) @ dA, th
        if u < c_: return dA.copy(), 0.0
        w = (u - c_) / (1 - c_); th = THOFF * w ** 1.6
        return dJ + Rx(th) @ (dA - dJ), th
    lift = 0.055 * sc_
    def foot_local(tau, yH):
        """ankle local (pie izquierdo) y angulo del pie (+ = talon arriba) en el tiempo tau desde el contacto del talon"""
        if tau <= Ts:
            an, th = stance(tau); return Vector((Fa.x, yH, 0)) + an + Vector((0, v * tau, 0)), th, (th if tau / Ts >= c_ else 0.0)
        u = (tau - Ts) / (T - Ts); eps = 1e-3
        p0 = foot_local(Ts, yH)[0]; p1 = foot_local(0.0, yH)[0]
        m0 = (p0 - foot_local(Ts - eps, yH)[0]) / eps * (T - Ts); m1 = (foot_local(eps, yH)[0] - p1) / eps * (T - Ts)
        h00 = 2*u**3 - 3*u**2 + 1; h10 = u**3 - 2*u**2 + u; h01 = -2*u**3 + 3*u**2; h11 = u**3 - u**2
        p = p0 * h00 + m0 * h10 + p1 * h01 + m1 * h11
        p.z += lift * math.sin(math.pi * u) ** 1.4
        th = THOFF + (-PHI0 - THOFF) * smooth(min(1.0, u / 0.75))
        toe = THOFF * (1 - smooth(min(1.0, u / 0.35)))
        tip = p + Rx(th) @ (Te - Fa)
        if u > 0.15 and tip.z < 0.02 * sc_: p.z += 0.02 * sc_ - tip.z    # holgura de la punta en el balanceo
        return p, th, toe
    hipL = rb['LeftUpLeg']; l1 = (rb['LeftLeg'] - rb['LeftUpLeg']).length; l2 = (rb['LeftFoot'] - rb['LeftLeg']).length
    def dist_at(tau, yH, drop):
        return (foot_local(tau, yH)[0] - (hipL + Vector((0, 0, -drop)))).length
    # yH: equilibra la distancia cadera-tobillo entre el contacto y el despegue
    lo_, hi_ = -1.0, 1.0
    for _ in range(40):
        m = (lo_ + hi_) / 2
        if dist_at(0.0, m, 0) > dist_at(Ts, m, 0): lo_ = m
        else: hi_ = m
    yH = (lo_ + hi_) / 2
    bob = 0.010 * sc_; drop = 0.015 * sc_
    while max(dist_at(t_, yH, drop + bob) for t_ in [Ts * i / 20 for i in range(21)]) > 0.975 * (l1 + l2): drop += 0.002 * sc_
    WALK.update(speed=v, cycle=T, stride=L, frames=N, drop=drop)
    sol = {'Left': [-20.0, 0.0, 20.0], 'Right': [-20.0, 0.0, 20.0]}
    def solve_leg(side, Gh, hips_pos, target):
        p = sol[side]
        def fk(q):
            Ru = E((q[0], q[1], 0)); Rk = E((q[2], 0, 0))
            Hp = hips_pos + Gh @ (rb[side + 'UpLeg'] - rb['Hips'])
            Kp = Hp + Gh @ Ru @ (rb[side + 'Leg'] - rb[side + 'UpLeg'])
            return Kp + Gh @ Ru @ Rk @ (rb[side + 'Foot'] - rb[side + 'Leg'])
        for it in range(30):
            f0 = fk(p); r0 = f0 - target
            if r0.length < 1e-5: break
            Jm = []
            for k in range(3):
                q = list(p); q[k] += 0.05; Jm.append((fk(q) - f0) / 0.05)
            Jt = Matrix((Jm[0], Jm[1], Jm[2]))            # filas = derivadas
            JJ = Jt @ Jt.transposed() + Matrix.Identity(3) * 1e-6
            dq = JJ.inverted() @ (Jt @ (-r0))
            p = [p[0] + dq[0], p[1] + dq[1], max(0.5, p[2] + dq[2])]
        sol[side] = p
        return p, (fk(p) - target).length
    worst = 0.0
    for f in range(N + 1):
        t = f / FPS; ph = 2 * math.pi * t / T; c = math.cos(ph)
        yaw = -5 * c
        hx = 0.012 * sc_ * math.cos(2 * math.pi * (t - Ts / 2) / T)
        hz = -drop + bob * math.cos(4 * math.pi * (t - Ts / 2) / T)
        h = Vector((hx, 0, hz)); Gh = E((0, 0, yaw)); hips_pos = rb['Hips'] + h
        r = idle_arms(0.0, dL=WALK_DL)
        sw = 16.0
        for side, sg in (('Left', -1), ('Right', 1)):
            fw = IDLE['fwd'] + sw * sg * c
            r[side + 'Arm'] = (-fw, r[side + 'Arm'][1], 0)
            e = IDLE['elbow'] + 12 * max(0.0, sg * c)
            r[side + 'ForeArm'] = (0, 0, -e if side == 'Left' else e)
        r['Hips'] = (0, 0, yaw)
        r['Spine'] = (-2, 0, -0.5 * yaw); r['Spine1'] = (-1, 0, -0.3 * yaw); r['Spine2'] = (0, 0, -0.2 * yaw)
        r['Neck'] = (2, 0, 0); r['Head'] = (1, 0, 0)
        for side, toff, sx in (('Left', 0.0, 1), ('Right', T / 2, -1)):
            tau = (t + toff) % T
            pl, th, toe = foot_local(tau, yH)
            target = Vector((sx * pl.x, pl.y, pl.z))
            q, err = solve_leg(side, Gh, hips_pos, target); worst = max(worst, err)
            Gleg = Gh @ E((q[0], q[1], 0)) @ E((q[2], 0, 0))
            Rf = Gleg.transposed() @ Rx(th)
            ef = Rf.to_euler('YZX')
            r[side + 'UpLeg'] = (q[0], q[1], 0); r[side + 'Leg'] = (q[2], 0, 0)
            r[side + 'Foot'] = (math.degrees(ef.x), math.degrees(ef.y), math.degrees(ef.z), 'YZX')
            r[side + 'ToeBase'] = (-toe, 0, 0)
        key_pose(rig, None, f, r, hips=tuple(h), absolute=True)
    rig['walk_speed_mps'] = round(v, 3); rig['walk_cycle_s'] = round(T, 4); rig['walk_stride_m'] = round(L, 3)
    print(f'[P3] walk {NAME}: v={v:.3f} m/s ciclo={T:.3f}s ({N} f) zancada={L:.3f} m caida cadera={drop:.3f} errIK={worst*1000:.2f} mm')

def anim_sit(rig):
    """sentado en silla (asiento ~0,45 m): espalda recta apoyada atras, manos sobre los muslos"""
    new_action(rig, 'sit'); N = 120
    for f in range(N + 1):
        ph = 2 * math.pi * f / N; b = math.sin(ph)
        r = arms_down(80, 18, 36, 10)
        r.update({'LeftHand': (0, 0, -6), 'RightHand': (0, 0, 6)})
        r.update({'Hips': (6, 0, 0),
                  'LeftUpLeg': (-96, 0, 3), 'RightUpLeg': (-96, 0, -3), 'LeftLeg': (92, 0, 0), 'RightLeg': (92, 0, 0),
                  'LeftFoot': (-2, 0, 0), 'RightFoot': (-2, 0, 0),
                  'Spine': (-4 - 0.5 * b, 0, 0), 'Spine1': (-2 - 0.8 * b, 0, 0), 'Spine2': (-1 - 0.8 * b, 0, 0),
                  'Neck': (5 + 1.2 * b, 0, 0), 'Head': (2, 0, 4 * math.sin(ph + 0.5))})
        drop = bone_head('LeftUpLeg').z - (bone_head('LeftLeg').z - 0.005 * PR['wf'])
        key_pose(rig, None, f, r, hips=(0, 0.07 * PR['wf'], -drop), absolute=True)

def anim_sit_floor(rig):
    """sentado en el suelo con las piernas cruzadas (cadera a la altura del suelo + gluteos), manos sobre las rodillas"""
    new_action(rig, 'sit-floor'); N = 120
    for f in range(N + 1):
        ph = 2 * math.pi * f / N; b = math.sin(ph)
        r = arms_down(70, 30, 35, 8)
        r.update({'LeftHand': (0, 0, -10), 'RightHand': (0, 0, 10),
                  'LeftUpLeg': (-95, -48, -90, 'ZYX'), 'RightUpLeg': (-95, 48, 90, 'ZYX'),
                  'LeftLeg': (140, 0, 0), 'RightLeg': (140, 0, 0),
                  'LeftFoot': (20, 0, 0), 'RightFoot': (20, 0, 0),
                  'Spine': (3 - 0.5 * b, 0, 0), 'Spine1': (1 - 0.8 * b, 0, 0), 'Spine2': (-1 - 0.8 * b, 0, 0),
                  'Neck': (2 + 1.2 * b, 0, 0), 'Head': (3, 0, 5 * math.sin(ph + 0.8))})
        drop = bone_head('LeftUpLeg').z - 0.10 * PR['wf']
        key_pose(rig, None, f, r, hips=(0, 0.02 * PR['wf'], -drop), absolute=True)

def lerp_rot(a, b, k):
    """mezcla dos dicts de rotaciones (mismo orden de Euler por hueso)"""
    out = {}
    for n in set(a) | set(b):
        ra = a.get(n, (0, 0, 0)); rb_ = b.get(n, ra)
        order = rb_[3] if len(rb_) > 3 else (ra[3] if len(ra) > 3 else None)
        v = tuple(lerp(ra[i], rb_[i], k) for i in range(3))
        out[n] = v + ((order,) if order else ())
    return out

def anim_talk(rig):
    """habla con gestos de la mano derecha; empieza y termina exactamente en la pose idle (fase 0)"""
    new_action(rig, 'talk'); N = 96
    base, h0 = idle_pose(0.0)
    sh = IDLE['sh']; L0 = IDLE['L'] - sh
    for f in range(N + 1):
        t = f / N; ph = 2 * math.pi * t
        w = smooth(min(1.0, t / 0.16)) * smooth(min(1.0, (1 - t) / 0.16))
        g = w * (0.78 + 0.22 * math.sin(ph * 3))
        g2 = math.sin(ph * 5) * w
        g3 = w * (0.5 - 0.5 * math.cos(ph * 2 + 1.0)) * 0.7
        r = dict(base)
        r['RightArm'] = (-(IDLE['fwd'] + 16 * g), -(L0 - 16 * g), 0)
        r['RightForeArm'] = (0, 8 * g, IDLE['elbow'] + 62 * g + 6 * g2 * g, 'YZX')
        r['RightHand'] = (0, 0, 6 + 10 * g2)
        r['LeftArm'] = (-(IDLE['fwd'] + 8 * g3), L0 - 6 * g3, 0)
        r['LeftForeArm'] = (0, 0, -(IDLE['elbow'] + 34 * g3))
        r['Spine2'] = (-1 * g2 * 0.6, 0, -3 * g); r['Neck'] = (0, 0, 2 * g)
        r['Head'] = (base['Head'][0] + 3 * math.sin(ph * 4) * w, 0, base['Head'][2] * (1 - w) + w * (-4 * g + 3 * math.sin(ph * 2)))
        r['Spine'] = (0, 0, 1.5 * math.sin(ph) * w)
        key_pose(rig, None, f, r, hips=h0)

def anim_point(rig):
    new_action(rig, 'point'); N = 60
    base, h0 = idle_pose(0.0); sh = IDLE['sh']; L0 = IDLE['L'] - sh
    for f in range(N + 1):
        t = f / N
        k = smooth(min(1, t / 0.3)) if t < 0.75 else smooth(max(0, (1 - t) / 0.25))
        r = dict(base)
        r['RightShoulder'] = (0, -sh * (1 - k), 6 * k)
        r['RightArm'] = (-IDLE['fwd'] * (1 - k) - k * 4, -L0 * (1 - k) + k * 8, k * 78)
        r['RightForeArm'] = (0, 0, IDLE['elbow'] * (1 - k) + 4 * k)
        r['RightHand'] = (0, 4 * k, 6 * (1 - k))
        r['Spine2'] = (0, 0, 6 * k); r['Head'] = (-3 * k, 0, base['Head'][2] * (1 - k) + 4 * k); r['Neck'] = (0, 0, 3 * k)
        key_pose(rig, None, f, r, hips=h0)

def anim_wave(rig):
    new_action(rig, 'wave'); N = 60
    base, h0 = idle_pose(0.0); sh = IDLE['sh']; L0 = IDLE['L'] - sh
    for f in range(N + 1):
        t = f / N; ph = 2 * math.pi * t * 2
        k = smooth(min(1, t / 0.2)) if t < 0.8 else smooth(max(0, (1 - t) / 0.2))
        w = math.sin(ph) * k
        r = dict(base)
        r['RightShoulder'] = (0, -sh * (1 - k) + 4 * k, 0)
        r['RightArm'] = (-IDLE['fwd'] * (1 - k) - 10 * k, -L0 * (1 - k) - 4 * k, 14 * k)
        r['RightForeArm'] = (-80 * k, 100 * k + 28 * w, IDLE['elbow'] * (1 - k), 'XYZ')
        r['RightHand'] = (0, 12 * w, 6 * (1 - k))
        r['Head'] = (0, 0, base['Head'][2] * (1 - k) - 6 * k); r['Spine2'] = (0, 0, -2 * k)
        key_pose(rig, None, f, r, hips=h0)

# ---------------------------------------------------------------- prueba de colision brazos / torso
DEBUG_PROBE = []
def clip_probe(rig, body):
    """devuelve f(poses)->(mm max, n vertices) de penetracion de brazos/manos en torso, chaleco, cinturon y muslos"""
    from mathutils.bvhtree import BVHTree
    me = body.data; names = [g.name[len(P):] if g.name.startswith(P) else g.name for g in body.vertex_groups]
    dom = []
    for v in me.vertices:
        best = max(v.groups, key=lambda g: g.weight, default=None)
        dom.append(names[best.group] if best else '')
    ARMS = {'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand'}
    TOR = {'Hips', 'Spine', 'Spine1', 'Spine2', 'LeftUpLeg', 'RightUpLeg'}
    shL, shR = rig.data.bones[P + 'LeftArm'].head_local, rig.data.bones[P + 'RightArm'].head_local
    arm_idx = [i for i, v in enumerate(me.vertices) if dom[i] in ARMS and min((v.co - shL).length, (v.co - shR).length) > 0.10 * PR['wf']]
    mname = [m.name if m else '' for m in me.materials]
    classes = {}
    for poly in me.polygons:
        if all(dom[i] in TOR for i in poly.vertices):
            mn = mname[poly.material_index]
            key = mn if mn in ('vest', 'belt', 'buckle', 'tie', 'skirt', 'sash') else 'body'
            classes.setdefault(key, []).append(list(poly.vertices))
    def probe(poses):
        worst, cnt = 0.0, 0
        for rots, hips in poses:
            if rots is None: bpy.context.scene.frame_set(hips)
            else: set_pose(rig, rots, hips)
            dg = bpy.context.evaluated_depsgraph_get(); dg.update()
            em = body.evaluated_get(dg).to_mesh(); co = [v.co.copy() for v in em.vertices]; body.evaluated_get(dg).to_mesh_clear()
            for key, polys in classes.items():
                t = BVHTree.FromPolygons(co, polys)
                for i in arm_idx:
                    loc, n, _, d = t.find_nearest(co[i], 0.02)
                    if loc is None: continue
                    dd = (co[i] - loc).dot(n)
                    if dd < -0.002:
                        worst = max(worst, -dd); cnt += 1
                        if DEBUG_PROBE: DEBUG_PROBE.append((key, dom[i], round(-dd * 1000, 1), tuple(round(x, 3) for x in co[i])))
        return worst * 1000, cnt
    return probe

# ---------------------------------------------------------------- vestuario por personaje
SKIN_L, SKIN_M = srgb('#d9a98a'), srgb('#c99575')
OUTFITS = {
  'civil-base-p3': dict(top='shirt', bottom='pants', sleeve=0.48, hair='short', colors=dict(shirt='#cfd6dd', pants='#3b3f47', hair='#4a3426'), collar=True),
  'kranz': dict(top='shirt', bottom='pants', sleeve=1.0, hair='crew', colors=dict(shirt='#f7f7f5', pants='#2f3136', hair='#8f7a58', tie='#1c1d22', vest='#e2dccd'), tie=True, vest=True, collar=True, hair_top=0.022),
  'bales': dict(top='shirt', bottom='pants', sleeve=0.45, hair='short', colors=dict(shirt='#f1f1ee', pants='#34373e', hair='#2b211b', tie='#2a2f3e'), tie=True, glasses='heavy', headset=True, collar=True),
  'duke': dict(top='shirt', bottom='pants', sleeve=0.45, hair='side', colors=dict(shirt='#e9ecee', pants='#3c3a36', hair='#2a211c', tie='#3c3328'), tie=True, headset=True, collar=True),
  'garman': dict(top='shirt', bottom='pants', sleeve=0.45, hair='short', colors=dict(shirt='#d9e2ea', pants='#4a4740', hair='#5a4030'), glasses='light', collar=True, tie=True, colors_tie='#5a4a3a'),
  'jan': dict(top='dress', bottom='skin', legs='skin', sleeve=0.18, hair='bob', colors=dict(dress='#9db8c9', hair='#4d3626'), skirt=True, waist_z=1.0),
  'rick': dict(top='tshirt', bottom='shorts', legs='skin', hem=0.62, sleeve=0.42, hair='boy', colors=dict(tshirt='#c74a3a', shorts='#5a6b7d', hair='#7a5a3a')),
  'mark': dict(top='tshirt', bottom='shorts', legs='skin', hem=0.66, sleeve=0.42, hair='boy', colors=dict(tshirt='#e7d9a8', shorts='#3f5a7a', hair='#c9a46a')),
  # relleno MOCR: camisa de manga corta + corbata + auriculares; 3 variantes de camisa como nodos shirt-a/b/c
  'controller-extra': dict(top='shirt', bottom='pants', sleeve=0.45, hair='short', colors=dict(shirt='#f2f2ee', pants='#3a3d44', hair='#3a2c22', tie='#2e3340'),
                           tie=True, collar=True, headset=True,
                           variants=[('shirt-a', 'shirt-white', '#f2f2ee'), ('shirt-b', 'shirt-blue', '#a9bfd6'), ('shirt-c', 'shirt-tan', '#d8cba6')]),
}
# rasgos de cara por personaje: color de iris, cejas (grosor, arco, inclinacion), boca (ancho)
FACE = {
  'civil-base-p3': dict(iris='#4a3a2c', brow_t=1.0, brow_arch=0.5, brow_tilt=0, mouth=1.0),
  'kranz': dict(iris='#3d5a78', brow_t=1.45, brow_arch=0.15, brow_tilt=-4, brow_low=0.004, mouth=1.08),
  'bales': dict(iris='#3e2f22', brow_t=0.95, brow_arch=0.6, brow_tilt=2, mouth=0.95),
  'duke': dict(iris='#3a4f66', brow_t=1.1, brow_arch=1.0, brow_tilt=6, mouth=1.05, smile=1),
  'garman': dict(iris='#5a4a32', brow_t=0.8, brow_arch=0.7, brow_tilt=0, mouth=0.92),
  'jan': dict(iris='#4f6648', brow_t=0.65, brow_arch=0.9, brow_tilt=6, mouth=0.92, lash=1.4),
  'rick': dict(iris='#4a6a86', brow_t=0.8, brow_arch=0.5, brow_tilt=2, mouth=0.9),
  'mark': dict(iris='#4a6a86', brow_t=0.65, brow_arch=0.6, brow_tilt=4, mouth=0.85),
  'controller-extra': dict(iris='#3e3328', brow_t=1.0, brow_arch=0.4, brow_tilt=0, mouth=1.0),
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
    extra = {'eye-white': mat('eye-white', srgb('#efe9e0'), 0.3), 'iris': mat('iris', srgb(FACE[NAME]['iris']), 0.3),
             'pupil': mat('pupil', srgb('#0b0908'), 0.2), 'lash': mat('lash', srgb('#1e1611'), 0.6), 'mouth': mat('mouth', srgb('#5a2c27'), 0.6),
             'lips': mat('lips', srgb('#b0544e' if PR['female'] else '#b07266'), 0.45)}
    rig = build_armature()
    body = make_body()
    hi = body.copy(); hi.data = body.data.copy(); hi.name = 'body-hi'; bpy.context.collection.objects.link(hi)
    decimate(body, {'mark': 2350, 'rick': 2260, 'kranz': 1800, 'bales': 1950, 'garman': 2050, 'duke': 2200, 'jan': 2300, 'controller-extra': 600}.get(NAME, 2350),
             head_bias=0.0)   # decimado uniforme: con sesgo a la cara aparecian pliegues en el torso
    # pliegues de la cara tras decimar (p. ej. Rick: un triangulo bajo el labio inferior quedaba doblado bajo su vecino
    # y se veia como un hueco negro). Caras del frente de la cabeza que miran hacia atras -> sus vertices se llevan
    # al promedio de sus vecinos (Laplaciano) hasta que el pliegue se abre.
    bm_ = bmesh.new(); bm_.from_mesh(body.data); z0_, z1_ = mz(1.55), mz(1.72)
    def folds_():
        bm_.normal_update()
        return [f for f in bm_.faces if (c_ := f.calc_center_median()).y < -0.03 and abs(c_.x) < 0.045 and z0_ < c_.z < z1_ and f.normal.y > 0.2]
    nf0 = len(folds_())
    for _ in range(8):
        fl = folds_()
        if not fl: break
        vs_ = {v for f in fl for v in f.verts}
        bmesh.ops.smooth_vert(bm_, verts=list(vs_), factor=0.6, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    print(f"[P3] pliegues en la cara: {nf0} -> {len(folds_())}")
    bm_.to_mesh(body.data); bm_.free()
    outfit = dict(o)
    outfit['waist'] = mz(o.get('waist_z', 1.035))
    if 'hem' in o: outfit['hem'] = o['hem']
    if NAME == 'jan': outfit['bottom'] = 'skin'; outfit['waist'] = mz(0.55)  # bajo la falda el cuerpo va del color del vestido
    if o.get('legs'): outfit['legs'] = o['legs']
    others = []
    W = PR['wf']; X = Vector((1, 0, 0)); Z = Vector((0, 0, 1))
    # --- capas de ropa sobre el cuerpo low-poly (antes de cortar regiones), con bordes por planos
    sh = abs(bone_head('LeftArm').x); wr = abs(bone_head('LeftHand').x); sl = o.get('sleeve', 0.5)
    xs = sh + (wr - sh) * min(sl, 1.0); cw = 0.022 * PR['arm']
    if o['top'] in mats and 0 < sl:
        others.append(shell_cut(body, 'cuff', [((xs - cw, 0, 0), X), ((xs, 0, 0), X), ((-(xs - cw), 0, 0), X), ((-xs, 0, 0), X)],
                                lambda c: xs - cw < abs(c.x) < xs, 0.005, mats[o['top']], region=lambda c: c.z > mz(1.25)))
    if NAME != 'jan':
        wz = outfit['waist']
        TOR = lambda c: abs(c.x) < 0.3 * W and c.z < mz(1.3)
        if o['bottom'] == 'pants':
            others.append(shell_cut(body, 'belt', [((0, 0, wz - 0.002), Z), ((0, 0, wz + 0.03), Z)], lambda c: wz - 0.002 < c.z < wz + 0.03,
                                    0.0065, mat('belt', srgb('#2a1d15'), 0.5), region=TOR))
            bm = bmesh.new(); ell(bm, (0, -0.3, wz + 0.014), (0.019, 0.006, 0.014), seg=8, ring=4)
            bk = obj_from_bm(bm, 'buckle'); bk.data.materials.append(mat('buckle', srgb('#b8a77a'), 0.3, 1.0))
            sw = bk.modifiers.new('sw', 'SHRINKWRAP'); sw.target = body; sw.wrap_method = 'PROJECT'; sw.use_project_y = True
            sw.use_negative_direction = True; sw.use_positive_direction = True; sw.offset = 0.011; apply_mods(bk); others.append(bk)
            az = mz(0.115)
            others.append(shell_cut(body, 'pant-hem', [((0, 0, az), Z), ((0, 0, az + 0.035), Z)], lambda c: az < c.z < az + 0.035,
                                    0.006, mats['pants'], region=lambda c: c.z < mz(0.3)))
        else:
            others.append(shell_cut(body, 'waistband', [((0, 0, wz - 0.002), Z), ((0, 0, wz + 0.025), Z)], lambda c: wz - 0.002 < c.z < wz + 0.025,
                                    0.005, mats[o['bottom']], region=TOR))
            hz = mz(o['hem'])
            others.append(shell_cut(body, 'shorts-hem', [((0, 0, hz), Z), ((0, 0, hz + 0.025), Z)], lambda c: hz < c.z < hz + 0.025,
                                    0.005, mats[o['bottom']], region=lambda c: c.z < mz(0.95)))
    if o.get('vest'):
        vm = mat('vest', srgb(C['vest']), 0.85)
        V = VEST; zb, za, ax, sx_, v0, vz, vsl = mz(V['bot']), mz(V['arm_z']), V['arm_x'] * W, V['side_x'] * W, V['v0'], mz(V['vz']), V['vs']
        def kv(c):
            if c.z < zb or c.z > mz(1.475): return False
            if abs(c.x) > sx_: return False
            if abs(c.x) > ax and c.z > za: return False     # sisas
            if c.y < 0 and abs(c.x) < v0 + (c.z - vz) * vsl: return False  # escote en V
            return True
        planes = [((0, 0, zb), Z), ((0, 0, za), Z), ((0, 0, mz(1.475)), Z), ((ax, 0, 0), X), ((-ax, 0, 0), X), ((sx_, 0, 0), X), ((-sx_, 0, 0), X),
                  ((v0, 0, vz), Vector((1, 0, -vsl)).normalized()), ((-v0, 0, vz), Vector((-1, 0, -vsl)).normalized())]
        v = shell_cut(body, 'vest', planes, kv, 0.012, vm, region=lambda c: abs(c.x) < 0.24 * W and mz(0.95) < c.z < mz(1.5))
        others.append(v)
        bm = bmesh.new()
        for k in range(4): ell(bm, (0, -0.3, mz(1.17 - k * 0.045)), (0.006, 0.004, 0.006), seg=6, ring=3)
        bt = obj_from_bm(bm, 'buttons'); bt.data.materials.append(mat('button', srgb('#d8d4c8'), 0.4))
        sw = bt.modifiers.new('sw', 'SHRINKWRAP'); sw.target = v; sw.wrap_method = 'PROJECT'; sw.use_project_y = True
        sw.use_negative_direction = True; sw.use_positive_direction = True; sw.offset = 0.0025; apply_mods(bt)
        others.append(bt)
    if o.get('collar'): others.append(collar(mats['shirt'], hi, body))
    if o.get('tie'):
        tm = mat('tie', srgb(C.get('tie', o.get('colors_tie', '#333333'))), 0.6)
        tob = tie(body, tm, 1.45, 1.05 if not o.get('vest') else 1.165, 0.02); push_out(tob, body, 0.009); others.append(tob)
    assign_regions(body, outfit, dict(mats))
    others.append(hair(hi, o['hair'], hair_m))
    extra['skin'] = mats['skin']; fd = face_details(extra, hair_m)
    if o['hair'] == 'bob': bpy.data.objects.remove(fd.pop(), do_unlink=True)   # orejas tapadas por la melena
    others += fd
    if o.get('glasses'):   # Bales: pasta negra gruesa; Garman: montura metalica fina (se distinguen de lejos)
        gm = mat('glasses', srgb('#121212'), 0.35) if o['glasses'] == 'heavy' else mat('glasses-metal', srgb('#a7a39a'), 0.3, 1.0)
        others.append(glasses(gm, o['glasses'] == 'heavy'))
    if o.get('headset'): others += headset(mat('headset', srgb('#2b2b2b'), 0.5), mat('headset-ear', srgb('#3a3a3a'), 0.4))
    if o.get('skirt'):
        sk = skirt(hi, mats['dress'], 1.06, 0.47, 0.02); push_out(sk, body, 0.012); others.append(sk)
        zs = mz(1.06)   # cinturon de tela del vestido sobre la union cuerpo-falda
        others.append(shell_cut(body, 'sash', [((0, 0, zs - 0.012), Z), ((0, 0, zs + 0.02), Z)], lambda c: zs - 0.012 < c.z < zs + 0.02,
                                0.016, mat('sash', srgb('#7f9db3'), 0.7), region=lambda c: abs(c.x) < 0.3 * W and c.z < mz(1.3)))
    bpy.data.objects.remove(hi, do_unlink=True)
    # suela a ras de suelo: el decimado/redondeo de la suela deja el punto mas bajo a +-7 mm; se corrige moviendo
    # las mallas (no los huesos) para que la suela en reposo toque z=0 (pies sin flotar ni hundirse en idle/walk)
    zmin = min((ob_.matrix_world @ v.co).z for ob_ in [body] + others if ob_.type == 'MESH' for v in ob_.data.vertices)
    if abs(zmin) < 0.02:
        for ob_ in [body] + others:
            if ob_.type == 'MESH':
                d_ = ob_.matrix_world.inverted().to_3x3() @ Vector((0, 0, zmin))
                for v in ob_.data.vertices: v.co -= d_
    print(f"[P3] suela en reposo {zmin * 1000:+.1f} mm -> 0")
    body = bind(body, rig, others)
    body.name = NAME; body.data.name = NAME
    rig.name = 'armature'
    # brazos de idle: el L mas cercano al cuerpo sin atravesar torso/chaleco/muslos (holgura >= 2 mm)
    probe = clip_probe(rig, body)
    rig.animation_data_create()
    for Lc in ([81] if EXTRA else [85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74]):
        IDLE['L'] = float(Lc)
        if '--debug-probe' in argv: DEBUG_PROBE[:] = [None]
        mm, n = probe([idle_pose(math.pi * k / 2) for k in range(4)] + [(idle_arms(0.0, dL=WALK_DL), (0, 0, 0))])
        if '--debug-probe' in argv:
            from collections import Counter
            dbg = [d for d in DEBUG_PROBE if d]; print('[P3] L', Lc, round(mm, 1), n, Counter((d[0], d[1]) for d in dbg).most_common(6), sorted(dbg, key=lambda d: -d[2])[:3])
            DEBUG_PROBE[:] = []
        if n == 0: break
    print(f"[P3] idle brazos L={IDLE['L']:.0f} deg (penetracion {mm:.1f} mm, {n} vert)")
    globals()['WALK_DL'] = -3.0 - 0.75 * max(0.0, 85.0 - IDLE['L'])   # L=81 -> -6 (Kranz: la mano rozaba el chaleco en el balanceo)
    anims = (anim_idle, anim_sit, anim_talk) if EXTRA else (anim_idle, anim_walk, anim_sit, anim_sit_floor, anim_talk, anim_point, anim_wave)
    for a in anims:
        a(rig, body) if a is anim_walk else a(rig)
    # informe de colision por clip (8 fotogramas por clip)
    rep_ = {}
    for act in bpy.data.actions:
        rig.animation_data.action = act; f0, f1 = act.frame_range
        rep_[act.name] = probe([(None, int(f0 + (f1 - f0) * i / 8)) for i in range(8)])
    rig.animation_data.action = None
    print('[P3] colision brazos por clip (mm, n):', {k: (round(v[0], 1), v[1]) for k, v in rep_.items()})
    rig['idle_arm_deg'] = IDLE['L']
    # relleno MOCR: la camisa va en su propio nodo 'shirt' (material shirt-white). Las 3 variantes de color se
    # anaden despues como KHR_materials_variants (shirt-a/b/c) y como extras.shirt_variants (hex) para el codigo.
    VAR = []
    if o.get('variants'):
        bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = body; body.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT')
        body.active_material_index = [m.name for m in body.data.materials].index('shirt'); bpy.ops.object.material_slot_select()
        bpy.ops.mesh.separate(type='SELECTED'); bpy.ops.object.mode_set(mode='OBJECT')
        sh_ob = [x for x in bpy.context.selected_objects if x is not body][0]
        sh_ob.name = 'shirt'; sh_ob.data.name = 'shirt'
        bpy.data.materials['shirt'].name = 'shirt-white'
        for ob in (body, sh_ob):
            bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = ob; ob.select_set(True)
            bpy.ops.object.material_slot_remove_unused()
        rig['shirt_variants'] = {n[-1]: c for n, m, c in o['variants']}
        rig['shirt_materials'] = {n[-1]: m for n, m, c in o['variants']}
        VAR.append(sh_ob)
    build.variants = VAR
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
    for ob in getattr(build, 'variants', []): ob.select_set(True)
    bpy.ops.export_scene.gltf(export_extras=True, filepath=f'{ROOT}/raw/people/out/{NAME}-raw.glb', export_format='GLB', use_selection=True,
        export_yup=True, export_apply=False, export_animations=True, export_animation_mode='ACTIONS',
        export_force_sampling=True, export_skins=True, export_all_influences=False, export_def_bones=False,
        export_anim_single_armature=True, export_reset_pose_bones=True, export_morph=False,
        export_nla_strips=True, export_optimize_animation_size=False)

if __name__ == '__main__':
    body, rig = build()
    tris = sum(len(p.vertices) - 2 for p in body.data.polygons)
    print(f'[P3] {NAME} tris={tris} H={max(v.co.z for v in body.data.vertices):.3f}')
    if '--no-export' not in argv: export(body, rig)
