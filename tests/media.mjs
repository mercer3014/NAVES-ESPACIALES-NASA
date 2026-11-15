// Isolated headless QA for this game's own pages; no signed-in desktop/browser session.
// Uses the normal restrictive autoplay policy, not autoplay-allow flags. No microphone request.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://localhost:8787';
const publicRun=!base.includes('localhost');
const b=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:'new',protocolTimeout:120000,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
for (const [lang,w,h,mobile,blocked] of [['en',1024,640,false,false],['es',390,844,true,false],['en',844,390,true,false],['es',1024,640,false,true]]) {
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.setViewport({width:w,height:h,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:.5});
 await p.evaluateOnNewDocument((lang,blocked)=>{localStorage.setItem('plb.v1',JSON.stringify({lang,quality:'low',tts:false,introSeen:false}));if(blocked){const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(!navigator.userActivation?.isActive)return Promise.reject(new DOMException('QA autoplay denied','NotAllowedError'));return play.call(this);};}},lang,blocked);
 await p.goto(base+'/?debug',{waitUntil:'domcontentloaded'});
 await p.waitForSelector('.intro video',{timeout:60000});
 await p.waitForFunction(()=>document.querySelector('video')?.readyState>=2,{timeout:60000});
 const meta=await p.$eval('video',v=>({duration:v.duration,src:v.currentSrc,muted:v.muted,activated:navigator.userActivation?.hasBeenActive,inline:v.playsInline}));
 assert(meta.duration>78&&meta.duration<80);assert(meta.inline);assert(meta.src.includes(mobile?'480':'720'));
 if(blocked){assert.match(await p.$eval('.sound',e=>e.textContent),/Reproducir/);await p.click('.sound');}
 await p.waitForFunction(()=>document.querySelector('video')?.currentTime>.3&&!document.querySelector('video').paused,{timeout:30000});
 if(!blocked){assert(meta.muted||meta.activated,'unmuted playback without a prior gesture');if(await p.$eval('.sound',e=>!e.hidden))await p.click('.sound');}
 await p.waitForFunction(()=>!document.querySelector('video').muted,{timeout:10000});
 await p.$eval('video',v=>v.currentTime=47);
 await p.waitForFunction(()=>document.querySelector('.sub')?.textContent.length>5,{timeout:20000});
 await p.screenshot({path:`../screenshots/80_intro_${lang}_${w}x${h}${blocked?'_blocked':''}.png`});
 const skip=await p.$eval('.skip',e=>{const r=e.getBoundingClientRect();return r.bottom<=innerHeight&&r.right<=innerWidth&&r.height>=44;});assert(skip,'skip not reachable');
 await p.click('.skip');await p.waitForFunction(()=>document.body.dataset.screen==='start');
 await new Promise(r=>setTimeout(r,600));assert.equal(await p.$$eval('video',v=>v.length),0,'intro element leaked');
 await p.$eval('[data-a=intro]',e=>e.scrollIntoView({behavior:'instant',block:'center'}));await p.click('[data-a=intro]');
 await p.waitForSelector('.intro video');await p.waitForFunction(()=>document.querySelector('video')?.readyState>=2,{timeout:30000});
 assert((await p.$eval('video',v=>v.currentTime))<10,'replay failed to reset');
 await p.$eval('video',v=>v.currentTime=v.duration-.2);await p.waitForFunction(()=>document.body.dataset.screen==='start',{timeout:20000});
 if(!publicRun && !mobile && !blocked){
   await p.click('[data-a=settings]');
   await p.evaluate(()=>{__audio.music('title',{fade:30});__audio.music('eva',{fade:30});__audio.music('title',{fade:30});});
   await new Promise(r=>setTimeout(r,800));
   await p.waitForFunction(()=>__audio.M.title?.state()==='loaded'&&__audio.M.title.playing(),{timeout:30000});
   assert.equal(await p.evaluate(()=>__audio.M.title._sounds.filter(s=>__audio.M.title.playing(s._id)).length),1,'duplicate/racing title');
   await p.evaluate(()=>{window.__v1=__audio.voice('countdown');window.__v2=__audio.voice('smallstep');__audio.engine(1);__audio.rumble(1);__radio._fx();});
   await p.waitForFunction(()=>__audio.V.countdown?.state()==='loaded'&&__audio.V.smallstep?.state()==='loaded',{timeout:30000});
   await p.evaluate(()=>__v2.stop());assert.equal(await p.evaluate(()=>__audio.state().duck),.35);
   for(const k of ['music','sfx','voice'])await p.$eval(`[data-k=${k}]`,e=>{e.value='0';e.dispatchEvent(new Event('input'));});
   await new Promise(r=>setTimeout(r,1500));
   const mute=await p.evaluate(()=>({music:__audio.M.title.volume(__audio.state().curMusicId),voice:[...__audio.activeVoices.values()].map(v=>v.h.volume(v.id)),engine:__audio.state().engine,rumble:__audio.state().rumble,radio:__radio._fx().out.gain.value,ctx:__audio.Howler.ctx.state}));
   assert.equal(mute.music,0);assert(mute.voice.length>0&&mute.voice.every(v=>v===0),JSON.stringify(mute));assert(mute.engine<.001);assert(mute.rumble<.01);assert(mute.radio<.001);assert.equal(mute.ctx,'running');
   await p.evaluate(()=>{__v1.stop();__audio.stopEngine();__audio.stopRumble();});
   assert.equal(await p.evaluate(()=>__audio.activeVoices.size),0);
   console.log('PASS audio: gesture unlock, rapid music switch, no duplicate title, overlapping-voice duck, live music/voice/engine/rumble/radio mute (not live mic)');
 }
 assert.equal(errors.length,0,errors.join('\n'));console.log('PASS intro playback/sound/seek/skip/replay/ended',lang,w,h,{blocked,meta});
 await p.close();
}
}finally{await b.close();}
