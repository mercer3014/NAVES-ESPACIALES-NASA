// Cliente de sala: crear/unirse, roster, relay de mensajes, reconexión automática con el mismo id
import { emit, DEBUG } from '../core/store.js';
const id = sessionStorage.getItem('plb.pid') || Math.random().toString(36).slice(2, 10);
sessionStorage.setItem('plb.pid', id);
export const net = { id, ws: null, code: null, role: null, host: false, members: [], connected: false, solo: true, mission:'apollo', rtt: 0 };
let wantOpen = false, retry = 0, pending = null, pingT = null;
function url() { return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`; }
function open() {
  return new Promise((res, rej) => {
    const ws = new WebSocket(url()); net.ws = ws; let opened = false;
    const to = setTimeout(() => { if (!opened) { ws.close(); rej(new Error('timeout')); } }, 5000);
    ws.onopen = () => { opened = true; clearTimeout(to); net.connected = true; retry = 0; res(ws);
      clearInterval(pingT); pingT = setInterval(() => tx({ t: 'ping', ts: performance.now() }), 3000); };
    ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } onMsg(m); };
    ws.onclose = () => { net.connected = false; clearInterval(pingT); if (!opened) return rej(new Error('closed'));
      if (wantOpen && net.code) { emit('net:lost'); setTimeout(reconnect, Math.min(4000, 500 * 2 ** retry++)); } };
    ws.onerror = () => {};
  });
}
async function reconnect() {
  if (!wantOpen) return;
  try { await open(); tx({ t: 'join', code: net.code, id, name: profile.name, flag: profile.flag }); emit('net:back'); }
  catch { setTimeout(reconnect, Math.min(4000, 500 * 2 ** retry++)); }
}
function onMsg(m) {
  switch (m.t) {
    case 'joined': if (m.rejoin && document.body.dataset.screen === 'capcom') setTimeout(() => tx({ t: 'sync' }), 0); net.mission=m.mission || 'apollo'; net.code = m.code; {const u=new URL(location.href);u.searchParams.set('room',m.code);history.replaceState(null,'',u);} net.role = m.role; net.host = m.host; net.solo = false; pending?.res(m); pending = null; emit('net:joined', m); break;
    case 'error': pending?.rej(new Error(m.msg)); pending = null; emit('net:error', m.msg); break;
    case 'roster': net.mission=m.mission || 'apollo'; net.members = m.members; emit('net:roster', m.members); break;
    case 'role': net.role = m.role; emit('net:role', m.role); break;
    case 'peer': emit('net:peer', m); break;
    case 'pong': net.rtt = performance.now() - m.ts; break;
    default: emit('net:' + m.t, m);
  }
}
const profile = { name: '', flag: null };
export function tx(m) { if (net.ws && net.ws.readyState === 1) net.ws.send(JSON.stringify(m)); }
export async function createRoom(role, p) {
  Object.assign(profile, p); wantOpen = true; await open();
  return new Promise((res, rej) => { pending = { res, rej }; tx({ t: 'create', role, id, ...profile }); setTimeout(() => pending && rej(new Error('timeout')), 5000); });
}
export async function joinRoom(code, p) {
  Object.assign(profile, p); wantOpen = true; if (!net.ws || net.ws.readyState !== 1) await open();
  return new Promise((res, rej) => { pending = { res, rej }; tx({ t: 'join', code: String(code), id, ...profile }); setTimeout(() => pending && rej(new Error('timeout')), 5000); });
}
export function leaveRoom() { const u=new URL(location.href);u.searchParams.delete('room');history.replaceState(null,'',u); wantOpen = false; tx({ t: 'leave' }); try { net.ws?.close(); } catch {} Object.assign(net, { ws: null, code: null, role: null, host: false, members: [], solo: true, mission:'apollo' }); emit('net:left'); }
export const partner = () => net.members.find((m) => m.id !== id);
export const peerOnline = () => !net.solo && !!partner()?.online;
if (DEBUG) window.__net = { net, tx };
