// Local-only co-op transport contract. No WebRTC flags, microphone, tunnel or hosting.
import WebSocket from 'ws';
import assert from 'node:assert/strict';
const connect = async () => {
  const ws = new WebSocket('ws://localhost:8787/ws'), inbox = [];
  ws.on('message', raw => inbox.push(JSON.parse(raw)));
  await new Promise((r, j) => { ws.once('open', r); ws.once('error', j); });
  return { ws, send: m => ws.send(JSON.stringify(m)), wait: pred => new Promise((r, j) => {
    const t0 = Date.now(), timer = setInterval(() => { const i = inbox.findIndex(pred); if (i >= 0) { clearInterval(timer); r(inbox.splice(i, 1)[0]); } else if (Date.now() - t0 > 5000) { clearInterval(timer); j(Error('relay response timeout')); } }, 10);
  }) };
};
const A = await connect(), B = await connect(); let C;
try {
  A.send({ t: 'create', id: 'qa-pilot', name: 'Alex', role: 'pilot' });
  const { code, role } = await A.wait(m => m.t === 'joined'); assert.equal(role, 'pilot');
  B.send({ t: 'join', id: 'qa-capcom', code, name: 'QA CAPCOM' });
  const joined = await B.wait(m => m.t === 'joined'); assert.equal(joined.role, 'capcom');
  assert.equal((await B.wait(m => m.t === 'roster' && m.members.length === 2)).members.length, 2);
  A.send({ t: 'phase', ph: 'eva' }); assert.equal((await B.wait(m => m.t === 'phase')).ph, 'eva');
  A.send({ t: 'req', ph: 'eva', k: 'photo', id: 'photo-qa' }); assert.equal((await B.wait(m => m.t === 'req')).k, 'photo');
  B.send({ t: 'ev', k: 'resp', id: 'photo-qa', v: { zoom: 1.5 } }); assert.equal((await A.wait(m => m.t === 'ev')).v.zoom, 1.5);
  B.ws.close(); assert.equal((await A.wait(m => m.t === 'peer' && m.ev === 'away')).id, 'qa-capcom');
  C = await connect(); C.send({ t: 'join', id: 'qa-capcom', code, name: 'QA CAPCOM' });
  assert.equal((await C.wait(m => m.t === 'joined')).rejoin, true); await A.wait(m => m.t === 'peer' && m.ev === 'back');
  A.send({ t: 'debrief', results: { eva: { score: 90 } } }); assert.equal((await C.wait(m => m.t === 'debrief')).results.eva.score, 90);
  console.log('PASS local co-op relay: room/roles, phase, photo request/response, disconnect/rejoin, debrief');
} finally { A.send({ t: 'leave' }); C?.send({ t: 'leave' }); A.ws.close(); B.ws.close(); C?.ws.close(); }
