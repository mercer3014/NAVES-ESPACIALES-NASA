# Render de previews: blender -b <blend> -P p3_render.py -- <nombre> <outdir> [accion:frame ...]
import bpy, sys, math, os
from mathutils import Vector
argv = sys.argv[sys.argv.index('--') + 1:]
NAME, OUT = argv[0], argv[1]; shots = argv[2:] or ['rest']
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 24; sc.cycles.use_denoising = True
sc.render.resolution_x = 512; sc.render.resolution_y = 1024; sc.render.film_transparent = False
sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (1, 1, 1, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.6
rig = bpy.data.objects.get('armature') or bpy.data.objects['Armature']; body = bpy.data.objects.get(NAME) or [o for o in bpy.data.objects if o.type == 'MESH'][0]
H = max((body.matrix_world @ v.co).z for v in body.data.vertices)
def light(name, rot, e):
    l = bpy.data.lights.new(name, 'SUN'); l.energy = e; o = bpy.data.objects.new(name, l); sc.collection.objects.link(o)
    o.rotation_euler = [math.radians(a) for a in rot]
light('key', (50, 0, -35), 3.0); light('fill', (60, 0, 140), 1.0); light('rim', (70, 0, 200), 1.5)
# suelo
bpy.ops.mesh.primitive_plane_add(size=6); fl = bpy.context.object
m = bpy.data.materials.new('floor'); m.use_nodes = True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.92, 0.92, 0.92, 1)
fl.data.materials.append(m)
cam_d = bpy.data.cameras.new('cam'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = max(1.95, H * 1.08) * (1.0)
cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
def set_view(view, zoom=None):
    cz = H / 2 if not zoom else zoom[0]
    cam_d.ortho_scale = max(1.95 * H / 1.8, H * 1.1) if not zoom else zoom[1]
    if view == 'front': cam.location = (0, -6, cz); cam.rotation_euler = (math.radians(90), 0, 0)
    elif view == 'side': cam.location = (-6, 0, cz); cam.rotation_euler = (math.radians(90), 0, math.radians(-90))
    elif view == 'q': cam.location = (-4.2, -4.2, cz); cam.rotation_euler = (math.radians(90), 0, math.radians(-45))
def pose(shot):
    if shot == 'rest':
        rig.animation_data.action = None
        for pb in rig.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
        for t in rig.animation_data.nla_tracks: t.mute = True
        sc.frame_set(1); return
    a, f = shot.split(':')
    for t in rig.animation_data.nla_tracks: t.mute = True
    rig.animation_data.action = bpy.data.actions[a]; sc.frame_set(int(f))
os.makedirs(OUT, exist_ok=True)
for shot in shots:
    parts = shot.split('@'); p = parts[0]; views = parts[1].split(',') if len(parts) > 1 else ['front', 'side']
    pose(p)
    for v in views:
        zoom = None
        if v.endswith('-face'): v = v[:-5]; zoom = (H - 0.12 * H / 1.8, 0.42 * H / 1.8); sc.render.resolution_x = 512; sc.render.resolution_y = 512
        elif v.endswith('-low'): v = v[:-4]; zoom = (H * 0.32, H * 0.85); sc.render.resolution_x = 512; sc.render.resolution_y = 512
        else: sc.render.resolution_x = 512; sc.render.resolution_y = 1024
        set_view(v, zoom)
        sc.render.filepath = f"{OUT}/{NAME}_{p.replace(':','-')}_{v}{'-z' if zoom else ''}.png"
        bpy.ops.render.render(write_still=True)
