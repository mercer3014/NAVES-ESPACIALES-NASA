import bpy,math
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath='/workspace/bloqueA/dec-moon-rocks.glb')
L0={'rock-01':1500,'rock-02':1300,'rock-03':500,'rock-04':480,'rock-05':190,'rock-06':190,'rock-07':170,'rock-08':160,'rock-09':120,'rock-10':190}
L1={'rock-01':120,'rock-02':116,'rock-03':100,'rock-04':100,'rock-05':80,'rock-06':80,'rock-07':72,'rock-08':72,'rock-09':64,'rock-10':80}
tri=lambda o:sum(len(p.vertices)-2 for p in o.data.polygons)
def dec(o,target):
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active=o; o.select_set(True)
    n=tri(o)
    for it in range(6):
        m=o.modifiers.new('d','DECIMATE'); m.decimate_type='COLLAPSE'; m.ratio=min(1,target/max(1,n)); m.use_collapse_triangulate=True
        bpy.ops.object.modifier_apply(modifier='d'); n=tri(o)
        if n<=target: break
    return n
out=[]
for name in L0:
    o=bpy.data.objects[name]
    try: o.data.normals_split_custom_set(None) if False else None
    except Exception: pass
    # LOD1 a partir del original
    c=o.copy(); c.data=o.data.copy(); c.name=name+'-lod1'; c.data.name=name+'-lod1'; bpy.context.scene.collection.objects.link(c)
    c.location.y-=1.5   # Blender -Y = glTF +Z : fila aparte en el glb
    import bmesh
    bm=bmesh.new(); bm.from_mesh(c.data); bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=0.002); bm.to_mesh(c.data); bm.free()
    n1=dec(c,L1[name]); n0b=tri(o)
    bm=bmesh.new(); bm.from_mesh(o.data); bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=0.0005); bm.to_mesh(o.data); bm.free()
    n0=dec(o,L0[name])
    for ob in (o,c):
        with bpy.context.temp_override(object=ob,active_object=ob,selected_objects=[ob],selected_editable_objects=[ob]):
            if ob.data.has_custom_normals: bpy.ops.mesh.customdata_custom_splitnormals_clear()
            bpy.ops.object.shade_smooth()
    out.append((name,n0b,n0,n1)); print('ROCK',name,n0b,'->',n0,'lod1',n1)
bpy.ops.object.select_all(action='DESELECT')
for name in L0: bpy.data.objects[name].select_set(True); bpy.data.objects[name+'-lod1'].select_set(True)
bpy.ops.export_scene.gltf(filepath='/workspace/bloqueA/new-rocks.glb',use_selection=True,export_format='GLB',export_draco_mesh_compression_enable=False,export_animations=False,export_yup=True,export_vertex_color='ACTIVE')
bpy.ops.wm.save_as_mainfile(filepath='/workspace/bloqueA/rocks-work.blend')
