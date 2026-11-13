"""Replace the A7L feet with Apollo lunar overshoes and plant the soles.

Build-machine only (Blender). Do not install Blender in the production Docker image.
Run after the suit GLB has been decoded to SRC. Writes OUT with the same rig,
clip names, and durations. Walk, run, climb, and idle are re-keyed so the new
flat sole meets the ground instead of clipping or hovering.
"""
import math
import os

import bmesh
import bpy
from mathutils import Quaternion, Vector

SRC = '/tmp/plb-work/astronaut-edit.glb'
OUT = '/tmp/plb-work/astronaut-booted.glb'

HEEL_Y = 0.086
TOE_Y = -0.250
SOLE_TOP = 0.034
RIB_TOP = 0.012

MAT_SHOE, MAT_SOLE, MAT_STRAP, MAT_BUCKLE = 0, 1, 2, 3


def lerp(a, b, t):
    return a + (b - a) * t


def y_of(t):
    return lerp(HEEL_Y, TOE_Y, t)


def half_width(t):
    # Foot-shaped plan: rounded heel, broad toe, not a blob.
    if t < 0.07:
        u = t / 0.07
        return 0.020 + 0.030 * math.sin(u * math.pi * 0.5)
    if t < 0.28:
        return lerp(0.050, 0.056, (t - 0.07) / 0.21)
    if t < 0.62:
        return lerp(0.056, 0.066, (t - 0.28) / 0.34)
    if t < 0.86:
        return lerp(0.066, 0.060, (t - 0.62) / 0.24)
    u = (t - 0.86) / 0.14
    return lerp(0.060, 0.016, u ** 0.85)


def upper_top(t):
    # Heel counter rises into a cuff that overlaps the suit shin, then the instep.
    if t < 0.08:
        return lerp(0.11, 0.205, t / 0.08)
    if t < 0.30:
        return 0.205
    if t < 0.44:
        return lerp(0.205, 0.108, (t - 0.30) / 0.14)
    if t < 0.78:
        return lerp(0.108, 0.066, (t - 0.44) / 0.34)
    return lerp(0.066, 0.044, (t - 0.78) / 0.22)


def new_face(bm, verts, mat, bucket):
    if len(verts) < 3:
        return None
    try:
        face = bm.faces.new(tuple(verts))
    except ValueError:
        return None
    face.material_index = mat
    bucket.append(face)
    return face


def orient(bm, faces, interior):
    if not faces:
        return
    bm.normal_update()
    interior = Vector(interior)
    bad = [f for f in faces if f.normal.dot(f.calc_center_median() - interior) < 0]
    if bad:
        bmesh.ops.reverse_faces(bm, faces=bad)
    bm.normal_update()


def add_box(bm, origin, ux, uy, uz, mat, bucket):
    """Axis-aligned in the given half-extent vectors. ux/uy/uz point from center to a face."""
    before = len(bm.faces)
    ret = bmesh.ops.create_cube(bm, size=1.0)
    origin = Vector(origin)
    for v in ret['verts']:
        v.co = origin + ux * (v.co.x * 2) + uy * (v.co.y * 2) + uz * (v.co.z * 2)
    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    for face in bm.faces[before:]:
        face.material_index = mat
        bucket.append(face)


def build_foot(bm, cx, lod):
    shoe, sole, strap = [], [], []
    n_len = 28 if lod == 'hi' else 14
    n_wid = 9 if lod == 'hi' else 5
    y_mid = (HEEL_Y + TOE_Y) * 0.5

    grid = [[[None, None] for _ in range(n_wid)] for _ in range(n_len)]
    for j in range(n_len):
        t = j / (n_len - 1)
        y = y_of(t)
        hw = half_width(t)
        for i in range(n_wid):
            x = cx + lerp(-hw, hw, i / (n_wid - 1))
            grid[j][i][0] = bm.verts.new((x, y, RIB_TOP))
            grid[j][i][1] = bm.verts.new((x, y, SOLE_TOP))
    for j in range(n_len - 1):
        for i in range(n_wid - 1):
            b00, b10 = grid[j][i][0], grid[j][i + 1][0]
            b01, b11 = grid[j + 1][i][0], grid[j + 1][i + 1][0]
            t00, t10 = grid[j][i][1], grid[j][i + 1][1]
            t01, t11 = grid[j + 1][i][1], grid[j + 1][i + 1][1]
            new_face(bm, (b00, b01, b11, b10), MAT_SOLE, sole)
            new_face(bm, (t00, t10, t11, t01), MAT_SOLE, sole)
        # side walls, -X and +X
        new_face(bm, (grid[j][0][0], grid[j][0][1], grid[j + 1][0][1], grid[j + 1][0][0]), MAT_SOLE, sole)
        last = n_wid - 1
        new_face(bm, (grid[j][last][0], grid[j + 1][last][0], grid[j + 1][last][1], grid[j][last][1]), MAT_SOLE, sole)
    # heel and toe end caps
    for i in range(n_wid - 1):
        new_face(bm, (grid[0][i][0], grid[0][i + 1][0], grid[0][i + 1][1], grid[0][i][1]), MAT_SOLE, sole)
        j = n_len - 1
        new_face(bm, (grid[j][i][0], grid[j][i][1], grid[j][i + 1][1], grid[j][i + 1][0]), MAT_SOLE, sole)
    orient(bm, sole, (cx, y_mid, (RIB_TOP + SOLE_TOP) * 0.5))

    # Blue silicone ribs under the plate. Straight across, like the flight overshoe.
    pitch = 0.0115 if lod == 'hi' else 0.024
    rib_y = HEEL_Y - 0.012
    rib_faces_before = len(sole)
    while rib_y > TOE_Y + 0.012:
        t = (rib_y - HEEL_Y) / (TOE_Y - HEEL_Y)
        hw = half_width(min(0.98, max(0.02, t))) * 0.94
        if hw > 0.018:
            thick = pitch * 0.46
            add_box(
                bm,
                (cx, rib_y - thick * 0.5, RIB_TOP * 0.5),
                Vector((hw, 0, 0)),
                Vector((0, thick * 0.5, 0)),
                Vector((0, 0, RIB_TOP * 0.5)),
                MAT_SOLE,
                sole,
            )
        rib_y -= pitch
    # Boxes from create_cube are already outward; orient() would undo concave gaps, so leave them.

    # White-gray rubber upper. Arch sections, open along the sole welt.
    n_up = 16 if lod == 'hi' else 8
    n_arc = 9 if lod == 'hi' else 5
    rings = []
    for j in range(n_up):
        t = j / (n_up - 1)
        hw = max(0.014, half_width(t) - 0.0045)
        zt = upper_top(t)
        zb = SOLE_TOP + 0.001
        y = y_of(t)
        ring = []
        for i in range(n_arc):
            u = i / (n_arc - 1)
            if u < 0.20:
                k = u / 0.20
                x = cx - hw
                z = zb + (zt - zb) * k
            elif u > 0.80:
                k = (1 - u) / 0.20
                x = cx + hw
                z = zb + (zt - zb) * k
            else:
                k = (u - 0.20) / 0.60
                x = cx + lerp(-hw, hw, k)
                z = zt + 0.004 * math.sin(k * math.pi)
            ring.append(bm.verts.new((x, y, z)))
        rings.append(ring)
    for j in range(n_up - 1):
        for i in range(n_arc - 1):
            new_face(bm, (rings[j][i], rings[j][i + 1], rings[j + 1][i + 1], rings[j + 1][i]), MAT_SHOE, shoe)
    # Heel and toe caps so the shell is closed except the collar.
    heel_p = bm.verts.new((cx, HEEL_Y + 0.004, (SOLE_TOP + upper_top(0)) * 0.5))
    toe_p = bm.verts.new((cx, TOE_Y - 0.004, (SOLE_TOP + upper_top(1)) * 0.5))
    for i in range(n_arc - 1):
        new_face(bm, (heel_p, rings[0][i + 1], rings[0][i]), MAT_SHOE, shoe)
        new_face(bm, (toe_p, rings[-1][i], rings[-1][i + 1]), MAT_SHOE, shoe)
    orient(bm, shoe, (cx, y_mid, 0.09))

    # Opening at the top of the cuff. The suit shin (ends near z=0.18) comes out here.
    y_a, y_b = y_of(0.10), y_of(0.28)
    hole = []
    for face in shoe:
        c = face.calc_center_median()
        if min(y_a, y_b) < c.y < max(y_a, y_b) and c.z > 0.188 and abs(c.x - cx) < 0.036:
            hole.append(face)
    if hole:
        bmesh.ops.delete(bm, geom=hole, context='FACES')
        shoe[:] = [f for f in shoe if f.is_valid]

    if lod == 'hi':
        # Crossed instep laces and a pair of short eyelet blocks.
        ts = (0.40, 0.48, 0.56, 0.64)
        ends = []
        for t in ts:
            z = upper_top(t) + 0.003
            y = y_of(t)
            ends.append((Vector((cx - 0.020, y, z)), Vector((cx + 0.020, y, z))))
        for i in range(len(ends) - 1):
            for a, b in ((ends[i][0], ends[i + 1][1]), (ends[i][1], ends[i + 1][0])):
                mid = (a + b) * 0.5
                along = (b - a) * 0.5
                side = along.cross(Vector((0, 0, 1)))
                if side.length < 1e-6:
                    continue
                side = side.normalized() * 0.0024
                up = side.cross(along).normalized() * 0.0016
                add_box(bm, mid, along, side, up, MAT_STRAP, strap)
        for pair in ends:
            for p in pair:
                add_box(bm, p, Vector((0.0032, 0, 0)), Vector((0, 0.0032, 0)), Vector((0, 0, 0.0022)), MAT_BUCKLE, strap)

    # Ankle strap, ellipse in the XZ plane, plus an outer buckle.
    n_seg = 14 if lod == 'hi' else 8
    rx, rz = 0.052, 0.040
    strap_y = y_of(0.18)
    strap_z = 0.178
    for i in range(n_seg):
        a0 = math.tau * i / n_seg
        a1 = math.tau * (i + 1) / n_seg
        p0 = Vector((cx + math.cos(a0) * rx, strap_y, strap_z + math.sin(a0) * rz))
        p1 = Vector((cx + math.cos(a1) * rx, strap_y, strap_z + math.sin(a1) * rz))
        mid = (p0 + p1) * 0.5
        along = (p1 - p0) * 0.5
        radial = Vector((math.cos((a0 + a1) * 0.5), 0, math.sin((a0 + a1) * 0.5))).normalized() * 0.0035
        wide = Vector((0, 0.0065, 0))
        add_box(bm, mid, along, wide, radial, MAT_STRAP, strap)
    outer = 1 if cx > 0 else -1
    add_box(
        bm,
        (cx + outer * (rx + 0.006), strap_y, strap_z),
        Vector((0.007, 0, 0)),
        Vector((0, 0.009, 0)),
        Vector((0, 0, 0.008)),
        MAT_BUCKLE,
        strap,
    )
    return len(shoe), len(sole), len(strap)


def pbr(name, color, rough, metal=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    return mat


def delete_old_feet(obj):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    layer = bm.verts.layers.deform.active
    groups = {g.index: g.name for g in obj.vertex_groups}
    foot = {i for i, name in groups.items() if 'Foot' in name or 'Toe' in name}
    doomed = []
    for vert in bm.verts:
        best = 0.0
        for gi, weight in vert[layer].items():
            if gi in foot and weight > best:
                best = weight
        if best > 0.45:
            doomed.append(vert)
    bmesh.ops.delete(bm, geom=doomed, context='VERTS')
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    moved = 0
    for vert in obj.data.vertices:
        cx = 0.134 if vert.co.x >= 0 else -0.134
        # Slide the open end of the shin down into the cuff so the suit meets the overshoe.
        if abs(vert.co.x - cx) < 0.14 and abs(vert.co.y - 0.02) < 0.16 and vert.co.z < 0.30:
            k = max(0.0, min(1.0, (0.30 - vert.co.z) / 0.12))
            cuff_y = y_of(0.18)
            vert.co.z -= 0.05 * k
            vert.co.x = cx + (vert.co.x - cx) * (1 - 0.25 * k)
            vert.co.y = cuff_y + (vert.co.y - cuff_y) * (1 - 0.25 * k)
            moved += 1
    print(f'shrunk {obj.name} ankle stump verts {moved}, remaining {len(obj.data.vertices)}')


def join_into(host, piece):
    bpy.ops.object.select_all(action='DESELECT')
    piece.select_set(True)
    host.select_set(True)
    bpy.context.view_layer.objects.active = host
    bpy.ops.object.join()


def make_overshoes():
    mats = [
        pbr('Overshoe', (0.62, 0.60, 0.56), 0.72),
        pbr('Sole', (0.025, 0.065, 0.24), 0.40),
        pbr('Strap', (0.74, 0.71, 0.64), 0.55),
        pbr('Buckle', (0.18, 0.18, 0.19), 0.32, 0.75),
    ]
    for lod, obj_name in (('hi', 'Astronaut_LOD0'), ('lo', 'Astronaut_LOD1')):
        host = bpy.data.objects[obj_name]
        delete_old_feet(host)
        bm = bmesh.new()
        for cx in (0.134, -0.134):
            counts = build_foot(bm, cx, lod)
            print(obj_name, 'cx', cx, 'faces shoe/sole/strap', counts)
        mesh = bpy.data.meshes.new('Overshoe_' + lod)
        bm.to_mesh(mesh)
        bm.free()
        for mat in mats:
            mesh.materials.append(mat)
        for poly in mesh.polygons:
            poly.use_smooth = mesh.materials[poly.material_index].name != 'Sole'
        try:
            mesh.use_auto_smooth = True
            mesh.auto_smooth_angle = math.radians(50)
        except AttributeError:
            pass
        piece = bpy.data.objects.new('Overshoe_' + lod, mesh)
        bpy.context.collection.objects.link(piece)
        left = piece.vertex_groups.new(name='LeftFoot')
        right = piece.vertex_groups.new(name='RightFoot')
        li, ri = [], []
        for vert in mesh.vertices:
            (li if vert.co.x >= 0 else ri).append(vert.index)
        left.add(li, 1.0, 'REPLACE')
        right.add(ri, 1.0, 'REPLACE')
        join_into(host, piece)
        print(obj_name, 'joined verts', len(host.data.vertices), 'slots', [s.name for s in host.data.materials])


def bind_clear(arm):
    arm.animation_data.action = None
    for pb in arm.pose.bones:
        pb.location = (0, 0, 0)
        if pb.rotation_mode == 'QUATERNION':
            pb.rotation_quaternion = (1, 0, 0, 0)
        else:
            pb.rotation_euler = (0, 0, 0)
    bpy.context.view_layer.update()


def world_co(obj, index):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = ev.to_mesh()
    co = ev.matrix_world @ me.vertices[index].co
    ev.to_mesh_clear()
    return co


def nearest(obj, target):
    best, bi = 1e9, None
    target = Vector(target)
    for vert in obj.data.vertices:
        d = (vert.co - target).length
        if d < best:
            best, bi = d, vert.index
    return bi, best


def plant_animations(arm, body):
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    for pb in arm.pose.bones:
        if pb.rotation_mode != 'QUATERNION':
            pb.rotation_mode = 'QUATERNION'
    bind_clear(arm)
    hips = arm.pose.bones['Hips']
    ankle = arm.pose.bones['LeftFoot']
    z0 = (arm.matrix_world @ ankle.head).z
    up_axis, up_scale = 1, 1.0
    best = 0.0
    for i in range(3):
        bind_clear(arm)
        hips.location[i] = 0.05
        bpy.context.view_layer.update()
        dz = (arm.matrix_world @ ankle.head).z - z0
        print(f'hips axis {i} dz {dz:.4f}')
        if abs(dz) > abs(best):
            best = dz
            up_axis, up_scale = i, dz / 0.05
    bind_clear(arm)

    markers = {}
    for side, cx, outer in (('Left', 0.134, 1), ('Right', -0.134, -1)):
        specs = {
            'heel': (cx, y_of(0.14), 0.002),
            'toe': (cx, y_of(0.76), 0.002),
            'out': (cx + outer * half_width(0.55) * 0.65, y_of(0.55), 0.002),
        }
        markers[side] = {}
        for name, pos in specs.items():
            idx, dist = nearest(body, pos)
            markers[side][name] = idx
            print(f'marker {side} {name} idx {idx} dist {dist:.4f} rest {tuple(round(v, 3) for v in body.data.vertices[idx].co)}')

    def sole_z(side, which):
        return world_co(body, markers[side][which]).z

    axes = (Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1)))

    def apply_q(pb, base, axis, deg):
        pb.rotation_quaternion = base @ Quaternion(axes[axis], math.radians(deg))
        bpy.context.view_layer.update()

    def pick_axis(pb, base, score):
        apply_q(pb, base, 0, 0)
        s0 = score()
        best_a, best_d = 0, 0.0
        for a in range(3):
            apply_q(pb, base, a, 14)
            d = abs(score() - s0)
            if d > best_d:
                best_d, best_a = d, a
        apply_q(pb, base, 0, 0)
        return best_a, best_d

    sample = arm.pose.bones['LeftFoot']
    apply_q(sample, sample.rotation_quaternion.copy(), 0, 0)
    pitch_axis, pitch_gain = pick_axis(sample, sample.rotation_quaternion.copy(), lambda: sole_z('Left', 'toe') - sole_z('Left', 'heel'))
    roll_axis, roll_gain = pick_axis(sample, sample.rotation_quaternion.copy(), lambda: sole_z('Left', 'out') - sole_z('Left', 'heel'))
    print(f'pitch axis {pitch_axis} gain {pitch_gain:.4f} roll axis {roll_axis} gain {roll_gain:.4f}')

    def seek(pb, base, axis, score):
        lo, hi = -42.0, 42.0
        for _ in range(8):
            m1 = lo + (hi - lo) / 3
            m2 = hi - (hi - lo) / 3
            apply_q(pb, base, axis, m1)
            s1 = abs(score())
            apply_q(pb, base, axis, m2)
            s2 = abs(score())
            if s1 < s2:
                hi = m2
            else:
                lo = m1
        deg = (lo + hi) * 0.5
        apply_q(pb, base, axis, deg)
        return pb.rotation_quaternion.copy(), deg

    def level(side):
        pb = arm.pose.bones[side + 'Foot']
        q = pb.rotation_quaternion.copy()
        if pitch_gain > 0.004:
            q, _ = seek(pb, q, pitch_axis, lambda s=side: sole_z(s, 'toe') - sole_z(s, 'heel'))
        if roll_gain > 0.004 and roll_axis != pitch_axis:
            q, _ = seek(pb, q, roll_axis, lambda s=side: sole_z(s, 'out') - sole_z(s, 'heel'))
        pb.rotation_quaternion = q
        bpy.context.view_layer.update()

    def foot_min(side):
        return min(sole_z(side, 'heel'), sole_z(side, 'toe'))

    scene = bpy.context.scene
    for act in list(bpy.data.actions):
        frames = set()
        for fc in act.fcurves:
            for kp in fc.keyframe_points:
                frames.add(int(round(kp.co[0])))
        if not frames:
            continue
        arm.animation_data.action = act
        level_this = any(k in act.name for k in ('walk', 'run', 'climb', 'idle'))
        drop_this = any(k in act.name for k in ('walk', 'run', 'climb'))
        for frame in sorted(frames):
            scene.frame_set(frame)
            zl, zr = foot_min('Left'), foot_min('Right')
            if level_this:
                if zl <= zr + 0.03:
                    level('Left')
                if zr <= zl + 0.03:
                    level('Right')
                zl, zr = foot_min('Left'), foot_min('Right')
            # Markers sit on the sole plate. Ribs hang ~1.2 cm below it and are what touch.
            target = 0.014
            low = min(zl, zr)
            other = max(zl, zr)
            delta = 0.0
            both_down = abs(zl - zr) < 0.03
            if low < target - 0.003:
                delta = -(low - target) / up_scale
            elif drop_this and target + 0.004 < low < target + 0.13 and other > low + 0.025:
                delta = -(low - target) / up_scale
            elif both_down and target + 0.006 < low < target + 0.07:
                delta = -(low - target) / up_scale
            if level_this:
                for side in ('Left', 'Right'):
                    arm.pose.bones[side + 'Foot'].keyframe_insert('rotation_quaternion', frame=frame)
            if abs(delta) > 1e-4:
                hips.location[up_axis] += delta
                bpy.context.view_layer.update()
                hips.keyframe_insert('location', frame=frame)
        if level_this or drop_this:
            for fc in act.fcurves:
                if 'Hips' in fc.data_path or 'Foot' in fc.data_path:
                    for kp in fc.keyframe_points:
                        kp.interpolation = 'BEZIER'
                        kp.handle_left_type = 'AUTO_CLAMPED'
                        kp.handle_right_type = 'AUTO_CLAMPED'
        # Report contact at a few frames.
        for frame in sorted(frames)[:: max(1, len(frames) // 4)]:
            scene.frame_set(frame)
            print(f'plant {act.name} f{frame} L {foot_min("Left"):+.4f} R {foot_min("Right"):+.4f}')


def render_checks():
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1000
    if scene.world is None:
        scene.world = bpy.data.worlds.new('World')
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes['Background']
    bg.inputs[0].default_value = (0.045, 0.048, 0.052, 1)
    bg.inputs[1].default_value = 1
    for name in ('Astronaut_LOD1', 'CommanderStripes'):
        if name in bpy.data.objects:
            bpy.data.objects[name].hide_render = True
    sun = bpy.data.lights.new('Sun', 'SUN')
    sun.energy = 5
    sun_ob = bpy.data.objects.new('Sun', sun)
    bpy.context.collection.objects.link(sun_ob)
    sun_ob.rotation_euler = (0.85, 0.15, -0.4)
    fill = bpy.data.lights.new('Fill', 'AREA')
    fill.energy = 180
    fill.size = 3
    fill_ob = bpy.data.objects.new('Fill', fill)
    bpy.context.collection.objects.link(fill_ob)
    fill_ob.location = (0.4, -1.2, 1.0)
    plane = bpy.data.meshes.new('Ground')
    ground = bpy.data.objects.new('Ground', plane)
    bpy.context.collection.objects.link(ground)
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1.4)
    bm.to_mesh(plane)
    bm.free()
    ground.location.z = -0.002
    gmat = pbr('Ground', (0.16, 0.16, 0.17), 0.95)
    plane.materials.append(gmat)
    cam_data = bpy.data.cameras.new('Cam')
    cam_data.lens = 85
    cam = bpy.data.objects.new('Cam', cam_data)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam

    def shot(path, loc, target):
        cam.location = loc
        cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        print('SHOT', path)

    arm = bpy.data.objects['Armature']
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    out = '/opt/cursor/artifacts'
    bind_clear(arm)
    shot(f'{out}/after-boot-side.png', (0.78, -0.07, 0.11), (0.134, -0.08, 0.07))
    shot(f'{out}/after-boot-ankle.png', (1.05, -0.35, 0.32), (0.12, -0.02, 0.16))
    shot(f'{out}/after-boot-quarter.png', (0.55, -0.62, 0.20), (0.134, -0.06, 0.08))
    shot(f'{out}/after-boot-front.png', (0.134, -0.78, 0.11), (0.134, -0.02, 0.08))
    arm.animation_data.action = bpy.data.actions['walk_Armature']
    scene.frame_set(0)
    shot(f'{out}/after-boot-walk.png', (1.2, -0.95, 0.48), (0.0, -0.02, 0.14))
    arm.animation_data.action = bpy.data.actions['climb-ladder_Armature']
    scene.frame_set(0)
    shot(f'{out}/after-boot-ladder.png', (1.25, -1.2, 0.38), (0.0, 0.0, 0.12))
    for obj in (ground, cam, sun_ob, fill_ob):
        bpy.data.objects.remove(obj, do_unlink=True)
    for name in ('Astronaut_LOD1', 'CommanderStripes'):
        if name in bpy.data.objects:
            bpy.data.objects[name].hide_render = False


def export():
    arm = bpy.data.objects['Armature']
    for act in list(bpy.data.actions):
        if act.name.endswith('_Armature'):
            act.name = act.name[:-len('_Armature')]
    bpy.ops.object.mode_set(mode='OBJECT')
    # Drop anything that is not part of the suit.
    for obj in list(bpy.data.objects):
        if obj.type not in {'MESH', 'ARMATURE', 'EMPTY'}:
            bpy.data.objects.remove(obj, do_unlink=True)
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


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SRC)
    for obj in list(bpy.data.objects):
        if obj.name == 'Icosphere':
            bpy.data.objects.remove(obj, do_unlink=True)
    make_overshoes()
    plant_animations(bpy.data.objects['Armature'], bpy.data.objects['Astronaut_LOD0'])
    render_checks()
    export()


if __name__ == '__main__':
    main()
