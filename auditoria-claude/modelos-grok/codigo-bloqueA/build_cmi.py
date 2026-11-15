import bpy,bmesh,math
from mathutils import Vector, Matrix
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='dec-cm-interior.glb')
src=bpy.data.objects['cabin-shell-geo']; M=src.matrix_world.copy()
mat=lambda n: bpy.data.materials[n]
root=bpy.data.objects['CM_Interior']
# ---------- piel exterior del casco ----------
bm=bmesh.new(); bm.from_mesh(src.data)
names=[m.name for m in src.data.materials]
keep={names.index('CMI-Pared'),names.index('CMI-Mamparo')}
bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.material_index not in keep],context='FACES')
bmesh.ops.transform(bm,matrix=M,verts=bm.verts)  # a mundo (Blender)
bm.normal_update()
T=0.035
# normal por posición (las costuras sin soldar comparten posición -> mismo desplazamiento)
from collections import defaultdict
acc=defaultdict(lambda:Vector())
key=lambda co:(round(co.x,4),round(co.y,4),round(co.z,4))
for f in bm.faces:
    for v in f.verts: acc[key(v.co)]+=f.normal*f.calc_area()
uv=bm.loops.layers.uv.active
inner_faces=list(bm.faces)
bnd=[e for e in bm.edges if e.is_boundary]
newv={}
for v in list(bm.verts):
    n=acc[key(v.co)].normalized()
    newv[v]=bm.verts.new(v.co-n*T)
outer=[]
for f in inner_faces:
    vs=[newv[v] for v in reversed(f.verts)]
    nf=bm.faces.new(vs); nf.material_index=f.material_index
    for lo,li in zip(nf.loops,reversed(f.loops)): lo[uv].uv=li[uv].uv
    outer.append(nf)
rims=[]
for e in bnd:
    f=e.link_faces[0]
    # orientación de la arista en la cara
    for l in f.loops:
        if l.edge==e: a,b=l.vert,l.link_loop_next.vert; break
    try:
        r=bm.faces.new([b,a,newv[a],newv[b]]); r.material_index=f.material_index; rims.append(r)
    except ValueError: pass
bmesh.ops.delete(bm,geom=inner_faces,context='FACES_ONLY')
bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
me=bpy.data.meshes.new('cabin-shell-outer'); bm.to_mesh(me); bm.free()
for m in src.data.materials: me.materials.append(m)
ob=bpy.data.objects.new('cabin-shell-outer',me); bpy.context.scene.collection.objects.link(ob)
for p in me.polygons: p.use_smooth=True
# simplificar la piel exterior (solo planos)
dm=ob.modifiers.new('d','DECIMATE'); dm.decimate_type='DISSOLVE'; dm.angle_limit=math.radians(4); dm.delimit={'MATERIAL'}
bpy.context.view_layer.objects.active=ob; ob.select_set(True); bpy.ops.object.modifier_apply(modifier='d')
tm=ob.modifiers.new('t','TRIANGULATE'); bpy.ops.object.modifier_apply(modifier='t')
print('outer tris',len(me.polygons))
# ---------- utilidades para utilería ----------
def wall_r(z):  # radio interior del cono (perfil medido)
    P=[(0.6,1.71),(0.7,1.655),(0.8,1.585),(0.9,1.53),(1.0,1.48),(1.1,1.41),(1.2,1.335),(1.3,1.265),(1.4,1.21),(1.5,1.16)]
    for (z0,r0),(z1,r1) in zip(P,P[1:]):
        if z0<=z<=z1: return r0+(r1-r0)*(z-z0)/(z1-z0)
    return P[-1][1]
def box(bm,c,s,mi):
    r=bmesh.ops.create_cube(bm,size=1.0); vs=r['verts']
    for v in vs: v.co=Vector((v.co.x*s[0],v.co.y*s[1],v.co.z*s[2]))+Vector(c)
    for f in {f for v in vs for f in v.link_faces}: f.material_index=mi
    return vs
def boxuv(me,sc):
    bm=bmesh.new(); bm.from_mesh(me); uvl=bm.loops.layers.uv.verify()
    for f in bm.faces:
        n=f.normal; ax=max(range(3),key=lambda k:abs(n[k])); a,b=[k for k in range(3) if k!=ax]
        for l in f.loops: l[uvl].uv=(l.vert.co[a]*sc+0.5,l.vert.co[b]*sc+0.5)
    bm.to_mesh(me); bm.free()
def mk(name,build,ang,zc,mats):
    """objeto apoyado en la pared a ángulo ang (grados, 0=+X Blender) y altura zc; local: +Y hacia el centro, Z arriba según la pendiente."""
    me=bpy.data.meshes.new(name); bm=bmesh.new(); build(bm); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(mat(m))
    o=bpy.data.objects.new(name,me); bpy.context.scene.collection.objects.link(o)
    a=math.radians(ang); r=wall_r(zc)-0.012
    slope=math.atan2(wall_r(zc-0.1)-wall_r(zc+0.1),0.2)  # inclinación de la pared
    o.matrix_world=Matrix.Translation((r*math.cos(a),r*math.sin(a),zc))@Matrix.Rotation(a+math.pi/2,4,'Z')@Matrix.Rotation(-slope,4,'X')
    for p in me.polygons: p.use_smooth=False
    boxuv(me,2.0)
    return o
# armario: caja con frente hacia +Y local (hacia el centro), tapa con ranura y tirador
def cabinet(w,h,d):
    def b(bm):
        box(bm,(0,d/2,0),(w,d,h),0)                 # cuerpo (Casillero)
        box(bm,(0,d+0.004,0),(w-0.02,0.008,0.012),1) # junta horizontal entre puertas (Metal oscuro)
        box(bm,(0,d+0.004,0),(0.01,0.008,h-0.02),1)  # junta vertical
        for x in (-w/4,w/4): box(bm,(x,d+0.015,h/4),(0.08,0.012,0.012),2)  # tiradores (Acero)
        for x in (-w/4,w/4): box(bm,(x,d+0.015,-h/4),(0.08,0.012,0.012),2)
    return b
def net(w,h,nv=7,nh=4):
    def b(bm):
        box(bm,(0,0.07,-0.01),(w*0.86,0.12,h*0.8),2)   # bolsas de carga detrás de la red
        box(bm,(-w*0.22,0.135,0.02),(w*0.34,0.04,h*0.55),2)
        for k in range(4): # marco
            if k<2: box(bm,(0,0.015,(h/2)*(1 if k else -1)),(w,0.03,0.022),1)
            else: box(bm,((w/2)*(1 if k==3 else -1),0.015,0),(0.022,0.03,h),1)
        for i in range(nv):
            x=-w/2+w*(i+1)/(nv+1); box(bm,(x,0.165,0),(0.014,0.008,h-0.02),0)
        for j in range(nh):
            z=-h/2+h*(j+1)/(nh+1); box(bm,(0,0.17,z),(w-0.02,0.008,0.014),0)
        for x in (-w/2+0.05,w/2-0.05): box(bm,(x,0.03,h/2+0.01),(0.04,0.03,0.04),1) # anclajes
    return b
props=[]
# glTF -Z = Blender +Y  (bahía inferior / LEB) ; glTF +X = Blender +X
props.append(mk('stowage-locker-a',cabinet(0.42,0.34,0.16),62,0.88,['CMI-Casillero','CMI-Metal-Oscuro','CMI-Acero']))
props.append(mk('stowage-locker-b',cabinet(0.42,0.34,0.16),118,0.88,['CMI-Casillero','CMI-Metal-Oscuro','CMI-Acero']))
props.append(mk('stowage-locker-c',cabinet(0.36,0.26,0.14),150,0.92,['CMI-Casillero','CMI-Metal-Oscuro','CMI-Acero']))
props.append(mk('cargo-net-right',net(0.62,0.34),18,0.86,['CMI-Correa','CMI-Metal-Oscuro','CMI-Asiento-Tela']))
props.append(mk('cargo-net-left',net(0.62,0.34),162+20,0.86,['CMI-Correa','CMI-Metal-Oscuro','CMI-Asiento-Tela']))
grp=bpy.data.objects.new('aft-stowage',None); bpy.context.scene.collection.objects.link(grp)
for o in props:
    print(o.name,'tris',sum(len(p.vertices)-2 for p in o.data.polygons))
# exportar solo lo nuevo
bpy.ops.object.select_all(action='DESELECT')
for o in props+[ob]: o.select_set(True)
bpy.ops.export_scene.gltf(filepath='new-cmi.glb',use_selection=True,export_format='GLB',export_draco_mesh_compression_enable=False,export_animations=False,export_apply=True,export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath='cmi-work.blend')
