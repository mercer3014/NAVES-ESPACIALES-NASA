# Astronauta A7L procedural (CC0, generado desde cero en Blender headless)
# uso: blender -b -P build.py -- out.glb [preview.png]
import bpy, bmesh, math, sys, os
from mathutils import Vector, Matrix, noise
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '/tmp/astro.glb'
PREV = argv[1] if len(argv) > 1 else None
HERE = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene

def link(o):
    scn.collection.objects.link(o); return o
def activate(o):
    for x in bpy.context.view_layer.objects: x.select_set(False)
    o.select_set(True); bpy.context.view_layer.objects.active = o
def apply_mods(o):
    activate(o)
    for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)

MATS = {}
def mat(name, col, rough=0.8, metal=0.0, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if alpha < 1: b.inputs['Alpha'].default_value = alpha
    MATS[name] = m; return m
mat('Suit', (0.86, 0.85, 0.81)); mat('Glove', (0.42, 0.47, 0.55), 0.6); mat('Boot', (0.84, 0.83, 0.79))
mat('Sole', (0.08, 0.08, 0.085), 0.9); mat('Metal', (0.75, 0.76, 0.78), 0.3, 1); mat('MetalRed', (0.6, 0.06, 0.05), 0.35, 1)
mat('MetalBlue', (0.06, 0.18, 0.6), 0.35, 1); mat('Visor', (1.0, 0.72, 0.3), 0.08, 1); mat('Bubble', (0.9, 0.9, 0.9), 0.05, 0, 0.2)
mat('Shell', (0.92, 0.92, 0.9), 0.35); mat('PLSS', (0.88, 0.87, 0.83)); mat('Dark', (0.13, 0.13, 0.14), 0.5)
mat('Tip', (0.3, 0.36, 0.45), 0.5); mat('Gauntlet', (0.62, 0.66, 0.72), 0.55); mat('RCU', (0.16, 0.165, 0.17), 0.5)
mat('Hose', (0.55, 0.6, 0.66), 0.55); mat('FlagPatch', (0.8, 0.2, 0.2), 0.7); mat('MissionPatch', (0.2, 0.3, 0.8), 0.7); mat('NameTag', (0.9, 0.9, 0.9), 0.7)

def setmat(o, name):
    o.data.materials.clear(); o.data.materials.append(MATS[name])

# ---------------- cuerpo del traje: modificador Skin sobre un esqueleto de aristas ----------------
P = {}  # nombre -> (pos, (rx, ry))
def J(n, p, r): P[n] = (Vector(p), r if isinstance(r, tuple) else (r, r))
J('pelvis', (0, 0.005, 0.97), (0.175, 0.14)); J('waist', (0, 0.0, 1.10), (0.18, 0.145)); J('chest', (0, 0.0, 1.27), (0.205, 0.155))
J('upch', (0, 0.01, 1.40), (0.19, 0.15)); J('neck', (0, 0.01, 1.50), (0.115, 0.11))
for s, sx in (('L', 1), ('R', -1)):
    J('hip' + s, (sx * 0.105, 0.0, 0.90), (0.115, 0.12)); J('thm' + s, (sx * 0.12, -0.005, 0.71), (0.105, 0.105))
    J('knee' + s, (sx * 0.125, -0.01, 0.52), (0.092, 0.095)); J('shm' + s, (sx * 0.128, 0.0, 0.34), (0.088, 0.09))
    J('ank' + s, (sx * 0.13, 0.01, 0.17), (0.082, 0.085))
    J('sho' + s, (sx * 0.235, 0.01, 1.395), (0.108, 0.108)); J('uam' + s, (sx * 0.29, 0.015, 1.26), (0.092, 0.092))
    J('elb' + s, (sx * 0.335, 0.01, 1.12), (0.082, 0.082)); J('fam' + s, (sx * 0.355, -0.01, 0.995), (0.076, 0.076))
    J('wri' + s, (sx * 0.37, -0.03, 0.88), (0.062, 0.062))
E = [('pelvis', 'waist'), ('waist', 'chest'), ('chest', 'upch'), ('upch', 'neck')]
for s in 'LR':
    E += [('pelvis', 'hip' + s), ('hip' + s, 'thm' + s), ('thm' + s, 'knee' + s), ('knee' + s, 'shm' + s), ('shm' + s, 'ank' + s),
          ('upch', 'sho' + s), ('sho' + s, 'uam' + s), ('uam' + s, 'elb' + s), ('elb' + s, 'fam' + s), ('fam' + s, 'wri' + s)]
names = list(P.keys()); idx = {n: i for i, n in enumerate(names)}
me = bpy.data.meshes.new('suit'); me.from_pydata([P[n][0] for n in names], [(idx[a], idx[b]) for a, b in E], [])
suit = link(bpy.data.objects.new('Suit', me))
sk = suit.modifiers.new('skin', 'SKIN'); sk.branch_smoothing = 0.6; sk.use_smooth_shade = True
for n in names:
    d = me.skin_vertices[0].data[idx[n]]; d.radius = P[n][1]; d.use_root = (n == 'pelvis')
ss = suit.modifiers.new('sub', 'SUBSURF'); ss.levels = 3; ss.render_levels = 3
apply_mods(suit)

def seg_param(p, a, b):
    ab = b - a; t = (p - a).dot(ab) / ab.length_squared; return t, (a + ab * max(0, min(1, t)) - p).length, ab.normalized()

# convolutas (fuelles) y arrugas: desplazamiento a lo largo de la normal
bm = bmesh.new(); bm.from_mesh(suit.data); bm.normal_update()
BELLOWS = []  # (centro, eje, semilargo, radio_max, n_anillos, amplitud)
for s in 'LR':
    for c, a, b, hl, rr, amp in (('knee', 'thm', 'shm', 0.095, 0.14, 0.016), ('elb', 'uam', 'fam', 0.08, 0.12, 0.014), ('sho', 'upch', 'uam', 0.065, 0.15, 0.012)):
        cp = P[c + s][0] if c != 'sho' else (P['sho' + s][0] * 0.55 + P['uam' + s][0] * 0.45)
        ax = (P[b + s][0] - P[a + s][0] if a != 'upch' else P['uam' + s][0] - P['sho' + s][0]).normalized()
        BELLOWS.append((cp, ax, hl, rr, amp))
# bandas de arrugas irregulares (tela que se amontona): centro, eje, semilargo, radio, amplitud, período
BUNCH = [(Vector((0, 0, 1.04)), Vector((0, 0, 1)), 0.07, 0.3, 0.007, 0.03), (Vector((0, 0, 0.9)), Vector((0, 0, 1)), 0.05, 0.12, 0.006, 0.025)]
for s in 'LR':
    BUNCH += [(Vector((P['ank' + s][0].x, P['ank' + s][0].y, 0.33)), Vector((0, 0, 1)), 0.05, 0.13, 0.009, 0.028),
              (P['wri' + s][0] * 0.7 + P['fam' + s][0] * 0.3, (P['wri' + s][0] - P['fam' + s][0]).normalized(), 0.05, 0.1, 0.006, 0.022),
              (P['thm' + s][0] * 0.6 + P['hip' + s][0] * 0.4, (P['knee' + s][0] - P['hip' + s][0]).normalized(), 0.08, 0.14, 0.004, 0.05)]
for v in bm.verts:
    p = v.co.copy(); d = 0.0
    for cp, ax, hl, rr, amp in BELLOWS:
        t = (p - cp).dot(ax); rad = ((p - cp) - ax * t).length
        if abs(t) < hl and rad < rr:
            w = math.cos(abs(t) / hl * math.pi / 2) ** 1.5
            d += amp * w * (math.cos(t / 0.0165 * math.pi) * 0.5 + 0.25)
    for cp, ax, hl, rr, amp, per in BUNCH:
        t = (p - cp).dot(ax); rad = ((p - cp) - ax * t).length
        if abs(t) < hl and rad < rr:
            w = math.cos(abs(t) / hl * math.pi / 2) ** 1.2
            jit = noise.noise(p * 14) * 0.9  # pliegues irregulares, no anillos perfectos
            d += amp * w * (1 - abs(math.sin((t + jit * per * 0.5) / per * math.pi))) ** 2 * 1.6 - amp * w * 0.3
    # pliegues de tela: ruido estirado transversal a los miembros + ruido fino
    q = Vector((p.x * 7, p.y * 7, p.z * 22)); n1 = noise.noise(q)
    fold = (1 - abs(n1)) ** 3 * 0.011 - 0.0035
    # pliegues longitudinales sueltos (tela holgada que cuelga en muslos/brazos)
    q3 = Vector((p.x * 26, p.y * 26, p.z * 4 + 7)); fold += ((1 - abs(noise.noise(q3))) ** 4) * 0.005
    q2 = Vector((p.x * 23 + 3, p.y * 23, p.z * 31)); fold += noise.noise(q2) * 0.0012
    if p.z > 1.47 or p.z < 0.16: fold *= 0.2
    v.co = p + v.normal * (d + fold)
bm.to_mesh(suit.data); bm.free(); setmat(suit, 'Suit')
for f in suit.data.polygons: f.use_smooth = True

# ---------------- utilidades de piezas ----------------
def skin_part(name, pts, edges, matn, sub=2):
    m = bpy.data.meshes.new(name); m.from_pydata([Vector(p[0]) for p in pts], edges, [])
    o = link(bpy.data.objects.new(name, m)); k = o.modifiers.new('skin', 'SKIN'); k.branch_smoothing = 0.5
    for i, p in enumerate(pts):
        r = p[1] if isinstance(p[1], tuple) else (p[1], p[1]); m.skin_vertices[0].data[i].radius = r
        m.skin_vertices[0].data[i].use_root = i == 0
    s = o.modifiers.new('sub', 'SUBSURF'); s.levels = sub; apply_mods(o); setmat(o, matn)
    for f in o.data.polygons: f.use_smooth = True
    return o
def rounded_box(name, size, loc, matn, bevel=0.02, seg=4, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.name = name
    o.scale = size; bpy.ops.object.transform_apply(scale=True)
    b = o.modifiers.new('bev', 'BEVEL'); b.width = bevel; b.segments = seg; b.limit_method = 'NONE'
    apply_mods(o); setmat(o, matn); bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40)); return o
def cyl(name, r, depth, loc, matn, rot=(0, 0, 0), verts=24, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts); o = bpy.context.object; o.name = name
    if bevel:
        b = o.modifiers.new('bev', 'BEVEL'); b.width = bevel; b.segments = 3; apply_mods(o)
    setmat(o, matn); bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40)); return o
def torus(name, R, r, loc, matn, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot, major_segments=48, minor_segments=12)
    o = bpy.context.object; o.name = name; setmat(o, matn); bpy.ops.object.shade_smooth(); return o
def tube(name, pts, r, matn):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = 4; cu.resolution_u = 10
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(len(pts) - 1)
    for bp, p in zip(sp.bezier_points, pts): bp.co = Vector(p); bp.handle_left_type = bp.handle_right_type = 'AUTO'
    o = link(bpy.data.objects.new(name, cu)); activate(o); bpy.ops.object.convert(target='MESH'); o = bpy.context.object
    setmat(o, matn); bpy.ops.object.shade_smooth(); return o

RIGID = []  # (obj, bone)
def rig(o, bone): RIGID.append((o, bone)); return o

# ---------------- guantes (EV con puntas de goma) ----------------
for s, sx in (('L', 1), ('R', -1)):
    w = P['wri' + s][0]
    fa = (P['fam' + s][0] - w).normalized()
    # guantelete (Chromel-R gris azulado) que cubre el anillo de muñeca y sube por el antebrazo, abierto en cono
    gp = [(tuple(w - fa * 0.03), (0.066, 0.064)), (tuple(w + fa * 0.04), (0.074, 0.072)), (tuple(w + fa * 0.1), (0.086, 0.084)), (tuple(w + fa * 0.118), (0.088, 0.086))]
    rig(skin_part('gaunt' + s, gp, [(0, 1), (1, 2), (2, 3)], 'Gauntlet'), 'hand_' + s)
    rig(torus('gbead' + s, 0.087, 0.0055, tuple(w + fa * 0.118), 'Gauntlet', rot=Vector((0, 0, 1)).rotation_difference(fa).to_euler()), 'hand_' + s)
    rig(torus('gstrap' + s, 0.07, 0.006, tuple(w + fa * 0.012), 'MetalBlue' if s == 'L' else 'MetalRed', rot=Vector((0, 0, 1)).rotation_difference(fa).to_euler()), 'hand_' + s)
    palm = Vector((w.x + sx * 0.012, w.y - 0.012, w.z - 0.105))
    pts = [((w.x, w.y, w.z - 0.02), (0.06, 0.058)), ((w.x + sx * 0.006, w.y - 0.005, w.z - 0.055), (0.06, 0.046)), (tuple(palm), (0.058, 0.038))]
    edges = [(0, 1), (1, 2)]
    tips = []
    for i, fx in enumerate((-0.034, -0.0115, 0.0115, 0.034)):
        L = (0.074, 0.084, 0.08, 0.066)[i]; base = palm + Vector((sx * fx, -0.006, -0.04)); k = len(pts)
        pts += [(tuple(base), 0.0225), (tuple(base + Vector((sx * fx * 0.08, -0.016, -L * 0.55))), 0.0205), (tuple(base + Vector((sx * fx * 0.1, -0.03, -L * 0.82))), 0.019)]
        edges += [(2, k), (k, k + 1), (k + 1, k + 2)]; tips.append((base + Vector((sx * fx * 0.11, -0.036, -L * 0.9)), 0.0192))
    k = len(pts); tb = palm + Vector((0, -0.036, 0.014))
    pts += [(tuple(tb), 0.025), (tuple(tb + Vector((-sx * 0.006, -0.034, -0.032))), 0.0215), (tuple(tb + Vector((0, -0.046, -0.054))), 0.0195)]
    edges += [(2, k), (k, k + 1), (k + 1, k + 2)]; tips.append((tb + Vector((0, -0.05, -0.064)), 0.0198))
    rig(skin_part('glove' + s, pts, edges, 'Glove'), 'hand_' + s)
    for tp, tr in tips:  # puntas de goma de silicona (azul grisáceo)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=tr, location=tp, segments=16, ring_count=10); o = bpy.context.object; o.scale = (1, 1, 1.35)
        bpy.ops.object.transform_apply(scale=True); setmat(o, 'Tip'); bpy.ops.object.shade_smooth(); rig(o, 'hand_' + s)

# ---------------- botas lunares con suela de tacos ----------------
for s, sx in (('L', 1), ('R', -1)):
    a = P['ank' + s][0]
    b = skin_part('boot' + s, [((a.x, a.y, 0.29), (0.1, 0.103)), ((a.x, a.y + 0.01, 0.15), (0.097, 0.1)), ((a.x, a.y + 0.035, 0.075), (0.082, 0.075)),
                                ((a.x, a.y - 0.07, 0.07), (0.078, 0.062)), ((a.x, a.y - 0.155, 0.062), (0.066, 0.05))],
                  [(0, 1), (1, 2), (1, 3), (3, 4)], 'Boot')
    bm = bmesh.new(); bm.from_mesh(b.data)
    for v in bm.verts: v.co.z = max(v.co.z, 0.035)  # base plana
    bm.to_mesh(b.data); bm.free(); rig(b, 'foot_' + s)
    # suela: contorno tipo huella extruido y biselado
    bm = bmesh.new(); ring = []
    for i in range(40):
        t = i / 40 * 2 * math.pi; yy = -0.06 - 0.175 * math.cos(t); ww = 0.074 if math.cos(t) > 0 else 0.07
        ring.append(bm.verts.new((a.x + sx * 0.0 + math.sin(t) * ww, a.y + yy + 0.02, 0.0)))
    f = bm.faces.new(ring); r = bmesh.ops.extrude_face_region(bm, geom=[f])
    for v in [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]: v.co.z = 0.038
    m = bpy.data.meshes.new('sole' + s); bm.to_mesh(m); bm.free(); o = link(bpy.data.objects.new('sole' + s, m))
    bv = o.modifiers.new('bev', 'BEVEL'); bv.width = 0.008; bv.segments = 3; apply_mods(o); setmat(o, 'Sole')
    activate(o); bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35)); rig(o, 'foot_' + s)

# ---------------- casco LEVA (carcasa con capucha, marco del visor, parasoles curvos) + burbuja + visor dorado ----------------
HC = Vector((0, -0.005, 1.668)); HS = (1.0, 1.08, 1.07); AZ, EL, EL0 = 1.06, 0.68, -0.03
def sph(r, segs=72, rings=48):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=HC, segments=segs, ring_count=rings); o = bpy.context.object
    o.scale = HS; bpy.ops.object.transform_apply(scale=True); return o
def angs(co):
    d = co - HC; d = Vector((d.x / HS[0], d.y / HS[1], d.z / HS[2])); return math.atan2(d.x, -d.y), math.atan2(d.z, math.hypot(d.x, d.y)), d
def onshell(az, el, rad):
    return HC + Vector((math.sin(az) * math.cos(el) * HS[0], -math.cos(az) * math.cos(el) * HS[1], math.sin(el) * HS[2])) * rad
shell = sph(0.182); shell.name = 'shell'; visor = sph(0.176); visor.name = 'visor'
def opening(co, k=1.0):
    az, el, d = angs(co); return (az / (AZ * k)) ** 2 + ((el - EL0) / (EL * k)) ** 2 < 1 and d.z > -0.12
for o, keep_in, rad, bot in ((shell, False, 0.182, -0.15), (visor, True, 0.176, -0.13)):
    bm = bmesh.new(); bm.from_mesh(o.data); k = 1.0 if not keep_in else 1.06
    dele = [f for f in bm.faces if opening(f.calc_center_median(), k) == (not keep_in)]
    dele += [f for f in bm.faces if (f.calc_center_median() - HC).z < bot]
    bmesh.ops.delete(bm, geom=list(set(dele)), context='FACES')
    for v in bm.verts:
        az, el, d = angs(v.co)
        if v.is_boundary and d.z > -0.115:  # ajustar el borde exacto a la elipse de la abertura
            f = math.sqrt((az / (AZ * k)) ** 2 + ((el - EL0) / (EL * k)) ** 2)
            if f > 1e-6: v.co = onshell(az / f, EL0 + (el - EL0) / f, rad)
        if not keep_in:  # faldón: la carcasa se abre hacia el anillo del cuello (más ancha atrás y abajo)
            dz = v.co.z - HC.z; kk = max(0.0, min(1.0, (-0.03 - dz) / 0.12))
            if kk > 0:
                xy = Vector((v.co.x - HC.x, v.co.y - HC.y, 0)); back = max(0.0, xy.y) / 0.2
                v.co += xy.normalized() * kk * kk * (0.02 + 0.02 * back)
    bm.to_mesh(o.data); bm.free()
so = shell.modifiers.new('sol', 'SOLIDIFY'); so.thickness = 0.012; so.offset = 1
sb = shell.modifiers.new('sub', 'SUBSURF'); sb.levels = 1; apply_mods(shell); setmat(shell, 'Shell'); activate(shell); bpy.ops.object.shade_smooth()
setmat(visor, 'Visor'); activate(visor); bpy.ops.object.shade_smooth()
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.165, location=HC + Vector((0, -0.005, -0.005)), segments=48, ring_count=32); bub = bpy.context.object; bub.name = 'bubble'
bm = bmesh.new(); bm.from_mesh(bub.data); bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().z < HC.z - 0.125], context='FACES'); bm.to_mesh(bub.data); bm.free()
setmat(bub, 'Bubble'); bpy.ops.object.shade_smooth()
# marco grueso del visor (borde de la carcasa alrededor de la abertura)
rim = [tuple(onshell(AZ * 1.01 * math.cos(t), EL0 + EL * 1.01 * math.sin(t), 0.19)) for t in [i / 40 * 2 * math.pi for i in range(41)]]
rig(tube('visorrim', rim, 0.0085, 'Shell'), 'head')
# parasoles: paneles curvos que siguen la carcasa (laterales y central/capucha sobre el visor)
def panel(name, f, rad=0.194, th=0.006):
    o = sph(rad, 96, 64); o.name = name; bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.delete(bm, geom=[q for q in bm.faces if not f(*angs(q.calc_center_median())[:2])], context='FACES'); bm.to_mesh(o.data); bm.free()
    m = o.modifiers.new('sol', 'SOLIDIFY'); m.thickness = th; m.offset = 0
    b = o.modifiers.new('bev', 'BEVEL'); b.width = 0.002; b.segments = 2; b.limit_method = 'ANGLE'
    apply_mods(o); setmat(o, 'Shell'); bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40)); return o
rig(panel('hood', lambda az, el: abs(az) < 0.62 and 0.6 < el < 1.12), 'head')           # visera/capucha central levantada
rig(panel('blindL', lambda az, el: 0.92 < az < 1.32 and -0.3 < el < 0.55), 'head')
rig(panel('blindR', lambda az, el: -1.32 < az < -0.92 and -0.3 < el < 0.55), 'head')
for sx in (1, -1):  # pivotes de los visores
    p = onshell(sx * math.pi / 2, 0.05, 0.195); rig(cyl('pivot', 0.022, 0.012, tuple(p), 'Shell', rot=(0, math.pi / 2, 0), bevel=0.003), 'head')
    rig(cyl('pivotc', 0.009, 0.016, tuple(p), 'Metal', rot=(0, math.pi / 2, 0), verts=12), 'head')
for o in (shell, visor, bub): rig(o, 'head')
rig(torus('neckring', 0.135, 0.016, (0, 0.0, 1.51), 'Metal', rot=(0.06, 0, 0)), 'chest')
rig(torus('neckring2', 0.128, 0.009, (0, 0.0, 1.535), 'MetalBlue', rot=(0.06, 0, 0)), 'head')

# ---------------- PLSS + OPS (cajas más voluminosas y rectas, como en AS11-40-5903) ----------------
rig(rounded_box('plss', (0.48, 0.25, 0.64), (0, 0.30, 1.15), 'PLSS', 0.03, 4), 'chest')
rig(rounded_box('ops', (0.47, 0.235, 0.2), (0, 0.297, 1.588), 'PLSS', 0.028, 4), 'chest')
rig(rounded_box('plssband', (0.455, 0.235, 0.026), (0, 0.299, 1.477), 'Dark', 0.008, 2), 'chest')
rig(rounded_box('plssbot', (0.42, 0.2, 0.04), (0, 0.30, 0.83), 'Dark', 0.012, 2), 'chest')
BK = 0.4255  # cara trasera
# costuras acolchadas de la funda térmica y correas de sujeción
for sx in (1, -1):
    rig(tube('seamv', [(sx * 0.18, BK, 1.44), (sx * 0.182, BK + 0.002, 1.15), (sx * 0.18, BK, 0.86)], 0.0045, 'PLSS'), 'chest')
    rig(tube('seams', [(sx * 0.2415, 0.4, 1.2), (sx * 0.2435, 0.3, 1.2), (sx * 0.2415, 0.2, 1.2)], 0.0042, 'PLSS'), 'chest')
    rig(tube('opsseam', [(sx * 0.2365, 0.39, 1.588), (sx * 0.238, 0.297, 1.588), (sx * 0.2365, 0.2, 1.588)], 0.004, 'PLSS'), 'chest')
for z in (1.02, 1.28):
    rig(tube('seamh', [(-0.21, BK, z), (0, BK + 0.003, z), (0.21, BK, z)], 0.004, 'PLSS'), 'chest')
rig(tube('opsseamh', [(-0.21, 0.4145, 1.588), (0, 0.4165, 1.588), (0.21, 0.4145, 1.588)], 0.004, 'PLSS'), 'chest')
rig(rounded_box('plsslabel', (0.12, 0.004, 0.05), (0.07, BK + 0.002, 1.36), 'Dark', 0.0015, 1), 'chest')
for sx in (1, -1):
    rig(rounded_box('plssflap', (0.07, 0.012, 0.09), (sx * 0.12, BK + 0.004, 0.95), 'PLSS', 0.005, 3), 'chest')
    rig(cyl('snap', 0.007, 0.006, (sx * 0.12, BK + 0.011, 0.98), 'Metal', rot=(math.pi / 2, 0, 0), verts=12), 'chest')
    rig(rounded_box('opsbracket', (0.035, 0.03, 0.05), (sx * 0.2, 0.415, 1.495), 'Metal', 0.004, 2), 'chest')
# actuador de purga del OPS: cable desde el OPS hasta la cintura izquierda con anillo rojo
rig(tube('opscable', [(0.21, 0.24, 1.56), (0.25, 0.12, 1.40), (0.23, -0.05, 1.18), (0.17, -0.165, 1.07)], 0.006, 'Dark'), 'chest')
rig(torus('opsring', 0.018, 0.0045, (0.165, -0.175, 1.06), 'MetalRed', rot=(math.pi / 2 - 0.3, 0, 0)), 'chest')
rig(cyl('antbase', 0.016, 0.03, (-0.17, 0.31, 1.70), 'Metal'), 'chest'); rig(cyl('antenna', 0.004, 0.26, (-0.17, 0.31, 1.84), 'Metal', verts=8), 'chest')
rig(cyl('anttip', 0.01, 0.012, (-0.17, 0.31, 1.97), 'Dark', verts=12), 'chest')
rig(cyl('purge', 0.022, 0.06, (0.2, 0.175, 1.6), 'MetalRed', rot=(math.pi / 2, 0, 0), bevel=0.005), 'chest')
# arnés por encima de los hombros hasta las esquinas de la RCU
for sx in (1, -1):
    rig(tube('strap', [(sx * 0.12, 0.18, 1.47), (sx * 0.135, 0.05, 1.54), (sx * 0.12, -0.13, 1.45), (sx * 0.1, -0.2, 1.385)], 0.012, 'Dark'), 'chest')
# ---------------- RCU (unidad de control remoto en el pecho): caja definida con mandos arriba ----------------
RY, RZ = -0.245, 1.30
rig(rounded_box('rcu', (0.23, 0.10, 0.14), (0, RY, RZ), 'RCU', 0.008, 2), 'chest')
rig(rounded_box('rcutop', (0.215, 0.088, 0.012), (0, RY, RZ + 0.074), 'Metal', 0.004, 2), 'chest')
for i, kx in enumerate((-0.075, -0.03, 0.015, 0.065)):  # mandos en la cara superior
    r = (0.012, 0.01, 0.01, 0.014)[i]
    rig(cyl('knob', r, 0.022, (kx, RY + (0.01 if i % 2 else -0.012), RZ + 0.09), ('MetalRed', 'Metal', 'Metal', 'MetalBlue')[i], bevel=0.002), 'chest')
rig(rounded_box('rcuptt', (0.014, 0.03, 0.045), (0.121, RY - 0.01, RZ + 0.01), 'Metal', 0.003, 2), 'chest')  # PTT lateral
rig(cyl('o2gauge', 0.021, 0.006, (0.068, RY - 0.052, RZ + 0.025), 'Metal', rot=(math.pi / 2, 0, 0), bevel=0.002), 'chest')
rig(cyl('o2face', 0.016, 0.004, (0.068, RY - 0.055, RZ + 0.025), 'NameTag', rot=(math.pi / 2, 0, 0)), 'chest')
rig(rounded_box('rcuplate', (0.1, 0.004, 0.036), (-0.045, RY - 0.051, RZ + 0.03), 'Metal', 0.0015, 1), 'chest')
for sx in (1, -1):  # aristas verticales y soportes de montaje
    rig(rounded_box('rcurail', (0.008, 0.104, 0.142), (sx * 0.111, RY, RZ), 'Metal', 0.002, 1), 'chest')
    rig(rounded_box('rcumount', (0.03, 0.05, 0.03), (sx * 0.095, RY + 0.06, RZ + 0.06), 'Dark', 0.005, 2), 'chest')
rig(rounded_box('camplate', (0.085, 0.012, 0.06), (0, RY - 0.056, RZ - 0.04), 'Metal', 0.003, 2), 'chest')  # soporte de cámara
rig(rounded_box('camprong', (0.03, 0.03, 0.012), (0, RY - 0.075, RZ - 0.062), 'Metal', 0.003, 2), 'chest')
# ---------------- conectores y mangueras ----------------
for sx, mc in ((1, 'MetalBlue'), (-1, 'MetalRed')):
    for k, z in enumerate((1.205, 1.125)):
        c = (sx * 0.06 + sx * k * 0.03, -0.185 + k * 0.005, z)
        rig(cyl('conn', 0.026, 0.034, c, mc if k == 0 else ('MetalRed' if mc == 'MetalBlue' else 'MetalBlue'), rot=(math.pi / 2 - 0.2, 0, 0), bevel=0.005), 'chest')
        rig(torus('connring', 0.027, 0.006, (c[0], c[1] - 0.018, c[2]), 'Metal', rot=(math.pi / 2 - 0.2, 0, 0)), 'chest')
        rig(tube('hose', [(c[0], c[1] - 0.025, c[2] - 0.01), (c[0] + sx * 0.06, c[1] - 0.05, c[2] - 0.05 - k * 0.02),
                          (sx * 0.2, -0.13, 1.07 - k * 0.02), (sx * 0.252, 0.06, 1.1 + k * 0.02), (sx * 0.22, 0.19, 1.14 + k * 0.03)], 0.016, 'Hose'), 'chest')
# cinturón / anillo de la cintura (cremallera de presión)
rig(torus('belt', 0.19, 0.008, (0, 0.0, 1.075), 'Suit', rot=(0, 0, 0)), 'spine')
# ---------------- parches (decals) ----------------
def decal(name, w, h, center, normal, matn, up=Vector((0, 0, 1)), curve_r=None):
    n = Vector(normal).normalized(); r = up.cross(n).normalized(); u = n.cross(r)
    bm = bmesh.new(); NX, NY = 10, 8; vs = []
    for j in range(NY + 1):
        for i in range(NX + 1):
            x = (i / NX - 0.5) * w; y = (j / NY - 0.5) * h; p = Vector(center) + r * x + u * y
            if curve_r:  # curvar alrededor del eje 'up'
                a = x / curve_r; p = Vector(center) - n * curve_r + r * math.sin(a) * curve_r + n * math.cos(a) * curve_r + u * y
            vs.append(bm.verts.new(p))
    uvl = bm.loops.layers.uv.new()
    for j in range(NY):
        for i in range(NX):
            ids = [j * (NX + 1) + i, j * (NX + 1) + i + 1, (j + 1) * (NX + 1) + i + 1, (j + 1) * (NX + 1) + i]
            f = bm.faces.new([vs[k] for k in ids])
            for l, k in zip(f.loops, ids): l[uvl].uv = ((k % (NX + 1)) / NX, (k // (NX + 1)) / NY)
    m = bpy.data.meshes.new(name); bm.to_mesh(m); bm.free(); o = link(bpy.data.objects.new(name, m)); setmat(o, matn)
    sw = o.modifiers.new('sw', 'SHRINKWRAP'); sw.target = suit; sw.offset = 0.003; sw.wrap_method = 'NEAREST_SURFACEPOINT'
    apply_mods(o); activate(o); bpy.ops.object.shade_smooth(); return o
sh = P['shoL'][0] * 0.35 + P['uamL'][0] * 0.65
armdir = (P['uamL'][0] - P['shoL'][0]).normalized()
rig(decal('flagpatch', 0.1, 0.066, sh + Vector((0.09, 0, 0)), (1, 0, 0.0), 'FlagPatch', up=-armdir, curve_r=0.09), 'upperarm_L')
rig(decal('missionpatch', 0.085, 0.085, (0.11, -0.16, 1.21), (0.25, -1, 0.05), 'MissionPatch'), 'chest')
rig(decal('nametag', 0.12, 0.03, (0.105, -0.16, 1.4), (0.2, -1, 0.15), 'NameTag'), 'chest')

# ---------------- armadura ----------------
arm_d = bpy.data.armatures.new('rig'); arm = link(bpy.data.objects.new('Rig', arm_d)); activate(arm)
bpy.ops.object.mode_set(mode='EDIT'); eb = arm_d.edit_bones
def bone(n, h, t, par=None, conn=False):
    b = eb.new(n); b.head = Vector(h); b.tail = Vector(t)
    if par: b.parent = eb[par]; b.use_connect = conn
    return b
bone('hips', (0, 0, 0.96), (0, 0, 1.08)); bone('spine', (0, 0, 1.08), (0, 0, 1.26), 'hips', True)
bone('chest', (0, 0, 1.26), (0, 0, 1.48), 'spine', True); bone('neck', (0, 0, 1.48), (0, 0, 1.56), 'chest', True)
bone('head', (0, 0, 1.56), (0, 0, 1.78), 'neck', True)
for s, sx in (('L', 1), ('R', -1)):
    bone('upperarm_' + s, P['sho' + s][0] + Vector((sx * -0.02, 0, 0)), P['elb' + s][0], 'chest')
    bone('forearm_' + s, P['elb' + s][0], P['wri' + s][0], 'upperarm_' + s, True)
    bone('hand_' + s, P['wri' + s][0], P['wri' + s][0] + Vector((sx * 0.01, -0.01, -0.13)), 'forearm_' + s, True)
    bone('thigh_' + s, P['hip' + s][0] + Vector((0, 0, 0.03)), P['knee' + s][0], 'hips')
    bone('shin_' + s, P['knee' + s][0], (P['ank' + s][0].x, P['ank' + s][0].y, 0.11), 'thigh_' + s, True)
    bone('foot_' + s, (P['ank' + s][0].x, P['ank' + s][0].y, 0.11), (P['ank' + s][0].x, P['ank' + s][0].y - 0.15, 0.05), 'shin_' + s, True)
bpy.ops.object.mode_set(mode='OBJECT')

# UV para tela tileable: proyección inteligente y escala a 1 unidad UV = 0.22 m
def uv_world(o, meters=0.22):
    activate(o); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(55), island_margin=0.002, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    me = o.data; uvl = me.uv_layers.active.data; a3 = sum(p.area for p in me.polygons)
    a2 = 0
    for p in me.polygons:
        uvs = [uvl[i].uv for i in p.loop_indices]
        for k in range(1, len(uvs) - 1):
            a2 += abs((uvs[k] - uvs[0]).cross(uvs[k + 1] - uvs[0])) / 2
    sc = math.sqrt(a3 / max(a2, 1e-9)) / meters
    for l in uvl: l.uv = l.uv * sc
uv_world(suit)
for o, b in RIGID:
    if o.data.uv_layers and o.name.startswith(('flagpatch', 'missionpatch', 'nametag')): continue
    if MATS['Suit'] in list(o.data.materials) or MATS['PLSS'] in list(o.data.materials) or MATS['Boot'] in list(o.data.materials) or MATS['Glove'] in list(o.data.materials) or MATS['Sole'] in list(o.data.materials) or MATS['Hose'] in list(o.data.materials) or MATS['Gauntlet'] in list(o.data.materials):
        uv_world(o, 0.22 if MATS['Sole'] not in list(o.data.materials) else 0.12)
    elif not o.data.uv_layers:
        o.data.uv_layers.new()

# pesos automáticos para el traje
activate(suit); arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
print('VG', [g.name for g in suit.vertex_groups])
# piezas rígidas: grupo de vértices con peso 1 y unir al traje
for o, b in RIGID:
    vg = o.vertex_groups.new(name=b); vg.add(list(range(len(o.data.vertices))), 1.0, 'REPLACE')
    if not o.data.uv_layers: o.data.uv_layers.new()
for o, b in RIGID:  # igualar nombre de la capa UV
    o.data.uv_layers[0].name = suit.data.uv_layers[0].name
activate(suit)
for o, b in RIGID: o.select_set(True)
bpy.ops.object.join()
suit = bpy.context.object; suit.name = 'Astronaut'
# color de vértices: oclusión ambiental horneada + polvo lunar en botas y piernas
ca = suit.data.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER'); suit.data.color_attributes.active_color = ca
scn.render.engine = 'CYCLES'; scn.cycles.samples = 48; scn.cycles.device = 'CPU'
world = bpy.data.worlds.new('w'); scn.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (1, 1, 1, 1)
activate(suit); mod = [m for m in suit.modifiers if m.type == 'ARMATURE']
bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
cols = ca.data; me = suit.data
for poly in me.polygons:
    for li, vi in zip(poly.loop_indices, poly.vertices):
        z = me.vertices[vi].co.z; c = cols[li].color; ao = c[0]
        ao = 0.55 + 0.45 * ao ** 0.7
        co = me.vertices[vi].co; dn = noise.noise(co * 9) * 0.5 + 0.5; dn2 = noise.noise(co * 31 + Vector((5, 1, 2))) * 0.5 + 0.5
        top = 0.5 + 0.14 * noise.noise(co * 4)                         # borde irregular del polvo (por encima de la rodilla a veces)
        dust = max(0.0, min(1.0, (top - z) / 0.34)) ** 1.2
        kneef = max(0.0, 1 - abs(z - 0.53) / 0.09) * max(0.0, min(1.0, (-co.y - 0.04) / 0.06))  # rodillas por arrodillarse
        handf = max(0.0, 1 - abs(z - 0.82) / 0.1) * (1 if abs(co.x) > 0.3 else 0) * 0.45            # guantes al recoger muestras
        dust = min(1.0, max(dust, kneef * 0.75, handf) * (0.6 + 0.6 * dn) * (0.85 + 0.3 * dn2))
        grime = 0.96 + 0.04 * dn2
        r, g, b = ao * grime * (1 - dust * 0.5), ao * grime * (1 - dust * 0.53), ao * grime * (1 - dust * 0.58)
        cols[li].color = (r, g, b, 1)
print('TRIS', sum(len(p.vertices) - 2 for p in me.polygons), 'VERTS', len(me.vertices))

if PREV:
    for m in MATS.values():
        b = m.node_tree.nodes['Principled BSDF']; vc = m.node_tree.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'
        mix = m.node_tree.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs[0].default_value = 1
        mix.inputs[6].default_value = b.inputs['Base Color'].default_value; m.node_tree.links.new(vc.outputs[0], mix.inputs[7])
        m.node_tree.links.new(mix.outputs[2], b.inputs['Base Color'])
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.02, 0.02, 0.025, 1)
    sun = link(bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))); sun.data.energy = 5; sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
    rim = link(bpy.data.objects.new('rim', bpy.data.lights.new('rim', 'SUN'))); rim.data.energy = 2.5; rim.rotation_euler = (math.radians(-60), 0, math.radians(160))
    camd = bpy.data.cameras.new('c'); camd.lens = 60; cam = link(bpy.data.objects.new('cam', camd)); scn.camera = cam
    ang = float(os.environ.get('ANG', '-28'))
    cam.location = (math.sin(math.radians(ang)) * 4.2 * -1, -math.cos(math.radians(ang)) * 4.2, 1.25)
    d = Vector((0, 0, 1.0)) - cam.location; cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    scn.render.resolution_x, scn.render.resolution_y = 640, 900; scn.render.filepath = PREV; scn.cycles.samples = 24
    bpy.ops.render.render(write_still=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_yup=True, export_skins=True, export_animations=False,
                          export_vertex_color='ACTIVE', export_normals=True, export_tangents=False, use_selection=False, export_apply=False)
print('DONE', OUT)
