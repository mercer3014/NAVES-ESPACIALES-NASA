// Original fictional rescue hardware and illustrative 2-D lensing shader, not a GR renderer.
import {THREE,Q,renderer} from '../core/engine.js';
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
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-108,108,108,-108,.1,900);camera.position.z=300;camera.lookAt(0,0,0);
 const uniforms={uTime:{value:0},uAspect:{value:innerWidth/innerHeight},uRange:{value:12},uCenter:{value:new THREE.Vector2(.5,.5)}};
 const lensMaterial=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,defines:{SAMPLES:Q.high?20:7},uniforms,depthTest:false,depthWrite:false,toneMapped:false});
 const lens=new THREE.Mesh(new THREE.PlaneGeometry(2,2),lensMaterial);lens.frustumCulled=false;lens.renderOrder=-1000;scene.add(lens);
 scene.add(new THREE.HemisphereLight(0xc9deff,0x18111d,1.8));const sun=new THREE.DirectionalLight(0xffc079,4);sun.position.set(-40,15,100);scene.add(sun);const pm=new THREE.PMREMGenerator(renderer),env=pm.fromScene(new RoomEnvironment(),.04).texture;pm.dispose();scene.environment=env;
 const steel=new THREE.MeshStandardMaterial({color:0x949aa6,metalness:.85,roughness:.3}),gold=new THREE.MeshStandardMaterial({color:0xa28645,metalness:.7,roughness:.36}),white=new THREE.MeshStandardMaterial({color:0xb7b9ad,metalness:.25,roughness:.55}),dark=new THREE.MeshStandardMaterial({color:0x161e2c,metalness:.5,roughness:.4}),cyan=new THREE.MeshBasicMaterial({color:0x73e7ff});
 const mesh=(g,m,p)=>{const o=new THREE.Mesh(g,m);p.add(o);return o;};
 const bar=(p,a,b,r=.04,mat=steel)=>{const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),d=vb.clone().sub(va),m=mesh(new THREE.CylinderGeometry(r,r,d.length(),8),mat,p);m.position.copy(va).add(vb).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;};
 const ship=new THREE.Group();ship.scale.setScalar(2.1);scene.add(ship);const body=mesh(new THREE.CapsuleGeometry(.67,2.7,8,24),gold,ship);body.rotation.z=Math.PI/2;
 for(let i=0;i<6;i++){const rib=mesh(new THREE.TorusGeometry(.7,.04,8,24),steel,ship);rib.rotation.y=Math.PI/2;rib.position.x=-1.3+i*.52;}
 const nose=mesh(new THREE.SphereGeometry(.92,24,16),white,ship);nose.scale.set(.25,1,1);nose.position.x=2.02;const port=mesh(new THREE.CylinderGeometry(.23,.23,.13,20),dark,ship);port.rotation.z=Math.PI/2;port.position.x=2.27;
 const engine=mesh(new THREE.CylinderGeometry(.3,.5,.8,24,1,true),steel,ship);engine.rotation.z=-Math.PI/2;engine.position.x=-2.15;
 const jet=mesh(new THREE.ConeGeometry(.32,3,24),new THREE.MeshBasicMaterial({color:0x8cbbff,transparent:true,opacity:.7,depthWrite:false}),ship);jet.rotation.z=-Math.PI/2;jet.position.x=-3.4;
 const radC=document.createElement('canvas');radC.width=128;radC.height=80;const rg=radC.getContext('2d');rg.fillStyle='#121820';rg.fillRect(0,0,128,80);for(let i=0;i<10;i++){rg.fillStyle=i%2?'#2a3a4e':'#1c2836';rg.fillRect(6+i*12,6,8,68);rg.fillStyle='#c6a15a';rg.fillRect(6+i*12,6,8,2);rg.fillRect(6+i*12,72,8,2);}const radTex=new THREE.CanvasTexture(radC);radTex.colorSpace=THREE.SRGBColorSpace;const radMat=new THREE.MeshStandardMaterial({map:radTex,color:0xd7e2ea,metalness:.45,roughness:.42,side:THREE.DoubleSide});
 for(const sign of[-1,1]){bar(ship,[0,0,0],[0,sign*2.3,0],.08);const radiator=mesh(new THREE.PlaneGeometry(2.6,1.7),radMat,ship);radiator.position.set(0,sign*2.2,0);for(let k=0;k<9;k++)bar(ship,[-1.2+k*.3,sign*2.2-.78,.06],[-1.2+k*.3,sign*2.2+.78,.06],.012,steel);for(let k=0;k<3;k++){const tank=mesh(new THREE.SphereGeometry(.32,16,10),white,ship);tank.position.set(-1.2+k*.85,sign*.8,-.05);}}
 bar(ship,[.4,0,.5],[.4,0,2.2],.025);const dish=mesh(new THREE.SphereGeometry(.65,20,12,0,Math.PI*2,0,Math.PI*.38),steel,ship);dish.position.set(.4,0,2.15);dish.rotation.x=Math.PI/2;bar(ship,[.4,0,2.15],[.4,0,2.6],.02);
 const probe=new THREE.Group();probe.scale.setScalar(1.9);scene.add(probe);const bus=mesh(new THREE.CylinderGeometry(.72,.72,1.4,8),gold,probe);bus.rotation.x=Math.PI/2;for(let i=0;i<8;i++){const a=i*Math.PI/4;bar(probe,[Math.cos(a)*.74,Math.sin(a)*.74,-.7],[Math.cos(a)*.74,Math.sin(a)*.74,.7],.035);}
 for(const x of[-1,1]){bar(probe,[0,0,0],[x*2.3,0,0],.04);const sensor=mesh(new THREE.SphereGeometry(.35,20,12),dark,probe);sensor.position.x=x*2.3;const panel=mesh(new THREE.BoxGeometry(1.4,2.2,.05),dark,probe);panel.position.set(x*1.55,0,-.3);for(let j=0;j<4;j++)bar(probe,[x*1.55-.65,-.9+j*.6,-.25],[x*1.55+.65,-.9+j*.6,-.25],.01,steel);}
 bar(probe,[0,.5,0],[0,2.2,.2],.035);mesh(new THREE.TorusGeometry(1.1,.022,6,48),cyan,probe);
 const fc=document.createElement('canvas');renderFlag(fc,flag||defaultFlag(),384,256);const ft=new THREE.CanvasTexture(fc);ft.colorSpace=THREE.SRGBColorSpace;const projectedFlag=mesh(new THREE.PlaneGeometry(1.15,.77),new THREE.MeshStandardMaterial({map:ft,emissiveMap:ft,emissive:0xffffff,emissiveIntensity:.75,side:THREE.DoubleSide,transparent:true,opacity:.9}),probe);projectedFlag.position.z=.735;
 const ring=(radius,color)=>{const pts=[];for(let i=0;i<=128;i++){const a=i*Math.PI/64;pts.push(new THREE.Vector3(Math.cos(a)*radius*9,Math.sin(a)*radius*9,-2));}const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineDashedMaterial({color,dashSize:.6,gapSize:.9,transparent:true,opacity:.35}));line.computeLineDistances();scene.add(line);return line;};ring(1,0xff3a33);ring(10,0x83b6c5);
 const history=[],trailG=new THREE.BufferGeometry(),trailA=new Float32Array(600*3);trailG.setAttribute('position',new THREE.BufferAttribute(trailA,3));trailG.setDrawRange(0,0);scene.add(new THREE.Line(trailG,new THREE.LineBasicMaterial({color:0xc8a360,transparent:true,opacity:.45})));
 const tether=bar(scene,[0,0,0],[1,0,0],.025,cyan);let clock=0,lastMissionT=0;const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const world={scene,camera,kind:'horizon',projectedFlag,lensSamples:Q.high?20:7,resize(w,h){const area=getSafeArea?.()||{left:0,right:w,top:0,bottom:h};const k=Math.max(2,Math.min(area.right-area.left,area.bottom-area.top)/24),cx=(area.left+area.right)/2,cy=(area.top+area.bottom)/2;uniforms.uAspect.value=w/h;uniforms.uRange.value=h/(2*k);uniforms.uCenter.value.set(cx/w,1-cy/h);camera.left=-cx/k*9;camera.right=(w-cx)/k*9;camera.top=cy/k*9;camera.bottom=-(h-cy)/k*9;camera.updateProjectionMatrix();world.safeArea=area;},update(dt){const s=state();if(s.t<lastMissionT){history.length=0;trailG.setDrawRange(0,0);}lastMissionT=s.t;clock+=dt;if(!reduced)uniforms.uTime.value=clock*.3;ship.position.set(s.x*9,s.y*9,6);ship.rotation.z+=Math.atan2(Math.sin((s.heading||0)-ship.rotation.z),Math.cos((s.heading||0)-ship.rotation.z))*(1-Math.exp(-dt*5));probe.position.set(s.probe.x*9,s.probe.y*9,5);const probeHeading=s.captured?s.heading:s.t*.14;probe.rotation.z+=Math.atan2(Math.sin(probeHeading-probe.rotation.z),Math.cos(probeHeading-probe.rotation.z))*(1-Math.exp(-dt*3));projectedFlag.visible=s.captured;jet.visible=s.thrust>.02&&!['done','failed'].includes(s.stage);jet.scale.y=s.thrust*(.6+.1*Math.sin(clock*14));tether.visible=s.captured;tether.position.copy(ship.position).add(probe.position).multiplyScalar(.5);const d=probe.position.clone().sub(ship.position);tether.scale.y=d.length();tether.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());if(!history.length||history[history.length-1].distanceToSquared(ship.position)>.04){history.push(ship.position.clone());if(history.length>600)history.shift();history.forEach((p,i)=>p.toArray(trailA,i*3));trailG.attributes.position.needsUpdate=true;trailG.setDrawRange(0,history.length);trailG.computeBoundingSphere();}},dispose(){env.dispose();ft.dispose();radTex.dispose();scene.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])m.dispose();});}};
 world.layout=()=>world.resize(innerWidth,innerHeight);world.positions=()=>{const p=o=>{const v=o.position.clone().project(camera);return{x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};};return{ship:p(ship),probe:p(probe),safe:world.safeArea};};world.resize(innerWidth,innerHeight);return world;
}
