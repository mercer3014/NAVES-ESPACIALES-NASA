// Targeted responsive reachability: actual pointer clicks, not forced element.click().
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const [lang='es', w='844', h='390', mobile='1'] = process.argv.slice(2);
const b=await puppeteer.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:'new',protocolTimeout:120000,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage(), errors=[];
p.on('pageerror',e=>errors.push(e.message));
const tag=`${lang}_${w}x${h}`;
const click=async sel=>{ await p.waitForSelector(sel,{visible:true,timeout:60000}); await p.$eval(sel,e=>e.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
  const ok=await p.$eval(sel,e=>{const r=e.getBoundingClientRect(), hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&(e===hit||e.contains(hit));});
  assert(ok,`unreachable control: ${sel}`); mobile==='1'?await p.tap(sel):await p.click(sel);
};
try {
  await p.setViewport({width:+w,height:+h,isMobile:mobile==='1',hasTouch:mobile==='1',deviceScaleFactor:1});
  await p.evaluateOnNewDocument(lang=>localStorage.setItem('plb.v1',JSON.stringify({introSeen:true,lang,name:'Alex',quality:'low'})),lang);
  await p.goto('http://localhost:8787/?debug&nointro',{waitUntil:'domcontentloaded'});
  await p.waitForSelector('[data-a=solo]',{visible:true}); await new Promise(r=>setTimeout(r,2400));
  await click('[data-a=credits]'); await p.waitForFunction(()=>document.body.dataset.screen==='credits');
  await p.screenshot({path:`../screenshots/${process.env.QA_PREFIX || "70"}_ui_credits_${tag}.png`});
  await click('.back'); await p.waitForSelector('[data-a=solo]'); await new Promise(r=>setTimeout(r,2000));
  await p.screenshot({path:`../screenshots/${process.env.QA_PREFIX || "70"}_ui_menu_${tag}.png`});
  await click('[data-a=solo]'); await p.waitForFunction(()=>document.body.dataset.screen==='briefing'); await new Promise(r=>setTimeout(r,1600));
  await p.$eval('[data-a=go]',e=>e.scrollIntoView({block:'end',behavior:'instant'}));
  await p.screenshot({path:`../screenshots/${process.env.QA_PREFIX || "70"}_ui_briefing_${tag}.png`});
  const overlap=await p.evaluate(()=>{const g=document.querySelector('[data-a=go]').getBoundingClientRect(),b=document.querySelector('.pancho').getBoundingClientRect();return Math.min(g.right,b.right)>Math.max(g.left,b.left)&&Math.min(g.bottom,b.bottom)>Math.max(g.top,b.top);});
  assert(!overlap,'greeting covers start control');
  await click('[data-a=go]'); await p.waitForFunction(()=>document.body.dataset.screen==='phase-prep',{timeout:60000});
  await p.waitForSelector('[data-sw=batA]');
  await click('[data-sw=batA]'); await click('[data-sw=batB]');
  await p.waitForSelector('.hud > .banner',{visible:true,timeout:15000});
  const hidden = await p.$eval('.pancho',e=>getComputedStyle(e).visibility==='hidden'); assert(hidden,'duplicate prep message should be hidden');
  await p.screenshot({path:`../screenshots/${process.env.QA_PREFIX || "70"}_ui_prep_alarm_${tag}.png`});
  assert.equal(errors.length,0,errors.join('\n')); console.log('PASS responsive menu/credits/briefing/start pointers:',tag);
} finally {await b.close();}
