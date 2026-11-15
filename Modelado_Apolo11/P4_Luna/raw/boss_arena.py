# boss-arena.glb (No Canon): suelo de crater 60 m, borde en 8 trozos, 5 rocas, spawns.
# Uso: flock /tmp/blender.lock ~/bin/blender -b -P boss_arena.py
import bpy, bmesh, math, os, random
from mathutils import Vector, Matrix, noise
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def srgb(r, g, b):
    f = lambda v: ((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92
    return (f(r / 255), f(g / 255), f(b / 255))
m = bpy.data.materials.new('regolito'); m.use_nodes = True; nt = m.node_tree; bs = nt.nodes['Principled BSDF']
vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'; nt.links.new(vc.outputs['Color'], bs.inputs['Base Color'])
bs.inputs['Roughness'].default_value = 0.95; m.use_backface_culling = True

SG = Vector((0, 10, 0)); SP = Vector((0, -24, 0))   # spawn-guardian (centro norte), spawn-player (borde sur)
CRATERS = [((-14, -2), 3.2, 0.45), ((15, -4), 2.4, 0.35), ((-7, -15), 1.8, 0.3), ((11, -19), 2.8, 0.4), ((-19, 14), 3.6, 0.5), ((20, 13), 2.0, 0.3)]
def ss(a, b, x): t = max(0, min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t)
N0 = 0.0
def floor_h(x, y, flat=True):
    return _floor_h(x, y, flat) - RAW0
def _floor_h(x, y, flat=True):
    p = Vector((x, y, 0)); r = p.length
    h = 0.9 * (r / 30.0) ** 2.2
    h += noise.noise(p * 0.11) * 0.22 + noise.noise(p * 0.45 + Vector((5, 1, 0))) * 0.05 - N0
    for (cx, cy), rc, d in CRATERS:
        q = math.hypot(x - cx, y - cy) / rc
        if q < 1: h -= d * (1 - q * q)
        elif q < 1.6: h += d * 0.35 * math.sin((q - 1) / 0.6 * math.pi)
    if flat:
        for c, r0, r1 in ((SG, 8.5, 12.5), (SP, 2.5, 4.5)):
            w = ss(r0, r1, (p - c).length)
            h = _floor_h(c.x, c.y, False) * (1 - w) + h * w if w < 1 else h
    return h
RAW0 = 0.0
RAW0 = _floor_h(0, 0)
CREST_A = [random.Random(4).uniform(0, 6.28) for _ in range(3)]
def rim_h(x, y):
    p = Vector((x, y, 0)); r = p.length; a = math.atan2(y, x)
    crest = 8.0 + 1.8 * math.sin(3 * a + CREST_A[0]) + 1.1 * math.sin(7 * a + CREST_A[1]) + 0.8 * math.sin(11 * a + CREST_A[2])
    crest -= 2.2 * math.exp(-((math.atan2(math.sin(a + math.pi / 2), math.cos(a + math.pi / 2))) / 0.35) ** 2)   # mas bajo al sur (entrada)
    edge = floor_h(x * 30 / max(r, 1e-6), y * 30 / max(r, 1e-6), False) if r > 0 else 0
    if r <= 30: base = edge - 0.35 + (r - 29.0) * 0.35
    if r <= 34: h = (edge - 0.35) + (crest - edge + 0.35) * ss(29.0, 34.0, r)
    else: h = crest - (crest - 2.0) * ss(34.0, 41.0, r)
    h += (noise.noise(p * 0.16 + Vector((0, 0, 3))) * 1.6 + (0.5 - abs(noise.noise(p * 0.32 + Vector((4, 0, 0))))) * 1.4) * ss(30, 33, r) + noise.noise(p * 0.7) * 0.25
    return h

def colorize(me, base, var=0.18, freq=0.3):
    ca = me.color_attributes.new('Col', 'BYTE_COLOR', 'CORNER')
    for poly in me.polygons:
        c = poly.center
        for li, vi in zip(poly.loop_indices, poly.vertices):
            co = me.vertices[vi].co
            f = 1 + var * noise.noise(co * freq + Vector((9, 9, 9))) + 0.06 * noise.noise(co * 1.7)
            ca.data[li].color = (*srgb(*(max(0, min(255, b * f)) for b in base)), 1)

def mk(name, bm, smooth=True):
    me = bpy.data.meshes.new(name); bm.normal_update(); bm.to_mesh(me); bm.free(); me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob); return ob

objs = []
# ---- suelo (disco polar)
RINGS, SEGS, R = 24, 72, 30.5
bm = bmesh.new()
c0 = bm.verts.new((0, 0, floor_h(0, 0)))
rings = []
for i in range(1, RINGS + 1):
    r = R * (i / RINGS) ** 0.85
    row = []
    for j in range(SEGS):
        a = 2 * math.pi * (j + 0.5 * (i % 2)) / SEGS
        x, y = r * math.cos(a), r * math.sin(a); row.append(bm.verts.new((x, y, floor_h(x, y))))
    rings.append(row)
for j in range(SEGS): bm.faces.new((c0, rings[0][j], rings[0][(j + 1) % SEGS]))
for i in range(RINGS - 1):
    A, B = rings[i], rings[i + 1]
    for j in range(SEGS):
        bm.faces.new((A[j], B[j], B[(j + 1) % SEGS], A[(j + 1) % SEGS]))
bmesh.ops.triangulate(bm, faces=bm.faces)
fl = mk('arena-floor', bm); colorize(fl.data, (150, 145, 136)); objs.append(fl)
# ---- borde en 8 trozos (rim-1 centrado al norte, sentido horario visto desde arriba)
AN, RN = 22, 16
for k in range(8):
    ac = math.pi / 2 - k * math.pi / 4
    bm = bmesh.new(); grid = []
    for i in range(AN + 1):
        a = ac + math.pi / 8 - i * (math.pi / 4) / AN
        row = []
        for jr in range(RN + 1):
            r = 29.2 + (41.5 - 29.2) * (jr / RN) ** 1.15
            x, y = r * math.cos(a), r * math.sin(a); row.append(bm.verts.new((x, y, rim_h(x, y))))
        grid.append(row)
    for i in range(AN):
        for jr in range(RN):
            bm.faces.new((grid[i][jr], grid[i][jr + 1], grid[i + 1][jr + 1], grid[i + 1][jr]))
    # faldon exterior para no ver huecos
    for i in range(AN):
        a, b = grid[i][RN], grid[i + 1][RN]
        a2 = bm.verts.new((a.co.x, a.co.y, -1.0)); b2 = bm.verts.new((b.co.x, b.co.y, -1.0))
        bm.faces.new((a, a2, b2, b))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    ob = mk(f'rim-{k + 1}', bm); colorize(ob.data, (142, 137, 128), var=0.22, freq=0.15); objs.append(ob)
# ---- 5 rocas redondeadas (estilo moon-rocks)
BOULDERS = [((-12.5, -6.5), 3.6, 0.7), ((13.5, -9.0), 2.8, 0.8), ((-18.0, 9.5), 4.4, 0.65), ((18.5, 6.0), 2.2, 0.85), ((5.5, -16.5), 1.7, 0.75)]
for n, ((x, y), d, flat) in enumerate(BOULDERS):
    rnd = random.Random(30 + n)
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=4, radius=d / 2)
    off = Vector((rnd.uniform(0, 50), rnd.uniform(0, 50), rnd.uniform(0, 50)))
    for v in bm.verts:
        p = v.co.normalized()
        s = 1 + 0.22 * noise.noise(p * 1.3 + off) + 0.07 * noise.noise(p * 3.5 + off)
        v.co = Vector((v.co.x * s * rnd.uniform(0.98, 1.02), v.co.y * s * 1.1, v.co.z * s * flat))
    ob = mk(f'boulder-{n + 1}', bm)
    dec = ob.modifiers.new('d', 'DECIMATE'); dec.ratio = 0.4
    bpy.context.view_layer.objects.active = ob; bpy.ops.object.modifier_apply(modifier='d')
    for p in ob.data.polygons: p.use_smooth = True
    # origen en la base de la roca; se hunde 22 % en el suelo
    zmin = min(v.co.z for v in ob.data.vertices)
    for v in ob.data.vertices: v.co.z -= zmin
    hgt = max(v.co.z for v in ob.data.vertices)
    colorize(ob.data, (118, 114, 108), var=0.25, freq=0.8)
    ob.location = (x, y, floor_h(x, y) - 0.22 * hgt); ob.rotation_euler[2] = rnd.uniform(0, 6.28)
    objs.append(ob)
# ---- spawns
def empty(name, loc, rz):
    e = bpy.data.objects.new(name, None); e.empty_display_size = 1.0; e.location = loc; e.rotation_euler[2] = rz
    sc.collection.objects.link(e); objs.append(e)
empty('spawn-player', (SP.x, SP.y, floor_h(SP.x, SP.y)), math.pi)   # mira al norte (hacia el guardian)
empty('spawn-guardian', (SG.x, SG.y, floor_h(SG.x, SG.y)), 0.0)     # mira al sur (+Z glTF, hacia el jugador)
# aplicar transformaciones de rocas (dejan su ubicacion como nodo)
tri = sum(len(p.vertices) - 2 for o in objs if o.type == 'MESH' for p in o.data.polygons)
print(f'[P4] arena tris={tri}  sg_h={floor_h(SG.x, SG.y):.3f} sp_h={floor_h(SP.x, SP.y):.3f} center={floor_h(0, 0):.3f}')
for o in objs:
    if o.type == 'MESH': print('[P4]', o.name, sum(len(p.vertices) - 2 for p in o.data.polygons))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, 'blend', 'boss-arena-v01.blend'), compress=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(HERE, 'boss-arena-raw.glb'), export_format='GLB', export_yup=True,
    export_apply=True, export_animations=False, export_vertex_color='MATERIAL', export_lights=False, export_cameras=False)
print('[P4] OK')
