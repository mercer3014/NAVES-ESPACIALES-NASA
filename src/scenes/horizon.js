// Original fictional rescue hardware and an illustrative 2-D lensing backdrop, not a GR renderer.
import {THREE,Q,renderer} from '../core/engine.js';
import {WORLD_SCALE,SHIP_SCALE,STATION_SCALE,STATION_PORT_LOCAL,STATION_COLLAR_R,DOCK_DIST} from '../sim/horizon.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {renderFlag,defaultFlag} from '../ui/flag.js';
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.9999,1.0);}`;
const fragment=`precision highp float;
varying vec2 vUv;uniform float uTime,uAspect,uRange;uniform vec2 uCenter;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){
 vec2 p=(vUv-uCenter)*2.*vec2(uAspect,1.)*uRange;float r=length(p);
 vec2 warped=p*(1.+1.8/(r*r+.15));vec2 star=warped*9.,cell=floor(star),sf=fract(star)-.5;
 float stars=step(.984,hash(cell))*pow(max(0.,1.-length(sf)*2.),14.);vec3 col=vec3(.005,.008,.017)+stars*vec3(.7,.8,1.);
 float glow=0.;vec3 plasma=vec3(0.);
 for(int i=0;i<SAMPLES;i++){
  float f=float(i)/float(SAMPLES),bend=(f-.5)*.8;vec2 q=vec2(p.x,p.y/(.24+f*.025));q.y+=bend*1.4/(r*.12+1.);
  float dr=length(q),a=atan(q.y,q.x);float turbulent=noise(vec2(a*8.+uTime,dr*4.-uTime*.7))*.65+noise(q*5.+uTime)*.35;
  float disc=smoothstep(1.9,2.6,dr)*exp(-max(0.,dr-3.)*.5)*(.35+turbulent*.8);
  disc*=exp(-abs(p.y)*.24);float beam=clamp(.9-q.x/max(dr,.1)*.65,.18,1.6);
  vec3 heat=mix(vec3(1.,.16,.018),vec3(1.,.77,.34),exp(-abs(dr-2.9)*.5));plasma+=heat*disc*beam/float(SAMPLES);
 }
 float ring=exp(-pow((r-2.16)/.075,2.));float arc=ring*(.2+smoothstep(-.3,1.7,p.y))*.8;
 col+=plasma*1.3+vec3(1.,.48,.15)*arc;
 col*=smoothstep(1.46,1.55,r);col+=vec3(1.,.65,.26)*exp(-pow((r-1.59)/.027,2.))*.7;
 float halo=exp(-r*.25)*.04;col+=vec3(.3,.16,.08)*halo;
 gl_FragColor=vec4(col,1.);
}`;
export function makeHorizonWorld(state,flag,getSafeArea=null){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(48,1,0.15,5000);
 camera.position.set(120,-40,70);camera.up.set(0,0,1);camera.lookAt(40,0,0);
 const uniforms={uTime:{value:0},uAspect:{value:innerWidth/innerHeight},uRange:{value:8},uCenter:{value:new THREE.Vector2(.42,.5)}};
 const lensMaterial=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,defines:{SAMPLES:Q.high?20:7},uniforms,depthTest:false,depthWrite:false,toneMapped:false});
 const lens=new THREE.Mesh(new THREE.PlaneGeometry(2,2),lensMaterial);lens.frustumCulled=false;lens.renderOrder=-1000;scene.add(lens);
 scene.add(new THREE.HemisphereLight(0xc9deff,0x1a120c,1.15));
 const sun=new THREE.DirectionalLight(0xffc48a,3.2);sun.position.set(-30,18,80);scene.add(sun);
 const fill=new THREE.DirectionalLight(0x8fb4ff,1.1);fill.position.set(40,-20,30);scene.add(fill);
 const diskLight=new THREE.PointLight(0xff7a32,28,420,2);diskLight.position.set(0,-8,10);scene.add(diskLight);
 const pm=new THREE.PMREMGenerator(renderer),env=pm.fromScene(new RoomEnvironment(),.04).texture;pm.dispose();scene.environment=env;
 const steel=new THREE.MeshStandardMaterial({color:0xb7c0cc,metalness:.82,roughness:.28}),gold=new THREE.MeshStandardMaterial({color:0xc4a15a,metalness:.72,roughness:.34}),white=new THREE.MeshStandardMaterial({color:0xd5d3c6,metalness:.22,roughness:.48}),dark=new THREE.MeshStandardMaterial({color:0x1a2433,metalness:.55,roughness:.42}),glass=new THREE.MeshBasicMaterial({color:0xffe1c2});
 const mesh=(g,m,p)=>{const o=new THREE.Mesh(g,m);p.add(o);return o;};
 const bar=(p,a,b,r=.04,mat=steel)=>{const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),d=vb.clone().sub(va),m=mesh(new THREE.CylinderGeometry(r,r,Math.max(.001,d.length()),8),mat,p);m.position.copy(va).add(vb).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());return m;};
 const ship=new THREE.Group();ship.scale.setScalar(SHIP_SCALE);scene.add(ship);
 mesh(new THREE.TorusGeometry(1.22,.2,18,72),steel,ship);
 mesh(new THREE.TorusGeometry(.9,.028,8,48),dark,ship);
 const hub=mesh(new THREE.CylinderGeometry(.2,.2,.34,20),white,ship);hub.rotation.x=Math.PI/2;
 for(let i=0;i<6;i++){const a=i*Math.PI/3;bar(ship,[Math.cos(a)*.22,Math.sin(a)*.22,0],[Math.cos(a)*.88,Math.sin(a)*.88,0],.028);}
 const nav=[];
 for(let i=0;i<12;i++){
  const a=Math.PI/12+i*Math.PI/6,c=Math.cos(a),s=Math.sin(a);
  const pod=mesh(new THREE.BoxGeometry(.5,.2,.36),i%3?white:gold,ship);pod.position.set(c*1.22,s*1.22,0);pod.rotation.z=a;
  const win=mesh(new THREE.PlaneGeometry(.18,.07),glass,ship);win.position.set(c*1.22,s*1.22,.19);win.rotation.z=a;
  if(i%4===0){const lamp=mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color:i%8?0xff5a4a:0x7dff9a}),ship);lamp.position.set(c*1.42,s*1.42,.12);nav.push(lamp);}
 }
 bar(ship,[1.4,0,0],[2.12,0,0],.1,steel);
 const collarMat=new THREE.MeshStandardMaterial({color:0xe6d7a4,metalness:.8,roughness:.24,emissive:0x3a2a10,emissiveIntensity:.35});
 const shipCollar=mesh(new THREE.TorusGeometry(.23,.045,12,28),collarMat,ship);shipCollar.position.x=2.27;shipCollar.rotation.y=Math.PI/2;
 const crossMat=new THREE.MeshBasicMaterial({color:0xc8fbff});
 const shipCrossH=mesh(new THREE.BoxGeometry(.035,.32,.035),crossMat,ship);shipCrossH.position.x=2.34;
 const shipCrossV=mesh(new THREE.BoxGeometry(.035,.035,.32),crossMat,ship);shipCrossV.position.x=2.34;
 for(const y of[-.46,.46]){const bell=mesh(new THREE.CylinderGeometry(.09,.18,.4,16,1,true),dark,ship);bell.rotation.z=-Math.PI/2;bell.position.set(-1.38,y,0);}
 const plumeMat=()=>new THREE.MeshBasicMaterial({color:0x9ec4ff,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending});
 const jet=mesh(new THREE.ConeGeometry(.2,1.15,16),plumeMat(),ship);jet.rotation.z=-Math.PI/2;jet.position.set(-2.15,0,0);
 const rcsNose=mesh(new THREE.ConeGeometry(.07,.55,10),plumeMat(),ship);rcsNose.rotation.z=Math.PI/2;rcsNose.position.set(1.7,0,.28);
 const rcsPort=mesh(new THREE.ConeGeometry(.06,.5,10),plumeMat(),ship);rcsPort.position.set(-.2,1.55,0);
 const rcsStar=mesh(new THREE.ConeGeometry(.06,.5,10),plumeMat(),ship);rcsStar.rotation.z=Math.PI;rcsStar.position.set(-.2,-1.55,0);
 const radC=document.createElement('canvas');radC.width=128;radC.height=48;const rg=radC.getContext('2d');rg.fillStyle='#101820';rg.fillRect(0,0,128,48);for(let i=0;i<12;i++){rg.fillStyle=i%2?'#31465c':'#1b2836';rg.fillRect(4+i*10,4,7,40);}const radTex=new THREE.CanvasTexture(radC);radTex.colorSpace=THREE.SRGBColorSpace;const radMat=new THREE.MeshStandardMaterial({map:radTex,color:0xd5e0ea,metalness:.4,roughness:.45,side:THREE.DoubleSide});
 for(const y of[-1,1]){const fin=mesh(new THREE.PlaneGeometry(.9,.22),radMat,ship);fin.position.set(-.55,y*1.62,0);}
 bar(ship,[0,1.15,.1],[0,1.45,.85],.016);const dish=mesh(new THREE.SphereGeometry(.18,16,10,0,Math.PI*2,0,Math.PI*.42),steel,ship);dish.position.set(0,1.5,.82);dish.rotation.x=1.1;
 const probe=new THREE.Group();probe.scale.setScalar(STATION_SCALE);scene.add(probe);
 const bus=mesh(new THREE.CylinderGeometry(.55,.62,1.15,8),gold,probe);bus.rotation.x=Math.PI/2;
 for(let i=0;i<8;i++){const a=i*Math.PI/4;bar(probe,[Math.cos(a)*.58,Math.sin(a)*.58,-.55],[Math.cos(a)*.58,Math.sin(a)*.58,.55],.03,steel);}
 mesh(new THREE.BoxGeometry(.7,.7,.7),dark,probe).position.z=.15;
 for(const x of[-1,1]){const panel=mesh(new THREE.BoxGeometry(1.15,1.7,.04),new THREE.MeshStandardMaterial({color:0x16324a,metalness:.6,roughness:.32,emissive:0x0c3a55,emissiveIntensity:.25}),probe);panel.position.set(x*1.45,0,-.05);bar(probe,[x*.7,0,0],[x*2.05,0,0],.03);for(let j=0;j<5;j++)bar(probe,[x*1.45-.5,-.7+j*.35,-.02],[x*1.45+.5,-.7+j*.35,-.02],.008,steel);}
 bar(probe,[0,.35,.2],[0,1.7,.55],.028);const sensor=mesh(new THREE.SphereGeometry(.22,14,10),dark,probe);sensor.position.set(0,1.75,.6);
 const collarR=STATION_COLLAR_R/STATION_SCALE;
 const collar=mesh(new THREE.TorusGeometry(collarR,.05,10,32),collarMat,probe);collar.position.x=STATION_PORT_LOCAL;collar.rotation.y=Math.PI/2;
 bar(probe,[1.15,0,0],[STATION_PORT_LOCAL-.2,0,0],.08,steel);
 const crossH=mesh(new THREE.BoxGeometry(collarR*1.2,.03,.03),crossMat,probe);crossH.position.x=STATION_PORT_LOCAL+.06;
 const crossV=mesh(new THREE.BoxGeometry(.03,collarR*1.2,.03),crossMat,probe);crossV.position.x=STATION_PORT_LOCAL+.06;
 for(const ang of [0,2.1,4.2]){const lamp=mesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshBasicMaterial({color:0xff5a3a}),probe);lamp.position.set(STATION_PORT_LOCAL+.02,Math.cos(ang)*(collarR+.14),Math.sin(ang)*(collarR+.14));probe.userData.lamps=(probe.userData.lamps||[]).concat(lamp);}
 const fc=document.createElement('canvas');renderFlag(fc,flag||defaultFlag(),384,256);const ft=new THREE.CanvasTexture(fc);ft.colorSpace=THREE.SRGBColorSpace;const projectedFlag=mesh(new THREE.PlaneGeometry(1.05,.7),new THREE.MeshStandardMaterial({map:ft,emissiveMap:ft,emissive:0xffffff,emissiveIntensity:.75,side:THREE.DoubleSide,transparent:true,opacity:.92}),probe);projectedFlag.position.set(0,0,.78);
 const ring=(radius,color)=>{const pts=[];for(let i=0;i<=160;i++){const a=i*Math.PI*2/160;pts.push(new THREE.Vector3(Math.cos(a)*radius*WORLD_SCALE,Math.sin(a)*radius*WORLD_SCALE,-1.2));}const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineDashedMaterial({color,dashSize:1.1,gapSize:1.6,transparent:true,opacity:.14}));line.computeLineDistances();scene.add(line);return line;};ring(1,0xff3a33);ring(10,0x83b6c5);
 const history=[],trailG=new THREE.BufferGeometry(),trailA=new Float32Array(600*3);trailG.setAttribute('position',new THREE.BufferAttribute(trailA,3));trailG.setDrawRange(0,0);scene.add(new THREE.Line(trailG,new THREE.LineBasicMaterial({color:0xe2c27a,transparent:true,opacity:.55})));
 const corridorPos=new Float32Array(6),corridorG=new THREE.BufferGeometry();corridorG.setAttribute('position',new THREE.BufferAttribute(corridorPos,3));
 const corridor=new THREE.Line(corridorG,new THREE.LineBasicMaterial({color:0x7fdfff,transparent:true,opacity:.85}));scene.add(corridor);
 const tether=bar(scene,[0,0,0],[1,0,0],.07,new THREE.MeshBasicMaterial({color:0x8ef6ff}));let clock=0,lastMissionT=0,zoom=1,camReady=false;const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const camPos=new THREE.Vector3(),lookS=new THREE.Vector3(),idealPos=new THREE.Vector3(),idealLook=new THREE.Vector3();
 const frame={w:1,h:1};
 const syncLens=()=>{const hole=new THREE.Vector3(0,0,0).project(camera);if(hole.z<0||hole.z>1){uniforms.uCenter.value.set(.4,.52);uniforms.uRange.value=6.5;return;}uniforms.uCenter.value.set(hole.x*.5+.5,hole.y*.5+.5);const rim=new THREE.Vector3(2.2*WORLD_SCALE,0,0).project(camera);const aspect=frame.w/Math.max(1,frame.h);const span=Math.max(Math.abs(rim.x-hole.x)*aspect,Math.abs(rim.y-hole.y));uniforms.uRange.value=THREE.MathUtils.clamp(span>.02?2.2/span:8,2.4,18);uniforms.uAspect.value=aspect;};
 const world={scene,camera,kind:'horizon',projectedFlag,shipScale:SHIP_SCALE,stationScale:STATION_SCALE,lensSamples:Q.high?20:7,get zoom(){return zoom;},resize(w,h){frame.w=w;frame.h=h;camera.aspect=w/Math.max(1,h);const area=getSafeArea?.()||{left:0,right:w,top:0,bottom:h};world.safeArea={left:area.left,right:Math.max(area.left+48,area.right),top:area.top,bottom:Math.max(area.top+48,area.bottom)};camera.updateProjectionMatrix();},update(dt){const s=state();if(s.t<lastMissionT){history.length=0;trailG.setDrawRange(0,0);camReady=false;}lastMissionT=s.t;clock+=dt;if(!reduced)uniforms.uTime.value=clock*.28;
  let px=s.probe.x,py=s.probe.y,seat=1;if(s.captured&&s.dockFrom&&s.capturedAt!=null){const u=Math.min(1,Math.max(0,(s.t-s.capturedAt)/2.6));seat=u*u*(3-2*u);px=s.dockFrom.x+(s.probe.x-s.dockFrom.x)*seat;py=s.dockFrom.y+(s.probe.y-s.dockFrom.y)*seat;}
  ship.position.set(s.x*WORLD_SCALE,s.y*WORLD_SCALE,0);ship.rotation.set(0,0,s.heading||0);probe.position.set(px*WORLD_SCALE,py*WORLD_SCALE,0);
  const radial=Math.atan2(py,px),port=s.captured?(s.heading||0)+Math.PI:radial;probe.rotation.set(0,0,port);
  const alive=!['done','failed'].includes(s.stage),hd=s.heading||0,cs=Math.cos(hd),sn=Math.sin(hd),forward=(s.ax||0)*cs+(s.ay||0)*sn,lateral=-(s.ax||0)*sn+(s.ay||0)*cs,pulse=.65+.35*Math.sin(clock*14);
  jet.visible=alive&&forward>.012;rcsNose.visible=alive&&forward<-.012;rcsPort.visible=alive&&(lateral<-.015||(s.omega||0)>.05);rcsStar.visible=alive&&(lateral>.015||(s.omega||0)<-.05);
  jet.scale.y=(.4+Math.min(1.3,Math.abs(forward)*4))*pulse;rcsNose.scale.y=pulse;rcsPort.scale.y=pulse;rcsStar.scale.y=pulse;
  for(const lamp of nav)lamp.material.opacity=1;nav.forEach((lamp,i)=>{lamp.visible=Math.sin(clock*3+i)> -.2;});
  projectedFlag.visible=!!s.captured;tether.visible=!!s.captured&&seat<.92;if(tether.visible){tether.position.copy(ship.position).add(probe.position).multiplyScalar(.5);const sep=probe.position.clone().sub(ship.position);tether.scale.y=Math.max(.001,sep.length());tether.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),sep.normalize());}
  const lampColor=s.alignOk?0x3dff9a:(Math.hypot(s.x-s.probe.x,s.y-s.probe.y)<DOCK_DIST+1.4?0xffc14a:0xff4d3a);for(const bulb of probe.userData.lamps||[])bulb.material.color.setHex(lampColor);
  const pr=Math.hypot(s.probe.x,s.probe.y)||1,ox=s.probe.x/pr,oy=s.probe.y/pr,reach=Math.min(16,(DOCK_DIST*.55)*WORLD_SCALE),bx=px*WORLD_SCALE,by=py*WORLD_SCALE;
  corridorPos[0]=bx;corridorPos[1]=by;corridorPos[2]=.4;corridorPos[3]=bx+ox*reach;corridorPos[4]=by+oy*reach;corridorPos[5]=.4;corridorG.attributes.position.needsUpdate=true;corridor.visible=s.stage==='intercept'&&!s.captured;corridor.material.color.setHex(s.alignOk?0x3dff9a:0x7fdfff);
  const dist=Math.hypot(s.x-px,s.y-py),close=Math.min(1,Math.max(0,(4.2-dist)/3.2));
  const shipW=ship.position,probeW=probe.position,mid=shipW.clone().add(probeW).multiplyScalar(.5);
  idealLook.copy(mid).lerp(new THREE.Vector3(0,0,2),.28*(1-close*.5));
  const radialDir=mid.clone();if(radialDir.lengthSq()<1)radialDir.set(WORLD_SCALE,0,0);radialDir.normalize();const side=new THREE.Vector3(-radialDir.y,radialDir.x,0);
  const span=Math.max(shipW.distanceTo(probeW)+SHIP_SCALE*2.2,36),backK=.9-close*.15,sideK=.46+close*.2,upK=.72+close*.05;
  const area=world.safeArea||{left:0,right:frame.w,top:0,bottom:frame.h};
  const margin=Math.max(6,Math.min(16,(area.right-area.left)*.02,(area.bottom-area.top)*.02));
  const bubble=(center,radius)=>[0,1,2,3,4,5,6,7].map(i=>{const a=i*Math.PI/4;return center.clone().add(new THREE.Vector3(Math.cos(a)*radius,Math.sin(a)*radius,(i%2)*.25*radius));});
  const guards=[...bubble(shipW,SHIP_SCALE*2.35),...bubble(probeW,STATION_SCALE*2.2)];
  const fits=()=>guards.every(p=>{const v=p.clone().project(camera);if(v.z<0||v.z>1)return false;const x=(v.x+1)*frame.w/2,y=(1-v.y)*frame.h/2;return x>=area.left+margin&&x<=area.right-margin&&y>=area.top+margin&&y<=area.bottom-margin;});
  const place=d=>{idealPos.copy(idealLook).addScaledVector(radialDir,d*backK).addScaledVector(side,d*sideK).add(new THREE.Vector3(0,0,d*upK));camera.position.copy(idealPos);camera.up.set(0,0,1);camera.lookAt(idealLook);camera.updateMatrixWorld(true);};
  let lo=span*.7,hi=Math.max(span*2.2,70);place(hi);if(!fits()){for(let i=0;i<7&&!fits();i++){hi*=1.28;place(hi);}}else{for(let i=0;i<9;i++){const m=(lo+hi)/2;place(m);if(fits())hi=m;else lo=m;}place(hi);}
  zoom=hi/Math.max(1,span);
  const blend=reduced||!camReady?1:1-Math.exp(-Math.max(0,dt)*1.8);camPos.lerp(idealPos,blend);lookS.lerp(idealLook,blend);camReady=true;
  camera.position.copy(camPos);camera.up.set(0,0,1);camera.lookAt(lookS);camera.updateMatrixWorld(true);syncLens();
  if(!history.length||history[history.length-1].distanceToSquared(ship.position)>.08){history.push(ship.position.clone());if(history.length>600)history.shift();history.forEach((p,i)=>p.toArray(trailA,i*3));trailG.attributes.position.needsUpdate=true;trailG.setDrawRange(0,history.length);trailG.computeBoundingSphere();}},dispose(){env.dispose();ft.dispose();radTex.dispose();scene.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])m.dispose();});}};
 world.layout=()=>world.resize(innerWidth,innerHeight);world.positions=()=>{const p=o=>{const v=o.position.clone().project(camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};};return{ship:p(ship),probe:p(probe),safe:world.safeArea};};world.resize(innerWidth,innerHeight);return world;
}
