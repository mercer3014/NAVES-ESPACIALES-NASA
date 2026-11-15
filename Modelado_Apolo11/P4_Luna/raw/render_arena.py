# Render de la arena con el guardian y un astronauta: blender -b boss-arena-v01.blend -P render_arena.py -- <outdir> vista[:accion:frame] ...
import bpy, sys, math, os
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]; OUT = argv[0]; shots = argv[1:]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = int(os.environ.get('SAMPLES', 20)); sc.cycles.use_denoising = True
sc.render.resolution_x = sc.render.resolution_y = 1024; sc.view_settings.view_transform = 'AgX'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.01, 0.012, 0.02, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
def sun(rot, e, col=(1, 0.97, 0.92)):
    l = bpy.data.lights.new('s', 'SUN'); l.energy = e; l.color = col; l.angle = 0.03
    o = bpy.data.objects.new('s', l); sc.collection.objects.link(o); o.rotation_euler = [math.radians(a) for a in rot]
sun((float(os.environ.get('SUN_X', 62)), 0, -40), 4.5)   # SUN_X=35: sol mas alto, sombras cortas (QA); sun((75, 0, 140), 0.6, (0.7, 0.8, 1.0))
with bpy.data.libraries.load(os.path.join(ROOT, 'blend', 'guardian-v01.blend'), link=False) as (src, dst):
    dst.objects = list(src.objects); dst.actions = list(src.actions)
sg = bpy.data.objects['spawn-guardian']; sp = bpy.data.objects['spawn-player']
for o in dst.objects:
    sc.collection.objects.link(o)
rig = bpy.data.objects['guardian']; rig.location = sg.location
if os.path.exists('/tmp/astro-dec.glb'):
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath='/tmp/astro-dec.glb')
    for o in [o for o in bpy.data.objects if o not in before]:
        if 'LOD1' in o.name: o.hide_render = True
        if o.parent is None: o.location = sp.location; o.rotation_euler[2] = math.pi
cd = bpy.data.cameras.new('cam'); cd.lens = 24; cd.clip_end = 2000
cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); sc.camera = cam
VIEWS = {'top': ((0, -0.01, 105), (0, 0, 0), 30), 'ground': ((3.0, -27.5, 1.7), (0, 10, 6.5), 24),
         'oblique': ((-38, -46, 30), (0, 2, 0), 24), 'side': ((-26, -8, 3.5), (0, 8, 5), 24),
         'borde': ((-15.5, -18.5, 1.9), (-22, -26, 1.2), 24)}   # a ras de suelo mirando la union suelo-borde (QA)
for t in rig.animation_data.nla_tracks: t.mute = True
for shot in shots:
    parts = shot.split(':'); v = parts[0]
    if len(parts) == 3: rig.animation_data.action = bpy.data.actions[parts[1]]; sc.frame_set(int(parts[2]))
    else: rig.animation_data.action = None; sc.frame_set(1)
    loc, tgt, lens = VIEWS[v]; cam.location = loc; cd.lens = lens
    cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(OUT, 'arena_' + shot.replace(':', '-') + '.png'); bpy.ops.render.render(write_still=True)
    print('[R]', sc.render.filepath)
