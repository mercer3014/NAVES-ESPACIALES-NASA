# Guardian de Tranquilidad (No Canon) - generador reproducible.
# Uso: flock /tmp/blender.lock ~/bin/blender -b -P guardian.py [-- --no-export]
# Blender Z-arriba, frente -Y (=> +Z glTF). Metros. Origen en el suelo entre las 4 patas.
import bpy, bmesh, math, os, sys, random
from mathutils import Vector, Matrix, Euler, Quaternion, noise

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FPS = 30
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
random.seed(11)

def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene; sc.render.fps = FPS; sc.unit_settings.system = 'METRIC'
    return sc

def srgb(r, g, b):
    f = lambda v: ((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92
    return (f(r / 255), f(g / 255), f(b / 255))

def mat(name, rgb, rough=0.8, metal=0.0, emit=None, emit_s=1.0, double=False, vcol=None, image=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if vcol:
        vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = vcol
        nt.links.new(vc.outputs['Color'], b.inputs['Base Color'])
    if image:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = image
        nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
        nt.links.new(t.outputs['Color'], b.inputs['Emission Color'])
        b.inputs['Emission Strength'].default_value = emit_s
    elif emit:
        b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = emit_s
    m.use_backface_culling = not double
    m.diffuse_color = (*rgb, 1)
    return m

def link(ob):
    bpy.context.scene.collection.objects.link(ob); return ob

def obj_from_bm(bm, name, mats=()):
    me = bpy.data.meshes.new(name); bm.normal_update(); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    return link(bpy.data.objects.new(name, me))

def ell(bm, c, r, rot=(0, 0, 0), seg=20, ring=12):
    m = Matrix.Translation(Vector(c)) @ Euler([math.radians(a) for a in rot]).to_matrix().to_4x4() @ Matrix.Diagonal((*r, 1))
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=ring, radius=1.0, matrix=m)

def cone(bm, p0, r0, p1, r1, seg=20):
    p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    m = Matrix.Translation((p0 + p1) / 2) @ q.to_matrix().to_4x4()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r0, radius2=r1, depth=d.length, matrix=m)
    ell(bm, p0, (r0, r0, r0)); ell(bm, p1, (r1, r1, r1))

def apply_mods(ob):
    bpy.context.view_layer.objects.active = ob
    for m in list(ob.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)

def tris(ob): return sum(len(p.vertices) - 2 for p in ob.data.polygons)

# ------------------------------------------------------------------ esqueleto (izquierda del personaje = +X)
J = {  # nombre: (padre, cabeza, cola, conectado)
 'root':    (None,      (0, 0, 0),         (0, 0, 1.5), False),
 'hips':    ('root',    (0, 3.6, 6.8),     (0, 2.0, 8.6), False),
 'spine-1': ('hips',    (0, 2.0, 8.6),     (0, 0.4, 10.2), True),
 'spine-2': ('spine-1', (0, 0.4, 10.2),    (0, -1.2, 11.4), True),
 'spine-3': ('spine-2', (0, -1.2, 11.4),   (0, -2.4, 12.2), True),
 'neck':    ('spine-3', (0, -2.4, 12.2),   (0, -3.6, 13.3), True),
 'head':    ('neck',    (0, -3.6, 13.3),   (0, -5.6, 13.6), True),
 'core':    ('spine-3', (0, -3.1, 9.35),   (0, -3.9, 9.35), False),
}
LIMBS = {
 'upper-arm-l': ('spine-3',     (3.4, -1.6, 11.4), (4.9, -2.4, 6.2), False),
 'forearm-l':   ('upper-arm-l', (4.9, -2.4, 6.2),  (5.1, -5.0, 1.5), True),
 'hand-l':      ('forearm-l',   (5.1, -5.0, 1.5),  (5.2, -6.6, 0.45), True),
 'thigh-l':     ('hips',        (2.5, 3.6, 6.4),   (3.0, 1.4, 3.6), False),
 'shin-l':      ('thigh-l',     (3.0, 1.4, 3.6),   (3.0, 3.6, 1.0), True),
 'foot-l':      ('shin-l',      (3.0, 3.6, 1.0),   (3.0, 1.5, 0.35), True),
}
for n, (p, h, t, c) in LIMBS.items():
    J[n] = (p, h, t, c)
    J[n[:-2] + '-r'] = (p[:-2] + '-r' if p.endswith('-l') else p, (-h[0], h[1], h[2]), (-t[0], t[1], t[2]), c)

def build_armature():
    arm = bpy.data.armatures.new('guardian-rig'); rig = link(bpy.data.objects.new('guardian', arm))
    bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
    eb = {}
    for n, (p, h, t, c) in J.items():
        e = arm.edit_bones.new(n); e.head = h; e.tail = t; eb[n] = e
    for n, (p, h, t, c) in J.items():
        if p: eb[n].parent = eb[p]; eb[n].use_connect = c
        e = eb[n]; d = (e.tail - e.head).normalized()
        e.align_roll(Vector((0, -1, 0)) if abs(d.z) > 0.7 else Vector((0, 0, 1)))
    bpy.ops.object.mode_set(mode='OBJECT')
    for b in arm.bones: b.use_deform = b.name not in ('root', 'core')
    return rig

# ------------------------------------------------------------------ cuerpo
CHEST = ((0, -1.2, 10.8), (3.3, 2.4, 2.6))
HUMP = ((0, 0.3, 12.6), (2.6, 2.2, 1.9))
HEAD = ((0, -4.6, 13.6), (1.45, 1.6, 1.55))   # QA: cabeza mas alta y adelantada (antes (0,-4.1,12.3)), legible desde 3/4
CAV_C, CAV_R = Vector((0, -5.75, 13.35)), 1.05

def body_blobs(bm):
    ell(bm, (0, 3.5, 7.0), (2.6, 2.1, 2.0))            # pelvis
    ell(bm, (0, 1.4, 9.0), (2.9, 2.6, 2.5))            # vientre
    ell(bm, *CHEST)                                     # pecho
    ell(bm, *HUMP)                                      # joroba
    cone(bm, (0, -2.0, 12.3), 1.3, (0, -3.9, 13.4), 1.1)   # cuello
    ell(bm, *HEAD)                                      # cabeza-capucha
    ell(bm, (0, -5.45, 14.35), (1.55, 0.8, 0.5))       # ceja
    for s in (1, -1):
        ell(bm, (s * 3.4, -1.6, 11.5), (1.75, 1.7, 1.6))                # deltoides
        cone(bm, (s * 3.4, -1.6, 11.3), 1.35, (s * 4.9, -2.4, 6.2), 1.0)  # brazo
        cone(bm, (s * 4.9, -2.4, 6.2), 1.1, (s * 5.1, -5.0, 1.6), 0.95)   # antebrazo (grueso, gorila)
        ell(bm, (s * 5.0, -3.4, 4.6), (1.25, 1.3, 1.7))                 # musculo del antebrazo
        ell(bm, (s * 5.15, -5.6, 0.82), (1.2, 1.45, 0.86))              # puño apoyado
        ell(bm, (s * 2.4, 3.4, 6.6), (1.6, 1.7, 1.5))                   # cadera
        cone(bm, (s * 2.5, 3.5, 6.4), 1.3, (s * 3.0, 1.4, 3.6), 0.95)    # muslo
        cone(bm, (s * 3.0, 1.4, 3.6), 0.9, (s * 3.0, 3.6, 1.0), 0.7)     # espinilla
        ell(bm, (s * 3.0, 2.6, 0.5), (1.0, 1.75, 0.56))                 # pie
    # protuberancias de roca en la espalda y hombros
    for i in range(16):
        u = random.uniform(-1, 1); a = random.uniform(0.15, 1.0)
        c, r = (HUMP if i % 2 else CHEST)
        p = Vector((c[0] + r[0] * u * 0.8, c[1] + r[1] * random.uniform(-0.3, 0.9), c[2] + r[2] * a * 0.95))
        s = random.uniform(0.5, 0.95)
        ell(bm, p, (s, s * random.uniform(0.7, 1.2), s * 0.7), rot=(random.uniform(0, 60), 0, random.uniform(0, 180)), seg=10, ring=6)

def make_body(mats, target=4900):
    bm = bmesh.new(); body_blobs(bm)
    ob = obj_from_bm(bm, 'guardian-body')
    r = ob.modifiers.new('rm', 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = 0.13; r.adaptivity = 0
    apply_mods(ob)
    # cavidad del rostro
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=14, radius=CAV_R, matrix=Matrix.Translation(CAV_C) @ Matrix.Diagonal((1.0, 1.0, 1.05, 1)))
    cut = obj_from_bm(bm, 'cut')
    bo = ob.modifiers.new('cav', 'BOOLEAN'); bo.operation = 'DIFFERENCE'; bo.object = cut; bo.solver = 'EXACT'
    apply_mods(ob); bpy.data.objects.remove(cut, do_unlink=True)
    # relieve de roca (ruido determinista)
    me = ob.data
    for v in me.vertices:
        p = v.co
        d = noise.noise(p * 0.33) * 0.32 + noise.noise(p * 0.9 + Vector((7, 3, 1))) * 0.12
        if (p - CAV_C).length < CAV_R + 0.15: d *= 0.25
        v.co = p + v.normal * d
    dec = ob.modifiers.new('dec', 'DECIMATE'); dec.ratio = target / max(1, tris(ob))
    apply_mods(ob)
    for v in me.vertices:
        if v.co.z < 0: v.co.z = 0.0
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    for p in me.polygons:
        p.use_smooth = False
        c = p.center
        p.material_index = 1 if (c - CAV_C).length < CAV_R + 0.08 and c.y < CAV_C.y + 1.2 else 0
    # color de vertice: regolito gris beige con variacion
    ca = me.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER')
    base = Vector((174, 165, 149))
    for poly in me.polygons:
        c = poly.center
        f = 0.86 + 0.22 * noise.noise(c * 0.45 + Vector((2, 2, 2))) + 0.08 * noise.noise(c * 2.1)
        f *= 0.9 + 0.1 * min(1.0, c.z / 4.0)           # polvo mas oscuro abajo
        col = srgb(*(max(0, min(255, x * f)) for x in base))
        for li in poly.loop_indices: ca.data[li].color = (*col, 1)
    return ob

def slab(name, center, normal, size, mat_, seed, up=(0, 0, 1), spin=0.0):
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0)
    rnd = random.Random(seed)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
        v.co += v.co.normalized() * rnd.uniform(-0.06, 0.06) * max(size)
        if v.co.z < -size[2] * 0.2: v.co.z = -size[2] * 0.2 - (abs(v.co.z) - size[2] * 0.2) * 0.3   # base mas plana
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(14), verts=bm.verts, edges=bm.edges)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    n = Vector(normal).normalized()
    q = Vector((0, 0, 1)).rotation_difference(n) @ Quaternion((0, 0, 1), spin)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(Vector(center)) @ q.to_matrix().to_4x4(), verts=bm.verts)
    ob = obj_from_bm(bm, name, [mat_])
    for p in ob.data.polygons: p.use_smooth = False
    return ob

def dsky(mat_):
    w, d, h = 3.1, 0.9, 2.6
    bm = bmesh.new(); uv = bm.loops.layers.uv.new('UVMap')
    r = bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(w, d, h), verts=r['verts'])
    for f in bm.faces:
        n = f.normal
        for lp in f.loops:
            co = lp.vert.co
            if n.y < -0.9:  # frente
                lp[uv].uv = (co.x / w + 0.5, co.z / h + 0.5)
            else:
                lp[uv].uv = (0.985, 0.015)
    M = Matrix.Translation((0, -3.3, 9.35)) @ Matrix.Rotation(math.radians(16), 4, 'X')
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    ob = obj_from_bm(bm, 'core-dsky', [mat_])
    return ob

def fuel_tank(m1, m2):
    bm = bmesh.new()
    p0, p1 = Vector((0, 3.55, 12.15)), Vector((0, 0.75, 14.65))
    ax = (p1 - p0).normalized(); L = (p1 - p0).length; R = 0.95
    q = Vector((0, 0, 1)).rotation_difference(ax).to_matrix().to_4x4()
    mid = (p0 + p1) / 2
    r = bmesh.ops.create_cone(bm, cap_ends=False, segments=14, radius1=R, radius2=R, depth=L, matrix=Matrix.Translation(mid) @ q)
    for e, sgn in ((p0, -1), (p1, 1)):   # cupulas (solo la media esfera exterior, sin caras internas)
        rr = bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=8, radius=R, matrix=Matrix.Translation(e) @ q @ Matrix.Diagonal((1, 1, 0.55, 1)))
        inner = [v for v in rr['verts'] if (v.co - e).dot(ax) * sgn < -1e-4]
        bmesh.ops.delete(bm, geom=inner, context='VERTS')
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.02)
    for t in (0.22, 0.78):   # bandas
        c = p0 + (p1 - p0) * t
        rr = bmesh.ops.create_cone(bm, cap_ends=True, segments=14, radius1=R + 0.07, radius2=R + 0.07, depth=0.28, matrix=Matrix.Translation(c) @ q)
        for f in {f for v in rr['verts'] for f in v.link_faces}: f.material_index = 1
    ob = obj_from_bm(bm, 'fuel-tank', [m1, m2])
    for p in ob.data.polygons: p.use_smooth = True
    return ob

def kapton(name, p0, r0, p1, r1, a0, turns, t0, t1, width, mat_, seed, tail=True):
    """jiron dorado tipo Kapton: tira rota e irregular enrollada parcialmente alrededor del segmento p0-p1, con colgajos"""
    rnd = random.Random(seed)
    p0, p1 = Vector(p0), Vector(p1); ax = (p1 - p0).normalized()
    u = ax.cross(Vector((0, 0, 1)) if abs(ax.z) < 0.9 else Vector((1, 0, 0))).normalized(); v = ax.cross(u)
    bm = bmesh.new(); N = 10; rows = []
    def pt(s):
        t = t0 + (t1 - t0) * s; ang = a0 + turns * 2 * math.pi * s
        c = p0 + (p1 - p0) * t; rad = (r0 + (r1 - r0) * t) + 0.24 + rnd.uniform(0, 0.06)
        return c + (u * math.cos(ang) + v * math.sin(ang)) * rad
    for i in range(N + 1):
        s = i / N; pc = pt(s)
        taper = min(1.0, 0.35 + 2.2 * min(s, 1 - s))      # extremos deshilachados
        hw = width * 0.5 * taper * (0.75 + 0.5 * rnd.random())
        sh = ax * rnd.uniform(-0.12, 0.12)
        rows.append((bm.verts.new(pc - ax * hw + sh), bm.verts.new(pc + ax * hw + sh)))
    for i in range(len(rows) - 1):
        bm.faces.new((rows[i][0], rows[i + 1][0], rows[i + 1][1], rows[i][1]))
    if tail:   # 2 colgajos rotos que caen desde puntos de la tira
        for s0 in (rnd.uniform(0.15, 0.4), rnd.uniform(0.6, 0.95)):
            base = pt(s0); w = width * rnd.uniform(0.18, 0.3); L = rnd.uniform(0.9, 1.8)
            side = base - (p0 + (p1 - p0) * (t0 + (t1 - t0) * s0)); side.z = 0
            side = side.normalized() * 0.18 if side.length > 1e-3 else Vector((0, 0, 0))
            prev = (bm.verts.new(base - ax * w), bm.verts.new(base + ax * w))
            for k in range(1, 4):
                c = base + side * k + Vector((rnd.uniform(-0.12, 0.12), rnd.uniform(-0.12, 0.12), -L * k / 3))
                ww = w * (1 - 0.28 * k)
                cur = (bm.verts.new(c - ax * ww), bm.verts.new(c + ax * ww))
                bm.faces.new((prev[0], cur[0], cur[1], prev[1])); prev = cur
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    return obj_from_bm(bm, name, [mat_])

# ------------------------------------------------------------------ pesos (distancia normalizada a huesos + suavizado)
BONE_R = {'hips': 2.3, 'spine-1': 2.7, 'spine-2': 2.9, 'spine-3': 2.8, 'neck': 1.2, 'head': 1.45,
          'upper-arm': 1.4, 'forearm': 1.15, 'hand': 1.1, 'thigh': 1.35, 'shin': 0.95, 'foot': 1.0}
def seg_dist(p, a, b):
    ab = b - a; t = max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared)); return (p - (a + ab * t)).length

def weights(ob, rig):
    me = ob.data
    bones = [b for b in rig.data.bones if b.use_deform]
    segs = []
    for b in bones:
        key = b.name[:-2] if b.name[-2:] in ('-l', '-r') else b.name
        side = 1 if b.name.endswith('-l') else (-1 if b.name.endswith('-r') else 0)
        segs.append((b.name, b.head_local.copy(), b.tail_local.copy(), BONE_R[key], side))
    nv = len(me.vertices); W = []
    for v in me.vertices:
        p = v.co; nd = {}
        for name, a, b, r, side in segs:
            if side and p.x * side < 0.4: continue
            if name == 'head' and (p.z < 12.3): continue
            nd[name] = seg_dist(p, a, b) / r
        m = min(nd.values())
        w = {k: math.exp(-((d - m) / 0.18) ** 2) for k, d in nd.items() if d - m < 0.45}
        W.append(w)
    adj = [[] for _ in range(nv)]
    for e in me.edges:
        a, b = e.vertices; adj[a].append(b); adj[b].append(a)
    for it in range(4):
        NW = []
        for i in range(nv):
            acc = dict(W[i])
            for j in adj[i]:
                for k, x in W[j].items(): acc[k] = acc.get(k, 0) + x
            s = sum(acc.values()); NW.append({k: x / s for k, x in acc.items()})
        W = NW
    # puños y pies rigidos cerca del suelo (no deslizan con el IK)
    for i, v in enumerate(me.vertices):
        z = v.co.z
        if z > 1.7: continue
        end = None
        for nm in ('hand-l', 'hand-r', 'foot-l', 'foot-r'):
            if W[i].get(nm, 0) > 0.05 or (nm.startswith('hand') and W[i].get('forearm' + nm[4:], 0) > 0.3 and z < 1.2): end = nm
        if not end: continue
        k = 1.0 if z < 1.0 else (1.7 - z) / 0.7
        W[i] = {kk: x * (1 - k) for kk, x in W[i].items()}; W[i][end] = W[i].get(end, 0) + k
    for name, *_ in segs: ob.vertex_groups.new(name=name)
    for i, w in enumerate(W):
        top = sorted(w.items(), key=lambda kv: -kv[1])[:4]
        top = [(k, x) for k, x in top if x > 0.02]
        s = sum(x for _, x in top)
        for k, x in top: ob.vertex_groups[k].add([i], x / s, 'REPLACE')
    ob.parent = rig
    mod = ob.modifiers.new('arm', 'ARMATURE'); mod.object = rig

def bone_parent(ob, rig, bone):
    bpy.context.view_layer.update()
    mw = ob.matrix_world.copy()
    ob.parent = rig; ob.parent_type = 'BONE'; ob.parent_bone = bone
    bpy.context.view_layer.update()
    ob.matrix_world = mw

# ------------------------------------------------------------------ animacion (IK para pies plantados, luego horneado)
def signed_angle(v1, v2, n):
    a = v1.angle(v2)
    return -a if v1.cross(v2).dot(n) < 0 else a


def best_pole(rig, pb, c, U, Lw):
    def err(a):
        c.pole_angle = a; bpy.context.view_layer.update()
        pu = rig.pose.bones[U.name]
        return ((pb.matrix.translation - Lw.matrix_local.translation).length + (pb.matrix.to_3x3() - Lw.matrix_local.to_3x3()).median_scale if False else
                (pb.matrix.col[0].xyz - Lw.matrix_local.col[0].xyz).length + (pu.matrix.col[0].xyz - U.matrix_local.col[0].xyz).length
                + (pb.matrix.translation - Lw.matrix_local.translation).length)
    best = min((err(math.radians(a)), a) for a in range(-180, 180, 3))[1]
    lo = best
    best = min((err(math.radians(lo + d / 10)), lo + d / 10) for d in range(-30, 31))[1]
    print(f'[P4] pole {pb.name} = {best:.1f} err={err(math.radians(best)):.4f}')
    return math.radians(best)

def setup_ik(rig):
    bpy.context.view_layer.objects.active = rig
    targets = {}
    for side in ('l', 'r'):
        s = 1 if side == 'l' else -1
        for upper, lower, end, pole_off, pole_parent in (('upper-arm', 'forearm', 'hand', Vector((s * 1.5, 5.0, 0)), 'spine-3'),
                                                         ('thigh', 'shin', 'foot', Vector((s * 0.6, -5.0, 0.5)), 'hips')):
            U, Lw, E = rig.data.bones[f'{upper}-{side}'], rig.data.bones[f'{lower}-{side}'], rig.data.bones[f'{end}-{side}']
            tgt = link(bpy.data.objects.new(f'ik-{end}-{side}', None)); tgt.empty_display_size = 0.6
            tgt.matrix_world = Matrix.Translation(E.head_local) @ E.matrix_local.to_3x3().to_4x4()
            tgt.rotation_mode = 'QUATERNION'
            pole = link(bpy.data.objects.new(f'pole-{lower}-{side}', None))
            pole.location = Lw.head_local + pole_off
            bone_parent(pole, rig, pole_parent)
            pb = rig.pose.bones[f'{lower}-{side}']
            c = pb.constraints.new('IK'); c.name = 'ik'; c.target = tgt; c.pole_target = pole; c.chain_count = 2; c.iterations = 20000; c.pole_angle = best_pole(rig, pb, c, U, Lw)
            pe = rig.pose.bones[f'{end}-{side}']
            cr = pe.constraints.new('COPY_ROTATION'); cr.name = 'rot'; cr.target = tgt
            targets[f'{end}-{side}'] = tgt
    for pb in rig.pose.bones: pb.rotation_mode = 'QUATERNION'
    return targets

def check_rest(rig):
    bpy.context.view_layer.update()
    worst = 0
    for pb in rig.pose.bones:
        d = (pb.matrix.translation - pb.bone.matrix_local.translation).length
        d2 = (pb.matrix.to_3x3() - pb.bone.matrix_local.to_3x3())
        dr = max(abs(x) for row in d2 for x in row)
        worst = max(worst, d + dr)
        if d + dr > 0.02: print(f'[P4] rest drift {pb.name}: {d:.3f} {dr:.3f}')
    print(f'[P4] rest drift max {worst:.4f}')

def kq(pb, rot_deg, frame):
    R = Euler([math.radians(a) for a in rot_deg], 'XYZ').to_matrix()
    B = pb.bone.matrix_local.to_3x3()
    pb.rotation_quaternion = (B.inverted() @ R @ B).to_quaternion()
    pb.keyframe_insert('rotation_quaternion', frame=frame, group=pb.name)

def kloc(pb, v, frame):
    B = pb.bone.matrix_local.to_3x3(); pb.location = B.inverted() @ Vector(v)
    pb.keyframe_insert('location', frame=frame, group=pb.name)

def smooth(t): t = max(0, min(1, t)); return t * t * (3 - 2 * t)

def track(keys, f):
    """keys: [(frame, value(tuple), ease)], ease del tramo que TERMINA en ese key: 'io','in','out','lin'"""
    if f <= keys[0][0]: return Vector(keys[0][1])
    for (fa, va, _), (fb, vb, e) in zip(keys, keys[1:]):
        if f <= fb:
            t = (f - fa) / (fb - fa)
            t = {'io': smooth(t), 'in': t ** 3, 'out': 1 - (1 - t) ** 2, 'lin': t}[e]
            return Vector(va).lerp(Vector(vb), t)
    return Vector(keys[-1][1])

REST_T = {}
def make_clip(rig, targets, name, nf, body_fn, tgt_fn=None, infl_fn=None):
    sc = bpy.context.scene
    src = bpy.data.actions.new('src-' + name); rig.animation_data_create(); rig.animation_data.action = src
    tacts = {}
    for k, t in targets.items():
        t.animation_data_create(); a = bpy.data.actions.new(f'src-{name}-{k}'); t.animation_data.action = a; tacts[k] = a
    for f in range(1, nf + 1):
        body = body_fn(f)
        for pb in rig.pose.bones:
            if pb.name in ('root',) or any(pb.name.startswith(x) for x in ('upper-arm', 'forearm', 'hand', 'thigh', 'shin', 'foot')): continue
            kq(pb, body.get(pb.name, (0, 0, 0)), f)
            if pb.name == 'hips': kloc(pb, body.get('hips-loc', (0, 0, 0)), f)
            if pb.name == 'core':
                s = body.get('core-scale', 1.0); pb.scale = (s, s, s); pb.keyframe_insert('scale', frame=f, group=pb.name)
        for k, t in targets.items():
            loc, rq = REST_T[k]
            if tgt_fn:
                o = tgt_fn(k, f)
                if o is not None:
                    loc = o[0]
                    if len(o) > 1 and o[1] is not None: rq = o[1] @ rq
            t.location = loc; t.rotation_quaternion = rq
            t.keyframe_insert('location', frame=f); t.keyframe_insert('rotation_quaternion', frame=f)
        for side in ('l', 'r'):
            for end in ('hand', 'foot'):
                c = rig.pose.bones[f'{end}-{side}'].constraints['rot']
                c.influence = infl_fn(f'{end}-{side}', f) if infl_fn else 1.0
                c.keyframe_insert('influence', frame=f)
    # hornear
    sc.frame_start, sc.frame_end = 1, nf
    bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True); bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.nla.bake(frame_start=1, frame_end=nf, only_selected=True, visual_keying=True, clear_constraints=False,
                     clear_parents=False, use_current_action=False, bake_types={'POSE'})
    bpy.ops.object.mode_set(mode='OBJECT')
    act = rig.animation_data.action; act.name = name; act.use_fake_user = True
    # quitar curvas de influencia del clip horneado (no son del esqueleto)
    for fc in [fc for fc in act.fcurves if 'constraints' in fc.data_path]: act.fcurves.remove(fc)
    return act

def build_anims(rig, targets):
    for k, t in targets.items(): REST_T[k] = (t.matrix_world.translation.copy(), t.matrix_world.to_quaternion())
    TAU = 2 * math.pi
    # ---- idle 3,5 s (105 frames, frame 106 = frame 1)
    def idle(f):
        t = (f - 1) / 105; p = TAU * t; b = 0.5 * (1 - math.cos(p))
        return {'hips-loc': (0, 0.06 * b, -0.14 * b), 'hips': (-0.8 * b, 0, 0),
                'spine-1': (-0.6 * b, 0, 0), 'spine-2': (-1.2 * b, 0, 0), 'spine-3': (-1.4 * b, 0, 0),
                'neck': (1.5 * b, 0, 0), 'head': (1.0 * b, 0, 4.0 * math.sin(p)),
                'core-scale': 1.0 + 0.07 * 0.5 * (1 - math.cos(2 * p))}
    make_clip(rig, targets, 'idle', 106, idle)
    # ---- sweep 2,5 s (76 frames): brazo derecho barre de derecha a izquierda por delante
    HR = REST_T['hand-r'][0]
    # Auditoria P4 (14/11): barrido BAJO. Antes el puno pasaba a 2,3-3,0 m del suelo en la fase activa (0,8-1,5 s)
    # y no tocaba a un astronauta de 2 m. Ahora el puno barre a ~0,5-1,0 m: se esquiva saltando o alejandose.
    sweep_keys = [(1, HR, 'io'), (14, (-7.6, -3.4, 5.6), 'io'), (24, (-7.9, -5.2, 3.4), 'io'),
                  (35, (-3.6, -8.6, 2.0), 'lin'), (46, (1.2, -7.6, 2.3), 'out'), (57, (-1.5, -6.0, 6.2), 'io'),
                  (70, HR, 'io'), (76, HR, 'lin')]
    yaw_keys = [(1, (0, 0, 0), 'io'), (20, (0, 0, -12), 'io'), (35, (0, 0, 4), 'lin'), (46, (0, 0, 16), 'out'),
                (60, (0, 0, 5), 'io'), (72, (0, 0, 0), 'io'), (76, (0, 0, 0), 'lin')]
    env_keys = [(1, (0, 0, 0), 'io'), (14, (1, 0, 0), 'io'), (62, (1, 0, 0), 'lin'), (74, (0, 0, 0), 'io'), (76, (0, 0, 0), 'lin')]
    lean_keys = [(1, (0, 0, 0), 'io'), (20, (-3, 0, 0), 'io'), (36, (7, 0, 0), 'io'), (50, (5, 0, 0), 'io'), (72, (0, 0, 0), 'io'), (76, (0, 0, 0), 'lin')]
    def sweep_body(f):
        e = track(env_keys, f).x; y = track(yaw_keys, f).z; ln = track(lean_keys, f).x
        return {'hips-loc': (0.55 * e, 0, -0.25 * e), 'hips': (0, -4 * e, y * 0.25),
                'spine-1': (ln * 0.3, -2 * e, y * 0.25), 'spine-2': (ln * 0.35, 0, y * 0.25), 'spine-3': (ln * 0.35, 0, y * 0.25),
                'neck': (-ln * 0.5, 0, -y * 0.3), 'head': (-ln * 0.3, 0, -y * 0.2), 'core-scale': 1.0}
    def sweep_tgt(k, f):
        if k != 'hand-r': return None
        q = Quaternion((0, 0, 1), math.radians(track(yaw_keys, f).z))
        return (track(sweep_keys, f), q)
    def sweep_infl(k, f):
        if k != 'hand-r': return 1.0
        return 1.0 - track([(1, (0, 0, 0), 'io'), (12, (1, 0, 0), 'io'), (60, (1, 0, 0), 'lin'), (72, (0, 0, 0), 'io'), (76, (0, 0, 0), 'lin')], f).x
    make_clip(rig, targets, 'sweep', 76, sweep_body, sweep_tgt, sweep_infl)
    # ---- slam 2,5 s (76 frames): impacto en el frame SLAM_F
    HL = REST_T['hand-l'][0]
    def side_keys(s):
        H = HL if s > 0 else HR
        return [(1, H, 'io'), (10, (s * 5.0, -4.2, 4.6), 'io'), (24, (s * 3.6, 0.6, 20.6), 'io'), (30, (s * 3.4, 0.4, 21.2), 'io'),
                (SLAM_F, (s * 3.7, -6.6, H.z), 'in'), (44, (s * 3.7, -6.6, H.z), 'lin'), (56, (s * 4.6, -5.8, 3.2), 'io'),
                (70, H, 'io'), (76, H, 'lin')]
    KL, KR = side_keys(1), side_keys(-1)
    pitch_keys = [(1, (0, 0, 0), 'io'), (10, (-6, 0, 0), 'io'), (24, (-22, 0, 0), 'io'), (30, (-24, 0, 0), 'io'),
                  (SLAM_F, (12, 0, 0), 'in'), (44, (10, 0, 0), 'out'), (58, (3, 0, 0), 'io'), (72, (0, 0, 0), 'io'), (76, (0, 0, 0), 'lin')]
    hl_keys = [(1, (0, 0, 0), 'io'), (24, (0, 0.9, 0.7), 'io'), (30, (0, 0.9, 0.8), 'io'), (SLAM_F, (0, -0.7, -0.7), 'in'),
               (44, (0, -0.6, -0.55), 'out'), (60, (0, -0.1, 0), 'io'), (72, (0, 0, 0), 'io'), (76, (0, 0, 0), 'lin')]
    def slam_body(f):
        pt = track(pitch_keys, f).x; hl = track(hl_keys, f)
        shake = 0.0
        if SLAM_F <= f <= SLAM_F + 8: shake = math.sin((f - SLAM_F) * 2.2) * (1 - (f - SLAM_F) / 8) * 1.5
        return {'hips-loc': tuple(hl), 'hips': (pt * 0.5, 0, 0), 'spine-1': (pt * 0.2 + shake, 0, 0),
                'spine-2': (pt * 0.2, 0, 0), 'spine-3': (pt * 0.25, 0, 0), 'neck': (-pt * 0.35, 0, shake), 'head': (-pt * 0.25, 0, 0),
                'core-scale': 1.0 + (0.12 if SLAM_F - 2 <= f <= SLAM_F + 4 else 0.0)}
    def slam_tgt(k, f):
        if k == 'hand-l': return (track(KL, f), None)
        if k == 'hand-r': return (track(KR, f), None)
        return None
    def slam_infl(k, f):
        if not k.startswith('hand'): return 1.0
        return 1.0 - track([(1, (0, 0, 0), 'io'), (10, (1, 0, 0), 'io'), (30, (1, 0, 0), 'lin'), (SLAM_F, (0, 0, 0), 'in'), (76, (0, 0, 0), 'lin')], f).x
    make_clip(rig, targets, 'slam', 76, slam_body, slam_tgt, slam_infl)

SLAM_F = 38   # impacto: (38-1)/30 = 1,2333 s

def build():
    clean()
    img = bpy.data.images.load(os.path.join(HERE, 'tex', 'dsky-1202.png')); img.pack()
    M_reg = mat('regolito-guardian', (1, 1, 1), rough=0.95, vcol='Col')
    M_cav = mat('cavidad', srgb(14, 13, 12), rough=1.0)
    M_bas = mat('basalto', srgb(52, 50, 48), rough=0.75, metal=0.05)
    M_core = mat('core-dsky', (1, 1, 1), rough=0.5, image=img, emit_s=1.6)
    M_gold = mat('kapton', srgb(214, 160, 52), rough=0.32, metal=1.0, double=True)
    M_tank = mat('tanque', srgb(196, 196, 190), rough=0.45, metal=0.6)
    M_band = mat('tanque-banda', srgb(60, 58, 55), rough=0.6, metal=0.3)
    rig = build_armature()
    body = make_body([M_reg, M_cav])
    weights(body, rig)
    parts = []
    for s, side in ((1, 'l'), (-1, 'r')):
        p = slab(f'plate-shoulder-{side}', (s * 4.0, -1.7, 12.55), (s * 0.62, -0.2, 0.76), (1.95, 1.7, 0.72), M_bas, 3 + s, spin=0.3 * s)
        bone_parent(p, rig, f'upper-arm-{side}'); parts.append(p)
        p = slab(f'plate-knee-{side}', (s * 3.2, 0.5, 3.75), (s * 0.3, -0.94, 0.15), (1.1, 1.05, 0.45), M_bas, 9 + s, spin=0.2 * s)
        bone_parent(p, rig, f'shin-{side}'); parts.append(p)
        U = J[f'upper-arm-{side}']; F = J[f'forearm-{side}']
        for i, (a0, tu, t0, t1, wd) in enumerate(((0.3, 0.8, 0.18, 0.38, 0.75), (2.5, 0.6, 0.45, 0.62, 0.6), (4.4, 0.7, 0.7, 0.88, 0.65))):
            k = kapton(f'kapton-upper-{side}-{i + 1}', U[1], 1.35, U[2], 1.0, a0 * s, tu * s, t0, t1, wd, M_gold, 20 + i + s * 5)
            bone_parent(k, rig, f'upper-arm-{side}'); parts.append(k)
        for i, (a0, tu, t0, t1, wd) in enumerate(((1.2, 0.8, 0.1, 0.32, 0.7), (4.0, 0.65, 0.45, 0.66, 0.6))):
            k = kapton(f'kapton-forearm-{side}-{i + 1}', F[1], 1.1, F[2], 0.95, a0 * s, tu * s, t0, t1, wd, M_gold, 40 + i + s * 5)
            bone_parent(k, rig, f'forearm-{side}'); parts.append(k)
    c = dsky(M_core); bone_parent(c, rig, 'core'); parts.append(c)
    t = fuel_tank(M_tank, M_band); bone_parent(t, rig, 'spine-2'); parts.append(t)
    total = tris(body) + sum(tris(p) for p in parts)
    print(f'[P4] tris body={tris(body)} parts={sum(tris(p) for p in parts)} total={total}')
    targets = setup_ik(rig)
    check_rest(rig)
    build_anims(rig, targets)
    # limpiar: restricciones, objetivos y acciones fuente
    for pb in rig.pose.bones:
        for c in list(pb.constraints): pb.constraints.remove(c)
    for o in [o for o in bpy.data.objects if o.name.startswith(('ik-', 'pole-'))]: bpy.data.objects.remove(o, do_unlink=True)
    for a in [a for a in bpy.data.actions if a.name.startswith('src-')]: bpy.data.actions.remove(a)
    rig.animation_data.action = None
    for a in [bpy.data.actions[n] for n in ('idle', 'sweep', 'slam')]:
        tr = rig.animation_data.nla_tracks.new(); tr.name = a.name; tr.strips.new(a.name, 1, a); tr.mute = True
    for pb in rig.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
    return rig, body, parts

def export(rig, body, parts):
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, 'blend', 'guardian-v01.blend'), compress=True)
    bpy.ops.object.select_all(action='DESELECT')
    for o in [rig, body] + parts: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(HERE, 'guardian-raw.glb'), export_format='GLB', use_selection=True,
        export_yup=True, export_apply=False, export_animations=True, export_animation_mode='ACTIONS',
        export_force_sampling=True, export_skins=True, export_all_influences=False, export_def_bones=False,
        export_anim_single_armature=True, export_reset_pose_bones=True, export_morph=False, export_nla_strips=True,
        export_optimize_animation_size=False, export_anim_slide_to_zero=True, export_vertex_color='MATERIAL',
        export_image_format='AUTO', export_lights=False, export_cameras=False)

if __name__ == '__main__':
    rig, body, parts = build()
    if '--no-export' not in argv: export(rig, body, parts)
    print('[P4] OK')
