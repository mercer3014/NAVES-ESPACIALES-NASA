// Explicit science-fiction / arcade approximation. NOT a GR trajectory or survival model.
// Positions are game radii; r=1 is a hard failure boundary. Story-years are a labeled narrative scale.
const G=9,THRUST=.9,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const HORIZON_RADIUS=1,SAFE_RADIUS=10,STORY_SECONDS_PER_YEAR=20;
const probeAt=t=>{const r=3.8-t*.015,a=-.55+t*.3;return{r,x:r*Math.cos(a),y:r*Math.sin(a),vx:-.015*Math.cos(a)-r*.3*Math.sin(a),vy:-.015*Math.sin(a)+r*.3*Math.cos(a)};};
export function createHorizon(seed=1){return{mission:'horizon',seed,stage:'intercept',t:0,x:8,y:0,vx:-.15,vy:1.05,fuel:100,thrust:0,heading:0,probe:probeAt(0),properTime:0,externalTime:0,factor:Math.sqrt(7/8),years:0,minRadius:8,arc:0,turn:false,assist:false,previousRadial:-.15,authorizeUntil:0,departureUntil:0,botWait:0,captured:false,score:null,fail:null,notice:null,radio:{key:'ho.radio.start',at:0,stretch:1,seq:0}};}
export function horizonControl(s,key,value=true){if(key==='authorize'&&value===true)s.authorizeUntil=s.t+45;if(key==='departure'&&value===true&&s.captured)s.departureUntil=s.t+45;}
export function horizonRadio(s){s.radio={key:s.captured?'ho.radio.return':'ho.radio.probe',at:s.t,stretch:1/Math.max(.15,s.factor),seq:s.radio.seq+1};}
export function horizonBot(s,dt){if(s.stage==='intercept'&&Math.hypot(s.x-s.probe.x,s.y-s.probe.y)<2){s.botWait+=dt;if(s.botWait>.8)horizonControl(s,'authorize');}if(s.stage==='escape'){s.botWait+=dt;if(s.botWait>1.5)horizonControl(s,'departure');}}
export function horizonAction(s){
 const d=Math.hypot(s.x-s.probe.x,s.y-s.probe.y),dv=Math.hypot(s.vx-s.probe.vx,s.vy-s.probe.vy);
 if(s.stage==='intercept'){
  if(s.authorizeUntil<s.t){s.notice={key:'ho.need.go',until:s.t+3};return false;}
  if(d<.65&&dv<.65&&Math.hypot(s.x,s.y)>1.3){s.captured=true;s.stage='escape';s.fuel=Math.max(0,s.fuel-2);horizonRadio(s);return true;}
  s.notice={key:'ho.need.match',until:s.t+3};
 }else if(s.stage==='escape'){
  if(s.departureUntil<s.t){s.notice={key:'ho.need.departure',until:s.t+3};return false;}
  if(Math.hypot(s.x,s.y)>=SAFE_RADIUS&&s.assist){s.stage='done';s.score=Math.round(clamp(60+s.fuel*.25+Math.max(0,15-s.years*5),0,100));return true;}
  s.notice={key:'ho.need.assist',until:s.t+3};
 }
 return false;
}
export function stepHorizon(s,input,dt){
 if(['done','failed'].includes(s.stage)){s.thrust=0;return s;}
 const r=Math.max(.01,Math.hypot(s.x,s.y)),oldA=Math.atan2(s.y,s.x);s.t+=dt;s.externalTime+=dt;s.factor=Math.sqrt(Math.max(.02,1-1/Math.max(1.001,r)));s.properTime+=dt*s.factor;s.years=(s.externalTime-s.properTime)/STORY_SECONDS_PER_YEAR;s.minRadius=Math.min(s.minRadius,r);
 let x=clamp(input.x||0,-1,1),y=clamp(input.y||0,-1,1),n=Math.max(1,Math.hypot(x,y));x/=n;y/=n;const burn=s.fuel>0?1:0;s.thrust=Math.hypot(x,y)*burn;if(s.thrust>.02)s.heading=Math.atan2(y,x);
 s.vx+=(-G*s.x/r**3+x*THRUST*burn)*dt;s.vy+=(-G*s.y/r**3+y*THRUST*burn)*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.fuel=Math.max(0,s.fuel-Math.hypot(x,y)*1.25*dt);
 const nr=Math.hypot(s.x,s.y),radial=(s.x*s.vx+s.y*s.vy)/Math.max(.01,nr),a=Math.atan2(s.y,s.x);let da=a-oldA;if(da>Math.PI)da-=Math.PI*2;if(da<-Math.PI)da+=Math.PI*2;if(nr<6.5)s.arc+=Math.abs(da);
 if(s.previousRadial<0&&radial>=0&&nr<6.5&&nr>1.3)s.turn=true;s.previousRadial=radial;s.assist=s.turn&&s.arc>.35;
 if(!s.captured){s.probe=probeAt(s.t);}else s.probe={x:s.x-Math.cos(s.heading)*1.7,y:s.y-Math.sin(s.heading)*1.7,vx:s.vx,vy:s.vy,r:nr};
 if(nr<=HORIZON_RADIUS)fail(s,'horizon');else if(s.captured&&Math.hypot(s.probe.x,s.probe.y)<=HORIZON_RADIUS)fail(s,'tether');else if(!s.captured&&s.probe.r<=1.15)fail(s,'probe');else if(s.t>240)fail(s,s.fuel<1?'fuel':'time');else if(nr>18&&!s.captured)fail(s,'lost');
 if(s.notice&&s.notice.until<s.t)s.notice=null;if(input.ping)horizonRadio(s);if(input.action&&!s.fail)horizonAction(s);return s;
}
function fail(s,k){s.stage='failed';s.fail=k;return s;}
export function horizonAutoInput(s){
 const r=Math.max(1.1,Math.hypot(s.x,s.y)),gx=-G*s.x/r**3,gy=-G*s.y/r**3;
 if(s.stage==='intercept'){const p=s.probe,omega=.3,ax=-omega*omega*p.x,ay=-omega*omega*p.y;return{x:((p.x-s.x)*.4+(p.vx-s.vx)*1.2+ax-gx)/THRUST,y:((p.y-s.y)*.4+(p.vy-s.vy)*1.2+ay-gy)/THRUST,action:Math.hypot(s.x-p.x,s.y-p.y)<.6&&Math.hypot(s.vx-p.vx,s.vy-p.vy)<.6};}
 if(s.stage==='escape')return{x:s.x/r,y:s.y/r,action:r>=SAFE_RADIUS};return{};
}
