# Comprueba npc-spot-* de una sala: 'sit' -> hay asiento bajo el spot a seat_height; 'stand' -> un cilindro
# de persona (r 0,22 m, 0,05-1,7 m) no atraviesa ninguna malla. blender -b sala.blend -P p3c_check_spots.py
import bpy, bmesh, math
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
dg = bpy.context.evaluated_depsgraph_get()
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.name.startswith('preview')]
def bvh(o):
    bm = bmesh.new(); bm.from_object(o, dg); bm.transform(o.matrix_world)
    t = BVHTree.FromBMesh(bm); bm.free(); return t
trees = {o.name: bvh(o) for o in meshes}
ok = True
for s in sorted([o for o in bpy.context.scene.objects if o.name.startswith('npc-spot')], key=lambda o: o.name):
    p = s.matrix_world.translation; pose = s.get('pose')
    fwd = s.matrix_world.to_3x3() @ Vector((0, -1, 0))   # -Y Blender = +Z glTF
    msg = f'{s.name:18s} pose={pose} pos=({p.x:.2f},{p.y:.2f},{p.z:.2f}) mira glTF=({fwd.x:.2f},{fwd.z:.2f},{-fwd.y:.2f})'
    if pose is None: ok = False; msg += '  FALTA pose'
    elif pose.startswith('sit'):
        best = None
        for n, t in trees.items():
            h = t.ray_cast(p + Vector((0, 0, 0.9)), Vector((0, 0, -1)), 0.9)
            if h[0] is not None and (best is None or h[0].z > best[0]): best = (h[0].z, n)
        sh = s.get('seat_height')
        good = best and sh and abs(best[0] - sh) < 0.02
        msg += f'  asiento z={best[0]:.3f} en {best[1]} (seat_height={sh})' if best else '  SIN ASIENTO'
        # respaldo detras (no delante): rayo hacia adelante a 0,7 m no debe chocar dentro de 0,3 m
        front = [t.ray_cast(p + Vector((0, 0, 0.75)), fwd, 0.3)[0] for t in trees.values()]
        if any(h is not None for h in front): good = False; msg += '  OBSTACULO DELANTE'
        ok &= bool(good); msg += '  OK' if good else '  FALLA'
    else:
        r = 0.22 if 'mark' not in s.name else 0.18
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=r, radius2=r, depth=1.65)
        bm.transform(Matrix.Translation(p + Vector((0, 0, 0.05 + 1.65/2)))); cyl = BVHTree.FromBMesh(bm); bm.free()
        hits = [n for n, t in trees.items() if cyl.overlap(t)]
        # tambien dentro de un volumen cerrado sin tocar caras: rayo corto hacia abajo debe dar el suelo
        msg += ('  CHOCA con ' + ','.join(hits) + '  FALLA') if hits else '  libre OK'
        ok &= not hits
    print('SPOT', msg)
print('SPOTS', 'TODO OK' if ok else 'HAY FALLOS')
