import {htmlText} from './view.js';
import {toggleExpeditionAudio} from './audio-controls.js';
import './text.js';
import './expeditions.css';
import {t} from '../../core/i18n.js';
import {store,on,dbg,DEBUG,isTouch} from '../../core/store.js';
import {icon,marsPrompt} from '../../ui/flight-hud.js';
import {installHudKeys,paintPrompt,flashPhase} from '../../ui/flight-hud-mount.js';
import {axis,pressed,makeStick,bindBtn,bpressed,clearBtns} from '../../core/input.js';
import {setWorld,onTick,invalidateModel} from '../../core/engine.js';
import {sfx,music,engine,stopEngine,stopVoices,unlock,say} from '../../core/audio.js';
import {setPhaseBed} from '../../audio/runtime.js';
import {net,tx,peerOnline,leaveRoom} from '../../net/room.js';
import {show} from '../../ui/router.js';
import {lobbyBg,startScreen,createScreen,getFlag} from '../../ui/screens.js';
import {createMars,stepMars,marsBot,marsSet,marsAutoInput,retryMars,SITES,BASE} from '../../sim/mars.js';
import {marsHudFields,marsHintKey,marsClimateOpen} from './mars-present.js';
import {playCue,stopCue} from '../cutscenes/play.js';
import {bindOrbitControls} from '../orbit-view.js';
import {createOrbitState} from '../orbit-camera.js';
const q=(s,el)=>el.querySelector(s),fmt=(x,n=0)=>Number(x||0).toFixed(n);
export async function startExpedition({mission='mars',mode='solo',role='pilot',seed=17,resume=null}={}){
 if(mission!=='mars')throw Error('Unexpected Mars mission dispatcher');
 const pilot=role==='pilot',coop=mode==='coop',offs=[];let alive=true,ready=false,world=null,acc=0,snapAt=0,paintAt=0,lastStage='',lastSol=-1,posted=false;
 let state=resume?.aux?.mission===mission?resume.aux:createMars(seed),auto=DEBUG&&new URLSearchParams(location.search).get('autoexp')==='1',rate=DEBUG?Math.min(60,Math.max(1,+new URLSearchParams(location.search).get('xs')||1)):1,pace=1,craneShown=state.land?.mode==='skycrane';
 let hasSnap=pilot,pendingAction=false;
 const el=show(`<div class="expedition mhud ${pilot?'pilot':'capcom'}"><header class="ex-head"><h2>${t('ex.'+mission)}</h2><nav><button class="btn ex-mute">${t('ex.mute')}</button><button class="btn ex-exit">${t('ex.exit')}</button></nav></header><section class="ex-panel mhud-card is-shut ${pilot?'':'cc'}" data-obj data-open="0"><button type="button" class="mhud-card-h" data-obj-toggle aria-expanded="false" aria-keyshortcuts="Tab"><span class="mhud-kicker">${t('ex.'+mission)}</span>${icon('chevron')}</button><div class="mhud-card-b"><div class="mhud-clip"><h3 class="ex-stage"></h3><p class="ex-status" aria-live="polite"></p><p class="ex-hint"></p>${pilot?'':'<div class="ex-tele"></div>'}<p class="ex-event" aria-live="polite"></p><section class="ex-climate"><h3>${t('ma.climate')}</h3><p>${t('ma.solar')}</p><div class="ex-sliders">${['water','light','temp','co2'].map(k=>`<label class="ex-slider">${t('ma.'+k)} <output data-out="${k}"></output><input aria-label="${t('ma.'+k)}" data-climate="${k}" type="range" min="${k==='temp'?10:0}" max="${k==='temp'?32:1}" step="${k==='temp'?1:.01}"></label>`).join('')}</div></section></div></div></section>${pilot?'<aside class="mhud-rail"><div class="ex-tele"></div></aside>':''}<aside class="ex-mapbox"><canvas width="300" height="300" aria-label="${t('ma.map')}"></canvas><p>${t('ma.map')}</p></aside>${pilot?`<div class="ex-controls">${isTouch?`<div class="ex-stick" role="application" aria-label="${t('ex.controls')}"><i></i></div>`:''}<div class="ex-actions">${isTouch?`<button class="btn go ex-action" hidden type="button"></button>`:''}<button class="btn ex-pace" hidden type="button">${t('ma.pace')}</button></div></div>`:''}<div class="ex-cine" hidden><div class="ex-cine-metric"><small>${t('ma.alt')}</small><b class="ex-cine-alt"></b></div><div class="ex-cine-metric"><small>${t('ma.vy')}</small><b class="ex-cine-vy"></b></div><div><span class="ex-fuel-label">${t('ma.fuel')}</span><div class="ex-fuel-track" role="meter" aria-valuemin="0" aria-valuemax="100" aria-label="${t('ma.fuel')}"><i class="ex-fuel-fill"></i></div></div></div><section class="ex-result"></section><section class="ex-error"></section><div class="ex-loading">${t('ex.loading')}</div></div>`,'expedition',()=>{
  alive=false;stopCue();offs.splice(0).forEach(f=>f());clearBtns();stopEngine();stopVoices();world?.dispose?.();dbg('expedition',null);
 });
 const exit=(peer=false)=>{setPhaseBed(null);if(coop){if(!peer)tx({t:'quit',mission});leaveRoom();}startScreen();};
 q('.ex-exit',el).onclick=()=>exit();q('.ex-mute',el).onclick=()=>{toggleExpeditionAudio();paint();};
 installHudKeys();if(pilot){if(isTouch){makeStick(q('.ex-stick',el));bindBtn(q('.ex-action',el),'exp-action');}const paceBtn=q('.ex-pace',el);if(paceBtn)paceBtn.onclick=()=>{pace=pace>1?1:4;sfx('tick');paint();};}
 const send=force=>{if(coop&&pilot&&(force||performance.now()-snapAt>220)){snapAt=performance.now();tx({t:'snap',ph:mission,d:state});}};
 const reset=()=>{if(!pilot){tx({t:'ev',k:'exp-control',mission,key:'retry'});return;}state=retryMars(state);acc=0;posted=false;lastStage='';lastSol=-1;craneShown=false;stopCue();tx({t:'restart',ph:mission,mission});tx({t:'phase',ph:mission,mission});send(true);paint();};
 const control=(key,value)=>{if(!pilot&&coop)tx({t:'ev',k:'exp-control',mission,key,value});};
 el.querySelectorAll('[data-climate]').forEach(x=>x.oninput=()=>{q(`[data-out=${x.dataset.climate}]`,el).textContent=x.dataset.climate==='temp'?x.value+' °C':fmt(+x.value*100)+'%';control(x.dataset.climate,+x.value);});
 if(coop){
  offs.push(on('net:snap',m=>{if(!pilot&&m.ph===mission&&m.d?.mission===mission){state=m.d;hasSnap=true;paint();}}));
  offs.push(on('net:ev',m=>{if(!pilot||m.k!=='exp-control'||m.mission!==mission||!net.members.some(x=>x.id===m.from&&x.role==='capcom'))return;if(m.key==='retry'){reset();return;}marsSet(state,m.key,m.value);send(true);}));
  offs.push(on('net:debrief',m=>{if(!pilot&&m.mission===mission&&m.state){state=m.state;hasSnap=true;paint();}}));
  offs.push(on('net:quit',()=>exit(true)));
  offs.push(on('net:joined',m=>{if(!m.rejoin)return;if(pilot){tx({t:'phase',ph:mission,mission});send(true);}else tx({t:'sync'});paint();}));
  offs.push(on('net:lost',paint),on('net:peer',paint),on('net:roster',paint));
 }
 function announce(){
  if(state.stage!==lastStage){lastStage=state.stage;const key=state.stage==='landing'?'tension':state.stage==='gather'?'eva':state.stage==='done'?'victory':'ambient';music(key,{fade:500,vol:.38});setPhaseBed('mars-'+state.stage);sfx(state.stage==='failed'?'jingle_fail':state.stage==='done'?'jingle_win':'stage',{vol:.35});say(t(['done','failed'].includes(state.stage)?'ex.'+state.stage:'ma.'+state.stage),store.get('lang'));if(!['done','failed'].includes(state.stage))flashPhase(t('ex.'+mission),t('ma.'+state.stage));send(true);}
  if(state.sol!==lastSol){if(lastSol>=0)sfx('bong',{vol:.35});lastSol=state.sol;send(true);}
  if(state.stage==='done'&&!posted){posted=true;if(coop&&pilot){send(true);tx({t:'debrief',mission,state});}}
 }
 function simulate(dt,controls){
  if(!coop||!peerOnline())marsBot(state);
  const before=state.stage,was=[state.collected.length,state.regolith,state.repairs,state.land.mode,state.stage].join(':');stepMars(state,controls,dt);
  if(controls.action&&was!==[state.collected.length,state.regolith,state.repairs,state.land.mode,state.stage].join(':'))sfx(before==='landing'?'clunk':state.repairs?'hammer':'field',{vol:.3});
 }
 function paint(){
  if(!alive)return;const s=state,done=['done','failed'].includes(s.stage);
  q('.ex-mute',el).textContent=t(Object.values(store.get('vol')).some(x=>x>0)?'ex.mute':'ex.unmute');
  q('.ex-status',el).textContent=!hasSnap?t('ex.sync'):coop&&!net.connected?t('ex.offline'):!pilot&&!peerOnline()?t('ex.pilot.wait'):!coop||!peerOnline()?t('ex.pancho'):t(pilot?'ex.crew':'ex.pilot.ready');
  q('.ex-stage',el).textContent=t(done?'ex.'+s.stage:'ma.'+s.stage);
  q('.ex-hint',el).textContent=t(marsHintKey({stage:s.stage,mode:s.land.mode,role:pilot?'pilot':'capcom',coop,peer:coop&&peerOnline()}));
  const cell=(k,v)=>`<div class="ex-cell"><small>${t('ma.'+k)}</small><b>${v}</b></div>`;
  const hud={alt:fmt(s.land.alt)+' m',vy:fmt(s.land.vy,1)+' m/s',offset:fmt(s.land.x,1)+' m',throttle:fmt(s.land.thr*100)+'%',fuel:fmt(s.land.fuel)+'%',water:fmt(s.water,1),regolith:fmt(s.regolith),energy:fmt(s.energy)+'%',sol:Math.min(5,s.sol+1)+'/5 · '+fmt(Math.max(0,90-s.solTime))+' s',harvest:fmt(s.kg.reduce((a,b)=>a+b,0),1)+' kg',health:fmt(s.health.reduce((a,b)=>a+b,0)/3*100)+'%',found:s.collected.length+'/'+SITES.length,progress:fmt(s.built*100)+'%'};
  q('.ex-tele',el).innerHTML=marsHudFields(s.stage).map(k=>cell(k,hud[k])).join('');
  q('.ex-climate',el).classList.toggle('is-on',marsClimateOpen(s.stage,pilot?'pilot':'capcom',coop));
  q('.ex-event',el).textContent=s.stage==='grow'?t(s.eventFixed?'ma.fixed':'ma.'+s.event):'';
  const paceBtn=q('.ex-pace',el);if(paceBtn){paceBtn.hidden=s.stage!=='grow';paceBtn.textContent=t(pace>1?'ma.paceOn':'ma.pace');}
  el.querySelectorAll('[data-climate]').forEach(x=>{const k=x.dataset.climate;if(document.activeElement!==x)x.value=s.settings[k];q(`[data-out=${k}]`,el).textContent=k==='temp'?fmt(s.settings[k])+' °C':fmt(s.settings[k]*100)+'%';});
  const result=q('.ex-result',el);result.style.display=done?'flex':'none';q('.ex-controls',el)?.classList.toggle('ex-hidden',done);q('.ex-panel',el).classList.toggle('ex-hidden',done);const landing=s.stage==='landing'&&!done;q('.mhud-rail',el)?.classList.toggle('ex-hidden',done||landing);q('.ex-mapbox',el).classList.toggle('ex-hidden',done||landing);el.classList.toggle('is-landing',landing);const cine=q('.ex-cine',el);if(cine){cine.hidden=!landing;if(landing){q('.ex-cine-alt',cine).textContent=fmt(s.land.alt)+' m';q('.ex-cine-vy',cine).textContent=fmt(s.land.vy,1)+' m/s';const fuel=Math.max(0,Math.min(100,s.land.fuel));q('.ex-fuel-fill',cine).style.width=fuel+'%';q('.ex-fuel-track',cine).setAttribute('aria-valuenow',String(Math.round(fuel)));}}const pr=!done&&pilot?marsPrompt(s):null;const act=q('.ex-action',el);if(act){act.hidden=!pr;if(pr)act.textContent=t(pr.labelKey);}if(!isTouch)paintPrompt(el,pr,pr?t(pr.labelKey):'');
  if(done){const signature=s.stage+':'+s.t;if(result.dataset.sig!==signature){result.dataset.sig=signature;result.innerHTML=`<div class="panel"><div class="phase-tag">${t('ex.mars')}</div><h2>${t('ex.'+s.stage)}</h2>${s.stage==='failed'?`<p>${htmlText(t('ma.fail.'+s.fail))}</p>`:`<div class="ex-tele">${cell('harvest',fmt(s.kg.reduce((a,b)=>a+b,0),2)+' kg')}${cell('efficiency',fmt(s.kg.reduce((a,b)=>a+b,0)/Math.max(1,s.waterUsed),2))}${cell('repairs',fmt(s.repairs))}</div><p>${t('ex.score')}: <b>${fmt(s.score,0)}/100</b> · ${t('ex.elapsed')}: ${fmt(s.t)} s</p><ul>${s.kg.map((k,i)=>`<li>${t('ma.'+['potato','lettuce','quinoa'][i])}: ${fmt(k,2)} kg</li>`).join('')}</ul><p>${t('ma.eventlog')}: ${s.eventHistory.map(k=>htmlText(t('ma.'+k).split(':')[0])).join(' · ')}</p>`}<p class="ex-fineprint">${t('ex.mars.note')}</p><div class="btns"><button class="btn go ex-retry">${t(s.fail==='crops'?'ex.retry.crop':'ex.retry')}</button><button class="btn ex-menu">${t('ex.menu')}</button></div></div>`;q('.ex-retry',result).onclick=reset;q('.ex-menu',result).onclick=()=>exit();}}
  drawMap();
 }
 function drawMap(){const c=q('.ex-mapbox canvas',el),ctx=c.getContext('2d'),s=state;ctx.fillStyle='#17252b';ctx.fillRect(0,0,300,300);ctx.strokeStyle='#466068';ctx.lineWidth=1;for(let i=0;i<=6;i++){ctx.beginPath();ctx.moveTo(i*50,0);ctx.lineTo(i*50,300);ctx.moveTo(0,i*50);ctx.lineTo(300,i*50);ctx.stroke();}const map=(x,z)=>[150+x*3,150+z*3];ctx.font='bold 24px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff3ce';ctx.fillText('+',...map(BASE.x,BASE.z));SITES.forEach((p,i)=>{if(s.collected.includes(i))return;ctx.fillStyle=p.k==='ice'?'#aff0ff':'#f5b969';ctx.fillText(p.k==='ice'?'○':'◇',...map(p.x,p.z));});const [x,y]=map(s.rover.x,s.rover.z);ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI-s.rover.yaw);ctx.fillStyle='#f9f8e4';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(-6,6);ctx.lineTo(6,6);ctx.fill();ctx.restore();}
 dbg('expedition',{get state(){return state;},role,mission,get ready(){return ready;},setAuto(v){auto=!!v;},setRate(v){rate=Math.min(60,Math.max(1,v));},retry:reset});
 paint();
 try{if(pilot){const {makeMarsWorld}=await import('../../scenes/mars.js');world=await makeMarsWorld(()=>state,getFlag());if(!alive){world.dispose();return;}setWorld(world);}else lobbyBg();ready=true;q('.ex-loading',el).remove();}catch(e){if(!alive)return;console.error('Mars required asset',e);q('.ex-loading',el).remove();const err=q('.ex-error',el);err.style.display='flex';err.innerHTML=`<div class="panel"><p>${t('ex.asset')}</p><button class="btn ex-reload">${t('ex.reload')}</button><button class="btn ex-menu">${t('ex.menu')}</button></div>`;q('.ex-reload',err).onclick=()=>{invalidateModel('rover');startExpedition({mission,mode,role,seed,resume:{aux:state}});};q('.ex-menu',err).onclick=()=>exit();return;}
 if(coop){if(pilot){tx({t:'phase',ph:mission,mission});send(true);}else tx({t:'sync'});}
 let camRig=null;
 if(pilot&&world){const orbitCam=createOrbitState({yaw:.9,pitch:.42,distance:16,minDistance:4.2,maxDistance:70,damp:6});world.orbit=orbitCam;camRig=bindOrbitControls(orbitCam,{allow:()=>alive});offs.push(()=>camRig.dispose());}
 offs.push(onTick(dt=>{if(camRig&&world){camRig.poll();world.camMode=camRig.owner();}if(!alive||!ready)return;if(pilot&&(!coop||net.connected)){
  const a=axis();pendingAction ||= pressed('KeyE','Space')||bpressed('exp-action');acc+=dt*rate*(state.stage==='grow'?pace:1);let first=true;
  while(acc>=1/30){simulate(1/30,auto?marsAutoInput(state):{...a,action:first&&pendingAction});pendingAction=false;first=false;acc-=1/30;}
  if(state.stage==='landing'&&state.land.mode==='skycrane'&&!craneShown){craneShown=true;playCue('skycrane',{anchor:()=>world?.rover});}
  announce();send(false);if(state.stage==='landing'&&state.land.mode!=='chute')engine(state.land.thr*.35);else stopEngine();
 }if(performance.now()-paintAt>120){paintAt=performance.now();paint();}}));
}
