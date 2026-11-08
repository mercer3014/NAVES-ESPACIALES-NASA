// Same contract can run against loopback or the actual temporary HTTPS endpoint.
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import http from 'node:http';
import {randomUUID} from 'node:crypto';
const base=(process.env.BASE_URL||'http://localhost:8787').replace(/\/$/,'');
const wsbase=base.replace(/^http/,'ws');
for(const [p,type,magic] of [
 ['/video/intro_480.mp4','video/mp4','mp4'],['/video/intro_720.mp4','video/mp4','mp4'],['/video/intro_720.webm','video/webm','webm'],
 ['/models/astronaut-a7l.glb','model/gltf-binary','glb'],['/models/easep-props.glb','model/gltf-binary','glb'],
 ['/audio/music/title.mp3','audio/mpeg','mp3'],['/audio/sfx/click.mp3','audio/mpeg','mp3'],['/audio/voice/a11_countdown_liftoff.mp3','audio/mpeg','mp3']]) {
 const r=await fetch(base+p,{headers:{Range:'bytes=0-31'}});assert.equal(r.status,206,p);assert(r.headers.get('content-type').startsWith(type),p);assert.equal(r.headers.get('x-content-type-options'),'nosniff');
 const d=Buffer.from(await r.arrayBuffer());assert.equal(d.length,32);if(magic==='glb')assert.equal(d.toString('utf8',0,4),'glTF');if(magic==='mp4')assert.equal(d.toString('utf8',4,8),'ftyp');if(magic==='webm')assert.equal(d.toString('hex',0,4),'1a45dfa3');if(magic==='mp3')assert(d.toString('utf8',0,3)==='ID3'||d[0]===255);
 console.log('PASS public bytes/MIME/range',p);
}
const html=await fetch(base);assert.equal(html.status,200);assert((await html.text()).includes('Planta la bandera'));assert(html.headers.get('content-security-policy')?.includes("frame-ancestors 'none'"));
const head=await fetch(base+'/video/intro_480.mp4',{method:'HEAD'});assert.equal(head.status,200);assert(+head.headers.get('content-length')>1e6);assert.equal((await head.arrayBuffer()).byteLength,0);
assert.equal((await fetch(base+'/video/intro_480.mp4',{headers:{Range:'bytes=999999999-'}})).status,416);
assert.equal((await fetch(base+'/video/intro_480.mp4',{headers:{Range:'bytes=5-1'}})).status,416);
assert.equal((await fetch(base+'/video/intro_480.mp4',{headers:{Range:'bytes=-32'}})).status,206);
for(const p of ['/src/main.js','/.git/config','/.env','/server/index.js','/package.json','/private-path/forbidden','/assets/fake.js.map','/models/..%2f..%2fserver%2findex.js'])assert.equal((await fetch(base+p)).status,404,p);
assert.equal((await fetch(base+'/%ZZ')).status,400);assert((await fetch(base+'/licenses.txt')).ok);
const qr=await fetch(base+'/qr?code=1234');assert.equal(qr.status,200);if(base.startsWith('https:'))assert.equal(qr.headers.get('x-join-url'),base+'/?room=1234');assert((await qr.text()).includes('<svg'));
if(base.startsWith('http://localhost')) { const proxy=await new Promise((resolve,reject)=>{http.get(base+'/qr?code=1234',{headers:{Host:'preview.example.test','x-forwarded-proto':'https'}},r=>{r.resume();resolve(r.headers);}).on('error',reject);}); assert.equal(proxy['x-join-url'],'https://preview.example.test/?room=1234'); console.log('PASS reverse-proxy HTTPS/Host QR fixture (not public verification)'); }
const rtc=await(await fetch(base+'/rtc.json')).json();assert(!JSON.stringify(rtc).includes('credential'));
const connect=async(id)=>{const ws=new WebSocket(wsbase+'/ws',{origin:base}),inbox=[];ws.on('message',r=>inbox.push(JSON.parse(r)));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return{ws,id,send:m=>ws.send(JSON.stringify(m)),wait:pred=>new Promise((r,j)=>{const t0=Date.now(),t=setInterval(()=>{const i=inbox.findIndex(pred);if(i>=0){clearInterval(t);r(inbox.splice(i,1)[0]);}else if(Date.now()-t0>12000){clearInterval(t);j(Error('response timeout'));}},20);})};};
const A=await connect('qa-'+randomUUID()),B=await connect('qa-'+randomUUID());let C;
try{
 A.send({t:'create',id:A.id,role:'pilot',name:'QA'});const {code}=await A.wait(m=>m.t==='joined');
 B.send({t:'join',id:B.id,code,name:'QA CAPCOM'});assert.equal((await B.wait(m=>m.t==='joined')).role,'capcom');
 B.send({t:'swap'});B.send({t:'ping',ts:123});await B.wait(m=>m.t==='pong');
 A.send({t:'swap'});assert.equal((await B.wait(m=>m.t==='role')).role,'pilot');
 A.send({t:'swap'});assert.equal((await B.wait(m=>m.t==='role')).role,'capcom');
 A.send({t:'start',seed:80,from:'prep'});await B.wait(m=>m.t==='start');
 A.send({t:'phase',ph:'eva',results:{prep:{score:94}}});await B.wait(m=>m.t==='phase');
 A.send({t:'snap',ph:'eva',d:{sample:true,flag:true,mode:'task'}});await B.wait(m=>m.t==='snap');
 A.send({t:'req',ph:'eva',id:'1-eva',k:'photo'});await B.wait(m=>m.t==='req');
 B.ws.close();await A.wait(m=>m.t==='peer'&&m.ev==='away');
 C=await connect(B.id);C.send({t:'join',id:B.id,code});const j=await C.wait(m=>m.t==='joined');assert(j.rejoin);assert.equal(j.role,'capcom');assert.equal(j.session.resume.phase,'eva');assert.equal(j.session.resume.results.prep.score,94);
 C.send({t:'sync'});assert.equal((await C.wait(m=>m.t==='phase')).ph,'eva');assert.equal((await C.wait(m=>m.t==='snap')).d.flag,true);assert.equal((await C.wait(m=>m.t==='req')).k,'photo');
 C.send({t:'ev',k:'resp',id:'1-eva',v:{zoom:1.5}});assert.equal((await A.wait(m=>m.t==='ev')).v.zoom,1.5);
 A.send({t:'reqdone',id:'1-eva'});await C.wait(m=>m.t==='reqdone');A.send({t:'debrief',results:{eva:{score:90}}});assert.equal((await C.wait(m=>m.t==='debrief')).results.eva.score,90);
 console.log('PASS',base,'WebSocket create/pair/host-only roles/start, CAPCOM rejoin phase/results/snapshot/pending photo, response/debrief; QR external origin, static isolation, security headers, invalid ranges');
}finally{A.send({t:'leave'});C?.send({t:'leave'});A.ws.close();B.ws.close();C?.ws.close();}
