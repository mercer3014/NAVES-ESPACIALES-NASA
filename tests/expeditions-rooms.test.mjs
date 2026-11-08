// Relay/cache authority fixtures only. The separate expedition browser harness is end-to-end.
import WebSocket from 'ws';import assert from 'node:assert/strict';
const sockets=[];
async function client(){const ws=new WebSocket((process.env.QA_URL||'http://127.0.0.1:8787').replace('http','ws')+'/ws'),inbox=[];sockets.push(ws);ws.on('message',b=>inbox.push(JSON.parse(b)));await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});return{ws,inbox,send:m=>ws.send(JSON.stringify(m)),wait:fn=>new Promise((r,j)=>{const start=Date.now(),tm=setInterval(()=>{const i=inbox.findIndex(fn);if(i>=0){clearInterval(tm);r(inbox.splice(i,1)[0]);}else if(Date.now()-start>5000){clearInterval(tm);j(Error('bounded relay wait'));}},5);})};}
try{for(const mission of['mars','horizon']){
 const a=await client(),b=await client(),idA='qa-aux-host-'+mission,idB='qa-aux-pilot-'+mission;
 a.send({t:'create',id:idA,role:'capcom',mission,name:'Host'});const first=await a.wait(m=>m.t==='joined');assert.equal(first.mission,mission);
 b.send({t:'join',id:idB,code:first.code});assert.equal((await b.wait(m=>m.t==='joined')).role,'pilot');await a.wait(m=>m.t==='roster'&&m.members.length===2);await b.wait(m=>m.t==='roster'&&m.members.length===2);
 b.send({t:'selection',mission:'apollo'});b.send({t:'ping',ts:1});await b.wait(m=>m.t==='pong'&&m.ts===1);a.send({t:'start',mission:'apollo',seed:31});assert.equal((await b.wait(m=>m.t==='start')).mission,mission);
 const state={mission,stage:mission==='mars'?'grow':'escape',t:99,sol:2,water:6,captured:true};b.send({t:'phase',ph:mission});b.send({t:'snap',ph:mission,d:state});assert.deepEqual((await a.wait(m=>m.t==='snap')).d,state);
 a.send({t:'snap',ph:mission,d:{...state,t:999}});a.send({t:'ping',ts:2});await a.wait(m=>m.t==='pong'&&m.ts===2);assert.equal(b.inbox.some(m=>m.t==='snap'),false);
 b.ws.close();await a.wait(m=>m.t==='peer'&&m.ev==='away');const b2=await client();b2.send({t:'join',id:idB,code:first.code});const rejoin=await b2.wait(m=>m.t==='joined');assert.equal(rejoin.role,'pilot');assert.deepEqual(rejoin.session.resume.aux,state);
 a.ws.close();await b2.wait(m=>m.t==='peer'&&m.ev==='away');const a2=await client();a2.send({t:'join',id:idA,code:first.code});const host=await a2.wait(m=>m.t==='joined');assert.equal(host.role,'capcom');assert.equal(host.host,true);assert.equal(host.mission,mission);a2.send({t:'sync'});assert.deepEqual((await a2.wait(m=>m.t==='snap')).d,state);
 a2.send({t:'ev',mission,k:'exp-control',key:'authorize',value:true});assert.equal((await b2.wait(m=>m.t==='ev')).from,idA);
 const done={...state,stage:'done',score:88};b2.send({t:'snap',ph:mission,d:done});b2.send({t:'debrief',mission,state:done});assert.equal((await a2.wait(m=>m.t==='debrief')).state.score,88);
 b2.send({t:'restart',ph:mission,mission});b2.send({t:'phase',ph:mission});b2.send({t:'snap',ph:mission,d:{...state,t:0}});await a2.wait(m=>m.t==='snap'&&m.d.t===0);a2.send({t:'sync'});const fresh=await a2.wait(m=>m.t==='snap'&&m.d.t===0);assert.equal(fresh.d.mission,mission);
 a2.send({t:'leave'});b2.send({t:'leave'});console.log('PASS',mission,'host-CAPCOM authority, selection/start guard, pilot-only snapshots, both-role checkpoint rejoin, sync, controls, debrief/retry');
}}finally{for(const s of sockets)s.close();}
