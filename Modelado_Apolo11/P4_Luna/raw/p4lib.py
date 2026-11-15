# Utilidades comunes Persona 4 (copia de P3_Tierra/raw/p3c_lib.py, ROOT = P4_Luna).
# Uso: dentro de Blender 4.2 (bpy). Z-arriba, metros reales; export glTF +Y Up.
import bpy, bmesh, math, os
from mathutils import Vector, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = 'METRIC'
    return sc

_mats = {}
def mat(name, color, rough=0.6, metal=0.0, emit=None, emit_strength=1.0, alpha=None, image=None, transmission=None):
    key = name
    if key in _mats and _mats[key].name in bpy.data.materials:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1.0) if len(color) == 3 else color
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if image is not None:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = image
        t.interpolation = 'Linear'
        if tuple(color[:3]) != (1, 1, 1):
            # tinte: Imagen x Color (Mix Multiply, factor 1) -> el exportador glTF lo escribe como baseColorFactor
            mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'
            mx.inputs['Factor'].default_value = 1.0
            mx.inputs[7].default_value = (*color[:3], 1.0)
            nt.links.new(t.outputs['Color'], mx.inputs[6])
            nt.links.new(mx.outputs[2], b.inputs['Base Color'])
        else:
            nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    if emit is not None:
        b.inputs['Emission Color'].default_value = (*emit, 1.0)
        b.inputs['Emission Strength'].default_value = emit_strength
    if alpha is not None:
        b.inputs['Alpha'].default_value = alpha
        m.blend_method = 'BLEND'
        try: m.surface_render_method = 'BLENDED'
        except Exception: pass
    if transmission is not None:
        b.inputs['Transmission Weight'].default_value = transmission
    _mats[key] = m
    return m

def new_obj(name, bm, mats=(), parent=None, smooth=False):
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    for p in me.polygons: p.use_smooth = smooth
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if parent is not None: ob.parent = parent
    return ob

def empty(name, loc=(0,0,0), parent=None, size=0.2):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = size
    e.location = loc
    bpy.context.scene.collection.objects.link(e)
    if parent is not None: e.parent = parent
    return e

def box(bm, center, size, mi=0, rot_z=0.0):
    """Añade un cubo (6 caras) al bmesh. size = (sx,sy,sz)."""
    r = bmesh.ops.create_cube(bm, size=1.0)
    vs = r['verts']
    M = Matrix.Translation(center) @ Matrix.Rotation(rot_z, 4, 'Z') @ Matrix.Diagonal((*size, 1))
    bmesh.ops.transform(bm, matrix=M, verts=vs)
    for f in {f for v in vs for f in v.link_faces}: f.material_index = mi
    return vs

def cyl(bm, center, r1, r2, depth, segs=12, mi=0, axis='Z', cap=True):
    res = bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=segs, radius1=r1, radius2=r2, depth=depth)
    vs = res['verts']
    R = Matrix.Identity(4)
    if axis == 'X': R = Matrix.Rotation(math.pi/2, 4, 'Y')
    if axis == 'Y': R = Matrix.Rotation(math.pi/2, 4, 'X')
    bmesh.ops.transform(bm, matrix=Matrix.Translation(center) @ R, verts=vs)
    for f in {f for v in vs for f in v.link_faces}: f.material_index = mi
    return vs

def sphere(bm, center, r, segs=10, rings=6, mi=0, scale=(1,1,1)):
    res = bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=r)
    vs = res['verts']
    bmesh.ops.transform(bm, matrix=Matrix.Translation(center) @ Matrix.Diagonal((*scale,1)), verts=vs)
    for f in {f for v in vs for f in v.link_faces}: f.material_index = mi
    return vs

def torus(bm, center, R, r, segs=16, tsegs=8, mi=0, scale=(1,1,1)):
    verts = []
    for i in range(segs):
        a = 2*math.pi*i/segs
        row = []
        for j in range(tsegs):
            b = 2*math.pi*j/tsegs
            x = (R + r*math.cos(b))*math.cos(a)
            y = (R + r*math.cos(b))*math.sin(a)
            z = r*math.sin(b)
            row.append(bm.verts.new((center[0]+x*scale[0], center[1]+y*scale[1], center[2]+z*scale[2])))
        verts.append(row)
    for i in range(segs):
        for j in range(tsegs):
            a = verts[i][j]; b = verts[(i+1)%segs][j]; c = verts[(i+1)%segs][(j+1)%tsegs]; d = verts[i][(j+1)%tsegs]
            f = bm.faces.new((a,b,c,d)); f.material_index = mi
    return [v for row in verts for v in row]

def quad_uv(bm, corners, uvrect, mi=0, uv_layer=None):
    """Cara plana con 4 esquinas (orden CCW mirando la cara) y uv rect (u0,v0,u1,v1)."""
    vs = [bm.verts.new(c) for c in corners]
    f = bm.faces.new(vs); f.material_index = mi
    uv = uv_layer or bm.loops.layers.uv.verify()
    u0,v0,u1,v1 = uvrect
    for loop, (u,v) in zip(f.loops, [(u0,v0),(u1,v0),(u1,v1),(u0,v1)]):
        loop[uv].uv = (u,v)
    return f

def tris_count(objs=None):
    n = 0
    for ob in (objs or bpy.context.scene.objects):
        if ob.type == 'MESH':
            for p in ob.data.polygons: n += len(p.vertices) - 2
    return n

def export(name, sub='glb', animations=False, extra=None, extras=False):
    raw_glb = os.path.join(ROOT, 'raw', name + '-raw.glb')
    bpy.ops.export_scene.gltf(filepath=raw_glb, export_format='GLB', export_yup=True,
        export_apply=True, export_animations=animations, export_morph=True,
        export_morph_normal=True, export_lights=False, export_cameras=False,
        export_extras=extras, export_image_format='AUTO', **(extra or {}))
    return raw_glb

def save_blend(name):
    p = os.path.join(ROOT, 'blend', name + '-v01.blend')
    bpy.ops.wm.save_as_mainfile(filepath=p, compress=True)
    return p

def look_at(cam, target):
    d = Vector(target) - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

def render_preview(name, cam_loc, target, lens=35, world=(0.6,0.65,0.7), world_strength=0.8,
                   sun=(50, 0, 30), sun_strength=3.0, samples=48, hide=(), extra_lights=()):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.render.resolution_x = sc.render.resolution_y = 1024
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'AgX'
    if sc.world is None:
        sc.world = bpy.data.worlds.new('W')
    sc.world.use_nodes = True
    bg = sc.world.node_tree.nodes['Background']
    bg.inputs[0].default_value = (*world, 1); bg.inputs[1].default_value = world_strength
    added = []
    if sun is not None:
        ld = bpy.data.lights.new('preview-sun', 'SUN'); ld.energy = sun_strength; ld.angle = 0.1
        lo = bpy.data.objects.new('preview-sun', ld); sc.collection.objects.link(lo)
        lo.rotation_euler = (math.radians(sun[0]), math.radians(sun[1]), math.radians(sun[2]))
        added.append(lo)
    for (loc, energy, size) in extra_lights:
        ld = bpy.data.lights.new('preview-area', 'AREA'); ld.energy = energy; ld.size = size
        lo = bpy.data.objects.new('preview-area', ld); sc.collection.objects.link(lo); lo.location = loc
        added.append(lo)
    cd = bpy.data.cameras.new('preview-cam'); cd.lens = lens; cd.clip_end = 2000; cd.clip_start = 0.003
    cam = bpy.data.objects.new('preview-cam', cd); sc.collection.objects.link(cam)
    cam.location = cam_loc; look_at(cam, target); sc.camera = cam
    added.append(cam)
    for ob in hide: ob.hide_render = True
    sc.render.filepath = os.path.join(ROOT, 'previews', name + '.png')
    bpy.ops.render.render(write_still=True)
    for ob in hide: ob.hide_render = False
    for ob in added: bpy.data.objects.remove(ob, do_unlink=True)

def pivot_mesh(name, bm, mats, parent=None, loc=(0, 0, 0), smooth=False):
    """Pivote con nombre (empty) en el punto de agarre + malla hija '<name>-geo' (convencion del juego)."""
    e = empty(name, loc=loc, parent=parent, size=0.05)
    ob = new_obj(name + '-geo', bm, mats, parent=e, smooth=smooth)
    return e, ob

def lunar_preview(name, cam_loc, target, lens=50, samples=40, ground=True, ground_size=4.0, sun=(62, 0, 120), sun_strength=4.5,
                  world=(0.045, 0.05, 0.06), world_strength=1.0, fill=None):
    """Render 1024 px con suelo gris regolito, sol rasante y relleno suave."""
    import bpy, bmesh
    added = []
    if ground:
        bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=ground_size / 2)
        g = new_obj('preview-ground', bm, [mat('preview-regolith', (0.32, 0.31, 0.29), rough=0.95)])
        added.append(g)
    extra = fill if fill is not None else [((cam_loc[0], cam_loc[1], cam_loc[2] + 0.5), 25.0, 1.5)]
    render_preview(name, cam_loc, target, lens=lens, world=world, world_strength=world_strength, sun=sun,
                   sun_strength=sun_strength, samples=samples, extra_lights=extra)
    for ob in added: bpy.data.objects.remove(ob, do_unlink=True)
