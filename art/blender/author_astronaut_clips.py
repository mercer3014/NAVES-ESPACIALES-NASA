"""Author in-place A7L clips on the imported rig. Pose rotations are degrees, XYZ euler, relative to rest.

Build-machine only (Blender). Do not install Blender in the production Docker image.
The lunar overshoe mesh and the final ground contact are applied afterwards by
art/blender/author_lunar_overshoe.py.
"""
import bpy, math, os
from mathutils import Euler

SRC = '/tmp/plb-work/astronaut-src.glb'
OUT = '/tmp/plb-work/astronaut-authored.glb'

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
for o in list(bpy.data.objects):
    if o.name == 'Icosphere':
        bpy.data.objects.remove(o, do_unlink=True)

scene = bpy.context.scene
scene.render.fps = 24
arm = bpy.data.objects['Armature']
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')
for pb in arm.pose.bones:
    pb.rotation_mode = 'XYZ'

# Facing -Y. Thigh/arm X: +back / -forward. Knee -X bends and lifts the foot.
# Hips location.y is up. Arm Z raises the hand out to that side (left -, right +).

def set_pose(spec):
    for pb in arm.pose.bones:
        pb.rotation_euler = (0, 0, 0)
        pb.location = (0, 0, 0)
    for name, vals in spec.items():
        pb = arm.pose.bones[name]
        if 'loc' in vals:
            pb.location = vals['loc']
        rot = [math.radians(vals.get(k, 0)) for k in ('x', 'y', 'z')]
        pb.rotation_euler = Euler(rot)
    bpy.context.view_layer.update()

def key(frame):
    for pb in arm.pose.bones:
        pb.keyframe_insert('rotation_euler', frame=frame)
        pb.keyframe_insert('location', frame=frame)

def smooth(action):
    for fc in action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'BEZIER'
            kp.handle_left_type = 'AUTO_CLAMPED'
            kp.handle_right_type = 'AUTO_CLAMPED'

def new_action(name):
    old = bpy.data.actions.get(name)
    if old:
        bpy.data.actions.remove(old)
    act = bpy.data.actions.new(name)
    arm.animation_data.action = act
    return act

def elbow(side, bend=-28):
    return {f'{side}ForeArm': {'x': bend}}

def fingers(side, curl=12):
    return {
        f'{side}HandIndex1': {'x': curl}, f'{side}HandIndex2': {'x': curl * 0.6},
        f'{side}HandMiddle1': {'x': curl}, f'{side}HandMiddle2': {'x': curl * 0.6},
        f'{side}HandThumb1': {'z': 8 if side == 'Left' else -8},
    }

# ---------- walk: alternating, in place, 1.17 s, loops ----------
walk_contact_l = {
    'Hips': {'x': 2, 'z': -3, 'loc': (0.012, -0.015, 0.0)},
    'Spine': {'x': -4, 'z': 3}, 'Spine1': {'x': -2},
    'LeftUpLeg': {'x': -28}, 'LeftLeg': {'x': -12}, 'LeftFoot': {'x': 10},
    'RightUpLeg': {'x': 22}, 'RightLeg': {'x': -38}, 'RightFoot': {'x': -6},
    'LeftArm': {'x': 28, 'z': -8}, 'RightArm': {'x': -32, 'z': 8},
    **elbow('Left', -18), **elbow('Right', -36),
    **fingers('Left', 10), **fingers('Right', 14),
}
walk_pass_l = {
    'Hips': {'x': -2, 'loc': (0.0, 0.045, 0.0)},
    'Spine': {'x': -6}, 'Spine1': {'x': -3},
    'LeftUpLeg': {'x': -4}, 'LeftLeg': {'x': -52}, 'LeftFoot': {'x': -14},
    'RightUpLeg': {'x': 6}, 'RightLeg': {'x': -10}, 'RightFoot': {'x': 6},
    'LeftArm': {'x': 6, 'z': -6}, 'RightArm': {'x': -6, 'z': 6},
    **elbow('Left', -24), **elbow('Right', -24),
    **fingers('Left', 10), **fingers('Right', 10),
}
def mirror(spec):
    out = {}
    swap = {'Left': 'Right', 'Right': 'Left'}
    for name, vals in spec.items():
        nn = name
        for a, b in swap.items():
            if name.startswith(a):
                nn = b + name[len(a):]
                break
        v = dict(vals)
        # hip sway flips; vertical stays
        if name == 'Hips' and 'loc' in v:
            x, y, z = v['loc']
            v['loc'] = (-x, y, z)
            v['z'] = -vals.get('z', 0)
        if name == 'Spine':
            v['z'] = -vals.get('z', 0)
        # arm abduction mirrors
        if 'Arm' in name and name.endswith('Arm'):
            v['z'] = -vals.get('z', 0)
        out[nn] = v
    return out

act = new_action('walk')
for fr, spec in ((0, walk_contact_l), (7, walk_pass_l), (14, mirror(walk_contact_l)), (21, mirror(walk_pass_l)), (28, walk_contact_l)):
    set_pose(spec); key(fr)
smooth(act)
act.frame_range = (0, 28)

# ---------- run: longer stride, same facing, 0.75 s ----------
run_l = {
    'Hips': {'x': -8, 'z': -4, 'loc': (0.02, 0.02, 0.0)},
    'Spine': {'x': -10, 'z': 5}, 'Spine1': {'x': -4},
    'LeftUpLeg': {'x': -42}, 'LeftLeg': {'x': -18}, 'LeftFoot': {'x': 14},
    'RightUpLeg': {'x': 28}, 'RightLeg': {'x': -58}, 'RightFoot': {'x': -10},
    'LeftArm': {'x': 46, 'z': -14}, 'RightArm': {'x': -50, 'z': 12},
    **elbow('Left', -22), **elbow('Right', -48),
    **fingers('Left', 16), **fingers('Right', 18),
}
run_air = {
    'Hips': {'x': -6, 'loc': (0.0, 0.09, 0.0)},
    'Spine': {'x': -8},
    'LeftUpLeg': {'x': -8}, 'LeftLeg': {'x': -70}, 'LeftFoot': {'x': -18},
    'RightUpLeg': {'x': 10}, 'RightLeg': {'x': -16}, 'RightFoot': {'x': 4},
    'LeftArm': {'x': 8, 'z': -10}, 'RightArm': {'x': -10, 'z': 10},
    **elbow('Left', -30), **elbow('Right', -30),
}
act = new_action('run')
for fr, spec in ((0, run_l), (5, run_air), (9, mirror(run_l)), (14, mirror(run_air)), (18, run_l)):
    set_pose(spec); key(fr)
smooth(act)
act.frame_range = (0, 18)

# ---------- low-g jump, also the clip the game plays as bunny-hop. 1.25 s ----------
stand = {
    'Hips': {'loc': (0, 0, 0)},
    'LeftArm': {'x': 8, 'z': -18}, 'RightArm': {'x': 8, 'z': 18},
    **elbow('Left', -22), **elbow('Right', -22),
    **fingers('Left', 8), **fingers('Right', 8),
}
crouch = {
    'Hips': {'x': -10, 'loc': (0, -0.10, 0)},
    'Spine': {'x': -12}, 'Spine1': {'x': -4},
    'LeftUpLeg': {'x': -32}, 'RightUpLeg': {'x': -32},
    'LeftLeg': {'x': -58}, 'RightLeg': {'x': -58},
    'LeftFoot': {'x': 8}, 'RightFoot': {'x': 8},
    'LeftArm': {'x': 36, 'z': -10}, 'RightArm': {'x': 36, 'z': 10},
    **elbow('Left', -20), **elbow('Right', -20),
}
launch = {
    'Hips': {'x': 4, 'loc': (0, 0.08, 0)},
    'Spine': {'x': 4},
    'LeftUpLeg': {'x': 6}, 'RightUpLeg': {'x': 6},
    'LeftLeg': {'x': -6}, 'RightLeg': {'x': -6},
    'LeftFoot': {'x': 4}, 'RightFoot': {'x': 4},
    'LeftArm': {'x': -16, 'z': -28}, 'RightArm': {'x': -16, 'z': 28},
    **elbow('Left', -16), **elbow('Right', -16),
}
apex = {
    'Hips': {'x': -4, 'loc': (0, 0.34, 0)},
    'Spine': {'x': -6},
    'LeftUpLeg': {'x': -38}, 'RightUpLeg': {'x': -38},
    'LeftLeg': {'x': -62}, 'RightLeg': {'x': -62},
    'LeftFoot': {'x': -8}, 'RightFoot': {'x': -8},
    'LeftArm': {'x': -28, 'z': -62}, 'RightArm': {'x': -28, 'z': 62},
    **elbow('Left', -24), **elbow('Right', -24),
    'Neck': {'x': 8},
}
land = {
    'Hips': {'x': -12, 'loc': (0, -0.06, 0)},
    'Spine': {'x': -8},
    'LeftUpLeg': {'x': -18}, 'RightUpLeg': {'x': -18},
    'LeftLeg': {'x': -42}, 'RightLeg': {'x': -42},
    'LeftFoot': {'x': 12}, 'RightFoot': {'x': 12},
    'LeftArm': {'x': 18, 'z': -24}, 'RightArm': {'x': 18, 'z': 24},
    **elbow('Left', -20), **elbow('Right', -20),
}
def jump_action(name):
    act = new_action(name)
    # 0, 4, 8, 16, 24, 30  -> 30/24 = 1.25s
    for fr, spec in ((0, stand), (4, crouch), (8, launch), (16, apex), (24, land), (30, stand)):
        set_pose(spec); key(fr)
    smooth(act)
    act.frame_range = (0, 30)
    return act
jump_action('bunny-hop')
# duplicate keys into low-g-jump
jump_action('low-g-jump')

# ---------- ladder: 2.0 s alternating reach, loops ----------
def climb(hand, foot):
    # Arm local Z lifts the hand overhead (left -, right +). Thigh -X steps forward.
    other_h = 'Right' if hand == 'Left' else 'Left'
    other_f = 'Right' if foot == 'Left' else 'Left'
    hz = -110 if hand == 'Left' else 110
    oz = -25 if other_h == 'Left' else 25
    return {
        'Hips': {'x': 4, 'loc': (0.0, 0.0, -0.02)},
        'Spine': {'x': 8},
        f'{hand}Arm': {'z': hz * 0.72, 'x': -70},
        f'{other_h}Arm': {'z': oz, 'x': 8},
        f'{hand}ForeArm': {'x': -10}, f'{other_h}ForeArm': {'x': -24},
        f'{foot}UpLeg': {'x': -34}, f'{foot}Leg': {'x': -40}, f'{foot}Foot': {'x': 4},
        f'{other_f}UpLeg': {'x': 12}, f'{other_f}Leg': {'x': -14}, f'{other_f}Foot': {'x': 2},
        'Neck': {'x': -6},
    }
act = new_action('climb-ladder')
for fr, spec in ((0, climb('Left', 'Right')), (12, climb('Left', 'Right') | {'Hips': {'x': -2, 'loc': (0, -0.02, -0.02)}}),
                 (24, climb('Right', 'Left')), (36, climb('Right', 'Left') | {'Hips': {'x': -2, 'loc': (0, -0.02, -0.02)}}),
                 (48, climb('Left', 'Right'))):
    set_pose(spec); key(fr)
smooth(act)
act.frame_range = (0, 48)

# ---------- plant flag: three hammer strokes inside 3.0 s (game scrubs 0–0.57 / hold 0.73, then +1 s) ----------
def hammer(phase):
    # phase: ready, back, strike, hold
    poses = {
        'ready': {'rx': -10, 'rz': 40, 'lx': -8, 'lz': -20, 'sp': -4, 'hip': -0.01},
        'back': {'rx': -105, 'rz': 24, 'lx': -12, 'lz': -16, 'sp': 12, 'hip': 0.03},
        'strike': {'rx': 42, 'rz': 16, 'lx': -8, 'lz': -14, 'sp': -20, 'hip': -0.05},
        'hold': {'rx': 8, 'rz': 36, 'lx': -6, 'lz': -16, 'sp': -8, 'hip': -0.02},
    }[phase]
    return {
        'Hips': {'x': poses['sp'] * 0.4, 'loc': (0, poses['hip'], 0)},
        'Spine': {'x': poses['sp']}, 'Spine1': {'x': poses['sp'] * 0.4},
        'RightArm': {'x': poses['rx'], 'z': poses['rz']},
        'LeftArm': {'x': poses['lx'], 'z': poses['lz']},
        'RightForeArm': {'x': -18 if phase != 'back' else -8},
        'LeftForeArm': {'x': -36},
        'RightUpLeg': {'x': -8}, 'LeftUpLeg': {'x': -6},
        'RightLeg': {'x': -12}, 'LeftLeg': {'x': -10},
        'Neck': {'x': 6 if phase == 'back' else -4},
        **fingers('Right', 22), **fingers('Left', 14),
    }
act = new_action('plant-flag')
pattern = ((0, 'ready'), (6, 'back'), (14, 'strike'), (18, 'hold'))
for base in (0, 24, 48):
    for fr, phase in pattern:
        set_pose(hammer(phase)); key(base + fr)
set_pose(hammer('ready')); key(72)
smooth(act)
act.frame_range = (0, 72)

# rename imported leftovers that still have the suffix, and drop replaced names' old copies (already removed)
# Importer names are walk_Armature etc. We created clean names. Remove the imported duplicates of replaced clips.
for suffix_name in ['walk_Armature', 'bunny-hop_Armature', 'climb-ladder_Armature', 'plant-flag_Armature']:
    old = bpy.data.actions.get(suffix_name)
    if old:
        bpy.data.actions.remove(old)
# Restore original names on the clips we did not replace, so export matches the game.
for act in list(bpy.data.actions):
    if act.name.endswith('_Armature'):
        act.name = act.name[:-len('_Armature')]

print('ACTIONS', sorted(bpy.data.actions.keys()))
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    export_animations=True,
    export_nla_strips=False,
    export_skins=True,
    export_morph=False,
    export_yup=True,
    export_apply=False,
    export_texcoords=True,
    export_normals=True,
    export_materials='EXPORT',
    export_image_format='AUTO',
)
print('exported', OUT, os.path.getsize(OUT))
