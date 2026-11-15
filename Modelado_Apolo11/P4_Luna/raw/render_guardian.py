# Render: blender -b guardian-v01.blend -P render_guardian.py -- <outdir> <vista@accion:frame> ...
# vistas: front side q back top close ; accion 'rest' o idle/sweep/slam:frame
import bpy, sys, math, os
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]; shots = argv[1:]
os.makedirs(OUT, exist_ok=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = int(os.environ.get('SAMPLES', 20)); sc.cycles.use_denoising = True
sc.render.resolution_x = sc.render.resolution_y = 1024
sc.view_settings.view_transform = 'AgX'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.03, 0.035, 0.05, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
def sun(rot, e, col=(1, 0.97, 0.92)):
    l = bpy.data.lights.new('s', 'SUN'); l.energy = e; l.color = col; l.angle = 0.05
    o = bpy.data.objects.new('s', l); sc.collection.objects.link(o); o.rotation_euler = [math.radians(a) for a in rot]
sun((55, 0, -30), 4.0); sun((70, 0, 150), 0.8, (0.7, 0.8, 1.0))
# suelo
bpy.ops.mesh.primitive_plane_add(size=120); fl = bpy.context.object
m = bpy.data.materials.new('suelo'); m.use_nodes = True
b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (0.25, 0.24, 0.22, 1); b.inputs['Roughness'].default_value = 1
fl.data.materials.append(m)
# astronauta 1,8 m de referencia
astro = None
if os.path.exists('/tmp/astro-dec.glb') and os.environ.get('ASTRO', '1') == '1':
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath='/tmp/astro-dec.glb')
    new = [o for o in bpy.data.objects if o not in before]
    for o in new:
        if 'LOD1' in o.name: o.hide_render = True
    roots = [o for o in new if o.parent is None]
    for r in roots: r.location = (8.5, -4.0, 0); r.rotation_euler[2] = math.radians(20)
rig = bpy.data.objects['guardian']
cd = bpy.data.cameras.new('cam'); cd.lens = 35; cd.clip_end = 1000
cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); sc.camera = cam
VIEWS = {'front': ((0, -31, 6.5), (0, 0, 7.3)), 'side': ((-31, -1, 6.5), (0, -1, 7.3)), 'q': ((-21, -24, 9), (1.5, -1, 7.0)),
         'back': ((22, 40, 14), (0, 0, 7.5)), 'top': ((0.1, -12, 55), (0, -1, 0)), 'close': ((-5, -16, 11), (0, -3.5, 10.5)),
         'low': ((6, -26, 1.7), (0, -2, 8.5)), 'qr': ((23, -26, 9), (-1, -1, 6.5)), 'sidefar': ((-40, -3, 9), (0, -1, 10.0))}
def set_view(v):
    loc, tgt = VIEWS[v]; cam.location = loc
    cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
for t in rig.animation_data.nla_tracks: t.mute = True
for shot in shots:
    v, p = shot.split('@')
    if p == 'rest':
        rig.animation_data.action = None
        for pb in rig.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
        sc.frame_set(1)
    else:
        a, f = p.split(':'); rig.animation_data.action = bpy.data.actions[a]; sc.frame_set(int(f))
    set_view(v)
    sc.render.filepath = os.path.join(OUT, f"guardian_{v}_{p.replace(':', '-')}.png")
    bpy.ops.render.render(write_still=True)
    print('[R]', sc.render.filepath)
