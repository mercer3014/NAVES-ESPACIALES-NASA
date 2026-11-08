// Application-level two-client refresh/reconnect, not just transport relay.
import puppeteer from 'puppeteer-core';import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://localhost:8789',bs=[];
const mk=async(w,h,mobile)=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',protocolTimeout:90000,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});bs.push(b);const p=await b.newPage();await p.setViewport({width:w,height:h,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:.5});await p.evaluateOnNewDocument(()=>localStorage.setItem('plb.v1',JSON.stringify({introSeen:true,quality:'low',tts:false,lang:'en',name:'QA'})));return p;};
const errors=[];
try{const A=await mk(800,600,false),B=await mk(390,844,true);for(const p of[A,B])p.on('pageerror',e=>errors.push(e.message));
await A.goto(base+'/?debug&nointro&from=eva&ts=6');await A.waitForSelector('[data-a=create]');await A.click('[data-a=create]');await A.waitForFunction(()=>/^\d{4}$/.test(document.querySelector('.bigcode')?.textContent||''));const code=await A.$eval('.bigcode',e=>e.textContent);
await B.goto(base+'/?debug&room='+code);await B.waitForSelector('.bigcode',{timeout:60000});
await A.click('[data-r=capcom]');await B.waitForFunction(()=>__net.net.role==='pilot');await A.click('[data-r=pilot]');await B.waitForFunction(()=>__net.net.role==='capcom');
const before=await B.evaluate(()=>({id:__net.net.id,code:__net.net.code,role:__net.net.role}));await A.click('[data-a=start]');await B.waitForFunction(()=>document.body.dataset.screen==='capcom'&&__capcom.phase==='eva',{timeout:60000});
await B.reload({waitUntil:'domcontentloaded'});await B.waitForFunction(()=>document.body.dataset.screen==='capcom'&&__capcom.phase==='eva',{timeout:60000});
assert.deepEqual(await B.evaluate(()=>({id:__net.net.id,code:__net.net.code,role:__net.net.role})),before);
await B.evaluate(()=>__net.net.ws.close());await B.waitForFunction(()=>__net.net.connected&&__net.net.ws.readyState===1,{timeout:15000});await new Promise(r=>setTimeout(r,800));assert.equal(await B.evaluate(()=>__net.net.role),'capcom');
await B.screenshot({path:'../screenshots/80_CAPCOM_rejoined_EN_portrait.png'});assert.equal(errors.length,0,errors.join('\n'));console.log('PASS actual browser lobby role swap, CAPCOM full-page refresh auto-rejoin and in-place socket reconnect with same room/id/role/phase; zero runtime errors');
await A.evaluate(()=>__net.tx({t:'leave'}));await B.evaluate(()=>__net.tx({t:'leave'}));
}finally{await Promise.all(bs.map(b=>b.close()));}
