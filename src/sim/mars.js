// Huerto rojo: deterministic, deliberately accelerated agriculture, not a real agronomy predictor.
export const SOL_SECONDS = 90, MARS_G = 3.71;
export const CROPS = ['potato','lettuce','quinoa'];
export const EVENTS = ['storm','leak','fungus','panel','storm'];
export const BASE={x:0,z:8};
export const SITES = [{x:-12,z:14,k:'ice'},{x:20,z:7,k:'regolith'},{x:-23,z:-12,k:'ice'},{x:12,z:-23,k:'regolith'},{x:26,z:24,k:'ice'},{x:-24,z:25,k:'regolith'}];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function createMars(seed=1){return {mission:'mars',seed,stage:'landing',t:0,land:{alt:650,x:-35,vx:3,vy:-18,thr:.48,fuel:100,mode:'chute',lower:0},rover:{x:0,z:0,yaw:0},collected:[],water:0,regolith:0,built:0,sol:0,solTime:0,event:null,eventFixed:false,eventHistory:[],energy:80,health:[1,1,1],kg:[0,0,0],waterUsed:0,settings:{water:.6,light:.55,temp:22,co2:.65},repairs:0,score:null,fail:null};}
function fail(s,k){s.stage='failed';s.fail=k;return s;}
export function marsAction(s){
 if(s.stage==='landing'){
  const l=s.land;
  if(l.mode==='chute'&&l.alt<260){l.mode='powered';return 'chute';}
  if(l.mode==='powered'&&l.alt<22&&l.alt>4&&Math.abs(l.vy)<3&&Math.abs(l.x)<16&&Math.abs(l.vx)<3){l.mode='skycrane';return 'crane';}
 }else if(s.stage==='gather'||s.stage==='grow'){
  for(let i=0;i<SITES.length;i++){const p=SITES[i];if(!s.collected.includes(i)&&Math.hypot(s.rover.x-p.x,s.rover.z-p.z)<3){s.collected.push(i);if(p.k==='ice')s.water+=4;else s.regolith+=3;return p.k;}}
  if(Math.hypot(s.rover.x-BASE.x,s.rover.z-BASE.z)<3){
   if(s.stage==='gather'&&s.water>=4&&s.regolith>=3){s.regolith-=3;s.stage='build';return 'build';}
   if(s.stage==='grow'&&!s.eventFixed&&['leak','panel','fungus'].includes(s.event)&&s.regolith>=1){s.regolith--;s.eventFixed=true;s.repairs++;return 'repair';}
  }
 }
 return null;
}
export function marsSet(s,key,value){if(Object.hasOwn(s.settings,key)&&Number.isFinite(value))s.settings[key]=clamp(value,key==='temp'?10:0,key==='temp'?32:1);}
export function marsBot(s){s.settings={water:(s.event==='fungus'&&!s.eventFixed) ? .43 : .61,light:s.event==='storm'?.32:.57,temp:22,co2:.65};}
export function stepMars(s,input,dt){
 if(['failed','done'].includes(s.stage))return s;
 s.t+=dt;
 if(s.stage==='landing'){
  const l=s.land;
  if(l.mode==='skycrane'){l.lower=clamp(l.lower+dt/6,0,1);l.alt=14;l.vy=0;l.x*=Math.exp(-dt);l.vx=0;l.fuel=Math.max(0,l.fuel-dt*.15);if(l.lower>=1){s.stage='gather';l.alt=0;}return s;}
  l.thr=clamp(l.thr+(input.y||0)*dt*.45,0,1);
  const wind=Math.sin(s.t*.37+s.seed)*.7;
  const drag=l.mode==='chute'?.022:.0015;
  const thrust=l.mode==='powered'&&l.fuel>0?l.thr*9:0;
  l.vy+=(-MARS_G-drag*l.vy*Math.abs(l.vy)+thrust)*dt;
  l.vx+=((input.x||0)*3+wind-l.vx*.13)*dt;l.x+=l.vx*dt;l.alt+=l.vy*dt;
  if(thrust)l.fuel=Math.max(0,l.fuel-l.thr*dt*.65);
  if(l.alt<=0)fail(s,'impact');if(Math.abs(l.x)>160)fail(s,'drift');
 }else if(s.stage==='gather'||s.stage==='grow'){
  const x=clamp(input.x||0,-1,1),z=clamp(input.y||0,-1,1),n=Math.max(1,Math.hypot(x,z));
  s.rover.x=clamp(s.rover.x+x/n*4*dt,-44,44);s.rover.z=clamp(s.rover.z-z/n*4*dt,-44,44);
  // The greenhouse is solid: keep the rover chassis clear of beds and cover.
  if(s.built>0&&Math.abs(s.rover.x)<4.7&&Math.abs(s.rover.z)<5.8){if(4.7-Math.abs(s.rover.x)<5.8-Math.abs(s.rover.z))s.rover.x=Math.sign(s.rover.x||1)*4.7;else s.rover.z=Math.sign(s.rover.z||1)*5.8;}if(Math.hypot(x,z)>.1)s.rover.yaw=Math.atan2(x,-z);
  if(s.stage==='grow')grow(s,dt);
 }else if(s.stage==='build'){s.built=clamp(s.built+dt/7,0,1);if(s.built>=1){s.stage='grow';s.event=EVENTS[0];s.eventHistory.push(s.event);}}
 if(input.action)marsAction(s);
 return s;
}
function grow(s,dt){
 s.solTime+=dt;const c=s.settings,storm=s.event==='storm',leak=s.event==='leak'&&!s.eventFixed,panel=s.event==='panel'&&!s.eventFixed,fungus=s.event==='fungus'&&!s.eventFixed;
 const solar=storm?.23:1,production=(panel?.25:1)*solar*.29,load=.045+c.light*.18+Math.abs(c.temp-14)*.006+c.co2*.025;
 s.energy=clamp(s.energy+(production-load)*dt,0,100);
 const use=(.006+c.water*.009+(leak?.018:0))*dt,draw=Math.min(s.water,use);s.water-=draw;s.waterUsed+=draw;
 const power=s.energy>1?1:.25,water=draw>=use*.95?1:.08;
 const comfort=clamp(1-Math.abs(c.temp-22)/16,0,1)*clamp(1-Math.abs(c.water-.6),0,1)*(0.35+.65*c.light)*(.5+.5*c.co2)*water*power;
 for(let i=0;i<3;i++){const risk=fungus&&c.water>.5?.013:0;s.health[i]=clamp(s.health[i]+((comfort-.38)*.006-risk)*dt,0,1);s.kg[i]+=.014*comfort*s.health[i]*dt*(i===1?.8:i===2?.9:1);}
 if(s.health.every(h=>h<.04))fail(s,'crops');
 if(s.solTime>=SOL_SECONDS){s.solTime-=SOL_SECONDS;s.sol++;if(s.sol>=5){s.stage='done';s.score=marsScore(s);}else{s.event=EVENTS[s.sol];s.eventFixed=false;s.eventHistory.push(s.event);}}
}
export function marsScore(s){const kg=s.kg.reduce((a,b)=>a+b,0),eff=kg/Math.max(1,s.waterUsed);return Math.round(clamp(kg*4+eff*8+s.health.reduce((a,b)=>a+b,0)*5,0,100));}
export function marsAutoInput(s){
 if(s.stage==='landing'){const l=s.land;if(l.mode==='chute')return{x:clamp((-l.x*.14-l.vx)*.5,-1,1),action:l.alt<180};if(l.mode==='powered'){const targetVy=-Math.min(10,Math.max(.8,(l.alt-12)*.12));const target=clamp((MARS_G+(targetVy-l.vy)*1.2)/9,0,1);return{x:clamp((-l.x*.12-l.vx)*.5,-1,1),y:clamp((target-l.thr)*8,-1,1),action:l.alt<20&&Math.abs(l.vy)<2.8};}return{};}
 let target=null;
 if(s.stage==='gather'){if(s.water<4)target=SITES.find((p,i)=>p.k==='ice'&&!s.collected.includes(i));else if(s.regolith<3)target=SITES.find((p,i)=>p.k==='regolith'&&!s.collected.includes(i));else target=BASE;}
 if(s.stage==='grow'){if(s.water<2)target=SITES.find((p,i)=>p.k==='ice'&&!s.collected.includes(i));else if(s.regolith<1&&!s.eventFixed&&['panel','leak','fungus'].includes(s.event))target=SITES.find((p,i)=>p.k==='regolith'&&!s.collected.includes(i));else target=BASE;}
 if(target){const dx=target.x-s.rover.x,dz=target.z-s.rover.z;return{x:clamp(dx,-1,1),y:clamp(-dz,-1,1),action:Math.hypot(dx,dz)<2.6};}return{};
}
export function retryMars(s){
 if(s.fail!=='crops')return createMars(s.seed);
 const fresh=createMars(s.seed);Object.assign(fresh,{stage:'grow',land:{...s.land,alt:0},rover:{...s.rover},collected:[...s.collected],water:6,regolith:3,built:1,event:EVENTS[0],eventHistory:[EVENTS[0]]});return fresh;
}
