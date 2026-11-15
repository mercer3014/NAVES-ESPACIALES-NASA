"""Utilidades bpy compartidas por mocr_room.py y armstrong_house.py (Persona 3).
Geometria low-poly construida a mano (sin modificadores) con UVs a regiones de un atlas 512 px."""
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

ATLAS = 512.0

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = 'METRIC'
    return sc

def srgb2lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

_img_cache = {}
def load_image(path):
    if path not in _img_cache:
        img = bpy.data.images.load(path)
        img.colorspace_settings.name = 'sRGB'
        _img_cache[path] = img
    return _img_cache[path]

def mat(name, color=(0.8, 0.8, 0.8), rough=0.6, metal=0.0, emit=None, emit_strength=1.0,
        tex=None, tex_emit=False, tex_base=True, alpha=None):
    """Material PBR simple. color en sRGB 0-1. tex = ruta de atlas (se usa como baseColor y/o emisivo)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.use_backface_culling = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    lin = [srgb2lin(c) for c in color] + [1.0]
    bsdf.inputs['Base Color'].default_value = lin
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    img_node = None
    if tex:
        img_node = nt.nodes.new('ShaderNodeTexImage')
        img_node.image = load_image(tex)
        img_node.interpolation = 'Linear'
        if tex_base:
            nt.links.new(img_node.outputs['Color'], bsdf.inputs['Base Color'])
    if emit is not None or tex_emit:
        if tex_emit and img_node is not None:
            nt.links.new(img_node.outputs['Color'], bsdf.inputs['Emission Color'])
        else:
            bsdf.inputs['Emission Color'].default_value = [srgb2lin(c) for c in emit] + [1.0]
        bsdf.inputs['Emission Strength'].default_value = emit_strength
    if alpha is not None:
        bsdf.inputs['Alpha'].default_value = alpha
        m.blend_method = 'BLEND'
    return m

def uvrect(px0, py0, px1, py1):
    """Region del atlas en pixeles (origen arriba-izquierda como en la imagen) -> (u0,v0,u1,v1)."""
    return (px0 / ATLAS, 1 - py1 / ATLAS, px1 / ATLAS, 1 - py0 / ATLAS)

class MB:
    """Mesh builder: caras con material y UV, orientadas hacia fuera de un centroide o segun una normal deseada."""
    def __init__(self):
        self.verts = []; self.faces = []; self.fmat = []; self.fuv = []; self.mats = []
    def _mi(self, m):
        if m not in self.mats:
            self.mats.append(m)
        return self.mats.index(m)
    def face(self, pts, m, outward=None, center=None, uv=None):
        pts = [Vector(p) for p in pts]
        n = (pts[1] - pts[0]).cross(pts[2] - pts[1])
        if outward is None and center is not None:
            fc = sum(pts, Vector()) / len(pts)
            outward = fc - Vector(center)
        if outward is not None and n.dot(Vector(outward)) < 0:
            pts = list(reversed(pts))
            rev = True
        else:
            rev = False
        base = len(self.verts)
        self.verts += [tuple(p) for p in pts]
        self.faces.append(tuple(range(base, base + len(pts))))
        self.fmat.append(self._mi(m))
        if uv is None:
            uvs = [(0, 0), (1, 0), (1, 1), (0, 1)][:len(pts)] if len(pts) == 4 else [(0.5, 0.5)] * len(pts)
        else:
            u0, v0, u1, v1 = uv
            # orden: p0=abajo-izq, p1=abajo-der, p2=arriba-der, p3=arriba-izq (antes de invertir)
            uvs = [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
            if rev:
                uvs = list(reversed(uvs))
        self.fuv.append(uvs)
    def box(self, mn, mx, m, M=None, skip=(), mats=None, uvs=None):
        """Caja eje-alineada [mn,mx] (luego transformada por M). skip: caras a omitir ('-x','+x','-y','+y','-z','+z')."""
        x0, y0, z0 = mn; x1, y1, z1 = mx
        v = [Vector(p) for p in [(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0),(x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)]]
        if M is not None:
            v = [M @ p for p in v]
        c = sum(v, Vector()) / 8
        F = {'-z': (0,1,2,3), '+z': (4,5,6,7), '-y': (0,1,5,4), '+y': (2,3,7,6), '-x': (3,0,4,7), '+x': (1,2,6,5)}
        for k, idx in F.items():
            if k in skip:
                continue
            mm = (mats or {}).get(k, m)
            self.face([v[i] for i in idx], mm, center=c, uv=(uvs or {}).get(k))
    def prism_x(self, profile_yz, x0, x1, m, M=None, caps=True, cap_mat=None):
        """Prisma convexo: perfil (y,z) extruido en X."""
        P0 = [Vector((x0, y, z)) for y, z in profile_yz]
        P1 = [Vector((x1, y, z)) for y, z in profile_yz]
        if M is not None:
            P0 = [M @ p for p in P0]; P1 = [M @ p for p in P1]
        c = (sum(P0, Vector()) + sum(P1, Vector())) / (2 * len(P0))
        n = len(P0)
        for i in range(n):
            j = (i + 1) % n
            self.face([P0[i], P0[j], P1[j], P1[i]], m, center=c)
        if caps:
            self.face(P0, cap_mat or m, center=c)
            self.face(P1, cap_mat or m, center=c)
    def cyl(self, cx, cy, z0, z1, r, seg, m, M=None, top=True, bottom=False, r1=None):
        r1 = r if r1 is None else r1
        B = [Vector((cx + r * math.cos(2*math.pi*i/seg), cy + r * math.sin(2*math.pi*i/seg), z0)) for i in range(seg)]
        T = [Vector((cx + r1 * math.cos(2*math.pi*i/seg), cy + r1 * math.sin(2*math.pi*i/seg), z1)) for i in range(seg)]
        if M is not None:
            B = [M @ p for p in B]; T = [M @ p for p in T]
        c = (sum(B, Vector()) + sum(T, Vector())) / (2 * seg)
        for i in range(seg):
            j = (i + 1) % seg
            self.face([B[i], B[j], T[j], T[i]], m, center=c)
        if top:
            self.face(T, m, center=c)
        if bottom:
            self.face(B, m, center=c)
    def build(self, name, coll=None):
        me = bpy.data.meshes.new(name)
        me.from_pydata(self.verts, [], self.faces)
        for m in self.mats:
            me.materials.append(m)
        for p, mi in zip(me.polygons, self.fmat):
            p.material_index = mi
            p.use_smooth = False
        uvl = me.uv_layers.new(name='UVMap')
        for p, uvs in zip(me.polygons, self.fuv):
            for li, uv in zip(p.loop_indices, uvs):
                uvl.data[li].uv = uv
        # soldar vertices coincidentes con mismo UV no es necesario (flat shading); limpiar duplicados exactos
        bm = bmesh.new(); bm.from_mesh(me)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
        bm.to_mesh(me); bm.free()
        me.update()
        return me

def obj(name, data, parent=None, loc=(0, 0, 0), rot_z=0.0, coll=None):
    o = bpy.data.objects.new(name, data)
    (coll or bpy.context.scene.collection).objects.link(o)
    o.location = loc
    o.rotation_euler = (0, 0, rot_z)
    if parent is not None:
        o.parent = parent
    return o

def empty(name, parent=None, loc=(0, 0, 0), rot_z=0.0, size=0.25, props=None, coll=None):
    o = bpy.data.objects.new(name, None)
    (coll or bpy.context.scene.collection).objects.link(o)
    o.empty_display_type = 'ARROWS'
    o.empty_display_size = size
    o.location = loc
    o.rotation_euler = (0, 0, rot_z)
    if parent is not None:
        o.parent = parent
    for k, v in (props or {}).items():
        o[k] = v
    return o

def tri_count(objs):
    t = 0
    for o in objs:
        if o.type == 'MESH':
            t += sum(len(p.vertices) - 2 for p in o.data.polygons)
    return t

def look_at_cam(name, loc, target, lens=24, coll=None):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.clip_start = 0.05; cd.clip_end = 300
    c = bpy.data.objects.new(name, cd)
    (coll or bpy.context.scene.collection).objects.link(c)
    c.location = loc
    d = Vector(target) - Vector(loc)
    c.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return c

def area_light(name, loc, size, energy, color=(1, 1, 1), size_y=None, rot=(0, 0, 0), coll=None):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.energy = energy; ld.color = color
    ld.shape = 'RECTANGLE'; ld.size = size; ld.size_y = size_y or size
    lo = bpy.data.objects.new(name, ld)
    (coll or bpy.context.scene.collection).objects.link(lo)
    lo.location = loc; lo.rotation_euler = rot
    return lo

def point_light(name, loc, energy, color=(1, 1, 1), radius=0.1, coll=None):
    ld = bpy.data.lights.new(name, 'POINT')
    ld.energy = energy; ld.color = color; ld.shadow_soft_size = radius
    lo = bpy.data.objects.new(name, ld)
    (coll or bpy.context.scene.collection).objects.link(lo)
    lo.location = loc
    return lo

def setup_render(sc, samples=96, w=1024, h=768):
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 6
    sc.render.resolution_x = w; sc.render.resolution_y = h
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.render.threads_mode = 'FIXED'; sc.render.threads = 6

def export_glb(path, export_objs=None):
    bpy.ops.object.select_all(action='DESELECT')
    kw = dict(filepath=path, export_format='GLB', export_yup=True, export_apply=True,
              export_extras=True, export_cameras=False, export_lights=False,
              export_materials='EXPORT', export_image_format='AUTO', export_texcoords=True,
              export_normals=True, export_draco_mesh_compression_enable=False)
    if export_objs is not None:
        for o in export_objs:
            o.select_set(True)
        kw['use_selection'] = True
    bpy.ops.export_scene.gltf(**kw)
