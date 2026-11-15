import bpy,bmesh,math
from mathutils import Vector, Matrix, Quaternion
bpy.ops.wm.read_factory_settings(use_empty=True)
S=bpy.context.scene
def G(x,y,z): return Vector((x,-z,y))   # glTF -> Blender
TEX='/workspace/bloqueA/tex/'
imgA=bpy.data.images.load(TEX+'lmi_atlas.png'); imgE=bpy.data.images.load(TEX+'lmi_emissive.png'); imgE.colorspace_settings.name='sRGB'
def material(name,col,rough=0.7,metal=0.0,tex=False,emis=False,alpha=None):
    m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; b=nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=(*col,1); b.inputs['Roughness'].default_value=rough; b.inputs['Metallic'].default_value=metal
    if tex:
        t=nt.nodes.new('ShaderNodeTexImage'); t.image=imgA; nt.links.new(t.outputs['Color'],b.inputs['Base Color'])
    if emis:
        t2=nt.nodes.new('ShaderNodeTexImage'); t2.image=imgE; nt.links.new(t2.outputs['Color'],b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value=1.6
    if alpha is not None:
        b.inputs['Alpha'].default_value=alpha; m.blend_method='BLEND'
    return m
M={}
M['pared']=material('LMI-Pared',(1,1,1),0.85,tex=True)
M['suelo']=material('LMI-Suelo',(0.12,0.12,0.125),0.9)
M['panel']=material('LMI-Panel',(0.11,0.115,0.12),0.6,0.2)
M['tex']=material('LMI-Paneles',(1,1,1),0.55,0.0,tex=True,emis=True)
M['metal']=material('LMI-Metal',(0.55,0.56,0.58),0.35,0.8)
M['negro']=material('LMI-Negro',(0.02,0.02,0.022),0.5)
M['tapa']=material('LMI-Tapa-Motor',(0.42,0.40,0.36),0.8)
M['vidrio']=material('WindowGlass',(0.02,0.025,0.03),0.05,0.0,alpha=0.25)
M['rojo']=material('LMI-Rojo',(0.5,0.05,0.03),0.5)
MAT=list(M.values()); MI={k:MAT.index(v) for k,v in M.items()}
root=bpy.data.objects.new('lm-interior',None); S.collection.objects.link(root)
def obj(name,bm,parent=root,smooth=False):
    me=bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in MAT: me.materials.append(m)
    o=bpy.data.objects.new(name,me); S.collection.objects.link(o); o.parent=parent
    for p in me.polygons: p.use_smooth=smooth
    return o
def empty(name,pos,parent=root,quat=None):
    e=bpy.data.objects.new(name,None); S.collection.objects.link(e); e.parent=parent; e.location=pos
    if quat: e.rotation_mode='QUATERNION'; e.rotation_quaternion=quat
    e.empty_display_size=0.05; return e
def uvrect(face,uvl,px,order=None):
    x0,y0,x1,y1=px; u0,u1=x0/1024,x1/1024; vt,vb=1-y0/1024,1-y1/1024
    cs=[(u0,vb),(u1,vb),(u1,vt),(u0,vt)]
    for l,c in zip(face.loops,cs if order is None else [cs[i] for i in order]): l[uvl].uv=c
def quad(bm,uvl,p0,p1,p2,p3,mi,px=None):  # p0 abajo-izq, p1 abajo-der, p2 arriba-der, p3 arriba-izq (visto de frente)
    vs=[bm.verts.new(p) for p in (p0,p1,p2,p3)]; f=bm.faces.new(vs); f.material_index=mi
    if px: uvrect(f,uvl,px)
    else:
        for l,c in zip(f.loops,[(0,0),(1,0),(1,1),(0,1)]): l[uvl].uv=c
    return f
def box(bm,c,s,mi,rot=None):
    r=bmesh.ops.create_cube(bm,size=1.0); vs=r['verts']
    for v in vs:
        p=Vector((v.co.x*s[0],v.co.y*s[1],v.co.z*s[2]))
        if rot: p=rot@p
        v.co=p+Vector(c)
    for f in {f for v in vs for f in v.link_faces}: f.material_index=mi
    return vs
def boxuv(bm,uvl,faces,sc=1.5):
    for f in faces:
        n=f.normal; ax=max(range(3),key=lambda k:abs(n[k])); a,b=[k for k in range(3) if k!=ax]
        for l in f.loops: l[uvl].uv=(l.vert.co[a]*sc,l.vert.co[b]*sc)
# ---------------- casco (convex hull, normales hacia dentro, grosor 4 cm) ----------------
FL=-1.62; MID=-0.35; CE=0.38
foot=[(-1.55,1.0),(0.95,1.0),(0.95,-0.45),(0.6,-0.78),(-1.2,-0.78),(-1.55,-0.45)]
ceil=[(-1.55,1.0),(0.95,1.0),(0.95,-0.15),(0.65,-0.45),(-1.25,-0.45),(-1.55,-0.15)]
bm=bmesh.new()
pts=[bm.verts.new(G(x,FL,z)) for x,z in foot]+[bm.verts.new(G(x,MID,z)) for x,z in foot]+[bm.verts.new(G(x,CE,z)) for x,z in ceil]
bmesh.ops.convex_hull(bm,input=pts)
bmesh.ops.dissolve_limit(bm,angle_limit=math.radians(1),verts=bm.verts,edges=bm.edges)
bmesh.ops.reverse_faces(bm,faces=bm.faces)
uvl=bm.loops.layers.uv.new('UVMap')
for f in bm.faces:
    f.material_index=MI['suelo'] if f.calc_center_median().z<FL+0.01 else MI['pared']
    # UV: banda de pared acolchada del atlas (0,896)-(1024,1024)
    n=f.normal; ax=max(range(3),key=lambda k:abs(n[k])); a,b=[k for k in range(3) if k!=ax]
    for l in f.loops: l[uvl].uv=((l.vert.co[a]*0.5)%1.0*0+ l.vert.co[a]*0.5, 0.0625*((l.vert.co[b]*2.0)%1.0)) if False else (l.vert.co[a]*0.6, 0.01+0.10*min(1,max(0,(l.vert.co[b]+2)/4)))
shell=obj('cabin-shell',bm)
sm=shell.modifiers.new('s','SOLIDIFY'); sm.thickness=0.04; sm.offset=-1.0; sm.use_rim=True
bpy.context.view_layer.objects.active=shell; shell.select_set(True); bpy.ops.object.modifier_apply(modifier='s')
# ventanas triangulares en el plano frontal inclinado
s=Vector((0,0.73,0.33)).normalized(); n_in=Vector((0,-0.33,0.73)).normalized()
def slant(x,t): return Vector((x,MID,-0.78))+s*t   # coords glTF
WIN={'lmp':[(0.12,0.70),(0.58,0.70),(0.12,0.12)],'cdr':[(-0.75,0.70),(-1.21,0.70),(-0.75,0.12)]}
cutters=[]
for k,tri in WIN.items():
    bmc=bmesh.new()
    P=[slant(x,t) for x,t in tri]
    vs_in=[bmc.verts.new(G(*(p+n_in*0.15))) for p in P]; vs_out=[bmc.verts.new(G(*(p-n_in*0.25))) for p in P]
    bmc.faces.new(vs_in); bmc.faces.new(list(reversed(vs_out)))
    for i in range(3): bmc.faces.new([vs_in[i],vs_out[i],vs_out[(i+1)%3],vs_in[(i+1)%3]])
    bmesh.ops.recalc_face_normals(bmc,faces=bmc.faces)
    me=bpy.data.meshes.new('cut-'+k); bmc.to_mesh(me); bmc.free(); c=bpy.data.objects.new('cut-'+k,me); S.collection.objects.link(c); cutters.append(c)
    bo=shell.modifiers.new('b'+k,'BOOLEAN'); bo.operation='DIFFERENCE'; bo.object=c; bo.solver='EXACT'
    bpy.ops.object.modifier_apply(modifier='b'+k)
for c in cutters: bpy.data.objects.remove(c)
# vidrio (opaco en el juego: shader de cielo) 6 cm hacia fuera
bm=bmesh.new(); uvl=bm.loops.layers.uv.new('UVMap')
for k,tri in WIN.items():
    P=[G(*(slant(x,t)-n_in*0.03)) for x,t in tri]; vs=[bm.verts.new(p) for p in P]; f=bm.faces.new(vs); f.material_index=MI['vidrio']
    f.normal_update()
    if f.normal.dot(G(*n_in))<0: f.normal_flip()
    for l,c in zip(f.loops,[(0,1),(1,1),(0,0)]): l[uvl].uv=c
obj('window-glass',bm)
# marcos de ventana (barras)
bm=bmesh.new(); uvl=bm.loops.layers.uv.new('UVMap')
for k,tri in WIN.items():
    P=[slant(x,t)+n_in*0.015 for x,t in tri]
    for i in range(3):
        a,b=P[i],P[(i+1)%3]; c=(a+b)/2; d=(b-a); L=d.length; d.normalize()
        z=n_in; y=z.cross(d).normalized(); R=Matrix((d,y,z)).transposed()
        Rb=Matrix(((1,0,0),(0,0,-1),(0,1,0)))@R  # a Blender
        box(bm,G(*c),(L+0.05,0.05,0.03),MI['negro'],rot=Rb)
boxuv(bm,uvl,bm.faces)
obj('window-frames',bm)
empty('win-lmp',G(*slant(0.27,0.5)),quat=None); empty('win-cdr',G(*slant(-0.9,0.5)))
# ---------------- paneles 1 y 2 (centro, entre ventanas) ----------------
bm=bmesh.new(); uvl=bm.loops.layers.uv.new('UVMap')
x0,x1,t0,t1=-0.72,0.08,0.06,0.74
off=n_in*0.06
P0,P1,P2,P3=[slant(x,t)+off for x,t in ((x0,t0),(x1,t0),(x1,t1),(x0,t1))]
f=quad(bm,uvl,G(*P0),G(*P1),G(*P2),G(*P3),MI['tex'],(512,0,1024,512))
f.normal_update()
# caja trasera del panel
for a,b in ((P0,P1),(P1,P2),(P2,P3),(P3,P0)):
    quad(bm,uvl,G(*(a-off)),G(*(b-off)),G(*b),G(*a),MI['panel'])
obj('panel-center',bm)
# ---------------- consola central con DSKY (sobre la escotilla) ----------------
bm=bmesh.new(); uvl=bm.loops.layers.uv.new('UVMap')
cx0,cx1=-0.66,0.02; zf=-0.78; zb=-0.50; yb=-0.78; yt=-0.42
# cuerpo: frente vertical bajo, tapa inclinada hacia arriba-atrás
A=[(cx0,yb,zf),(cx1,yb,zf),(cx1,yb,zb),(cx0,yb,zb),(cx0,yt,zf),(cx1,yt,zf),(cx1,yt-0.12,zb),(cx0,yt-0.12,zb)]
V=[bm.verts.new(G(*p)) for p in A]
fs=[(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
for f in fs:
    ff=bm.faces.new([V[i] for i in f]); ff.material_index=MI['panel']
bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
boxuv(bm,uvl,bm.faces)
# cara DSKY sobre la tapa inclinada
tp=[Vector(A[i]) for i in (7,6,5,4)]  # atrás-izq, atrás-der, frente-der, frente-izq
lift=Vector((0,0.006,0))
mx=lambda a,b,k:a+(b-a)*k
d0=mx(tp[0],tp[1],0.22)+lift; d1=mx(tp[0],tp[1],0.78)+lift; d2=mx(tp[3],tp[2],0.78)+lift; d3=mx(tp[3],tp[2],0.22)+lift
d0=mx(d0,d3,0.06); d1=mx(d1,d2,0.06); d2=mx(d1,d2,0.98); d3=mx(d0,d3,0.98)
quad(bm,uvl,G(*d0),G(*d1),G(*d2),G(*d3),MI['tex'],(0,0,512,512))
obj('center-console',bm)
dsky_c=(d0+d1+d2+d3)/4
empty('dsky-lm',G(*dsky_c))
# ---------------- escotilla delantera cuadrada (0,81 m) ----------------
bm=bmesh.new(); uvl=bm.loops.layers.uv.new('UVMap')
hx0,hx1,hy0,hy1,hz=-0.72,0.09,-1.60,-0.80,-0.755
box(bm,G((hx0+hx1)/2,(hy0+hy1)/2,hz+0.01),(hx1-hx0+0.08,0.05,hy1-hy0+0.08),MI['metal'])
boxuv(bm,uvl,bm.faces)
quad(bm,uvl,G(hx0,hy0,hz+0.04),G(hx1,hy0,hz+0.04),G(hx1,hy1,hz+0.04),G(hx0,hy1,hz+0.04),MI['tex'],(0,640,256,896))
hv=box(bm,G(hx1-0.12,(hy0+hy1)/2,hz+0.08),(0.04,0.04,0.30),MI['negro'])  # tirador
obj('front-hatch',bm)
# ---------------- tapa del motor de ascenso (doghouse) ----------------
bm=bmesh.new(); uvl=bm.loops.layers.uv.new('UVMap')
r=bmesh.ops.create_cone(bm,cap_ends=True,segments=16,radius1=0.46,radius2=0.40,depth=0.50)
bmesh.ops.translate(bm,verts=r['verts'],vec=G(-0.30,FL+0.25,0.92))
for f in bm.faces: f.material_index=MI['tapa']
box(bm,G(-0.30,FL+0.505,0.92),(0.5,0.5,0.012),MI['metal'])
boxuv(bm,uvl,bm.faces,2.0)
obj('ascent-engine-cover',bm,smooth=False)
# ---------------- panel 16 (pared derecha) + nodo cb-engine-arm ----------------
nP=Vector((-0.964,-0.117,0.241)).normalized(); C=Vector((0.8,0.1,-0.08))
ux=Vector((0.243,0.0,0.970)).normalized(); uz=nP.cross(ux).normalized()  # en el plano
back=C-nP*0.035
bm=bmesh.new(); uvl=bm.loops.layers.uv.new('UVMap')
W2,H2=0.42,0.30
corners=[back-ux*W2+uz*-H2,back+ux*W2+uz*-H2,back+ux*W2+uz*H2,back-ux*W2+uz*H2]
# placa delantera (gris oscuro) y cuña hasta la pared x=0.95
fr=[bm.verts.new(G(*p)) for p in corners]; bk=[bm.verts.new(G(0.95-0.04,p.y,p.z)) for p in corners]
f=bm.faces.new(fr); f.material_index=MI['panel']
for i in range(4):
    g=bm.faces.new([fr[i],bk[i],bk[(i+1)%4],fr[(i+1)%4]]); g.material_index=MI['panel']
bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
for f in bm.faces:
    if f.normal.dot(G(*nP))<-0.5 or (len(f.verts)==4 and all(v in fr for v in f.verts)):
        pass
boxuv(bm,uvl,bm.faces)
# tiras de rótulos y filas de disyuntores arriba/abajo del bloque del artista
for k,(v0,v1) in enumerate(((0.235,0.29),(-0.29,-0.235))):
    a=back+nP*0.004; P=[a-ux*W2*0.97+uz*v0,a+ux*W2*0.97+uz*v0,a+ux*W2*0.97+uz*v1,a-ux*W2*0.97+uz*v1]
    quad(bm,uvl,*[G(*p) for p in P],MI['tex'],(0,550,1024,630))
    for i in range(12):
        cpos=a+ux*(-W2*0.9+i*(W2*1.8/11))+uz*((v0+v1)/2)+nP*0.012
        Rb=Matrix(((1,0,0),(0,0,-1),(0,1,0)))@Matrix((ux,uz,nP)).transposed()
        box(bm,G(*cpos),(0.012,0.012,0.022),MI['negro'],rot=Rb)
obj('panel-16',bm)
q=Quaternion((0.3095,0.5178,-0.4505,0.6582))  # w,x,y,z glTF
qB=Quaternion((q.w,q.x,-q.z,q.y))           # a Blender
empty('cb-engine-arm',G(0.8205,0.1199,0.0118),quat=qB)
# ---------------- panel 11 (pared izquierda, CDR) ----------------
bm=bmesh.new(); uvl=bm.loops.layers.uv.new('UVMap')
x=-1.55+0.04+0.02
quad(bm,uvl,G(x,-0.25,0.35),G(x,-0.25,-0.25),G(x,0.12,-0.25),G(x,0.12,0.35),MI['tex'],(256,640,768,768))
for i in range(8):
    for j in range(2): box(bm,G(x+0.015,-0.13-j*0.08,0.30-i*0.075),(0.022,0.012,0.012),MI['negro'])
obj('panel-11',bm)
# ---------------- repisa para cabin-props (sup. y=-0.30) ----------------
bm=bmesh.new(); uvl=bm.loops.layers.uv.new('UVMap')
yaw=-0.9; dxz=Vector((math.cos(yaw),0,-math.sin(yaw)))  # eje x local rotado (glTF)
c=Vector((0.52,-0.315,-0.40)); Rg=Matrix(((dxz.x,0,-dxz.z),(0,1,0),(dxz.z,0,dxz.x)))
Rb=Matrix(((1,0,0),(0,0,-1),(0,1,0)))@Rg@Matrix(((1,0,0),(0,0,1),(0,-1,0)))
box(bm,G(*c),(1.15,0.24,0.03),MI['metal'],rot=Rb)
box(bm,G(*(c+Vector((0,-0.06,0)))),(1.0,0.1,0.06),MI['panel'],rot=Rb)
boxuv(bm,uvl,bm.faces)
obj('props-shelf',bm)
# ---------------- techo: escotilla superior de acoplamiento + focos ----------------
bm=bmesh.new(); uvl=bm.loops.layers.uv.new('UVMap')
r=bmesh.ops.create_circle(bm,cap_ends=True,segments=20,radius=0.42); bmesh.ops.translate(bm,verts=r['verts'],vec=G(-0.30,CE-0.005,0.45))
for f in bm.faces: f.material_index=MI['metal']
r=bmesh.ops.create_circle(bm,cap_ends=True,segments=20,radius=0.34); bmesh.ops.translate(bm,verts=r['verts'],vec=G(-0.30,CE-0.012,0.45))
for f in bm.faces:
    if f.material_index==0 and len(f.verts)==20 and abs(f.calc_center_median().z-(CE-0.012))<0.002: f.material_index=MI['panel']
for f in bm.faces: f.normal_update()
for f in bm.faces:
    if f.normal.z>0: f.normal_flip()
for xx in (-0.95,0.4): box(bm,G(xx,CE-0.02,-0.1),(0.30,0.03,0.08),MI['metal'])
quad(bm,uvl,G(0.2,CE-0.012,0.75),G(0.6,CE-0.012,0.75),G(0.6,CE-0.012,0.40),G(0.2,CE-0.012,0.40),MI['tex'],(768,640,1024,896))
boxuv(bm,uvl,[f for f in bm.faces if f.material_index!=MI['tex']],1.0)
obj('overhead-hatch',bm)
# asideros y cables de sujeción
bm=bmesh.new(); uvl=bm.loops.layers.uv.new('UVMap')
for xx in (0.55,-1.15):
    box(bm,G(xx,-0.62,-0.62),(0.36,0.035,0.035),MI['metal'])
box(bm,G(0.2,-1.55,-0.30),(0.5,0.06,0.25),MI['negro'])   # placa de pies (velcro)
box(bm,G(-0.8,-1.55,-0.30),(0.5,0.06,0.25),MI['negro'])
boxuv(bm,uvl,bm.faces)
obj('handholds',bm)
# empties de referencia
empty('eye-lmp',G(0,0,0)); empty('eye-cdr',G(-0.63,0,0)); empty('light-cabin',G(-0.3,0.25,0.2))
for o in S.objects:
    if o.type=='MESH': print(o.name,'tris',sum(len(p.vertices)-2 for p in o.data.polygons))
bpy.ops.export_scene.gltf(filepath='/workspace/bloqueA/lm-interior.glb',export_format='GLB',export_draco_mesh_compression_enable=False,export_animations=False,export_yup=True,export_image_format='AUTO')
bpy.ops.wm.save_as_mainfile(filepath='/workspace/bloqueA/lm-interior.blend')
